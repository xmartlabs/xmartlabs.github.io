---
layout: post
title:  "Making a JS plug-in: a full-stack approach"
date:   2016-08-30 17:00:00
author: Miguel Revetria
tags: [Xmartlabs, JavaScript, Plugin, Widget, CORS, Ruby, Rails, CSS]
author_id: remer
markdown: redcarpet
show: true
category: development
permalink: /:year/:month/:day/:title/
---

In this occasion we will introduce a way to create a client side JavaScript plug-in that can be easily integrated in any third party websites.
This plug-in will allow us to execute custom actions such as filling a registration form or maybe displaying information related with your website.

Since it's all done with JavaScript, we won't care about the stack of the website but we will use and take advantages of native web technologies: HTML, CSS and JavaScript.

Additionally, we are going to show some set up that must be done server side in the case you are using Rails.

## 1. Designing the plug-in

We are going to simplify the plug-in created in order to focus on its design and implementation.
You will be able to reuse the source code and ideas presented here even if you want to do something more complex than this example.

Suppose that our plug-in clients are hair cutting web sites and we want to allow the users of these sites to schedule a hair cutting.
We are going to let the users schedule a haircut from within our plug-in.

We have to take in mind that this client-side plug-in must be compatible with all kind of web applications and browsers in order to be used by all of our possible clients.
For this reason, we will use only pure JavaScript code along with CSS and HTML.
This means, that we won't use any external library in the client since we want to be the less intrusive as possible.

We want to make this plug-in easy to be integrated by client web sites' developers, that's why we will make public the constructor and a few methods and we will keep under the hood all the auxiliary code (internal variables and any detail of the implementation).
We will keep private all the auxiliary code used by the plug-in in order to correctly work, hiding it from developers.

> Global variables and that kind of patterns will be avoided in our code.
Below we have a starting template for our plug-in:

``` javascript
(function() {

  var defaults = {
    clientId: undefined
  }

  /******* Public Methods *******/

  this.Widget = function() {
  }

  Widget.prototype.init = function(options, doc) {
    this.doc = doc || window.document
    this.options = merge(defaults, options)

    if (!this.options.clientId) {
      // Validate options as needed
      console.error("Undefined `clientId`. You must set it before start using Widget");
      return
    }

    // Will create the widget
  }

  /******* Private Methods *******/

  function merge(source, overrides) {
    var property;
    for (property in overrides) {
      if (overrides.hasOwnProperty(property)) {
        if (overrides[property] instanceof Object) {
          source[property] = source[property] || new Object();
          merge(source[property], overrides[property])
        } else {
          source[property] = overrides[property];
        }
      }
    }
    return source;
  }

}());
```

This way all the client code only needs to access to `Widget` function, in order to create an instance of our plug-in and to its `init` function.

We have added defaults options that can be overridden by clients code.
Next code shows you how to add the widget to the client web site, add it within the `body` tag.

```html
<script type="text/javascript">
  var widgetInit = function() {
    widget.init({
      clientId: '7b4a03708a19ed6669ca00f4975a42b3'
    });
  };

  (function(window, document, tag, source, objectName, init) {
    var element = document.createElement(tag);
    element.async = 1;
    element.defer = 'defer';
    element.src = source;
    element.onload = function() {
      window['MyAppWidget'] = objectName;
      window[objectName] = new Widget();
      init();
    };
    var parent = document.getElementsByTagName(tag)[0];
    parent.parentNode.insertBefore(element, parent);
  })(window, document, 'script', '//widget-server-domain/widget/widget.js?client_id=7b4a03708a19ed6669ca00f4975a42b3', 'widget', widgetInit);
</script>
```

> Previous code asynchronously loads the widget's JavaScript.
> A global variable `widget` will be created with our plug-in prototype and the function `widgetInit` will be called immediately after the widget's JavaScript was loaded.
> We recommend to minify all the code, except the `widgetInit` function (like most of the existing SDKs), before adding it in your client's webpage.

