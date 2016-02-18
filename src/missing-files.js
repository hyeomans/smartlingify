'use strict';
/* global module*/
var Promise     = require('bluebird');
var rp          = require('request-promise');
var format      = require('stringformat');

let apiKey;
let projectId;

const smartlingFilesUrl = 'https://api.smartling.com/v1/file/list?apiKey={apiKey}&projectId={projectId}';
const smartlingLocaleFilesUrl = 'https://api.smartling.com/v1/file/list?apiKey={apiKey}&projectId={projectId}&locale={locale}';

/**
 * @param smartlingApiKey
 * @param smartlingProjectId
 * @returns {Function}
 */
module.exports = function (smartlingApiKey, smartlingProjectId) {
    apiKey = smartlingApiKey;
    projectId = smartlingProjectId;

    /**
     * @param supportedLocales An array with current supported locales.
     * @param localFiles An array of files that have {smartlingPath} and {locale} on their interface.
     * @returns {Object} that has two properties: diff(An Array of objects) and missingStrings
     */
    return function(supportedLocales, localFiles) {
        return Promise.props({
            allSiblings: getAllSiblings(supportedLocales),
            remoteFiles: dictionaryOfRootFilesFromSmartling()
        }).then((result) => {
            return Promise.props({
                remote: fillRemoteDictionary(result.remoteFiles, result.allSiblings),
                local: convertToDictionary(localFiles),
                missingStrings: missingStrings(result.allSiblings)
            });
        }).then((result) => {
            return {
                diff: diffLocales(result.remote, result.local),
                missingStrings: result.missingStrings
            };
        });
    };
};

function missingStrings(arrayOfSiblings) {
    return Promise.reduce(arrayOfSiblings, (missing, siblings) => {
        if(!missing[siblings.locale]) {
            missing[siblings.locale] = [];
        }

        siblings.forEach((sibling) => {
            if(sibling.stringCount !== sibling.completedStringCount) {
                missing[siblings.locale].push({
                    fileUri: sibling.fileUri,
                    currentStringCount: sibling.completedStringCount,
                    totalOfStringsNeeded: sibling.stringCount,
                    approvedStringCount: sibling.approvedStringCount,
                    missingStrings: sibling.stringCount - sibling.completedStringCount
                });
            }
        });

        return missing;
    }, {})
        .catch((err) => {
            throw new Error('There was an error while trying to get missing strings: ' + err);
        });
}

/**
 * @param remote
 * @param local
 * @returns {Object[]} Key: Smartling file path, Value: An array of locales that are missing locally.
 */
function diffLocales(remote, local) {
    return Object.keys(remote).reduce((prev, file) => {
        let localLocales = local[file];
        let remoteLocales = prev[file];

        if(!localLocales) {
            return prev;
        }

        let missingLocales = remoteLocales.filter((locale) => localLocales.indexOf(locale) < 0);
        prev[file] = missingLocales;
        return prev;
    }, remote);
}

function fillRemoteDictionary(remoteFiles, allSiblings) {
    return Promise.reduce(allSiblings, (files, siblings) => {
        siblings.forEach((sibling) => {
            if(files[sibling.fileUri]) {
                if(sibling.stringCount !== sibling.completedStringCount) {
                    //If file is not completed we will report on it.
                    return;
                }

                files[sibling.fileUri].push(siblings.locale);
            }
        });
        return files;
    }, remoteFiles)
        .catch((err) => {
            throw new Error('There was an error while converting array of files to dictionary of languages: ' + err);
        });
}

function getAllSiblings(locales) {
    return Promise.map(locales, getSiblings)
        .catch((err) => {
            throw new Error('There was an error while trying to get each list of files per locale: ' + err);
        });
}

function getSiblings(locale) {
    let localeFiles = format(smartlingLocaleFilesUrl, {apiKey: apiKey, projectId: projectId, locale: locale});
    return rp.get(localeFiles)
        .then(getFileListFromResponse)
        .then((parsedList) => {
            parsedList.locale = locale;
            return parsedList;
        })
        .catch(() => { throw new Error('There was an error while consuming smartling with URL:' + localeFiles); });
}

function dictionaryOfRootFilesFromSmartling() {
    let rootFiles = format(smartlingFilesUrl, {apiKey: apiKey, projectId: projectId});
    return rp.get(rootFiles)
        .then((serverResponse) => {
            let files = getFileListFromResponse(serverResponse);
            return files.reduce((prev, file) => {
                prev[file.fileUri] = [];
                return prev;
            }, {});
        }).catch((err) => {
            throw new Error('There was an error while consuming smartling with URL:' + rootFiles + '\n' + 'Error:' + err);
        });
}

function getFileListFromResponse(jsonResponse) {
    try {
        let parsed = JSON.parse(jsonResponse);
        if(!parsed['response'] && !parsed['response']['data'] && !parsed['response']['data']['fileList']) {
            return [];
        }

        return parsed['response']['data']['fileList'];
    } catch (e) {
        throw new Error('There was an error parsing the json response.');
    }
}

/*
 * This will convert our files structure to a Dictionary where:
 * Key: Smartling path
 * Value: An array with: [ 'locale', fileObject ]
 */
function convertToDictionary(files) {
    var dictionary = files.reduce((dic, file) => {
        dic[file.smartlingPath] = [];
        file.siblings.forEach((sibling) => {
            dic[sibling.smartlingPath].push(sibling.locale);
        });
        return dic;
    }, {});
    return Promise.resolve(dictionary);
}
