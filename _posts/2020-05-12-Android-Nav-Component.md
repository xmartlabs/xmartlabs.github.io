---
layout: post
title: "Android Navigation Component - Expectations, Conclusions & Tips"
date: 2020-05-12 10:00:00
categories: android, architecture components, jetpack, navigation component
author_id: mirland
show: true
featured_image: /images/tflite_coreml/featured.png
---
<!--- STOPSHIP: Change date and featured_image --->

This year the [Google's io](https://events.google.com/io/) was canceled, so I think it's a good time to talk a about one of the biggest [Jetpack's Architecture component](https://developer.android.com/jetpack) introduced last year, the [Android Navigation Component](https://developer.android.com/guide/navigation).

The aim of this series is to talk about two important items that can help you to decide to use this library or not:
1. The expectations and conclusions of using it for more than 9 months.
1. Some tips and helper classes that are very helpful if you want to start using it (next post). 

## What we expected of a new navigation library?
That was the first question that came to my mind when we thought about using it.
There are a bunch of navigation libraries, and at that moment we had a solid navigation architecture based on the router pattern, so, what do we expect of a new library?

- A library easy to integrate and debug.
- A library which provides us a better understanding of the app's main flows and features. 
- Share data between views easily.
- A good integration between all Jetpack Components.

## What did we find?

The **integration** is very easy, you can follow the [Android's documentation](https://developer.android.com/guide/navigation/navigation-getting-started) and check the [sample projects](https://github.com/android/architecture-components-samples).

After the integration, you have to define the app's main **navigation graph**, one of the most important components of this library.

<!--- STOPSHIP: Add image --->
[IMAGE](TODO)

The graph is stored in a simple xml file, where the nodes are the app's screens (fragments, dialogs, etc) and the actions are the links to navigate between the different nodes.
Each node could declare arguments, it's data that will be shared in the navigation flow.

I found the nav graph awesomely useful, with two key advantages:
- The first one, you can see the whole app flow represented as a navigation graph.
It's useful for you, as long as new team mates are joining your project. 
- The second point is to have the ability to define nested graphs, so you can have big epics represented in nested graphs.
The login is a common example, suppose that the login epic contains a login screen, a register screen and a terms and conditions screen.
If you add all these screens to your main graph, it'll grow up too fast, so I recommend you to include a login subgraph.
Using this approach I found some advantages: the main graph is easier to understand, you can re-utilize the same flow in multiple places in the app.
We know that the reutilization is a good pattern, if you have to change something, you will do it just once.

One disadvantage we found is related to how Android Studio saves the graph nodes position.
it's saved in a huge and complex `.idea/navEditor.xml` file.
If you want to save the positions of all graphs nodes, you have to track this file.
Sometimes this file is corrupted and you lose the positions of all nodes.
Moreover this file suffers a lot of git conflicts, so it's a bit tedious to maintain it.

As I commented before, you can [share data between the nodes (screens) using arguments](https://developer.android.com/guide/navigation/navigation-pass-data).
The navigation component includes a Gradle plugin that its name says it all: [Safe Args](https://developer.android.com/guide/navigation/navigation-pass-data#Safe-args).
That's really good because you can share arguments in a safe way and you don't have to care about the ugly key-value bundle.

Although I said that sharing data in that way is good, we found that sharing data between different nested graphs is not good nor safe.
If you want to do that, you have to declare the arguments manually in the xml file, and if you forget it, the app will crash.

### Debug and test your app.

The nav-components is a good asset witch helps you to **debug** and test work in progress (WIP) features easily in your app.
We found an interesting approach that works very good for us: 
Suppose you are working on a feature in some internal screen.
When you run the application you have to navigate through the app to open the screen and test your progress in that feature.
We realize that we waste a lot of time navigating in the app to test how our internal new screen looks.
If you use this library, you can change the `startDestination` property to your WIP screen.
So when you run the app, the screen is opened, awesome right?.
On the other hand, debugging the graph status is a bit hard, you cannot know what the current graph path is.
To solve this issue we created a cool tool to log the current path, I'll introduce it in the next post.

The library includes a [**testing** module](https://developer.android.com/guide/navigation/navigation-testing), which helps to test your app's navigation logic.
Although I didn't use it a lot, I found it useful and easy to use.

### Jetpack & Android Arch Component

If you ask me, I think I will talk about one of the most important point of this library.
The integration between the other [Android Architecture Components](https://developer.android.com/guide/navigation/navigation-deep-link).
As you may know, some years ago Google realized the Android Arch Components, a collection of libraries that help you design robust, testable, and maintainable apps.
In this post I will not talk about that, but there are some components that are very important in all new Android Applications, such us the [ViewModel](https://developer.android.com/topic/libraries/architecture/viewmodel).
In my opinion, if you combine the Android Arch Components, they work like a charm, and this is not the exception.

All graphs have an associated [lifecycle scope](https://developer.android.com/topic/libraries/architecture/lifecycle), so you can create ViewModels associated with the graph scope.
That means that you can share data through the screens using a ViewModel associated to a graph.

Let me explain it with an example, suppose that you have an app that has a big register flow. It contains a screen with personal information, another screen for your picture, another for your address and so on. 
A good approach here is to define a register nested graph.
As you can see, all screens have a piece of information that at the end, they should be combined. 
We have two options to do that, create a lot of arguments on each screen to share the information or just use a shared ViewModel.
Using the second approach, it will be cleaner, and at the same time easier and less verbose.
All screens will save the recovered data in the graph’s view model, and at the end, the last screen will combine that data to create the entity.
As the ViewModel is associated with the graph’s lifecycle, when the flow finished, the ViewModel will be deleted.


### Bonus

In the previous sections I mentioned the most important points of this component. 
However, I want to talk a bit about a couple of good features that I didn't mentioned yet.

The first one is the **deep links**, a cool feature that most of our apps have.
If you tried, you may know that opening an internal screen, that implies opening multiple screens, could be a bit hard. 
That's where this component helps us!
You can [define the deeplinks](https://developer.android.com/guide/navigation/navigation-deep-link) easily in the nav graph, by adding just an `deeplink` xml tag. 
Furthermore, if you want to create a deep link through a push notification, you can create an [explicit intent](https://developer.android.com/guide/navigation/navigation-deep-link) and open the section that you want. 

The second one, is to have the ability to define cool **transitions between fragments** by adding just a few lines.
If you add the right transitions, you can improve the app's UX a lot.
Furthermore, a couple of months ago, material released the [motion system](https://material.io/design/motion/the-motion-system.html), a set of transition patterns that can help users understand and navigate an app.
You can integrate these transitions easily in your app using the navigation library.


## Conclusion
In this post we covered a lot of items that are important to choose a library or not.
The navigation is an important part in all applications, so you have to define all flows in a clean way.
As we saw, this library helps us to do it, besides some issues that we talked about.
After you integrate this library, your application flow is robust and a bit self-documented.
Splitting the complex flows in nested graphs makes your app stronger, maintainable and understandable.
The nav component is combined perfectly with other Architecture Components, so if you are using them, you will like it.
To sum up, if you integrate it, you will have a strong navigation architecture, that will help you to debug and move forward faster. 
For all these important points, I recommend you to give it a try.
