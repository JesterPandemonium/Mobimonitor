let fs = require('fs');
let express = require('express');

let app = express();

app.use(express.json());
app.use(express.static(__dirname + '/favicon'));
app.use(express.static(__dirname + '/styles'));
app.use(express.static(__dirname + '/scripts'));
app.use(express.static(__dirname + '/img'));

let handleError = function(res, err) {
    res.send({ err: true });
    fs.appendFile(__dirname + '/log', new Date().toString() + '\n' + err + '\n\n', (err) => {
        if (err) throw err;
    });
}

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/pages/index.html');
});

app.get('/departure', (req, res) => {
    res.sendFile(__dirname + '/pages/departure.html');
});

app.get('/info', (req, res) => {
    res.sendFile(__dirname + '/pages/info.html');
});

app.get('/connection', (req, res) => {
    res.sendFile(__dirname + '/pages/connection.html');
});

app.get('/changes', (req, res) => {
    res.sendFile(__dirname + '/pages/changes.html');
});

app.get('/createNewRecord', (req, res) => {
    let alreadyInUse = false;
    let id = '';
    do {
        let map = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        id = '';
        for (let i = 0; i < 6; i++) id += map[Math.floor(Math.random() * 52)];
        alreadyInUse = fs.existsSync(__dirname + '/data/' + id + '.json');
    } while (alreadyInUse);
    let data = {
        err: false,
        lastRequested: Date.now(),
        stops: {}
    };
    fs.writeFile(__dirname + '/data/' + id + '.json', JSON.stringify(data), (err) => {
        if (err) handleError(res, err);
        else res.send({ err: false, id: id });
    });
});

app.get('/clean', (req, res) => {
    res.end('OK');
    fs.readdir(__dirname + '/data', (err, files) => {
        if (err) throw err;
        for (let i = 0; i < files.length; i++) {
            fs.readFile(__dirname + '/data/' + files[i], (err, data) => {
                if (err) throw err;
                let json = JSON.parse(data);
                if (Date.now() - json.lastRequested > 4 * 7 * 24 * 60 * 60 * 1000 || Object.keys(json.stops).length == 0) {
                    fs.unlink(__dirname + '/data/' + files[i], (err) => {
                        if (err) throw err;
                    });
                }
            });
        }
    });
});

app.get('/:q', (req, res) => {
    let exists = fs.existsSync(__dirname + '/data/' + req.params.q + '.json');
    if (exists) res.sendFile(__dirname + '/pages/monitor.html');
    else res.sendFile(__dirname + '/pages/404.html');
});

app.get('/data/:id', (req, res) => {
    fs.readFile(__dirname + '/data/' + req.params.id + '.json', (err, data) => {
        if (err) handleError(res, err);
        else {
            let json = JSON.parse(data);
            res.json(json);
            json.lastRequested = Date.now();
            fs.writeFile(__dirname + '/data/' + req.params.id + '.json', JSON.stringify(json), (err) => {
                if (err) handleError({send: x => {}}, err);
            });
        };
    });
});

app.post('/editStop/:id', (req, res) => {
    let id = req.params.id;
    let path = __dirname + '/data/' + id + '.json';
    dataCorrupted = false;
    if (!(/^[0-9]+$/.test(req.body.id))) dataCorrupted = true;
    if (typeof req.body.otherLines !== 'boolean') dataCorrupted = true;
    if (typeof req.body.lines !== 'object' || req.body.lines === null) dataCorrupted = true;
    else {
        for (let line in req.body.lines) {
            if (!(/^[A-Za-z0-9\/\u00f6\u00df(): ]+$/.test(line))) dataCorrupted = true; // Die \u Dinger sind für die L'öß'nitzgrundbahn...
            let lineData = req.body.lines[line];
            if (typeof lineData !== 'object' || lineData === null) dataCorrupted = true;
            else if (typeof lineData.use !== 'boolean') dataCorrupted = true;
            else if (typeof lineData.filterMode !== 'number') dataCorrupted = true;
            else if (!Array.isArray(lineData.useOnly)) dataCorrupted = true;
            else if (!Array.isArray(lineData.doNotUse)) dataCorrupted = true;
            else {
                for (let i = 0; i < lineData.useOnly.length; i++) {
                    if (typeof lineData.useOnly[i] !== 'string') dataCorrupted = true;
                    else if (!(/^[A-Za-z0-9\/\u00c4\u00e4\u00d6\u00f6\u00dc\u00fc\u00df ]+$/.test(lineData.useOnly[i]))) dataCorrupted = true; // ÄäÖöÜüß
                }
                for (let i = 0; i < lineData.doNotUse.length; i++) {
                    if (typeof lineData.doNotUse[i] !== 'string') dataCorrupted = true;
                    else if (!(/^[A-Za-z0-9\/\u00c4\u00e4\u00d6\u00f6\u00dc\u00fc\u00df ]+$/.test(lineData.doNotUse[i]))) dataCorrupted = true; // ÄäÖöÜüß
                }
            }
        }
    }
    if (dataCorrupted) handleError(res, 'User ' + id + ' manipulated data: ' + JSON.stringify(req.body));
    else fs.readFile(path, (err, data) => {
        if (err) handleError(res, err);
        else {
            let daten = JSON.parse(data);
            if (!(req.body.id in daten.stops)) daten.stops[req.body.id] = { position: Object.keys(daten.stops).length };
            daten.stops[req.body.id].lines = req.body.lines;
            daten.stops[req.body.id].otherLines = req.body.otherLines;
            fs.writeFile(path, JSON.stringify(daten), (err) => {
                if (err) handleError(err);
                else res.send({ err: false });
            });
        }
    });
});

app.post('/delStop/:id', (req, res) => {
    let id = req.params.id;
    let path = __dirname + '/data/' + id + '.json';
    fs.readFile(path, (err, data) => {
        if (err) handleError(res, err);
        else {
            let daten = JSON.parse(data);
            delete daten.stops[req.body.id];
            fs.writeFile(path, JSON.stringify(daten), (err) => {
                if (err) handleError(err);
                else res.send({ err: false });
            });
        }
    });
});

app.post('/swapStops/:id', (req, res) => {
    let id = req.params.id;
    let path = __dirname + '/data/' + id + '.json';
    fs.readFile(path, (err, data) => {
        if (err) handleError(res, err);
        else {
            let daten = JSON.parse(data);
            if (!(req.body.s1 in daten.stops && req.body.s2 in daten.stops)) res.send({ err: true });
            else {
                let pos1 = daten.stops[req.body.s1].position;
                let pos2 = daten.stops[req.body.s2].position;
                daten.stops[req.body.s1].position = pos2;
                daten.stops[req.body.s2].position = pos1;
                fs.writeFile(path, JSON.stringify(daten), (err) => {
                    if (err) handleError(err);
                    else res.send({ err: false });
                });
            }
        }
    });
});

module.exports = app;