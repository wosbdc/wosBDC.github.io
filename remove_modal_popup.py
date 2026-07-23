with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove openShowdownLeaderboardModal
start_modal = content.find("window.openShowdownLeaderboardModal = async function() {")
if start_modal != -1:
    end_modal = content.find("function renderAvatarStack(playersList) {", start_modal)
    if end_modal != -1:
        content = content[:start_modal] + content[end_modal:]
        print("Removed openShowdownLeaderboardModal function")

# 2. Remove header shortcut button in views.showdown
target_header = """          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:15px;">
            <div class="card-title" style="margin:0;">⚔️ Alliance Progress</div>
            <button onclick="openShowdownLeaderboardModal()" style="background: linear-gradient(135deg, rgba(255,215,0,0.15) 0%, rgba(255,215,0,0.05) 100%); border: 1px solid rgba(255,215,0,0.4); color: #FFD700; padding: 8px 14px; border-radius: 8px; font-size: 12px; font-weight: bold; cursor: pointer; display: flex; align-items: center; gap: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); transition: all 0.2s ease;">
              🏆 Showdown Leaderboards &rarr;
            </button>
          </div>"""

replacement_header = """          <div class="card-title">⚔️ Alliance Progress</div>"""

if target_header in content:
    content = content.replace(target_header, replacement_header)
    print("Reverted card header in views.showdown")

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Finished cleanup")
