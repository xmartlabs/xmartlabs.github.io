---
layout: post
title: "What happened at AppBuilders?"
excerpt: "My thoughts about the knowledge shared at the conference!"
date: 2020-05-19 10:00:00
author: Rodrigo Arsuaga
tags: [Xmartlabs, iOS Conference]
category: people-events
author_id: arsu
featured_image: /images/recap-appbuilders/featured.jpg
show: true
permalink: /:year/:month/:day/:title/
---

After months of the uncertainty of how a fully online conference would work, and a lot of hard work from multiple teams around the world in order to make it work.
I must say this has been one of the best conferences I've experienced so far, online or not.

AppBuilders quickly adapted to a fully online event by using the [Hopin](https://hopin.to/) platform and thus, reducing its price.
At first, I thought that with limited interactions the conference would be less fun.
But in the end, it wasn't something we missed during the conference.
Thanks to the creation of sessions that people could join and talk about anything, and the "Chat roulette" feature where you could have a quick 1 on 1 with other attendees or speakers, we easily broke the ice and forgot our initial fears.
We had long chats in groups and definitely had a blast during the whole two days.

We also had the addition of Q&A sessions after talks that worked better than most Q&A sessions I have seen before.
We discussed subjects to a longer extent than we normally would and we even discussed our talks with other speakers like in the case with Chris Eidhof where we discussed OSS components for SwiftUI.

That being said, now I want to share my thoughts about each talk, starting with mine.

## What did we learn at AppBuilders?

### Small teams, Big OSS

<div style="text-align: left"><img width="90%" src="/images/recap-appbuilders/featured.jpg" />
<p class="small">Sketchnote: Courtesy of <a href="https://twitter.com/felibe444">@felibe444</a></p>
</div>

"Small teams, Big OSS"  shares multiple tips and insight on how to run OSS, either with your company or personally.
Going through key points like motivation and how to make OSS a part of your daily life to how to work with the community and promote your OSS.
So if you want to know our take on how to run a successful OSS project watch my talk here:

<iframe width="560" height="315" src="https://www.youtube.com/embed/2J2rO0XTJUA" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>


### UITesting over the years

<div style="text-align: left"><img width="90%" src="/images/recap-appbuilders/ui-testing.jpeg" />
<p class="small">Sketchnote: Courtesy of <a href="https://twitter.com/felibe444">@felibe444</a></p>
</div>

In the conference keynote, Peter Steinberger shared what he learned in 5 years of testing at PSPDFKit.
He showed us the entire evolution regarding UITesting state of the art until recent Xcode release including XCUItesting and UI testing parallelism. He also talked about some community libraries and Apple internals! For instance, how UITesting libraries "simulates" a touch or how to implement busy waiting through app runloop.

Finally, he shared a bunch of tips! For example how to speed up testing by speeding up the windows layer, or how to re-run failed tests to avoid the scenarios where a test fails due to a networking issue. If you are considering to do UITesting, this talk is a must.


### Property Wrappers

<div style="text-align: left"><img width="90%" src="/images/recap-appbuilders/property-wrappers.jpeg" />
<p class="small">Sketchnote: Courtesy of <a href="https://twitter.com/felibe444">@felibe444</a></p>
</div>

Property wrappers were a very required swift language feature.
Combine and SwiftUI make use of it. In this talk, Vincent Pradeilles introduced the subject, explaining why it is useful and where. He also showed several PropertyWrappers applications from simple to complex, from how to encapsulate repetitive NSUserDefault getters and setters to how to implement property value caching.  

If you know nothing about property wrappers yet, this is a very comprehensive introduction.

### Getting started with combine

<div style="text-align: left"><img width="90%" src="/images/recap-appbuilders/combine.jpeg" />
<p class="small">Sketchnote: Courtesy of <a href="https://twitter.com/felibe444">@felibe444</a></p>
</div>

In this talk Shai Mishali introduced the Combine framework.
It went from reactive programming fundamentals to some async programming problems where reactive programming makes sense to combine main components and its integration with Foundation and SwiftUI. Even if you know nothing about reactive programming or you have been using RxSwift this talk is for you.  


### Going Quantum

<div style="text-align: left">
<img width="90%" src="/images/recap-appbuilders/quantum.jpeg" />
<p class="small">Sketchnote: Courtesy of <a href="https://twitter.com/felibe444">@felibe444</a></p>
</div>


A really mind-blowing talk about the state of quantum computers by Sebastian Weidt where he explained the benefits of going quantum and the difficulties it brings and how they are constantly working on better quantum chips. But what is that to us devs? Well, he tells us we don't need a fancy Ph.D. in order to work with quantum algorithms, as time goes by more and more frameworks are being created by different companies in order to run very powerful quantum algorithms. A very good analogy would be the case of machine learning. The bar will keep lowering year by year and as long as people get the quantum way of thinking they will be able to use these powerful tools to process information at speeds impossible by any supercomputer!




### Custom UI components in SwiftUI

<div style="text-align: left"><img width="90%" src="/images/recap-appbuilders/swift-ui.jpeg" />
<p class="small">Sketchnote: Courtesy of <a href="https://twitter.com/felibe444">@felibe444</a></p>
</div>


In this talk, Chris Eidhof shared some tips on how to design custom components in order to make them work like native components and respect the layout and proposed size. Tips such as avoid GeometryRender as much as possible, avoid fixed sizes, and so on. The subject was very well explained, along with an amazing step by step live coding session on how to create a custom signal view.

### Making your voice heard

<div style="text-align: left"><img width="90%" src="/images/recap-appbuilders/voice-hear.jpeg" />
<p class="small">Sketchnote: Courtesy of <a href="https://twitter.com/felibe444">@felibe444</a></p>
</div>

Inspiring words by Erica Sadun on how we should constantly engage with the Swift forums, posting what Swift issues we have and propose new changes. And why wouldn't we? We are the ones that are always using the damn thing,  might as well make Swift work for us for a change. That's why we should be aware of the possibility to think about what changes we find important and express them to the team working on Swift year after year. So please go to [https://forums.swift.org/](https://forums.swift.org/) and be part of the evolution.


### Practical machine learning

<div style="text-align: left"><img width="90%" src="/images/recap-appbuilders/machine-learning.jpeg" />
<p class="small">Sketchnote: Courtesy of <a href="https://twitter.com/felibe444">@felibe444</a></p>
</div>

In this talk presented by Paris Buttfield-Addison, we learned how easy can it be to incorporate AI into your iOS app. You don't need to be an AI expert as Apple has enough tools for you. You only need a dataset to get started and then with CoreML you can train a model for your specific use case. You can do all of this using Swift and a GUI.

If you prefer using Python then there is [Turi Create](https://github.com/apple/turicreate), which lets you train your own models with more flexibility. It can be used for a variety of tasks like image classification, object detection, recommender systems, sound classification and many more.  

With these tools, you can create CoreML models which come pre-packaged with handy functions that make models very easy to integrate with your app.


### Accessibility for all!

We saw how accessibility has become a very popular subject after watching three amazing talks on accessibility. Did you know 14% of iOS users have some kind of accessibility issue that needs to be addressed and most apps don't really focus much attention on those issues? Well now we do, we have done accessibility before and will continue to do so in our apps to help those people in need! And luckily Apple has continued to make progress in their tools to help programmers create apps that cater all needs with ease as we have seen in "Apps for All: Making Software Accessible" by Matthew Bischoff (Likability) and "Accessibility for iOS: doing well by doing good" by John Fox (Netflix). As a good practice, you should check how accessible is your app and how it complies with A11Y by testing with real users! To understand how this issue really feels I recommend "UI Mode: Pitch Black" by Lea Marolt Sonnenschein with its impressive tech guide. Truly a great use of a demo for developers. At first, this might seem intimidating but it's as devs we should strive to help all users use the apps they want and not have a small portion of them available for use.


## Final Thoughts

AppBuilders was a great experience as a speaker and as a spectator for all these other amazing speakers.
We were able to share our knowledge in an amazing fashion and network with hundreds of other developers.

I won't be missing it next year and I believe you shouldn't either. I can't stress enough the importance of these gatherings and how great they are for personal and community growth since we always have new things to share and learn to improve the quality of our work together.
See you next time!

BTW, you can watch all talks at [App Builders conference](https://2020.appbuilders.ch/memento) site!
