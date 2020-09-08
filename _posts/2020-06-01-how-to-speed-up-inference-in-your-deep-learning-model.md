---
layout: post
title: "5 Practical Ways to Speed Up your Deep Learning Model"
excerpt: "Did you obtain good accuracy with your deep learning model only to find out that running it on production takes too long for your use case? Are you lost on how to optimize your model's inference speed? Then this post is for you."
date: 2020-06-01 10:00:00
author: Renzo Gambone
tags: [Xmartlabs, Deep Learning, Optimization]
category: machine-learning
author_id: renzo
featured_image: /images/how-to-speed-up-inference-in-your-deep-learning-model/speed-up.jpg
show: true
crosspost_to_medium: false

---

Did you obtain good accuracy with your deep learning model only to find out that inference time isn't enough to deploy on production? Are you lost on how to optimize your model's inference speed? Then this post is for you.

<div style="text-align: center"><img width="100%" src="/images/how-to-speed-up-inference-in-your-deep-learning-model/speed-up.jpg" /></div>


Data Science projects have the peculiarity that your focus must constantly shift across completely different requirements.

- How will you obtain the data? Are you creating the dataset? (if so what exactly should you label? how many samples should you invest in?)
- How will you make use of the model? A model is nice and fine, but how do you make a product that adds value to the user?
- What model will you implement? There are many scientific papers out there, and often from the time you begin research until you are in the middle of implementation, the state of the art has already changed.
- But the most important question of all. Is all of this viable? Can a model be trained using the data your budget allows? Will it perform sufficiently good for the use case we intend to apply it to?

And it is often that in this last question we focus mostly on obtaining the best accuracy for the dataset.
This makes the most sense, as it allows us to validate if the project is feasible.
If we need to invest in more data for the model to fulfill its goal.

For some projects, slow inference speed is not a dealbreaker.
But what happens when it is?

This can happen to any deep learning project, but is often the case when deploying a project that involves object detection to production.
When images from a camera are consumed each processed frame per second counts.

Investing more on hardware can definitely fix or alleviate our problem.
But if we intend on selling our product as a solution (say a video camera with an integrated edge GPU) this linearly increases the cost of the product up to a point when we are not able to make returns from our investment.

---

Here at Xmartlabs we experienced this issue, researched what options we had available, and developed a checklist of sorts regarding different approaches we can take in order to improve inference time and how these can be combined.

---

## Altering the model's weights

The first step on optimizing our model runtime is to make the most out of our model's architecture.

### Post-training quantization

Converting the model's weights from floating point (32-bits) to integers (8-bits) will degrade accuracy, but it significantly decreases model size in memory, while also improving CPU and hardware accelerator latency.

How to implement this approach will vary greatly depending on what framework is the model implemented on.

If the model is implemented on TensorFlow that's great! Fortunately for you TensorFlows [gives native support to model quantization on GPU](https://www.tensorflow.org/api_docs/python/tf/quantization/quantize).

