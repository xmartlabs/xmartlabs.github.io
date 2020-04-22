---
layout: post
title: "Powerful animations in React Native"
excerpt: "Powerful animations with Reanimated. We show how to make powerful animations in React Native using this awesome library!"
date: 2020-04-22 10:00:00
author: Nicolas Hernandez
tags: [Xmartlabs, ReactNative, Animations]
category: development
author_id: nicoh
featured_image: /images/powerful-animations-rn/featured.jpg
show: false
crosspost_to_medium: false

---

# Powerful animations in React Native, is possible?

After reading this blogpost will have a better idea of the cost to achieve complex animations in react native and you will be able to determine if react native is a good technology to create your app according it's animations requirements. 
Also you would see some the techniques to achieve this and trade offs that happens to us when we work in our apps for some clients here in Xmartlabs.

So let's start with a little introduction to the matter.

***“When speaking of animations, the key to success is to avoid frame drops”*** 

What makes React Native so special regarding this topic of avoiding frame drops?

To answer this question, first we need to get deep into React Native architecture that is shown in the image below. 
As we can see React Native has two main threads.

- UI Thread - Where all the native code runs
- JavaScript Thread - Where all the JavaScript code runs.

<img width="100%" src="/images/powerful-animations-rn/frame_drops.png" />

These two threads communicate between each other through JSON messages that are sent and received asynchronously from which is called the React Native Asynchronous Bridge and all interactions between JavaScript and the UI are made in this way.

### How does this have to do anything with animations?

Well, since we want to have an awesome user experience, we would want animations to run at 60fps.
This effectively means there's only ~16ms to calculate an animation windows frame between each screen rendering. 
This is when the Bridge comes in the way of animations, the asynchronous communication between the two threads makes it difficult to guarantee that the next frame is calculated in such limited amount of time, JS thread might be busy working on another task or device CPU is too slow. 

### **What impact has this in React Native?**

