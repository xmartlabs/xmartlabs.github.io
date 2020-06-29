---
layout: post
title: "What's new on Sign in with Apple?"
excerpt: "In this blogpost we are going to cover the news that the WWDC 2020 left us"
date: 2020-06-22 10:00:00
author: Cecilia Pirotto
tags: [Xmartlabs, iOS, Apple, Swift, Sign in with Apple, SwiftUI]
category: development
author_id: ceci
featured_image: /images/apple-sign-in/signInWithApple.jpg
show: true
crosspost_to_medium: false

---

More security for your apps, new credential state to handle changes, server to server notifications, new button for Swift UI and upgrading users to Sign in with Apple are the news that the WWDC 2020 left us and we will cover in this post. If you are not familiar with Sign in with Apple we recommend you to read first [Sign in with Apple! Is it necessary? at what cost?](https://blog.xmartlabs.com/2020/05/04/Why-Sign-in-with-Apple-and-integration-guide/).

## How to create a secure request?

Using Sign in with Apple we don't have to worry too much about security as it provides us automatically security features like two factor authentication. 

Now, we can make our request even more secure including some properties named **nonce** and **state** in the authorization process. Both values are opaque blob of data, sent as String in the request. It's important to generate one unique value every time you create a new request as latest will be able to verify it. 

The **nonce** value will be returned to you embedded in the **identity token** allowing you to verify this value in your server in order to prevent replay attacks. The **state** value will be returned in the credential allowing you to locally match a credential to a request and verify that the request was generated from your application.

```swift 
    @objc func handleAuthorizationAppleIDButtonPress()  {
        let appleIDProvider = ASAuthorizationAppleIDProvider()
        let request = appleIDProvider.createRequest()
        request.requestedScopes = [.fullName, .email]
        
        request.nonce = myNonceString()
        request.state = myStateString()
            
        let authorizationController = ASAuthorizationController(authorizationRequests: [request])
        authorizationController.delegate = self
        authorizationController.presentationContextProvider = self
        authorizationController.performRequests()
    }

```
When a authorization is successful, you will receive a credential in the method for `ASAuthorizationControllerDelegate`. You should check if the state value you receive match with what you generated. Also, in this method you sent the **authorization code** and **identity token** to your server where the data can be decoded. Once decoded, remember to verify that **nonce** value is the same as you generated and your session with Apple servers. Thus you can verify the authenticity of your authorization. 


## Credential state changes

We could manage three credential states (authorized, revoked, notfound). Apple announced a new credential state: **transferred** that will be only received by applications that recently were transferred from one developer team to another. 

**User identifiers** are unique whithin a developer team, so the user id should be migrated to new ones that match with the new team when transferring ownership of an application. This migration is handled silently for the user and can be triggered by calling the same API used to create a new account or logging the user. 

As we mentioned in our other post, you must save the user identifier locally in your app, thus you can use the same code adding the user identifier to the request. The response will be returned in the *Autorization Controller* method and the application can continue to be used without the user noticing the change. Make sure to save the new one which matches the new team in your app. 


## Server to server developer notifications

There is a new feature introduced this year for *Sign in with Apple*. Listening to this notification you will be allowed to monitor the state changes and know if some user modify in Settings something related to their Apple ID or our application credentials. 

To start listeningn you have to register your *server endpoint* on the *Apple developer's Website*. Events will be sent as JSON web tokens signed by Apple. We can received some of this events:

* **consent-revoked:** when a user decided to stop using their Apple ID with your application. It should be triggered as a sign out by the user. 
* **account-deleted:** when a user delete their Apple ID. When the user delete their account the user identifier associated will no longer be valid. 

If the user previously decided to use a private email relay for their account you can also recieve this notifications:
* **email-disabled:** when a user has decided to stop reciving emails on their email relay. 
* **email-enabled:** when the user opted back into receiving emails. 

Here we can see how this JWT looks like
<div style="text-align: center"><img width="60%" src="/images/whats-new-sign-in-with-apple/JWT-server-to-server-notification.png" /></div>
<p></p>

## Sign in with Apple button for Swift UI

If you are using Swift UI, now it's easier to create a Sign in with Apple button. You can create the authorization request and handle the response within the same block of code. Let's see how we can add it in a couple of lines.

```swift
        VStack {
            SignInWithAppleButton(.signIn,              //1
                  onRequest: { (request) in             //2
                    request.requestedScopes = [.fullName, .email]
                    request.nonce = myNonceString()
                    request.state = myStateString()
                  },
                  onCompletion: { (result) in           //3
                    switch result {
                    case .success(let authorization):
                        //Handle autorization
                        break
                    case .failure(let error):
                        //Handle error
                        break
                    }
                  })
        }.signInWithAppleButtonStyle(.black)            //4


```

1. We can select the button title, choosing between *sign in*, *sign up* or *continue*. 
2. In onRequest closure, we set what information we need from the user and we can set `nonce` and `state` parameters. 
3. In onCompletion closure we handle the response of the authorization request. 
4. With `signInWithAppleButtonStyle(Style)` we can select the color of the button. 






Well, I hope now you have a better understanding about *Sign in with Apple*, its integration cost and if it's suitable for your app!


***Are you integrating Sign in with Apple in your app and have learned something not covered in this post? Let me know in the comments. I'd be interested to add it to this blogpost.***

***Have questions about Sign in with Apple? I'd be happy to answer those in the comments if I can.***
