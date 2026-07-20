const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, update } = require('firebase/database');

const app = initializeApp({
  databaseURL: 'https://wos-dashboard-38d4c-default-rtdb.firebaseio.com'
});
const db = getDatabase(app);

async function run() {
  const snap = await get(ref(db, 'users'));
  const users = snap.val();
  const updates = {};
  for (const uid in users) {
     if (users[uid].linkedGameIds) {
        for (const gid of users[uid].linkedGameIds) {
           updates[`users/${uid}/links/${gid}`] = true;
        }
     }
  }
  if (Object.keys(updates).length > 0) {
      await update(ref(db), updates);
      console.log('Migrated links for ' + Object.keys(updates).length + ' alt accounts.');
  } else {
      console.log('No links to migrate.');
  }
  process.exit(0);
}
run();
