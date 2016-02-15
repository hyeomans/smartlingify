'use strict';
const devConfig         = require('./webpack.config');

devConfig.watch = false;

module.exports = devConfig;
