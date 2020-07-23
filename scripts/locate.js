let locate = function () {
    if (!app.locating) {
        app.locating = true;
        document.querySelector('.locater-input').value = '';
        navigator.geolocation.getCurrentPosition(fetchLocation, locateFail, {
            timeout: 10000
        });
    }
}

let locateFail = function (error) {
    app.locating = false;
    let locateDenied = 'Schade! So kannst du diese Funktion nicht nutzen.\n';
    locateDenied += 'Falls du es dir anders überlegst, musst du die Seite neu laden.'
    let locateFailed = 'Wir konnten dich leider nicht lokalisieren...\n';
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