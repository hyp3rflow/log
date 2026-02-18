---
title: "React Native New Architecture — JS 런타임부터 네이티브 렌더링까지"
date: 2026/02/18
description: "React Native의 내부 구성요소와 New Architecture의 동작 원리를 소스코드 레벨에서 분석"
tag: ReactNative, JSI, Fabric, TurboModules, Hermes
author: flow
---

# React Native New Architecture — JS 런타임부터 네이티브 렌더링까지

## 1. 서론

React Native의 핵심 아이디어는 단순하다: **JavaScript로 네이티브 UI를 제어한다.** 개발자는 React 컴포넌트를 작성하고, 프레임워크가 그것을 iOS의 `UIView`나 Android의 `android.view.View`로 변환한다.

하지만 이 "변환"이 어떻게 일어나는지가 문제다. 2015년 출시부터 2022년까지 React Native는 **Bridge**라 불리는 비동기 JSON 메시지 전달 방식에 의존했다. JS와 네이티브가 서로 다른 세계에 살면서, JSON으로 직렬화된 편지를 주고받는 구조였다.

이 방식의 한계는 명확했다:

- **모든 통신이 비동기**: 동기 호출이 불가능해 UI 응답성이 떨어짐
- **JSON 직렬화 오버헤드**: 매 호출마다 serialize/deserialize 비용 발생
- **모든 네이티브 모듈이 시작 시 로드**: 사용하지 않는 모듈도 앱 시작 시 초기화
- **타입 안정성 부재**: JS-네이티브 인터페이스에 타입 검증이 없음

2022년부터 React Native는 이 모든 것을 뜯어고치는 **New Architecture**를 도입했다. JSI, Fabric, TurboModules — 이 세 가지가 핵심이다.

이 글에서는 [React Native 소스코드](https://github.com/facebook/react-native/tree/51dc568d2016) (commit `51dc568`)를 직접 들여다보면서, 전체 아키텍처를 분해한다.

## 2. 전체 아키텍처 개요

### 스레드 모델

React Native는 3개의 주요 스레드를 사용한다:

- **JS Thread**: JavaScript 코드 실행 (Hermes 엔진)
- **UI Thread (Main Thread)**: 네이티브 뷰 조작, 사용자 이벤트 처리
- **Background Thread**: 레이아웃 계산 (Yoga), Shadow Tree diff 등

### 구성요소 다이어그램

```
┌─────────────────────┐     ┌──────────┐     ┌──────────────────────────────┐     ┌────────────────────┐
│ JS Runtime (Hermes) │ ←→  │   JSI    │ ←→  │ C++ Core (Fabric/TurboModules)│ ←→  │ Native (iOS/Android)│
└─────────────────────┘     └──────────┘     └──────────────────────────────┘     └────────────────────┘
```

### Old vs New 한눈에 비교

| 구분 | Old Architecture | New Architecture |
|------|------------------|------------------|
| JS ↔ Native 통신 | Bridge (JSON 직렬화) | JSI (C++ 직접 호출) |
| 렌더링 | UIManager (비동기) | Fabric (동기/비동기) |
| 네이티브 모듈 | NativeModules (전부 로드) | TurboModules (레이지 로딩) |
| 타입 안정성 | 없음 | CodeGen으로 보장 |
| 통신 방식 | 비동기 only | 동기 + 비동기 |

## 3. Old Architecture: Bridge

### Bridge 패턴

Bridge의 본질은 **MessageQueue**다. JS에서 네이티브 함수를 호출하면, 그 호출이 JSON으로 직렬화되어 큐에 쌓이고, 네이티브 측에서 이를 디코딩해 실행한다.

JS 측의 구현을 보자:

```javascript
// packages/react-native/Libraries/BatchedBridge/BatchedBridge.js
const MessageQueue: MessageQueueT = require('./MessageQueue').default;
const BatchedBridge: MessageQueue = new MessageQueue();

// Wire up the batched bridge on the global object
Object.defineProperty(global, '__fbBatchedBridge', {
  configurable: true,
  value: BatchedBridge,
});
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/Libraries/BatchedBridge/BatchedBridge.js)

`MessageQueue` 클래스의 내부를 보면 Bridge의 구조가 드러난다:

```javascript
// packages/react-native/Libraries/BatchedBridge/MessageQueue.js
class MessageQueue {
  _lazyCallableModules: {[key: string]: (void) => {...}, ...};
  _queue: [number[], number[], unknown[], number];
  _successCallbacks: Map<number, ?(...unknown[]) => void>;
  _failureCallbacks: Map<number, ?(...unknown[]) => void>;
  _callID: number;
  _lastFlush: number;
  _eventLoopStartTime: number;
  // ...
}
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/Libraries/BatchedBridge/MessageQueue.js)

`_queue`의 구조가 핵심이다: `[moduleIDs[], methodIDs[], params[], callID]`. 여러 호출을 배치로 모아서 한 번에 네이티브로 전달한다. 이것이 "Batched" Bridge라 불리는 이유다.

C++ 측에서는 `NativeToJsBridge`가 이 메시지를 처리한다:

