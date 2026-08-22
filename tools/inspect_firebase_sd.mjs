import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyBuw51XRkUz5sbr-i8DKiGUgMpAPSiR-vs",
    authDomain: "wos-dashboard-38d4c.firebaseapp.com",
    databaseURL: "https://wos-dashboard-38d4c-default-rtdb.firebaseio.com",
    projectId: "wos-dashboard-38d4c"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function inspectShowdown() {
    console.log("=== SHOWDOWN LIVE ===");
    const liveSnap = await get(ref(db, 'showdown_live'));
    if (liveSnap.exists()) {
        const live = liveSnap.val();
        console.log(`Total live keys: ${Object.keys(live).length}`);
        Object.entries(live).forEach(([k, v]) => {
            console.log(`Key: [${k}] ->`, JSON.stringify(v));
        });
    } else {
        console.log("No data in showdown_live");
    }

    console.log("\n=== SHOWDOWN META HISTORY ===");
    const histSnap = await get(ref(db, 'showdown_meta/history'));
    if (histSnap.exists()) {
        const hist = histSnap.val();
        Object.entries(hist).forEach(([blockKey, block]) => {
            console.log(`\nBlock: ${blockKey} (Date: ${block.date || block.title})`);
            if (block.players) {
                block.players.forEach(p => {
                    if (p.name && (p.name.toLowerCase().includes('miaow') || p.name.toLowerCase().includes('frost') || p.name.toLowerCase().includes('bdcfdaddy'))) {
                        console.log(`   Player: [${p.name}], total: ${p.total}, d1..d6: ${p.d1}, ${p.d2}, ${p.d3}, ${p.d4}, ${p.d5}, ${p.d6}`);
                    }
                });
            }
        });
    } else {
        console.log("No data in showdown_meta/history");
    }

    process.exit(0);
}

inspectShowdown();
