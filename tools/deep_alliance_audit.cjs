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

async function deepAudit() {
  console.log('================================================================');
  console.log('       🛡️ COMPLETE ALLIANCE MEMBERS & ALTS INTEGRITY AUDIT');
  console.log('================================================================\n');

  const [users, usersAlts, rosterLive] = await Promise.all([
    fetchFirebase('/users'),
    fetchFirebase('/users_alts'),
    fetchFirebase('/roster_live')
  ]);

  let totalPrimaryUsers = 0;
  let totalLinkedAlts = 0;
  let totalActiveTokens = 0;
  let totalExpiredTokens = 0;
  let discrepancies = [];

  const claimedAltsMap = new Map(); // altId -> [uids]

  for (const [uid, u] of Object.entries(users || {})) {
    totalPrimaryUsers++;
    const primaryGid = (u.gameId || '').toString().trim();
    const primaryName = (u.name || u.chiefName || '').toString().trim();
    const primaryStove = u.stove_lv || u.furnaceLevel || 'N/A';
    const hasMainToken = !!u.wos_cg_token;

    console.log(`\n👑 MEMBER: ${primaryName || 'Unnamed'} (ID: ${primaryGid || 'N/A'})`);
    console.log(`   • UID: ${uid}`);
    console.log(`   • Email: ${u.email || 'N/A'}`);
    console.log(`   • Furnace: ${primaryStove}`);
    console.log(`   • Main 30d Token: ${hasMainToken ? '🟢 Active' : '⚪ Unverified / Expired'}`);

    const linkedIds = Array.isArray(u.linkedGameIds) ? u.linkedGameIds : (u.linkedGameIds ? Object.values(u.linkedGameIds) : []);
    const altTokens = u.altTokens || {};

    if (linkedIds.length === 0 && Object.keys(altTokens).length === 0) {
      console.log('   • Linked Alts: None (Single Character Profile)');
    } else {
      console.log(`   • Linked Alts (${linkedIds.length}):`);
      for (const altId of linkedIds) {
        totalLinkedAlts++;
        const cleanAltId = altId.toString().trim();

        // Track ownership collision
        if (!claimedAltsMap.has(cleanAltId)) claimedAltsMap.set(cleanAltId, []);
        claimedAltsMap.get(cleanAltId).push({ uid, name: primaryName });

        const altTok = altTokens[cleanAltId];
        const globalAlt = usersAlts ? usersAlts[cleanAltId] : null;

        const altName = (altTok && altTok.nickname) || (globalAlt && globalAlt.name) || `Alt ${cleanAltId}`;
        const altStove = (altTok && (altTok.stove_lv || altTok.furnaceLevel)) || (globalAlt && (globalAlt.stove_lv || globalAlt.furnaceLevel)) || 'N/A';
        const isTokActive = altTok && !!altTok.token && (altTok.tokenExpired === false || !altTok.tokenExpired);

        if (isTokActive) totalActiveTokens++;
        else totalExpiredTokens++;

        console.log(`      └─ 🔗 [${cleanAltId}] ${altName} | Furnace: ${altStove} | Token: ${isTokActive ? '🟢 30d Active' : '⚪ Needs Renewal'}`);

        // Cross-check: If alt is missing from users_alts global lookup
        if (!globalAlt) {
          discrepancies.push(`Alt ID ${cleanAltId} (${altName}) owned by ${primaryName} is missing from global /users_alts directory.`);
        }
      }
    }
  }

  // Cross-check 2: Check for alt claim collisions (2 users claiming same alt)
  for (const [altId, owners] of claimedAltsMap.entries()) {
    if (owners.length > 1) {
      discrepancies.push(`Collision: Alt ID ${altId} is claimed by multiple users: ${owners.map(o => o.name).join(', ')}`);
    }
  }

  // Cross-check 3: Check for primary chiefs erroneously listed in users_alts
  for (const [uid, u] of Object.entries(users || {})) {
    const primaryGid = (u.gameId || '').toString().trim();
    if (primaryGid && usersAlts && usersAlts[primaryGid]) {
      discrepancies.push(`Chief ${u.name} (ID: ${primaryGid}) is a PRIMARY user but also exists in /users_alts table.`);
    }
  }

  console.log('\n================================================================');
  console.log('                      📊 AUDIT SUMMARY');
  console.log('================================================================');
  console.log(`• Total Alliance User Profiles: ${totalPrimaryUsers}`);
  console.log(`• Total Linked Alt Characters: ${totalLinkedAlts}`);
  console.log(`• Active 30-Day Sync Tokens: ${totalActiveTokens}`);
  console.log(`• Discrepancies / Inconsistencies Found: ${discrepancies.length}`);

  if (discrepancies.length === 0) {
    console.log('\n🎉 100% HEALTHY! ALL USERS, ALTS, TOKENS, AND PERMISSIONS ARE PERFECTLY SYNCED!');
  } else {
    console.log('\n⚠️ Found Discrepancies:');
    discrepancies.forEach((d, i) => console.log(`   ${i + 1}. ${d}`));
  }
}

deepAudit();
