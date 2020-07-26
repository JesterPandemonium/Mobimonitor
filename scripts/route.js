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
            route: []
        }
        for (let j = 0; j < route.PartialRoutes.length; j++) {
            let segment = route.PartialRoutes[j];
            // Bei Gelegenheit Standseilbahn hinzufügen... wenn sie dann endlich mal wieder fährt
            let allowedMots = ['Footpath', 'StayInVehicle', 'Bus', 'Tram', 'Ferry', 'Train', 'PlusBus', 'RapidTransit', 'OverheadRailway', 'Taxi'];
            if (allowedMots.indexOf(segment.Mot.Type) == -1) continue;
            let isVehicle = ['Footpath', 'StayInVehicle'].indexOf(segment.Mot.Type) == -1;
            let segmentData = {
                isVehicle: isVehicle,
                type: segment.Mot.Type,
                duration: null,
                wait: null,
                line: null,
                dest: null,
                start: null,
                end: null
            };
            if (isVehicle) {
                let trackMap = { Platform: 'Steig ', Railtrack: 'Gleis ' };
                let index = segment.RegularStops.length - 1;
                segmentData.line = segment.Mot.Name;
                segmentData.dest = segment.Mot.Direction.trim();
                segmentData.start = {
                    name: segment.RegularStops[0].Name,
                    time: parseInt(segment.RegularStops[0].DepartureTime.match(/[0-9]+/)[0]),
                    platform: null
                };
                if ('Platform' in segment.RegularStops[0]) {
                    segmentData.start.platform = trackMap[segment.RegularStops[0].Platform.Type] + segment.RegularStops[0].Platform.Name;
                }
                segmentData.end = {
                    name: segment.RegularStops[index].Name,
                    time: parseInt(segment.RegularStops[index].ArrivalTime.match(/[0-9]+/)[0]),
                    platform: null
                };
                if ('Platform' in segment.RegularStops[index]) {
                    segmentData.end.platform = trackMap[segment.RegularStops[index].Platform.Type] + segment.RegularStops[index].Platform.Name;
                }
            } else if (segment.Mot.Type == 'Footpath') segmentData.duration = segment.Duration;
            if (isVehicle && routeData.route.length > 1) {
                let motBefore = routeData.route[routeData.route.length - 1].type;
                if (['Footpath', 'StayInVehicle'].indexOf(motBefore) == -1) {
                    routeData.route.push({
                        isVehicle: false,
                        type: 'Wait',
                        duration: null,
                        wait: null,
                        line: null,
                        dest: null,
                        start: null,
                        end: null
                    });
                }
            }
            routeData.route.push(segmentData);
        }
        let waitTime = null;
        let indexList = [];
        for (let j = 0; j < routeData.route.length; j++) {
            if (routeData.route[j].isVehicle) {
                if (indexList.length == 0) waitTime = -routeData.route[j].end.time;
                else {
                    waitTime += routeData.route[j].start.time;
                    waitTime /= 60000;
                    for (let k = 0; k < indexList.length; k++) routeData.route[indexList[k]].wait = waitTime;
                    waitTime = -routeData.route[j].end.time;
                    indexList = [];
                }
            } else if (waitTime) {
                indexList.push(j);
            }
        }
        routes.push(routeData);
    }
    app.tripData = routes;
}