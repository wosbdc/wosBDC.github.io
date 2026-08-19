# CHANGELOG

## [2.9.53] - 2026-08-18
- 🚩 **Championship Season Details Flag Fields**: Added dedicated flag input fields for both Our Alliance and Opponent Alliance directly inside the **⚙️ Season Details & Overall Record** card (`adm_champ_our_season_flags` and `adm_champ_enemy_season_flags`).
- ⚡ **Auto-Calculate Season Flags & Match Records**: Clicking `⚡ Auto-Calculate Record & Flags` now dynamically aggregates total flag scores across all 5 battle rounds and auto-fills total season flags.
- 🏆 **Prominent Public Flag Summary Banner**: Added a dedicated flag score pill to the Public Alliance Championship top banner (e.g. `🚩 16 Flags Captured | 🚩 9 Opponent Flags`) and styled flag badges on every round card.
- 📜 **Historical Vault Flags**: Updated the Championship Archive Vault modal to cleanly render flag badges and total flags across historical seasons.

## [2.9.52] - 2026-08-18
- 💡 **Alliance Feature Request & Bug Tracker (`views.feedback`)**: Built a full in-app community suggestion & bug reporting system allowing members to submit new requests, report bugs, and dynamically upvote community ideas (`👍`).
- 🛡️ **Interactive Admin Checklist**: Added real-time management controls for R4/R5 managers with 1-click completion checkboxes (`[✓] Done`), status dropdown selectors (*🟡 Under Review ➔ 🔵 In Progress ➔ 🟢 Completed ➔ ⚪ Archived*), admin resolution note tags (e.g. `✨ Implemented in v2.9.52`), and ticket deletion.
- 📱 **Sidebar Menu Integration**: Added a dedicated **💡 Suggestions & Bugs** card in the settings sidebar (`settingsSidebar`) with quick 1-click routing to the tracker on desktop and mobile.
- ⚡ **Admin Hub Integration**: Added `tab-feedback` checklist in the Admin Management Hub and a quick launcher button under Daily Tools.

## [2.9.51] - 2026-08-18
- 🚩 **Alliance Championship Flags Data Entry**: Added dedicated flag count input fields for both Our Alliance [BDC] and Opponent Alliance across all 5-round battle matchups in the Admin Management Suite (`views.championshipAdmin`).
- 🏆 **Dynamic Live & Archived Matchup Flag Badges**: Live score cards on the Public Dashboard (`views.championship`) and Historical Season cards in the Championship Archive Vault modal (`openChampionshipArchiveVaultModal`) now cleanly render flag counts (e.g. `🚩 4 Flags`) alongside total score points.
- 💾 **Automated Cloud Sync & Preservation**: Flag scores are seamlessly structured, validated, and saved into Firebase RTDB (`championship_matchups`) and recorded during season archival (`archiveAndResetChampionshipSeason`).

## [2.9.50] - 2026-08-18
- 🗓️ **Standardized Joined Date & Time Active Duration**: Created universal date calculation helpers (`calculateTimeActive`, `formatDateForDisplay`, `formatDateForInput`, `formatTimeActiveShort`) to reliably compute play duration (days, weeks, months, years) and consistently display joined dates across all primary character cards, alt account cards, and admin member profiles.
- 🔥 **Dynamic Furnace Centerpiece for Characters**: Added prominent, responsive dynamic Furnace Level & Fire Crystal centerpiece icons (`furnace-metric-box`) with glowing ambient borders across Account Hub main profiles and alt accounts.
- ⚡ **Integrated Profile Editing & Live Time Active Previews**: Dynamic live updates in both Chief Member Profile and Alt Profile modals compute exact Time Active values on keystroke / date-picker changes and live-render furnace badges.

## [2.9.49] - 2026-08-18
- 🏆 **Resolved Standings & Medals Lazy-Loading & Error Boundary**: Fully audited `renderAccountRankings` in Account Hub. Scoped `sdFbHistorySnap` and `sdFbLiveSnap` in parallel `Promise.all` queries, wrapped the entire dashboard rendering in a comprehensive error boundary with instant fallback & retry controls.
- 🔒 **Global `escapeHTML` Security Binding**: Declared `escapeHTML` as a first-class lexical module function to eliminate any possible undefined helper references during dynamic DOM injection.
- 🥇 **Live & Historical Medal Calculation**: Unified Gold, Silver, and Bronze medal aggregations across Bear Trap, Spear Donations, Showdown All-Time & Live, and Alliance Championship leaderboards.

