---
layout: post
title:  Easy Continuous Delivery in Android with Jenkins
date:   2017-20-02 09:00:00
author: Matías Irland
categories: Android,Server,CI,Jenkins,Fabric
author_id: mirland

---

Today I want to show how we can release Android *SNAPSHOT* versions using [Beta by Fabric](https://docs.fabric.io/android/beta/overview.html).
Have you ever been in a situation where you release new features between long periods of time and find yourself with tons of bugs to deal with? The process could be a lot smoother if you consider each change you merge into your main development branch to be ready for release. Once you're at that stage, you could automatically and effortlessly generate and release a new build of your application for each merge, that could be tested earlier. Moreover, you could run tests, check lints and any other task you normally do, automatically (yes, magic, I know ;). That's the beauty of having a CI/CD server. It could "change your life".

We're going to use _Jenkins_, an amazing CI/CD server, to help us release each one of those changes. Each release generates what is called a _SNAPSHOT_. Our goal is to release something that is useful, not just the build. For that reason, we'll need the following _Jenkins_ plugins to get started: 

First of all, let's check which [Jenkins plugins](https://wiki.jenkins.io/display/JENKINS/Plugins) will be required for the work:

1. [EnvInject Plugin](https://wiki.jenkins.io/display/JENKINS/EnvInject+Plugin)
2. [Conditional BuildStep Plugin](https://wiki.jenkins.io/display/JENKINS/Conditional+BuildStep+Plugin)
3. [Flexible Publish Plugin](https://wiki.jenkins.io/display/JENKINS/Flexible+Publish+Plugin)
4. [Fabric Beta Publisher Plugin](https://wiki.jenkins.io/display/JENKINS/Fabric+Beta+Publisher+Plugin)


Well, now we're ready to go.

Firstly, in order to release a new _SNAPSHOT_, we need to do some work:

* Check that the build branch is _develop_ (or the one you use for main development)
* Update the build _versionName_ in order to track possible issues with the right version. In this example the version name will be built using the app current _versionName_, plus the current hash of the commit.
* Create a release note file, including for example:
  * Commit message
  * Author name  
  * Last 10 commits (in order to see what are the last changes introduced)
  * And all things that you want

In order to make this work, we should create a new "Execute shell" build task before the compilation, run tests, check lints and that stuff.

<img src="/images/jenkins-snapshot/1-shell_script.png" />

This [script is public on GitHub](https://gist.github.com/matir91/5a8c24196c0fd4408adaabfdab6f198a)

Afterwards, we have to add the _Invoke gradle script_ build task, which should have all gradle tasks that we usually do (compile, run tests, check lints, etc.). In addition, we should add a new gradle task, in order to make the release apk. However, we should be careful, it should only be done if the current build is from the _develop_ branch. In consequence, we have to define another build task to compile the new release build if the new commit comes from the _develop_ branch.

First of all, we should inject the properties file that we created in the system environment variables. To do that, we will use the  [EnvInject Plugin](https://wiki.jenkins.io/display/JENKINS/EnvInject+Plugin).
 
<img src="/images/jenkins-snapshot/2-inject_variables.png" />

Then we should add a conditional build task, in order to generate the release apk only if build branch is _develop_. For this, we will use the [Conditional BuildStep Plugin](https://wiki.jenkins.io/display/JENKINS/Conditional+BuildStep+Plugin).

<img src="/images/jenkins-snapshot/3-build.png" />

Now that all "Build" actions have been done, we have to add a new "Post-Build Action" in order to release the build using Beta. In this case, we'll use 2 plugins,  [Flexible Publish Plugin](https://wiki.jenkins.io/display/JENKINS/Flexible+Publish+Plugin) to check that the build branch is _develop_ and [Fabric Beta Publisher Plugin](https://wiki.jenkins.io/display/JENKINS/Fabric+Beta+Publisher+Plugin) to upload the build. Furthermore, we will save the generated apk in the release build information using the "Archive the artifacts" post-build task.

<img src="/images/jenkins-snapshot/4-release.png" />

Using this configuration, the _SNAPSHOT_ build will be uploaded, will have useful release notes and all your team will be notified. 

By doing this, you will be releasing each new feature asap with *no* effort at all, and anyone will be able to test it to find bugs at an earlier stage, as well as making it easier to find them.
