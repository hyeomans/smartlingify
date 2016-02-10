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

let sinonRp = sinon.stub();

let stubs = {
    'request-promise': {
        get: sinonRp
    }
};

let downloadFiles = proxyquire(path.join('..', '..', 'src', 'smartling', 'download-files'), stubs);

describe('Download files', () => {
    it('should be fullfilled', () => {
        sinonRp.returns(Promise.resolve(''));
        let result = downloadFiles();
        return expect(result(files())).to.eventually.fulfilled;
    });

    it('should add a new property to files', () => {
        let rootFileUri = 'https://api.smartling.com/v1/file/get?apiKey=mockApiKey&fileUri=./Models/Resources/ErrorMessages.resx&projectId=mockProjectId';
        let siblingUri = 'https://api.smartling.com/v1/file/get?apiKey=mockApiKey&fileUri=./Models/Resources/ErrorMessages.resx&projectId=mockProjectId&locale=en-AU';
        let nonExistentSibling = 'https://api.smartling.com/v1/file/get?apiKey=mockApiKey&fileUri=./Models/Resources/ErrorMessagess.resx&projectId=mockProjectId&locale=en-GB';

        sinonRp.withArgs(rootFileUri).returns(Promise.resolve(''));
        sinonRp.withArgs(siblingUri).returns(Promise.resolve(''));
        sinonRp.withArgs(nonExistentSibling).returns(Promise.reject(''));

        let download = downloadFiles();
        let result = download(files());
        expect(result).to.eventually.have.deep.property('[0].tempPath', '.tmp/Models/Resources/ErrorMessages.resx');
        expect(result).to.eventually.have.deep.property('[0].siblings[0].tempPath', '.tmp/Models/Resources/ErrorMessages.en-AU.resx');
        return expect(result).to.eventually.have.deep.property('[0].siblings[1].tempPath', void(0));
    });
});

function files() {
    return [
        {
            absolutePath: '/Users/hyeomans/dev/my-opentable/Models/Resources/ErrorMessages.resx',
            relativePath: 'Models/Resources/ErrorMessages.resx',
            fileUri: 'https://api.smartling.com/v1/file/get?apiKey=mockApiKey&fileUri=./Models/Resources/ErrorMessages.resx&projectId=mockProjectId',
            upload: {
                uri: 'https://api.smartling.com/v1/file/upload'
            },
            siblings: [
                {
                    absolutePath: '/Users/hyeomans/dev/my-opentable/Models/Resources/ErrorMessages.en-AU.resx',
                    relativePath: 'Models/Resources/ErrorMessages.en-AU.resx',
                    fileUri: 'https://api.smartling.com/v1/file/get?apiKey=mockApiKey&fileUri=./Models/Resources/ErrorMessages.resx&projectId=mockProjectId&locale=en-AU'
                },
                {
                    absolutePath: '/Users/hyeomans/dev/my-opentable/Models/Resources/ErrorMessages.en-GB.resx',
                    relativePath: 'Models/Resources/ErrorMessages.en-GB.resx',
                    fileUri: 'https://api.smartling.com/v1/file/get?apiKey=mockApiKey&fileUri=./Models/Resources/ErrorMessagess.resx&projectId=mockProjectId&locale=en-GB'
                }
            ]
        }];
}

