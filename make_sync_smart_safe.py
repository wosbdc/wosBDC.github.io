with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

smart_sync = """window.syncAllSheetsToFirebase = async () => {
    const btn = document.getElementById('syncAllSheetsBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⚡ Syncing (Smart Merge)...';
    }
    if (window.showToast) window.showToast("Starting Smart Non-Destructive Sync...", "accent");

    try {
        let syncedStats = { btWins: 0, btDonations: 0, preservedFirebase: 0 };

        // Read existing Firebase nodes first so we NEVER overwrite newer data
        const [existingWinsSnap, existingDonSnap] = await Promise.all([
            get(ref(db, 'beartrap_wins')),
            get(ref(db, 'beartrap_donations'))
        ]);
        const existingWins = existingWinsSnap.exists() ? (existingWinsSnap.val() || {}) : {};
        const existingDon = existingDonSnap.exists() ? (existingDonSnap.val() || {}) : {};

        // 1. Sync LeaderBoards (Bear Trap Wins & Donations) safely
        const rawSheet = await fetchSheet("LeaderBoards");
        if (rawSheet && Array.isArray(rawSheet) && rawSheet.length > 0) {
            let parsedBoards = [];
            for (let r = 0; r < rawSheet.length; r++) {
                for (let c = 0; c < rawSheet[r].length; c++) {
                    let cell = rawSheet[r][c];
                    if (typeof cell === 'string' && (cell.toLowerCase().includes('leaderboard') || (cell.toLowerCase().includes('all-time') && (cell.toLowerCase().includes('bear') || cell.toLowerCase().includes('bt')) && cell.toLowerCase().includes('donation')))) {
                        let title = cell;
                        let headers = [];
                        let hc = c;
                        if (r + 1 < rawSheet.length) {
                            while (hc < rawSheet[r+1].length && rawSheet[r+1][hc] !== "") {
                                headers.push(rawSheet[r+1][hc]);
                                hc++;
                            }
                        }
                        let rows = [];
                        let dr = r + 2;
                        while (dr < rawSheet.length && rawSheet[dr][c] !== "") {
                            let rowData = [];
                            let hasPlayerData = false;
                            for (let i = 0; i < headers.length; i++) {
                                let cellVal = rawSheet[dr][c + i];
                                rowData.push(cellVal);
                                if (i > 0 && cellVal !== "") hasPlayerData = true;
                            }
                            if (hasPlayerData) rows.push(rowData);
                            dr++;
                        }
                        if (headers.length > 0) parsedBoards.push({ title, headers, rows });
                    }
                }
            }

            // Seed/Merge Bear Trap Wins with Math.max protection
            let winsAgg = JSON.parse(JSON.stringify(existingWins));
            // Seed/Merge Bear Trap Donations with Math.max protection
            let donAgg = JSON.parse(JSON.stringify(existingDon));

            parsedBoards.forEach(board => {
                let t = board.title.toLowerCase();
                let isDonation = t.includes('donation');
                let isAllTime = t.includes('all-time');
                let isBt1 = t.includes('bear trap 1');
                let isBt2 = t.includes('bear trap 2');

                board.rows.forEach(r => {
                    let pName = r[1] ? r[1].toString().trim() : null;
                    let val = parseInt(String(r[2]).replace(/,/g, '')) || 0;
                    if (!pName || val <= 0) return;

                    let key = pName.toLowerCase().replace(/[^a-z0-9]/g, '_');

                    if (isDonation) {
                        if (!donAgg[key]) donAgg[key] = { name: pName, current: 0, allTime: 0, lastUpdated: Date.now() };
                        donAgg[key].name = pName;
                        if (isAllTime) donAgg[key].allTime = Math.max(donAgg[key].allTime || 0, val);
                        else donAgg[key].current = Math.max(donAgg[key].current || 0, val);
                    } else {
                        if (!winsAgg[key]) winsAgg[key] = { name: pName, bt1: 0, bt2: 0, total: 0 };
                        winsAgg[key].name = pName;
                        if (isBt1) winsAgg[key].bt1 = Math.max(winsAgg[key].bt1 || 0, val);
                        else if (isBt2) winsAgg[key].bt2 = Math.max(winsAgg[key].bt2 || 0, val);
                        else if (isAllTime) winsAgg[key].total = Math.max(winsAgg[key].total || 0, val);
                    }
                });
            });

            // Recalculate totals for wins
            Object.values(winsAgg).forEach(w => {
                let calcTotal = (w.bt1 || 0) + (w.bt2 || 0);
                w.total = Math.max(w.total || 0, calcTotal);
            });

            // Write winsAgg back to Firebase safely
            for (const [key, val] of Object.entries(winsAgg)) {
                await set(ref(db, `beartrap_wins/${key}`), val);
                syncedStats.btWins++;
            }

            // Write donAgg back to Firebase safely
            for (const [key, val] of Object.entries(donAgg)) {
                await set(ref(db, `beartrap_donations/${key}`), val);
                syncedStats.btDonations++;
            }
        }

        // NOTE: Showdown live data in Firebase ('showdown') is NEVER overwritten because Firebase is the primary source of truth for Showdown!
        
        // Log Smart Sync
        window.logAdminAction("Firebase Smart Sync", `Smart merged ${syncedStats.btWins} Bear Trap Win records and ${syncedStats.btDonations} Donation records into Firebase (Preserving all live Firebase Showdown data)`);
        if (window.showToast) window.showToast(`🛡️ Smart Sync Complete! Preserved live Firebase Showdown data & merged highest values into Firebase (${syncedStats.btWins} win records, ${syncedStats.btDonations} donation records).`, "success");

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '⚡ Master Sync Sheets ➔ Firebase';
        }
    } catch (e) {
        console.error("Smart sync error:", e);
        if (window.showToast) window.showToast("Error during Smart Sync: " + e.message, "error");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '⚡ Master Sync Sheets ➔ Firebase';
        }
    }
};"""

old_sync_start = "window.syncAllSheetsToFirebase = async () => {"
old_sync_end = "};"

# Find boundaries of old window.syncAllSheetsToFirebase
start_idx = content.find(old_sync_start)
if start_idx != -1:
    end_idx = content.find("window.logAdminAction = async", start_idx)
    if end_idx != -1:
        content = content[:start_idx] + smart_sync + "\n\n" + content[end_idx:]
        with open('main.js', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Successfully updated window.syncAllSheetsToFirebase with Smart Merge & Showdown Protection")
    else:
        print("End boundary not found")
else:
    print("Start boundary not found")
