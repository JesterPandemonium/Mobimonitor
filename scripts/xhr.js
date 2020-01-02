let fetch = function (url) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.onload = function () {
            if (xhr.status != 200) reject('Der Server ist momentan nicht erreichbar.');
            else {
                let response = JSON.parse(this.responseText);
                if (response.err) reject('Es ist ein interner Fehler aufgetreten.');
                else resolve(response);
            }
        }
        xhr.send();
    });
}

let sendToServer = function (url, params) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
            if (xhr.status != 200) reject('Der Server ist momentan nicht erreichbar.');
            else {
                let response = JSON.parse(this.responseText);
                if (response.err) reject('Es ist ein interner Fehler aufgetreten.');
                else resolve(response);
            }
        }
        xhr.send(JSON.stringify(params));
    });
}

let fetchAPI = function (url, params) {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.onload = function () {
            if (xhr.status != 200) reject(['Der Fahrplan-API ist momentan nicht erreichbar.', { errCode: xhr.status }]);
            else {
                let response = JSON.parse(this.responseText);
                if (response.Status.Code != 'Ok') reject(['Es ist ein API-interner Fehler aufgetreten.', response]);
                else resolve(response);
            }
        }
        xhr.send(JSON.stringify(params));
    });
}