---
layout: post
title: Extending material theme in Jetpack Compose.
date: 2021-03-06 10:00:00
tags: [Android, Jetpack Compose, Material, Themes]
category: development
author_id: mirland
show: true
featured_image: /images/recap2020/look-back-2020-featured.jpg
permalink: /blog/extending-compose-theme/
---

If you are using Jetpack Compose you may know that it makes it easy to give your app a consistent look and feel by applying themes.
Material provides a theme to customize the Material Design app to reflect your product’s brand style.
It's great, but sometimes Material is a bit limited and strict.
In this post, we'll analyze how to adapt and extend the Material theme to  your product's style guidelines.

# What an application theme is?
The definition is not complex, Themes are a collection of named resources, useful broadly across an app.
More information can be found in [Android's themes documentation], but themes assign semantic names, like `colorPrimary`, to Android resources, and they will be used through the app.

Most Android applications, flow or should follow, [Material Design Guidelines], so Material created the `MaterialTheme`.
It's a systematic way to customize Material Design to better reflect your product’s brand.
A Material Theme comprises [color], [typography], and [shape] attributes.


### The fantastic world is not so fantastic
Material does a great job, but from my point of view, it's too strict.
So, here is the **first problem**, you have to adapt your look and feel to the material guidelines, and if not, it's a bit hard to use it.
The **second issue** is that Material comprises only [color], [typography], and [shape] attributes, but if we check the theme definition, we could want to define more resources in a theme, for example, dimensions or icons.

# Extending Material Colors
Compose provides the [`Colors`] class to model the [Material color system].
It's a class that defines the 9 material colors, and it also provides two functions to define the light and dark colors sets.

In my experience, 9 colors are not enough, the design team defines usually more colors in their palette, for example, a text link color or a subheader background color are common cases that you need to define more colors.

An important comment here is that these colors should be defined in your color palette because they could change depending on your system configuration (light or dark mode) or your app state.

Suppose that we want to define a `subtitleTextColor`, in this case Google recommends a way to do that:

```kotlin
@get:Composable
val Colors.subtitleTextColor: Color
    get() = if (isLight) Red300 else Red700
```

If you take a look at this code, you can see that the `subtitleTextColor` is based only on material color's light property.
However, what about if we want to handle multiple color pallets in the same app, how can I do that?

The approach that we will use is defining a new color class, the `AppColor`, witch will hold the material color.

```kotlin
@Stable
class AppColors(
    val subtitleTextColor: Color,
    val materialColors: Colors,
){
 val primary: Color
  get() = materialColors.primary
  // Add other material colors properties
}
```

`AppColors` holds all app's colors.
Each application can define different color palettes, and choose one of them based on the app state.
Suppose that we define two color palettes, blue and pink colors. 
Moreover, using this approach you can define blind colors improving the accessibility of the app.

```kotlin
enum class AppColorPalette {
  BLUE,
  PINK,
}

// AppCustomColors is private because we shouldn't expose a color that is not in a theme
private object AppCustomColors {
  val PINK_AMARANTH = Color(0xffe91e63)
  val PINK_MAROON = Color(0xffc2185b)
  val PINK_MAUVELOUS = Color(0xfff48fb0)
}


private val darkPinkColors = AppColors(
    linkTextColor = AppCustomColors.PINK_AMARANTH,
    materialColors = darkColors(
        primary = AppCustomColors.PINK_MAUVELOUS,
        primaryVariant = AppCustomColors.PINK_MAROON,
        .... // Material Colors
    )

// Define lightPinkColors, darkBlueColors, lightBlueColors in the same way

@Composable
fun appColors(colorPalette: AppColorPalette, darkTheme: Boolean): AppColors =
    when (colorPalette) {
      AppColorPalette.BLUE -> if (darkTheme) darkBlueColors else lightBlueColors
      AppColorPalette.PINK -> if (darkTheme) darkPinkColors else lightPinkColors
    }

```

Given a color palette and the ui mode, the `appColors` method returns a `AppColors` instance.
The full implementation of these classes can be found [here].

Right now we have a method that provides a `AppColors` palette, but how can we get the current app color palette?
Material provides a way to obtain the current Material color palette, in a `composable` method we have to invoke `MaterialTheme.colors`.
To get our custom color palette, we will use the same idea, we want to invoke `AppTheme.colors` and get it.
For that. we have to create our app theme, a custom theme that is the result of composing the `MaterialTheme`.

```kotlin
object AppTheme {
  val colors: AppColors
    @Composable
    @ReadOnlyComposable
    get() = LocalAppColors.current
}

private val LocalAppColors = staticCompositionLocalOf {
  defaultAppColors() // For instance, pink dark colors
}

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

These lines define two things, a Composable app theme to handle our custom colors, and static class which provide them.
The full implementation of these classes can be found [here].


### Extending [shape] and [typography].

To extend these classes, we can follow the same idea, we can create a [`AppShapes`] and a [`AppTypography`] classes in the same way and declare custom theme properties.

I will not explain the code because it's analog, you can found it on [GitHub] and if you have a question you can post a comment!


# Adding custom resource to your theme

In the previous section we checked how we can extend the properties provided by Material, but what about if we want to define new properties?
Remember, a theme is a semantic resource set, so we could have some dimensions, icons or another resource that will be used in the app.

## Adding custom dimension resources


[Android's themes documentation]: https://developer.android.com/guide/topics/ui/look-and-feel/themes
[Material Design Guidelines]: https://material.io/design/introduction
[color]:https://material.io/design/color/
[typography]: https://material.io/design/typography
[shape]: https://material.io/design/shape/
[`Colors`]: https://developer.android.com/reference/kotlin/androidx/compose/material/Colors
[Material color system]: https://material.io/design/color/