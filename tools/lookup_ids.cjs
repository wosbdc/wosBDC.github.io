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
  console.log('Fetching entire root database...');
  const root = await fetchFirebase('/');
  
  function scan(obj, path) {
    if (!obj) return;
    if (typeof obj === 'string') {
      if (obj === 'Thadwarf') console.log('Exact string "Thadwarf" at:', path);
      if (obj === 'thadwarf') console.log('Exact string "thadwarf" at:', path);
    } else if (typeof obj === 'object') {
      for (const [k, v] of Object.entries(obj)) {
        if (k === 'Thadwarf') console.log('Key "Thadwarf" at:', path + '/' + k);
        if (k === 'thadwarf') console.log('Key "thadwarf" at:', path + '/' + k);
        scan(v, path + '/' + k);
      }
    }
  }
  
  scan(root, '');
}

inspectShowdown();
