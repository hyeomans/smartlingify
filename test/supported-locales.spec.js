'use strict';
var chai            = require('chai');
var chaiAsPromised  = require("chai-as-promised");
var proxyquire      = require('proxyquire').noPreserveCache();
var Promise         = require('bluebird');
var sinon           = require('sinon');

var mockApiKey = 'mockApiKey';
var mockProjectId = 'mockProjectId';
var expect = chai.expect;

chai.use(chaiAsPromised);
var stubs = {
    'request-promise': {}
};

var supportedLocales;

describe('Supported Locales', function () {
    describe('When request is successfull', function () {
        before(function () {
            stubs['request-promise'].get = sinon.stub().returns(Promise.resolve(goodResponse()));
            supportedLocales = proxyquire('../src/supported-locales', stubs)(mockApiKey, mockProjectId);
        });

        it('should retrieve locales from smartling', function () {
            var expectedResult = [ 'en-AU', 'en-GB', 'fr-CA', 'de-DE', 'ja-JP', 'es-MX' ];
            var result = supportedLocales();
            return expect(result).to.eventually.eql(expectedResult);
        });
    });

    describe('When request fails', function () {
        beforeEach(function () {
            stubs['request-promise'].get = sinon.stub().returns(Promise.reject(invalidCredentials()));
            supportedLocales = proxyquire('../src/supported-locales', stubs)(mockApiKey, mockProjectId);
        });

        it('should return an empty array', function () {
            var expectedResult = [];
            var result = supportedLocales();
            return expect(result).to.eventually.eql(expectedResult);
        });
    });
});

function goodResponse() {
    return '{"response":{"code":"SUCCESS","messages":[],"data":{"locales":[{"locale":"en-AU","name":"English' +
        ' (Australia)","translated":"English (Australia)"},{"locale":"en-GB","name":"English (United Kingdom)",' +
        '"translated":"English (United Kingdom)"},{"locale":"fr-CA","name":"French (Canada)","translated":"Franç' +
        'ais (Canada)"},{"locale":"de-DE","name":"German (Germany)","translated":"Deutsch"},{"locale":"ja-JP","' +
        'name":"Japanese","translated":"日本語"},{"locale":"es-MX","name":"Spanish (Mexico)","translated":"Spani' +
        'sh (Mexico)"}]}}}'
}

function invalidCredentials() {
    return '{"response":{"code":"AUTHENTICATION_ERROR","messages":["Bad credentials"],"data":null}}';
}