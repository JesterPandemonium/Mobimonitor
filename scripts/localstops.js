let app;

let main = function () {
    app = new Vue({
        el: '#locApp',
        data: {
            refreshData: {
                stops: {}
            },
            departs: {},
            locating: false
        },
        methods: {
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
            stopOrder: function() {
                let stops = [];
                for (let i = 0; i < Object.keys(this.departs).length; i++) {
                    let id = Object.keys(this.departs)[i];
                    let stop = {
                        name: this.departs[id].name,
                        city: this.departs[id].city,
                        departs: this.departs[id].departs,
                        dist: this.refreshData.stops[id].dist
                    }
                    stops.push(stop);
                }
                stops.sort((a, b) => {
                    if (parseInt(a.dist) < parseInt(b.dist)) return -1;
                    if (parseInt(a.dist) > parseInt(b.dist)) return 1;
                    return -1;
                });
                return stops;
            }
        }
    });
}

let locate = function() {
    document.getElementById('location-requester').style.display = 'none';
    app.locating = true;
    navigator.geolocation.getCurrentPosition(fetchLocation, locateFail, { timeout: 10000 });
}

let locateFail = function (error) {
    app.locating = false;
    if (error.code == 1) document.getElementById('location-denied').style.display = 'block';
    else document.getElementById('location-timeout').style.display = 'block';
}

let fetchLocation = function(position) {
    let gk4string = '+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs ';
    let gk4 = proj4(gk4string, [position.coords.longitude, position.coords.latitude]);
    fetchAPI('https://webapi.vvo-online.de/tr/pointfinder?format=json', {
        limit: 0,
        query: 'coord:' + Math.round(gk4[0]) + ':' + Math.round(gk4[1]),
        stopsOnly: true,
        assignedStops: true
    }).then(data => {
        if (data.PointStatus != 'NotIdentified') {
            let usedCodes = []
            for (let i = 0; i < data.Points.length; i++) {
                let stationSplit = data.Points[i].split('|');
                let stationData = {
                    id: stationSplit[0],
                    stadt: stationSplit[2] || 'Dresden',
                    name: stationSplit[3],
                    dist: stationSplit[6],
                    lines: {}
                }
                if (usedCodes.indexOf(stationSplit[0]) == -1) {
                    usedCodes.push(stationSplit[0]);
                    app.refreshData.stops[stationSplit[0]] = stationData;
                }
            }
            refresh(true).then(() => { app.locating = false; });
        } else locateFail({ code: 2 });
    }).catch(errData => {
        alert(errData[0]);
        console.log(errData);
    });
}

window.onload = main;