## [2.9.48] - 2026-08-18
- 🏆 **Fixed Account Hub Standings & Medals Loading**: Fixed an undeclared snapshot reference in `renderAccountRankings` that prevented historical event standings, medals, and Bear Trap/Showdown ranks from rendering in Account Hub's Combat & Records tab.
- 🥇 **Comprehensive Podium Medal Calculation**: Enhanced the gold, silver, and bronze medal tracker to dynamically include live and all-time Showdown leaderboards alongside Bear Trap wins and spear donations.
- ⚡ **Optimized Parallel Standings Fetch**: Showdown historical archives and live scores now load asynchronously in parallel with Bear Trap and Google Sheets leaderboards.

## [2.9.47] - 2026-08-18
- 🛡️ **Frost Clan 1-Tap Quick Shield Toggles**: Added interactive `🛡️ 24h` and `🛡️ 8h` shield toggles with dynamic live countdown timers on every Frost Clan alt card and BDC Central Command GUI.
- 🎯 **Showdown Target Goal Tracking**: Implemented visual progress bars tracking current Showdown score against target points per alt, with live percentage fill and status indicators.
- 📊 **Combat & Growth Telemetry**: Expanded alt cards with high-contrast, responsive metric cards displaying Power, Kills, Deaths, Total Gathering, and Time Active.
- ⚙️ **Central Command & Cloud Script Automation**: Added mass-shielding actions (`8h Shield All`, `24h Shield All`) and showdown goal configuration handlers across BDC Central Command and Google Apps Script.

## [2.9.46] - 2026-08-18
- ❄️ **Dedicated Standalone Frost View & Zero-Lag Loading**: Resolved the load-blocking issue on the Frost page by establishing a dedicated `views.frost` standalone route, removing blocking database scans in `listenToAuth`, and fixing `isFrostAdmin` permission checks in Account Hub.
- ❄️ **Frost Clan High-Contrast Custom Checkboxes**: Upgraded all showdown task checkboxes with custom 26px high-contrast touch targets, smooth cyan/blue active gradient fills, and glowing white checkmarks.
- 👤 **Refined Character Avatars & Glow Rings**: Upgraded avatar portraits to 48px circles with cyan glowing border rings and high-contrast initial badges as clean fallbacks.
- 🔄 **Account Hub & Alt Sync Terminology Polish**: Unified button labels across Account Hub and Alt Cards to `🔄 Sync Data` and `⚡ Setup 30-Day Token` for clean, cohesive wording.

## [2.9.45] - 2026-08-18
- 🚀 **Eliminated 60-Second Full-Database Scans**: Removed the synchronous `get(ref(db, 'users'))` full-table scan that was triggering in Account Hub during user resolution. Added `localStorage` profile caching and targeted UID lookups with a 1.5s timeout.
- ⚡ **Direct `#frost` and `?view=frost` Deep-Linking**: Visiting `https://wosbdc.github.io/#frost` or `?view=frost` directly opens the Frost Clan Command Center instantly.
- ❄️ **Accelerated Google Apps Script `FrostApp.html`**: Replaced slow `google.script.run` RPC queries with direct client-side fetch from Firebase RTDB (`frost_clan/alts`) for sub-50ms execution.

## [2.9.44] - 2026-08-18
- ❄️ **Frost Clan Zero-Latency Direct Firebase Loading**: Completely audited the Frost Clan Command Center. Seeded all alt data permanently to `/frost_clan/alts` in Firebase Realtime Database and removed all slow Google Apps Script HTTP calls.
- ⚡ **Zero-404 Asset Optimization**: Replaced missing image asset requests with fast CSS crystal badges, eliminating network request stalls.
- 🚀 **Instant Offline-Ready Cache**: Added `localStorage` cache-first hydration so opening Frost Clan renders all alts in **0ms**.

