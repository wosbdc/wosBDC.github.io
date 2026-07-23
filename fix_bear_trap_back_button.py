with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update views.admin signature and tab restoration
old_admin_start = "  admin: async () => {"
new_admin_start = """  admin: async (initialTab) => {
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.style.display = 'block';
    const targetTab = initialTab || window._lastAdminTab || 'tab-tools';
    window._lastAdminTab = targetTab;"""

if old_admin_start in content:
    content = content.replace(old_admin_start, new_admin_start)
    print("Updated views.admin signature")

# 2. Add global views.adminHub alias
alias_code = """views.adminHub = (tab) => views.admin(tab || 'tab-indev');"""
if "views.adminHub =" not in content:
    content = content.replace("views.admin =", alias_code + "\nviews.admin =")
    print("Registered views.adminHub alias")

# 3. Update Back button in bearTrapAdmin, polarTerrorsAdmin, mercenaryAdmin, championshipAdmin
old_bt_back = """<button onclick="views.adminHub()" style="background:rgba(255,255,255,0.2); border:none; color:#fff; cursor:pointer; font-size:18px; padding:8px 12px; border-radius:8px; transition:0.2s;">⬅ Back</button>"""
new_bt_back = """<button onclick="views.admin('tab-indev')" style="background:rgba(255,255,255,0.2); border:none; color:#fff; cursor:pointer; font-size:18px; padding:8px 12px; border-radius:8px; transition:0.2s;">⬅ Back to Admin</button>"""

content = content.replace(old_bt_back, new_bt_back)

# Update all legacy calls to views.adminHub() in error handlers
content = content.replace("onclick=\"views.adminHub()\"", "onclick=\"views.admin('tab-indev')\"")
content = content.replace("onclick=\"views.adminHub('logs')\"", "onclick=\"views.admin('tab-logs')\"")

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully fixed Back button for Bear Trap Tracker and Admin views")
