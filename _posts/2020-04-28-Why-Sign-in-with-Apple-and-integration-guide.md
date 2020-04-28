---
layout: post
title: "Why “Sign in with Apple” and Integration guide"
date: 2020-04-28 10:00:00
author: Cecilia Pirotto
tags: [Xmartlabs, Swift, Apple, iOS]
category: development
author_id: ceci
featured_image: /images/apple-sign-in/signInWithApple.jpg
show: false
crosspost_to_medium: false

---

In this post, we’ll debate the benefits of providing Apple Sign in to your app so you can decide to offer it or not. In the second part of this post we’ll provide a step by step Apple Sign in integration guide and all the issues we run into and had to overcome.


### In case you don’t know What’s Sign in with Apple yet...

It is a new Third-Party Login provided by Apple where users can sign in using their Apple ID.

> Apple makes it mandatory by the end of June if you are already providing another third-party social media authentication in your app such as Facebook, Google, Twitter, etc. If you’re not sure if you have to integrate it, you can check it in the [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/#sign-in-with-apple). 


### Why is Sign in with Apple on the table?

It provides a one tap frictionless login and authentication system to your app which means more people will login to your app and a faster growth in the number of app users especially in Apple device owners who only need to check their identity through Touch id or Face id. By using Sign in with Apple, users don’t need to remember app credentials, apps don’t need to provide a password reset and identity and validation workflow in the app, neither provide a register and login form.

“Sign in with Apple” is FIDO U2F standard complaint, which means security aspects are met and we don’t need to care about it. Apple adds two-factor authentication support, providing an extra layer of security.

Something that might make an app user to prefer “Sign in with Apple” over other alternatives is the ability to hide its email, this still allows the app to reach the user, Apple provides a user’s private email that is only reachable from the app mailbox registered domains, so the user email doesn’t have value outside app servers and can’t be sold. 

Even though “Sign in with Apple” is multiplatform which means we can make it work (in addition to the platforms provided by Apple) on the web, Android devices, and Windows apps. The user still needs to have an Apple device to complete the two-factor authentication, upon Apple id login the user receives a 2FA code from apple in their device. So if your app is available for not Apple devices owners just allowing Sign in with Apple is not enough.

At this point you might have gotten the point of all the benefits in adopting Sign in with Apple in your app so now let’s move on how to integrate it. 

## Integration guide

### Add Sign in with Apple capability

First of all, we need to add Sign in with Apple capability to our project. Open the Xcode project file. In the project editor, select the target and open the Signing & Capabilities tab. In the toolbar, click the "+ Capability" button to open the Capabilities library and add the “Sign in with Apple” capability. 

<img width="100%" src="/images/apple-sign-in/addCapability.png" />

### Add capability on Apple Developer Account

It’s necessary to configure your project on Apple's Developer Program. Go to Certificates, Identifiers & Profiles → Identifiers and search the identifier to the project. 
Search “Sign in with Apple” capability and if it’s not enabled, enable it. Then, click “Edit” and choose “Enable as primary App ID” option as it’s shown in the screenshot. Save the new configuration. 

<img width="100%" src="/images/apple-sign-in/editAppleIDConf.png" />

Go back to "Certificates, Identifiers & Profile" screen and go to the Keys page to register the new key. Press the "+" button and add the “Sign in with Apple” capability, then press the “Configure” button.

<img width="100%" src="/images/apple-sign-in/registerNewKey.png" />

Make sure to select the correct Primary App ID and save the configuration key.

<img width="100%" src="/images/apple-sign-in/configurekey.png" />

Now, we have the environment setup done, let’s go to code.

### Add button

Although you can use your custom button, we strongly recommend using those provided by Apple which offers multiple benefits shown [here](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple/overview/buttons/). 


<div style="text-align: center"><img width="30%" src="/images/apple-sign-in/signInButton.png" /></div>

It’s necessary to import `AuthenticationServices` framework which provides `ASAuthorizationAppleIDButton`. Adding this button is very simple, you just need to create an instance and add a target to `touchUpInside` action. Remember to add it to your view. 

```swift
  let button = ASAuthorizationAppleIDButton()
  button.addTarget(self, action: #selector(handleAuthorizationAppleIDButtonPress), for: .touchUpInside)
  self.loginProviderStackView.addArrangedSubview(button)
```

### Handle button press

After we add the button, we need to handle button press to open the dialog. We’ll use a mechanism for generating requests to authenticate users based on their Apple ID.  

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
1. Create a request (`ASAuthorizationAppleIDRequest`). To create it we need an instance of `ASAuthorizationAppleIDProvider`.
2. Define what scope we want to receive from the user (in this case email and full name).
3. Create a controller that manages authorization requests created by a provider.
4. Provides a display context to present the authorization interface to the user.
5. Perform the request.

This method opens the authentication dialog shown below.

<div style="text-align: center"><img width="60%" src="/images/apple-sign-in/AppleSignIn.gif" /></div>

It’s required to implement `ASAuthorizationControllerDelegate` and `ASAuthorizationControllerPresentationContextProviding` protocols. The second one requires us to implement this function to indicate the delegate from which window it should present content to the user. 

```swift
  func presentationAnchor(for controller: ASAuthorizationController) -> ASPresentationAnchor {
      return self.view.window!
  }
```

### Which data does it get from your app?

We’ll receive an `ASAuthorizationAppleIDCredential`, here are the principal information:

* **User ID**: The unique user ID across all platforms
* **Full name**: User could edit his full name before sharing it with your app 
* **Email**: A user’s email address, which could either be the official user email or an obscured one
* **Authorization Code & Identity Token**: These are encrypted data you’ll send to your server. This is optional — it will only be available if this is a new user. Otherwise, you will only receive "User id"

### How do we get this data?

We need to implement two functions for `ASAuthorizationControllerDelegate`, one for success and other for error.

Let’s start with success one:
```swift
    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        if let appleIDCredential = authorization.credential as? ASAuthorizationAppleIDCredential {
            let useridentifier = appleIDCredential.user
            let identityToken = appleIDCredential.identityToken
            let authCode = appleIDCredential.authorizationCode
            let email = appleIDCredential.email
            let givenName = appleIDCredential.fullName?.givenName
            let familyName = appleIDCredential.fullName?.familyName
            
            //Create account in your system
        }
    }
```
It’s worth highlighting that we only receive all the information if it’s a new user, otherwise we don’t receive `fullName` or `email`. Also, it’s necessary to save the user id in our app keychain.  

We also need to handle authorization failed with this function:
```swift
  func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
      //Handle error here
  }
```

### Handling changes

Users could revoke permission for our app in "Setting →  Apple ID →  Password & Security → Apps Using Your Apple ID".

<div style="text-align: center"><img width="60%" src="/images/apple-sign-in/revoke.png" /></div>

Apple provides us a way to know it with an explicit notification so we can handle these changes. 
We need to register for this notification on `viewDidLoad()` method. 

```swift
NotificationCenter.default.addObserver(self, selector: #selector(appleIDCredentialRevoked), name: NSNotification.Name.ASAuthorizationAppleIDProviderCredentialRevoked, object: nil)
```
We can check credential state with `getCredentialStateForUserID`. Remember that we should have saved the user identifier in our app keychain. Let’s implement the function to handle these changes.

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

If your app is multiplatform and you add Sign in with Apple in your iOS app you should probably add it on the web (or Android) in order to allow the users to sign in on different platforms. 
Apple provides a JavaScript SDK for that. You can take a look in the [Sign in with Apple JS](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_js) documentation.

### Communication Apple servers

Apple provides a REST API to communicate between your app servers and Apple’s authentication servers. You can use it to validate the tokens used to verify a user’s identity. You can read more in the [documentation](https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api). 


### Register your email domains

As we mentioned before, to communicate with users who tap the “hide my email” option we must register our emails domain we’ll use to contact them. 
You need to configure it on Apple’s Developer Program. Go to "Certificates, Identifiers & Profile → More" and tap Configure button

<img width="100%" src="/images/apple-sign-in/emailComunication.png" />

Tap "+" to register your email sources. In “Domains and Subdomains” section add your domain name, click “Next” and “Register”

<img width="100%" src="/images/apple-sign-in/registerEmailSources.png" />

> The register should fail if you don’t use SPF. If you’re using Google to send mails, [here](https://support.google.com/a/answer/33786?hl=en) is a guide to configure it. 

After you registered, click Download and place the file in the specified location (https://example.com/.well-known/apple-developer-domain-association.txt) and click Verify.

<img width="100%" src="/images/apple-sign-in/downloadRegister.jpeg" />

Once your domain has passed the verification and is registered to your account, a green checkmark will appear. 

<img width="100%" src="/images/apple-sign-in/checkDomain.jpeg" />

You can add an individual email address doing the same steps but adding on “Email Addresses” instead of “Domains and Subdomains”.

### Aspects to keep in mind 

There are some aspects you should consider if you’ll integrate it.

As we mentioned before, developers only receive email and full name once, so if there is a connection issue and you don’t save this data locally you couldn't recover it. 

If users choose the “hide my email” option it could be difficult to identify them if they want to contact the support team and the contact is not provided through the app. 

The “hide my email” option also has some issues, even though you registered your email domains if you were using a third-party mail service (like AmazonSES, SendGrid or MailChimp) it didn’t work. Apple worked on this and now it’s working. 


Well, hope you now have a better idea about Sign in with Apple and how integrate it!


***Are you integrating Sign in with Apple in your project and have learned something not covered in this post? Let me know in the comments. I'd be interested to get your perspective.***

***Have questions about Sign in with Apple? I'd be happy to answer those in the comments if I can.***
