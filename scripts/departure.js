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
            displayMonitor: function(station) { displayMonitor(station, true); },
            getMotPic: function (mot) {
                return "background-image:url('" + g_Mots[mot] + "')";
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
                    locate(false).then(stations => {
                        app.departs = {};
                        app.refreshData = { stops: {} };
                        app.selectedStation = null;
                        app.stationList = stations;
                        app.showStationList = true;
                    });
                }
            },
            delay: function(dly) {
                if (dly >= 10) return 'background-color: #f00a';
                return 'background-color: #f00' + dly;
            }
        },
        watch: {
            stationInput: queryStations
        },
        mounted: function () {
            document.getElementById('depApp').style.display = 'flex';
        }
    });
    queryStations();
    refresh(true);
}

function displayMonitor(station, history) {
    app.selectedStation = station.id;
    app.refreshData.stops = {};
    app.refreshData.stops[station.id] = { lines: {}, otherLines: true };
    refresh(false).then(() => {
        app.showStationList = false;
        app.stationInput = '';
        if (history) addToHistory(station);
    });
}

function clearMonitor() {
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