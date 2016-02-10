'use strict';
const format = require('stringformat');
const appPath = './src/electron/app';

module.exports = {
    entry: format('{0}/app.js', appPath),
    output: {
        filename: format('{0}/bundle.js', appPath)
    },
    module: {
        loaders: [
            {
                test: /\.css$/,
                exclude: /node_modules/,
                loader: 'style-loader!css-loader'
            }
        ]
    }
};
