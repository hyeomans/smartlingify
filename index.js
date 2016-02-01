var argv = require('yargs').argv;
var apiKey = argv.apiKey;
var projectId = argv.projectId;
var fileExtension = argv.fileExtension;

var rootPath = argv.path || './';
var verbose = argv.verbose || false;
var recurseFiles = require('./recurseFileDirectory');
var downloadFiles = require('./downloadFiles')(apiKey, projectId);

//TODO: Get locales from smartling project
var supportedLocales = ['en-AU', 'de-DE', 'ja-JP', 'es-MX', 'fr-CA', 'en-GB'];

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