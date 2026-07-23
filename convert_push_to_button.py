with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add openBroadcastPushModal global function right above sendBroadcastPush
push_modal_func = """
      window.openBroadcastPushModal = function() {
          let existing = document.getElementById('broadcastPushModal');
          if (existing) existing.remove();

          const overlay = document.createElement('div');
          overlay.id = 'broadcastPushModal';
          overlay.style.cssText = `
              position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
              background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(6px);
              z-index: 99999; display: flex; justify-content: center; align-items: center;
              padding: 20px; box-sizing: border-box; animation: fadeIn 0.2s ease;
          `;

          overlay.innerHTML = `
              <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 480px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); display: flex; flex-direction: column; gap: 15px; text-align: left;">
                  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
                      <h3 style="margin: 0; color: var(--accent); font-size: 18px; display: flex; align-items: center; gap: 8px;">
                          🚀 Broadcast Push Notification
                      </h3>
                      <button onclick="document.getElementById('broadcastPushModal').remove()" style="background: transparent; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; padding: 0;">✕</button>
                  </div>
                  
                  <p style="margin: 0; font-size: 12px; color: var(--text-muted);">Send an instant alert notification to all registered devices.</p>

                  <div>
                      <label style="font-size: 12px; font-weight: bold; color: var(--text-main); display: block; margin-bottom: 6px;">Notification Title</label>
                      <input type="text" id="adminPushTitle" placeholder="e.g. Bear Trap Starting in 5 Minutes!" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: bold; box-sizing: border-box;">
                  </div>

                  <div>
                      <label style="font-size: 12px; font-weight: bold; color: var(--text-main); display: block; margin-bottom: 6px;">Message Body</label>
                      <textarea id="adminPushBody" placeholder="Enter message details..." style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); min-height: 90px; box-sizing: border-box;"></textarea>
                  </div>

                  <div id="adminPushStatus" style="font-size: 12px; font-weight: bold; text-align: center;"></div>

                  <div style="display: flex; gap: 10px; margin-top: 5px;">
                      <button onclick="document.getElementById('broadcastPushModal').remove()" style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: bold; cursor: pointer;">Cancel</button>
                      <button onclick="window.sendBroadcastPush()" style="flex: 1; padding: 12px; border-radius: 8px; border: none; background: var(--danger); color: #fff; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(239,68,68,0.3);">Send Alert 🚀</button>
                  </div>
              </div>
          `;

          document.body.appendChild(overlay);

          overlay.addEventListener('click', (e) => {
              if (e.target === overlay) overlay.remove();
          });
      };
"""

target_send_push = "window.sendBroadcastPush = async () => {"
if target_send_push in content:
    content = content.replace(target_send_push, push_modal_func + "\n      " + target_send_push)
    print("Added openBroadcastPushModal function")

# 2. Add Broadcast Push button to Category 2 in Daily Tools and remove inline form
old_category_2 = """            <!-- Category 2: System & Roster Tools -->
            <div style="background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid var(--border); margin-bottom:20px;">
              <h3 style="margin:0 0 5px 0; color:var(--text-main); text-align:left; font-size:16px;">⚙️ System & Roster Tools</h3>
              <p style="margin:0 0 15px 0; font-size:12px; color:var(--text-muted); text-align:left;">Manage Chief names, Game IDs, and master database entries.</p>
              
              <div style="display:flex; flex-direction:column; gap:12px; align-items:center;">
                <button onclick="views.playerEditor()" style="background:linear-gradient(135deg, #6366f1, #4f46e5); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px; box-shadow:0 4px 12px rgba(99,102,241,0.3);">👤 Open Player Database Editor</button>
              </div>
            </div>"""

new_category_2 = """            <!-- Category 2: System & Roster Tools -->
            <div style="background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid var(--border); margin-bottom:20px;">
              <h3 style="margin:0 0 5px 0; color:var(--text-main); text-align:left; font-size:16px;">⚙️ System & Roster Tools</h3>
              <p style="margin:0 0 15px 0; font-size:12px; color:var(--text-muted); text-align:left;">Manage Chief names, Game IDs, and broadcast push alerts.</p>
              
              <div style="display:flex; flex-direction:column; gap:12px; align-items:center;">
                <button onclick="views.playerEditor()" style="background:linear-gradient(135deg, #6366f1, #4f46e5); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px; box-shadow:0 4px 12px rgba(99,102,241,0.3);">👤 Open Player Database Editor</button>
                ${isR5 ? `<button onclick="window.openBroadcastPushModal()" style="background:linear-gradient(135deg, #ec4899, #be185d); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px; box-shadow:0 4px 12px rgba(236,72,153,0.3);">🚀 Broadcast Push Notification</button>` : ''}
              </div>
            </div>"""

content = content.replace(old_category_2, new_category_2)

# Remove old inline push form
old_inline_push = """          <!-- Push Notification Broadcast -->
            ${isR5 ? `
            <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--accent); margin-bottom:20px;">
              <h3 style="margin:0 0 5px 0; color:var(--accent);">Broadcast Push Notification</h3>
              <p style="margin:0 0 15px 0; font-size:12px; color:var(--text-muted);">Send an instant alert to all registered devices.</p>
              <input type="text" id="adminPushTitle" placeholder="Notification Title (e.g. Bear Trap Starting!)" style="width:100%; padding:10px; margin-bottom:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main); font-weight:bold;">
              <textarea id="adminPushBody" placeholder="Message Body" style="width:100%; padding:10px; margin-bottom:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main); min-height:80px;"></textarea>
              <button onclick="window.sendBroadcastPush()" style="background:var(--danger); color:#fff; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:bold; width:100%;">Send Alert 🚀</button>
              <div id="adminPushStatus" style="font-size:12px; font-weight:bold; margin-top:10px; text-align:center;"></div>
            </div>
            ` : ''}"""

content = content.replace(old_inline_push, "")

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully converted Broadcast Push Notification to modal button")
