let app;

let main = function() {
    app = new Vue({
        el: '#conApp',
        data: {
            selectedStartStation: null,
            selectedDestStation: null,
            selectedViaStation: null,
            via: false,
            selectedTime: null,
            isDeparture: true,
            inputType: 0,
            stationInput: '',
            showStationList: false,
            stationList: [],
            locating: false,
            mots: {
                Tram: true,
                SuburbanRailway: true,
                Cableway: true,
                CityBus: true,
                Train: true,
                Ferry: true
            },
            searching: false,
            tripData: null
        },
        methods: {
            locateMe: function() {
                if (!this.locating) {
                    locate(true).then(list => {
                        if (list.length > 0) {
                            let station = list[0];
                            if (this.inputType == 1) this.selectedStartStation = station;
                            else if (this.inputType == 2) this.selectedViaStation = station;
                            else if (this.inputType == 3) this.selectedDestStation = station;
                            this.inputType = 0;
                            this.stationInput = '';
                        }
                    });
                }
            },
            stopSignIcon: function (type) {
                if (type == 'local') return 'history-symbol fa fa-map-marker';
                else if (type == 'history') return 'history-symbol fa fa-history';
                else return '';
            },
            chooseStop: function(station) {
                if (this.inputType == 1) this.selectedStartStation = station;
                else if (this.inputType == 2) this.selectedViaStation = station;
                else if (this.inputType == 3) this.selectedDestStation = station;
                this.inputType = 0;
                this.stationInput = '';
                addToHistory(station);
            },
            getMotPic: function (mot) {
                return "background-image:url('" + g_Mots[mot] + "')";
            },
            getRouteMotPic: function (mot) {
                return "background-image:url('" + g_Mots[mot] + "')";
            },
            getTime: function(timestamp) {
                let date = new Date(timestamp);
                let h = date.getHours().toString();
                let m = date.getMinutes().toString();
                if (h.length == 1) h = '0' + h;
                if (m.length == 1) m = '0' + m;
                return h + ':' + m + ' Uhr';
            },
            getDuration: function(minutes) {
                if (minutes == 1) return '1 Minute';
                else if (minutes < 60) return minutes + ' Minuten';
                else {
                    let res = '';
                    let h = Math.floor(minutes / 60);
                    let m = minutes % 60;
                    if (m == 0) {
                        if (h == 1) res = '1 Stunde';
                        else res = h + ' Stunden';
                    } else res = h + 'h ' + m + 'min';
                    return res;
                }
            }
        },
        computed: {
            getSelectedStartStation: function() {
                if (this.selectedStartStation == null) return { name: '', stadt: 'Startpunkt wählen'};
                else return this.selectedStartStation;
            },
            getSelectedViaStation: function () {
                if (this.selectedViaStation == null) return { name: '', stadt: 'Zwischenhalt wählen' };
                else return this.selectedViaStation;
            },
            getSelectedDestStation: function () {
                if (this.selectedDestStation == null) return { name: '', stadt: 'Endpunkt wählen' };
                else return this.selectedDestStation;
            },
            getSelectedTime: function() {
                if (this.selectedTime == null) return { time: 'Jetzt', ref: this.isDeparture ? 'Abfahrt' : 'Ankunft'};
                else {
                    let date = new Date(this.selectedTime);
                    let day = date.getDate().toString();
                    let month = (date.getMonth() + 1).toString();
                    let year = date.getFullYear().toString();
                    let hour = date.getHours().toString();
                    let min = date.getMinutes().toString();
                    if (day.length == 1) day = '0' + day;
                    if (month.length == 1) month = '0' + month;
                    if (hour.length == 1) hour = '0' + hour;
                    if (min.length == 1) min = '0' + min;
                    let tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
                    let res = '';
                    if (date.toLocaleDateString() == new Date().toLocaleDateString()) res = 'Heute';
                    else if (date.toLocaleDateString() == tomorrow.toLocaleDateString()) res = 'Morgen';
                    else res = [day, month, year].join('.');
                    res += ' ' + hour + ':' + min + ' Uhr';
                    return {
                        time: res,
                        ref: this.isDeparture ? 'Abfahrt' : 'Ankunft'
                    };
                }
            }
        },
        watch: {
            stationInput: queryStations,
            inputType: function(val) {
                if (val == 0) {
                    document.getElementById('station-popup').style.display = 'none';
                } else if (val == 1 || val == 2 || val == 3) {
                    document.getElementById('station-popup').style.display = 'block';
                    document.getElementById('date-pick-container').style.display = 'none';
                    document.getElementById('station-such-container').style.display = 'block';
                    document.querySelector('.line-input').focus();
                }
                else if (val == 4) {
                    document.getElementById('station-popup').style.display = 'block';
                    document.getElementById('station-such-container').style.display = 'none';
                    document.getElementById('date-pick-container').style.display = 'block';
                    document.querySelector('input[type="datetime-local"]').focus();
                }
            }
        }
    });
    queryStations();
    restrictDateInput();
}

