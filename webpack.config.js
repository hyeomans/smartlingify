'use strict';
const path              = require('path');
const format            = require('stringformat');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const buildPath         = path.resolve('.', 'build');

const entryPoint        = path.resolve('.', 'src', 'app', 'js');
const htmlTemplatePath  = path.resolve('.', 'src', 'app', 'index.html');

module.exports = {
    entry: entryPoint,
    output: {
        filename: 'bundle.js',
        path: buildPath
    },
    module: {
        loaders: [
        {
            test: /\.scss$/,
            exclude: /node_modules/,
            loader: 'style-loader!css-loader!sass-loader'
        },

        {
            test: /\.html$/,
            exclude: /node_modules/,
            loader: 'raw-loader'
        },

        {
            test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
            loader: "url?limit=10000&minetype=application/font-woff"
        },

        {
            test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
            loader: "url?limit=10000&minetype=application/font-woff"
        },

        {
            test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
            loader: "url?limit=10000&minetype=application/octet-stream"
        },

        {
            test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
            loader: "file"
        },

        {
            test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
            loader: "url?limit=10000&minetype=image/svg+xml"
        }

        ]},

        plugins: [
        new HtmlWebpackPlugin({
            title: 'Smartlingify',
            template: htmlTemplatePath,
            inject: 'body' // Inject all scripts into the body
        })
        ],
        watch: true
    };
