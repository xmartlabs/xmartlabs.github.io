---
layout: post
title:  react-native-line, the react-native wrapper for LINE
date:   2017-11-01 00:00:00
author: Mauricio Cousillas
author_id: mcousillas
categories: React-Natve, JavaScript, Android, iOS, Tutorial
markdown: redcarpet
---

Today we are releasing our very first React Native framework to the open source community.
[react-native-line](https://github.com/Xmartlabs/react-native-line) provides an easy-to-use interface for you to use Line's mobile SDK seamlessly on your app, without having to worry about Android or iOS differences.

## How to use it?
To start working with react-native-line, you need to add it to your react-native project using your package manager of preference.
For example:
```bash
  npm install react-native-line
```

Then, you need to link the native implementations to your project running:
```bash
  react-native link react-native-line
```

After that, you need to follow the Android and iOS guides available [here](https://github.com/xmartlabs/react-native-line#installation)

#### Login example
As an example, let's make a login flow that uses Line's SDK:

First, you need to require the `LineLogin` module on your js file:
```javascript
import LineLogin from 'react-native-line'
```

Then, on your call to action (For example, a TouchableOpacity) you need to call the `login` function. This will open Line's own UI (App, or browser, if the app is not installed on the device) and it will resolve the promise when the user finishes that flow successfuly.

```javascript
LineLogin.login()
    .then((user) => {
      /* Here, send the user information to your own API or external service for autentication.
      The user object has the following information:
      {
        profile: {
          displayName: String,
          userID: String,
          statusMessage: String,
          pictureURL: String?,
        }
        accessToken: {
          accessToken: String,
          expirationDate: String,
        }
      }
      */
    })
    .catch((err) => {
      // The promise will be rejected if something goes wrong, check the error message for more information.
    });
```
At this point, you should use the promise callbacks to handle the information returned by Line and continue your autentication flow as needed.

## Where to go from here
We hope this works as a good introduction to this open source library. On GitHub you'll find everything you need to get started. If you want to collaborate, feel free to  [contribute](https://github.com/xmartlabs/react-native-line) with this library.
