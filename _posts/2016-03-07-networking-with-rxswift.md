---
layout: post
title:  "Networking Architecture with RxSwift"
date:   2016-03-01 12:00:00
author: Miguel Revetria
categories: Swift,RxSwift,Alamofire,Argo,ReactiveX,Networking
author_id: remer
---

## Motivation

Networking could be really a mess in big projects. If we don't take care of it we can finish with tons of networking calls made in every class of our project, accessing directly to the networking library. This may be a real problem when we try to add common behavior to every call, like logging errors, handling authentication, retries, etc. Also, we will end up by doing a lot of repetitive code as parsing services' response and checking errors. Composing a few services in order to get a final and more complex result could be a hard task. Later, understand what the code is doing won't be so easy even when reading our own code.

We wanted to improve the networking access layer in our projects. Our objectives are:

* Define a single coupling point between our own code and the networking library used.
* Allow us to define common behavior attached to all or some of the networking calls.
* Allow us to compose services in an easy and understandable way.
* Avoid repetitive code.

By accomplishing previous objectives, we will be also improving our code's properties, like its readability, maintainability and modularity.

## Designing our networking layer

The *de facto* networking library used on Swift projects is, without any doubt, [Alamofire](https://github.com/Alamofire/Alamofire). On the other hand, the implementation of ReactiveX on Swift is [RxSwift](https://github.com/ReactiveX/RxSwift) which also has an external helper library that make easy integrate it with Alamofire. So the bases for our REST networking layer is solved. 

As JSON parsing library we are going to use [Argo](https://github.com/thoughtbot/Argo). It has some nice features that make it a better choice than other available libraries like [ObjectMapper](https://github.com/Hearst-DD/ObjectMapper) and [Decodable](https://github.com/Anviking/Decodable). Some of its features are:

* It works with both classes and structs.
* It allows us to define optional properties.
* It is statically typed and secure. Any error that may happen in the parsing chain will be returned with a descriptive and helpful message.
* Adding custom transformations is quite simple.

### 1. Networking library wrapper

We are going to start by creating the class `NetworkManager` which will encapsulate all the access to Alamofire. Its main purpose is to keep all calls to Alamofire in a single place and adding generic behavior that will be reused in all networking calls. It also defines its own Alamofire.Manager instance with custom configurations.

{% highlight swift %}

import Alamofire
import Argo
import Crashlytics

public class NetworkManager {
    
    public static let networkManager: Alamofire.Manager = {
        # Define your own configuration, like the cache policy, etc.
        let configuration = NSURLSessionConfiguration.defaultSessionConfiguration()
        return Alamofire.Manager(configuration: configuration)
    }()
    
    static func request(URLRequest: URLRequestConvertible) -> Alamofire.Request {
        let request = networkManager.request(URLRequest)
        DBLog(request.debugDescription)
        return request
    }
    
    static func request(
        method: Alamofire.Method,
        _ URLString: URLStringConvertible,
        parameters: [String: AnyObject]? = nil,
        encoding: ParameterEncoding = .URL,
        headers: [String: String]? = nil) -> Alamofire.Request {
            let request = networkManager.request(method, URLString, parameters: parameters, encoding: encoding, headers: headers)
            DBLog(request.debugDescription)
            return request
    }
        
    public static func generalErrorHandler(error: ErrorType) {
        Crashlytics.sharedInstance().recordError(error)
        CLSNSLogv("Service call failed with error: %@", getVaList([error]))
    }
    
}

{% endhighlight %}

> `DBLog` is a custom function that we use to include in our projects to log to the console just when debugging.

### 2. Service endpoints specification

Next, we are going to define our service endpoints. As Alamofire's documentation suggests we are going to make an `Enum` that implements `URLRequestConvertible` protocol but first, we are going to create some generic types that will save us some time later:

{% highlight swift %}

import Alamofire

protocol NetworkRouteType: URLRequestConvertible {
    
    var method: Alamofire.Method { get }
    var path: String { get }
    var parameters: [String: AnyObject]? { get }
    var encoding: Alamofire.ParameterEncoding { get }

}

protocol CustomUrlRequestSetup {

    // By conforming to this protocol, a concrete `NetworkRouteType` instance will be able 
    // to add specific configurations to the url request before it's performed. As an example,
    // some endpoints may (not) require an authentication header, it could be added (removed) here.
    func customUrlRequestSetup(urlRequest: NSMutableURLRequest)

}

extension NetworkRouteType {
    
    var URLRequest: NSMutableURLRequest {
        let mutableURLRequest = NSMutableURLRequest(URL: Constants.Network.baseUrl.URLByAppendingPathComponent(path))
        mutableURLRequest.HTTPMethod = method.rawValue
        
        let urlRequest = encoding.encode(mutableURLRequest, parameters: parameters).0
        (self as? CustomUrlRequestSetup)?.customUrlRequestSetup(urlRequest)
        
        return urlRequest
    }
    
    var encoding: Alamofire.ParameterEncoding {
        switch method {
        case .POST, .PUT, .PATCH:
            return .JSON
        default:
            return .URL
        }
    }
    
    var parameters: [String: AnyObject]?{
        return nil
    }

}

{% endhighlight %}

With the previous helper types, we just need to implement 3 functions in order to conform to `URLRequestConvertible` protocol. See how it may be done below:

{% highlight swift %}

enum NetworkRepository: NetworkRouteType {

    case FetchAll
    case Get(ownerId: Int, repoId: Int)
    case Search(request: SearchRepositoriesRequest)

    static let basePath = ""
    
    var method: Alamofire.Method {
        return .GET
    }
    
    var path: String {
        var path: String
        
        switch self {
        case .FetchAll:
            path = "repositories"
        case .Get(let ownerId, let repoId):
            path = "repos/\(ownerId)/\(repoId)"
        case .Search(_):
            path = "search/repositories"
        }
        
        return "\(NetworkRepository.basePath)\(path)"
    }
    
    var parameters: [String: AnyObject]? {
        if case .Search(let params) = self {
            return params.toDictionary()
        }
        return nil
    }
    
}

{% endhighlight %}

> We're using the public GitHub's API as an example

### 3. Parsing services response

Alamofire's responses are parsed easily from JSON to dictionaries, but we want to go further and use swift objects in our code. In order to parse JSON to our data models we will implement a custom `response` method that will return an `Argo.Decodable` instance.

{% highlight swift %}

import Alamofire
import Argo

extension Request {

    public func responseObject<T: Decodable where T == T.DecodedType>(completionHandler: Response<T, NSError> -> Void) -> Self {
        let responseSerializer = ResponseSerializer<T, NSError> { request, response, data, error in
            guard error == nil else { return .Failure(error!) }
            let JSONResponseSerializer = Request.JSONResponseSerializer(options: .AllowFragments)
            let result = JSONResponseSerializer.serializeResponse(request, response, data, error)
            switch result {
            case .Success(let value):
                if let _ = response {
                    let json = JSONStringify(value)
                    let decodedData = T.decode(result.value != nil ? JSON.parse(result.value!) : JSON.Null)
                    switch decodedData {
                    case let .Failure(argoError):
                        let nsError = Error.errorWithCode(.JSONSerializationFailed, failureReason: argoError.description)
                        return .Failure(nsError)
                    case let .Success(object):
                        return .Success(object)                        
                    }
                } else {
                    let failureReason = "JSON could not be serialized into response object: \(value)"
                    let error = Error.errorWithCode(.JSONSerializationFailed, failureReason: failureReason)
                    return .Failure(error)
                }
            case .Failure(let error):
                return .Failure(error)
            }
        }
        return response(responseSerializer: responseSerializer, completionHandler: completionHandler)
    }

}

{% endhighlight %}

> Note that we will need an additional function in order to get an Array response from the service. Its implementation is quite similar to previous declaration.

### 4. RxSwift integration

In order to work with Rx API we have to craete an Observable instance that will perform the networking call. We can make an extension to `Alamofire.Request` that will create an observable instance. This observable will call to our `NetworkManager`.

{% highlight swift %}

import Alamofire
import RxSwift

extension Alamofire.Request {
    
    public func rx_object<T: Decodable where T == T.DecodedType>() -> Observable<T> {
        return Observable.create { subscriber in
            self.responseObject() { (response: Response<T, NSError>) in
                switch response.result {
                case .Failure(let error):
                    subscriber.onError(error)
                case .Success(let entity):
                    subscriber.onNext(entity)
                    subscriber.onCompleted()
                }
            }
            return NopDisposable.instance
        }
    }
    
    public func rx_objectCollection<T: Decodable where T == T.DecodedType>() -> Observable<[T]> {
        return Observable.create { subscriber in
            self.responseCollection() { (response: Response<[T], NSError>) in
                switch response.result {
                case .Failure(let error):
                    subscriber.onError(error)
                case .Success(let entity):
                    subscriber.onNext(entity)
                    subscriber.onCompleted()
                    break
                }
            }
            return NopDisposable.instance
        }
    }

}

{% endhighlight %}

To simplify the code that will invoke our services we are going to add a helper function to our type `NetworkRouteType` as shown below:

{% highlight swift %}

extension NetworkRouteType {

    func observe<T: Decodable where T == T.DecodedType>(scheduler: ImmediateSchedulerType = MainScheduler.instance) -> Observable<T> {
        return NetworkManager.request(self)
            .validate()
            .rx_object()
            .observeOn(scheduler)
            .doOnError(NetworkManager.generalErrorHandler)
    }

    func observe<T: Decodable where T == T.DecodedType>(scheduler: ImmediateSchedulerType = MainScheduler.instance) -> Observable<[T]> {
        return NetworkManager.request(self)
            .validate()
            .rx_objectCollection()
            .observeOn(scheduler)
            .doOnError(NetworkManager.generalErrorHandler)
    }

}

{% endhighlight %}

### 5. Invoking our networking layer

With our networking layer implemented, we are in conditions to start performing networking requests in an simple way. Take a look to the code snippet belown:

{% highlight swift %}

class ReposTableViewController: UITableViewController {
    
    @IBOutlet weak var tableView: UITableView!
    
    var repositories = [Repository]()
    
    let disposeBag = DisposeBag()
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        definesPresentationContext = true

        setup(tableView: tableView)
    }
    
    override func viewWillAppear(animated: Bool) {
        super.viewWillAppear(animated)
        
        NetworkRepository.FetchAll)
            .observe()
            .doOnError() { [weak self] error in
                self?.showError(error)
            }
            .subscribeNext() { [weak self] repositories in
                self?.repositories = repositories
                self?.tableView.reloadData()
            }
            .addDisposableTo(disposeBag)
    }
    
    func showError(error: ErrorType) {
        let nserror = error as NSError
        let message = nserror.userInfo["NSLocalizedFailureReason"] as? String ?? nserror.localizedDescription

        let alert = UIAlertController(title: "Oops!", message: message, preferredStyle: .Alert)
        alert.addAction(UIAlertAction(title: "OK", style: .Default) { _ in
        })
        presentViewController(alert, animated: true, completion: nil)
    }

}

