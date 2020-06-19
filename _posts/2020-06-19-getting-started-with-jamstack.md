---
layout: post
title: "New to Jamstack? Everything you need to know to get started"
date: 2020-06-22 10:00:00
tags: [Jamstack, Markup, Static Site Generator, Static Website, web stack, Xmartlabs]
excerpt: "In this blogpost, we cover all you need to get started with Jamstack. From its meaning and best practices to what caused Jamstack's rapid adoption as a web stack alternative."
category: development
author_id: mtnBarreto
show: true
featured_image: /images/jamstack-intro/featured.jpeg
crosspost_to_medium: false
---

Jamstack is a top trend in web development nowadays. Everyone is talking about the modern web development architecture. In this blogpost, I'm gonna cover what caused JAMSTack quick's adoption, how's the JAMStack community and ecosystem, and of course, what does JAMStack mean.

## Jamstack, What does it means?

You may have already worked on a Jamstack site! First of all, it's worth noting that Jamstack has nothing to do with operating systems, specific web servers, backend programming languages, or databases. It's completely agnostic in terms of these concepts.

Jamstack is a modern web stack architecture and ecosystem which delivers better performance, higher security, lower cost of scaling, and better developer experience. When compared with the well-known monolithic web architecture.

What all Jamstack apps have in common is that they do not depend on a monolithic web server, they are serverless. Jamstack is fast emerging as the modern approach to building dynamic serverless applications.

Let's see how people define Jamstack:

