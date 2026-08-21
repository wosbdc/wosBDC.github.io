const https = require('https');

const FIREBASE_URL = 'https://wos-dashboard-38d4c-default-rtdb.firebaseio.com';
const FIREBASE_SECRET = 'n5fTnxcK5J5ddNsT77AhZIoQGTogW3ROpk4k03Sv';

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

async function inspectShowdown() {
  const rosterLive = await fetchFirebase('/roster_live');
  const users = await fetchFirebase('/users');
  const usersAlts = await fetchFirebase('/users_alts');
  const sdLive = await fetchFirebase('/showdown_live');
  const champ = await fetchFirebase('/championship');
  const merc = await fetchFirebase('/mercenary');

  console.log(`Total in roster_live: ${Object.keys(rosterLive || {}).length}`);
  console.log(`Total in users (Primary registered): ${Object.keys(users || {}).length}`);
  console.log(`Total in users_alts: ${Object.keys(usersAlts || {}).length}`);
  console.log(`Total in showdown_live: ${Object.keys(sdLive || {}).length}`);
  console.log(`Total in championship: ${Object.keys(champ || {}).length}`);
  console.log(`Total in mercenary: ${Object.keys(merc || {}).length}`);

  console.log('\n--- 1. ROSTER_LIVE NAMES ---');
  Object.values(rosterLive || {}).forEach(r => console.log(`  • ${r.name || 'No Name'} (ID: ${r.gameId})`));

  console.log('\n--- 2. REGISTERED USERS (/users) ---');
  Object.values(users || {}).forEach(u => console.log(`  • ${u.name || 'No Name'} (ID: ${u.gameId}) (Email: ${u.email})`));

  console.log('\n--- 3. GLOBAL ALTS (/users_alts) ---');
  Object.values(usersAlts || {}).forEach(a => console.log(`  • ${a.name || a.nickname || 'No Name'} (ID: ${a.gameId})`));

  console.log('\n--- 4. SHOWDOWN LIVE NAMES (/showdown_live) ---');
  Object.keys(sdLive || {}).forEach(k => console.log(`  • ${k}`));

  console.log('\n--- 5. CHAMPIONSHIP PLAYERS (/championship) ---');
  Object.entries(champ || {}).forEach(([k, v]) => console.log(`  • Key: ${k} | Name: ${v.name || 'N/A'}`));

  console.log('\n--- 6. MERCENARY PLAYERS (/mercenary) ---');
  Object.entries(merc || {}).forEach(([k, v]) => console.log(`  • Key: ${k} | Name: ${v.name || 'N/A'}`));
}

inspectShowdown();
