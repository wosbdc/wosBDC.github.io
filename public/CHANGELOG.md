# CHANGELOG

## [2.9.73] - 2026-08-19
- 🛡️ **Live Token Health**: Added real-time token status and expiration badges to member and alt profiles.
- 🔔 **Token Expiry Alerts**: Receive automatic notification bell reminders when your 30-day game token is expiring.

## [2.9.72] - 2026-08-19
- ⚡ **Central Command API Engine**: Migrated backend tasks to Central Command for zero-timeout performance and instant game syncing.
- 🔄 **Instant In-Game Sync**: Accelerated verification, captchas, and live stats fetching with sub-second response times.

## [2.9.71] - 2026-08-19
- 🔥 **Multi-Store Furnace Sync**: Changing furnace levels now updates Google Sheets and Firebase instantly.
- 🛡️ **Alt Account Level Editing**: Seamlessly edit furnace levels and start dates for linked alts.

## [2.9.70] - 2026-08-19
- 🎮 **Sync from Game**: Added a 1-tap "Sync from Game" button in Edit Profile to pull live furnace level, nickname, and avatar directly from the game.
- ⚡ **Token Status Indicator**: View active token days remaining directly inside your profile.

## [2.9.69] - 2026-08-19
- ⭐ **Mains-Only Filter**: Added a 1-tap filter in the Google Sheets Chief Sync sidebar to view only primary accounts.
- 🎭 **Alt Attribution Badges**: Alt accounts now display their main account owner directly on each card.

## [2.9.68] - 2026-08-19
- 👥 **Chief Sync Sidebar**: Built a real-time Chief Sync status sidebar in Google Sheets with live metrics and 1-click jump-to-row navigation.
- 📋 **Copy Unsynced List**: Quickly copy unsynced member names to your clipboard for alliance announcements.

## [2.9.67] - 2026-08-19
- 🔔 **Developer Notes in Bell Alerts**: View admin resolution notes directly in your notification modal when tickets are updated or resolved.
- ⭐ **Your Ticket Badge**: Highlights your own submitted tickets with a distinct purple badge.

## [2.9.66] - 2026-08-19
- 📁 **Roster File Import**: Import player lists via CSV, JSON, TXT, or TSV with drag-and-drop support.
- ⚡ **1-Click Bulk Sync**: Preview imported players and sync them directly to Firebase and Google Sheets.

## [2.9.65] - 2026-08-19
- 📝 **Spacious Note Editor**: Expanded the ticket resolution note editor with multi-line formatting and quick template tags.
- ✨ **Formatted Public Notes**: Developer resolution notes now display in styled emerald callouts.

## [2.9.64] - 2026-08-19
- ☁️ **Background Auto-Save**: Alliance Championship matchups and scores now automatically save in the background.
- 💾 **Live Save Indicator**: Added dynamic save state indicators showing live cloud synchronization.

## [2.9.63] - 2026-08-19
- 🔒 **Auto-Calculated Scores**: Matchup status and total season flags now calculate automatically as scores are entered.
- 🛡️ **Calculation Safeguards**: Applied read-only safeguards to auto-computed fields to prevent entry errors.

## [2.9.62] - 2026-08-19
- ⚖️ **Match Draw Support**: Added full support for tied rounds across Alliance Championship and tournament archives.
- 📊 **Updated Records**: Matchup records and dynasty stats now format draws cleanly (e.g. 3W – 1L – 1D).

## [2.9.61] - 2026-08-19
- 🔕 **Cleaner Notification Bell**: Empty notification sections are hidden so you only see items requiring attention.
- 🎉 **All Caught Up Card**: Clean summary card displays when all broadcasts and alerts are up to date.

## [2.9.60] - 2026-08-19
- 🔔 **Bug & Suggestion Alerts**: Feature suggestions and bug reports are now included in the notification bell.
- 📋 **Interactive In-Modal Previews**: Preview and open feedback items directly from the notification window.

