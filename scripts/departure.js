let app;

let main = function() {
    app = new Vue({
        el: '#depApp',
        data: {
            selectedStation: null,
            stationList: [],
            refreshData: {
                stops: {}
            },
            departs: {},
            mots: {
                Tram: true,
                SuburbanRailway: true,
                Cableway: true,
                CityBus: true,
                Train: true,
                Ferry: true
            },
            history: []
        },
        methods: {
            displayMonitor: function(station) { displayMonitor(station); },
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
            },
            wantsMot: function(mot) {
                let map = {
                    Tram: this.mots.Tram,
                    CityBus: this.mots.CityBus,
                    IntercityBus: this.mots.CityBus,
                    SuburbanRailway: this.mots.SuburbanRailway,
                    Train: this.mots.Train,
                    Cableway: this.mots.Cableway,
                    Ferry: this.mots.Ferry,
                    HailedSharedTaxi: true,
                    PlusBus: this.mots.CityBus
                }
                return map[mot];
            }
        },
        computed: {
            historyShown: function() {
                return (
                    this.stationList.length == 0 && 
                    Object.keys(this.departs) == 0 && 
                    this.history.length > 0
                );
            }
        }
    });
    clearMonitor();
    refresh(true, Infinity);
}

let displayMonitor = function(station) {
    app.selectedStation = station.id;
    app.refreshData.stops = {};
    app.refreshData.stops[station.id] = { lines: {} };
    addToHistory(station);
    refresh(false, Infinity).then(() => {
        document.getElementById('line-input').value = '';
        app.stationList = [];
    });
}

let clearMonitor = function() {
    app.departs = {};
    app.refreshData = { stops: {} };
    app.selectedStation = null;
    let match = document.cookie.match(/history=([^;]*)/);
    let history = [];
    if (match != null) history = match[1].split('-');
    for (let i = 0; i < history.length; i++) {
        history[i] = JSON.parse(decodeURIComponent(history[i]));
    }
    app.history = history;
}

let addToHistory = function (station) {
    let data = encodeURIComponent(JSON.stringify({
        id: station.id,
        name: station.name,
        stadt: station.stadt
    }));
    let match = document.cookie.match(/history=([^;]*)/);
    let history = [];
    if (match != null) history = match[1].split('-');
    if (history.indexOf(data) != -1) history.splice(history.indexOf(data), 1);
    history.unshift(data);
    while (history.length > 5) history.pop();
    let cookie = 'history=' + history.join('-');
    cookie += ';max-age=' + (60 * 60 * 24 * 7) + ';samesite=strict';
    document.cookie = cookie;
}

document.addEventListener('touchstart', top.handleTouchStart);
document.addEventListener('touchmove', top.handleTouchMove);
document.addEventListener('touchend', top.handleTouchEnd);

window.onload = main;