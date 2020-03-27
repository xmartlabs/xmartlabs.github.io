---
layout: post
title: "Make your iOS development workflow faster through Fastlane automate tasks and CI"
date: 2020-03-25 10:00:00
author: Martin Barreto
categories: CI, fastlane, bitrise
author_id: mtnBarreto
featured_position: 1
featured_image: /images/tflite_coreml/featured.png
---

The only way to move faster in a dynamic environment is to automate everything repetitive and time consuming.
There are many task we can automate in a common development workflow, in this post i would like to talk about how our iOS team uses Fastlane and bitrise to automate the creation of testflight releases, but also how we are able to implement features and rely that we are not introducing any error in what we have already working.


### What's Fastlane

Basically Fastlane is a open source that simplify and speed up development process by allowing the team to automate development workflows. It has continues integration support with many CI platforms like Bitrise, circleCI, Jenkins, travisCI among others.

### What's Bitrise

Bitrise allows us to do Continues integration and Continues delivery as a services.



> This blog is not intended to explain these concepts but how we configure and set up these tools to optimize our development workflow. See their respective website and documentation to know more about each tool.


### So, why automate integrations and releases.

There are several reasons but the most important are:

1. Definition of development workflow. Consistency on frequency or triggers that execute the automate tasks.
2. Save Time and money. Nobody in a engineering team likes to do repetity tasks. We have more time/money to invest on what's really matters.


## How to set un Fastlane in a iOS project.

> we consider you have already installed Fastlane in your computer. If not see Fastlane documentation and get back to this point.

Once we have fastlane installed we can  

Navigate your terminal to your project's directory and run:

```
fastlane init
```

This will create several fastlane conf file, the most important is `Fastfile` file which stores the automation configuration within that you'll see different lanes. Each is there to automate a different task, like screenshots, code signing, or pushing new releases.

We can add as many lanes as we need. Each lane automate some development process and can be run through a command `fastlane <lane_name>`.
So let's create a test lane in order to run the unit tests by runing `fastlane test`.

```ruby
desc "Runs all the tests"
lane :test do
  xctest(
    clean: false,
    code_coverage: true,
    scheme: "chefsfeed",
    workspace: "chefsfeed.xcworkspace",
    destination: "name=iPhone 11,OS=13.3"
  )
end
```

> xctest is a build-in fastlane action available to everyone that uses Xcode command tools and run Xcode tests.

So now we can run test our test by running `fastlane tests`. This is fine bit there is no additional benefits compared with runnings test from Xcode.
Now we want to automatically trigger this lane whenever any developer create a pull request in out git remote repository. To do so we are going to use Bitrise which allows us to do Continues integrations and continue delivery as a Sass.

In short Bitrise allows the developer to create workflows, a secuence of tasks that run one at time. Bitrise also provides triggers that execute a workflow whenever a tag, pull request or push is performed in a remote git repository.


<img width="100%" src="/images/ios-fastlane-ci/triggers.png" />


We still need to define our pr workflow that will run `fastlane tests`. As we said a workflow is a sequence of task that will run one after another. Bitrise provides the computer hardware with basic configuration and setup like Xcode and cocoapods and some other tools. We only need to define the workflow, basically we need the define the sequence of tasks that belongs to the workflow.

We would said that first step is to clone the repository, Bitrise already provides a task to do so named `Git Clone Repository`.

We have also to install any needed tool not provided by default in [Bitrise environment stack](https://github.com/bitrise-io/bitrise.io/blob/master/system_reports/osx-xcode-11.3.x.log). It could be a missing functionality or we may need another version.
Even though fastlane is part of the Bitrise stack I'm using a newer version so i'm gonna install it. We will also update cocoapods repo. We can do so by adding a new step to the workflow that run a script named 'Do anything with Script step'.

Below you can see the content of the script.
```
#!/usr/bin/env bash
# fail if any commands fails
set -e
# debug log
set -x

# write your script here
gem update cocoapods
pod repo update

set -ex
gem install fastlane --version 2.142.0 --no-document
```


Then we need to run our fastlane lane, Bitrise also provides a Workflow task to accomplish this named `fastlane` where we only need to specify the name of our fastlane lane: `test`.

Here is the entire workflow already created in bitrise.

<img width="100%" src="/images/ios-fastlane-ci/workflow.png" />


At this point `test` lane will be executed whenever a pull request is created/updated. cool right? Bitrise integrates with github/bitbucket and other git solutions to indicate if everything goes well or not.


Other automated task we strongly use is the release of new versions. Basically we send a new build wheneve a new tag (named <version_*>) is created in github. As we said Bitrise provides push, pull request and tag triggers, this time we are going to use tag triggers.

Then we need to automate the task in fastline.  
