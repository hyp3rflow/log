---
title: wip) HTTP/2, HTTP/3, and QUIC
date: 2022/05/07
description: Korean, http-quic
tag: Network
author: You
---

# HTTP/2, HTTP/3 and QUIC

## HTTP/3 (HTTP over QUIC)
- QUIC는 UDP 위에서 동작하는 transfer protocol이다.
- UDP 자체는 unreliable 하지만, QUIC는 UDP 위에서 reliability를 가질 수 있도록 해준다.
  - 패킷 재전송 (re-transmissions of packets), 혼잡 제어(congestion control) 등을 제공한다.
- 한 물리적인 스트림 위에 여러 논리적 스트림들을 구성할 수 있다. 
- 스트림 내에서의 in-order delivery를 보장하지만, 스트림들 간에서의 순서는 보장하지 않는다.
  - 한 스트림에서 패킷을 잃어도 다른 스트림에 영향을 주지 않는다. (HTTP/2에서는 TCP 단에서의 congestion control 때문에 다른 스트림까지 영향을 받게 됨, [akamai post](https://community.akamai.com/customers/s/article/How-does-HTTP-2-solve-the-Head-of-Line-blocking-HOL-issue?language=en_US)
- 0-RTT(Round trip time), 1-RTT 만으로도 연결을 수립할 수 있다. (<-> 3-way handshake)
  - 0-RTT handshake는 이전에 연결한 적이 있고, 시크릿이 캐싱된 경우에만 가능하다.
  - 0-RTT handshake 시점에 데이터를 함께 실어보낼 수 있다. -> 따라서 더 빠른 응답이 가능하다.
    - [TCP Fast Open(TFO)](https://datatracker.ietf.org/doc/html/rfc7413)과 비슷하지만 호환성 측면에서 낫다.
- [TLS(transport layer security) 1.3](https://datatracker.ietf.org/doc/html/rfc8446)을 사용한다.