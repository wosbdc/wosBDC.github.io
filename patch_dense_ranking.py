with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace currentLiveRank calculation to dense ranking (+1)
old_live_dense = '''          let currentLiveRank = 1;
          liveDisplayList.forEach((p, index) => {
              if (index > 0) {
                  let prev = liveDisplayList[index - 1];
                  if (p.horns !== prev.horns) {
                      currentLiveRank = index + 1;
                  }
              }'''

new_live_dense = '''          let currentLiveRank = 1;
          liveDisplayList.forEach((p, index) => {
              if (index > 0) {
                  let prev = liveDisplayList[index - 1];
                  if (p.horns !== prev.horns) {
                      currentLiveRank += 1;
                  }
              }'''

old_alltime_dense = '''              let currentAllTimeRank = 1;
              allTimeDisplayList.forEach((p, index) => {
                  if (index > 0) {
                      let prev = allTimeDisplayList[index - 1];
                      if (p.horns !== prev.horns) {
                          currentAllTimeRank = index + 1;
                      }
                  }'''

new_alltime_dense = '''              let currentAllTimeRank = 1;
              allTimeDisplayList.forEach((p, index) => {
                  if (index > 0) {
                      let prev = allTimeDisplayList[index - 1];
                      if (p.horns !== prev.horns) {
                          currentAllTimeRank += 1;
                      }
                  }'''

content = content.replace(old_live_dense, new_live_dense)
content = content.replace(old_alltime_dense, new_alltime_dense)

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated main.js to use dense (in-order) ranking")
