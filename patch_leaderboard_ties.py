with open('main.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Patch Current Showdown MVP Banner & Table Ranks
for i in range(7540, 7600):
    if i < len(lines) and 'if (players.length > 0 && players[0].horns > 0)' in lines[i]:
        # Replace banner block (lines i to i + 26)
        banner_lines = [
            '          let mvpBannerHtml = "";\n',
            '          if (players.length > 0 && players[0].horns > 0) {\n',
            '              let maxHorns = players[0].horns;\n',
            '              let topMvps = players.filter(p => p.horns === maxHorns);\n',
            '              let mvpTitle = topMvps.length > 1 ? "👑 Showdown Co-MVPs" : "👑 Showdown MVP";\n',
            '              let champDisplayNames = topMvps.map(p => escapeHTML(p.name)).join(" & ");\n',
            '              let champName = topMvps[0].name;\n',
            '              let champId = null;\n',
            '              for (const [gid, name] of Object.entries(idToNameMap)) {\n',
            '                  if (name.toLowerCase() === champName.toLowerCase()) {\n',
            '                      champId = gid; break;\n',
            '                  }\n',
            '              }\n',
            '              const avatarSrc = (champId && avatarMap[champId]) ? avatarMap[champId] : `images/${champName}.png`;\n',
            '              \n',
            '              mvpBannerHtml = `\n',
            '                <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(255,215,0,0.05);">\n',
            '                  <div style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #FFD700; overflow: hidden; flex-shrink: 0; box-shadow: 0 0 10px rgba(255,215,0,0.2);">\n',
            '                    <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src=\'images/default.png\';">\n',
            '                  </div>\n',
            '                  <div style="flex: 1; text-align: left;">\n',
            '                    <div style="color: #FFD700; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">${mvpTitle}</div>\n',
            '                    <div style="color: var(--text-main); font-size: 18px; font-weight: bold;">${champDisplayNames}</div>\n',
            '                  </div>\n',
            '                  <div style="text-align: right;">\n',
            '                    <div style="color: var(--text-muted); font-size: 11px;">Total Score</div>\n',
            '                    <div style="color: var(--accent); font-size: 20px; font-weight: bold;">${maxHorns}</div>\n',
            '                  </div>\n',
            '                </div>\n',
            '              `;\n',
            '          }\n'
        ]
        # Replace from i-1 to i+26
        lines[i-1:i+27] = banner_lines
        print("Patched Current Showdown Banner")
        break

# Find table loop for Current Showdown
for i in range(7570, 7610):
    if i < len(lines) and 'liveDisplayList.forEach((p, index)' in lines[i]:
        table_loop = [
            '          let currentLiveRank = 1;\n',
            '          liveDisplayList.forEach((p, index) => {\n',
            '              if (index > 0) {\n',
            '                  let prev = liveDisplayList[index - 1];\n',
            '                  if (p.horns !== prev.horns || p.total !== prev.total) {\n',
            '                      currentLiveRank = index + 1;\n',
            '                  }\n',
            '              }\n',
            '              let rankDisplay = currentLiveRank;\n',
            '              liveShowdownHtml += `<tr>\n',
            '                 <td style="font-weight:bold; color:var(--text-muted);">${rankDisplay}</td>\n',
            '                 <td>${formatCell(p.name)}</td>\n',
            '                 <td>${p.horns}</td>\n',
            '                 <td>${p.wins}</td>\n',
            '                 <td>${p.total > 0 ? p.total.toLocaleString() : \'0\'}</td>\n',
            '              </tr>`;\n',
            '          });\n'
        ]
        end_idx = i
        for j in range(i, i+15):
            if 'liveShowdownHtml += `</tbody>' in lines[j]:
                end_idx = j
                break
        lines[i:end_idx] = table_loop
        print("Patched Current Showdown Table Loop")
        break

# 2. Patch All-Time Showdown MVP Banner & Table Ranks
for i in range(7610, 7660):
    if i < len(lines) and 'if (allTimePlayers.length > 0 && allTimePlayers[0].horns > 0)' in lines[i]:
        banner_lines_alltime = [
            '              let allTimeMvpHtml = "";\n',
            '              if (allTimePlayers.length > 0 && allTimePlayers[0].horns > 0) {\n',
            '                  let maxHorns = allTimePlayers[0].horns;\n',
            '                  let topChamps = allTimePlayers.filter(p => p.horns === maxHorns);\n',
            '                  let champTitle = topChamps.length > 1 ? "👑 All-Time Co-Champions" : "👑 All-Time Champion";\n',
            '                  let champDisplayNames = topChamps.map(p => escapeHTML(p.name)).join(" & ");\n',
            '                  let champName = topChamps[0].name;\n',
            '                  let champId = null;\n',
            '                  for (const [gid, name] of Object.entries(idToNameMap)) {\n',
            '                      if (name.toLowerCase() === champName.toLowerCase()) {\n',
            '                          champId = gid; break;\n',
            '                      }\n',
            '                  }\n',
            '                  const avatarSrc = (champId && avatarMap[champId]) ? avatarMap[champId] : `images/${champName}.png`;\n',
            '                  \n',
            '                  allTimeMvpHtml = `\n',
            '                    <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(255,215,0,0.05);">\n',
            '                      <div style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #FFD700; overflow: hidden; flex-shrink: 0; box-shadow: 0 0 10px rgba(255,215,0,0.2);">\n',
            '                        <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src=\'images/default.png\';">\n',
            '                      </div>\n',
            '                      <div style="flex: 1; text-align: left;">\n',
            '                        <div style="color: #FFD700; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">${champTitle}</div>\n',
            '                        <div style="color: var(--text-main); font-size: 18px; font-weight: bold;">${champDisplayNames}</div>\n',
            '                      </div>\n',
            '                      <div style="text-align: right;">\n',
            '                        <div style="color: var(--text-muted); font-size: 11px;">Total Score</div>\n',
            '                        <div style="color: var(--accent); font-size: 20px; font-weight: bold;">${maxHorns}</div>\n',
            '                      </div>\n',
            '                    </div>\n',
            '                  `;\n',
            '              }\n'
        ]
        lines[i-1:i+27] = banner_lines_alltime
        print("Patched All-Time Showdown Banner")
        break

# Find table loop for All-Time Showdown
for i in range(7650, 7700):
    if i < len(lines) and 'allTimeDisplayList.forEach((p, index)' in lines[i]:
        table_loop_alltime = [
            '              let currentAllTimeRank = 1;\n',
            '              allTimeDisplayList.forEach((p, index) => {\n',
            '                  if (index > 0) {\n',
            '                      let prev = allTimeDisplayList[index - 1];\n',
            '                      if (p.horns !== prev.horns || p.total !== prev.total) {\n',
            '                          currentAllTimeRank = index + 1;\n',
            '                      }\n',
            '                  }\n',
            '                  let rankDisplay = currentAllTimeRank;\n',
            '                  allTimeShowdownHtml += `<tr>\n',
            '                     <td style="font-weight:bold; color:var(--text-muted);">${rankDisplay}</td>\n',
            '                     <td>${formatCell(p.name)}</td>\n',
            '                     <td>${p.horns}</td>\n',
            '                     <td>${p.wins}</td>\n',
            '                     <td>${p.total > 0 ? p.total.toLocaleString() : \'0\'}</td>\n',
            '                  </tr>`;\n',
            '              });\n'
        ]
        end_idx = i
        for j in range(i, i+15):
            if 'allTimeShowdownHtml += `</tbody>' in lines[j]:
                end_idx = j
                break
        lines[i:end_idx] = table_loop_alltime
        print("Patched All-Time Showdown Table Loop")
        break

with open('main.js', 'w', encoding='utf-8') as f:
    f.writelines(lines)