```cpp
// packages/react-native/ReactCommon/cxxreact/NativeToJsBridge.h
// deprecated 마킹이 눈에 띈다 — Old Architecture의 종말을 예고한다
class [[deprecated("This API will be removed along with the legacy architecture.")]]
NativeToJsBridge {
 public:
  NativeToJsBridge(
      JSExecutorFactory *jsExecutorFactory,
      std::shared_ptr<ModuleRegistry> registry,
      std::shared_ptr<MessageQueueThread> jsQueue,
      std::shared_ptr<InstanceCallback> callback);

  void callFunction(std::string &&module, std::string &&method,
                    folly::dynamic &&arguments);
  void invokeCallback(double callbackId, folly::dynamic &&arguments);
  // ...
};
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/cxxreact/NativeToJsBridge.h)

`callFunction`의 시그니처를 주목하라: `folly::dynamic &&arguments`. `folly::dynamic`은 Facebook의 동적 타입 컨테이너로, JSON 직렬화/역직렬화를 거친 데이터다. 모든 호출이 이 변환을 거쳐야 했다.

이 파일은 `#ifndef RCT_REMOVE_LEGACY_ARCH` 가드로 감싸져 있다. New Architecture가 완전히 자리잡으면 삭제될 코드다.

### Bridge의 문제점

1. **JSON 직렬화 오버헤드**: 큰 데이터(이미지 메타데이터, 긴 리스트 등)를 매번 직렬화
2. **비동기 only**: 동기 호출이 불가능해 `TextInput`의 즉시 반응 같은 UX 구현이 어려움
3. **배치 지연**: 호출이 즉시 실행되지 않고 큐에 쌓여 5ms 간격으로 flush
4. **전체 모듈 로딩**: 앱 시작 시 모든 네이티브 모듈 초기화

iOS 측의 `RCTBridge.h`에서도 Old/New Architecture의 공존을 볼 수 있다:

```objc
// packages/react-native/React/Base/RCTBridge.h
BOOL RCTTurboModuleEnabled(void);
void RCTEnableTurboModule(BOOL enabled);

BOOL RCTTurboModuleInteropEnabled(void);
void RCTEnableTurboModuleInterop(BOOL enabled);

BOOL RCTFabricInteropLayerEnabled(void);
void RCTEnableFabricInteropLayer(BOOL enabled);
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/React/Base/RCTBridge.h)

Interop 플래그들이 보인다. 기존 Bridge 기반 모듈을 New Architecture에서도 사용할 수 있게 해주는 호환성 레이어다.

## 4. JS Runtime & Hermes

### Hermes 엔진

Hermes는 Meta가 React Native를 위해 직접 만든 JavaScript 엔진이다. V8이나 JavaScriptCore와 달리, **바이트코드 프리컴파일**을 지원한다. 앱 빌드 시점에 JS를 바이트코드로 변환해두면, 런타임에 파싱과 컴파일을 건너뛸 수 있다.

```cpp
// packages/react-native/ReactCommon/react/runtime/hermes/HermesInstance.h
class HermesInstance {
 public:
  static std::unique_ptr<JSRuntime> createJSRuntime(
      std::shared_ptr<::hermes::vm::CrashManager> crashManager,
      std::shared_ptr<MessageQueueThread> msgQueueThread,
      bool allocInOldGenBeforeTTI) noexcept;
};
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/react/runtime/hermes/HermesInstance.h)

`allocInOldGenBeforeTTI` 파라미터가 흥미롭다. "Time To Interactive" 전에 오래 살 객체를 Old Generation에 바로 할당해서 GC 압력을 줄이는 최적화 옵션이다.

Hermes는 `HermesExecutorFactory`를 통해 React Native에 통합된다:

```cpp
// packages/react-native/ReactCommon/hermes/executor/HermesExecutorFactory.h
// Hermes를 JSI Runtime으로 생성하는 팩토리
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/hermes/executor/HermesExecutorFactory.h)

### JSI (JavaScript Interface)

JSI가 New Architecture의 **기반**이다. Bridge를 대체하는 C++ 레이어로, JS 런타임에 대한 추상 인터페이스를 정의한다. Hermes든 V8이든 JavaScriptCore든, JSI를 구현하기만 하면 React Native와 통합할 수 있다.

핵심 파일은 `jsi.h`다:

```cpp
// packages/react-native/ReactCommon/jsi/jsi/jsi.h

/// Represents a JS runtime. Movable, but not copyable. Note that
/// this object may not be thread-aware, but cannot be used safely from
/// multiple threads at once.
class JSI_EXPORT Runtime : public ICast {
 public:
  virtual ~Runtime();

  /// Evaluates the given JavaScript buffer.
  virtual Value evaluateJavaScript(
      const std::shared_ptr<const Buffer>& buffer,
      const std::string& sourceURL) = 0;

  /// Prepares JavaScript for optimized execution (pre-parsing, compiling, etc.)
  virtual std::shared_ptr<const PreparedJavaScript> prepareJavaScript(
      const std::shared_ptr<const Buffer>& buffer,
      std::string sourceURL) = 0;

