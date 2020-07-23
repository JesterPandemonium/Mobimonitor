let app;

let main = function() {
    app = new Vue({
        el: '#conApp',
        data: {
            selectedStartStation: null,
            selectedDestStation: null,
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
            showLocals: false,
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
            }
        },
        computed: {
            historyShown: function() {
                return (
                    this.stationList.length == 0 && 
                    Object.keys(this.departs) == 0 && 
                    this.history.length > 0
                );
            },
            stopSignIcon: function() {
                if (this.showLocals) return 'history-symbol fa fa-map-marker';
                else return '';
            }
        }
    });
    clearMonitor();
    refresh(true, true);
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