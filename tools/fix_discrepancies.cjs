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

async function fix() {
  console.log('1. Deleting dummy test user xVgLDimTXlax8RVIvdeB77ARghk2 (test3@wos.com)...');
  await deleteFirebase('/users/xVgLDimTXlax8RVIvdeB77ARghk2');

  console.log('2. Cleaning Brian\'s linkedGameIds (removing invalid test ID 738924588)...');
  await patchFirebase('/users/IM03MidriobQzNlY1uLwgAwEPiV2', {
    linkedGameIds: ['628432919', '735795416', '735162894', '739273797', '737099025']
  });

  console.log('3. Cleaning Sigmashu\'s linkedGameIds (removing invalid test ID 532577151)...');
  await patchFirebase('/users/8tdxTMNxttY7tWh1yd2AeVFMP5w1', {
    linkedGameIds: []
  });

  console.log('✅ ALL DISCREPANCIES RESOLVED!');
}

fix();
