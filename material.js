angular.module('app', ['ngMaterial', 'angular-google-gapi'])

    .run(['GAuth', 'GApi', 'GData', '$rootScope', 'Calendar', function(GAuth, GApi, GData, $rootScope, Calendar) {
            var CLIENT = '794593620611-ed2tdnf8lsrvbmr8iu7urs5tntp2bpgi.apps.googleusercontent.com';
            GApi.load('calendar','v3');
            GAuth.setClient(CLIENT);
            GAuth.setScope('https://www.googleapis.com/auth/calendar');
            GAuth.checkAuth().then(function(user) {
                    console.log('run.loggedin', user);
                    $rootScope.user = user;
                    Calendar.getEvents();
                }, function() {
                    console.log('run.login');
                }
            );
        }
    ])

    .factory('Calendar', ['GApi', function(GApi) {
        return {
            events: [],
            getEvents: function () {
                var me = this;
                console.log('getEvents');
                var todayStart = new Date();
                todayStart.setHours(0);
                todayStart.setMinutes(0);
                todayStart.setSeconds(0);
                var todayEnd = new Date();
                todayEnd.setHours(24);
                todayEnd.setMinutes(0);
                todayEnd.setSeconds(0);
                var params = {
                    'calendarId': 'primary',
                    'timeMin': todayStart.toISOString(),
                    'timeMax': todayEnd.toISOString(),
                    'singleEvents': true,
                    'orderBy': 'startTime'
                };
                GApi.execute('calendar', 'events.list', params).then(function(resp) {
                    console.log('getEvents.success', resp);
                    me.events = resp.items;
                }, function(e) {
                    console.log('getEvents.error', e);
                });
            }
        };
    }])

    .controller('MainCtrl', ['$scope', 'GAuth', 'Calendar', function($scope, GAuth, Calendar) {
        console.log('MainCtrl');

        $scope.calendar = Calendar;

        $scope.login = function() {
            console.log('login');
            GAuth.login().then(function(user) {
                console.log('login.success', user);
                $scope.user = user;
                Calendar.getEvents();
            }, function(e) {
                console.log('login.error', e);
            });
        };
    }]);