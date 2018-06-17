---
layout: post
title: Android paging for Mortals - Introducing Fountain Part Two
date: 2018-04-02 09:00:00
author: Matías Irland
categories: Android, Android Jetpack,Android Paging Library,Live Data, Android Architecture Components,RxJava,Retrofit,Fountain
author_id: mirland

---

In the [previous part]() we've presented **Fountain** and we shown a way, using the `Listing` component, to make the paginated as cool and simple as possible.
In that post we explained the first way of the library, the **Fountain Network support** mode, which provides a way to convert a common numerated paged service in `Listing` component.
The `Listing` component, it's a really useful structure to display the paged list entities and reflect the network status changes in the UI.
It contains a `LiveData<PagedList<T>>` element, which is provided by the new [Android Paging Library](https://developer.android.com/topic/libraries/architecture/paging/), so we can use all features of the new [PagedListAdapter](https://developer.android.com/reference/android/arch/paging/PagedListAdapter) in a simple way.
Yes that's awesome, but it has a problem, in that example, the entities aren't saved anywhere.
So if we want to display multiple times the same entities, we have to wait for them to load each time. 

In this post we'll see how we can use the second feature of the library: a `Listing` object combining network and cache support.


# Fountain Cache + Network support
We've seen how we could implement a `Listing` structure using the [**Fountain network support** library](https://github.com/xmartlabs/fountain).
However, in that example we had only one source, so how could we manage multiple sources?
How could we combine a database cache source with a paged service source?
There are some paged services that make our life a bit easier.
For instance, if you are using a service API like Reddit, you don't have the page number concept, you have the concept of the page before and page after of something.
Suppose that you are listing the hottest posts associated to a subreddit (like in [one of Google's examples](https://github.com/googlesamples/android-architecture-components/tree/master/PagingWithNetworkSample)) and then, given a specific post, the API enables you to get the next and the previous page of that post.
That's great, suppose that the post order cannot change, so using that, we could save in database all posts and in somewhere which is the newest and the oldest post.
Then we could use that to get the page after and before them, and make the paged stuff easy.

That's cool, but what happened if our service API use only an incremental page number strategy to implement the paging stuff?
Suppose that we have an incremental paged service, like the Github example presented in the previous post and we want to save the responses in a database source.
That's hard, we could save the item position and the page number, but if an item is added all pages are updated, so that's not a good idea.
In this post I'll show you how we can use the **XlPaging** library to make it work.


## Paging strategy
In order to make the pagination strategy works, **Fountain** needs basically three required components:
1. A `PageHandler` to fetch all pages.
This component was presented in the previous post, it's a structure which contain all required operations to manage the pagination of a paged service, where the paginated strategy is based on an incremental page number.
1. A [`DataSource.Factory<*, Value>`](https://developer.android.com/reference/android/arch/paging/DataSource.Factory) to setup the [`LivePagedListBuilder`](https://developer.android.com/reference/android/arch/paging/LivePagedListBuilder) of the [Android Paging Library](https://developer.android.com/topic/libraries/architecture/paging/) and get a `LiveData<PagedList<Value>>`.
Doing that in this way, if the `DataSource`  suffer any change, the `LiveData` object will notify that a change has happened.
1. A `DataSourceEntityHandler` to be able to update the `DataSource`.
It's very useful because it's the interface that the library will use to take control of the `DataSource`.


The pagination strategy that is using **XlPaging** will be done using these components and it can be seen in the following image.

***Bruno PHOTO***


The paging strategy starts with an initial service data request, by default the initial data requested is three pages size, but this value could be changed using the [`setInitialLoadSizeHint`](https://developer.android.com/reference/android/arch/paging/PagedList.Config.html#initialLoadSizeHint) method in the [`PagedList.Config`](https://developer.android.com/reference/android/arch/paging/PagedList.Config.html).
When the service data comes, all data is refreshed in the `DataSource` using the `DataSourceEntityHandler`.
Remember that the `LiveData<PagedList<Value>>` was created using the `DataSource`, so the `LiveData` will notify that the data changed.
After that, the [Android Paging Library](https://developer.android.com/reference/android/arch/paging/package-summary) will require pages when the local data is running low. When a new page is required, the paging library will invoke a new service call, and will use the `DataSourceEntityHandler` to save the returned data into the `DataSource`.

### DataSourceEntityHandler definition

We've talked about the `DataSourceEntityHandler` and what is their function, but we've not defined it yet. So, let do it!

```kotlin
interface DataSourceEntityHandler<T> {
  @WorkerThread
  fun saveEntities(response: T?)

  @WorkerThread
  fun dropEntities()

  @WorkerThread
  fun runInTransaction(transaction: () -> Unit)
}
```

It has only three methods that the user has to implement in order to make it work.

- `runInTransaction` will be used to apply multiple `DataSource` operations in a single transaction. That means that if something fails, all operations will fail.
- `saveEntities` will be invoked to save all entities into the `DataSource`.
This will be executed in a transaction.
- `dropEntities` will be used to delete all cached entities from the `DataSource`.
This will be executed in a transaction.


### DataSource

Now we know what is `DataSourceEntityHandler`, but the implementation of this interface will depend mostly in the `DataSource` that we choose.
So, in order to make the things easier we'll use the [Room Persistence Library](https://developer.android.com/topic/libraries/architecture/room) which provides a `DataSource` trivially.

The next important step is to think about how we could retrieve the `DataSource` entities in the same order that the entities were returned by the service. 
A common approach here is to save an index position in the entity.
Then, when a new page come, we have to search the bigger index position in the `DataSource` and update all entities in the response, incrementing that index by one.
That could work, but suppose that you are listing the Github users and you have two sort modes to display them.
The first one is list the users by the number of starts and the second one is list the users by the number of followers.
So there are multiple services that could return the same entity in different order.
In order to solve this problem using the current approach we have to add two position indexes in the `User` entity.
That will work, but from my point of view that's no so clean.
Furthermore, we could have problems to keep the index consistent when the entities are updated.

I prefer a different solution, a solution that use one table for the entity, and one table per sort relation.
Now it's better, in our example we will have an `User` table, an `UserOrderByStats` table and an `UserOrderByFollowers` table, where the last two have a position index attribute.

Suppose that we have to implement the same app than in the previous post, an app which lists the Github users whose usernames contain a specific word.
So using the last solution we will have two entities `User` and `UserSearch`, where the last one will contain the query search and the position of the entity in the list associated to the query search.
First of all, let define the entities using Room.

```kotlin
@Entity
data class User(
    @PrimaryKey var id: Long,
    @SerializedName("login") var name: String?,
    var avatarUrl: String?
)

@Entity(
    foreignKeys = [
      ForeignKey(entity = User::class, parentColumns = ["id"], childColumns = ["userId"])
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

After that, we can define the `DataSource.Factory` creating a [Room Dao interface](https://developer.android.com/reference/android/arch/persistence/room/Dao).

```kotlin
@Dao
interface UserDao {
  @Query("SELECT User.* FROM User INNER JOIN UserSearch ON User.id = UserSearch.userId " +
      "WHERE search=:search ORDER BY searchPosition ASC")
  fun findUsersByName(search: String): DataSource.Factory<Int, User>
}
```
That's all, we've created a `DataSource.Factory<Int, User>` which returns the list of users associated to the `search` query parameter and sorted by the `searchPosition` parameter.



### DataSourceEntityHandler implementation

In order to create the `DataSourceEntityHandler` of users, we have to implement the three operations that the interface defines: `saveEntities`, `dropEntities` and `runInTransaction`.
We have to update `UserDao` in order to be able to implement these methods. 

If we follow the paging strategy that we defined, `saveEntities` will require three more methods:
- A method to insert the `User` entities.
- A method to insert the `UserSearch` entities.
- A method to get the next `searchPosition` index. 

The `dropEntities` method will require one or two methods depending what we want to do.
- The first option can be have a method to delete all `User` entities and all `UserSearch` entities associated to a `search` query.
- The second one can be have only one method to delete the `UserSearch` entities associated to a `search` query and keep the `User` entities in database.
This is very helpful when you have multiple services that return the same entities and we've to keep the database consistent.
In our example, the same user could be included in multiple `search` queries responses, so to remove some complexity, we will use this solution.  

The `runInTransaction` operation will not require any change in the `UserDao`, we will just use the `runInTransaction` method that Room provides.

If we add these changes to the `UserDao` it will look something like:

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

Now we have all components to implement our `DataSourceEntityHandler` of users, remember that we'd defined the `User` and `ListResponse` entities in the previous post.

```kotlin
val dataSourceEntityHandler = object : DataSourceEntityHandler<ListResponse<User>> {
  override fun runInTransaction(transaction: () -> Unit) {
    db.runInTransaction(transaction)
  }

  override fun saveEntities(response: ListResponse<User>?) {
    response?.getElements()?.let { users ->
      val start = userDao.getNextIndexInUserSearch(userName)
      val relationItems = users
          .mapIndexed { index, user ->
            UserSearch(search = userName, userId = user.id, searchPosition = start + index)
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
The implementation looks well, the most difficult thing is create the `UserSearch` entities and assign the right `searchPosition` but it's not so hard!


### Get the listing component

Well, I told you that there are three required components to create the `Listing` object.
If we use the `pagingHandler` that we created in the previous post, we have all components that we need.

```kotlin
val listingWithCacheSupport = XlPaging.createNetworkWithCacheSupportListing(
    dataSourceEntityHandler = dataSourceEntityHandler,
    dataSourceFactory = userDao.findUsersByName(userName),
    pagingHandler = pagingHandler
)
```

As well as in the network support listing, there're some optional parameters that you can use to setup the `Listing` object.

- `firstPage: Int`: The initial page number, by default it's value is 1.
- `ioServiceExecutor : Executor`: The executor where the service call will be made. By default the library will use a pool of 5 threads.
- `ioDatabaseExecutor : Executor`: The executor where the database transaction will be done. By default the library will use a single thread executor.
- `pagedListConfig: PagedList.Config` : The paged list configuration, in this object you can specify for example the `pageSize` and the `initialPageSize`. 


### Conclusion

Using [XL Paging]() you can create a listing component which is really useful to show the entities. Ether if you choose to have a cache support or not, the library provides you a common interface that you can use with less effort! So change or combine both modes shouldn't be hard.

I suggest you to try this component in a MVVM architecture using the repository pattern and then tell me what do yo think!
