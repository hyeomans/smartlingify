'use strict';
var format      = require('stringformat');
var rp          = require('request-promise');

var url = 'https://api.smartling.com/v1/project/locale/list?apiKey={0}&projectId={1}';
var projectId;
var apiKey;

module.exports = function(smartlingApiKey, smartlingProjectId) {
    if(!smartlingApiKey || !smartlingProjectId) {
        throw new Error('Both ApiKey and ProjectId are required');
    }
    projectId = smartlingProjectId;
    apiKey = smartlingApiKey;

    return function() {
        return getLocales();
    }
};

function getLocales() {
    return rp.get(format(url, apiKey, projectId))
        .then(JSON.parse)
        .then(function (payload) {
            return payload.response.data.locales.map(function (locales) {
                return locales.locale;
            });
        }).catch(function (err) {
            //log err
            return [];
        });

}