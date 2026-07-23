with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove renderAvatarStack from inside views
start = content.find("renderAvatarStack: function(playersList) {")
if start != -1:
    end = content.find("\n  leaderboards:", start)
    if end != -1:
        func_body = content[start:end].strip()
        # Remove from inside views
        content = content[:start] + content[end:]
        
        # Place as top level function before const views = {
        views_pos = content.find("const views = {")
        top_func = "function renderAvatarStack(playersList) {\n" + func_body[func_body.find("{")+1:] + "\n\n"
        content = content[:views_pos] + top_func + content[views_pos:]
        
        with open('main.js', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Moved renderAvatarStack to top level")