## [2.9.43] - 2026-08-18
- 🚫 **Navbar Clean-Up**: Completely removed the secret Frost Clan button from the main navigation bar. Frost Clan Command Center is now exclusively and privately accessed through the **Account Hub** tab.
- ⚡ **Instant Account Hub Rendering**: Eliminated blocking pre-render database fetches in Account Hub, allowing the user profile to display in **0ms** while heavy ranking and leaderboard datasets are lazy-loaded on demand.
- 🚀 **Instant Frost Clan Caching**: Implemented automatic local caching for Frost Clan alts to provide instantaneous, zero-spinner rendering upon tab switch.

## [2.9.42] - 2026-08-18
- 💾 **Multi-Project Firebase Backup Engine**: Automated nightly full snapshot backups across all Firebase Realtime Databases (`wos-dashboard-38d4c` & `livecounters-8eaa8`).
- ⚡ **BDC Central Command Integration**: Added 1-click `💾 Backup DB` quick-action button, live DB Backup metric card, and automatic 24h background daemon thread.
- 🗄️ **Rolling 30-Day Auto-Retention**: Local timestamped archives (`backups/`) with automatic pruning of backups older than 30 days.
- 🛠️ **CLI & Restore Tools**: Added `tools/firebase_backup_restore.py` supporting `--backup`, `--list`, and `--restore` operations.

## [2.9.41] - 2026-08-18
- 📱 **Official Crystal App Icons**: Added high-definition 3D Amethyst crystal app icons for mobile home screens and desktop shortcuts.
- 📜 **Changelog Improvements**: Polished modal overlay and added 1-tap changelog access across navigation bar and settings.
- 👥 **Streamlined Player Management**: Cleaned up the Alliance Members toolbar and unified single and bulk player workflows.
- 🎨 **Header & Navigation Polish**: Restored clean alliance branding and streamlined launcher icons.

## [2.9.40] - 2026-08-18
- 👥 **Unified Add Player Modal**: Consolidated single player entry and bulk roster importing into one clean popup.
- 🧹 **Alliance Roster Toolbar**: Removed redundant toolbar buttons to keep the roster view compact and focused.

## [2.9.39] - 2026-08-18
- ⚡ **Frost Clan Hub Performance**: Instant loading and zero-delay checkbox updates across all devices.
- 🔍 **Live Alt Search**: Quickly search and filter alts by name in real time.
- ⚔️ **Task Quick-Filters**: 1-tap filters to easily check which alts need daily showdown tasks or shields.
- 🕵️ **Discreet Launcher**: Added a private, streamlined launcher for Frost Clan operations.

## [2.9.38] - 2026-08-18
- 🔄 **Active View Persistence**: The dashboard now remembers your active view and tab across page refreshes.
- 👥 **Manager Workflow Enhancements**: Smooth navigation when adding or updating multiple alliance members.

## [2.9.37] - 2026-08-18
- ❄️ **Frost Clan Showdown Tracker**: Added 1-tap daily showdown checkable boxes for each alt card.
- 📊 **Showdown Progress Counters**: Real-time completion progress tracking for alliance tasks.

## [2.9.36] - 2026-08-18
- 📡 **Live Sync Tracker**: Added real-time telemetry and background data sync status monitoring.
- ⚡ **Enhanced Connectivity**: Improved data freshness and live synchronization reliability.

## [2.9.35] - 2026-08-18
- 🛡️ **Account Hub Polish**: Improved date and profile display handling for all player profiles.
- ⚡ **Roster Reliability**: Hardened member lookups and status indicators across alliance event managers.

## [2.9.34] - 2026-08-18
- 🛡️ **Account Verification Flow**: Streamlined verification and character binding for new and returning chiefs.
- 🔗 **Google Sign-In Polish**: Enhanced automatic profile linking and session state handling.

## [2.9.33] - 2026-08-18
- 🖼️ **Interactive App Icon Switcher**: Choose from multiple 3D Amethyst crystal emblems in Settings.
- 🔄 **Real-Time Visual Customization**: Instant dynamic updates for brand emblems and browser icons.

## [2.9.32] - 2026-08-18
- ⏱️ **Dynamic Time Active Tracker**: Automatically calculates your exact playing duration directly from your join date.
- 📅 **Smarter Date Display**: Formats join dates and time active durations cleanly across all profile cards.