According [jamstack.org](https://jamstack.org/)

> Fast and secure sites and apps delivered by pre-rendering files and serving them directly from a CDN, removing the requirement to manage or run web servers.

> Pre-rendered sites can be enhanced with JavaScript and the growing capabilities of browsers and services available via APIs.

Mathias Biilmann, the CEO of Netlify, describes Jamstack as:

> A modern web development architecture based on client-side JavaScript, reusable APIs, and prebuilt Markup.

**JAM**Stack stands for Javascript, APIs and Markup.

**Javascript (J)** running on the browser handles any dynamic programming during the request/response
cycle. Could be any front-end framework (e.g. Vue.js, React.js), js library, or even raw javascript.

**APIs (A)** All server-side actions are encapsulated into microservices, usually managed by a third party. The Javascript code running on the browser consumes these reusable API services through HTTP calls and typically exchanges data in JSON format (instead of HTML).

**Markup/Markdown (M)** A template system engine is used to pre-build the entire static site at deploy time. The main alternatives for this are a static site generator (SSG) for content sites, or a build tool for dynamic web apps (e.g. Gatsby.js). Markdown is a relatively easy markup language to learn, HTML content can be generated from it using a SSG.

The main point behind Jamstack is leveraging the browser and JS capabilities by prebuilding as much content as possible so we can serve it from a CDN. By doing that we are decoupling the front-end from the backend (microservices in this context). Instead of having a monolithic server rendering and serving the resources, this modern web architecture splits these functionalities into small microservices that are consumed from the main app running on a browser. The main app is statically served through CDN nodes. Static refers to how sites are built and served, not the level of interactivity the users have with the site neither how dynamic is the content of the site.

## Why the Jamstack?

Jamstack aims to deliver better performance, higher security, lower cost of scaling, and a better developer experience compared with the well-know monolithic web architecture.

**Better Performance**  
When it comes to minimizing the time to first byte (TTFB), nothing beats pre-built files served over a CDN.
The Jamstack is faster because the browser does tasks that the back-end traditionally executed (e.g. rendering documents on the fly on a server).

**Higher Security**  
With server-side processes abstracted into microservice APIs and the lack of a monolithic server, the surface area for attacks is reduced. Jamstack also leverages the security domain expertise of specialist third-party services.

**Cheaper, Easier Scaling**  
There is no need for a managed monolithic server, DevOps or costly infrastructure to be developed and maintained. When your deployment amounts to a stack of files that can be served anywhere, scaling is a matter of serving those files in more places. CDNs are perfect for this, static content can be placed on a CDN making it easier to dynamically scale.

**Better Developer Experience**  
Jamstack also changes how developers work. They can focus on value-added features since they leverage microservices functionality.
Jamstack encourage a git centric workflow where developers create branches, pull requests and merge these changes into a production branch and a continuous delivery process automatically runs, pre-building the front-end static content and deploying the site to a CDN. So any changes in git will automatically be reflected and distributed to the CDN all over the world.
Developers just need to rely on the git versioning system since deployments are automatically performed saving a lot of time.

Additionally, using a Git repository allows the entire website to be centrally hosted so any developer can run the app locally since there is no need to set up servers, DB, and so on. This greatly simplifies the setup of the development environment and reduces contributor friction.

## Monolithic web stack vs Jamstack

Web stack architecture and ecosystem has been evolving since the very beginning, let's compare the traditional web (monolithic) stack against the Jamstack.


<img src="/images/jamstack-intro/jamstack.jpeg" />


**Monolithic web stack**

The monolithic web architecture is the way we have been creating web apps over the last decade and a half. In its simplest form, each document is created on the fly: a monolithic server receives a request, queries a database and combines the data from the page's markup generating a new HTML document upon an HTTP request (Ruby on Rails, Express, Django/Flask are some web 2.0 frameworks that follow this approach).

Here the browser communicates with a central server which communicates to a DB layer. This approach has caused a lot of security issues since we create almost every document from scratch. It also suffers performance and scalability issues. Normally we end up adding many caching layers, DB caching, memory caching and HTTP caching and so on. We could say that the website needs to build each time it's served (even though caching makes this viable).
_LAMP and MEAN stacks are examples of this architecture._


**Modern web stack**

In contrast to the monolithic web approach, there is no single origin of content, there is no single point of failure. We can also say that the loading time from any part of the world is pretty much the same since the front-end static code is distributed all over the world through the CDN.

<img src="/images/jamstack-intro/JAMStack-diagram.jpg" />

The git centric workflow allows us to host the entire website in its own git repository, also allowing us to pre-build and deploy the front-end static code whenever something is merged into the production branch.
As the diagram shows, the app relies on several microservices to perform server-side functionalities like sending emails or performing a payment flow. Microservices typically solve a specific problem and are highly composable.

## What caused Jamstack fast adoption

In the last years, front-end development ecosystem has changed drastically. Modern browsers, static site generators (SSG), expansive Content Delivery Networks, and the API microservices economy caused the Jamstack’s emergence.

### Git growth

Git has become more popular, not only for version control but also as a way developers collaborate, communicate and publish apps. At the same time, FTP lost many users to it.

<script type="text/javascript" src="https://ssl.gstatic.com/trends_nrtr/2213_RC01/embed_loader.js"></script> <script type="text/javascript"> trends.embed.renderExploreWidget("TIMESERIES", {"comparisonItem":[{"keyword":"/m/05vqwg","geo":"","time":"2010-01-01 2020-06-04"},{"keyword":"/m/0dzxs","geo":"","time":"2010-01-01 2020-06-04"}],"category":0,"property":""}, {"exploreQuery":"date=2010-01-01%202020-06-04&q=%2Fm%2F05vqwg,%2Fm%2F0dzxs","guestPath":"https://trends.google.com:443/trends/embed/"}); </script>

### Browser capabilities & Front-end build tools

Browsers have become really powerful. Nowadays a browser is way more than a document viewer, it's also a JS application runtime. Moreover, the front-end build ecosystem has evolved rapidly based on open-source tools primarily. All these tools completely changed the front-end developers' workflow. Building and compiling stuff is becoming an essential part of the modern web development workflow.

### Microservices economy emerging

And finally, API microservices have become really popular. There are specialized 3rd party services to manage the most common functionality we find in a web app. Web developers started to rely on, combine, and integrate these (instead of building and managing complex software systems). For small and medium-sized systems, they can deliver cost reduction, quality improvement, agility, and decreased time to market. Typically microservices are implemented by a third party company but it can be developed in-house too.

<script type="text/javascript"> trends.embed.renderExploreWidget("TIMESERIES", {"comparisonItem":[{"keyword":"/m/011spz0k","geo":"","time":"2010-01-01 2020-06-04"}],"category":0,"property":""}, {"exploreQuery":"date=2010-01-01%202020-06-04&q=%2Fm%2F011spz0k","guestPath":"https://trends.google.com:443/trends/embed/"}); </script>


## Jamstack Best Practices

As we have seen, this new web architecture stack is possible thanks to the evolution of web developer tools, static site generators, and an emerging microservices economy among others.


When building Jamstack websites, we can really get the most out of the stack if we stick to the following best practices:

**Use CDN to serve your files**

Because Jamstack projects don’t need to rely on server-side code, they can be distributed instead of living on a single server. Serving directly from a CDN unlocks speed and performance improvements that are hard to match. The more of your app you can push to the edge, the better the user experience.

**Modern Build tools**

Ideally, we can also take advantage of modern build tools. By using tools like Babel, PostCSS, Webpack, Gulp/Grunt we are able to use web standards not currently supported in the market-leading browsers. We can also adopt good practices for asset optimization with minimal effort, and automate repetitive and time-consuming tasks.

**Everything lives in git**

Git is fundamental to the Jamstack because it holds all the site’s components, the entire site should be pushed to a git repository. There are publishing platforms that offer CI & CD, and app distribution to CDN services so the site is automatically pre-build and deploy whenever a git remote branch changes. This workflow embodies the modern software development life cycle practice of Continuous Integration and Deployment (CI/CD).
Having the entire site code centralized in git reduces the contribution friction since anyone is able to clone it and execute a command (e.g. npm install) to set up dependencies and run the website locally. There are no databases to clone, no complex installations. This extremely simplifies staging and testing workflows.

**Automated builds**  

Because Jamstack markup is prebuilt, content changes won’t go live until you run another build. Automating this process will save you lots of frustration. You can do this yourself with webhooks, or use a publishing platform that automatically includes this service.

**Atomic deploys**

Any CDN content update must be performed at the same time, despite the app size and the number of files involved. No changes should go live until all changed files have been updated otherwise the state can become inconsistent
 while the update process completes.

**Instant cache invalidation**

Cache-Control values in each file must be properly set up to avoid inconsistent outdated files after deploying a new version to the CDN.


## Jamstack ecosystem resources

At this point you should have enough information on Jamstack to define if it would be useful to your app or not. Now, I would like to share some community tools and useful microservices available to leverage in your app. An important part when creating a Jamstack site is the microservices selection which mostly depend on the app functionality.

[Netlify](https://www.netlify.com/) It's a publishing platform for Jamstack apps. It offers CI & CD and app distribution to CDN.
[Vercel](https://vercel.com/) is an alternative to Netlify.

[staticgen.com](https://www.staticgen.com) lists all SSG alternatives including the frameworks to build a static site with react or vue.js web frameworks.  
[Hugo](https://gohugo.io/) and [Eleventry](https://www.11ty.dev/) seems to me the most interesting SSG. Hugo because is super fast pre-building the entire website markup and Eleventy because is easy to use and flexible in terms of template system language.

[nextjs](https://nextjs.org/) and [gatsbyjs](https://www.gatsbyjs.org/) are popular static site generators for react.js.  
[nuxtjs](https://nuxtjs.org/) and [gridsome](https://gridsome.org/) allows us to generate a static site using vue.js.

In many cases a Jamstack site needs to run code, there are microservices that allows us to do so without provisioning or managing servers.
[AWS Lambda](https://aws.amazon.com/lambda/) is a very popular one. Netlify has Functions which allows to deploy serverless AWS Lambda functions on Netlify just by adding a file to your Git repository.
[Google serverless computing solutions](https://cloud.google.com/serverless-options) and [Microsoft serverless computing solutions](https://azure.microsoft.com/en-us/overview/serverless-computing/) are others serverless compute services out there.

There are also many microservices providing content management system solutions (CMS), each one with its pros and cons. [sanity.io](https://www.sanity.io/), [storyblok](https://www.storyblok.com/), [prismic.io](https://prismic.io/), [contentful](https://www.contentful.com/), [ghost](https://ghost.org/), [netlifycms](https://www.netlifycms.org/) are some of them.

In terms of DB solutions, there are also a big list of them. [faunaDB](https://fauna.com/), [firebase](https://firebase.com/), [Amazon DynamoDB](https://aws.amazon.com/dynamodb/), [Azure Cosmos DB](https://azure.microsoft.com/en-us/services/cosmos-db/), [Amazon Aurora Serverless](https://aws.amazon.com/rds/aurora/serverless/), [Amazon Relational Database Service](https://aws.amazon.com/rds/), [Cloud SQL](https://cloud.google.com/sql/docs/) are some alternatives. By the way, we have collaborated with fauna team to create a swift language client for its DB.  

Services like [Auth0](https://auth0.com/), [Okta](https://www.okta.com/), and [Netlify Identity](https://docs.netlify.com/visitor-access/identity/) offer a cloud-based identity management service.

The microservices list above is not intended to be exhaustive by any means, it's just to give a picture of how mature the microservices industry is.  

## Final thoughts

We have seen that the front-end tooling, static site generators, and microservices ecosystem are mature enough and Jamstack is a reality.
Benefits of adopting a Jamstack architecture are clear, maybe the most interesting question is: Can any site adopt Jamstack?
It depends on the app's complexity. Making a super dynamic site sticks to Jamstack approach could be really hard. In my opinion, every site requires a deep analysis and evaluation of the Jamstack adoption trade-off. Clearly, there are some sites (blogs, corporate websites, CMS among others) more suitable for Jamstack architecture.

Time and community evolution will give us the answers!
API microservices emergence and front-end development tooling will continue getting better and better. Let's see what Jamstack has for us in the years to come!