// MARK: TableView extensions

extension ReposTableViewController: UITableViewDataSource, UITableViewDelegate {
    
    private func setup(tableView tableView: UITableView) {
        tableView.estimatedRowHeight = 60
        tableView.rowHeight = UITableViewAutomaticDimension
    }
    
    func tableView(tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return repositories.count
    }
    
    func tableView(tableView: UITableView, cellForRowAtIndexPath indexPath: NSIndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCellWithIdentifier("RepoCell")!
        
        let repository = repositories[indexPath.row]
        cell.textLabel?.text = repository.name
        cell.detailTextLabel?.text = repository.description

        return cell
    }

}

{% endhighlight %}

## Conclusions

Alamofire is the best networking library available for Swift, but this doesn't mean that a new one and better could appear in the future. Because we encapsulated all accesses to Alamofire in our `NetworkManager` and in our NetworkRouteType types, replacing Alamofire with other networking library wouldn't be a hard task.

By using RxSwift we found an easy way to combine functions and compose differences services in order to get a final result. Also, its functions `doOn`, `doOnError`, `doOnNext` help us to add common behaviors to all networking calls.

We have defined a common error handler for all the networking calls. There we can do simple tasks like logging errors and more sophisticated tasks like refreshing the authentication token and retrying the failed request for 401 errors. Additionally, we are available to define a global function called on each success request.

We moved all the code associated to parsing the services response from JSON to Swift objects in generic helper functions by using Argo. This code is not repeated any more on each service call.

At the end, the code related to networking is simpler and easier to understand. Our project is now much more maintainable.
