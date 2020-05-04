---
layout: post
title: "Sign in with Apple! Is it necessary? at which cost?"
excerpt: "In this blogpost we talk about the benefits of providing Sign in with Apple in your app. We also provide a step by step guid on how to integrate it"
date: 2020-05-04 10:00:00
author: Cecilia Pirotto
tags: [Xmartlabs, iOS, Apple, Swift, Sign in with Apple]
category: development
author_id: ceci
featured_image: /images/apple-sign-in/signInWithApple.jpg
show: true
crosspost_to_medium: false

---

In this post, we'll debate about the benefits of providing *Sign in with Apple* in your app so you can decide if it worth integrating it or not. In the second part of this post we'll provide a step by step *Sign in with Apple* integration guide and talk about all the issues we run into and had to overcome.


### In case you don't know What's Sign in with Apple yet...

It's a new third party login service provided by Apple where users can sign in into your app using their Apple ID.

> Apple will make it mandatory by the end of June if you're already providing other third-party social media authentication such as Facebook, Google, Twitter, etc. You can visit [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple) for more info about Apple store review.



### What does *Sign in with Apple* put on the table?

It provides a one tap frictionless login and authentication system to your app which means more people will login into your app and also a faster growth in the number of app users especially in Apple device owners who only need to check their identity through Touch Id or Face Id. By using *Sign in with Apple*, users don't need to remember app credentials, apps don't need to provide a password reset and identity and validation workflow in the app, neither provide a specific register and login form.

*Sign in with Apple* is FIDO U2F standard complaint, which means security aspects are met and we don't need to care about it. Apple adds two-factor authentication support by default, providing an extra layer of security.

Sometimes an app user would prefer *Sign in with Apple* over other alternatives because it has the ability to hide its real email, this still allows the app to reach the user real email through Apple servers. Apple provides a user's private email that is only reachable from the app registered email domains, so the user email doesn't have value outside app servers and can't be sold.

Even though *Sign in with Apple* is multiplatform which means we can make it work (in addition to the platforms provided by Apple) on the web, Android devices, and Windows apps. The user still needs to have an Apple device to complete the two-factor authentication, upon Apple Id login the user receives a 2FA code from apple in their device. So if your app is available for not Apple devices owners just allowing *Sign in with Apple* is not an option.

Now, you should have a better idea of what's *Sign in with Apple* and .
At this point you should have gotten the point of all the benefits in adopting Sign in with Apple in your app and be able to decide if it's useful for your app. So now let's move on to a step by step integration guide.

## Integration guide

### Add Sign in with Apple capability

First of all, we need to add *Sign in with Apple* capability to our project. Open the Xcode project file. In the project editor, select the target and open the *Signing & Capabilities* tab. In the toolbar, click the *+ Capability* button to open the Capabilities library and add the *Sign in with Apple* capability.

<img width="100%" src="/images/apple-sign-in/addCapability.png" />

### Add capability on Apple Developer Account

It's necessary to configure your project on **Apple Developer Program** portal. Go to *Certificates, Identifiers & Profiles* → *Identifiers* and search the identifier to the project.
Search *Sign in with Apple* capability and if it's not enabled, enable it. Then, click *Edit* and choose *Enable as primary App ID* option as it's shown in the screenshot. Save the new configuration.

<img width="100%" src="/images/apple-sign-in/editAppleIDConf.png" />

Go back to *Certificates, Identifiers & Profile* screen and go to the *Keys* page to register the new key. Press the *+* button and add the *Sign in with Apple* capability, then press the *Configure* button.

<img width="100%" src="/images/apple-sign-in/registerNewKey.png" />

Make sure to select the correct Primary App ID and save the configuration key.

<img width="100%" src="/images/apple-sign-in/configurekey.png" />

Now, we have the environment setup done, let's get into the code.

### Add button

Although you can use your custom button, we strongly recommend using those provided by Apple which offers multiple benefits shown [here](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple/overview/buttons/).


<div style="text-align: center"><img width="30%" src="/images/apple-sign-in/signInButton.png" /></div>
<p></p>
It's necessary to import `AuthenticationServices` framework which provides `ASAuthorizationAppleIDButton` button class. Adding this button is very simple, you just need to create a button instance and set up its `touchUpInside` handler. Remember to add the button to the view hierarchy.

```swift
  let button = ASAuthorizationAppleIDButton()
  button.addTarget(self, action: #selector(handleAuthorizationAppleIDButtonPress), for: .touchUpInside)
  self.loginProviderStackView.addArrangedSubview(button)
```

### Handle button press

After we add the button, we need to implement the button tap handler. We'll will request *Sign in with Apple* permissions using `ASAuthorizationAppleIDProvider` class and we will use `ASAuthorizationController` to to handle authentication interface flow.  
<p></p>
Let's implement the button handler

```swift
  @objc func handleAuthorizationAppleIDButtonPress()  {
      let request = ASAuthorizationAppleIDProvider().createRequest() //1
      request.requestedScopes = [.fullName, .email] //2

      let authorizationController = ASAuthorizationController(authorizationRequests: [request]) //3
      authorizationController.delegate = self
      authorizationController.presentationContextProvider = self //4
      authorizationController.performRequests() //5
  }
```
1. Create a request (`ASAuthorizationAppleIDRequest`). To create it we need an `ASAuthorizationAppleIDProvider` instance.
2. Define the request scope, which is the data we want to receive from the user (in this case email and full name).
3. Create a controller that manages authorization requests created by a provider.
4. Provides a display context to present the authorization interface to the user.
5. Perform the request and opens the authentication dialog shown below.


