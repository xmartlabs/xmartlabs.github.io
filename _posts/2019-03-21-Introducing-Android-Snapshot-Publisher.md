---
layout: post
title: Introducing Android Snapshot Plugin
date: 2019-03-20 12:00:00
author: Matías Irland
categories: Android, Gradle Plugin, Snapshot, Google Play, Fabric Beta
author_id: mirland

---

We're happy to announce the release of our first [open source **Gradle Android Plugin**](https://github.com/xmartlabs/android-snapshot-publisher), a plugin to **create Android Snapshot versions** in the simplest way that we know!

Here at [Xmartlabs](https://www.xmartlabs.com/) we love to create new product, add new features, improve our client apps and fix the existing issues.
On the other side are our clients, who want to get a try our work ASAP.
Moreover, the QA department or some team members could be waiting for our deploy to test the changes.
So we try to prepare and deliver new *Snapshot Builds* as soon as possible.

Does it your case? If that's true, you may know that prepare and distribute new builds is not so hard but it could take you same valuable time.
Nowadays the CI/CD servers are helping us a lot, they can compile and deliver our applications easily.
Furthermore, they let you to don't waste your time waiting for test process or lint checks, you just schedule the task and you know that the deploy will be executed successfully.

However, you may know that some pre-work must be done before releasing a new build.
In my opinion the two most important tasks that we have to do before deploy all builds are:
1. Add information to track possible issues.
For example if a crash happened you must know which was the build that caused that crash.
1. Generate a good release notes including a changelog to check what changed.
It's so important because you have to communicate what should be tasted.

Based on that, we decided to create our [**Gradle Android Snapshot Publisher plugin!**](https://github.com/xmartlabs/android-snapshot-publisher)

## Which are the main features of this plugin?

It was designed to **prepare and distribute Android Snapshot builds**.

The main features of the preparation process are:
- Update the Android Version Name to keep track of the distributed versions.
The default behavior adds the commit identifier to the Android Version name, for instance a version name may looks similar to `1.0.2-b799fbc`.
- Create and customize rich release notes based on git's history.

After this pre-work is made, the plugin proceed to compile and publish the snapshot build.
Currently the available sources to deploy the build are:
- [Google Play](https://play.google.com/apps/publish)
- [Fabric Beta](https://docs.fabric.io/android/beta/overview.html)


The next picture shown an example of how the plugin prepared and deployed in Fabric Beta an snapshot version of a typical app.
***MOCK AN IMAGE***

## What is the preparation step based on?

The plugin makes a good use of your project's git repository to perform the preparation step.
To get the most out of this plugin, you have to be as neat as you can when managing the git repository.
In my team, we are following a simple but nice git flow.
We have two main branches, `master` which contains the production code and `develop` which contains the newest changes that have not been released yet.
Then, if we want to add a new feature or fixing an existing issue, we create a new branch from `develop` and we start coding!
The next step is to create a new pull request, and wait for the reviewers.
After we get approval, we can integrate our changes in the `develop` branch, but how should we integrate these changes? 
GitHub provides 3 ways of do that, "Merge", "Rebase and Merge" or "Squash and Merge", but if you are not using GitHub you can just use Git's commands to get the same result.
Based on how we created the branch, the branch could contains multiple commits, but only one feature or fix.
So the main value of that branch is the feature that you are introducing or the fix that you are adding.
For this reason, some time ago we decided to start using the "Squash and Merge" option, usually together with a good and descriptive message.
The key of this flow is that if you check the git history of your main branches, each commit has an understandable and important value.

## How to get started?

The first step is to [include the plugin dependency in your project and apply it in your Android module](https://github.com/xmartlabs/android-snapshot-publisher#installation), it's the typical setup of any plugin.

Then, the plugin defines a `snapshotPublisher` block where you can add the different setup alongside the Android modules.

```groovy
snapshotPublisher {
    version {
        // Version customization
    }
    releaseNotes {
        // Release notes customization
    }
    fabric {
        // Fabric Beta setup
    }
    googlePlay {
        // Google Play setup
    }
}
```

`version`: Defines the Android Version Name customizations for the delivered build.
The default value is the current version name and the short-hash commit, joined by a hyphen.
`releaseNotes`: Define the release notes customizations.
`fabric`: Defines the configuration needed to deploy the artifacts in Fabric's Beta.
`googlePlay`: Defines the configuration needed to deploy the artifacts in Google Play.

You can read the more about each block in the [project's GitHub Repository](https://github.com/xmartlabs/android-snapshot-publisher#setup), but I promise you that the setup is really easy.


## Conclusion

This project was designed to release hot builds quickly and easily without wasting your time.
One of the most interesting features of it, is that you can integrate it easily with the CI/CD servers.
You can schedule a build each day or you can subscribe to some GitHub hook, for instance you can perform the release after a merge is made to some specific branch or when a git tag is created.
We're currently using it and it's helping a lot.
We are happy because we don't spend time in releases, our coworkers are happy because they can try the newest version of our different applications and the clients are happy because they are receiving build with much more frequency than before.
For all of these and more I recommend you to give it a try and then tell me what do you think!