let restrictDateInput = function() {
    let date = new Date();
    let picker = document.querySelector('#date-pick-container input');
    picker.min = convertToString(date);
    let nextMin = new Date(convertToString(new Date(Date.now() + 60 * 1000)));
    setTimeout(restrictDateInput, nextMin.getTime() - Date.now());
}

let convertToString = function(date) {
    let day = date.getDate().toString();
    let month = (date.getMonth() + 1).toString();
    let year = date.getFullYear().toString();
    let hour = date.getHours().toString();
    let min = date.getMinutes().toString();
    if (day.length == 1) day = '0' + day;
    if (month.length == 1) month = '0' + month;
    if (hour.length == 1) hour = '0' + hour;
    if (min.length == 1) min = '0' + min;
    return year + '-' + month + '-' + day + 'T' + hour + ':' + min;
}

let connect = function () {
    if (
        app.selectedStartStation == null || 
        app.selectedDestStation == null || 
        (app.selectedViaStation == null && app.via) ||
        app.searching
    ) return;
    app.searching = true;
    let mots = ['HailedSharedTaxi'];
    for (let mot in app.mots) {
        if (app.mots[mot]) {
            mots.push(mot);
            if (mot == 'CityBus') mots.push('IntercityBus');
        }
    }
    let time = app.selectedTime;
    if (time == null) time = new Date().toISOString();
    else time = new Date(time).toISOString();
    let requestData = {
        origin: app.selectedStartStation.id,
        destination: app.selectedDestStation.id,
        time: time,
        isarrivaltime: !app.isDeparture,
        shorttermchanges: true,
        mobilitySettings: {
            mobilityRestriction: 'None'
        },
        standardSettings: {
            maxChanges: 'Unlimited',
            walkingSpeed: 'Normal',
            extraCharge: 'LocalTraffic',
            footpathToStop: 10, // might change to 5
            mot: mots,
            includeAlternativeStops: true
        }
    };
    if (app.via) requestData.via = app.selectedViaStation.id;
    fetchAPI('https://webapi.vvo-online.de/tr/trips?format=json', requestData).then(processConnectionResult).catch(errData => {
        app.searching = false;
        if ('Status' in errData[1]) {
            if (errData[1].Status.Message == 'origin too close to destination') {
                alert('Bitte zwei weiter voneinander entfernte Orte eingeben.');
            } else if (errData[1].Status.Message == 'invalid date') {
                alert('Das eingegebene Datum liegt in der Vergangenheit oder zu weit in der Zukunft.');
            }
            else console.log(errData);
        } else console.log(errData);
    });
}

document.addEventListener('touchstart', top.handleTouchStart);
document.addEventListener('touchmove', top.handleTouchMove);
document.addEventListener('touchend', top.handleTouchEnd);

window.onload = main;