## [2.9.31] - 2026-08-18
- 📱 **Amethyst Crystal Mobile Icons**: Added vibrant high-definition app icons for mobile home screens.
- 🍏 **iOS Home Screen Support**: Crisp, high-resolution app tiles on iPhones and iPads.

## [2.9.30] - 2026-08-18
- ⚙️ **Settings & Mobile Polish**: Improved navigation drawer behavior and smooth mobile scrolling.

## [2.9.29] - 2026-08-18
- 🏰 **Live Gatekeeper Reports**: Real-time member tracking and live signup updates for alliance leadership.
- 👥 **New Member Highlights**: Highlights new joins and alliance growth over the past 7 days.

## [2.9.28] - 2026-08-17
- ✨ **Streamlined Audit Logs**: Clean 4-column layout for clearer review of leadership actions.
- 🏷️ **Target Chief Badges**: Clear visual chips and badges for multi-member actions.

## [2.9.27] - 2026-08-17
- 🖥️ **Widescreen Admin Workspace**: Expanded layout for viewing detailed alliance logs on desktops and tablets.
- 📜 **Smooth Navigation**: High-contrast scrollbars and sticky column headers for easier browsing.

## [2.9.26] - 2026-08-17
- 👥 **Batch Action Summaries**: Consolidated multi-member donation logs into interactive summary badges.

## [2.9.25] - 2026-08-17
- 👥 **Batch Action Inspector**: View detailed breakdown cards for batch donations with 1-click clipboard copy.

## [2.9.24] - 2026-08-17
- 💡 **Audit Hover Previews**: Quick hover previews showing affected members in batch actions.

## [2.9.23] - 2026-08-17
- 📋 **Redesigned Audit Logs**: Structured timestamps, semantic category icons, and clean hierarchical views.

## [2.9.22] - 2026-08-17
- 📝 **Member Perks Descriptions**: Clearer explanations of automated rewards and in-game deliveries.

## [2.9.21] - 2026-08-17
- 🎁 **Account Hub Member Perks**: Dedicated perks tab showing enrolled characters, sync status, and recent gift codes.
- 🧹 **Cleaned Header**: Streamlined top navigation by unifying perks into Account Hub.

## [2.9.20] - 2026-08-17
- 🗺️ **Alliance State Identifiers**: Clear state numbers displayed on Championship matchup cards.
- 🥊 **Championship Opponent Management**: Officers can configure opponent states and match details easily.

## [2.9.19] - 2026-08-17
- 🏆 **Centered Matchup Badges**: Polished Victory and Defeat badges across tournament match cards.
- 🎯 **Streamlined Tournament Header**: Clean win/loss record overview without duplicate headers.

## [2.9.18] - 2026-08-17
- 🏆 **Alliance Championship Dashboard**: 5-round clash tracking with live scores, opponent tags, and outcome badges.
- ⚔️ **Championship Score Manager**: Officer tools for managing tournament signups, scores, and seasonal archives.
- 📂 **Championship History Vault**: Browse historical tournament performances and season summaries.

## [2.9.17] - 2026-08-17
- ⚔️ **Showdown Battle Archives**: Complete history and leaderboards for past alliance showdown battles.
- 🛡️ **Showdown Vault Tools**: 1-click database restore and archive maintenance tools.

## [2.9.16] - 2026-08-17
- 👑 **Dynamic Leadership Tiers**: Real-time officer detection across the directory and member profiles.
- 🛡️ **Profile Claim Badges**: Visual indicators and quick links for claimed officer profiles.

## [2.9.15] - 2026-08-17
- ➕ **Add Player Shortcut**: Quick-access button in the player database toolbar.
- 🔍 **Player ID Lookup**: Improved in-game player ID verification.
- 🎨 **Settings Layout**: Clean 2-column layout for themes, modes, and display preferences.

## [2.9.14] - 2026-08-17
- 📋 **Batch Copy Token Reminders**: 1-click export to remind members when character tokens need renewal.
- 🎯 **Smart Filter Export**: Export lists matching your active member filter selection.