  /// Evaluates a PreparedJavaScript.
  virtual Value evaluatePreparedJavaScript(
      const std::shared_ptr<const PreparedJavaScript>& js) = 0;

  /// Returns the global object
  virtual Object global() = 0;

  // ...
};
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/jsi/jsi/jsi.h)

`Runtime`은 순수 가상 클래스다. `evaluateJavaScript`, `global()` 등의 메서드를 통해 JS 엔진과 상호작용한다. Hermes는 이 인터페이스를 구현한 구체 클래스를 제공한다.

### HostFunction — JS에서 C++를 직접 호출

Bridge 시절에는 불가능했던 것이 JSI로 가능해졌다. **JS에서 C++ 함수를 동기적으로 직접 호출**할 수 있다:

```cpp
// packages/react-native/ReactCommon/jsi/jsi/jsi.h

/// A function which can be registered as callable from JavaScript
/// using Function::createFromHostFunction().
using HostFunctionType = std::function<
    Value(Runtime& rt, const Value& thisVal, const Value* args, size_t count)>;
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/jsi/jsi/jsi.h)

`HostFunctionType`은 C++ 함수를 JS에 노출하는 타입이다. `Runtime&`을 직접 받으므로, JSON 직렬화 없이 JS 값에 바로 접근한다. `Value`, `Object`, `Function` 같은 JSI 타입을 통해 JS 객체를 C++에서 직접 조작할 수 있다.

### HostObject — C++ 객체를 JS에 노출

```cpp
// packages/react-native/ReactCommon/jsi/jsi/jsi.h

/// An object which implements this interface can be registered as an
/// Object with the JS runtime.
class JSI_EXPORT HostObject {
 public:
  virtual ~HostObject();

  // When JS wants a property with a given name from the HostObject
  virtual Value get(Runtime&, const PropNameID& name);

  // When JS wants to set a property on the HostObject
  virtual void set(Runtime&, const PropNameID& name, const Value& value);

  // When JS wants a list of property names for the HostObject
  virtual std::vector<PropNameID> getPropertyNames(Runtime& rt);
};
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/jsi/jsi/jsi.h)

`HostObject`는 Proxy 패턴이다. JS에서 `obj.someProperty`를 읽으면 C++의 `get()` 메서드가 호출된다. 이것이 TurboModules의 기반이 된다 — TurboModule은 `HostObject`를 상속받는다.

Bridge vs JSI의 차이를 코드로 비교하면:

```
// Old: Bridge
JS: NativeModules.Camera.takePicture({quality: 0.8})
  → JSON.stringify({module: "Camera", method: "takePicture", args: [{quality: 0.8}]})
  → 큐에 쌓임 → 5ms 후 flush → 네이티브에서 JSON.parse → 실행 → 결과를 다시 JSON으로...

// New: JSI
JS: global.__turboModuleProxy("Camera").takePicture({quality: 0.8})
  → C++ HostFunction 직접 호출 → TurboModule::invoke() → 결과 즉시 반환
```

## 5. New Architecture: Fabric (새 렌더링 시스템)

Fabric은 React Native의 새 렌더링 엔진이다. Bridge 기반 UIManager를 대체하며, C++로 작성된 Shadow Tree를 중심으로 동작한다.

### 렌더링 파이프라인

Fabric의 렌더링은 다음 단계를 거친다:

1. **React에서 트리 생성**: React Reconciler가 새 엘리먼트 트리를 생성
2. **C++ Shadow Tree 구축**: JSI를 통해 C++의 `ShadowNode` 트리로 변환
3. **레이아웃 계산**: Yoga 엔진이 flexbox 레이아웃을 네이티브 좌표로 계산
4. **Diff**: 이전 트리와 새 트리를 비교해 최소 변경 목록 생성
5. **Mount**: 네이티브 뷰에 변경 적용

### ShadowNode — 트리의 노드

```cpp
// packages/react-native/ReactCommon/react/renderer/core/ShadowNode.h

class ShadowNode : public Sealable,
                   public DebugStringConvertible,
                   public jsi::NativeState {
 public:
  using SharedListOfShared =
      std::shared_ptr<const std::vector<std::shared_ptr<const ShadowNode>>>;

  static bool sameFamily(const ShadowNode &first, const ShadowNode &second);

  ShadowNode(const ShadowNodeFragment &fragment,
             ShadowNodeFamily::Shared family,
             ShadowNodeTraits traits);
  // ...
};
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/react/renderer/core/ShadowNode.h)

주목할 점:

- `ShadowNode`은 `jsi::NativeState`를 상속한다. 이는 JS 객체에 네이티브 상태를 직접 부착할 수 있게 해준다 (JSI의 `setNativeState` API).
- `sameFamily()`는 두 노드가 같은 "가족"인지 (서로 클론된 관계인지) 판단한다. diff 알고리즘에서 노드 동일성을 판별할 때 사용된다.
- `ShadowNodeFragment`로부터 생성되며, 불변(immutable) 객체다. 업데이트 시에는 새 노드를 클론한다.

### ComponentDescriptor — 컴포넌트 팩토리

```cpp
// packages/react-native/ReactCommon/react/renderer/core/ComponentDescriptor.h

