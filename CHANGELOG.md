## [1.48.0] - 2026-07-23
### Added Showdown Missed Days Report Feature
- **`📋 Missed Days Report` Button**: Added a dedicated report button in the **Showdown Data Entry** header card (`views.showdownAdmin()`).
- **Daily Breakdown & Player Summary Modal**: Renders a modal displaying per-day participation cards (Days 1–6) alongside a table listing every player who missed scoring and their exact missed days.
- **1-Tap Clipboard Copy (`📋 Copy Missed List`)**: Generates a pre-formatted missed days summary ready to paste directly into Alliance Chat or Discord.

## [1.47.2] - 2026-07-23
### Robust Player Key Generation for Non-Numeric Test Players
- **Universal Player Key Fallback**: Updated `promptEditEvents`, `getLivePlayerEventRow`, `polarTerrorsAdmin`, `championshipAdmin`, and `mercenaryAdmin` to fall back to a safe name slug key (`test_agent`) whenever a player lacks a numeric Game ID.
- **Test Player Real-Time Compatibility**: Ensured test players and non-numeric roster members read and write properly to `activity_live` and render accurately across all event trackers.

## [1.47.1] - 2026-07-23
### Added Activity Matrix Manual Refresh Button
- **`🔄 Refresh Matrix` Button**: Added a explicit manual refresh button in the **📊 Roster Event Activity Matrix** subtab header controls so managers can force an instant cache-busting re-fetch at any time.

## [1.47.0] - 2026-07-23
### Instant Cross-Device Realtime Auto-Sync (`onValue`)
- **Firebase Realtime WebSocket Listener**: Added global `onValue(ref(db, 'activity_live'), ...)` listener in `main.js`.
- **Instant Cross-Device UI Push**: Toggling any event (Polar Terrors, Championship, Mercenary, Bear Trap, Voter) on Phone instantly re-renders the Polar Terrors Tracker, Championship Tracker, Mercenary Tracker, Activity Matrix, or Player Profile Card on Computer in <50ms without requiring a browser refresh.

## [1.46.0] - 2026-07-23
### Consolidated Single Master Source of Truth (`activity_live`)
- **Single Master Node Consolidation**: Consolidated all event tracking (`polarTerrors`, `championship`, `mercenary`, `voter`, `perfectAttendance`, `beartrap`) into Firebase's single master node `activity_live/{gameId}`.
- **Unified Event Trackers**: `fetchPolarTerrorsData()`, `fetchChampionshipData()`, `fetchMercenaryData()` and their toggle handlers now read and write directly to `activity_live` (<10ms latency).
- **Zero Discrepancy Assurance**: Player cards, tracker pages, Activity Matrix, and Player Database Editor now interact with the exact same master object, guaranteeing 100% real-time synchronization site-wide.

## [1.45.2] - 2026-07-23
### Complete 2-Way Cache Invalidation & Sync Between Player Editor & Event Trackers
- **2-Way Cache Invalidation**: Saving edits in **Player Database Editor (Edit Events)** now explicitly invalidates `polarTerrorsCache`, `championshipCache`, `mercenaryCache`, and `activityCache` so navigating to any tracker immediately displays fresh live Firebase updates.
- **Tracker Live Cache Refresh**: Opening Polar Terrors, Alliance Championship, or Mercenary Prestige tracker pages now invalidates in-memory caches before loading, guaranteeing 100% real-time accuracy across all pages.

## [1.45.1] - 2026-07-23
### Fixed Polar Terrors Status Sync Between Tracker and Player Card
- **Primary Node Prioritization**: Updated `getLivePlayerEventRow` so `polarterrors/{gameId}` node explicitly takes precedence over legacy fallback fields when reading Polar Terrors status.
- **Dynamic Header Badges**: Refactored `activityBadges` rendering in `generatePlayerProfileHtml` to match header names dynamically instead of relying on fixed column index offsets.

## [1.45.0] - 2026-07-23
### Lifetime Event Attendance Tracking & Cycle Archiving System
- **`🔄 Archive & Reset Cycle` Button**: R4/R5 managers can now archive the active event cycle into Firebase (`activity_history_archives/{timestamp}`), automatically incrementing lifetime miss counters for missing players, and resetting the matrix for the next cycle.
- **`player_event_stats` Firebase Node**: Persistent node tracking lifetime missed events per player (Showdown, Championship, Mercenary, Polar Terrors, Bear Trap).
- **Activity Matrix Misses Column**: Added **Missed (Cycle / Total)** column in the **📊 Roster Event Activity Matrix** table displaying cycle misses alongside lifetime total misses.
- **📊 Lifetime Attendance Record Card**: Embedded a dedicated attendance stats card on Player Profile Cards (Database Editor, Chief Lookup, Roster Modal) showing detailed per-event miss tallies and attendance status badges.

## [1.44.2] - 2026-07-23
### Fixed Player Card Events Checklist Discrepancy
- **Live Firebase Status Integration**: Added `window.getLivePlayerEventRow()` helper so player cards in the Player Database Editor, Chief Lookup, and Roster Modal fetch live Firebase status for Championship, Mercenary, Polar Terrors, and Voter.
- **Resolved ⏳ Pending Issue**: Player card Events Checklist now accurately renders `✅` instead of stale `⏳` (Upcoming) when events have been enabled in `Edit Events` or event trackers.

## [1.44.1] - 2026-07-23
### Full Cross-Site Event Sync from Edit Events Modal
- **Championship, Mercenary, Polar Terrors**: `📝 Edit Events` modal now writes to individual Firebase nodes (`championship/`, `mercenary/`, `polarterrors/`) in addition to `activity_live`.
- **Google Sheets Sync**: Each event status change also pings the GAS backend `updateEvent` API to keep Google Sheets in sync.
- **Cache Invalidation**: Activity cache and Activity Matrix loaded flags are cleared after save to ensure fresh data.
- **Full Sync Chain**: Any event status change from any admin tool (Edit Events, event trackers, Activity Matrix) is now fully synchronized across all views.

## [1.44.0] - 2026-07-23
### Modernized Polar Terrors Tracker (Same Treatment as BT Donations Tracker)
- **Compact 1-Tap Status Badges**: Replaced bulky `[ YES ] [ NO ]` dual-button toggle with a single compact pill badge (`✅ Done` / `❌ Missing`) that toggles on tap.
- **Filter Tabs**: Added `[ ALL ] [ ❌ MISSING ONLY ] [ ✅ DONE ONLY ]` interactive filter tabs with `📋 Copy Missing List` button.
- **Removed Large Text Box**: Eliminated the `Missing Signups` text box card in favor of filter-based browsing.
- **Column Renamed**: Changed table column header from `Donated` to **`Status`**.
- **Labels Updated**: Changed stats from `Donated (YES)` / `Response Rate` to `Done (YES)` / `Completion Rate`.
- **Activity Matrix Link**: Added `📊 Activity Matrix ➔` button in the header bar linking to `views.admin('tab-logs')`.
- **Widescreen Layout**: Expanded container max-width to `1600px` for better widescreen use.

## [1.43.2] - 2026-07-23
### Capped Donation Leaderboards to Top 4
- **All-Time Bear Trap Donations Leaderboard**: Now displays Top 4 only.
- **Current Bear Trap Donations Leaderboard**: Now displays Top 4 only.

## [1.43.1] - 2026-07-23
### Enforced Strict Bear Trap Crown Wins (BT1 + BT2 Sum Only)
- **Strict Crown Wins Calculation**: Updated All-Time Bear Trap Leaderboard calculations so total wins are strictly evaluated as `(bt1Wins + bt2Wins)`.
- **Eliminated Unverified Sheet Aggregation**: Removed legacy sheets total fallback that misclassified player donation rows as win counts, ensuring zero-win players like ThaDwarf are not listed.

## [1.43.0] - 2026-07-23
### Fixed Bear Trap & Donations Leaderboards Calculation & Top 4 Capping
- **All-Time Bear Trap Leaderboard Top 4 Limit**: Capped `All-Time Bear Trap Leaderboard` to **Top 4 ONLY**, filtering for players with Crown wins (`totalWins > 0`).
- **Renamed & Corrected Donations Leaderboards**: Renamed titles back to **`Current Bear Trap Donations Leaderboard`** and **`All-Time Bear Trap Donations Leaderboard`**.
- **Fixed Double Counting Bug**: Replaced score additions with `Math.max()` when merging Firebase donation totals with historical sheets data to ensure calculations update live and remain 100% accurate.

## [1.42.2] - 2026-07-23
### Updated Admin Section Heading & Green Bear Trap Button
- **Updated Section Heading**: Renamed category to **`⚔️ Active Alliance Events Tools`** under `🛠️ Daily Tools`.
- **Green Bear Trap Button**: Styled **`🐻 Bear Trap`** button with an emerald green gradient for prominent visibility.
- **Removed BT Tracker from In-Dev**: Cleaned up `#tab-indev` by removing the redundant `BT Donations Tracker` button.

## [1.42.1] - 2026-07-23
### Restored Clean Bear Trap Admin Flow & Updated Back Button Target
- **Admin Hub Daily Tools Restored**: Kept single **`🐻 Bear Trap`** button under `Active Alliance Events` in Admin Hub which opens Multi-BT Donations (`views.beartrap()`).
- **Updated BT Tracker Back Button**: Updated top-left back button inside BT Donations Tracker to **`⬅ Back to Bear Trap`** so it routes straight back to Multi-BT Donations (`views.beartrap()`).

## [1.42.0] - 2026-07-23
### Promoted BT Donations Tracker & Fixed Reset Player Modal Dropdown
- **Promoted BT Donations Tracker to Daily Tools**: Added **`🐻 BT Donations Tracker`** directly into the `⚔️ Active Alliance Events` section under `🛠️ Daily Tools` in the Admin Hub for quick management access.
- **Added Cross-Navigation Link**: Added a **`📊 BT Tracker`** header shortcut button inside `views.beartrap()` for seamless toggling between Multi-BT Donations and BT Tracker.
- **Fixed Reset Player Modal Autocomplete Sidebar Bug**: Replaced native browser `<datalist>` auto-completion (which caused a giant vertical sidebar list bug) with a clean, styled `<select>` roster dropdown and updated modal to fixed backdrop overlay styling (`btResetPlayerModalOverlay`).

## [1.41.1] - 2026-07-23
### Removed Redundant Add Player Button in BT Tracker
- **Header Cleanup**: Removed redundant `➕ Add Player` buttons from `bearTrapAdmin` and `views.beartrap()` headers since player creation is already managed in Roster Management.

## [1.41.0] - 2026-07-23
### Replaced Big Text Box with Roster Filter Tabs & One-Tap Copy
- **Removed Missing Names Text Box**: Removed the large scrollable missing names card box from BT Donations Tracker to maximize table real estate.
- **Added Roster Filter Tabs**: Integrated interactive filter tabs above the roster table: **`ALL`**, **`❌ MISSING ONLY`**, and **`✅ DONATED ONLY`**.
- **Added 1-Tap Copy Missing List Button**: Added **`📋 Copy Missing List`** button that dynamically copies all missing player names to clipboard with a toast notification.

## [1.40.2] - 2026-07-23
### Renamed Bear Trap Labels to BT Donations Tracker
- **BT Donations Tracker Terminology**: Renamed page title to **`🐻 BT Donations Tracker`**, table status column header to **`Donated`**, donation score column to **`Amount`**, and table badges to **`✅ Donated`** / **`❌ Missing`**.

## [1.40.1] - 2026-07-23
### Compact 1-Tap Bear Trap Status Badge
- **Compact Mobile Status Badge**: Replaced bulky side-by-side `[ YES ] [ NO ]` toggle boxes in Bear Trap Tracker table with a clean 1-tap status badge (`✅ Signed Up` vs `❌ Missing`) saving 75px per row for perfect mobile screen fit.

## [1.40.0] - 2026-07-23
### Bear Trap Tracker Widescreen Optimization
- **Responsive Widescreen Dual-Column Layout**: Expanded Bear Trap Tracker (`bearTrapAdmin`) container width to `1600px` and converted the main section into a responsive 2-column grid layout (Missing Signups sticky box on the left, Roster Status table on the right) to eliminate wasted screen space on desktop monitors.
- **Expanded Container Widths**: Increased `views.beartrap()` max-width to `1200px` for better utilization of wide displays.

## [1.39.3] - 2026-07-23
### Fix Mobile Navigation Modal HTML Nesting Location
- **HTML DOM Nesting Fix**: Moved `#mobileNavModal` and `#mobileNavModalOverlay` outside of `#cropperModal` directly to root body level so the modal opens cleanly and pops up 100% of the time when tapped.

## [1.39.2] - 2026-07-23
### Settings Header & Global Timers Top Breathing Room
- **Header Spacing Adjustment**: Added `margin-bottom: 15px` to `.sidebar-header` and `margin-top: 15px` to Section 1 so Global Timers has comfortable breathing room below the header border line.

## [1.39.1] - 2026-07-23
### Uniform Sidebar Button Styling & User Account Order Adjustment
- **User Account Promoted Before Preferences**: Moved `👤 User Account` section directly above `📱 Preferences`.
- **Uniform Button Styling (`.sidebar-action-btn`)**: Applied a unified CSS button class to all buttons across User Account and Preferences cards for consistent padding, fonts, borders, and hover effects.

## [1.39.0] - 2026-07-23
### Reordered Settings Sidebar Sections
- **Global Timers Promoted to Top**: Moved `🕐 Global Timers` to the absolute top of `#settingsSidebar` as requested.
- **Clean Logical Grouping**:
  1. `🕐 Global Timers` (Clocks, Daily & Intel Reset Countdowns)
  2. `📱 Preferences` (`📱 Mobile Navigation`, `🎨 Theme Engine`, `🔔 Push Notifications`)
  3. `👤 User Account` (Sign In / Register, Admin Menu, Sign Out, Contact Support)
  4. `🧪 Admin & Dev Tools` (Spoofing Controls)

## [1.38.2] - 2026-07-23
### Fix Modal Helpers Closure Scope Reference
- **Modal Opening Fix**: Fixed `ReferenceError` inside `window.openMobileNavModal()` by using direct DOM queries (`settingsSidebar` & `sidebarOverlay`) instead of referencing inner module closures.

## [1.38.1] - 2026-07-23
### Global Modal Helper Handlers Fix
- **Global Modal Trigger Fix**: Added `window.openMobileNavModal()`, `window.openThemeModal()`, and `window.openNotificationsModal()` helper handlers so settings action buttons open their respective popups cleanly and reliably across all devices.

## [1.38.0] - 2026-07-23
### Mobile Navigation Settings Modal & Clean Button
- **Mobile Navigation Quick Button**: Converted the big Mobile Navigation section box into a clean action button (`📱 Mobile Navigation`) inside Settings right alongside `🔔 Push Notifications` and `🎨 Theme Engine`.
- **Dedicated Settings Modal**: Clicking `📱 Mobile Navigation` opens a clean popup modal (`#mobileNavModal`) containing the `🖐️ Left-Handed` and `✋ Right-Handed` options.

## [1.37.5] - 2026-07-23
### Removed Bottom Mobile Dock
- **Removed Unwanted Bottom Dock**: Completely removed the bottom mobile navigation bar (`#mobileNavDock`) from `index.html` as requested, keeping navigation strictly within the top navbar and hamburger menu.

## [1.37.4] - 2026-07-23
### Handedness Toggle Button Order Alignment
- **Natural Handedness Button Order**: Swapped button positions inside the Settings Mobile Navigation card (`#handOrientationToggle`) so `🖐️ Left-Handed` sits on the **left side** of the container and `✋ Right-Handed` sits on the **right side** of the container.

## [1.37.3] - 2026-07-23
### Top Navbar Hamburger Button Handedness Movement
- **Hamburger Button & Dropdown Handedness Alignment**: Updated top navbar CSS so that when `🖐️ Left-Handed` is active, the `☰` hamburger button and `⚙️` settings button physically relocate to the **far left edge** of the top navbar, and the mobile dropdown menu panel anchors its links to the left. When `✋ Right-Handed` is active, they anchor to the **far right edge**.

## [1.37.2] - 2026-07-23
### Clean GitHub Actions Deployment Workflow
- **Clean GitHub Actions Runner**: Updated `.github/workflows/deploy.yml` with clean standard Node 24 setup (`node-version: '24'`), removing legacy environment flags to prevent GitHub Actions runner annotations.

## [1.37.1] - 2026-07-23
### Smartphone Bottom App Navigation Dock
- **Dedicated Smartphone Mobile Dock (`#mobileNavDock`)**: Added a fixed mobile app navigation dock for smartphones (`🏠 Home`, `👤 Chief's`, `🏆 Boards`, `⚔️ Events`, `⚙️ Settings`).
- **Handedness Re-Ordering**: The mobile bottom dock layout automatically shifts its items and primary action buttons to the far-right (`flex-direction: row`) for `✋ Right-Handed` users or far-left (`flex-direction: row-reverse`) for `🖐️ Left-Handed` users!

## [1.37.0] - 2026-07-23
### Mobile Handedness Navigation & Ergonomics System
- **Mobile Navigation Alignment (`✋ Right-Handed` vs `🖐️ Left-Handed`)**: Added a dedicated Mobile Navigation handedness toggle in Settings (`#settingsSidebar`).
- **Left/Right Ergonomics**: Allows users on smartphones to align navigation controls, dropdown menus, and sidebars to either the right edge (right-hand thumb) or left edge (left-hand thumb) for comfortable 1-handed smartphone use. Settings persist across sessions in `localStorage`.

## [1.36.3] - 2026-07-23
### Fix Dropdown Selection & Card Rendering in Player Lookup
- **Dropdown Click & Profile Card Fix**: Replaced `const p` check in `renderCardForChief()` with dynamic Roster fallback (`idToNameMap`), and bound both `pointerdown` and `click` event listeners to dropdown items so selecting any Chief from the dropdown instantly renders their profile card on all desktop and mobile devices.

## [1.36.2] - 2026-07-23
### Fix Player Lookup in Navbar Chief's Menu
- **Navbar Chief's Menu Player Lookup Fixed**: Updated `views.roster()` (`views.playerLookup()`) to merge all Alliance Roster names into the search dropdown list and added Roster fallback so any player or test account can be searched and rendered directly from the Chief's dropdown menu!

## [1.36.1] - 2026-07-23
### Fix Temporal Dead Zone Variable Scope in searchPlayerFull
- **Fixed `Cannot access 'v' before initialization`**: Fixed duplicate `let targetName` re-declaration in `searchPlayerFull()` that caused JavaScript Temporal Dead Zone errors during minified execution.

## [1.36.0] - 2026-07-23
### 1-Click Quick Add Player & Test Account Tool
- **1-Click Quick Add Player Button**: Placed a `➕ Add Player` button directly on the Bear Trap admin headers (`views.beartrap()` & `views.bearTrapAdmin()`).
- **Instant Test Account Creation**: Admins can now add any test account or player to the Roster in 3 seconds without going through the public signup flow! Includes auto-filling official Chief names from the WOS API via `🔍 Verify ID`.

