---
layout: post
title: Metal in Simulator
date: 2017-10-23 09:00:00
author: Santiago Castro
categories: iOS,Metal
author_id: santiago
markdown: redcarpet

---

The errors to compile Metal frameworks on simulator that we documented are the following:

* The main problem is that MetalPerformanceShaders headers are not present when targetting the simulator. We see that this is fixed on Xcode 9.
* In CoreVideo, some CVMetalTexture and CVMetalTextureCache declarations are missing if Metal is not available (which can be read in the corresponding header files).
* "currentDrawable" property of MTKView is of type MTLDrawable in the simulator but of type CAMetalDrawable (a subtype) in the device.
* CAMetalDrawable does not exist for the target simulator.
* MTLFunctionConstantValues is not implemented on simulator. This one is fixed in Xcode 9 too.

It can be thoroughly researched if you run:

```shell
cd /Applications/Xcode 9.app/Contents/Developer/Platforms
diff -rq -x "*.tbd" iPhoneOS.platform/Developer/SDKs/iPhoneOS.sdk iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk
```

Among the output, it yields differences in:

* CoreVideo/CVPixelBufferIOSurface.h
* NSCalendar, NSDateFormatter and NSLocale
* Metal/MTL{Device,Texture}.h
* MetalKit/MTKView.h (this explains the currentDrawable thing)
* OpenGLES/EAGLIOSurface.h
* QuartzCore/{CAMetalLayer,CoreAnimation}.h (these explain the other 2 missing types)

This was not only spotted by us. You can see this blog post, that states "However there is a catch, not only does it only work on the latest Apple A7 and A8 Chips but any app using Metal Shaders cannot be compiled for the simulator.": https://medium.com/the-sup-app/bare-metal-working-with-metal-and-the-simulator-70e085e3a45
Among the PITAs:
* Not being able to upload a pod to CocoaPods.
* Not being able to create a framework to work with Carthage.
* Not being able to run an app on a simulator to use features that don't depend on Metal shaders.
* Incapable of compiling unit tests (not to mention running them).
* Not being able to test automatically (maybe with a CI server) with simulators the parts of an app that don't depend on Metal shaders.

We believe this is a barrier to build apps with quality.

That's why we created MetalPerformanceShadersProxy: https://github.com/xmartlabs/MetalPerformanceShadersProxy

In our opinion, the best solution would be that the headers are exactly the same both when targeting simulator or device, but to have stubs for the Metal functions on simulator (or to crash on runtime).

We include an example project for Xcode 9 to reproduce the problem. Try building both for simulator and device to compare (not running it, as it doesn't make sense).
