with open('main.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update resetBearTrapWinners
old_reset = """window.resetBearTrapWinners = async () => {
    const confirmed = await window.customConfirm("Are you sure you want to reset both Bear Trap winners to 'Pending...'?");
    if (!confirmed) return;
    try {
        await set(ref(db, 'config/bearTrapWinners/1'), {name: "Pending...", score: "-", timestamp: Date.now()});
        await set(ref(db, 'config/bearTrapWinners/2'), {name: "Pending...", score: "-", timestamp: Date.now()});
        window.logAdminAction("Bear Trap Reset", "Reset both Bear Trap 1 and Bear Trap 2 champions to Pending");
        window.showToast("Bear Trap Winners Reset to Pending!", "success");
        setTimeout(() => window.location.reload(), 1500);
    } catch(e) {
        window.showToast("Error resetting: " + e.message, "danger");
    }
};"""

new_reset = """window.resetBearTrapWinners = async () => {
    const confirmed = await window.customConfirm("Are you sure you want to reset both Bear Trap winners to 'Pending...'?");
    if (!confirmed) return;
    try {
        await Promise.all([
            set(ref(db, 'config/bearTrapWinners/1'), {name: "Pending...", score: "-", timestamp: Date.now()}),
            set(ref(db, 'config/bearTrapWinners/2'), {name: "Pending...", score: "-", timestamp: Date.now()})
        ]);
        window.logAdminAction("Bear Trap Reset", "Reset both Bear Trap 1 and Bear Trap 2 champions to Pending");
        window.showToast("Bear Trap Winners Reset to Pending!", "success");
        if (typeof views.beartrap === 'function') {
            await views.beartrap();
        }
    } catch(e) {
        console.error("Error resetting Bear Trap winners:", e);
        window.showToast("Error resetting: " + (e.message || "Permission Denied"), "error");
    }
};"""

content = content.replace(old_reset, new_reset)

# 2. Update doBeartrapResetPlayer to auto-close modal on success
old_reset_player = """        resDiv.innerHTML = '<span style="color:var(--success)">✅ Successfully reset donations for ' + finalName + '.</span>';
        window.logAdminAction("Bear Trap Player Reset", `Wiped Bear Trap donations for ${finalName} to zero`, finalName);
        document.getElementById('beartrapResetPlayerName').value = '';"""

new_reset_player = """        resDiv.innerHTML = '<span style="color:var(--success)">✅ Successfully reset donations for ' + finalName + '.</span>';
        window.logAdminAction("Bear Trap Player Reset", `Wiped Bear Trap donations for ${finalName} to zero`, finalName);
        document.getElementById('beartrapResetPlayerName').value = '';
        setTimeout(() => {
            const modal = document.getElementById('btResetPlayerModal');
            if (modal) modal.style.display = 'none';
        }, 1500);"""

content = content.replace(old_reset_player, new_reset_player)

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully fixed resetBearTrapWinners and Bear Trap admin features")