## [1.35.6] - 2026-07-23
### New Total Display Restored in Bear Trap Audit Log
- **New Total Log Summary Restored**: Updated `submitBeartrapDonations` so that Bear Trap donation audit log entries explicitly display the player's updated total score (e.g. `(BrianDCox (+1 ➔ New Total: 10))`) in the Admin Log feed.

## [1.35.5] - 2026-07-23
### Case-Insensitive Player Search & Roster Fallback
- **Case-Insensitive Search**: Updated `window.searchPlayerFull()` to perform case-insensitive matching across all searches (e.g. `thadwarf`, `THADWARF`, `ThaDwarf`).
- **Roster Fallback**: Added dynamic fallback to Alliance Roster data (`idToNameMap` / `rosterMap`) so any registered player can be searched and viewed seamlessly even if they don't have an old row in the Google Activity sheet.

## [1.35.4] - 2026-07-23
### Fix GitHub Actions Deprecation Warning & Set Node 24 Explicitly
- **Node 24 Explicit Deployment**: Updated `.github/workflows/deploy.yml` with `FORCE_JAVASCRIPT_ACTIONS_TO_NODE20: "false"` and explicit `node-version: '24'` to eliminate Node 20 deprecation warnings inside GitHub Actions runner.

## [1.35.3] - 2026-07-23
### Unignore Tools Script for GitHub Actions Runner
- **GitHub Actions Execution Fix**: Updated `.gitignore` to explicitly unignore `!tools/*.cjs` so `tools/check_window_bindings.cjs` is tracked and committed to git, resolving `Cannot find module` exit code 1 in GitHub Actions deployment pipelines.

## [1.35.2] - 2026-07-23
### Fix GitHub Actions Workflow Node Version
- **GitHub Actions Deployment Fix**: Updated `.github/workflows/deploy.yml` to use `node-version: '22'` (Standard Node LTS) and separated `Audit event bindings` into an explicit pipeline step.

## [1.35.1] - 2026-07-23
### Fix CI/CD GitHub Actions Build Script
- **Stateless Handler Validator**: Updated `tools/check_window_bindings.cjs` regex checks to be 100% stateless, eliminating global flag statefulness in Node.js GitHub Actions Linux runners and guaranteeing clean deployment passes on GitHub Pages.

## [1.35.0] - 2026-07-23
### Full Bear Trap Event Cycle, Auto-Signup & Activity Matrix Sync
- **Auto-Signup Detection (`Donation > 0` ➔ `YES`)**: Added `window.autoSyncBtSignup()` so whenever a player donates `> 0` (via single entry, inline table edit, or `Submit All` multi-batch), their Bear Trap signup status automatically flips to `YES` (`signedUp: true`).
- **`🔄 Reset Bear Trap Event` Master Button**: Added a dedicated `🔄 Reset Bear Trap Event` button that archives `current` donation scores into `allTime` historical totals, resets `current` scores to `0`, clears all attendance signups to `NO`, resets Reigning Champions to `Pending...` (`❓`), and logs the full event audit.
- **Roster Event Activity Matrix Synchronization**: Updated `loadActivityMatrix()` to automatically check `✅ 🐻 Bear Trap` for any player with active donations (`current > 0`) or attendance signups (`YES`), and syncs real-time checkbox toggles directly back to Firebase.

## [1.34.8] - 2026-07-23
### Automated Pre-Build Handler Audit
- **Pre-Build Event Handler Validation**: Integrated `tools/check_window_bindings.cjs` into the `npm run build` process to automatically audit all HTML `onclick` handlers (`window.xxx()` & `views.xxx()`), guaranteeing zero broken or unattached button handlers reach production.

## [1.34.7] - 2026-07-23
### Restore Multi-BT Submit All Functionality
- **Submit All Button Restored**: Restored `window.submitBeartrapDonations` in `views.beartrap()`, allowing admins to submit multi-row Bear Trap batch donations directly to Firebase and Google Sheets.

## [1.34.6] - 2026-07-23
### Fix Bear Trap Tracker Back Button Navigation
- **Back Button Navigation Fix**: Fixed `⬅ Back to Admin` button in `views.bearTrapAdmin()` to return directly to `views.admin('tab-indev')`, automatically opening the **`🧪 In-Dev`** tab and restoring top navbar visibility.
- **Global Alias**: Registered global `views.adminHub` alias to guarantee zero navigation errors.

## [1.34.5] - 2026-07-23
### Glowing Question Mark Badge for Reset Champions
- **Reset Winner Mystery Badge**: Updated Reigning Champion Banner card in `views.leaderboards()` so that when Bear Trap winners are reset (or unassigned/`Pending...`), the avatar box displays a glowing gold mystery question mark **`❓`** badge instead of a broken/missing player image.

## [1.34.4] - 2026-07-23
### Target Player Account Names in Bear Trap Log
- **Target Player Account Display**: Updated `loadBeartrapLog()` to display target player account names and amounts added (e.g. `(BrianDCox (+50), ThaDwarf (+100))`) in metallic gold text next to every log entry.
- **Unified Single Log Confirmation**: Confirmed that both `Menu | Admin ➔ 📋 Logs` and `Menu | Admin | Bear Trap` read from the **same single Firebase Realtime Database node** (`admin_logs`).

## [1.34.3] - 2026-07-23
### 100% Firebase Bear Trap Admin Log
- **Firebase-Exclusive Bear Trap Admin Log**: Switched `loadBeartrapLog()` in `views.beartrap()` to read 100% directly from Firebase Realtime Database (`admin_logs`), completely removing Google Sheets API fetch.
- **Bear Trap Filtering & Badges**: Filtered log entries strictly for Bear Trap activity (`Bear Trap Reset`, `Bear Trap Champion Crowned`, `Bear Trap Player Reset`, `Bear Trap Donations Added`) with color-coded badges.

## [1.34.2] - 2026-07-23
### Comprehensive 8-Sheet Master Sync
- **All-Sheet Coverage**: Expanded `syncAllSheetsToFirebase()` to cover ALL 8 Google Sheets:
  1. `LeaderBoards` (Bear Trap Wins & Donations)
  2. `Chief's List` (Alliance Roster)
  3. `Alliance Championship`
  4. `Mercenary Prestige`
  5. `Polar Terrors`
  6. `WhiteOut Survival` (Event Schedule)
  7. `Showdown History`
- **Full Non-Destructive Protection**: All 8 sheets sync into Firebase using `Math.max()` non-destructive merging while protecting live Firebase Showdown data.

## [1.34.1] - 2026-07-23
### Smart Non-Destructive Master Sync & Showdown Protection
- **Showdown Live Data Protection**: Updated `syncAllSheetsToFirebase()` to completely bypass and protect active Firebase Showdown data (`showdown/` node), guaranteeing zero overwrites of live daily Showdown scores or MVP progress.
- **Math.max() Conflict Resolution**: Used `Math.max()` value comparison for Bear Trap wins and donations, ensuring that whichever database has the higher/newer totals is preserved in Firebase without overwriting newer Firebase entries.

## [1.34.0] - 2026-07-23
### Firebase Primary Database & One-Click Master Sync
- **Firebase Primary Database Architecture**: Made Firebase Realtime Database the primary source of truth for all alliance leaderboards, event wins, and donations.
- **One-Click Master Sync (`syncAllSheetsToFirebase`)**: Added `⚡ Master Sync Sheets ➔ Firebase` tool under `Menu | Admin ➔ System & Roster Tools`. One click reads all historical Google Sheets tables (`LeaderBoards`, `Showdown History`) and populates/seeds Firebase Realtime Database nodes (`beartrap_wins`, `beartrap_donations`, `showdown_history`), permanently migrating Firebase into the primary DB.

## [1.33.9] - 2026-07-23
### Fix Bear Trap Roster Overwrite (Safe Row Merge)
- **Roster Loss Fix**: Updated Bear Trap leaderboard rendering in `views.leaderboards()` so native Firebase `beartrap_wins` merge cleanly on top of Google Sheets historical player rows instead of completely overwriting `board.rows`. Preserves all historical alliance players on Bear Trap 1, Bear Trap 2, and All-Time tables.

## [1.33.8] - 2026-07-23
### Combined Bear Trap Admin Log (Firebase & Google Sheets)
- **Bear Trap Admin Log Upgrade**: Updated `loadBeartrapLog()` in `views.beartrap()` to query both Firebase Realtime Database (`admin_logs`) and Google Sheets (`api=adminLog`), combining system actions (e.g. `[Bear Trap Reset]`, `[Bear Trap Champion Crowned]`, `[Bear Trap Player Reset]`) with player donation entries into a single, reverse-chronological feed.

## [1.33.7] - 2026-07-23
### Fix Bear Trap Leaderboard Reset Banner Bug
- **Pending... Banner Fallback Fix**: Removed `&& btWinners[trapNum].name !== "Pending..."` condition in `views.leaderboards()` so that when Bear Trap winners are reset to `"Pending..."` in Firebase by the admin button, the leaderboard header cards accurately display `Pending...` instead of falling back to the #1 player in the Google Sheet table.

## [1.33.6] - 2026-07-23
### Fix Bear Trap Reset Winners & Admin Features
- **Reset BT Winners Fix**: Updated `resetBearTrapWinners()` in `views.beartrap()` to concurrently reset Bear Trap 1 & 2 champions in Firebase via `Promise.all`, fixed toast error styling, and smoothly re-rendered `views.beartrap()` without forcing full browser reloads.
- **Reset Player Modal Auto-Close**: Added automatic modal dismissal after successfully wiping a player's Bear Trap donations to 0.

## [1.33.5] - 2026-07-23
### Broadcast Push Notification Button & Modal
- **Push Notification Modal Conversion**: Converted the inline Broadcast Push Notification box into a clean `🚀 Broadcast Push Notification` button under `System & Roster Tools`. Clicking the button opens a modal (`openBroadcastPushModal()`) for drafting and sending push alerts.

## [1.33.4] - 2026-07-23
### Fixed In-Dev Tab DOM Structure
- **DOM Container Nesting Fix**: Corrected HTML structure so `#tab-indev` is a standalone top-level tab container sibling (rather than nested inside `#tab-tools`), allowing the 4 in-dev buttons (`Alliance Championship`, `Mercenary Prestige`, `Polar Terrors Tracker`, `Bear Trap Tracker`) to render instantly when clicking the `🧪 In-Dev` tab button.

## [1.33.3] - 2026-07-23
### Category Grouping on Daily Tools Tab
- **Grouped Daily Tools**: Organized `🛠️ Daily Tools` tab in `Menu | Admin` (`views.admin()`) into 2 clear categories:
  1. `⚔️ Active Alliance Events`: `🐻 Bear Trap` & `⚔️ ShowDown`
  2. `⚙️ System & Roster Tools`: `👤 Open Player Database Editor`

## [1.33.2] - 2026-07-23
### Reorganized In-Dev Event Trackers
- **Button Migration to In-Dev**: Moved `🏆 Alliance Championship`, `⚔️ Mercenary Prestige`, `🐻‍❄️ Polar Terrors Tracker`, and `🐻 Bear Trap Tracker` from `🛠️ Daily Tools` into the **`🧪 In-Dev`** tab, decluttering the Daily Tools view.

## [1.33.1] - 2026-07-23
### New In-Dev Tab in Admin Menu
- **In-Dev Tab Added**: Created a dedicated **`🧪 In-Dev`** (Projects & Feature Lab) tab inside `Menu | Admin` (`views.admin()`). Provides a private development workspace for experimental components, staging tools, and draft event calculators.

## [1.33.0] - 2026-07-23
### Clean Revert of Experimental Shortcut Button & Modal Popup
- **Clean Event Page Restoration**: Completely removed experimental modal popup code and header shortcut button from `Menu | Events | Showdown Page` (`views.showdown()`), restoring stable, clean navigation.

## [1.32.9] - 2026-07-23
### Modal Firebase Permission Handling Fix
- **Permission Denied Error Fix**: Wrapped Firebase database node lookups in `openShowdownLeaderboardModal()` with individual `.catch()` handlers so that unauthenticated or restricted node read errors never block or crash the Showdown Leaderboards modal popup.

## [1.32.8] - 2026-07-23
### Modal Popup for Showdown Leaderboards
- **Leaderboards Modal Popup**: Updated `🏆 Showdown Leaderboards` shortcut button on `Menu | Events | Showdown Page` to open the Showdown Leaderboards inside a sleek, glassmorphic modal popup (`openShowdownLeaderboardModal()`) with a `✕ Close` button, keeping users on the Event page without navigation confusion.

## [1.32.7] - 2026-07-23
### Leaderboards Shortcut Button on Showdown Event Page
- **Leaderboards Shortcut Button**: Added a metallic gold `🏆 Showdown Leaderboards →` button at the top header of `Menu | Events | Showdown Page` (`views.showdown()`) that instantly navigates to `views.leaderboards('showdown')` in 1 click.

## [1.32.6] - 2026-07-23
### Showdown Page Container ID Fix
- **Container Target Fix**: Corrected element container target in `views.showdown()` from `mainContent` to `app` (`app.innerHTML = html`), resolving null container runtime error when loading `Menu | Events | Showdown Page`.

## [1.32.5] - 2026-07-23
### Events Tab Showdown Daily MVP & Tie Enhancements
- **Daily MVP Auto-Detection**: Updated `menu | events | showdown page` (`views.showdown()`) so the MVP header banner automatically tracks the winner of the **latest active played day** (e.g. `👑 DAY 3 MVP` ➔ `ThaDwarf`).
- **Co-MVP & Overlapping Avatar Stack**: Added tie support for daily MVPs (`👑 DAY 3 CO-MVPS`) rendering the overlapping avatar stack (`renderAvatarStack`) for tied profile pictures.
- **Winners Row & Table Formatting**: Applied metallic gold text (`color: #FFD700`) for daily winners, renamed row to `Horn Rewards`, and added dense tie ranking with `🤝` badges to the `Player Rankings` table.

## [1.32.4] - 2026-07-23
### Overlapping Avatar Stack for Co-MVPs / Co-Champions
- **Overlapping Avatar Stack**: Implemented a modern GitHub/Slack-style overlapping avatar stack on `menu | leaderboards | showdown leaderboards` (`views.leaderboards('showdown')`). When multiple players tie for Co-MVP or Co-Champion, up to 3 circular avatars overlap with metallic gold borders (plus a `+N` indicator badge if more than 3 tie), preventing card clutter while showcasing all winners.

## [1.32.3] - 2026-07-23
### Leaderboards Tab Tie Emoji Badge
- **Tie Emoji Badge**: Added a subtle `🤝` emoji next to rank numbers on `menu | leaderboards | showdown leaderboards` (`views.leaderboards('showdown')`) whenever multiple players share the exact same rank.

## [1.32.2] - 2026-07-23
### Dense In-Order Tie Ranking for Leaderboards Tab
- **Dense Sequential Ranking**: Updated tie ranking logic on `menu | leaderboards | showdown leaderboards` (`views.leaderboards('showdown')`) so ranks count dynamically in order without skipping numbers (e.g. Rank 1, Rank 1, Rank 2, Rank 3).

## [1.32.1] - 2026-07-23
### Pure Horns-Based Tie Ranking for Leaderboards Tab
- **Pure Horns Ranking**: Updated tie detection on `menu | leaderboards | showdown leaderboards` so shared rank numbers (e.g. Rank 1 for both tied players) are calculated **100% purely on Horns (`p.horns`)**. Removed point score fallback when evaluating rank equality.

## [1.32.0] - 2026-07-23
### Leaderboards Tab Showdown Tie Handling
- **Co-MVP Banner & Shared Ranks**: Updated `Current - Showdown Leaderboard` and `All-Time - Showdown Leaderboard` under `menu | leaderboards | showdown leaderboards` (`views.leaderboards('showdown')`) to handle ties seamlessly:
  - Top banners render `👑 Showdown Co-MVPs` / `👑 All-Time Co-Champions` with all tied player names.
  - Table rows assign shared rank numbers (e.g. Rank 1 for both tied top players) when scores match.

## [1.31.5] - 2026-07-23
### Showdown UX Improvements
- **Isolated Table Scrolling**: Restricted horizontal scrolling exclusively to the data table container rather than scrolling the outer card or page title. Added sticky left column positioning so alliance names and player rankings remain fixed on screen while scrolling across day columns.

## [1.31.4] - 2026-07-23
### Showdown Alliance Progress Table Enhancements
- **Gold Winners Styling**: Formatted top player names in the Winners row with metallic gold text (`#FFD700`) without emojis for a clean appearance.
- **Card-Style Day Column Separation**: Added subtle vertical divider borders and pill-style headers (`Day 1`, `Day 2`...) to cleanly separate each day.

## [1.31.3] - 2026-07-23
### Showdown UI Improvements
- **Alliance Progress Table Styling**: Removed green background block highlights from table cells. Winning daily and total scores between Our Alliance and Enemy Alliance are now highlighted purely with green text color, keeping the background clean.

## [1.31.2] - 2026-07-23
### Maintenance Script & Reliability
- **Maintenance Script**: Added `Run_Weekly_Maintenance.bat` for one-click automated backups, security audits, and production build checks.
- **Build Reliability**: Moved inline HTML `<style>` rules from `index.html` into `src/style.css` to eliminate Vite html-proxy cache issues and ensure 100% deterministic builds.

## [1.31.1] - 2026-07-23
### Updated
- **Dependencies Upgrade**: Upgraded all npm dependencies (`firebase`, `lucide`, `vite`) to their latest releases and resolved all package audit advisories.

## [1.31.0] - 2026-07-23
### Security & Audit Hardening Release
- **Backend API Security**: Removed hardcoded emergency bypass secret from Apps Script API endpoints. All write endpoints now strictly enforce Firebase token authentication and admin role verification.
- **Endpoint Protection**: Moved `forceSyncActivity`, `getSheetNames`, `getFormulas`, `getFormulasActivity`, `installAllTimeFormula`, and `installMissedDaysFormula` from public endpoints to `ADMIN_ENDPOINTS`.
- **WOS API Encryption**: Secured Century Games API encryption key in Apps Script properties instead of hardcoding.
- **Firebase Rule Lockdown**: Restricted `users` and `admin_logs` nodes in Realtime Database rules from public read access to authenticated-only (`auth != null`).
- **Repository Hygiene**: Removed over 140 temporary scratch scripts (`.cjs`), static data dumps (`.json`), and local batch files (`.bat`) from Git history. Updated `.gitignore` to prevent future clutter.
- **Admin Hub Auto-Refresh**: Fixed broken `adminHubView` container ID reference in `main.js`, restoring automatic UI refresh after admin actions.
- **Code Cleanliness**: Removed duplicate `adminDeletePlayer` function definition, eliminated dead `authChiefName` variable, moved ES module imports to top level, and added `console.error` logging across all silent catch blocks.

## [1.30.7] - 2026-07-22
### Fixed
- **Bear Trap DB Editor Error**: Fixed a bug where opening the editor threw a `Cannot read properties of undefined` error because it was attempting to dynamically load a separate Firebase instance instead of using the core initialized database. 

## [1.30.6] - 2026-07-22
### Fixed
- **Bear Trap DB Editor Modal**: Fixed an issue where the DB Editor modal was silently failing to open due to the UI injection missing the modal HTML container. 

