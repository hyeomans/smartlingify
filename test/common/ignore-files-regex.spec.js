'use strict';
/* global it, describe */
let chai            = require('chai');
let expect          = chai.expect;
let ignoreFilesRegex = require(process.cwd() + '/src/common/ignore-files-regex');

describe('Ignore locales regex', function() {
    it('should return the correct regex', function () {
        let supportedLocales = ['es-MX', 'en-IE'];
        let extension = 'resx';
        let result = ignoreFilesRegex(supportedLocales, extension);
        expect(result).to.eql(/^(?!.*\.(es-MX|en-IE)\.resx).*\.resx$/gi);
    });
});
