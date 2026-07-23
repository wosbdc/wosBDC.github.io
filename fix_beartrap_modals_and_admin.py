with open('main.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update Admin Menu Daily Tools to include BT Donations Tracker
old_daily_tools = """              <div style="display:flex; flex-direction:column; gap:12px; align-items:center;">
                <button onclick="views.beartrap()" style="background:var(--accent); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px;">🐻 Bear Trap</button>
                <button onclick="views.showdownAdmin()" style="background:var(--accent); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px;">⚔️ ShowDown</button>
              </div>"""

new_daily_tools = """              <div style="display:flex; flex-direction:column; gap:12px; align-items:center;">
                <button onclick="views.bearTrapAdmin()" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px; box-shadow:0 4px 12px rgba(16,185,129,0.3);">🐻 BT Donations Tracker</button>
                <button onclick="views.beartrap()" style="background:var(--accent); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px;">🐻 Multi-BT Donations</button>
                <button onclick="views.showdownAdmin()" style="background:var(--accent); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px;">⚔️ ShowDown</button>
              </div>"""

if old_daily_tools in js:
    js = js.replace(old_daily_tools, new_daily_tools)
    print("Updated Admin Menu Daily Tools section with BT Donations Tracker button.")
else:
    print("old_daily_tools not found")

# 2. Build rosterOptionsHtml for clean select dropdown in views.beartrap
old_beartrap_view_start = """    await refreshIdToNameMap();
    let datalistHtml = '<datalist id="beartrapRosterDatalist" style="display:none;">';
    for (const [id, name] of Object.entries(idToNameMap)) {
        datalistHtml += '<option value="' + id + '">' + name + '</option>';
        datalistHtml += '<option value="' + name + '">' + name + '</option>';
    }
    datalistHtml += '</datalist>';"""

new_beartrap_view_start = """    await refreshIdToNameMap();
    let rosterOptionsHtml = '';
    let sortedRosterNames = Object.values(idToNameMap).filter((v, i, a) => a.indexOf(v) === i).sort((a,b) => a.localeCompare(b));
    sortedRosterNames.forEach(name => {
        rosterOptionsHtml += `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`;
    });
    
    let datalistHtml = '<datalist id="beartrapRosterDatalist" style="display:none;">';
    for (const [id, name] of Object.entries(idToNameMap)) {
        datalistHtml += '<option value="' + id + '">' + name + '</option>';
        datalistHtml += '<option value="' + name + '">' + name + '</option>';
    }
    datalistHtml += '</datalist>';"""

if old_beartrap_view_start in js:
    js = js.replace(old_beartrap_view_start, new_beartrap_view_start)
    print("Updated views.beartrap to generate clean rosterOptionsHtml.")
else:
    print("old_beartrap_view_start not found")

# 3. Add link button to BT Donations Tracker in views.beartrap header
old_beartrap_header_buttons = """          <h2 style="color:var(--accent); margin:0; display:flex; align-items:center; flex-wrap:wrap; gap:10px;">
            🐻 Multi-BT Donations
            <button onclick="document.getElementById('btLookupModal').style.display='block'" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--accent); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">🔍 Lookup</button>"""

new_beartrap_header_buttons = """          <h2 style="color:var(--accent); margin:0; display:flex; align-items:center; flex-wrap:wrap; gap:10px;">
            🐻 Multi-BT Donations
            <button onclick="views.bearTrapAdmin()" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px; margin-left:10px;">📊 BT Tracker</button>
            <button onclick="document.getElementById('btLookupModal').style.display='block'" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--accent); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">🔍 Lookup</button>"""

if old_beartrap_header_buttons in js:
    js = js.replace(old_beartrap_header_buttons, new_beartrap_header_buttons)
    print("Added BT Tracker header link button in views.beartrap.")
else:
    print("old_beartrap_header_buttons not found")

# 4. Fix Reset Player Modal overlay and select dropdown
old_reset_modal = """        <!-- Reset Player Modal (Hidden by default) -->
        <div id="btResetPlayerModal" style="display:none; position:absolute; top:50px; left:0; width:100%; background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid var(--danger); box-shadow:0 10px 25px rgba(0,0,0,0.5); z-index:10; box-sizing:border-box;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0; color:var(--text-main); font-size:16px;">🗑️ Reset Player Donations</h3>
            <button onclick="document.getElementById('btResetPlayerModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:20px;">&times;</button>
          </div>
          <div style="display:flex; gap:10px;">
            <input type="text" id="beartrapResetPlayerName" list="beartrapRosterDatalist" placeholder="Player Name or ID..." style="flex:1; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
            <button onclick="window.doBeartrapResetPlayer()" style="background:var(--danger); color:#fff; border:none; padding:0 20px; border-radius:6px; cursor:pointer; font-weight:bold;">Wipe to 0</button>
          </div>
          <div id="beartrapResetPlayerResult" style="margin-top:10px; font-weight:bold; text-align:center;"></div>
        </div>"""

new_reset_modal = """        <!-- Reset Player Modal Backdrop & Card -->
        <div id="btResetPlayerModalOverlay" onclick="document.getElementById('btResetPlayerModal').style.display='none'; this.style.display='none';" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); backdrop-filter:blur(5px); z-index:9998;"></div>
        <div id="btResetPlayerModal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:90%; max-width:420px; background:var(--card-bg); border:1px solid var(--danger); border-radius:16px; padding:24px; box-shadow:0 20px 50px rgba(0,0,0,0.8); z-index:9999; animation:fadeIn 0.2s ease;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--border); padding-bottom:12px;">
            <h3 style="margin:0; color:var(--danger); font-size:18px; display:flex; align-items:center; gap:8px;">
              🗑️ Reset Player Donations
            </h3>
            <button onclick="document.getElementById('btResetPlayerModal').style.display='none'; document.getElementById('btResetPlayerModalOverlay').style.display='none';" style="background:transparent; border:none; color:var(--text-muted); font-size:24px; cursor:pointer; padding:0; line-height:1;">&times;</button>
          </div>
          <p style="margin:0 0 16px 0; font-size:12px; color:var(--text-muted); line-height:1.4;">
            Select a player to wipe all Bear Trap donation entries back to 0.
          </p>
          <div style="display:flex; flex-direction:column; gap:12px;">
            <select id="beartrapResetPlayerName" style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:14px; font-weight:bold;">
              <option value="">-- Select Player to Reset --</option>
              ${rosterOptionsHtml}
            </select>
            <button onclick="window.doBeartrapResetPlayer()" style="background:linear-gradient(135deg, #ef4444, #dc2626); color:#fff; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:14px; box-shadow:0 4px 12px rgba(239,68,68,0.3);">
              🔥 Wipe Player Donations to 0
            </button>
          </div>
          <div id="beartrapResetPlayerResult" style="margin-top:12px; font-weight:bold; text-align:center; font-size:13px;"></div>
        </div>"""

if old_reset_modal in js:
    js = js.replace(old_reset_modal, new_reset_modal)
    print("Fixed Reset Player Modal with backdrop overlay and clean select dropdown.")
else:
    print("old_reset_modal not found")

# Update trigger button for Reset Player Modal
old_reset_btn = """<button onclick="document.getElementById('btResetPlayerModal').style.display='block'" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--danger); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">🗑️ Reset Player</button>"""
new_reset_btn = """<button onclick="document.getElementById('btResetPlayerModal').style.display='block'; document.getElementById('btResetPlayerModalOverlay').style.display='block';" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--danger); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">🗑️ Reset Player</button>"""

if old_reset_btn in js:
    js = js.replace(old_reset_btn, new_reset_btn)
    print("Updated Reset Player Modal trigger button.")

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("All updates completed successfully!")
