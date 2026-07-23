with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Add to Multi-BT Donations header
old_multi_bt_hdr = """<h2 style="color:var(--accent); margin:0; display:flex; align-items:center; flex-wrap:wrap; gap:10px;">
            🐻 Multi-BT Donations"""

new_multi_bt_hdr = """<h2 style="color:var(--accent); margin:0; display:flex; align-items:center; flex-wrap:wrap; gap:10px;">
            🐻 Multi-BT Donations
            <button onclick="window.openAddPlayerModal()" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--accent); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">➕ Add Player</button>"""

if old_multi_bt_hdr in content:
    content = content.replace(old_multi_bt_hdr, new_multi_bt_hdr)

# Add to Bear Trap Tracker header
old_tracker_hdr = """<h2 style="margin:0; color:#fff; font-size:1.3em;">🐻 Bear Trap Tracker</h2>
            </div>"""

new_tracker_hdr = """<h2 style="margin:0; color:#fff; font-size:1.3em;">🐻 Bear Trap Tracker</h2>
            </div>
            <button onclick="window.openAddPlayerModal()" style="background:rgba(255,255,255,0.2); border:none; color:#fff; cursor:pointer; font-size:14px; padding:6px 12px; border-radius:6px; font-weight:bold;">➕ Add Player</button>"""

if old_tracker_hdr in content:
    content = content.replace(old_tracker_hdr, new_tracker_hdr)

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully added ➕ Add Player button to Bear Trap headers")
