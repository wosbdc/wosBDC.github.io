with open('main.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update views.leaderboards to calculate All-Time Bear Trap wins strictly as (bt1 + bt2)
old_leaderboard_calc = """                        if (titleLower.includes('all-time bear trap')) addVal = w.total || 0;
                        else if (titleLower.includes('bear trap 1')) addVal = w.bt1 || 0;
                        else if (titleLower.includes('bear trap 2')) addVal = w.bt2 || 0;
                        else if (titleLower.includes('both bear trap')) addVal = (w.bt1 > 0 && w.bt2 > 0) ? (w.total || 0) : 0;"""

new_leaderboard_calc = """                        if (titleLower.includes('all-time bear trap')) addVal = (w.bt1 || 0) + (w.bt2 || 0);
                        else if (titleLower.includes('bear trap 1')) addVal = w.bt1 || 0;
                        else if (titleLower.includes('bear trap 2')) addVal = w.bt2 || 0;
                        else if (titleLower.includes('both bear trap')) addVal = (w.bt1 > 0 && w.bt2 > 0) ? ((w.bt1 || 0) + (w.bt2 || 0)) : 0;"""

if old_leaderboard_calc in js:
    js = js.replace(old_leaderboard_calc, new_leaderboard_calc)
    print("Successfully updated All-Time Bear Trap leaderboards to calculate strict (bt1 + bt2) Crown wins.")
else:
    print("old_leaderboard_calc not found in main.js")

# 2. Update syncAllSheetsToFirebase to not inject fake totals from sheet rows
old_sync_wins = """                        } else {
                            if (!winsAgg[key]) winsAgg[key] = { name: pName, bt1: 0, bt2: 0, total: 0 };
                            winsAgg[key].name = pName;
                            if (isBt1) winsAgg[key].bt1 = Math.max(winsAgg[key].bt1 || 0, val);
                            else if (isBt2) winsAgg[key].bt2 = Math.max(winsAgg[key].bt2 || 0, val);
                            else if (isAllTime) winsAgg[key].total = Math.max(winsAgg[key].total || 0, val);
                        }
                    });
                });

                Object.values(winsAgg).forEach(w => {
                    let calcTotal = (w.bt1 || 0) + (w.bt2 || 0);
                    w.total = Math.max(w.total || 0, calcTotal);
                });"""

new_sync_wins = """                        } else {
                            if (!winsAgg[key]) winsAgg[key] = { name: pName, bt1: 0, bt2: 0, total: 0 };
                            winsAgg[key].name = pName;
                            if (isBt1) winsAgg[key].bt1 = Math.max(winsAgg[key].bt1 || 0, val);
                            else if (isBt2) winsAgg[key].bt2 = Math.max(winsAgg[key].bt2 || 0, val);
                        }
                    });
                });

                Object.values(winsAgg).forEach(w => {
                    w.total = (w.bt1 || 0) + (w.bt2 || 0);
                });"""

if old_sync_wins in js:
    js = js.replace(old_sync_wins, new_sync_wins)
    print("Successfully updated syncAllSheetsToFirebase to enforce strict w.total = bt1 + bt2.")
else:
    print("old_sync_wins not found in main.js")

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("All updates applied!")
