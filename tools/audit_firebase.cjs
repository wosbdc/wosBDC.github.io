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

async function runAudit() {
  console.log('====================================================');
  console.log('       🔥 FIREBASE REALTIME DATABASE COMPREHENSIVE AUDIT');
  console.log('====================================================\n');

  const [users, usersAlts, rosterLive] = await Promise.all([
    fetchFirebase('/users'),
    fetchFirebase('/users_alts'),
    fetchFirebase('/roster_live')
  ]);

  console.log(`1. Total Registered Users (/users): ${Object.keys(users || {}).length}`);
  console.log(`2. Total Global Alts (/users_alts): ${Object.keys(usersAlts || {}).length}`);
  console.log(`3. Total Live Roster Entries (/roster_live): ${Object.keys(rosterLive || {}).length}\n`);

  console.log('----------------- USER AUDIT DETAILS -----------------');
  for (const [uid, u] of Object.entries(users || {})) {
    const isBrian = (u.email && u.email.toLowerCase().includes('brian')) || u.gameId === '318843189';
    console.log(`\n👤 User [${uid}] - ${u.name || 'Unnamed'} (ID: ${u.gameId || 'None'}) | Email: ${u.email || 'None'}`);
    console.log(`   - Furnace: ${u.stove_lv || u.furnaceLevel || 'N/A'}`);
    console.log(`   - Main Token: ${u.wos_cg_token ? 'Present (' + u.wos_cg_token.substring(0, 15) + '...)' : 'None'}`);
    console.log(`   - Linked Game IDs (${(u.linkedGameIds || []).length}):`, u.linkedGameIds || []);
    console.log(`   - altTokens (${Object.keys(u.altTokens || {}).length}):`, Object.keys(u.altTokens || {}));
    if (u.altTokens) {
      for (const [agid, atok] of Object.entries(u.altTokens)) {
        console.log(`      • Alt [${agid}]: ${atok.nickname || 'Unknown'} (Stove: ${atok.stove_lv || atok.furnaceLevel || 'N/A'}, Token: ${atok.token ? 'Active' : 'Missing'})`);
      }
    }
    console.log(`   - linkedAltsData (${Object.keys(u.linkedAltsData || {}).length}):`, Object.keys(u.linkedAltsData || {}));
    if (u.linkedAltsData) {
      for (const [agid, adata] of Object.entries(u.linkedAltsData)) {
        console.log(`      • AltData [${agid}]: ${adata.name || 'Unknown'} (Stove: ${adata.stove_lv || adata.furnaceLevel || 'N/A'})`);
      }
    }
  }

  console.log('\n----------------- GLOBAL ALTS (/users_alts) -----------------');
  for (const [agid, a] of Object.entries(usersAlts || {})) {
    console.log(`🔗 Alt ID [${agid}]: ${a.name || 'Unknown'} | Stove: ${a.stove_lv || a.furnaceLevel || 'N/A'} | Joined: ${a.joinedDate || 'N/A'}`);
  }
}

runAudit();
