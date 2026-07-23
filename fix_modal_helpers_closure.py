with open('main.js', 'r', encoding='utf-8') as f:
    js = f.read()

old_helpers_block = """// --- Settings Modal Helpers ---
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
};"""

new_helpers_block = """// --- Settings Modal Helpers ---
window.openNotificationsModal = () => {
  const modal = document.getElementById('notificationsModal');
  const overlay = document.getElementById('notificationsModalOverlay');
  if (modal) modal.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
  const sidebar = document.getElementById('settingsSidebar');
  const sideOverlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (sideOverlay) sideOverlay.classList.remove('active');
};

window.openThemeModal = () => {
  const modal = document.getElementById('themeModal');
  const overlay = document.getElementById('themeModalOverlay');
  if (modal) modal.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
  const sidebar = document.getElementById('settingsSidebar');
  const sideOverlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (sideOverlay) sideOverlay.classList.remove('active');
};

window.openMobileNavModal = () => {
  const modal = document.getElementById('mobileNavModal');
  const overlay = document.getElementById('mobileNavModalOverlay');
  if (modal) modal.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
  const sidebar = document.getElementById('settingsSidebar');
  const sideOverlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (sideOverlay) sideOverlay.classList.remove('active');
};

window.closeMobileNavModal = () => {
  const modal = document.getElementById('mobileNavModal');
  const overlay = document.getElementById('mobileNavModalOverlay');
  if (modal) modal.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
};"""

if old_helpers_block in js:
    js = js.replace(old_helpers_block, new_helpers_block)
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Successfully fixed modal helpers closure reference in main.js")
else:
    print("old_helpers_block not found in main.js")
