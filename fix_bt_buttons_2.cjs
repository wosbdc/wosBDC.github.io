const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const target = '<div id="beartrapStatus" style="margin-top:15px; text-align:center; font-size:14px;"></div>\\s*</div>\\s*<div style="background:var\\(--bg-main\\); padding:15px; border-radius:12px; border:1px solid var\\(--border\\);">';

const dangerZone = `<div id="beartrapStatus" style="margin-top:15px; text-align:center; font-size:14px;"></div>
        </div>
        
        <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--danger); margin-bottom:20px;">
           <h3 style="margin-top:0; color:var(--danger); font-size:16px;">⚠️ Danger Zone</h3>
           <button onclick="window.resetBearTrapWinners()" style="background:var(--danger); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%;">🔄 Reset Bear Trap Winners to "Pending..."</button>
        </div>
        
        <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--border);">`;

code = code.replace(new RegExp(target), dangerZone);

fs.writeFileSync('main.js', code, 'utf8');
console.log('Successfully inserted Danger Zone!');
