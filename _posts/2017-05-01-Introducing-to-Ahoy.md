---
layout: post
title:  Introducing Ahoy! The faster way to create onboardings in iOS!
date:   2017-05-01 12:00:00
author: XL Team
author_id: xl
categories: Swift, iOS, Onboarding, Tutorial
markdown: redcarpet
description: It is quite common that today's apps include a tutorial or onboarding screens that introduce features or advantages about your fancy app to the user…


---

It is quite common that today's apps include a tutorial or onboarding screens that introduce features or advantages about your fancy app to the user.
This simple feature, (from the user's point of view) sometimes is more complex that we think given the variety of things we can do (and are directly related with the designer/marketing team's inspiration), so trying to do our job easier for tomorrow and following our well-known culture of sharing code & knowledge we created [Ahoy!](https://github.com/xmartlabs/Ahoy)

From now on, you can avoid reinventing the wheel and start focusing on delivering the best user experience, Ahoy will help you get this within a few steps that we are going to introduce you.


## Why should you use Ahoy?
We got tired of having to customize existing rigid frameworks to meet our design request, so this is the main goal of this library: provide a simple and customizable way to implement a wide range of onboarding screens.

You will see later that with only 2 components you will be able to build an onboarding flow in a few minutes with the flexibility to customize things like number of pages, text labels, the images, skip (or continue) button among other things ;).

Say no more to those hacks inside external libraries to have that cool animation beetween slides, or different layout between slides for example.

<p align='center'>
  <img src='https://raw.githubusercontent.com/xmartlabs/Ahoy/master/movie.gif' alt='Ahoy in action!'/>
</p>


## How to use it?

### Installation
Ahoy is available in the most used dependency managers for the iOS ecosystem.
#### CocoaPods
To install Ahoy, simply add the following line to your Podfile:
```ruby
pod 'Ahoy', '~> 1.0'
```

#### Carthage
To install Ahoy, simply add the following line to your Cartfile:
```
github "xmartlabs/Ahoy" ~> 1.0
```

### Setup
In order to setup your onboarding you just need to define 2 components:

1. A view controller that is going to be a subclass of `OnboardingViewController` and you are going to call it from your code.
This will handle all the logic related to the slides and managing global controls (for example: a skip button).
2. A Presenter which must implement the `OnboardingPresenter` protocol  or subclass from `BasePresenter`.
This will handle all the specific functionality of each cell (which text goes where, the type of cells, etc).

After this you are ready to go! You can add any other UI components you want via IBOutlets or directly by code.

Note: Create your `OnboardingViewController` subclass and set the presenter property to an instance of your presenter's class. This must be done **before** calling `super.viewDidLoad()`, otherwise you will not see the onboarding view.

In case is necesary, there are some common actions that we always use are handled too:
- `onOnboardingSkipped` called by the controller when the user taps on the skip action.
- `onOnBoardingFinished` called by the controller when the user taps on finish action.
- `visibilityChanged(for cell: UICollectionViewCell, at index: Int, amount: CGFloat)` called each time the visibility of a cell changes, this can be used to implement some cool animations between each cell.


### Example
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


## Where to go from here
So… now that you meet Ahoy, you will be able to create incredible onboarding experiences, following just a few and easy steps, letting you focus on the real core app functionalities.

We hope you find this post as a good introduction to this library. On GitHub you will find everything to get started or if you want to collaborate, feel free to contribute to this little but helpful [library](https://github.com/xmartlabs/Ahoy).
