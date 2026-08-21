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
  console.log('      🧹 REMOVING DUPLICATE "Thadwarf" & NORMALIZING TO "thadwarf"');
  console.log('================================================================\n');

  // 1. Delete /showdown_live/Thadwarf
  console.log('1. Checking and deleting /showdown_live/Thadwarf...');
  const thadLive = await fetchFirebase('/showdown_live/Thadwarf');
  if (thadLive) {
    console.log('   Found /showdown_live/Thadwarf:', thadLive);
    await deleteFirebase('/showdown_live/Thadwarf');
    console.log('   ✅ Deleted /showdown_live/Thadwarf successfully!');
  } else {
    console.log('   ⚪ /showdown_live/Thadwarf not present or already deleted.');
  }

  // 2. Normalize /roster_live
  console.log('\n2. Normalizing /roster_live...');
  const rosterThadCapital = await fetchFirebase('/roster_live/Thadwarf');
  if (rosterThadCapital) {
    console.log('   Found /roster_live/Thadwarf key. Ensuring /roster_live/thadwarf exists...');
    rosterThadCapital.name = 'thadwarf';
    if (rosterThadCapital.tokenStatus) {
      rosterThadCapital.tokenStatus.nickname = 'thadwarf';
    }
    await putFirebase('/roster_live/thadwarf', rosterThadCapital);
    await deleteFirebase('/roster_live/Thadwarf');
    console.log('   ✅ Migrated /roster_live/Thadwarf to /roster_live/thadwarf and deleted old key.');
  }

  // 3. Normalize /showdown_history
  console.log('\n3. Normalizing /showdown_history...');
  const history = await fetchFirebase('/showdown_history');
  if (history && typeof history === 'object') {
    let modifiedHistory = false;
    for (const [cycleId, cycle] of Object.entries(history)) {
      if (!cycle) continue;
      if (cycle.winners) {
        for (const [k, v] of Object.entries(cycle.winners)) {
          if (v === 'Thadwarf') {
            cycle.winners[k] = 'thadwarf';
            modifiedHistory = true;
          }
        }
      }
      if (Array.isArray(cycle.players)) {
        cycle.players.forEach(p => {
          if (p.name === 'Thadwarf') {
            p.name = 'thadwarf';
            modifiedHistory = true;
          }
        });
      }
    }
    if (modifiedHistory) {
      await putFirebase('/showdown_history', history);
      console.log('   ✅ Normalized /showdown_history.');
    } else {
      console.log('   ⚪ /showdown_history already clean.');
    }
  }

  // 4. Normalize /showdown_meta/history
  console.log('\n4. Normalizing /showdown_meta/history...');
  const metaHistory = await fetchFirebase('/showdown_meta/history');
  if (metaHistory && typeof metaHistory === 'object') {
    let modifiedMeta = false;
    for (const [cycleId, cycle] of Object.entries(metaHistory)) {
      if (!cycle) continue;
      if (cycle.winners) {
        for (const [k, v] of Object.entries(cycle.winners)) {
          if (v === 'Thadwarf') {
            cycle.winners[k] = 'thadwarf';
            modifiedMeta = true;
          }
        }
      }
      if (Array.isArray(cycle.players)) {
        cycle.players.forEach(p => {
          if (p.name === 'Thadwarf') {
            p.name = 'thadwarf';
            modifiedMeta = true;
          }
        });
      }
    }
    if (modifiedMeta) {
      await putFirebase('/showdown_meta/history', metaHistory);
      console.log('   ✅ Normalized /showdown_meta/history.');
    } else {
      console.log('   ⚪ /showdown_meta/history already clean.');
    }
  }

  // 5. Check and normalize other nodes
  console.log('\n5. Normalizing other references...');
  await patchFirebase('/championship/705413646', { name: 'thadwarf' });
  await patchFirebase('/giftcode_bot/705413646', { name: 'thadwarf' });
  await patchFirebase('/mercenary/705413646', { name: 'thadwarf' });
  await patchFirebase('/player_event_stats/705413646', { name: 'thadwarf' });
  await patchFirebase('/beartrap_wins/thadwarf', { name: 'thadwarf' });
  console.log('   ✅ Normalized championship, giftcode_bot, mercenary, player_event_stats, beartrap_wins.');

  console.log('\n🎉 ALL FIREBASE RTDB REFERENCES TO "Thadwarf" HAVE BEEN CLEANED & NORMALIZED TO "thadwarf"!');
}

runCleanup();

