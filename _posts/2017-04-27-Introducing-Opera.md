---
layout: post
title:  Introducing Opera!
date:   2017-04-27 16:58:00
author: XL Team
author_id: xl
categories: Swift, iOS, Network, Tutorial
markdown: redcarpet
description: We all know that Alamofire is the go-to networking library for the Apple ecosystem. Also, many of you work with RxSwift to work with the JSON results. This is our case, so...

---

If you are familiar with the iOS ecosystem, you may share the love we have to `Alamofire` library, the go-to networking library in Swift (and his previous version, AFNetworking written in Obj-c), and you may use it with RxSwift to work with the JSON results. If that your case, then is our case :), so, we decided to build [Opera](https://github.com/xmartlabs/Opera) to make things even easier for all the Swift developers.
This framework, built on top of [Alamofire](https://github.com/Alamofire/Alamofire) and [RxSwift](https://github.com/ReactiveX/RxSwift), defines a Protocol-Oriented network abstraction layer inspired by [RxPagination](https://github.com/tryswift/RxPagination) that can be integrated with the JSON parsing library of your choice.

## Why use Opera?
One of the points to highlight is that working with [Opera](https://github.com/xmartlabs/Opera) is really easy.
This library automatically handles the response flow, decoding the responses into ready-to-use objects using your JSON parsing library of choice.
So you won't need to worry about parsing the JSON each time anymore, now you will start working with the decoded object directly.
<br/>
Furthermore, Opera provides helpers that integrate with RxSwift, returning Observables of JSON serialized types so you receive the object ready to use, or in case that the networking or the object parsing fails, an `OperaError` is returned so you can handle it in the best way possible.
<br/>
Long story short, you define the service, the object decoding and you are ready to subscribe to the requests and work with the emitted events.

## Features
- API abstractions through `RouteType` conformance.
- Pagination support through `PaginationRequestType` conformance.
- Supports for any JSON parsing library such as [Decodable](https://github.com/Anviking/Decodable) and [Argo](https://github.com/thoughtbot/Argo) through `OperaDecodable` protocol conformance.
- Networking errors abstraction through `OperaError` type.
- `OperaError` indicates either an `NSURLSession` error, an `Alamofire` error, or your JSON parsing error.
- RxSwift wrappers around `Alamofire.Request` that return an Observable of a JSON deserialized type or an array of it.
- RxSwift wrappers around `PaginationRequestType` that returns an Observable of `PaginationRensponseType` which contains the deserialized elements and information about the current, next and previous page.
- Ability to easily mock services through `RouteType.sampleData`.

## How to use it?


### Installation
**CocoaPods**

To install Opera, simply add the following line to your Podfile:

```ruby
pod 'Opera', '~> 2.0'
```

**Carthage**

To install Opera, simply add the following line to your Cartfile:

```
github "xmartlabs/Opera" ~> 2.0
```

### Setup

There are a few concepts that you need to be familiarized with in order to use Opera at full speed!


#### 1. Route setup
A `RouteType` is a high level representation of a request to an REST API endpoint. By adopting the `RouteType` protocol a type is able to create its corresponding request.

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

> Alternatively, you can opt to conform to `RouteType` with an enum where each value is a specific route (api endpoint) with its own associated values.

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

> Now, by default, all RouteTypes we define will provide https://api.github.com as `baseUrl` and Manager.singleton as `manager`. It's up to you to customize them within a specific RouteType protocol conformance.

#### 2. Default RouteTypes
To avoid having to implement the `method` property in every `RouteType` Opera provides a protocol for each HTTPMethod so you can conform to them instead:

```swift
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

They are pretty simple, they only implement the method property of `RouteType` with the matching HTTPMethod.

#### 3. Creating requests
At this point we can easily create an Alamofire Request:

```swift
let request: Request =  GithubAPI.Repository.GetInfo(owner: "xmartlabs", repo: "Opera").request
```

> Notice that `RouteType` conforms to `Alamofire.URLConvertible` so having the manager we can create the associated `Request`.

We can also take advantage of the reactive helpers provided by Opera:
```swift
// GETTING ALL THE REPOSITORIES
request
  .rx.collection()
  .subscribe(
    onSuccess: { (repositories: [Repository]) in
      // do something when networking and json parsing completes successfully
    },
    onError: {(error: Error) in
      // do something with error when something goes wrong
    }
  )
  .addDisposableTo(disposeBag)
```

```swift
// GETTING ONE REPOSITORY
getInfoRequest
  .rx.object()
  .subscribe(
    onSuccess: { (repository: Repository) in
      // do something when networking and json parsing completes successfully
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

> If you are not interested in decode your JSON response into a Model you can invoke `request.rx.any()` which returns a *`Single`* of *`Any`* for the current request and propagates a `OperaError` error through the result sequence if something goes wrong.


#### 4. Decoding
We've said Opera is able to decode JSON response into a Model using your favorite JSON parsing library. Let's see how we can accomplish that.

This is our Repository model...
```swift
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

```swift
public protocol OperaDecodable {
    static func decode(_ json: Any) throws -> Self
}
```

Since `OperaDecodable` and `Decodable.Decodable` require us to implement the same method, we only have to declare protocol conformance.

```swift
// Make Repository conforms to Decodable.Decodable and OperaDecodable
extension Repository: OperaDecodable, Decodable {

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

```


#### 5. Pagination
Opera represents pagination request through `PaginationRequestType` protocol which also conforms to `URLRequestConvertible`. Typically we don't need to create a new type to conform to it. Opera provides `PaginationRequest<Element: OperaDecodable>` generic type that can be used in most of the scenarios.

One of the requirements to adopt `PaginationRequestType` is to implement the following initializer:

```swift
init(route: RouteType, page: String?, query: String?, filter: FilterType?, collectionKeyPath: String?)
```

so we create a pagination request doing:

```swift
let paginationRequest: PaginationRequest<Repository> = PaginationRequest(route: GithubAPI.Repository.Search(), collectionKeyPath: "items")
```

> Repositories JSON response array is under "items" key as [github repositories api documentation](https://developer.github.com/v3/search/#search-repositories) indicates so we pass ``"items"`` as `collectionKeyPath` parameter.

A `PaginationRequestType` wraps up a `RouteType` instance and holds additional info related to pagination such as query string, page, filters, etc. It also provides some helpers to get a new pagination request from the current pagination request info updating its query string, page or filters value.

```swift
let firtPageRequest = paginatinRequest.routeWithPage("1").request
let filteredFirstPageRequest = firtPageRequest.routeWithQuery("Eureka").request
```

#### 6. Error Handling
If you are using any of the reactive helpers (which are awesome btw!) you can handle the errors on the `onError` callback which returns an `Error` in case of _Networking_ or _Parsing_ issues. For easier usage, you can cast the error to `OperaError` which provides a set of properties that make accessing the error's data easier:

**Example:**
```swift
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
####  7. Composing RequestAdapters
Opera provides a way to use multiple `RequestAdapter` to adapt your requests. The class `CompositeAdapter` provides a way to setup a pipeline of `RequestAdapter` that will be applied to your requests.

To use it you just have to create a `CompositeAdapter`, add all your adapters ad set it as your NetworkManager's adapter.

**Example:**
```swift
let adapter = CompositeAdapter()
adapter.append(adapter: KeychainAccessTokenAdapter())
adapter.append(adapter: LanguageAdapter())
manager.adapter = adapter
```

## Where to go from here
We hope it has served as a good introduction to the **Opera** library and that it really helps you a lot!
On GitHub you will find an usage guide to get started and some examples.
If you use Opera in your app we would love to hear about it and feel free to [contribute](https://github.com/xmartlabs/Opera) to this awesome library!
