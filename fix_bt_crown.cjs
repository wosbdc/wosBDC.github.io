const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. Add Crown Winner button next to Lookup button
const lookupBtnTarget = /<button onclick="document\.getElementById\('btLookupModal'\)\.style\.display='block'" style="background:var\(--card-bg\); color:var\(--text-main\); border:1px solid var\(--accent\); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">🔍 Lookup<\/button>/;
const crownBtnStr = `<button onclick="document.getElementById('btLookupModal').style.display='block'" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--accent); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">🔍 Lookup</button>
            <button onclick="document.getElementById('btCrownModal').style.display='block'" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--success); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">👑 Crown Winner</button>`;
code = code.replace(lookupBtnTarget, crownBtnStr);

// 2. Add btCrownModal below btLookupModal
const lookupModalTarget = /<div id="btLookupModal"[\s\S]*?<\/div>\s*<\/div>/;
const crownModalStr = `
        <!-- Crown Winner Modal (Hidden by default) -->
        <div id="btCrownModal" style="display:none; position:absolute; top:50px; left:0; width:100%; background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid var(--success); box-shadow:0 10px 25px rgba(0,0,0,0.5); z-index:10; box-sizing:border-box;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0; color:var(--text-main); font-size:16px;">👑 Crown Winner</h3>
            <button onclick="document.getElementById('btCrownModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:20px;">&times;</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <input type="text" id="beartrapCrownName" placeholder="Player Name..." style="padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
            <select id="beartrapCrownTrap" style="padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
              <option value="1">Bear Trap 1</option>
              <option value="2">Bear Trap 2</option>
            </select>
            <button onclick="window.doBeartrapCrown()" style="background:var(--success); color:#fff; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold;">Submit</button>
          </div>
        </div>`;

// We use string replace on the match to just append our new modal
const match = code.match(lookupModalTarget);
if (match) {
    code = code.replace(lookupModalTarget, match[0] + crownModalStr);
}

// 3. Add window.doBeartrapCrown
const funcTarget = "window.resetBearTrapWinners = async () => {";
const crownFunc = `window.doBeartrapCrown = async () => {
    const name = document.getElementById('beartrapCrownName').value.trim();
    const trap = document.getElementById('beartrapCrownTrap').value;
    if (!name) {
        window.showToast("Please enter a player name", "error");
        return;
    }
    
    // Check if the input is actually a game ID
    let finalName = name;
    if (!isNaN(name) && name.length >= 7) {
       await refreshIdToNameMap();
       let foundName = idToNameMap[name];
       if (foundName) finalName = foundName;
       else if(window.showToast) {
          window.showToast("Could not resolve ID to player name", "error");
          return;
       }
    }
    
    document.getElementById('btCrownModal').style.display = 'none';
    window._executeLogBearTrapWinner(finalName, trap);
};

`;
code = code.replace(funcTarget, crownFunc + funcTarget);

fs.writeFileSync('main.js', code, 'utf8');
console.log("Regex replacement complete.");
