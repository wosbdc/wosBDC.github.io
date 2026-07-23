with open('main.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Replace css_rules injected into main.js
old_rules_marker = "/* --- Handedness Mobile Navigation Alignment --- */"

new_full_css_rules = """/* --- Handedness Mobile Top Navbar & Hamburger Rules --- */
@media (max-width: 900px) {
  /* Right-Handed (Default): Hamburger ☰ button on FAR RIGHT */
  body.hand-right .nav-inner {
    flex-direction: row !important;
  }
  body.hand-right .nav-controls {
    order: 2 !important;
    margin-left: auto !important;
    margin-right: 0 !important;
  }
  body.hand-right .nav-brand {
    order: 1 !important;
    margin-right: auto !important;
    margin-left: 0 !important;
  }
  body.hand-right .mobile-menu {
    text-align: right !important;
    align-items: flex-end !important;
    left: auto !important;
    right: 0 !important;
  }
  body.hand-right .nav-links {
    align-items: flex-end !important;
    width: 100% !important;
  }
  body.hand-right .sub-link, body.hand-right .nav-link {
    text-align: right !important;
  }

  /* Left-Handed: Hamburger ☰ button moves over to FAR LEFT */
  body.hand-left .nav-inner {
    flex-direction: row-reverse !important;
  }
  body.hand-left .nav-controls {
    order: 1 !important;
    margin-right: auto !important;
    margin-left: 0 !important;
  }
  body.hand-left .nav-brand {
    order: 2 !important;
    margin-left: auto !important;
    margin-right: 0 !important;
  }
  body.hand-left .mobile-menu {
    text-align: left !important;
    align-items: flex-start !important;
    right: auto !important;
    left: 0 !important;
  }
  body.hand-left .nav-links {
    align-items: flex-start !important;
    width: 100% !important;
  }
  body.hand-left .sub-link, body.hand-left .nav-link {
    text-align: left !important;
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

if old_rules_marker in js:
    # Update existing style snippet in main.js
    parts = js.split(old_rules_marker)
    # Re-inject updated CSS rules
    updated_snippet = f"const styleEl = document.createElement('style'); styleEl.textContent = `{new_full_css_rules}`; document.head.appendChild(styleEl);\n"
    # Find where styleEl was appended and replace it
    js = js[:js.rfind("const styleEl = document.createElement('style');")] + updated_snippet
    with open('main.js', 'w', encoding='utf-8') as f:
        f.write(js)
    print("Successfully updated handedness CSS in main.js")

with open('style.css', 'a', encoding='utf-8') as f:
    f.write("\n" + new_full_css_rules + "\n")
print("Successfully appended handedness CSS rules to style.css")
