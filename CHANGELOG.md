# CHANGELOG

## [2.5.30] - 2026-08-14
- Implemented full game server error code propagation from the Google Apps Script backend (`WosApi.js`) down to the frontend UI.
- Enhanced `window.translateWosApiError` to map official Century Games codes (e.g. `101031008` session expired, `101031005` daily rate limit, `101031002` invalid captcha, `101031001` player not found, `40001`/`40003` rate limits) with explicit `[Code XXXXX]` badges.
- Deployed backend Apps Script version `@155` to live environment.

## [2.5.29] - 2026-08-14
- Fixed JavaScript syntax error caused by unescaped character names in inline HTML `onclick` handlers for alt token verification.
- Added explicit error banners and real-time toast alerts for all token dispatch, token verification, and profile sync actions.
- Clarified button labeling between active character sync (`🔄 Sync Stats`) and unverified/expired token binding (`⚡ Setup 30d Sync`).

## [2.5.28] - 2026-08-14
- Removed redundant nested `<details>` accordion and dropdown arrow from the Account Hub Linked Alts tab.
- Created dedicated header bar with separated `[ ➕ Link Alt Account ]` and `[ 🔄 Sync All ]` buttons to prevent accidental clicks.
- Redesigned alt cards with 3 distinct, perfectly aligned vertical zones (Header, Stats strip, Bottom action bar).

## [2.5.27] - 2026-08-14
- Completely hidden active Main Character 30-day token card and healthy alts from the Alliance Notifications modal.
- Added clean "🎉 All Caught Up!" empty state when there are 0 pending alerts or expired tokens.

## [2.5.26] - 2026-08-14
- Replaced prominent warning box with a quiet green status bar for active 30-day tokens in Alliance Alerts modal.
- Adjusted notification bell trigger so active tokens and manually linked alts do not set off red alert alarms.

## [2.5.25] - 2026-08-14
- Streamlined Alliance Notifications modal with compact Main Character Token Status card.
- Implemented collapsible `🔗 Alt Accounts Un-Sync Status (X)` accordion banner with 1-click `[ ⚡ Setup / Renew ]` for un-synced alts.
- Implemented collapsible `🛡️ Staff Alerts: Recent Signups (X)` banner with counter badge and expandable member list to prevent scrollbar clutter.

## [2.5.24] - 2026-08-14
- Added live 30-day token countdown to the Chief ID card badge in Account Hub (`🛡️ 30-Day Sync Active (X days left) (#State)`).
- Added live 30-day token sync countdown pill to linked alt account cards.

## [2.5.23] - 2026-08-14
- Live Chief name indicator next to the version badge in the top navbar with interactive Account Hub shortcut.
- Clean sign-in experience: removed disruptive login pop-up banner.

## [2.5.22] - 2026-08-14
- Fixed Notification Bell so the Alliance Alerts modal renders instantly with 0ms delay.
- Fixed mobile navbar hiding the bell and added a dedicated `🔔 Alerts` link to the mobile drawer.

## [2.5.21] - 2026-08-14
- Implemented Universal Smartphone & Screen Size responsive optimizations with fluid `clamp()` spacing, notch safe areas (`viewport-fit=cover`), iOS input auto-zoom fixes, and fluid modal clamping.

## [2.5.20] - 2026-08-14
- Streamlined Notification Bell badge to detect unverified, expiring (≤5d), and expired 30-day tokens across main and alt accounts.
- Modernized Alliance Alerts modal by removing obsolete gift code card and keeping staff signup alerts.

## [2.5.19] - 2026-08-14
- Enabled the `👥 Users` tab in the Admin Menu for all Alliance Managers and R4 Officers.
- Allowed managers to access the Global Chief List filter, Staff Roles overview, and Registered/Unclaimed member rosters.

## [2.5.18] - 2026-08-14
- Upgraded Alert Toaster with Universal Fluid Sizing (92vw width scaling, 15px font, and glassmorphism) for smartphones.

