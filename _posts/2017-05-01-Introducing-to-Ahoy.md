---
layout: post
title:  Ahoy - The Onboarding Library You Were Asking For
date:   2017-09-11 13:40:00
author: XL Team
author_id: xl
tags: [Xmartlabs, Swift, iOS, Onboarding, Tutorial]
markdown: redcarpet
show: true
category: development
permalink: /:year/:month/:day/:title/
---

We’re pretty sure you’ll need to include an onboarding library in the iOS App you’re building. In order to speed up the time spent in development while giving the developers freedom to build an awesome experience for their users, we created [Ahoy](https://github.com/xmartlabs/Ahoy), developed in Swift!

Unique?
Yes. We know that there are some other alternatives out there, but due to the fact that we always had to tweak them in order to meet our needs, we decided to create our own framework and open source it (Woohoo!).

## Why using Ahoy?
The ease and speed to create what you need, are the first things to spotlight.
The flexibility to customize it the way you want comes next.

In Ahoy you can:
* Customize number of pages
* Tweak text labels
* Add images
* Include a button to skip or continue
* Enable the option to move to the next page
* Make awesome transitions between steps, via the visibilityChanged callback

Some of the common actions that we always use were taken into account when we created Ahoy.

Basic overview:

`onOnboardingSkipped` is called by the controller when the user taps on the skip action.

`onOnBoardingFinished` is called by the controller when the user taps on the finish button.

`visibilityChanged(for cell: UICollectionViewCell, at index: Int, amount: CGFloat)` is called each time the visibility of a cell changes (pst, use this option to incorporate some cool animations between each cell).

**Bonus track:** if you feel like it, you can redo the whole UI and just plug it in.

<p align='center'>
  <img src='https://raw.githubusercontent.com/xmartlabs/Ahoy/master/movie.gif' alt='Ahoy in action!'/>
</p>



## Setup
In order to setup your onboarding you just need to define 2 components:

1. Specify the view controller that you are going to use, and set it as a subclass from `OnboardingViewController`.
This component will be responsible for all the logic related to the slides, and the management of their global controls (for instance, a skip button).
2. Choose a Presenter to implement the protocol `OnboardingPresenter` or the subclassing from `BasePresenter`.
This component will handle all the specific functionalities for each cell (which text goes where, the type of cells, etc).

Once you’ve defined the two components you’re good to go! Remember that you can also add any other UI component that you want. Add them via IBOutlets or directly in the code.

**Note:** Create your `OnboardingViewController` subclass and set the presenter property to an instance of your presenter's class. Take into account that this must be done **before** calling `super.viewDidLoad()`, otherwise, you won't see the onboarding view.

## Example
```swift
import Ahoy
class MovieFanOnboardingController: OnboardingViewController {

    override func viewDidLoad() {
        presenter = MovieFanPresenter()
        presenter.onOnBoardingFinished = { [weak self] in
            _ = self?.navigationController?.popViewController(animated: true)
        }
        super.viewDidLoad()
    }
}

class MovieFanPresenter: BasePresenter {
  // Your presenter implementation's here
}
```



## Installation
You can install Ahoy by using CocoaProjects or Carthage, both are very simple and easy!

### CocoaPods
CocoaPods is a dependency manager for Cocoa projects.
To install Ahoy, simply add the following line to your Podfile:
```ruby
pod 'Ahoy', '~> 1.0'
```

### Carthage
Carthage is a simple and decentralized dependency manager for Cocoa.
To install Ahoy, simply add the following line to your Cartfile:
```ruby
github "xmartlabs/Ahoy" ~> 1.0
```

## What’s next?
We hope that Ahoy will be as useful for you as it was for us and that you create incredible onboarding views with it! We are also willing to receive your collaboration in our humble but helpful [library](https://github.com/xmartlabs/Ahoy).


Need other quick but powerful solutions?
Visit us on [GitHub](https://github.com/xmartlabs), we’re one of the top 10 GitHub Swift developers :), or drop us a line at <hi@xmartlabs.com>.
