---
layout: post
title:  "CI & automatic deployment to iTunes with Xcode Server"
date:   2016-02-19 17:22:12
author: Miguel Revetria
categories: Server,CI
author_id: remer
---

In this post I'm going to write about my experience and the problems I found when setting up Xcode Server for CI and automatic deployment to iTunes at Xmartlabs. I'm going to let you know how I could solve some problems hoping it may help somebody in the same situation. There are a lot of blogs that explain how to set up Xcode Server, create an integration bot and explore the results on Xcode (issue tracking, tests code coverage, etc). Getting help on these points are useful when starting, but at the same time it's pretty easy to get them working. Also, when you try to make something more sophisticated, you may get some errors and won't be able to find many resources for a solution.

**TODO: Describir las ventajas de CI**

* detectar rapidamente posibles errores introducidos
* scrum releases on each sprint take a lot of time
* cualquiera puede armar el build

Why did we try to setup our CI server? Well, almost everybody knows the advantages of having a CI server; server can automatically build your project when somebody pushes some change, perform tests, detect any issue on latest commits very quick, notify results only to interested people, and a long list of etc. Additionally, all of these popular features are now included within Xcode! We though that would be really nice to give it a try... later we proved that not everything was going to be so easy. But finally, we got our bots running, building, testing, creating releases, committing tags and **uploading builds to iTunes**. A happy ending for this story.

## Setting up the server

The guide [Xcode Server and Continuous Integration Guide](https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/xcode_guide-continuous_integration/) from Apple will give you a good introduction on how to setup and use Xcode Server. I recommend you to read the guide first because I am not going to deep into the basics of setting up Xcode Server.

