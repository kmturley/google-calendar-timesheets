angular.module('app', ['ngMaterial', 'angular-google-gapi'])

    .run(['GAuth', 'GApi', 'GData', '$rootScope', 'Calendar', function(GAuth, GApi, GData, $rootScope, Calendar) {
            var CLIENT = '794593620611-ed2tdnf8lsrvbmr8iu7urs5tntp2bpgi.apps.googleusercontent.com';
            GApi.load('calendar','v3');
            GAuth.setClient(CLIENT);
            GAuth.setScope('https://www.googleapis.com/auth/calendar');
            GAuth.checkAuth().then(function(user) {
                    $rootScope.user = user;
                    Calendar.getEvents();
                }, function() {
                    console.log('run.login');
                }
            );
        }
    ])

    .factory('Calendar', ['GApi', 'orderByFilter', function(GApi, orderByFilter) {
        return {
            dayStart: new Date(),
            events: [],
            reports: [],
            getEvents: function () {
                var me = this;
                this.dayStart.setHours(0);
                this.dayStart.setMinutes(0);
                this.dayStart.setSeconds(0);
                this.dayEnd = new Date(this.dayStart.getFullYear(), this.dayStart.getMonth(), this.dayStart.getDate(), 24, 0, 0);
                var params = {
                    'calendarId': 'primary',
                    'timeMin': this.dayStart.toISOString(),
                    'timeMax': this.dayEnd.toISOString(),
                    'singleEvents': true,
                    'orderBy': 'startTime'
                };
                GApi.execute('calendar', 'events.list', params).then(function(resp) {
                    var totals = {};
                    angular.forEach(resp.items, function(item) {
                        var split = item.summary.split(/\[(.*?)\]/g);
                        var dateStart = new Date(item.start.dateTime || item.start.date);
                        var dateEnd = new Date(item.end.dateTime || item.end.date);
                        var dateLength = (dateEnd - dateStart) / 1000 / 60 / 60;
                        item.code = split[1];
                        item.name = split[2] || item.summary;
                        if (!totals[item.code]) {
                            totals[item.code] = {
                                code: item.code || 'unknown',
                                name: item.name,
                                total: dateLength
                            };
                        } else {
                            totals[item.code].total += dateLength;
                        }
                    })
                    var list = [];
                    angular.forEach(totals, function(total) {
                        list.push(total);
                    });
                    me.events = resp.items;
                    me.reports = orderByFilter(list, 'total', true);
                }, function(e) {
                    console.log('getEvents.error', e);
                });
            },
            saveEvent: function (event) {
                var me = this;
                var params = {
                    calendarId: 'primary',
                    eventId: event.id,
                    resource: event
                };
                GApi.execute('calendar', 'events.update', params).then(function(resp) {
                    me.getEvents();
                }, function(e) {
                    console.log('saveEvent.error', e);
                });
            }
        };
    }])

    .controller('MainCtrl', ['$scope', 'GAuth', 'Calendar', '$timeout', function($scope, GAuth, Calendar, $timeout) {
        $scope.calendar = Calendar;

        $scope.login = function() {
            GAuth.login().then(function(user) {
                $scope.user = user;
                Calendar.getEvents();
            }, function(e) {
                console.log('login.error', e);
            });
        };

        $scope.loadDate = function(date, measure) {
            Calendar.dayStart = new Date(date.getTime() + (measure * 1000 * 60 * 60 * 24));
            $scope.onDateChange();
        };

        $scope.onDateChange = function () {
            if ($scope.timeout) {
                $timeout.cancel($scope.timeout);
            }
            $scope.timeout = $timeout(function() {
                Calendar.getEvents();
            }, 500);
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
    }]);