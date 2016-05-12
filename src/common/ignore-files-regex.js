'use strict';
var format      = require('stringformat');

module.exports = function (supportedLocales, fileExtension) {
    var ignoreLocales = ['(', supportedLocales.join('|'), ')'];
    var ignoreRegex = format('^(?!.*\\.{0}\\.{1}).*\\.{1}$', ignoreLocales.join(''), fileExtension);
    return new RegExp(ignoreRegex, 'gi');
};
