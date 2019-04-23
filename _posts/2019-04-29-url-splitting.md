---
layout: post
title: URL Splitting and React (Part 1)
date: 2019-04-29 09:00:00
author: Matías Lorenzo
categories: React, URL splitting
author_id: mlorenzo
featured_position: 1
featured_image: /images/url-splitting/banner.jpg
---

As devices become more powerful, web apps tend to have heavier client-side logic. In particular, Single Page Applications (SPAs) have become very popular in these past years, with the advent of battle-tested frontend frameworks such as React, Angular or Vue.

These kind of apps aim to reduce the server's load as much as possible, for example, by caching data aggressively and avoiding reloads. Why spend money upgrading your servers when your users have all this unused potential on their top-of-the-line phones and PCs?

## The Problem

Heavier client-side apps are not even close to being a panacea. As code sent to the client grows in size, first-time page loads tend to take longer and longer. This isn't good, but it could be [worse than you think](https://www.thinkwithgoogle.com/marketing-resources/data-measurement/mobile-page-speed-new-industry-benchmarks/).

Caching, compressing and CDNs tend to reduce loading times, but huge code also means parsing and execution times are bigger. At a certain point, pushing more code to the user becomes less and less effective.

Say you have a very big SPA, with 20 distinct pages. Does the user really need all that code? Will the user navigate across all those 20 pages every time they use your app? I'm willing to bet, in most cases, the answer is no. So, if the user only needs a subset of the code at any one time, why not split it? Enter URL splitting.

## URL Splitting

When apps are big, the user will probably navigate on a subset of the app's pages for a while, and then switch to another subset, or close the app. If the app is well designed, this behavior makes a lot of sense: if you're trying to do something, the tools to do it should be on screen, or a minimal amount of clicks away.

URL splitting is the act of splitting an SPA in multiple sub apps, which will be in charge of knowing how to render a subset of the URLs of the app.
If done correctly, it can lower your bundle size significantly, increase your app's performance and allow you to scale your app in the future!

Let's introduce an example: think of an e-commerce app. This app let's users browse products, either by searching manually or looking through a catalog by category. Naturally, users can fill their cart and then proceed to the checkout process, which is fairly complex: users have to specify their address, billing information, select what shipping option they want, and then confirm the purchase. Also, the app has a section of static pages with a lot of information on how the business works, terms and conditions, FAQs, and more.

I'm willing to bet that, if you've ever used an e-commerce app, you probably don't navigate through all the pages every time you use it. Most likely you spend some time looking at products, probably in more than one sitting (buying that sixty inch TV takes convincing), then go through the whole checkout process if you decide to buy. And you probably won't ever visit the static pages unless you are really interested on their business or have a question.

The first thing you need to do when URL splitting is deciding how many sub apps will be created and what subsets of pages they will manage. This part is more art than science, since you'll have to rely on your knowledge of the business and predict how the users will use the app. On this case, it seems logical to split the app in three parts:

- **Products App**: will be in charge of the homepage and any page that shows products, including the detail of a single product.
- **Checkout App**: in charge of authentication-related pages, such as login and register. Also, in charge of the whole checkout process.
- **Static Pages App**: will contain all pages related to information and FAQs.

Here's a crude diagram of how our app would be split, with some examples of the URLs each will be in charge of.

<img width="100%" src="/images/url-splitting/apps-diagram.png">

You may be wondering why we put the login and register page on the Checkout App. Why not split a fourth app with all these pages? Well, you certainly could! But in this case it makes sense that, most of the time, users will log in or register when starting the checkout process. Threading authentication and checkout together seems like a good idea, but to be really sure we'd need to check the analytics of similar businesses.

## Implementation

Before moving on to the implementation, I've gone ahead and created a [repository on Github](https://github.com/mlvieras/url-splitting-and-react) that follows this tutorial. Feel free to check it out if you don't want to do everything from scratch! Also, it might be useful if you get stuck somewhere. I've structured the commits by section, for you to navigate through the changes needed on individual sections.

### Setting Up

