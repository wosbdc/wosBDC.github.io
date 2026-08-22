const https = require('https');

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbzEDRKqYLW05dris_vyxF-SZEH5917Saa5eRieag0n_gbJeWj3Qo_Zvgch94hBg1tE/exec';

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return resolve(fetchUrl(res.headers.location));
            }
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    resolve(data);
                }
            });
        }).on('error', reject);
    });
}

async function main() {
    console.log('Fetching Showdown History from Google Sheets API...');
    try {
        const histData = await fetchUrl(`${API_BASE_URL}?api=Showdown%20History`);
        console.log('Showdown History length:', Array.isArray(histData) ? histData.length : typeof histData);
        if (Array.isArray(histData)) {
            histData.forEach((row, i) => {
                const rStr = JSON.stringify(row);
                if (rStr.includes('365') || rStr.includes('Miaow') || rStr.includes('1316003') || rStr.includes('1,316,003')) {
                    console.log(`Row ${i}:`, row);
                }
            });
        } else if (histData && histData.data) {
            histData.data.forEach((row, i) => {
                const rStr = JSON.stringify(row);
                if (rStr.includes('365') || rStr.includes('Miaow') || rStr.includes('1316003') || rStr.includes('1,316,003')) {
                    console.log(`Row ${i}:`, row);
                }
            });
        }
    } catch(e) {
        console.error('Error:', e);
    }

    console.log('\nFetching Showdown (Live/Current) from Google Sheets API...');
    try {
        const sdData = await fetchUrl(`${API_BASE_URL}?api=Showdown`);
        console.log('Showdown length:', Array.isArray(sdData) ? sdData.length : typeof sdData);
        if (Array.isArray(sdData)) {
            sdData.forEach((row, i) => {
                const rStr = JSON.stringify(row);
                if (rStr.includes('365') || rStr.includes('Miaow') || rStr.includes('1316003') || rStr.includes('1,316,003')) {
                    console.log(`Row ${i}:`, row);
                }
            });
        }
    } catch(e) {
        console.error('Error:', e);
    }
}

main();
