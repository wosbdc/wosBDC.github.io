with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update submitBeartrapDonations log call to include amounts per player in target
old_submit_log = "window.logAdminAction(\"Bear Trap Donations Added\", `Added multi-donation batch for ${entries.length} player(s)`, entries.map(e => e.name).join(', '));"
new_submit_log = "window.logAdminAction(\"Bear Trap Donations Added\", `Added multi-donation batch for ${entries.length} player(s)`, entries.map(e => `${e.name} (+${Number(e.amount).toLocaleString()})`).join(', '));"

if old_submit_log in content:
    content = content.replace(old_submit_log, new_submit_log)

# 2. Update loadBeartrapLog to print target player name(s) in HTML
old_log_item = """              html += `
                <div style="padding:10px 0; border-bottom:1px solid var(--border);">
                  <div style="color:var(--text-main); font-weight:bold; font-size:13px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    <span style="background:rgba(255,255,255,0.05); border:1px solid ${badgeColor}; color:${badgeColor}; padding:2px 8px; border-radius:4px; font-size:11px;">${log.action}</span>
                    <span>${log.details}</span>
                  </div>
                  <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">
                    ${timeDisplay} • By <span style="color:var(--accent); font-weight:bold;">${log.admin || log.email || 'Admin'}</span>
                  </div>
                </div>
              `;"""

new_log_item = """              const targetHtml = log.target ? `<span style="color:#FFD700; font-weight:bold; font-size:12px;">(${log.target})</span>` : '';

              html += `
                <div style="padding:10px 0; border-bottom:1px solid var(--border);">
                  <div style="color:var(--text-main); font-weight:bold; font-size:13px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    <span style="background:rgba(255,255,255,0.05); border:1px solid ${badgeColor}; color:${badgeColor}; padding:2px 8px; border-radius:4px; font-size:11px;">${log.action}</span>
                    <span>${log.details}</span>
                    ${targetHtml}
                  </div>
                  <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">
                    ${timeDisplay} • By <span style="color:var(--accent); font-weight:bold;">${log.admin || log.email || 'Admin'}</span>
                  </div>
                </div>
              `;"""

if old_log_item in content:
    content = content.replace(old_log_item, new_log_item)
    print("Successfully added target player display to Bear Trap log")

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)
