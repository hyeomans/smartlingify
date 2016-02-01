var rp          = require('request-promise');
var fs          = require('fs');
var Promise     = require('bluebird');
var writeFile   = Promise.promisify(fs.writeFile);
var format      = require('stringformat');

var apiKey;
var projectId;
var verboseMode;

module.exports = function(smartlingApiKey, smartlingProjectId) {
  if(!smartlingApiKey || !smartlingProjectId) {
    throw new Error('Both ApiKey and ProjectId are required');
  }
  projectId = smartlingProjectId;
  apiKey = smartlingApiKey;

  return function(files, verbose) {
    verboseMode = verbose;
    return dowloadSiblingFiles(files)
              .then(function () {
                return downloadRootFiles(files);
              });  
  }
};

function downloadRootFiles(files) {
  var url = 'https://api.smartling.com/v1/file/get?apiKey={apiKey}&fileUri={fileUri}&projectId={projectId}';
  return Promise.all(files.map(function (file) {
    var fullUri = format(url, { apiKey: apiKey, fileUri: file.fileUri, projectId: projectId });
    return downloadFile(file, fullUri);
  })).then(function (files) {
    return files.filter(function (file) { return !!file; });
  });
}

function dowloadSiblingFiles(files) {
  var url = 'https://api.smartling.com/v1/file/get?apiKey={apiKey}&fileUri={fileUri}&projectId={projectId}&locale={locale}';
  return Promise.all(files.map(function (file) {
    file.siblings.forEach(function (sibling) {
      var fullUrl = format(url, { apiKey: apiKey, fileUri: sibling.fileUri, projectId: projectId, locale: sibling.locale });
      return downloadFile(sibling, fullUrl);
    })
  }));
}

function downloadFile(file, url) {
  return rp(url)
          .then(function (response) {
            if(verboseMode) {
              console.log('Downloaded:', file.relativePath);
            }

            return writeFile(file.absolutePath, response, 'utf-8').catch(function (err) {
              console.log('There was an error while writing the file:', file.relativePath);
              if(verboseMode) {
                console.log('The error was:', err);
              }
            });
          })
          .catch(function (err) {
            if(verboseMode) {
              console.log('There was an error downloading:', file.relativePath);
              console.log('The error message said:', err.message);
            }
            
            return file;
          });
}