After we have installed the Server app and enabled Xcode service, we have to install [Cocoapods](https://cocoapods.org/) and [Fastlane](https://fastlane.tools/). These are the tools that we usually use at Xmartlabs. Fastlane will help us with many common tasks that are necessary in order to build a project and upload the result to iTunes Connect. To prevent permissions issues we will install all the gems just for the builder user using `gem install --user-install some_gem`. Additionally we need to create a symlink to Cocoapods and Fastlane binaries in order to access them when running a trigger from our bot.

Before start, add ruby bin folder to builder's path - depending on the ruby's version - add `export PATH="$PATH:/var/_xcsbuildd/.gem/ruby/2.0.0/bin"` to `~/.bashrc` and `~/.bash_login`. Now let's install these gems:

{% highlight shell %}
$ sudo su - _xcsbuildd

$ gem install --user-install cocoapods
$ pod setup
$ ln -s `which pod` /Applications/Xcode.app/Contents/Developer/usr/bin/pod

$ gem install --user-install fastlane
$ ln -s `which fastlane` /Applications/Xcode.app/Contents/Developer/usr/bin/fastlane
{% endhighlight %}

A nice Xcode Server feature is the ability to send an email to selected people depending on the integration result. For example, if the integration fails because the project is not compiling, or some tests are not passing, the bot can send an email to the last committers notifying that the build has been broken. If you are planning to use a Gmail account to send emails, you have to change the settings on the Mail service on Server app. First enable the Mail service on Server. Then check the option *Relay outgoing mail through ISP*, on the Relay option dialog you have to put `smtp.gmail.com:587` in *Outgoing Mail Relay*, enable authentication and enter valid credentials. That's all, you have set up your Server to send the email using your Gmail account.

![Mail setup](/images/remer-xcode-server/mail-setup.png)

## Creating the bots

At Xmartlabs we set up two bots for each Xcode project.

### Continuous Integration bot

Indented to make sure the project build properly and Unit & UI tests pass accordingly. Each time a pull request is merged into develop branch this bot is triggered. If something goes wrong committers are notified.

We can create the bot by following these steps:

1. Within Xcode project, select menu option Product > Create Bot.
2. Follow the creation wizard, it is not too hard to complete. You may encounter some difficulties when setting git credentials. I opted to create a ssh key and use it for my bot. So I ended up selecting ​*Existing SSH Keys*​ and using the same key for all my bots.
3. Integrate it and see if everything is OK.

![After trigger email](/images/remer-xcode-server/after-trigger-email.png)

> Something cool is that the email will be sent to all committers that may introduced some issue and you can specify additional receivers. We'd like to receive an email notification just when something went wrong.

### Deployer bot

Now we want our bot to be responsible for building and uploading the result of each build to iTunes Connect and for creating a git tag with the built time source code. We're going to use Fastlane to achieve this.

Typically, we create an additional bot to upload the app IPA to iTunes Connect thats runs on demand or scheduled weekly.

![Schedule](/images/remer-xcode-server/schedule-setup.png)

To build the IPA, we have to install required provisioning profiles and certificates in the correct place. Bots will search provisioning profiles in the folder `/Library/Developer/XcodeServer/ProvisioningProfiles`. As the bot runs on its own user `_xcsbuildd`, we have to ensure that distribution/development certificates and their associated private key are installed on the System Keychain.

![Keychain](/images/remer-xcode-server/keychain.png)

#### Prebuild steps

Before the bot start building the project we have to preform some additional tasks. These tasks will be run from a triggered command:

* Increase build number.
* Download provisioning profiles.
* Install the correct versions of the libraries used by the project.

Fastlane will take needed metadata for the building app from the `Appfile` file such as Apple Developer Portal id, our iTunes Connect id and the application identifier.

{% highlight ruby %}

apple_dev_portal_id "<my_email@server.com>"

team_name "<TEAM_NAME>"
team_id "<TEAM_ID>"

{% endhighlight %}

Downloading and configuring provisioning profiles is done by Fastlane [sigh](https://github.com/fastlane/sigh). Use it's really straightforward, just set up the `Appfile` correctly and with the Apple Developer Portal id and it'll do the rest.

The `prebuild` lane is defined in the `Fastfile` file as its shown below:

{% highlight ruby %}

lane :prebuild do
  # fetch the number of commits in the current branch
  build_number = number_of_commits

  # Set number of commits as the build number in the project's plist file before the bot actually start building the project.
  # This way, the generated archive will have the correct build number.
  set_info_plist_value(
    path: './MyApp-Info.plist',
    key: 'CFBundleVersion',
    value: "#{build_number}"
  )

  # Run `pod install`
  cocoapods

  # Download provisioning profiles for the app and copy them to the correct folder.
  sigh(output_path: '/Library/Developer/XcodeServer/ProvisioningProfiles', skip_install: true)
end

{% endhighlight %}

> `number_of_commits`, `cocoapods` and `cocoapods` are Fastlane actions. Both `Appfile` and `Fastfile` files must be within a `fastlane` folder in the root directory of your project.

If we run `fastlane ios prebuild`, it will connect to iOS Member Center and download the profiles for the app indicated by its bundle id in the `Appfile`. Additionally we have to pass the password to it, to make this work with Xcode bots we pass it through the environment variable `FASTLANE_PASSWORD`:

{% highlight shell %}
$ export FASTLANE_PASSWORD="<APPLE_DEV_PORTAL_PASSWORD>"
$ fastlane prebuild
{% endhighlight %}

> Initially we attempted to use Keychain to send passwords to Fastlane `sigh` but it doesn't work, for more information about this see [below](#attempting_to_developer_password_to_fastlane_tools)

We will modify the deployer bot by adding a before trigger command on the *Triggers* tab, that will call to `prebuild`.

![Before trigger](/images/remer-xcode-server/before-trigger.png)

> Note that before calling `fastlane`, we are changing the current directory by entering to `myapp`. That is the name of the branch. **Triggers run in the parent project folder**.

#### Postbuild steps

After the bot finish building the project we will be able to access the created archive file to export it as an IPA file and upload it to iTunes. We're going to create an additional lane which be in charge of upload the IPA to iTunes and create a git tag.

Let's start simple without taking care of the upload to iTunes Connect for now:

{% highlight ruby %}
lane :build do
  plistFile = './MyApp-Info.plist'

  # Get the build and version numbers from the project's plist file
  build_number = get_info_plist_value(
    path: plist_file,
    key: 'CFBundleVersion',
  )
  version_number = get_info_plist_value(
    path: plist_file,
    key: 'CFBundleShortVersionString',
  )

  # Commit changes done in the plist file
  git_commit(
    path: ["#{plistFile}"],
    message: "Version bump to #{version_number} (#{build_number}) by CI Builder"
  )

  # TODO: upload to iTunes Connect

  add_git_tag(
    tag: "beta/v#{version_number}_#{build_number}"
  )

  push_to_git_remote

  push_git_tags
end

{% endhighlight %}

Now we're going to export the IPA from archive created by the bot on the build by adding the command `xcrun xcodebuild` to the `build` lane. Additionally, we're going to upload the IPA to iTunes Connect using Fastlane [deliver](https://github.com/fastlane/deliver). See below:

{% highlight ruby %}

lane :build do
  plistFile = './MyApp-Info.plist'

  # ...

  ipa_folder = "#{ENV['XCS_DERIVED_DATA_DIR']}/deploy/#{version_number}.#{build_number}/"
  ipa_path = "#{ipa_folder}/#{target}.ipa"
  sh "mkdir -p #{ipa_folder}"

  # Export the IPA from the archive file created by the bot
  sh "xcrun xcodebuild -exportArchive -archivePath \"#{ENV['XCS_ARCHIVE']}\" -exportPath \"#{ipa_path}\" -IDEPostProgressNotifications=YES -DVTAllowServerCertificates=YES -DVTSigningCertificateSourceLogLevel=3 -DVTSigningCertificateManagerLogLevel=3 -DTDKProvisioningProfileExtraSearchPaths=/Library/Developer/XcodeServer/ProvisioningProfiles -exportOptionsPlist './ExportOptions.plist'"

  # Upload the build to iTunes Connect, it won't submit this IPA for review.
  deliver(
    force: true,
    ipa: ipa_path
  )

  # Keep committing and tagging actions after export to avoid perform them
  add_git_tag(
    tag: "beta/v#{version_number}_#{build_number}"
  )

  # ...

end

> We are not using the bot to create the IPA file because it is not available at the time once the trigger runs. We are not using [gym](https://github.com/fastlane/gym) either due to the Keychain restriction problem.

{% endhighlight %}

#### Supporting multiples targets

Usually we'll get at least `production` and `staging` targets on our projects. The `Fastfile` file will require different lanes one for each target that we want to upload to iTunes. We have to modify the `Appfile` file to set up the correct app identifier depending on each lane:

{% highlight ruby %}
apple_dev_portal_id "<apple_dev_program_email@server.com>"
itunes_connect_id "<itunes_connect_email@server.com>"

team_name "<TEAM_NAME>"
team_id "<TEAM_ID>"

for_platform :ios do
  for_lane :prebuild_beta do
      app_identifier "com.xmartlabs.myapp.staging"
  end

  for_lane :beta do
    app_identifier "com.xmartlabs.myapp.staging"
  end

  for_lane :prebuild_production do
      app_identifier "com.xmartlabs.myapp"
  end

  for_lane :production do
    app_identifier "com.xmartlabs.myapp"
  end
end
{% endhighlight %}

> Setting up apple_dev_portal_id and itunes_connect_id allows us to use different accounts for fetching profiles and uploading to iTunes Connect.

Finally, after some refactor, the `Fastfile` file may looks like it's shown below:

{% highlight ruby %}
require './libs/utils.rb'

fastlane_version '1.63.1'

default_platform :ios

platform :ios do  
  before_all do
    ENV["SLACK_URL"] = "https://hooks.slack.com/services/#####/#####/#########"
  end

  after_all do |lane|
  end

  error do |lane, exception|
    reset_git_repo(force: true)
    slack(
      message: "Failed to build #{ENV['XL_TARGET']}: #{exception.message}",
      success: false
    )
  end

  # Custom lanes

  desc 'Do basic setup, as installing cocoapods dependencies and fetching profiles, before start building.'
  lane :prebuild do
    ensure_git_status_clean

    plist_file = ENV['XL_TARGET_PLIST_FILE']

    build_number = number_of_commits
    set_info_plist_value(
    path: plist_file,
    key: 'CFBundleVersion',
    value: "#{build_number}"
  )

    cocoapods
    sigh(output_path: '/Library/Developer/XcodeServer/ProvisioningProfiles', skip_install: true)
  end

  desc 'Required tasks before build the staging app.'
  lane :prebuild_beta do
    ENV['XL_TARGET_PLIST_FILE'] = './MyAppStaging-Info.plist'
    prebuild
  end

  desc 'Required tasks before build the production app.'
  lane :prebuild_production do
    ENV['XL_TARGET_PLIST_FILE'] = './MyAppStaging-Info.plist'
    prebuild
  end

  desc 'Submit a new Beta Build to Apple iTunes Connect'
  lane :build do
    branch = ENV['XL_BRANCH']
    deliver_flag = ENV['XL_DELIVER_FLAG'].to_i
    plist_file = ENV['XL_TARGET_PLIST_FILE']
    tag_base_path = ENV['XL_TAG_BASE_PATH']
    tag_base_path = "#{tag_base_path}/" unless tag_base_path.nil? || tag_base_path == ''
    tag_link = ENV['XL_TAG_LINK']
    target = ENV['XL_TARGET']

    build_number = increase_build_number(plist_file)
    version_number = get_info_plist_value(
      path: plist_file,
      key: 'CFBundleShortVersionString',
    )

    ENV['XL_VERSION_NUMBER'] = "#{version_number}"
    ENV['XL_BUILD_NUMBER'] = "#{build_number}"

    tag_path = "#{tag_base_path}release_#{version_number}_#{build_number}"
    tag_link = "#{tag_link}#{tag_path}"
    update_changelog({
      name: tag_path,
      version: version_number,
      build: build_number,
      link: tag_link
    })

    ENV['XL_TAG_LINK'] = "#{tag_link}"
    ENV['XL_TAG_PATH'] = "#{tag_path}"

    sh "git config user.name 'CI Builder'"
    sh "git config user.email 'builder@server.com'"

    git_commit(
      path: ["./CHANGELOG.md", plist_file],
      message: "Version bump to #{version_number} (#{build_number}) by CI Builder"
    )

    if deliver_flag != 0
      ipa_folder = "#{ENV['XCS_DERIVED_DATA_DIR']}/deploy/#{version_number}.#{build_number}/"
      ipa_path = "#{ipa_folder}/#{target}.ipa"
      sh "mkdir -p #{ipa_folder}"
      sh "xcrun xcodebuild -exportArchive -archivePath \"#{ENV['XCS_ARCHIVE']}\" -exportPath \"#{ipa_path}\" -IDEPostProgressNotifications=YES -DVTAllowServerCertificates=YES -DVTSigningCertificateSourceLogLevel=3 -DVTSigningCertificateManagerLogLevel=3 -DTDKProvisioningProfileExtraSearchPaths=/Library/Developer/XcodeServer/ProvisioningProfiles -exportOptionsPlist './ExportOptions.plist'"

      deliver(
        force: true,
        ipa: ipa_path
      )
    end

    add_git_tag(tag: tag_path)

    push_to_git_remote(local_branch: branch)

    push_git_tags

    slack(
      message: "#{ENV['XL_TARGET']} #{ENV['XL_VERSION_NUMBER']}.#{ENV['XL_BUILD_NUMBER']} successfully released and tagged to #{ENV['XL_TAG_LINK']}",
    )
  end

  desc "Deploy a new version of MyApp Staging to the App Store"
  lane :beta do
    ENV['XL_BRANCH'] = current_branch
    ENV['XL_DELIVER_FLAG'] ||= '1'
    ENV['XL_TARGET_PLIST_FILE'] = './MyApp Staging-Info.plist'
    ENV['XL_TARGET'] = 'MyApp Staging'
    ENV['XL_TAG_LINK'] = 'https://bitbucket.org/xmartlabs/MyApp/src/?at='

    build
  end

  desc "Deploy a new version of MyApp to the App Store"
  lane :production do
    ENV['XL_BRANCH'] = current_branch
    ENV['XL_DELIVER_FLAG'] ||= '1'
    ENV['XL_TARGET_PLIST_FILE'] = './MyApp-Info.plist'
    ENV['XL_TARGET'] = 'MyApp'
    ENV['XL_TAG_LINK'] = 'https://bitbucket.org/xmartlabs/MyApp/src/?at='

    build
  end
end

{% endhighlight %}

About previous `Fastfile`:

* We had defined two prebuild lanes in order to setup correct apps identifier using the `Appfile`.
* Add two prebuild lanes for both production and staging environments. Take into account that we have changed the name of the prebuild lane to `prebuild_beta` so you need to change it on your bot.
* Build, git and deploy actions is encapsulated in the `build` lane. This allow as to have production and staging lanes that, basically, will setup some parameters and invoke the internal `build` lane.
* `ensure_git_status_clean` will check if bot's working folder has changes and will fail in such case. This will ensure that the bot’s working copy is exactly the same to repository. As we are changing local files on our `deploy` lane, if something went wrong we'll want to reset all of them. So I added the action `reset_git_repo` on `error` block.
* The command `xcrun xcodebuild -exportArchive` requires a configuration file specified with the option `-exportOptionsPlist`. I created ExportOptions.plist within `fastlane` folder and its content its similar to:

{% highlight xml %}
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
        <key>teamID</key>
        <string><TEAM_ID></string>
        <key>method</key>
        <string>app-store</string>
        <key>uploadSymbols</key>
        <true/>
        <key>uploadBitcode</key>
        <true/>
</dict>
</plist>
{% endhighlight %}

As the last step, add a new post-build trigger that run our `beta` lane:

![After trigger deploy](/images/remer-xcode-server/after-trigger-deploy.png)

## Troubleshooting

When making our Xcode Server run bots that were capable of uploading the apps built to iTunes Connect, I encountered myself with many problems or errors that weren't easy to solve. I couldn't find much information on the web related. I hope that this will help somebody in the same circumstances. Next is a list of the problem that I encountered in the process of making Xcode Server works as I expected.

### Attempting to Developer password to Fastlane tools

`sigh` will attempt to store the password in the keychain and try to access it later if no password was provided, but this won't work when running from a bot's trigger. Triggers commands have no access to bot user's keychain, I tried by unlocking it before run sigh as shown below without luck:

{% highlight shell %}
# Try to unlock the keychain to be accessed by fastlane actions
$ security -v unlock-keychain -p `cat /Library/Developer/XcodeServer/SharedSecrets/PortalKeychainSharedSecret` /Library/Developer/XcodeServer/Keychains/Portal.keychain

# Will download profiles using sigh
$ fastlane prebuild
{% endhighlight %}

On the output log appears next messages:

    security: SecKeychainAddInternetPassword <NULL>: User interaction is not allowed.
    Could not store password in keychain

We simply couldn't access the keychain when running Fastlane. I opted to just save the password as a system environment variable.

### CocoaPods is not able to update dependencies

    [!] Unable to satisfy the following requirements:

    - `SwiftDate` required by `Podfile`
    - `SwiftDate (= 3.0.2)` required by `Podfile.lock`

> NOTE: dependencies seems to be OK in Podfile, it might be a permissions error when pods try to update its repo folder in the user's folder.

The solution for me was completely delete CocoaPods and install it as a described above:

{% highlight shell %}
$ sudo rm -fr /var/_xcsbuildd/.cocoapods

$ sudo su - _xcsbuildd
$ gem install --user-install cocoapods
$ pod setup
$ ln -s `which pod` /Applications/Xcode.app/Contents/Developer/usr/bin/pod
{% endhighlight %}

### Fastlane - Sigh & Gym cannot access to keychain

That's all, they cannot access to keychain. Seeing this message (or similar) `security: SecKeychainAddInternetPassword <NULL>: User interaction is not allowed.` when running `gym`or `sigh` is the symptom, later:

* They cannot access stored login password, you must pass the password through env variables to `sigh` using `FASTLANE_PASSWORD`.
* `gym` cannot access to distribution certificates installed in keychain, so make the IPA using `xcrun xcodebuild` instead of `gym`.

### Certificates & private keys

Ensure that:

* They must be installed in System keychain so Xcode Bot can access them.
* On the keychain app, change certificates and private keys *Access Control* allowing `codesign` and `security` binaries to access them.

### Cannot select Xcode in Server app

After updating Xcode to version 7.2.1 I was able to select it on Server app, then Xcode service was disabled. When I tried to select the correct Xcode app there a dialog saying *"You must agree to the terms of the xcode software license agreement"* was shown. I found the solution on an Apple Forum thread [Can not choose Xcode in Server App - "You must agree to the terms..."](https://forums.developer.apple.com/thread/34683), running next command will allow you to select Xcode on Server app:

{% highlight shell %}
$ sudo /Applications/Xcode.app/Contents/Developer/usr/bin/xcscontrol --initialize
{% endhighlight %}

### IPA not available

The IPA built by the bot is copied to this path after the build finish `/Library/Developer/XcodeServer/IntegrationAssets/$XCS_BOT_ID-$XCS_BOT_NAME/$XCS_INTEGRATION_NUMBER/$TARGET_NAME.ipa`, but it is not available at the time that bot's after triggers are ran.

### XCS_ARCHIVE not defined

The env variable XCS_ARCHIVE is defined only when the bot is set to perform the archive action.

### Using a custom ssh key

To commit changelog changes and build number bump we need to have access to the repo from `_xcsbuildd`'s shell. If you prefer use SSH to access git server you will need to add a valid key in the builder user `.ssh` folder. Note that this key cannot have a passphrase set. If it is set, then the trigger will ask you to enter the shh key password stopping its process until you enter it.

1. Log in as `_xcsbuildd`:
   `$ sudo su - _xcsbuildd`
2. Copy a valid ssh key to `~/.ssh`.
3. Modify `~/.bash_login` in order to automatically add your custom key to ssh agent:
   {% highlight shell %}
   $ echo 'eval "$(ssh-agent -s)"' >> ~/.bash_login
   $ echo 'ssh-add ~/.ssh/id_rsa_github' >> ~/.bash_login
   {% endhighlight %}
4. Determine which key should be used to access git repo by changing `~/.ssh/config` file, for example add next lines:
   {% highlight text %}
    Host github.com
       HostName github.com
     IdentityFile ~/.ssh/id_rsa_github
   {% endhighlight %}

This will be helpful additionally to fetch git submodules.

### Invalid Signature. A sealed resource is missing or invalid.

If the upload to iTunes fails with an error similar to "Invalid Signature. A sealed resource is missing or invalid.", it may happen because the export archive command is not receiving the option `-exportOptionsPlist`. Make sure that you have set it and the path to the file passed is OK. The full error message is:

{% highlight text %}
parameter ErrorMessage = ERROR ITMS-90035: "Invalid Signature. A sealed resource is missing or invalid. Make sure you have signed your application with a distribution certificate, not an ad hoc certificate or a development certificate. Verify that the code signing settings in Xcode are correct at the target level (which override any values at the project level). Additionally, make sure the bundle you are uploading was built using a Release target in Xcode, not a Simulator target. If you are certain your code signing settings are correct, choose "Clean All" in Xcode, delete the "build" directory in the Finder, and rebuild your release target. For more information, please consult https://developer.apple.com/library/ios/documentation/Security/Conceptual/CodeSigningGuide/Introduction/Introduction.html
{% endhighlight %}