/// Abstract class defining an interface of ComponentDescriptor.
/// ComponentDescriptor represents particular ShadowNode type and
/// defines basic operations with particular kind of ShadowNodes
/// (creating, cloning, props and children managing).
class ComponentDescriptor {
 public:
  virtual ComponentHandle getComponentHandle() const = 0;
  virtual ComponentName getComponentName() const = 0;
  virtual ShadowNodeTraits getTraits() const = 0;

  virtual std::shared_ptr<ShadowNode> createShadowNode(
      const ShadowNodeFragment &fragment, /* ... */) = 0;
  // ...
};
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/react/renderer/core/ComponentDescriptor.h)

`ComponentDescriptor`는 각 네이티브 컴포넌트 타입(View, Text, Image 등)에 대한 팩토리다. `ShadowNode`를 생성하고, Props를 파싱하고, 클론을 만드는 역할을 한다.

### ShadowTree — 트리 관리 및 커밋

```cpp
// packages/react-native/ReactCommon/react/renderer/mounting/ShadowTree.h

using ShadowTreeCommitTransaction =
    std::function<RootShadowNode::Unshared(
        const RootShadowNode &oldRootShadowNode)>;

enum class ShadowTreeCommitStatus {
  Succeeded, Failed, Cancelled,
};

struct ShadowTreeCommitOptions {
  // Shadow Node state from current revision will be applied to the new revision
  bool enableStateReconciliation{false};

  // Mounting will be triggered synchronously; React won't interrupt painting
  bool mountSynchronously{true};

  ShadowTreeCommitSource source{ShadowTreeCommitSource::Unknown};
};

class ShadowTree final {
 public:
  ShadowTree(
      SurfaceId surfaceId,
      const LayoutConstraints &layoutConstraints,
      const LayoutContext &layoutContext,
      const ShadowTreeDelegate &delegate,
      const ContextContainer &contextContainer);
  // ...
};
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/react/renderer/mounting/ShadowTree.h)

`ShadowTreeCommitTransaction`은 함수형 트랜잭션이다. 이전 루트 노드를 받아 새 루트 노드를 반환한다. 이 패턴은 불변 데이터 구조의 업데이트를 안전하게 만든다.

`mountSynchronously` 옵션이 중요하다. React에서 오는 커밋은 `false`로 설정해 React가 layout effect를 실행하고 업데이트를 적용할 기회를 준다. 네이티브 측 상태 업데이트는 `true`로 설정해 즉시 마운트한다. 이것이 **Concurrent Mode** 지원의 핵심이다.

### Differentiator — 트리 비교

```cpp
// packages/react-native/ReactCommon/react/renderer/mounting/Differentiator.h

/// Calculates a list of view mutations which describes how the old
/// ShadowTree can be transformed to the new one.
ShadowViewMutation::List calculateShadowViewMutations(
    const ShadowNode &oldRootShadowNode,
    const ShadowNode &newRootShadowNode);
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/react/renderer/mounting/Differentiator.h)

인터페이스는 놀라울 정도로 단순하다. 이전 루트와 새 루트를 받아 `ShadowViewMutation` 리스트를 반환한다. 이 뮤테이션들은 `Create`, `Delete`, `Insert`, `Remove`, `Update` 같은 원자적 연산이다.

### MountingCoordinator — 마운트 조율

```cpp
// packages/react-native/ReactCommon/react/renderer/mounting/MountingCoordinator.h

/// Stores inside all non-mounted yet revisions of a shadow tree and
/// coordinates mounting.
class MountingCoordinator final {
 public:
  MountingCoordinator(const ShadowTreeRevision &baseRevision);

  /// Computes a consequent mounting transaction and returns it.
  /// The returning transaction can accumulate multiple recent revisions.
  std::optional<MountingTransaction> pullTransaction(
      bool willPerformAsynchronously = false) const;

  /// Indicates if there are transactions waiting to be consumed.
  bool hasPendingTransactions() const;

  /// Blocks until a new mounting transaction is available.
  bool waitForTransaction(std::chrono::duration<double> timeout) const;
  // ...
};
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/react/renderer/mounting/MountingCoordinator.h)

`MountingCoordinator`는 여러 리비전을 누적해서 하나의 마운트 트랜잭션으로 합칠 수 있다. 빠르게 연속된 업데이트가 있을 때 중간 상태를 건너뛰고 최종 상태만 마운트하는 최적화다.

`willPerformAsynchronously` 파라미터는 Android의 현실을 반영한다. 주석에도 나와 있듯이 Android는 아직 JS 스레드에서 `pullTransaction`을 호출하고 UI 스레드에서 비동기 적용하는 모델을 쓴다.

### ShadowTreeRegistry — 여러 Surface 관리

```cpp
// packages/react-native/ReactCommon/react/renderer/mounting/ShadowTreeRegistry.h

