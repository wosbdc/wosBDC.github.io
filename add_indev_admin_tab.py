with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add tab button
target_btn = '<button class="admin-tab-btn active" data-tab="tab-tools" style="background:none; border:none; color:var(--accent); font-weight:bold; font-size:16px; cursor:pointer; padding:5px 10px; border-bottom:2px solid var(--accent); flex-shrink:0;">🛠️ Daily Tools</button>'

replacement_btn = """<button class="admin-tab-btn active" data-tab="tab-tools" style="background:none; border:none; color:var(--accent); font-weight:bold; font-size:16px; cursor:pointer; padding:5px 10px; border-bottom:2px solid var(--accent); flex-shrink:0;">🛠️ Daily Tools</button>
            <button class="admin-tab-btn" data-tab="tab-indev" style="background:none; border:none; color:var(--text-muted); font-weight:bold; font-size:16px; cursor:pointer; padding:5px 10px; border-bottom:2px solid transparent; flex-shrink:0;">🧪 In-Dev</button>"""

content = content.replace(target_btn, replacement_btn)

# 2. Add tab content after tab-tools div
target_tools_end = "<!-- Push Notification Broadcast -->"

indev_content = """<!-- Tab: In-Dev (Projects & Feature Lab) -->
          <div id="tab-indev" class="admin-tab-content" style="display:none;">
            <div style="background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid rgba(168,85,247,0.4); margin-bottom:20px;">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:15px;">
                <div style="width:40px; height:40px; border-radius:10px; background:rgba(168,85,247,0.15); display:flex; align-items:center; justify-content:center; font-size:20px; border:1px solid rgba(168,85,247,0.3);">🧪</div>
                <div style="text-align:left;">
                  <h3 style="margin:0; color:#c084fc; font-size:18px;">Projects & Feature Lab (In-Dev)</h3>
                  <p style="margin:2px 0 0 0; font-size:12px; color:var(--text-muted);">Private development workspace for upcoming features, experimental tools, and draft projects.</p>
                </div>
              </div>
              
              <div style="display:flex; flex-direction:column; gap:12px; text-align:left;">
                <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:10px; padding:15px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                  <div>
                    <div style="font-weight:bold; color:var(--text-main); font-size:14px; display:flex; align-items:center; gap:6px;">
                      🛠️ Feature Staging & Sandbox
                    </div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:3px;">Isolated testing area for new admin features and calculators before launching to the alliance.</div>
                  </div>
                  <span style="background:rgba(168,85,247,0.15); border:1px solid rgba(168,85,247,0.4); color:#c084fc; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:bold;">Active Sandbox</span>
                </div>

                <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:10px; padding:15px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                  <div>
                    <div style="font-weight:bold; color:var(--text-main); font-size:14px; display:flex; align-items:center; gap:6px;">
                      📊 Upcoming Event Tools Prototype
                    </div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:3px;">Draft tracking scripts and score calculators for future Alliance Events.</div>
                  </div>
                  <span style="background:rgba(255,215,0,0.15); border:1px solid rgba(255,215,0,0.4); color:#FFD700; padding:4px 10px; border-radius:6px; font-size:11px; font-weight:bold;">Drafting</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Push Notification Broadcast -->"""

content = content.replace(target_tools_end, indev_content, 1)

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully added In-Dev tab to Admin Menu")
