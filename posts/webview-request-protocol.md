---
title: WebView Request Protocol (WRP 🌯)
date: 2023/02/22
description: Introduction to WRP, and implementation detail
tag: WRP
author: You
status: wip
---

# WebView Request Protocol (WRP 🌯)

> There is a JSConf Korea recording about WRP. If you can't understand korean or
> are interested in WRP, watch this:\
> https://www.youtube.com/watch?v=FazNzl6Ei3A (English subtitles available)

2022년에 무엇을 했는지 저에게 묻는다면 WRP가 제일 먼저 생각날 것 같습니다. 이번
포스트에서는 저와 @disjukr 님이 만든 WRP에 대해서 간략히 소개하려고 합니다.
위아래에 적힌 것과 같이 여러 채널들을 통해서 WRP의 개발 배경과 간단한 동작을
설명한 적이 있지만, 자세히 적힌 글, 특히 구현 디테일에 관련된 글을 남겨둔다면
미래의 저 혹은 WRP를 사용/기여해주실 분들께 도움이 되지 않을까 하여 케케묵은
블로그 에디터를 열게 되었습니다.

## 소개

> GeekNews에 자세한 개발 배경이 적혀있기에 생략하도록 하겠습니다.\
> https://news.hada.io/topic?id=6761

WebView Request Protocol(WRP)은 Protocol Buffers를 이용해 웹뷰와 네이티브 앱
사이의 메세지를 타입-안전하게 선언하여 웹뷰 개발을 할 수 있도록 만들어진
레이어입니다. WRP는 다음과 같은 기능을 제공합니다.

- 네이티브 플랫폼에 대한 코드 생성 (Kotlin, Swift, TypeScript로 메세지와 서비스
  코드를 생성할 수 있습니다.)
- WRP Pritimives와 WebView Wrapper (웹뷰 래퍼는 직접 구현할 수도 있습니다 :))
- 양방향 통신 (단발성 / 스트리밍 모두)
- 양방향 버전 확인 (통신 전 서버가 구현하고 있는 메소드를 먼저 확인합니다)

## 네이티브 플랫폼에 대한 코드 생성

