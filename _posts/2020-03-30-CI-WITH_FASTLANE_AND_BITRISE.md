---
layout: post
title: "Make your iOS development workflow faster through Fastlane automate tasks and Bitrise CI & CD"
date: 2020-03-25 10:00:00
author: Martin Barreto
categories: CI, fastlane, bitrise
author_id: mtnBarreto
featured_position: 1
featured_image: /images/tflite_coreml/featured.png
---

The only way to move faster in a dynamic environment is to automate everything repetitive and time consuming.
There are many task we can automate in a common development workflow, in this post i would like to talk about how our iOS team uses [Fastlane](https://https://fastlane.tools/) and [Bitrise](https://www.bitrise.io/) to automate the app release to testflight, but also how we are able to make sure we are not introducing error in already implemented functionality.


### What's Fastlane

Basically Fastlane is a open source that simplify and speed up development process by allowing the team to automate development workflows. It has continues integration support with many CI platforms like Bitrise, circleCI, Jenkins, travisCI among others.

### What's Bitrise

Bitrise allows us to do continues integration and continues delivery as a services.

> This blog is not intended to explain these concepts but how we configure and set up these tools to optimize our development workflow. See their respective website and documentation to know more about each tool.


### So, why automate integrations and releases.

There are several reasons but the most important are:

1. Definition of development workflow. Consistency on frequency or triggers that execute the automate tasks like testing and release.
2. Save Time and money. Nobody in a engineering team likes to do repetity tasks. We have more time/money to invest on what's really matters.


## How to set un Fastlane in a iOS project.

> we consider you have already installed Fastlane in your computer. If not see Fastlane documentation and get back to this point.

Navigate in your terminal to your iOS project's directory and run:

```bash
fastlane init
```

This will create several fastlane config files, the most important is `Fastfile` file which stores the automation configuration within that you'll see different lanes. Each lane is there to automate a different task, like screenshots, code signing, or pushing new releases.

We can add as many lanes as we need. Each lane automate a development process and can be run through a command `fastlane <lane_name>`.
So let's create a test lane in order to run nit tests by running `fastlane test`.

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

So now we can run our ios project tests by running `fastlane tests`.

Now we want to automatically trigger this lane whenever any developer create a pull request in our git remote repository. To do so we are going to use Bitrise which allows us to do continues integrations and continue delivery as a service.

In short Bitrise allows the developer to create workflows, a sequence of tasks that run one per time until it fails or completes. Bitrise also provides triggers that execute a workflow whenever a git tag, pull request or push is performed in a remote git repository.


<img width="100%" src="/images/ios-fastlane-ci/triggers.png" />


We still need to define our `pr` workflow that should run `fastlane tests`. As we said a workflow is a sequence of task that will run one after another. Bitrise provides the computer hardware with basic configuration and setup like Xcode and cocoapods and some other tools. We only need to define the workflow, which means we need to define the sequence of tasks that belongs to the workflow.

We would said that first step is to clone the repository, Bitrise already provides a task to do so named `Git Clone Repository`.

We also have to install any needed tool not provided by default in [Bitrise environment stack](https://github.com/bitrise-io/bitrise.io/blob/master/system_reports/osx-xcode-11.3.x.log). It could be a missing functionality or we might need another version for a particular tool.
Even though fastlane is part of the Bitrise stack I'm using a newer version so i'm gonna install it. We will also update cocoapods repo. We can do so by adding a new step to the workflow that run a script named 'Do anything with Script step'.

Below you can see the content of the script.

```bash
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


Then we need to run our fastlane lane, Bitrise also provides a Workflow task to accomplish this named `fastlane` where we only need to specify the name of our fastlane lane which is `test`.

Here is the entire workflow already created in Bitrise.

<img width="100%" src="/images/ios-fastlane-ci/workflow.png" />


At this point `test` lane will be executed whenever a pull request is created/updated. cool right? Bitrise integrates with github/bitbucket and many other git solutions to indicate if everything goes well or not.


Another automated task we strongly use is the release of new versions. Basically we send a new build to testflight whenever a new tag (named <version_*>) is created in github. As we said Bitrise provides push, pull request and tag triggers, this time we are going to use tag triggers.

The most important task to set up the bitrise workflow is running the `release_appstore` lane, all the rest are tasks dedicated to clone the repo, and set up the environment are the same as `pr` workflow.

Let's create the bitrise `testflight` workflow first.

<img width="100%" src="/images/ios-fastlane-ci/addNewWorkflow.gif" />

The most important workflow task is the execution of `release_appstore` lane.

Now let's see how to implement fastlane `release_appstore` lane...

```ruby
lane :release_appstore  do

  build_type = "AppStore"
  build_app_id = ENV["APP_BUNDLE_ID"]
  build_sign_team_id = ENV["APP_SIGN_TEAM_ID"]
  build_sign_profile_name = ENV["APP_APPSTORE_SIGN_PROFILE_NAME"]
  build_sign_certificate_name = ENV["APP_APPSTORE_SIGN_CERTIFICATE_NAME"]

  build_folder = Time.now.strftime("%Y.%m.%d-%H.%M.%S+") + Random.rand(20).to_s
  build_derived_data_path = "./fastlane/builds/#{build_type}/#{build_folder}/derived_data/"
  build_output_path = "./fastlane/builds/#{build_type}/#{build_folder}/artifacts/"
  build_output_name = "chefsfeed_" + build_type

  # `automatic_code_signing` configures Xcode's Codesigning options.
  automatic_code_signing(
    use_automatic_signing: false,
    path: "chefsfeed.xcodeproj",
    team_id: build_sign_team_id,
    profile_name: build_sign_profile_name,
    code_sign_identity: build_sign_certificate_name,
    targets: ["chefsfeed"]
  )

  #`cocoapods` runs pod install for the project.
  cocoapods(
    try_repo_update_on_error: true
  )

  #`build_ios_app` Easily build and sign your iOS app.
  build_ios_app(
    workspace: "chefsfeed.xcworkspace",
    configuration: "Release",
    scheme: "chefsfeed",
    clean: true,
    output_name: build_output_name,
    output_directory: build_output_path,
    derived_data_path: build_derived_data_path,
    build_path: build_output_path,
    include_bitcode: true,
    include_symbols: true,
    export_options: {
      compileBitcode: false,
      uploadBitcode: false,
      uploadSymbols: true,
      signingStyle: "manual",
      method: "app-store",
      teamID: build_sign_team_id,
      provisioningProfiles: {
        "com.credibleinc.chefsfeed": "ChefsFeed Distribution",
        "com.credibleinc.chefsfeed.chefsfeed-notification-content-extension": "ChefsFeed Notification Content Distribution",
        "com.credibleinc.chefsfeed.chefsfeed-notification-service-extension": "ChefsFeed Notification Service Distribution",
      }
    }
  )

  #deliver uploads screenshots, metadata and binaries to App Store Connect. Use deliver to submit your app for App Store review.
  deliver(skip_screenshots: true, skip_metadata: true, skip_app_version_update: true)

end
```

Explain each parameter and detail of each fastlane action is out of the scope of this blogpost. I added a short comment inline in the code above to indicate the propose of each action. Please visit each fastlane action documentation reference if needed.

Now we a new TestFlight app version will be released each time we create a new tag named `version_<number>`.


Although we can accomplish the same result just using Bitrise tasks, we prefer to use it in combination with Fastlane due to the following reasons:

1. Anyone in the team can run fastlane lanes locally without the need of having CI/CD as a service.
2. We have more freedom to change our CI/CD platform at any time. Actually each customer has its own CI/CD preference. Migrating to another CI/CD platform like github Action, travis should be very straightforward since we just need to run the fastlane lane.



Well guys, hope you have seen the benefits of having these automated tasks.
This is all I have to share in this post. See you in the next one!
