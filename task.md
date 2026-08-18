# Task: Fix Joined Date & Time Active Duration Calculation (v2.9.32)

- [x] Create automated project backup archive (`backup_wos_v2.9.32_pre_date_active_fix.zip`) <!-- id: 0 -->
- [x] Implement robust multi-format date parser `parseDateSafe` and formatters `formatDateForDisplay` and `formatDateForInput` <!-- id: 1 -->
- [x] Implement accurate `calculateTimeActive` to compute elapsed active time (years, months, days) from start date <!-- id: 2 -->
- [x] Implement intelligent `formatTimeActiveShort` to parse raw dates or shorten verbose time strings <!-- id: 3 -->
- [x] Update Account Hub | Profile view (`views.account`) to display clean joined date and computed elapsed duration <!-- id: 4 -->
- [x] Update Edit Profile modal to load and save `dateStarted` and `joinedDate`, automatically updating `timeActive` <!-- id: 5 -->
- [x] Update Alt Manager, Member Profiles, and Admin Users table to properly format `timeActive` <!-- id: 6 -->
- [x] Bump version to `v2.9.32` across `package.json`, `index.html`, `public/sw.js`, `public/version.json`, `CHANGELOG.md`, `public/CHANGELOG.md` <!-- id: 7 -->
- [x] Run full automated test suite & build validation (`cmd /c npm run build`) <!-- id: 8 -->
- [ ] Commit and push to GitHub with `v2.9.32 : ...` format <!-- id: 9 -->













