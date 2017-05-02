---
layout: post
title:  Introducing Opera!
date:   2017-04-27 16:58:00
author: XL
categories: Swift, iOS, Network, Tutorial
markdown: redcarpet

---

We know that many of you used Alamofire as networking library and RxPagination to work with the JSON results.
Well... this open source library [Opera](https://github.com/xmartlabs/Opera) is a framework developed for all the Apple platforms: iOS, OSX, wathchOS and tvOS written in Swift.
It defines a Protocol-Oriented Network abstraction layer. Greatly inspired by [RxPagination](https://github.com/tryswift/RxPagination) project but working on top of [Alamofire](https://github.com/Alamofire/Alamofire) and the JSON parsing library of your choice.

## Why to use Opera?
One of the points to highlight is that work with [Opera](https://github.com/xmartlabs/Opera) is really easy.
This library is automatically responsible that the JSON that arrives from a service is parsed and deserialized in an object.
So you will not need to work anymore with each element of the JSON, now you will start working with the proper Object.
You can subscribed to that returns an Observable of a JSON serialized type and do whatever you need with it or in case that the networking or the object parsing fails an OperaError is returned and that exception you can handle it.
So... definitely, it is always the same! You determined the structure, subscribed to the JSON's result and act according to the event emitted by the observable.

## Features

- API abstraction through `RouteType` conformance.
-  Pagination support through `PaginationRequestType` conformance.
- Supports for any JSON parsing library such as [Decodable](https://github.com/Anviking/Decodable) and [Argo](https://github.com/thoughtbot/Argo) through `OperaDecodable` protocol conformance.
- Networking errors abstraction through `OperaError` type. - OperaSwift `OperaError` indicates either an `NSURLSession` error, `Alamofire` error, or your JSON parsing library error.
- RxSwift wrappers around `Alamofire.Request` that returns an Observable of a JSON serialized type or an array if it. - NetworkError is passed when error event happens.
- RxSwift wrappers around `PaginationRequestType` that returns an Observable of a `PaginationRensponseType` which contains the serialized elements and information about the current, next and previous page.
- Ability to easily mock services through `RouteType.sampleData`.



## How to use it?
#### Route setup


A `RouteType` is a high level representation of the request for a REST API endpoint. By adopting the `RouteType` protocol a type is able to create its corresponding request.

```swift
import Alamofire
import OperaSwift

// just a hierarchy structure to organize routes
struct GithubAPI {
    struct Repository {}
}

extension GithubAPI.Repository {

  struct Search: RouteType {

      var method: Method { return .get }
      var path: String { return "search/repositories" }
  }

  struct GetInfo: RouteType {

      let owner: String
      let repo: String

      var method: Method { return .get }
      var path: String { return "repos/\(owner)/\(repo)" }
  }
}

```

> Alternatively, you can opt to conform to `RouteType` form an enum where each enum value is a specific route (api endpoint) with its own associated values.  

If you are curious check out the rest of [RouteType](https://github.com/xmartlabs/Opera/blob/master/Sources/Common/RouteType.swift) protocol definition.

As you may have seen, any type that conforms to `RouteType` must provide `baseUrl` and the Alamofire `manager` instance.

Usually these values do not change among our routes so we can provide them by implementing a protocol extension over `RouteType` as shown below.

```swift
extension RouteType {

    var baseURL: URL {
        return URL(string: "https://api.github.com")!
    }

    var manager: ManagerType {
        return Manager.singleton
    }
}
```

> Now, by default, all RouteTypes we define will provide https://api.github.com as baseUrl and Manager.singleton as mananger. It's up to you to customize it within a specific RouteType protocol conformance.

#### Default RouteTypes

To avoid having to implement the `method` property in every `RouteType` Opera provides A protocol for each HTTPMethod so you can implement those:

``` Swift
protocol GetRouteType: RouteType {}
protocol PostRouteType: RouteType {}
protocol OptionsRouteType: RouteType {}
protocol HeadRouteType: RouteType {}
protocol PutRouteType: RouteType {}
protocol PatchRouteType: RouteType {}
protocol DeleteRouteType: RouteType {}
protocol TraceRouteType: RouteType {}
protocol ConnectRouteType: RouteType {}
```

They are pretty simple, they only implement the method property of `RouteType` with the HTTPMethod that matches.

#### Creating requests
At this point we can easily create an Alamofire Request:

``` Swift
let request: Request =  GithubAPI.Repository.GetInfo(owner: "xmartlabs", repo: "Opera").request

```

> Notice that `RouteType` conforms to `Alamofire.URLConvertible` so having the manager we can create the associated `Request`.

We can also take advantage of the reactive helpers provided by Opera:
``` Swift
request
  .rx.collection()
  .subscribe(
    onNext: { (repositories: [Repository]) in
      // do something when networking and Json parsing completes successfully
    },
    onError: {(error: Error) in
      // do something when something went wrong
    }
  )
  .addDisposableTo(disposeBag)
  ```

  ``` Swift
  getInfoRequest
  .rx.object()
  .subscribe(
    onNext: { (repositories: [Repository]) in
      // do something when networking and Json parsing completes successfully
    },
    onError: {(error: Error) in
      guard let error = error as? OperaError else {
          //do something when it's not an OperaError
      }
      // do something with the OperaError
    }
  )
  .addDisposableTo(disposeBag)
```

> If you are not interested in decode your JSON response into a Model you can invoke `request.rx.anyObject()` which returns an `Observable` of `AnyObject` for the current request and propagates a `OperaError` error through the result sequence if something goes wrong.


#### Decoding
We've said Opera is able to decode JSON response into a Model using your favorite JSON parsing library. Let's see how Opera accomplishes that.

> At Xmartlabs we have been using `Decodable` as our JSON parsing library since March 16. Before that we had used Argo, ObjectMapper and many others. I don't want to deep into the reason of our JSON parsing library choice (we do have our reasons ;)) but during Opera implementation/design we thought it was a good feature to be flexible about it.

This is our Repository model...
``` Swift
struct Repository {

    let id: Int
    let name: String
    let desc: String?
    let company: String?
    let language: String?
    let openIssues: Int
    let stargazersCount: Int
    let forksCount: Int
    let url: NSURL
    let createdAt: NSDate

}
```

and `OperaDecodable` protocol:

``` Swift
public protocol OperaDecodable {
    static func decode(_ json: Any) throws -> Self
}
```

Since `OperaDecodabl`e and `Decodable.Decodable` require us to implement the same method, we only have to declare protocol conformance.

``` Swift
// Make Repository conforms to Decodable.Decodable
extension Repository: Decodable {

    static func decode(j: Any) throws -> Repository {
        return try Repository.init(  id: j => "id",
                                   name: j => "name",
                                   desc: j =>? "description",
                                company: j =>? ["owner", "login"],
                               language: j =>? "language",
                             openIssues: j => "open_issues_count",
                        stargazersCount: j => "stargazers_count",
                             forksCount: j => "forks_count",
                                    url: j => "url",
                              createdAt: j => "created_at")
    }
}

// Declare OperaDecodable adoption
extension Repository : OperaDecodable {}
```


#### Pagination
Opera represents pagination request through `PaginationRequestType` protocol which also conforms to `URLRequestConvertible`. Typically we don't need to create a new type to conform to it. Opera provides `PaginationRequest<Element: OperaDecodable>` generic type that can be used in most of the scenarios.

One of the requirements to adopt `PaginationRequestType` is to implement the following initializer:

``` Swift
init(route: RouteType, page: String?, query: String?, filter: FilterType?, collectionKeyPath: String?)
```

so we create a pagination request doing:

``` Swift
let paginationRequest: PaginationRequest<Repository> = PaginationRequest(route: GithubAPI.Repository.Search(), collectionKeyPath: "items")
```

> Repositories JSON response array is under "items" key as [github repositories api documentation](https://developer.github.com/v3/search/#search-repositories) indicates so we pass ``"items"`` as `collectionKeyPath` parameter.

A `PaginationRequestType` wraps up a `RouteType` instance and holds additional info related with pagination such as query string, page, filters, etc. It also provides some helpers to get a new pagination request from the current pagination request info updating its query string, page or filters value.

``` Swift
let firtPageRequest = paginatinRequest.routeWithPage("1").request
let filteredFirstPageRequest = firtPageRequest.routeWithQuery("Eureka").request
```



#### Error Handling
If you are using the reactive helpers (which are awesome btw!) you can handle the errors on the `onError` callback which returns an `Error` that, in case of _Networking_ or _Parsing_ issues, can be casted to `OperaError` for easier usage. OperaError wraps any error that is Networking or Parsing related. Keep in mind that you have to cast the `Error` on the `onError` callback before using it. `OperaError` also provides a set of properties that make accessing the error's data easier:

**Example:**
``` Swift
getInfoRequest
  .rx.object()
  .subscribe(
    onError: {(error: Error) in
      guard let error = error as? OperaError else {
          //do something when it's not an OperaError
      }
      // do something with the OperaError
      debugPrint("Request failed with status code \(error.statusCode)")
    }
  )
  .addDisposableTo(disposeBag)
  ```

### Installation
**CocoaPods**

[CocoaPods](https://cocoapods.org/) is a dependency manager for Cocoa projects.

To install Opera, simply add the following line to your Podfile:

```ruby
pod 'Opera', '~> 0.2'
```

Carthage

[Carthage](https://github.com/Carthage/Carthage) is a simple, decentralized dependency manager for Cocoa.

To install Opera, simply add the following line to your Cartfile:

```
github "xmartlabs/Opera" ~> 0.2
```

## Where to go from here
We hope it has served as a good introduction to the **Opera** library and that it really helps you a lot!
On GitHub you will find an usage guide to get started.
If you use Opera in your app we would love to hear about it and feel free to [contribute](https://github.com/xmartlabs/Opera) to this awesome library!
