"use strict";

angular.module('liveDocuApp')

    .factory('focus', function($timeout, $window) {
        return function(id) {
            $timeout(function() {
                var element = window.document.getElementById(id);
                if (element) {
                    element.focus();
                    var range = document.createRange();
                    range.selectNodeContents(element);
                    range.collapse(false);
                    var sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
            });
        };
    })

    .service('config', ['$http',function($http){
        var config = {};
        $http.get('/config.json').
        then(function(res){
            if (res.status == 200 && res.data)
                angular.copy(res.data,config);
        });
        return function () {
            return config;
        }
    }])

    .service('piecemaker2', ['$rootScope','config',function($rootScope,config){

        var authService = {},
            apiClient = undefined,
            apiKey = undefined;

        var reset = function () {
            apiClient = undefined, apiKey = undefined;
        };

        authService.login = function (user) {
            reset();
            var pm2 = new PieceMakerApi(config().piecemaker);
            $rootScope.isLoggedIn = false;
            $rootScope.currentUser = undefined;
            pm2.login(user.email,user.password,function(api_key){
                apiClient = pm2;
                apiKey = api_key;
                $rootScope.isLoggedIn = true;
                $rootScope.$digest();
                pm2.whoAmI(function(pm2_user){
                    $rootScope.currentUser = pm2_user;
                    $rootScope.$digest();
                });
            });
        };

        authService.getApiKey = function () {
            return apiKey;
        };

        authService.getClient = function () {
            // TODO: good idea? what if it is being stored elsewhere …?
            return apiClient;
        };

        authService.logout = function () {
            apiClient = undefined;
            $rootScope.isLoggedIn = false;
            $rootScope.$digest();
        };

        return authService;
    }]);