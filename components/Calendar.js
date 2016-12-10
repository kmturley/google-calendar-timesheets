angular.module('Calendar', [])

    .factory('Calendar', ['GApi', 'orderByFilter', function(GApi, orderByFilter) {
        return {
            dayStart: new Date(),
            events: [],
            reports: [],
            init: function() {
                GApi.load('calendar','v3');
            },
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