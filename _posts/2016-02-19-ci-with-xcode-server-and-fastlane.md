---
layout: post
title:  "CI with Xcode Server & Fastlane"
date:   2016-02-19 17:22:12
author: Miguel Revetria
categories: Server,CI
author_id: remer
---

# CI with Xcode Server & Fastlane

On this post I'm going to write about my experience and the problems I found when setting up Xcode Server for CI and automatic deployment to iTunnes in Xmartlabs. I'm going to let you know how I could solve some problems hoping it may help somebody on the same situation. There is a lot of blogs that explain on how to setup Xcode Server and get a bot building a project and running test. They will help with that stuff, which works out of the box, but I personally didn't find help on the errors happened when trying to make something more sophistcated.

Why did we try to setup our CI server? Well, almost everybody knows the goodness of having a CI server: automatically build your project on changes in the code, perform tests, detect any issue on latest commits very quick, notify results only to interested people, and a long list of etc. Additionally, all of these loved features are now included within Xcode! We though that would be really nice give it a try... later we proved that not everything was going to be so easy. But finally, we got our bots running, building, testing, creating releases, commiting tags and **uploading builds to iTunnes**. A happy ending for this story.

## Setting up the server

The guide [Xcode Server and Continuous Integration Guide](https://developer.apple.com/library/ios/documentation/IDEs/Conceptual/xcode_guide-continuous_integration/) from Apple will give you a good introduction on how to setup Xcode Server and how it will work. I would recommend to read it first. I'm not going to deep into the basics of setting up Xcode Server because it is well done there and on many other blogs.

After we have installed the Server app and enabled Xcode service, we have to install [Cocoapods](https://cocoapods.org/) and [Fastlane](https://fastlane.tools/), these are the tools that we usually use in Xmartlabs. To prevent permissions issues we will install all the gems just for the builder user using `gem install --user-install some_gem`. Additionally we need to create a symlink to Cocoapods and Fastlane binaries in order to access them when running a trigger from our bot.

Before start, add ruby bin folder to builder's path - depending on the ruby's version - add `export PATH="$PATH:/var/_xcsbuildd/.gem/ruby/2.0.0/bin"` to `~/.bashrc` and `~/.bash_login`. Now lets go to install these gems:

{% highlight shell %}
sudo su - _xcsbuildd

gem install --user-install cocoapods
pod setup
ln -s `which pod` /Applications/Xcode.app/Contents/Developer/usr/bin/pod

gem install --user-install fastlane
ln -s `which fastlane` /Applications/Xcode.app/Contents/Developer/usr/bin/fastlane
{% endhighlight %}

An nice feature of Xcode Server is the hability to send an email to selected people depending on the integration result. For example, if the integration fails because the project is not compiling or some tests are not passing, the bot can send an email to the last commiters notifying that the build has been broken. If you are planning using a gmail account to send emails you have to change the settings on the Mail service on Server app. First enable the Mail service on Server. Then check the option *Relay outgoing mail through ISP*, on the Relay option dialog you have to put `smtp.gmail.com:587` in *Outgoing Mail Relay*, enable authentication and enter valid credentials. That's all, you have set up your Server to send email using your gmail account.

![Mail setup](/images/remer-xcode-server/mail-setup.png)

## Making a bot

### Sanity bot

First we are going to make a *sanity* bot to see if the basics are working well. So let start

1. Open your project
2. Select menu option Product > Create Bot
3. Follow the creation wizzard, it is not so hard to complete. You may encount some difficult when setting git credentials. I opted to create a ssh key and use it for my bot. So I ended selecting *Existing SSH Keys* and using the same key for all my bots.
4. Integrate it and see if everything is OK

### Tester bot

Now lets add more functionalities to this bot, If you didn't yet. Go to edit the previous bot, and make next changes:

1. On the **Schedule** of the bot's settings, change the schedule to *On Commit*, this way the bot will automatically run when somebody push a commit to the selected remote/branch.
2. In this same tab, check the option to *Perform test action*
3. In the *Devices* tab you can select on which specific devices run the tests or do it in all of them.
3. Send an email with the result

![After trigger email](/images/remer-xcode-server/after-trigger-email.png)

> Something cool is that email will be sent to all commiters that may introduced some issue and you can specify additionally receivers.

Now our bot is able to detect issues while we are working on the project, we'd like to receive an email notification just when something went wrong.

### Deployer bot

Now we want that our bot be responsible for building and uploading the result of each build to iTunes Connect, so we're going to need to create an IPA file, we have to install required provisioning profiles and certificates in the correct place. Bots will search provisioning profiles in the folder `/Library/Developer/XcodeServer/ProvisioningProfiles`. As the bot runs on its own user `_xcsbuildd`, we have to ensure that distribution/development certificates and their associated private key are installed on the System keychain. 

![Keychain](/images/remer-xcode-server/keychain.png)

Additionally I want that that my bot update the build number and changelog, commit these changes and make a tag with the released code. To perform previous task we are going to run fastlane lanes from bot's triggers.

We need to perform some task before bot can build our app, for example install correct pods versions. Here is where is start using fastlane to automatize these actions.
We're going to using [sigh]() to download provisioning profiles and copy them to the correct place. It is really straightforward, just setting up the `Appfile` correctly and it will do the rest:

{% highlight ruby %}
lane :prebuild do
	sigh(output_path: '/Library/Developer/XcodeServer/ProvisioningProfiles', skip_install: true)
end
{% endhighlight %}

`Appfile` may look like this:

{% highlight ruby %}

apple_dev_portal_id "miguel@xmartlabs.com"

team_name "Xmartlabs, S.R.L"
team_id "<TEAM_ID>"

{% endhighlight %}

If we run `fastlane prebuild`, it will connect to iOS Member Center and download the profiles for the app indicated by its bundle id in the `Appfile`. Additionally we have to pass the password to it, to make this work with Xcode bots we pass it through the environment variable `FASTLANE_PASSWORD`. `sigh` will attempt to store the password in the keychain and try to access it later if no password was provided, but this won't work when running from a bot's trigger. Triggers commands have no access to bot user's keychain, I tried by unlocking it before run sigh without luck:

{% highlight shell %}
# Try to unlock the keychain to be accessed by fastlane actions
$ security -v unlock-keychain -p `cat /Library/Developer/XcodeServer/SharedSecrets/PortalKeychainSharedSecret` /Library/Developer/XcodeServer/Keychains/Portal.keychain

# Will download profiles using sigh
$ fastlane prebuild
{% endhighlight %}

On the output log appear next messages:

    security: SecKeychainAddInternetPassword <NULL>: User interaction is not allowed.
    Could not store password in keychain

I simple couldn't access to the keychain when running fastlane. I opted to simply save the password as a system environment variable.

{% highlight shell %}
export FASTLANE_PASSWORD="secret"
fastlane prebuild
{% endhighlight %}

Well, installing the pods used by the app is really easy with fastlane, just add the action `cocoapods` to the lane. 

{% highlight ruby %}
lane :prebuild do
	cocoapods
	sigh(output_path: '/Library/Developer/XcodeServer/ProvisioningProfiles', skip_install: true)
end
{% endhighlight %}

We will modify the deployer bot by adding a before trigger command that will call to `prebuild`. This is done by adding a before triggers in the *Triggers* tab

![Before trigger](/images/remer-xcode-server/before-trigger.png)

> Note that before calling `fastlane`, we are change current dir by entering to `myapp`. That is the name of the branch. **Triggers run in the parent project folder**.

OK we are ready to make our bot performing the archive action. Next steps are increase build number, make a tag and upload to iTunes Connect. We will use the built made by the bot to generate the IPA that finally we will upload to iTunes Connect. Later I'm going to let you know why we will export the archive instead of letting the bot generate it. As we are going to use the archive made by the bot we have to update the build number before start building. We want to set the build number to the number of commits that were made and let version number as it is. To increase the build numebr we can use the Fastlane action `number_of_commits` to retrieve the number of commits made on the current branch and update the target's plist file using other Fastlane action `set_info_plist_value`, so add to our prebuild lane next action:

{% highlight ruby %}

lane :prebuild do
  build_number = number_of_commits
  set_info_plist_value(
    path: './MyApp-Info.plist',
    key: 'CFBundleVersion',
    value: "#{build_number}"
  )

  cocoapods
  sigh(output_path: '/Library/Developer/XcodeServer/ProvisioningProfiles', skip_install: true)
end

{% endhighlight %}

Now we're going to create a new lane `:build` that will be ran after the bot successfully build the app. In this lane I want to commit changes made on the app's plist file, upload the build to iTunes Connect, make a tag and push those changes. Let start simple without taking care of the upload to iTunes Connect for now:

{% highlight ruby %}
lane :build do
  plistFile = './MyApp-Info.plist'

  build_number = get_info_plist_value(
    path: plist_file,
    key: 'CFBundleVersion',
  )
  version_number = get_info_plist_value(
    path: plist_file,
    key: 'CFBundleShortVersionString',
  )

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

Cool, we are almost done. But one of the most important part is missing, upload our build to iTunes Connect. One problem that make me spent a lot of time was regarding the location of the IPA file generated by Xcode bot. After the integration finishes, we can find the generated files (e.g.: IPA file among others) on the folder `/Library/Developer/XcodeServer/IntegrationAssets/$XCS_BOT_ID-$XCS_BOT_NAME/$TARGET_NAME.ipa`. The problem is that this folder is not available at the time after triggers commands are ran. I tried to solve this problem by making my own IPA file using the `gym` tool but if you remember, I couldn't make fastlane accesses the keychain, so inevitably `gym` will fail making the IPA because of this. The solution was export the IPA by executing `xcrun xcodebuild`, it can access to the keychain without troubles.

> Note: $TARGET_NAME is not actually an environment variable available when running a bot trigger command. It can be defined as `basename "$XCS_ARCHIVE" .xcarchive`

With the IPA generated and accessible from our after trigger, the next step is upload it to iTunes Connect. We're going to use the Fastlane tool `deliver` to achieve this. At the end, our `Fastfile` looks like this:

{% highlight ruby %}
require './libs/utils.rb'

fastlane_version '1.49.0'

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
    sh "git config user.email 'builds+ios@xmartlabs.com'"

    git_commit(
      path: ["./CHANGELOG.md", plist_file],
      message: "Version bump to #{version_number} (#{build_number}) by CI Builder"
    )

    ipa_folder = "#{ENV['XCS_DERIVED_DATA_DIR']}/deploy/#{version_number}.#{build_number}/"
    ipa_path = "#{ipa_folder}/#{target}.ipa"
    sh "mkdir -p #{ipa_folder}"
    sh "xcrun xcodebuild -exportArchive -archivePath \"#{ENV['XCS_ARCHIVE']}\" -exportPath \"#{ipa_path}\" -IDEPostProgressNotifications=YES -DVTAllowServerCertificates=YES -DVTSigningCertificateSourceLogLevel=3 -DVTSigningCertificateManagerLogLevel=3 -DTDKProvisioningProfileExtraSearchPaths=/Library/Developer/XcodeServer/ProvisioningProfiles"

    deliver(
      force: true,
      ipa: ipa_path
    ) if deliver_flag != 0

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
    ENV['XL_DELIVER_FLAG'] = '1'
    ENV['XL_TARGET_PLIST_FILE'] = './MyApp Staging-Info.plist'
    ENV['XL_TARGET'] = 'MyApp Staging'
    ENV['XL_TAG_LINK'] = 'https://bitbucket.org/xmartlabs/MyApp/src/?at='

    build
  end

  desc "Deploy a new version of MyApp to the App Store"
  lane :production do
    ENV['XL_BRANCH'] = current_branch
    ENV['XL_DELIVER_FLAG'] = '1'
    ENV['XL_TARGET_PLIST_FILE'] = './MyApp-Info.plist'
    ENV['XL_TARGET'] = 'MyApp'
    ENV['XL_TAG_LINK'] = 'https://bitbucket.org/xmartlabs/MyApp/src/?at='

    build
  end
end

{% endhighlight %}

Some additional notes to previous `Fastfile`:

* We had defined two prebuild lanes in order to setup correct apps identifier using the `Appfile`.
* Add two prebuild lanes for both production and staging environments.
* Build, git, deploy stuff is encapsulated in the `build` lane. This allow as to have production and staging lanes that, basically, will setup some parameters and call to `build`
* I added some Fastlane action to keep bot's working copy exactly the same to repository. `ensure_git_status_clean` will check if bot's working folder has changes and will fail in such case. As we are changing local files on our `deploy` lane, if something went wrong we'll want to reset all of them. So I added the action `reset_git_repo` on `error` block.

Some settings are done in the `Appfile`:

{% highlight ruby %}
apple_dev_portal_id "miguel@xmartlabs.com"
itunes_connect_id "miguel+myapp@xmartlabs.com"

team_name "Xmartlabs, S.R.L"
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

> Setting up apple_dev_portal_id and itunes_connect_id allows us to use differents accounts for fetching profiles and uploading to iTunes Connect.

We have pending to call previous lane from our deployer bot, it is done by adding a new trigger, an after trigger this time, in the *Triggers* tab.

![After trigger deploy](/images/remer-xcode-server/after-trigger-deploy.png)

## Troubleshoting

When making our Xcode Server to run bots that were capable of upload the apps built to iTunes Connect I encounter myself with many problems or errors that weren't easy to solve. I couldn't find much information
on the web related. I hope that this will help somebody in the same circumstances. Next is a list of the problem that I encountered in the process of making Xcode Server works as I expected.

### CocoaPods is not able to update dependencies

    [!] Unable to satisfy the following requirements:

    - `SwiftDate` required by `Podfile`
    - `SwiftDate (= 3.0.2)` required by `Podfile.lock`

> NOTE: dependencies seems to be OK in Podfile, it might be a permissions error when pods try to update its repo folder in the user's folder.

The solution for me was completely delete CocoaPods and install it as a described above:

{% highlight shell %}
sudo rm -fr /var/_xcsbuildd/.cocoapods

sudo su - _xcsbuildd
gem install --user-install cocoapods
pod setup
ln -s `which pod` /Applications/Xcode.app/Contents/Developer/usr/bin/pod
{% endhighlight %}

### Fastlane - Sigh & Gym cannot access to keychain

That's all, they cannot access to keychain. Seeing this message (or similar) `security: SecKeychainAddInternetPassword <NULL>: User interaction is not allowed.` when running `gym`or `sigh` is the symptom, later:

* they cannot access stored login password, you must pass the password through env variables to `sigh` using `FASTLANE_PASSWORD`
* `gym` cannot access to distribution certificates installed in keychain, so make the IPA using `xcrun xcodebuild` instead of `gym`.

### Certificates & private keys

Ensure that:

* They must be installed in System keychain so Xcode Bot can access them
* On the keychain app, change certificates and private keys *Access Control* allowing `codesign` and `security` binaries to access them 

### Cannot select Xcode in Server app

After updating Xcode to version 7.2.1 I was able to select it on Server app, then Xcode service was disabled. When I tried to select the correct Xcode app there a dialog saying *You must agree to the terms of the xcode software license agreement* was shown. I found the solution on an Apple Forum thread [Can not choose Xcode in Server App - "You must agree to the terms..."](https://forums.developer.apple.com/thread/34683), running next command will allow you to select Xcode on Server app:

{% highlight shell %}
sudo /Applications/Xcode.app/Contents/Developer/usr/bin/xcscontrol --initialize
{% endhighlight %}

### IPA not available

The IPA built by the bot is copied to this path after the build finish `/Library/Developer/XcodeServer/IntegrationAssets/$XCS_BOT_ID-$XCS_BOT_NAME/$XCS_INTEGRATION_NUMBER/$TARGET_NAME.ipa`, but it is not available at the time that bot's after triggers are ran.

### XCS_ARCHIVE not defined

The env variable XCS_ARCHIVE is defined only when the bot is set to perform the archive action.

### Using a custom ssh key

To commit changelog changes and build number bump we need to have access to the repo from `_xcsbuildd`'s shell. If you prefer use SSH to access git server you will need to add a valid key in the builder user ssh folder. Note that this key cannot have a passphrase set, if it has then when the trigger will be stuck on asking you to enter the shh key password before continue.

1. Log in as `_xcsbuildd`
   `sudo su - _xcsbuildd`
2. Copy a valid ssh key to `~/.ssh`
3. Modify `~/.bash_login` in order to automatically add your custom key to ssh agent
   {% highlight shell %}
   echo 'eval "$(ssh-agent -s)"' >> ~/.bash_login
   echo 'ssh-add ~/.ssh/id_rsa_github' >> ~/.bash_login
   {% endhighlight %}
4. Determine which key should be used to access git repo by changing `~/.ssh/config` file, for example add next lines:
    ```    
    Host github.com
       HostName github.com
     IdentityFile ~/.ssh/id_rsa_github
    ```

This will be helpful additionally to fetch git submodules.
