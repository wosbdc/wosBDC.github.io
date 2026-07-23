with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add window.syncAllSheetsToFirebase function right after logAdminAction
sync_func = """
window.syncAllSheetsToFirebase = async () => {
    const btn = document.getElementById('syncAllSheetsBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⚡ Syncing Google Sheets ➔ Firebase...';
    }
    if (window.showToast) window.showToast("Starting Master Sync from Google Sheets to Firebase...", "accent");

    try {
        let syncedStats = { btWins: 0, btDonations: 0, showdown: 0 };

        // 1. Sync LeaderBoards (Bear Trap Wins & Donations)
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

            // Sync Bear Trap Wins into Firebase beartrap_wins
            let winsAgg = {};
            // Sync Bear Trap Donations into Firebase beartrap_donations
            let donAgg = {};

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
                        if (isAllTime) donAgg[key].allTime = Math.max(donAgg[key].allTime, val);
                        else donAgg[key].current = Math.max(donAgg[key].current, val);
                    } else {
                        if (!winsAgg[key]) winsAgg[key] = { name: pName, bt1: 0, bt2: 0, total: 0 };
                        if (isBt1) winsAgg[key].bt1 = Math.max(winsAgg[key].bt1, val);
                        else if (isBt2) winsAgg[key].bt2 = Math.max(winsAgg[key].bt2, val);
                        else if (isAllTime) winsAgg[key].total = Math.max(winsAgg[key].total, val);
                    }
                });
            });

            // Calculate totals for wins
            Object.values(winsAgg).forEach(w => {
                if (w.total === 0) w.total = (w.bt1 || 0) + (w.bt2 || 0);
            });

            // Write winsAgg to Firebase beartrap_wins
            for (const [key, val] of Object.entries(winsAgg)) {
                await set(ref(db, `beartrap_wins/${key}`), val);
                syncedStats.btWins++;
            }

            // Write donAgg to Firebase beartrap_donations
            for (const [key, val] of Object.entries(donAgg)) {
                await set(ref(db, `beartrap_donations/${key}`), val);
                syncedStats.btDonations++;
            }
        }

        // 2. Sync Showdown History
        try {
            const sdHist = await fetchSheet("Showdown History");
            if (sdHist) {
                await set(ref(db, 'showdown_history'), { data: sdHist, lastSynced: Date.now() });
                syncedStats.showdown = Array.isArray(sdHist) ? sdHist.length : 1;
            }
        } catch(e) {
            console.warn("Error syncing showdown history:", e);
        }

        // Log Master Sync
        window.logAdminAction("Firebase Master Sync", `Synced ${syncedStats.btWins} Bear Trap Win records, ${syncedStats.btDonations} Donation records, and Showdown history into Firebase`);
        if (window.showToast) window.showToast(`✅ Master Sync Complete! Firebase is now 100% updated (${syncedStats.btWins} win records, ${syncedStats.btDonations} donation records synced).`, "success");

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '⚡ Master Sync Google Sheets ➔ Firebase';
        }
    } catch (e) {
        console.error("Master sync error:", e);
        if (window.showToast) window.showToast("Error during Master Sync: " + e.message, "error");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '⚡ Master Sync Google Sheets ➔ Firebase';
        }
    }
};
"""

target_log_func = "window.logAdminAction = async (actionType, details, targetPlayer = '') => {"
if target_log_func in content:
    content = content.replace(target_log_func, sync_func + "\n\n" + target_log_func)
    print("Added window.syncAllSheetsToFirebase function")

# 2. Add Master Sync button to Category 2 in Daily Tools
old_category_2 = """            <!-- Category 2: System & Roster Tools -->
            <div style="background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid var(--border); margin-bottom:20px;">
              <h3 style="margin:0 0 5px 0; color:var(--text-main); text-align:left; font-size:16px;">⚙️ System & Roster Tools</h3>
              <p style="margin:0 0 15px 0; font-size:12px; color:var(--text-muted); text-align:left;">Manage Chief names, Game IDs, and broadcast push alerts.</p>
              
              <div style="display:flex; flex-direction:column; gap:12px; align-items:center;">
                <button onclick="views.playerEditor()" style="background:linear-gradient(135deg, #6366f1, #4f46e5); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px; box-shadow:0 4px 12px rgba(99,102,241,0.3);">👤 Open Player Database Editor</button>
                ${isR5 ? `<button onclick="window.openBroadcastPushModal()" style="background:linear-gradient(135deg, #ec4899, #be185d); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px; box-shadow:0 4px 12px rgba(236,72,153,0.3);">🚀 Broadcast Push Notification</button>` : ''}
              </div>
            </div>"""

new_category_2 = """            <!-- Category 2: System & Roster Tools -->
            <div style="background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid var(--border); margin-bottom:20px;">
              <h3 style="margin:0 0 5px 0; color:var(--text-main); text-align:left; font-size:16px;">⚙️ System & Roster Tools</h3>
              <p style="margin:0 0 15px 0; font-size:12px; color:var(--text-muted); text-align:left;">Manage Chief names, Game IDs, push alerts, and master database sync.</p>
              
              <div style="display:flex; flex-direction:column; gap:12px; align-items:center;">
                <button onclick="views.playerEditor()" style="background:linear-gradient(135deg, #6366f1, #4f46e5); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px; box-shadow:0 4px 12px rgba(99,102,241,0.3);">👤 Open Player Database Editor</button>
                ${isR5 ? `<button onclick="window.openBroadcastPushModal()" style="background:linear-gradient(135deg, #ec4899, #be185d); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px; box-shadow:0 4px 12px rgba(236,72,153,0.3);">🚀 Broadcast Push Notification</button>` : ''}
                <button id="syncAllSheetsBtn" onclick="window.syncAllSheetsToFirebase()" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px; box-shadow:0 4px 12px rgba(16,185,129,0.3);">⚡ Master Sync Sheets ➔ Firebase</button>
              </div>
            </div>"""

if old_category_2 in content:
    content = content.replace(old_category_2, new_category_2)
    print("Added Master Sync button to Category 2")

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)
