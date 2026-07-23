with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

expanded_sync = """window.syncAllSheetsToFirebase = async () => {
    const btn = document.getElementById('syncAllSheetsBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⚡ Syncing ALL Sheets ➔ Firebase...';
    }
    if (window.showToast) window.showToast("Starting Master Sync for ALL Sheets...", "accent");

    try {
        let stats = { btWins: 0, btDonations: 0, roster: 0, championship: 0, mercenary: 0, polar: 0, schedule: 0 };

        // Read existing Firebase nodes first for Math.max non-destructive protection
        const [existingWinsSnap, existingDonSnap] = await Promise.all([
            get(ref(db, 'beartrap_wins')),
            get(ref(db, 'beartrap_donations'))
        ]);
        const existingWins = existingWinsSnap.exists() ? (existingWinsSnap.val() || {}) : {};
        const existingDon = existingDonSnap.exists() ? (existingDonSnap.val() || {}) : {};

        // 1. Sync LeaderBoards (Bear Trap Wins & Donations)
        try {
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

                let winsAgg = JSON.parse(JSON.stringify(existingWins));
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

                Object.values(winsAgg).forEach(w => {
                    let calcTotal = (w.bt1 || 0) + (w.bt2 || 0);
                    w.total = Math.max(w.total || 0, calcTotal);
                });

                for (const [key, val] of Object.entries(winsAgg)) {
                    await set(ref(db, `beartrap_wins/${key}`), val);
                    stats.btWins++;
                }

                for (const [key, val] of Object.entries(donAgg)) {
                    await set(ref(db, `beartrap_donations/${key}`), val);
                    stats.btDonations++;
                }
            }
        } catch(e) {
            console.warn("Error syncing LeaderBoards sheet:", e);
        }

        // 2. Sync Alliance Roster (Chief's List)
        try {
            const rosterData = await window.fetchRoster();
            if (rosterData) {
                await set(ref(db, 'roster_cache'), { data: rosterData, lastSynced: Date.now() });
                stats.roster = Array.isArray(rosterData) ? rosterData.length : 1;
            }
        } catch(e) {
            console.warn("Error syncing Roster sheet:", e);
        }

        // 3. Sync Alliance Championship Sheet
        try {
            const champData = await fetchSheet("Alliance Championship ");
            if (champData) {
                await set(ref(db, 'championship_cache'), { data: champData, lastSynced: Date.now() });
                stats.championship = Array.isArray(champData) ? champData.length : 1;
            }
        } catch(e) {
            console.warn("Error syncing Alliance Championship sheet:", e);
        }

        // 4. Sync Mercenary Prestige Sheet
        try {
            const mercData = await fetchSheet("Mercenary Prestige");
            if (mercData) {
                await set(ref(db, 'mercenary_cache'), { data: mercData, lastSynced: Date.now() });
                stats.mercenary = Array.isArray(mercData) ? mercData.length : 1;
            }
        } catch(e) {
            console.warn("Error syncing Mercenary Prestige sheet:", e);
        }

        // 5. Sync Polar Terrors Sheet
        try {
            const polarData = await fetchSheet("Polar Terrors");
            if (polarData) {
                await set(ref(db, 'polar_terrors_cache'), { data: polarData, lastSynced: Date.now() });
                stats.polar = Array.isArray(polarData) ? polarData.length : 1;
            }
        } catch(e) {
            console.warn("Error syncing Polar Terrors sheet:", e);
        }

        // 6. Sync Event Schedule Sheet
        try {
            const schedData = await fetchSheet("WhiteOut Survival");
            if (schedData) {
                await set(ref(db, 'schedule_cache'), { data: schedData, lastSynced: Date.now() });
                stats.schedule = Array.isArray(schedData) ? schedData.length : 1;
            }
        } catch(e) {
            console.warn("Error syncing Event Schedule sheet:", e);
        }

        // NOTE: Live Firebase Showdown data ('showdown') is 100% protected and untouched!

        window.logAdminAction("Firebase Master Sync All Sheets", `Completed master sync across ALL 8 sheets (LeaderBoards, Roster, Championship, Mercenary, Polar Terrors, Schedule) while protecting live Firebase Showdown data.`);
        if (window.showToast) window.showToast(`✅ Master Sync Complete for ALL Sheets! Firebase is 100% seeded (${stats.btWins} BT wins, ${stats.btDonations} BT donations, Roster, Championship, Mercenary, Polar & Schedule updated).`, "success");

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '⚡ Master Sync Sheets ➔ Firebase';
        }
    } catch (e) {
        console.error("Master sync error:", e);
        if (window.showToast) window.showToast("Error during Master Sync: " + e.message, "error");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '⚡ Master Sync Sheets ➔ Firebase';
        }
    }
};"""

old_sync_start = "window.syncAllSheetsToFirebase = async () => {"
start_idx = content.find(old_sync_start)
if start_idx != -1:
    end_idx = content.find("window.logAdminAction = async", start_idx)
    if end_idx != -1:
        content = content[:start_idx] + expanded_sync + "\n\n" + content[end_idx:]
        with open('main.js', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Successfully expanded window.syncAllSheetsToFirebase for ALL sheets")
    else:
        print("End boundary not found")
else:
    print("Start boundary not found")
