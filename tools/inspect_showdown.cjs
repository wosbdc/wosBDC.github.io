const https = require('https');

const FIREBASE_URL = 'https://wos-bdc-default-rtdb.firebaseio.com';

function fetchFirebase(path) {
    return new Promise((resolve, reject) => {
        https.get(`${FIREBASE_URL}/${path}.json`, (res) => {
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
    console.log('--- SHOWDOWN LIVE ---');
    const live = await fetchFirebase('showdown_live');
    if (live) {
        Object.keys(live).forEach(k => {
            if (k.toLowerCase().includes('miaow') || k.toLowerCase().includes('frost') || k.toLowerCase().includes('bdcfdaddy')) {
                console.log(`Key: [${k}] -> JSON:`, JSON.stringify(live[k]));
            }
        });
        console.log('Total keys in showdown_live:', Object.keys(live).length);
    } else {
        console.log('showdown_live is empty or null');
    }

    console.log('\n--- SHOWDOWN META HISTORY ---');
    const hist = await fetchFirebase('showdown_meta/history');
    if (hist) {
        Object.keys(hist).forEach(blockKey => {
            const block = hist[blockKey];
            console.log(`\nBlock: ${blockKey} (Date: ${block.date || block.title})`);
            if (block.players) {
                block.players.forEach(p => {
                    if (p.name && (p.name.toLowerCase().includes('miaow') || p.name.toLowerCase().includes('frost'))) {
                        console.log(`   Player: [${p.name}], total: ${p.total}, d1..d6: ${p.d1}, ${p.d2}, ${p.d3}, ${p.d4}, ${p.d5}, ${p.d6}`);
                    }
                });
            }
        });
    }
}

main();
