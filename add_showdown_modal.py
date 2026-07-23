with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add openShowdownLeaderboardModal global function
modal_func = '''
window.openShowdownLeaderboardModal = async function() {
    let existing = document.getElementById('showdownLeaderboardModal');
    if (existing) existing.remove();
    
    const overlay = document.createElement('div');
    overlay.id = 'showdownLeaderboardModal';
    overlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
        background: rgba(0, 0, 0, 0.82); backdrop-filter: blur(8px);
        z-index: 99999; display: flex; justify-content: center; align-items: center;
        padding: 20px; box-sizing: border-box; animation: fadeIn 0.2s ease;
    `;
    
    overlay.innerHTML = `
        <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
            <div style="padding: 16px 20px; background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 16px; font-weight: bold; color: #FFD700; display: flex; align-items: center; gap: 8px;">
                    🏆 Showdown Leaderboards
                </div>
                <button onclick="document.getElementById('showdownLeaderboardModal').remove()" style="background: rgba(255,255,255,0.08); border: 1px solid var(--border); color: var(--text-main); font-size: 16px; font-weight: bold; cursor: pointer; padding: 6px 12px; border-radius: 8px; line-height: 1; transition: all 0.2s;">✕ Close</button>
            </div>
            <div id="showdownLeaderboardModalContent" style="padding: 20px; overflow-y: auto; flex: 1;">
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <div style="font-size:24px; margin-bottom:10px;">⏳</div>
                    Loading Showdown Leaderboards...
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
    
    try {
        const [liveSnap, metaSnap, histSnap] = await Promise.all([
           get(ref(db, 'showdown_live')),
           get(ref(db, 'showdown_meta')),
           get(ref(db, 'showdown_history'))
        ]);
        
        let sdHistoryData = await fetchSheet("Showdown History").catch(() => null);
        if (histSnap.exists() && histSnap.val()) {
           const extraHistory = histSnap.val();
           let baseRows = sdHistoryData ? (sdHistoryData.data || sdHistoryData) : [];
           let extraRows = extraHistory ? (extraHistory.data || extraHistory) : [];
           if (Array.isArray(baseRows) && Array.isArray(extraRows) && extraRows.length > 0) {
              sdHistoryData = [...baseRows, ...extraRows];
           } else if (extraRows.length > 0) {
              sdHistoryData = extraRows;
           }
        }
        
        const liveData = liveSnap.val() || {};
        let topPlayers = { d1:{score:0}, d2:{score:0}, d3:{score:0}, d4:{score:0}, d5:{score:0}, d6:{score:0} };
        let players = [];
        
        for (const [pName, scores] of Object.entries(liveData)) {
            let pd1 = scores.d1 || 0; let pd2 = scores.d2 || 0; let pd3 = scores.d3 || 0;
            let pd4 = scores.d4 || 0; let pd5 = scores.d5 || 0; let pd6 = scores.d6 || 0;
            let pTotal = pd1 + pd2 + pd3 + pd4 + pd5 + pd6;
            if (pd1 > topPlayers.d1.score) topPlayers.d1 = { name: pName, score: pd1 };
            if (pd2 > topPlayers.d2.score) topPlayers.d2 = { name: pName, score: pd2 };
            if (pd3 > topPlayers.d3.score) topPlayers.d3 = { name: pName, score: pd3 };
            if (pd4 > topPlayers.d4.score) topPlayers.d4 = { name: pName, score: pd4 };
            if (pd5 > topPlayers.d5.score) topPlayers.d5 = { name: pName, score: pd5 };
            if (pd6 > topPlayers.d6.score) topPlayers.d6 = { name: pName, score: pd6 };
            players.push({ name: pName, d1: pd1, d2: pd2, d3: pd3, d4: pd4, d5: pd5, d6: pd6, total: pTotal });
        }
        
        const staticHorns = { d1: 1, d2: 2, d3: 2, d4: 2, d5: 2, d6: 4 };
        players.forEach(p => {
            p.horns = 0; p.wins = 0;
            for (let i = 1; i <= 6; i++) {
                let dVal = p['d'+i] || 0;
                if (dVal > 0 && dVal === topPlayers['d'+i].score) {
                    p.horns += staticHorns['d'+i]; p.wins += 1;
                }
            }
        });
        players.sort((a, b) => b.horns !== a.horns ? b.horns - a.horns : b.total - a.total);
        
        let mvpBannerHtml = "";
        if (players.length > 0 && players[0].horns > 0) {
            let maxHorns = players[0].horns;
            let topMvps = players.filter(p => p.horns === maxHorns);
            let mvpTitle = topMvps.length > 1 ? "👑 Showdown Co-MVPs" : "👑 Showdown MVP";
            let champDisplayNames = topMvps.map(p => escapeHTML(p.name)).join(" & ");
            let avatarStackHtml = renderAvatarStack(topMvps);
            mvpBannerHtml = `
              <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px;">
                ${avatarStackHtml}
                <div style="flex: 1; text-align: left;">
                  <div style="color: #FFD700; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">${mvpTitle}</div>
                  <div style="color: var(--text-main); font-size: 18px; font-weight: bold;">${champDisplayNames}</div>
                </div>
                <div style="text-align: right;">
                  <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase;">Total Horns</div>
                  <div style="color: #FFD700; font-size: 20px; font-weight: bold;">${maxHorns}</div>
                </div>
              </div>
            `;
        }
        
        const liveDisplayList = players.slice(0, 4);
        let liveShowdownHtml = `<div class="card" style="margin-bottom:20px;"><div class="card-title">Current - Showdown Leaderboard</div>
        ${mvpBannerHtml}
        <div class="card-table-scroll">
          <table style="width: 100%; text-align:left;"><thead><tr>
             <th>RANK</th><th>NAME</th><th>TOTAL HORNS</th><th>DAY WINS</th><th>TOTAL</th>
          </tr></thead><tbody>`;
        
        let currentLiveRank = 1;
        liveDisplayList.forEach((p, index) => {
            if (index > 0 && p.horns !== liveDisplayList[index - 1].horns) currentLiveRank += 1;
            let isTie = liveDisplayList.filter(o => o.horns === p.horns).length > 1;
            let rankDisplay = `${currentLiveRank}${isTie ? ' 🤝' : ''}`;
            liveShowdownHtml += `<tr>
               <td style="font-weight:bold; color:var(--text-muted);">${rankDisplay}</td>
               <td>${formatCell(p.name)}</td>
               <td>${p.horns}</td>
               <td>${p.wins}</td>
               <td>${p.total > 0 ? p.total.toLocaleString() : '0'}</td>
            </tr>`;
        });
        liveShowdownHtml += `</tbody></table></div></div>`;
        
        // All-Time
        let rawHistory = sdHistoryData ? (sdHistoryData.data || sdHistoryData) : [];
        const historyRows = Array.isArray(rawHistory) ? rawHistory : Object.values(rawHistory);
        let allTimePlayers = calculateAllTimeShowdown(historyRows);
        let combinedMap = {};
        allTimePlayers.forEach(p => { combinedMap[p.name.toLowerCase()] = { name: p.name, horns: p.horns, wins: p.wins, total: p.total }; });
        players.forEach(p => {
            let key = p.name.toLowerCase();
            if (!combinedMap[key]) combinedMap[key] = { name: p.name, horns: 0, wins: 0, total: 0 };
            combinedMap[key].horns += (p.horns || 0); combinedMap[key].wins += (p.wins || 0); combinedMap[key].total += (p.total || 0);
        });
        allTimePlayers = Object.values(combinedMap).sort((a, b) => b.horns !== a.horns ? b.horns - a.horns : b.total - a.total);
        
        let allTimeMvpHtml = "";
        if (allTimePlayers.length > 0 && allTimePlayers[0].horns > 0) {
            let maxHorns = allTimePlayers[0].horns;
            let topChamps = allTimePlayers.filter(p => p.horns === maxHorns);
            let champTitle = topChamps.length > 1 ? "👑 All-Time Co-Champions" : "👑 All-Time Champion";
            let champDisplayNames = topChamps.map(p => escapeHTML(p.name)).join(" & ");
            let avatarStackHtml = renderAvatarStack(topChamps);
            allTimeMvpHtml = `
              <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px;">
                ${avatarStackHtml}
                <div style="flex: 1; text-align: left;">
                  <div style="color: #FFD700; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">${champTitle}</div>
                  <div style="color: var(--text-main); font-size: 18px; font-weight: bold;">${champDisplayNames}</div>
                </div>
                <div style="text-align: right;">
                  <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase;">Total Horns</div>
                  <div style="color: #FFD700; font-size: 20px; font-weight: bold;">${maxHorns}</div>
                </div>
              </div>
            `;
        }
        
        let allTimeShowdownHtml = `<div class="card"><div class="card-title">All-Time - Showdown Leaderboard</div>
        ${allTimeMvpHtml}
        <div class="card-table-scroll">
          <table style="width: 100%; text-align:left;"><thead><tr>
             <th>RANK</th><th>NAME</th><th>TOTAL HORNS</th><th>DAY WINS</th><th>TOTAL</th>
          </tr></thead><tbody>`;
        
        let currentAllTimeRank = 1;
        const allTimeDisplayList = allTimePlayers.slice(0, 4);
        allTimeDisplayList.forEach((p, index) => {
            if (index > 0 && p.horns !== allTimeDisplayList[index - 1].horns) currentAllTimeRank += 1;
            let isTie = allTimeDisplayList.filter(o => o.horns === p.horns).length > 1;
            let rankDisplay = `${currentAllTimeRank}${isTie ? ' 🤝' : ''}`;
            allTimeShowdownHtml += `<tr>
               <td style="font-weight:bold; color:var(--text-muted);">${rankDisplay}</td>
               <td>${formatCell(p.name)}</td>
               <td>${p.horns}</td>
               <td>${p.wins}</td>
               <td>${p.total > 0 ? p.total.toLocaleString() : '0'}</td>
            </tr>`;
        });
        allTimeShowdownHtml += `</tbody></table></div></div>`;
        
        document.getElementById('showdownLeaderboardModalContent').innerHTML = liveShowdownHtml + allTimeShowdownHtml;
    } catch(err) {
        document.getElementById('showdownLeaderboardModalContent').innerHTML = `<div style="color:var(--danger); text-align:center; padding:20px;">Error: ${err.message}</div>`;
    }
};
'''

# Insert modal function right above renderAvatarStack
pos = content.find("function renderAvatarStack")
if pos != -1:
    content = content[:pos] + modal_func + "\n\n" + content[pos:]
    print("Added openShowdownLeaderboardModal function")

# 2. Update button in views.showdown to call openShowdownLeaderboardModal()
old_btn = "onclick=\"views.leaderboards('showdown')\""
new_btn = "onclick=\"openShowdownLeaderboardModal()\""

content = content.replace(old_btn, new_btn)

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated button onclick to open modal popup")
