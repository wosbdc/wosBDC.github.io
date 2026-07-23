with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

dock_html = """
    <!-- Dedicated Smartphone Mobile Navigation Dock -->
    <div id="mobileNavDock" class="mobile-nav-dock">
      <a href="#" class="mobile-dock-item active" data-target="home">
        <span class="dock-icon">🏠</span>
        <span class="dock-label">Home</span>
      </a>
      <a href="#" class="mobile-dock-item" data-target="roster">
        <span class="dock-icon">👤</span>
        <span class="dock-label">Chief's</span>
      </a>
      <a href="#" class="mobile-dock-item" data-target="leaderboards">
        <span class="dock-icon">🏆</span>
        <span class="dock-label">Boards</span>
      </a>
      <a href="#" class="mobile-dock-item" data-target="showdown">
        <span class="dock-icon">⚔️</span>
        <span class="dock-label">Events</span>
      </a>
      <a href="#" class="mobile-dock-item" id="mobileDockSettingsBtn">
        <span class="dock-icon">⚙️</span>
        <span class="dock-label">Settings</span>
      </a>
    </div>
"""

if 'id="mobileNavDock"' not in html:
    html = html.replace('</body>', dock_html + '\n</body>')
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Successfully added #mobileNavDock to index.html")


with open('main.js', 'r', encoding='utf-8') as f:
    js = f.read()

dock_js_code = """
// --- Dedicated Smartphone Mobile Navigation Dock Logic ---
document.addEventListener('DOMContentLoaded', () => {
  const dockItems = document.querySelectorAll('.mobile-dock-item');
  dockItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const target = item.getAttribute('data-target');
      if (target && views[target]) {
        views[target]();
        dockItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      } else if (item.id === 'mobileDockSettingsBtn') {
        if (typeof openSidebar === 'function') openSidebar();
        else {
          const sidebar = document.getElementById('settingsSidebar');
          const overlay = document.getElementById('sidebarOverlay');
          if (sidebar) sidebar.classList.add('open');
          if (overlay) overlay.classList.add('active');
        }
      }
    });
  });
});
"""

dock_css_code = """
/* --- Smartphone Mobile Navigation Dock Styling --- */
.mobile-nav-dock {
  display: none;
}

@media (max-width: 768px) {
  .mobile-nav-dock {
    display: flex !important;
    position: fixed !important;
    bottom: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 64px !important;
    background: var(--card-bg) !important;
    border-top: 1px solid var(--border) !important;
    backdrop-filter: blur(12px) !important;
    -webkit-backdrop-filter: blur(12px) !important;
    z-index: 8999 !important;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.5) !important;
    box-sizing: border-box !important;
    padding: 4px 8px !important;
    align-items: center !important;
    justify-content: space-around !important;
  }

  body.hand-right .mobile-nav-dock {
    flex-direction: row !important;
  }

  body.hand-left .mobile-nav-dock {
    flex-direction: row-reverse !important;
  }

  .mobile-dock-item {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    color: var(--text-muted) !important;
    text-decoration: none !important;
    font-size: 11px !important;
    font-weight: bold !important;
    flex: 1 !important;
    padding: 6px 0 !important;
    border-radius: 8px !important;
    transition: background 0.2s, color 0.2s, transform 0.15s !important;
  }

  .mobile-dock-item .dock-icon {
    font-size: 20px !important;
    margin-bottom: 2px !important;
  }

  .mobile-dock-item.active {
    color: var(--accent) !important;
    background: rgba(59, 130, 246, 0.15) !important;
  }

  .mobile-dock-item:active {
    transform: scale(0.92) !important;
  }

  body {
    padding-bottom: 75px !important;
  }
}
"""

if "mobile-nav-dock" not in js:
    js += f"\n{dock_js_code}\n"
    js += f"\nconst dockStyleEl = document.createElement('style'); dockStyleEl.textContent = `{dock_css_code}`; document.head.appendChild(dockStyleEl);\n"
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Successfully added mobile dock JS & CSS to main.js")
