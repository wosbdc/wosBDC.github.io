# Task: Consolidate Member Perks & Auto Gift Code Redemption into Account Hub

- [x] Create automated project backup archive (`backup_wos_website_v2.9.20_pre_account_hub_perks.zip`) <!-- id: 0 -->
- [x] Remove top navigation bar "Perks ▾" dropdown from `index.html` <!-- id: 1 -->
- [x] Add "🎁 Member Perks" 5th tab to Account Hub with auto redeem overview, status badges, perks grid, and 1-click gift code copy <!-- id: 2 -->
- [x] Route legacy `views.giftcodes` calls directly to `views.account('Perks')` <!-- id: 3 -->
- [ ] Update versioning across `package.json`, `index.html`, `version.json`, `public/version.json`, `public/sw.js`, `CHANGELOG.md`, and `public/CHANGELOG.md` to `v2.9.21` <!-- id: 4 -->
- [ ] Build & run feature verification test suite (`npm run build`) <!-- id: 5 -->
- [ ] Commit and push changes to GitHub with `v2.9.21 : ...` commit title <!-- id: 6 -->