/// Owning registry of ShadowTrees.
class ShadowTreeRegistry final {
 public:
  void add(std::unique_ptr<ShadowTree> &&shadowTree) const;
  std::unique_ptr<ShadowTree> remove(SurfaceId surfaceId) const;
  bool visit(SurfaceId surfaceId,
             const std::function<void(const ShadowTree &)> &callback) const;
  void enumerate(const std::function<void(const ShadowTree &, bool &stop)> &callback) const;
};
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/react/renderer/mounting/ShadowTreeRegistry.h)

하나의 앱에 여러 React Native Surface가 있을 수 있다 (모달, 다른 화면 등). `ShadowTreeRegistry`가 `SurfaceId`별로 독립적인 `ShadowTree`를 관리한다. `shared_mutex`로 스레드 안전성을 보장한다.

### Fabric 렌더러 디렉토리 구조

```
react/renderer/
├── core/               # ShadowNode, ComponentDescriptor, Props, State
├── mounting/           # ShadowTree, Differentiator, MountingCoordinator
├── components/         # View, Text, Image 등 구체 컴포넌트
├── animations/         # LayoutAnimation 지원
├── scheduler/          # 렌더링 스케줄러
├── uimanager/          # UIManager 바인딩 (JS와의 접점)
├── css/                # CSS 파싱
├── graphics/           # Color, Point, Rect 등 그래픽 프리미티브
├── dom/                # DOM-like API
└── runtimescheduler/   # JS 런타임 태스크 스케줄링
```

## 6. New Architecture: TurboModules

TurboModules는 네이티브 모듈의 완전한 재설계다. Bridge 기반 NativeModules를 대체하며, JSI 위에서 동작한다.

### TurboModule 기반 클래스

```cpp
// packages/react-native/ReactCommon/react/nativemodule/core/ReactCommon/TurboModule.h

/// Base HostObject class for every module to be exposed to JS
class JSI_EXPORT TurboModule : public jsi::HostObject {
 public:
  TurboModule(std::string name, std::shared_ptr<CallInvoker> jsInvoker);

  // Automatic caching of properties on the TurboModule's JS representation
  jsi::Value get(jsi::Runtime &runtime, const jsi::PropNameID &propName) override {
    auto prop = create(runtime, propName);
    if (jsRepresentation_ && !prop.isUndefined()) {
      jsRepresentation_->lock(runtime).asObject(runtime)
          .setProperty(runtime, propName, prop);
    }
    return prop;
  }

 protected:
  const std::string name_;
  std::shared_ptr<CallInvoker> jsInvoker_;

  struct MethodMetadata {
    size_t argCount;
    jsi::Value (*invoker)(jsi::Runtime &rt, TurboModule &turboModule,
                          const jsi::Value *args, size_t count);
  };
  std::unordered_map<std::string, MethodMetadata> methodMap_;
  // ...
};
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/react/nativemodule/core/ReactCommon/TurboModule.h)

핵심 포인트:

1. **`jsi::HostObject` 상속**: TurboModule은 JSI의 HostObject다. JS에서 프로퍼티에 접근하면 C++의 `get()` 메서드가 호출된다.

2. **자동 캐싱**: `get()`에서 반환된 값을 `jsRepresentation_`에 캐싱한다. 같은 메서드를 두 번 호출하면 두 번째부터는 캐시에서 바로 가져온다.

3. **`methodMap_`**: 메서드 이름 → 메타데이터 맵. `MethodMetadata`에는 인자 개수와 실제 호출할 C++ 함수 포인터가 들어있다.

4. **`CallInvoker`**: JS 스레드로 콜백을 디스패치할 때 사용한다.

`create()` 메서드가 실제 메서드 바인딩을 담당한다:

```cpp
// TurboModule.h — create() 메서드
virtual jsi::Value create(jsi::Runtime &runtime, const jsi::PropNameID &propName) {
  std::string propNameUtf8 = propName.utf8(runtime);
  if (auto methodIter = methodMap_.find(propNameUtf8);
      methodIter != methodMap_.end()) {
    const MethodMetadata &meta = methodIter->second;
    return jsi::Function::createFromHostFunction(
        runtime, propName,
        static_cast<unsigned int>(meta.argCount),
        [this, meta](jsi::Runtime &rt, const jsi::Value &thisVal,
                     const jsi::Value *args, size_t count) {
          return meta.invoker(rt, *this, args, count);
        });
  }
  // ...
  return jsi::Value::undefined();
}
```

`jsi::Function::createFromHostFunction`으로 C++ 람다를 JS 함수로 만든다. JSON 직렬화는 어디에도 없다. `jsi::Value*`로 JS 인자를 직접 받고, `jsi::Value`를 직접 반환한다.

### TurboModuleBinding — JS에 등록

```cpp
// packages/react-native/ReactCommon/react/nativemodule/core/ReactCommon/TurboModuleBinding.h

/// Represents the JavaScript binding for the TurboModule system.
class TurboModuleBinding final {
 public:
  static void install(
      jsi::Runtime &runtime,
      TurboModuleProviderFunctionTypeWithRuntime &&moduleProvider,
      TurboModuleProviderFunctionTypeWithRuntime &&legacyModuleProvider = nullptr,
      std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection = nullptr);

