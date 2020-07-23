let app;

let main = function() {
    app = new Vue({
        el: '#conApp',
        data: {
            /* selectedStartStation: null,
            selectedDestStation: null,
            stationInput: '',
            showStationList: false,
            stationList: [],
            history: [],
            locating: false,
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
            
        },
        computed: {
            
        }
    });
}

document.addEventListener('touchstart', top.handleTouchStart);
document.addEventListener('touchmove', top.handleTouchMove);
document.addEventListener('touchend', top.handleTouchEnd);

window.onload = main;