var format      = require('stringformat');
var Promise     = require('bluebird');
var filewalker  = require('filewalker');
var fs          = require('fs');
var writeFile   = Promise.promisify(fs.writeFile);

module.exports = function (path, extension, locales) {
  if(!extension || !locales || locales.length === 0) {
    throw new Error('Extension and locales are needed');
  }
  supportedLocales = locales;
  fileExtension = extension;
  projectRootPath = path;

  return getRootFiles(projectRootPath, ignoreFilesRegex(supportedLocales, fileExtension))
    .then(function(files) {
      return appendSiblings(files, supportedLocales);
    })
    .catch(function (err) {
      console.log('There was an error while trying to recurse the file directory:', err);
      return [];
    });
}


function appendSiblings(files, supportedLocales) {
  files.forEach(function (file) {
    supportedLocales.forEach(function (locale) {
      if(!file.siblings) {
        file.siblings = [];
      }
      var fullPathSplitted = file.absolutePath.split(fileExtension);
      var relativePathSplitted = file.relativePath.split(fileExtension);

      file.siblings.push({
        fileUri: './' + file.relativePath,
        locale: locale,
        absolutePath: fullPathSplitted[0] + locale + '.' + fileExtension,
        relativePath: relativePathSplitted[0] + locale + '.' + fileExtension
      });
    });
  });
  return files;
}

function getRootFiles(path, matchRegex) {
    var options = {
        maxPending: 10,
        matchRegExp: matchRegex
    };

    var files = [];
    return new Promise(function (resolve, reject) {
      filewalker(path, options)
        .on('file', function(p, s, a) {
          files.push({
            absolutePath: a,
            relativePath: p,
            fileUri: './' + p
          });
        })
        .on('error', function(err) {
          console.error(err);
          reject(err);
        })
        .on('done', function() {
          resolve(files);
        })
      .walk();
    });
}

function ignoreFilesRegex(supportedLocales, fileExtension) {
  var ingnoreLocales = supportedLocales.map(function (locale, index) {
    if(index === 0) {
      return '('+ locale + '|';
    }
    if(index === supportedLocales.length -1) {
      return locale + ')';
    }
    return locale + '|';
  });
  var ignoreRegex = format('^(?!.*\\.{0}\\.{1}).*\\.{1}$', ingnoreLocales.join(''), fileExtension);
  return new RegExp(ignoreRegex, 'g');
}