Now that we've created the code base for applying the plug-in and we introduced a generic way to load it into any web page, we are going to go deep in our goal by adding some styles and functionalities to our widget.

> Note: we are going to need a CSS file where to place the widget's styles.

```javascript
(function() {

  var defaults = {
    clientId: undefined,
  }

  /******* Public Methods *******/

  this.Widget = function() {
  }

  Widget.prototype.init = function(options, doc) {
    this.doc = doc || window.document
    this.options = merge(defaults, options)

    if (!this.options.clientId) {
      // Validate options as needed
      console.error("Undefined `clientId`. You must set it before start using Widget");
      return
    }

    loadCss(this.doc, this.options);
    createWidgetMarker(this.doc, this.options);
    createWidget(this.doc, this.options);
  }

  /******* Private Methods *******/

  function merge(source, overrides) {
    var property;
    for (property in overrides) {
      if (overrides.hasOwnProperty(property)) {
        if (overrides[property] instanceof Object) {
          source[property] = source[property] || new Object();
          merge(source[property], overrides[property])
        } else {
          source[property] = overrides[property];
        }
      }
    }
    return source;
  }

  function me() {
    // In the code added to the client web page, we have used `MyAppWidget` to store the name of the variable which holds the instance of our plug-in.
    // Next line will return the object stored in the `window` which the stored in the key `MyAppWidget` of `window`.
    return window[window['MyAppWidget']];
  }

  function loadCss(doc, options) {
    // Load widget CSS into the page's head
    var css = me().doc.createElement('style');
    css.href = "<URL to the plug-in's css file>";
    me().doc.getElementsByTagName('head')[0].appendChild(css);
  }

  function createWidgetMarker(doc, options) {
    var widgetMarker = doc.createElement('div');
    widgetMarker.className = 'myapp-widget-marker myapp-widget-hoverable myapp-widget-unselectable';
    widgetMarker.innerHTML = '<div class="myapp-widget-title">Schedule your cute</div>';
    widgetMarker.onclick = toggleWidgetCollapsed;

    customizeMarker(widgetMarker, options);

    doc.getElementsByTagName('body')[0].appendChild(widgetMarker);
  }

  function createWidget(doc, options) {
    var widget = doc.createElement('div');
    widget.className = 'myapp-widget-widget myapp-widget-centered myapp-widget-hidden';
    widget.isCollpased = true;
    widget.onclick = hideWidget;
    widget.onscroll = function(ev) {  ev.stopPropagation(); }
    widget.ontouchmove = function(ev) {
      event.preventDefault();
      e.preventDefault();
    }

    var body = doc.createElement('div');
    body.className = 'myapp-widget-body';
    body.onclick = function(evt) { evt.stopPropagation(); }
    customizeWidgetBody(body, options);

    widget.appendChild(body);

    var bodyContent = doc.createElement('div');
    bodyContent.className = 'myapp-widget-body-container';
    body.appendChild(bodyContent);

    bodyContent.appendChild(createScheduleForm(doc, options));

    doc.getElementsByTagName('body')[0].appendChild(widget);

    me().widget = widget;
  }

  function createScheduleForm(doc, options) {
    var page = doc.createElement('div');
    page.className = 'myapp-widget-container myapp-widget-centered';
    page.innerHTML =
      '<div class="myapp-widget-content">' +
        '<div class="myapp-widget-title">Schedule your hair cute</div>' +
        '<div class="myapp-widget-form">' +
          '<div class="myapp-widget-row">' +
            '<input id="myapp-widget-first-name" type="text" placeholder="First Name" />' +
            '<input id="myapp-widget-last-name" type="text" placeholder="Last Name" />' +
          '</div>' +
          '<div class="myapp-widget-row">' +
            '<input id="myapp-widget-date" type="date" />' +
          '</div>' +
          '<div id="myapp-widget-subscribe-action" class="myapp-widget-action myapp-widget-unselectable">Schedule</div>' +
        '</div>' +
      '</div>';

    var inputs = page.getElementsByTagName('input');
    for (var ind = 0; inputs[ind] != undefined; ind++) {
      customizeInput(inputs[ind]);
    }

    var action = page.getElementsByClassName('myapp-widget-action')[0];
    action.onclick = scheduleButtonClicked;
    customizeAction(action);

    return page;
  }

  function toggleWidgetCollapsed() {
    var widget = me().widget;
    widget.isCollpased ? showWidget() : hideWidget();
  }

  function hideWidget() {
    var widget = me().widget;
    widget.className = 'myapp-widget-widget myapp-widget-centered myapp-widget-hidden';
    widget.isCollpased = true;
    clearWidgetForm();
  }

  function showWidget() {
    var widget = me().widget;
    widget.className = 'myapp-widget-widget myapp-widget-centered myapp-widget-visible';
    widget.isCollpased = false;
  }

  function scheduleButtonClicked() {
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "<URL to the appropriate resource>", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.onreadystatechange = function() {
      if (xhttp.readyState != 4) {
        return
      }

      var responseText = xhttp.responseText;
      try {
        var response = JSON.parse(responseText);
        if (xhttp.status >= 200 && xhttp.status < 300) {
          hideWidget();
        } else {
          var msg = response.error.message
          alert("Oops! Something went wrong. " + response.error.message);
        }
      } catch (error) {
        alert("Oops! Something went wrong, please try again later.");
        console.error(error)
      }
    };

    var params = {
      'client_id': me().options.clientId,
      'schedule': {
        'date': me().doc.getElementById('myapp-widget-date').value,
        'first_name': me().doc.getElementById('myapp-widget-first-name').value,
        'last_name': me().doc.getElementById('myapp-widget-last-name').value
      }
    };
    xhttp.send(JSON.stringify(params));    
  }

  /******* DIY: straightforward functions *******/

  // change marker style properties according to the options passed
  function customizeMarker(marker, options) { }

  // change widget body style properties according to the options passed
  function customizeWidgetBody(body, options) { }

  // change input style properties according to the options passed
  function customizeInput(input, options) { }

  // change action style properties according to the options passed
  function customizeAction(action, options) { }

  // clear form input values
  function clearWidgetForm() { }
}());
```

