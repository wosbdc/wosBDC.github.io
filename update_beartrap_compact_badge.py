with open('main.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_table_row = """                         <td style="padding:12px; text-align:center;">
                           <div style="display:inline-flex; border-radius:8px; overflow:hidden; border:1px solid var(--border);">
                             <button onclick="window.onBtToggle('${gIdStr}', true, this)" style="border:none; padding:8px 16px; font-weight:bold; cursor:pointer; background:${isSignedUp ? 'var(--success)' : 'transparent'}; color:${isSignedUp ? '#fff' : 'var(--text-muted)'}; transition:0.2s; width:80px;">YES</button>
                             <button onclick="window.onBtToggle('${gIdStr}', false, this)" style="border:none; padding:8px 16px; font-weight:bold; cursor:pointer; background:${!isSignedUp ? 'var(--danger)' : 'transparent'}; color:${!isSignedUp ? '#fff' : 'var(--text-muted)'}; transition:0.2s; width:80px;">NO</button>
                           </div>
                         </td>"""

new_table_row = """                         <td style="padding:8px 12px; text-align:center;">
                           <button onclick="window.onBtToggleSingle('${gIdStr}', this)" data-signed="${isSignedUp ? 'true' : 'false'}" style="border:none; padding:6px 14px; font-weight:bold; border-radius:20px; cursor:pointer; font-size:12px; transition:all 0.2s ease; background:${isSignedUp ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color:${isSignedUp ? '#10b981' : '#ef4444'}; border:1px solid ${isSignedUp ? '#10b981' : '#ef4444'};">
                             ${isSignedUp ? '✅ Signed Up' : '❌ Missing'}
                           </button>
                         </td>"""

toggle_single_func = """
        window.onBtToggleSingle = async (gameId, btnElement) => {
            const currentStatus = btnElement.getAttribute('data-signed') === 'true';
            const newStatus = !currentStatus;
            
            btnElement.setAttribute('data-signed', newStatus ? 'true' : 'false');
            btnElement.style.background = newStatus ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
            btnElement.style.color = newStatus ? '#10b981' : '#ef4444';
            btnElement.style.borderColor = newStatus ? '#10b981' : '#ef4444';
            btnElement.innerHTML = newStatus ? '✅ Signed Up' : '❌ Missing';

            const ok = await window.toggleBearTrapStatus(gameId, newStatus);
            if (!ok) {
                if(window.showToast) window.showToast("Failed to sync to Firebase", "error");
                btnElement.setAttribute('data-signed', currentStatus ? 'true' : 'false');
                btnElement.style.background = currentStatus ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
                btnElement.style.color = currentStatus ? '#10b981' : '#ef4444';
                btnElement.style.borderColor = currentStatus ? '#10b981' : '#ef4444';
                btnElement.innerHTML = currentStatus ? '✅ Signed Up' : '❌ Missing';
            } else {
                let pData = await window.fetchBearTrapData();
                let newYes = 0;
                let newNo = 0;
                let newMissing = [];
                window.btRosterList.forEach(rp => {
                    let st = pData[rp.gameId.toString().trim()];
                    if (st && st.signedUp) newYes++;
                    else {
                        newNo++;
                        newMissing.push(rp.name);
                    }
                });
                
                document.getElementById('bt-yes-count').textContent = newYes;
                document.getElementById('bt-no-count').textContent = newNo;
                document.getElementById('bt-percent').textContent = window.btRosterList.length > 0 ? Math.round((newYes / window.btRosterList.length) * 100) + '%' : '0%';
                const missingEl = document.getElementById('bt-missing-names');
                if (missingEl) {
                  missingEl.textContent = newMissing.length > 0 ? newMissing.join(', ') : 'Everyone is signed up! 🎉';
                }
            }
        };
"""

if old_table_row in js:
    js = js.replace(old_table_row, new_table_row)
    # Insert toggle_single_func right before window.onBtToggle
    if "window.onBtToggle = async" in js:
        js = js.replace("window.onBtToggle = async", toggle_single_func + "\n        window.onBtToggle = async")
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Successfully replaced double YES/NO button box with compact status badge in main.js")
else:
    print("old_table_row not found in main.js")
