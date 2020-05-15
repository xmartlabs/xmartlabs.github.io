---
layout: post
title: "Android Navigation Component - Expectations, Conclusions & Tips - Part 1"
date: 2020-05-12 10:00:00
categories: android, architecture components, jetpack, navigation component
author_id: mirland
show: true
featured_image: /images/android_navigation_blog_part_one/navigation_banner.jpg
crosspost_to_medium: false
---
<!--- STOPSHIP: Change date --->

This year the [Google I/O](https://events.google.com/io/) conference was canceled, so I think it's a good time to talk about one of [Jetpack's](https://developer.android.com/jetpack) biggest Architecture component introduced last year, the [Android Navigation Component](https://developer.android.com/guide/navigation).

The aim of this series of posts is to talk about two important items that will help you decide on whether to use this library or not:
1. The expectations and conclusions of using it for more than 9 months.
1. Some tips and helper classes that are very helpful if you do want to start using it (next post). 

## What were we expecting of a new navigation library?
That was the first question that came to my mind when we first thought about using it.
There are a bunch of navigation libraries in existence for Android, and at that moment we already had a solid navigation architecture based on the Router pattern, so, what were we expecting of it?

- A library that's easy to integrate and debug.
- A library which could provide us with a better understanding of the app's main flows and features. 
- Share data between views easily.
- A good integration between all of Jetpack's Components.

## What did we find?

The **integration** is very easy, you can follow [Android's documentation](https://developer.android.com/guide/navigation/navigation-getting-started) and check the [sample projects](https://github.com/android/architecture-components-samples) upon doing it.

After the integration, you'll have to define the app's main **navigation graph**, one of the most important components of this library.

<img width="100%" src="/images/android_navigation_blog_part_one/nav_graph.png" />


The graph is stored in a simple XML file, where the nodes are the app's screens (fragments, dialogs, etc) and the actions are the edges that allow for navigating between nodes.
Each node is able to declare arguments, which ends up being data shared within the navigation flow.

I found the nav graph extremely useful, with two key advantages:
- You can see the whole app flow represented as a navigation graph.
It's useful not only for you but especially for new colleagues joining your project. 
- The ability to define nested graphs, so that you can include an epic into a graph without increasing its size or nodes significantly.
The login is a common example: suppose that the login epic contains a login screen, a register screen and a terms and conditions screen.
If you add all of these screens to your main graph, it'll make it grow too fast -risking its future maintainability- so I recommend including a login subgraph instead.
Using this approach I found some advantages: the main graph is easier to understand and you can also re-utilize a given flow in multiple places in the app.
We know that reutilization is an excellent pattern: if you have to change something, you will do it just once.

One disadvantage we found is related to how Android Studio stores the graph nodes position.
These are saved in a huge and complex `.idea/navEditor.xml` file.
If you want to save the positions of all graphs nodes -in order for the graph to be consistent among your team, for instance- you need to track this file and include it in your repo.
Sometimes this file will be randomically corrupted and you'll lose the positions of all nodes.
If that is your case, you can checkout last valid file and it'll be fixed.
Moreover this file suffers of an awful lot of git conflicts, so it's a bit tedious to maintain it.

As I commented before, you can [share data between the nodes (screens) using arguments](https://developer.android.com/guide/navigation/navigation-pass-data).
The navigation component includes a Gradle plugin which has a pretty self-explanatory name: [Safe Args](https://developer.android.com/guide/navigation/navigation-pass-data#Safe-args).
That's really good because you can share arguments in a safe way and you don't have to care about the ugly key-value bundle used up until now.

Although I mentioned that sharing data in that way is good, we found that sharing data between different nested graphs is neither good nor safe.
If you want to do that, you'll have to declare the arguments manually in the graph's XML file, and if you ever happen to forget it, the app will end up crashing.
The plugin should be checking for this but it currently doesn't.

### Debug and test your app

The navigation component is also a very useful asset when it comes to **debugging** and testing work in progress (WIP) features easily in your app.
We found an interesting approach that proved to work very well for us: 
Suppose you are working on a feature in some internal screen.
When you run the application you have to navigate through the app to open the screen and test your progress in that feature.
We realized that we were wasting a lot of time navigating inside the app to test how our new internal screen looks.
If you use this library, you can change the `startDestination` property to be your WIP screen and if your screen does contain an argument, don't forget to declare default values in your navigation graph.
This way, when you run the app for the next time, this internal screen will be opened right away, awesome right?
On the other hand, debugging the graph status is a bit hard, not being able to know what's the current graph path.
To solve this issue we created a cool tool to log the current path, which I'll introduce in the next post.

The library includes a [**testing** module](https://developer.android.com/guide/navigation/navigation-testing), which lends a helping hand when testing your app's navigation logic.
Although I didn't get to use it a lot, I found it useful and easy to use whenever I had to.

### Jetpack & Android Architecture Component

<div style="display: inline-block;">
  <div style="float: left; width: 25%; margin-right: 1em;">
    <img src="/images/android_navigation_blog_part_one/jetpack_hero.svg" alt="">
  </div>
  <div markdown="1">
I will now talk about one of the most important points of this library.
The integration between this and the other [Android Architecture Components](https://developer.android.com/topic/libraries/architecture).
As you may know, some years ago Google released the Android Architecture Components, a collection of libraries that help you design robust, testable, and maintainable apps.
In this post I will not dive into them, but there are some of these components that are very important in all new Android Applications, such as the [ViewModel](https://developer.android.com/topic/libraries/architecture/viewmodel).
In my opinion, if you combine all the Android Architecture Components they always work like a charm, and this one is not the exception.

All graphs have an associated [lifecycle scope](https://developer.android.com/topic/libraries/architecture/lifecycle), so that you can create ViewModels associated to the graph's scope.
That means that you can share data through the screens using a ViewModel that's associated to a graph.

Let me explain it with an example: suppose that you have an app that has a big register flow. It contains a screen with personal information, another screen for your picture, another for your address and so on. 
A fine approach here would be to define a register nested graph.
As you can see, all screens have a piece of information that should be combined in the end. 
We have two options to accomplish that: either create a lot of arguments on each screen to share all of the information or just use a shared ViewModel.
Using the second approach, it will be cleaner while at the same time resulting both easier to handle and less verbose.
All screens will store their specific data in the graph’s ViewModel, and at the end the last screen will combine the data to create the needed entity.
As the ViewModel is associated to the graph’s lifecycle, when the flow finished it will be deleted.
 </div>
</div>

### Bonus

In the previous sections I talked about the most important points of this component. 
However, I also want to talk a bit about a couple of additional good features that I didn't have the chance to mention yet.

The first one is **deeplinking**, a cool feature that's present in most of our apps.
If you tried to do it, you then know that opening an internal screen directly (that also implies opening up multiple screens that come before it) could be a bit hard. 
That's where this component comes in and helps us!
You can [define deeplinks](https://developer.android.com/guide/navigation/navigation-deep-link) easily inside the nav graph by adding a `deeplink` XML tag. 
Furthermore, if you want to create a deep link through a push notification, you can create an [explicit intent](https://developer.android.com/guide/navigation/navigation-deep-link#explicit) and open exactly the section that you want. 

The second one, is to have the ability to define cool **transitions between fragments** by adding just a few lines of code.
If you add the right transitions, you can improve the app's UX a lot.
Additionally, a couple of months ago Material released the [motion system](https://material.io/design/motion/the-motion-system.html), a set of transition patterns that help users understand and navigate an app.
The following image shown a clear example motion system proposes
<img width="100%" src="/images/android_navigation_blog_part_one/motion_system.gif" />
You can integrate these transitions easily in your app using the navigation library.


## Conclusion
In this post we covered a lot of items that are of great importance when it comes to deciding whether to use a library or not.
The navigation is an essential part in all applications, so you need to be able to define all flows in a very clean way.
As we saw, this library will assist us on doing just that, even if it does have some issues, like the ones we talked about.
After you integrate this library, your application flow will become robust and a bit self-documented.
Splitting the complex flows into nested graphs makes your app stronger, as well as more maintainable and understandable.
The navigation component is combined perfectly with other Architecture Components, so if you are already using them, you will like it.
To sum up: if you integrate it you will have a strong navigation architecture that will support you both on debugging issues as well as also moving forward at a sustained pace. 
I recommend you give it a try.
