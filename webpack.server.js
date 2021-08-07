// https://webpack.js.org/configuration/node/
const nodeExternals = require('webpack-node-externals');

module.exports = {
  mode: 'production',
  entry: {
    // change file to 'server-prod.js' for server-enabled express
    server: './serverless.js',
  },
  /*
    If you don't put this as, __dirname and __filename return blank or /
    NOTE: Need this when working with express, otherwise the build fails
    https://github.com/webpack/webpack/issues/1599#issuecomment-186841345
  */
  target: 'node',
  node: {
    __dirname: false,
    __filename: false,
  },
  /*
    Webpack allows you to define externals - modules that should not be bundled.
    When bundling with Webpack for the backend - you usually don't want to bundle its node_modules dependencies.
    This library creates an externals function that ignores node_modules when bundling in Webpack.
    Need this to avoid error when working with Express
  */
  externals: [nodeExternals()],
};
