---
layout: post
title:  Introducing Ecno!
date:   2016-10-17 08:00:00
author: Diego Ernst
categories: Swift, iOS
author_id: dernst
markdown: redcarpet
description: Have you ever been using `UserDefaults` to store something that the user did in the past and then check whether or not he did it?


---

[Ecno]:        https://github.com/xmartlabs/Ecno

Have you ever been using `UserDefaults` to store something that the user did in the past and then check whether or not he did it? Maybe you wanted to display certain tutorial or prompt the user to subscribe just oncE? (the capital E ;)

If you feel familiar with those situations, you will discover a new friend, [Ecno].

## Introduction

[Ecno] is an open source library inspired by [Once](https://github.com/jonfinerty/Once), built on top of `UserDefaults` and written in pure `Swift 3`. Its main purpose is to keep track of user-defined tasks allowing you to mark them as **done**, **to-do** and check for those states. Within this context, a task can be any conceptual action or activity that you want to track. The following list shows a few examples:

* Show the app tutorial.
* Update a token.
* Prompt the user to subscribe.
* Perform a sync operation.

You will end up doing things like this:

```swift
if !Ecno.beenDone("display subscribe prompt", scope: .since(2.days)) {

  // prompt the user to subscribe!

  Ecno.markDone("display subscribe prompt")

}
```

## Task

As we already mentioned, a task can be any conceptual activity. Technically speaking, a task must be a type conforming to the `Task` protocol:

```swift
protocol Task {

    var tag: String { get }

}
```

As it will be the most common case, the `String` type already conforms to it, so `"Task example"` can be used as a task by default. Additionally, you can create your own task structures to fit your needs if you want.

## Scope

[Ecno] introduces the concept of **scope**. Scopes define certain time intervals within the entire application life cycle. Basically you can query if a task was **done** or set it as **to-do** within a specific scope. For instance:

```swift
if !Ecno.beenDone("sync operation", scope: .since(3.hours)) {

  // perform sync operation

  Ecno.markDone("sync operation")
}
```

> meaning "If there's been at least 3 hours since the last sync operation, then perform another sync".


If you want to show a tutorial every time your app gets updated:

```swift
if !Ecno.beenDone("show tutorial", scope: .appVersion) {

  // show tutorial for this app version

  Ecno.markDone("show tutorial")
}
```


On the other hand, setting a task as **to-do** within a specific scope will only have effect if that task was not already done in that scope. A **to-do** task is useful in those cases when a certain action triggers another one.

For instance:

```swift

// user was searching for blue t-shirts

let info = ["interestedIn": "t-shirts", "color": "blue"]
Ecno.toDo("show banner", scope: .appSession, info: info)
```

and then, in another section of the app:

```swift
if Ecno.needToDo("show banner") {
  let info = Ecno.infoForToDo("show banner") // ["interestedIn": "t-shirts", "color": "blue"]

  // show your gorgeous banner offering blue t-shirts

  Ecno.markDone("show banner")
}
```

This last example shows how to set a **to-do** task (only valid since the current app session start time) in order to show a user-search-related banner.

To see a full specification of the available scopes and their definitions please refer to [Ecno's readme at GitHub](https://github.com/xmartlabs/Ecno).

## Count checker

Another cool feature that [Ecno] offers is the ability to query the number of times that a certain task was done. A good example could be to show a certain tutorial if you detect that the user drops when facing some specific screen more than 3 times:

```swift

// user drops in screen X

Ecno.markDone("dropped user at screen X")
```

and then, when presenting screen X

```swift
if Ecno.beenDone("dropped user at screen X", numberOfTimes: .moreThan(3)) {

  // show tutorial
  // either the user doesn't understand what he's doing
  // or our UX sucks :)

}
```

## Where to go from here

I hope it has served as a good introduction to the [Ecno] library. On GitHub you will find an installation and usage guide to get started. You probably have been doing something similar (using `UserDefaults`) to support the scenarios we've discussed here, so hopefully it will help a lot of developers out there. Feel free to [contribute](https://github.com/xmartlabs/Ecno) to this small and powerful library.
