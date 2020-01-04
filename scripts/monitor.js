let app;

let main = function() {
    let id = window.location.pathname;
    document.querySelector('a').href = '/info' + id;
    app = new Vue({
        el: '#app',
        data: {
            refreshData: {},
            departs: {},
            stationList: [],
            selectedStation: null,
            lineList: []
        },
        methods: {
            setStation: function(station) { selectStation(station.id) },
            editStation: function(id) { stationPopup(id) },
            removeStation: function(id) { delStation(id) },
            getMotPic: function(mot) {
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
            wereLinesSelected: function() {
                let selected = false;
                for (let i = 0; i < this.lineList.length; i++) {
                    if (this.lineList[i].state) selected = true;
                }
                return (this.selectedStation !== null && (selected || this.lineList.length == 0));
            }
        },
    });
    fetch('/data' + id).then(data => {
        app.refreshData = data;
        refresh(true);
    }).catch(alert);
}

let refresh = function(loop) {
    if (loop) setTimeout(() => { refresh(true) }, 15 * 1000);
    let reqs = [];
    let resData = {}
    for (let stop in app.refreshData.stops) {
        reqs.push(addDepartures(stop, {}).then(data => {
            resData[stop] = data;
        }));
    }
    return Promise.all(reqs).then(() => {
        app.departs = {};
        for (let station in resData) {
            let departs = [];
            let alreadyUsed = [];
            for (let i = 0; i < resData[station].Departures.length; i++) {
                let depart = resData[station].Departures[i];
                let line = depart.LineName;
                let availableLines = app.refreshData.stops[station].lines;
                if (line.includes('SDG') && 'Lößnitzgrundbahn' in availableLines) line = 'Lößnitzgrundbahn';
                if (line.includes('SDG') && 'Weißeritztalbahn' in availableLines) line = 'Weißeritztalbahn';
                let lineNotWanted = app.refreshData.stops[station].lines[line] === false;
                let istFernferkehr = /(IC|ICE|EC|RJ)/.test(line);
                let willKeinFernverkehr = app.refreshData.stops[station].lines['IC/ICE'] === false;
                if (lineNotWanted || (istFernferkehr && willKeinFernverkehr)) continue;
                if (alreadyUsed.indexOf(line + depart.Direction) == -1) {
                    let leaveTime = parseInt(depart.ScheduledTime.match(/[0-9]+/)[0]);
                    if ('RealTime' in depart) leaveTime = parseInt(depart.RealTime.match(/[0-9]+/)[0]);
                    let timeToGo = (leaveTime - Date.now()) / 60000;
                    if (line == 'Standseilbahn') line = 'StB';
                    if (line == 'Schwebebahn') line = 'SwB';
                    if (line == 'Kirnitzschtalbahn') line = 'KiB';
                    if (line == 'Lößnitzgrundbahn') line = 'LöB';
                    if (line == 'Weißeritztalbahn') line = 'WeB';
                    if (timeToGo >= 0 && timeToGo <= 60) {
                        departs.push({
                            line: line,
                            dir: depart.Direction,
                            mot: depart.Mot,
                            time: Math.floor(timeToGo)
                        });
                        alreadyUsed.push(depart.LineName + depart.Direction);
                    }
                }
            }
            Vue.set(app.departs, station, {
                name: resData[station].Name,
                city: resData[station].Place,
                departs: departs
            });
        }
        document.getElementById('app').style.display = 'block';
    });
}

let addDepartures = function(station, data) {
    return new Promise((resolve, reject) => {
        let requestNeeded = false;
        let requestTime = new Date().toISOString();
        if (!('Departures' in data)) requestNeeded = true;
        else {
            let lastDep = data.Departures[data.Departures.length - 1];
            let leaveTime = parseInt(lastDep.ScheduledTime.match(/[0-9]+/)[0]);
            if ('RealTime' in lastDep) leaveTime = parseInt(lastDep.RealTime.match(/[0-9]+/)[0]);
            requestTime = new Date(leaveTime - 60 * 1000).toISOString();
            let dif = leaveTime - Date.now();
            requestNeeded = dif < 60 * 60 * 1000;
        }
        if (requestNeeded) fetchAPI('https://webapi.vvo-online.de/dm?format=json', {
            stopid: station,
            time: requestTime,
            isarrival: false,
            limit: 30,
            shorttermchanges: true,
            mentzonly: false,
            mot: ["Tram", "CityBus", "IntercityBus", "SuburbanRailway", "Train", "Cableway", "Ferry", "HailedSharedTaxi"]
        }).then(result => {
            if (result.Departures.length == 0) resolve(data);
            else {
                data.Name = result.Name;
                data.Place = result.Place;
                if (!('Departures' in data)) data.Departures = [];
                let usedCodes = [];
                for (let i = 0; i < data.Departures.length; i++) usedCodes.push(data.Departures[i].Id + data.Departures[i].ScheduledTime);
                for (let i = 0; i < result.Departures.length; i++) {
                    if (usedCodes.indexOf(result.Departures[i].Id + result.Departures[i].ScheduledTime) != -1) continue;
                    data.Departures.push(result.Departures[i]);
                }
                addDepartures(station, data).then(newData => { resolve(newData) });
            }
        }).catch(errData => {
            console.log(errData);
            data.Name = errData[1].Name;
            data.Place = errData[1].Place;
            if (!('Departures' in data)) data.Departures = [];
            resolve(data);
        });
        else resolve(data);
    });
}

window.onload = main;