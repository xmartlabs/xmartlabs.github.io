---
layout: post
title: Introducing Fountain Part Two
date: 2018-08-20 09:00:00
author: Matías Irland
categories: Android, Android Jetpack, Android Paging Library, Live Data, Android Architecture Components, RxJava, Retrofit, Fountain
author_id: mirland

show: true

---

In the [previous part] we presented **[Fountain]** and shown a way, using the `Listing` component, to make the paging as cool and simple as possible.
In that post we explained the first feature of the library, the **Fountain Network support** mode, which provides a way to convert a common numerated paged service into a `Listing` component.
The `Listing` component is a really useful structure to display the paged list entities and reflect the network changes in the UI.
It contains a `LiveData<PagedList<T>>` element, which is provided by the new [Android Paging Library], so we can use all of the features offered by the [PagedListAdapter] in a simple way.
Yes that's awesome, but it has a problem, in that example, the entities aren't saved anywhere.
So if we want to display the same entities multiple times, we have to wait for them to load each time.

In this post we'll see how we can use the second feature of the library: a `Listing` object combining network and cache support.


# Fountain Cache + Network support
We've seen how we could implement a `Listing` structure using the [**Fountain network support** library](https://github.com/xmartlabs/fountain).
However, in that example we had only one source, so how could we manage multiple sources?
How can we combine a database cache source with a paged service source?
There are some paged services that make our life a bit easier.
For instance, if you are using a service API like Reddit, you don't have the page number concept, you have the concept of the page before and the page after some entity id.
Suppose that you are listing the hottest posts associated to a subreddit (like in [one of Google's examples](https://github.com/googlesamples/android-architecture-components/tree/master/PagingWithNetworkSample)) and then, given a specific post, the API enables you to get the next and the previous page of that post.
That's great.
Suppose that the post order cannot change, then we could save all the posts in the database with an index position.
Then we could use it to get the pages after and before your cached pages, and make the paging easy.

That's cool, but what happens if our service API uses only an incremental page number strategy to implement the paging mechanism?
Suppose that we have an incremental paged service, like the GitHub example presented in the [previous post] and we want to save the responses in a database source.
It's hard to implement, we could save the item position and page number, but when an item is added all pages are updated, so it's not a good idea.
In this post I show you how we can use the **[Fountain]** library to get it to work.


## Paging strategy
To make the pagination strategy work, **Fountain** needs two components:
1. A `NetworkDataSourceAdapter<out ListResponse<Value>>` to fetch all pages.
This component was presented in the [previous post]. It's a structure which contains all required operations to manage the pagination of a paged service, where the strategy is based on an incremental page number.
1. A [`CachedDataSourceAdapter`] to update the [`DataSource`].
It's the interface that the library will use to take control of the [`DataSource`].

The paging strategy that **Fountain** is using can be seen in the following diagram:
<br> <br> <img src="/images/fountain/paginationStrategy.png" align="center" />

It starts with an initial service data request.
By default the initial data requested is three pages, but this value can be changed calling the [`setInitialLoadSizeHint`] method in the [`PagedList.Config`] configuration object.
When the service data comes, all the data is refreshed in the `DataSource` using the [`CachedDataSourceAdapter`].
Note that the [`Listing`] component will notify that the data changed.

After that, the [Android Paging Library] will require pages when the local data is running low.
When a new page is required, the paging library will invoke a new service call, and will use the [`CachedDataSourceAdapter`] to save the returned data into the [`DataSource`].

### CachedDataSourceAdapter definition

We've talked about the [`CachedDataSourceAdapter`] and its function, but we've not defined it yet.

```kotlin
interface CachedDataSourceAdapter<NetworkValue, DataSourceValue> {
  fun getDataSourceFactory(): DataSource.Factory<*, DataSourceValue>

  @WorkerThread
  fun saveEntities(response: List<NetworkValue>)

  @WorkerThread
  fun dropEntities()

  @WorkerThread
  fun runInTransaction(transaction: () -> Unit)
}
```

The adapter has four methods that the user has to implement:

- `getDataSourceFactory`: will be used to list the cached elements.
The returned value is used to create the [`LivePagedListBuilder`].
- `runInTransaction` will be used to apply multiple [`DataSource`] operations in a single transaction. That means that if something fails, all operations will fail.
- `saveEntities` will be invoked to save all entities into the [`DataSource`].
This will be executed in a transaction.
- `dropEntities` will be used to delete all cached entities from the [`DataSource`].
This will be executed in a transaction.


### DataSource

We just discussed what a [`CachedDataSourceAdapter`] is, but the implementation of this interface will mostly depend on the [`DataSource`] we choose.
So, to make things easier we'll use the [Room Persistence Library] which provides a [`DataSource`] trivially.

The next important step is to think about how we can retrieve the [`DataSource`] entities in the same order as they were returned by the service.
A common approach here is to save an index position in the entity.
Then, when a new page comes, we have to search for the largest index position in the [`DataSource`] and update all entities in the response, incrementing it by one.
That could work, but suppose that you are listing the GitHub users and you have two sort modes to display them.
The first one is to list the users by star number and the second one is by follower number.
So there are multiple services that could return the same entity in a different order.
To solve this problem using the current approach we have to add two position indexes in the `User` entity.
It will work, but it's not an elegant solution.
Furthermore, we can run into problems keeping the index consistent when the entities are updated.

I prefer a different solution, a solution that uses multiple objects to model the situation.
One object to model the entity itself and one object for each relationship or ordering of this entity.
Now it's better, in our example we'll have an `User` object, an `UserOrderByStars` object and an `UserOrderByFollowers` object, where the last two have a position index attribute.

Suppose that we have to implement the same app than in the [previous post], an app which lists the GitHub users whose usernames contain a specific word.
If we use the last solution, we'll have two entities `User` and `UserSearch` where the last one will contain the query search and the position of the entity in the list associated to the query search.
First let's define the entities using Room.

```kotlin
@Entity
data class User(
    @PrimaryKey var id: Long,
    @SerializedName("login") var name: String?,
    var avatarUrl: String?
)

@Entity(
    foreignKeys = [
      ForeignKey(
        entity = User::class,
        parentColumns = ["id"],
        childColumns = ["userId"])
    ],
    indices = [Index("userId")]
)
data class UserSearch(
    @PrimaryKey(autoGenerate = true) val id: Long? = null,
    val search: String,
    val userId: Long,
    val searchPosition: Long
)
```

### CachedDataSourceAdapter implementation

To create the `CachedDataSourceAdapter` of users, we have to implement the four operations that the interface defines: `saveEntities`, `dropEntities`, `getDataSourceFactory` and `runInTransaction`.
To implement these methods, we have to define a [Room Dao interface], let's name it `UserDao`.

The `getDataSourceFactory` method will require a method to retrieve all `User` entities associated to a `search` query, sorted by the index.

If we follow the paging strategy we defined, `saveEntities` will require three methods in the `UserDao`:
- A method to insert the `User` entities.
- A method to insert the `UserSearch` entities.
- A method to get the next `searchPosition` index.

The `dropEntities` method will require one or two methods depending on what we want to do.
- The first option can be to have a method to delete all `User` entities and all `UserSearch` entities associated to a `search` query.
- The second one can be to have only one method to delete the `UserSearch` entities associated to a `search` query and keep the `User` entities in the database.
This is very helpful when you have multiple services that return the same entities and we have to keep the database consistent.
In our example, the same user could be included in multiple `search` queries' responses, so to remove some complexity, we will use this solution.  

Note that the `runInTransaction` operation will not require any method in the `UserDao`, we will just use the `runInTransaction` method that Room provides.

Using that information the `UserDao` will look something like:

```kotlin
@Dao
interface UserDao {
  @Insert(onConflict = OnConflictStrategy.REPLACE)
  fun insert(users: List<User>)

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  fun insertUserSearch(posts: List<UserSearch>)

  @Query("SELECT User.* FROM User INNER JOIN UserSearch ON User.id = UserSearch.userId " +
      "WHERE search=:search ORDER BY searchPosition ASC")
  fun findUsersByName(search: String): DataSource.Factory<Int, User>

  @Query("SELECT MAX(searchPosition) + 1 FROM UserSearch WHERE search=:search")
  fun getNextIndexInUserSearch(search: String): Long

  @Query("DELETE FROM UserSearch WHERE search=:search")
  fun deleteUserSearch(search: String)
}
```

Now we have all the components we need to implement our `CachedDataSourceAdapter` of users, remember that we had defined the `User` and `ListResponse` entities in the [previous post].

```kotlin
val cachedDSAdapter = object : CachedDataSourceAdapter<User, User> {
  override fun getDataSourceFactory() = userDao.findUsersByName(userName)

  override fun runInTransaction(transaction: () -> Unit) {
    db.runInTransaction(transaction)
  }

  override fun saveEntities(response: List<User>) {
    response?.getElements()?.let { users ->
      val start = userDao.getNextIndexInUserSearch(userName)
      val relationItems = users
          .mapIndexed { index, user ->
            UserSearch(
              search = userName,
              userId = user.id,
              searchPosition = start + index
            )
          }
      userDao.insert(users)
      userDao.insertUserSearch(relationItems)
    }
  }

  override fun dropEntities() {
    userDao.deleteUserSearch(userName)
  }
}
```
The implementation looks well, the most difficult thing is creating the `UserSearch` entities and assigning the right `searchPosition` but it's not so hard!


### Get the listing component

Well, I told you that there are only two required components to create the `Listing` object.
If we use the `cachedDataSourceAdapter` that we created in the [previous post], we have all the components that we need.

```kotlin
Fountain.createPagedNetworkWithCacheSupportListing(
  networkDataSourceAdapter = networkDataSourceAdapter,
  cachedDataSourceAdapter = cachedDSAdapter
)
```

As well as in the network support listing, there are some optional parameters that you can use to setup the `Listing` object.

- `firstPage: Int`: The initial page number, by default it's value is 1.
- `ioServiceExecutor : Executor`: The executor where the service call will be made. By default the library will use a pool of 5 threads.
- `ioDatabaseExecutor : Executor`: The executor where the database transaction will be done. By default the library will use a single thread executor.
- `pagedListConfig: PagedList.Config` : The paged list configuration, in this object you can specify for example the `pageSize` and the `initialPageSize`.


### Conclusion

Using [Fountain] you can create a listing component which is really useful to show the entities.
Either if you choose to have cache support or not, the library provides a common interface that you can use with low effort!
So changing or combining both modes shouldn't be hard.

I suggest you to try this component in a MVVM architecture using the Repository pattern and then tell me what you think!

[`CachedDataSourceAdapter`]: https://xmartlabs.gitbook.io/fountain/fountain/cacheddatasourceadapter
[`DataSource.Factory<*, Value>`]: https://developer.android.com/reference/android/arch/paging/DataSource.Factory
[`DataSource`]: https://developer.android.com/reference/android/arch/paging/DataSource
[`Listing`]: https://xmartlabs.gitbook.io/fountain/listing
[`LiveData`]: https://developer.android.com/topic/libraries/architecture/livedata
[`LivePagedListBuilder`]: https://developer.android.com/reference/android/arch/paging/LivePagedListBuilder
[`PagedList.Config`]: https://developer.android.com/reference/android/arch/paging/PagedList.Config.html
[`setInitialLoadSizeHint`]: https://developer.android.com/reference/android/arch/paging/PagedList.Config.html#initialLoadSizeHint
[Android Paging Library]: https://developer.android.com/topic/libraries/architecture/paging/
[Fountain]: https://github.com/xmartlabs/fountain
[PagedListAdapter]: https://developer.android.com/reference/android/arch/paging/PagedListAdapter
[previous part]: /2018/07/16/Introducing-Fountain-Part-One/
[previous post]: /2018/07/16/Introducing-Fountain-Part-One/
[Room Dao interface]: https://developer.android.com/reference/android/arch/persistence/room/Dao
[Room Persistence Library]: https://developer.android.com/topic/libraries/architecture/room
