'use strict';
/* global module*/
//var rp          = require('request-promise');
var path        = require('path');
var Promise     = require('bluebird');
var fs          = require('fs-extra');
var rp          = require('request-promise');
var remove      = Promise.promisify(fs.remove);
var mkdir       = Promise.promisify(fs.ensureDir);
var writeFile   = Promise.promisify(fs.outputFile);

var tempFolder  = path.join('.', '.tmp');

module.exports = function () {
    return function(files) {
        return deleteContentsTempFolder()
            .then(() => downloadFiles(files))
            .then(() => files);
    };
};

function downloadFiles(files) {
    return Promise.all(Promise.map(files, downloadFile));
}

function downloadFile(file) {
    return getFile(file)
        .then(() => Promise.all(Promise.map(file.siblings, getFile)));
}

function getFile(file) {
    return rp.get(file.fileUri)
        .then((response) => saveFile(file, response))
        .catch(() => file.tempPath = void(0));
}

function saveFile(file, fileContents) {
    var fullPath = path.join(tempFolder, file.relativePath);
    return writeFile(fullPath, fileContents)
        .then(() => file.tempPath = fullPath)
        .catch(() => file.tempPath = void(0));
}

function deleteContentsTempFolder() {
    return remove(tempFolder).then(() => mkdir(tempFolder));
}
