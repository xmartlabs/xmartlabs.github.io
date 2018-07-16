---
layout: post
title: Introducing Fountain Part One
date: 2018-07-16 12:00:00
author: Matías Irland
categories: Android, Android Jetpack, Android Paging Library, Live Data, Android Architecture Components, RxJava, Retrofit, Fountain
author_id: mirland

---

There are plenty of articles out there talking about the amazing Android Architecture Components, how we can combine them in an MVVM architecture and make them work as a charm.
From my point of view, that's true, the **Android Architecture Components are awesome!**

There's also a ton of articles talking about the new [Android Paging Library] and how we can combine it with [Room Persistence Library] and [LiveData] to make paging as easy as possible.
I suppose that you are already familiar with the topic :)

So I don't want to write about the new Android Components or how we should use them.
Today I want to tell you how we can **integrate a numerated paged service**, to the best of my knowledge, **using** the new **[Fountain] library.**
A numerated paged service is an endpoint which returns a list of entities structured in pages with sequential page numbers.  

To read this post, you should already know the Repository Architectural Pattern and the basics of these libraries:
- [Retrofit]
- [Rxjava]
- [Android Architecture Components]
	- [LiveData]
	- [Room Persistence Library]
	- [Android Paging Library]

Let's get down to the nitty-gritty stuff!

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

1. **pagedList:** A changing data stream of type `T` represented as a [`LiveData`] of a [`PagedList`].
1. **networkState:** A stream that notifies network state changes, such as when a new page started loading (so you can show a spinner in the UI).
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
  val items: List<T>
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

This service is pretty similar to most paged services I've seen, so the big question here is how we can integrate this service in a repository using the new Paging Component.
Furthermore, the question could be how we could convert the `Single<GhListResponse<User>>` response to a `Listing<User>` structure.

The first thing that we should consider, is **deciding if we need a database source to cache the data**.
It could seem easy, but it's not.
Some people could say that if we want to search entities by a key, a database cache isn't the best option because the response may change constantly and frequently, and at the same time the app user doesn't repeat the same search query multiple times.
However, saving data in a database source has some advantages.
For example, you can make your app work offline, make less use of the backend, hide network problems, manage data better and share entities easier.

Personally, I prefer taking the cache approach, but I know that it depends on the problem.
In this post we will explore both strategies using **[Fountain]**. 

# Fountain
[Fountain] is an **Android Kotlin library** conceived to make your life easier when dealing with paged endpoint services, where the paging is based on incremental page numbers (e.g. 1, 2, 3, ...).

The features are:
- **Network:** Provide a `Listing` structure based on a Retrofit and RxJava service.
- **Network + Cache:** Provide a `Listing` structure with cache support using Retrofit and RxJava for the service layer and a [`DataSource`] for caching the data. In the examples we will use [Room Persistence Library] to provide the [`DataSource`] but you could use any other [`DataSource`].

In this first part of the series we'll see how we can integrate the first functionality.
The second one will be explained in the next part.

## Integration
To integrate [Fountain] into your app, you have to include the following dependency in your gradle app.
```groovy
repositories {
    maven { url "https://jitpack.io" }
}

dependencies {
    implementation 'com.github.xmartlabs:fountain:0.1.+'
}
```

## Fountain Network Support
The library defines two structures to handle the network requests.
The `PageFetcher` is used to fetch each page from the service, whereas the `NetworkDataSourceAdapter` will be used to handle the paging state.

```kotlin
interface PageFetcher<T> {
  @CheckResult
  fun fetchPage(page: Int, pageSize: Int): Single<out T>
}

interface NetworkDataSourceAdapter<T> : PageFetcher<T> {
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
Sometimes the service returns the page amount or the entity amount in the response headers or in the response body, so you'll have to use that information to implement this function.
However, if you know exactly the page or entity count, the library provides a way to make this work easier.
I will show that later.

To use the **Fountain Network support**, you just have to implement a `NetworkDataSourceAdapter<ListResponse<T>>`, where the `ListResponse<T>` is how the library expects the service response.

```kotlin
interface ListResponse<T> {
  fun getElements(): List<T>
}
``` 

So, following the example, our paging handler would be:
```kotlin
data class GhListResponse<T>(
    val total_count: Long,
    val items: List<T>
) : ListResponse<T> {
  override fun getElements() = items
}

val networkDataSourceAdapter = 
    (object : NetworkDataSourceAdapter<ListResponse<User>> {
      override fun canFetch(page: Int, pageSize: Int) = true

      override fun fetchPage(page: Int, pageSize: Int) =
          userService.searchUsers(userName, page, pageSize)
    })
