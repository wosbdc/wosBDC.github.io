# Task: v3.1.7 Google Drive "Drop & Go" with Resilient Fallback

- [x] Create project backups (`backup_v3.1.7_gdrive_drop_and_go.zip` and `wos_backup_v3.1.7_pre_gdrive.zip`) <!-- id: 0 -->
- [x] Add `uploadFeedbackMediaToDrive` in Google Apps Script (`Sidebars_and_Tools.js`) <!-- id: 1 -->
- [x] Deploy Apps Script via `clasp push` and `clasp deploy`, sync `API_BASE_URL` in `main.js` <!-- id: 2 -->
- [x] Implement `parseGoogleDriveUrl` parser & Drive streaming iframe player in `openFeedbackMediaLightbox` <!-- id: 3 -->
- [x] Implement `uploadMediaToDriveBackend` with silent automatic base64 fallback on quota limit/error <!-- id: 4 -->
- [x] Upgrade ticket submit modal with Drop & Go progress bar, public Drive folder button, and manual paste backup <!-- id: 5 -->
- [x] Update ticket cards and admin table with `📁 Google Drive` badges <!-- id: 6 -->
- [x] Update versioning to v3.1.7 across all files with strict <= 10-word changelog notes <!-- id: 7 -->
- [x] Run full automated verification suite (`tools/test_feedback_gdrive.cjs` and `npm run build`) <!-- id: 8 -->









