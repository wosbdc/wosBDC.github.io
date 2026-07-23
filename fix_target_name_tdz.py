with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_tdz_line = "    let targetName = name.trim();"
new_tdz_line = "    if (!targetName && name) targetName = name.trim();"

if old_tdz_line in content:
    content = content.replace(old_tdz_line, new_tdz_line)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully fixed targetName Temporal Dead Zone error")
else:
    print("old_tdz_line target not found")