 private:
  /// A lookup function exposed to JS to get an instance of a TurboModule
  jsi::Value getModule(jsi::Runtime &runtime, const std::string &moduleName) const;

  TurboModuleProviderFunctionTypeWithRuntime moduleProvider_;
  // ...
};
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/react/nativemodule/core/ReactCommon/TurboModuleBinding.h)

`install()`이 JS 런타임에 `__turboModuleProxy`를 등록한다. JS에서 `require('NativeModule')`을 호출하면 내부적으로 `__turboModuleProxy("ModuleName")`이 실행되고, `getModule()`에서 해당 TurboModule의 HostObject를 반환한다.

`legacyModuleProvider` 파라미터는 Old Architecture 모듈과의 호환성을 위한 것이다. TurboModule로 찾지 못한 모듈을 레거시 방식으로 폴백한다.

### 레이지 로딩

Old Architecture에서는 앱 시작 시 모든 네이티브 모듈을 초기화했다. Camera 모듈, Bluetooth 모듈, 결제 모듈... 사용하지 않더라도 전부.

TurboModules는 **JS에서 처음 접근할 때** 초기화한다:

```
// Old: 앱 시작 시
for (module in ALL_NATIVE_MODULES) {
  module.initialize();  // 카메라, 블루투스, 결제... 전부
}

// New: 접근 시
const Camera = require('NativeCamera');  // 이 시점에 초기화
// → __turboModuleProxy("Camera")
// → TurboModuleBinding::getModule("Camera")
// → moduleProvider_("Camera") — 여기서 처음 생성
```

### CallInvoker — 스레드 간 호출

```cpp
// packages/react-native/ReactCommon/callinvoker/ReactCommon/CallInvoker.h

class CallInvoker {
 public:
  virtual void invokeAsync(CallFunc &&func) noexcept = 0;
  virtual void invokeAsync(SchedulerPriority priority, CallFunc &&func) noexcept;
  virtual void invokeSync(CallFunc &&func) = 0;
  virtual ~CallInvoker() = default;
};
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/callinvoker/ReactCommon/CallInvoker.h)

`CallInvoker`는 스레드 간 함수 호출을 추상화한다:

- `invokeAsync`: 비동기로 JS 스레드에서 함수 실행
- `invokeSync`: 동기로 JS 스레드에서 함수 실행
- `SchedulerPriority`: 우선순위 기반 스케줄링 지원

`invokeSync`의 존재가 New Architecture의 핵심 개선점이다. Bridge에서는 불가능했던 동기 호출이 가능해졌다.

### NativeMethodCallInvoker

```cpp
// CallInvoker.h
class NativeMethodCallInvoker {
 public:
  virtual void invokeAsync(const std::string &methodName,
                           NativeMethodCallFunc &&func) noexcept = 0;
  virtual void invokeSync(const std::string &methodName,
                          NativeMethodCallFunc &&func) = 0;
};
```

이것은 반대 방향이다. JS에서 네이티브 메서드를 호출할 때 사용한다. `methodName`을 받는 것은 디버깅과 프로파일링을 위해서다.

### RuntimeExecutor

```cpp
// packages/react-native/ReactCommon/runtimeexecutor/ReactCommon/RuntimeExecutor.h

/// Takes a function and calls it with a reference to a Runtime.
/// The function will be called when it is safe to do so
/// (i.e. it ensures non-concurrent access).
using RuntimeExecutor =
    std::function<void(std::function<void(jsi::Runtime &runtime)> &&callback)>;
```

[GitHub](https://github.com/facebook/react-native/blob/51dc568d2016/packages/react-native/ReactCommon/runtimeexecutor/ReactCommon/RuntimeExecutor.h)

`RuntimeExecutor`는 JS 런타임에 안전하게 접근하는 방법이다. `jsi::Runtime&`을 직접 들고 있는 대신 이 함수를 통해 접근하면, 동시 접근 문제를 방지할 수 있다. Fabric과 TurboModules 모두 이것을 통해 JS 런타임과 통신한다.

## 7. Codegen

Codegen은 JavaScript/TypeScript 타입 정의에서 C++ 바인딩을 자동 생성하는 도구다. 이것이 New Architecture의 타입 안정성을 보장한다.

### 소스 구조

```
packages/react-native-codegen/src/generators/
├── components/                    # Fabric 컴포넌트용
│   ├── GenerateComponentDescriptorH.js   # ComponentDescriptor 헤더
│   ├── GeneratePropsH.js                 # Props 구조체 헤더
│   ├── GeneratePropsCpp.js               # Props 구현
│   ├── GenerateShadowNodeH.js            # ShadowNode 헤더
│   ├── GenerateShadowNodeCpp.js          # ShadowNode 구현
│   ├── GenerateEventEmitterH.js          # 이벤트 에미터 헤더
│   ├── GenerateEventEmitterCpp.js        # 이벤트 에미터 구현
│   ├── GenerateStateH.js                 # State 헤더
│   └── GenerateStateCpp.js               # State 구현
└── modules/                       # TurboModules용
    ├── GenerateModuleH.js                # C++ 모듈 헤더
    ├── GenerateModuleJavaSpec.js          # Android Java 스펙
    ├── GenerateModuleJniCpp.js            # JNI 바인딩 C++
    ├── GenerateModuleJniH.js              # JNI 바인딩 헤더
    └── GenerateModuleObjCpp/              # iOS Obj-C++ 바인딩
