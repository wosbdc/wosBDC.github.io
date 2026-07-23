with open('main.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_target = '<div class="card" style="max-width:800px; margin:0 auto; animation: fadeIn 0.3s ease; position:relative;">'
new_target = '<div class="card" style="max-width:1200px; margin:0 auto; animation: fadeIn 0.3s ease; position:relative;">'

if old_target in js:
    js = js.replace(old_target, new_target)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Successfully updated views.beartrap max-width to 1200px")
else:
    print("old_target not found in main.js")
