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
            fetching: false
        },
        methods: {
            displayMonitor: function(station) { displayMonitor(station.id); },
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
        computed: {}
    });
}

let displayMonitor = function(id) {
    app.selectedStation = id;
    app.refreshData.stops = {};
    app.refreshData.stops[id] = { lines: {} };
    refresh(false).then(() => {
        document.getElementById('line-input').value = '';
        app.stationList = [];
    });
}

window.onload = main;