## [2.9.13] - 2026-08-17
- 🕐 **Sidebar Event Clocks**: Alliance clocks, UTC time, and event countdowns positioned at the top of the sidebar.
- 👤 **Unified Account Hub**: Consolidated profile and character settings into a single place.

## [2.9.12] - 2026-08-17
- 🛡️ **Officer Tools**: Integrated leadership tools directly inside the Account Hub and Settings.
- ✨ **Streamlined Navigation**: Polished top navigation header and mobile drawer.

## [2.9.11] - 2026-08-17
- 👤 **Quick Sign-In**: Faster transition into your account hub after logging in.
- 🚀 **Character Overview**: Instant glance at linked characters, alts, and gift code rewards.

## [2.9.10] - 2026-08-17
- 🎁 **Smart Gift Codes**: Improved automatic detection of active alliance promo codes.
- 🧪 **Live Code Auditing**: 1-click verification tool to test gift codes in real time.

## [2.9.9] - 2026-08-17
- 🏰 **Alliance Gatekeeper**: Custom report edits and leadership directives now sync live to alliance channels.
- ⚡ **Furnace Level Sync**: Seamless real-time level tracking across the Alliance Roster.
- 🚀 **Performance Improvements**: Faster data sync and enhanced reliability across all tools.

## [2.9.8] - 2026-08-17
- 🔐 **Enhanced Login Experience**: Smoother sign-in across mobile and desktop browsers.
- 🛠️ **Account Diagnostics**: Clearer connection troubleshooting and guidance.

## [2.9.7] - 2026-08-17
- 🎯 **Cleaner Navigation**: Streamlined toolbar and quick-access admin controls.
- 📱 **Mobile Drawer**: Improved navigation drawer layout on mobile devices.

## [2.9.6] - 2026-08-17
- ✨ **Member Directory**: Cleaner visual layout for chief profiles, furnace levels, and notification status.
- 🛡️ **Table Hierarchy**: Streamlined roster overview for alliance officers.

## [2.9.5] - 2026-08-16
- 🛡️ **Leadership Suite**: Dedicated 1-click Admin Hub in navbar and mobile drawer for officers.
- 📱 **Streamlined Push Notifications**: Dedicated status pill for device alerts and testing.
- 👑 **Officer Broadcasts**: Quick-access tools for sending instant push announcements.
- ⚙️ **4-Card Settings Sidebar**: Organized sections for Account, Preferences, Clocks, and Leadership.

## [2.9.4] - 2026-08-16
- ⚡ **Unified Alert Hub**: Structured cards for Scheduled Timers, Leadership Announcements, and Staff Alerts.
- 🚀 **Alert Creator**: Single streamlined popup for scheduling announcements and event timers.

## [2.9.3] - 2026-08-16
- ⚡ **Live Timers & Events**: Added dedicated countdown timers container to notification alerts.
- 🏷️ **Live Status Badges**: Dynamic status badges for active and ongoing alliance events.

## [2.9.2] - 2026-08-16
- 🔔 **Push Notification Badges**: Added push notification status indicators to member management.
- 🎯 **Notification Filters**: Easily filter members by notification enablement status.

## [2.9.1] - 2026-08-16
- 🌐 **Game Time Clocks**: Added UTC game time entry with instant conversion to your local time.
- ⚡ **Quick-Fill Presets**: 1-click presets for Daily Reset, Maintenance, and Bear Trap.

## [2.9.0] - 2026-08-16
- 🔔 **Broadcast Metrics**: Live device subscriber counts for leadership broadcast tools.
- 🚀 **Preset Alert Templates**: 1-click templates for Bear Trap, Shields Up, and Alliance Events.

## [2.8.0] - 2026-08-16
- ⏳ **Live Countdown Timers**: Countdown timers for game updates, maintenance, and alliance events.
- 🚨 **Notification Badges**: Pulsing countdown indicators in the top navigation bar.

## [2.7.2] - 2026-08-16
- ⚡ **Quick Member Actions**: Streamlined actions menu for every player row.
- 📱 **Mobile Table Polish**: Improved layout and prevented clipping on smaller screens.

## [2.7.1] - 2026-08-16
- 🔒 **Enhanced Privacy**: Linked alt accounts are kept strictly private to account owners.

