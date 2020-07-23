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

/* let displayMonitor = function(station) {
    app.selectedStation = station.id;
    app.refreshData.stops = {};
    app.refreshData.stops[station.id] = { lines: {}, otherLines: true };
    addToHistory(station);
    refresh(false, true).then(() => {
        document.getElementById('line-input').value = '';
        app.stationList = [];
    });
}

let clearMonitor = function() {
    app.departs = {};
    app.refreshData = { stops: {} };
    app.selectedStation = null;
    app.showLocals = false;
    let match = document.cookie.match(/history=([^;]*)/);
    let history = [];
    if (match != null) history = match[1].split('-');
    for (let i = 0; i < history.length; i++) {
        history[i] = JSON.parse(decodeURIComponent(history[i]));
    }
    app.history = history;
} */

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

/* let locate = function () {
    if (!app.locating) {
        app.locating = true;
        document.getElementById('line-input').value = '';
        navigator.geolocation.getCurrentPosition(fetchLocation, locateFail, {
            timeout: 10000
        });
    }
} */

let locateFail = function (error) {
    app.locating = false;
    let locateDenied = 'Schade! So kannst du diese Funktion nicht nutzen.\n';
    locateDenied += 'Falls du es dir anders überlegst, musst du die Seite neu laden.'
    locateFailed = 'Wir konnten dich leider nicht lokalisieren...\n';
    locateFailed += 'Vielleicht wurde deine Verbindung unterbrochen? Versuche, die Seite neuzuladen.'
    if (error.code == 1) alert(locateDenied);
    else alert(locateFailed);
}

let fetchLocation = function (position) {
    let gk4string = '+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs ';
    let gk4 = proj4(gk4string, [position.coords.longitude, position.coords.latitude]);
    fetchAPI('https://webapi.vvo-online.de/tr/pointfinder?format=json', {
        limit: 0,
        query: 'coord:' + Math.round(gk4[0]) + ':' + Math.round(gk4[1]),
        stopsOnly: true,
        assignedStops: true
    }).then(data => {
        if (data.PointStatus != 'NotIdentified') {
            let usedCodes = [];
            let stations = [];
            for (let i = 0; i < data.Points.length; i++) {
                let stationSplit = data.Points[i].split('|');
                let stationData = {
                    id: stationSplit[0],
                    stadt: stationSplit[2] || 'Dresden',
                    name: stationSplit[3],
                    dist: stationSplit[6]
                }
                if (usedCodes.indexOf(stationSplit[0]) == -1) {
                    usedCodes.push(stationSplit[0]);
                    stations.push(stationData);
                }
            }
            stations.sort((a, b) => {
                if (parseInt(a.dist) < parseInt(b.dist)) return -1;
                if (parseInt(a.dist) > parseInt(b.dist)) return 1;
                return -1;
            });
            clearMonitor();
            app.locating = false;
            app.showLocals = true;
            app.stationList = stations;
        } else locateFail({
            code: 2
        });
    }).catch(errData => {
        console.log(errData);
    });
}

document.addEventListener('touchstart', top.handleTouchStart);
document.addEventListener('touchmove', top.handleTouchMove);
document.addEventListener('touchend', top.handleTouchEnd);

window.onload = main;