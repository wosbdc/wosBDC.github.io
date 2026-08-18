# Task: Gatekeeper Report Dynamic Roster & Live Signup Overhaul

- [x] Create automated project backup archive (`backup_wos_v2.9.28_pre_gatekeeper_fix.zip`) <!-- id: 0 -->
- [x] Overhaul Gatekeeper dynamic calculation in `main.js` to read both `roster_live` and `users` for live 41-chief roster, real joins today/7-days, real active 30-day tokens, and real recent signups <!-- id: 1 -->
- [x] Upgrade Gatekeeper Report Editor in `main.js` to support Live Auto-Sync vs Manual Overrides without freezing static strings <!-- id: 2 -->
- [x] Update `tools/bdc_central_command_gui.pyw` to use correct Firebase URL and dynamically compute all Gatekeeper telemetry from `roster_live`, `users`, `gift_codes_history`, and `system/nightly_maintenance_status` <!-- id: 3 -->
- [x] Clear frozen static strings in Firebase `config/gatekeeperReportSettings` so live dynamic telemetry takes over immediately <!-- id: 4 -->
- [x] Bump version to `v2.9.29` across `package.json`, `index.html`, `version.json`, `public/version.json`, `public/sw.js`, and `CHANGELOG.md` <!-- id: 5 -->
- [x] Run full automated test suite & build validation (`cmd /c npm run build`) <!-- id: 6 -->
- [x] Commit and push to GitHub with `v2.9.29 : ...` title <!-- id: 7 -->












