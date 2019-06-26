---
layout: post
title: URL Splitting and React (Part 2)
date: 2019-06-22 09:00:00
author: Matías Lorenzo
categories: React, URL splitting
author_id: mlorenzo
featured_position: 1
featured_image: /images/url-splitting/banner.jpg
---

Welcome to part two of URL splitting in React.
If you haven't already, please read [part one](/2019/04/29/url-splitting) (or don't, I'm not your boss).
Both this post and the previous one have a companion [Github project](https://github.com/mlvieras/url-splitting-and-react) that you should check out if you need some help or want to experiment without following the tutorial step by step.

Remember we were working with an e-commerce app and we decided to split the app in three parts semantically.
The products app is in charge of rendering the home page and any page that shows information of products or lists of products.
The checkout app is in charge of the authentication pages and the whole checkout process.
The static pages app is in charge of all information-related pages (FAQs, company contact information, etc).
Here's the global diagram:

<img width="100%" src="/images/url-splitting/apps-diagram.png">

Let's recap what was done last time:

- We created a project using [Create React App](https://github.com/facebook/create-react-app) and then ejected it.
- Our single SPA was split in multiple SPAs.
- Webpack was configured to support our new entry points.
- We did some clean up and clarified some caveats.

But we never talked about how this setup could affect routing on the frontend!
This post is just about that.

## Single SPA Routing

Let's take a look at how routing in a single SPA could be implemented.

There are different ways to tackle this problem.
Create React App remains unopinionated in this regard, but I think the most common alternative is [React Router](https://github.com/ReactTraining/react-router).
This library is great at what it does: providing a framework to help you create virtual pages on your SPA.
Throughout this tutorial we're going to use React Router and expand on it to implement routing on our URL-split app.
Do you use other routing frameworks? Do you implement routing yourself? This post might still be useful!
You'll probably need to adjust a few things here and there, but I think the general idea is agnostic to the routing framework.

React Router provides some components that are very useful, namely `Link` and `Redirect`.
Links will trigger a route change when clicked, and Redirects will trigger a route change instantly when rendered.

The catch here is that these components only provide routing *inside* the SPA.
They will always push to the history API and the router will attempt to render the first route that matches whichever path they routed to.
If no route exists, the router will render nothing.
So, essentially, no actions triggered by one of these components will result in an *actual* page change (i.e. make a request to some backend to get the HTML of the next page).

If we have multiple, disjointed SPAs, we'll have to trigger a page change sometimes to load the SPA we need.

## The Plot Thickens

OK, so when in the products SPA, if we want to route the user to a certain page on the checkout SPA, we simply render a good old anchor (`<a>`).
If we want to route inside the products app, we render a React Router `Link`.
Redirection works similarly, we can create a `RedirectOut` component that simply changes the location of the page to the path we want to go to, and we alternate between `Redirect` and this new component to route inside or outside of the current SPA.

This approach seems quite good, but let me burst your bubble with a simple example.
Say we have a footer.
Say the footer has links to the home page, the login page and all static pages (which is not rare at all).
The footer will most likely make an appearance on most of the pages of our app.
If the footer is shown on a page on the products app, it should know which types of links to render (Router Links or anchors); but if it's rendered on a page that belongs to the static pages app, it should render the links correctly again.

A naive solution to this is to pass a prop to the footer to let it know on which app it is being rendered.
This strategy doesn't scale when you think about how many components with links you'll reuse across apps.
Also, why should components need to know on which app they're being rendered? Shouldn't links have that responsibility? *They* are the ones doing the routing, after all.

## One Link to Rule Them All

The solution is to make our Links and Redirects *aware* of the app they're being rendered on.
This is harder than it sounds, so let's go through this incrementally by working with the example we used last time.
Our objective is simple: create components that aid us when routing inside and outside our SPAs.
These components should know exactly what to do, regardless of which app renders them.

First of all, we need to add some new pages to our apps!

### New Pages

On the products app, we'll add these pages:

- Home page (`/`)
- Product detail page (`/products/:id`)
- Search page (`/search`)

On the checkout app:

- Login page (`/login`)
- Register page (`/register`)
- Cart page (`/cart`)

On the static pages app:

- About us page (`/about-us`)
- Contact us page (`/contact-us`)

Note that we won't be adding any real logic to these pages. We only need to have a simple routing scenario to test out our implementation. Let's begin

### Setup

#### Install the Router

We'll need the web version of the router. We'll be using version `5.0.1`.

```bash
npm install react-router-dom@5.0.1
```

#### Directory structure

All of our app's pages will be located in a `pages` directory inside `src`.
Even though each of them will belong to a sub app, I find it easier to navigate my code if I have all the pages centralized.
Also, you might reuse a page across multiple sub apps (the not found or error page, for example).
You're free to organize your code as you see fit though 😃.

So our `src` directory will look similar to this:

```text
/src
  |- /apps
  |- /pages
    |- /home
    |- /login
    |- /register
    ...
```

#### Create Page Components

Each of our app's pages will be its own React component.
For the purposes of this experiment we'll only need a way to tell which page has been rendered, so a simple title on screen will suffice for each one.
I won't share the code of each page, since they are all pretty much the same.
Let's check out how the Home page looks like.
Create a `home.jsx` file on the `home` directory like this:

```jsx
import React from 'react';

const Home = () => (
  <div>
    <h1>
      HOME
    </h1>
  </div>
);

export { Home };
```

And to make importing easier, create an `index.js` file on the same directory:

```js
import { Home } from './home';

export { Home };
```

I usually create two files instead of adding all the code to the index file to make file search easier in the future.
Now, for each page create files similar to these ones and you're set!
(Remember you can clone the project on Github to avoid doing all the work).
Our base framework is set, now where do we begin?
Let's start by defining our routes and apps somewhere.

### Routing
