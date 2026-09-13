# Task: v3.3.47 Dynamic Versioning in Admin Resolution & Ticket Editor Quick Templates

## 📋 Active Tasks
- [x] Create project backup (`backup_wos_website_pre_v3.3.47.zip`) and verify strict 2-backup retention
- [x] Update `wos-public-website/main.js`:
  - [x] Derive `currentVersionTag` dynamically from `pkg.version` in `openAdminNoteModal`
  - [x] Replace static `v2.9.64` quick template button with dynamic `${currentVersionTag}`
- [x] Bump version to `3.3.47` in `package.json`
- [x] Update `CHANGELOG.md` and `public/CHANGELOG.md` with App Store style notes (strict $\le 10$ words)
- [x] Update `BDC_Central_Command/BDC_Ticket_Alert_Communicator.pyw` with dynamic portal version discovery
- [x] Update `tools/test_feedback_modal.cjs` to assert dynamic versioning in `openAdminNoteModal`
- [x] Run full automated test suite & build (`npm run build`)
- [ ] Commit and push to GitHub repository (`v3.3.47 : Dynamic version tag for Admin Resolution template buttons`)
- [ ] Mandatory task closure and process cleanup protocol









