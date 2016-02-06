'use strict';
/* global it, describe*/
let chai = require('chai');
let expect = chai.expect;
let chaiAsPromised  = require('chai-as-promised');
let path = require('path');
let sinon = require('sinon');
let Promise = require('bluebird');
let proxyquire = require('proxyquire').noPreserveCache();

chai.use(chaiAsPromised);

let postStub = sinon.stub();

let uploadMissing = proxyquire(path.join('..', 'src', 'upload-missing'), {
    'request-promise': {
        post: postStub
    }
});

describe('Upload missing', () => {
    describe('When upload is successful', () => {
        it('should return a list of success uploaded files', () => {
            var successResponse = '{"response":{"code":"SUCCESS","messages":[],"data":{"wordCount":45,"stringCount":3,"overWritten":true}}}';//eslint-disable-line quotes
            postStub.returns(Promise.resolve(successResponse));
            let upload = uploadMissing();
            let result = upload(missingLocalFiles());

            expect(result).to.eventually.have.deep.property('rootUploaded').and.to.not.be.empty;
            expect(result).to.eventually.have.deep.property('siblingUploaded').and.to.not.be.empty;

            expect(result).to.eventually.have.deep.property('rootFailed').and.to.be.empty;
            return expect(result).to.eventually.have.deep.property('siblingFailed').and.to.be.empty;
        });
    });
});

//This are files that are present locally but not on Smartling repository of files.
function missingLocalFiles() {
    return [
        {
            absolutePath: '/Users/hyeomans/dev/my-opentable/Web/Resources/Errors.resx',
            relativePath: 'Web/Resources/Errors.resx',
            fileUri: 'https://api.smartling.com/v1/file/get?apiKey=mockApiKey&fileUri=./Web/Resources/Errors.resx&projectId=mockProjectId',
            upload: {
                uri: 'https://api.smartling.com/v1/file/upload',
                params: [
                    [ 'apiKey', 'mockApiKey' ],
                    [ 'projectId', 'mockProjectId' ],
                    [ 'fileUri', './Web/Resources/Errors.resx' ],
                    [ 'fileType', 'resx' ]
                ]
            },
            siblings: [{
                absolutePath: '/Users/hyeomans/dev/my-opentable/Web/Resources/Errors.en-AU.resx',
                relativePath: 'Web/Resources/Errors.en-AU.resx',
                fileUri: 'https://api.smartling.com/v1/file/get?apiKey=mockApiKey&fileUri=./Web/Resources/Errors.resx&projectId=mockProjectId&locale=en-AU',
                upload: {
                    uri: 'https://api.smartling.com/v1/file/import',
                    params: [
                        ['apiKey', 'mockApiKey'],
                        ['projectId', 'mockProjectId'],
                        ['fileUri', './Web/Resources/Errors.resx'],
                        ['locale', 'en-AU'],
                        ['overwrite', 1],
                        ['translationState', 'PUBLISHED'],
                        ['fileType', 'resx']
                    ]
                },
                tempPath: undefined
            }],
            tempPath: undefined
        }
    ];
}
