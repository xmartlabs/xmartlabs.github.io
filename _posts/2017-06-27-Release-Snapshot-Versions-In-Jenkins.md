---
layout: post
title:  Release snapshot versions automatically in Jenkins
date:   2017-01-30 10:23:24
author: Matías Irland
categories: Android,Server,CI,Jenkins
author_id: mirland

---

Today I want to show how we can release `SNAPSHOT` versions using [Beta by Fabric](https://docs.fabric.io/android/beta/overview.html).
Have you ever been in a situation where you release new features between long periods of time and find yourself with tons of bugs to deal with? This process could be a lot smoother if you consider each change you merge into your *main development branch* to be ready for release. Once you're at that stage, you could automatically and effortlessly generate and release a new build of your application for each merge, that could be tested earlier. Moreover, you could run tests, check lints and any other task you normally do, automatically (Yes, magic, i know ;)). That's the beauty of having a CI server. It could "change your life".

We're going to use `Jenkins`, an amazing CI server, to help us release each one of those changes. Each release generates what is called a `SNAPSHOT`. Our goal is to release something that is useful, not just the build. For that reason, we'll need the following `Jenkins` plugins to get started: 

First of all, lets check which [jenkins plugins](https://wiki.jenkins.io/display/JENKINS/Plugins) will be required for this work:
1. [EnvInject Plugin](https://wiki.jenkins.io/display/JENKINS/EnvInject+Plugin)
2. [Conditional BuildStep Plugin](https://wiki.jenkins.io/display/JENKINS/Conditional+BuildStep+Plugin)
3. [Fabric Beta Publisher Plugin](https://wiki.jenkins.io/display/JENKINS/Fabric+Beta+Publisher+Plugin)


Well, now we're ready to go.

Firstly, in order to release a new `SNAPSHOT`, we need to do some work:
* Check that the build branch is `develop`
* Update the build `versionName` in order to track possible issues with the right version. In this example the version name will be built using the app current `versionName`, plus the current hash of the commit.
* Create a release note file, including for example:
  * Commit message
  * Author name  
  * Last 10 commits (in order to see what are the last changes introduced)
  * And all things that you want

In order to make this work, we should create a new "Execute shell" build task before the compilation, run tests, check lints and that stuff.

<!-- Image with the code -->
***Pending Image***

This script is public in [github](https://gist.github.com/matir91/5a8c24196c0fd4408adaabfdab6f198a)

Afterwards, we have to add the `Invoke gradle script` build task, which should have all gradle tasks that we usually do (compile, run tests, check lints, etc.). In addition, we should add a new gradle task, in order to make the release apk. However, we should be careful, it should only be done if the current build is from the `develop` branch. In consequence, we have to define another build task to compile the new release build if the new commit comes from the `develop` branch.

First of all, we should inject the properties file that we created in the system environment variables. To do that, we will use the  [EnvInject Plugin](https://wiki.jenkins.io/display/JENKINS/EnvInject+Plugin).
 
<!-- Image with the code -->
***Pending Image***

Then we should add a conditional build task, in order to generate the release apk only if build branch is `develop`. For this, we will use the [Conditional BuildStep Plugin](https://wiki.jenkins.io/display/JENKINS/Conditional+BuildStep+Plugin).

<!-- Image with the code -->
***Pending Image***

Now that all "Build" actions were done, we have to add a new "Post-Build Action" in order to release the build using Beta. In this case, we'll use 2 plugins,  [Conditional BuildStep Plugin](https://wiki.jenkins.io/display/JENKINS/Conditional+BuildStep+Plugin) to check that the build branch is `develop` and [Fabric Beta Publisher Plugin](https://wiki.jenkins.io/display/JENKINS/Fabric+Beta+Publisher+Plugin) to upload the build. Furthermore, we will save the generated apk in the release build information using the "Archive the artifacts" post-build task.

<!-- Image with the code -->
***Pending Image***

Using this configuration, the `SNAPSHOT` build will be uploaded, will have useful release notes and all your team will be notified. 

By doing this, you will be releasing each new feature ASAP with NO effort at all, and anyone could test it to find bugs at an earlier stage, as well as making it easier to find them.

