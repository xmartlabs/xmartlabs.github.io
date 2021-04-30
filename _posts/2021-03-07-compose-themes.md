---
layout: post
title: Extending Material theme in Jetpack Compose.
date: 2021-03-06 10:00:00
tags: [Android, Jetpack Compose, Material, Themes, Material Theme]
category: development
author_id: mirland
show: true
featured_image: /images/recap2020/look-back-2020-featured.jpg
permalink: /blog/extending-material-theme-in-jetpack-compose/
---
​
If you are a Jetpack Compose user you may already know that one of its advantages is that it's easier to give your app a consistent look & feel by applying themes.
Additionally, Material already provides a theme that allows apps based on Material Design to reflect your own product’s branding and styles.
And that is great, but it oftentimes lacks in that it's a bit too strict and limited on what you can and cannot do with it.
In this post, we'll analyze how to adapt, extend and make Metrial Theme more flexible so that it can stick to your product's style guidelines.
​
# What's an application theme?
The definition is not complex.
Themes are a collection of named resources that are useful all throughout a given application.
More information can be found in [Android's themes documentation], but themes assign semantic names like `colorPrimary` to Android resources, that can be later used as references in different places on the app.
​
Most Android applications already follow (or should be following) [Material Design Guidelines], and that's why Material created `MaterialTheme`.
It's a systematic way to customize Material Design to better reflect your product’s design needs.
Material Theme comprises [color], [typography], and [shape] attributes.
​
​
### Sounds good, but is it perfect?
Material does a great job, but from my point of view, it's too strict.
So, here lies the **first problem**: you have to adapt your look and feel to the Material guidelines, and if you don't, then it becomes hard to use it.
The **second issue** is that Material comprises only [color], [typography], and [shape] attributes, but what if we want to define more resources in a theme, like dimensions or icons?
​
# Extending Material Colors
Compose provides the [`Colors`] class to model the [Material color system].
It's a class that defines the 9 main Material colors, and it also provides two functions to define both the light and dark color sets.
​
In my experience, 9 colors are not enough, as design teams usually define more than that amount of colors in their palette.
For example, a text link color or a subheader background color are common cases that signal the need for more colors.
​
An important comment here is that all of these colors should be defined in your color palette because they could change depending on the system's configuration (light or dark mode) or your app's state.
​
Suppose that we want to define a `subtitleTextColor`, in this case Google recommends a way to do that:
​
```kotlin
@get:Composable
val Colors.subtitleTextColor: Color
    get() = if (isLight) Red300 else Red700
```
​
If you look closely at this code, you can see that the `subtitleTextColor` is only based on Material color's light property.
However, what if we wanted to handle multiple color palettes in the same app, how could we possibly achieve that?
​
The approach we will use is to define a brand new color class named `AppColor`, which will keep Material standard colors and add our own custom ones.
​
```kotlin
@Stable
data class AppColors(
    val subtitleTextColor: Color,
    val materialColors: Colors,
){
 val primary: Color
  get() = materialColors.primary
  // Add other material colors properties
}
```
​
`AppColors` then holds all of the app's colors.
Each application can also define multiple color palettes, often selecting one or another depending on the app's state.
Suppose that we now want to define two color palettes, one based on blue colors and the other based on pink ones:
​
```kotlin
enum class AppColorPalette {
  BLUE,
  PINK,
}
​
// AppCustomColors is private because we shouldn't expose a color that is not in a theme
private object AppCustomColors {
  val PINK_AMARANTH = Color(0xffe91e63)
  val PINK_MAROON = Color(0xffc2185b)
  val PINK_MAUVELOUS = Color(0xfff48fb0)
}
​​
private val darkPinkColors = AppColors(
    linkTextColor = AppCustomColors.PINK_AMARANTH,
    materialColors = darkColors(
        primary = AppCustomColors.PINK_MAUVELOUS,
        primaryVariant = AppCustomColors.PINK_MAROON,
        .... // Material Colors
    )
​
// Define lightPinkColors, darkBlueColors, lightBlueColors the same way
​
@Composable
fun appColors(colorPalette: AppColorPalette, darkTheme: Boolean): AppColors =
    when (colorPalette) {
      AppColorPalette.BLUE -> if (darkTheme) darkBlueColors else lightBlueColors
      AppColorPalette.PINK -> if (darkTheme) darkPinkColors else lightPinkColors
    }
​
```
​
As an additional note, using this approach you may also define blind colors, improving the app's accesibility.
​
Given a color palette and the UI mode, the `appColors` method returns an `AppColors` instance.
The complete implementation of these classes can be found [here].
​
Right now we have a method that provides a `AppColors` palette, but then how can we get the current app color palette?
Material provides a way of obtaining the current Material color palette, by invoking a `composable` method named `MaterialTheme.colors`.
To get our custom color palette, we will use the same idea: we will want to invoke `AppTheme.colors` and get it.
For that we will have to create our app theme, a custom theme that is the result of composing the `MaterialTheme`:
​
```kotlin
object AppTheme {
  val colors: AppColors
    @Composable
    @ReadOnlyComposable
    get() = LocalAppColors.current
}
​
private val LocalAppColors = staticCompositionLocalOf {
  defaultAppColors() // For instance, pink dark colors
}
​
@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    colorPalette: AppColorPalette = AppColorPalette.PINK,
    content: @Composable () -> Unit,
) {
  val colors = appColors(colorPalette = colorPalette, darkTheme = darkTheme)
  CompositionLocalProvider(
      LocalAppColors provides colors,
  ) {
    MaterialTheme(
        colors = colors.materialColors,
        content = content,
    )
  }
}
```
​
These lines define two things, a Composable app theme to handle our custom colors, and static class which provides them.
The full implementation of these classes can be found [here].
​
​
### Extending [shape] and [typography].
​
To extend these classes, we can follow the same idea, we can create a [`AppShapes`] class and a [`AppTypography`] class the same way and declare custom theme properties.
​
I will not explain the code because it's analogue, you can find it on [GitHub] and if you have any questions, don't forget to post a comment!
​
​
# Adding custom resources to your theme
​
In the previous section we learned how to extend the properties provided by Material, but what if we wanted to define new ones?
Remember, a theme is a semantic resource set, so we could also have dimensions, icons or any another resource that will be used in the app.
​
## Defining dimensions in our theme
​
Dimensions are something that I usually define in my theme, as some dimensions like a list item padding, a small size and a container margin, among others, have semanting meanings.
​
We can use a similar approach here and define a dimension class:
​
​
```kotlin
@Immutable
data class AppDims(
    val textSizeSmall: TextUnit,
    val textSizeMedium: TextUnit,
    val textSizeRegular: TextUnit,
​
    val listItemVerticalPadding: Dp,
    val listItemHorizontalPadding: Dp,
)
​
```
​
That's all fine, but you may be asking yourself a small question which is: what are the advantages of actually doing that?
The first one is that your theme will be robust, you can reuse the dimensions in multiple places throughout your app.
The second advantage is that you gain flexibility as you can define custom dimensions based on the device's state or specs.
A practical example could be the dimensions for a small device, where you may have two different sets of dimensions to improve user experience for small devices.
​
```kotlin
@Composable
fun appDims() = if (LocalConfiguration.current.screenWidthDp < 300) {
  smallDeviceAppDims
} else {
  regularAppDims
}
​
​
private val regularAppDims = AppDims(
    textSizeSmall = 12.sp,
    textSizeMedium = 14.sp,
    textSizeRegular = 16.sp,
​
    listItemVerticalPadding = 27.dp,
    listItemHorizontalPadding = 30.dp,
)
​
private val smallDeviceAppDims = AppDims(
    textSizeSmall = 12.sp,
    textSizeMedium = 13.sp,
    textSizeRegular = 14.sp,
​
    listItemVerticalPadding = 15.dp,
    listItemHorizontalPadding = 14.dp,
)
```
​
Then, you have to add the `AppDims` to your `AppTheme` just like we did with the `AppColors` example.
You can check the [final code here].
​
​
# Conclusions
UI/UX is one of the most important things in a mobile app.
Material has some guides to help improve that and it also allows to have consistency with other apps on the same platform.
Themes allow for consistency throughout an application, especially if you define it at the beginning, just by applying minor configurations.
However, we saw that Material theme is not really all that flexible, and if designers don't stick 100% to the their guidelines, you may be in trouble as you may now have a mix of Material and other theme not really related to it.
In this post we presented some ideas to avoid these issues, a way to extend the Material theme while making it flexible, and the most important thing, adaptable to your product.
[The code in this blog should be useful for most applications, but I recommend you check out the full implementation on GitHub], and adapt the general ideas to your specific use case.
​

[Android's themes documentation]: https://developer.android.com/guide/topics/ui/look-and-feel/themes
[Material Design Guidelines]: https://material.io/design/introduction
[color]:https://material.io/design/color/
[typography]: https://material.io/design/typography
[shape]: https://material.io/design/shape/
[`Colors`]: https://developer.android.com/reference/kotlin/androidx/compose/material/Colors
[Material color system]: https://material.io/design/color/
