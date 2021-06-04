let app;

let main = function() {
    app = new Vue({
        el: '#chgApp',
        data: {
            lines: {},
            changes: {},
            mots: {
                Tram: false,
                SuburbanRailway: false,
                Cableway: false,
                CityBus: false,
                Train: false,
                Ferry: false
            }
        },
        methods: {
            getMotPic: function (mot) {
                return "background-image:url('" + g_Mots[mot] + "')";
            },
            getTimeLabel: function(start, end) {
                if (Date.now() > end) return 'von';
                if (Date.now() > start) return 'seit';
                return 'ab';
            },
            getTimeBanner: function(times) {
                let now = Date.now();
                let state = 0;
                for (let i = 0; i < times.length; i++) {
                    if (now < times[i].start) return {
                        info: 'DEMNÄCHST',
                        style: 'background-color: #e9f0ff; color: #000;'
                    }; 
                    else if (now < times[i].end) return {
                        info: 'AKTUELL',
                        style: 'background-color: #ffd319; color: #000;'
                    };
                }
                return {
                    info: 'VORBEI',
                    style: 'background-color: #7dcea0; color: #fff;'
                };
            },
            getDateString: function(timestamp) {
                if (timestamp == Infinity) return 'auf Weiteres';
                let date = new Date(timestamp);
                let weekday = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][date.getDay()];
                let day = date.getDate().toString();
                let month = (date.getMonth() + 1).toString();
                let year = date.getFullYear().toString();
                let hour = date.getHours().toString();
                let min = date.getMinutes().toString();
                if (day.length == 1) day = '0' + day;
                if (month.length == 1) month = '0' + month;
                if (hour.length == 1) hour = '0' + hour;
                if (min.length == 1) min = '0' + min;
                return weekday + ' ' + day + '.' + month + '.' + year + ' ' + hour + ':' + min + ' Uhr';
            },
            canShow: function (mot) {
                return this.mots[({
                    Tram: 'Tram',
                    CityBus: 'CityBus',
                    IntercityBus: 'CityBus',
                    PlusBus: 'CityBus',
                    HailedSharedTaxi: 'CityBus',
                    SuburbanRailway: 'SuburbanRailway',
                    Train: 'Train',
                    Ferry: 'Ferry',
                    Cableway: 'Cableway'
                })[mot]];
            }
        },
        computed: {
            lineOrder: function() {
                let order = [];
                for (id in this.lines) order.push(this.lines[id]);
                order = order.sort((a, b) => {
                    if (a.mot == 'Tram' && b.mot == 'Tram') {
                        if (a.line.length < b.line.length) return -1;
                        if (a.line.length > b.line.length) return 1;
                        if (a.line.toLowerCase() < b.line.toLowerCase()) return -1;
                        if (a.line.toLowerCase() > b.line.toLowerCase()) return 1;
                        return 0;
                    }
                    if (a.mot.match(/(CityBus|IntercityBus|PlusBus)/) && b.mot.match(/(CityBus|IntercityBus|PlusBus)/)) {
                        if (parseInt(a.line) < parseInt(b.line)) return -1;
                        if (parseInt(a.line) > parseInt(b.line)) return 1;
                        if (a.line.toLowerCase() < b.line.toLowerCase()) return -1;
                        if (a.line.toLowerCase() > b.line.toLowerCase()) return 1;
                        return 0;
                    }
                    if (
                        a.mot.match(/(SuburbanRailway|Train|Ferry|Cableway|HailedSharedTaxi)/) 
                        && b.mot.match(/(SuburbanRailway|Train|Ferry|Cableway|HailedSharedTaxi)/)
                        && a.mot == b.mot
                    ) {
                        if (a.line.toLowerCase() < b.line.toLowerCase()) return -1;
                        if (a.line.toLowerCase() > b.line.toLowerCase()) return 1;
                        return 0;
                    }
                    let map = ['Tram', 'CityBus', 'IntercityBus', 'PlusBus', 'SuburbanRailway', 'Train', 'Ferry', 'Cableway', 'HailedSharedTaxi'];
                    if (map.indexOf(a.mot) < map.indexOf(b.mot)) return -1;
                    if (map.indexOf(a.mot) > map.indexOf(b.mot)) return 1;
                    return 0;
                });
                return order;
            },
            placeholder: function() {
                for (let mot in this.mots) {
                    if (this.mots[mot]) return false;
                }
                return true;
            }
        },
        mounted: function () {
            document.getElementById('chgApp').style.display = 'block';
        }
    });
    updateChanges();
}

let updateChanges = function() {
    fetchAPI('https://webapi.vvo-online.de/rc?format=json', {
        provider: 'Vvo',
        shortterm: true
    }).then(data => {
        let usedLines = [];
        for (let i = 0; i < data.Lines.length; i++) {
            let linedata = data.Lines[i];
            let newData = {
                id: linedata.Id,
                line: linedata.Name,
                mot: linedata.Mot,
                comp: linedata.TransportationCompany,
                changes: linedata.Changes,
                show: false
            };
            for (let j = 0; j < newData.changes.length; j++) {
                newData.changes[j] = {
                    i: newData.changes[j],
                    show: false
                };
            }
            usedLines.push(linedata.Id);
            if (linedata.Id in app.lines) {
                if (newData.changes.length == app.lines[linedata.Id].changes.length) {
                    let skip = true;
                    for (let j = 0; j < newData.changes.length; j++) {
                        if (newData.changes[j].i != app.lines[linedata.Id].changes[j].i) skip = false;
                    }
                    if (skip) continue;
                }
            }
            Vue.set(app.lines, linedata.Id, newData);
        }
        for (let id in app.lines) {
            if (usedLines.indexOf(id) == -1) Vue.delete(app.lines, id);
        }
        for (let i = 0; i < data.Changes.length; i++) {
            let changedata = data.Changes[i];
            let newData = {
                title: changedata.Title,
                time: [],
                content: changedata.Description
            };
            for (let j = 0; j < changedata.ValidityPeriods.length; j++) {
                let period = changedata.ValidityPeriods[j];
                let time = {};
                time.start = parseInt(period.Begin.match(/[0-9]+/)[0]);
                if ('End' in period) time.end = parseInt(period.End.match(/[0-9]+/)[0]);
                else time.end = Infinity;
                newData.time.push(time);
            }
            newData.content = newData.content.replace(/<br>/gi, '</p><p>');
            newData.content = newData.content.replace(/<a\s/gi, '<a target="_blank" ');
            newData.content = newData.content.replace(/<p>\s*<\/p>/gi, '');
            Vue.set(app.changes, changedata.Id, newData);
        }
        setTimeout(updateChanges, 60 * 1000);
    });
}

document.addEventListener('touchstart', top.handleTouchStart);
document.addEventListener('touchmove', top.handleTouchMove);
document.addEventListener('touchend', top.handleTouchEnd);

window.onload = main;