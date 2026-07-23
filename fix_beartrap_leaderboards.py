with open('main.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_bt_processing = """        // Merge Firebase Bear Trap wins with Google Sheets rows (preserving all historical players)
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
        }
        
        if (Object.keys(fbBtDonations).length > 0 && titleLower.includes('donation')) {
            if (titleLower.includes('all-time')) {
                let mergedScores = {};
                if (board.rows) {
                    board.rows.forEach(r => {
                        mergedScores[r[1]] = parseInt(String(r[2]).replace(/,/g, '')) || 0;
                    });
                }
                Object.values(fbBtDonations).forEach(d => {
                    let fbAmt = d.allTime || d.amount || 0;
                    if (fbAmt > 0) {
                        mergedScores[d.name] = (mergedScores[d.name] || 0) + fbAmt;
                    }
                });
                const list = Object.entries(mergedScores).filter(kv => kv[1] > 0).sort((a,b) => b[1] - a[1]);
                if (list.length > 0) board.rows = list.map((kv, idx) => [idx + 1, kv[0], kv[1]]);
            } else {
                const list = Object.values(fbBtDonations).filter(d => (d.current || d.amount) > 0).sort((a,b) => (b.current || b.amount) - (a.current || a.amount));
                if (list.length > 0) board.rows = list.map((d, idx) => [idx + 1, d.name, d.current || d.amount]);
            }
        }"""

new_bt_processing = """        // Merge Firebase Bear Trap wins with Google Sheets rows (preserving all historical players)
        if (!titleLower.includes('donation') && titleLower.includes('bear trap')) {
            let winsMap = {};
            if (board.rows && Array.isArray(board.rows)) {
                board.rows.forEach(r => {
                    if (r && r[1]) {
                        winsMap[r[1].toString().trim()] = parseInt(String(r[2]).replace(/,/g, '')) || 0;
                    }
                });
            }

            if (Object.keys(fbBtWins).length > 0) {
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
            }

            const sorted = Object.entries(winsMap).filter(kv => kv[1] > 0).sort((a,b) => b[1] - a[1]);
            if (sorted.length > 0) {
                board.rows = sorted.map((kv, idx) => [idx + 1, kv[0], kv[1]]);
            }

            // All-Time Bear Trap Leaderboard shows Top 4 ONLY
            if (titleLower.includes('all-time bear trap')) {
                board.title = "All-Time Bear Trap Leaderboard";
                if (board.rows && Array.isArray(board.rows)) {
                    board.rows = board.rows.slice(0, 4);
                }
            }
        }
        
        if (titleLower.includes('donation')) {
            if (titleLower.includes('all-time')) {
                board.title = "All-Time Bear Trap Donations Leaderboard";
                let mergedScores = {};
                if (board.rows && Array.isArray(board.rows)) {
                    board.rows.forEach(r => {
                        if (r && r[1]) {
                            mergedScores[r[1].toString().trim()] = parseInt(String(r[2]).replace(/,/g, '')) || 0;
                        }
                    });
                }
                if (Object.keys(fbBtDonations).length > 0) {
                    Object.values(fbBtDonations).forEach(d => {
                        if (d && d.name) {
                            let pName = d.name.trim();
                            let fbAmt = d.allTime !== undefined ? d.allTime : (d.amount || 0);
                            if (fbAmt > 0) {
                                mergedScores[pName] = Math.max(mergedScores[pName] || 0, fbAmt);
                            }
                        }
                    });
                }
                const list = Object.entries(mergedScores).filter(kv => kv[1] > 0).sort((a,b) => b[1] - a[1]);
                if (list.length > 0) board.rows = list.map((kv, idx) => [idx + 1, kv[0], kv[1]]);
            } else {
                board.title = "Current Bear Trap Donations Leaderboard";
                let currentScores = {};
                if (board.rows && Array.isArray(board.rows)) {
                    board.rows.forEach(r => {
                        if (r && r[1]) {
                            currentScores[r[1].toString().trim()] = parseInt(String(r[2]).replace(/,/g, '')) || 0;
                        }
                    });
                }
                if (Object.keys(fbBtDonations).length > 0) {
                    Object.values(fbBtDonations).forEach(d => {
                        if (d && d.name) {
                            let pName = d.name.trim();
                            let fbAmt = d.current !== undefined ? d.current : (d.amount || 0);
                            if (fbAmt > 0) {
                                currentScores[pName] = fbAmt;
                            }
                        }
                    });
                }
                const list = Object.entries(currentScores).filter(kv => kv[1] > 0).sort((a,b) => b[1] - a[1]);
                if (list.length > 0) board.rows = list.map((kv, idx) => [idx + 1, kv[0], kv[1]]);
            }
        }"""

if old_bt_processing in js:
    js = js.replace(old_bt_processing, new_bt_processing)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Successfully updated Bear Trap Leaderboards processing logic in main.js")
else:
    print("old_bt_processing not found in main.js")
