angular.module('Calendar', [])

    .factory('Calendar', ['GApi', '$filter', function(GApi, $filter) {
        return {
            dayStart: new Date(),
            dayEnd: new Date(),
            events: [],
            reports: [],
            hours: 0,
            init: function() {
                GApi.load('calendar','v3');
                this.dayStart.setHours(0);
                this.dayStart.setMinutes(0);
                this.dayStart.setSeconds(0);
            },
            getEvents: function (email) {
                var me = this;
                this.dayEnd = new Date(this.dayStart.getFullYear(), this.dayStart.getMonth(), this.dayStart.getDate(), 24, 0, 0);
                var params = {
                    'calendarId': 'primary',
                    'timeMin': this.dayStart.toISOString(),
                    'timeMax': this.dayEnd.toISOString(),
                    'singleEvents': true,
                    'orderBy': 'startTime'
                };
                GApi.execute('calendar', 'events.list', params).then(function(resp) {
                    var items = [];
                    angular.forEach(resp.items, function(item) {
                        // if user is the organizer, include in report
                        if (item.organizer && item.organizer.email === email) {
                            item.included = true;
                        }
                        // if user is an attendee, include in report
                        if (item.attendees) {
                            var attendee = $filter('filter')(item.attendees, {email: email})[0];
                            if (attendee) {
                                item.included = attendee.responseStatus === 'accepted' ? true : false;
                            }
                        }
                        var split = item.summary.split(/\[(.*?)\]/g);
                        item.code = split[1];
                        item.name = split[2] || item.summary;
                        items.push(item);
                    });
                    me.events = items;
                    me.updateReport();
                    console.log('getEvents', me.events);
                }, function(e) {
                    console.log('getEvents.error', e);
                });
            },
            updateReport: function () {
                var me = this;
                var totals = {};
                var hours = 0;
                angular.forEach(me.events, function(item) {
                    if (item.included) {
                        var dateStart = new Date(item.start.dateTime || item.start.date);
                        var dateEnd = new Date(item.end.dateTime || item.end.date);
                        var dateLength = (dateEnd - dateStart) / 1000 / 60 / 60;
                        if (!totals[item.code]) {
                            totals[item.code] = {
                                code: item.code || 'unknown',
                                name: item.name,
                                total: dateLength
                            };
                        } else {
                            totals[item.code].total += dateLength;
                        }
                        hours += dateLength;
                    }
                });
                var array = [];
                angular.forEach(totals, function(total) {
                    array.push(total);
                });
                me.hours = hours;
                me.reports = $filter('orderBy')(array, 'total', true);
                console.log('updateReport', me.hours, me.reports);
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