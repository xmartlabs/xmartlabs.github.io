---
layout: post
title: What's new on Apple Machine Learning at WWDC 2020?
date: 2020-07-10 10:00:00
author: Nicolas Lantean
excerpt: "Having headache when integrating with apis? The architecture and good practices that we share in this blog post can help you!"
tags: [Frontend architecture, Frontend best practices, How to consume APIs, Frontend architecture patterns, Frontend, Js]
author_id: nicolantean
featured_image: /images/whats-new-on-apple-machine-learning-at-wwdc-2020/0-preview.png
show: true
category: development
---

Every day the incorporation of machine learning in the mobile world is greater. Apple knows that and every year improves its frameworks in different ways. This year wasn't an exception because Apple announced some interesting new features on its machine learning frameworks and that's what I gonna talk about in this blog.

## Detect Body and Hand Pose with Vision

Apple adds two new capabilities in the Vision framework, both to detect human poses, once for the entire body and the other for the hand.

Vision has different requests for different tasks, so for these new features, has add two new requests.To perform a body pose request provides its **body pose-detection** capabilities through **VNDetectHumanBodyPoseRequest.** The result of human body detection, is a structure with 19 unique body points as shown in the figure below. Once you have that info, you can do different types of things with it depending on the objective of use in your app.

<div style="text-align: center"><img width="60%" src="/images/whats-new-on-apple-machine-learning-at-wwdc-2020/1-body-pose.png" /><p class="small">A human body with all the 19 unique body points illustrated.</p></div>

Similar to the body pose request, you can perform a **hand pose-detection** through **VNDetectHumanHandPoseRequest.** The response provides 21 landmarks in total, four landmarks for each finger and one for the wrist. If you like to detect more than one hand in your image or video, you have to set the **maximumHandCount** to the number of hands you want to detect. Consider that this variable will affect the performance of your app, especially on older devices.

<div style="text-align: center"><img width="60%" src="/images/whats-new-on-apple-machine-learning-at-wwdc-2020/2-hand-pose.png" /><p class="small">A hand with the 21 landmarks illustrated.</p></div>

## Use Model Deployment and Security with Core ML

If you have an app with a Core ML model when you submit your app, the model is bundled with your app and they go together to the App Store and then to the users. In that scenario, the model is available to the user when downloads the app. But there are some cases where the delivery process of the model has to be more flexible. Model Deployment provides a solution for that, it uses a dashboard where models can be stored, managed, and deployed via Apple Cloud. The best advantage is the possibility of update a model independently of the update cycle of your app. Also, it has a new way to group and manage models that work together and, the option to target models to specific device populations.

Model Deployment allows you to develop your model, adding new classes or retraining with more data for instance, without thinking in the updates plans of your app. You can have two different calendars for updates which will be independent of each one.  As the model is uploaded in the cloud, the first time you try to get it by the new Core ML API, the model will try to download it in background. You have to manage the error if the download fails for connection problems, for example, a common solution for that is to use the bundle model and log the error.

To prepare your model for Model Deployment Xcode now have an option to create a model archive from your model. Then you only have to upload the archive in the Model Deployment Dashboard. Additionally, before making the deployment you can add some targeting rules to assign different models to specific device populations. That's so good because your app doesn't have to have all the models for the different devices.

<div style="text-align: center"><img width="70%" src="/images/whats-new-on-apple-machine-learning-at-wwdc-2020/3-without-model-deployment.png" /><p class="small">Without Model Deployment.</p></div>

<div style="text-align: center"><img width="70%" src="/images/whats-new-on-apple-machine-learning-at-wwdc-2020/4-with-model-deployment.png" /><p class="small">With Model Deployment.</p></div>

Talking about security, now Xcode can encrypt your model at build time. With this new feature, you can distribute your models knowing that they are encrypted at rest and in transit. The only time where the model is decrypted is when it is loaded on memory, ready for use.

First, you have to create a key for the model in the Model Encryption section at the model file in Xcode. Then, depending on your deployment model method you have to specify that the model will be encrypted with the created key. While loading the model in the code for use in the app, the first time the app loads the model it requires an internet connection so it is highly recommended to use the new async load method which gives you an opportunity to handle model errors.

<div style="text-align: center"><img width="70%" src="/images/whats-new-on-apple-machine-learning-at-wwdc-2020/5-model-encryption.png" /><p class="small">Model encryption.</p></div>

## **Build an Action Classifier with Create ML**