이미 구현된 pbkit의 `pb`를 통해서 Protobuf를 컴파일하고 TypeScript 코드를 생성할
수 있었기에, 이를 레버리지하여 gRPC가 아닌 WRP를 사용할 수 있는 서비스 코드를
생성하도록 만들었습니다.
[Swift codegen](https://github.com/pbkit/pbkit/tree/main/codegen/swift),
[Kotlin codegen](https://github.com/pbkit/pbkit/tree/main/codegen/kt)

Swift의 경우 SwiftProtobuf가 생성해주는 메시지/서비스 코드와 최대한 똑같은
결과물을 뱉도록 작성했고, WRP 생성 모드 하에서는 GRPCClient가 아닌 WrpClient
코드를 생성하게끔 구현했습니다.

Kotlin의 경우 protoc-kotlin이 생성해주는 메시지 코드를 사용해 WRP 서비스 코드를
생성할 수 있게끔 구현되어 있습니다.

## WRP Primitives

WRP는 앱 개발 워크플로우에서 제공하는 `evaluateJavaScript` 함수를 사용해 새로운
통신 레이어를 쌓아올립니다.

네트워크의 OSI-7 Layer를 쌓아올리는 것과 비슷하나, OSI-7 Layer를 알고 있을
필요는 없습니다.

> 아래에 나오는 요소들은 직접 이름 지은 것이기 때문에, 같은 이름의 실제 용어와는
> 무관합니다.

### 소켓

처음으로 알아볼, 제일 아래에 있는 요소는 소켓입니다.

소켓은 웹뷰와 네이티브 간에 서로 바이너리 데이터를 전달할 수 있도록 되어
있습니다. 이를 직접 구현하기 위해서는 네이티브가 웹뷰에 메세지 핸들러를
등록하고, 웹뷰에서 전역 객체에 등록된 핸들러를 호출해야하는데, 이것들을 구현하여
소켓이라는 추상화된 인터페이스를 만듭니다.

iOS에서 웹뷰 개발을 할 때로 예를 들면, `WKUserContentController`(웹뷰)에
`WKScriptMessageHandler`(메세지 핸들러)를 등록하고, 웹뷰는
`globalThis.webkit.messageHandlers`를 호출하여 앱 쪽으로 메세지를 전달합니다.
반대로는 앱 쪽에서 `evaluateJavaScript`를 실행하여 웹뷰의 전역에 등록된 함수를
호출할 수 있습니다.

소켓은 read와 write 함수를 가지며, TypeScript로 작성된 iOS 소켓은 아래와
같습니다.

```typescript
// wrp-ts의 iOS 소켓 코드 예제입니다.
// https://github.com/pbkit/wrp-ts/blob/674a2bdd4d9b9ac1c59bb7ba295274b6ec0d8bf0/src/glue/ios.ts
import { Socket } from "../socket.ts";
import { checkAndRetryUntilSuccess, u8s2str } from "./misc/util.ts";
import { getGlue } from "./index.ts";

// https://developer.apple.com/documentation/webkit/wkusercontentcontroller/1537172-add

export async function createIosSocket(): Promise<Socket> {
  const iosGlue = await getIosGlue();
  return {
    read: getGlue().read,
    async write(data) {
      return iosGlue.postMessage(u8s2str(data)).then(() => data.byteLength);
    },
  };
}

interface IosGlue {
  postMessage(data: string): Promise<void>;
}
async function getIosGlue(): Promise<IosGlue> {
  return await checkAndRetryUntilSuccess(
    () => (globalThis as any).webkit?.messageHandlers?.glue || undefined,
  );
}
```

iOS 쪽에서는 `glue`라는 이름의 메세지 핸들러를 제공하고, 웹뷰에서 이 핸들러를
사용하여 write를 구현합니다. read는 `Glue`라는 또 다른 객체를 사용합니다.

### 소켓을 구현하기 위한 Glue

Glue는 각 플랫폼에서 상대로부터의 데이터를 받기 위한 수단이라고 생각하면
이해하기 쉽습니다. 예를 들면, 앱에서 웹뷰로부터 데이터를 받기 위해 노출하는
메세지 핸들러도 Glue이고, 웹뷰가 앱으로부터 데이터를 받기 위해 전역에 등록할
어떤 객체도 Glue입니다. 위의 예제는 웹뷰가 iOS 앱으로부터 데이터를 받아오는
상황이기 때문에 전역에 웹뷰의 Glue를 노출해 데이터를 모으고 있다가 소켓에게
전달해주는 것입니다.

앱-웹뷰 간의 특성 상 데이터를 읽어오기 위해선 내가 등록한 Glue로부터 데이터를
받고, 데이터를 전달하기 위해선 상대가 등록한 Glue에 데이터를 적어야 합니다. 각
플랫폼에서 구현하는 방법이 다르기 때문에 (웹에서는 전역 객체에 등록, 앱에서는
메세지 핸들러 등록) 소켓 구현을 깔끔하게 할 수 있도록 Glue를 두고 있습니다.

아래는 TypeScript로 구현된 Glue 예제입니다. `getGlue를` 호출하면 `globalThis`에
Glue를 등록하고, Glue 자체는 `read`와 `recv` 인터페이스를 갖고 있습니다. 여기서
`recv`가 바로 상대가 호출할 (앱이 evaluateJavaScript를 통해 호출할)
인터페이스입니다. `recv`는 받은 데이터를 queue에 적재하고, `read` 했을 때 원하는
만큼의 데이터를 queue에서 꺼내 채워 보냅니다.

```typescript
// wrp-ts의 Glue 예제입니다.
// https://github.com/pbkit/wrp-ts/blob/674a2bdd4d9b9ac1c59bb7ba295274b6ec0d8bf0/src/glue/index.ts
import {
  defer,
  Deferred,
} from "https://deno.land/x/pbkit@v0.0.45/core/runtime/async/observer.ts";
import { Closer, Reader } from "../socket.ts";
import { chain } from "../misc.ts";
import { str2u8s } from "./misc/util.ts";

export interface Glue extends Closer, Reader {
  recv(data: Uint8Array | string): void;
}

const key = "<glue>";

export function getGlue(): Glue {
  const global = globalThis as any;
  if (global[key]) return global[key];
  return global[key] = createGlue();
}

export function createGlue(): Glue {
  const queue: Uint8Array[] = [];
  let closed = false;
  let wait: Deferred<void> | undefined;
  return {
    close() {
      closed = true;
      wait?.resolve();
    },
    recv: (data) => {
      if (closed) throw new Error("Glue has been closed.");
      queue.push(typeof data === "string" ? str2u8s(data) : data);
      wait?.resolve();
    },
    read: chain(async (data) => {
      if (queue.length < 1) {
        if (closed) return null;
        await (wait = defer());
        wait = undefined;
      }
      const first = queue[0];
      if (first.byteLength <= data.byteLength) {
        queue.shift();
        data.set(first);
        return first.byteLength;
      }
      data.set(first.subarray(0, data.byteLength));
      queue[0] = first.subarray(data.byteLength);
      return data.byteLength;
    }),
  };
}
```

아래처럼 iOS의 write 함수에서
`webView.evaluateJavaScript("void globalThis['<glue>'].recv(payload))`를 하는
것을 볼 수 있습니다. 이 함수를 통해서 위의 `getGlue`를 통해 웹뷰가 자신의 전역
객체에 등록한 Glue의 `recv`를 호출하는 것입니다.

```swift
// wrp-swift의 소켓 구현
// https://github.com/pbkit/wrp-swift/blob/bcb1751377d69bc98694ceef0823871d3ad524ba/Sources/Wrp/Core/Socket.swift
public class WrpSocket {
    // 생략
    @discardableResult
    public func read() -> AsyncStream<Data> {
        AsyncStream { continuation in
            guard status != .closed else {
                continuation.finish()
                return
            }
            Task.init {
                for await data in self.glue.read() {
                    continuation.yield(data)
                }
                continuation.finish()
            }
        }
    }

    public func write(_ data: Data) {
        DispatchQueue.main.async {
            Task.init {
                assert(Thread.isMainThread, "WKWebView.evaluateJavaScript(_:completionHandler:) must be used from main thread only")
                guard let webView = self.glue.webView else { return }
                let payload = data.encode()
                self.configuration.logger.debug("write(\(data.count), \(payload.count)): <glue>.recv(\(payload))")
                do {
                    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
                        DispatchQueue.main.async {
                            webView.evaluateJavaScript("void globalThis['<glue>'].recv(\(payload))") { _, error in
                                if let error = error {
                                    continuation.resume(throwing: error)
                                } else {
                                    continuation.resume()
                                }
                            }
                        }
                    }
                    self.configuration.logger.debug("write: Sent successfully")
                } catch {
                    self.configuration.logger.error("write: Error on evaluateJavascript \(error)")
                }
            }
        }
    }
}
```

플랫폼 종속적인 Glue와 그 구현을 이해했다면, 나머지는 특별한 것이 없습니다.
이렇게 만들어진 소켓을 이용해 최종적으로 Protobuf 메세지를 통신하도록 만들면
끝입니다.

### 채널

채널은 소켓을 이용하여 Protobuf 메세지 단위의 정보를 송수신 하는 객체입니다.

WRP는 프로토콜 수준에서 정의된 메세지도 Protobuf로 정의하고 있습니다. 여러분이
A라는 메세지를 보낸다면, P라는 프로토콜 메세지에 P(A)처럼 담겨 채널을 타게
됩니다.

아래의 Protobuf가 프토토콜 수준에서 정의된 메세지를 표현하고 있습니다. 각각
요청과 응답에 사용하는 WRP 메세지인데, 여러분이 보내는 메세지 A가 바로 위의
payload에 인코딩되어 전달됩니다. 이 프로토콜 레벨 메세지를 `WrpMessage`라고 이름
지었습니다.

```protobuf
// https://github.com/pbkit/wrp-ts/blob/674a2bdd4d9b9ac1c59bb7ba295274b6ec0d8bf0/src/wrp.proto
message WrpMessage {
  oneof message {
    WrpHostMessage_Initialize Host_Initialize = 1;
    WrpHostMessage_Error Host_Error = 2;
    WrpHostMessage_ResStart Host_ResStart = 3;
    WrpHostMessage_ResPayload Host_ResPayload = 4;
    WrpHostMessage_ResFinish Host_ResFinish = 5;
    WrpGuestMessage_ReqStart Guest_ReqStart = 6;
    WrpGuestMessage_ReqPayload Guest_ReqPayload = 7;
    WrpGuestMessage_ReqFinish Guest_ReqFinish = 8;
    WrpGuestMessage_ResFinish Guest_ResFinish = 9;
  }
}
// ...
message WrpHostMessage_ResPayload {
  string req_id = 1;
  bytes payload = 2;
}
// ...
message WrpGuestMessage_ReqPayload {
  string req_id = 1;
  bytes payload = 2;
}
// ...
```

지금 다루지 않을 메세지에 대해서는 일단 생략했습니다.

채널이 하는 역할은 socket의 read/write 인터페이스를 이용해 우리가 정의한
WrpMessage를 보내고 받는 더 추상화된 인터페이스를 제공하는 것입니다.
`listen`에서는 받은 Uint8Array를 decode(`decodeBinary`)하여 메세지로 만들어
반환(`yield`)하고, `send`에서는 바이너리로 encode(`encodeBinary`)하여 소켓으로
전달합니다.

```typescript
// wrp-ts의 채널 구현
// https://github.com/pbkit/wrp-ts/blob/674a2bdd4d9b9ac1c59bb7ba295274b6ec0d8bf0/src/channel.ts
import {
  BufReader,
  BufWriter,
} from "https://deno.land/std@0.137.0/io/buffer.ts";
import {
  decodeBinary,
  encodeBinary,
  Type as WrpMessage,
} from "./generated/messages/pbkit/wrp/WrpMessage.ts";
import { Socket } from "./socket.ts";
import { chain } from "./misc.ts";

export interface WrpChannel {
  listen(): AsyncGenerator<WrpMessage>;
  send(message: WrpMessage): Promise<void>;
}
export function createWrpChannel(socket: Socket): WrpChannel {
  return {
    async *listen() {
      const bufReader = new BufReader(socket);
      while (true) {
        let lengthU8s: Uint8Array | null = null;
        try {
          lengthU8s = await bufReader.readFull(new Uint8Array(4));
        } catch { /* error when socket closed */ }
        if (!lengthU8s) break;
        const length = new DataView(lengthU8s.buffer).getUint32(0, true);
        const payload = await bufReader.readFull(new Uint8Array(length));
        if (!payload) throw new UnexpectedEof();
        yield decodeBinary(payload);
      }
    },
    send: chain(async function send(message) {
      const payload = encodeBinary(message);
      const lengthU8s = new Uint8Array(4);
      new DataView(lengthU8s.buffer).setUint32(0, payload.length, true);
      const bufWriter = new BufWriter(socket);
      await bufWriter.write(lengthU8s);
      await bufWriter.write(payload);
      await bufWriter.flush();
    }),
  };
}
```

이제 Glue를 통해 소켓을 만들어 바이너리 데이터를 송수신하고, 소켓을 이용해
Protobuf 메세지(WrpMessage)를 송수신하는 채널을 만들었습니다. 이 채널을 이용하는
게스트와 호스트라는 마지막 요소들을 만들면 끝입니다!

### 게스트와 호스트

게스트와 호스트는 클라이언트와 서버의 관계를 생각하면 됩니다. gRPC 서버를 예로
들면 서버는 rpc를 노출하고, 클라이언트는 서버가 노출한 rpc를 호출합니다.
WRP에서도 이러한 방식을 사용하며, 호출 가능한 메소드를 노출하는 쪽이 호스트,
호스트가 노출한 메소드를 호출하는 쪽이 게스트입니다.

호스트는 게스트와의 연결이 수립된 경우 호스트가 제공하고 있는 메소드들을
보냅니다. 예를 들면 getMember, getCount 같은 이름의 메소드가 제공된다면, 처음에
`["getMember", "getCount"]` 같은 식으로 전달해주는 것입니다. 이를 통해 앱과
웹뷰의 버전이 다르더라도 메소드를 호출하기 전에 상대방이 이 최신 메소드를
제공하는 상태인지 확인할 수 있습니다.

앞서 보았던 WrpMessage Protobuf의 다양한 유형의 메세지는 이러한 과정에 해당하는
메세지들을 포함하고 있습니다.

- HostInitialize: 호스트가 연결 수립 시, 게스트가 요청할 수 있는 메소드들을
  보냅니다.
- HostError: 호스트가 에러를 마주한 경우 보냅니다.
- GuestReqStart: 게스트가 요청을 시작합니다. 요청을 식별할 수 있는 id와 원하는
  메소드를 지정합니다.
- GuestReqPayload: 게스트가 특정 id에 해당하는 요청의 내용(payload)을 보냅니다.
- GuestReqFinish: 게스트가 요청에 대한 모든 내용을 보냈습니다.
- HostResStart: 호스트가 응답을 시작합니다.
- HostResPayload: 호스트가 응답의 내용을 보냅니다.
- HostResFinish: 호스트가 응답에 대한 모든 내용을 보냈습니다.
- GuestResFinish: 게스트가 응답을 더 이상 원하지 않습니다.

HostInitialize가 앞서 말한 '호스트가 제공하는 메소드들은 요것입니다' 케이스에
해당되는 메세지입니다.

나머지는 게스트와 호스트의 관계를 통해서 추론할 수 있습니다. HostInitialize
메세지 이후 게스트는 요청을 시작합니다. 자신이 보낸 요청과 앞으로 올 응답의 짝을
맞추기 위해 게스트 자신이 관리하는 id를 지정하고, 호스트의 메소드를 호출합니다.
호스트는 응답을 보낼 때 게스트가 보냈던 id를 포함시켜, 게스트가 받았을 때 몇
번째로 보낸 요청인지 찾을 수 있도록 합니다.

요청/응답에 3가지(Start, Payload, Finish) 유형이 존재하는 이유는 WRP가
스트리밍을 지원하기 때문에 여러 Payload를 보낼 수 있어야 하기 때문입니다. 또한,
스트리밍을 이용해 ping <-> pong을 하는 경우를 생각하면 GuestReqFinish(게스트가
요청 다 보냄)이 오기 전에도 호스트가 응답을 시작할 수 있어야 합니다.

게스트와 호스트 구현은 코드 길이 상 다 옮길 수는 없지만, 채널로부터 들어온
메세지가 있는지 확인하는 큰 루프 위에서 구현됩니다. 호스트는 루프 시작 전 채널에
가능한 메소드들을 담은 메세지(HostInitialize)를 보내고, 루프에서 메세지 타입에
따라 등록한 메소드들을 호출하여 결과값들을 보내주기만 하면 됩니다. 게스트는
요청을 식별하기 위한 id 카운터를 관리하고, HostInitialize로부터 받은 메소드
목록을 들고 있다가 요청마다 메소드 목록을 비교하여 가능한 메소드인지 미리
확인합니다. 구현은 조금 더 복잡하지만, 큰 틀에서의 디테일은 이것이 전부입니다.

### 수명과 소켓 핸드셰이크 (handshake)

그런데, 호스트가 연결을 시작하자마자 HostInitialize를 보낸다고 가정했을 때
게스트가 연결되지 않았다면 HostInitialize를 받지 못할 가능성이 있습니다. 이런
경우를 대비하기 위해 소켓에서의 핸드셰이크를 진행합니다.

WRP는 아래와 같은 경우에 대한 지원이 가능해야 합니다.

- 앱(iOS-Android) > 웹뷰
- 웹(parent) > iframe

두 경우에서 공통으로 나타나는 수명과 관련된 특징이 있습니다. 바로 앱이 웹뷰보다
항상 오래 사는 것이 보장되고, 두번째 경우에서는 웹(parent)이 iframe보다 항상
오래 사는 것이 보장된다는 것입니다. iframe의 부모인 경우 앱 > 웹뷰와 마찬가지로
부모에서 iframe element에 대한 ref를 사용해야 하기 때문에, 공통적으로
웹(앱-웹뷰의 웹뷰, parent-iframe의 iframe)에서 소켓을 만들 때 부모의 소켓이
열려있는지 확인하는 과정을 거쳐야 합니다.

/// (WIP: 부모가 handshake timeout 계산)
