const commonConfig = require('./webpack.common.js');
const extendWebpackBaseConfig = require('@waldronmatt/webpack-config');

const productionConfig = {
  optimization: {
    /*
      SplitChunks finds modules which are shared between chunks and splits them
      into separate chunks to reduce duplication or separate vendor modules from application modules.
    */
    splitChunks: {
      /*
        cacheGroups tells SplitChunksPlugin to create chunks based on some conditions
      */
      cacheGroups: {
        // vendor chunk
        vendor: {
          // name of the chunk - make sure name is unqiue to avoid namespace collisions with federated remotes
          name: 'Vendors-Host',
          /* 
            we need to async this chunck because EVERYTHING is dynamically imported 
            due to how Module Federation works
          */
          chunks: 'async',
          // import file path containing node_modules
          test: /node_modules/,
        },
      },
    },
  },
};

module.exports = extendWebpackBaseConfig(commonConfig, productionConfig);
