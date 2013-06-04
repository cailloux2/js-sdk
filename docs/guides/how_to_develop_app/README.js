Ext.data.JsonP.how_to_develop_app({
  "guide": "<h1>How to develop an application</h1>\n<div class='toc'>\n<p><strong>Contents</strong></p>\n<ol>\n<li><a href='#!/guide/how_to_develop_app-section-1'>Overview</a></li>\n<li><a href='#!/guide/how_to_develop_app-section-2'>Introduction</a></li>\n<li><a href='#!/guide/how_to_develop_app-section-3'>Creating the Application skeleton</a></li>\n<li><a href='#!/guide/how_to_develop_app-section-4'>Application configuration</a></li>\n<li><a href='#!/guide/how_to_develop_app-section-5'>Application template</a></li>\n<li><a href='#!/guide/how_to_develop_app-section-6'>Adding renderers</a></li>\n<li><a href='#!/guide/how_to_develop_app-section-7'>CSS rules</a></li>\n<li><a href='#!/guide/how_to_develop_app-section-8'>Dependencies</a></li>\n<li><a href='#!/guide/how_to_develop_app-section-9'>Events</a></li>\n<li><a href='#!/guide/how_to_develop_app-section-10'>Application installation</a></li>\n<li><a href='#!/guide/how_to_develop_app-section-11'>Complete application source code</a></li>\n</ol>\n</div>\n\n<h2 id='how_to_develop_app-section-1'>Overview</h2>\n\n<p>The Echo JS SDK allows you to create complex applications based on the <a href=\"#!/api/Echo.App\" rel=\"Echo.App\" class=\"docClass\">Echo.App</a> class. This page will guide you through the process of developing an app using the SDK. For examples of existing apps visit the <a href=\"#!/example\">Examples Page</a>.</p>\n\n<h2 id='how_to_develop_app-section-2'>Introduction</h2>\n\n<p><em>Application</em> (or <em>App</em>) is an object with a predefined structure which encapsulates a given set of business logic, Echo Controls and Echo Plugins as a discrete, end-to-end single user experience.</p>\n\n<p>Let's imagine that we want to create the application for posting and viewing comments on a website. For this purpose we'll use the <a href=\"#!/api/Echo.StreamServer.Controls.Stream\" rel=\"Echo.StreamServer.Controls.Stream\" class=\"docClass\">Stream</a> and the <a href=\"#!/api/Echo.StreamServer.Controls.Submit\" rel=\"Echo.StreamServer.Controls.Submit\" class=\"docClass\">Submit</a> controls and assemble them in one logical unit using the Echo Application approach.</p>\n\n<h2 id='how_to_develop_app-section-3'>Creating the Application skeleton</h2>\n\n<p>First of all, let's prepare the JavaScript closure to allocate a separate namespace for our applications's code. This step is common for all plugins, controls and apps built on top of the JS SDK. You can find the detailed information on how to create the JS closure in the <a href=\"#!/guide/terminology-section-3\">\"Terminology and dev tips\"</a> guide. So we have the following code as a starting point:</p>\n\n<pre><code>(function(jQuery) {\n\"use strict\";\n\nvar $ = jQuery;\n\n// component code goes here\n\n})(Echo.jQuery);\n</code></pre>\n\n<p>Now let's add the application definition. Echo JS SDK contains a special <a href=\"#!/api/Echo.App\" rel=\"Echo.App\" class=\"docClass\">Echo.App</a> class to facilitate the application creation, we'll use some functions to add the application definition:</p>\n\n<pre><code>(function(jQuery) {\n\"use strict\";\n\nvar $ = jQuery;\n\nvar Comments = <a href=\"#!/api/Echo.App-static-method-manifest\" rel=\"Echo.App-static-method-manifest\" class=\"docClass\">Echo.App.manifest</a>(\"Echo.Apps.CommentsSample\");\n\nif (<a href=\"#!/api/Echo.App-static-method-isDefined\" rel=\"Echo.App-static-method-isDefined\" class=\"docClass\">Echo.App.isDefined</a>(\"Echo.Apps.CommentsSample\")) return;\n\n<a href=\"#!/api/Echo.App-static-method-create\" rel=\"Echo.App-static-method-create\" class=\"docClass\">Echo.App.create</a>(Comments);\n\n})(Echo.jQuery);\n</code></pre>\n\n<p>We've called the <a href=\"#!/api/Echo.App-static-method-manifest\" rel=\"Echo.App-static-method-manifest\" class=\"docClass\">Echo.App.manifest</a> function and passed the name of the application as an argument. We checked whether the application was already initialized or not, to avoid multiple application re-definitions in case the application script was included into the application source several times. After that we passed the manifest into the <a href=\"#!/api/Echo.App-static-method-create\" rel=\"Echo.App-static-method-create\" class=\"docClass\">Echo.App.create</a> function to generate the application JS class out of the static declaration.</p>\n\n<p>At that point we can consider the application skeleton ready and start adding the business logic into it.</p>\n\n<h2 id='how_to_develop_app-section-4'>Application configuration</h2>\n\n<p>Let's assume that we need a configuration parameter for our application to define the position of the submit form (before or after the Stream control). Also we want to define a default value of the parameter in case it is omitted in the application configuration while installing it into a website. In order to do it we add the \"config\" object to the application manifest with the name of the config field as a key and a default as its value, so the code of the application will look like:</p>\n\n<pre><code>(function(jQuery) {\n\"use strict\";\n\nvar $ = jQuery;\n\nvar Comments = <a href=\"#!/api/Echo.App-static-method-manifest\" rel=\"Echo.App-static-method-manifest\" class=\"docClass\">Echo.App.manifest</a>(\"Echo.Apps.CommentsSample\");\n\nif (<a href=\"#!/api/Echo.App-static-method-isDefined\" rel=\"Echo.App-static-method-isDefined\" class=\"docClass\">Echo.App.isDefined</a>(\"Echo.Apps.CommentsSample\")) return;\n\nComments.config = {\n    \"submitFormPosition\": \"top\" // top | bottom\n};\n\n<a href=\"#!/api/Echo.App-static-method-create\" rel=\"Echo.App-static-method-create\" class=\"docClass\">Echo.App.create</a>(Comments);\n\n})(Echo.jQuery);\n</code></pre>\n\n<p>If we need more options in future, they can be appended as additional fields into the \"config\" hash.</p>\n\n<p>Now everywhere in the application's code we'll be able to use the following call:</p>\n\n<pre><code>this.config.get(\"submitFormPosition\"); // assuming that \"this\" points to the application instance\n</code></pre>\n\n<p>to get the value of the \"submitFormPosition\" config parameter defined during the app installation or to access the default value otherwise. Note: the \"this\" var should point to the application instance.</p>\n\n<h2 id='how_to_develop_app-section-5'>Application template</h2>\n\n<p>Ok, now it's time to create the application UI.</p>\n\n<p>The first steps is to prepare a template to represent the application UI. Due to the fact that the template of our application depends on the configuration of the application, we'll create two templates and will dynamically choose which one to use. The templates might look like:</p>\n\n<pre><code>Comments.templates.topSubmitFormPosition =\n    '&lt;div class=\"{class:container}\"&gt;' +\n        '&lt;div class=\"{class:submit}\"&gt;&lt;/div&gt;' +\n        '&lt;div class=\"{class:stream}\"&gt;&lt;/div&gt;' +\n    '&lt;/div&gt;';\n\nComments.templates.bottomSubmitFormPosition =\n    '&lt;div class=\"{class:container}\"&gt;' +\n        '&lt;div class=\"{class:stream}\"&gt;&lt;/div&gt;' +\n        '&lt;div class=\"{class:submit}\"&gt;&lt;/div&gt;' +\n    '&lt;/div&gt;';\n\nComments.methods.template = function() {\n    return this.templates[\n        this.config.get(\"submitFormPosition\") + \"SubmitFormPosition\"\n    ];\n};\n</code></pre>\n\n<p>Important note: as you can see, the templates contains the placeholders such as: \"{class:container}\", \"{class:auth}\" etc. These placeholders will be processed by the templating engine before the template is inserted into a page. You can find the general description of the rendering engine in the <a href=\"#!/guide/terminology\">\"Terminology and dev tips\"</a> guide.</p>\n\n<p>If your application requires only one template, you can define it as \"main\" in the \"templates\" object as shown below:</p>\n\n<pre><code>Comments.templates.main = '&lt;div class=\"{class:container}\"&gt;&lt;/div&gt;';\n</code></pre>\n\n<p>Note: the template might be also represented by the function. In this case the function will be called within the application context (i.e. \"this\" will point to the current application instance).</p>\n\n<h2 id='how_to_develop_app-section-6'>Adding renderers</h2>\n\n<p>Now we have placeholders for our Submit and Stream controls and we need the logic to init the necessary applications in the right places and we'll employ renderers here. Application manifest specifies the location for the renderers, it's the \"renderers\" hash. This hash should contain the renderers for the elements added within the app templates. The set of renderers to initialize the controls may look like:</p>\n\n<pre><code>Comments.renderers.stream = function(element) {\n    this.initComponent({\n        \"id\": \"Stream\",\n        \"component\": \"<a href=\"#!/api/Echo.StreamServer.Controls.Stream\" rel=\"Echo.StreamServer.Controls.Stream\" class=\"docClass\">Echo.StreamServer.Controls.Stream</a>\",\n        \"config\": {\n            \"target\": element\n        }\n    });\n    return element;\n};\n\nComments.renderers.submit = function(element) {\n    this.initComponent({\n        \"id\": \"Submit\",\n        \"component\": \"<a href=\"#!/api/Echo.StreamServer.Controls.Submit\" rel=\"Echo.StreamServer.Controls.Submit\" class=\"docClass\">Echo.StreamServer.Controls.Submit</a>\",\n        \"config\": {\n            \"target\": element,\n            \"infoMessages\": {\"enabled\": false},\n            \"plugins\": [{\n                \"name\": \"FormAuth\",\n                \"identityManager\": \"{config:identityManager}\"\n            }]\n        }\n    });\n    return element;\n};\n</code></pre>\n\n<p>Important note: to proxy the configuration settings from the application to the child controls we can use placeholders, like the ones we used in the application templates. In our application we proxythe \"identityManager\" as a param of the <a href=\"#!/api/Echo.IdentityServer.Controls.Auth\" rel=\"Echo.IdentityServer.Controls.Auth\" class=\"docClass\">Echo.IdentityServer.Controls.Auth</a> control config by defining the \"{config:identityManager}\" placeholder.</p>\n\n<h2 id='how_to_develop_app-section-7'>CSS rules</h2>\n\n<p>To make the UI look nice, we should add some CSS rules. There is a special placeholder for the CSS rules in the application definition. The field is called \"css\". The value of this field is a CSS string. Here are CSS rules for our application:</p>\n\n<pre><code>Comments.css = \".{class:container} &gt; div { margin-bottom: 7px; }\";\n</code></pre>\n\n<h2 id='how_to_develop_app-section-8'>Dependencies</h2>\n\n<p>If the application depends on some other external component/library (including other Echo components), it's possible to define the dependencies list for the application. In this case the SDK engine will download the dependencies first and launch the application after that. The dependency is an object with the \"url\" and one of the \"control\", \"plugin\", \"app\" or \"loaded\" fields. In the \"control\", \"plugin\", \"app\" fields you should specify the component name. If the component you have specified is not loaded yet, resource you have specified in the \"url\" will be downloaded. If you need to specify more complex conditions to load resource, you can use the \"loaded\" field instead. The \"loaded\" field should be defined as a function which returns 'true' or 'false' and indicate whether the resource should be downloaded or not. Example:</p>\n\n<pre><code>Comments.dependencies = [{\n    \"loaded\": function() {\n        return <a href=\"#!/api/Echo.Control-static-method-isDefined\" rel=\"Echo.Control-static-method-isDefined\" class=\"docClass\">Echo.Control.isDefined</a>(\"<a href=\"#!/api/Echo.StreamServer.Controls.Submit\" rel=\"Echo.StreamServer.Controls.Submit\" class=\"docClass\">Echo.StreamServer.Controls.Submit</a>\") &amp;&amp;\n            <a href=\"#!/api/Echo.Control-static-method-isDefined\" rel=\"Echo.Control-static-method-isDefined\" class=\"docClass\">Echo.Control.isDefined</a>(\"<a href=\"#!/api/Echo.StreamServer.Controls.Stream\" rel=\"Echo.StreamServer.Controls.Stream\" class=\"docClass\">Echo.StreamServer.Controls.Stream</a>\");\n    },\n    \"url\": \"{config:cdnBaseURL.sdk}/streamserver.pack.js\"\n}];\n</code></pre>\n\n<h2 id='how_to_develop_app-section-9'>Events</h2>\n\n<p>Another important aspect is events.</p>\n\n<p>Each Echo component is an independent part of the system and can communicate with each other on subscribe-publish basis. One application can subscribe to the expected event and the other application can publish it and the event data will be delivered to the subscribed applications. This model is very similar to the DOM events model when you can add event listener and perform some actions when a certain event is fired. All the events are powered by the <a href=\"#!/api/Echo.Events\" rel=\"Echo.Events\" class=\"docClass\">Echo.Events</a> library.</p>\n\n<p>There are lots of events going on during the application and control life. The list of the events for each component can be found on the respective page in the documentation. The application definition structure provides the interface to subscribe to the necessary events. The events subscriptions should be defined inside the \"events\" hash using the event name as a key and the event handler as a value, for example:</p>\n\n<pre><code>Comments.events = {\n    \"<a href=\"#!/api/Echo.StreamServer.Controls.Stream-echo_event-onDataReceive\" rel=\"Echo.StreamServer.Controls.Stream-echo_event-onDataReceive\" class=\"docClass\">Echo.StreamServer.Controls.Stream.onDataReceive</a>\": function(topic, args) {\n        // ... some actions ...\n    }\n};\n</code></pre>\n\n<h2 id='how_to_develop_app-section-10'>Application installation</h2>\n\n<p>In order to install the application into a page, the following steps should be taken:</p>\n\n<ul>\n<li><p>the application script should be delivered to the client side (for example, using the &lt;script&gt; tag inclusion)</p></li>\n<li><p>the application should be added into the page, for example as shown below:</p></li>\n</ul>\n\n\n<p>&nbsp;</p>\n\n<pre><code>new Echo.Apps.CommentsSample({\n    \"target\": document.getElementById(\"comments-sample\"),\n    \"appkey\": \"test.aboutecho.com\",\n    \"components\": {\n        \"Stream\": {\n            \"query\": \"childrenof:http://echosandbox.com/test/comments-sampler-test children:0 itemsPerPage:10\",\n            \"plugins\": [{\n                \"name\": \"Edit\"\n            }, {\n                \"name\": \"Like\"\n            }, {\n                \"name\": \"Moderation\"\n            }, {\n                \"name\": \"StreamSortingSelector\"\n            }]\n        },\n        \"Submit\": {\n            \"targetURL\": \"http://echosandbox.com/test/comments-sampler-test\"\n        }\n    },\n    \"identityManager\": {\n        \"login\": {\n            \"width\": 400,\n                    \"height\": 250,\n                    \"url\": \"https://echo.rpxnow.com/openid/embed?flags=stay_in_window,no_immediate&amp;token_url=http%3A%2F%2Fechoenabled.com%2Fapps%2Fjanrain%2Fwaiting.html&amp;bp_channel=\"\n        },\n        \"signup\": {\n            \"width\": 400,\n                    \"height\": 250,\n                    \"url\": \"https://echo.rpxnow.com/openid/embed?flags=stay_in_window,no_immediate&amp;token_url=http%3A%2F%2Fechoenabled.com%2Fapps%2Fjanrain%2Fwaiting.html&amp;bp_channel=\"\n        }\n    },\n    \"submitFormPosition\": \"bottom\"\n});\n</code></pre>\n\n<p>Note: in order to configure internal Echo Controls and Plugins used in the application, the \"components\" field (with the JS object as a value) can be added into the application config. The keys of the \"components\" field value are the internal names of the controls, in our case: \"Stream\" and \"Submit\". These names are assigned within the application definition while the \"initComponent\" function is called.  Also we set the \"submitFormPosition\" and the \"identityManager\" keys to define the location of the Submit form and the configuration of the identity manager feature.</p>\n\n<h2 id='how_to_develop_app-section-11'>Complete application source code</h2>\n\n<pre><code>(function(jQuery) {\n\"use strict\";\n\nvar $ = jQuery;\n\nvar Comments = <a href=\"#!/api/Echo.App-static-method-manifest\" rel=\"Echo.App-static-method-manifest\" class=\"docClass\">Echo.App.manifest</a>(\"Echo.Apps.CommentsSample\");\n\nif (<a href=\"#!/api/Echo.App-static-method-isDefined\" rel=\"Echo.App-static-method-isDefined\" class=\"docClass\">Echo.App.isDefined</a>(\"Echo.Apps.CommentsSample\")) return;\n\nComments.dependencies = [\n    {\"loaded\": function() {\n        return <a href=\"#!/api/Echo.Control-static-method-isDefined\" rel=\"Echo.Control-static-method-isDefined\" class=\"docClass\">Echo.Control.isDefined</a>(\"<a href=\"#!/api/Echo.StreamServer.Controls.Submit\" rel=\"Echo.StreamServer.Controls.Submit\" class=\"docClass\">Echo.StreamServer.Controls.Submit</a>\") &amp;&amp;\n            <a href=\"#!/api/Echo.Control-static-method-isDefined\" rel=\"Echo.Control-static-method-isDefined\" class=\"docClass\">Echo.Control.isDefined</a>(\"<a href=\"#!/api/Echo.StreamServer.Controls.Stream\" rel=\"Echo.StreamServer.Controls.Stream\" class=\"docClass\">Echo.StreamServer.Controls.Stream</a>\");\n    }, \"url\": \"{config:cdnBaseURL.sdk}/streamserver.pack.js\"}\n];\n\nComments.config = {\n    \"submitFormPosition\": \"top\" // top | bottom\n};\n\nComments.templates.topSubmitFormPosition =\n    '&lt;div class=\"{class:container}\"&gt;' +\n        '&lt;div class=\"{class:submit}\"&gt;&lt;/div&gt;' +\n        '&lt;div class=\"{class:stream}\"&gt;&lt;/div&gt;' +\n    '&lt;/div&gt;';\n\nComments.templates.bottomSubmitFormPosition =\n    '&lt;div class=\"{class:container}\"&gt;' +\n        '&lt;div class=\"{class:stream}\"&gt;&lt;/div&gt;' +\n        '&lt;div class=\"{class:submit}\"&gt;&lt;/div&gt;' +\n    '&lt;/div&gt;';\n\nComments.methods.template = function() {\n    return this.templates[\n        this.config.get(\"submitFormPosition\") + \"SubmitFormPosition\"\n    ];\n};\n\nComments.renderers.stream = function(element) {\n    this.initComponent({\n        \"id\": \"Stream\",\n        \"component\": \"<a href=\"#!/api/Echo.StreamServer.Controls.Stream\" rel=\"Echo.StreamServer.Controls.Stream\" class=\"docClass\">Echo.StreamServer.Controls.Stream</a>\",\n        \"config\": {\n            \"target\": element\n        }\n    });\n    return element;\n};\n\nComments.renderers.submit = function(element) {\n    this.initComponent({\n        \"id\": \"Submit\",\n        \"component\": \"<a href=\"#!/api/Echo.StreamServer.Controls.Submit\" rel=\"Echo.StreamServer.Controls.Submit\" class=\"docClass\">Echo.StreamServer.Controls.Submit</a>\",\n        \"config\": {\n            \"target\": element,\n            \"infoMessages\": {\"enabled\": false},\n            \"plugins\": [{\n                \"name\": \"FormAuth\",\n                \"identityManager\": \"{config:identityManager}\"\n            }]\n        }\n    });\n    return element;\n};\n\nComments.css = \".{class:container} &gt; div { margin-bottom: 7px; }\";\n\n<a href=\"#!/api/Echo.App-static-method-create\" rel=\"Echo.App-static-method-create\" class=\"docClass\">Echo.App.create</a>(Comments);\n\n})(Echo.jQuery);\n</code></pre>\n",
  "title": "How to develop an App"
});