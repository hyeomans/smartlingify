'use strict';
const format = require('stringformat');
const appPath = './src/electron/app';

module.exports = {
    entry: format('{0}/app.es6', appPath),
    output: {
        filename: format('{0}/bundle.js', appPath)
    },
    module: {
        loaders: [
            {
                test: /\.es6$/,
                exclude: /node_modules/,
                loader: 'babel-loader'
            }
        ]
    },

    resolve: {
        extensions: ['', '.js', '.es6']
    }
};
