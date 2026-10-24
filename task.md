# Task List: Championship Cooldown In-Game Format & Date Alignment (`v3.3.131`)

- [x] **1. Clean House & Pre-Change Backup**
  - [x] Delete `wos_website_backup_pre_v3.3.129.tar.gz` and create `wos_website_backup_pre_v3.3.131.tar.gz` (strict 2-backup retention: `pre_v3.3.130` & `pre_v3.3.131`)
- [x] **2. Core Timer & Date Enhancements in `main.js`**
  - [x] Update `targetEndMs` in `getChampScheduleStatus` to conclude on Saturday (`targetStartMs + 5 * 86400000`, Oct 26 – Oct 31) matching the 6-day tournament cycle
  - [x] Add cumulative in-game format (`totalHours` + `mins`, e.g. `38hr 56min`) to public cooldown card (`views.championship`) and admin cooldown gate (`views.championshipAdmin`)
  - [x] Update live ticker `startChampCooldownTicker` to update in-game hours live every second
- [x] **3. Test Suites & Verification**
  - [x] Update `tools/test_championship_redesign_headless.cjs` to verify in-game format and date range (Oct 26 – Oct 31)
  - [x] Run full project build (`cmd /c npm run build`) - 100% passed (37/37 suites)
- [x] **4. Version Bump & App Store Changelog (`v3.3.131`)**
  - [x] Bump version to `3.3.131` in `package.json`, `version.json`, and `public/version.json`
  - [x] Update `CHANGELOG.md` and `public/CHANGELOG.md` with App Store style notes ($\le 10$ words per bullet)
- [x] **5. Git Commit, Push & Process Cleanup**
  - [x] Commit and push to GitHub `origin/main` with `v3.3.131 : Added in-game total hours countdown and updated championship dates to Oct 26 - Oct 31`
  - [x] Proactively terminate background tasks and processes
  - [x] Explain math to user and announce "Ready for Testing"
