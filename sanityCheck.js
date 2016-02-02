'use strict';
var rp          = require('request-promise');
var fs          = require('fs');
var Promise     = require('bluebird');
var readFile    = Promise.promisify(fs.readFile);
var format      = require('stringformat');

var fileUri = 'https://api.smartling.com/v1/file/get?apiKey={0}&projectId={1}&fileUri={2}&locale={3}';

var apiKey;
var projectId;
var verboseMode;

module.exports = function(smartlingApiKey, smartlingProjectId) {
    if(!smartlingApiKey || !smartlingProjectId) {
        throw new Error('Both ApiKey and ProjectId are required');
    }

    projectId = smartlingProjectId;
    apiKey = smartlingApiKey;

    return function(files, verbose) {
        verboseMode = verbose;
        return compareFiles(files);
    }
};

function compareFiles(files) {
    return Promise.all(Promise.map(files, function (file) {
        return compareSiblings(file.siblings);
    })).then(function (files) {
        return [].concat.apply([], files);
    }).then(function (flatten) {
        var report = {
            size: [],
            notFound: []
        };

        return flatten.reduce(function (prev, file) {
            if(file.reason === 'Size' && !prev[file.relativePath]) {
                prev.size.push(file);
                return prev;
            }

            if(file.reason === 'NotFound' && !prev[file.relativePath]) {
                prev.notFound.push(file);
                return prev;
            }

        }, report);
    });
}

function compareSiblings(siblings) {
    return Promise.map(siblings, compareFile)
        .then(function (files) {
            return files.filter(function (file) {
                return !!file;
            });
        })
        .then(function (files) {
            return [].concat.apply([], files);
        });
}

function compareFile(file) {
    var url = format(fileUri , apiKey, projectId, file.fileUri, file.locale);

    return Promise.join(readFile(file.absolutePath, 'utf8'), rp(url), function(local, remote) {
        var replaced = remote.replace(/&apos;/g, "'");
        if(local.length > replaced.length) {
            if(verboseMode) {
                console.log('The following file has greater size locally than the file on smartling:', file.relativePath);
            }

            file.localSize = local.length;
            file.remoteSize = replaced.length;
            file.sizeDifference = local.length - replaced.length;
            file.smartlingUrl = url;
            file.reason = 'Size';
            return file;
        }

        return;
    })
    .catch(function (err) {
        if(verboseMode) {
            console.log('The following file was not found on Smartling:', file.relativePath);
            console.log('The error was:', err);
        }

        file.reason = 'NotFound';
        return file;
    });
}