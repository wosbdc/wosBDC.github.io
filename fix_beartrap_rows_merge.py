with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_override = """        // Apply Firebase Bear Trap override if available
        if (Object.keys(fbBtWins).length > 0) {
            if (titleLower.includes('all-time bear trap') && !titleLower.includes('donation')) {
                const list = Object.values(fbBtWins).filter(w => w.total > 0).sort((a,b) => b.total - a.total);
                if (list.length > 0) board.rows = list.map((w, idx) => [idx + 1, w.name, w.total]);
            } else if (titleLower.includes('bear trap 1') && !titleLower.includes('donation')) {
                const list = Object.values(fbBtWins).filter(w => w.bt1 > 0).sort((a,b) => b.bt1 - a.bt1);
                if (list.length > 0) board.rows = list.map((w, idx) => [idx + 1, w.name, w.bt1]);
            } else if (titleLower.includes('bear trap 2') && !titleLower.includes('donation')) {
                const list = Object.values(fbBtWins).filter(w => w.bt2 > 0).sort((a,b) => b.bt2 - a.bt2);
                if (list.length > 0) board.rows = list.map((w, idx) => [idx + 1, w.name, w.bt2]);
            } else if (titleLower.includes('both bear trap') && !titleLower.includes('donation')) {
                const list = Object.values(fbBtWins).filter(w => w.bt1 > 0 && w.bt2 > 0).sort((a,b) => b.total - a.total);
                if (list.length > 0) board.rows = list.map((w, idx) => [idx + 1, w.name, w.total]);
            }
        }"""

new_merge = """        // Merge Firebase Bear Trap wins with Google Sheets rows (preserving all historical players)
        if (Object.keys(fbBtWins).length > 0 && board.rows && Array.isArray(board.rows) && !titleLower.includes('donation')) {
            let isBtBoard = titleLower.includes('bear trap');
            if (isBtBoard) {
                let winsMap = {};
                // Load base Google Sheets rows first so no historical players are lost
                board.rows.forEach(r => {
                    if (r && r[1]) {
                        winsMap[r[1].toString().trim()] = parseInt(String(r[2]).replace(/,/g, '')) || 0;
                    }
                });

                // Merge native Firebase wins
                Object.values(fbBtWins).forEach(w => {
                    if (w && w.name) {
                        let pName = w.name.trim();
                        let addVal = 0;
                        if (titleLower.includes('all-time bear trap')) addVal = w.total || 0;
                        else if (titleLower.includes('bear trap 1')) addVal = w.bt1 || 0;
                        else if (titleLower.includes('bear trap 2')) addVal = w.bt2 || 0;
                        else if (titleLower.includes('both bear trap')) addVal = (w.bt1 > 0 && w.bt2 > 0) ? (w.total || 0) : 0;

                        if (addVal > 0) {
                            winsMap[pName] = Math.max(winsMap[pName] || 0, addVal);
                        }
                    }
                });

                const sorted = Object.entries(winsMap).sort((a,b) => b[1] - a[1]);
                if (sorted.length > 0) {
                    board.rows = sorted.map((kv, idx) => [idx + 1, kv[0], kv[1]]);
                }
            }
        }"""

if old_override in content:
    content = content.replace(old_override, new_merge)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully replaced override with clean row merge")
else:
    print("old_override target not found")
