with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_champ_banner = """        if (champName) {
           // Look up their gameId to get the avatar
           let champId = null;
           for (const [gid, name] of Object.entries(idToNameMap)) {
               if (name.toLowerCase() === champName.toLowerCase()) {
                   champId = gid; break;
               }
           }
           
           const avatarSrc = (champId && avatarMap[champId]) ? avatarMap[champId] : `images/${champName}.png`;
           
           html += `
             <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(255,215,0,0.05);">
               <div style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #FFD700; overflow: hidden; flex-shrink: 0; box-shadow: 0 0 10px rgba(255,215,0,0.2);">
                 <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='images/default.png';">
               </div>
               <div style="flex: 1;">
                 <div style="color: #FFD700; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">${bannerTitle}</div>
                 <div style="color: var(--text-main); font-size: 18px; font-weight: bold;">${champName}</div>
               </div>
               <div style="text-align: right;">
                 <div style="color: var(--text-muted); font-size: 11px;">${scoreLabel}</div>
                 <div style="color: var(--accent); font-size: 20px; font-weight: bold;">${champScore}</div>
               </div>
             </div>
           `;
        }"""

new_champ_banner = """        if (champName) {
           let avatarHtml = '';
           let isPending = champName === "Pending..." || champName === "?" || !champName;
           
           if (isPending) {
              avatarHtml = `
                <div style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid rgba(255,215,0,0.6); background: rgba(255,215,0,0.1); display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: bold; color: #FFD700; flex-shrink: 0; box-shadow: 0 0 12px rgba(255,215,0,0.3);">
                  ❓
                </div>
              `;
           } else {
              // Look up their gameId to get the avatar
              let champId = null;
              for (const [gid, name] of Object.entries(idToNameMap)) {
                  if (name.toLowerCase() === champName.toLowerCase()) {
                      champId = gid; break;
                  }
              }
              const avatarSrc = (champId && avatarMap[champId]) ? avatarMap[champId] : `images/${champName}.png`;
              avatarHtml = `
                <div style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #FFD700; overflow: hidden; flex-shrink: 0; box-shadow: 0 0 10px rgba(255,215,0,0.2);">
                  <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='images/default.png';">
                </div>
              `;
           }
           
           html += `
             <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(255,215,0,0.05);">
               ${avatarHtml}
               <div style="flex: 1;">
                 <div style="color: #FFD700; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">${bannerTitle}</div>
                 <div style="color: var(--text-main); font-size: 18px; font-weight: bold;">${champName}</div>
               </div>
               <div style="text-align: right;">
                 <div style="color: var(--text-muted); font-size: 11px;">${scoreLabel}</div>
                 <div style="color: var(--accent); font-size: 20px; font-weight: bold;">${champScore}</div>
               </div>
             </div>
           `;
        }"""

if old_champ_banner in content:
    content = content.replace(old_champ_banner, new_champ_banner)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully added ❓ question mark avatar badge for reset/pending winners")
else:
    print("old_champ_banner target not found")
