with open('main.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_block = """          <div style="padding:20px; max-width:1000px; margin:0 auto;">
            
            <button onclick="views.admin('tab-logs')" style="background:linear-gradient(135deg, #a855f7, #9333ea); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; box-shadow:0 4px 12px rgba(168,85,247,0.3); margin-bottom: 20px; transition: transform 0.2s ease;">
              📊 Open Roster Event Activity Matrix ➔
            </button>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-bottom:20px;">
              <div class="card" style="text-align:center;">
                <div style="font-size:13px; color:var(--text-muted); margin-bottom:5px;">Signed Up (YES)</div>
                <div style="font-size:24px; font-weight:bold; color:var(--success);" id="bt-yes-count">${yesCount}</div>
              </div>
              <div class="card" style="text-align:center;">
                <div style="font-size:13px; color:var(--text-muted); margin-bottom:5px;">Missing (NO)</div>
                <div style="font-size:24px; font-weight:bold; color:var(--danger);" id="bt-no-count">${noCount}</div>
              </div>
              <div class="card" style="text-align:center;">
                <div style="font-size:13px; color:var(--text-muted); margin-bottom:5px;">Response Rate</div>
                <div style="font-size:24px; font-weight:bold; color:var(--accent);" id="bt-percent">${percentSignedUp}%</div>
              </div>
            </div>

            <div class="card" style="margin-bottom:20px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                <h3 style="margin:0; font-size:1.1em;">Missing Signups (${noCount})</h3>
                <button onclick="
                  const text = document.getElementById('bt-missing-names').innerText;
                  navigator.clipboard.writeText(text).then(() => {
                    if(window.showToast) window.showToast('Copied missing names to clipboard!', 'success');
                  });
                " style="background:var(--accent); color:#fff; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:13px;">📋 Copy List</button>
              </div>
              <div id="bt-missing-names" style="font-family:monospace; background:var(--bg-main); padding:15px; border-radius:8px; border:1px solid var(--border); max-height:150px; overflow-y:auto; color:var(--text-muted); line-height:1.6; word-break:break-all;">
                ${missingNames.length > 0 ? missingNames.join(', ') : 'Everyone is signed up! 🎉'}
              </div>
            </div>

            <div class="card">"""

new_block = """          <div style="padding:25px; max-width:1600px; margin:0 auto;">
            
            <button onclick="views.admin('tab-logs')" style="background:linear-gradient(135deg, #a855f7, #9333ea); color:#fff; border:none; padding:14px 24px; border-radius:10px; cursor:pointer; font-weight:bold; font-size:15px; width:100%; box-shadow:0 4px 12px rgba(168,85,247,0.3); margin-bottom: 20px; transition: transform 0.2s ease;">
              📊 Open Roster Event Activity Matrix ➔
            </button>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:20px; margin-bottom:25px;">
              <div class="card" style="text-align:center; padding:20px;">
                <div style="font-size:13px; color:var(--text-muted); font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Signed Up (YES)</div>
                <div style="font-size:32px; font-weight:bold; color:var(--success);" id="bt-yes-count">${yesCount}</div>
              </div>
              <div class="card" style="text-align:center; padding:20px;">
                <div style="font-size:13px; color:var(--text-muted); font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Missing (NO)</div>
                <div style="font-size:32px; font-weight:bold; color:var(--danger);" id="bt-no-count">${noCount}</div>
              </div>
              <div class="card" style="text-align:center; padding:20px;">
                <div style="font-size:13px; color:var(--text-muted); font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Response Rate</div>
                <div style="font-size:32px; font-weight:bold; color:var(--accent);" id="bt-percent">${percentSignedUp}%</div>
              </div>
            </div>

            <!-- Widescreen 2-Column Responsive Layout -->
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
                  ${missingNames.length > 0 ? missingNames.join(', ') : 'Everyone is signed up! 🎉'}
                </div>
              </div>

              <div class="card">"""

if old_block in js:
    js = js.replace(old_block, new_block)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Successfully updated bearTrapAdmin widescreen layout in main.js")
else:
    print("old_block not found in main.js")
