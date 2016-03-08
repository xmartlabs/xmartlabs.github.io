---
layout: post
title:  "Networking Architecture with RxSwift"
date:   2016-03-01 10:00:00
author: Miguel Revetria
categories: Swift,ReactiveX,RxSwift,Alamofire,ObjectMapper,Argo,Decodable
author_id: remer
---

## ~~Motivation~~

A short time ago I was working on a couple of Android projects together Xmartlabs' droid gurus [Santiago Castro]() and [Matias Irland](). I had some basic understanding on how this platform works but nothing too advanced. In this context I started working on relatively complex projects with tons of libraries like [Butterknife](), [Dart](), [Henson](), [Lombok]() - just to mention some of them - that I didn't have idea of what theirs purpose were. When I deep and work more and more on these projects quickly I noticed the tedious tasks that Android developers would do - and I did a time ago - if they don't use these utilities.

Among these libraries I found a few of them working "al unísono" to make networking really too easy. I loved how networking is done in Android projects here at Xmartlabs. Combining [okhttp]() with [okio]() we get a flexible HTTP client to make networking calls. In an abstraction layer, [Retrofit]() using its JSON converter make consuming REST service clear and concise. At the end, adding the RxJava adapter for Retrofit everything looks like a masterpiece of software engineer.

Putting all previous libraries together we simply can implement our REST networking layer in this way:

{% highlight java %}
public interface RepositoryService {
    @GET("repositories")
    @Headers({
        "Accept: application/vnd.github.v3+json"
    })
    Observable<List<Repository>> repositories();
}
{% endhighlight %}

> The class Repository is part of the entity model, is just POJO with the fields returned by the service endpoint and decorated with lombok annotations.

{% highlight java %}
public class RepositoryController extends ServiceController {
    @Inject
    RepositoryService service;

    @NonNull
    public Observable<List<DemoRepo>> getPublicRepositoriesFilteredBy(@Nullable String filter) {
        return service.repositories()
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .doOnError(getGeneralErrorHelper().getGeneralErrorAction())
                .flatMap(Observable::from)
                .filter(repo -> repo.match(filter))
                .toList();
    }
}
{% endhighlight %}

> ServiceController is a base class that add some helper to controller that perform service calls, for example it defines a general error handler that will log the error to Fabric.

{% highlight java %}
public class ReposListFragment extends RxFragment {
    @Inject
    RepositoryController controller;

    @Override
    public View onCreateView(LayoutInflater inflater, ViewGroup container, Bundle savedInstanceState) {
        View view = super.onCreateView(inflater, container, savedInstanceState);

        controller.getPublicRepositoriesFilteredBy(filter)
                .<List<DemoRepo>>compose(RxLifecycle.bindUntilFragmentEvent(lifecycle(), FragmentEvent.DESTROY_VIEW))
                .subscribe(
                        listAdapter::setItems,
                        error -> showAlertError(R.string.message_error_service_call)
                );

        return view;
    }
}
{% endhighlight %}

> Note that previous code is also using [Retrolambda]() to bring lambdas to Android code.

That's really cool, but is too much of Java code for a Swift post.

## Swift

Later, after I finished working on Android and when I come back to iOS development I started missing it. So I wanted to bring these programming patterns or paradigm, or whatever you want calling it, to Swift projects and I started researching available frameworks. The *de facto* networking library used on Swift projects is, without any doubt, [Alamofire](). On the other hand, the implementation of ReactiveX on Swift is [RxSwift]() which also has an external helper library that make easy integrate it with Alamofire. So the bases for our REST networking layer is solved. 

Next we have to find a way to map JSON objects into Swift classes (or structs) and viceversa. Some of the features that I would expect to find in the chosen library are:

* **Both directional mapping**: this will allow us to decode JSON data received from server and also to map our objects to JSON in order to be sent in the request body.
* **Works with classes and structs**: I'd like to use the same classes defined as server's responses as [Core Data]() entities to store them in the database without making any additional transformation.
* **Keep model separated from the library code**: this is a nice-to-have feature in order to keep our project's classes (or structs) clean and independent of the parsing library used.
* **Easily define optionals and non-optionals fields**: this is also desired, defining everything as optional or setting up default values doesn't make sense in general.

### JSON parser libraries

I tried a few libraries that provide JSON mapping

#### ObjectMapper
My first try was [ObjectMapper](), it is one of the most popular JSON mappers in GitHub and it's really easy to use. It works in both directions parsing JSON structures into objects and viceversa. Also, it works fine with classes and with structs. Additionally there is an integration with Alamofire on GitHub: [AlamofireObjectMapper](https://github.com/tristanhimmelman/AlamofireObjectMapper).

ObjectMapper has some undesired properties:

* All class' (struct's) properties must be optionals or with default values. It doesn't make sense in many scenarios.
* You have to implement a constructor receiving a mapping object. This couple our models with the library used for parsing. Additionally there is a `mapping` function which receive this map object too.
* Error handling is up to you.

