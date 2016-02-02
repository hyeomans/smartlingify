'use strict';
var rp          = require('request-promise');
var fs          = require('fs');
var Promise     = require('bluebird');
var stats       = Promise.promisify(fs.stat);
var readFile    = Promise.promisify(fs.readFile);
var format      = require('stringformat');
var extend      = require('util')._extend;

var apiKey;
var projectId;
var verboseMode;
var fileType;

var formData;

module.exports = function(smartlingApiKey, smartlingProjectId, filterByType) {
    if(!smartlingApiKey || !smartlingProjectId) {
        throw new Error('Both ApiKey and ProjectId are required');
    }
    projectId = smartlingProjectId;
    apiKey = smartlingApiKey;
    fileType = filterByType;

    formData = {
        fileType: fileType,
        apiKey: apiKey,
        projectId: projectId,
        overwrite: 1,
        translationState: 'PUBLISHED'
    };

    return function(files, verbose) {
        verboseMode = verbose;
        return importSiblingFiles(files);
    }
};

function importSiblingFiles(files) {
    var siblings = files[0].siblings;
    return Promise.all(siblings.map(importFile));
}

function importFile(file) {
    var options = {
        uri: 'https://api.smartling.com/v1/file/import',
        method: 'POST',
        resolveWithFullResponse: true,
        formData: {
            fileUri: file.fileUri,
            locale: file.locale,
            file: fs.createReadStream(file.absolutePath),
            fileType: fileType,
            apiKey: apiKey,
            projectId: projectId,
            overwrite: 1,
            translationState: 'PUBLISHED'
        }
    };

    return rp(options)
        .then(function (response) {
        console.log('File was imported:', file.relativePath);
        if(verboseMode) {
            console.log('The response was:', response);
        }
        })
        .catch(function (err) {
            console.log('There was an error importing:', file.relativePath);
            if(verboseMode) {
                console.log('The error was:', err);
            }
            return file;
        });
}