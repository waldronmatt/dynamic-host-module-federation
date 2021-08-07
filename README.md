<a href="https://user-images.githubusercontent.com/15273233/93658796-e2797000-fa92-11ea-8226-bf1e528251c5.png"><img width="100%" height="100%" src="https://user-images.githubusercontent.com/15273233/93658796-e2797000-fa92-11ea-8226-bf1e528251c5.png"></a>

# Dynamic Module Federation (Host App)

An environment-agnostic, federated host that consumes remote applications dynamically.

## Introduction

This stand-alone application dynamically consumes (hosts) the portion of the remote app that is exposed at runtime.

## Features

- Supports a multi-environment setup (`dev`, `testing`, `stage`, etc.)
- Eliminate hard-coded URLs from your code and build tooling
- Connect to remote containers and negotiate libraries dynamically
- Supports remote container lazy-loading, chunk splitting, asset cache-busting, and Webpack merge support

## Installation

Install dependencies:

        npm install

## Usage

Run dev environment:

        npm run dev

Navigate to local server:

**[http://localhost:8000](http://localhost:8000)**

## Notes

**Run this project alongside [the remote app](https://github.com/waldronmatt/dynamic-remote-module-federation)**.

## Guide - An Approach to Module Federation for Enterprise

This guide presents an approach for supporting a fully dynamic, multi-environment Module Federation configuration.

If you are part of an organization that has the following requirements, this guide may be of interest:

- Multiple development environments (`local`, `dev`, `staging`, `prod`, etc.)
- Multiple applications shared across multiple domains (URLs)

The final code can be found in the [dynamic-host-module-federation](https://github.com/waldronmatt/dynamic-host-module-federation) boilerplate repository; free to use under the `MIT` license.

## Introduction

### Advantages

Module Federation is an exciting new addition to Webpack 5. As described by its creator Zack Jackson:

> Module Federation allows a JavaScript application to dynamically load code from another application and  in the process, share dependencies.

This powerful orchestration micro-frontend architecture will make it easier for organizations to decouple their applications and share across teams.

### Limitations

Despite Module Federation's advantages, we can see limitations when applying this to organizations with more complex environment requirements.

Let's look at the following example:

`webpack.dev.js`

```js
new ModuleFederationPlugin({
  remotes: {
    FormApp: "FormApp@http://localhost:9000/remoteEntry.js",
    Header: "Header@http://localhost:9001/remoteEntry.js",
    Footer: "Footer@http://localhost:9002/remoteEntry.js",
  },
  ...
}),
```

`webpack.prod.js`

```js
new ModuleFederationPlugin({
  remotes: {
    FormApp: "FormApp@http://www.formapp.com/remoteEntry.js",
    Header: "Header@http://www.header.com/remoteEntry.js",
    Footer: "Footer@http://www.footer.com/remoteEntry.js",
  },
  ...
}),
```

The first thing you may notice is that the URLs are hard-coded in the Webpack configuration. While this setup works, it won't scale well if there are multiple apps distributed across multiple environments.

Another consideration is code deployment. If a remote app URL changes, teams must remember to change both the remote app and host app configurations. Changes required on multiple files in different projects increase the likelihood of mistakes occurring and code breaking in production.

### Conclusion

We need a way to dynamically assign the appropriate environment context for both local and remote `entrypoints`. However, abstracting out logic for assigning environment context will prevent Module Federation from knowing where and how to load remote `containers` during the Webpack `build` process; as absolute URL paths will no longer exist in Webpack configurations. We'll need to be able to load remote apps dynamically when environment context has been established.

## High Level Overview

This repository employs the modification of several documented techniques to support a fully dynamic, multi-environment setup.

#### MutateRuntimePlugin.js

[This plugin](https://gist.github.com/ScriptedAlchemy/60d0c49ce049184f6ce3e86ca351fdca) by Module Federation Author `Zack Jackson` allows for tapping into the Webpack `MutateRuntime` compilation hook to mutate `publicPath` dynamically.

[This code snippet](https://gist.github.com/devonChurch/c8f43d0270fc71168cdf23765043f679#file-webpack-config-js) by `devonChurch` is an implementation of `MutateRuntimePlugin.js` where `publicPath` is intercepted and mutated via variable assignment initialized during `runtime`.

#### Multi-Environment Architecture

[This discussion thread and code example](https://github.com/module-federation/module-federation-examples/issues/102#issuecomment-695162211) by `devonChurch` outlines a method for injecting local and remote `entrypoints` at `runtime` through `publicPath` mutation via the method described above.

This method also employs the use of `.json` configuration files which hold a global mapping of all local and remote `entrypoint` URLs and the current environment.

#### Dynamic Remote Containers

[This code snippet](https://webpack.js.org/concepts/module-federation/#dynamic-remote-containers) via Webpack documentation describes exposed methods for initializing remote `containers` dynamically at runtime.

#### Webpack Configurations

When implementing the documented techniques above, I encountered several `gotchyas` when setting up more advanced Webpack configurations. I documented these issues and fixes so you can avoid these pitfalls.

## Project Setup

Before diving in to the project code, let's discuss briefly, the project's structure and underlying configurations.

```
| dynamic-container-path-webpack-plugin (dcp)
| -----------
```

```
| Shared Configs
| -----------
| map.config.json
| bootstrap-entries.js
```

```
| Host / Remote
| -----------
| chunks.config.json
| * environment.config.json
| webpack.common.js
| webpack.dev.js
| webpack.prod.js
| index.html
```

```
| Host
| -----------
| bootstrap.js
| load-component.js
```

```
| Remote
| -----------
| bootstrap.js
```

### dynamic-container-path-webpack-plugin

My modified version of `MutateRuntimePlugin.js` that mutates `publicPath` at `runtime`. This can be installed from `npm` and can be used as a plugin and customized in your Webpack configuration.

### Shared Configs

`map.config.json` contains a global object of local and remote endpoint URLs.

`bootstrap-entries.js` bootstraps Webpack `chunks` with the correct URLs based on the current environment.

### Host / Remote

`chunks.config.json` is an array of Webpack `entrypoints` required for application initialization and remote application namespaces for consumption.

`environment.config.json` is a key/value pair indicating the current environment. This can be set by your build pipeline. However, for simplicity, we will set the environment in `bootstrap-entries.js` in this tutorial.

Webpack configuration files employ `webpack-merge` so we can reduce Webpack boilerplate code (loaders, common Webpack environment configurations, etc.). This is an architecture choice recommended for streamlining configurations across applications.

`index.html` will include a script reference to `bootstrap-entries.js` so that it can bootstrap Webpack `chunks` at `runtime` so it can load our federated modules.

### Host

`bootstrap.js` serves as an asynchronous barrier for our local and remote code. This is a required file in order for Module Federation to work correctly. [You can read more about this here.](https://github.com/module-federation/module-federation-examples/issues/375) We'll also set up logic here to lazy-load our remote app.

`load-component.js` is code directly lifted from Webpack documentation as [referenced in this guide under `Dynamic Remote Containers`](https://webpack.js.org/concepts/module-federation/#dynamic-remote-containers). This file will dynamically load and negotiate shared libraries of our remote app with the host.

### Remote

Similarly to `Host`, `bootstrap.js` serves as an asynchronous barrier for our local and remote code.

## Mutating publicPath via Global Variable Assignment

### Discussions on `publicPath` Assignment Options

Our first step is to identify a method for dynamically mutating `publicPath`. Before reviewing the solution, let's briefly discuss our options by navigating to the [Webpack docs](https://webpack.js.org/guides/public-path/).

We could use `DefinePlugin` to set environment variables to modify `publicPath`, however, we won't be able to easily scale over several remotes with several environments.

A promising option involves leveraging Webpack's `publicPath`: `auto` to automatically determine the value from context (for example: `document.currentScript`). We can even this in action in `Zack Jackson`'s [dynamic remotes](https://github.com/module-federation/module-federation-examples/blob/master/advanced-api/dynamic-remotes/app1/webpack.config.js) example repo.

While this option does meet our desired requirements of [removing the hardcoded URL's from the webpack configuration](https://github.com/module-federation/module-federation-examples/blob/master/advanced-api/dynamic-remotes/app2/webpack.config.js), unfortunately, now we need to [define the remote paths inside the host via `App.js`](https://github.com/module-federation/module-federation-examples/blob/master/advanced-api/dynamic-remotes/app1/src/App.js), thus defeating the intended purpose of keeping hardcoded URL's out of our code. Another drawback prevents us from using `style-loader` because it relies on a static `publicPath` to embed styles inline in the html. [See this GitHub issue thread](https://github.com/webpack-contrib/mini-css-extract-plugin/issues/288#issuecomment-464665178).

This leaves us our last option which involves modifying `publicPath` on the fly. In the next section we'll discuss how to tap into one of Webpack's complication hooks and write a custom Webpack plugin that supports custom mutation of `publicPath` during runtime.

Outsourcing logic to `runtime` reduces hard-coded Webpack build configurations, reduces maintenance, and increases configuration re-usability.

### High Level Overview

We can mutate `publicPath` by referencing and modifying a custom Webpack plugin by Module Federation Author `Zack Jackson` that uses the `MutateRuntime` compilation hook to mutate `publicPath` dynamically.

First let's take a look at the completed plugin's API:

```js
const  DynamicContainerPathPlugin =
	require('dynamic-container-path-webpack-plugin');
const  setPublicPath =
	require('dynamic-container-path-webpack-plugin/set-path');

 new DynamicContainerPathPlugin({
   iife: setPublicPath,
   entry: 'host',
 }),
```

`DynamicContainerPathPlugin` accepts two arguments. `iife` is an immediately invoked function expression that will take in `entry` as it's argument.

When `iife` is executed inside the plugin, it will use `entry` as a `key` to find the correct environment. When `iife` is returned, `DynamicContainerPathPlugin` will assign the resulting value to Webpack's internal `publicPath` variable.

### Tapping into `PublicPathRuntimeModule`

Let's look under the hood to see how the [dynamic-container-path-plugin](https://github.com/waldronmatt/dynamic-container-path-webpack-plugin/blob/main/index.js) works.

**Note**: This guide assumes basic anatomy of how a Webpack plugin works. To read more, reference the Webpack docs [found here](https://webpack.js.org/concepts/plugins/).

First we call `apply(compiler)` to access Webpack's compilation lifecycle:

```js
apply(compiler) {

};
```

Next, we'll need a way to intercept Webpack before finishing the compilation. We can do this using the `make` hook:

```js
compiler.hooks.make.tap('MutateRuntime', compilation => {});
```

Within the `make` hook, we have access to Webpack's compilation hooks that allow us to create a new build. We can use the `runtimeModule` hook that will allow us to tap directly into `publicPath` assignment and call a custom method `changePublicPath` to allow for dynamic `publicPath` re-assignment:

```js
compilation.hooks.runtimeModule.tap('MutateRuntime', (module, chunk) => {
	module.constructor.name === 'PublicPathRuntimeModule'
		? this.changePublicPath(module, chunk)
		: false;
	});
});
```

### `changePublicPath` Method

`changePublicPath` calls two methods. The first method `getInternalPublicPathVariable` strips out `publicPath's` value using Webpack's internal global variable `__webpack_require__.p` set at build time and returns the internal variable only.

```js
getInternalPublicPathVariable(module) {
	const [publicPath] = module.getGeneratedCode().split('=');
	return [publicPath];
}
```

The second method `setNewPublicPathValueFromRuntime` accepts the internal `publicPath` variable `__webpack_require__.p` derived from `getInternalPublicPathVariable` as an argument. The variable is re-assigned a value using custom logic provided to the Webpack plugin.

The new `publicPath` value is then assigned to `module._cachedGeneratedCode` which is equal to `__webpack_require__.p`, our internal Webpack `publicPath` variable, at build time.

```js
setNewPublicPathValueFromRuntime(module, publicPath) {
	module._cachedGeneratedCode =
		`${publicPath}=${this.options.iife}('${this.options.entry}');`;
	return  module;
}
```

### `iife` and `entry`

In the previous section we covered how the method `setNewPublicPathValueFromRuntime` assigns the new `publicPath` value. In this section we'll cover the logic contained in `iffe`:

```js
`${publicPath}=${this.options.iife}('${this.options.entry}');`;
```

Let's zoom out again to our original API setup using `DynamicContainerPathPlugin`.

```js
const  DynamicContainerPathPlugin =
	require('dynamic-container-path-webpack-plugin');
const  setPublicPath =
	require('dynamic-container-path-webpack-plugin/set-path');

 new DynamicContainerPathPlugin({
   iife: setPublicPath,
   entry: 'host',
 }),
```

`DynamicContainerPathPlugin` comes with logic for assigning `publicPath` via `setPublicPath`, but you can modify to fit your own needs.

`dynamic-container-path-webpack-plugin/set-path` contains the following code:

```js
module.exports = function (entry) {
  const { __MAP__, __ENVIRONMENT__ } = window;
  const { href } = __MAP__[entry][__ENVIRONMENT__];
  const publicPath = href + '/';
  return publicPath;
};
```

`__MAP__` and `__ENVIRONMENT__`, which will be covered later, are global variables we will set up at runtime. These global variables values will be assigned the fetched data from our `json` mapping of URLs (covered below).

`entry` is used as a key to look up the current `entrypoint` in `__MAP__`. `href` is the resulting value extracted from `__MAP__` and assigned to `publicPath`, which in turn, is assigned to Webpack's internal `publicPath` variable as we covered in the last section.

## Creating a Global Mapping of Endpoints

One disadvantage, as outlined earlier, is Module Federation's dependence on hard-coded URLs that scale poorly with more complex organizational requirements. We will instead define a `json` object containing a global reference of host and remote `entrypoint` URLs that will be referenced by the repositories.

```json
{
  "Host": {
    "localhost": {
      "href": "http://localhost:8000"
    },
    "production": {
      "href": "https://dynamic-host-module-federation.netlify.app"
    }
  },
  "RemoteFormApp": {
    "localhost": {
      "href": "http://localhost:8001"
    },
    "production": {
      "href": "https://dynamic-remote-module-federation.netlify.app"
    }
  }
}
```

`Host`and `RemoteFormApp` refers to the Webpack `entrypoint` names we will define later in our repositories.

Each of these `entrypoints` contain environment URLs; the `key` referring to the environment name and `property` `href` containing the hard-coded URL.

## Writing a Script to Bootstrap Chunks

The key to supporting a multi-environment setup is by dynamically assigning the appropriate endpoint URLs based on the current environment at runtime.

We'll create a file called `bootstrap-entries.js` that will be tasked with the following:

- Fetch configuration files and assign them to global variables to be used by `dynamic-container-path-webpack-plugin` to mutate `publicPath`
- The configuration files and newly defined `publicPath` will inject local and remote `chunks` on the page.

### Initial Setup

First we'll define an `iife` so that it will execute immediately in `index.html`:

```js
(async () => {
  // our script goes here
})();
```

Next we'll set up logic to determine the current environment:

**Note:** Refer to the code snippets in section `A Quick Note on environment.config.js` for a build pipeline configuration.

```js
const environment = () =>
  location.host.indexOf('localhost') > -1 ? 'localhost' : 'production';
```

Since we'll be referencing configuration files relative to individual repositories, we have a small function to get the appropriate base path:

```js
const getBasePath = environment() == 'localhost' ? './' : '/';
```

Next, we'll fetch a file called `assets-mainfest.json`.

For `production` builds, assets are commonly cache-busted through the use of Webpack's `contentHash` feature. This file will get generated by `webpack-assets-manifest` and will allow us to fetch our `chunks` without needing to know the dynamically generated `contentHash` value assigned with each `production` build:

```js
const getManifest = await fetch('./assets-manifest.json').then(response =>
  response.json()
);
```

Next, we will define a `const` array of configuration files:

```js
const configs = [
  `https://cdn.jsdelivr.net/gh/waldronmatt/
	    dynamic-module-federation-assets/dist/map.config.json`,
  `${getBasePath}chunks.config.json`,
];
```

The first configuration references the global mapping of endpoints we defined earlier.

**Note:** I'm using `jsdeliver` to serve `map.config.json` and `bootstrap-entries.js` so the repositories can reference from one place. Look into more robust cloud alternatives for mission critical applications.

The second configuration is an array of `entrypoints` required for application initialization and remote application namespaces for consumption. This is unique per repository and will be covered later on.

### Fetch Configurations and Assign to Global Variables

Now that our utility functions and configuration file references are defined, the next step is to fetch our configurations and assign them to globally defined variables.

First we'll fetch the configuration files in parallel. We want to ensure all of the configurations are fetched before variable assignment:

```js
const [map, chunks] = await Promise.all(
  configs.map(config => fetch(config).then(response => response.json()))
);
```

Next we'll assign `environment` and `map` to global variables. This step is critical, as it is used by `dynamic-container-path-webpack-plugin` to re-assign the value of `publicPath`.

```js
window.__ENVIRONMENT__ = environment();
window.__MAP__ = map;
```

### Fetch JavaScript from `entrypoints` and Inject on the Page

Lastly, we'll loop through each `chunk` defined in `chunks.config.js` and return the code:

**Note:** As we'll see later in the section, `chunks.config.js` contains two arrays containing name references to local and remote Webpack `chunks`.

First we're getting all local `chunks` and returning the code. Because `webpack-assets-manifest` doesn't generate an entry for `remoteEntry.js` (a file used by Module Federation to bootstrap remotes), we will fetch it by name only.

**Note:** `remoteEntry.js` is considered a `local chunk` in the `remote` repository.

```js
  ...chunks.entrypoints.map(chunk => {
    return chunk !== 'remoteEntry'
      ? fetch(`./${getManifest[`${chunk}.js`]}`)
	      .then(response => response.text())
      : fetch(`${chunk}.js`).then(response => response.text());
  }),
```

Next, we're getting all remote `chunks` and returning the code. First we grab the appropriate endpoint for each `chunk` based on the current environment.

Then we use the derived endpoint value and assign it to `remoteEntry.js` so we can properly fetch the remotes.

```js
   ...chunks.remotes.map(chunk => {
     const { href } = map[chunk][environment()];
     return fetch(`${href}/remoteEntry.js`).then(response => response.text());
   }),
```

Lastly, for each `chunk` we create a `script` tag, assign the returned code to it, and append it to the page for execution.

```js
 .then(scripts =>
   scripts.forEach(script => {
     const element = document.createElement('script');
     element.text = script;
     document.querySelector('body').appendChild(element);
   })
 );
```

Altogether, our code should look like the following:

```js
(async () => {
  const environment = () =>
    location.host.indexOf('localhost') > -1 ? 'localhost' : 'production';

  const getBasePath = environment() == 'localhost' ? './' : '/';

  const getManifest = await fetch('./assets-manifest.json').then(response =>
    response.json()
  );

  const configs = [
    `https://cdn.jsdelivr.net/gh/waldronmatt/
	    dynamic-module-federation-assets/dist/map.config.json`,
    `${getBasePath}chunks.config.json`,
  ];

  const [map, chunks] = await Promise.all(
    configs.map(config => fetch(config).then(response => response.json()))
  );

  window.__ENVIRONMENT__ = environment();
  window.__MAP__ = map;

  await Promise.all([
    ...chunks.entrypoints.map(chunk => {
      console.log(`Getting '${chunk}' entry point`);
      return chunk !== 'remoteEntry'
        ? fetch(`./${getManifest[`${chunk}.js`]}`).then(response =>
            response.text()
          )
        : fetch(`${chunk}.js`).then(response => response.text());
    }),
    ...chunks.remotes.map(chunk => {
      const { href } = map[chunk][environment()];
      return fetch(`${href}/remoteEntry.js`).then(response => response.text());
    }),
  ]).then(scripts =>
    scripts.forEach(script => {
      const element = document.createElement('script');
      element.text = script;
      document.querySelector('body').appendChild(element);
    })
  );
})();
```

Later, we'll cover how to implement the code in our repositories.

### A Note on `environment.config.js`

For simplicity, we will define logic for determining the environment in `bootstrap-entries.js` in this tutorial. However, you may prefer to define it based on your build pipeline instead. If this is the case for you, below you'll find code snippets you can use in place of the environment logic we'll be covering in subsequent sections:

`environment.config.js` - **(Will be created per repository)**

```json
{
  "environment": "localhost"
}
```

`bootstrap-entries.js`

```js
const configs = [
	`${getBasePath}environment.config.json`,
	...
]

...

const [{ environment }, ... ] = await Promise.all(
	configs.map(config => fetch(config).then(response => response.json()))
);

...

window.__ENVIRONMENT__ = environment;
```

## Project Setup

It's finally time to put everything we learned into action. As we cover specific files and configurations, you can reference the repository [found here](https://github.com/waldronmatt/dynamic-host-module-federation). Only important files and configurations will be covered.

### `config/` directory

We'll set up a file called `chunks.config.json` inside a folder called `config` located in the project root. This file contains a list of local and remote entrypoints.

```json
{
  "entrypoints": ["Host"],
  "remotes": ["RemoteFormApp"]
}
```

**Note**: This directory is where you can optionally define an environment configuration file set using your build pipeline. See the section `A Quick Note on environment.config.js` for more information.

`environment.config.js` - **(Will be created per repository)**

```json
{
  "environment": "localhost"
}
```

### `bootstrap.js`

If you are using static imports anywhere in your project, you will need to set up an asynchronous boundary in order for Module Federation to work correctly. You can do this by setting up a file called `bootstrap.js` and dynamically importing the main `.js` file of your application.

```js
import('./app.js');
```

**Note**: For further reading on this topic, reference the following links:

- [Reference 1](https://www.angulararchitects.io/aktuelles/the-microfrontend-revolution-module-federation-in-webpack-5/)
- [Reference 2](https://webpack.js.org/concepts/module-federation/#troubleshooting/)
- [Reference 3](https://github.com/module-federation/module-federation-examples/issues/375#issuecomment-701896225)

### Dynamically Lazy-load remote containers

Create a file called `load-component.js` under `/src/`. We'll be copy/pasting the code found on the [Webpack documentation for Dynamic Remote Containers](https://webpack.js.org/concepts/module-federation/#dynamic-remote-containers). This code allows for loading in remote containers dynamically.

```js
const loadComponent = (scope, module) => {
  return async () => {
    await __webpack_init_sharing__('default');
    const container = window[scope];
    await container.init(__webpack_share_scopes__.default);
    const factory = await window[scope].get(module);
    const Module = factory();
    return Module;
  };
};

export default () => loadComponent;
```

Next, we'll be copy/pasting more code found on the [Webpack documentation for Lazy Loading](https://webpack.js.org/guides/lazy-loading/). We'll modify and implement this code in our `bootstrap.js` file below our dynamic import of `app.js`.

```js
const lazyLoadDynamicRemoteApp = () => {
  const getHeader = document.getElementById('click-me');
  getHeader.onclick = () => {
    import(/* webpackChunkName: "RemoteFormApp" */ './load-component')
      .then(module => {
        const loadComponent = module.default();
        const formApp = loadComponent('FormApp', './initContactForm');
        formApp();
      })
      .catch(() => `An error occurred while loading ${module}.`);
  };
};

lazyLoadDynamicRemoteApp();
```

The reason why this works without a hard-coded URL is because we are dynamically assigning `publicPath` at runtime, getting the appropriate entrypoints, and injecting the code onto the page.

Since this includes `remoteEntry.js`, which in turn, loads in our remotes, we automatically have access to the remote scope `FormApp` and now we're able to load it successfully using only the relative path `./initContactForm` located in the remote repository.

**Note:** If you don't want to lazy load your apps and dynamically import them normally, replace the above code with the following in `bootstrap.js`:

```js
import('./load-component').then(module => {
  const loadComponent = module.default();
  const formApp = loadComponent('FormApp', './initContactForm');
  formApp();
});
```

### Reference the `bootstrap-entries.js` file

Earlier, we set up custom code to bootstrap Webpack chunks at runtime. Now it's time to reference this in our `index.html` as we covered in the section `Reference for Use in Repositories` (reference this for more information). We'll repeat this process for all repositories.

[https://cdn.jsdelivr.net/gh/waldronmatt/dynamic-module-federation-assets@1.1.1/dist/bootstrap-entries.js](https://cdn.jsdelivr.net/gh/waldronmatt/dynamic-module-federation-assets@1.1.1/dist/bootstrap-entries.js)

```html
<script
  preload
  src="https://unpkg.com/regenerator-runtime@0.13.1/runtime.js"
></script>
<script preload <!-- reference the bootstrap-entries.js link above -->
  src=`...`>
</script>
```

The `bootstrap-entries.js` file we're serving is a transpiled and minified version of the script to support older browsers and improve performance.

**Note:** `regenerator-runtime` is required to provide support for `async/await`.

**Note:** We can `preload` these scripts to improve page performance.

**Note**: The global mapping of hard-coded URLs we set up earlier is also located in the `dynamic-module-federation-assets` repository (where `bootstrap-entries.js` is located). The reasoning is that this file is common among all of our repositories. If we need to add, remove, or change a URL, we do it once in one location.

## Webpack Configurations

### Webpack Merge

The host and remote repositories use Webpack Merge to reuse common configurations and reduce the number of dependencies needed to be installed. For this tutorial I'm using my own shareable configuration [found here](https://www.npmjs.com/package/@waldronmatt/webpack-config).

### Development Configuration

At minimum we'll want a development server and hot-reloading set up along with configuration defaults from our Webpack merge configuration.

We're adding a configuration to the development server header to ignore `CORS`. You can add optional linters and any other configurations needed. The final code for `webpack.dev.js` for host and remote repositories can be found below:

```js
const commonConfig = require('./webpack.common.js');
const extendWebpackBaseConfig = require('@waldronmatt/webpack-config');
const path = require('path');
const webpack = require('webpack');

const developmentConfig = {
  devServer: {
    contentBase: path.resolve(__dirname, './dist'),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers':
        'X-Requested-With, content-type, Authorization',
    },
    index: 'index.html',
    port: 8000,
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
};

module.exports = extendWebpackBaseConfig(commonConfig, developmentConfig);
```

### Production Configuration

We can leverage Webpack's `splitchunks` functionality for splitting up code alongside dynamically loaded remotes and local code.

Since our remote `FormApp` will require extra dependencies, we can tell Webpack to split up code belonging to libraries in a separate file.

```js
cacheGroups: {
	vendor: {
		name:  `Vendors-${mainEntry}`,
		chunks:  'async',
		test: /node_modules/,
	},
},
```

**Note**: The name of the chunk is important. It must be unique to avoid namespace collisions with remotes. Using the name of the main entrypoint alongside a naming system describing the nature of the code split (`vendors` in our case) might be a good way to keep names unique.

**Note**: If you recall earlier, in order for Module Federation to work, we were required to set up an asynchronous boundary so that static imports would be supported. Now all of our code is async which means we'll also need to set `chunks` to be `async` for our configuration.

We can repeat this process for splitting up code shared between entry points. The final code for the host and remote repositories can be found below:

```js
const commonConfig = require('./webpack.common.js');
const extendWebpackBaseConfig = require('@waldronmatt/webpack-config');
const chunks = require('./config/chunks.config.json');
const mainEntry = chunks.entrypoints[0];

const productionConfig = {
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendor: {
          name: `Vendors-${mainEntry}`,
          chunks: 'async',
          test: /node_modules/,
          priority: 20,
        },
        common: {
          name: `Common-${mainEntry}`,
          minChunks: 2,
          chunks: 'async',
          priority: 10,
          reuseExistingChunk: true,
          enforce: true,
        },
      },
    },
  },
};

module.exports = extendWebpackBaseConfig(commonConfig, productionConfig);
```

### Common Configuration

Lastly, we'll set up core configurations required for Webpack and Module Federation to run properly.

#### Host Module Federation Configuration

The host will contain our shared contract of dependency versions between remotes. We do this by declaring the `shared` property. For convenience, we're using an optional plugin called [`automatic-vendor-federation`](https://www.npmjs.com/package/@module-federation/automatic-vendor-federation) to make it easier to get version data and exclude libraries from the negotiation process.

```js
const ModuleFederationConfiguration = () => {
  const AutomaticVendorFederation = require('@module-federation/automatic-vendor-federation');
  const packageJson = require('./package.json');
  const exclude = ['express', 'serverless-http'];

  return new ModuleFederationPlugin({
    shared: AutomaticVendorFederation({
      exclude,
      packageJson,
      shareFrom: ['dependencies'],
      jquery: {
        eager: true,
      },
    }),
  });
};
```

#### Remote Module Federation Configuration

The remote configuration will contain the scope `name`, the `module` exposed alongside its' relative path in the repository, and lastly, the default name of the remote entrypoint used to bootstrap remotes:

```js
const ModuleFederationConfiguration = () => {
  return new ModuleFederationPlugin({
    name: 'FormApp',
    filename: 'remoteEntry.js',
    exposes: {
      './initContactForm': './src/form/init-contact-form',
    },
  });
};
```

#### `DynamicContainerPathPlugin`

Next we configure `DynamicContainerPathPlugin` to set `publicPath` at `runtime`:

```js
const  DynamicContainerPathPlugin =
	require('dynamic-container-path-webpack-plugin');
const  setPublicPath =
	require('dynamic-container-path-webpack-plugin/set-path');

new  DynamicContainerPathPlugin({
	iife:  setPublicPath,
	entry:  mainEntry,
}),
```

#### Essential Configurations

The next step is to configure our entrypoints, output configurations, and remaining plugins. First, we'll set up our main entrypoint. The referenced file should be `bootstrap.js`, our asynchronous boundary for static imports.

```js
target:  'web',
entry: {
	[mainEntry]: ['./src/bootstrap.js'],
},
```

The output configuration has a `publicPath` default value of `/`. This can be ignored because `DynamicContainerPathPlugin` will modify the value at runtime.

```js
output: {
	publicPath:  '/',
	path:  path.resolve(__dirname, './dist'),
},
```

#### `runtimeChunk: single`

The Webpack merge configuration used in these repositories has `runtimeChunk`: `single` set as an optimization default so that the runtime file is shared across all generated chunks.

At the time of this writing, there is an issue with Module Federation where this setting [doesn't empty out federated container runtimes](https://github.com/webpack/webpack/issues/11691); breaking the build. We override by setting `runtimeChunk` to `false`.

```js
optimization: {
	runtimeChunk:  false,
},
```

#### `HtmlWebpackPlugin`

This plugin is used to generate the `html`. We don't want our `js` assets duplicated by `HtmlWebpackPlugin` since we are already dynamically injecting our entrypoints at runtime and no longer need to bootstrap them at compile time. We'll use `excludeChunks` to do this:

```js
new  HtmlWebpackPlugin({
	filename:  'index.html',
	title:  `${mainEntry}`,
	description:  `${mainEntry} of Module Federation`,
	template:  'src/index.html',
	excludeChunks: [...chunks.entrypoints],
}),
```

#### Other Plugins

We're adding `ProvidePlugin` to define jQuery (we're using this library primarily to test out the Module Federated library negotiation process).

We're also going to add `CopyPlugin` to copy over the `config/` directory containing our chunk mappings and `WebpackAssetManifest` to generate a mapping of cache-busted assets.

```js
new  webpack.ProvidePlugin({
	$:  'jquery',
	jQuery:  'jquery',
}),
new  CopyPlugin({
	patterns: [{ from:  'config', to:  '' }],
}),
new  WebpackAssetsManifest({}),
```

The entire code should look like the following:

`webpack.common.js`

```js
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const WebpackAssetsManifest = require('webpack-assets-manifest');
const { ModuleFederationPlugin } = require('webpack').container;
const DynamicContainerPathPlugin = require('dynamic-container-path-webpack-plugin');
const setPublicPath = require('dynamic-container-path-webpack-plugin/set-path');
const chunks = require('./config/chunks.config.json');
const mainEntry = chunks.entrypoints[0];

const commonConfig = isProduction => {
  // HOST M.F. Configuration
  const ModuleFederationConfiguration = () => {
    const AutomaticVendorFederation = require('@module-federation/automatic-vendor-federation');
    const packageJson = require('./package.json');
    const exclude = ['express', 'serverless-http'];

    return new ModuleFederationPlugin({
      shared: AutomaticVendorFederation({
        exclude,
        packageJson,
        shareFrom: ['dependencies'],
        jquery: {
          eager: true,
        },
      }),
    });

    // REMOTE M.F. Configuration
    const ModuleFederationConfiguration = () => {
      return new ModuleFederationPlugin({
        name: 'FormApp',
        filename: 'remoteEntry.js',
        exposes: {
          './initContactForm': './src/form/init-contact-form',
        },
      });
    };
  };

  return {
    target: 'web',
    entry: {
      [mainEntry]: ['./src/bootstrap.js'],
    },
    output: {
      publicPath: '/',
      path: path.resolve(__dirname, './dist'),
    },
    optimization: {
      runtimeChunk: false,
    },
    plugins: [
      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
      }),
      new CopyPlugin({
        patterns: [{ from: 'config', to: '' }],
      }),
      new WebpackAssetsManifest({}),
      new HtmlWebpackPlugin({
        filename: 'index.html',
        title: `${mainEntry}`,
        description: `${mainEntry} of Module Federation`,
        template: 'src/index.html',
        excludeChunks: [...chunks.entrypoints],
      }),
      new DynamicContainerPathPlugin({
        iife: setPublicPath,
        entry: mainEntry,
      }),
    ].concat(ModuleFederationConfiguration),
  };
};

module.exports = commonConfig;
```

## Conclusion

If you've made it this far, thank you and congratulations!

There was a lot to cover, but the end result is a solution that supports fully dynamic, multi-environment configuration.

To recap, this is what we covered in this guide:

- A high level overview of Module Federation and its' advantages and disadvantages.
- A summary of the problem and the desired technical outcomes.
- An overview of various solutions identified and project structure.
- How to mutate `publicPath` and bootstrap chunks dynamically.
- Overview of core project files and Webpack configurations.

Lastly, we'll review the advantages using this method as well as the disadvantages so you can make an informed decision on determining if this is the right approach for you:

Advantages:

- More easily support multiple testing environments without adding more complexity to your bundle configurations (hard-coded URLs)
- URLs only need to be updated once in one location (`map.config.js`).
- Environment context setting can be deferred to the build pipeline.
- Despite having remote and host containers initialize at runtime, you can still leverage all of Module Federation's current features (library negotiation, etc.)
- Most configuration code, including Webpack configurations, can be bundled and reused as scaffolding for other projects.
- Continue to leverage advanced Webpack features alongside Module Federation including code-splitting, lazy-loading, cache-busting, webpack merge support, etc.

Disadvantages

- Repositories are dependent on a single global file of URL mappings. Careful planning is required to ensure downtime is kept to a minimum.
- Renaming entrypoints will require updates at the project level (`chunks.config.js`) and at the global level (`map.config.json`). Any host applications referencing remotes will need their references in `chunks.config.js` updated too.
- Configurations covered adds a fair amount of complexity and requires a deeper level knowledge of Webpack that teams will need to familiarize themselves with.

## Additional Readings

I would like to share additional references that helped solidify my understanding of Module Federation:

[Module Federtation overview and setup guide](https://medium.com/swlh/webpack-5-module-federation-a-game-changer-to-javascript-architecture-bcdd30e02669)

[Overview of recent API changes](https://medium.com/dev-genius/module-federation-advanced-api-inwebpack-5-0-0-beta-17-71cd4d42e534)

[Detailed review of recent API changes](https://github.com/webpack/webpack/pull/10960)

[How static imports are hoisted in Module Federation](https://github.com/module-federation/module-federation-examples/issues/375)

[Dependency version negotiation/contract guide](https://www.angulararchitects.io/en/aktuelles/getting-out-of-version-mismatch-hell-with-module-federation/)

[List of API options and their descriptions](https://github.com/webpack/webpack/blob/master/schemas/plugins/container/ModuleFederationPlugin.json)

[Module Federation podcast overview](https://www.youtube.com/watch?v=-ei6RqZilYI)

[Module Federation podcast slide references](https://github.com/sokra/slides/blob/master/content/ModuleFederationWebpack5.md)

[Analysis of Micro Frontends in Enterprise](https://dev.to/this-is-learning/micro-frontends-my-lessons-learned-1pcp)

## License

MIT
