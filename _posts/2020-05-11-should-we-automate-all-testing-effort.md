---
layout: post
title: "Should we automate all testing efforts?"
excerpt: "Have you ever found yourself wanting full automation testing? Have you ever thought that everything should be automated? Then this post is for you."
date: 2020-05-11 10:00:00
author: Jorge Gonzalez
tags: [Xmartlabs, QA, Testing]
category: business-agile
author_id: tabu
featured_image: /images/automate-manual-testing/featured.png
show: true
crosspost_to_medium: false

---

Have you ever found yourself wanting full automation testing? Have you ever thought that everything should be automated? Then this post is for you.

<div style="text-align: center"><img width="100%" src="/images/automate-manual-testing/featured.png" /></div>

# **What is testing?**

Almost sure you’ve heard about manual and automation testing and not necessarily in the IT industry.

Did you know that your toaster is tested at minimum and max temperatures to see that you don’t get your bread mildly or very toasted, but not burned? Or did you know that your microwave oven radiation emission is measured to ensure that you don’t grow a third eye while heating your food? Well, several manufacturers do those checks before you get that product.

Almost every product you buy goes over a process of quality control to ensure the quality standards are met, before it goes to the market for the public to consume it.

We can all imagine what would happen if these products weren’t tested before you bought them, so that’s why it's important to have these processes in place.

These controls are very important to be put in place in software development as well.

# **What is manual testing?**

As per definition, is a process of finding out the defects / bugs in a software program, which are found by performing verifications of a given system features to ensure they are working as they should. This process of validation and verification involves a lot of analysis and planning to ensure that the software requirements are being tested correctly in a given time frame.

As you might imagine, performing these kind of controls consumes a lot of time, mainly because a software is always evolving with updates, new feature and patches, among other things, so that means that more controls need to be put in place for new features, meanwhile the team should ensure that what existed previously is still working as expected. This causes a strain on the verification process, due to the amount of time the QA analysis and planning takes to validate and verify new implementations, meanwhile ensuring that the pre-existing functionalities were not impacted by these new changes.

So how do we help mitigate that strain? Do we hire more team members to ease the burden? That is sometimes an option, which doesn’t apply to every software development reality.

So here is where automating tasks comes to mind...

## **What is automation testing?**

Automation of processes has been around since the beginning of history in several industries. Cars manufacturers are one big example. Originally they used to have a lot of people working in an assembly line, where they had to ensure manually that each parts of the car were done correctly, and they had to assemble the car manually as well.

Eventually as new technologies were introduced to the world, some parts of this process were automated and there was no need of a human to be involved at each step of the process. This was done to improve the speed of manufacturing, which also helps the human tasks be more “relevant”, which enables them to be focused on more important tasks.

Same thing applies to software development.

By definition, automation testing means using a set of tools (frameworks) that help execute in a programatically manner, validations and verifications to a given software, with very little to almost none human effort. This helps to perform repetitive tasks in a more efficient and faster way, avoiding human errors as well. It is important to highlight that ***little to almost none human effort*** doesn’t mean a replacement for manual QA analysts, as these tools have to be analyzed, planned, developed and maintained by these analysts.

In short, the goal of automation testing is to reduce the number of verifications to be done manually, and help the team members to focus on other important tasks.

# **So is automation better than manual?**

This is the key assumption that several people tend to have, and it is not true.

As described previously, both types of testing efforts are very relevant, and actually complementary to each other. The purpose of automating is not to replace manual efforts, but to convert them to an even more efficient labor. Automation testing is a strategy, which involves developing a tool or a set of tools by analysts, and as every tool built from scratch, it needs analysis, planning and maintenance. These set of tools will produce an outcome which needs to be analyzed to take actions based on them; the difference here is that the time and effort of performing those verifications is handled by these tools, helping the team members to focus on (for instance) analysis of new features and how these can impact existing functionalities, focus on analyzing gaps between the requirements, and many other tasks that a machine cannot do.

In our past experiences with some clients we focused on identifying areas where repetitive validations and verifications were being executed on, which were consuming a lot of human effort that could be allocated on other critical features being planned or developed.

To exemplify this, in one of our customers we identified that the backend services of an Android and iOS app were constantly suffering changes, and these changes needed to be checked by the QA team every time a deploy was done, which left very little time to:

- Thoroughly check both apps actual requirements.
- Perform a regression to the apps each time a service changed to ensure that nothing was affected.

What we did was to develop an automation framework to automate the tests for each and every endpoint on the backend, which helped everyone on identifying the issues each time a deployment was done without any human effort, so the development team could fix those issues before releasing any version app at all. This was a clear case of success where everyone involved benefited from this, and the QA team could really focus on what they needed, which was performing the correct verifications on the apps.

But, this wasn’t a 100% effective solution for the whole process, and you may ask why not? Well, these constant backend services changes were because there was no clear definition from the business perspective of what the product wanted to achieve. So even though we had automated backend tests implemented and helped identify the issues immediately, if the changes from the business side were going to continue to being thrown at the team, we were going to be at square one in no time.

One of the other misconceptions people tend to have is that automation tests should be implemented for new features in parallel with development, and even though this is not entirely wrong, it is a very costly thing to do. Automation testing should be aimed to first, the repetitive tasks, and by repetitive we mean to say things that we know that were working one way, and they should keep working the exact same way after any change was introduced.

Using the same example as before, could you imagine what could have been to start automating things on a constantly changing implementation? Well, we felt this pitfall when our automated scripts started showing wrong results (false negatives). Basically the backend services weren’t doing what it was intended to do, and the script was not checking what it was supposed to be checking.

This is where QA analysts came into picture to help identify where the changes that were coming from and why, to help the business understand that there was a need to do one step backwards, sit down and really analyze what we wanted to achieve, to be able to then, move forward more comfortably.

After deep analysis, understanding the needs of business and acting as a proxy between them and the development team, we were able to achieve this.

You can get a picture of how much time consuming these tasks can be, but they need to be done by analysts, not machines.

# **So, are you still thinking about automating everything?**

Well, you simply cannot, you will always need people with strong analytical skills that will help you in identifying areas of improvement, and where the focus and effort should be aimed at.

The expertise of the QA analysts should trusted and they should have the responsibility of analyzing and identifying areas were tests can be automated, where they can automate what they consider that needs to be automated for helping their day to day work.

It's all about strategy, not the same strategy works for all projects and not all projects are built in time/effort to support long and exhaustive testing rounds, instead of spending time building a framework that you need to maintain, why don't you spend the time trying to pinpoint the improvements you encounter on the system under test. On the other hand, when you have a large size project with thousands of scenarios, you need to put your hands on automate all you can and leave the details for the manual testing. It's not one or the other, is both in the correct amount.

Excecuting any strategy with no strong foundations will eventually fall apart.

That is why we strongly believe that the automation testing role does not replace the manual one, on the contrary, they contribute to each other, and that’s why in Xmartlabs we are always seeking for the talents that can learn and collaborate among them.

**Let me know about how you handle testing efforts in your team. Have questions about manual or automation testing? I’d be happy to answer those in the comments if I can.**
