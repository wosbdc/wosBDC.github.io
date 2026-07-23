with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add autoSyncBtSignup helper function
auto_sync_helper = """window.autoSyncBtSignup = async (playerNameOrGid) => {
    if (!playerNameOrGid) return;
    try {
        let gameId = null;
        let pName = playerNameOrGid.toString().trim();
        
        if (!isNaN(pName) && pName.length >= 7) {
            gameId = pName;
        } else {
            for (const [gid, name] of Object.entries(idToNameMap)) {
                if (name.toLowerCase() === pName.toLowerCase()) {
                    gameId = gid; break;
                }
            }
        }

        if (gameId) {
            await set(ref(db, `beartrap/${gameId}/signedUp`), true);
        }
    } catch(e) {
        console.warn("Could not auto-sync Bear Trap signup:", e);
    }
};

window.resetBearTrapEvent = async () => {
    if (!confirm("⚠️ Are you sure you want to RESET the entire Bear Trap Event?\\n\\nThis will:\\n1. Archive current donations into all-time totals\\n2. Reset current donations to 0\\n3. Reset all signups to NO\\n4. Reset champions to Pending...")) return;

    if (window.showToast) window.showToast("Resetting Bear Trap Event...", "info");

    try {
        const [donSnap, btSnap] = await Promise.all([
            get(ref(db, 'beartrap_donations')),
            get(ref(db, 'beartrap'))
        ]);

        if (donSnap.exists()) {
            const dons = donSnap.val();
            for (const [key, don] of Object.entries(dons)) {
                if (don) {
                    const currentAmt = don.current || 0;
                    don.allTime = (don.allTime || 0) + currentAmt;
                    don.current = 0;
                    don.lastUpdated = Date.now();
                    await set(ref(db, `beartrap_donations/${key}`), don);
                }
            }
        }

        if (btSnap.exists()) {
            const bts = btSnap.val();
            for (const key of Object.keys(bts)) {
                await set(ref(db, `beartrap/${key}/signedUp`), false);
            }
        }

        await Promise.all([
            set(ref(db, 'beartrap_wins/1'), { name: "Pending...", score: 0 }),
            set(ref(db, 'beartrap_wins/2'), { name: "Pending...", score: 0 })
        ]);

        window.logAdminAction("Bear Trap Full Event Reset", "Archived current donations, reset scores to 0, cleared signups to NO, and reset champions to Pending...", "All Players");

        if (window.showToast) window.showToast("✅ Bear Trap Event successfully reset!", "success");

        if (window.location.hash.includes('beartrap') || document.getElementById('beartrapEntries')) {
            if (views.beartrap) views.beartrap();
        } else if (views.bearTrapAdmin) {
            views.bearTrapAdmin();
        }

    } catch (e) {
        console.error("Reset Event Error:", e);
        if (window.showToast) window.showToast("Error resetting event: " + e.message, "error");
    }
};"""

if "window.autoSyncBtSignup =" not in content:
    content = content.replace("window.submitBeartrapDonations = async () => {", auto_sync_helper + "\n\n    window.submitBeartrapDonations = async () => {")

# 2. Call autoSyncBtSignup inside submitBeartrapDonations and onBtDonationChange
old_don_set = "await set(donRef, donData);"
new_don_set = "await set(donRef, donData);\n           if (addAmt > 0) await window.autoSyncBtSignup(finalName);"
content = content.replace(old_don_set, new_don_set)

old_inline_don = "const ok = await window.updateBearTrapDonationInline(gameId, newVal);"
new_inline_don = """const ok = await window.updateBearTrapDonationInline(gameId, newVal);
            if (ok && Number(newVal) > 0) await window.autoSyncBtSignup(gameId);"""
content = content.replace(old_inline_don, new_inline_don)

# 3. Add Reset BT Event button to multi-BT donations header
old_bt_header = """<button onclick="window.resetBearTrapWinners()" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--danger); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">🔄 Reset BT Winners</button>"""
new_bt_header = """<button onclick="window.resetBearTrapEvent()" style="background:linear-gradient(135deg, #ef4444, #dc2626); color:#fff; border:none; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px; font-weight:bold; box-shadow:0 2px 8px rgba(239,68,68,0.3);">🔄 Reset BT Event</button>
            <button onclick="window.resetBearTrapWinners()" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--danger); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">🔄 Reset BT Winners</button>"""
