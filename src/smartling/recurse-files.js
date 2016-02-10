'use strict';
/* global module */
var format      = require('stringformat');
var filewalker  = require('filewalker');
var fs          = require('fs');
var Promise     = require('bluebird');
var access      = Promise.promisify(fs.access);

var smartlingFileUri = 'https://api.smartling.com/v1/file/get?apiKey={0}&fileUri={1}&projectId={2}';
var smartlingSiblingFileUri = 'https://api.smartling.com/v1/file/get?apiKey={0}&fileUri={1}&projectId={2}&locale={3}';
var smartlingImport = 'https://api.smartling.com/v1/file/import';

var apiKey;
var projectId;

module.exports = function (options) {
    if(!options['smartlingApiKey'] || !options['smartlingProjectId']) {
        throw new Error('Smartling Api key and Project Id are required.');
    }

    if(!options.path || !options.extension || !options.locales || options.locales.length === 0) {
        throw new Error('Path, extension and locales are needed');
    }

    apiKey = options.smartlingApiKey;
    projectId = options.smartlingProjectId;

    return function() {
        return recurseDirectory(options, ignoreFilesRegex(options.locales, options.extension))
            .then((files) => appendSiblings(files, options))
            .then(removeNonExistentSiblings);
    };
};

function removeNonExistentSiblings(files) {
    return Promise.all(Promise.map(files, (file) => checkSiblingsOfRoot(file)));
}

function checkSiblingsOfRoot(file) {
    return Promise.all(Promise.map(file.siblings, checkFile))
        .then((siblings) => siblings.filter((sibling) => !!sibling))
        .then((siblings) => {
            file.siblings = siblings;
            return file;
        });
}

function checkFile(file) {
    return access(file.absolutePath, fs.R_OK | fs.W_OK) //Read&Write permissions
        .then(() => file)
        .catch(() => void(0));
}

function appendSiblings(files, options) {
    files.forEach((file) => {
        var siblings = [];
        file.siblings = siblings;
        options.locales.reduce((prev, locale) => {
            var fullPathSplitted = file.absolutePath.split(options.extension);
            var relativePathSplitted = file.relativePath.split(options.extension);
            var smartlingPath = format('./{0}', file.relativePath);
            prev.push({
                absolutePath: format('{0}{1}.{2}', fullPathSplitted[0], locale, options.extension),
                relativePath: format('{0}{1}.{2}', relativePathSplitted[0], locale, options.extension),
                fileUri: format(smartlingSiblingFileUri, apiKey, smartlingPath, projectId, locale),
                upload: {
                    uri: smartlingImport,
                    params: [
                        ['apiKey', apiKey],
                        ['projectId', projectId],
                        ['fileUri', smartlingPath],
                        ['locale', locale],
                        ['overwrite', 1],
                        ['translationState', 'PUBLISHED'],
                        ['fileType', options.extension]
                    ]
                }
            });
            return prev;
        }, siblings);
    });
    return files;
}

function recurseDirectory(options, matchRegex) {
    var params = {
        maxPending: 10,
        matchRegExp: matchRegex
    };

    var files = [];
    return new Promise(function (resolve, reject) {
        filewalker(options.path, params)
            .on('file', function(p, s, a) {
                var smartlingPath = format('./{0}', p);
                files.push({
                    absolutePath: a,
                    relativePath: p,
                    fileUri: format(smartlingFileUri, apiKey, smartlingPath, projectId),
                    upload: {
                        uri: 'https://api.smartling.com/v1/file/upload',
                        params: [
                            ['apiKey', apiKey],
                            ['projectId', projectId],
                            ['fileUri', smartlingPath],
                            ['fileType', options.extension]
                        ]
                    }
                });
            })
            .on('error', function(err) {
                reject(err);
            })
            .on('done', function() {
                resolve(files);
            })
            .walk();
    });
}

function ignoreFilesRegex(supportedLocales, fileExtension) {
    var ignoreLocales = supportedLocales.map(function (locale, index) {
        if(index === 0) {
            return '('+ locale + '|';
        }
        if(index === supportedLocales.length -1) {
            return locale + ')';
        }
        return locale + '|';
    });
    var ignoreRegex = format('^(?!.*\\.{0}\\.{1}).*\\.{1}$', ignoreLocales.join(''), fileExtension);
    return new RegExp(ignoreRegex, 'gi');
}
