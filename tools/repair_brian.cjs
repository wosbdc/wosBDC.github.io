const https = require('https');

const FIREBASE_URL = 'https://wos-dashboard-38d4c-default-rtdb.firebaseio.com';
const FIREBASE_SECRET = 'n5fTnxcK5J5ddNsT77AhZIoQGTogW3ROpk4k03Sv';

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

function fetchFirebase(path) {
  return new Promise((resolve, reject) => {
    https.get(`${FIREBASE_URL}${path}.json?auth=${FIREBASE_SECRET}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function repairBrian() {
  const brianUid = 'IM03MidriobQzNlY1uLwgAwEPiV2';
  const u = await fetchFirebase(`/users/${brianUid}`);
  console.log('Current Brian Data:', u);

  const currentWosToken = u.wos_cg_token;

  // Move the Guardian token into altTokens/628432919
  const guardianAltToken = {
    avatar_image: "https://gof-formal-avatar.akamaized.net/avatar/2025/11/13/6kP2nQ_1763006700.png",
    centuryGamesVerified: true,
    furnaceLevel: "1",
    joinedDate: "11/13/2025",
    lastSyncedAt: new Date().toISOString(),
    nickname: "Guardian",
    section: "2089",
    stove_lv: "1",
    timeActive: "9m 5d",
    token: currentWosToken,
    tokenExpired: false,
    tokenStatus: {
      checkedAt: new Date().toISOString(),
      daysLeft: 30,
      gameId: "628432919",
      nickname: "Guardian",
      status: "active",
      stove_lv: "1"
    },
    verifiedAt: new Date().toISOString()
  };

  // Restore Brian's primary main profile
  const brianUpdates = {
    name: "BrianDCox",
    gameId: "318843189",
    stove_lv: "FC 8",
    furnaceLevel: "FC 8",
    avatarPreference: "wos",
    avatar_image: "https://gof-formal-avatar.akamaized.net/avatar/2024/11/21/oP99xX_1732184392.png",
    tokenExpired: true, // Need fresh token for 318843189
    wos_cg_token: null, // Clear contaminated alt token from main profile
    tokenStatus: {
      status: "expired",
      daysLeft: 0,
      gameId: "318843189",
      nickname: "BrianDCox",
      stove_lv: "FC 8"
    }
  };

  console.log('Patching altTokens/628432919...');
  await patchFirebase(`/users/${brianUid}/altTokens/628432919`, guardianAltToken);

  console.log('Patching users_alts/628432919...');
  await patchFirebase(`/users_alts/628432919`, {
    gameId: "628432919",
    name: "Guardian",
    stove_lv: "1",
    furnaceLevel: "1",
    avatar_image: "https://gof-formal-avatar.akamaized.net/avatar/2025/11/13/6kP2nQ_1763006700.png",
    joinedDate: "11/13/2025",
    timeActive: "9m 5d",
    lastSyncedAt: new Date().toISOString()
  });

  console.log('Restoring Brian main user record...');
  await patchFirebase(`/users/${brianUid}`, brianUpdates);

  console.log('✅ REPAIR COMPLETE!');
}

repairBrian();
