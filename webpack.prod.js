const commonConfig = require('./webpack.common.js');
const extendWebpackBaseConfig = require('@waldronmatt/webpack-config');

const chunks = require('./config/chunks.config.json');
const mainEntry = chunks.entrypoints[0];

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
          name: `Vendors-${mainEntry}`,
          /* 
            we need to async this chunck because EVERYTHING is dynamically imported 
            due to how Module Federation works
          */
          chunks: 'async',
          // import file path containing node_modules
          test: /node_modules/,
          /*
            The higher priority will determine where a module is placed
            if it meets multiple conditions (both a shared and npm (vendor) module

            Prioritize vendor chuncks over commons
          */
          priority: 20,
        },
        common: {
          // create a commons chunk, which includes all code shared between entry points
          name: `Common-${mainEntry}`,
          // minimum number of chunks that must share a module before splitting
          minChunks: 2,
          // async + async chunks
          chunks: 'async',
          // lower priority than vendors
          priority: 10,
          /*
            If the current chunk contains modules already split out from the main bundle,
            it will be reused instead of a new one being generated.
          */
          reuseExistingChunk: true,
          /*
            Enforce value is set to true to force SplitChunksPlugin to
            form this chunk irrespective of the size of the chunk
          */
          enforce: true,
        },
      },
    },
  },
};

module.exports = extendWebpackBaseConfig(commonConfig, productionConfig);
