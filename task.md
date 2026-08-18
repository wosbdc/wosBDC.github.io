# Task: Bulk Add Players to Roster (v2.9.39)

- [x] Create automated project backup archive (`backup_wos_v2.9.39_bulk_add_players.zip`) <!-- id: 0 -->
- [x] Add `roster_live` and `members` write permissions to `database.rules.json` <!-- id: 1 -->
- [x] Implement Bear-Trap-style Bulk Parser & UI in `main.js` (`window.openAddPlayerModal('bulk')`) <!-- id: 2 -->
- [x] Support multiple bulk entry formats (multi-line, tab-separated, comma-separated, `ID Name`, `Name ID`, `Name (ID)`) <!-- id: 3 -->
- [x] Implement duplicate checking against existing roster, registered users, and queue items <!-- id: 4 -->
- [x] Build interactive preview table with remove / edit and batch import confirmation <!-- id: 5 -->
- [x] Provide direct write to Firebase (`roster_live/{sanitizedName}`) with auto-generated 9-digit FID if missing <!-- id: 6 -->
- [x] Add fallback / sync trigger for Google Apps Script sheet backend <!-- id: 7 -->
- [x] Add Bulk Add button directly to Admin Chief's List toolbar <!-- id: 8 -->
- [x] Update version to `v2.9.39` across `package.json`, `index.html`, `public/sw.js`, `public/version.json`, `CHANGELOG.md`, `public/CHANGELOG.md`, `wos/VERSION.json` <!-- id: 9 -->
- [x] Run full automated test suite & build validation (`npm run build`) <!-- id: 10 -->
- [x] Commit and push to GitHub with `v2.9.39 : ...` format <!-- id: 11 -->