> To keep this blogpost simple we omitted some implementations and the entire CSS file. Don't worry, these files are in the templates code base in a [repo at GitHub](https://github.com/xmartlabs/javascript-plugin).

## 2. Server Time

Now that we've done our brand new JavaScript plug-in, it's time to handle some concerns in the server side:

### 2.1. Dynamic JavaScript

In some cases you may need to do some minor modifications in the plug-in, based on the client that is currently requiring the widget.
Let's see this with an example: imagine that we allow our clients to modify the widget's positioning and styles dynamically (that way it will be integrated smoothly).

With this information accessible, we need a way to retrieve it depending on the client web site that is requesting our plug-in.
So, you need to add an endpoint to serve the plug-in and remove the static JavaScript file.
Such endpoint will accept a `clientId` parameter included in the request in order to get our plug-in JavaScript customized with the client preferences.

If `clientId` is not present we can return a default JavaScript without any customization.

You can save the plug-in code and the CSS files as a template (ERB, HAML, etc., if you are using Ruby) and use an engine to render them.
The following code will help you to achieve this.

```javascript
// Instead of setting the `href` property of the style element, just add the parse CSS file
// content as its `innerHTML`
var css = me().doc.createElement('style');
// As an example, we are passing an additionally option arguments in order to make some
// modifications to the CSS template file.
css.innerHTML = "<%=j render('widget/widget.css', options: options) %>";
me().doc.getElementsByTagName('head')[0].appendChild(css);
```

> We have embed the CSS result within the script as a HTML `style` element.

