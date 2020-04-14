---
layout: post
title: Introducing Android Snapshot Plugin
date: 2019-04-18 12:00:00
author: Matías Irland
categories: [Android, Gradle Plugin, Snapshot, Google Play, Fabric Beta]
author_id: mirland
show: true
---

We're happy to announce the release of [**Android Snapshot Publisher**, our first open source Android Gradle Plugin](https://github.com/xmartlabs/android-snapshot-publisher), a plugin to **create Android Snapshot versions** in the simplest way we know!

Here at [Xmartlabs](https://xmartlabs.com/) we love engineering new products, adding new features to existing ones and also improving and fixing up our client's apps.
Our awesome clients are oftentimes so excited about the work we do that they want to try it ASAP.
Furthermore, our QA team or even other team members could also be anxiously waiting for our changes to be deployed to test them themselves.
That's why we prepare and deliver new *Snapshot Builds* as soon as possible.

Do you find this familiar? If you do, you probably know that preparing and distributing new builds is not too hard but can take up valuable time.
Nowadays, the CI/CD servers are of great help as they can compile and deliver our applications with ease.
Additionally, they let you schedule tasks so you don't have to care about tests or linter checks running, they will simply be executed before every deployment.

However, there's always some work that must be done before releasing a new build.
In my opinion, two of the most important tasks we have to perform before deploying any build are:
1. Adding information to track possible issues.
For example, if a crash happens, you'll want to know which was the specific build that caused that crash.
1. Generating reasonable release notes (including a changelog) to be aware of what changed with respect to previous versions.
This is essential as you must communicate what should be tested.

We've already discussed [how we can do some of these tasks in a Jenkins-specific way](/2017/10/02/Release-Snapshot-Versions-In-Jenkins/).
In this blogpost we introduce a different approach that's platform agnostic.
[**Android Snapshot Publisher Gradle plugin**](https://github.com/xmartlabs/android-snapshot-publisher) is a plugin to prepare and distribute snapshot builds in a simple and common way.

## What're the plugin's main features?

It was designed to **prepare and distribute Android Snapshot builds**.

The main features of the preparation process are:
- Update the Android Version Name to keep track of the distributed versions.
The default behavior appends the commit identifier to the Android Version name. For instance, a version name may look similar to `1.0.2-b799fbc`.
- Create and customize rich release notes based on Git's history.

After this preparation work, the plugin will proceed to compile and publish the snapshot build.
Currently, the available distribution sources are:
- [Google Play](https://play.google.com/apps/publish)
- [Fabric Beta](https://docs.fabric.io/android/beta/overview.html)


Here's an illustration of the process:
<div class="separator" style="clear: both; text-align: center;">
    <img  border="0" src="/images/android-snapshot-plugin/snapshot-sample.png" />
</div>
<br/>


## What is the preparation work based on?

The plugin makes good use of your project's Git repository to perform the prep work.
To get the most out of this plugin, you have to be as neat as you can when managing it.
My team typically follows a simple but nice Git flow.
We have two main branches: `master` which contains the production code and `develop` which contains the newest changes that have not been released to production yet.
Then, if we want to add a new feature or fix an existing issue, we create a new branch from `develop` and start coding!
The next step is to create a new pull request, and wait for the reviewers to review the code we want to merge.
After we get approval, we can integrate our changes into the `develop` branch. But, how should we really integrate them?
GitHub provides 3 predefined ways to do that, "Merge", "Rebase and Merge" or "Squash and Merge" (if you are not using GitHub you can just use Git's commands to get the same result).
Based on how the branch was created it could contain multiple commits but all of them related to only one feature or fix.
So the main value of that branch is the feature or fix you are introducing.
For this reason, some time ago we decided to start using the "Squash and Merge" option, together with a good and descriptive message.
The key to this flow is that if you check the Git history of your main branches, each commit has an understandable and important value.
This was just an introduction to our Git flow, following it is not mandatory to use this plugin.
However, if you use a similar flow where each commit is of value and has a descriptive message, your **Snapshot Build** will be great!

## How to get started?

The first step is to [include the plugin dependency in your project and apply it in your Android module](https://github.com/xmartlabs/android-snapshot-publisher#installation). It's the typical setup of any plugin.

Then, the plugin defines a `snapshotPublisher` block where you can customize your configuration alongside the Android modules.

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
`releaseNotes`: Defines the release notes customizations.
`fabric`: Defines the configuration needed to deploy the artifacts in Fabric's Beta.
`googlePlay`: Defines the configuration needed to deploy the artifacts in Google Play.

You can read more about each of the blocks in the [project's GitHub Repository](https://github.com/xmartlabs/android-snapshot-publisher#setup), but I promise you that the setup is really easy.

After the setup process is finished, the plugin defines some Gradle tasks that can be run.
The naming convention is as follows: `[action][Variant][BuildType]`.
For example, `publishSnapshotGooglePlayStagingRelease` will be generated if the app has a `staging` variant and `release` build type.

To find available tasks, run `./gradlew tasks` and look under the "Snapshot Publishing" section.

The main available tasks are:

- `publishSnapshotFabric[Variant][BuildType]`: it'll publish a snapshot version in Fabric's Beta.
- `publishSnapshotGooglePlay[Variant][BuildType]`: it'll publish a snapshot version in Google Play.

## Conclusion

This project was designed to release quick and valuable builds without wasting your time.
One of the most interesting features is that you can integrate it easily with a CI/CD server.
For instance, you could schedule a build every night or you could subscribe to some GitHub hook and perform the release after a merge is made or a Git tag created.
We're currently using it and it's helping us a lot.
We are glad that we don't end up spending significant time with releases, our coworkers are happy because they can try the latest version of our different apps and the clients are pleased to receive builds more frequently than ever before. It's a win-win-win! 😄
For all these reasons and more, we recommend you give it a try and then tell us what are your thoughts!
