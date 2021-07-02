let processConnectionResult = function(result) {
    let routes = [];
    for (let i = 0; i < result.Routes.length; i++) {
        let route = result.Routes[i];
        let l1 = route.PartialRoutes.length - 1;
        let l2 = route.PartialRoutes[l1].RegularStops.length - 1;
        let routeData = {
            start: parseInt(route.PartialRoutes[0].RegularStops[0].DepartureTime.match(/[0-9]+/)[0]),
            end: parseInt(route.PartialRoutes[l1].RegularStops[l2].ArrivalTime.match(/[0-9]+/)[0]),
            duration: route.Duration,
            interchanges: route.Interchanges,
            route: [],
            show: false,
            miss: false,
            cancel: false
        }
        if (route.PartialRoutes[0].RegularStops[0].DepartureRealTime) {
            routeData.start = parseInt(route.PartialRoutes[0].RegularStops[0].DepartureRealTime.match(/[0-9]+/)[0]);
        }
        if (route.PartialRoutes[l1].RegularStops[l2].ArrivalRealTime) {
            routeData.end = parseInt(route.PartialRoutes[l1].RegularStops[l2].ArrivalRealTime.match(/[0-9]+/)[0]);
        }
        for (let j = 0; j < route.PartialRoutes.length; j++) {
            let segment = route.PartialRoutes[j];
            let allowedMots = ['Footpath', 'StayInVehicle', 'MobilityStairsUp', 'MobilityStairsDown', 'Bus', 'Tram', 'Ferry', 'Train', 'PlusBus', 'RapidTransit', 'OverheadRailway', 'Cablecar', 'Taxi'];
            if (allowedMots.indexOf(segment.Mot.Type) == -1) continue;
            let noVehicles = ['Footpath', 'StayInVehicle', 'MobilityStairsUp', 'MobilityStairsDown'];
            let isVehicle = noVehicles.indexOf(segment.Mot.Type) == -1;
            let segmentData = {
                isVehicle: isVehicle,
                type: segment.Mot.Type,
                duration: null,
                wait: null,
                line: null,
                dest: null,
                path: [],
                exp: false,
                urgent: false,
                miss: false,
                cancel: false
            };
            if (isVehicle) {
                let trackMap = { Platform: 'Steig ', Railtrack: 'Gleis ' };
                segmentData.line = segment.Mot.Name;
                segmentData.dest = segment.Mot.Direction.trim();
                for (let k = 0; k < segment.RegularStops.length; k++) {
                    segmentData.path.push({
                        id: segment.RegularStops[k].DataId,
                        name: segment.RegularStops[k].Name,
                        city: segment.RegularStops[k].Place,
                        time: parseInt(segment.RegularStops[k].ArrivalTime.match(/[0-9]+/)[0]),
                        platform: null,
                        cancel: false
                    });
                    if (segment.RegularStops[k].ArrivalRealTime) {
                        segmentData.path[k].time = parseInt(segment.RegularStops[k].ArrivalRealTime.match(/[0-9]+/)[0]);
                    }
                    if ('Platform' in segment.RegularStops[k]) {
                        segmentData.path[k].platform = trackMap[segment.RegularStops[k].Platform.Type] + segment.RegularStops[k].Platform.Name;
                    }
                    let cancel = segment.RegularStops[k].ArrivalState == 'Cancelled';
                    if (k == 0) {
                        segmentData.path[k].time = parseInt(segment.RegularStops[k].DepartureTime.match(/[0-9]+/)[0]);
                        if (segment.RegularStops[k].DepartureRealTime) {
                            segmentData.path[k].time = parseInt(segment.RegularStops[k].DepartureRealTime.match(/[0-9]+/)[0]);
                        }
                        cancel = segment.RegularStops[k].DepartureState == 'Cancelled';
                    }
                    if (cancel) {
                        segmentData.path[k].cancel = true;
                        segmentData.cancel = true;
                        routeData.cancel = true;
                    }
                }
                if (segment.Mot.Name.includes('SDG') && segment.Mot.DlId.includes('WTB')) segmentData.line = 'WeB';
                if (segment.Mot.Name.includes('SDG') && segment.Mot.DlId.includes('LGB')) segmentData.line = 'LöB';
                if (segment.Mot.Name == 'Standseilbahn') segmentData.line = 'StB';
                if (segment.Mot.Name == 'Schwebebahn') segmentData.line = 'SwB';
                if (segment.Mot.Name == 'Kirnitzschtalbahn') segmentData.line = 'KiB';
                if (segmentData.line.length > 10) segmentData.line = 'Zug';
                let k = routeData.route.length - 1;
                while (k >= 0) {
                    if (['MobilityStairsUp', 'MobilityStairsDown'].indexOf(routeData.route[k].type) != -1) k--;
                    else break;
                }
                if (k >= 0) {
                    if (noVehicles.indexOf(routeData.route[k].type) == -1) {
                        routeData.route.push({
                            isVehicle: false,
                            type: 'Wait',
                            duration: null,
                            wait: null,
                            line: null,
                            dest: null,
                            start: null,
                            end: null,
                            urgent: false,
                            miss: false,
                            cancel: false
                        });
                    }
                }
            } else if (segment.Mot.Type == 'Footpath') segmentData.duration = segment.Duration;
            routeData.route.push(segmentData);
        }
        let waitTime = null;
        let walkTime = 0;
        let indexList = [];
        for (let j = 0; j < routeData.route.length; j++) {
            if (routeData.route[j].isVehicle) {
                let lastIndex = routeData.route[j].path.length - 1;
                let urgent = false;
                let miss = false;
                if (indexList.length > 0) {
                    waitTime += routeData.route[j].path[0].time;
                    waitTime /= 60000;
                    if (waitTime < walkTime) urgent = true;
                    if (waitTime / walkTime < 0.3) miss = true;
                    if (miss) routeData.miss = true;
                    for (let k = 0; k < indexList.length; k++) {
                        routeData.route[indexList[k]].wait = waitTime < 0 ? 0 : waitTime;
                        routeData.route[indexList[k]].urgent = urgent;
                        routeData.route[indexList[k]].miss = miss;
                    };
                    indexList = [];
                }
                walkTime = 0;
                waitTime = -routeData.route[j].path[lastIndex].time;
            } else if (waitTime != null && ['Wait', 'Footpath'].indexOf(routeData.route[j].type) != -1) {
                indexList.push(j);
                if (routeData.route[j].type == 'Footpath') walkTime += routeData.route[j].duration;
            }
        }
        let j = 0;
        walkTime = 0;
        while (j < routeData.route.length) {
            if (routeData.route[j].type == 'Footpath') walkTime += routeData.route[j].duration;
            if (routeData.route[j].isVehicle) {
                routeData.start = routeData.route[j].path[0].time - walkTime * 1000 * 60;
                break;
            }
            j++;
        }
        j = routeData.route.length - 1;
        walkTime = 0;
        while (j >= 0) {
            if (routeData.route[j].type == 'Footpath') walkTime += routeData.route[j].duration;
            if (routeData.route[j].isVehicle) {
                routeData.end = routeData.route[j].path[routeData.route[j].path.length-1].time + walkTime * 1000 * 60;
                break;
            }
            j--;
        }
        routes.push(routeData);
    }
    app.searching = false;
    app.tripData = routes;
}