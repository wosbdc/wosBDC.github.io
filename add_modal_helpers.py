with open('main.js', 'r', encoding='utf-8') as f:
    js = f.read()

modal_helpers = """
// --- Settings Modal Helpers ---
window.openNotificationsModal = () => {
  const modal = document.getElementById('notificationsModal');
  const overlay = document.getElementById('notificationsModalOverlay');
  if (modal) modal.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
  if (typeof closeSidebarFunc === 'function') closeSidebarFunc();
  else {
    const sidebar = document.getElementById('settingsSidebar');
    const sideOverlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (sideOverlay) sideOverlay.classList.remove('active');
  }
};

window.openThemeModal = () => {
  const modal = document.getElementById('themeModal');
  const overlay = document.getElementById('themeModalOverlay');
  if (modal) modal.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
  if (typeof closeSidebarFunc === 'function') closeSidebarFunc();
  else {
    const sidebar = document.getElementById('settingsSidebar');
    const sideOverlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (sideOverlay) sideOverlay.classList.remove('active');
  }
};

window.openMobileNavModal = () => {
  const modal = document.getElementById('mobileNavModal');
  const overlay = document.getElementById('mobileNavModalOverlay');
  if (modal) modal.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
  if (typeof closeSidebarFunc === 'function') closeSidebarFunc();
  else {
    const sidebar = document.getElementById('settingsSidebar');
    const sideOverlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (sideOverlay) sideOverlay.classList.remove('active');
  }
};

window.closeMobileNavModal = () => {
  const modal = document.getElementById('mobileNavModal');
  const overlay = document.getElementById('mobileNavModalOverlay');
  if (modal) modal.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
};
"""

js += modal_helpers

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Successfully added modal helpers to main.js")
