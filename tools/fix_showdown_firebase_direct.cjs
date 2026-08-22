const https = require('https');

const FIREBASE_URL = 'https://wos-dashboard-38d4c-default-rtdb.firebaseio.com';
const FIREBASE_SECRET = 'n5fTnxcK5J5ddNsT77AhZIoQGTogW3ROpk4k03Sv';

function cleanChiefName(name) {
    if (!name && name !== 0) return '';
    let str = String(name);
    
    // Strip UTF-8 mojibake, non-breaking spaces, and hidden Unicode directional/zero-width marks
    str = str.replace(/Â[\u00A0\s]/g, ' ')
             .replace(/\u00C2\u00A0/g, ' ')
             .replace(/\u00C2/g, '')
             .replace(/Â/g, '')
             .replace(/[\u00A0\u2000-\u200B\u202F\u205F\u3000\uFEFF\u200E\u200F]/g, ' ');
    
    // Trim and remove leading alliance tags like [BDC] or [B1]
    str = str.trim().replace(/^\[[^\]]*\]\s*/g, '');
    
    // Collapse consecutive whitespace to a single space
    str = str.replace(/\s+/g, ' ').trim();
    
    // Canonical name overrides & casing normalization
    const lower = str.toLowerCase();
    if (lower === 'miaow queen' || lower === 'miaowÂ queen' || lower === 'miaowqueen') return 'Miaow Queen';
    if (lower === 'perma frost' || lower === 'permaÂ frost') return 'Perma Frost';
    if (lower === 'sentinel frost' || lower === 'sentinelÂ frost') return 'Sentinel Frost';
    if (lower === 'cyrus frost' || lower === 'cyrusÂ frost') return 'Cyrus Frost';
    if (lower === 'dragon frost' || lower === 'dragonÂ frost') return 'Dragon Frost';
    if (lower === 'titan frost' || lower === 'titanÂ frost') return 'Titan Frost';
    if (lower === 'dwarf 2' || lower === 'dwarf2') return 'Dwarf 2';
    if (lower === 'lilangrygerman' || lower === 'lilangry german') return 'LilangryGerman';
    if (lower === 'angrygermandaddy' || lower === 'angrygerman daddy') return 'AngryGermandaddy';
    if (lower === 'angrygermanpapi' || lower === 'angrygerman papi') return 'AngryGermanpapi';
    if (lower === 'babyangrygerman' || lower === 'babyangry german') return 'BabyAngryGerman';
    
    return str;
}

function fetchFirebase(path) {
  return new Promise((resolve, reject) => {
    https.get(`${FIREBASE_URL}${path}.json?auth=${FIREBASE_SECRET}`, (res) => {
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

function deleteFirebase(path) {
  return new Promise((resolve, reject) => {
    const req = https.request(`${FIREBASE_URL}${path}.json?auth=${FIREBASE_SECRET}`, {
      method: 'DELETE'
    }, (res) => {
      let respData = '';
      res.on('data', chunk => respData += chunk);
      res.on('end', () => resolve(respData));
    });
    req.on('error', reject);
    req.end();
  });
}

function putFirebase(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request(`${FIREBASE_URL}${path}.json?auth=${FIREBASE_SECRET}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let respData = '';
      res.on('data', chunk => respData += chunk);
      res.on('end', () => resolve(JSON.parse(respData)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function fixShowdownFirebase() {
    console.log("=== FIXING FIREBASE SHOWDOWN_LIVE DIRECTLY ===");
    const sdLive = await fetchFirebase('/showdown_live');
    if (!sdLive || typeof sdLive !== 'object') {
        console.log("No showdown_live data found.");
        return;
    }

    const merged = {};
    const keysToDelete = [];

    for (const [rawKey, val] of Object.entries(sdLive)) {
        if (!val || typeof val !== 'object') continue;
        const cleanName = cleanChiefName(val.name || rawKey);
        if (!cleanName) continue;

        if (rawKey !== cleanName) {
            keysToDelete.push(rawKey);
        }

        if (!merged[cleanName]) {
            merged[cleanName] = {
                name: cleanName,
                d1: val.d1 || 0,
                d2: val.d2 || 0,
                d3: val.d3 || 0,
                d4: val.d4 || 0,
                d5: val.d5 || 0,
                d6: val.d6 || 0
            };
        } else {
            for (let i = 1; i <= 6; i++) {
                merged[cleanName]['d' + i] = Math.max(merged[cleanName]['d' + i] || 0, val['d' + i] || 0);
            }
        }
        merged[cleanName].total = [1,2,3,4,5,6].reduce((sum, i) => sum + (merged[cleanName]['d'+i] || 0), 0);
    }

    console.log(`Deleting ${keysToDelete.length} corrupt / duplicate keys from Firebase...`);
    for (const k of keysToDelete) {
        console.log(`  Deleting corrupt key: [${k}]`);
        await deleteFirebase(`/showdown_live/${encodeURIComponent(k)}`);
        await deleteFirebase(`/showdown_live/${k}`);
    }

    console.log(`Writing ${Object.keys(merged).length} clean merged keys to Firebase showdown_live...`);
    for (const [cleanName, data] of Object.entries(merged)) {
        console.log(`  Writing clean key: [${cleanName}] -> D1..D5: ${data.d1}, ${data.d2}, ${data.d3}, ${data.d4}, ${data.d5} | Total: ${data.total}`);
        await putFirebase(`/showdown_live/${cleanName}`, data);
    }

    console.log("\n=== FIXING SHOWDOWN_META/HISTORY ===");
    const historySnap = await fetchFirebase('/showdown_meta/history');
    if (historySnap && typeof historySnap === 'object') {
        for (const [blockKey, block] of Object.entries(historySnap)) {
            if (!block || !Array.isArray(block.players)) continue;
            let changed = false;
            const playerMap = {};
            block.players.forEach(p => {
                if (!p || !p.name) return;
                const cName = cleanChiefName(p.name);
                if (cName !== p.name) changed = true;
                if (!playerMap[cName]) {
                    playerMap[cName] = { ...p, name: cName };
                } else {
                    changed = true;
                    for (let i = 1; i <= 6; i++) {
                        playerMap[cName]['d'+i] = Math.max(playerMap[cName]['d'+i] || 0, p['d'+i] || 0);
                    }
                    playerMap[cName].total = [1,2,3,4,5,6].reduce((sum, i) => sum + (playerMap[cName]['d'+i] || 0), 0);
                }
            });
            if (changed) {
                const newPlayers = Object.values(playerMap).sort((a,b) => (b.total||0) - (a.total||0));
                console.log(`  Updating history block ${blockKey} with clean player list (${newPlayers.length} players)`);
                await putFirebase(`/showdown_meta/history/${blockKey}/players`, newPlayers);
            }
        }
    }

    console.log("\n🎉 ALL SHOWDOWN DATA IN FIREBASE SUCCESSFULLY CLEANED & MERGED!");
}

fixShowdownFirebase();