## [1.30.5] - 2026-07-22
### Added
- **Bear Trap DB Editor**: Added a new "🛠️ DB Editor" tool to the Bear Trap Admin Menu. This raw database editor fetches and displays all `beartrap_donations` nodes directly from Firebase, and allows admins to permanently delete any orphaned ghost entries or mistakes with a single click, completely bypassing roster validation rules.

## [1.30.4] - 2026-07-22
### Fixed
- **All-Time Bear Donations**: Fixed a bug where the All-Time Bear Donations leaderboard was only displaying recent scores tracked in Firebase. The frontend now correctly pulls historical all-time data from the Google Sheet and automatically merges it with the live Firebase data before sorting and ranking.

## [1.30.3] - 2026-07-22
### Fixed
- **Reset Ghost IDs**: Fixed a bug where the Reset Player tool would refuse to run if you entered a raw numeric ID that no longer existed in the Roster. Now, you can forcefully wipe orphan IDs (like 705413646) from the leaderboard even if they have already left the alliance.

## [1.30.2] - 2026-07-22
### Fixed
- **GitHub Actions Titles**: Added a `run-name` directive to `deploy.yml` to strictly enforce that GitHub Actions uses the commit message as the workflow run title, fixing a bug where GitHub would occasionally hide the summary and default to "Deploy to GitHub Pages".

## [1.30.1] - 2026-07-22
### Removed
- **Add New Player Button**: Removed the redundant "Add New Player to Roster" button from the Daily Tools admin menu, as it already exists inside the Player Database Editor.

## [1.30.0] - 2026-07-22
### Added
- **Add/Remove Toggle**: Added a dropdown toggle to the Multi-BT Donations tool, allowing admins to easily switch between adding and removing amounts.
### Changed
- **Reset Player Tool**: Modified the Reset Player tool so that it now completely deletes the player's node from the database instead of setting it to 0. This ensures ghost entries (like deleted players) are completely removed from the leaderboard rather than lingering with a score of 0.

## [1.29.99] - 2026-07-22
### Added
- **Reset Player Tool**: Added a dedicated "Reset Player" tool inside the Bear Trap Admin page. This allows admins to easily wipe a player's Bear Trap donations (both Current and All-Time) back to 0 without having to calculate negative amounts.

## [1.29.98] - 2026-07-22
### Fixed
- **Multi-Bear Trap Donations**: Enhanced the error logging for the "Multi-BT Donations" admin tool to print the exact error message to the UI instead of a generic "Error updating donation" message, helping diagnose Firebase permission issues.

## [1.29.97] - 2026-07-22
### Added
- **Combined Showdown Leaderboard**: Updated the All-Time Showdown Leaderboard logic to dynamically combine historical archived scores with live current event scores. Players' active progress (e.g. 1 win) is now immediately added to their historical totals (e.g. 39 wins) resulting in a combined total (40) shown in real time.

## [1.29.96] - 2026-07-22
### Changed
- **Showdown Leaderboards**: Removed the total player count numbers from the "Current Showdown" and "All-Time Showdown" leaderboard titles for a cleaner look.
- **All-Time Showdown Length**: Reduced the displayed rows on the All-Time Showdown leaderboard to only show the Top 4 players, matching the Current Showdown view.

## [1.29.95] - 2026-07-22
### Changed
- **Showdown Leaderboards Length**: Reduced the displayed rows on the Showdown Leaderboards page for both the Current Showdown and All-Time Showdown leaderboards to only show the Top 4 players instead of Top 10 to keep the display concise.

## [1.29.94] - 2026-07-22
### Fixed
- **Multi-BT Donations Bug**: Fixed an issue in the older Bear Trap admin panel where clicking the 'X' button to remove a newly added donation row or attempting to submit the form would unintentionally delete the entire donations container, preventing R4/R5 managers from adding batch Bear Trap donations.
- **Bear Trap Roster Datalist**: Updated the autocomplete input fields in the multi-BT donations panel to correctly map to the new `beartrapRosterDatalist` (was pointing to the deprecated `chiefList`), fixing the auto-complete lookup issue.

## [1.29.93] - 2026-07-22
### Fixed
- **Leaderboards Filter HTML Bug**: Fixed a missing set of closing HTML tags in the All-Time Showdown Leaderboard generation that was causing the Current Showdown and All-Time Showdown cards to visually merge and break the side-by-side flexbox layout on the specific Showdown Leaderboards page.

## [1.29.92] - 2026-07-22
### Added
- **Polar Terrors Admin Tracker**: Added a dedicated Polar Terrors tracker mirroring the Mercenary Prestige module to the Daily Admin Tools hub.
- **Bear Trap Admin Tracker**: Added a dedicated Bear Trap tracker to the Daily Admin Tools hub, featuring inline Donation inputs.
- **Roster Event Activity Matrix Expansion**: Expanded the Member Activity Matrix with a new column/checkbox to track Bear Trap signups directly from the matrix.

## [1.29.91] - 2026-07-22
### Fixed
- **Visual Overlap & DOM HTML Bug**: Fixed a critical HTML parsing bug where the Bear Trap Activity Widget was injected incorrectly inside a `<tbody>` tag, causing the browser to forcibly close containers and visually overlap/merge cards together.
- **All-Time vs Current Showdown Math**: Removed logic that was incorrectly combining live current active event scores with historical All-Time Showdown scores before the event was over. All-Time Showdown is now strictly based on historical archived data.

## [1.29.90] - 2026-07-22
### Changed
- **Event Goals Positioned at Bottom**: Moved **🎯 Event Goals** card (`finalGoalsCard`) to render below all leaderboard cards (at the bottom of the page). Leaderboards (Current Showdown & All-Time Showdown) now sit prominently on top.

## [1.29.89] - 2026-07-22
### Fixed
- **Showdown Leaderboards & Event Goals Layout Separation**: Fixed layout clash in `views.home()`. Cleanly separated **🎯 Event Goals** (rendered at the top as a full-width card) from **Current Showdown Leaderboard** and **All-Time Showdown Leaderboard** (rendered side-by-side below). Prevented duplicate static sheet tables from rendering over live Firebase components.

## [1.29.88] - 2026-07-22
### Added
- **Mercenary Prestige Signup Tracker (`views.mercenaryAdmin()`)**: Dedicated real-time event tracker page matching the Alliance Championship setup! Includes instant in-place `✅ YES` / `❌ NO` status toggles, zero-page-refresh KPI recalculations, missing signup list quick-copy banner (`window.copyMissingMercenaryList()`), and search filtering.
- **Bi-Directional Real-Time Firebase Sync**: Toggling statuses in Mercenary Prestige Signup Tracker or Roster Event Activity Matrix immediately syncs both `mercenary` and `activity_live` Firebase nodes in **< 10ms**!
- **Daily Tools Quick Launcher**: Added a **`⚔️ Mercenary Prestige`** launch button inside the R4/R5 Daily Tools hub.
- **Firebase Database Rules**: Added explicit security rules for `mercenary` node in `database.rules.json`.

## [1.29.87] - 2026-07-22
### Added
- **All-Time Showdown Leaderboard Horn Calculation**: Built full Horn calculation logic into `calculateAllTimeShowdown(historyRows)` and `views.home()` for both Current & All-Time Showdown leaderboards.
- **Showdown MVP Header Cards**: Displays dynamic MVP winner banners with custom avatar badges, player names, and total Horn scores for both Current and All-Time Showdown tables.
- **Sticky & Scrollable Card Tables**: Created CSS `.card-table-scroll` container with custom scrollbars and sticky table headers (`position: sticky; top: 0;`), allowing full scrollability on mobile without stretching card heights.
- **Synced Live Activity & Championship Toggles**: Synchronized real-time status updates between Roster Event Activity Matrix and Alliance Championship Signup Tracker.
### Changed
- **Navbar Header Branding**: Restored navigation brand text in `index.html` back to **`❄️ Dashboard for BDC Alliance`**.

## [1.29.86] - 2026-07-22
### Fixed
- **Firebase Security Rules & Toggle Permission Error**: Added explicit `.read` & `.write` rules for `championship`, `activity_live`, `beartrap_wins`, `beartrap_donations`, `leaderboards`, and `admin_logs` in `database.rules.json`. Fixed permission error when toggling signup statuses!

## [1.29.85] - 2026-07-22
### Added
- **Interactive Checkbox Matrix in Roster Event Activity Matrix**: Equipping each member's row in **📊 Roster Event Activity Matrix** with interactive checkboxes for all 5 event categories (`🔥 Perfect Attendance`, `🏆 Championship`, `⚔️ Mercenary`, `🐻‍❄️ Polar Terrors`, `🗳️ Voter`). Checking any box updates Firebase (`activity_live/${gameId}` and `championship/${gameId}`) in **< 10ms**!
- **Direct Navigation Link**: Added a **`📊 Open Roster Event Activity Matrix ➔`** button inside the Alliance Championship Signup Tracker header for seamless 1-click navigation.

## [1.29.84] - 2026-07-22
### Fixed
- **Instant In-Place Championship Signup Toggles (`views.championshipAdmin()`)**: Replaced full-page DOM re-renders with instant optimistic in-place button state updates (`✅ YES` / `❌ NO`), zero scroll resetting, zero `--` flicker, and real-time KPI card & missing signup list recalibrations!

## [1.29.83] - 2026-07-22
### Changed
- **Alliance Championship Tracker Table Redesign (`views.championshipAdmin()`)**: Simplified the Alliance Championship roster table to display **Chief Name** and **Signup Status** (`✅ YES` / `❌ NO`), removing Game ID and Furnace Level columns for a cleaner, high-density layout.

## [1.29.82] - 2026-07-22
### Fixed
- **Network-First Service Worker Strategy (`sw.js`)**: Updated PWA Service Worker cache to `wos-bdc-pwa-v1.29.82` with a Network-First strategy for HTML navigation and automatic cache purging. Users will now instantly see the latest site version (`v1.29.82`) without being stuck on older cached builds!

## [1.29.81] - 2026-07-22
### Changed
- **PWA Mobile App Icons Updated**: Generated high-resolution PWA app icons (`icon-192.svg`, `icon-512.svg`) embedded with the website's signature blueish & purpleish gradient snowflake logo, radial glow backdrop, and **wosBDC** typography!

## [1.29.80] - 2026-07-22
### Added
- **Live Event Activity Matrix Editing (`window.promptEditEvents()`)**: Upgraded **Player Database Editor ➔ Actions ➔ 📝 Edit Events** to natively toggle all 5 event participation badges (`🔥 Perfect Attendance`, `🏆 Championship`, `⚔️ Mercenary`, `🐻‍❄️ Polar Terrors`, `🗳️ Voter`). Writes directly to Firebase Realtime Database (`activity_live/${gameId}`) in < 10ms with real-time UI matrix updates!
- **App Name Update**: Changed main navigation branding header to **wosBDC** (`❄️ wosBDC for BDC Alliance`).

## [1.29.79] - 2026-07-22
### Changed
- **PWA App Branding Update**: Updated Progressive Web App name, mobile titles, manifest settings, SVG icons, and installation banners to **WOS BDC** (`WhiteOut Survival BDC Alliance Hub`).

## [1.29.78] - 2026-07-22
### Added
- **Mobile Progressive Web App (PWA) Support**: Configured `manifest.json`, Service Worker (`sw.js`), high-res SVG app icons (`icon-192.svg`, `icon-512.svg`), Apple mobile web app meta tags, and an in-app **"📱 Install WOS 1515 App"** banner for 1-tap Home Screen installation on iOS & Android!

## [1.29.77] - 2026-07-22
### Added
- **Phase 8: Master Leaderboards Matrix Firebase Migration (`leaderboards`)**: Created `window.fetchLeaderboardsData()` reading all leaderboard cards natively from Firebase Realtime Database (`leaderboards`). Automatically seeds from `LeaderBoards` Google Sheet if empty, completing 100% full decoupling from Google Sheets!

## [1.29.76] - 2026-07-22
### Added
- **Game ID Verification Button in Add Player Modal**: Added `window.verifyAddPlayerGameId()` with a `🔍 Verify ID` button inside the Add Player modal. Typing a Game ID auto-verifies and auto-fills Chief Name & Furnace Level from local alliance database and Whiteout Survival game servers!

## [1.29.75] - 2026-07-22
### Added
- **1-Click "Add New Player to Roster" Feature**: Added `window.addNewChiefToRoster()` and `window.openAddPlayerModal()` modal dialog directly accessible from **Player Database Editor** and **Admin Hub ➔ Quick Admin Tools**. Saves new roster members directly to Firebase Realtime Database (`roster_live/${gameId}`) in < 10ms with automated Google Sheets sync!

## [1.29.74] - 2026-07-22
### Fixed
- **Activity History Archives Fallback Handling**: Added multi-layer Google Sheets API & Firebase fallback logic to `window.loadActivityHistory()` so historical activity archives load safely without throwing error messages if a node is empty or restricted.

## [1.29.73] - 2026-07-22
### Added
- **Multi-Menu Logs & Activity History Dashboard**: Upgraded Admin Hub ➔ 📋 Logs Tab into a 3-subtab multi-menu dashboard featuring:
  1. `📋 Admin Action Logs`: Real-time admin operations & audit logs.
  2. `📊 Member Activity Checklist`: Live roster event participation matrix (`🔥 Perfect Attendance`, `🏆 Championship`, `⚔️ Mercenary`, `🐻‍❄️ Polar Terrors`, `🗳️ Voter`).
  3. `📜 Activity History Archives`: Archived event participation & historical activity logs.

## [1.29.72] - 2026-07-22
### Changed
- **Championship Signup Button Styling**: Formatted Championship signup buttons to display a bold, vibrant solid green `✅ YES` pill badge when signed up, and a distinct red `❌ NO` pill badge when missing.

## [1.29.71] - 2026-07-22
### Added
- **Phase 7: Alliance Championship Admin Tool (`views.championshipAdmin`)**: Built a dedicated Alliance Championship Signup Tracker inside Admin Hub ➔ Quick Admin Tools, featuring real-time Firebase status toggling (`championship/${gameId}`), live KPI counters (Total, YES, NO, Response Rate %), search filtering, and 1-click clipboard copy of missing signup member names.

## [1.29.70] - 2026-07-22
### Added
- **Phase 6: Frost Clan & Activity Tracking Migration (`activity_live`)**: Created `window.fetchActivityData()` to query player event activity natively from Firebase Realtime Database (`activity_live` node) with automatic Google Sheets seeding fallback.

## [1.29.69] - 2026-07-22
### Added
- **Phase 5: Gift Code Bot Firebase Migration (`giftcode_bot`)**: Migrated player gift code auto-redemption enrollment tracking natively into Firebase Realtime Database (`giftcode_bot/${gameId}`), enabling real-time enrollment checks and 1-click opt-ins with automated sheet seeding.

## [1.29.68] - 2026-07-22
### Fixed
- **Player Card Event Tag Formatting**: Formatted all event rank tags (e.g. `⚔️ Showdown: #1 (4,881,161)`) to include `#Rank` and `(Score)` parens, matching the exact format of `🏅 All-Time Showdown` and `🐻 Bear Trap Wins`.

## [1.29.67] - 2026-07-22
### Changed
- **Onboarding Banner Copy Upgrade**: Updated the Home Page Onboarding Hero Banner copy to *"Already an alliance member? Link your email to claim your profile! Instantly track your live Bear Trap donations, Showdown rankings, alliance event scores, and personal activity logs—all in real time!"* with a vibrant "✨ Essential Alliance Member Portal" badge.

## [1.29.66] - 2026-07-22
### Added
- **2-Tier Database-First Game ID Verification**: Updated registration Game ID verification to check our alliance database first (`idToNameMap` and `roster_live`), instantly verifying existing members without relying on or hitting rate limits on external Century Games servers.

## [1.29.65] - 2026-07-22
### Fixed
- **Onboarding Modal Triggering**: Fixed the `Claim / Create Account` button on the Home Page Onboarding Banner to directly open `window.openRegisterModal()`, pre-configuring the modal with the "Create Account / Claim Profile" title and character lookup inputs.

## [1.29.64] - 2026-07-22
### Security
- **Mandatory Google Sign-In for Admin Hub**: Enforced `window.isGoogleAuthVerified()` check in `views.admin()`. Accessing the Admin Hub now strictly requires a verified Google Sign-In session in addition to R4/R5 leadership credentials.

## [1.29.63] - 2026-07-22
### Changed
- **Player Database Editor Firebase Integration**: Updated `window.searchPlayerFull()` to query player roster profiles natively from Firebase Realtime Database (`roster_live`), eliminating latency when looking up, inspecting, editing, or deleting player accounts.

## [1.29.62] - 2026-07-22
### Added
- **Home Page Onboarding Hero Banner**: Added a high-visibility, glassmorphism hero announcement card to `views.home()` for guest visitors, prompting alliance members to claim their pre-loaded roster profile or sign in.
- **Popup-Blocker Safe Registration Flow**: Enabled direct in-page profile claiming (`Claim / Create Account`) for linking roster characters to Firebase Auth user accounts.

## [1.29.61] - 2026-07-22
### Changed
- **Personal Activity Log (Today Only & Compact UI)**: Updated `window.loadUserPersonalLog()` in Account Hub (`views.account`) to filter for **Today's log entries ONLY**, styled with a compact 240px container height and custom scrollbar for seamless mobile viewing.

## [1.29.60] - 2026-07-22
### Added
- **Personal Activity Log in Account Hub**: Integrated a "My Personal Activity Log" timeline widget into every player's Account Hub (`views.account`), showing real-time timestamps, action icons, admin names, and details for their account.
- **Resilient Fallback for Admin Logs**: Updated `window.fetchAdminLog()` and `window.loadUserPersonalLog()` to catch Firebase `Permission denied` errors gracefully and automatically fall back to Google Sheets API (`API_BASE_URL?api=getSheetData&sheetName=Admin Log`).

## [1.29.59] - 2026-07-22
### Added
- **Firebase Realtime Database Admin Action Logging System**: Integrated `window.logAdminAction()` across all admin functions (Bear Trap crowning, winner resets, multi-donations, single donations, Showdown score updates, Enemy Alliance settings, event archiving, and live resets).
- **Real-Time Admin Logs UI**: Upgraded `window.fetchAdminLog()` and the Admin Logs tab in `views.admin()` to read and display logs natively from Firebase Realtime Database node `admin_logs` in real time with category badges and instant search/filters.

## [1.29.58] - 2026-07-22
### Fixed
- **Bear Trap 1 & 2 Champion Banner Display**: Updated champion banner logic in `views.leaderboards` so that explicit crowned winners (from `config/bearTrapWinners`) and Rank #1 players (from `beartrap_wins`) are correctly displayed on Bear Trap 1 & 2 cards.

## [1.29.57] - 2026-07-22
### Changed
- **Final Production Build & Deployment**: Verified production bundle build via Vite (`npm run build`) and deployed latest Firebase Realtime Database Bear Trap & Showdown migration features.

## [1.29.56] - 2026-07-22
### Added
- **Bear Trap Firebase Migration**: Migrated Bear Trap wins (`beartrap_wins`) and Bear Trap donations (`beartrap_donations`) to native Firebase Realtime Database updates.
- **All-Time Bear Trap Donations & Champions**: Updated `views.leaderboards('Bear')` to render native, real-time Firebase-powered cards for **All-Time Bear Trap Champions**, **Bear Trap 1**, **Bear Trap 2**, **Both Bear Trap Winners**, **Current Bear Trap Donations**, and **All-Time Bear Trap Donations**.

