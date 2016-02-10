'use strict';
/* global it, describe, before, beforeEach */
let chai            = require('chai');
let chaiAsPromised  = require('chai-as-promised');
let proxyquire      = require('proxyquire').noPreserveCache();
let Promise         = require('bluebird');
let sinon           = require('sinon');
let path            = require('path');

let mockApiKey = 'mockApiKey';
let mockProjectId = 'mockProjectId';
let expect = chai.expect;

chai.use(chaiAsPromised);
let stubs = {
    'request-promise': {}
};

let supportedLocales;

describe('Supported Locales', () => {
    describe('When request is successfull', () => {
        before(() => {
            stubs['request-promise'].get = sinon.stub().returns(Promise.resolve(goodResponse()));
            supportedLocales = proxyquire(path.join('..', 'src', 'smartling', 'supported-locales'), stubs)(mockApiKey, mockProjectId);
        });

        it('should retrieve locales from smartling', () => {
            let expectedResult = [ 'en-AU', 'en-GB', 'fr-CA', 'de-DE', 'ja-JP', 'es-MX' ];
            let result = supportedLocales();
            return expect(result).to.eventually.eql(expectedResult);
        });
    });

    describe('When request fails', () => {
        beforeEach(() => {
            stubs['request-promise'].get = sinon.stub().returns(Promise.reject(invalidCredentials()));
            supportedLocales = proxyquire(path.join('..', 'src', 'smartling', 'supported-locales'), stubs)(mockApiKey, mockProjectId);
        });

        it('should return an empty array', () => {
            let expectedResult = [];
            let result = supportedLocales();
            return expect(result).to.eventually.eql(expectedResult);
        });
    });
});

/*eslint-disable quotes*/
function goodResponse() {
    return '{"response":{"code":"SUCCESS","messages":[],"data":{"locales":[{"locale":"en-AU","name":"English' +
        ' (Australia)","translated":"English (Australia)"},{"locale":"en-GB","name":"English (United Kingdom)",' +
        '"translated":"English (United Kingdom)"},{"locale":"fr-CA","name":"French (Canada)","translated":"Franç' +
        'ais (Canada)"},{"locale":"de-DE","name":"German (Germany)","translated":"Deutsch"},{"locale":"ja-JP","' +
        'name":"Japanese","translated":"日本語"},{"locale":"es-MX","name":"Spanish (Mexico)","translated":"Spani' +
        'sh (Mexico)"}]}}}';
}

function invalidCredentials() {
    return '{"response":{"code":"AUTHENTICATION_ERROR","messages":["Bad credentials"],"data":null}}';
}
/*eslint-enable quotes*/
