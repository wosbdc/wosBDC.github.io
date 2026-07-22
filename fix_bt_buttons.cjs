const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. Rename the Admin menu button
code = code.replace(
  '🥩 Open Multi-BT Donations',
  '🐻 Bear Trap'
);

// 2. Add the resetBearTrapWinners function right before _executeLogBearTrapWinner
const funcTarget = "window._executeLogBearTrapWinner = async (name, trap) => {";
const resetFunc = `window.resetBearTrapWinners = async () => {
    if (!confirm("Are you sure you want to reset both Bear Trap winners to 'Pending...'?")) return;
    try {
        await set(ref(db, 'config/bearTrapWinners/1'), {name: "Pending...", score: "-", timestamp: Date.now()});
        await set(ref(db, 'config/bearTrapWinners/2'), {name: "Pending...", score: "-", timestamp: Date.now()});
        window.showToast("Bear Trap Winners Reset to Pending!", "success");
        setTimeout(() => window.location.reload(), 1500);
    } catch(e) {
        window.showToast("Error resetting: " + e.message, "danger");
    }
};

`;
if (!code.includes('resetBearTrapWinners')) {
  code = code.replace(funcTarget, resetFunc + funcTarget);
}

// 3. Add the Danger Zone to views.beartrap
const beartrapTarget = `<div id="beartrapStatus" style="margin-top:15px; text-align:center; font-size:14px;"></div>
        </div>
        
        <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--border);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
             <h3 style="margin:0; color:var(--text-main); font-size:16px;">🕒 Admin Log</h3>`;

const dangerZone = `<div id="beartrapStatus" style="margin-top:15px; text-align:center; font-size:14px;"></div>
        </div>
        
        <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--danger); margin-bottom:20px;">
           <h3 style="margin-top:0; color:var(--danger); font-size:16px;">⚠️ Danger Zone</h3>
           <button onclick="window.resetBearTrapWinners()" style="background:var(--danger); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%;">🔄 Reset Bear Trap Winners to "Pending..."</button>
        </div>
        
        <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--border);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
             <h3 style="margin:0; color:var(--text-main); font-size:16px;">🕒 Admin Log</h3>`;

code = code.replace(beartrapTarget, dangerZone);

fs.writeFileSync('main.js', code, 'utf8');
console.log('Successfully applied button fixes!');
