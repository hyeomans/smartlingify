//var argv = require('yargs').argv;
//var apiKey = argv.apiKey;
//var projectId = argv.projectId;
//var fileExtension = argv.fileExtension;
//
//var rootPath = argv.path || './';
//var verbose = argv.verbose || false;
//var downloadFlag = argv.download;
//
//var recurseFiles = require('./recurseFileDirectory');
//var downloadFiles = require('./downloadFiles')(apiKey, projectId);
//var sanityCheck = require('./sanityCheck')(apiKey, projectId);

//TODO: Get locales from smartling project
var supportedLocales = ['en-AU', 'de-DE', 'ja-JP', 'es-MX', 'fr-CA', 'en-GB', 'en-gb'];

if(downloadFlag) {
    recurseFiles(rootPath, fileExtension, supportedLocales)
        .then(function (files) {
            return downloadFiles(files, verbose);
        })
        .then(function (report) {
            console.log('The following files were not found in Smartling:');
            report.forEach(function (file) {
                console.log(file.fileUri);
            });
            console.log('This means that you have this file locally but you have not uploaded the file');
        })
        .catch(function (err) {
            console.log('There was an error:', err);
        });
}

if(argv.check) {
    recurseFiles(rootPath, fileExtension, supportedLocales)
        .then(function (files) {
            return sanityCheck(files, verbose);
        })
        .then(function (report) {
            var sorted = report.size.sort(function (a, b) {
                return a.sizeDifference - b.sizeDifference;
            });

            console.log(sorted);
        });
}

