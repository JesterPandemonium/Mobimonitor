let app;

let touchX;
let touchY;
let canMove = false;

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
            stationList: [],
            selectedStation: null,
            lineList: []
        },
        methods: {
            panelOffset: function(id) { 
                return {
                    left: (id - this.selectedPanel) + '00%',
                    right: (this.selectedPanel - id) + '00%'
                }
            },
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
            },
            stopOrder: function() {
                if (this.refreshData.stops == undefined) return [];
                let order = [];
                for (let i = 0; i < Object.keys(this.refreshData.stops).length; i++) {
                    let id = Object.keys(this.refreshData.stops)[i];
                    order.push([id, this.refreshData.stops[id]]);
                }
                order = order.sort((a, b) => {
                    if (a[1].added == undefined) return -1;
                    if (b[1].added == undefined) return 1;
                    if (a[1].added < b[1].added) return -1;
                    else return 1;
                });
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
    });
    fetch('/data' + id).then(data => {
        app.refreshData = data;
        refresh(true).then(() => { canMove = true; });
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