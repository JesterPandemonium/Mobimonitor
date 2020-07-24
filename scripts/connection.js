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
            /* history: [],
            mots: {
                Tram: true,
                SuburbanRailway: true,
                Cableway: true,
                CityBus: true,
                Train: true,
                Ferry: true
            },
            
            refreshData: {
                stops: {}
            },
            departs: {}, */
            
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
            }
        },
        watch: {
            stationInput: queryStations
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

document.addEventListener('touchstart', top.handleTouchStart);
document.addEventListener('touchmove', top.handleTouchMove);
document.addEventListener('touchend', top.handleTouchEnd);

window.onload = main;