It’s really huge, because if we have JavaScript driven animation using the [requestAnimationFrame()](https://reactnative.dev/docs/timers) we have no guarantees that we could achieve the frame calculation, especially in low grade Android devices, all taking into account that we also use the JavaScript Thread to do all the things in our React Native app, such as API requests, etc. 
So it's very likely we aren't gonna make that time limit that we need and we're going to lost some frames and experience some animation freeze.

### **How can we solve this?**

<img width="100%" src="/images/powerful-animations-rn/declarative_way.png" />

So if the bridge is our major "trade-off" how we can get rid of this? Well, there is a solution by using `react-native-reanimated` library which uses a declarative animations approach.

### **What is the advantage of this?**

If we do our animations in a declarative way, when we interact with the gestures and animations on the phone everything is executed in the UI Native thread and with this we can achieve the magic number of 60fps and avoid the losing frames.

### **Write animations in a declarative way, how can we achieve this in React Native?**

React Native by default provides two API’s, one for gestures and one for animations, but please don’t ever use this because both rely on imperative code and on the communication between the JavaScript thread and the UI thread through the bridge.

As we mention before in order to do it declarative we are going to use these two libraries:

- **React-Native-Reanimated**, for animations.
- **React-Native-Gesture-Handler**, for gestures.

First of all, our code needs to be written with the `Reanimated.API`, what does this mean?

We cannot use if-else, Views neither the + * == operators because they live in the JavaScript thread, we need to use the auxiliary functions that are provided by the `Reanimated.API`, here are some examples of that there are a lot of more examples but these are the most important ones.

> Explaining each parameter and details of each `Reanimated API` is out of the scope of this blogpost. Please visit specific reanimated documentation if needed.

<style type="text/css">
.tg  {
  border-collapse:collapse;
  border-spacing:0;
}
.tg td {
  font-family:Arial, sans-serif;font-size:14px;padding:10px 5px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;border-color:black}
.tg th{font-family:Arial, sans-serif;font-size:14px;font-weight:normal;padding:10px 5px;border-style:solid;border-width:1px;overflow:hidden;word-break:normal;border-color:black;}
.tg .tg-l93j{font-weight:bold;font-size:16px;border-color:inherit;text-align:center;vertical-align:top}
.tg .tg-zd5i{font-size:14px;border-color:inherit;text-align:left;vertical-align:top}
.tg .tg-0pky{border-color:inherit;text-align:left;vertical-align:top}
</style>
<table class="tg">
  <tr>
    <th class="tg-l93j">Javascript Thread</th>
    <th class="tg-l93j">UI Thread/Reanimated API</th>
  </tr>
  <tr>
    <td class="tg-zd5i">render()</td>
    <td class="tg-0pky">Frame</td>
  </tr>
  <tr>
    <td class="tg-0pky">View</td>
    <td class="tg-0pky">Animated.View</td>
  </tr>
  <tr>
    <td class="tg-0pky">setState()</td>
    <td class="tg-0pky">set()</td>
  </tr>
  <tr>
    <td class="tg-0pky">if() {}</td>
    <td class="tg-0pky">cond()</td>
  </tr>
  <tr>
    <td class="tg-0pky">Statement1;Statement2;Statement3;</td>
    <td class="tg-0pky">block([Statement1,Statement2,Statement3])</td>
  </tr>
  <tr>
    <td class="tg-0pky">+, *, ==, ...</td>
    <td class="tg-0pky">add(), multiply(), eq(), ...</td>
  </tr>
  <tr>
    <td class="tg-0pky">Math.sin(), Math.pow(), Math.floor()</td>
    <td class="tg-0pky">sin(), pow(), floor()</td>
  </tr>
</table>

So if we apply this in a simple example this is how it looks.

> This is a simple example to show the complexity of the `Reanimated API`, explaining the inner details of how this work is out of the scope of this blogpost. Please visit specific reanimated documentation if needed.

```javascript
    import React, { useState } from "react";
    import { View, SafeAreaView, Text, StyleSheet } from "react-native";
    import Animated from "react-native-reanimated";
    import { useMemoOne } from "use-memo-one";
    import { RectButton } from "react-native-gesture-handler";
    
    export const Example = () => {
      const {
        Value,
        useCode,
        block,
        cond,
        Clock,
        not,
        clockRunning,
        startClock,
        set,
        interpolate,
        Extrapolate,
        add,
        eq,
        stopClock
      } = Animated;
      const animationDuration = 500;
      const [show, updateShow] = useState<boolean>(true);
      const { time, clock, progress } = useMemoOne(
        () => ({
          time: new Value(0),
          clock: new Clock(),
          progress: new Value(0)
        }),
        []
      );
      const opacity = interpolate(progress, {
        inputRange: [0, 1],
        outputRange: show ? [0, 1] : [1, 0],
        extrapolate: Extrapolate.CLAMP
      });
    
      useCode(
        block([
          cond(not(clockRunning(clock)), [startClock(clock), set(time, clock)]),
          set(
            progress,
            interpolate(clock, {
              inputRange: [time, add(time, animationDuration)],
              outputRange: [0, 1],
              extrapolate: Extrapolate.CLAMP
            })
          ),
          cond(eq(progress, 1), stopClock(clock))
        ]),
        [show]
      );
    
      return (
        <View style={styles.container}>
          <View style={styles.mainContent}>
            <Animated.View style={{ opacity }}>
              <View style={styles.card} />
            </Animated.View>
          </View>
          <RectButton onPress={() => updateShow(!show)}>
            <SafeAreaView style={styles.button} accessible>
              <View style={styles.button}>
                <Text style={styles.label}>{show ? "Hide" : "Show"}</Text>
              </View>
            </SafeAreaView>
          </RectButton>
        </View>
      );
    };
```
<style type="text/css">
.center {
  display: block;
  margin-left: auto;
  margin-right: auto;
  width: 50%;
  height: 80%;
}
</style>
<img class="center" src="/images/powerful-animations-rn/hide_and_show.gif" />

### **Conclusions**

As we can see in the example above it's easier to write the animation using the default Animated.API because the code is easier to write, understand and maintain. 
In this case it could work like a charm but when the animations get more complex and we need to guarantee they always run smoothly we're not able to achieve that by just using Animated.API.

In that cases reanimated could be like water in the desert but don't forget that nothing comes without a cost and with reanimated the cost is complexity and with complexity comes more development time because it could be a bit complex to adapt your coding style to use this API. 
At first it feels a bit awful and kind of antinatural, but when you get accustomed to that you will be able to create powerful animations.

In resume, there are some way to achieve powerful animations in React Native that comes with a little trade off in complexity. 
So if you are looking to make an App that have some little animations and one or two powerful ones, maybe with React Native + Reanimated you could get a nice looking app but if you want to make an app in which the animations are the core of the product itself React Native it's not the best for you.


Well, hope you now have a better idea of how to implement powerful animations in React Native!


***Are you doing something regarding animations in your RN projects and have learned something not covered in this post? Let me know in the comments. I'd be interested to get your perspective.***

***Have questions about Reanimated? I'd be happy to answer those in the comments if I can.***
