---
layout: post
title: Announcing React Native Line v2!
date: 2020-10-08 10:00:00
author: Emiliano Botti
excerpt: "In this blog we announce the React Native Line new version, present every new functionality and share technical decisions we made."
tags: [React Native Line, React Native, LineSDK, Xmartlabs]
category: development
author_id: emi
featured_image: /images/react-native-line/banner.png
show: true
crosspost_to_medium: false
permalink: /blog/:title/
---

We are happy to announce a new [react-native-line](https://github.com/xmartlabs/react-native-line) version that supports the latest updates on the [LINE SDK](https://developers.line.biz/en/docs/line-login/overview/) and it's available to download via [npm](https://www.npmjs.com/package/@xmartlabs/react-native-line)!


When one of our projects called for an integration of sign in with [Line](https://line.me/en/) (which [is pretty popular in Japan](https://www.statista.com/statistics/735063/japan-number-of-line-users/#:~:text=Number%20of%20LINE%20users%20in%20Japan%202016%2D2021&text=In%202016%2C%20approximately%2045.5%20million,58.5%20million%20users%20in%202021.)), there were not any maintained alternatives in the React Native community so we decided to develop our own!

A few years after the first release, being more specific in 2019, an [issue](https://github.com/xmartlabs/react-native-line/issues/31) was reported asking us for supporting React Native versions greater than 0.58.
The newest React Native version introduced some breaking changes so we spent some time making it compatible again with the latest libraries.

Let's get into its functionality and how it works....

# Functionalities

### Login with Arguments

The new login functionality accepts any kind of argument like the native LineSDK.

Try out any of the following arguments:

```jsx
{
  scopes?: LoginPermission[]
  onlyWebLogin?: boolean
  botPrompt?: BotPrompt
}
```

Where `scopes` accepts:

```jsx
{
  EMAIL = 'email',
  /// The permission to get an ID token in the login response.
  OPEN_ID = 'openid',

  /// The permission to get the user's profile including the user ID, display name, and the profile image
  /// URL in the login response.
  PROFILE = 'profile',
}
```

and `botPrompt`:

```jsx
{
  aggressive = 'aggressive',
  normal = 'normal',
}
```

This means your application would have the ability to get specific logged user information such as email address, user id, URL, and more!

### Logout

Simply trigger this piece of code to logout the user:

```jsx
try {
   ...
   await Line.logout()
   ...
} catch (error) {
   ...
}
```

### Get logged user information

If you want to get information from the logged user, just run this snippet of code:

```jsx
try {
   ...
   const profile = await Line.getProfile()
   ...
} catch (error) {
   ...
}
```

And you will get this `profile` object to use as you wish:

```jsx
{
   /// The user ID of the current authorized user.
  userID: String

  /// The display name of the current authorized user.
  displayName: string

  /// The profile image URL of the current authorized user. `null` if the user has not set a profile
  /// image.
  pictureURL?: string

  /// The status message of the current authorized user. `null` if the user has not set a status message.
  statusMessage?: string
}
```

### Get and refresh access token

LINE [encourages](https://developers.line.biz/en/docs/android-sdk/managing-access-tokens/#refresh-token) to let the SDK to take care of the token management. But if for some reason you want to handle it, you have these functionalities in your swiss-army-knife:

- Current token: `getCurrentAccessToken()`
- Refresh token: `refreshToken()`
- Verify token: `verifyAccessToken()`

### Get bot prompt

Finally, you can get your user friendship status with the Line Official Account. You need to configure it in your account, specify the `botPrompt` option when logging in and then call `getBotFriendshipStatus()` method.
Follow [LINE's instructions for more information](https://developers.line.biz/en/docs/line-login/link-a-bot/) on how to link the bot to your account.

# Comments about the library

### Implementation

Unlike most natives modules in the React Native community which are developed in Objective-C and Java, new React Native Line version is implemented using Swift and Kotlin at a low level.

This was an easy decision to make, first we have been using Swift and Kotlin since their first release. Secondly, Line SDK is deprecating Obj-c and Java versions in behalf of Swift and Kotlin (see image below). Lastly, and this is more obvious, Swift and Kotlin are modern, more intuitive, easy to read and maintain than Obj-c and Java respectively.

<img src="/images/react-native-line/migrate.png" alt="deprecation advertisement" >

# Integration Guide

If you're using LineSDK for the first time, you can check the [installation guide](https://github.com/xmartlabs/react-native-line#installation).

If you want to update to the latest version, please check out our fined-tuned [migration guide](https://github.com/xmartlabs/react-native-line#migration-from-v1xx).

# Final thoughts

We hope you find it useful. Please contact us if you need any help, encounter an issue, or struggle with anything.  We are open to any suggestions and to provide help with any issue you might face using the library.

Don't hesitate to [propose](https://github.com/xmartlabs/react-native-line/issues) or [collaborate](https://github.com/xmartlabs/react-native-line/pulls) with any feature you would like to add. We will be more than happy to keep this project growing!

Finally, we also want to thank [everyone](https://github.com/xmartlabs/react-native-line#contributors) that helps create and maintain this library.
