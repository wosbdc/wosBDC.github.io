with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = "function renderAvatarStack(playersList) {"
replacement = "renderAvatarStack: function(playersList) {"

if target in content:
    content = content.replace(target, replacement, 1)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed renderAvatarStack method syntax in main.js")
else:
    print("Target not found")
