---
layout: post
title:  Introducing Ahoy!
date:   2017-04-26 14:01:56
author: XL
categories: Swift, iOS
markdown: redcarpet

---

Is quite common that today's app includes a tutorial or onboarding screens that introduce features or advantages for the user. This simple feature (from the user perspective) sometimes is complex that we think given the variety of things we can display (directly related with the designer/marketing inspiration), so thinking in the future and following our well-known culture of sharing code & knowledge we created [Ahoy](https://github.com/xmartlabs/Ahoy).
So for know on, you can avoid reinventing the wheel and start focusing on delivering the best user experience, Ahoy will help you get this within a few steps that we are going to introduce bellow.

#### Alternatives
Most of the times, the design requested was too complex to implement because most frameworks provide really rigid UI layouts. Moreover, sometimes we had to do some cool transitions between slides and the frameworks didn't provide any way to do this in a clean way.

## Why should you use Ahoy?
- The easy usage and speed to create what you need, are the first things to spotlight, and the flexibility to customize it the way you want is the next! The number of pages, the text label, the images and the button to skip or continue are all customizable. Also, if you feel like it, you can redo the whole UI and just plug it in.
- To allow transitioning to the next page in the onboarding when the user presses the dots.
- You want to do some awesome transition between steps, you can do this via the `visibilityChanged` callback.
- Some common actions that we always use are handled too.
For example:
`onOnboardingSkipped`: is called by the controller when the user taps on the skip action.
`onOnBoardingFinished`: is called by the controller when the user taps on finish.
`visibilityChanged(for cell: UICollectionViewCell, at index: Int, amount: CGFloat)`: is called each time the visibility of a cell changes, this can be used to implement some cool animations between each cell.

## How to use it?
In order to setup your onboarding you just need to define 2 components:

- Specify the view controller that you are going to use and set it as a subclass of `OnboardingViewController`.
This will handle all the logic related to the slides and managing global controls (for example: a skip button).
- A Presenter which should implement the protocol `OnboardingPresenter` or subclassing from BasePresenter.
This will handle all the specific functionality of each cell (which text goes where, the type of cells, etc).

After this you are ready to go! You can add any other UI components you want via IBOutlets or directly by code.

Note: Create your `OnboardingViewController` subclass and set the presenter property to an instance of your presenter's class. This must be done **before** calling super.viewDidLoad(), otherwise you will not see the onboarding view.

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
So… know that you meet Ahoy, you will be able to create incredible onboarding experiences, following just a few and easy steps, letting you focus in the real core app functionalities.

We hope you find this post as a good introduction to the Ahoy library. On GitHub you will find an everything to get started or if you want to collaborate, feel free to contribute to this little but helpful [library](https://github.com/xmartlabs/Ahoy).
