const https = require('https');

const FIREBASE_URL = 'https://wos-dashboard-38d4c-default-rtdb.firebaseio.com';
const FIREBASE_SECRET = 'n5fTnxcK5J5ddNsT77AhZIoQGTogW3ROpk4k03Sv';

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

function patchFirebase(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = https.request(`${FIREBASE_URL}${path}.json?auth=${FIREBASE_SECRET}`, {
      method: 'PATCH',
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

async function runCleanup() {
  console.log('================================================================');
  console.log('      🧹 AUDITING & CLEANING ORPHANED EVENT & ROSTER DATA');
  console.log('================================================================\n');

  // 1. Fetch current active members
  const [rosterLive, users, usersAlts, sdLive, champ, merc] = await Promise.all([
    fetchFirebase('/roster_live'),
    fetchFirebase('/users'),
    fetchFirebase('/users_alts'),
    fetchFirebase('/showdown_live'),
    fetchFirebase('/championship'),
    fetchFirebase('/mercenary')
  ]);

  console.log('1. Purging test accounts (Testing Agent, Testing Agent 1)...');
  const testIds = ['1', '123456789', 'Testing Agent', 'Testing Agent 1'];
  for (const tid of testIds) {
    await deleteFirebase(`/roster_live/${tid}`);
    await deleteFirebase(`/roster_live/${encodeURIComponent(tid)}`);
    await deleteFirebase(`/championship/${tid}`);
    await deleteFirebase(`/mercenary/${tid}`);
    await deleteFirebase(`/giftcode_bot/${tid}`);
    await deleteFirebase(`/beartrap/${tid}`);
    await deleteFirebase(`/beartrap_donations/${tid}`);
  }
  await deleteFirebase(`/championship/ID`);
  console.log('   ✅ Purged test accounts from all nodes.');

  // 2. Consolidate showdown_live duplicates (non-breaking spaces, case variations)
  console.log('\n2. Consolidating showdown_live duplicate entries...');
  const mergedSd = {};
  for (const [rawName, scores] of Object.entries(sdLive || {})) {
    if (!scores || typeof scores !== 'object') continue;
    // Normalize spaces and trims
    const cleanName = rawName.replace(/[\u00a0\u1680\u180e\u2000-\u200b\u202f\u205f\u3000\ufeff]/g, ' ').replace(/\s+/g, ' ').trim();
    
    // Check if test account
    if (cleanName.toLowerCase().includes('testing agent')) {
      await deleteFirebase(`/showdown_live/${rawName}`);
      continue;
    }

    if (!mergedSd[cleanName]) {
      mergedSd[cleanName] = { ...scores, _rawKeys: [rawName] };
    } else {
      // Merge scores taking maximum
      for (let i = 1; i <= 6; i++) {
        mergedSd[cleanName]['d' + i] = Math.max(mergedSd[cleanName]['d' + i] || 0, scores['d' + i] || 0);
      }
      mergedSd[cleanName]._rawKeys.push(rawName);
    }
  }

  // Write merged showdown_live
  for (const [cleanName, data] of Object.entries(mergedSd)) {
    const rawKeys = data._rawKeys || [];
    delete data._rawKeys;
    
    // If raw key differed or multiple keys existed, clean up old keys and write clean key
    if (rawKeys.length > 1 || (rawKeys.length === 1 && rawKeys[0] !== cleanName)) {
      console.log(`   Consolidating ${rawKeys.join(' + ')} -> ${cleanName}`);
      for (const k of rawKeys) {
        await deleteFirebase(`/showdown_live/${k}`);
        await deleteFirebase(`/showdown_live/${encodeURIComponent(k)}`);
      }
      await putFirebase(`/showdown_live/${cleanName}`, data);
    }
  }
  console.log('   ✅ Consolidated showdown_live duplicate keys.');

  // 3. Clean championship duplicates (keep numeric GIDs and valid clean keys)
  console.log('\n3. Cleaning duplicate /championship string keys...');
  const champKeys = Object.keys(champ || {});
  for (const key of champKeys) {
    if (key === 'ID' || key === 'Chief Name') {
      await deleteFirebase(`/championship/${key}`);
    }
  }

  console.log('\n🎉 ALL ORPHANED EVENT RECORDS AND TEST ACCOUNTS CLEANED!');
}

runCleanup();


