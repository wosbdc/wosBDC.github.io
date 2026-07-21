const { initializeApp, cert } = require('firebase-admin/app');
const { getDatabase } = require('firebase-admin/database');
const serviceAccount = require('./wosbdc-firebase-adminsdk-r4154-20fb9801db.json');

const app = initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://wosbdc-default-rtdb.firebaseio.com'
});

const db = getDatabase(app);

async function run() {
  const snap = await db.ref('sheets/Showdown').once('value');
  const rows = snap.val();
  
  let meta = { eventGoals: {}, enemyAlliance: { name: '', scores: {} }, horns: {}, winners: {} };
  for (let r = 0; r < rows.length; r++) {
    let row = rows[r];
    if (row && row.some(c => typeof c === 'string' && c.toLowerCase().includes('allience showdown'))) {
       let startCol = row.findIndex(c => typeof c === 'string' && c.toLowerCase().includes('allience showdown'));
       for (let i = 1; i <= 6; i++) {
         if (r + i < rows.length) {
           let dRow = rows[r+i];
           if (dRow[startCol]) {
              let dailyGoalRaw = dRow[startCol+2];
              let goalRaw = dRow[startCol+4];
              
              let dailyGoal = typeof dailyGoalRaw === 'number' ? dailyGoalRaw : Number((dailyGoalRaw||'').toString().replace(/,/g, '')) || 0;
              let goal = typeof goalRaw === 'number' ? goalRaw : Number((goalRaw||'').toString().replace(/,/g, '')) || 0;
              
              meta.eventGoals['d'+i] = { dailyGoal, goal };
           }
         }
       }
    }
    if (row && row.some(c => typeof c === 'string' && c.toLowerCase().includes("alliance's"))) {
       let startCol = row.findIndex(c => typeof c === 'string' && c.toLowerCase().includes("alliance's"));
       if (r+1 < rows.length) {
          let eRow = rows[r+1];
          meta.enemyAlliance.name = eRow[startCol] ? eRow[startCol].toString() : 'Enemy Alliance';
          for (let i=1; i<=6; i++) {
             let scoreRaw = eRow[startCol+2+i];
             meta.enemyAlliance.scores['d'+i] = typeof scoreRaw === 'number' ? scoreRaw : Number((scoreRaw||'').toString().replace(/,/g, '')) || 0;
          }
       }
       if (r+3 < rows.length) {
          let hRow = rows[r+3];
          for(let i=1; i<=6; i++) {
             let hornRaw = hRow[startCol+2+i];
             meta.horns['d'+i] = typeof hornRaw === 'number' ? hornRaw : Number((hornRaw||'').toString().replace(/,/g, '')) || 0;
          }
       }
       if (r+4 < rows.length) {
          let wRow = rows[r+4];
          for(let i=1; i<=6; i++) meta.winners['d'+i] = wRow[startCol+2+i] || '';
       }
    }
  }
  
  await db.ref('showdown_meta').set(meta);
  console.log(JSON.stringify(meta, null, 2));
  console.log("Migrated showdown_meta to Firebase!");
  process.exit(0);
}
run();
