const fsp = require('fs').promises;

fsp.readdir('data').then(filenames => {
    for (const filename of filenames) {
        fsp.readFile('data/' + filename).then(strData => {
            const data = JSON.parse(strData);
            
            // do anything with data
            
            strData = JSON.stringify(data, null, 4);
            return fsp.writeFile('data/' + filename, strData);
        }).catch(e => console.log(e));
    }
});