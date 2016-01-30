var __dirname = '/Users/hyeomans/dev/my-opentable';

var smartlingListFiles = 'https://api.smartling.com/v1/file/list?apiKey=' +
    '{0}' +
    '&projectId=' +
    '{1}';

var localeList = 'https://api.smartling.com/v1/project/locale/list?apiKey={0}&projectId={1}';

var createHash = require('crypto').createHash,
    filewalker = require('filewalker'),
    rp = require('request-promise'),
    cheerio = require('cheerio'),
    format = require('stringformat'),
    Promise = require('bluebird'),
    writeFile = Promise.promisify(require("fs").writeFile),
    statFile = Promise.promisify(require('fs').stat),
    readFile = Promise.promisify(require("fs").readFile);

//Promise.props({
//    online: fileListFromSmartling(),
//    local: directoryTree()
//}).then(function (data) {
//    console.log(data.local);
//});

directoryTree()
    .then(function (tree) {
        console.log('downloading');
        return downloadLocaleFiles(tree);
    });

function downloadRootFiles(rootFiles) {
    var keys = Object.keys(rootFiles);
    return Promise.all(keys.map(function (key) {
        return downloadFile(key, rootFiles[key]);
    }));
}

function downloadLocaleFiles(tree) {
    var keys = Object.keys(tree);
    var supportedLocales = ["en-AU", "de-DE", "ja-JP", "es-MX", "fr-CA", "en-GB"];
    supportedLocales.forEach(function (locale) {
        return Promise.all(keys.map(function (key) {
            return downloadFile(key, tree[key], locale);
        }));
    });
}

function downloadFile(fileUri, fileObject, locale) {
    var url = 'https://api.smartling.com/v1/file/get{0}';
    var queryString = '?apiKey={apiKey}&fileUri={fileUri}&projectId={projectId}';

    var fullUrl;

    if(locale) {
        queryString += '&locale={locale}';
    }

    fullUrl = format(format(url, queryString), { apiKey: apiKey, fileUri: fileUri, projectId: projectId, locale: locale });
    return rp(fullUrl)
        .then(function (response) {
            console.log(fileObject.fullPath);
            return writeFile(fileObject.fullPath, response, 'utf8').catch(function () {
                console.log('There was an error writing the contents of file:', fileUri);
            });
        })
        .catch(function (err) {
            console.error('----------');
            console.log('There was an error downloading file:', fullUrl);
            console.log('The error says:', err.message);
            console.error('----------');
        });
}

function addMetaData(localFiles, onlineFiles) {
    var key = Object.keys(localFiles)[0];
    var firstOne = localFiles[key];
    var onlineData = onlineFiles[key];
    var getFileNameMeta = 'Smartling_GetFile';
    var uploadFileNameMeta = 'Smartling_UploadFileUrl';
    var uploadFileParamsNameMeto = 'Smartling_UploadFileParams';
    var lastUpdatedMeta = 'Smartling_LastDateUploaded';
    var smartlingGetFile = 'https://api.smartling.com/v1/file/get?apiKey={0}&projectId={1}&fileUri={2}';
    var uploadFileUrl = 'https://api.smartling.com/v1/file/upload';

    return readFile(firstOne.fullPath, 'utf8').then(function(file) {
        return cheerio.load(file, { xmlMode: true , decodeEntities: false, normalizeWhitespace: false });
    }).then(function($) {
        var propMeta = format("metadata[name='{0}']");
        var alreadyFileUri = $(format(propMeta, getFileNameMeta));
        var alreadyUploadUri = $(format(propMeta, uploadFileNameMeta));
        var lastUpdatedProp = $(format(propMeta, lastUpdatedMeta));

        if(alreadyFileUri !== '') {
            $('root').append(format(metadata(getFileNameMeta, format(smartlingGetFile, apiKey, projectId, onlineData.fileUri))));
        }

        if(alreadyUploadUri !== '') {
            //Actualizar uri
            $('root').append(format(metadata(uploadFileNameMeta, uploadFileUrl)));
        }

        //Agregar parametros

        $('root').append()
        //$('root').append(format(metadata(lastUpdatedMeta, format(lastUpdatedProp, onlineData.lastUploaded))));

        console.log(onlineData);
        return $.html();
    }).then(function(content) {
        return writeFile(firstOne.fullPath, content, 'utf8');
    });
}

function metadata(name, value) {
    return format('<metadata name={0}><value>{1}</value></metadata>', name, value);
}

function fileListFromSmartling() {
    return rp.get(smartlingListFiles)
        .then(function (list) {
            return JSON.parse(list);
        })
        .then(function (response) {
            var onlineDb = {};
            var fileList = response['response']['data']['fileList'];
            onlineDb['count'] = response['response']['data']['fileCount'];
            return fileList.reduce(function (localDb, file) {
                localDb[file['fileUri']] = {
                    lastUploaded: file['lastUploaded'],
                    fileUri: file['fileUri']
                };
                return localDb;
            }, onlineDb);
        })
}

function directoryTree() {
    var directoryTree;
    return getRootFiles()
        .then(getLocalSiblings)
        .then(function (rootList) {
            directoryTree = rootList;
            return resolveLocalSiblings(rootList);
        });
}

function getLocalSiblings(rootList) {
    var supportedLocales = ["en-AU", "en-IE", "de-DE", "ja-JP", "es-MX", "fr-CA", "en-GB"];
    return Object.keys(rootList).reduce(function (prev, current) {
        prev[current].siblings = supportedLocales.map(function (locale) {
            var fullPath = prev[current].fullPath;
            return fullPath.replace(/\.resx/, format('.{0}.resx', locale));
        });

        return prev;
    }, rootList);
}

function resolveLocalSiblings(rootList) {
    var allPromises = [];
    Object.keys(rootList).forEach(function (key) {
        allPromises.push(resolveSiblingPerRootFile(rootList[key]));
    });

    return Promise.all(allPromises).then(function () { return rootList; });
}

function resolveSiblingPerRootFile(filePath) {
    return Promise.all(filePath.siblings.map(function (filePath) {
        return statFile(filePath).then(function () {
            return filePath;
        }).catch(function () {
            return void(0);
        });
    })).then(function (filePaths) {
        return filePaths.filter(function (path) { return !!path; })
    }).then(function (filePaths) {
        delete filePath['siblings'];
        filePath.resolvedSiblings = filePaths;
        return filePath;
    });
}

function getRootFiles() {
    var options = {
        maxPending: 10, // throttle handles,
        matchRegExp: /^(?!.*\.(en-AU|en-IE|de-DE|ja-JP|es-MX|fr-CA|en-GB|en-gb)\.resx).*\.resx$/g
    };
    var db = {};
    return new Promise(function (resolve, reject) {
        filewalker(__dirname, options)
            .on('stream', function(rs, p, _, fullPath) {
                var hash = createHash('md5');
                rs.on('data', function(data) {
                    hash.update(data);
                });
                rs.on('end', function(data) {
                    var digest = hash.digest('hex');
                    var rootPath = './'+p;
                    db[rootPath] = {
                        md5: digest,
                        fullPath: fullPath
                    };
                });
            })
            .on('error', function(err) {
                reject(err);
            })
            .on('done', function() {
                resolve(db);
            })
            .walk();
    });
}




