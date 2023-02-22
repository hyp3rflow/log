---
title: Backpressuring in Streams
date: 2022/05/07
description: backpressuring
tag: Streams, Node
author: You
---

# Backpressuring in Streams
Node.js 문서에 있는 [backpressure 관련 가이드](https://nodejs.org/en/docs/guides/backpressuring-in-streams/)를 발췌독한 내용이다.

## Too Much Data, Too Quickly
여기 하나는 ReadableStream, 하나는 WritableStream이 있다고 가정하자. ReadableStream에서 데이터를 읽은 후 WritableStream으로 내보내려고 한다. 만약 WritableStream이 처리할 수 없을 정도로 많은 양의, 또 빠른 속도로 데이터가 내려온다면 어떻게 될까? 데이터가 유실되는 것을 방지하기 위해 WritableStream 내부의 queue가 계속해서 쌓일 수 밖에 없을 것이다. 그럼 결국 시스템의 메모리를 와구와구 먹게 될 것이고.. 이런 상황은 피하는 것이 좋을 것이다. 이 때 backpressure가 등장하게 된다.

Node.js의 라이브러리에서는 [`.write()`의 반환 값](https://github.com/nodejs/node/blob/55c42bc6e5602e5a47fb774009cfe9289cb88e71/lib/_stream_writable.js#L239)에 따라서 backpressure의 동작 여부를 결정하게 된다. `true`가 넘어오는 경우 항상 backpressure가 실행되지 않는데, 이렇게 backpressure를 하지 않게 끔 바이너리를 수정한 다음 아래의 예시를 진행해보도록 하겠다.

## Excess Drag on Garbage Collection
앞서 진행한 예제(본문에서는 9GB 파일에 대한 gzip을 수행한다.)를 똑같이 진행해서 이번에는 벤치마크 결과를 보자.
예제에 대한 수행 시간이다.
```
   trial (#)  | `node` binary (ms) | modified `node` binary (ms)
=================================================================
      1       |      56924         |           55011
      2       |      52686         |           55869
      3       |      59479         |           54043
      4       |      54473         |           55229
      5       |      52933         |           59723
=================================================================
average time: |      55299         |           55975
```
수행 시간 면에서는 큰 차이가 나지 않는다. 이번에는 `dtrace`를 이용해 GC가 얼마나 돌았는지 알아보자.

GC에서 한번 전체 sweep을 진행할 때의 간격에 대한 결과이다.
```
approx. time (ms) | GC (ms) | modified GC (ms)
=================================================
          0       |    0    |      0
          1       |    0    |      0
         40       |    0    |      2
        170       |    3    |      1
        300       |    3    |      1

         *             *           *
         *             *           *
         *             *           *

      39000       |    6    |     26
      42000       |    6    |     21
      47000       |    5    |     32
      50000       |    8    |     28
      54000       |    6    |     35
```
시작한지 몇 ms 되지 않은 시점에는 큰 차이가 없어 보이지만, 몇 초 후에는 backpressure로 인한 효과가 극적으로 나타난다. backpressure가 적용된 경우 GC에 큰 부하가 없지만, 수정된 경우는 interval이 크게 증가한다. 위의 예제에서 backpressure + GC는 1분에 75번 정도 수행되나 backpressure가 없는 경우 36번 정도에 그친다.

메모리가 더 많이 할당될 수록, GC가 한 번의 sweep 때 감당해야 하는 양도 많아진다. Sweep이 커질수록, GC가 어떤 메모리를 해제할 수 있는지 파악해야 하는 것도 많아지고, 이는 당연히 많은 computing power의 소모를 동반한다.

## Memory Exhaustion
이번에는 메모리 사용량을 확인해보도록 하자.
```
Respecting the return value of .write()
=============================================
real        58.88
user        56.79
sys          8.79
  87810048  maximum resident set size
         0  average shared memory size
         0  average unshared data size
         0  average unshared stack size
     19427  page reclaims
      3134  page faults
         0  swaps
         5  block input operations
       194  block output operations
         0  messages sent
         0  messages received
         1  signals received
        12  voluntary context switches
    666037  involuntary context switches
```
최대 87.81mb 정도의 메모리가 할당되었던 것으로 밝혀졌다.

```
Without respecting the return value of .write():
==================================================
real        54.48
user        53.15
sys          7.43
1524965376  maximum resident set size
         0  average shared memory size
         0  average unshared data size
         0  average unshared stack size
    373617  page reclaims
      3139  page faults
         0  swaps
        18  block input operations
       199  block output operations
         0  messages sent
         0  messages received
         1  signals received
        25  voluntary context switches
    629566  involuntary context switches
```
대조군에서는 1.52gb 정도의 메모리가 최대로 할당되었다.

backpressure가 없는 stream의 경우, 할당해야 하는 메모리 크기도 증가한다. 87.81mb -> 1.52gb면 엄청난 수치다.\
앞서 보았듯이 실행 시간의 차이가 유의미하지 않은 이상 굳이 메모리 크기를 많이 먹는 방법을 택할 필요는 없을 것이다.

## How Does Backpressure Resolve These Issues?
Node.js에서는 한 stream(source)에서 다른 stream(consumer)으로 데이터를 넘기는 경우 .pipe() 함수를 사용할 수 있다.
Node에서 이러한 source는 ReadableStream에 해당하고, consumer는 WritableStream에 해당한다.

backpressure는 WritableStream의 .write()가 호출 된 후 그 반환 값으로 실행 여부가 결정된다.
반환 값을 결정하는 몇 가지 조건들이 있다.

어느 상황이던 데이터 버퍼가 [highWaterMark](https://streams.spec.whatwg.org/#high-water-mark)를 넘기거나 Write queue가 바쁜 경우에 .write()의 반환 값은 false가 된다.\
이 때, 즉 false가 반환되었을 때, backpressure가 개입하게 된다. Backrpressure는 연결된 ReadableStream에서 데이터를 받아오지 못하도록 일시중지(pause)한 뒤 consumer가 준비될 때까지 기다린다. 데이터 버퍼가 비워진 경우, "drain" 이벤트를 내보내고 데이터가 다시 들어올 수 있도록 재개(resume)시킨다.

이렇게 backpressure를 통해서 우아하게 메모리를 관리하며 stream 작업을 진행할 수 있다.

> Node.js에서는 highWaterMark의 기본 값을 16kb 정도로 잡는다고 한다.
