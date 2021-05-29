let tramData = {
    mov: { s: [-123.5, -223.5, -323.5, -423.5], v: 1, a: 0.04 },
    xMov: { s: 0, v: 0, a: 0, j: 0 },
    door: { s: 0, v: 0, a: 0 },
    scale: { s: 0, v: 0, a: 0 },
    monMov: { s: -100, v: 0, a: 0 },
    monScale: { s: 0.7, v: 0, a: 0, j: 0 },
    tabMov: { s: 100, v: 0, a: 0, j: 0 },
    stop: false,
    stopping: false
}

let noTram = window.location.search == '?notram';

let moveTram = function() {
    document.getElementById('trams').style.display = 'block';
    if (tramData.mov.v > 2) {
        tramData.mov.a = 0;
        tramData.mov.v = 2;
    } else if (tramData.mov.v < 0) {
        tramData.mov.a = 0;
        tramData.mov.v = 0;
    }
    let moveOn = true;
    if (tramData.xMov.v < 0) {
        tramData.xMov.j = 0;
        tramData.xMov.a = 0;
        tramData.xMov.v = 0;
        tramData.xMov.s = 50;
        tramData.monMov.a = 0;
        tramData.monMov.v = 0;
        tramData.monMov.s = 0;
        moveOn = false;
        setTimeout(openDoors, 50);
    }
    for (let i = 1; i <= 4; i++) {
        tramData.mov.s[i-1] += tramData.mov.v;
        let tram = document.getElementById('tram' + i);
        tram.style.left = tramData.mov.s[i-1] + '%';
        tram.style.transform = 'translateX(' + tramData.xMov.s + 'vw)';
    }
    let monitor = document.getElementById('app');
    monitor.style.transform = 'translateX(' + tramData.monMov.s + 'vw) scale(' + tramData.monScale.s + ')';
    tramData.mov.v += tramData.mov.a;
    tramData.xMov.a += tramData.xMov.j;
    tramData.xMov.v += tramData.xMov.a;
    tramData.xMov.s += tramData.xMov.v;
    tramData.monMov.v += tramData.monMov.a;
    tramData.monMov.s += tramData.monMov.v;
    if (tramData.mov.s[1] > 95) tramData.mov.s[1] -= 300;
    if (tramData.mov.s[2] > 95) tramData.mov.s[2] -= 300;
    if (tramData.mov.s[3] > 95) tramData.mov.s[3] -= 300;
    if (tramData.stop && (!tramData.stopping) && tramData.mov.a == 0) setTimeout(stopTram, 20);
    else if (moveOn) setTimeout(moveTram, 20);
}

let stopTram = function() {
    let sVals = [tramData.mov.s[1], tramData.mov.s[2], tramData.mov.s[3]];
    let s = sVals.sort((a, b) => {
        if (a > b) return 1;
        else return -1;
    })[2];
    while (s > -100) s -= 100;
    s += 63.3;
    let t = (-2) * s / tramData.mov.v;
    tramData.mov.a = (-1) * tramData.mov.v / (t - 1);
    let xS = 50;
    let xJ = 3 * xS / ((t / 2) * ((t / 2) + 1) * (t + 1));
    let xA = xJ * t / 2;
    tramData.xMov.j = -xJ;
    tramData.xMov.a = xA;
    tramData.xMov.v = xA;
    tramData.xMov.s = xA;
    tramData.monMov.a = (-2) * 100 / (t * (t - 1));
    tramData.monMov.v = (-1) * tramData.monMov.a * (t - 1);
    tramData.monMov.s += tramData.monMov.v;
    tramData.stop = false;
    tramData.stopping = true;
    moveTram();
}

let openDoors = function() {
    let t = 50;
    let s = 6;
    let a = 2 * s / (t * (t + 1));
    let scaleS = 7;
    let scaleA = 2 * scaleS / (t * (t + 1));
    tramData.door.s = a;
    tramData.door.v = a;
    tramData.door.a = a;
    tramData.scale.s = 1 + scaleA;
    tramData.scale.v = scaleA;
    tramData.scale.a = scaleA;
    let monScaleS = 0.3;
    let monScaleJ = 3 * monScaleS / ((t / 2) * ((t / 2) + 1) * (t + 1));
    let monScaleA = monScaleJ * t / 2;
    tramData.monScale.j = -monScaleJ;
    tramData.monScale.a = monScaleA;
    tramData.monScale.v = monScaleA;
    tramData.monScale.s = 0.7 + monScaleA;
    let tabMovS = -100;
    let tabMovJ = 3 * tabMovS / ((t / 4) * ((t / 4) + 1) * ((t / 2) + 1));
    let tabMovA = tabMovJ * t / 4;
    tramData.tabMov.j = -tabMovJ;
    tramData.tabMov.a = tabMovA;
    tramData.tabMov.v = tabMovA;
    tramData.tabMov.s = tabMovA + 100;
    moveDoors(1.5 * t, 1.5 * t);
}

let moveDoors = function (t, tGes) {
    let tramPos2 = parseFloat(document.getElementById('tram2').style.left);
    let tramPos3 = parseFloat(document.getElementById('tram3').style.left);
    let tramPos4 = parseFloat(document.getElementById('tram4').style.left);
    let tramFrame;
    if (tramPos2 < 0 && tramPos2 > -100) tramFrame = document.getElementById('tram2');
    if (tramPos3 < 0 && tramPos3 > -100) tramFrame = document.getElementById('tram3');
    if (tramPos4 < 0 && tramPos4 > -100) tramFrame = document.getElementById('tram4');
    let leftDoor = tramFrame.contentWindow.document.getElementById('g945')
    let rightDoor = tramFrame.contentWindow.document.getElementById('g950');
    let scaleWindow = document.getElementById('trams');
    let monitor = document.getElementById('app');
    let panelSwitch = document.getElementById('panel-switch');
    let tabframe = document.getElementById('tab-frame');
    if (t > tGes / 3) {
        leftDoor.style.transform = 'translateX(-' + tramData.door.s + '%)';
        rightDoor.style.transform = 'translateX(' + tramData.door.s + '%)';
        tramData.door.v += tramData.door.a;
        tramData.door.s += tramData.door.v;
    } else {
        panelSwitch.style.transform = 'translateY(' + tramData.tabMov.s + '%)';
        tabframe.style.transform = 'translateY(' + tramData.tabMov.s + '%)';
        tramData.tabMov.a += tramData.tabMov.j;
        tramData.tabMov.v += tramData.tabMov.a;
        tramData.tabMov.s += tramData.tabMov.v;
    }
    if (t <= 2 * tGes / 3) {
        scaleWindow.style.transform = 'scale(' + tramData.scale.s + ')';
        monitor.style.transform = 'scale(' + tramData.monScale.s + ')';
        tramData.scale.v += tramData.scale.a;
        tramData.scale.s += tramData.scale.v;
        tramData.monScale.a += tramData.monScale.j;
        tramData.monScale.v += tramData.monScale.a;
        tramData.monScale.s += tramData.monScale.v;
    }
    t--;
    if (t != 0) setTimeout(() => {
        moveDoors(t, tGes);
    }, 20);
    else {
        scaleWindow.style.display = 'none';
        finishTram();
    }
}

let finishTram = function() {
    document.getElementById('panel-switch').style.transform = 'translateY(0)';
    document.getElementById('tab-frame').style.transform = 'translateY(0)';
    let panels = document.getElementsByClassName('panel');
    for (let i = 0; i < panels.length; i++) {
        panels[i].style.overflow = 'scroll';
        panels[i].style.display = 'flex';
    }
} // Yay, fertig :)