## [2.5.17] - 2026-08-14
- Added live member count badges to all Token Status and Attribute filter options.
- Polished control bar layout alignment to prevent wrapping and eliminate empty spacing.

## [2.5.16] - 2026-08-14
- Streamlined Registered Users Database with consolidated Segmented Switcher and Attribute dropdowns.
- Added 30-day sync token tracking and countdown badges for main characters and linked alts.

## [2.5.15] - 2026-08-14
- Configured Alliance Gatekeeper Discord integration to maintain a single live-updating 7-day member roster card.

## [2.5.14] - 2026-08-14
- Restored individual notification cards for Alliance Gatekeeper Discord webhooks on new member signups.

## [2.5.13] - 2026-08-14
- Simplified and condensed full Changelog into clean, easy-to-read release highlights.

## [2.5.12] - 2026-08-14
- Cleaned up Alt Card action controls with a single unified `[Sync]` button.
- Streamlined action button row alignment across all screen sizes.

## [2.5.11] - 2026-08-14
- Added 30-day session token binding and 1-click sync for Linked Alt Accounts.
- Added "Sync All Characters" batch button in Account Hub.
- Added in-game mail verification flow when adding new alts.

## [2.5.10] - 2026-08-14
- Translated Century Games API responses and daily rate limit notices into clear English.

## [2.5.9] - 2026-08-14
- Cleaned up registration layout and improved manual verification fallback options.

## [2.5.8] - 2026-08-14
- Added in-game avatar syncing during signup and in the Profile Picture modal.
- Enabled avatar sync and management support for linked Alt accounts.

## [2.5.6] - 2026-08-14
- Updated token labels to "30-Day Sync Token" across all cards and modals.

## [2.5.5] - 2026-08-14
- Added navbar notification bell with proactive 30-day token expiration alerts.
- Integrated Gift Code Bot status and new member signup alerts.

## [2.5.4] - 2026-08-14
- Fixed Schedule column resolution and synced Home page event countdown.

## [2.5.3] - 2026-08-14
- Fixed Today's View and Calendar Schedule views with universal time parser.

## [2.5.2] - 2026-08-14
- Resolved Google auth button variable reference and added static scope audit.

## [2.5.1] - 2026-08-14
- Added theme-adaptive Google & Email sign-in cards (Midnight, Light, Ombre).

## [2.5.0] - 2026-08-14
- Unified authentication method selection for both Registration and Sign-In.

## [2.4.0] - 2026-08-14
- Streamlined Google Sign-Up into the 3-step onboarding wizard.

## [2.3.0] - 2026-08-14
- Launched 3-step Chief Registration & Verification Wizard with in-game character link.

## [2.2.0] - 2026-08-14
- Added multi-step registration flow with required playing start date.

## [2.1.0] - 2026-08-14
- Added real-time in-game character verification via Whiteout Survival game mailbox codes.
- Added live furnace level detection and avatar syncing.

## [2.0.0] - 2026-08-13
- Upgraded alliance core dashboard architecture with optimized performance.
- Modernized user interface, responsive layout, and theme styling.

## [1.99.0] - 2026-08-13
- Added Alliance Gatekeeper Discord integration for new member signups.
- Added single-updating Discord roster card with automatic edits.

## [1.98.0] - 2026-08-13
- Added Bear Trap event win tracking and automated spreadsheet sync.
- Enhanced profile stats and personal activity logging.

## [1.95.0] - 2026-08-12
- Added Gift Code Auto-Redeem Bot enrollment for main and alt accounts.
- Added gift code history and reward status tracking.

## [1.90.0] - 2026-08-11
- Enhanced member search with fuzzy matching and furnace level filters.
- Added R4/R5 admin management controls.

## [1.80.0] - 2026-08-10
- Added PWA install support with dual Android and iOS install guides.
- Added offline caching and auto-update prompts.

## [1.50.0] - 2026-08-08
- Added live leaderboard rankings, Bear Trap damage stats, and alliance donations.

## [1.0.0] - 2026-08-01
- Initial public release of the Whiteout Survival Alliance Dashboard.