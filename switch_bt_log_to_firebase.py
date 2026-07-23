with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

firebase_only_bt_log = """    window.loadBeartrapLog = async () => {
      const logDiv = document.getElementById('beartrapLog');
      if (!logDiv) return;
      logDiv.innerHTML = '<span style="color:var(--text-muted)">Loading Firebase logs...</span>';
      
      try {
        const fbSnap = await get(ref(db, 'admin_logs'));
        if (fbSnap.exists() && fbSnap.val()) {
          const logsData = fbSnap.val();
          const btLogs = Object.values(logsData)
            .filter(item => {
              if (!item || !item.action) return false;
              const act = item.action.toLowerCase();
              const det = (item.details || '').toLowerCase();
              return act.includes('bear trap') || act.includes('beartrap') || act.includes('bt') || det.includes('bear trap');
            })
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

          if (btLogs.length > 0) {
            let html = '';
            btLogs.slice(0, 40).forEach(log => {
              let badgeColor = 'var(--accent)';
              if (log.action.includes('Reset') || log.action.includes('Wipe')) badgeColor = 'var(--danger)';
              else if (log.action.includes('Crown')) badgeColor = '#FFD700';
              else if (log.action.includes('Donation')) badgeColor = 'var(--success)';

              const timeDisplay = log.dateStr ? `${log.dateStr} ${log.timeStr || ''}` : new Date(log.timestamp).toLocaleString();
              
              html += `
                <div style="padding:10px 0; border-bottom:1px solid var(--border);">
                  <div style="color:var(--text-main); font-weight:bold; font-size:13px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    <span style="background:rgba(255,255,255,0.05); border:1px solid ${badgeColor}; color:${badgeColor}; padding:2px 8px; border-radius:4px; font-size:11px;">${log.action}</span>
                    <span>${log.details}</span>
                  </div>
                  <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">
                    ${timeDisplay} • By <span style="color:var(--accent); font-weight:bold;">${log.admin || log.email || 'Admin'}</span>
                  </div>
                </div>
              `;
            });
            logDiv.innerHTML = html;
          } else {
            logDiv.innerHTML = '<span style="color:var(--text-muted)">No Bear Trap activity logged yet.</span>';
          }
        } else {
          logDiv.innerHTML = '<span style="color:var(--text-muted)">No activity logged yet.</span>';
        }
      } catch (e) {
        console.error("Error reading Bear Trap Firebase logs:", e);
        logDiv.innerHTML = `<span style="color:var(--danger)">Error loading logs: ${e.message}</span>`;
      }
    };"""

start_str = "    window.loadBeartrapLog = async () => {"
end_str = "    window.loadBeartrapLog();"

start_idx = content.find(start_str)
if start_idx != -1:
    end_idx = content.find("    window.loadBeartrapLog();\n  },", start_idx)
    if end_idx != -1:
        content = content[:start_idx] + firebase_only_bt_log + "\n\n" + content[end_idx:]
        with open('main.js', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Successfully switched loadBeartrapLog to 100% Firebase Realtime Database")
    else:
        print("End index not found")
else:
    print("Start index not found")
