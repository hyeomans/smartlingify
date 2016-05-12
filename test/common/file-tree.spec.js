'use strict';
/* global it, describe, before, beforeEach */
let chai            = require('chai');
let expect          = chai.expect;
let locales         = [ 'en-AU', 'en-GB', 'fr-CA', 'de-DE', 'ja-JP', 'es-MX' ];
let extension       = 'resx';
let sampleDirectory = process.cwd() + '/test/common/sample';
let params = {
    path: sampleDirectory,
    supportedLocales: locales,
    extension: extension
};

let fileTree        = require(process.cwd() + '/src/common/file-tree')(params);

describe('File tree', () => {
    it('should return a immutable list of immutable maps', () => {
        return fileTree().then((result) => {
            expect(result.size).to.equal(2);
        });
    });
});
