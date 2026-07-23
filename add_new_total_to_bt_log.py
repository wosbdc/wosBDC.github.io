with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_loop = """      let completed = 0;
      let resultsHTML = "<div style='text-align:left; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); padding:10px; border-radius:6px; color:var(--success); font-size:13px;'><strong>Results:</strong><br>";
      
      for (const entry of entries) {
         try {
           const addAmt = Number(entry.amount) || 0;
           
           let finalName = entry.name;
           if (!isNaN(entry.name) && entry.name.length >= 7) {
               if (idToNameMap[entry.name]) finalName = idToNameMap[entry.name];
           }

           const donKey = finalName.toLowerCase().replace(/[^a-z0-9]/g, '_');
           const donRef = ref(db, `beartrap_donations/${donKey}`);
           const donSnap = await get(donRef);
           let donData = donSnap.val() || { name: finalName, current: 0, allTime: 0 };
           donData.name = finalName;
           donData.current = (donData.current || 0) + addAmt;
           donData.allTime = (donData.allTime || 0) + addAmt;
           donData.lastUpdated = Date.now();
           await set(donRef, donData);
           if (addAmt > 0) await window.autoSyncBtSignup(finalName);

           const donToken = await getAuthToken();
           fetch(`${API_BASE_URL}?api=addDonation&name=${encodeURIComponent(finalName)}&amount=${encodeURIComponent(entry.amount)}&admin=${encodeURIComponent(adminName)}&token=${encodeURIComponent(donToken)}`).catch(() => null);
           
           resultsHTML += `✅ <b>${finalName}</b>: +${addAmt.toLocaleString()} (New Current Total: ${donData.current.toLocaleString()})<br>`;
         } catch(e) {
           resultsHTML += `❌ <b>${entry.name}</b>: Error updating donation: ${e.message}<br>`;
         }
         completed++;
         statusDiv.innerHTML = `<span style="color:var(--text-muted)">Processed ${completed} of ${entries.length}...</span>`;
      }
      
      resultsHTML += "</div>";
      statusDiv.innerHTML = resultsHTML;

      const playerSummary = entries.map(e => `${e.name} (+${Number(e.amount).toLocaleString()})`).join(', ');
      window.logAdminAction("Bear Trap Donations Added", `Added multi-donation batch for ${entries.length} player(s)`, playerSummary);"""

new_loop = """      let completed = 0;
      let resultsHTML = "<div style='text-align:left; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); padding:10px; border-radius:6px; color:var(--success); font-size:13px;'><strong>Results:</strong><br>";
      let processedSummaries = [];

      for (const entry of entries) {
         try {
           const addAmt = Number(entry.amount) || 0;
           
           let finalName = entry.name;
           if (!isNaN(entry.name) && entry.name.length >= 7) {
               if (idToNameMap[entry.name]) finalName = idToNameMap[entry.name];
           }

           const donKey = finalName.toLowerCase().replace(/[^a-z0-9]/g, '_');
           const donRef = ref(db, `beartrap_donations/${donKey}`);
           const donSnap = await get(donRef);
           let donData = donSnap.val() || { name: finalName, current: 0, allTime: 0 };
           donData.name = finalName;
           donData.current = (donData.current || 0) + addAmt;
           donData.allTime = (donData.allTime || 0) + addAmt;
           donData.lastUpdated = Date.now();
           await set(donRef, donData);
           if (addAmt > 0) await window.autoSyncBtSignup(finalName);

           const donToken = await getAuthToken();
           fetch(`${API_BASE_URL}?api=addDonation&name=${encodeURIComponent(finalName)}&amount=${encodeURIComponent(entry.amount)}&admin=${encodeURIComponent(adminName)}&token=${encodeURIComponent(donToken)}`).catch(() => null);
           
           processedSummaries.push(`${finalName} (+${addAmt.toLocaleString()} ➔ New Total: ${donData.current.toLocaleString()})`);
           resultsHTML += `✅ <b>${finalName}</b>: +${addAmt.toLocaleString()} (New Current Total: ${donData.current.toLocaleString()})<br>`;
         } catch(e) {
           resultsHTML += `❌ <b>${entry.name}</b>: Error updating donation: ${e.message}<br>`;
         }
         completed++;
         statusDiv.innerHTML = `<span style="color:var(--text-muted)">Processed ${completed} of ${entries.length}...</span>`;
      }
      
      resultsHTML += "</div>";
      statusDiv.innerHTML = resultsHTML;

      const playerSummary = processedSummaries.length > 0 ? processedSummaries.join(', ') : entries.map(e => `${e.name} (+${Number(e.amount).toLocaleString()})`).join(', ');
      window.logAdminAction("Bear Trap Donations Added", `Added multi-donation batch for ${entries.length} player(s)`, playerSummary);"""

if old_loop in content:
    content = content.replace(old_loop, new_loop)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully added New Total display to Bear Trap donation log summaries")
else:
    print("old_loop target not found")
