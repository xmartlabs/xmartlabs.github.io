---
layout: post
title:  "XLForm: Using NSPredicates to change form structure."
date:   2015-04-28 15:38:56
author: Mathias Claassen
categories: XLForm
author_id: mathias

---

In almost every app you might ever build you will have a profile and settings view and they may also have many forms. Using [XLForm](https://github.com/xmartlabs/XLForm) we speed up the development time spent on these view controllers. XLForm allows us to define and manipulate forms dealing with a high level DSL abstraction (XLFormDescriptor, XLSectionDescriptor, XLRowDescriptor) to define any customized table-view form with a flexibility you might have never imagined before.

We have used XLForm in many apps and it's really worth it but at the same time we realized that we spent a considerable amount of time making a row visible or disabled depending on the value of another row or section.

Up to now, when you wanted a row to disappear when another row changes then you had to manually remove it from the form in the moment that change happens and maybe insert it again later. This requires you to implement a method to know when the relevant row value changes, keep a strong reference to the dynamic row and update the form accordingly to reflect it's new state.


# The New Way

This post introduces a brand new XLForm feature to achieve the same and more with much less effort.

We started to dig deeper into a research process in order to find an elegant solution to declaratively define when a row/section should be hidden or disabled (read-only mode).

We had many things in mind during this process:

* XLForms needed to ensure backwards compatibility.
* We wanted to define the conditions through an expressive language, to be able to support complex business logic.
* We agreed that the best place to define a conditional state for a row is within that row, and not using another structure.
* The order in which the rows and it's dependencies are declared will not affect the evaluation. This means that the developer can define these conditions even though the condition has dependencies over rows not added to DSL yet.
* Never re-evaluate conditions unless it's completely needed.


## Our solution

We chose the `NSPredicate` class to define conditions because NSPredicate provides us with a powerful, expressive and standard language to do so. We could have taken another approach defining our own language and structure to express the conditions but the advantages of NSPredicate are clear and speak for themselves.

We added `hidden` and `disabled` properties to `XLFormRowDescriptor` and `XLFormSectionDescriptor`. These properties can be set with an NSPredicate, a NSString or a NSNumber boolean.  When a NSString is set, a NSPredicate will be generated taking the string as the NSPredicate `format` parameter.

{% highlight objc %}
@property id disabled;
@property id hidden;
{% endhighlight %}


## How to use it

This section will focus on the `hidden` property but the `disabled` one is analog. Both properties accept a `NSPredicate` value, a `NSString` value or a `NSNumber` boolean.


By default the value of these properties is `@No` that means they will be visible and enabled all the time.

To conditionally hide or disable a row we can set either a `NSPredicate` or a `NSString` that will be transformed internally to NSPredicate.

Setting the property to a `NSString` is faster when the predicate is simple because there is no need to add `.value` after each row variable (we do that internally). For complex predicates we recommend to set up the `hidden` property using a `NSPredicate` instance.

An example predicate string could be the following:
{% highlight objc %}
row.hidden = [NSString stringWithFormat:@"$%@ contains 'Music'", hobbyRow];
{% endhighlight %}

the same predicate set up using a NSPredicate:
{% highlight objc %}
row.hidden = [NSPredicate predicateWithFormat:@"$%@.value contains 'Music'", hobbyRow];
{% endhighlight %}

Notice that `%@` will be replaced by `hobbyRow`'s tag string (XLForm uses unique tags as an abstraction to identify rows). We can also get the same result writing the condition as (hobbyRowTag is the hobbyRow tag value):

{% highlight objc %}
row.hidden = [NSPredicate predicateWithFormat:@"$hobbyRowTag.value contains 'Music'"];
{% endhighlight %}


When the predicate is evaluated every tag variable gets substituted by the corresponding row descriptor. For this purpose the XLFormDescriptor has a dictionary which maps tags to rows.

When the argument is a NSString, a `.value` will be appended to every tag unless the tag is followed by `.isHidden` or `.isDisabled` (or `.value` obviously). This means that a row (or section) might depend on the `value` or the `hidden` or `disabled` properties of another row.

When an incorrect predicate is set and it cannot be parsed then an exception will be thrown.

At any time you can get the `hidden` or `disabled` evaluated boolean values invoking `isHidden` or `isDisabled` methods respectively.

{% highlight objc %}
-(BOOL)isDisabled;
-(BOOL)isHidden;
{% endhighlight %}

Probably you will never have to invoke these previous methods directly from your own code, most of the time XLForm internal classes will use them.


##Let's see it in action

Let's see this simple example:

![Screenshot of hiding rows](/images/xl-form/XLFormBlogExample.gif)

Suppose we have a form that questions the users hobbies. So we will have a multiple selector where the user can choose some of "Sport", "Music" and "Films". Now if the user selects "Sport" we want him to name his favourite sportsman but if the user selects "Films" we want to ask which is the best film he has seen or which is his favourite actor. And so on.

So we need to define a section with the first question:
{% highlight objc %}
section = [XLFormSectionDescriptor formSectionWithTitle:@"Hobbies"];
[form addFormSection:section];

XLFormRowDescriptor* hobbyRow = [XLFormRowDescriptor formRowDescriptorWithTag:kHobbies
                                                                      rowType:XLFormRowDescriptorTypeMultipleSelector
                                                                        title:@"Select Hobbies"];
hobbyRow.selectorOptions = @[@"Sport", @"Music", @"Films"];
hobbyRow.value = @[];
[section addFormRow:hobbyRow];
{% endhighlight %}

Then we define a section for the next questions but we just want to show this section when at least one option is selected in the first row:
{% highlight objc %}
section = [XLFormSectionDescriptor formSectionWithTitle:@"Some more questions"];
section.hidden = [NSPredicate predicateWithFormat:[NSString stringWithFormat:@"$%@.value.@count = 0", hobbyRow]];
[form addFormSection:section];
{% endhighlight %}

Then we define some rows that depend on the value of the first row. They are just questions depending on the selected hobbies:
{% highlight objc%}
row = [XLFormRowDescriptor formRowDescriptorWithTag:kSport
                                            rowType:XLFormRowDescriptorTypeTextView
                                              title:@"Your favourite sportsman?"];
row.hidden = [NSString stringWithFormat:@"NOT $%@.value contains 'Sport'", hobbyRow];
[section addFormRow:row];

row = [XLFormRowDescriptor formRowDescriptorWithTag:kFilm
                                            rowType:XLFormRowDescriptorTypeTextView
                                              title:@"Your favourite film?"];
row.hidden = [NSString stringWithFormat:@"NOT $%@ contains 'Films'", hobbyRow];
[section addFormRow:row];

row = [XLFormRowDescriptor formRowDescriptorWithTag:kFilm2
                                            rowType:XLFormRowDescriptorTypeTextView
                                              title:@"Your favourite actor?"];
row.hidden = [NSString stringWithFormat:@"NOT $%@ contains 'Films'", hobbyRow];
[section addFormRow:row];

row = [XLFormRowDescriptor formRowDescriptorWithTag:kMusic
                                            rowType:XLFormRowDescriptorTypeTextView
                                              title:@"Your favourite singer?"];
row.hidden = [NSString stringWithFormat:@"NOT $%@ contains 'Music'", hobbyRow];
[section addFormRow:row];
{% endhighlight %}

So, that code is pretty straightforward if you have some XLForm experience. And the predicates are easy to understand as well.

You can find the full [source code][BlogExampleViewController] in the examples of the XLForm project.

Behind the scenes
-----------------
What does XLForm do to get this working?

The XLFormDescriptor now has two collections of sections, one that contains all sections and one that contains the visible sections. Similarly, the XLFormSectionDescriptor has a collection with all rows and one with shown rows. So when a predicate is evaluated and the result says that a row or section must be hidden (or shown) then that row or section will be removed (or added) from the corresponding collection of visible items. A delegate method will be called to reflect the changes on the form.

As mentioned above, the form descriptor has a dictionary where all rows can be found by their tag. This means you should never have more than one row with the same tag. This dictionary is used mainly to substitute the variables of the NSPredicates, as these will just contain the tags of the wanted rows. It also makes searching for a row by tag faster than before.

Additionally, the form descriptor will have another dictionary which stores the observers for each row in an array. This means we have all the dependencies in one place and they will update each time a predicate is updated. We will parse the predicate to get all the rows that it depends on and store this information in the dictionary. So that when a row changes we can re-evaluate all the predicates that depend on it just by getting the list of dependant objects from this dictionary. We do also separate those whose `disabled` predicate does depend on that row from those whose `hidden` predicate does.

XLForm will not re-evaluate the predicates each time `isHidden` or `isDisabled` gets called but just when the value (or hidden/disabled status) of the rows it depends on changes. When this happens and the predicate's return value changes, it will automatically reflect that change on the form.

In order to avoid evaluating the predicate each time somebody checks if a row or section should be hidden, the last evaluated value will be stored in a cache. This cache is a simple private NSNumber property so that it will be initialized with nil but otherwise contain `@YES` or `@NO`.

To know when to reevaluate a predicate, there is a private boolean property that is true when one of the rows this object depends on has changed. So the next time the property is checked it will re-evaluate the predicate. In the case of the hidden property we immediately call the `isHidden` method because we want the form to update automatically and not just the next time somebody checks this hidden property.


That's it. I hope this post was helpful to you and that you will enjoy using this new feature!


[XLForm]:      https://github.com/xmartlabs/XLForm
[BlogExampleViewController]:		https://github.com/xmartlabs/XLForm/blob/master/Examples/Objective-C/Examples/PredicateExamples/BlogExampleViewController.m
