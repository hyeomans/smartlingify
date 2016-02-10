'use strict';
const webpackStrip  = require('strip-loader');
const devConfig     = require('./webpack.config');

var stripLoader = {
    test: [/\.js$/, /\.es6$/],
    exclude: /node_modules/,
    loader: webpackStrip.loader('console.log')
}

devConfig.module.loaders.push(stripLoader);

module.exports = devConfig;
