---
layout: post
title: Introducing Eureka! - Elegant iOS forms in Pure Swift 2
date: '2015-09-29T10:00:00.000-03:00'
author: Martin Barreto
categories: Eureka,Forms
author_id: mtnBarreto
---

We are incredibly excited to announce [Eureka!], our first Swift open source project designed to easily build dynamic table-view forms.

#**Why we built Eureka!**

April last year we released XLForm, an open source obj-c iOS library to build dynamic complex forms based on a DSL. Luckily it has been largely used by iOS community and in thousands of apps saving a lot of development time.

After Swift release a huge part of the iOS community started to use [XLForm] from Swift projects. We added support for Swift but we were not able to use all of the Swift language benefits so we rethought XLForm and built something from scratch following the swift way and taking advantage of all Swift language capabilities.

#**About Eureka!**

Eureka is a library that can be used to create dynamic table-view forms and which uses a high level DSL abstraction to specify the forms. Sounds familiar? (hint: [XLForm])

##What makes Eureka so special?

Eureka was originally designed to be:

* [*Elegant, concise syntax and super readable*](#elegant-concise-readable)
* [*Support dynamic table-view forms*](#dynamic-forms)
* [*Fully customizable*](#fully-customizable)
* [*Safe*](#safe)
* [*Powerful and Flexible*](#powerful-and-flexible)
* [*Extensible*](#extensible)

Eureka takes advantage of Swift language capabilities such as [generics], functional and protocol oriented programming, operators, protocol extensions and much more to accomplish these design goals.  

Let's deep into what we mean by each of the listed points.

### Elegant, concise syntax and super readable <a name="elegant-concise-readable"></a>

Eureka uses a chainable approach along with custom swift operators to declare a table-view form.

{% highlight swift %}
self.form +++=  DateRow("Date") {
                  $0.value = NSDate()
                  $0.title = "The clock says:"
                }
           <<<  CheckRow("Check") {
                  $0.title = "Check"
                  $0.value = true
                }
           +++  SegmentedRow<Emoji>("SegmentedRow") {
                  $0.title = "Who are You?"
                  $0.options = [💁, 🍐, 👦, 🐗, 🐼, 🐻]
                  $0.value = 🍐
                }
           <<<  PhoneRow("Phone") { $0.placeholder = "Phone" }
{% endhighlight %}

### Support dynamic table-view forms <a name="dynamic-forms"></a>

Eureka provides a very powerful DSL used to create a form, basically a form is represented by a `Form` instance that contains   Sections which finally contain Rows. This data structure is identical to how table-views deal with the sections and cells.
Typically any form we might build needs to make a row or section visible/invisible depending on a certain condition or action. To address this problem Eureka keeps track of any change made on the `Form` and updates the `FormViewController` table view accordingly and on the fly. This means that any change made through insertion, deletion or replacement of either a row or a section will be reflected on the tableView of the `FormViewController`.
Based on that, you do not have to deal with table-view delegates and data sources anymore.

### Fully customizable

Typically there is no need to define a new `Row` to customize the appearance of a row or a cell.

However, full customization is supported. Eureka! provides 2 customization levels, general and individual customization. Individual customization always overrides general customization.

#### General customization

General customization allows us to make changes to all rows or cells of a specific type.

{% highlight swift %}
// set up minimumDate for all DateRows
DateRow.defaultRowInitializer = { row in row.minimumDate = NSDate() }
// modify all NameRow cell textField font to UIFont.systemFontOfSize(fontSize: 12.0)
NameRow.defaultCellUpdate = { cell, row in cell.textField?.font =  UIFont.systemFontOfSize(fontSize: 12.0)  }
// Modify all CheckRow cells in order to show a orange check mark.  
CheckRow.defaultCellSetup = { cell, row in cell.tintColor = UIColor.orangeColor() }
{% endhighlight %}

Notice that the cell and row parameters are strongly typed and these 3 method are injected automatically through protocol extensions since all rows should conform to `RowType`.

#### Individual customization

Individual customization allows us to make changes to a particular row or cell instance.

{% highlight swift %}
// Every row has a initializer that receive a tag and a initializer blog
// as a first and second parameter respectively.
let segmentedRow =  SegmentedRow<Emoji>("Emoji"){
                      $0.title = "Who are You?"  // set up the row title
                      $0.options = [💁, 🍐, 👦, 🐗, 🐼, 🐻] // available options
                      $0.value = 🍐 // selected value
                      $0.isDisabled = true // disable the row by default
                    }
// Every Row has a cellSetup and cellUpdate method that receive a function as a parameter and
// return the concrete row instance.
let nameRow =  NameRow("Name").cellSetup { cell, row in
                                cell.textField.placeholder = "Your name ..."
                              }
                              .cellUpdate { cell, row in
                                cell.textLabel?.textColor = UIColor.redColor()
                              }
{% endhighlight %}

Notice that the parameter function type is `(NameCell, NameRow) -> ()` for `NameRow` and is (SegmentedCell<Emoji>, SegmentedRow<Emoji>) -> () for `SegmentedRow<Emoji>`.

### Safe

Eureka uses Swift's [type safety] to help avoiding mistakes while developing. Each Eureka `Row` allocates a **strongly typed** value and any form definition and configuration is made over specific concrete object types.

For example in the code example shown above `$0` is an instance of `SegmentedRow<Emoji>` and its `value` property type is `Emoji` whereas NameRow's `value` property type is `String`. Similarly `SegmentedRow<Emoji>`'s `options` array property only stores `Emoji` instances and `options` is not available in `NameRow`.
The same applies to any chainable method we invoke to set up a row, for example `cell` and `row` parameters of `cellUpdate` and `cellSetup` closure are also strongly typed.

Additionally Eureka makes sure that each new user defined `Row` has a specific value type and a specific TableViewCell type, this is possible combining Swift Generics and Type Constraints. By definition any `Row` must extend from **Row<T: Equatable, Cell: CellType where Cell: BaseCell, Cell.Value == T>** class ensuring that each `Row` has a defined value type `T` and works with a specific table view cell `Cell` which holds a row of type `T`.

I can ensure Eureka is super safe either during form creation or when defining new row and cell types.

### Powerful and Flexible

Eureka allows us to easily attach onChange and onSelect handlers to a row.

{% highlight swift %}
let segmentedRow =  SegmentedRow<Emoji>("Emoji"){
                      $0.title = "Who are You?"  // set up the row title
                      $0.options = [💁, 🍐, 👦, 🐗, 🐼, 🐻] // available options
                    }
                    .onChange { row in print(row.value?.name) } // row.value is Emoji?, name is a stored property
                    .onCellSelection { cell, row in print("Cell was selected") }
{% endhighlight %}

#### Form and Section conform to RangeReplaceableCollectionType, MutableCollectionType

As mentioned before, Eureka `Forms` contain a list of `Sections` and a section contains a list of `Rows`. We made `Form` and `Section` conform to `RangeReplaceableCollectionType` and `MutableCollectionType`, which both "inherit" from the well known [CollectionType] protocol.

Doing that we gain for free a lot of helpers and behaviour and we are able to iterate over the collection, use subscript to access and modify a Section or a Row, make use of some cool functions like map, filter, first, removeRange, reduce and much much more.

Let's see this in action assuming form is an instance of Form:

{% highlight swift %}
// let's get second form section and append a new DateRow
let section_two = form[1] <<< DateRow("Date") { $0.value = NSDate() } // we can also use append instead of <<< operator

// What about replacing section two?
form[1] = newSection // ;)

// lets add a new button row to all sections
for (index, section) in form.enumerate() {
    section <<< ButtonRow("Button\(index)") { $0.title = "Some title" }
}

// replace rows from 3 to 7 with a checkRow
section_two.replaceRange(3..<7, with: [CheckRow("checkRow")])

// we can also look up for CheckRows inside a section by..
section_two.filter { $0 is CheckRow }

// one more example
form += [newSection1, newSection2]
section += [newRow1, newRow2, newRow3]

//And there are much more possibilities ;)
{% endhighlight %}


### Extensible

Adding a new `Row` definition is super simple by extending `Row<T, Cell>` and conforming to `RowType`. The basic behaviour of the row is inherited either from the superclass or added through protocol extension. Based on that you should only provide the row definition and the UITableViewCell that the `Row` handles. Eureka provides many rows by default that actually have no conceptual difference from a user defined row.

### And we are planning more...

We understand that Eureka's first version is very capable and powerful but we plan to enhance it even further. Among what we plan to improve is adding more row types, inline row support and multivalued sections.

This post is just intended to briefly introduce Eureka and some of its architecture insights.
If you are interested in how to use Eureka I would suggest you to take a look at its [github repository readme], You can also run the example project and  play with Eureka playground that are contained in Eureka workspace.

If you liked what you have read, want to suggest some feature, contribute to the project or you need some help on how to use it please drop us a line on [twitter].

[XLForm]: https://github.com/xmartlabs/XLForm
[type safety]: https://developer.apple.com/library/ios/documentation/Swift/Conceptual/Swift_Programming_Language/TheBasics.html
[CollectionType]: https://developer.apple.com/library/prerelease/ios/documentation/Swift/Reference/Swift_CollectionType_Protocol/index.html
[generics]: https://developer.apple.com/library/ios/documentation/Swift/Conceptual/Swift_Programming_Language/Generics.html
[github repository readme]: https://github.com/xmartlabs/Eureka
[Eureka!]: https://github.com/xmartlabs/Eureka
[Eureka github repository and Examples]: https://github.com/xmartlabs/Eureka
[twitter]: https://twitter.com/xmartlabs