```

### 작동 방식

1. 개발자가 JS/TS로 네이티브 모듈 스펙을 작성:

```typescript
// NativeCamera.ts
import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  takePicture(options: {quality: number}): Promise<string>;
  getAvailableCameras(): string[];  // 동기 호출!
}

export default TurboModuleRegistry.getEnforcing<Spec>('Camera');
```

2. Codegen이 이 스펙을 읽어서 C++ 헤더를 생성:

```cpp
// 자동 생성된 NativeCameraSpec.h (개념적 예시)
class JSI_EXPORT NativeCameraCxxSpec : public TurboModule {
 public:
  NativeCameraCxxSpec(std::shared_ptr<CallInvoker> jsInvoker);

  virtual jsi::Value takePicture(jsi::Runtime &rt, jsi::Object options) = 0;
  virtual jsi::Array getAvailableCameras(jsi::Runtime &rt) = 0;
};
```

3. 개발자는 이 추상 클래스를 상속받아 실제 구현을 작성한다.

이 과정에서 **타입 불일치가 컴파일 타임에 잡힌다**. JS 스펙에서 `number`라고 선언한 파라미터에 `string`을 넘기면 빌드가 실패한다. Bridge 시절에는 런타임에야 발견되던 (또는 조용히 무시되던) 버그가 빌드 시점에 잡히게 된 것이다.

### 컴포넌트 Codegen

Fabric 컴포넌트도 마찬가지다. JS에서 정의한 Props 타입에서 C++ `Props` 구조체, `ShadowNode`, `ComponentDescriptor`, `EventEmitter`가 자동 생성된다:

```
JS Props 정의 → Codegen → GeneratePropsH.js      → Props.h
                        → GenerateShadowNodeH.js  → ShadowNode.h
                        → GenerateEventEmitterH.js → EventEmitter.h
                        → GenerateComponentDescriptorH.js → ComponentDescriptor.h
```

## 8. C++ Core 구조 상세

`ReactCommon/` 디렉토리는 React Native의 심장부다. 플랫폼 독립적인 C++ 코드가 여기 있다.

```
ReactCommon/
├── jsi/                    # JavaScript Interface — 엔진 추상화 레이어
│   └── jsi/jsi.h          # Runtime, Value, Object, Function, HostObject 정의
│
├── hermes/                 # Hermes 엔진 통합
│   ├── executor/           # HermesExecutorFactory
│   └── inspector-modern/   # Chrome DevTools 프로토콜 지원
│
├── jsc/                    # JavaScriptCore 엔진 통합 (iOS 기본)
│
├── react/
│   ├── renderer/           # Fabric 렌더러
│   │   ├── core/           # ShadowNode, ComponentDescriptor, Props
│   │   ├── mounting/       # ShadowTree, Differentiator, MountingCoordinator
│   │   ├── components/     # 빌트인 컴포넌트 (View, Text, Image...)
│   │   ├── scheduler/      # 렌더링 스케줄러
│   │   ├── uimanager/      # JS 바인딩
│   │   └── runtimescheduler/ # 태스크 우선순위 스케줄링
│   │
│   ├── nativemodule/       # TurboModules
│   │   └── core/
│   │       ├── ReactCommon/ # TurboModule, TurboModuleBinding
│   │       └── platform/   # iOS/Android 플랫폼별 구현
│   │
│   └── runtime/            # ReactInstance, JS 런타임 생성
│       └── hermes/         # HermesInstance
│
├── cxxreact/               # [Legacy] Bridge 기반 코드
│   ├── NativeToJsBridge.h  # deprecated
│   ├── Instance.h
│   └── ModuleRegistry.h
│
├── callinvoker/            # 스레드 간 호출 추상화
│   └── ReactCommon/
│       └── CallInvoker.h   # CallInvoker, NativeMethodCallInvoker
│
├── runtimeexecutor/        # JS 런타임 안전 접근
│   └── ReactCommon/
│       └── RuntimeExecutor.h
│
├── jsiexecutor/            # JSI 기반 JS 실행기
│   └── jsireact/
│       ├── JSIExecutor.h
│       └── JSINativeModules.h
│
└── yoga/                   # Flexbox 레이아웃 엔진
```

### 핵심 모듈별 역할

**`jsi/`** — 모든 것의 기반. JS 엔진(Hermes, JSC, V8)에 대한 추상 인터페이스. 나머지 모든 모듈이 이 인터페이스를 통해 JS와 통신한다.

**`react/renderer/`** — Fabric 렌더러. JS의 React 트리를 네이티브 뷰로 변환하는 전체 파이프라인. `core/`에 데이터 모델, `mounting/`에 diff와 마운트 로직, `components/`에 구체 컴포넌트 구현.

**`react/nativemodule/`** — TurboModules. 네이티브 기능(카메라, 파일시스템, 네트워크 등)을 JS에 노출. `platform/ios/`와 `platform/android/`에 플랫폼별 브릿지가 있다.

**`callinvoker/`** — 스레드 안전성의 핵심. JS Thread ↔ Native Thread 간 함수 호출을 안전하게 디스패치.

**`runtimeexecutor/`** — `jsi::Runtime&`에 대한 안전한 접근 패턴. 런타임의 단일 스레드 제약을 프레임워크 레벨에서 강제.

**`cxxreact/`** — Legacy 코드. `#ifndef RCT_REMOVE_LEGACY_ARCH` 가드 뒤에 숨어 있으며, New Architecture 마이그레이션이 완료되면 삭제될 예정.