There are some new models you can train in Create ML, if you want to classify different types of actions from videos now you can do it. This new feature is powered by Vision's body pose estimation, so humans are the target of these actions, not animals or objects. 

<div style="text-align: center"><img width="70%" src="/images/whats-new-on-apple-machine-learning-at-wwdc-2020/6-action-classifier.png" /><p class="small">How to create an Action Classifier.</p></div>

The videos have to have one action type per video, several seconds per video and, only one person, with the entire body. If you have a video with different types of actions, you can separate the video with a video editor, or also you can create an annotation file indicating the time of the different actions in the video.

It's a good practice train the model with an extra class called Other, where you place videos with people walking or just standing, not to obtain false results while the person on the video is doing nothing.

Before start training the model, there are few parameters you can edit. Action duration represents the length of the action you try to recognize. You have to analyze your actions to recognize and set that parameter correctly to obtain better results on your model. Also, there is a horizontal flip option for data augmentation to increase the training data without adding new videos.

Since the model takes a prediction window with poses of the frames recorded in the last X seconds set as action duration, as input, you have to make VNDetectHumanBodyPoseRequest, to extract these poses.

<div style="text-align: center"><img width="80%" src="/images/whats-new-on-apple-machine-learning-at-wwdc-2020/7-action-classifier-making-prediction.png" /><p class="small">Steps for making a prediction.</p></div>

## Build Image and Video Style Transfer models in Create ML

The other new type of model is the Image and Video Style Transfer model. After selecting that option on Create ML, you only have to set a Training Style Image which gives the style patterns you want to transfer, a Validation Image to validate the transfer while the trining is running and, Content Images to train the model with images that represent the type of images you will use in your app.

The default settings work very well but you can adjust them. You have to select if you will use the model for images or videos, then you can select the number of iterations in the training and, there are two parameters that will define your model. Style Strength indicates how much style the model will transfer from the image and Style Density determines how much detail of the style the model will transfer.

<div style="text-align: center"><img width="90%" src="/images/whats-new-on-apple-machine-learning-at-wwdc-2020/8-style-transfer-model.png" /><p class="small">Style and Stylized result with a high Style Strength and low Style Density.</p></div>

## Control training in Create ML with Swift

Although Create ML gives us a very easy way to create Core ML models, it's very limited. Trying to improve that, now Apple adds the possibility to control training using swift to save time and obtain better results while creating a new model. That's ideally to use un Playground where it instantly shows the results of the code that you write. With the new API, you can call a training method that will train the model and return a job. Before that, you have to specify the session parameters. These parameters consist of sessionDirectory, reportInterval, checkpointInterval, and iterations. The job returned in the training method, contains progress, checkpoint, and result publishers. It also has a cancel method that allows you to stop the training at any point. Registering a sink in the job, you can handle success and errors, and obtain the resulting model. Also, you can observe progress details with the progress publisher.

Now with checkpoints, you can capture the state of your model over time. One benefit of that is when your model stop training but you notice that the accuracy is still growing up, so you can resume the training increasing the number of iterations without training the model again from the scratch. 

<div style="text-align: center"><img width="65%" src="/images/whats-new-on-apple-machine-learning-at-wwdc-2020/9-control-training.png" /><p class="small">Checkpoint availability on different model types.</p></div>

## Get models on device using Core ML Converters

Create ML is an intuitive and easy tool for training models, but it is very simple especially for complex projects. It's common to use other tools like TensorFlow or PyTorch, but these tools can't create .mlmodel by themselves to use in Core ML. That's where coremltools appears, an Apple framework that allows you to export your model in .mlmodel format.

This year Apple focused on the two most commonly used frameworks, TensorFlow and PyTorch. To convert TensorFlow, tf.keras, and PyTorch models, now you have to use the new single conversion API with its new unified interface.

<div style="text-align: center"><img width="65%" src="/images/whats-new-on-apple-machine-learning-at-wwdc-2020/10-coremltools4.png" /><p class="small">New unified convert() method.</p></div>

What the new convert() function is doing from behind is to inspect the model format and choose the correct converter for it. Then it converts the model into an intermediate representation called MIL. Having the model in a MIL format gives us the possibility to optimize the model in different ways, for example removing unnecessary operations. The interesting part of MIL is that allows you to deal with layers that it doesn't understand yet, you can split it up into more primitive MIL operations, like matrix multiplications, or other arithmetic.