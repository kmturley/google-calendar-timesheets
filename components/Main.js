angular.module('Main', [])

    .controller('Main', ['$scope', 'Auth', 'Calendar', '$timeout', function($scope, Auth, Calendar, $timeout) {
        $scope.auth = Auth;
        $scope.calendar = Calendar;

        $scope.loadDate = function(date, measure) {
            Calendar.dayStart = new Date(date.getTime() + (measure * 1000 * 60 * 60 * 24));
            $scope.onDateChange();
        };

        $scope.onDateChange = function () {
            if ($scope.timeout) {
                $timeout.cancel($scope.timeout);
            }
            $scope.timeout = $timeout(function() {
                Calendar.getEvents($scope.auth.user.email);
            }, 500);
        };

        $scope.onItemClick = function(event) {
            event.stopPropagation();
        };

        $scope.onCheckbox = function (event) {
            Calendar.updateReport();
        };

        $scope.onChange = function(event) {
            if (event.code) {
                event.summary = '[' + event.code + '] ' + event.name;
            } else {
                event.summary = event.name;
            }
            if ($scope.timeout) {
                $timeout.cancel($scope.timeout);
            }
            $scope.timeout = $timeout(function() {
                Calendar.saveEvent(event);
            }, 500);
        };

        $scope.downloadReport = function() {
            var data = angular.copy(Calendar.reports);
            data.unshift({
                code: 'Code',
                name: 'Name',
                total: 'Hours'
            });
            var content = new CSV(data).encode();
            console.log('downloadReport', content);
            var a = document.createElement('a');
            a.href = 'data:text/csv,' + encodeURIComponent(content);
            a.setAttribute('download', 'report.csv');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        $scope.$watch('auth.user', function(newValue, oldValue) {
            console.log('auth.user', newValue);
            if (newValue) {
                Calendar.getEvents($scope.auth.user.email);
            }
        });
    }]);