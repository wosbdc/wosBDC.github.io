const fs = require('fs');
let content = fs.readFileSync('main.js', 'utf8');

// 1. Add Button
const btnTarget = `<button onclick="document.getElementById('btResetPlayerModal').style.display='block'" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--danger); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">🗑️ Reset Player</button>`;
const btnReplace = btnTarget + `\n            <button onclick="window.openBtDbEditor()" style="background:var(--card-bg); color:var(--text-main); border:1px solid #8b5cf6; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">🛠️ DB Editor</button>`;
content = content.replace(btnTarget, btnReplace);

// 2. Add Modal HTML
const modalTarget = `<div id="beartrapResetPlayerResult" style="margin-top:10px; font-weight:bold; text-align:center;"></div>
        </div>`;
const modalReplace = modalTarget + `

        <!-- Database Editor Modal (Hidden by default) -->
        <div id="btDbEditorModal" style="display:none; position:absolute; top:50px; left:0; width:100%; max-height:80vh; overflow-y:auto; background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid #8b5cf6; box-shadow:0 10px 25px rgba(0,0,0,0.5); z-index:15; box-sizing:border-box;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; position:sticky; top:-20px; background:var(--bg-main); padding:10px 0; border-bottom:1px solid var(--border);">
            <h3 style="margin:0; color:var(--text-main); font-size:16px;">🛠️ Bear Trap Database Editor</h3>
            <button onclick="document.getElementById('btDbEditorModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:20px;">&times;</button>
          </div>
          <div id="btDbEditorContent" style="color:var(--text-main); font-size:13px;">
            <p style="text-align:center; color:var(--text-muted);">Loading database entries...</p>
          </div>
        </div>`;
content = content.replace(modalTarget, modalReplace);

// 3. Add JS Logic
const logicTarget = `window.doBeartrapResetPlayer = async () => {`;
const logicReplace = `window.openBtDbEditor = async () => {
    document.getElementById('btDbEditorModal').style.display = 'block';
    const contentDiv = document.getElementById('btDbEditorContent');
    contentDiv.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Fetching live database...</p>';
    
    try {
        const { get, ref, remove } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js');
        const snap = await get(ref(window.db, 'beartrap_donations'));
        if (!snap.exists() || !snap.val()) {
            contentDiv.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No entries found in database.</p>';
            return;
        }
        
        const data = snap.val();
        let html = '<table style="width:100%; border-collapse:collapse; margin-top:10px;">';
        html += '<tr style="border-bottom:1px solid var(--border); text-align:left;"><th style="padding:8px;">DB Key</th><th style="padding:8px;">Name</th><th style="padding:8px;">Current</th><th style="padding:8px;">All-Time</th><th style="padding:8px; text-align:right;">Action</th></tr>';
        
        for (const [key, val] of Object.entries(data)) {
            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">';
            html += '<td style="padding:8px; font-family:monospace; color:var(--text-muted);">' + key + '</td>';
            html += '<td style="padding:8px; font-weight:bold;">' + (val.name || 'Unknown') + '</td>';
            html += '<td style="padding:8px;">' + (val.current || 0).toLocaleString() + '</td>';
            html += '<td style="padding:8px;">' + (val.allTime || 0).toLocaleString() + '</td>';
            html += '<td style="padding:8px; text-align:right;"><button onclick="window.deleteBtDbEntry(\\'' + key + '\\')" style="background:var(--danger); color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:11px;">X Delete</button></td>';
            html += '</tr>';
        }
        html += '</table>';
        contentDiv.innerHTML = html;
        
    } catch (e) {
        contentDiv.innerHTML = '<p style="color:var(--danger); text-align:center;">Error loading database: ' + e.message + '</p>';
    }
};

window.deleteBtDbEntry = async (key) => {
    let confirmDel = await window.customConfirm('🗑️ WARNING 🗑️\\n\\nAre you sure you want to permanently delete the raw database node: ' + key + '?\\n\\nThis action cannot be undone.');
    if (!confirmDel) return;
    
    try {
        const { ref, remove } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js');
        await remove(ref(window.db, \`beartrap_donations/\${key}\`));
        if(window.showToast) window.showToast("Node deleted successfully", "success");
        // Refresh the editor view
        window.openBtDbEditor();
    } catch (e) {
        if(window.showToast) window.showToast("Error deleting node: " + e.message, "error");
    }
};

` + logicTarget;

content = content.replace(logicTarget, logicReplace);

fs.writeFileSync('main.js', content, 'utf8');
console.log('Done patching main.js');
