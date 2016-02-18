'use strict';
/* global it, describe, beforeEach*/
let chai = require('chai');
let expect = chai.expect;
let path        = require('path');
let sinon       = require('sinon');
let Promise     = require('bluebird');
let proxyquire  =  require('proxyquire').noPreserveCache();
let readJson    = Promise.promisify(require('fs-extra').readFile);

const apiKey = 'mockApiKey';
const projectId = 'mockProjectId';
const locales = ['en-AU', 'de-DE', 'ja-JP', 'es-MX', 'fr-CA', 'en-GB'];

describe('Download missing file', () => {
    describe('Happy path', () => {
        let downloadMissingFiles;
        const rootFileJson = path.resolve('.', 'test', 'missing-files', 'json-mocks', 'root-file.json');
        const rootFileUri = /^https:\/\/api\.smartling\.com\/v1\/file\/list\?apiKey=mockApiKey&projectId=mockProjectId$/ig;

        const missingAuStringsJson = path.resolve('.', 'test', 'missing-files', 'json-mocks', 'missing-strings-siblings.json');
        const missingAuStringsUri = 'https://api.smartling.com/v1/file/list?apiKey=mockApiKey&projectId=mockProjectId&locale=en-AU';

        const completedStringsJson = path.resolve('.', 'test', 'missing-files', 'json-mocks', 'completed-sibling.json');
        const completedStringsUri = /^https:\/\/api\.smartling\.com\/v1\/file\/list\?apiKey=mockApiKey&projectId=mockProjectId&locale=(de-DE|ja-JP|es-MX|fr-CA|en-GB)$/ig;

        beforeEach(() => {
            let sinonRp = sinon.stub();
            sinonRp.withArgs(sinon.match(rootFileUri)).returns(readJson(rootFileJson, 'utf8'));
            sinonRp.withArgs(sinon.match(missingAuStringsUri)).returns(readJson(missingAuStringsJson, 'utf8'));

            sinonRp.withArgs(sinon.match(completedStringsUri)).returns(readJson(completedStringsJson, 'utf8'));
            sinonRp.withArgs(sinon.match(completedStringsUri)).returns(readJson(completedStringsJson, 'utf8'));
            sinonRp.withArgs(sinon.match(completedStringsUri)).returns(readJson(completedStringsJson, 'utf8'));
            sinonRp.withArgs(sinon.match(completedStringsUri)).returns(readJson(completedStringsJson, 'utf8'));

            let stubs = {
                'request-promise': {
                    get: sinonRp
                }
            };

            downloadMissingFiles = proxyquire(path.join('..', '..', 'src', 'missing-files'), stubs)(apiKey, projectId);
        });

        it('should return the expected result', () => {
            let missingFiles = downloadMissingFiles(locales, localFiles());
            return missingFiles.then((result) => {
                const diff = result.diff[Object.keys(result.diff)[0]];
                const missingStrings = result.missingStrings;
                const missingStringsAu = result.missingStrings['en-AU'];
                const restOfLanguages = [].concat.call([], missingStrings['de-DE'], missingStrings['ja-JP'], missingStrings['es-MX'], missingStrings['fr-CA'], missingStrings['en-GB']);

                expect(diff).to.eql([ 'de-DE', 'ja-JP', 'es-MX', 'fr-CA' ]);
                expect(missingStringsAu).to.not.be.empty;
                return expect(restOfLanguages).to.be.empty;
            });
        });
    });
});

function localFiles() {
    return [
        {
            absolutePath: '/Users/hyeomans/dev/my-opentable/Models/Resources/ErrorMessages.resx',
            relativePath: 'Models/Resources/ErrorMessages.resx',
            fileUri: 'https://api.smartling.com/v1/file/get?apiKey=mockApiKey&fileUri=./Models/Resources/ErrorMessages.resx&projectId=mockProjectId',
            smartlingPath: './Models/Resources/ErrorMessages.resx',
            locale: 'en-US',
            upload: {
                uri: 'https://api.smartling.com/v1/file/upload'
            },
            siblings: [
                {
                    absolutePath: '/Users/hyeomans/dev/my-opentable/Models/Resources/ErrorMessages.en-AU.resx',
                    relativePath: 'Models/Resources/ErrorMessages.en-AU.resx',
                    locale: 'en-AU',
                    fileUri: 'https://api.smartling.com/v1/file/get?apiKey=mockApiKey&fileUri=./Models/Resources/ErrorMessages.resx&projectId=mockProjectId&locale=en-AU',
                    smartlingPath: './Models/Resources/ErrorMessages.resx'
                },
                {
                    absolutePath: '/Users/hyeomans/dev/my-opentable/Models/Resources/ErrorMessages.en-GB.resx',
                    relativePath: 'Models/Resources/ErrorMessages.en-GB.resx',
                    fileUri: 'https://api.smartling.com/v1/file/get?apiKey=mockApiKey&fileUri=./Models/Resources/ErrorMessagess.resx&projectId=mockProjectId&locale=en-GB',
                    smartlingPath: './Models/Resources/ErrorMessages.resx',
                    locale: 'en-GB'
                }
            ]
        }];
}
