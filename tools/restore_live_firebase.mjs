const FIREBASE_URL = "https://wos-dashboard-38d4c-default-rtdb.firebaseio.com";

async function main() {
  console.log("🚀 Restoring live Showdown scores & enemy alliance scores in Firebase...");
  
  // 1. Fetch latest archive snapshot
  const metaHistRes = await fetch(`${FIREBASE_URL}/showdown_meta/history.json`);
  const metaHist = await metaHistRes.json();
  
  if (!metaHist) {
    console.error("❌ No showdown_meta/history found!");
    return;
  }
  
  const timestamps = Object.keys(metaHist);
  const latestTs = timestamps.sort((a,b) => b - a)[0];
  const archive = metaHist[latestTs];
  const players = archive.players || [];
  
  console.log(`Found ${players.length} players in archive ${latestTs}`);
  
  // 2. Write player scores back to showdown_live
  let livePayload = {};
  for (const p of players) {
    if (!p.name) continue;
    livePayload[p.name] = {
      d1: p.d1 || 0,
      d2: p.d2 || 0,
      d3: p.d3 || 0,
      d4: p.d4 || 0,
      d5: p.d5 || 0,
      d6: p.d6 || 0
    };
  }
  
  const livePutRes = await fetch(`${FIREBASE_URL}/showdown_live.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(livePayload)
  });
  console.log("showdown_live restore status:", livePutRes.status);
  
  // 3. Write enemy alliance metadata ([RED]Army) back to showdown_meta/enemyAlliance
  const enemyPayload = {
    name: "[RED]Army",
    scores: {
      d1: 4531447,
      d2: 4766115,
      d3: 3990556,
      d4: 6893670,
      d5: 4497906,
      d6: 12501628
    }
  };
  
  const enemyPutRes = await fetch(`${FIREBASE_URL}/showdown_meta/enemyAlliance.json`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(enemyPayload)
  });
  console.log("showdown_meta/enemyAlliance restore status:", enemyPutRes.status);
  
  console.log("✅ RESTORE COMPLETE! All live player scores and enemy alliance scores have been restored to Firebase.");
}

main().catch(console.error);
