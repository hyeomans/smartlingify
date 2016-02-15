require('../styles/main.scss');
var angular     = require('angular');
var uiRouter    = require('angular-ui-router');
var app         = angular.module('app', [uiRouter]);

require('./configuration')(app);