#### Argo

The second option I tried was [Argo](). It's an amazing library. Its statically typed and secure, any error that may happens in the parsing chain will be returned with a descriptive and helpful message. This will make development easier helping to quickly find issues on the code or on the JSON data. 

Additionally Argo works with both classes and structs letting them independent of the library itself. We have to implement a simple protocol named `Decodable` to allow parsing our types. You can define your type's properties as non-optionals if makes sense.

Adding a custom transformation function is an easy tasks. You can pass a closure where you make a transformation from a JSON value to the final type.

I opted to use Argo as my JSON parser library because of the previous advantages.

#### Decodable

>> // TODO

As they say, it is conceptually similar to Argo but simplifying the operators involved. 

### Application's networking layer

With all necessary libraries on hand, it's moment to start putting all together and define the architecture of our project's networking layer.

We're going to start with `NetworkManager` a class that encapsulates all the access to Alamofire. Its main purpose is to encapsulate all calls to Alamofire and adding specific behavior reused in all networking calls. It also defines its own Alamofire.Manager instance with custom configurations.

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
        debugPrint(request)
        return request
    }
    
    static func request(
        method: Alamofire.Method,
        _ URLString: URLStringConvertible,
        parameters: [String: AnyObject]? = nil,
        encoding: ParameterEncoding = .URL,
        headers: [String: String]? = nil) -> Alamofire.Request {
            let request = networkManager.request(method, URLString, parameters: parameters, encoding: encoding, headers: headers)
            debugPrint(request)
            return request
    }
    
    public static func handleResponse<T: Decodable where T == T.DecodedType>(response: Response<T, NSError>, onSuccess: ((T) -> Void)? = nil, onFailure: ((NSError, NSHTTPURLResponse?, AnyObject?) -> Void)? = nil) {
        switch response.result {
        case .Success(let value):
            onSuccess?(value)
        case .Failure(let error):
            onFailure?(error, response.response, response.data?.toJSON())
        }
    }
    
    public static func handleResponse<T: Decodable where T == T.DecodedType>(response: Response<[T], NSError>, onSuccess: (([T]) -> Void)? = nil, onFailure: ((NSError, NSHTTPURLResponse?, AnyObject?) -> Void)? = nil) {
        switch response.result {
        case .Success(let value):
            onSuccess?(value)
        case .Failure(let error):
            onFailure?(error, response.response, response.data?.toJSON())
        }
    }
    
    public static func generalErrorHandler(error: ErrorType) {
        Crashlytics.sharedInstance().recordError(error)
        CLSNSLogv("Service call failed with error: %@", getVaList([error]))
    }
    
}
{% endhighlight %}

Next, we are going to define our service endpoints. As Alamofire's documentation suggests we are going to make an `Enum` that implements `URLRequestConvertible` protocol but we are going to create a base implementation that will save us some time:

{% highlight swift %}

import Alamofire

protocol NetworkRouteType: URLRequestConvertible {
    
    var method: Alamofire.Method { get }
    var path: String { get }
    var parameters: [String: AnyObject]? { get }
    var encoding: Alamofire.ParameterEncoding { get }

}

protocol CustomUrlRequestSetup {

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

{% highlight swift %}

enum Repositories: NetworkRouteType {

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
        
        return "\(Repositories.basePath)\(path)"
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

Additionally we're going to create an extension to `Alamofire.Request` in order to get our own model classes from the result of executing a service call.

Now we're going to define a class that ecanpsulates the services call through our NetworkManager.

{% highlight swift %}

public class RepositoriesService {
 
    func fetchAll() -> Observable<[Repository]> {
        return Observable.create() { observer in
            NetworkManager.request(Repositories.FetchAll)
                .validate()
                # `rx_objectCollection` will return an Observable instance of a collection of repositories. Repositories are decoded by Argo.
                .rx_objectCollection()
                # Whenever a service returns an error we want to log it. We are adding a generic handler that will do that and other tasks if needed
                # `doOnError` is an extension to RxSwift that allow us to easily add an action that will be executed if the sequence fails
                .doOnError(NetworkManager.generalErrorHandler)
                .subscribe(observer)
        }
    }

    func get(ownerId: Int, repoId: Int) -> Observable<Repository> {
        return Observable.create() { observer in
            NetworkManager.request(Repositories.Get(ownerId: ownerId, repoId: repoId))
                .validate()
                # `rx_object` will return an Observable instance of a single repository.
                .rx_object()
                .doOnError(NetworkManager.generalErrorHandler)
                .subscribe(observer)
        }
    }

}

{% endhighlight %}


#### Invoking our networking layer from a client view controller

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
        
        let service = RepositoriesService()
        service.fetchAll()
            .observeOn(MainScheduler.instance)
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