```

It's not so hard, right?
However, the example has a problem: the `canFetch` method is returning `true` for all invocations, so we have implemented an endless paging solution.
In most cases the solution will not be so useful, so let's fix it.

If we take a look at the GitHub response, we can see that GitHub is returning the amount of entities in each response.
That is great, we can use that information to implement a real `canFetch` method.
Remember that **Fountain** provides a way to achieve it automatically.
To do that, the library defines two response interfaces and two `NetworkDataSourceAdapter` providers:

```kotlin
interface ListResponseWithEntityCount<T> : ListResponse<T> {
  fun getEntityCount() : Long
}

interface ListResponseWithPageCount<T> : ListResponse<T> {
  fun getPageCount(): Long
}

class NetworkDataSourceWithTotalEntityCountAdapter<T>(
  val pageFetcher: PageFetcher<out ListResponseWithEntityCount<T>>,
  firstPage: Int = 1
) : NetworkDataSourceAdapter<ListResponse<T>>

class NetworkDataSourceWithTotalPageCountAdapter<T>(
  val pageFetcher: PageFetcher<out ListResponseWithPageCount<T>>,
  firstPage: Int = 1
) : NetworkDataSourceAdapter<ListResponse<T>>
```

Depending on whether we know the entity or the page count, we will use either `NetworkDataSourceWithTotalEntityCountAdapter<T>` or `NetworkDataSourceWithTotalPageCountAdapter<T>`.
Given that the GitHub response has the amount of entities, we have to update the `GhListResponse<T>` to implement `NetworkDataSourceWithTotalEntityCountAdapter<T>`

```kotlin
data class GhListResponse<T>(
    val total_count: Long,
    val items: List<T>)
  : ListResponseWithEntityCount<T> {

  override fun getEntityCount() = total_count

  override fun getElements() = items
}
```

Then, what's left to create the `NetworkDataSourceAdapter` is to build a `PageFetcher<GhListResponse<T>>`.

```kotlin
val pageFetcher = (object : PageFetcher<GhListResponse<User>> {
  override fun fetchPage(page: Int, pageSize: Int) =
      userService.searchUsers(userName, page, pageSize)
})

val networkDataSourceAdapter =
    NetworkDataSourceWithTotalEntityCountAdapter(pageFetcher)
```

Recall that at the beginning I said that the only required thing to create a `Listing` structure using the **Fountain Network support** was a `NetworkDataSourceAdapter`.
So we can invoke the listing creator this way:

```kotlin
Fountain.createNetworkListing(networkDataSourceAdapter)
```
And that's all, we have our `Listing<User>` structure!

In addition, there are some optional parameters that you can define when you are constructing the `Listing` object:
- `firstPage: Int`: The initial page number, by default its value is 1.
- `ioServiceExecutor : Executor`: The executor with which the service call will be made. By default, the library will use a pool of 5 threads.
- `pagedListConfig: PagedList.Config` : The paged list configuration.
In this object you can specify several options, for example the `pageSize` and the `initialPageSize`. 

In the next part we'll see how we could get a `Listing` component which uses a `DataSource` cache to store the data.

Example code can be found in the [sample app](https://github.com/xmartlabs/fountain/tree/master/app).

### Conclusion
The `Listing` component is the key of the library.
It provides an awesome way of displaying the paged entity list and reflecting the network state in the UI.
If you have this component implemented, you can create an MVVM architecture app and combine it with the repository pattern.
If you get a repository which provides a `Listing` component of each paged list, you will be creating a robuster app.

**Fountain** provides a way to create a `Listing` component easily for a common paged service type, which are the services where the paginated strategy is based on an incremental page number.

It also provides two ways to go: a mode with **network** support and a mode with **network + cache** support. 
The strategy you choose will depend on your problem. 

I suggest you give it a shot.
We'll be glad if you provide feedback :)

[`DataSource`]: https://developer.android.com/reference/android/arch/paging/DataSource
[`LiveData`]: https://developer.android.com/topic/libraries/architecture/livedata
[`PagedList`]: https://developer.android.com/reference/android/arch/paging/PagedList
[Android Architecture Components]: https://developer.android.com/topic/libraries/architecture/
[Android Paging Library]: https://developer.android.com/topic/libraries/architecture/paging/
[Fountain]: https://github.com/xmartlabs/fountain
[LiveData]: https://developer.android.com/topic/libraries/architecture/livedata
[LiveData]: https://developer.android.com/topic/libraries/architecture/livedata
[Retrofit]: http://square.github.io/retrofit/
[Room Persistence Library]: https://developer.android.com/topic/libraries/architecture/room
[Rxjava]: https://github.com/ReactiveX/RxJava
