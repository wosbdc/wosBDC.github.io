with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update rank tie conditions to check ONLY horns
old_live_rank = '''          let currentLiveRank = 1;
          liveDisplayList.forEach((p, index) => {
              if (index > 0) {
                  let prev = liveDisplayList[index - 1];
                  if (p.horns !== prev.horns || p.total !== prev.total) {
                      currentLiveRank = index + 1;
                  }
              }'''

new_live_rank = '''          let currentLiveRank = 1;
          liveDisplayList.forEach((p, index) => {
              if (index > 0) {
                  let prev = liveDisplayList[index - 1];
                  if (p.horns !== prev.horns) {
                      currentLiveRank = index + 1;
                  }
              }'''

old_alltime_rank = '''              let currentAllTimeRank = 1;
              allTimeDisplayList.forEach((p, index) => {
                  if (index > 0) {
                      let prev = allTimeDisplayList[index - 1];
                      if (p.horns !== prev.horns || p.total !== prev.total) {
                          currentAllTimeRank = index + 1;
                      }
                  }'''

new_alltime_rank = '''              let currentAllTimeRank = 1;
              allTimeDisplayList.forEach((p, index) => {
                  if (index > 0) {
                      let prev = allTimeDisplayList[index - 1];
                      if (p.horns !== prev.horns) {
                          currentAllTimeRank = index + 1;
                      }
                  }'''

content = content.replace(old_live_rank, new_live_rank)
content = content.replace(old_alltime_rank, new_alltime_rank)

# 2. Change "Total Score" banner label to "Total Horns" in leaderboards view
content = content.replace(
    '<div style="color: var(--text-muted); font-size: 11px;">Total Score</div>\n                    <div style="color: var(--accent); font-size: 20px; font-weight: bold;">${maxHorns}</div>',
    '<div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase;">Total Horns</div>\n                    <div style="color: #FFD700; font-size: 20px; font-weight: bold;">${maxHorns}</div>'
)

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated main.js to rank purely by Horns")
