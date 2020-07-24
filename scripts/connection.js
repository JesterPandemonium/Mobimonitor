let app;

let main = function() {
    app = new Vue({
        el: '#conApp',
        data: {
            selectedStartStation: null,
            selectedDestStation: null,
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
            tripData: null,
            allowResearch: true
        },
        methods: {
            locateMe: function() {},
            stopSignIcon: function (type) {
                if (type == 'local') return 'history-symbol fa fa-map-marker';
                else if (type == 'history') return 'history-symbol fa fa-history';
                else return '';
            },
            chooseStop: function(station) {
                if (this.inputType == 1) this.selectedStartStation = station;
                else if (this.inputType == 2) this.selectedDestStation = station;
                this.inputType = 0;
                this.stationInput = '';
            },
            getMotPic: function (mot) {
                let map = {
                    Tram: 'tram.svg',
                    CityBus: 'bus.svg',
                    IntercityBus: 'bus.svg',
                    SuburbanRailway: 'SBahn.svg',
                    Train: 'zug.svg',
                    Cableway: 'lift.svg',
                    Ferry: 'ferry.svg',
                    HailedSharedTaxi: 'alita.svg',
                    PlusBus: 'plusBus.svg'
                }
                return "background-image:url('https://www.vvo-mobil.de/img/mot_icons/" + map[mot] + "')";
            }
        },
        computed: {
            getSelectedStartStation: function() {
                if (this.selectedStartStation == null) return { name: '', stadt: 'Startpunkt wählen'};
                else return this.selectedStartStation;
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
            },
            canSubmit: function() {
                if (this.selectedStartStation != null && this.selectedDestStation != null) {
                    return this.allowResearch && (!app.searching);
                }
                else return false;
            }
        },
        watch: {
            stationInput: queryStations,
            selectedStartStation: function() { this.allowResearch = true },
            selectedDestStation: function() { this.allowResearch = true },
            selectedTime: function() { this.allowResearch = true },
            isDeparture: function() { this.allowResearch = true }
        }
    });
    queryStations();
    restrictDateInput();
}

let restrictDateInput = function() {
    let date = new Date();
    let picker = document.querySelector('.date-pick-container input');
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
    app.allowResearch = false;
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
            walkingSpeed: 'Fast', // change to 'Normal' if too fast
            extraCharge: 'None',
            footpathToStop: 10, // might change to 5
            mot: mots,
            includeAlternativeStops: true
        }
    };
    fetchAPI('https://webapi.vvo-online.de/tr/trips?format=json', requestData).then(data => {
        app.searching = false;
        app.tripData = data;
    }).catch(errData => {
        app.searching = false;
        app.allowResearch = true;
        if ('Status' in errData[1]) {
            if (errData[1].Status.Message == 'origin too close to destination') {
                alert('Bitte zwei weiter voneinander entfernte Orte eingeben.');
            } else console.log(errData);
        } else console.log(errData);
    });
}

document.addEventListener('touchstart', top.handleTouchStart);
document.addEventListener('touchmove', top.handleTouchMove);
document.addEventListener('touchend', top.handleTouchEnd);

window.onload = main;