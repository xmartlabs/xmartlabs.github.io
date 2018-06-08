---
layout: post
title: Android paging for Mortals part one
date: 2018-04-02 09:00:00
author: Matías Irland
categories: Android, Android Jetpack,Android Paging Library,Live Data, Android Architecture Components,RxJava,Retrofit
author_id: mirland

---

There're tons of articles talking about the amazing Android Architecture Components, talking about how we can combine them in an MVVM architecture and make them work as a charm.
From my point of view, that's true, the **Android Architecture Components are awesome!**

There're another ton of articles talking about the new [Android Paging Library](https://developer.android.com/topic/libraries/architecture/paging/) and how we can combine it with [Room](https://developer.android.com/topic/libraries/architecture/room) and [LiveData](https://developer.android.com/topic/libraries/architecture/livedata) to make the paging as easier as possible.
I suppose that you have read some of them.

So I don't want to write about the new Android Components or how we should use them.
Today I want to tell you, how we can **integrate a numerated paged service**, in the best way that I know, **using** the new **[XLPaging](https://github.com/xmartlabs/xlpaging) library.**
A numerated paged service is a service which returns a list of entities structured in pages with sequential page numbers.  

In order to read this post, you should already know the repository architectural pattern and the basic things of these libraries:
1. [Retrofit](http://square.github.io/retrofit/)
1. [Rxjava](https://github.com/ReactiveX/RxJava)
1. [Android Architecture Components](https://developer.android.com/topic/libraries/architecture/)
	1. [LiveData](https://developer.android.com/topic/libraries/architecture/livedata)
	1. [Room Persistence Library](https://developer.android.com/topic/libraries/architecture/room)
	1. [Android Paging Library](https://developer.android.com/topic/libraries/architecture/paging/)


# Listing Component
First of all I want to tell you a cool Google idea, that they are using in some of their [example projects](https://github.com/googlesamples/android-architecture) to handle all services which contains a list.

They think that you can handle all list streams with a `Listing` component which contains basically four elements:

```kotlin
data class Listing<T>(
    val pagedList: LiveData<PagedList<T>>,
    val networkState: LiveData<NetworkState>,
    val refresh: () -> Unit,
    val refreshState: LiveData<NetworkState>,
    val retry: () -> Unit
)
```

1. A changing data stream of the type `T` represented as [`LiveData`](https://developer.android.com/topic/libraries/architecture/livedata) of a [`PagedList`](https://developer.android.com/reference/android/arch/paging/PagedList).
1. A stream which contains the networking state changes.
1. A refresh function, to refresh all data.
1. A stream which contains the status of the refresh request.
1. A retry function, in order to be able to execute it if something failed.

The networking state could be represented as:
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
Suppose that you are following the repository pattern and you want to expose a paginated list of entities from a service source.
In that case, your repository should implement a method which returns a `Listing` of that entities.

I'll give you an example, suppose that you have an app which lists the github users whose usernames contain a specific word.

So, if you use Retrofit and RxJava you can define the service call as:

```kotlin
data class GhListResponse<T>(val total_count: Long, private val items: List<T>)

data class User(var id: Long, @SerializedName("login") var name: String?, var avatarUrl: String?)

@GET("/search/users")
fun searchUsers(@Query("q") name: String,
                @Query("page") page: Int,
                @Query("per_page") pageSize: Int
): Single<GhListResponse<User>>
```

This service is pretty similar to the majority of the paged services that I've seen, so the big question here is how we could integrate this service in a repository using the new Paging Component.
Furthermore, the question could be how we could convert the `Single<GhListResponse<User>>` response in a `Listing<User>` structure.

The first question that we should do to solve this problem is: do we want to have a database source to cache the data?
That's a complicated question, the answer could be that if we want to search entities by a key, maybe a database cache couldn't be the best option.
The response could change a lot in a short period of time and maybe the user doesn't use to do the same search multiple times.
However, saving data in a database source sometimes could have some advantages.
For example, you can provide offline support, make less usage of the server, "hide" network problems, do a better manage of the data and be able to share entities easier.

Personally, I prefer using the second one, but I know that depending your problem or your use case both options could be valid.
In this post we will see that both strategies could be implemented using **[Xlpaging](https://github.com/xmartlabs/xlpaging)**. 

# XLPaging
[XLPaging](https://github.com/xmartlabs/xlpaging) is an **Android Kotlin library** which provides two main features for people who work with paginated services, where the paginated strategy of that services are based on an incremental page number.
Those features are:
- Provide a `Listing` structure based on a Retrofit & RxJava service.
- Provide a `Listing` structure with cache support using Retrofit and RxJava for the service layer and a [`DataSource`](https://developer.android.com/reference/android/arch/paging/DataSource) for caching the data. In the examples we will use [Room](https://developer.android.com/topic/libraries/architecture/room) to provide the `DataSource` but you could use any other `DataSource`.

In this post we'll see how we can integrate the first functionality.
The second one will be explained in the next post.

## XLPaging Network support
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
So the paging state will be managed by the library using mainly two methods:
- The first one, is a method to fetch an specific page, by a page number and a page size.
This method should return a `Single<out T>`, where `T` could be anything.
- The second one, is a method to check if a page can be fetched.
For example, if you know that the server has only 3 pages of 10 items each one, if the library invokes `canFetch(page = 5, pageSize = 10)` you should return `false`.
You have to implement this function using the service specifications.
Sometime the service returns the amount of pages or the amount of entities in the response headers or in the response body, so you have to use that information to implement this function.
However, if you know exactly the amount of pages or the amount of entities, the library provides a way to make this work easier.
I will show that later.


In order to use the **XLPaging Network support**, we have to implement just a `PagingHandler<ListResponse<T>>`, where the `ListResponse<T>` is how the library expects the service response.  

```kotlin
interface ListResponse<T> {
  fun getElements(): List<T>
}
``` 

So, if we use the same Github example, our page fetcher would be:
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

It's no so hard, right?
However, this example has a problem, the `canFetch` method is returning `true` for all invocations, so we'd implemented an endless paginated solution.
In most cases this solution will not be so useful, so let fix it.
If we take a look the Github response, we can see that Github is returning the amount of entities in each response, so that it's great, we can use that information to implement a "real" `canFetch` method.

I told you that **XLPaging** provides a way to do that work automatically, so the library defines two response interfaces and two `PagingHandler` providers to handle that.

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

Depending on if we known the amount of entities or the amount of pages we will use either `ListResponseWithEntityCount<T>` or `ListResponseWithPageCount<T>`.
  So as Github response has the amount of entities, we have to update the `GhListResponse<T>` to implements `ListResponseWithEntityCount<T>`

```kotlin
data class GhListResponse<T>(
    private val total_count: Long,
    private val items: List<T>)
  : ListResponseWithEntityCount<T> {

  override fun getEntityCount() = totalCount

  override fun getElements() = items
}
```

So now, the only thing that we should do to create the `PagingHandler` is to create a `PageFetcher<GhListResponse<T>>`.

```kotlin

val pageFetcher = (object : PageFetcher<GhListResponse<User>> {
  override fun fetchPage(page: Int, pageSize: Int): Single<GhListResponse<User>> =
      userService.searchUsers(userName, page = page, pageSize = pageSize)
})

val pagingHandler = PagingHandlerWithTotalEntityCount(pageFetcher = pageFetcher)    
```

At the beginning of this post I said that the only required thing to create a `Listing` structure using the **XLPaging Network support** is a `PageHandler`.
So we can invoke the listing creator in this way

```kotlin
val listing = XlPaging.createNetworkListing(pagingHandler = pagingHandler)
```
That's all, we have our `Listing<User>` structure.
  In addition, there some optional parameters that you can define when you are constructing the `Listing` object:
- `firstPage: Int`: The initial page number, by default it's value is 1.
- `ioServiceExecutor : Executor`: The executor where the service call will be made. By default, the library will use a pool of 5 threads.
- `pagedListConfig: PagedList.Config` : The paged list configuration, in this object you can specify for example the `pageSize` and the `initialPageSize`. 

In the next post we well see how we could get a `Listing` component which use a cache `DataSource` for storing the data.
