# Testing & Quality Assurance Protocol (wosBDC)

This document defines the mandatory Quality Control & Testing Standards for the wosBDC web application. Every code change must be audited against these rules before any deployment or push.

---

## 1. View & Context Isolation (No Hijacking)
* **Rule**: Shared action functions (e.g. status updates, deletions, voting, toggling checkboxes) must NEVER assume they are on the primary view.
* **Check**: When an action is invoked inside the Admin Panel (`#tab-feedback`, `#tab-users`, `#adminFeedbackTabContainer`) or inside an active modal, it must NOT call top-level view render functions (e.g. `views.feedback()`, `views.admin()`, or uncontained `activeFeedbackRender()`) that destroy the user's active context.
* **Pattern**:
  ```javascript
  const inAdmin = !!document.getElementById('adminFeedbackTabContainer');
  if (!inAdmin && typeof window.activeFeedbackRender === 'function') {
      window.activeFeedbackRender();
  }
  if (typeof window.renderAdminFeedbackTab === 'function') {
      window.renderAdminFeedbackTab();
  }
  ```

---

## 2. Action Call-Chain Tracing (Mental Simulation)
Before deploying or writing a feature, trace the full path from click to completion:
1. **Trigger**: User clicks button/checkbox/dropdown.
2. **Handler**: What function is called? (`onclick="window.someHandler(...)"`)
3. **Execution**: Does it modify local state, call Firebase, or trigger a modal?
4. **Post-Action Render**: What DOM elements are updated? Does it stay in place or reset the scroll/tab/view?
5. **Edge Cases**: What happens if the user is unauthenticated, an R4/R5 admin, or on mobile?

---

## 3. Version & Release Integrity
Every feature release must synchronize all version targets:
1. `package.json` (`version` field)
2. `version.json` (root version, release notes, dashboard version)
3. `public/version.json` (auto-synced during build)
4. `CHANGELOG.md` (punchy bullet points, maximum 10 words per bullet)

---

## 4. Automated Build & Static Audits
Before every Git commit and push, run the automated verification suite:
```powershell
cmd /c npm run build
```
This automated suite executes:
* `tools/check_window_bindings.cjs`: Validates all `onclick="window.xxx"` and `onclick="views.xxx"` handlers exist.
* `tools/test_all_features.cjs`: Performs full AST syntax checks, undeclared variable scans in templates, and version synchronization audits across all 3 version files.
* `vite build`: Runs Rollup production bundling and imports analysis.

---

## 5. Pre-Push Quality Checklist
- [ ] Has the call chain been traced from UI click to DOM update?
- [ ] Are admin actions isolated from public view re-renders?
- [ ] Is the active tab/filter preserved after state changes?
- [ ] Are all version numbers aligned across `package.json`, `version.json`, `public/version.json`?
- [ ] Does `cmd /c npm run build` exit with code 0 (clean build)?