### 2.2. Cross Domain Calls

As is expected our plug-in must be accessible from other domains than ours.
If we go deeper, any additionally call made from JavaScript must be accessible from any domains rather than ours.

A way to achieve this is enabling CORS (Cross-origin Resource Sharing) in our backend.

> This can be done just for the necessary resources to make our plug-in works properly.

If you are using Rails like us, you can do it by installing [rack-cors](https://github.com/cyu/rack-cors).

Code below shows an example configuration for `rack-cors`, it should be included in your application config file:

```ruby
module MyApp
  # Application class
  class Application < Rails::Application

    config.middleware.insert_before 0, 'Rack::Cors' do
      allow do
        origins '*'
        resource '/widget/widget.js', headers: :any, methods: [:get, :options]
        resource '/widget/schedule', headers: :any, methods: [:post, :options]
      end
    end

  end
end
```

### 2.3. Identifying Client Web Sites

In the sample code of the widget we have created a form allowing users to schedule a hair cut.
We'd like to be sure that customers registering from the widget are using it from the hair cutting web site and prevent that someone else executes the schedule service from non-allowed domains (remember that we have enabled CORS for the service related to the plug-in).

The best approach to resolve this, it's having a whitelist of the domains that will be allowed to hit your server.

> Remember that a client could have more than one domain from where we should accept requests.

Don't forget to include the `clientId` in the endpoint that will be secured with this approach, because is going to be required to check that the request was made from one of the client's allowed domains

### 2.4. Security

Like everything that is public on internet, it will be tried to be hacked.
Don't worry we know it's not personal but it's something we shouldn't skip.
Additionally we have to keep an eye on naively-written scrapers.

The most common attacks used in the web are **DoS** and **brute force login**, and you don't need any special skill to achieve them… so, everybody is a potential hacker.

We included [rack-attack](https://github.com/kickstarter/rack-attack) in our Ruby backends to protect our public server from evil clients.
You have to define a set of rules that will be checked in each request prior to continue processing it.

So, to protect yourself against **DoS** and **brute force** attacks is recommended to specify a max number of requests in a time window in function of specific parameters from each request.
You can also set a max number of requests by IP or a max number of login attempts with the same username without too much effort.

### 2.5. iframe vs plain HTML

Like every solution, there are always alternatives, each alternative has pros and cons.

Trying to solve this problem, we considered using `iframes`, as you may know, `iframes` are not so popular when you're trying to look like something secure.
Rendering this `iframe` will be managed in our server and this could be the bottleneck of this solution.

Taking this into account is enough to discard the `iframe` solution, even without considering the advantage that the JS file can be hosted in a CDN server.

### 2.6. CSS common issues

As we are adding an external CSS file, there are a few things you should consider:

* **Class name collisions:** you should prevent this by adding a prefix on each class name, something like `myapp-widget-` should be good enough.
You know this is a pain in the butt, so be smart and handle it from the beginning.
* **External styles:** since we are including HTML and CSS in an external web site, it's going to be affected by all the rules that are already present on it.
Something like `* { background: red }` will change your widget's style and that is something you must avoid.
You can add a generic selector in your CSS filtering by the previous prefix, where you will override the appropriate values for CSS properties.
The following code will help you to do it.

  ```css
  *[class^='myapp-widget-'],
  *[class^='myapp-widget-'] * {
    /* Configure some property */
  }
  ```

* **Avoiding a resident evil:** the previous point was about preventing the widget style from being affected by the web site CSS rules, as you know, this is a two way issue, so if you want your clients to use your plug-in you must ensure you don't change anything else in the host.
So, avoid using generic selectors, try to use the most complete path to the components in your widget.

## 3. Conclusions

Now you will be able to create your own client side JavaScript plug-in.
You should know the do's and dont's to make it secure, flexible, non-intrusive, and scalable.

Do you have any comments or tips? Drop us a line below!
