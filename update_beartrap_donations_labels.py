with open('main.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update Title Header
js = js.replace('<h2 style="margin:0; color:#fff; font-size:1.3em;">🐻 Bear Trap Tracker</h2>', '<h2 style="margin:0; color:#fff; font-size:1.3em;">🐻 BT Donations Tracker</h2>')

# 2. Update Stat Cards
js = js.replace('Signed Up (YES)', 'Donated (YES)')
js = js.replace('Everyone is signed up!', 'Everyone has donated!')

# 3. Update Table Column Headers
js = js.replace('<th style="padding:12px; text-align:center; font-weight:bold; color:var(--text-muted); font-size:13px; text-transform:uppercase;">Signed Up</th>', '<th style="padding:12px; text-align:center; font-weight:bold; color:var(--text-muted); font-size:13px; text-transform:uppercase;">Donated</th>')
js = js.replace('<th style="padding:12px; text-align:right; font-weight:bold; color:var(--text-muted); font-size:13px; text-transform:uppercase;">Donations</th>', '<th style="padding:12px; text-align:right; font-weight:bold; color:var(--text-muted); font-size:13px; text-transform:uppercase;">Amount</th>')

# 4. Update Badge Text in table row and toggle function
js = js.replace('✅ Signed Up', '✅ Donated')

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Successfully updated BT Donations Tracker labels in main.js")
