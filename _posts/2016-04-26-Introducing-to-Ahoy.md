---
layout: post
title:  Introducing Ahoy!
date:   2017-04-26 14:01:56
author: XL
categories: Swift, iOS
markdown: redcarpet

---

In almost every app you have to include an onboarding. Using [Ahoy](https://github.com/xmartlabs/Ahoy) we speed up development time spent and give the developers freedom to build an awesome experience for their users.


#### Alternatives
Some others alternatives already exist, but we always have to make some changes on it to meet our needs. So we decided to create our own framework and open source it (Yuhu!).

## Why to use Ahoy?
- The easy usage and speed to create what you need, are the first things to spotlight, and the flexibility to customize it the way you want is the next! The number of pages, the text label, the images and the button to skip or continue are all customizable. Also, if you feel like it, you can redo the whole UI and just plug it in.
- Also to allow or not to move to the next page in the onboarding when the user press the dots.
- You want to do some awesome transition between steps, you can do this via the `visibilityChanged` callback.
- Some common actions that we always used are handled too.
For example:
`onOnboardingSkipped`: is called by the controller when the user taps on the skip action.
`onOnBoardingFinished`: is called by the controller when the user taps on finish.
`visibilityChanged(for cell: UICollectionViewCell, at index: Int, amount: CGFloat)`: is called each time the visibility of a cell changes, this can be used to implement some cool animations between each cell.

## How to use it?
In order to setup your onboarding you just need to define 2 components:

- Specify the view controller that you are going to use and set it as a subclass from `OnboardingViewController`.
This will handle all the logic related to the slides and managing global controls (for example: an skip button).
- A Presenter which should implement the protocol `OnboardingPresenter` or subclassing from BasePresenter.
This will handle all the specific functionality of each cell (which text goes where, the type of cells, etc.)

After this you are ready to go! You can add any other UI components that you want via IBOutlets or directly by code.

Note: Create your `OnboardingViewController` subclass and set the presenter property to an instance of your presenter's class. This must be done **before** calling super.viewDidLoad(), in other case you will not see the onboarding view.

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

### Installation
##### CocoaPods

CocoaPods is a dependency manager for Cocoa projects.

To install Ahoy, simply add the following line to your Podfile:

```ruby
pod 'Ahoy', '~> 1.0'
```

##### Carthage
Carthage is a simple, decentralized dependency manager for Cocoa.

To install Ahoy, simply add the following line to your Cartfile:
```
github "xmartlabs/Ahoy" ~> 1.0
```


## Where to go from here
We hope that this help you to create incredible onboarding views! <br>
If you want to see have to use it or want to collaborate, feel free to contribute to this little but helpful [library](https://github.com/xmartlabs/Ahoy).