content = content.replace(old_bt_header, new_bt_header)

# 4. Update loadActivityMatrix to include Bear Trap signups/donations
old_act_matrix_fetch = """          const [actSnap, champSnap, mercSnap, rosterData] = await Promise.all([
            get(ref(db, 'activity_live')).catch(() => null),
            get(ref(db, 'championship')).catch(() => null),
            get(ref(db, 'mercenary')).catch(() => null),
            window.fetchRoster().catch(() => ({}))
          ]);"""

new_act_matrix_fetch = """          const [actSnap, champSnap, mercSnap, btSnap, donSnap, rosterData] = await Promise.all([
            get(ref(db, 'activity_live')).catch(() => null),
            get(ref(db, 'championship')).catch(() => null),
            get(ref(db, 'mercenary')).catch(() => null),
            get(ref(db, 'beartrap')).catch(() => null),
            get(ref(db, 'beartrap_donations')).catch(() => null),
            window.fetchRoster().catch(() => ({}))
          ]);"""

content = content.replace(old_act_matrix_fetch, new_act_matrix_fetch)

old_act_matrix_obj = """          const actObj = (actSnap && actSnap.exists()) ? actSnap.val() : {};
          const champObj = (champSnap && champSnap.exists()) ? champSnap.val() : {};
          const mercObj = (mercSnap && mercSnap.exists()) ? mercSnap.val() : {};"""

new_act_matrix_obj = """          const actObj = (actSnap && actSnap.exists()) ? actSnap.val() : {};
          const champObj = (champSnap && champSnap.exists()) ? champSnap.val() : {};
          const mercObj = (mercSnap && mercSnap.exists()) ? mercSnap.val() : {};
          const btObj = (btSnap && btSnap.exists()) ? btSnap.val() : {};
          const donObj = (donSnap && donSnap.exists()) ? donSnap.val() : {};"""

content = content.replace(old_act_matrix_obj, new_act_matrix_obj)

old_act_matrix_push = """                   playersList.push({
                      gameId: gIdStr,
                      name: p.name,
                      perfAtt: actRec.perfectAttendance !== undefined ? isTrue(actRec.perfectAttendance) : false,
                      champ: champRec.signedUp !== undefined ? isTrue(champRec.signedUp) : isTrue(actRec.championship),
                      merc: mercRec.signedUp !== undefined ? isTrue(mercRec.signedUp) : isTrue(actRec.mercenary),
                      polar: isTrue(actRec.polarTerrors),
                      voter: isTrue(actRec.voter)
                   });"""

new_act_matrix_push = """                   const donKey = p.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                   const donRec = donObj[donKey] || {};
                   const btRec = btObj[gIdStr] || {};
                   const isBtActive = (donRec.current && donRec.current > 0) || isTrue(btRec.signedUp) || isTrue(actRec.beartrap);

                   playersList.push({
                      gameId: gIdStr,
                      name: p.name,
                      perfAtt: actRec.perfectAttendance !== undefined ? isTrue(actRec.perfectAttendance) : false,
                      champ: champRec.signedUp !== undefined ? isTrue(champRec.signedUp) : isTrue(actRec.championship),
                      merc: mercRec.signedUp !== undefined ? isTrue(mercRec.signedUp) : isTrue(actRec.mercenary),
                      polar: isTrue(actRec.polarTerrors),
                      beartrap: isBtActive,
                      voter: isTrue(actRec.voter)
                   });"""

content = content.replace(old_act_matrix_push, new_act_push if 'new_act_push' in locals() else new_act_matrix_push)

# Update toggleActivityMatrixCell for beartrap key
old_toggle_cell = """        try {
          const updates = {};
          updates[`activity_live/${gIdStr}/${key}`] = isChecked;
          await update(ref(db), updates);"""

new_toggle_cell = """        try {
          const updates = {};
          updates[`activity_live/${gIdStr}/${key}`] = isChecked;
          if (key === 'beartrap') {
              updates[`beartrap/${gIdStr}/signedUp`] = isChecked;
          }
          await update(ref(db), updates);"""

content = content.replace(old_toggle_cell, new_toggle_cell)

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully implemented Complete Bear Trap Event Cycle, Auto-Signup & Activity Matrix Sync")
