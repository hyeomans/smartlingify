'use strict';
module.exports = function (app) {
    app.config(['$stateProvider', '$urlRouterProvider', function ($stateProvider, $urlRouterProvider) {
        $urlRouterProvider.otherwise('/');

        $stateProvider
            .state('init', {
                url: '/',
                template: require('./init.html')
            })
    }]);
}