## [2.7.0] - 2026-08-16
- 👥 **Player Command Center**: Unified member database with verification to auto-fill Chief Name and Furnace Level.
- 🔍 **Smart Sorting**: Sort members by Name, Furnace Level, and Event Signups.

## [2.6.2] - 2026-08-16
- 🎁 **Alliance Gift Codes**: Integrated gift codes management into the automated tools hub.
- 🧹 **Menu Polish**: Cleaned up top navigation controls.

## [2.6.1] - 2026-08-16
- 🛡️ **Showdown Navigation**: Streamlined Showdown data entry headers and shortcuts.

## [2.6.0] - 2026-08-16
- 🔄 **Event Archive & Reset**: 1-click archive and reset for Bear Trap, Championship, and Mercenary events.
- 📊 **Multi-Event Activity Matrix**: Comprehensive participation and activity overview.

## [2.5.119] - 2026-08-16
- 🖥️ **Admin Menu Gestures**: Added smooth horizontal scroll and touch gestures for admin controls.

## [2.5.118] - 2026-08-16
- 🖥️ **Desktop Layout**: Improved admin navigation across widescreen displays.

## [2.5.117] - 2026-08-16
- ⚡ **Scroll Stability**: Fixed page scroll position jumping when toggling tracker rows.

## [2.5.116] - 2026-08-16
- 🛡️ **Championship Signups**: Polished tournament signup toggle buttons.

## [2.5.115] - 2026-08-16
- 🔄 **Cross-Event Sync**: Real-time sync for Championship, Mercenary, and Showdown events.

## [2.5.114] - 2026-08-15
- ✏️ **Report Editor**: Added customizable text sections to alliance reports.

## [2.5.113] - 2026-08-15
- 🤖 **Alliance Alerts Reliability**: Enhanced delivery and formatting for automated broadcast reports.

## [2.5.112] - 2026-08-15
- ⚙️ **Automated Maintenance**: Added nightly maintenance status and health reporting.

## [2.5.111] - 2026-08-15
- 📊 **Interactive Report Editor**: Preview and edit alliance reports before publishing.

## [2.5.110] - 2026-08-15
- 📱 **Mobile Card Polish**: Fixed card layout and text alignment on mobile screens.

## [2.5.109] - 2026-08-15
- 🤖 **Automated Bots Hub**: Centralized bot settings and webhook management.

## [2.5.108] - 2026-08-15
- 🤖 **Bots Hub & Alt Filters**: Added dedicated bots management and alt account filters.

## [2.5.91] - 2026-08-15
- 🔍 **Resilient Player Lookup**: Improved search matching for player names and character IDs.
- 🎁 **Automatic Gift Code Perks**: Enrolled characters now automatically receive verified gift code perks.

## [2.5.87] - 2026-08-15
- 🧹 **Announcement Management**: Added 1-click removal and batch cleaning for outdated alerts.
- 🔒 **Claimed Accounts Protection**: Verified rewards dispatch to claimed characters and alts.

## [2.5.85] - 2026-08-15
- 🔍 **Alt Account Search & Filters**: Search alts in real time by name or ID, with filters for active sync and perks.
- ⏱️ **Time Active for Alts**: Accurate time-active duration calculations for all linked characters.

## [2.5.82] - 2026-08-15
- 🔔 **Streamlined Notification Bell**: Compact push notification toggle and quick device test options.
- 📋 **Prioritized Action Items**: Prominently highlights expiring sync tokens and pending actions.

## [2.5.80] - 2026-08-15
- 🏰 **Alliance Gatekeeper Hub**: Master alliance overview showcasing total members, recent signups, and active perks.

## [2.5.75] - 2026-08-15
- 🎁 **Automated Perks Discovery**: Autonomous detection and verification of new promotional rewards.
- ⚡ **1-Tap Reward Dispatch**: Distribute active promo rewards to enrolled alliance members in seconds.

## [2.5.70] - 2026-08-15
- 🔔 **Push Notification Controls**: Master status toggle with instant test alerts and topic preferences.
- ⚙️ **Cleaner Sidebar**: Streamlined settings menu for a faster and smoother navigation experience.

