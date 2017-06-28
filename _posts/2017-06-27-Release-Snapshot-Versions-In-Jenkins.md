---
layout: post
title:  Release snapshot versions automatically in Jenkins
date:   2017-01-30 10:23:24
author: Matías Irland
categories: Android,Server,CI,Jenkins
author_id: mirland

---

Everyone knows that, if you are a developer, a CI server could "change your life". Currently in the Xmartlabs Android team, we are using jenkins, which is an amazing tool, and it's helping us in all our build tasks.

Today I want to tell you how we can release `SNAPSHOT` versions using [Beta of Fabric](https://docs.fabric.io/android/beta/overview.html). 
Suppose that in your git repository, you have a `develop` branch, which is the *main branch* of this repository, which has all changes ready to release. However, most of us usually group a bunch of features or maybe we wait to introduce a "big" change before make release. The main thing here, is that we have changes ready to release, which could be tested for you or for some guy of your team, but they are not released, mainly for the required effort or for the time consumed. If it's your situation, this post could be useful for you.

First of all, let we check which [jenkins plugins](https://wiki.jenkins.io/display/JENKINS/Plugins) will be required for this work:
1. [EnvInject Plugin](https://wiki.jenkins.io/display/JENKINS/EnvInject+Plugin)
2. [Conditional BuildStep Plugin](https://wiki.jenkins.io/display/JENKINS/Conditional+BuildStep+Plugin)
3. [Fabric Beta Publisher Plugin](https://wiki.jenkins.io/display/JENKINS/Fabric+Beta+Publisher+Plugin)


Well, now we're ready to go.

In order to release a new `SNAPSHOT` version, first of all we should make some work:
* Check that the build branch is `develop`
* Update the build `versionName` in order to track possible issues with the right version, in this example the version name will be built using the app current versionName, plus the current hash of the commit.
* Create a release note file, including for example:
  * Commit message
  * Author name  
  * Last 10 commits (in order to see what are the last changes introduced)
  * And all things that you want

In order to make this work, we should create a new "Execute shell" build task before the compilation, run tests, check lints and that stuff.

<!-- Image with the code -->
***Pending Image***

This script is public in [github](https://gist.github.com/matir91/5a8c24196c0fd4408adaabfdab6f198a)

After that we have to add the `Invoke gradle script` build task, which should have all gradle tasks that we usually do (compile, run tests, check lints, etc.). Additional we should add a new gradle task, in order to make the release apk. However, we should be careful, it should be done only if the current build is from the `develop` branch. So we have to define another build task to compile the new release build, if the new commit comes from the `develop` branch.

First of all, we should inject the properties file that we made in the system environment variables. For that, we will use the  [EnvInject Plugin](https://wiki.jenkins.io/display/JENKINS/EnvInject+Plugin).
 
<!-- Image with the code -->
***Pending Image***

Then we should add a conditional build task, in order to generate the release apk only if build branch is `develop`. For doing that, we will use the [Conditional BuildStep Plugin](https://wiki.jenkins.io/display/JENKINS/Conditional+BuildStep+Plugin).

<!-- Image with the code -->
***Pending Image***

Now all "Build" actions were made, so now we have to add a new "Post-Build Action" in order to release the build using Beta. For that we will use 2 plugins,  [Conditional BuildStep Plugin](https://wiki.jenkins.io/display/JENKINS/Conditional+BuildStep+Plugin) to check that the build branch is `develop` and [Fabric Beta Publisher Plugin](https://wiki.jenkins.io/display/JENKINS/Fabric+Beta+Publisher+Plugin) to upload the build. Furthermore, we will save the generated apk in the release build information using the "Archive the artifacts" post-build task.

<!-- Image with the code -->
***Pending Image***

Using this configuration, the `SNAPSHOT` build will be upload, it will have a useful release notes and all your team will be notified. 

So, by doing this, you will be releasing each new feature ASAP without effort and somebody could test it and maybe finding a bug could be much easier.