Let's take a look at how to implement this. Please note that there are many ways to implement URL splitting on your app, depending on your project setup and what technologies you're using.
In this example we'll take a look at how to do it using React with Webpack as our bundler. To make things easy, we'll start by creating a project with [Create React App](https://github.com/facebook/create-react-app).
If you're following at home, make sure to use [`create-react-app@3.0.0`](https://github.com/facebook/create-react-app/releases/tag/v3.0.0) to get exactly the same output when creating your app.

First, create your new app (you'll need Node >= `8.10.0`):

```bash
npx create-react-app@3.0.0 my-app && cd my-app
```

Then eject the app to get access to all the configuration files. In most cases there is no need to eject the app, but you'll have to this time. I like to do it always (I don't like not knowing what's going on under the hood 😁).

```bash
npm run eject
```

Now that we have our blank canvas to work with, let's get our hands dirty.

### Boilerplate

We'll need a couple of files to get started. First, we'll need three different app entry points. The current one is `src/App.js`. Let's create a `src/apps` directory where to put all our entry points. These files will work as root files that start the corresponding React app. We'll need three since we don't want to mix the code of all three apps, and also you may want to configure some things differently. Think of three separate React apps living in the same repository.

Our first app will be located in `src/apps/products`. The directory structure could be as follows:

```text
/src
  |- /apps
    |- /products
      |- app.js
      |- app.test.js
      |- app.css
      |- index.js
```

What I've done here is simply move the files that were on `src/` and renamed them (we don't use Pascal Case to name component files, but you can do it if you like). We'll have to adapt them down the line, but we'll cross that bridge when we get there.

You should create similar files for the other two apps (`checkout` and `static-pages`). In some cases you might want some configuration to work similarily across apps (for example, the router, debugging components). So what we usually do is create an `AppTemplate` component that serves that purpose, and then simply render that component in each `app.js` file. For simplicity, let's copy the code that's in the initial `App.js` file and paste it in `src/apps/app-template.js`.

```jsx
/* src/apps/app-template.js */
import React, { Component } from 'react';
import logo from './logo.svg';

class AppTemplate extends Component {
  render() {
    return (
      <div className="App">
        <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <p>
            Edit <code>src/App.js</code> and save to reload.
          </p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </header>
      </div>
    );
  }
}

export { AppTemplate };
```

Then, in each of our `app.js` files we'll do something like this:

```jsx
/* src/apps/products/app.js */
import React from 'react';

import { AppTemplate } from '../app-template';
import './app.css';

const App = () => (
  <AppTemplate />
);

export default App;
```

**Note:** I've neglected to show a few updates you'll need to make in other files, but they should be pretty evident (for example updating imports in each of the apps `index.js` files).

This setup will allow you to centralize configuration of code that needs to go on every sub app, while also allowing us to override or add local configuration to a specific app. You can even pass props to `AppTemplate` if you want, to make this approach even more versatile. Right now all our `app.js` files are equal, but as apps grow, they'll start changing and becoming more complex.

If you try to start the project now, it will most certainly crash. That's because we haven't told Webpack we want it to process multiple entry points!

### Webpack Configuration

Take a look at webpack's main configuration file, located in `config/webpack.config.js`. If you don't have experience with Webpack there's a lot to take in (a **lot**), but let's focus on what's important. Take a look at the `entry` key on line 127. To Webpack, entry points are a way of specifying the different bundles you want to create. Each entry point will be processed individually. Therefore, what we want to do is specify three entry points, one for each of our sub apps. `Create React App` centralizes path configuration in a single `paths.js` file. We must edit this file to add information of all our apps. Add this code somewhere on the paths file:

#### Path Configuration

```js
/* config/paths.js */
const apps = {
  CHECKOUT: 'checkout',
  PRODUCTS: 'products',
  STATIC_PAGES: 'static-pages',
};

const appData = Object.values(apps).map((appName) => {
  return {
    js: {
      name: appName,
      path: resolveApp(`src/apps/${appName}/index.js`),
    },
    html: {
      chunks: [ appName ],
      filename: `${appName}.html`,
      template: resolveApp(`public/base-template.html`),
    }
  }
});
```

The idea is to export the configuration for each of our apps on the `appData` object. The `js` key should make sense, as we're specifying the name of the app (`products`) and where its entry point is located (`src/apps/products/index.js`). The `html` key might not make a lot of sense right now, so let's explain.

The `template` key specifies where the base template for the HTML of the app is located. You should already have an `index.html` in your public folder. I'd suggest renaming it to something like `base-template.html` to avoid confusions. The `filename` key specifies what the final name of the HTML should be (`products.html`). The `chunks` key is very important, as it tells Webpack to only include the chunks related to this app (`products.js`, `products.css` and all other assets).

Now, simply export this new object we've made. You can also remove unnecessary exports that were already there, since we won't use them:

```js
/* config/paths.js */
module.exports = {
  dotenv: resolveApp('.env'),
  appData, // <- New
  appPath: resolveApp('.'),
  appBuild: resolveApp('build'),
  appPublic: resolveApp('public'),
  appPackageJson: resolveApp('package.json'),
  appSrc: resolveApp('src'),
  appTsConfig: resolveApp('tsconfig.json'),
  yarnLockFile: resolveApp('yarn.lock'),
  testsSetup: resolveModule(resolveApp, 'src/setupTests'),
  proxySetup: resolveApp('src/setupProxy.js'),
  appNodeModules: resolveApp('node_modules'),
  publicUrl: getPublicUrl(resolveApp('package.json')),
  servedPath: getServedPath(resolveApp('package.json')),
};
```

#### Entry point Configuration

On line 134 of the Webpack configuration file is the `entry` key. We must add our new entry points:

```js
/* config/webpack.config.js */
const entries = {};
paths.appData.forEach((entry) => {
  const entryJs = entry.js;
  entries[entryJs.name] = [
    // Include an alternative client for WebpackDevServer. A client's job is to
    // connect to WebpackDevServer by a socket and get notified about changes.
    // When you save a file, the client will either apply hot updates (in case
    // of CSS changes), or refresh the page (in case of JS changes). When you
    // make a syntax error, this client will display a syntax error overlay.
    // Note: instead of the default WebpackDevServer client, we use a custom one
    // to bring better experience for Create React App users. You can replace
    // the line below with these two lines if you prefer the stock client:
    // require.resolve('webpack-dev-server/client') + '?/',
    // require.resolve('webpack/hot/dev-server'),
    isEnvDevelopment &&
      require.resolve('react-dev-utils/webpackHotDevClient'),
    // Finally, this is your app's code:
    entryJs.path,
    // We include the app code last so that if there is a runtime error during
    // initialization, it doesn't blow up the WebpackDevServer client, and
    // changing JS code would still trigger a refresh.
  ].filter(Boolean);
});

return {
  // ...
  entry: entries,
}
```

#### Output Configuration

Right now, Webpack expects you to only generate one final bundle. We're trying to split our app so this approach won't work. Head to the `output` key on the configuration object and look for the `filename` key inside. In development mode its value is `static/js/bundle.js`. We don't want it to have a static name, since we'll be creating three of them and they'll step on each other. The easy solution is to use Webpack's handy interpolation schemes: simply change the value to `static/js/[name].bundle.js`. This will make Webpack interpolate the name of the bundle in the file, so you'll end up creating three different main bundles.

And *voilà*, Webpack now knows where to look for our JS files and thus define the apps correctly. But there's a final task: configure the HTML Webpack generates for each app. We'll do this on the `plugins` key, creating one instance of `HtmlWebpackPlugin` for each of our apps.

```js
return {
  // ...
  plugins: [
    //...
    ...paths.appData.map(appData => new HtmlWebpackPlugin(Object.assign(
      {},
      appData,
      {
        inject: true,
      },
      isEnvProduction
        ? {
            minify: {
              removeComments: true,
              collapseWhitespace: true,
              removeRedundantAttributes: true,
              useShortDoctype: true,
              removeEmptyAttributes: true,
              removeStyleLinkTypeAttributes: true,
              keepClosingSlash: true,
              minifyJS: true,
              minifyCSS: true,
              minifyURLs: true,
            },
          }
        : undefined
    ))),
  ],
}
```

Remember to maintain the relative order of the plugins. Also, keep in mind that you have to *replace* the instance of HtmlWebpackPlugin that is already being created.

We did it! Now are apps are correctly splitted. Sadly it isn't the end yet, but we're getting closer! The last thing we'll need to do is configure Webpack's development server to serve us the three different apps.

### Rewriting Development Routes

The development server that runs when you start the project in development is biased towards a single-entry-point implementation. We'll need to change a couple of things in order to make URL splitting work here. Essentially, the development server needs to know which app it needs to serve on which URL. We can do so with *rewrites*:

```js
/* config/paths.js */
const appRewrites = [
  { from: /products/, to: `/${apps.PRODUCTS}.html` },
  { from: /checkout/, to: `/${apps.CHECKOUT}.html` },
  { from: /static-pages/, to: `/${apps.STATIC_PAGES}.html` },
  { from: /.*/, to: `/${apps.PRODUCTS}.html` },
];
```

Now simply export `appRewrites` so that we can access it from the configuration file.

Rewrites work with regular expressions, so you won't necessarily need to specify *each* of your app's paths manually. Here I've given a naive example to get you going. It's also reasonable to put a catch-all rule at the end so that the user always gets an app served to them (maybe to show them a not found page).

Now, let's tell Webpack's development server to use these rewrites. The configuration resides in `config/webpackDevServer.config.js`.

```js
/* config/webpackDevServer.config.js */
{
  //...
  historyApiFallback: {
    // Paths with dots should still use the history fallback.
    // See https://github.com/facebook/create-react-app/issues/387.
    disableDotRule: true,
    rewrites: paths.appRewrites, // <--- Add this rule
  }
}
```

Great! Your app now supports URL splitting correctly! Let's do a recap. Stick around for the caveats section, since you'll probably need to do a few more touches here and there to start your development process smoothly.

## Recap

Here's what we've accomplished so far:

- Create individual entry points for our apps.
- Configure Webpack's bundler to support all our apps.
- Configure Webpack's development server to serve different HTML files depending on the URL.

If you try to start the server now, it'll crash. This is because the scripts that are bundled with CreateReactApp's code expect only one Javascript entry points. It should be extremely simple to fix this, simply check the start and build scripts on `scripts/`. Once you start the server, you should be met with something similar to this:

<img width="100%" src="/images/url-splitting/app-base-page.png">

To convince ourselves that our apps are different, we can change the background to different colors. Go to each app's `app.css` file and edit the background color. I've used red, green and blue. Now navigate to `/products`, `/checkout` and `/static-pages` and you should be met by three different background colors. This means our server is serving them correctly!.

## Caveats

### Code Sharing

The whole idea of URL splitting is to avoid serving the user code they probably won't need. On the other hand, we should have a way to share code between our apps, to make everything as DRY as possible. But beware, sharing code between apps can be tricky! Be sure to import only what you'll need on any specific app. You might end up loading every app with code that will never be visited.

Try structuring your code in a way that reusable code is correctly labeled and easy to identify (i.e. global styling files, helpers and generic components). This will make it easier for people who work with your code to know what they're looking at, and give you an idea of how much code you're sharing.

Much like a prepubescent teenager, your apps want to have a personality! If you find yourself sharing *everything* between apps, it might be a sign that you didn't split them in a sensible way. Also, sharing little to no code between them can also be signalling an issue. It's all a matter of balance.

### Service Workers and PWAs

The initial app we created is configured to be a [Progressive Web App](https://developers.google.com/web/progressive-web-apps/) out of the box. This is because it is assumed you'll always have a single bundle, and having your app be a PWA without configuration is sure useful!

The problem is, our app is now *three* different bundles. You can't have a PWA with multiple entry points that don't share all the code. What you can have is three different PWAs scoped by an internal path in your domain. I won't go into detail on how you could achieve this, since it isn't the scope of this article, and I personally don't find it very useful (but it could be for your use case).

If you've followed this blogpost's code to a tee, then probably all your apps' `index.js` file have these lines somewhere:

```js
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
```

This means that our app is not really a PWA yet. We'd need to explicitly enable the service worker on the client's browser by changing that line. So, essentially you're not in trouble if you leave all this code hanging around, but I always like to remove all the evidence to avoid confusing people who are not familiar with the code.

### Production Backend

One of the advantages of SPAs is that the backend that serves them can be as dumb as a second coat of paint. Meaning that, no matter the request, the backend will always serve the matching public file, or the HTML entry points for your SPA.

Sadly, with URL splitting you'll need to make your backend a little smarter. Much like we did with Webpack's development server, you'll need to specify what HTML file to serve on which URLs. This can be done extremely quickly using an Express backend (which is what I do).

### Frontend Routing

If you have experience with SPA's with React, you've probably used React Router to solve your routing needs. The issue is, React Router will solve routing *inside* each of your apps, but not *between* them. Perfect time to sell my next blog post!

Jokes aside, this is a somewhat deep topic, so I've decided to split it. Check out part two when it releases!

## Afterword

Yes, I know, configuring URL splitting is quite horrible, and you certainly shouldn't go through the hassle of doing it **unless** you really need it. Think of it as another tool in your toolbelt. And, believe me, I've run into mind-boggling issues while configuring the project myself. But in the end, it's a one-time thing that will help you get a more stable, more performant app in the end. And every time you configure it it gets easier.

So don't be afraid if you don't understand everything that's going on. With time, you will. And if there's something that wasn't clear, feel free to leave a comment or an issue on the repo! I'm always open for feedback.

Cheers!