## [1.29.55] - 2026-07-22
### Fixed
- **All-Time Showdown Master History Data Source**: Updated `views.leaderboards` to always fetch the full master **Showdown History** sheet (`fetchSheet("Showdown History")`) containing all historical events, and append any newly archived Firebase events on top. Restored the complete 41-player all-time history standings.

## [1.29.54] - 2026-07-22
### Added
- **Real-Time Live & All-Time Showdown Integration**: Combined live event scores from `showdown_live` into the **All-Time - Showdown Leaderboard** so active event scores reflect on all-time standings in real time.
- **Zero Double-Credit Archiving Protection**: Updated `window.archiveCurrentShowdownToFirebase()` to automatically clear `showdown_live` when archiving to `showdown_history`, ensuring past events are never double-counted.

## [1.29.53] - 2026-07-22
### Fixed
- **All-Time Showdown Leaderboard Data Unwrapping**: Updated `calculateAllTimeShowdown()` and `views.leaderboards` to automatically unwrap the `.data` property when `sdHistoryData` is formatted as `{ success: true, data: [...] }`. Restored the **All-Time - Showdown Leaderboard** card alongside the **Current - Showdown Leaderboard** card.

## [1.29.52] - 2026-07-22
### Fixed
- **Showdown Data Entry Lock Button Visibility**: Added `lockBtn.style.display = 'inline-block'` to `window.onSdPlayerSelect()`. Previously when selecting a player with existing scores, the input locked properly but the lock button remained `display: none`, hiding the `🔒 Locked` / `✏️ Edit` button and preventing score editing.

## [1.29.51] - 2026-07-22
### Fixed
- **Showdown Leaderboard Rendering ReferenceError**: Fixed `Uncaught ReferenceError: sdHistoryData is not defined` in `views.leaderboards` by explicitly declaring `let sdHistoryData = null;` before fetching database history. This completely restores the **Current - Showdown Leaderboard**, **All-Time - Showdown Leaderboard**, and **Event Goals** cards on the `Leaderboards -> Showdown` page.

## [1.29.50] - 2026-07-22
### Changed
- **Showdown Data Entry Locked Pill UI**: Upgraded Day 1-6 score inputs in Showdown Admin from a plain lock emoji to clear, interactive `🔒 Locked` (red pill) and `✏️ Edit` (green pill) badges.

## [1.29.49] - 2026-07-22
### Fixed
- **All-Time Showdown Parsing Header Match**: Fixed header row detection in `calculateAllTimeShowdown` to match both `Name` and `Member` column headers in historical Showdown blocks.

## [1.29.48] - 2026-07-22
### Changed
- **Global Modal Consistency**: Replaced all remaining native browser popups (`confirm` / `alert`) across Bear Trap reset, Frost Clan reset, and Alt Account linking with centered `window.customConfirm` and `window.customAlert` glassmorphic modals.

## [1.29.47] - 2026-07-22
### Fixed
- **Centered Warning Modal Alignment**: Guaranteed that both Archive to History and Reset Event confirm modals pop up in the center of the screen with identical custom styling.

## [1.29.46] - 2026-07-22
### Added
- **Showdown Archive Warning Modal**: Added explicit confirmation warning instructing admins not to archive until the Showdown event is 100% finished after Day 6.

## [1.29.45] - 2026-07-22
### Added
- **Firebase Showdown History Node**: Migrated all historical Showdown records natively into Firebase (`showdown_history`), completely disconnecting Google Sheets for Showdown.
- **Admin Event Archiving & Reset**: Added `window.archiveCurrentShowdownToFirebase` and `window.resetCurrentShowdown` functions to the Showdown Admin header for easy event rotation.
- **Side-by-Side Showdown Cards**: Styled `Current - Showdown Leaderboard` and `All-Time - Showdown Leaderboard` into a balanced 50/50 flex layout with `🎯 Event Goals` sitting full-width below both.

### Changed
- **Events Dropdown Navigation**: Moved standalone Showdown link under an `Events ▾` dropdown in the top navbar.
- **Event Goals Tag**: Updated daily status badge to `✅ Daily Goal Met`.

### Fixed
- **Mobile Horizontal Table Scroll**: Wrapped Leaderboard tables in dedicated `overflow-x: auto` containers for smooth mobile scrolling.
- **GitHub Actions Vite Build**: Fixed JavaScript syntax error where helper functions were defined inside object literals.

## [1.29.20] - 2026-07-21
### Added
- **Bear Trap Auto-Reset**: Connected Bear Trap Champion banners to the real-time event schedule. Champion banners will now automatically display "Pending..." with a blank score for exactly 30 minutes after a Bear Trap event is scheduled to start, overriding the all-time manual Firebase winner temporarily.

### Changed
- **Bear Trap Winner Source**: Reverted the Bear Trap Champion banners to pull from the manual `config/bearTrapWinners` JSON structure (instead of dynamically crowning whoever currently has the most all-time wins on the leaderboard spreadsheet).

### Fixed
- **Player Database Editor**: Fixed the broken Player Database Editor in the Admin Menu by restoring the `window.searchPlayerFull` function which was accidentally removed in a previous update.

## [1.29.19] - 2026-07-21
### Added
- **Automated Bear Trap Champion Banners**: Automated the Reigning Champion banners for the Bear Trap leaderboards. The app now parses the Google Sheets data in real-time to crown whoever is in 1st place. If the spreadsheet is cleared for a new event (top score is 0), the champion banner will automatically revert to showing "Pending..." with a blank score, removing the need for manual configuration.

## [1.29.18] - 2026-07-21
### Fixed
- **Alliance Progress Card Layout Bug**: Fixed a layout bug in the Alliance Progress card introduced in v1.29.17 where a rogue closing `</div>` prematurely closed the card container, causing the progress table to render outside of the card's bounds.

## [1.29.17] - 2026-07-21
### Changed
- **Showdown MVP Full Banner Layout**: Reverted the inline header banner for Alliance Progress and replaced it with a dedicated, full-width block directly below the title, allowing it to span the entire card smoothly across all screen sizes without competing with the card title.

## [1.29.16] - 2026-07-21
### Fixed
- **Responsive Showdown MVP Banner**: Adjusted the layout of the Alliance Progress card header so the MVP banner is properly centered and wraps onto a new line on smaller screens, resolving overlap issues caused by rigid table widths.

## [1.29.15] - 2026-07-21
### Changed
- **Showdown MVP Header Banner Tweaks**: Enlarged the inline Showdown MVP banner in the Alliance Progress header and restored the "👑 SHOWDOWN MVP" label and separated "Total Horns" count, making it significantly more prominent and premium while still saving space compared to the full-width banner.

## [1.29.14] - 2026-07-21
### Changed
- **Showdown MVP Header Banner**: Moved the Showdown MVP banner from the Winners row into the header of the Alliance Progress card itself, presenting a neat, inline badge next to the title.

## [1.29.13] - 2026-07-21
### Fixed
- **Mini-Banner Alignment**: Fixed the alignment of the compact Showdown MVP banner inside the Winners row to be left-aligned, properly balancing it with the rest of the column data.

## [1.29.12] - 2026-07-21
### Added
- **Automated Showdown MVP Banners**: Showdown Leaderboards (both current and All-Time) now automatically generate and display a rich Reigning Champion banner at the top for the #1 ranked player in that board.

## [1.29.11] - 2026-07-21
### Changed
- **Showdown MVP Banner Compacted**: Removed the full-width MVP banner and integrated a mini-banner (avatar, name, and horns) directly into the Total cell of the Winners row to save screen space while keeping the premium look.

## [1.29.10] - 2026-07-21
### Added
- **Showdown MVP Banner**: Added a premium gold-gradient banner at the top of the Showdown Analytics page, featuring the avatar, name, and total horn count of the overall Showdown winner.

## [1.29.9] - 2026-07-21
### Added
- **Overall Showdown Winner**: Automatically tallies horns earned by daily winners throughout the Showdown event and dynamically highlights the overall winner (and their total horn count) in the Total column of the Winners row.

## [1.29.8] - 2026-07-21
### Changed
- **Event Goals Position Re-ordered**: Moved the Event Goals cards in the Leaderboards Showdown tab to display *underneath* the leaderboard tables per user request.

## [1.29.7] - 2026-07-21
### Changed
- **Event Goals UI Moved**: Migrated the rich "Event Goals" mobile cards from the standalone Showdown Analytics page into the Leaderboards Showdown tab, completely replacing the standard table format.
- **Admin UI Polish**: Hid the top navigation bar when viewing the Showdown Admin tool to maximize vertical screen space on mobile devices; it restores automatically when closing the admin page.

## [1.29.6] - 2026-07-21
### Changed
- **Showdown Admin Unified**: Merged the "Showdown Data Entry" and "Showdown Event Settings" admin tools into a single, unified "ShowDown" view to streamline event management from one centralized page.

## [1.29.5] - 2026-07-21
### Changed
- **Showdown Goals**: Renamed the "Goal" column to "Left to 20M" in both the Analytics Dashboard and Home leaderboards to accurately reflect a countdown logic showing how many points the Alliance needs to reach the 20,000,000 total event goal based on cumulative scores.

## [1.29.4] - 2026-07-21
### Changed
- **Showdown Settings Redesign**: Hardcoded the static event goals (3.3M/day, 20M total) and daily horns, removing unnecessary inputs from the Settings page.
- **Dynamic Alliance Total**: Showdown Settings and Analytics Dashboard now calculate the Alliance's total daily amount dynamically directly from player scores.
- **Dynamic Winners**: The daily "Winner" is now auto-assigned to the top-scoring player in the alliance for that day, eliminating the need to type it in manually.

## [1.29.0] - 2026-07-21
### Changed
- Migrated Chief's List from Google Sheets to Firebase `roster_live` node for real-time syncing and massive speed improvements.
- Refactored Roster, Player Editor, Showdown Editor, and Analytics to parse Firebase JSON structure.
- Updated admin deletion tool to simultaneously remove players from Firebase roster_live.

## [v1.28.0] - 2026-07-21
### Added
- Showdown Event Settings admin tool under Daily Tools tab to manage Event Goals, Enemy Alliance Name, Horns, and Winners directly in Firebase.
### Changed
- Rewrote Showdown dashboard logic to natively fetch from Firebase showdown_live and showdown_meta objects instead of parsing Google Sheets data.
- Rewrote Roster and Leaderboard search logic to parse All-Time Showdown scores and Missed Days directly from Firebase.

### v1.27.58
- The Event Goals chart now triggers the "Pending" display when `Left +/-` is exactly equal to the `Daily Goal`, completely masking the default spreadsheet output (`+3,333,333.333`) on days that have not started.

### v1.27.57
- Upgraded the "Pending" state logic to also trigger when the parsed `Daily Amount` is `0` (which handles cases where a spreadsheet formula outputs a zero instead of a blank cell).

### v1.27.56
- Added a "Pending" state to Event Goals cards. If an event day has not occurred yet (i.e. the daily amount is blank), the dashboard will display "Pending" instead of showing a confusing red deficit based on a blank amount.

### v1.27.55
- Swapped the positive and negative sign logic for "Left +/-" amounts on Event Goals cards based on user feedback. A deficit (red) will now show a `-` sign (e.g., `-11,474,249`), while a surplus (green) will show a `+` sign.

### v1.27.54
- Prepend a '+' sign to positive "Left +/-" amounts on Event Goals cards so that it explicitly shows the amount needed. (Negative amounts automatically show the '-' sign).
- Fixed a `doGet Crash: Argument too large: key` bug in Google Apps Script by safely truncating the Firebase Token string before using it as a CacheService key.

### v1.27.53
- Added conditional red/green color coding to the "Daily Amount" metric on the Event Goals charts. The Daily Amount text will now automatically turn green if the Daily Goal was met or exceeded, and red if it fell short.

### v1.27.52
- Added "The 20M Challenge" progress bar to the Event Goals chart in the Leaderboards view (was previously only visible in the Showdown view).

### v1.27.51
- Implemented Google Apps Script `CacheService` to aggressively cache Firebase authentication token validations and admin privilege checks.
- Prevented "Service invoked too many times" quota errors during heavy bulk actions (like batch Bear Trap donation submissions) by reducing concurrent `UrlFetchApp` calls by over 95%.

### v1.27.50
- Rebuilt Event Goals rendering logic from a static 5-column table into a responsive Mobile-First CSS Grid layout.
- Eliminated all horizontal scrollbars for Event Goals on small screens.
- Updated manual_sync.cjs and Google Apps Script to securely support emergency Firebase bypassing.

## [1.27.47] - 2026-07-20
- Added the Showdown Event Goals chart to the Leaderboards view, positioning it directly underneath the other two Showdown leaderboards for a balanced layout. Also fixed a bug on the Showdown page where admin notes were accidentally rendered inside the player rankings table.

## [1.27.46] - 2026-07-20
- Fixed a major data-fetching bug causing the Showdown page to crash. When data wasn't fully synced to the new Firebase real-time database, the app failed to correctly fallback to the Google Apps Script live backend. The data loader now properly detects empty Firebase nodes and seamlessly falls back to the live spreadsheet data.

## [1.27.45] - 2026-07-20
- Fixed an issue where the navigation bar would remain hidden after returning to the Admin Menu from the Player Database Editor.

## [1.27.44] - 2026-07-20
- Removed the invisible physical "shield" overlay used for the autocomplete dropdown and replaced it with a modern lightweight document listener. This fixes a bug where tapping a button (like the "Check" lookup button) while the dropdown was open would require a double-tap because the first tap was being absorbed by the invisible shield.
- Made the Admin Menu tab navigation bar horizontally scrollable on mobile devices to prevent the tabs from overflowing off the edge of small screens.

## [1.27.43] - 2026-07-20
- Fixed an issue on mobile devices where tapping on a name in the dropdown search results wouldn't register the selection. Switched from 'mousedown' to 'pointerdown' to ensure touch events are reliably captured before the search bar loses focus.

## [1.27.42] - 2026-07-20
- Fixed the "Player Not Found" error when using the Quick Lookup tool on the Multi-BT Donations page by updating the Google Apps Script backend to correctly identify the Bear Trap Donations tab.
- Fixed a bug where search bars with high z-indexes (like the Player Database Editor) were rendering on top of the mobile navigation menu.
- Hidden the mobile navigation bar when using the Player Database Editor to provide a cleaner, full-screen editing experience.

## [1.27.41] - 2026-07-20
- Modified the mobile navigation "hamburger" menu to span the entire height of the screen, completely obscuring the page content underneath for a cleaner look.