<div style="text-align: center"><img width="60%" src="/images/apple-sign-in/AppleSignIn.gif" /></div>
<p></p>
As we can see int he code snippet above, it's required to conform to `ASAuthorizationControllerDelegate` and `ASAuthorizationControllerPresentationContextProviding` protocols.
<p></p>

We conform to `ASAuthorizationControllerPresentationContextProviding` to indicate the window that will contain "Sign in with Apple" SDK dialogs, as shown in the code below.

```swift
  // ASAuthorizationControllerPresentationContextProviding
  func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
      return self.view.window
  }
```

### Which user authentication data does we get from Apple?

We'll receive an `ASAuthorizationAppleIDCredential` instance, here are the principal information:

* **User ID**: The unique user ID
* **Full name**: User could edit his full name before sharing it with your app
* **Email**: A user's email address, which could either be the real Apple Id user email or an obscured one
* **Authorization Code & Identity Token**: These are encrypted data your client app should send to the backend so it  can validate the credentials.

*Full name* and *Email* are optional and only available for new users, which means, users that are login into the app for the first time.

### How do we get this data?

We need to implement two functions of `ASAuthorizationControllerDelegate` protocol, one that handles a successful authentication and another to handle errors during authentication.

Let's start with success one:
```swift
    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        if let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential {
            let userId = appleIDCredential.user
            let identityToken = appleIDCredential.identityToken
            let authCode = appleIDCredential.authorizationCode
            let email = appleIDCredential.email
            let givenName = appleIDCredential.fullName?.givenName
            let familyName = appleIDCredential.fullName?.familyName

            // Here you have to send the data to the backend and according the response let the user get into the app.
        }
    }
```
It's worth highlighting that we only receive all the information if it's a new user, otherwise we don't receive `fullName` neither `email`.

In order to recover from authentication errors and eventually show some feedback to the user (normally Apple SDK do the job) we need to implement the following function:

```swift
  func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
      //Handle error here
  }
```

### Handling changes

Users could revoke permission for your app in *Setting →  Apple ID →  Password & Security → Apps Using Your Apple ID*.

<div style="text-align: center"><img width="60%" src="/images/apple-sign-in/revoke.png" /></div>

Apple provides a way to know when that happens through an explicit notification so our app can handle it.

We need to register for `NSNotification.Name.ASAuthorizationAppleIDProviderCredentialRevoked` notification.

```swift
NotificationCenter.default.addObserver(self, selector: #selector(appleIDCredentialRevoked), name: NSNotification.Name.ASAuthorizationAppleIDProviderCredentialRevoked, object: nil)
```
We can check credential state with `getCredentialStateForUserID`. Remember that we should have saved the user identifier in our app keychain. Let's implement the function to handle 'NSNotification.Name.ASAuthorizationAppleIDProviderCredentialRevoked'.

```swift
  @objc func appleIDCredentialRevoked() {
    let appleIDProvider = ASAuthorizationAppleIDProvider()
    appleIDProvider.getCredentialState(forUserID: userIdentifier) { (credentialState, error) in
        switch credentialState {
        case .authorized:
            // The Apple ID credential is valid. Show Home UI Here
            break
        case .revoked:
            // The Apple ID credential is revoked. Handle unlink
            break
        case .notFound:
            // No credential was found. Show login UI.
            break
        default:
            break
        }
    }
  }
```

### Web and Android solution

Apple provides a JavaScript SDK for Android and Web integration. You can take a look at the [Sign in with Apple JS](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js) documentation.


### Communication between your backend and Apple

Apple provides a REST API to communicate between your app servers and Apple's authentication servers. You can use it to validate the tokens used to verify a user's identity. You can read more about it in the following [documentation](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api).

### Register your email domains

As we mentioned before, to communicate with app users who taps the *hide my email* option we must register the app email server domain. You must have already configured Sender Policy Framework (SPF) in order to use it at this point.

For configure your email domains enter to **Apple Developer Program**. Go to *Certificates, Identifiers & Profile → More* and tap *Configure* button

<img width="100%" src="/images/apple-sign-in/emailComunication.png" />

Tap *+* to register your email sources. In *Domains and Subdomains* section add your domain name, click *Next* and *Register*

<img width="100%" src="/images/apple-sign-in/registerEmailSources.png" />

> The register will fail if you don't use SPF. If you're using Google to send mails, [here](https://support.google.com/a/answer/33786?hl=en) you hav a configuration guide.

After you get your domain registered, click *Download* and place the file in the specified location (https://YourDomain/.well-known/apple-developer-domain-association.txt) and click *Verify*.

<img width="100%" src="/images/apple-sign-in/downloadRegister.jpeg" />

Once your domain has passed the verification and is registered to your account, a green checkmark will appear.

<img width="100%" src="/images/apple-sign-in/checkDomain.jpeg" />


### Aspects to keep in mind

There are some aspects you should consider if you'll integrate it.

As we mentioned before, developers only receive email and full name once, so if there is a connection issue and you don't save this data locally you won't be able to recover it.

If users choose the *hide my email* option, it could be difficult to identify the user since the app only holds it apple identifier and its apple private email. So any communication should be done through the app.


Well, hope now you have a better understanding about *Sign in with Apple*, it integration cost and if it's suitable for your app!


***Are you integrating Sign in with Apple in your app and have learned something not covered in this post? Let me know in the comments. I'd be interested to add it to this blogpost.***

***Have questions about Sign in with Apple? I'd be happy to answer those in the comments if I can.***
