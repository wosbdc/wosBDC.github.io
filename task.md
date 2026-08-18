# Task: Support Multi-Member Target & Single-Row Batched Parsing in Admin Logs

- [x] Create automated project backup archive (`backup_wos_website_v2.9.25_pre_multitarget_parsing.tar.gz`) <!-- id: 0 -->
- [x] Implement robust `window.extractLogMembers(log)` helper in `main.js` to parse comma-separated and formatted member strings (e.g. `(+... ➔ New Total: ...)`) <!-- id: 1 -->
- [x] Update `fetchAdminLog` to detect multi-member single rows, render the orange `👥 Multiple (N)` pill, attach modal & tooltip, and provide a view list button <!-- id: 2 -->
- [x] Enhance `window.showBatchedMembersModal` and `copyBatchedMembersList` to format member totals and donation increments cleanly <!-- id: 3 -->
- [x] Bump ecosystem version to `v2.9.26` across all required files and update CHANGELOG <!-- id: 4 -->
- [x] Run full automated test suite & build validation (`npm run build`) <!-- id: 5 -->
- [x] Commit and push to GitHub with `v2.9.26 : ...` title <!-- id: 6 -->










