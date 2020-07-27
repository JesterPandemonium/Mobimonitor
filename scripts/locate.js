let locate = function (includeCoords) {
    let failAlert = function(error) {
        app.locating = false;
        let locateDenied = 'Schade! So kannst du diese Funktion nicht nutzen.\n';
        locateDenied += 'Falls du es dir anders überlegst, musst du die Seite neu laden.'
        let locateFailed = 'Wir konnten dich leider nicht lokalisieren...\n';
        locateFailed += 'Vielleicht wurde deine Verbindung unterbrochen? Versuche, die Seite neuzuladen.'
        if (error.code == 1) alert(locateDenied);
        else if (error.code == 2 || error.code == 3) alert(locateFailed);
    };
    return new Promise((resolve, reject) => {
        app.locating = true;
        navigator.geolocation.getCurrentPosition(pos => {
            fetchLocation(pos, includeCoords).then(resolve).catch(err => {
                failAlert(error);
                resolve([]);
            });
        }, error => {
            failAlert(error);
            resolve([]);
        }, {
            timeout: 10000
        });
    });
}

let fetchLocation = function (position, includeCoords) {
    let gk4string = '+proj=tmerc +lat_0=0 +lon_0=12 +k=1 +x_0=4500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs ';
    let gk4 = proj4(gk4string, [position.coords.longitude, position.coords.latitude]);
    return fetchAPI('https://webapi.vvo-online.de/tr/pointfinder?format=json', {
        limit: 0,
        query: 'coord:' + Math.round(gk4[0]) + ':' + Math.round(gk4[1]),
        stopsOnly: !includeCoords,
        assignedStops: true
    }).then(data => {
        if (data.PointStatus != 'NotIdentified') {
            let usedCodes = [];
            let stations = [];
            for (let i = 0; i < data.Points.length; i++) {
                let stationSplit = data.Points[i].split('|');
                let stationData;
                if (includeCoords) {
                    stationData = {
                        id: stationSplit[0],
                        stadt: '',
                        name: 'Mein Standort',
                        dist: 0
                    };
                    stations.push(stationData);
                    break;
                }
                else stationData = {
                    id: stationSplit[0],
                    stadt: stationSplit[2] || 'Dresden',
                    name: stationSplit[3],
                    type: 'local',
                    dist: stationSplit[6]
                };
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
            app.locating = false;
            return Promise.resolve(stations);
        } else {
            let locateFailed = 'Wir konnten dich leider nicht lokalisieren...\n';
            locateFailed += 'Vielleicht wurde deine Verbindung unterbrochen? Versuche, die Seite neuzuladen.'
            alert(locateFailed);
            return Promise.resolve([]);
        }
    }).catch(errData => {
        console.log(errData);
        return Promise.reject({ code: 0 });
    });
}