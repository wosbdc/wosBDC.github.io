with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

hand_setting_card = """
      <!-- Mobile Thumb Alignment Setting -->
      <div class="sidebar-section" style="margin-bottom:20px; background:var(--bg-main); padding:15px; border-radius:10px; border:1px solid var(--border);">
        <h3 style="margin-top:0; margin-bottom:8px; font-size:15px; color:var(--text-main); border-bottom:1px solid var(--border); padding-bottom:8px; display:flex; align-items:center; gap:6px;">
          📱 Mobile Navigation
        </h3>
        <p style="margin:0 0 10px 0; font-size:11px; color:var(--text-muted);">
          Align mobile menus and controls for right-handed or left-handed thumb reach.
        </p>
        <div id="handOrientationToggle" style="display:flex; background:var(--card-bg); border:1px solid var(--border); border-radius:8px; overflow:hidden; cursor:pointer; padding:3px; gap:4px;">
          <button class="hand-opt-btn" onclick="window.setHandOrientation('right')" data-hand="right" style="flex:1; padding:8px 10px; font-size:12px; font-weight:bold; border:none; border-radius:6px; background:var(--accent); color:#fff; cursor:pointer; transition:0.2s; display:flex; align-items:center; justify-content:center; gap:6px;">
            ✋ Right-Handed
          </button>
          <button class="hand-opt-btn" onclick="window.setHandOrientation('left')" data-hand="left" style="flex:1; padding:8px 10px; font-size:12px; font-weight:bold; border:none; border-radius:6px; background:transparent; color:var(--text-muted); cursor:pointer; transition:0.2s; display:flex; align-items:center; justify-content:center; gap:6px;">
            🖐️ Left-Handed
          </button>
        </div>
      </div>
"""

target_insert = '<div class="sidebar-section" style="margin-bottom:20px; background:var(--bg-main); padding:15px; border-radius:10px; border:1px solid var(--border);">'

if target_insert in html:
    html = html.replace(target_insert, hand_setting_card + target_insert, 1)
    with open('index.html', 'w', encoding='utf-8') as f:
        f.write(html)
    print("Successfully added Mobile Handedness card to index.html")
else:
    print("target_insert not found in index.html")


with open('main.js', 'r', encoding='utf-8') as f:
    js = f.read()

hand_js_code = """
// --- Mobile Handedness Navigation System ---
window.initHandOrientation = () => {
  const savedHand = localStorage.getItem('wos_hand_orientation') || 'right';
  document.body.classList.remove('hand-right', 'hand-left');
  document.body.classList.add(`hand-${savedHand}`);

  const btns = document.querySelectorAll('.hand-opt-btn');
  btns.forEach(btn => {
    if (btn.getAttribute('data-hand') === savedHand) {
      btn.style.background = 'var(--accent)';
      btn.style.color = '#fff';
    } else {
      btn.style.background = 'transparent';
      btn.style.color = 'var(--text-muted)';
    }
  });
};

window.setHandOrientation = (hand) => {
  localStorage.setItem('wos_hand_orientation', hand);
  window.initHandOrientation();
  if (window.showToast) window.showToast(`Mobile Navigation aligned for ${hand === 'left' ? '🖐️ Left-Handed' : '✋ Right-Handed'} use!`, "info");
};

// Auto-run on startup
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.initHandOrientation());
} else {
  window.initHandOrientation();
}
"""

js += hand_js_code

# Add CSS rules for hand alignment
css_rules = """
/* --- Handedness Mobile Navigation Alignment --- */
@media (max-width: 768px) {
  body.hand-left .nav-inner {
    flex-direction: row-reverse !important;
  }
  body.hand-left .mobile-menu {
    left: 10px !important;
    right: auto !important;
  }
  body.hand-left .settings-sidebar {
    left: 0 !important;
    right: auto !important;
    transform: translateX(-100%) !important;
    border-right: 1px solid var(--border) !important;
    border-left: none !important;
  }
  body.hand-left .settings-sidebar.open {
    transform: translateX(0) !important;
  }
  body.hand-left #devDeployBanner {
    left: 20px !important;
    right: auto !important;
  }
}
"""

# Inject CSS into document
js += f"""\nconst styleEl = document.createElement('style'); styleEl.textContent = `{css_rules}`; document.head.appendChild(styleEl);\n"""

with open('main.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Successfully injected Handedness JS and CSS logic into main.js")
