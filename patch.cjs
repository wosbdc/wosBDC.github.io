const fs = require('fs');
let content = fs.readFileSync('main.js', 'utf8');

const target = '<div id="beartrapResetPlayerResult" style="margin-top:10px; font-weight:bold; text-align:center;"></div>\n        </div>';
const target2 = '<div id="beartrapResetPlayerResult" style="margin-top:10px; font-weight:bold; text-align:center;"></div>\r\n        </div>';

const replace = `<div id="beartrapResetPlayerResult" style="margin-top:10px; font-weight:bold; text-align:center;"></div>
        </div>
        
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

if (content.includes(target)) {
    content = content.replace(target, replace);
    fs.writeFileSync('main.js', content, 'utf8');
    console.log('Patched with target1');
} else if (content.includes(target2)) {
    content = content.replace(target2, replace);
    fs.writeFileSync('main.js', content, 'utf8');
    console.log('Patched with target2');
} else {
    console.log('Could not find target');
}
