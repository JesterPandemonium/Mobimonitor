let stationPopup = function (station) {
    let overlay = document.getElementById('station-popup');
    let input = document.getElementById('line-input');
    input.value = '';
    app.stationList = [];
    app.selectedStation = station;
    app.lineList = [];
    if (overlay.style.display != 'none') overlay.style.display = 'none';
    else {
        overlay.style.display = 'flex';
        input.focus();
        if (station !== null) selectStation(station).then(() => {
            input.value = app.departs[station].city + ' ' + app.departs[station].name;
            window.location.href = '#station-popup';
        });
    }
}

let queryStations = function () {
    app.selectedStation = null;
    app.lineList = [];
    let input = document.getElementById('line-input');
    let isTyping = document.activeElement == input;
    if (input.value.length >= 3 && isTyping) fetchAPI('https://webapi.vvo-online.de/tr/pointfinder?format=json', {
        limit: 5,
        query: input.value,
        stopsOnly: true,
        dvb: false,
        assignedStops: true
    }).then(data => {
        app.stationList = [];
        if (data.PointStatus != 'NotIdentified') {
            let usedCodes = []
            for (let i = 0; i < data.Points.length; i++) {
                let stationSplit = data.Points[i].split('|');
                if (usedCodes.indexOf(stationSplit[0]) == -1) {
                    usedCodes.push(stationSplit[0]);
                    app.stationList.push({
                        id: stationSplit[0],
                        stadt: stationSplit[2] || 'Dresden',
                        name: stationSplit[3]
                    });
                }
            }
        }
    }).catch(errData => {
        alert(errData[0]);
        console.log(errData);
    });
    else app.stationList = [];
}

let selectStation = function (id) {
    app.selectedStation = id;
    return fetchAPI('https://webapi.vvo-online.de/stt/lines?format=json', { stopid: id }).then(data => {
        app.lineList = [];
        let alreadyUsed = [];
        for (let i = 0; i < data.Lines.length; i++) {
            let line = data.Lines[i].Name;
            if (alreadyUsed.indexOf(line) == -1) {
                let lookupLine = (id in app.refreshData.stops);
                let preset = lookupLine ? app.refreshData.stops[id].lines[line] : false;
                let lineData = {
                    line: line,
                    state: preset,
                    mot: data.Lines[i].Mot
                };
                app.lineList.push(lineData);
                alreadyUsed.push(line);
            }
        }
    }).catch(errData => {
        app.lineList = [];
        console.log(errData);
    });
}

let selectAllLines = function (bool) {
    for (let i = 0; i < app.lineList.length; i++) app.lineList[i].state = bool;
}

let submitStation = function () {
    if (app.selectedStation !== null) {
        let lineStates = {};
        for (let i = 0; i < app.lineList.length; i++) {
            let lineData = app.lineList[i];
            lineStates[lineData.line] = lineData.state;
        }
        sendToServer('/editStop' + window.location.pathname, {
            id: app.selectedStation,
            lines: lineStates
        }).then(() => {
            return fetch('/data' + window.location.pathname);
        }).then(data => {
            app.refreshData = data;
            return refresh(false);
        }).then(() => {
            stationPopup(null);
        }).catch(alert);
    }
}

let delStation = function (id) {
    let del = confirm('Willst du die Station ' + app.departs[id].name + ' wirklich löschen?');
    if (del) sendToServer('/delStop' + window.location.pathname, { id: id }).then(() => {
        return fetch('/data' + window.location.pathname);
    }).then(data => {
        app.refreshData = data;
        return refresh(false);
    }).catch(alert);
}