let app;

let touchX;
let touchY;
let canMove = false;

const lastUpdate = 1601397900000;

let main = function() {
    if (!noTram) moveTram();
    let id = window.location.pathname;
    let tabCount = document.getElementById('app').childElementCount;
    let tabFrame = document.getElementById('tab-frame');
    tabFrame.style.width = (100 / tabCount) + '%';
    app = new Vue({
        el: '#app',
        data: {
            selectedPanel: 1,
            refreshData: {},
            departs: {},
            editing: false,
            stationInput: '',
            stationList: [],
            selectedStation: null,
            lineList: [],
            otherLines: false,
            showAlert: false
        },
        methods: {
            panelOffset: function(id) { 
                return {
                    left: (id - this.selectedPanel) + '00%',
                    right: (this.selectedPanel - id) + '00%'
                }
            },
            setStation: function(station) { selectStation(station) },
            editStation: function(station) { stationPopup(station) },
            removeStation: function(id) { delStation(id) },
            addFilter: function(line, mode) { addFilter(line, mode) },
            removeFilter: function(line, mode, index) { removeFilter(line, mode, index) },
            getMotPic: function(mot) {
                return "background-image:url('" + g_Mots[mot] + "')";
            },
            stopSignIcon: function (type) {
                if (type == 'local') return 'history-symbol fa fa-map-marker';
                else if (type == 'history') return 'history-symbol fa fa-history';
                else return '';
            },
            dirHint: function() {
                let s = '"Nicht nach ...": Alle von den Filtern betroffenen Abfahrten werden nicht angezeigt.\n\n';
                s += '"Nur nach ...": Nur die von den Filtern betroffenen Abfragen werden angezeigt.\n\n';
                s += 'Die Filtersets sind getrennt voneinander gespeichert. Nur das jeweils ausgewählte Filterset ist aktiv.';
                alert(s);
            },
            lineHint: function() {
                alert('Aktiviere diese Funktion, um auch Abfahrten von weiteren Linien zu sehen (wie z. B. verbundübergreifende Busse), welche nicht in der obenstehenden Liste aufgeführt sind.');
            },
            swapStations: function(i) {
                let id1 = this.stopOrder[i].id;
                let id2 = this.stopOrder[i + 1].id;
                sendToServer('/swapStops' + window.location.pathname, {
                    s1: id1,
                    s2: id2
                }).then(() => {
                    this.refreshData.stops[id1].position = i + 1;
                    this.refreshData.stops[id2].position = i;
                }).catch(alert)
            },
            updateInfo: function(view) {
                document.getElementById('update-hint').style.display = 'none';
                if (view) {
                    moveTabFrame(5);
                    document.querySelector('iframe[src="/info"]').contentDocument.querySelector('.changelog').classList.add('open');
                }
            }
        },
        computed: {
            stopOrder: function() {
                if (this.refreshData.stops == undefined) return [];
                let order = [];
                for (let i = 0; i < Object.keys(this.refreshData.stops).length; i++) {
                    let id = Object.keys(this.refreshData.stops)[i];
                    order.push([id, this.refreshData.stops[id]]);
                }
                order = order.sort((a, b) => (a[1].position <= b[1].position) ? -1 : 1);
                let stops = [];
                for (let i = 0; i < order.length; i++) {
                    let id = order[i][0];
                    if (id in this.departs) {
                        let stop = { id: id };
                        for (let key in this.departs[id]) stop[key] = this.departs[id][key];
                        stops.push(stop);
                    }
                }
                return stops;
            }
        },
        watch: {
            stationInput: queryStations
        }
    });
    fetch('/data' + id).then(data => {
        app.refreshData = data;
        refresh(true, false).then(() => { 
            canMove = true;
            if (app.refreshData.lastRequested < lastUpdate) {
                document.cookie = "history=;expires=" + new Date().toString();
                document.getElementById('update-hint').style.display = 'flex';
            }
        });
    }).catch(alert);
}

let moveTabFrame = function(id) {
    let tabCount = document.getElementById('app').childElementCount;
    if (id < 1 || id > tabCount) return;
    app.selectedPanel = id;
    let frame = document.getElementById('tab-frame');
    frame.style.left = ((id - 1) * (100 / tabCount)) + '%';
    frame.style.width = (100 / tabCount) + '%';
}

function showAlert() {
    app.showAlert = true;
    setTimeout(() => {
        app.showAlert = false;
    }, 5 * 1000);
}

function handleTouchStart(evt) {
    touchX = evt.touches[0].clientX;
    touchY = evt.touches[0].clientY;
};

function handleTouchMove(evt) {
    if (canMove) {
        let dX = evt.touches[0].clientX - touchX;
        let dY = evt.touches[0].clientY - touchY;
        if (Math.abs(dX) > Math.abs(dY) && Math.abs(dX) > 40) {
            canMove = false;
            if (dX > 0) moveTabFrame(app.selectedPanel - 1);
            else moveTabFrame(app.selectedPanel + 1);
        }
    }
};

function handleTouchEnd(evt) {
    canMove = true;
};

document.addEventListener('touchstart', handleTouchStart);
document.addEventListener('touchmove', handleTouchMove);
document.addEventListener('touchend', handleTouchEnd);

window.onload = main;