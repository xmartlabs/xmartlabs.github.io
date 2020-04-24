---
layout: post
title: "Mapping out errors with Rx and Result classes"
excerpt: ""
date: 2020-04-17 10:00:00
author: Felipe de León
tags: [Xmartlabs, Kotlin, Android, ReactiveX, iOS]
category: development
author_id: felipe
featured_image: 
show: true
crosspost_to_medium: false

---

It has been a common practice to use `Result` classes to wrap Observable result that can derivate in `Exceptions` being thrown but some times this could limit some of the characteristics that ReactiveX provides in this blog we will see some examples on when and where you should use the result class to emit continuously without messing up the features that Rx provides to us.

# First things first:
The Result class that we would use for these examples is rather basic and it is provided by kotlin you can see it in this (link)[https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-result/]

# Rx a
Rx is not intended to ignore when an `Exception` is thrown if that would happen inside an observable we have a way to manage that and is the `onError()` function. We have to take in mind this when we are creating observables that could throw errors it is different to do this:

```
[kotlin]

Observable.create<Result<Unit>> { emmitter ->
    SomeThirdPartyService.doSomethingThatCouldFail() { error ->
      if (error == null) {
        emmitter.onNext(Result.Success(Unit))
      } else {
        emmitter.onNext(Result.Error(error))
      }
    }
  }
``` 

than this:

```
[kotlin]

Observable.create<Result<Unit>> { emmitter ->
    SomeThirdPartyService.doSomethingThatCouldFail() { error ->
      if (error == null) {
        emmitter.onSuccess(Result.Success(Unit))
      } else {
        emmitter.onError(error)
      }
    }
  }.onErrorResult { throwable -> Result.Error(throwable) }
```
In both cases we have accomplish the same we don't emit an `onCompleat` or an `onError` to the subscriber but in the first one we have exclude us of using some of the operators Rx gives us for example the  `retry()` operator or the `onErrorResumeNext()`. By wrapping inside we limit the power of Rx excluding us from some operator that might recover the stream without the necessity of emitting an `Result.Error` that at the end its what we want to avoid.