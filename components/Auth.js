angular.module('Auth', [])

    .factory('Auth', ['GAuth', 'Calendar', function(GAuth, Calendar) {
        return {
            user: null,
            init: function() {
                var me = this;
                var CLIENT = '794593620611-ed2tdnf8lsrvbmr8iu7urs5tntp2bpgi.apps.googleusercontent.com';
                GAuth.setClient(CLIENT);
                GAuth.setScope('https://www.googleapis.com/auth/calendar');
                GAuth.checkAuth().then(function(user) {
                        console.log('init.success', user);
                        me.user = user;
                        Calendar.getEvents();
                    }, function() {
                        console.log('init.error');
                    }
                );
            },
            login: function () {
                var me = this;
                GAuth.login().then(function(user) {
                    console.log('login.success', user);
                    me.user = user;
                    Calendar.getEvents();
                }, function(e) {
                    console.log('login.error', e);
                });
            },
            logout: function() {
                var me = this;
                GAuth.logout().then(function() {
                    console.log('logout.success');
                    //window.open('https://accounts.google.com/logout');
                    me.user = null;
                }, function(e) {
                    console.log('logout.error', e);
                });
            }
        };
    }]);