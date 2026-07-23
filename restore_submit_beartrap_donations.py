with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

submit_func = """    window.submitBeartrapDonations = async () => {
      const rows = document.querySelectorAll('.beartrap-row');
      const entries = [];
      rows.forEach(r => {
        const name = r.querySelector('.bt-name').value.trim();
        const amt = r.querySelector('.bt-amount').value.trim();
        if (name && amt) entries.push({name, amount: amt});
      });
      
      const statusDiv = document.getElementById('beartrapStatus');
      const submitBtn = document.getElementById('submitBeartrapBtn');
      if (entries.length === 0) {
         statusDiv.innerHTML = '<span style="color:var(--danger)">No entries to submit.</span>';
         return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';
      statusDiv.innerHTML = `<span style="color:var(--text-muted)">Processing ${entries.length} entries...</span>`;
      
      const adminName = (currentUser && currentUser.gameId && idToNameMap[currentUser.gameId]) ? idToNameMap[currentUser.gameId] : "Admin";
      
      let completed = 0;
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
      window.logAdminAction("Bear Trap Donations Added", `Added multi-donation batch for ${entries.length} player(s)`, playerSummary);
      
      // Reset form
      const cont = document.getElementById('beartrapEntries');
      if (cont) {
          cont.innerHTML = `
            <div class="beartrap-row" style="display:flex; gap:10px; margin-bottom:10px;">
              <input type="text" class="bt-name" list="beartrapRosterDatalist" placeholder="Player Name..." style="flex:2; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
              <input type="number" class="bt-amount" placeholder="Amount..." style="flex:1; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
              <button onclick="this.parentElement.remove()" style="background:var(--danger); color:#fff; border:none; width:40px; border-radius:6px; cursor:pointer; font-weight:bold;">X</button>
            </div>
          `;
      }
      
      if (window.loadBeartrapLog) window.loadBeartrapLog();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit All';
    };"""

target_pos = "window.loadBeartrapLog = async () => {"

if target_pos in content:
    content = content.replace(target_pos, submit_func + "\n\n    " + target_pos)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully restored window.submitBeartrapDonations")
else:
    print("target_pos not found")
