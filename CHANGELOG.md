# CHANGELOG

## [2.5.58] - 2026-08-14
- Fixed Fire Crystal badge sizing inside the Registered Users Database and member tables.
- Removed redundant outer bordered wrapper spans that caused double/misaligned boxes around FC badges.
- Optimized inline badge proportions (`size = 32`) and added `flex-shrink: 0` for responsive alignment.
- Added automatic canvas badge initialization upon switching Admin tabs.

## [2.5.57] - 2026-08-14
- Fixed Account Hub failing to re-open on repeated clicks from the navbar user indicator (`#navbar-user-indicator`).
- Added safe null guarding for all dynamic Account Hub DOM event listeners (`cancelAltBtn`, `uploadInput`, `submitAltBtn`, `selectEl`).
- Added an explicit `← Back to Dashboard` exit button directly inside the Account Hub header.
- Synchronized `#navbar-user-indicator` to always open the default `Profile` tab on direct click.

## [2.5.56] - 2026-08-14
- Re-architected Fire Crystal badge renderer to a **Unified Single-Canvas Engine** where both the badge sprite and flame particle system render in the exact same 2D Canvas context.
- Fixed PWA Service Worker caching (`sw.js`) to ensure all badge image updates are fetched fresh from the network.
- Added high-DPI Retina display scaling via `devicePixelRatio` for sharp rendering on mobile and desktop screens.

## [2.5.55] - 2026-08-14
- Re-centered solid shield bodies for all 10 badge PNG files (`FC 1` through `FC 10`) to the exact pixel (136px to 887px, center 511.5px), fixing the 44px left offset caused by corner sparkle artifacts.
- Synchronized `FlameWisp` shield contour polygon to match the true solid shield perimeter (`(0, -0.433)`, `(±0.367, -0.226)`, `(±0.367, +0.226)`, `(0, +0.433)`).

## [2.5.54] - 2026-08-14
- Expanded flame canvas bounds to 1.85x badge size, preventing particle clipping on all 4 borders.
- Replaced approximate hexagon math with exact pixel-measured shield contour polygon coordinates (`(0, -0.441)`, `(±0.359, -0.231)`, `(±0.359, +0.223)`, `(0, +0.433)`).
- Embers now spawn flush against the shield facets and radiate outward with bilateral symmetry.

## [2.5.53] - 2026-08-14
- Redesigned Furnace / Fire Crystal display into a dedicated centered showcase in Chief Profile ID card.
- Updated `style.css` mobile styles to keep the Fire Crystal badge 100% centered horizontally on smartphones and tablets.

## [2.5.52] - 2026-08-14
- Re-centered all Fire Crystal badge PNG files (`FC 2` to `FC 10`) to the exact geometric center `(512, 511)` to eliminate the baked-in 43px horizontal offset.
- Implemented exact pointy-topped shield polygon geometry in `FlameWisp` so embers trace all 6 facets of the shield symmetrically.
- Added `line-height: 0` and `display: block` to eliminate browser font metric descent offset.

## [2.5.51] - 2026-08-14
- Added live Move Image X and Move Image Y offset sliders in `fc_flame_studio.html` to allow real-time shifting and alignment between the badge image and the flame canvas.

## [2.5.50] - 2026-08-14
- Applied updated user-tuned flame particle physics: 0.65 spawn rate, 36% hexagon perimeter radius, 1.5 outward spread velocity, 1.3 wave wiggle shimmer, 10px ember size, and 0.016 extended decay lifespan.

## [2.5.49] - 2026-08-14
- Enlarged Fire Crystal furnace badge from 76px to 120px in Account Hub profile ID card.
- Enlarged badge preview to 110px in the Edit Profile modal for clear, crisp inspection.

## [2.5.48] - 2026-08-14
- Applied updated fine-tuned flame settings across the entire platform: 0.8 spawn rate density, 35% hexagon perimeter radius, and 8px glowing ember particles.

## [2.5.47] - 2026-08-14
- Applied custom user-tuned flame particle physics into the live website: refined 5px ember radius, balanced 32% hexagonal perimeter radius, 2.2 buoyant upward speed, and 0.6 wave shimmer.

## [2.5.46] - 2026-08-14
- Implemented symmetrical hexagonal perimeter particle spawning so flames rise and radiate evenly across all 6 facets of the badge without one-sided drift.
- Scaled particle shimmer and wave amplitude mathematically to the canvas size for consistent rendering at 48px, 80px, and 180px.
- Released [`fc_flame_studio.html`](public/fc_flame_studio.html) with real-time sliders for live particle parameter tuning and instant JSON configuration export.

## [2.5.45] - 2026-08-14
- Restored original pristine Fire Crystal badge graphics directly from `fc_demo.html`.
- Restored the authentic 3D Solar Fire Wisps particle physics, sinusoidal wave motion, and haptic burst mechanics exactly as designed in `fc_demo.html`.

## [2.5.44] - 2026-08-14
- Upgraded the Fire Crystal interactive flame particle engine to generate continuous 360° omnidirectional radial plasma embers spanning all 6 facets of the shield evenly without vertical or horizontal bias.

## [2.5.43] - 2026-08-14
- Seamlessly realigned and centered the inner white digits (`1` through `10`) to exact geometric center `(512, 512)` within the metallic hexagon plates across all 10 Fire Crystal badge PNG files.
- Upgraded the Fire Crystal interactive particle engine to emanate a 360° balanced radiant ember aura symmetrically around the shield, eliminating particle drift and left-side clustering.

