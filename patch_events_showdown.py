with open('main.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find views.showdown start line
start_idx = -1
for i, line in enumerate(lines):
    if 'showdown: async () => {' in line and i > 8000:
        start_idx = i
        break

if start_idx != -1:
    # Build complete updated views.showdown implementation
    new_showdown_code = '''  showdown: async () => {
    renderLoading("Loading Showdown Data");
    try {
       const [liveSnap, metaSnap] = await Promise.all([
          get(ref(db, 'showdown_live')),
          get(ref(db, 'showdown_meta'))
       ]);
       
       const liveData = liveSnap.val() || {};
       const metaData = metaSnap.val() || {};
       const enemyAlliance = metaData.enemyAlliance || { name: 'Enemy Alliance', scores: {} };
       
       let html = `<div style="display:flex; flex-direction:column; gap:20px;">`;
       
       // Calculate Our Scores
       let ourScores = { d1:0, d2:0, d3:0, d4:0, d5:0, d6:0 };
       let players = [];
       let topPlayers = { d1:{names:[], score:0}, d2:{names:[], score:0}, d3:{names:[], score:0}, d4:{names:[], score:0}, d5:{names:[], score:0}, d6:{names:[], score:0} };
       
       for (const [pName, scores] of Object.entries(liveData)) {
          let pd1 = scores.d1 || 0;
          let pd2 = scores.d2 || 0;
          let pd3 = scores.d3 || 0;
          let pd4 = scores.d4 || 0;
          let pd5 = scores.d5 || 0;
          let pd6 = scores.d6 || 0;
          let pTotal = pd1 + pd2 + pd3 + pd4 + pd5 + pd6;
          
          ourScores.d1 += pd1;
          ourScores.d2 += pd2;
          ourScores.d3 += pd3;
          ourScores.d4 += pd4;
          ourScores.d5 += pd5;
          ourScores.d6 += pd6;
          
          for (let di = 1; di <= 6; di++) {
             let dScore = scores['d' + di] || 0;
             if (dScore > 0) {
                if (dScore > topPlayers['d' + di].score) {
                   topPlayers['d' + di] = { names: [pName], score: dScore };
                } else if (dScore === topPlayers['d' + di].score) {
                   topPlayers['d' + di].names.push(pName);
                }
             }
          }
          
          players.push({ name: pName, d1: pd1, d2: pd2, d3: pd3, d4: pd4, d5: pd5, d6: pd6, total: pTotal });
       }
       
       ourScores.total = ourScores.d1 + ourScores.d2 + ourScores.d3 + ourScores.d4 + ourScores.d5 + ourScores.d6;
       let enemyTotal = (enemyAlliance.scores.d1||0) + (enemyAlliance.scores.d2||0) + (enemyAlliance.scores.d3||0) + (enemyAlliance.scores.d4||0) + (enemyAlliance.scores.d5||0) + (enemyAlliance.scores.d6||0);
       
       const staticHorns = { d1: 1, d2: 2, d3: 2, d4: 2, d5: 2, d6: 4 };
       const hornsTotal = 13;
       const dailyGoal = 3333333;
       
       // MVP Calculation - Detect latest active day MVP
       let currentActiveDay = 1;
       for (let di = 6; di >= 1; di--) {
           let dayHasScore = false;
           for (const scores of Object.values(liveData)) {
               if ((scores['d' + di] || 0) > 0) {
                   dayHasScore = true; break;
               }
           }
           if (dayHasScore) {
               currentActiveDay = di; break;
           }
       }
       
       let isEventComplete = (currentActiveDay === 6 && (ourScores.d6 > 0 || (enemyAlliance.scores && enemyAlliance.scores.d6 > 0)));
       let mvpTitle = "";
       let mvpWinners = [];
       let mvpDisplayHorns = 0;
       let mvpLabelText = "Total Horns";
       
       if (isEventComplete) {
           let playerHorns = {};
           for(let di=1; di<=6; di++) {
               let dayObj = topPlayers['d'+di];
               if (dayObj && dayObj.score > 0 && dayObj.names.length > 0) {
                   dayObj.names.forEach(name => {
                       playerHorns[name] = (playerHorns[name] || 0) + staticHorns['d'+di];
                   });
               }
           }
           let maxHorns = 0;
           for (const horns of Object.values(playerHorns)) if (horns > maxHorns) maxHorns = horns;
           mvpWinners = Object.keys(playerHorns).filter(name => playerHorns[name] === maxHorns);
           mvpTitle = mvpWinners.length > 1 ? "👑 Showdown Co-MVPs" : "👑 Showdown MVP";
           mvpDisplayHorns = maxHorns;
       } else {
           let dayObj = topPlayers['d' + currentActiveDay];
           mvpWinners = (dayObj && dayObj.names) ? dayObj.names : [];
           mvpTitle = mvpWinners.length > 1 ? `👑 DAY ${currentActiveDay} CO-MVPS` : `👑 DAY ${currentActiveDay} MVP`;
           mvpDisplayHorns = staticHorns['d' + currentActiveDay];
           mvpLabelText = `Day ${currentActiveDay} Horns`;
       }
       
       let titleRightHtml = "";
       if (mvpWinners.length > 0) {
           let champDisplayNames = mvpWinners.map(escapeHTML).join(" & ");
           let avatarStackHtml = renderAvatarStack(mvpWinners);
           
           titleRightHtml = `
              <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(255,215,0,0.05);">
                ${avatarStackHtml}
                <div style="flex: 1; text-align: left;">
                  <div style="color: #FFD700; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">${mvpTitle}</div>
                  <div style="color: var(--text-main); font-size: 18px; font-weight: bold;">${champDisplayNames}</div>
                </div>
                <div style="text-align: right;">
                  <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase;">${mvpLabelText}</div>
                  <div style="color: #FFD700; font-size: 20px; font-weight: bold;">${mvpDisplayHorns}</div>
                </div>
              </div>
            `;
       }
       
       // 2. Alliance Progress
       let dayHeadersHtml = '';
       for(let i=1; i<=6; i++) {
           dayHeadersHtml += `<th style="border-right: 1px solid rgba(255,255,255,0.08); text-align:center;"><span style="background:rgba(255,255,255,0.05); padding:3px 10px; border-radius:6px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">Day ${i}</span></th>`;
       }

       let allianceCard = `<div class="card">
          <div class="card-title">⚔️ Alliance Progress</div>${titleRightHtml}
          <div class="card-table-scroll" style="overflow-x:auto; width:100%; border-radius:8px; border:1px solid var(--border);">
          <table style="min-width:650px; border-collapse:collapse;"><thead><tr>
          <th style="position:sticky; left:0; background:var(--card-bg); z-index:6; box-shadow: 1px 0 0 var(--border);">Alliance's Showdown</th><th style="border-right: 1px solid rgba(255,255,255,0.12); text-align:center;">Total</th>${dayHeadersHtml}
       </tr></thead><tbody>`;
       
       // Determine Total winner
       let enemyTotalStyle = "font-weight:bold; border-right: 1px solid rgba(255,255,255,0.12); text-align:center;";
       let ourTotalStyle = "font-weight:bold; border-right: 1px solid rgba(255,255,255,0.12); text-align:center;";
       if (enemyTotal > 0 || ourScores.total > 0) {
           if (enemyTotal > ourScores.total) enemyTotalStyle += " color:#10b981;";
           else if (ourScores.total > enemyTotal) ourTotalStyle += " color:#10b981;";
       }

       // Enemy Row
       allianceCard += `<tr><td style="font-weight:bold; position:sticky; left:0; background:var(--card-bg); z-index:2; box-shadow: 1px 0 0 var(--border);">${enemyAlliance.name || 'Enemy Alliance'}</td><td style="${enemyTotalStyle}">${enemyTotal.toLocaleString()}</td>`;
       for(let i=1; i<=6; i++) {
           let eScore = enemyAlliance.scores['d'+i] || 0;
           let oScore = ourScores['d'+i] || 0;
           let style = "border-right: 1px solid rgba(255,255,255,0.06); text-align:center;";
           if (eScore > 0 || oScore > 0) {
              if (eScore > oScore) style += " color:#10b981; font-weight:bold;";
           }
           allianceCard += `<td style="${style}">${eScore > 0 ? eScore.toLocaleString() : ''}</td>`;
       }
       allianceCard += `</tr>`;
       
       // Our Row
       allianceCard += `<tr><td style="font-weight:bold; position:sticky; left:0; background:var(--card-bg); z-index:2; box-shadow: 1px 0 0 var(--border);">Our Alliance</td><td style="${ourTotalStyle}">${ourScores.total.toLocaleString()}</td>`;
       for(let i=1; i<=6; i++) {
           let eScore = enemyAlliance.scores['d'+i] || 0;
           let oScore = ourScores['d'+i] || 0;
           let style = "font-weight:bold; border-right: 1px solid rgba(255,255,255,0.06); text-align:center;";
           if (eScore > 0 || oScore > 0) {
              if (oScore > eScore) style += " color:#10b981;";
           }
           allianceCard += `<td style="${style}">${oScore > 0 ? oScore.toLocaleString() : ''}</td>`;
       }
       allianceCard += `</tr>`;
       
       // Horn Rewards
       allianceCard += `<tr><td style="font-weight:bold; position:sticky; left:0; background:var(--card-bg); z-index:2; box-shadow: 1px 0 0 var(--border);">Horn Rewards</td><td style="border-right: 1px solid rgba(255,255,255,0.12); text-align:center;">${hornsTotal}</td>`;
       for(let i=1; i<=6; i++) allianceCard += `<td style="border-right: 1px solid rgba(255,255,255,0.06); text-align:center;">${staticHorns['d'+i]}</td>`;
       allianceCard += `</tr>`;
       
       // Winners Row
       allianceCard += `<tr><td style="font-weight:bold; position:sticky; left:0; background:var(--card-bg); z-index:2; box-shadow: 1px 0 0 var(--border);">Winners</td><td style="border-right: 1px solid rgba(255,255,255,0.12);"></td>`;
       for(let di=1; di<=6; di++) {
           let dayObj = topPlayers['d'+di];
           let w = (dayObj && dayObj.names && dayObj.names.length > 0) ? dayObj.names.map(escapeHTML).join(' & ') : '';
           let style = "font-weight:bold; color:#FFD700; border-right: 1px solid rgba(255,255,255,0.06); text-align:center;";
           allianceCard += `<td style="${style}">${w}</td>`;
       }
       allianceCard += `</tr></tbody></table></div></div>`;
       
       // 3. Player Rankings Table
       players.sort((a, b) => b.total - a.total);
       
       let pDayHeaders = '';
       for(let i=1; i<=6; i++) {
           pDayHeaders += `<th style="border-right: 1px solid rgba(255,255,255,0.08); text-align:center;"><span style="background:rgba(255,255,255,0.05); padding:3px 10px; border-radius:6px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">Day ${i}</span></th>`;
       }
       
       let playersCard = `<div class="card"><div class="card-title">🏆 Player Rankings</div><div class="card-table-scroll" style="overflow-x:auto; width:100%; border-radius:8px; border:1px solid var(--border);"><table style="min-width:700px; border-collapse:collapse;"><thead><tr>
          <th style="position:sticky; left:0; background:var(--card-bg); z-index:6; width:45px;">Rank</th><th style="position:sticky; left:45px; background:var(--card-bg); z-index:6; box-shadow: 1px 0 0 var(--border); max-width:120px;">Name</th><th style="border-right: 1px solid rgba(255,255,255,0.12); text-align:center;">Total Score</th>${pDayHeaders}
       </tr></thead><tbody>`;
       
       let currentPRank = 1;
       players.forEach((p, index) => {
           if (index > 0) {
               let prev = players[index - 1];
               if (p.total !== prev.total) {
                   currentPRank += 1;
               }
           }
           let isTie = players.filter(o => o.total === p.total).length > 1;
           let tieBadge = isTie ? ' <span style="font-size:11px; opacity:0.85;" title="Tied Rank">🤝</span>' : '';
           let rankDisplay = `${currentPRank}${tieBadge}`;
           if (currentPRank === 1) rankDisplay = `🥇 1${tieBadge}`;
           else if (currentPRank === 2) rankDisplay = `🥈 2${tieBadge}`;
           else if (currentPRank === 3) rankDisplay = `🥉 3${tieBadge}`;
           
           let dayCells = '';
           for (let di = 1; di <= 6; di++) {
               let val = p['d' + di] || 0;
               dayCells += `<td style="border-right: 1px solid rgba(255,255,255,0.06); text-align:center;">${val > 0 ? val.toLocaleString() : '-'}</td>`;
           }
           
           playersCard += `<tr>
              <td style="font-weight:bold; color:var(--text-muted); position:sticky; left:0; background:var(--card-bg); z-index:2; text-align:center;">${rankDisplay}</td>
              <td style="position:sticky; left:45px; background:var(--card-bg); z-index:2; box-shadow: 1px 0 0 var(--border); max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${formatCell(p.name)}</td>
              <td style="font-weight:bold; border-right: 1px solid rgba(255,255,255,0.12); text-align:center;">${p.total > 0 ? p.total.toLocaleString() : '0'}</td>
              ${dayCells}
           </tr>`;
       });
       playersCard += `</tbody></table></div></div>`;
       
       html += allianceCard + playersCard + `</div>`;
       document.getElementById('mainContent').innerHTML = html;
       
    } catch(e) { renderError(e.message); }
  },
'''

    # Find end of showdown function in lines
    end_idx = start_idx
    for j in range(start_idx, len(lines)):
        if 'catch(e) { renderError(e.message); }' in lines[j]:
            end_idx = j + 2
            break
            
    lines[start_idx:end_idx] = [new_showdown_code]
    with open('main.js', 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Successfully patched views.showdown in main.js")
else:
    print("Could not find views.showdown start line")