## [2.9.59] - 2026-08-19
- 🗑️ **Archive Vault Deletion**: Added an admin deletion tool in the Championship Archive Vault to remove test seasons.
- ⚙️ **Clean Season Defaults**: Initialized clean match templates for upcoming tournaments.

## [2.9.58] - 2026-08-18
- 🏆 **Unified Championship Leaderboard**: Merged the Dynasty Leaderboard and Hall of Fame into a single comprehensive view.
- 🛡️ **Chief Deduplication**: Resolved duplicate roster entries across historical tournament archives.

## [2.9.57] - 2026-08-18
- 🥇 **Championship Victory Medals**: Gold champion medals are awarded exclusively when the alliance wins the tournament title.
- ⚔️ **Contender Tier**: Added contender status badges and attendance tracking for participating chiefs.

## [2.9.56] - 2026-08-18
- 👑 **All-Time Championship Ranks**: Added all-time win rates, total tournament wins, and flags captured leaderboards.
- 🥇 **Golden Medals**: Added golden championship accolades styled consistently with Bear Trap rankings.

## [2.9.55] - 2026-08-18
- 🔄 **Championship Event Reset**: 1-click reset for tournament matchups and member attendance signups.
- 📜 **Historical Archiving**: Automatically snapshots match records and rosters to the vault prior to reset.

## [2.9.54] - 2026-08-18
- 📷 **Screenshot Attachments**: Attach screenshots to bug reports and suggestions via drag-and-drop or clipboard paste (`Ctrl+V`).
- 🖼️ **HD Lightbox Viewer**: Tap image thumbnails on feedback cards to view full-resolution screenshots.

## [2.9.53] - 2026-08-18
- 🚩 **Championship Flag Tracking**: Added flag count fields for both alliances with auto-calculated season totals.
- 🏆 **Public Flag Badges**: Display captured flags on the live championship banner and round cards.

## [2.9.52] - 2026-08-18
- 💡 **Suggestions & Bug Tracker**: Submit ideas, report bugs, and upvote community suggestions in the new Feedback Hub.
- 🛡️ **Admin Resolution Checklist**: Manage tickets with status selectors, completion checkboxes, and note tags.

## [2.9.51] - 2026-08-18
- 🚩 **Championship Round Flags**: Added flag tracking to live battle scorecards and archive vault cards.
- 💾 **Automated Cloud Backup**: Flag scores save automatically into Firebase during tournament play.

## [2.9.50] - 2026-08-18
- 🗓️ **Time Active Standard**: Unified calculation of member play duration across all profiles and cards.
- 🔥 **Furnace Centerpiece**: Added glowing dynamic Furnace Level icons on player and alt cards.

## [2.9.49] - 2026-08-18
- 🏆 **Standings & Medals Loading**: Improved data loading speed and error handling in Account Hub rankings.
- 🥇 **Unified Leaderboard Medals**: Consolidated medal calculations across Bear Trap, Showdown, and Championship.

## [2.9.48] - 2026-08-18
- 🏆 **Combat Records Fix**: Resolved standings loading in Account Hub's Combat & Records tab.
- ⚡ **Parallel Data Fetch**: Leaderboard historical archives and live scores now load simultaneously.

## [2.9.47] - 2026-08-18
- 🛡️ **1-Tap Quick Shields**: Added 8h and 24h shield toggles with live countdown timers on Frost Clan alt cards.
- 🎯 **Showdown Target Goals**: Visual progress bars tracking individual showdown points against target goals.

## [2.9.46] - 2026-08-18
- ❄️ **Dedicated Frost Route**: Instant zero-lag loading for Frost Clan via dedicated standalone route.
- ❄️ **Touch-Friendly Checkboxes**: Upgraded showdown checkboxes with large, high-contrast touch targets.

## [2.9.45] - 2026-08-18
- 🚀 **Faster Account Hub**: Eliminated full-database scans for instantaneous profile loading.
- ⚡ **Deep Linking**: Direct `#frost` link support opens Frost Clan Command Center immediately.

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