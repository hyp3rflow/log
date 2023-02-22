---
title: Swift Combine study note
date: 2022/05/04
description: Swift Combine study note
tag: Swift
author: You
---

> Multiplatform library 작업을 위해 Swift 공부용으로 작성된 글입니다.\

# Swift Combine note

## 객체간 교신
### Callback
JavaScript에서 callback을 이용해 비동기 작업을 수행한 것처럼, 인자로 closure를 넘겨주면 완료 시점에 실행되도록 구성할 수 있다.
```swift
func function(closure: () -> ()) {
  // working on smth
  closure()
}
```
nonescaping closure가 아닌 escaping closure를 통해서도 동일한 작업을 수행할 수 있다. function scope 밖으로 closure를 이동시킨 뒤 임의의 시점에 실행하여 완료되었음을 알린다고 생각하면 될 것 같다. 이걸 completion handler라고 하는 듯

```swift
var handlers: [() -> ()] = []

func function(closure: @escaping () -> ()) {
  handlers.append(closure)
}

function {
  // do what you want
}

handlers[0]() // execute appended closure
```

### Notification
`.addObserver` 같은 interface를 제공하는 방식으로 교신하는 것 같다. JavaScript의 `.addEventListener`스러운 친구. NotificationCenter API를 사용하면 된다.
```swift
// postMessage
NotificationCenter.default.post(name: NSNotification.Name("NotificationNameHere"), object: nil, userInfo: nil)

// addObserver
NotificationCenter.default.addObserver(self, selector: #selector(didRecieveTestNotification(_:)), name: NSNotification.Name("NotificationNameHere"), object: nil)

@objc func didRecieveTestNotification(_ notification: Notification) {
        print("Test Notification")
}
``` 

extension으로 name을 등록할 수도 있다.
```swift
extension Notification.Name {
  static let hello = Notification.Name("hello")
}
```

### Delegate
```swift
protocol DelegateProtocol {
  func getSomething() -> ()
}

class View {
  var delegate: DelegateProtocol?
  func getSomething() {
    if let delegate = delegate {
      delegate.getSomething()
    }
  }
}

class Controller: DelegateProtocol {
  var view: View?

  func getSomething() -> () {
    // do something and return it
  }

  init() {
    view = View()
    if let view = view {
      view.delegate = self
      view.getSomething()
    }
  }
}
```

## Receiving and Handling Events with Combine
Combine framework를 사용하면 위의 delegate callback이나 completion handler closure를 사용하지 않고 더 우아하게 이벤트들을 다룰 수 있다.
예로 AppKit에서는 TextField의 모든 keystroke가 Notification을 만들고, 이걸 Combine을 통해서 구독하는 방식으로 처리가 가능하다.

### Connect a Publisher to a Subscriber
```swift
let pub = NotificationCenter.default
    .publisher(for: NSControl.textDidChangeNotification, object: filterField)
```
위의 코드는 filterField에서 NSControl.textDidChangeNotification이 발생할 때마다 NotificationCenter에 이벤트를 발행한다.
```swift
let sub = NotificationCenter.default
    .publisher(for: NSControl.textDidChangeNotification, object: filterField)
    .sink(receiveCompletion: { print ($0) },
          receiveValue: { print ($0) })
```
Combine에는 두 개의 빌트인 subscriber를 갖고 있다.
- `sink(receiveCompletion:receiveValue:)`: `receiveCompletion` 클로저는 `Subscribers.Completion`을 받았을 때, 즉 publisher가 정상적으로 완료했거나 에러로 인해 실패한 경우에 실행된다.
위와 같이 Publisher에 value를 받았을 때나 완료되었을 때 특정 동작을 수행하도록 할 수 있다.
- `assign(to: on:)`: to는 `KeyPath`를 받는다. 예를 들어, `.assign(to: \.a, on: here)`의 경우, 값을 받아서 `here.a`에 할당해준다.

### Change the Output Type with Operators
Publisher에서 이벤트가 생겼을 때 받게되는 값의 타입은 [NotificationCenter.Publisher.Output](https://developer.apple.com/documentation/foundation/notificationcenter/publisher/output)이다. 이 Notification의 object property에 접근해야 하는데, 만약 object 안의 더 깊숙한 값에 접근하고 싶다면 publisher 단에서 값을 바꿀 수 있다면 좋을 것이다.
이 경우에는 `map(_:)`, `flatMap(maxPublishers:_:)`, `reduce(_:_:)`를 사용할 수 있다.
```swift
let sub = NotificationCenter.default
    .publisher(for: NSControl.textDidChangeNotification, object: filterField)
    .map( { ($0.object as! NSTextField).stringValue } )
    .sink(receiveCompletion: { print ($0) },
          receiveValue: { print ($0) })
```
`.map`을 이용해 Notification의 object로부터 filterField를 들고오고, 그것의 stringValue에 접근해서 sink 쪽에서 정돈된 값을 바로 받아 쓸 수 있도록 하고있다.\
물론 assign에도 이 방법을 사용할 수 있다.
```swift
let sub = NotificationCenter.default
    .publisher(for: NSControl.textDidChangeNotification, object: filterField)
    .map( { ($0.object as! NSTextField).stringValue } )
    .assign(to: \MyViewModel.filterString, on: myViewModel)
```

### Customize Publishers with Operators
Publisher 인스턴스를 다른 operator들을 이용해 확장하는 것도 가능하다. 이 이벤트 처리 체인을 손보기 위해 3개의 operator를 사용할 수 있다. 예시와 함께 보자.
- 예를 들어 TextField에 작성된 아무 문자열이나 바로 View model에 업데이트하고 싶지 않다면, `filter(_:)` operator를 통해서 특정 길이나 알파벳만 허용 등 조건들을 쉽게 구현할 수 있다.
- filtering operation은 expensive할 수 있기 때문에 debounce를 하고 싶을 수 있다. 이 경우에는 `debounce(for:scheduler:options:)`를 사용할 수 있겠다. [RunLoop](https://developer.apple.com/documentation/foundation/runloop) 클래스를 이용하면 초나 밀리초 단위의 시간 딜레이를 나타내기 쉽다고 한다.
- 만약 결과가 UI 업데이트를 일으키는 경우, `receive(on:options:)` 메서드를 통해서 main thread에 callback을 전달할 수 있다. 
```swift
let sub = NotificationCenter.default
    .publisher(for: NSControl.textDidChangeNotification, object: filterField)
    .map( { ($0.object as! NSTextField).stringValue } )
    .filter( { $0.unicodeScalars.allSatisfy({CharacterSet.alphanumerics.contains($0)}) } )
    .debounce(for: .milliseconds(500), scheduler: RunLoop.main)
    .receive(on: RunLoop.main)
    .assign(to:\MyViewModel.filterString, on: myViewModel)
```
위의 코드는 앞서 말했던 방법들이 적용된 사례이다.

### Cancel Publishing when Desired
Subscriber가 더 이상 subscription을 하지 않도록 할 수도 있다. sink 혹은 assign으로 만들어진 subscriber의 경우 `cancel()` 메서드가 제공되는 Cancellable protocol을 conform하므로, `sub?.cancel()`로 취소할 수 있겠다.

커스텀 subscriber를 만들면 publisher는 Subscription object를 처음에 전달해주게 된다. 이 Subscription을 들고 이있다가 그만두고 싶은 경우 cancel을 호출하면 된다.

## Reference
- https://m.blog.naver.com/jdub7138/220937372865
- https://www.swiftbysundell.com/articles/observers-in-swift-part-1/
- https://developer.apple.com/documentation/combine/receiving-and-handling-events-with-combine