## [2.5.69] - 2026-08-15
- 🛡️ **Frost Clan Shield Coverage**: Live shield defense counters, quick-filter tags, and 1-tap bulk shielding.
- 📢 **Broadcast Quick-Templates**: 1-click alert templates for Shields Up, Bear Trap, and Daily Reset.

## [2.5.60] - 2026-08-15
- 🎁 **Mass Gift Code Dispatcher**: Automated reward testing, progress tracking, and batch redemption for alliance members.

## [2.5.59] - 2026-08-14
- ⭐️ **Primary Character Switcher**: 1-click switcher to set your active primary character.
- 🛠️ **Character ID Repair Wizard**: Real-time character lookup and profile preview when adjusting IDs.

## [2.5.56] - 2026-08-14
- 🔥 **Fire Crystal Badge Engine**: Smooth animated flame effects and high-DPI display rendering across all badge tiers.

## [2.5.53] - 2026-08-14
- 👤 **Chief Profile Showcase**: Centered showcase for Furnace and Fire Crystal badges on mobile and desktop.

## [2.5.41] - 2026-08-14
- 🛡️ **Session Token Alerts**: Clear notifications when character sync tokens need renewal.
- 🎨 **Visual Refresh**: Polished frost blue and crisp white styling across all dialogs.

## [2.5.36] - 2026-08-14
- ⚙️ **Streamlined Profile Card**: Integrated profile actions into a clean options menu.
- 🔥 **Furnace Level Sync**: Improved level mapping across standard and Fire Crystal tiers.

## [2.5.33] - 2026-08-14
- 🚪 **Full-Page Sign In & Registration**: Seamless multi-step onboarding wizard for new chiefs.
- 🔐 **Secure Verification**: Verify game ownership with in-game mailbox confirmation codes.

## [2.5.31] - 2026-08-14
- 🔗 **Linked Alts Hub**: Dedicated tab for linking secondary characters, checking sync status, and managing perks.

## [2.5.25] - 2026-08-14
- 🔔 **Alliance Alerts Overhaul**: Compact token status cards and clean "All Caught Up" notifications view.
- 🛡️ **Staff Signup Feed**: Expandable new-member activity feed for alliance officers.

## [2.5.23] - 2026-08-14
- 👤 **Navbar Chief Indicator**: Quick-access profile indicator in the top navigation bar.
- 📱 **Mobile Optimization**: Responsive spacing, notch safe areas, and touch-friendly controls.

## [2.5.16] - 2026-08-14
- 👥 **Registered Users Database**: Clean filter controls and token countdown indicators for alliance managers.

## [2.5.11] - 2026-08-14
- 🔗 **Character Sync Tokens**: 30-day session tokens with 1-click refresh for main and alt accounts.
- 🌐 **Clear Status Messages**: Friendly English notifications for server statuses and updates.

## [2.5.0] - 2026-08-14
- 🔑 **Unified Sign-In**: Quick Google and email authentication with theme-adaptive styles.

## [2.3.0] - 2026-08-14
- 🧙 **Chief Onboarding Wizard**: 3-step character registration and verification with in-game code confirmation.

## [2.1.0] - 2026-08-14
- 🎮 **In-Game Verification**: Real-time character ownership verification, furnace level detection, and avatar syncing.

## [2.0.0] - 2026-08-13
- 🚀 **Next-Gen Dashboard**: Major architecture upgrade with faster loading, modern responsive design, and fluid themes.

## [1.98.0] - 2026-08-13
- 🐻 **Bear Trap & Event Tracking**: Live event logs, personal damage statistics, and participation history.

## [1.95.0] - 2026-08-12
- 🎁 **Automated Perks Enrollment**: Auto-claim rewards for enrolled main and secondary characters.

## [1.90.0] - 2026-08-11
- 👥 **Alliance Directory**: Searchable member directory with furnace level filters and officer controls.

## [1.80.0] - 2026-08-10
- 📱 **Installable Web App**: PWA support with offline caching, mobile installation guides, and auto-updates.

## [1.50.0] - 2026-08-08
- 🏆 **Leaderboards & Activity**: Live alliance rankings, damage stats, and donation tracking.

## [1.0.0] - 2026-08-01
- ❄️ **Initial Release**: The official dashboard and companion app for the BDC Alliance.