## [2.5.42] - 2026-08-14
- Removed off-center stray sparkle pixels in the transparent borders of Fire Crystal badge images `fc1.png` through `fc10.png`.
- Re-encoded and recalibrated all 10 Fire Crystal badge PNG graphics to exact `(512.0, 512.0)` geometric dead center.
- Aligned and centered the Furnace Level display inside the Account Hub profile ID card.

## [2.5.41] - 2026-08-14
- Added full translation dictionary for Century Games API error code `15030` and `"未登录"` ("30-Day session token expired. Please enter a fresh in-game code to renew.").
- Resolved duplicate `[Code X]` prefix stacking in alert toasts and added a universal Chinese character fallback translation.
- Enhanced profile and alt sync handlers to automatically open the 30-day token verification renewal prompt on code 15030 without throwing raw errors.
- Deployed Google Apps Script backend Version `@160`.

## [2.5.40] - 2026-08-14
- Unified the color scheme across the `⚙️ Options ▾` dropdown and profile modal components to a consistent Whiteout Survival Frost Blue (`#0ea5e9` / `#38bdf8`) and Crisp White (`#ffffff`) palette.
- Removed mismatched accent colors across modal option cards in favor of a cohesive theme.

## [2.5.39] - 2026-08-14
- Streamlined the `⚙️ Options ▾` dropdown menu down to exactly 2 unified buttons: `✏️ Edit Profile` (opens complete profile, avatar & tagline manager) and `🔄 Sync from Game` (live server sync with automated token renewal flow).

## [2.5.38] - 2026-08-14
- Verified live Century Games server payload structure: standard furnace levels (1–30) are returned directly inside `user.rank` as numeric integers (e.g. `"rank": 21`).
- Enhanced `WosApi.js` parser to map `typeof user.rank === 'number'` across both standard furnace levels (`1..30`) and Fire Crystal tiers (`31..80` $\rightarrow$ `FC 1..10`).
- Deployed Google Apps Script backend Version `@159` to live production.
- Successfully verified live token binding and real-time syncing for `Dragon Frost` (Lv 21) across Account Hub, Roster, Alts, and Chief's List.

## [2.5.37] - 2026-08-14
- Completely eradicated the legacy `if (!stoveLv) stoveLv = "30";` fallback in `WosApi.js` that was forcibly resetting non-FC furnace levels (e.g. 21, 28) back to 30 on sync.
- Added automated fallback lookup to the Century Games public player API (`wos-giftcode.centurygame.com/api/player`) if the VIP store payload lacks detailed furnace level information.
- Hardened client sync routines (`handleSyncCenturyGamesProfile`, `handleSyncAlt`, `handleSyncAllCharacters`) to preserve the player's current furnace level if the game server response is blank or unpopulated.
- Deployed Google Apps Script backend as Version `@158` and synchronized frontend `API_BASE_URL`.

## [2.5.36] - 2026-08-14
- Removed redundant bottom buttons below the Account Hub ID card to keep the profile card streamlined and clean.
- Integrated all actions exclusively into the sleek `⚙️ Options ▾` menu near the Chief Name.
- Added interactive loading states on the Options button during game profile syncing.

## [2.5.35] - 2026-08-14
- Fixed non-FC furnace level overwrite in `WosApi.js` where players with normal furnace levels (e.g. 21, 28) were overwritten to 30 upon clicking "Sync from Game".
- Upgraded Fire Crystal (FC 1–10) multi-stage ladder parsing across backend and frontend helpers.
- Added interactive `⚙️ Options ▾` dropdown menu in the Account Hub ID Card header directly next to the Chief Name for instant access to Edit Profile, Sync from Game, Token Renewal, and Avatar management.
- Synchronized `stove_lv` and `furnaceLevel` concurrently across Firebase user records, alts, and live roster caches.
- Deployed backend Apps Script `@157` to live environment.

## [2.5.34] - 2026-08-14
- Unified button styling and interactive visual effects (FX) across all Sign In, Claim / Register, and action buttons.
- Added smooth scale transitions (`scale(1.03)` on hover, `scale(0.98)` on active press), gradient glows, and glassmorphism borders for all secondary and mode toggle buttons.

## [2.5.33] - 2026-08-14
- Converted the Sign In and 3-Step Chief Registration wizard from a floating modal popup into a first-class, full-page view (`views.auth`).
- Routed all navbar, sidebar, and member guard actions directly to the full-page experience, eliminating all backdrop clipping and accidental closure.
- Preserved full 1-click Google authentication, interactive calendar start-date picker, and Whiteout Survival mailbox verification code workflow.

## [2.5.32] - 2026-08-14
- Enlarged and enhanced the Sign In & Multi-Step Registration modal dimensions with fluid responsive padding and max-width.
- Prevented accidental dismissal of the signup modal on side backdrop clicks so in-progress registrations are never lost.

## [2.5.31] - 2026-08-14
- Implemented persistent tab state management for Account Hub (`views.account(defaultTab)`).
- Bound all Alt operations (30-day token binding, code verification, manual linking, profile editing, syncing, and perks enrollment) to retain the **🔗 Linked Alts** tab automatically without jumping back to the Main Profile tab.

## [2.5.30] - 2026-08-14
- added support for error codes

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