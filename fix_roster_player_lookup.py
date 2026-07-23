with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update dropdown options in views.roster to include all roster names
old_dropdown_opts = """        const renderDropdownOptions = () => {
            const onlyReg = globalRosterRegisteredOnly || (regToggle && regToggle.checked);
            
            dropdownItems = [];
            players.forEach((p, i) => {
                let name = p[0].toString().trim();
                let isReg = false;
                let gid = nameToIdMap[name];
                if (gid && registeredGameIds.has(gid.toString().trim())) isReg = true;
                if (onlyReg && !isReg) return;
                dropdownItems.push({ name: name, isReg: isReg, nt: /^[ -~]*$/.test(name) ? 'notranslate' : '' });
            });
        };"""

new_dropdown_opts = """        const renderDropdownOptions = () => {
            const onlyReg = globalRosterRegisteredOnly || (regToggle && regToggle.checked);
            
            dropdownItems = [];
            const allNamesSet = new Set();
            if (Array.isArray(players)) {
                players.forEach(p => {
                    if (p[0]) allNamesSet.add(p[0].toString().trim());
                });
            }
            if (typeof idToNameMap === 'object') {
                Object.values(idToNameMap).forEach(name => {
                    if (name) allNamesSet.add(name.toString().trim());
                });
            }
            
            Array.from(allNamesSet).sort((a,b) => a.localeCompare(b)).forEach(name => {
                let isReg = false;
                let gid = nameToIdMap[name];
                if (gid && registeredGameIds.has(gid.toString().trim())) isReg = true;
                if (onlyReg && !isReg) return;
                dropdownItems.push({ name: name, isReg: isReg, nt: /^[ -~]*$/.test(name) ? 'notranslate' : '' });
            });
        };"""

content = content.replace(old_dropdown_opts, new_dropdown_opts)

# 2. Update renderCardForChief to fallback to Roster if player not in Activity sheet
old_render_card = """        let p = players.find(row => row[0].toString().trim().toLowerCase() === chiefName.toLowerCase().trim());
        if (!p) return; // ignore invalid names
        chiefName = p[0].toString().trim(); // use correct casing"""

new_render_card = """        let p = players.find(row => row[0].toString().trim().toLowerCase() === chiefName.toLowerCase().trim());
        if (!p) {
            let matchedChief = null;
            if (typeof idToNameMap === 'object') {
                for (const [gid, name] of Object.entries(idToNameMap)) {
                    if (name && name.toLowerCase().trim() === chiefName.toLowerCase().trim()) {
                        matchedChief = name; break;
                    }
                }
            }
            if (matchedChief) {
                chiefName = matchedChief;
                p = [chiefName, 0, false, false, false, false, false];
            }
        }
        if (!p) return;
        chiefName = p[0].toString().trim();"""

content = content.replace(old_render_card, new_render_card)

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully fixed Player Lookup under Chief's menu for all Roster players")
