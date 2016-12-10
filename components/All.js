angular.module('All', [
        'ngMaterial',
        'angular-google-gapi',
        'Auth',
        'Calendar',
        'Main'
    ])

    .run(['Auth', 'Calendar', function(Auth, Calendar) {
        Auth.init();
        Calendar.init();
    }]);