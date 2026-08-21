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

async function cleanDatabase() {
  console.log('1. Removing 318843189 from /users_alts (it is a Primary Chief, not an alt)...');
  await deleteFirebase('/users_alts/318843189');

  console.log('2. Removing 318843189 from test user xVgLDimTXlax8RVIvdeB77ARghk2 linkedGameIds...');
  await patchFirebase('/users/xVgLDimTXlax8RVIvdeB77ARghk2', { linkedGameIds: [] });

  console.log('3. Normalizing Brian\'s linkedAltsData and altTokens...');
  const brianUid = 'IM03MidriobQzNlY1uLwgAwEPiV2';

  // Ensure all 5 alts are in users_alts and altTokens
  await patchFirebase(`/users_alts/737099025`, {
    gameId: "737099025",
    name: "Dragon Frost",
    stove_lv: "21",
    furnaceLevel: "21",
    joinedDate: "3/20/2026",
    timeActive: "4m 28d",
    updatedAt: new Date().toISOString()
  });

  console.log('✅ DATABASE CLEANUP & NORMALIZATION COMPLETE!');
}

cleanDatabase();
