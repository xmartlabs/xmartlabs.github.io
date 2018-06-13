---
layout: post
title: Android paging for Mortals part one
date: 2018-04-02 09:00:00
author: Matías Irland
categories: Android, Android Jetpack,Android Paging Library,Live Data, Android Architecture Components,RxJava,Retrofit
author_id: mirland

---

There're tons of articles out there talking about the amazing Android Architecture Components, talking about how we can combine them in an MVVM architecture and make them work as a charm.
From my point of view, that's true, the **Android Architecture Components are awesome!**

There is another ton of articles talking about the new [Android Paging Library](https://developer.android.com/topic/libraries/architecture/paging/) and how we can combine it with [Room](https://developer.android.com/topic/libraries/architecture/room) and [LiveData](https://developer.android.com/topic/libraries/architecture/livedata) to make the paging as easier as possible.
I suppose you are already familiar with the topic :)

So I don't want to write about the new Android Components or how we should use them.
Today I want to tell you, how we can **integrate a numerated paged service**, to the best of my knowledge, **using** the new **[XLPaging](https://github.com/xmartlabs/xlpaging) library.**
A numerated paged service is an endpoint which returns a list of entities structured in pages with sequential page numbers.  

To read this post, you should already know the Repository Architectural Pattern and the basic things of these libraries:
- [Retrofit](http://square.github.io/retrofit/)
- [Rxjava](https://github.com/ReactiveX/RxJava)
- [Android Architecture Components](https://developer.android.com/topic/libraries/architecture/)
	- [LiveData](https://developer.android.com/topic/libraries/architecture/livedata)
	- [Room Persistence Library](https://developer.android.com/topic/libraries/architecture/room)
	- [Android Paging Library](https://developer.android.com/topic/libraries/architecture/paging/)

Let's get down to the nitty-gritty!

# Listing Component
First I want to tell you about a cool idea from Google, that they are using in some of their [example projects](https://github.com/googlesamples/android-architecture) to handle all services that return a list.
They believe that you can handle all list streams with a `Listing` component, which contains basically five elements:

```kotlin
data class Listing<T>(
    val pagedList: LiveData<PagedList<T>>,
    val networkState: LiveData<NetworkState>,
    val refresh: () -> Unit,
    val refreshState: LiveData<NetworkState>,
    val retry: () -> Unit
)
```

1. **pagedList:** A changing data stream of type `T` represented as a [`LiveData`](https://developer.android.com/topic/libraries/architecture/livedata) of a [`PagedList`](https://developer.android.com/reference/android/arch/paging/PagedList).
1. **networkState:** A stream that notifies network state changes, such as when a new page started loading (and hence you can show a spinner in the UI).
1. **refresh:** A refresh function, to refresh all data.
1. **refreshState:** A stream that notifies the status of the refresh request.
1. **retry:** A retry function to execute if something failed.

The network state is represented as:
```kotlin
enum class Status {
  RUNNING,
  SUCCESS,
  FAILED
}

data class NetworkState private constructor(
    val status: Status,
    val throwable: Throwable? = null) {

  companion object {
    val LOADED = NetworkState(Status.SUCCESS)
    val LOADING = NetworkState(Status.RUNNING)
    fun error(throwable: Throwable?) = NetworkState(Status.FAILED, throwable)
  }
}
```

## The problem
Suppose that you are following the Repository Pattern and you want to expose a paged entity list from a service source.
In that case, your repository should implement a method which returns a `Listing` of that entities.
I'll give you an example.
Suppose that you have an app which lists the GitHub users whose usernames contain a specific word.

So, if you use Retrofit and RxJava, you can define the service call as:

```kotlin
data class GhListResponse<T>(
  val total_count: Long,
  private val items: List<T>
)

data class User(
  var id: Long, 
  var login: String?, 
  var avatarUrl: String?
)

@GET("/search/users")
fun searchUsers(@Query("q") name: String,
                @Query("page") page: Int,
                @Query("per_page") pageSize: Int
): Single<GhListResponse<User>>
```

This service is pretty similar to most paged services I've seen, so the big question here is how we could integrate this service in a repository using the new Paging Component.
Furthermore, the question could be how we could convert the `Single<GhListResponse<User>>` response in a `Listing<User>` structure.

The first thing that we should consider, is **to decide if we need a database source to cache the data**.
It could seem easy, but it's not.
Some people could say that if we want to search entities by a key, a database cache isn't the best option because the response may change constantly and frequently, and at the same time the app user doesn't repeat the same search query multiple times.
However, saving data in a database source has some advantages.
For example, you can make your app work offline, make less use of the backend, hide network problems, manage data better and share entities easier.

Personally, I prefer taking the cache way, but I know that it depends on the problem.
In this post we will explore both strategies using **[Xlpaging](https://github.com/xmartlabs/xlpaging)**. 

# XLPaging
[XLPaging](https://github.com/xmartlabs/xlpaging) is an **Android Kotlin library** conceived to make your life easier when dealing with paged endpoint services, where the paging is based on incremental page numbers (e.g. 1, 2, 3, ...).

The features are:
- **Network:** Provide a `Listing` structure based on a Retrofit and RxJava service.
- **Network + Cache:** Provide a `Listing` structure with cache support using Retrofit and RxJava for the service layer and a [`DataSource`](https://developer.android.com/reference/android/arch/paging/DataSource) for caching the data. In the examples we will use [Room](https://developer.android.com/topic/libraries/architecture/room) to provide the `DataSource` but you could use any other `DataSource`.

In this part of the series we'll see how we can integrate the first functionality.
The second one will be explained in the next part.

## XLPaging Network Support
The library defines two structures to handle the network requests.
The `PageFetcher` is used to fetch each page from the service, whereas the `PagingHandler` will be used to handle the paging state.

```kotlin
interface PageFetcher<T> {
  @CheckResult
  fun fetchPage(page: Int, pageSize: Int): Single<out T>
}

interface PagingHandler<T> : PageFetcher<T> {
  @CheckResult
  fun canFetch(page: Int, pageSize: Int): Boolean
}
```
The paging state will be managed by the library using mainly two methods:
1. A method to **fetch** a specific page, by a page number and a page size.
This method must return a `Single<out T>`, where `T` can be anything.
1. A method to **check** if a page can be fetched.
For example, if you know that the server has only 3 pages of 10 items each, and the library invokes `canFetch(page = 5, pageSize = 10)` then you should return `false`.
You have to implement this function using the service specification.
Sometimes the service returns the page amount or the entity amount in the response headers or in the response body, so you have to use that information to implement this function.
However, if you know exactly the page or entity count, the library provides a way to make this work easier.
I will show that later.

To use the **XLPaging Network support**, you have to implement just a `PagingHandler<ListResponse<T>>`, where the `ListResponse<T>` is how the library expects the service response.  

```kotlin
interface ListResponse<T> {
  fun getElements(): List<T>
}
``` 

So, following the example, our paging handler would be:
```kotlin
data class GhListResponse<T>(val total_count: Long, private val items: List<T>) : ListResponse<T> {
  override fun getElements() = items
}

val pagingHandler = (object : PagingHandler<ListResponse<User>> {
      override fun canFetch(page: Int, pageSize: Int): Boolean = true //Endless list

      override fun fetchPage(page: Int, pageSize: Int): Single<GhListResponse<User>> =
          userService.searchUsers(userName, page = page, pageSize = pageSize)
    })
```

It's not so hard, right?
However, the example has a problem: the `canFetch` method is returning `true` for all invocations, so we have implemented an endless paging solution.
In most cases the solution will not be so useful, so let's fix it.

If we take a look at the GitHub response, we can see that GitHub is returning the amount of entities in each response.
That is great, we can use that information to implement a real `canFetch` method.
Remember that **XLPaging** provides a way to achieve it automatically.
To do that, the library defines two response interfaces and two `PagingHandler` providers:

```kotlin
interface ListResponseWithEntityCount<T> : ListResponse<T> {
  fun getEntityCount() : Long
}

interface ListResponseWithPageCount<T> : ListResponse<T> {
  fun getPageCount(): Long
}

class PagingHandlerWithTotalEntityCount<T>(
    private val firstPage: Int = 1,
    private val pageFetcher: PageFetcher<out ListResponseWithEntityCount<T>>
) : ListResponsePagingHandler<T> 

class PagingHandlerWithTotalPageCount<T>(
    private val firstPage: Int = 1,
    private val pageFetcher: PageFetcher<out ListResponseWithPageCount<T>>
) : ListResponsePagingHandler<T>
```

Depending on whether we know the entity or the page count, we will use either `ListResponseWithEntityCount<T>` or `ListResponseWithPageCount<T>`.
Given that the GitHub response has the amount of entities, we have to update the `GhListResponse<T>` to implement `ListResponseWithEntityCount<T>`

```kotlin
data class GhListResponse<T>(
    private val total_count: Long,
    private val items: List<T>)
  : ListResponseWithEntityCount<T> {

  override fun getEntityCount() = totalCount

  override fun getElements() = items
}
```

Then, what's left to create the `PagingHandler` is to build a `PageFetcher<GhListResponse<T>>`.

```kotlin
val pageFetcher = (object : PageFetcher<GhListResponse<User>> {
  override fun fetchPage(page: Int, pageSize: Int): Single<GhListResponse<User>> =
      userService.searchUsers(userName, page = page, pageSize = pageSize)
})

val pagingHandler = PagingHandlerWithTotalEntityCount(pageFetcher = pageFetcher)    
```

Recall that at the beginning I said that the only required thing to create a `Listing` structure using the **XLPaging Network support** is a `PageHandler`.
So we can invoke the listing creator in this way:

```kotlin
val listing = XlPaging.createNetworkListing(pagingHandler)
```
And that's all, we have our `Listing<User>` structure!

In addition, there are some optional parameters that you can define when you are constructing the `Listing` object:
- `firstPage: Int`: The initial page number, by default its value is 1.
- `ioServiceExecutor : Executor`: The executor with which the service call will be made. By default, the library will use a pool of 5 threads.
- `pagedListConfig: PagedList.Config` : The paged list configuration.
In this object you can specify several options, for example the `pageSize` and the `initialPageSize`. 

In the next part we'll see how we could get a `Listing` component which uses a cache `DataSource` to store the data.

### Conclusion
The `Listing` component is the key of the library.
It provides an awesome way of displaying the paged entity list and reflecting the network state in the UI.
If you have this component implemented, you can create an MVVM architecture app and combine it with the repository pattern.
If you get a repository which provides a `Listing` component of each paged list, you will be creating a robuster app.

**XlPaging** provides you a way to create a `Listing` component easily for a common paged service type, which are the services where the paginated strategy is based on an incremental page number.

It also provides two ways to go: a mode with **network** support and a mode with **network + cache** support. 
The strategy you choose will depend on your problem. 

I suggest you to give it a try.
We'll be glad if you provide feedback :)

