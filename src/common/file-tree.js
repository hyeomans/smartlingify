'use strict';
/* global module */
var format      = require('stringformat');
var Promise     = require('bluebird');
var Immutable   = require('immutable');
var filewalker  = require('filewalker');
var dir         = format('{0}/src', process.cwd());
var ignoreFiles = require(format('{0}/common/ignore-files-regex', dir));

module.exports = function(options) {
    let params = {
        maxPending: 10,
        matchRegExp: ignoreFiles(options.supportedLocales, options.extension)
    };

    return function() {
        var files = [];
        return new Promise(function (resolve, reject) {
            filewalker(options.path, params)
                .on('file', function(p, s, a) {
                    files.push({absolutePath: a, relativePath: p});
                })
                .on('error', function(err) {
                    reject(err);
                })
                .on('done', function() {
                    resolve(files);
                })
                .walk();
        }).then(function () {
            return Immutable.fromJS(files);
        });
    };
};
