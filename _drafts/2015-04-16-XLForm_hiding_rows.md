---
layout: post
title:  "XLForm: Make rows invisible depending on other rows."
date:   2015-04-16 10:38:56
author: Mathias Claassen
categories: XLForm
author_id: mathias

---


Introduction
------------


[XLForm] allows you to define dependencies between rows so that if the value of one row is changed, the behaviour of another one changes automatically.

The XLFormRowDescriptor and the XLFormSectionDescriptor both have a property called hidden which is an `id` object and which will define if the row or section should be shown or hidden. The property can be set with a NSPredicate, a NSString or a BOOL contained in a NSNumber.  When a NSString is set, a NSPredicate will be generated taking the string as format string. In order for this to work the string has to be sintactically correct.

This post should help you understand how to use and what is behind this feature.

####Motivation

Probably your form will have rows that should just be there when the user answers something specific in another row.

Up to now, when you wanted a row to disappear when another row changes then you had to manually remove it from the form in the moment that change happens and maybe insert it again later. This requires you to observe the value of the other row and tussle with the indexes of the forms sections and rows. This post explains how to achieve the same and more with much less effort.

####Remark to disabling rows

The row descriptors also have an `disabled` property which works similarly to the `hidden` one, but sets the row to read-only mode. This post will focus on the `hidden` property but most stuff applies to both.

Basic usage
-----------

To use this feature you must set the hidden property of the row or section you want to hide. If nothing is set the property is set to `@NO` so that the element will never hide automatically.

Setting the property to a NSString is a good way to start for simple predicate logics. For complex predicates that include operations oder function calls you should create the predicate yourself and set it directly.

An example predicate string could be the following:
{% highlight objc %}
row.hidden = [NSString stringWithFormat:@"$%@ contains 'Music'", hobbyRow];
{% endhighlight %}

This string will insert the tag of the `hobbyRow` after the '$'. When the predicate is evaluated every tag variable gets substituted by the corresponding row descriptor. For this purpose the XLFormDescriptor has a dictionary which maps tags to rows. 

When the argument is a NSString, a '.value' will be appended to every tag unless the tag is followed by '.isHidden' or '.isDisabled' (or '.value' obviously). This means that a row (or section) might depend on the `value` or the `hidden` or `disabled` properties of another row. This insertion has the consequence of shrinking the possible predicates that can be set with a NSString. If you have to set a complex predicate you may want to set NSPredicate directly as it will not be changed (or checked). Remember to append ".value" after each variable in this case.

You can also set this property with a bool object which means the value of the property will not change unless manually set.

The getter method will return the stored NSPredicate or whatever you assigned to it but to get the evaluated boolean value you there is the `isHidden` function. It will not re-evaluate the predicate each time it gets called but just when the value (or hidden/disabled status) of the rows it depends on changes. When this happens and the return value changes, it will automagically reflect that change on the form so that no other method must be called.

####Example

Let's see a simple example. You can find the full [source code][BlogExampleViewController] in the examples of the XLForm project.

Suppose we have a form that questions the users hobbies. So we will have a multiple selector where the user can choose some of "Sport", "Music" and "Films". Now if the user selects "Sport" we want him to name his favourite sportsman but if the user selects "Films" we want to ask which is the best film he has seen or which is his favourite actor. And so on.

So we need to define a section with the first question:
{% highlight objc %}
section = [XLFormSectionDescriptor formSectionWithTitle:@"Hobbies"];
[form addFormSection:section];    

XLFormRowDescriptor* hobbyRow = [XLFormRowDescriptor formRowDescriptorWithTag:kHobbies rowType:XLFormRowDescriptorTypeMultipleSelector title:@"Select Hobbies"];
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
row = [XLFormRowDescriptor formRowDescriptorWithTag:kSport rowType:XLFormRowDescriptorTypeTextView title:@"Your favourite sportsman?"];
row.hidden = [NSString stringWithFormat:@"NOT $%@.value contains 'Sport'", hobbyRow];
[section addFormRow:row];
    
row = [XLFormRowDescriptor formRowDescriptorWithTag:kFilm rowType:XLFormRowDescriptorTypeTextView title:@"Your favourite film?"];
row.hidden = [NSString stringWithFormat:@"NOT $%@ contains 'Films'", hobbyRow];
[section addFormRow:row];
    
row = [XLFormRowDescriptor formRowDescriptorWithTag:kFilm2 rowType:XLFormRowDescriptorTypeTextView title:@"Your favourite actor?"];
row.hidden = [NSString stringWithFormat:@"NOT $%@ contains 'Films'", hobbyRow];
[section addFormRow:row];
    
row = [XLFormRowDescriptor formRowDescriptorWithTag:kMusic rowType:XLFormRowDescriptorTypeTextView title:@"Your favourite singer?"];
row.hidden = [NSString stringWithFormat:@"NOT $%@ contains 'Music'", hobbyRow];
[section addFormRow:row];
{% endhighlight %}

So, that code is pretty straightforward if you have some XLForm experience. And the predicates are easy to understand as well.

![Screenshot of hiding rows](/images/XLFormBlogExample.gif)

Behind the scenes
-----------------
What does XLForm do to get this working?

The XLFormDescriptor now has two collections of sections, one that contains all sections and one that contains the visible sections. Similarly, the XLFormSectionDescriptor has a collection with all rows and one with shown rows. So when a predicate is evaluated and the result says that a row or section must be hidden (or shown) then that row or section will be removed (or added) from the corresponding collection of visible items.

As mentioned above, the form descriptor has a dictionary where all rows can be found by their tag. This means you should never have more than one row with the same tag. This dictionary is used mainly to substitute the variables of the NSPredicates, as these will just contain the tags of the wanted rows. It also makes searching for a row by tag faster than before.

Additionally, the form descriptor will have another dictionary which stores the observers for each row in an array. If the observing object is a section descriptor then a reference to that section will be stored, but if it is a row then its tag will be stored in the dictionary. This dictionary does also store the dependencies for the `disabled` property in the XLFormRowDescriptor, but they will be stored in a separate key. These keys will be the concatenation of the referred rows tag with the corresponding string "-hidden" or "-disabled" depending on the property the dependency comes from (e.g. "switch-hidden" and/or "switch-disabled" for a row with tag = 'switch'). 
So the number of keys in the dictionary can rise up to 2 times the number of rows in the form.

In order to avoid evaluating the predicate each time somebody checks if a row or section should be hidden, the last evaluated value will be stored in a cache. This cache is a simple private NSNumber property so that it will be initialized with nil but otherwise contain `@YES` or `@NO`.

To know when to reevaluate a predicate, there is a private boolean property that is true when one of the rows this object depends on has changed. So the next time the property is checked it will re-evaluate the predicate. In the case of the hidden property we immediately call the `isHidden` method because we want the form to update automatically and not just the next time somebody checks this hidden property. To make this automatic form update, the setter of the cache for the `hidden` value will immediately call a method to reflect that change.


That's it. I hope this post was helpful to you and that you will enjoy using this new feature!




[XLForm]:      https://github.com/xmartlabs/XLForm
[BlogExampleViewController]:		https://github.com/xmartlabs/XLForm/blob/master/Examples/Objective-C/Examples/PredicateExamples/BlogExampleViewController.m
