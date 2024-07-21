// This script downloads time correlations dataset from:
// https://datacenter.iers.org/data/latestVersion/EOP_C01_IAU1980_1900-now.txt

const fs = require('fs');
const https = require('https');


function downloadFile(url, targetFile) 
{
    const file = fs.createWriteStream(targetFile);

    const request = https.get(url, function(response) {
        //console.log(response);

        let vsopData = "";
        response.pipe(file);

        file.on('finish', () => {
            file.close();
            console.log('Downloaded file ' + targetFile);
        });

        // Let's keep the following in case the script is adapted into one
        // that does not store the files:
        response.on('data', (d) => {
            //console.log(d.toString());
            //console.log(typeof(d));
            vsopData = vsopData + d.toString();
        });

        response.on('end', function() {
            //console.log(vsopData);
        });
    });
}

downloadFile('https://datacenter.iers.org/data/latestVersion/EOP_C01_IAU1980_1900-now.txt', 'EOP_C01_IAU1980_1900-now.txt');
downloadFile('https://datacenter.iers.org/data/latestVersion/EOP_14_C04_IAU1980_one_file_1962-now.txt', 'EOP_14_C04_IAU1980_one_file_1962-now.txt');