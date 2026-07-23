with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Locate bad nested structure
target_block = """            <!-- Tab: In-Dev (Projects & Feature Lab) -->
          <div id="tab-indev" class="admin-tab-content" style="display:none;">
            <div style="background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid rgba(168,85,247,0.4); margin-bottom:20px;">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:15px;">
                <div style="width:40px; height:40px; border-radius:10px; background:rgba(168,85,247,0.15); display:flex; align-items:center; justify-content:center; font-size:20px; border:1px solid rgba(168,85,247,0.3);">🧪</div>
                <div style="text-align:left;">
                  <h3 style="margin:0; color:#c084fc; font-size:18px;">Projects & Feature Lab (In-Dev)</h3>
                  <p style="margin:2px 0 0 0; font-size:12px; color:var(--text-muted);">Private development workspace for upcoming features, experimental tools, and draft projects.</p>
                </div>
              </div>
              
              <div style="background:var(--card-bg); padding:20px; border-radius:12px; border:1px solid var(--border); text-align:center; display:flex; flex-direction:column; gap:15px; align-items:center;">
                <button onclick="views.championshipAdmin()" style="background:linear-gradient(135deg, #f59e0b, #d97706); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:300px; box-shadow:0 4px 12px rgba(217,119,6,0.3);">🏆 Alliance Championship</button>
                <button onclick="views.mercenaryAdmin()" style="background:linear-gradient(135deg, #ef4444, #dc2626); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:300px; box-shadow:0 4px 12px rgba(239,68,68,0.3);">⚔️ Mercenary Prestige</button>
                <button onclick="views.polarTerrorsAdmin()" style="background:linear-gradient(135deg, #0ea5e9, #0284c7); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:300px; box-shadow:0 4px 12px rgba(14,165,233,0.3);">🐻‍❄️ Polar Terrors Tracker</button>
                <button onclick="views.bearTrapAdmin()" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:300px; box-shadow:0 4px 12px rgba(16,185,129,0.3);">🐻 Bear Trap Tracker</button>
              </div>
            </div>
          </div>"""

# Remove from inside tab-tools
content = content.replace(target_block, "")

# Find end of tab-tools div
tab_tools_close = """              <div id="adminPushStatus" style="font-size:12px; font-weight:bold; margin-top:10px; text-align:center;"></div>
            </div>
            ` : ''}
          </div>"""

# Re-insert tab-indev AFTER tab-tools close div
new_structure = """              <div id="adminPushStatus" style="font-size:12px; font-weight:bold; margin-top:10px; text-align:center;"></div>
            </div>
            ` : ''}
          </div>

""" + target_block

content = content.replace(tab_tools_close, new_structure)

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Fixed tab-indev DOM nesting")