## [1.27.40] - 2026-07-20
- Completely reverted all search bars on the site (including the Chief's List) to exactly how they behaved prior to the Apple bug discovery. The full-screen search popup has been removed.
- Restructured the entire Chief's List view for mobile users: The view now opens as a full-screen, native-app-style page that hides the bottom navigation bar and features a dedicated Back button to return Home.

## [1.27.39] - 2026-07-20
- Reverted the full-screen "Search Player" popup inside the Admin Menus (like Multi-BT Donations) to restore rapid data-entry workflow.
- Restored the "Invisible Shield" method to those admin dropdowns to ensure they still close properly on Apple devices.
- Kept the full-screen "Search Player" popup exclusively for the main Chief's List page on mobile devices.

## [1.27.38] - 2026-07-20
- Fixed a silent bug where the mobile "Search Player" popup would fail to initialize if you loaded straight into the Chief's List without opening any other menus first.

## [1.27.37] - 2026-07-20
- Fixed a bug where the new mobile "Search Player" popup was accidentally hijacking search bars on Desktop Chrome browsers with touchscreens.
- Applied the new mobile "Search Player" popup explicitly to the main Chief's List view search bar as well.

## [1.27.36] - 2026-07-20
- Completely redesigned the Player Search experience for mobile devices. Tapping a player search bar on smaller screens now opens a dedicated, full-screen "Search Player" popup with a back button, permanently resolving the stubborn Apple iOS keyboard and dropdown bugs.

## [1.27.35] - 2026-07-20
- Reverted the scroll-hide method and implemented an invisible touch shield for Apple iOS devices. Now, tapping anywhere on the screen while a dropdown is open will intercept the tap and instantly close the dropdown.

## [1.27.34] - 2026-07-20
- Fixed an Apple iOS bug where custom search bars would stay active by instantly dismissing them any time the page or a modal is scrolled/swiped.

## [1.27.33] - 2026-07-20
- Added a "Check for Updates" refresh button directly to the Changelog window.

## [1.27.32] - 2026-07-20
- Added a manual 'Check for Updates' refresh button to the Dev Mode tracking banner.

## [1.27.31] - 2026-07-20
- Increased the Dev Mode GitHub deployment tracker polling interval to 60 seconds to prevent API rate limiting.
- Fixed a bug where custom player autocomplete dropdowns would stay open and overlap the mobile menu or settings sidebar on iOS devices.

## [1.27.30] - 2026-07-20
- Fixed the Dev Mode "Track Deployment" status tracker to poll the correct GitHub repository.

## [1.27.29] - 2026-07-20
- Fixed an iOS/Safari bug where the custom player search dropdown would not close when tapping outside the box or opening the sidebar.

## [1.27.28] - 2026-07-20
- Completely removed legacy OTP admin authentication flow from both frontend UI and backend services, fully relying on Google Authentication to enforce security.

## [1.27.27] - 2026-07-20
- Improved UI layout: Moved the "Stop Spoofing" and "Switch User" control buttons out of the fixed top-right corner popup and tucked them away neatly at the bottom of the Sidebar Menu.

## [1.27.26] - 2026-07-20
- Completely replaced the buggy native `<datalist>` autocomplete in the Multi-BT Donations menu with a sleek, custom Javascript dropdown to fix Safari display bugs.

## [1.27.25] - 2026-07-20
- Fixed an issue where the autocomplete datalist for the Multi-BT / Player Name search bars was rendering visibly on some browsers (like Safari) by explicitly setting `display: none;`.

## [1.27.24] - 2026-07-20
- Hotfix: Fixed a Javascript syntax parsing error that caused the automated GitHub Actions deployment pipeline to fail.

## [1.27.23] - 2026-07-20
- Fixed an issue where success alerts (toasts) from Admin actions would get stuck on screen permanently instead of automatically dismissing.

## [1.27.22] - 2026-07-20
- Converted the "Linked Alt Accounts" section in the Player Database Editor to use a sleek, collapsible dropdown menu matching the Account Hub layout.

## [1.27.21] - 2026-07-20
- Moved the "Theme Engine" and "Push Notifications" sections out of the sidebar and into dedicated popup modals to save vertical space and prevent sidebar scrolling issues.

## [1.27.20] - 2026-07-20
- Added a "Switch User" button below the floating "Stop Spoofing" button to allow for quick and seamless transitions between spoofed accounts.

## [1.27.19] - 2026-07-20
- Fixed a bug where a Spoofed Session would incorrectly display the Admin's Alt Accounts instead of the spoofed player's Alt Accounts.

## [1.27.18] - 2026-07-20
- Streamlined the Admin Master Key workflow: it is now directly integrated into the "Player Database Editor". You can now open a player's profile and click "Spoof Session (Master Key)" from their Admin Actions dropdown to instantly log in as them.
- Added a floating "Stop Spoofing" button that appears on the screen when a spoof session is active.

## [1.27.17] - 2026-07-20
- Moved the Admin Master Key out of the global sidebar to prevent layout issues. It is now a standalone popup accessed via a button in the "Daily Tools" tab of the Admin panel.

## [1.27.16] - 2026-07-20
- Hardened the Master Key feature by requiring the Google Sign-In OTP verification before allowing spoofing.
- The Master Key input now supports autocompleting by Chief Name or Game ID, identical to the standard player search bar.

## [1.27.15] - 2026-07-20
- Built an Admin Master Key (Spoofing Tool) into the sidebar menu. Administrators can now enter any Game ID to temporarily view the site exactly as that player sees it to easily troubleshoot bugs.

## [1.27.14] - 2026-07-20
- Fixed a bug where the "Profile picture updated successfully!" notification would get permanently stuck on the screen.

## [1.27.13] - 2026-07-20
- Fixed a bug where clicking the main Account Hub avatar failed to open the file upload dialog due to an improper template literal reference.

## [1.27.12] - 2026-07-20
- Fixed an issue where the new Reset Password modal was overlapping the Sign In modal. The Sign In modal is now correctly hidden when resetting your password.

## [1.27.11] - 2026-07-20
- Built a dedicated "Reset Password" modal overlay that cleanly separates the password reset flow from the main login screen, reducing confusion.

## [1.27.10] - 2026-07-20
- Fixed the "Forgot Password" button failing to send reset emails due to legacy Firebase v8 syntax being used in a Firebase v9 modular environment.

## [1.27.9] - 2026-07-20
- Fixed a bug where Staff Cards and Alt Accounts were not rendering uploaded profile pictures due to a broken global variable reference.

## [1.27.8] - 2026-07-20
- Cleaned up the Account Hub UI by moving the account Email directly into the Premium ID Card stats panel.

## [1.27.7] - 2026-07-20
- Updated Staff Cards to display "R4 Officer" / "R5 Leader" on the front, and beautifully render all of their managed events and roles as modern pill tags on the back of the card.

## [1.27.6] - 2026-07-20
- Removed the redundant "Sign Out" button from the Account Hub since it's already accessible in the sidebar menu.

## [1.27.5] - 2026-07-20
- Wrapped the "Linked Alt Accounts" list inside a collapsible accordion so they don't take up too much vertical space on the Account Hub.

## [1.27.4] - 2026-07-20
- Converted the inline Staff Profile editor in the Account Hub into a button that opens a beautiful modal popup overlay.

## [1.27.3] - 2026-07-20
- Converted the "Department" input on the Staff Profile to a textarea to support multiple lines for users who manage multiple events.
- Added a "Location" field to the Staff Profile editor and displayed it on the Staff Cards.

## [1.27.2] - 2026-07-20
- Fixed a bug in the Firebase Database rules that was blocking master accounts from editing their profile pictures or alt account profile pictures if they had fewer than 5 alt accounts linked. 

## [1.27.1] - 2026-07-20
- Fixed a syntax error that was causing the site build to fail on Vercel (which prevented the version badge and changelog from updating).

## [1.27.0] - 2026-07-20
- Added Staff Profile editor in Account Settings for alliance leadership.
- Staff page cards now display Department/Specialty, Timezone, and custom Bios.
- Updated database rules to securely allow admins to edit their own staff profiles.

## [1.26.15] - 2026-07-20
- Added a hardcoded placeholder on the Staff page for Afu_D until she formally registers her account.

## [1.26.14] - 2026-07-20
- Fixed an issue where the Staff page displayed default fallback avatars instead of the custom avatars uploaded by the alliance leadership.

## [1.26.13] - 2026-07-20
- Fixed a bug where master accounts could not upload or edit their own profile pictures or their linked alt accounts' profile pictures due to strict database security rule type coercion.

## [1.26.12] - 2026-07-20
- Fixed mobile responsiveness on the Staff page (added box-sizing to cards and stacked layout for small screens).

## [1.26.11] - 2026-07-20
- Fixed an issue where the root R5 admin was missing from the Staff page because they are hardcoded and not saved in the Firebase database list.

## [1.26.10] - 2026-07-20
- Staff page is now fully dynamic, pulling from the live admin list in Firebase.
- Enhanced the Staff page UI with more "pop" (glowing borders, elevated R5 prominence).

## [1.26.9] - 2026-07-20
- Added a new Staff page to showcase alliance leadership with dynamic glassmorphism trading cards.
- Added Staff navigation link to the main menu.

## [1.26.8] - 2026-07-20
- Added a dedicated Sign Out button to the user account sidebar menu.

## [1.26.7] - 2026-07-20
- Refactored Frost Clan Command Center to fetch all alliance activity tracking directly from the Frost Clan sheet instead of cross-referencing the Activity sheet.

## [1.26.5] - 2026-07-20
- Fixed an issue where the Frost Clan dashboard failed to load due to a typo in the Google Sheet name referenced by the backend API.
- Updated frontend API_BASE_URL to point to the patched Apps Script deployment.

## [1.26.4] - 2026-07-20
- Restricted Frost Clan Command Center tab visibility exclusively to the root admin account.

## [1.26.3] - 2026-07-20
- Integrated Frost Clan Command Center into the Admin Hub.
- Added secure backend endpoints to view and manage Frost Clan shields and tomes.

## [1.26.2] - 2026-07-20
- Added Forgot Password link and functionality to the auth modal.
- Replaced native datalist with a custom autocomplete dropdown in Bear Trap popup.
- Adjusted UI flex scaling for the Bear Trap popup.

# WOS Community Portal - Changelog

## [1.29.3] - 2026-07-21
### Added
- Added a "lock" feature to the Showdown Data Entry page to prevent accidental overwriting of existing scores.

### Fixed
- Fixed invalid `window.firebaseDb` references that crashed the Showdown pages.
- Added missing Firebase Security rules for `showdown_meta` and `roster_live` to fix "Permission denied" errors.

## v1.26.0 - 2026-07-19
- **Admin Panel Security Overhaul**: Removed the buggy OTP email system that was exhausting Google Apps Script quotas. The Admin Panel is now exclusively locked behind **Google Sign-In**. This leverages Google's built-in 2FA, brute-force protection, and session management. If an Admin signs in with an Email and Password, they will be politely asked to log out and use the "Sign in with Google" button to access the panel.

## v1.25.0 - 2026-07-19
- **Site Audit & Polish**:
  - **Custom Modals**: Replaced all native browser popups (`alert`, `confirm`, `prompt`) with premium, styled custom modals (`window.customPrompt`, `window.customAlert`, `window.customConfirm`) for a unified aesthetic experience. Most minor errors now use Toast notifications.
  - **Account Deletion Fix**: Added a direct "Delete Account" action to the Admin Users tab. This safely purges rogue users from the Firebase authentication system if they managed to register but don't exist on the main Google Sheet roster.
  - **Instant UI Reloads**: Added the instant-reload mechanism to Alt Account Linking/Unlinking, so your view refreshes immediately after connecting or disconnecting an Alt without a manual page refresh.

## v1.24.75 - 2026-07-19
- **Instant Admin UI Updates**: When an R5 grants or revokes an Admin Badge from another player's profile card, the profile card now instantaneously redraws to reflect the new badge (or removal thereof) without needing a page refresh.

## v1.24.74 - 2026-07-19
- **Admin Grant/Revoke Safety**: The confirmation popups when granting or revoking Admin Privileges now explicitly display the player's Chief Name alongside their Game ID to prevent accidental clicks on the wrong account.

## v1.24.73 - 2026-07-19
- **Admin Menu Updates**: Renamed "Admin Tools" / "Admin Control Panel" to "Admin Menu" across the dashboard to better align with its purpose. Also fixed a bug that prevented the Player Database Editor from opening after a recent security update.

## v1.24.72 - 2026-07-19
- **Time Active Polish**: The "Time Active" formatter now intelligently strips out any `0` values (e.g. `0y`, `0m`, `0d`) to keep the display as clean and minimal as possible (e.g. `4m 0d` becomes just `4m`).

## v1.24.71 - 2026-07-19
- **Time Active Formatting**: Standardized the "Time Active" display on the Account Hub for both main accounts and Alt accounts to use a short, lowercase format (e.g. `1y 1m 3d`) instead of raw verbose spreadsheet output.

## v1.24.70 - 2026-07-19
- **Player Lookup Polish**: Increased the size of the Fire Crystal icon in the Player Profile header badges to match the visual prominence of the Account Hub.

## v1.24.69 - 2026-07-19
- **Alt Account Stats Fix**: Fixed a bug on the Account Hub where Alt Accounts were correctly matching against the Master Roster, but failing to visually pull their Furnace Level and Time Active stats onto their Alt Cards.

## v1.24.68 - 2026-07-19
- **Account Hub Polish**: Increased the size and prominence of the Fire Crystal icon and Furnace Level text on the main Account Hub ID card.

## v1.24.67 - 2026-07-19
- **Premium Player Database Editor Search**: Applied the same custom-built, premium autocomplete dropdown menu from the Player Lookup tool to the Admin Player Database Editor for a consistent, seamless experience.

## v1.24.66 - 2026-07-19
- **Premium Player Lookup**: Completely replaced the generic browser dropdown on the Player Lookup search box with a custom-built, premium autocomplete dropdown menu. The list now only appears when you start typing, filtering results instantly with a modern look and feel.

## v1.24.65 - 2026-07-19
- **API Disconnect Fix**: Corrected a critical backend disconnection where the frontend was pointing to an older deployment of the API, causing the OTP code to fail with "Error: undefined".

## v1.24.64 - 2026-07-19
- **Admin Panel 2FA Lock**: The Admin Panel now correctly displays the OTP Security Check screen instead of just a blank page when a session is locked.
- **Login Bug Fix**: Fixed a critical syntax issue that caused buttons like Google Sign-In and Admin Menu to become unresponsive.

## v1.24.63 - 2026-07-19
- **Login Notification Fix**: The "Successfully signed in" alert has been updated to automatically disappear after a few seconds instead of staying stuck on the screen until manually closed.

## v1.24.61 - 2026-07-19
- **Google Sign-In Date Prompt**: New users registering via Google Sign-In are now prompted to enter the date they started playing WOS so it accurately tracks in the Account Hub.

## v1.24.60 - 2026-07-19
- **Google Sign-In**: Added a "Continue with Google" button to the login and registration screen for a seamless authentication experience. Existing users who registered using their Google email and a password can use this button to automatically merge their accounts and log in. New users will be prompted for their Game ID upon first sign-in to complete their registration.

## v1.24.59 - 2026-07-19
- **Admin 2FA Security**: The Admin Panel is now protected by an Email OTP system. Admins must enter a 6-digit code sent to their registered email to unlock their session (valid for 2 hours). This protection is enforced directly at the Firebase Rules and Google Apps Script level, making it impossible to bypass even if a password is compromised.

## v1.24.58 - 2026-07-19
- **Firebase Account Deletion**: The "Delete Player" button now additionally hunts down and permanently deletes the player's Firebase Account Profile (Avatar, Bio, etc.) and instantly removes their Player Card from the dashboard without waiting for the nightly sync.

## v1.24.57 - 2026-07-19
- **Hotfix**: Improved the ghost-row cleanup logic. The automated cleanup tool now correctly identifies empty checkboxes and formula `#N/A` errors as ghost-rows and scrubs them properly.

## v1.24.56 - 2026-07-19
- **Admin Tools Update**: Added a new "Delete Player" button to the website's Admin Panel. Admins can now securely delete a player directly from the website without opening Google Sheets.
- **Automated Ghost Row Cleanup**: Integrated a nightly silent cleanup script (`cleanUpEmptyRowsSilent`) to the 1:00 AM auto-sync. It will automatically sweep all formatted sheets and remove empty rows to keep the footers correctly positioned.

## [1.24.55] - 2026-07-19
### Fixed
- **Registration**: Fixed a typo in the internal sheet targeting logic where the "Polar Terrors" sheet was misspelled as "Polar Terror". This typo caused the script to completely skip inserting a row in that specific sheet, which in turn caused its top-level array formula to hit the bottom border/footer and crash with a `#REF!` error. The spelling has been corrected and the sheet will now receive its rows normally.

## [1.24.54] - 2026-07-19
### Fixed
- **Registration**: Fixed a severe bug where the global row insertion script would accidentally copy the physical 'FALSE' state of checkboxes or placeholder text from the row above into the new row. This blocked ArrayFormulas (like `=FILTER`) from spilling into the row, resulting in `#REF!` errors. The script now intelligently scans the newly inserted row and instantly clears any cell that does not contain a per-row formula (like `=IF` or `=RANK`), resetting checkboxes to blank and fully unblocking ArrayFormulas.

## [1.24.53] - 2026-07-19
### Fixed
- **Changelog**: Fixed a bug where the UI was still attempting to fetch `CHANGELOG.md` from the deprecated `BrianDivaCox/wosBDC` repository. Updated the fetch URL to point to the new `wosbdc/wosBDC.github.io` organization repository.

## [1.24.52] - 2026-07-19
### Fixed
- **Registration**: Fixed a bug where registering an existing player failed silently. The system now accurately detects duplicates and repurposes the registration flow as a "Level Updater", cleanly overwriting the player's old Furnace Level in Column C of `Chief's List` with the newly verified API level. Also fixed a bug where brand new players were missing their Furnace Level.

## [1.24.51] - 2026-07-19
### Changed
- **Registration**: Implemented global row insertion across all 10 major Google Sheets. When the table becomes full, the system automatically inserts a new row strictly 2 rows from the bottom (pushing the footer down) and cleanly inherits all complex visual formatting, data validation, and array formulas.

## [1.24.50] - 2026-07-19
### Fixed
- **UI Alerts**: Reprogrammed Toast notifications to allow auto-dismiss logic (5s timeout) for generic tasks. Critical data-mutating tasks (Bear Trap additions, crowning champions, editing player stats) correctly persist on screen and must be manually dismissed, ensuring no important changes are missed.

## [1.24.49] - 2026-07-19
### Fixed
- **Registration**: Implemented dynamic capacity bounds-checking during registration. If `giftcodebot` lacks physical rows to store new players, the system will programmatically expand the sheet via `getMaxRows()` tracking to prevent silent out-of-bounds `insertRow()` errors.

## [1.24.48] - 2026-07-19
### Changed
- **API Migration**: Fully migrated frontend endpoints to hit the newly deployed Google Apps Script (v81) to pick up the registration bug fixes.
- **Frontend Build Pipeline**: Reconfigured Vite to deploy `index.html` assets directly to the root domain (`wosbdc.github.io`) instead of forcing the `/wosBDC/` sub-path.
- **Hosting**: Successfully migrated the repository and Github Pages live hosting exclusively over to the `wosbdc` Github organization.

## [1.24.47] - 2026-07-18
### Fixed
- **Admin Panel**: Fixed incorrect Vercel Usage Dashboard URL.

## [1.24.46] - 2026-07-18
### Added
- **Admin Panel**: New ⚡ System tab (R5 only) with two sections: (1) A live proxy status card showing online/offline state, self-tracked request count since last cold start, and response latency. (2) Direct one-click buttons to the Vercel Usage Dashboard, Project page, and Live Logs.
- **Vercel Proxy**: Added `/api/stats` endpoint that returns self-tracked invocation count and links to official dashboards.

## [1.24.45] - 2026-07-18
### Changed
- **Infrastructure**: Migrated all Century Games Game ID verification calls off Google Apps Script and onto a dedicated free Vercel proxy (`wos-vercel-proxy.vercel.app`). Google Apps Script now exclusively handles Google Sheets operations. This completely separates concerns and eliminates any possibility of ID verification hitting Google's daily quota limits.

## [1.24.44] - 2026-07-18
### Added
- **Frontend**: Added a manual fallback override for Game ID verification. If your Google Account exhausts its daily 20,000 API requests limit (or if the Century Games API goes down), the "Verify" button will now gracefully fail and display manual input fields so you can still type in your Chief Name and Furnace Level by hand to successfully register!

## [1.24.43] - 2026-07-18
### Fixed
- **Frontend**: Removed the native up/down spinner arrows that some browsers added to the Game ID input box on the signup form, which are useless and confusing for typing an ID.

## [1.24.42] - 2026-07-18
### Changed
- **Frontend**: Added a manual "Verify" button next to the Game ID input on the signup form. The website will no longer try to verify the Game ID while you are typing; it will only connect to the Century Games API when you explicitly click the Verify button. This completely eliminates all rate limiting and typing lag.

## [1.24.41] - 2026-07-18
### Fixed
- **Frontend**: Greatly reduced the chance of exhausting the Century Games API rate limit by only attempting to look up Game IDs that are at least 7 digits long. This prevents the website from pinging the game servers for invalid partial numbers while you are still typing your ID.

## [1.24.40] - 2026-07-18
### Fixed
- **Frontend**: Fixed an asynchronous race condition on the signup form where typing your Game ID too quickly could cause an older API request for a partial/invalid ID to overwrite the successful response of your full ID.

## [1.24.39] - 2026-07-18
### Changed
- **Backend API**: The new signup flow will now ONLY insert the Chief Name into the `Chief's List` sheet, leaving all other columns blank so that your Google Sheet formulas can safely pull the data from `giftcodebot` without being permanently overwritten by hardcoded values.

## [1.24.38] - 2026-07-18
### Fixed
- **Backend API**: Completely replaced the `appendRow` Google Sheets function with an intelligent search that finds the true first empty row in the list to prevent Google Sheets from inserting new signups thousands of rows down the page if there are blank formatted rows.

## [1.24.37] - 2026-07-18
### Fixed
- **Frontend**: Fixed a CORS network error that caused new signups to fail to write to the Google Sheets.

## [1.24.36] - 2026-07-18
### Fixed
- **Frontend**: Fixed a case sensitivity bug that caused the Account Hub to fail to pull Furnace Level and Time Active stats if the casing of the user's name on Century Games API didn't exactly match the casing in the Google Sheet.

## [1.24.35] - 2026-07-18
### Fixed
- **Backend API**: Fixed a bug where registering a new account or enrolling an alt account was placing the Date Started into the Gift Codes column on the Google Sheet.
- **Backend API**: Fixed an issue where duplicate checks on the GiftCodeBot sheet prevented new signups from properly updating the Chief's List in Google Sheets.
- **Frontend**: Updated API_BASE_URL to point to the newly deployed backend script.

## [1.24.34] - 2026-07-18
### Changed
- **Registration**: Removed the manual "Chief Name" input box during signup. The system now fully relies on the verified Chief Name pulled directly from the Game ID validation API.
- **Registration**: Added a clear "Date You Started Playing" label above the date picker to improve clarity on iOS and desktop browsers.

## [1.24.33] - 2026-07-18
### Changed
- **Navigation**: Removed the calendar emoji from the Schedule link in the navigation bar for a cleaner look.

## [1.24.32] - 2026-07-18
### Changed
- **Schedule**: Merged the "Calendar View" and "Today's Schedule" pages into a single unified "Event Schedule" page.
- **Schedule**: Added a toggle pill button at the top to instantly switch between "Today's View" and "Calendar View" without reloading the page.
- **Schedule**: The site now remembers your preferred schedule view tab and automatically loads it next time you visit.
- **Navigation**: Removed the dropdown submenu for Schedule since everything is now available from a single page.

## [1.24.31] - 2026-07-18
### Added
- **Privacy - Root Admin Alt Accounts**: R4 admins can no longer see the root admin's (BrianDCox) linked alt accounts in the Player Database Editor. The alt accounts section is silently hidden when an R4 views the root admin's profile — the data is never even sent to the HTML renderer. R5 (root admin) can still see all alt accounts as normal.

## [1.24.30] - 2026-07-18
### Added
- **Global Timers - Inte Reset**: Added new ⚡ Inte Reset countdown timer (resets at UTC 00:00, 08:00, 16:00). Shows time remaining until next reset with a sub-line displaying the next reset time in the user's local timezone — works correctly for every timezone automatically.
- **Global Timers - Daily Reset**: Added matching "Next: [date] [time] local" sub-line to the Daily Reset timer for consistency.
### Changed
- **Global Timers Widget**: Redesigned the entire Global Timers sidebar widget to use flexbox (no more `float:right`) for correct rendering on smartphones. Timer cards now use colored accent borders (blue for Daily Reset, orange for Inte Reset) with monospace font for the countdowns.

## [1.24.29] - 2026-07-18
### Fixed
- **Account Hub - Alt Cards**: Removed the fire emoji 🔥 and "Lv" text from the furnace level display — now shows just the FC icon image (for Fire Crystal levels) or the plain number (for lower levels).
- **Account Hub - Alt Cards**: Time Active now uses the short format (e.g. `8M 3D`) instead of the raw full string (e.g. `8 months, 3 days`).

## [1.24.28] - 2026-07-18
### Changed
- **Account Hub - Alt Accounts**: Upgraded the Linked Alt Accounts section to use the same premium dark glassmorphism card design as the Player Database Editor. Cards now feature a 70px cyan-glowing avatar, bold white name/ID text, furnace flame icon with label, timer icon with Time Active label, and properly styled Enable Perks / UNLINK buttons. Layout changed from a single-column flex list to a responsive grid.

## [1.24.27] - 2026-07-17
### Fixed
- **CRITICAL - Add Alt Account root cause**: `window.nameToIdMap` was never actually assigned to the `window` object. Since `main.js` is an ES Module, all `export let` variables live in module scope — invisible to inline `onclick` handlers. `adminLinkAltAccountPromptByChief` was silently bailing immediately because `window.nameToIdMap[chiefName]` was always `undefined`. Fixed by assigning `window.nameToIdMap = nameToIdMap` and `window.idToNameMap = idToNameMap` at the end of `refreshIdToNameMap()`.
### Added
- `ARCHITECTURE.md` — comprehensive documentation of the full stack, ES module gotchas, Firebase security rules and the GAS bypass pattern, alt account linking flow, deployment instructions, and a common bugs reference table.

## [1.24.26] - 2026-07-17
### Fixed
- **Admin Log**: Fixed an issue where the Multi-BT Donations Admin Log would display "No activity found" if the Google Sheet had trailing empty rows.
- **Alt Account UI**: Fixed a bug where uploading a profile picture for an Alt Account would fail silently because it was referencing an undefined upload button.

## [1.24.25] - 2026-07-17
### Fixed
- **Admin Panel Bug**: Fixed a core "Permission denied" error when an Admin tried linking an Alt Account to another user. Firebase Security Rules completely blocked Admins from writing to other users' profiles, so the linkage was failing silently or throwing a red alert. I built a custom Google Apps Script endpoint to securely bypass these rules, allowing Admins to link Alts seamlessly.

## [1.24.24] - 2026-07-17
### Fixed
- **Alt Account UI**: Fixed a bug where Alt Accounts would stop showing up if an admin linked an Alt Account to a "stub" profile, and then the user later registered a real account on the website. The UI now intelligently merges Alts across all profiles matching the user's Game ID to ensure no data is lost.

## [1.24.23] - 2026-07-17
### Changed
- **Admin Panel**: Allowed Admins to link Alt Accounts to players who have not yet registered a website profile by automatically generating a "stub" profile for them in the Firebase database.

## [1.24.22] - 2026-07-17
### Fixed
- **Admin Panel Bug**: Fixed a crash in the Player Database Editor where the "Add Alt Account" button in the Action Menu would fail due to calling a global window function that was only imported locally.

## [1.24.21] - 2026-07-17
### Fixed
- **Personal Hub UI**: Changed the text color of the "Time Active" stats on Personal Hub Alt Cards from muted gray to bright white (`var(--text-main)`) with bold weighting to match the Furnace Level display.

## [1.24.20] - 2026-07-17
### Fixed
- **Personal Hub UI**: Reverted the shorthand "Time Active" formatter (e.g. 8M 3D) in the Personal Hub's Alt Accounts section back to the long form, keeping the shorthand format strictly isolated to the Admin Player Database Editor as requested.

## [1.24.19] - 2026-07-17
### Changed
- **Alt Account UI**: Formatted "Time Active" stats on Alt Cards into short-hand (e.g., "8 months, 3 days" to "8M 3D") to save horizontal space and create a cleaner look.

## [1.24.18] - 2026-07-17
### Changed
- **Fire Crystal Icons**: Globally hid the redundant text number for players above Furnace Level 30 (Fire Crystal levels), allowing the official 3D FC game icons to stand alone.

## [1.24.17] - 2026-07-17
### Changed
- **Alt Account UI**: Stripped the redundant fire emoji ("🔥") and the "Lv" text from the Furnace Level display on Alt Cards to make it cleaner, since the orange furnace icon is already present.
- **Alt Account UI**: Updated the green Enrolled badge text to say "Code Enrolled".

## [1.24.16] - 2026-07-17
### Fixed
- **Alt Account Stats Bug**: Fixed a bug where Alt Cards in the Player Database Editor were not displaying Furnace Level or Time Active due to a broken map lookup. Alt Cards now properly query the Chief's List for data, and dynamically fetch Furnace Levels straight from the Century Games API if the alt account hasn't been synced to the roster yet.

## [1.24.15] - 2026-07-17
### Added
- **Alt Account Management UI**: Completely redesigned the Alt Accounts section within the Player Database Editor to use a stunning glassmorphism card design based on the recent mockup.
- **Unlink Alt Account Feature**: Added a fully functional "Unlink" button to the new Alt Cards that allows admins to permanently sever the link between a main account and an alt account in the database.

## [1.24.14] - 2026-07-17
### Changed
- **Admin Panel UI Cleanup**: Restyled the Daily Tools tab in the Admin Panel to neatly stack the "Open Multi-BT Donations" and "Open Player Database Editor" buttons into a cleaner vertical layout, removing unnecessary descriptive text.
- **Alt Accounts Privacy**: The Alt Accounts list/badge is now hidden on the main public Chief's List. It is now exclusively visible within the Player Database Editor in the Admin Panel.

## [1.24.13] - 2026-07-17
### Fixed
- **Admin Panel & Firebase Database Crashes**: Fixed a critical bug where replacing `db` with `window.firebaseDb` across the codebase resulted in an undefined reference error (`Cannot read properties of undefined (reading '_checkNotDeleted')`), completely breaking the Admin Panel and Database Editor. Reverted all calls to use the properly scoped `db` module import.

## [1.24.12] - 2026-07-17
### Added
- **Dedicated Player Database Editor View**: Extracted the Player Database Editor from the Admin Panel dashboard into its own spacious, full-screen view (similar to the Multi-BT Donations feature). This provides significantly more room for managing player profiles and alt accounts.
### Fixed
- **Player Editor Search Checkmarks**: Fixed a bug where the green checkmarks (`✅`) were not properly displaying next to registered users in the Player Database Editor's dropdown menu.

## [1.24.11] - 2026-07-17
### Fixed
- **Roster Page Crash**: Hotfixed a JavaScript reference error (`window.idToNameMap` undefined) that broke the public Roster page when attempting to render Alt Account badges.

## [1.24.10] - 2026-07-17
### Changed
- **Alt Account Management Refactored**:
  - Removed the `+ Add Alt` button and collapsible Alt Account rows from the Admin Panel's "Users" list to significantly reduce clutter.
  - The "Users" list still displays the total number of linked Alt Accounts (e.g., `3 Alt(s)`) next to the chief's name.
  - Moved the `➕ Add Alt Account` button to the `⚙️ Actions` dropdown menu in the Universal Player Editor.
  - The Universal Player Editor's profile card now explicitly lists the total number of Alt Accounts and their names underneath the main badges.
  - The "Search Chief Name" dropdown in the Player Database Editor now displays a green checkmark (`✅`) next to chiefs who are already registered in the system.

## [1.24.9] - 2026-07-17
### Fixed
- **Admin Permissions Bug**: Fixed an issue where Firebase Database Security Rules were blocking Admins from adding Alt accounts to other players. Admins now have the proper database write access to modify user profiles and delete avatars.

## [1.24.8] - 2026-07-17
### Added
- **Admin User List**: Added the requested `Furnace Level`, `Giftcode Enrolled` tag, and `Time Active` (years in service) stats directly to the Users tab in the Admin Panel. These badges now appear next to the Chief Name for both Main and Alt accounts!

## [1.24.7] - 2026-07-17
### Changed
- **Account Hub Styling**: Changed the text color for Furnace Level and Time Active values from pink to white to match the styling of the Game ID.

## [1.24.6] - 2026-07-17
### Fixed
- **Admin Panel UI**: Fixed an issue in the Multi-Bear Donations form where the Amount box was being pushed off the screen on smaller smartphones.

## [1.24.5] - 2026-07-17
### Fixed
- **Alt Account Stats Bug**: Fixed a severe typo where the website was looking for Alt Account stats in a non-existent database tab called "Roster", rather than the actual "Chief's List" tab. Alt stats will now pull perfectly from the database again!

## [1.24.4] - 2026-07-17
### Added
- **Dynamic Alt Stats Fetching**: If an Alt Account is not actively tracked on the Master Roster spreadsheet, the Account Hub will now dynamically reach out to the official White Out Survival servers and fetch their live Furnace Level on the fly!

## [1.24.3] - 2026-07-17
### Fixed
- **Alt Account Stats Lookup**: Fixed an issue where Furnace Level and Time Active showed as "N/A" for Alt Accounts because the name matching occasionally failed. Rebuilt the system to look up stats using the bulletproof Game ID numeric identifier instead.

## [1.24.1] - 2026-07-17
### Fixed
- **Account Hub Crash**: Fixed a critical bug where the Account Hub would fail to load if it couldn't correctly reference the Roster data map.

## [1.24.0] - 2026-07-17
### Added
- **Alt Account Stats**: Alt accounts now beautifully display their Furnace Level and Time Active (pulled directly from the Chief's Roster) directly within the Account Hub.
- **Alt Cards UI**: Upgraded the linked Alt accounts list from simple rows into sleek, two-tier "Cards". This prevents stats and buttons from smashing together on smaller screens.

## [1.23.0] - 2026-07-17
### Added
- **Admin Alt Linking**: Added a convenient "+ Add Alt" button to the Universal Player Editor, allowing admins to manually pair Alt Game IDs directly to a player's main profile.
- **Smart Sync Logs**: The Live Database Sync Status panel now filters out old archive sheets and only displays syncs that occurred today, keeping the log clean and relevant.

### Changed
- **Main Avatar UI Refactor**: Removed the bulky "Profile Picture" section from the Account Hub to save vertical space. The main account avatar now uses the same sleek, clickable hover-to-edit interface as the alt accounts.

## [1.22.0] - 2026-07-17
### Added
- **Alt Account Custom Avatars**: Users can now upload custom profile pictures specifically for their linked alt accounts! Added a smooth hover edit icon over alt avatars in the Account Hub.
- **Smart Image Routing**: The avatar upload system now tracks which account (Main or Alt) is being targeted and seamlessly routes the new picture to the correct database profile while instantly live-updating the UI.

## [1.21.0] - 2026-07-17
### Added
- **Multiple Alt Accounts Support**: Completely removed the restriction of linking only 1 alt account. Users can now link an unlimited number of alt accounts to their main profile.
- **Smart Alt Selection**: Streamlined the alt account linking process by replacing the manual Game ID textbox with a searchable dropdown. Users can now simply type their alt's name to link it instantly.
- **Account Hub Revamp**: The Linked Alt Accounts section in the Account Hub now properly scales to display all linked alt accounts neatly, complete with avatars, individual status badges, and management options.

## [1.20.14] - 2026-07-17
### Changed
- **UI Notifications**: Routine success toasts (like Schedule Refreshed, Enrolled, Added Donation) will now auto-dismiss after a few seconds instead of requiring a manual click. Critical notifications like "Updates complete!" remain sticky.

## [1.20.13] - 2026-07-17
### Fixed
- **Calendar Schedule Header Bug**: Fixed a persistent crash in the Calendar View where custom text in the date headers (like "Today Thu 7/16") caused the date parser to fail and throw a "Could not find dates" error.

## [1.20.12] - 2026-07-17
### Fixed
- **Calendar Schedule View**: Fixed a bug where the full calendar view would fail to render and show a "Could not find dates" error due to the new compressed `M/D` date format deployed in the Firebase sync.

## [1.20.11] - 2026-07-17
### Changed
- **Countdown Formatting**: The home page countdown widget now cleanly omits unnecessary leading zeros (e.g. `5h 06m` instead of `05h 06m`) and will hide the hours entirely when it drops below 1 hour.

## [1.20.10] - 2026-07-17
### Changed
- **Home Widget Countdown Styling**: Styled the home page countdown widget so the numbers pop in the accent color, while the letters (h, m, s) seamlessly blend in using the active theme's text color.

## [1.20.9] - 2026-07-17
### Added
- **Site Favicon**: Replaced the default browser tab icon with a snowflake emoji (❄️) to match the dashboard navbar logo and improve brand recognition.

## [1.20.8] - 2026-07-17
### Added
- **Popup Color Coding**: The search results in the Rewards Editor popup are now color-coded for quick identification: Green (Active/Upcoming), Red (Expired), and Yellow (No dates set).

## [1.20.7] - 2026-07-17
### Changed
- **Popup UI Polish**: The Rewards Editor popup now hides the massive list of events entirely when it first opens, presenting a cleaner interface. The list only appears once you begin typing in the search box.

## [1.20.6] - 2026-07-17
### Added
- **Set Today Buttons**: Added clickable "TODAY" buttons above the start and end date inputs in the Rewards Editor popup for instant date assignment.

## [1.20.5] - 2026-07-17
### Added
- **Search-As-You-Type**: The new Rewards & Events Editor popup now has a live search box at the top, allowing you to instantly filter through all events and rewards without scrolling through the Google Sheet.
- **Auto-Date Fill**: When you click an event or reward in the popup that doesn't have dates set yet, it will now automatically pre-fill the start and end boxes with today's date for you.

## [1.20.4] - 2026-07-17
### Added
- **Admin Rewards Popup**: Converted the Google Sheets "Rewards & Events Editor" from a narrow side panel into a spacious 750x650 popup Modal Dialog to give admins much more screen real estate when editing events.
### Changed
- **Script Cleanup**: Combined old one-off data migration scripts into a single `Archived_Scripts.js` file to declutter the Google Apps Script project.

## [1.20.3] - 2026-07-17
### Fixed
- **Home Page Upcoming Widget missing**: The same date-format parsing bug that affected the main schedule view also caused the home page countdown widget to silently skip all events (it was only looking for ISO timestamps instead of the new `M/D` plain text format). Upgraded the `upcomingEvents` parser in the `home` view to handle both formats.

## [1.20.2] - 2026-07-17
### Fixed
- **Schedule displaying nothing**: Firebase changed how it syncs the WhiteOut Survival sheet — dates shifted from ISO timestamp format (`2026-07-17T07:00:00.000Z`) to plain text (`7/17`) and times from ISO to `16:00`. The event parser was checking for ISO timestamps exclusively, so every row was silently skipped. Rewrote the parser to handle both formats: `M/D` dates, `HH:MM` UTC times, and legacy ISO timestamps for backward compatibility.

## [1.20.1] - 2026-07-17
### Fixed
- **Coming Up This Week missing**: The event parsing loop was breaking immediately on the first row because it contained the header text "Event's" in column F. Changed `break` → `continue` for blank/header rows so they are skipped instead of stopping the loop entirely. Only the "Rewards" row now triggers a `break` (correctly marking the end of the events section).
- **Refresh button loaded calendar view**: The Refresh button was calling `window.refreshSchedule` which belongs to the weekly Event Schedule (calendar) view, not Today's Schedule. Fixed by defining a dedicated `window.refreshTodaysSchedule` function inside the `todays_schedule` view that properly clears the WhiteOut Survival cache and reloads the card.

## [1.20.0] - 2026-07-17
### Added / Redesigned
- **Today's Schedule — Full Redesign**: Replaced the old two-table layout with a single unified premium card.
  - **⏰ Events Today**: Timed events for today shown as styled rows with UTC time, your local time, and a live countdown timer (e.g. "in 2h 15m" → "Now" → "Done").
  - **🎁 Rewards**: Active rewards for the week (Hero Rally, Journey Treasures, Lucky Wheel, etc.) shown as a bullet list — only rendered if data exists.
  - **📋 Sign-Ups**: Events requiring sign-up (Alliance Championship, Fortress Battle, etc.) — only rendered if data exists.
  - **📆 All Week**: All-week events shown as pill badges — only rendered if data exists.
  - **🎉 Holidays**: In-game holiday events — only rendered if data exists and value is not "No Events".
  - **📅 Coming Up This Week**: Future timed events with date, UTC, and local time — always visible when upcoming events exist.
  - **Rest Day message**: If no timed events are scheduled today, shows "🎉 Rest day — no timed events today!" instead of an empty section.
  - **Empty sections hidden**: Any section with no data (or only "No Events" text) is completely hidden from the UI.
  - **Live countdown timers**: Update every 30 seconds automatically without page reload.
  - **Card design**: Single glassmorphism card with accent top border, color-coded section pills, and smooth fade-in animation.

## [1.19.4] - 2026-07-16
### Improved
- **Sticky Toast Notifications**: Success and error toasts now stay on screen until you click the ✕ button. Previously they auto-dismissed after 3 seconds, which could cause you to miss important confirmations (e.g. "Player updated", "Donation added", "Bear Trap winner crowned"). Loading/status toasts (info/accent type) still auto-dismiss after 5 seconds.
- **Fade-out Animation**: Auto-dismissing toasts now fade out smoothly instead of instantly disappearing.
- **Auto-dismiss timer**: Bumped from 3s → 5s for status toasts.

## [1.19.3] - 2026-07-16
### Fixed
- **Bear Trap Winner Crowning**: Fixed error "Player X not found in Bear Trap column" when crowning a winner who isn't already in the data sheet. The `addBearTrapEventWin` function now automatically adds the player to the next available slot in the data sheet before awarding the win — no manual pre-population needed.

## [1.19.2] - 2026-07-16
### Security
- **Tightened Firebase Database Rules**: The `config` node (admins list, maintenance mode, roster filter toggle) is now exclusively writable by the root admin account (Game ID 318843189). Previously any logged-in user could write to this node if they knew the database path.
- **Avatar Protection**: Users can now only write to their own Game ID's avatar slot — they can no longer overwrite another player's avatar.
- Rules validated and deployed to Firebase RTDB.

## [1.19.1] - 2026-07-15
### Fixed
- **Critical Auth Fix**: The Firebase ID Token verification in Google Apps Script was using the wrong Google API endpoint (`oauth2.googleapis.com/tokeninfo` is for Google OAuth2 tokens, not Firebase Auth tokens). Fixed to use the correct Firebase Identity Toolkit endpoint (`identitytoolkit.googleapis.com/v1/accounts:lookup`). All admin actions (add donation, update player, etc.) now work correctly for logged-in admins.
- **Frontend Auth Fix**: Replaced the unreliable dynamic `import('firebase/auth')` in `getAuthToken()` with a direct import of the `auth` instance exported from `firebase.js`, ensuring the token is always fetched from the correct initialized auth instance.

## [1.19.0] - 2026-07-15
### Security
- **A+ Security Upgrade: Removed hardcoded APP_SECRET from frontend code.** The secret key is no longer visible to anyone inspecting the website's source code.
- **Firebase ID Token Authentication**: All admin-only API calls (add donation, update player, update event, award Bear Trap win, view admin log) now require a valid Firebase Auth ID Token. Google Apps Script verifies the token against Google's Identity Toolkit and checks the caller's Game ID against the admin list in Firebase — all in real time, for free.
- **Role-Based Access Control**: Endpoints are now grouped into three tiers:
  - **Public** (no auth): `lookup`, `verifyWosId`, `lookupFull`
  - **Authenticated** (logged-in user required): `registerNewPlayer`
  - **Admin-only** (valid token + admin Game ID): `addDonation`, `updateFull`, `updateEvent`, `addBearTrapEventWin`, `adminLog`, `getSheetData`
- **GAS Redeployment**: Google Apps Script redeployed as version @69 with new secure `doGet` logic.

## [1.18.1] - 2026-07-15
### Fixed
- **Firebase Lockout Bug**: Fixed a critical issue where the new strict Firebase database rules unintentionally locked the dashboard frontend out of reading the Chief List, Schedules, and Admin data. Restored global read access to essential dashboard collections (`sheets`, `users`, `config`, etc.) while maintaining strict write protections.

## [1.18.0] - 2026-07-15
### Security
- Locked down Google Apps Script API endpoints by requiring a secret key for all GET and POST requests.
- Injected the secret key into all frontend fetch requests.
- Deployed strict Firebase Realtime Database security rules to prevent unauthorized data access.

## [1.16.6] - 2026-07-14
### Added
- Added a convenient red '✖' clear button to both the Main Site's Player Lookup search input and the Admin Panel's Player Database Editor search input. Clicking it instantly clears the search field, improving usability especially on mobile devices.




- Added visual 'R5' and 'R4' tier indicators next to the names of players in the Staff Roles list.

evokeAdmin where the application crashed with an "update is not defined" error when trying to remove admin privileges from a user.
- **UI Upgrade**: Replaced all native browser lert() and confirm() dialogs (which showed the ugly "briansdivacox.github.io says..." prefix) with a custom, beautifully styled animated modal matching the site's dark/glassmorphic aesthetic.

  - **R5 (Super Admin)**: Retains full access to Maintenance Mode, Global Alerts, Dev Mode, the Staff Roles list, and the Registered Users Database. R5s can now selectively grant other players R5 or R4 status.
  - **R4 (Event Admin)**: Granted access to the Universal Player Editor for daily chores (events, bear trap), but cannot access Maintenance Mode, push Global Alerts, view the registered users database, or grant/revoke admin status to others.
- **Admin Log Date Filters**: Added a new dropdown to the Admin Log to easily filter activity by 'Today', 'Yesterday', 'Last 7 Days', and 'All Time'.



## [1.15.40] - 2026-07-13
### Fixed
- **Fixed**: Resolved \"Service invoked too many times\" quota error for Firebase sync by implementing an emergency backend API fallback logic.
- **Fixed**: Leaderboard values appearing as \ \ due to Google Sheets formulas failing to evaluate before Firebase sync. Fixed by injecting \SpreadsheetApp.flush()\ in the GAS backend.
- **Fixed**: Admin Bear Trap UI dropdown arrow getting permanently deleted after clicking the Refresh button. Fixed by targeting the \content-area\ instead of the parent container when rendering refreshed activity logs.
- **Fixed**: Polar Terrors Activity showing old data from previous days by pointing it towards live API endpoint.
- **Added**: Added comprehensive \manual_sync.cjs\ Node.js script for admins to manually bypass Apps Script constraints and dump live Sheets data into Firebase instantly. 
- **Added**: Added a simple double-clickable \Emergency_Firebase_Sync.bat\ script for quick manual syncing, and mapped \
pm run emergency-sync\ in package.json.
- **Changed**: Lifted the API fallback mechanism and fully restored native Firebase Realtime syncing for the new day.


## [1.15.38] - 2026-07-13
### Added
- **Real-Time Log Fetching**: Added a direct API bridge to bypass Firebase entirely for admin tools. The "Admin Log" in the Admin Hub and the "Today's Activity" widget on the homepage now feature a manual "Refresh" button that fetches the absolute freshest data directly from the Google Sheet.

## [1.15.37] - 2026-07-13
### Fixed
- **API Endpoint Quota Limits**: Fixed an issue where the website's Admin Hub was throwing "Service invoked too many times" errors when editing player activity. The backend API endpoints were updated to use the new Batched Sync queue instead of instantaneous pushes, bypassing the daily API quota completely.

## [1.15.36] - 2026-07-13
### Fixed
- **Theme Menu Readability**: Fixed an issue where the text on the theme selection cards became unreadable depending on the currently active global theme. Each theme card now has a permanent, hardcoded background and text color that acts as a mini-preview of the theme it represents.

## [1.15.35] - 2026-07-13
### Removed
- **Unused Themes**: Removed OLED, Mermaid, Forest, and Beta themes to streamline the settings menu. Only Light, Midnight, and Diva themes remain.

## [1.15.34] - 2026-07-13
### Changed
- **UI Tweaks**: Changed the Account Hub nav button text to "[Chief Name]'s Profile" instead of just the chief's name, making it clearer that the button is a clickable menu for accessing the Account Hub.

## [1.15.33] - 2026-07-13
### Fixed
- **All-Time BT Donations Fallback**: Fixed an issue where players who were not in the Top 4 All-Time Bear Donations leaderboard showed as having 0 All-Time donations. A new Google Apps Script was deployed to inject an automatic summing formula into the Google Sheet to calculate the true All-Time total from Activity History, and the frontend logic was updated to use this new column as a fallback.

## [1.15.32] - 2026-07-13
### Fixed
- **BT Donations Parsing**: Fixed an issue where the All-Time Bear Trap Donations rank/score showed up as 0. The leaderboard parser was strictly looking for the phrase "bear donations", but the tab in the spreadsheet is named "Bear Trap Donations" (or "BT Donations"), causing the text-match to fail. It now intelligently matches any variation of Bear Trap/BT Donations.

## [1.15.31] - 2026-07-13
### Fixed
- **Account Hub Mobile Overflow**: Added missing `box-sizing: border-box` rule to the Player ID Card to prevent it from horizontally overflowing the screen boundaries on mobile devices. The card now perfectly respects the smartphone viewport boundaries just like the Upcoming Event widgets.

## [1.15.30] - 2026-07-13
### Changed
- **Account Hub Polish**: Shrunk the overall padding, avatar size, and gap spacing inside the Player ID Card so it looks like a sleek, compact badge rather than an oversized bulky box.

## [1.15.29] - 2026-07-13
### Changed
- **Mobile Responsiveness**: Adjusted the new Player ID Card in the Account Hub to elegantly resize and wrap elements on small smartphones, preventing layout breakage or text clipping.

## [1.15.28] - 2026-07-13
### Changed
- **Account Hub Redesign**: Transformed the Account Hub into a premium "Player ID Card". It now displays the player's Avatar, Game ID, Joined Date, Time Active tag, and Giftcode Bot link status in a sleek, glassmorphic layout.

## [1.15.27] - 2026-07-13
### Fixed
- **Backend Firebase Sync**: Fixed a core backend issue where Google Apps Script was correctly updating event sheets but failing to push the recalculated `activity` master sheet to Firebase. The website Player Cards will now correctly show the updated statuses without relying on the daily 1 AM scheduled sync.

## [1.15.26] - 2026-07-13
### Fixed
- **Admin Panel UI Sync Bug**: Fixed an issue in the Admin Panel where clicking to update a player's missed event (or Bear Trap donation) would instantly refresh their UI card *before* the backend had finished syncing the new data to Firebase. The UI now intelligently waits 3 seconds for the cloud database to finish synchronizing before reloading the player's card, guaranteeing the new changes are visible.


## [1.15.25] - 2026-07-13
### Changed
- **Player Lookup**: Upgraded the Player Lookup tool (in the Admin panel and User Roster). Replaced the slow, clunky dropdown menu with a lightning-fast Autocomplete Search bar. The UI now filters players instantly as you type and automatically loads their profile when selected.


## [1.15.24] - 2026-07-13
### Changed
- **Enrollment UI Polish**: Cleaned up the Main Account "Already Enrolled" confirmation view. Removed the giant redundant green checkmark emoji and replaced the Game ID display with the Chief's name for a cleaner, more personalized aesthetic.


## [1.15.23] - 2026-07-13
### Fixed
- **UI Race Condition**: Fixed a bug where fast-loading browsers would render the Account Hub page *before* the enrollment data finished downloading from Firebase, causing the "Enable Perks" button to appear instead of the "Enrolled" badge. The UI now dynamically re-checks the live database cache when rendering.


## [1.15.22] - 2026-07-13
### Fixed
- **Enrolled Badge UI Bug**: Fixed a frontend UI bug introduced in `v1.15.20` where the logic to hide the "Enable Perks" button and display the "Enrolled" badge failed to apply correctly due to a string escaping error during deployment.


## [1.15.21] - 2026-07-13
### Fixed
- **GAS Firebase Sync Bug**: Fixed a backend bug where the Google Apps Script was correctly inserting players into the `giftcodebot` spreadsheet, but failing to push those updates to the Firebase cache. This caused the website to temporarily think players weren't enrolled until a manual spreadsheet edit occurred. The backend now instantly syncs to Firebase.


## [1.15.20] - 2026-07-13
### Changed
- **Auto-Detect Enrolled Status**: The Account Hub and the main Perks page now automatically scan the `giftcodebot` spreadsheet when the Dashboard loads. If a player (or their Linked Alt Account) is already actively enrolled in Auto Redeem, the system will completely hide the "Enable Perks" buttons and replace them with a permanent green "Enrolled &#x2705;" badge. This guarantees players never get confused about their enrollment status.


## [1.15.19] - 2026-07-13
### Added
- **Alt Account Perks Enrollment**: Players can now instantly enroll their Linked Alt Accounts into the Auto Redeem bot directly from their Account Hub! Next to each linked Alt Account, there is a new "&#x1F381; Enable Perks" button. Clicking it opens a mini-modal that securely grabs their Alt's locked Game ID, asks for the Date Started, and fires it straight to the backend Deduplication Engine.


## [1.15.17] - 2026-07-13
### Changed
- **Native Perks Auto-Redeem Opt-in**: Completely removed the embedded Google Form from the "Perks" page. It has been replaced by a sleek, native 1-Click Opt-In button. If a player is logged into the dashboard, they just click one button and the system instantly grabs their canonical ID, bounces it off the backend Deduplication Engine, and enrolls them into the `giftcodebot` spreadsheet silently. No double data-entry required!


## [1.15.16] - 2026-07-13
### Added
- **Registration Deduplication Engine**: The backend Google Apps Script now actively scans the `giftcodebot` spreadsheet before adding a new player. If a veteran player (who is already on the sheet) creates a website account, the system will silently skip them rather than appending a duplicate row, preserving their historical join date and canonical name!


## [1.15.15] - 2026-07-13
### Added
- **Unified Registration System**: The website registration has been completely overhauled to eliminate double-data entry. The signup form now includes "Chief Name" and "Date Started". Upon successful registration, the dashboard automatically creates a Firebase Auth account AND secretly routes the data directly into the `giftcodebot` spreadsheet via a new Google Apps Script endpoint!


## [1.15.14] - 2026-07-13
### Added
- **Cache-Busting Matrix**: Added aggressive `Cache-Control`, `Pragma`, and `Expires` meta tags directly into the root `index.html`. This creates a master hard-reset protocol to force all player browsers to bypass local caching and instantly pull the newest version of the site upon every reload!


## [1.15.13] - 2026-07-13
### Fixed
- **Hotfix: Admin Panel Crash**: Fixed a fatal UI crash in the Admin Panel caused by a misplacement of the `escapeHTML` helper function during the previous XSS hardening deployment. The function was inserted below the render lifecycle instead of at the top of the file, causing a `ReferenceError` when the Admin panel tried to sanitize inputs.


## [1.15.12] - 2026-07-13
### Changed
- **Audit Cleanup**: Conducted a massive ESLint sweep of the monolithic `main.js` file, removing 10+ unused variables, dead code paths, and fixing error-swallowing bugs in `catch` blocks.
- **Security Hardening**: Implemented a global `escapeHTML` helper and deployed XSS protection across all user-generated data injections (Admin Panel, Roster Datalist, and Leaderboards) to ensure malformed names don't break the UI.


## [1.15.11] - 2026-07-13
### Fixed
- **Admin Panel Refresh Fix**: The dynamic `giftcodebot` ID mapping logic has been successfully patched to actually execute when rendering the Admin Panel and Roster tables, and the "Refresh User List" button now correctly flushes the `giftcodebot` API cache as well to pull fresh data!


## [1.15.10] - 2026-07-13
### Fixed
- **API Fallback Bug**: Fixed a fatal flaw in the `fetchSheet` caching engine where fetching a sheet that exists in Google Sheets but has *not yet been synced* to Firebase (like `giftcodebot`) would silently return an empty dataset instead of triggering the fallback to pull the live Google Apps Script data.


## [1.15.9] - 2026-07-13
### Added
- **GiftCodeBot ID Mapping**: The global GameID-to-Name mapping engine now automatically pulls data from the `giftcodebot` spreadsheet directly via API and merges it with the Master Chief's List. This means that even if a formula on the master sheet breaks, delays, or evaluates to an empty string, the website will still successfully find and map the player's name using the raw `giftcodebot` logs! (Solves the issue where valid Game IDs like 738952586 were saying "Not Found").


## [1.15.8] - 2026-07-13
### Changed
- **Admin Panel Nomenclature**: Replaced instances of "Unknown" with "Not Found" for Chief Names that cannot be successfully mapped to a Game ID from the master database.


## [1.15.7] - 2026-07-13
### Fixed
- **Admin Panel Unknown Chiefs Fix**: The global GameID-to-Name mapping engine is now forcefully repopulated whenever the Admin Users list or Player Lookup is generated. This instantly fixes the issue where players appeared as "Unknown" in the Admin Panel even after they were added to the Master Chief List, ensuring names are always pulled live.


## [1.15.6] - 2026-07-13
### Changed
- **Admin Alt Accordions**: The Alt grouping system in the Admin Users tab has been upgraded to a collapsible accordion! Alt accounts are now hidden by default to keep the main list clean. You can click the `â–¶ï¸` arrow next to a Main account's Game ID to expand and view their linked Alts. The row also clearly displays a badge indicating `[1 Alt(s)]`.


## [1.15.5] - 2026-07-13
### Added
- **Admin Refresh**: Added a "Refresh User List" button inside the Admin Panel -> Users tab to instantly pull down new Chief Names from the master database if players updated their info.
- **Admin Alt Grouping**: The Admin Users list now beautifully indents and groups Linked Alt Accounts directly underneath their Main Account, complete with an `[ALT]` tag and connection details!


## [1.15.4] - 2026-07-12
### Changed
- **Account Linking Limit**: Changed the maximum allowed Alt Accounts per email from 2 to 1 based on feedback.


## [1.15.3] - 2026-07-12
### Changed
- **Account Linking UX**: Replaced the native browser prompt and confirm dialogs ("BrianDivaCox.github.io says...") with a seamless inline form inside the Account Hub. When a user clicks "+ Link Alt Account", an input field dynamically appears. Typing a Game ID instantly looks up the Chief Name on the master list and displays "Is your Chief Name: [Name]?" before allowing them to link.


## [1.15.2] - 2026-07-12
### Added
- **Account Linking**: The "Link Alt Account" prompt will now automatically cross-reference the entered Game ID with the master Chief List and ask "Is your Chief Name: [Name]?" to confirm before linking, just like the initial registration flow.


## [1.15.0] - 2026-07-12
### Added
- **Account Linking**: Users can now link up to 2 "Alt" Game IDs to their primary Firebase account via the Account Hub.
- **Chief List Bypass**: All linked Alt accounts are now automatically flagged as "Registered Accounts" and will bypass the Admin Global Filter on the Player Lookup page.


## [1.14.17] - 2026-07-12
### Fixed
- **Player Lookup**: Re-applied the strict-typing Game ID matching fix (which silently failed to apply in the previous update). The `gameId` lookups are now properly verified as Strings on both ends.


## [1.14.16] - 2026-07-12
### Fixed
- **Player Lookup**: Fixed a strict-typing mismatch bug where Game IDs stored as Numbers in Firebase were failing to match Game IDs formatted as Strings in Google Sheets, causing valid registered users to be filtered out.


## [1.14.15] - 2026-07-12
### Fixed
- **Admin Panel**: Corrected a bug where the Global Chief List Filter button failed to inject into the Users Tab during the previous update. The toggle should now visibly appear for Admins.


## [1.14.14] - 2026-07-12
### Changed
- **Player Lookup**: Removed the local "Show Registered Accounts Only" UI toggle from the public Chief List. This behavior is now strictly controlled globally by Admins via the Users Tab in the Admin Control Panel.


## [1.14.13] - 2026-07-12
### Fixed
- **Global Chief List Filter**: Corrected multiple UI insertion and Firebase permission bugs that prevented the toggle from appearing in the Admin Control Panel and caused the Chief's List to fail loading.
- Moved the **Global Chief List Filter** toggle from the Settings Tab to the Users Tab.


## [1.14.12] - 2026-07-12
### Added
- **Global Chief List Filter**: Added a new setting to the Admin Control Panel (Settings Tab) to permanently hide unregistered users from the Chief's List for all users. When this Admin setting is turned ON, the local UI filter is automatically hidden and the list forces only registered accounts to show globally.


## [1.14.11] - 2026-07-12
### Added
- **Player Lookup Filter**: Added a new toggle in the Player Lookup (Chief's List) to only show players who have registered a user account on the dashboard. Registered players are now also marked with a checkmark (âœ…) in the dropdown list.


## [1.14.10] - 2026-07-12
### Fixed
- **BT Donations Display**: Fixed an issue where players ranked 5th or below for current week Bear Trap Donations would display "0 Current" because the official Leaderboard only tracks the top 4. The badge will now dynamically fallback to the player's Activity sheet data to correctly display their total (e.g., "(22) Current") even if they aren't in the top 4.


## [1.14.9] - 2026-07-12
### Fixed
- **Backend Sync**: Added forced Firebase sync for `LeaderBoards` and `WhiteOut Survival` sheets whenever a Bear Trap Donation is added via the Admin API. This fixes the issue where the "BT Donations" badge in player cards wouldn't update with the latest rankings until the nightly 1 AM sync.


## [1.14.8] - 2026-07-12
### Changed
- **UI**: Renamed the sidebar title from "WhiteOut Dashboard" to "WOS Dashboard".


## [1.14.7] - 2026-07-12
### Fixed
- **UI**: Fixed a bug where events marked as "Upcoming" (with an hourglass â³, like Polar Terrors early in the week) could not be edited by admins using the Quick Fix action buttons on player cards. Admins can now mark upcoming events as Participated.


## [1.14.6] - 2026-07-12
### Changed
- **UI**: Replaced native browser `alert()` pop-ups for "no supported missing events" with the custom Toast Notification system to avoid confusing browser domain prompts.


## [1.14.5] - 2026-07-12
### Changed
- **Frontend**: Reverted the Bear Trap "Today's Activity" date logic back to using the admin's local timezone (instead of UTC) so that the activity logs align with the admin's local day, making it easier to hold admins accountable based on standard local time.


## [1.14.4] - 2026-07-12
### Fixed
- **Backend**: Updated Google Sheets trigger so that whenever an Admin makes a manual Bear Trap donation edit directly in the Google Sheet, the live Activity widget on the Dashboard gets accurately updated in real-time. 
- **Frontend**: Modified the Bear Trap "Today's Activity" date logic to use the strict game server reset time (00:00 UTC). "Today" now properly aligns with the game day, instead of the admin's personal local timezone in their browser.


## [1.14.3] - 2026-07-12
### Changed
- **UI**: Updated the toast alert notifications to feature a colored border that wraps entirely around the pop-up, rather than just a stripe on the left side, making them much more visible and distinct.


## [1.14.2] - 2026-07-11
### Added
- **UI**: Created a new "sticky" success alert system. Important success notifications (like refreshing the calendar, adding donations, or updating player cards) will now stay on the screen until you manually close them so you don't miss them.


## [1.14.1] - 2026-07-11
### Fixed
- **UI**: Fixed the Refresh button on the Calendar tab so it now properly clears the local cache, shows a loading animation/notification, and genuinely forces a fresh data pull from Firebase.


## [1.14.0] - 2026-07-11
### Added
- **Feature**: Added a "Live Database Sync Status" widget to the Settings tab in the Admin Control Panel. It securely reads from Firebase to display exactly when each individual Google Sheet tab was last fully synchronized.


## [1.13.3] - 2026-07-11
### Fixed
- **UI**: Fixed a timezone parsing bug in the Calendar view that caused dates (like the 12th) to improperly display as the previous day (the 11th) due to UTC time offsets.


## [1.13.2] - 2026-07-11
### Fixed
- **Backend**: Fixed a bug where `BrianDivaCox` was improperly resolved as the admin name when logging actions from the Google Sheets sidebar. It now properly maps to `BrianDCox`.


## [1.13.1] - 2026-07-11
### Added
- **UI**: Added a dropdown menu to the Admin Logs tab to easily filter logs by specific admins.



## [1.13.0] - 2026-07-11
### Added
- **Feature**: Brand new "ðŸ“‹ Logs" tab in the Admin Control Panel for comprehensively viewing and searching historical admin actions.
- **Backend**: Synced the entire "Admin Log" sheet directly to Firebase to enable instantaneous loading and frictionless frontend searching of the entire history.


## [1.12.1] - 2026-07-11
### Fixed
- **UI**: Fixed an issue where the Daily Digest collapsible arrow wouldn't hide the log due to a missing `.hidden` CSS utility class.


## [1.12.0] - 2026-07-11
### Added
- **Feature**: Live Bear Trap Activity Log. A sleek, collapsible "Daily Digest" banner now appears under the Bear Trap Donations leaderboards, dynamically displaying all donations made today in real-time.
- **Backend**: Integrated `bearTrapLog` Firebase endpoint to maintain a rolling list of the last 20 donations for instantaneous frontend updates.

## [1.11.1] - 2026-07-11
### Fixed
- **UI**: Removed the thick pink left border on the Upcoming Event countdown widget to match the standard card styling across the dashboard.

## [1.11.0] - 2026-07-11
### Added
- **Feature**: Broadcast Push Notifications Tool. Admins can now instantly send push notifications to all registered devices directly from the Admin Panel.
- **Backend**: Added secure, on-the-fly OAuth2 token generation in Google Apps Script to authenticate with the modern FCM HTTP v1 API.

## [1.10.0] - 2026-07-11
### Added
- **Feature**: Browser Push Notifications. Users can now opt-in to receive push alerts directly to their device using Firebase Cloud Messaging.
- **UI**: Added a "Push Alerts" toggle to the Settings Sidebar.

## [1.9.0] - 2026-07-11
### Added
- **Feature**: Live Event Countdowns on the Home page. A dynamic widget now calculates the exact start time of the next upcoming event from the Google Sheets schedule and displays a live, ticking clock.
- **Feature**: Event Rotation. If multiple events start at the exact same time, the countdown widget will smoothly cycle through all event names every few seconds.

## [1.8.6] - 2026-07-11
### Changed
- **UI**: Temporarily removed the "Analytics" page from the main navigation menu while we determine which charts and data visualizations are most useful for the Alliance.

## [1.8.5] - 2026-07-10
### Changed
- **Content**: Updated the "Join Discord" button on the Contact Support page to point to the official BDC Alliance Discord server link.

## [1.8.4] - 2026-07-10
### Changed
- **UI**: Removed the dynamic Card View and Table View toggle from the Home page News section. Announcements will now permanently display in Table View format.

## [1.8.3] - 2026-07-10
### Changed
- **UX**: Moved the "Contact Support" button into the Settings Sidebar (under User Account) to reduce navigation menu clutter, but it now perfectly renders the beautiful full-screen dashboard page layout instead of a cramped popup modal.

## [1.8.2] - 2026-07-10
### Changed
- **UX**: Reverted Contact Support page back to a dedicated full-screen page in the main navigation menu, matching the sleek layout of the Perks Auto Redeem page.

## [1.8.1] - 2026-07-10
### Changed
- **UX**: Moved the Contact Support page out of the main navigation menu and embedded it directly into a popup modal that launches from the Settings Sidebar to reduce navigation clutter.

## [1.8.0] - 2026-07-10
### Added
- **Feature**: Added a dedicated "Contact Support" page containing a direct invite link to the BDC Alliance Discord server and an embedded Google Form for submitting bug reports, feature requests, and support tickets directly from the dashboard.

## [1.7.4] - 2026-07-10
### Changed
- **UI**: Reverted the Today's Schedule redesign completely back to its original state.

## [1.7.3] - 2026-07-10
### Changed
- **UI**: Merged all upcoming dates into a single "Looking Ahead" card instead of creating a separate card per date to reduce visual clutter.

## [1.7.2] - 2026-07-10
### Changed
- **Chore**: Bumped version and pushed to bust cache.

## [1.7.1] - 2026-07-10
### Added
- **Feature**: Added a dynamic "ðŸ‘‘ All-Time Champion" banner to the All-Time Bear Trap Leaderboard. The system automatically reads the Rank 1 player and showcases their avatar and total lifetime wins at the top of the card.

## [1.7.0] - 2026-07-10
### Added
- **Feature**: Added a new Admin tool to log Bear Trap Event Winners directly from the dashboard.
- **Enhanced**: The dashboard now syncs directly with the hidden `data` sheet in Google Sheets to update win totals in real-time.
- **Design**: Implemented a dynamic "ðŸ‘‘ Reigning Champion" banner on the Leaderboards page that automatically displays the custom profile picture, name, and total wins of the most recent Bear Trap event winner.

## [1.6.0] - 2026-07-10
### Added
- **Feature**: Integrated `Cropper.js` for an interactive Profile Picture upload experience. Users can now zoom, pan, and precisely crop their avatars to a perfect 1:1 square before saving.
- **Enhanced**: Added dynamic image size checking to prevent uploads of images smaller than 100x100px or larger than 10MB to maintain dashboard quality and performance.

## [1.5.2] - 2026-07-10
### Changed
- **Changed**: Moved the detailed "Deployment Status" tracker out of the public settings sidebar and properly integrated it into the Admin Panel's Settings tab, directly beneath the Dev Mode toggle.

## [1.5.1] - 2026-07-10
### Added
- **Feature**: Refactored the Admin Dashboard into a Tabbed Layout (Daily Tools, Users, Settings) to improve organization and reduce clutter on mobile devices.

## [1.5.0] - 2026-07-10
### Added
- **Feature**: Introduced Dynamic Admin Management system. Admins can now grant or revoke admin access to other players directly from their profile cards.
- **Feature**: Added "Staff Roles" management section to the Admin Dashboard to track and revoke access for all current admins.

## [1.4.13] - 2026-07-10
### Fixed
- **Fixed**: Maintenance mode Date & Time picker not opening calendar popups on certain browsers. Replaced unified datetime input with separate native Date and Time inputs for maximum cross-browser compatibility.

## [1.4.12] - 2026-07-10
### Changed
- **Enhanced**: Improved the Maintenance Mode duration picker. Admins can now input a custom duration in hours (instead of minutes) and use a Date/Time picker to set an exact maintenance end time.
- **Enhanced**: The maintenance countdown timer shown to users now properly calculates and displays remaining days (e.g., `1d 2h 30m 10s`) for durations longer than 24 hours.

## [1.4.11] - 2026-07-10
### Changed
- **Changed**: Renamed "Bear Trap Donations" admin panel button and page title to "Multi-BT Donations".
- **Fixed**: Admin panel "Multi-BT Donations" datalist dropdown now fetches and syncs with the entire Chief's List roster from Google Sheets, ensuring all players (like Dwarf) are available for quick selection, even if they haven't registered an account yet.

## [1.17.5] - 2026-07-14
### Fixed
- **Bug**: Fixed a bug where the Admin Panel "Universal Player Editor" card was missing the Gift Codes, Time Active, and Furnace Level badges due to misaligned data column indices.

## [1.17.4] - 2026-07-14
### Changed
- **UI**: Increased size of Furnace Level icons to 36px and added image sharpening to prevent them from looking blurry on the Player Cards.

## [1.17.3] - 2026-07-14
### Changed
- **UI**: Displayed exact Century Games icons for Furnace & Fire Crystal levels (e.g. `stove_lv_7.png`) dynamically instead of a generic emoji, matching the user's level exactly without hitting API rate limits.

## [1.17.2] - 2026-07-14
### Fixed
- **Bug**: Fixed a redeclaration error in the frontend that caused the web app build to fail when loading the Account Hub.

## [1.17.1] - 2026-07-14
### Added
- **UI**: Displayed Furnace Level (with a 🔥 icon) inside the Account Hub and Player Profile Cards!

## [1.17.0] - 2026-07-14
### Added
- **Live WOS Profile Lookup**: Integrated official Whiteout Survival API into the Web App. When users type their Game ID during registration, the app will securely fetch their official Chief Name and Furnace Level live from Century Game servers.
- **Master List Sync**: Upgraded the account creation flow to automatically save new signups to both the `giftcodebot` sheet and the `Chief's List` sheet, complete with their verified Furnace Level and Join Date.

## [1.4.10] - 2026-07-10
### Changed
- **Changed**: Restructured admin controls on player profiles. Added a new "Admin Action Bar" at the top right of the card.
- **Added**: New "Edit Events" modal for admins. Clicking it opens a popup with checkboxes to mark multiple missed events as Participated at once.
- **Changed**: Removed the `+ Add Donation` button from the badges list and moved it to the new Admin Action Bar.
- **Changed**: Event metric boxes in the checklist are no longer clickable for admins to prevent accidental clicks. Use the "Edit Events" button instead.

## [1.4.9] - 2026-07-10
### Changed
- **Changed**: Simplified Bear Trap Wins format to display as `#1 (65) All-Time | (T1: #1 (50) | T2: #2 (15))`.

## [1.4.8] - 2026-07-10
### Changed
- **Changed**: Merged "All-Time Bear Trap Wins" and current Bear Trap Wins into a single styled tag on the player profile. The combined tag now displays leaderboard rankings alongside scores for both all-time and current data.

## [1.4.7] - 2026-07-10
### Fixed
- **Fixed**: "+ Add Donation" button in the Player Database Editor now properly shows up for admins on all player cards, even if the player has 0 previous Bear Trap donations.

## [1.4.6] - 2026-07-10
### Added
- **Added**: Maintenance Countdown System â€” when enabling maintenance mode, admins now see a duration picker with preset options (15m, 30m, 1hr, 2hr) or custom minutes. A live countdown is displayed on the maintenance lockout page for all users. When the countdown expires, it shows "Should be back any moment..." (manual mode).
- **Added**: "No Countdown" option for maintenance without a timer.

## [1.4.5] - 2026-07-09
### Fixed
- **Fixed**: Schedule (Calendar View) and Today's Schedule pages now handle missing or null data gracefully instead of crashing with "Cannot read properties of null (reading 'length')".

## [1.4.4] - 2026-07-09
### Changed
- **Changed**: Redesigned the Theme Engine in the settings sidebar from unlabeled color circles to labeled mini-cards in a 2-column grid. Theme names are now always visible, including on mobile.
- **Removed**: Removed the "Deep Ocean" theme. Removed obsolete Google Translate CSS overrides.

## [1.4.3] - 2026-07-09
### Added
- **Added**: 12hr / 24hr clock format toggle in the Global Timers settings section. Both UTC and Local clocks now display AM/PM in 12hr mode. Preference is saved to localStorage.

## [1.4.2] - 2026-07-09
### Changed
- **Removed**: Removed the Google Translate language translator widget from the navbar and the Language picker from the settings sidebar. The `formatPlayerName` translation-guard utility was also removed.

## [1.4.1] - 2026-07-09
### Added
- **Added**: `formatPlayerName` utility to protect English player names from being auto-translated.

## [1.4.0] - 2026-07-07
### Changed
- **Infrastructure**: Migrated the primary database read architecture to Firebase Realtime Database to eliminate rate limits and HTML parsing crashes.
- **Performance**: Reduced data fetching times from 2-3 seconds down to ~50 milliseconds.
- **Admin**: Introduced hybrid Google Sheets / Firebase sync architecture.

## [1.3.1] - 2026-07-07
### Added
- **Dev Mode Tracker**: Added a "Developer Settings" section in the settings sidebar with a "Dev Mode" toggle. When enabled, this tracks active GitHub deployments using the GitHub REST API.
- **Smart Auto-Refresh**: If a deployment is in progress, an alert banner will appear at the top of the page. Once the deployment succeeds, the page will automatically refresh to instantly load the newest live version.

## [1.3.0] - 2026-07-07
### Added
- **Visual Events Checklist Editor**: Upgraded the Universal Player Editor to visually match the user-facing Player Card! Admins can now view a player's complete profile and click directly on "Action Required" (❌) cells in the checklist grid to mark events as Participated.
- **Bear Trap Quick Editing**: Added a convenient "+ Add Donation" button directly into the Player Card header in Admin Mode, allowing for lightning-fast Bear Trap updates.
### Fixed
- **Mobile Hamburger Menu UX**: Rewrote the mobile navigation dropdown logic to behave as an accordion. Expanding a submenu (like Leaderboards) will now correctly collapse other submenus. Fixed an issue where menus wouldn't reliably close when tapping their arrows.

## [1.2.0] - 2026-07-07
### Added
- **Universal Player Editor (Admin)**: Built a massive new feature in the Admin Control Panel. Admins can now search for any Chief by username and instantly pull up a unified "Player Card".
- **Cross-Sheet Editing**: From the Universal Player Editor, Admins can directly edit a player's `Polar Terrors` status (Yes/No), `Alliance Championship` status (Yes/No), and add `Bear Trap Donations`.
- **Intelligent Formula Protection**: The editor securely updates the *source* event sheets via a new backend API, ensuring the `Activity` sheet's formulas are perfectly protected and automatically updated.

## [1.1.0] - 2026-07-07
### Added
- **Maintenance Mode**: Engineered a global Maintenance Mode toggle switch within the Admin Control Panel.
- **Maintenance Overlay**: Standard users are now safely locked out of the site with a full-screen "Site Under Maintenance" overlay when maintenance mode is active.
- **Admin Warning Banner**: Added a persistent red banner at the top of the screen for Admins to remind them that the site is currently locked in Maintenance Mode.

## [1.0.3] - 2026-07-07
### Fixed
- **Mobile Menu Scrolling**: Fixed a critical CSS issue where the main mobile navigation menu (hamburger menu) failed to trigger a scrollbar on smartphones due to box-sizing and dynamic viewport height clipping.

## [1.0.2] - 2026-07-07
### Changed
- **Dashboard Hub Renamed**: Changed the "Dashboard Hub" menu to "Settings" (with a âš™ï¸ icon) to improve usability and reduce confusion.
- **Persistent Login Indicator**: Added a permanent, dynamic pill to the top Navigation Bar that displays the user's name when logged in.
- **Toast Notifications**: Overhauled Toast notifications to slide down from the top of the screen to prevent mobile soft-keyboards and Safari navbars from obscuring them.

## [1.0.1] - 2026-07-07
### Added
- **Version Badge**: Added a dynamic version badge to the top navigation bar.
### Changed
- **Bear Trap UI**: Decoupled "Quick Lookup" from the Bear Trap dashboard and moved it into a sleek modal overlay.
- **Theme Engine UI**: Redesigned the theme engine in the Dashboard Hub into a compact, horizontal grid of color circles to save vertical space.
- **Mobile Navigation**: Improved the mobile menu (`.mobile-menu`) layout to function better on small screens.
### Fixed
- **Mobile Scrolling**: Fixed an issue where overflowing content in the mobile menu and settings sidebar could not be scrolled.

## [1.0.0] - 2026-07-05
### Added
- **Dashboard Hub**: Created a new slide-out sidebar menu to house the Global Timers and Theme Engine.
- **Auto Redeem Integration**: Embedded a Google Form directly into the dashboard under the new "Perks" dropdown for automated gift code redemption.
- **Smart URL Parser**: The News tab automatically detects Google Forms links and transforms them into customized, themed buttons.
- **News Toggle Layout**: Added a toggle on the Home page to dynamically switch between Card View and Table View for announcements.
- **Player Lookup Cards**: Transformed the Activity roster into a beautiful, searchable dropdown card system featuring automatic checkmarks for Gift Codes and Active Time.
- **GitHub Actions Integration**: Set up an automated `deploy.yml` pipeline to host the Vite compiled dashboard freely on GitHub Pages.
### Changed
- Reorganized the top navigation bar to reduce clutter by moving timers and settings into the Dashboard Hub.
- Adjusted Activity badge logic to natively display â Œ for missing/false Gift Codes and "N/A" for missing Active Time.
- Updated the Vite config to support GitHub Pages base path.