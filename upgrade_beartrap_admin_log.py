with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_func = """    window.loadBeartrapLog = async () => {
      const logDiv = document.getElementById('beartrapLog');
      logDiv.innerHTML = '<span style="color:var(--text-muted)">Loading...</span>';
      try {
        const adminLogToken = await getAuthToken();
        const res = await fetch(`${API_BASE_URL}?api=adminLog&token=${encodeURIComponent(adminLogToken)}`).then(r => r.json());
        if (res.success && res.data.length > 0) {
          let html = '';
          res.data.forEach(log => {
            html += `
              <div style="padding:8px 0; border-bottom:1px solid var(--border);">
                <div style="color:var(--text-main);">${log.name} <span style="color:var(--success); font-weight:bold;">+${log.amount}</span> (Total: ${log.newTotal})</div>
                <div style="font-size:11px;">${log.timestamp} • By ${log.email}</div>
              </div>
            `;
          });
          logDiv.innerHTML = html;
        } else {
          logDiv.innerHTML = '<span style="color:var(--text-muted)">No activity found.</span>';
        }
      } catch {
        logDiv.innerHTML = `<span style="color:var(--danger)">Network error.</span>`;
      }
    };"""

new_func = """    window.loadBeartrapLog = async () => {
      const logDiv = document.getElementById('beartrapLog');
      if (!logDiv) return;
      logDiv.innerHTML = '<span style="color:var(--text-muted)">Loading activity...</span>';
      
      let combinedLogs = [];

      // 1. Fetch Firebase admin_logs for Bear Trap actions
      try {
        const fbSnap = await get(ref(db, 'admin_logs'));
        if (fbSnap.exists() && fbSnap.val()) {
          const logsData = fbSnap.val();
          Object.values(logsData).forEach(item => {
            if (item.action && item.action.toLowerCase().includes('bear trap')) {
              combinedLogs.push({
                type: 'system',
                action: item.action,
                details: item.details || '',
                admin: item.admin || item.email || 'Admin',
                timestamp: item.timestamp || Date.now(),
                timeStr: item.dateStr ? `${item.dateStr} ${item.timeStr || ''}` : new Date(item.timestamp).toLocaleString()
              });
            }
          });
        }
      } catch(e) {
        console.warn("Could not fetch Firebase admin_logs:", e);
      }

      // 2. Fetch Google Sheets donation logs
      try {
        const adminLogToken = await getAuthToken();
        const res = await fetch(`${API_BASE_URL}?api=adminLog&token=${encodeURIComponent(adminLogToken)}`).then(r => r.json());
        if (res.success && Array.isArray(res.data)) {
          res.data.forEach(log => {
            combinedLogs.push({
              type: 'donation',
              name: log.name,
              amount: log.amount,
              newTotal: log.newTotal,
              admin: log.email || 'Admin',
              timeStr: log.timestamp,
              timestamp: new Date(log.timestamp).getTime() || Date.now()
            });
          });
        }
      } catch(e) {
        console.warn("Could not fetch GS adminLog:", e);
      }

      // Sort by timestamp descending
      combinedLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      if (combinedLogs.length > 0) {
        let html = '';
        combinedLogs.slice(0, 30).forEach(log => {
          if (log.type === 'system') {
            let badgeColor = 'var(--accent)';
            if (log.action.includes('Reset')) badgeColor = 'var(--danger)';
            else if (log.action.includes('Crown')) badgeColor = '#FFD700';
            
            html += `
              <div style="padding:8px 0; border-bottom:1px solid var(--border);">
                <div style="color:var(--text-main); font-weight:bold; display:flex; align-items:center; gap:6px;">
                  <span style="color:${badgeColor};">[${log.action}]</span> ${log.details}
                </div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${log.timeStr} • By ${log.admin}</div>
              </div>
            `;
          } else {
            html += `
              <div style="padding:8px 0; border-bottom:1px solid var(--border);">
                <div style="color:var(--text-main);">${log.name} <span style="color:var(--success); font-weight:bold;">+${log.amount}</span> (Total: ${log.newTotal})</div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">${log.timeStr} • By ${log.admin}</div>
              </div>
            `;
          }
        });
        logDiv.innerHTML = html;
      } else {
        logDiv.innerHTML = '<span style="color:var(--text-muted)">No activity found.</span>';
      }
    };"""

if old_func in content:
    content = content.replace(old_func, new_func)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully upgraded loadBeartrapLog to include system admin actions")
else:
    print("old_func not found")
