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
  // project-specific configurations are located here
  const ModuleFederationConfiguration = () => {
    const AutomaticVendorFederation = require('@module-federation/automatic-vendor-federation');
    const packageJson = require('./package.json');
    const exclude = ['express', 'serverless-http'];

    return new ModuleFederationPlugin({
      // This should be our 'shared contract' between the host and the remotes.
      shared: AutomaticVendorFederation({
        exclude,
        packageJson,
        shareFrom: ['dependencies'],
        jquery: {
          /*
            You can make shared modules "eager", which doesn't put the modules in a async chunk,
            but provides them synchronously. This allows to use these shared modules in the initial chunk.
            But be careful as all provided and fallback modules will always be downloaded.
            There it's wise to provide it only at one point of your app, e. g. the shell.
            https://github.com/webpack/webpack/pull/10960
          */
          eager: true,
        },
      }),
    });
  };

  return {
    target: 'web',
    entry: {
      [mainEntry]: ['./src/bootstrap.js'],
    },
    output: {
      publicPath: '/',
      path: path.resolve(__dirname, './dist'),
      clean: true,
    },
    optimization: {
      /*
        disable webpack base config `runtimeChunck: single`
        https://github.com/webpack/webpack/issues/11691

        This can be removed when #11843 is merged
        https://github.com/webpack/webpack/pull/11843
      */
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
        /*
          here we strip out the entry point and the remote alias 'FormApp'
          because we don't want it duplicated when we call it again dynamically at runtime
        */
        excludeChunks: [...chunks.entrypoints],
      }),
      new DynamicContainerPathPlugin({
        // provide the code to get `publicPath` at runtime
        iife: setPublicPath,
        /*
          Provide the main entry point as an argument to the plugin above. The value will be
          provided as a key to `map.config.json` to get the URL for this app
        */
        entry: mainEntry,
      }),
    ].concat(ModuleFederationConfiguration),
  };
};

module.exports = commonConfig;
