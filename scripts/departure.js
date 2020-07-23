let app;

let main = function() {
    app = new Vue({
        el: '#depApp',
        data: {
            selectedStation: null,
            stationInput: '',
            showStationList: true,
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
            history: [],
            locating: false
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
            },
            distLabel: function(dist) {
                if (dist) return ' (' + dist + 'm)';
                else return '';
            },
            stopSignIcon: function(type) {
                if (type == 'local') return 'history-symbol fa fa-map-marker';
                else if (type == 'history') return 'history-symbol fa fa-history';
                else return '';
            },
            locateMe: function() {
                if (!this.locating) {
                    locate().then(stations => {
                        app.departs = {};
                        app.refreshData = { stops: {} };
                        app.selectedStation = null;
                        app.stationList = stations;
                        app.showStationList = true;
                    });
                }
            }
        },
        watch: {
            stationInput: queryStations
        }
    });
    queryStations();
    refresh(true, true);
}

let displayMonitor = function(station) {
    app.selectedStation = station.id;
    app.refreshData.stops = {};
    app.refreshData.stops[station.id] = { lines: {}, otherLines: true };
    addToHistory(station);
    refresh(false, true).then(() => {
        app.showStationList = false;
        app.stationInput = '';
    });
}

let clearMonitor = function() {
    app.departs = {};
    app.refreshData = { stops: {} };
    app.selectedStation = null;
    app.stationInput = '';
    app.showStationList = true;
    queryStations();
}

document.addEventListener('touchstart', top.handleTouchStart);
document.addEventListener('touchmove', top.handleTouchMove);
document.addEventListener('touchend', top.handleTouchEnd);

window.onload = main;