with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_tab_tools = """          <!-- Tab 1: Daily Tools -->
          <div id="tab-tools" class="admin-tab-content" style="display:block;">
            <div style="background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid var(--accent); margin-bottom:20px; text-align:center; display:flex; flex-direction:column; gap:15px; align-items:center;">
              <button onclick="views.beartrap()" style="background:var(--accent); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:300px;">🐻 Bear Trap</button>
              <button onclick="views.playerEditor()" style="background:var(--accent); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:300px;">👤 Open Player Database Editor</button>
              <button onclick="views.showdownAdmin()" style="background:var(--accent); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:300px;">⚔️ ShowDown</button>
            </div>"""

new_tab_tools = """          <!-- Tab 1: Daily Tools -->
          <div id="tab-tools" class="admin-tab-content" style="display:block;">
            <!-- Category 1: Active Alliance Events -->
            <div style="background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid var(--accent); margin-bottom:20px;">
              <h3 style="margin:0 0 5px 0; color:var(--accent); text-align:left; font-size:16px;">⚔️ Active Alliance Events</h3>
              <p style="margin:0 0 15px 0; font-size:12px; color:var(--text-muted); text-align:left;">Live event management, score tracking, and log recording.</p>
              
              <div style="display:flex; flex-direction:column; gap:12px; align-items:center;">
                <button onclick="views.beartrap()" style="background:var(--accent); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px;">🐻 Bear Trap</button>
                <button onclick="views.showdownAdmin()" style="background:var(--accent); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px;">⚔️ ShowDown</button>
              </div>
            </div>

            <!-- Category 2: System & Roster Tools -->
            <div style="background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid var(--border); margin-bottom:20px;">
              <h3 style="margin:0 0 5px 0; color:var(--text-main); text-align:left; font-size:16px;">⚙️ System & Roster Tools</h3>
              <p style="margin:0 0 15px 0; font-size:12px; color:var(--text-muted); text-align:left;">Manage Chief names, Game IDs, and master database entries.</p>
              
              <div style="display:flex; flex-direction:column; gap:12px; align-items:center;">
                <button onclick="views.playerEditor()" style="background:linear-gradient(135deg, #6366f1, #4f46e5); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px; box-shadow:0 4px 12px rgba(99,102,241,0.3);">👤 Open Player Database Editor</button>
              </div>
            </div>"""

if old_tab_tools in content:
    content = content.replace(old_tab_tools, new_tab_tools)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully grouped Daily Tools tab")
else:
    print("Old tab tools target not found")
