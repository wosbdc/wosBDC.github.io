with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Case-insensitive leaderboard match
old_lb_match = "if (pName && pScore && pName.toString().trim() === name)"
new_lb_match = "if (pName && pScore && pName.toString().trim().toLowerCase() === targetName.toLowerCase())"

# 2. Case-insensitive showdown match
old_sd_match = "if (p.name === name) dynamicSD = { score: p.score, rank: index + 1 };"
new_sd_match = "if (p.name.toLowerCase() === targetName.toLowerCase()) dynamicSD = { score: p.score, rank: index + 1 };"

# 3. Flexible player row search with roster fallback
old_prow_block = """    // Find player row in Activity
    let pRow = null;
    for (let i = 1; i < data.length; i++) {
       if (data[i][0] && data[i][0].toString().trim() === name) { pRow = data[i]; break; }
    }
    
    if (!pRow) throw new Error("Player not found in Activity sheet.");"""

new_prow_block = """    let targetName = name.trim();
    let pRow = null;
    if (data && Array.isArray(data)) {
      for (let i = 1; i < data.length; i++) {
         if (data[i][0] && data[i][0].toString().trim().toLowerCase() === targetName.toLowerCase()) { 
             pRow = data[i]; 
             targetName = data[i][0].toString().trim();
             break; 
         }
      }
    }
    
    if (!pRow) {
      for (const [gid, chiefName] of Object.entries(idToNameMap)) {
         if (chiefName && chiefName.toLowerCase().trim() === targetName.toLowerCase()) {
            targetName = chiefName;
            pRow = [targetName, 0, false, false, false, false, false];
            break;
         }
      }
    }
    
    if (!pRow) throw new Error(`Chief "${name}" not found in roster or activity database.`);"""

content = content.replace("window.searchPlayerFull = async (name) => {", "window.searchPlayerFull = async (name) => {\n  let targetName = name ? name.replace(/^✅\\s*/, '').trim() : '';")
content = content.replace(old_lb_match, new_lb_match)
content = content.replace(old_sd_match, new_sd_match)
content = content.replace(old_prow_block, new_prow_block)

# Fix generatePlayerProfileHtml parameters to use targetName
content = content.replace("window.generatePlayerProfileHtml(name,", "window.generatePlayerProfileHtml(targetName,")
content = content.replace("rosterMap[name]", "rosterMap[targetName]")

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully fixed Chief / Player Lookup for case-insensitive search and roster fallback")
