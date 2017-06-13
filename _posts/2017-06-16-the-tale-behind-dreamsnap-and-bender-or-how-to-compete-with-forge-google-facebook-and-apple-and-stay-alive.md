---
layout: post
title: The tale behind Dreamsnap & Bender, or how to compete with Forge, Google, Facebook and Apple and stay alive :)
date: 2017-06-16 12:13:11
author: XL AI Team
categories: Machine Learning, Deep Learning, Neural Networks, iOS, Metal, Style Transfer
author_id: xlai
markdown: redcarpet

---

Since we started playing with Machine Learning at Xmartlabs, we didn't imagine we will live in a kind of soap opera world with all kind of joys and sorrows. Looking ahead, we experienced and learned a lot while validating our ideas. So in this post we are gonna talk about what [Dreamsnap](https://getdreamsnap.com) and [Bender](https://github.com/xmartlabs/Bender) are and our journey through their inception.

# Dreamsnap

[Gatys et al. 2015](https://arxiv.org/abs/1508.06576) showed a superb technique to transfer the style of an artist paint to a real photography to generate a new image, as if it were painted by the same artist. It's based on carrying out gradient descent on the image (instead of on the weights) on VGG-16, using a loss function that accounts for the similarity of this new image with respect to certain digest values of the style image at specific layers and particular values of the content image that other layers. Later, [Justin Johnson et al. 2016](https://arxiv.org/abs/1603.08155) showed a way to train a neural network to learn the characterization of an artist paint to be subsequently applied to images in a fast way.

We were fascinated with the idea of doing real-time style transfer on mobile. Something like [Prisma](https://prisma-ai.com/) but in real time. At the end of October 2016 at Xmartlabs we decided to start building an app for **offline real-time style transfer**. The question was how to do it on mobile?

<div style="text-align:center;margin-bottom:20px">
  <img width="400px" src="/images/dreamsnap-bender/palacio-salvo.jpg" alt="Palacio Salvo" />
  <img width="400px" src="/images/dreamsnap-bender/palacio-salvo-paezvilaro.jpg" alt="Palacio Salvo with Paez Vilaró style" />
</div>

# Is there a way?

The first that came to our mind was using TensorFlow from Google. TensorFlow for Android brings support but leaving a big footprint, considering the size of the native libraries (right now it does a better work with [TF Slim](https://github.com/tensorflow/tensorflow/tree/master/tensorflow/contrib/slim)). Also, the API could be better. Right now, [it's much better](https://github.com/tensorflow/tensorflow/tree/master/tensorflow/examples/android/) and by using integers with [quantization](https://www.tensorflow.org/performance/quantization) it improves a lot, but with GPU usage it would be better.

On the other hand, TensorFlow on iOS right now [adds an overhead of 23 MB to the apps](https://github.com/tensorflow/tensorflow/tree/master/tensorflow/examples/ios#reducing-the-binary-size), apart from the 450 MB size of their experimental pod. Besides, you need to deal with native libs in a non-common setup using [Bazel](https://bazel.build/). However, the worst of all was the lack of support for the GPU, in this case [the lack of support to Metal declared by the TensorFlow team](https://github.com/tensorflow/tensorflow/issues/4846). There was the option to use [quantization](https://www.tensorflow.org/performance/quantization), but it wasn't the same.

What to do then? [Metal Performance Shaders](https://developer.apple.com/documentation/metalperformanceshaders) provide some layers implementations for iOS, such as [convolutions](https://developer.apple.com/documentation/metalperformanceshaders/mpscnnconvolution) and [dense](https://developer.apple.com/documentation/metalperformanceshaders/mpscnnfullyconnected) layers. On the contrary, Android doesn't provide implemented layers. So, by the end of November 2016 we started the development of Dreamsnap on iOS, and at the same time we started with Bender. Dreamsnap for Android started later and it's still under development :D

<div style="text-align:center;margin-bottom:20px"><img src="/images/dreamsnap-bender/the-bender.png" alt="Bender Rodríguez" /></div>

# Next: revelation

At the same time, [Facebook announced that is working on style transfer](https://www.digitaltrends.com/social-media/facebook-prisma-filters/), and later they will release [Caffe2](https://caffe2.ai), a Caffe fork.

<div style="text-align:center;margin-bottom:20px"><img src="https://media.giphy.com/media/aZ3LDBs1ExsE8/giphy.gif" alt="wtf" /></div>

On January 2017 we got something working and at the beginning of March we had our first internal version of the app. But what about Bender, it's core engine? It was working just fine, but we wanted to have a simple API and support loading TensorFlow graphs, so we started working on it. And that was when alternatives started to arise.

In parallel, [TensorFlow community started to discuss, develop and contribute together to make TensorFlow support Metal Performance Shaders](https://github.com/tensorflow/tensorflow/issues/7958). We expected (and still expect) that [in the long-term TensorFlow will be the Neural Networks library of reference](https://twitter.com/fchollet/status/871089784898310144) for multiple platforms (and Keras, due to [the merger](http://www.fast.ai/2017/01/03/keras/)), so considering this addition and taking into account the time that TensorFlow will take to excel in iOS, Bender won't have a long future but will help the community in their way.

<div style="text-align:center;margin-bottom:20px"><img src="https://pbs.twimg.com/media/DBa7RkFUQAAYynh.jpg:large" alt="Deep Learning framework search interest over time" /></div>

Around mid March we got our first version of Dreamsnap completely functioning. We kept working hard on it, doing experiments, optimizations and improving the user experience.

Later, on April 20, [Facebook showed efforts to support Metal within Caffe2](https://github.com/caffe2/caffe2/commit/d0ce496d2fdf9c0d0ded73f8552e18a82a85e1ba). The next day, [Forge](https://github.com/hollance/Forge), "a collection of helper code that makes it a little easier to construct deep neural networks using Apple's MPSCNN framework", was released.

<div style="text-align:center;margin-bottom:20px"><img src="https://media.giphy.com/media/umMYB9u0rpJyE/giphy.gif" alt="shocked" /></div>

Anyway, we end up releasing a version of the app by the end of May. Bender was still under development and we wanted to release it as soon as possible.

Google, Facebook and Matthijs Hollemans (from Forge) were competing with us. What else could happen? Well, Apple [have accumulated tons of money in the banks](https://bgr.com/2017/05/01/apple-earnings-cash-overseas-bank-accounts/) and they had a Machine Learning debt to pay. [Something new was expected from them](http://www.cnbc.com/2016/12/03/apple-says-its-investing-heavily-in-machine-learning-in-letter-to-nhtsa.html). Also, rumors said [they were developing their own Neural Engine chip](http://www.barrons.com/articles/apple-developing-neural-engine-chip-says-bloomberg-1495830777), something like [Google TPUs](https://en.wikipedia.org/wiki/Tensor_processing_unit) but for mobile devices. We expected them to make improvements to Metal and related tools, but for us it was unlikely that they would provide a full stack library. We were obviously wrong.

# Synchronism

So we aimed to release Bender before the WWDC, and it happened: on June 2 afternoon, we released Bender. On June 5 morning [it got a lot of attention](https://news.ycombinator.com/item?id=14487259) and it got around 500 stars on GitHub that day. Hours later, Apple announced their brand new Machine Learning framework, Core ML.

<div style="text-align:center;margin-bottom:20px"><img src="https://media.giphy.com/media/1iUZa41YxKQtaJq0/giphy.gif" alt="horror" /></div>

What happens now? Well, one of our objectives is now accomplished: there are several options now for running real-time neural networks on mobile. And we are indeed in the wave crest :D, as these big buddies were working on alternatives. And that's a price we have to pay. Even though they have tens or even hundreds of collaborators in their projects, we are at least pointing to the right direction.

Talking about Core ML, it basically implements most of Bender's features. It provides Python conversion tools to translate the most famous and common Deep Learning models to iOS, suprisingly coincident with Bender and [Benderthon](https://github.com/xmartlabs/benderthon). It has to be said that Core ML does not convert TensorFlow directly as Bender does which is an advantage for Bender. Core ML does, however convert Keras models which can be built on TensorFlow. However, only Keras version 1 is supported. Another advantage of Bender over Core ML is that it supports iOS 10 while Core ML is available only from iOS 11.

The disadvantages of Bender compared to Core ML are numerous: performance, number of supported layers, memory and GPU resource management. These are factors which require a lot of specific knowledge about Apple's hardware and also a lot of tuning time which we do not have (but Apple does).

One thing that is still to be seen is the extensibility of Core ML. It does not seem possible to add custom layers to a model. This is a serious limitation as there are new papers introducing new layers released all the time and by using Core ML we completely depend on Apple deciding which layer to implement and which not. I believe this is Core ML's most serious drawback. Bender was designed so that creating a custom layer is damn easy (well, you have to implement it, but at least you can). Maybe open sourcing Core ML would be a great move, so the community can contribute on this.

Overall, Bender is safe and sound! Some use cases are not covered by Core ML. Consider for example that Dreamsnap is based on a TensorFlow net, which cannot be easily converted to a ML Model. We would need to fork [coremltools](https://pypi.python.org/pypi/coremltools), which albeit being open source its repo cannot be found anywhere, so contribution is not remotely like when using GitHub (until someone creates an unofficial repo on GitHub…). And custom layers we have can't be implemented! And it only supports Python 2.7! So our only option for Dreamsnap right now is to use Bender.

# Nerd stuff we have learned on the way

We found out some interesting things about MPSCNN and Metal while developing DreamSnap and Bender. It seems both of them have several things that could work better in the future and certainly Metal 2 and Metal Performance Shaders in iOS 11 will address some of them.

* An MTLTexture in Swift is mapped to either a `texture2d_array` or `texture2d` in Metal depending on the amount of its feature channels (being more than 4 or not). As these are different types in Metal, every shader has to be implemented at least twice, once for `texture2d` and once for `texture2d_array`. But if the shaders depends on two or more textures then the amount of different functions you might have to write grows exponentially. This introduces the need to use macros and other stuff which makes the code dirtier to read, understand and maintain. We hope Apple addresses this in the future.

* We experimented with both `MPSImage` and `MPSTemporaryImage` which is recommended by Apple and we got certain image quality problems when using `MPSTemporaryImage`. When running style transfer there were some artifacts on the resulting image which disappeared when using `MPSImage` as Bender pre-allocates MPSImage's at initialization time we did not notice any memory or performance difference.

* Xcode's GPU capture shows that some MPSCNN layers are pretty slow, maybe due to the fact that their threadgroup sizes contain only 4, 8 or 16 threads. Given that the thread execution width is 32, this should always result in sub-optimal performance to our understanding. This was tested on iOS 10 before the release of iOS 11 and its updates to MPS. Xcode's GPU frame capture did even show that our custom implementation of the transposed convolution runs over 25% faster than a MPSCNNConvolution of the same size!

* There is a [Metal Shading Language Specification](https://developer.apple.com/metal/Metal-Shading-Language-Specification.pdf) which explains the data types and functions provided with Metal but overall there is little information (apart from some WWDC videos) about the specs of the GPUs and the best practices for optimal performance. It can be quite time-consuming to find out which implementations work best, even more due to the inability to run unit tests with Metal Performance Shaders.

This has been a great experience for us. Stay tuned. We will be writing more about Bender and Machine Learning.
