'use strict';
const path              = require('path');
const format            = require('stringformat');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const buildPath         = path.resolve('.', 'build', 'bundle.js');

const entryPoint        = path.resolve('.', 'src', 'app', 'js', 'index.js');
const htmlTemplatePath  = path.resolve('.', 'src', 'app', 'index.html');

module.exports = {
    entry: entryPoint,
    output: {
        filename: buildPath
    },
    module: {
        loaders: [
            {
                test: /\.scss$/,
                exclude: /node_modules/,
                loader: 'style-loader!css-loader!sass-loader'
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'Smartlingify',
            template: htmlTemplatePath,
            inject: 'body' // Inject all scripts into the body
        })
    ],
    watch: true
};