If the model is implemented on PyTorch... Well, then it's not that great. At the moment of writing this article PyTorch's support to quantization is only on a CPU backend. Future PyTorch development aims to provide support for quantization on GPU, but at the time this is not the case in the [stable version](https://pytorch.org/docs/stable/quantization.html).

So in order to quantize a PyTorch model, it must be run on [NVIDIA TensorRT](https://developer.nvidia.com/tensorrt), but for running it in TensorRT runtime the PyTorch model must be converted.
As of now, the only way to achieve this conversion is to first convert the PyTorch model to [ONNX](https://github.com/onnx/onnx), and then finally convert it to TensorRT.

**Our experience**

When we tried to quantize a PyTorch [Faster R-CNN](https://arxiv.org/abs/1506.01497) model we, unfortunately, run into multiple issues.

On paper, all this process makes sense and should be easy enough to do.
However, in practice issues may occur from all these conversions.
This is mainly due to the fact that the development of PyTorch, ONNX, and TensorRT goes in multiple directions when a feature is added into one an old integration won't necessarily support it.

- You may be able to run the model on ONNX, but [issues may occur when converting ONNX to TensorRT](https://github.com/onnx/onnx-tensorrt/issues/302), especially with some layers, [such as the Resize layer in PyTorch](https://github.com/NVIDIA/TensorRT/issues/284).
- At the time we tried to do this conversion, it happened to us that [models built with PyTorch v1.3 or higher can be converted and run in ONNX Runtime, but can't be run through the ONNX optimizer](https://github.com/onnx/onnx/issues/2417) (which makes important improvements in the converted network).

Do keep in mind that these issues may or may not arise depending in the architecture of our model, we had no issue converting a simple CNN network, however with the [Faster R-CNN](https://arxiv.org/abs/1506.01497) implementation we were working with, that's another story.

Some users have managed to solve their issues during conversion by downgrading PyTorch.
However, this limits the ONNX `opset` you can access, which in turn also limits what TensorRT version will you be able to run your engine with.

Hopefully, all these issues will be solved in the near future...
But considering that all these frameworks have high development speed it's likely that there will always be short-lived incompatibility periods.

Post-training quantization is definitely a powerful tool, and although some PyTorch models can't be quantized with this method, you should still give it a shot, considering that after exporting your model to ONNX it doesn't take much effort trying to convert it via command line using `trtexec`, which by the way is readily available along with TensorRT in the [Nvidia TensorRT docker container](https://ngc.nvidia.com/catalog/containers/nvidia:tensorrt).
If PyTorch quantization fails then we'd advise on looking for a TensorFlow implementation if quantization is still an approach you want to go for.

---

### Converting the model to half-precision

In a similar fashion to the previous approach, this alternative aims to trade-off accuracy for speed and memory efficiency.
It offers a middle point between FP32 and UInt8, where:

- The model size is reduced by up to half (instead of by up to 75%)
- The diminish of accuracy is less than UInt8, which brings the accuracy trade-off even more closer to FP32.
- Most neural network weights [already fall into this range](https://devblogs.nvidia.com/mixed-precision-training-deep-neural-networks/), although doing this conversion risks gradient underflow (small gradient values becoming zeroes), which prevents the network from correctly learning anything.

Considering that nowadays the architecture of the GPUs is shifted to being optimized for FP16 operations, especially using tensor cores, this approach offers a great trade-off for increasing speed.

Moreover, it turns out that not all layers of the network take a significant time during inference.
This means that we can find an even better trade-off by using half-precision only in the layers that need a speed boost (such as convolutions) and leave the rest in FP32.
Even better, having some layers in FP32 helps preventing gradient underflow.

This approach is called [Automatic Mixed Precision](https://arxiv.org/abs/1710.03740), and it differs on quantization in that rather than post-processing the weights of a trained model, the model should be trained, using mixed precision from the get-go.

**Our experience**

TensorFlow once again goes great extents to make our lives easier by [giving us native support to achieve this](https://www.tensorflow.org/api_docs/python/tf/train/experimental/enable_mixed_precision_graph_rewrite).
Whereas if you're using PyTorch, [NVIDIA Apex](https://github.com/NVIDIA/apex) is the tool you should use, which fortunately according to our experiences has way fewer issues than the pain that is doing quantization with a PyTorch model.

Integrating Apex is advertised as a mere addition of three lines to your code.
And actually, it is not much more than that.
You must initialize it, change the backward pass call to use Apex's scaled loss, and modify the way you save and load checkpoints.

```python
from apex.fp16_utils import *
from apex import amp, optimizers
...
# Initialization
opt_level = 'O1'
model, optimizer = amp.initialize(model, optimizer, opt_level=opt_level)
# Train your model
...
with amp.scale_loss(loss, optimizer) as scaled_loss:
    scaled_loss.backward()
...
```

The results are pretty good as well.
How much speedup you get will strongly depend on the model you are training, but we got over 30% speed improvement without any impact on the accuracy of our Faster R-CNN model.

---

## Finding the best model

We tried to extract every last drop out of our model in order to improve inference time.
But maybe it wasn't enough.
Maybe our model's architecture is simply too big for the problem we are attempting to solve.

Would diminishing the size of our model also decrement our accuracy? Not necessarily! This not only depends on the specific nature of the problem we want the model to solve.
But also through research new model architectures are being constantly proposed and experimented with, often resulting in a slimmer architecture that through design achieves even better accuracy!

What's even better is that if we implemented any of the previously described approaches we can then reuse that work with any modification we decide to make to our model.

### Changing the model's backbone

When doing transfer learning we can view our model's backbone and the dataset on which it was pre-trained as a mere hyperparameter we are using in Grid Search.

We don't need a fully trained model to evaluate inference time.
This allows us to do experimentation with multiple backbones, and see which offer a better improvement to inference time.

We should expect a fair amount of improvement to our inference time, keeping in mind that our model still has to go through a backbone, and that although a fair amount of inference time happens at the backbone, the outer layers of our model can still have a big impact on inference time.

After researching which backbones offer better timings a model using this would need to be fully re-trained for us to analyze the backbone's impact in the model's accuracy.

---

### Changing the whole model

A data scientist's daily job is not only to work on data science projects but also on keeping an eye on research and how it affects the current state of the art.

Even though our model's backbone is a big component of our model, we can only do so much by trying to optimize something keeping other things static.

If after all approaches inference time is still not of your liking, then it's time to look at newly developed models and validate that what these models promise applies to your use case.

**Our experience**

Taking the problem of Object Detection as an example, some models are specifically optimized for speed such as YOLO, while at the same time other models offer multiple configurations that vary on the depth of the neural network and the size of the input they receive such as [EfficentDet](https://arxiv.org/abs/1911.09070), allowing you to train and compare how the accuracy vs speed trade-off varies.

What's more, the amazing machine learning community usually provides Open Source implementations of these models, for us to collaborate and help us not to reinvent the wheel! Such as this [PyTorch implementation of EfficientDet by zylo117](https://github.com/zylo117/Yet-Another-EfficientDet-Pytorch).

---

## Knowledge Distillation

Our last proposed option to improve our model's inference time is through knowledge distillation.

Say we have a big model (or an ensemble of models) which predicts with great accuracy, but its inference speed is undesirable.

Knowledge Distillation proposes to train a smaller model with fewer parameters by using our big model as trainer.
This essentially trains our small model to output the same predictions as our big model or ensemble.

A great advantage of this is that we aren't restricted to only using labelled data.
Beware though that our accuracy might suffer a bit, but we should be able to get a decent speed improvement out of it.

We, unfortunately, didn't have the pleasure of implementing this approach ourselves.
But  Knowledge distillation has got quite popular recently and has been used in object classification, object detection, acoustic models, and NLP, among others.

If you want to know more about knowledge distillation check out this paper by [Geoffrey Hinton et al](https://arxiv.org/pdf/1503.02531.pdf).

---

## To sum up

In this blog, we've described five approaches to improve the inference time of your deep learning model.
In particular, we'd advise you to implement them in the order we also listed them in, because any coding we do to implement model quantization and automatic mixed-precision is of great value to any further changes we make on our model.

We hope that this article was of value to you, either by giving you guidance on an issue you're currently facing or by arming you with our knowledge should the need arise for it!


**Let us know if you have an approach to speed up your model's inference that wasn't covered in this blogpost... Have any question about model's inference speed optimization? We'd be happy to answer those in the comments if we can.**

**We have covered more ML topics such as `How to convert a NN model from TensorFlow Lite to CoreML` and you can read it [here](https://blog.xmartlabs.com/2019/11/22/TFlite-to-CoreML/)**