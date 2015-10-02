/* global angular $ */
var app = angular.module('app', []);

app.controller("MainCtrl", ['$scope', '$interval', '$timeout', function(scope, $interval, $timeout) {
    angular.extend(scope, {
        money: 15,
        time: 1
    });
}]);