## 9. Old vs New 비교 정리

| 항목 | Old Architecture | New Architecture |
|------|------------------|------------------|
| **JS ↔ Native 통신** | Bridge (JSON 직렬화) | JSI (C++ 직접 호출) |
| **통신 방식** | 비동기 only | 동기 + 비동기 |
| **데이터 전달** | `folly::dynamic` (JSON) | `jsi::Value` (zero-copy) |
| **렌더링 시스템** | UIManager | Fabric |
| **Shadow Tree** | Java/ObjC | C++ (공유) |
| **네이티브 모듈** | NativeModules | TurboModules |
| **모듈 로딩** | 앱 시작 시 전부 | 레이지 (사용 시) |
| **타입 안정성** | 런타임 체크 | Codegen 컴파일타임 체크 |
| **Concurrent Mode** | 미지원 | 지원 (Priority 기반) |
| **핵심 코드** | `cxxreact/` | `react/renderer/`, `react/nativemodule/` |
| **JS 엔진** | JSC/Hermes | Hermes (기본) |

### 성능 개선 포인트

1. **JSON 직렬화 제거**: 가장 큰 개선. 특히 대량의 리스트 데이터나 이미지 메타데이터를 다룰 때 체감 차이가 크다.

2. **동기 호출**: `TextInput`의 `onChange` 같은 이벤트에서 즉시 네이티브 값을 읽을 수 있다. Bridge에서는 비동기라 한 프레임 지연이 있었다.

3. **메모리 공유**: JSI를 통해 JS와 C++가 같은 메모리를 참조할 수 있다. `ArrayBuffer`를 복사 없이 네이티브에 전달하는 것이 가능해졌다.

4. **레이지 로딩**: 사용하지 않는 모듈을 로드하지 않으므로 앱 시작 시간이 단축된다.

5. **C++ Shadow Tree 공유**: iOS와 Android가 동일한 C++ 코드로 레이아웃을 계산한다. 플랫폼 간 렌더링 일관성이 높아졌고, 버그 수정이 한 번에 양쪽에 적용된다.

## 10. 결론

### New Architecture가 가져온 근본적 변화

New Architecture는 단순한 성능 개선이 아니다. React Native의 **근본 구조**를 바꿨다:

- **Bridge → JSI**: 메시지 전달에서 직접 호출로. 두 세계의 장벽이 사라졌다.
- **비동기 only → 동기+비동기**: 개발자가 상황에 맞는 통신 패턴을 선택할 수 있게 됐다.
- **JavaScript ↔ C++ ↔ Native** 3계층 구조가 명확해졌고, C++ 코어를 iOS/Android가 공유한다.
- **Codegen**으로 JS와 네이티브 사이의 계약이 컴파일 타임에 검증된다.

### 아직 남은 과제

- **마이그레이션**: 수많은 서드파티 라이브러리가 아직 Old Architecture 기반이다. Interop 레이어(`RCTTurboModuleInteropEnabled`, `RCTFabricInteropLayerEnabled`)가 이 과도기를 지탱하고 있다.
- **Android 비동기 마운팅**: `MountingCoordinator`의 `willPerformAsynchronously` 파라미터가 보여주듯, Android는 아직 완전한 동기 마운팅으로 전환하지 못했다.
- **복잡성**: C++ 코어가 강력하지만, 디버깅이 어렵다. JS → JSI → C++ → Platform Native까지 4단계를 넘나드는 스택 트레이스는 만만치 않다.

### 개발자에게 미치는 영향

일반적인 앱 개발자에게 New Architecture는 대부분 투명하다. `react-native upgrade`와 라이브러리 업데이트로 점진적으로 전환된다. 하지만 **네이티브 모듈이나 커스텀 컴포넌트를 만드는 개발자**에게는 패러다임 전환이다:

- Flow/TypeScript 스펙 작성이 필수
- Codegen 파이프라인 이해 필요
- C++ 코드와의 상호작용 가능성

React Native는 "JS로 모바일 앱을 만드는 프레임워크"에서 "JS, C++, 네이티브가 긴밀하게 통합된 크로스 플랫폼 런타임"으로 진화하고 있다. 소스코드를 직접 들여다보면, 그 진화의 깊이를 실감할 수 있다.

---

*이 글에서 인용한 소스코드는 React Native commit [`51dc568`](https://github.com/facebook/react-native/tree/51dc568d20168d64ae94f4895e4032431fe2cd57) 기준입니다.*
