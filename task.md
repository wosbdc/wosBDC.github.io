# Task: v3.3.88 Live Countdown Timer for Verification Rate Limits

## 🎯 Active Tasks
- [x] Verify project backup & strict 2-backup retention (`pre_v3.3.87` & `pre_v3.3.88`)
- [x] Implement `window.isWosRateLimitError` and refine `window.startVerificationCooldownTimer` in `main.js`
- [x] Connect `startVerificationCooldownTimer` to `openAltVerifyModal` (`sendBtn` and `submitCodeBtn`)
- [x] Connect `startVerificationCooldownTimer` to Account Settings & Auth verification flows (`renderVerificationBox`, `renderInGameCodeBox`, and Alt Auto Link)
- [x] Create automated headless verification script (`tools/test_cooldown_countdown.cjs`)
- [x] Run automated tests & verify 100% pass across all layers
- [x] Bump version to `3.3.88` in `package.json`, `version.json`, and `public/version.json`
- [x] Update `CHANGELOG.md` and `public/CHANGELOG.md` with App Store style notes (strict $\le 10$ words)
- [x] Commit and push to GitHub (`v3.3.88 : Added live countdown timer for in-game verification rate limits`)
- [x] Mandatory task closure and process cleanup protocol
