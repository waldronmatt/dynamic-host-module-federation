const commonConfig = require('./webpack.common.js');
const extendWebpackBaseConfig = require('@waldronmatt/webpack-config');
const path = require('path');
const chokidar = require('chokidar');
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
    // writeToDisk: true,
  },
  plugins: [new webpack.HotModuleReplacementPlugin()],
};

module.exports = extendWebpackBaseConfig(commonConfig, developmentConfig);
