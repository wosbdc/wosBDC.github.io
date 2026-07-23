with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace Current Showdown table loop to include tie emoji
old_live_loop = '''          let currentLiveRank = 1;
          liveDisplayList.forEach((p, index) => {
              if (index > 0) {
                  let prev = liveDisplayList[index - 1];
                  if (p.horns !== prev.horns) {
                      currentLiveRank += 1;
                  }
              }
              let rankDisplay = currentLiveRank;
              liveShowdownHtml += `<tr>
                 <td style="font-weight:bold; color:var(--text-muted);">${rankDisplay}</td>'''

new_live_loop = '''          let currentLiveRank = 1;
          liveDisplayList.forEach((p, index) => {
              if (index > 0) {
                  let prev = liveDisplayList[index - 1];
                  if (p.horns !== prev.horns) {
                      currentLiveRank += 1;
                  }
              }
              let isTie = liveDisplayList.filter(o => o.horns === p.horns).length > 1;
              let tieBadge = isTie ? ' <span style="font-size:11px; opacity:0.85;" title="Tied Rank">🤝</span>' : '';
              let rankDisplay = `${currentLiveRank}${tieBadge}`;
              liveShowdownHtml += `<tr>
                 <td style="font-weight:bold; color:var(--text-muted);">${rankDisplay}</td>'''

# Replace All-Time Showdown table loop to include tie emoji
old_alltime_loop = '''              let currentAllTimeRank = 1;
              allTimeDisplayList.forEach((p, index) => {
                  if (index > 0) {
                      let prev = allTimeDisplayList[index - 1];
                      if (p.horns !== prev.horns) {
                          currentAllTimeRank += 1;
                      }
                  }
                  let rankDisplay = currentAllTimeRank;
                  allTimeShowdownHtml += `<tr>
                     <td style="font-weight:bold; color:var(--text-muted);">${rankDisplay}</td>'''

new_alltime_loop = '''              let currentAllTimeRank = 1;
              allTimeDisplayList.forEach((p, index) => {
                  if (index > 0) {
                      let prev = allTimeDisplayList[index - 1];
                      if (p.horns !== prev.horns) {
                          currentAllTimeRank += 1;
                      }
                  }
                  let isTie = allTimeDisplayList.filter(o => o.horns === p.horns).length > 1;
                  let tieBadge = isTie ? ' <span style="font-size:11px; opacity:0.85;" title="Tied Rank">🤝</span>' : '';
                  let rankDisplay = `${currentAllTimeRank}${tieBadge}`;
                  allTimeShowdownHtml += `<tr>
                     <td style="font-weight:bold; color:var(--text-muted);">${rankDisplay}</td>'''

content = content.replace(old_live_loop, new_live_loop)
content = content.replace(old_alltime_loop, new_alltime_loop)

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully added tie emoji badge to leaderboard ranks in main.js")
