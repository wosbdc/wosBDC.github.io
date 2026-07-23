with open('main.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1. Add helper function renderAvatarStack before views.leaderboards
helper_code = '''
function renderAvatarStack(playersList) {
    if (!playersList || playersList.length === 0) return '';
    if (playersList.length === 1) {
        let pName = typeof playersList[0] === 'string' ? playersList[0] : playersList[0].name;
        let champId = null;
        for (const [gid, name] of Object.entries(idToNameMap)) {
            if (name.toLowerCase() === pName.toLowerCase()) { champId = gid; break; }
        }
        const avatarSrc = (champId && avatarMap[champId]) ? avatarMap[champId] : `images/${pName}.png`;
        return `<div style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #FFD700; overflow: hidden; flex-shrink: 0; box-shadow: 0 0 10px rgba(255,215,0,0.2);">
            <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='images/default.png';">
          </div>`;
    }
    let displayList = playersList.slice(0, 3);
    let overflowCount = playersList.length - 3;
    let stackHtml = `<div style="display: flex; align-items: center; flex-shrink: 0;">`;
    displayList.forEach((p, idx) => {
        let pName = typeof p === 'string' ? p : p.name;
        let champId = null;
        for (const [gid, name] of Object.entries(idToNameMap)) {
            if (name.toLowerCase() === pName.toLowerCase()) { champId = gid; break; }
        }
        const avatarSrc = (champId && avatarMap[champId]) ? avatarMap[champId] : `images/${pName}.png`;
        let marginLeft = idx === 0 ? '0px' : '-14px';
        let zIndex = 10 - idx;
        stackHtml += `<div style="width: 42px; height: 42px; border-radius: 50%; border: 2px solid #FFD700; overflow: hidden; margin-left: ${marginLeft}; z-index: ${zIndex}; background: var(--card-bg); box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
            <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='images/default.png';">
          </div>`;
    });
    if (overflowCount > 0) {
        stackHtml += `<div style="width: 42px; height: 42px; border-radius: 50%; border: 2px solid #FFD700; background: rgba(255,215,0,0.2); color: #FFD700; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; margin-left: -14px; z-index: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
            +${overflowCount}
          </div>`;
    }
    stackHtml += `</div>`;
    return stackHtml;
}
'''

# Find views.leaderboards definition line
for i, line in enumerate(lines):
    if 'views.leaderboards =' in line or 'leaderboards:' in line or 'leaderboards = async' in line:
        lines.insert(i, helper_code + '\n')
        print(f"Inserted helper code at line {i+1}")
        break

content = "".join(lines)

# 2. Replace Current Showdown Banner avatar block
old_current_avatar = '''              let avatarHtml = renderAvatarStack(topMvps);
              
              mvpBannerHtml = `
                <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(255,215,0,0.05);">
                  <div style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #FFD700; overflow: hidden; flex-shrink: 0; box-shadow: 0 0 10px rgba(255,215,0,0.2);">
                    <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='images/default.png';">
                  </div>'''

# Search for the old avatar block in current banner
target_current_banner = '''              const avatarSrc = (champId && avatarMap[champId]) ? avatarMap[champId] : `images/${champName}.png`;
              
              mvpBannerHtml = `
                <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(255,215,0,0.05);">
                  <div style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #FFD700; overflow: hidden; flex-shrink: 0; box-shadow: 0 0 10px rgba(255,215,0,0.2);">
                    <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='images/default.png';">
                  </div>'''

replacement_current_banner = '''              let avatarStackHtml = renderAvatarStack(topMvps);
              
              mvpBannerHtml = `
                <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(255,215,0,0.05);">
                  ${avatarStackHtml}'''

content = content.replace(target_current_banner, replacement_current_banner)

# 3. Replace All-Time Showdown Banner avatar block
target_alltime_banner = '''                  const avatarSrc = (champId && avatarMap[champId]) ? avatarMap[champId] : `images/${champName}.png`;
                  
                  allTimeMvpHtml = `
                    <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(255,215,0,0.05);">
                      <div style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #FFD700; overflow: hidden; flex-shrink: 0; box-shadow: 0 0 10px rgba(255,215,0,0.2);">
                        <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='images/default.png';">
                      </div>'''

replacement_alltime_banner = '''                  let allTimeAvatarStackHtml = renderAvatarStack(topChamps);
                  
                  allTimeMvpHtml = `
                    <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(255,215,0,0.05);">
                      ${allTimeAvatarStackHtml}'''

content = content.replace(target_alltime_banner, replacement_alltime_banner)

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully applied avatar stack patch")
