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
    const sdData = await fetchUrl(`${API_BASE_URL}?api=Showdown`);
    console.log('Keys in Showdown API response:', Object.keys(sdData));
    let rows = Array.isArray(sdData) ? sdData : (sdData.data || sdData.values || []);
    console.log(`Found ${rows.length} rows in Showdown tab.`);
    rows.forEach((r, i) => {
        const s = JSON.stringify(r);
        if (s.includes('365') || s.includes('Miaow') || s.includes('BDCFDaddy') || s.includes('1316') || s.includes('1,316')) {
            console.log(`[${i}]`, r);
        }
    });
}

main();
