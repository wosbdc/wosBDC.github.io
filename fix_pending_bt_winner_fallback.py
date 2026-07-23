with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = 'if (btWinners[trapNum] && btWinners[trapNum].name && btWinners[trapNum].name !== "Pending...") {'
replacement = 'if (btWinners[trapNum] && btWinners[trapNum].name) {'

if target in content:
    content = content.replace(target, replacement)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed BT winner Pending... fallback check")
else:
    print("Target not found")
