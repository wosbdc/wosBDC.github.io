with open('main.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_widescreen_layout = """            <!-- Widescreen 2-Column Responsive Layout -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap:25px; align-items:start;">
              
              <div class="card" style="position:sticky; top:80px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                  <h3 style="margin:0; font-size:1.1em;">Missing Signups (${noCount})</h3>
                  <button onclick="
                    const text = document.getElementById('bt-missing-names').innerText;
                    navigator.clipboard.writeText(text).then(() => {
                      if(window.showToast) window.showToast('Copied missing names to clipboard!', 'success');
                    });
                  " style="background:var(--accent); color:#fff; border:none; padding:8px 14px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:13px;">📋 Copy List</button>
                </div>
                <div id="bt-missing-names" style="font-family:monospace; background:var(--bg-main); padding:15px; border-radius:8px; border:1px solid var(--border); max-height:500px; overflow-y:auto; color:var(--text-muted); line-height:1.8; word-break:break-all;">
                  ${missingNames.length > 0 ? missingNames.join(', ') : 'Everyone has donated! 🎉'}
                </div>
              </div>

              <div class="card">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; font-size:1.1em;">Roster Status (${totalCount})</h3>
                <input type="text" id="btSearch" placeholder="🔍 Search name..." onkeyup="window.filterBearTrapTable()" style="padding:8px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:14px; width:200px;">
              </div>"""

new_fullwidth_layout = """            <div class="card">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
                <h3 style="margin:0; font-size:1.2em; color:var(--text-main);">Roster Status (${totalCount})</h3>
                
                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                  <!-- Filter Tabs -->
                  <div id="btFilterToggle" style="display:inline-flex; background:var(--bg-main); border:1px solid var(--border); border-radius:8px; overflow:hidden; padding:3px;">
                    <button onclick="window.setBtFilter('all', this)" class="bt-filter-btn active" style="border:none; padding:6px 12px; font-weight:bold; font-size:12px; cursor:pointer; background:var(--accent); color:#fff; border-radius:6px; transition:0.2s;">ALL</button>
                    <button onclick="window.setBtFilter('missing', this)" class="bt-filter-btn" style="border:none; padding:6px 12px; font-weight:bold; font-size:12px; cursor:pointer; background:transparent; color:var(--text-muted); border-radius:6px; transition:0.2s;">❌ MISSING ONLY</button>
                    <button onclick="window.setBtFilter('donated', this)" class="bt-filter-btn" style="border:none; padding:6px 12px; font-weight:bold; font-size:12px; cursor:pointer; background:transparent; color:var(--text-muted); border-radius:6px; transition:0.2s;">✅ DONATED ONLY</button>
                  </div>

                  <!-- Search Bar -->
                  <input type="text" id="btSearch" placeholder="🔍 Search name..." onkeyup="window.filterBearTrapTable()" style="padding:7px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:13px; width:180px;">

                  <!-- Copy Missing Button -->
                  <button onclick="window.copyBtMissingList()" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:7px 14px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px; display:flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(16,185,129,0.3);">
                    📋 Copy Missing List
                  </button>
                </div>
              </div>"""

filter_functions = """
        window.currentBtFilter = 'all';

        window.setBtFilter = (filterType, btnEl) => {
            window.currentBtFilter = filterType;
            const container = document.getElementById('btFilterToggle');
            if (container) {
                container.querySelectorAll('.bt-filter-btn').forEach(b => {
                    b.style.background = 'transparent';
                    b.style.color = 'var(--text-muted)';
                });
            }
            if (btnEl) {
                btnEl.style.background = 'var(--accent)';
                btnEl.style.color = '#fff';
            }
            window.filterBearTrapTable();
        };

        window.filterBearTrapTable = () => {
            const q = (document.getElementById('btSearch')?.value || '').toLowerCase().trim();
            const filter = window.currentBtFilter || 'all';
            
            document.querySelectorAll('.bt-row').forEach(row => {
                const name = row.getAttribute('data-name') || '';
                const btn = row.querySelector('[data-signed]');
                const isSigned = btn ? btn.getAttribute('data-signed') === 'true' : false;
                
                let matchesSearch = !q || name.includes(q);
                let matchesFilter = true;
                if (filter === 'missing') matchesFilter = !isSigned;
                else if (filter === 'donated') matchesFilter = isSigned;
                
                row.style.display = (matchesSearch && matchesFilter) ? '' : 'none';
            });
        };

        window.copyBtMissingList = () => {
            let missingList = [];
            document.querySelectorAll('.bt-row').forEach(row => {
                const btn = row.querySelector('[data-signed]');
                const isSigned = btn ? btn.getAttribute('data-signed') === 'true' : false;
                if (!isSigned) {
                    const nameCell = row.cells[0];
                    if (nameCell) missingList.push(nameCell.innerText.trim());
                }
            });
            const text = missingList.length > 0 ? missingList.join(', ') : 'Everyone has donated! 🎉';
            navigator.clipboard.writeText(text).then(() => {
                if (window.showToast) window.showToast(`Copied ${missingList.length} missing player(s) to clipboard!`, 'success');
            });
        };
"""

# Replace layout
if old_widescreen_layout in js:
    js = js.replace(old_widescreen_layout, new_fullwidth_layout)
    print("Successfully replaced text box layout with clean filter tab bar in main.js")
else:
    print("old_widescreen_layout not found in main.js")

# Remove closing grid div if present
js = js.replace("            </div>\n          </div>\n        </div>\n        `;", "          </div>\n        </div>\n        `;")

# Clean up dead missing text references in onBtToggleSingle
js = js.replace("document.getElementById('bt-missing-names').innerText = newMissing.length > 0 ? newMissing.join(', ') : 'Everyone has donated! 🎉';", "// updated stats")

# Inject filter functions before window.onBtDonationChange
if "window.onBtDonationChange = async" in js:
    js = js.replace("window.onBtDonationChange = async", filter_functions + "\n        window.onBtDonationChange = async")

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Script completed!")
