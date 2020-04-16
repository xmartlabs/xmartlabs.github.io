---
layout: post
title:  "Android logging with Crashlytics and Timber"
date:   2015-07-09 15:53:14
author: Santiago Castro
categories: [Android, Logging, Timber, Crashlytics]
author_id: santiago
show: true
category: development
---

It's an annoying problem to have crashes in your Android app. Obviously you want to avoid them, nobody wants their users getting mad at the app when it crashes. On top of that, you might also want to have some information on why the app crashes. Here is where the Android logging system is available to help you with this. So far, so good. However, there are some caveats.

A typical log goes like this:

{% highlight java %}
Log.e(TAG, "A message about something weird");
{% endhighlight %}

For more information you could catch an exception and print its stack trace:

{% highlight java %}
exception.printStackTrace();
{% endhighlight %}

During app development you can notice this easily. But what happens if this occurs in the user's device? You won't realize. And yet worse, it will get logged in the users' devices consuming memory space for a non-existent reader.

Apart from this, what is that `TAG`? You know, it's something that gives you context about the message and it's a common practice to name it after the class you are working on:

{% highlight java %}
private static final String TAG = "SomeClass";
{% endhighlight %}

After all, why do we have to do this? This is boilerplate. You have to add it to each class that you log messages and receive warnings about some of them being unused if any log is removed.

# Crashlytics

[Crashlytics](https://get.fabric.io/crashlytics), part of [Fabric](https://get.fabric.io/), is there for you. Crashes and logged exceptions will be notified to you via email if you decide to use it. More information about the issues is available, like the whole stack trace, Android versions that caused the issue, device models and even more details you want to add.

To setup Crashlytics in your app you have to add this to your `build.gradle`:

    buildscript {
        repositories {
            maven {
                url 'https://maven.fabric.io/public'
            }
        }
        dependencies {
            classpath 'io.fabric.tools:gradle:1.+'
        }
    }

    apply plugin: 'io.fabric'

    repositories {
        maven {
            url 'https://maven.fabric.io/public'
        }
    }

    // ...

    dependencies {
        compile('com.crashlytics.sdk.android:crashlytics:2.+@aar') {
            transitive = true;
        }
    }

This in your Application creation:

{% highlight java %}
Fabric.with(this, new Crashlytics());
{% endhighlight %}

And if you want it to be disabled in debug mode (and I'm sure you want) use this instead:

{% highlight java %}
CrashlyticsCore core = new CrashlyticsCore.Builder()
        .disabled(BuildConfig.DEBUG)
        .build();
Fabric.with(this, new Crashlytics.Builder().core(core).build());
{% endhighlight %}

(thanks [@gonzalomelov](https://github.com/gonzalomelov) for a fix regarding this)

Also be sure that your Android app has internet access permission granted.

By the way, Crashlytics also provides Answers: a service that logs app usage in a daily basis such as daily active users, monthly active users, count of new users, average session duration, among other things.

Crashes are automatically reported. On the other hand, to log caught exceptions you just simple write:

{% highlight java %}
Crashlytics.logException(exception);
{% endhighlight %}

Key-value pairs can be added to the issues before you log them by using:

{% highlight java %}
Crashlytics.setString("key", "value");
{% endhighlight %}

Other data types are accepted too.

So, every time I want to log something, do I have to use the Android Log and Crashlytics? What happens if I want to have more control over what I log in each place? This is when Timber comes into play.

# Timber

[Timber](https://github.com/JakeWharton/timber) is a lightweight library to write logs in different places and control how it's done in a centralized manner. It's easy to add it as a dependency of your Android Studio project:

    compile 'com.jakewharton.timber:timber:3.1.0'

To use Android log only in debug mode you could use something like this code in your Application creation:

{% highlight java %}
@Override
public void onCreate() {
    super.onCreate();

    // ...

    CrashlyticsCore core = new CrashlyticsCore.Builder()
            .disabled(BuildConfig.DEBUG)
            .build();
    Fabric.with(this, new Crashlytics.Builder().core(core).build());

    // ...

    if (BuildConfig.DEBUG) {
        Timber.plant(new Timber.DebugTree());
    }
    Timber.plant(new CrashlyticsTree());
}

public class CrashlyticsTree extends Timber.Tree {
    private static final String CRASHLYTICS_KEY_PRIORITY = "priority";
    private static final String CRASHLYTICS_KEY_TAG = "tag";
    private static final String CRASHLYTICS_KEY_MESSAGE = "message";

    @Override
    protected void log(int priority, @Nullable String tag, @Nullable String message, @Nullable Throwable t) {
        if (priority == Log.VERBOSE || priority == Log.DEBUG || priority == Log.INFO) {
            return;
        }

        Crashlytics.setInt(CRASHLYTICS_KEY_PRIORITY, priority);
        Crashlytics.setString(CRASHLYTICS_KEY_TAG, tag);
        Crashlytics.setString(CRASHLYTICS_KEY_MESSAGE, message);

        if (t == null) {
            Crashlytics.logException(new Exception(message));
        } else {
            Crashlytics.logException(t);
        }
    }
}
{% endhighlight %}

This way we could log only those messages above certain severity. Also some context is added to Crashlytics issues. Remember that Crashlytics is already only in non-debug mode.

To log you just simply:

{% highlight java %}
Timber.e(exception, "Message");
{% endhighlight %}

Or a null message if you want:

{% highlight java %}
Timber.w(exception, null);
{% endhighlight %}

A simple message can be logged, and it'll be sent via Crashlytics too:

{% highlight java %}
Timber.e("A cool message");
{% endhighlight %}

See? There is no `TAG` parameter. It's automagically assigned as the caller class' name by Timber.

This way, the next time a user complains about a crash, you won't have to start blindly on finding the fix for it. With Timber and Crashlytics you will be notified when an issue occurs. You will also have the tag which gives context, its stack trace and any additional information you may want, both in development and also in production! All with a simple log!

So, using Timber and Crashlytics will simply make your life easier when looking for those ugly crashes that keeps you awake at night, and your users happy too!
