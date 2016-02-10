'use strict';
/* global it, describe, beforeEach */
let chai = require('chai');
let expect = chai.expect;
let path = require('path');
let options;
let recurseFiles;

describe('Recurse Files', () => {
    it('should fail if smartling values are not provided', () => {
        expect(() => {
            require(path.join('..', '..', 'src', 'smartling', 'recurse-files'))({});
        }).to.throw('Smartling Api key and Project Id are required.');
    });

    it('should fail if values are not provided', () => {
        expect(() => {
            require(path.join('..', '..', 'src', 'smartling', 'recurse-files'))({smartlingApiKey: 'apiKey', smartlingProjectId: 'projectId'});
        }).to.throw('Path, extension and locales are needed');
    });

    describe('Fill up files array', () => {
        beforeEach(() => {
            options = {
                path: path.join('.', 'test', 'recurse', 'sample'),
                extension: 'resx',
                locales: [ 'en-AU', 'en-GB', 'fr-CA', 'de-DE', 'ja-JP', 'es-MX' ],
                smartlingApiKey: 'mockApi',
                smartlingProjectId: 'mockProject'
            };

            recurseFiles = require(path.join('..', '..', 'src', 'smartling', 'recurse-files'))(options);
        });

        it('result should get desired interface', () => {
            let result = recurseFiles();
            expect(result).to.eventually.have.deep.property('[0].absolutePath');
            expect(result).to.eventually.have.deep.property('[0].upload');
            expect(result).to.eventually.have.deep.property('[0].relativePath');
            return expect(result).to.eventually.have.deep.property('[0].fileUri');
        });

        it('should retrieve siblings of root files', () => {
            let result = recurseFiles();
            expect(result).to.eventually.have.deep.property('[0].siblings');
            expect(result).to.eventually.have.deep.property('[0].siblings[0].absolutePath');
            return expect(result).to.eventually.have.deep.property('[0].siblings[0].upload');
        });

        it('should remove non-existent siblings', () => {
            let result = recurseFiles();
            return result.then((files) => {
                //Given arrays can swith order we have to verify each one.
                for(var file = 0; file < files.length; file += 1) {
                    if(files[file].relativePath === 'complete/Index.cshtml.resx') {
                        expect(files[file]['siblings']).to.have.length(6);
                    } else {
                        expect(files[file]['siblings']).to.have.length(2);
                    }
                }
            });
        });
    });
});
