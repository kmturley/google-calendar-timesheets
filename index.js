var CLIENT_ID = '794593620611-ed2tdnf8lsrvbmr8iu7urs5tntp2bpgi.apps.googleusercontent.com';
var SCOPES = ["https://www.googleapis.com/auth/calendar"];
var events = [];
var currentEvent = 0;

function checkAuth() {
    gapi.auth.authorize(
        {
            'client_id': CLIENT_ID,
            'scope': SCOPES.join(' '),
            'immediate': true
        }, handleAuthResult);
}

function handleAuthResult(authResult) {
    var authorizeDiv = document.getElementById('authorize-div');
    if (authResult && !authResult.error) {
        authorizeDiv.style.display = 'none';
        loadCalendarApi();
    } else {
        authorizeDiv.style.display = 'inline';
    }
}

function handleAuthClick(event) {
    gapi.auth.authorize(
        {client_id: CLIENT_ID, scope: SCOPES, immediate: false},
        handleAuthResult);
    return false;
}

function loadCalendarApi() {
    gapi.client.load('calendar', 'v3', listUpcomingEvents);
}

function listUpcomingEvents() {
    var todayStart = new Date();
    todayStart.setHours(0);
    todayStart.setMinutes(0);
    todayStart.setSeconds(0);
    var todayEnd = new Date();
    todayEnd.setHours(24);
    todayEnd.setMinutes(0);
    todayEnd.setSeconds(0);
    var request = gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': todayStart.toISOString(),
        'timeMax': todayEnd.toISOString(),
        'singleEvents': true,
        'orderBy': 'startTime'
    });

    request.execute(function(resp) {
        events = resp.items;
        var items = {};
        var html = '<table class="table">';
        html += '<tr class="head"><td>Job code</td><td>Date</td><td>Length</td><td>Name</td></tr>';
        for (i = 0; i < events.length; i++) {
            var event = events[i];

            // agenda view
            var dateStart = new Date(event.start.dateTime || event.start.date);
            var dateEnd = new Date(event.end.dateTime || event.end.date);
            var eventLength = (dateEnd - dateStart) / 1000 / 60 / 60;
            var job = events[i].summary.split(/\[(.*?)\]/g),
                id = job[1] || 'unknown';
            var code = '<a class="add" onclick="add(' + i + ')">+</a>';
            if (job[1]) {
                code = job[1];
            }
            html += '<tr><td>' + code + '</td><td>' + getUTCTimeString(dateStart) +'</td><td>' + eventLength + '</td><td>' + event.summary + '</td></tr>';

            // totals view

            if (!items[id]) {
                items[id] = {
                    id: id,
                    title: events[i].summary,
                    total: eventLength
                };
            } else {
                items[id].total += eventLength;
            }
        }
        // agenda view
        html += '</table>';
        document.getElementById('agenda').innerHTML = html;

        // totals view
        var html2 = '<table class="table">';
        html2 += '<tr class="head"><td>Job code</td><td>Total</td><td>Name</td></tr>';
        for (var item in items) {
            html2 += '<tr><td>' + items[item].id + '</td><td>' + items[item].total + '</td><td>' + items[item].title + '</td></tr>';
        }
        html2 += '</table>';
        document.getElementById('report').innerHTML = html2;
    });
};

function add(index) {
    currentEvent = index;
    document.getElementById('form').className = '';
    document.getElementById('id').value = events[index].id;
};

function onSubmit(event) {
    event.preventDefault();
    document.getElementById('form').className = 'hide';
    events[currentEvent].summary = '[' + document.getElementById('code').value + '] ' + events[currentEvent].summary;

    var request = gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: document.getElementById('id').value,
        resource: events[currentEvent]
    });
    request.execute(function(resp) {
        console.log(resp);
        listUpcomingEvents();
    });
};

function addZero(num) {
    if (num < 10) { num = '0' + num; }
    return num;
};

function getDateString(date) {
    return addZero(date.getDate()) + '-' + addZero(date.getMonth() + 1) + '-' + addZero(date.getFullYear());
};

function getUTCTimeString(date) {
    return addZero(date.getHours()) + ':' + addZero(date.getMinutes());
};