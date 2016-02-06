'use strict';
/* global module*/
var Promise     = require('bluebird');
var fs          = require('fs');
var readFile    = fs.createReadStream;
var rp          = require('request-promise');

module.exports = function () {
    return function(files) {
        return Promise.props({
            root: missingRootFiles(files),
            siblings: missingSiblingFiles(files)
        }).then((data) => {
            return Promise.props({
                root: uploadFiles(data.root),
                siblings: uploadFiles(data.siblings)
            });
        }).then((data) => {
            return {
                rootUploaded: data.root.filter((file) => file.uploadSucess),
                siblingUploaded: data.siblings.filter((file) => file.uploadSucess),
                rootFailed: data.root.filter((file) => !file.uploadSucess),
                siblingFailed: data.siblings.filter((file) => !file.uploadSucess)
            };
        });
    };
};

function uploadFiles(files) {
    return Promise.all(Promise.map(files, uploadFile));
}

function uploadFile(file) {
    var form = {};

    file.upload.params.reduce((form, param) => {
        form[param[0]] = param[1];
        return form;
    }, form);

    form['file'] = readFile(file.absolutePath);
    return rp.post(file.upload.uri, {formData: form})
        .then(() => {
            file.uploadSucess = true;
            return file;
        })
        .catch((err) => {
            file.uploadSuccess = false;
            file.errorInfo = err;
            return file;
        });
    // to RESOLVE
        //.catch(console.log);//eslint-disable-line
}

function missingRootFiles(files) {
    return files.filter((file) => !file.tempPath);
}

function missingSiblingFiles(files) {
    let siblings = files.map((file) => {
        return file.siblings.filter((sibling) => !sibling.tempPath);
    });
    return [].concat.apply([], siblings);
}
