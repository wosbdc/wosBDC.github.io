# CHANGELOG

## [3.3.32] - 2026-09-08
- 🧹 **Removed Progress Bar**: Stripped cooldown progress bar; countdown timer only.

## [3.3.31] - 2026-09-08
- 🎯 **Trigger Events**: Cooldown box now shows the active event name.
- 🛡️ **Event Blackout**: Shows event name during Bear Trap or Castle Battle.
- 🏷️ **Clean Scope**: Event blackouts display All Bot Accounts target cleanly.
- ⏸️ **Blackout Mode**: Bot Server indicates paused event status without false alarms.

## [3.3.30] - 2026-09-08
- 🏷️ **Renamed Queue**: Renamed inactive queue text to clean None.
- 🏷️ **Renamed Server**: Renamed closed bot server text to clean None.
- 🧹 **Hidden Progress Bar**: Empty progress bar hidden when no queue in progress.
- 🛡️ **Clean Header**: Removed redundant offline status badge from radar title.

## [3.3.29] - 2026-09-08
- 🟢 **Zero Redundancy**: Simplified status pills to clean Online and Offline.
- 🤖 **Consistent Badges**: Fixed compartment headers permanently to 🤖Bots and ⏳ COOLDOWN.
- 📱 **Smart Space**: Compact horizontal layout saves screen space on mobile phones.

## [3.3.28] - 2026-09-08
- 🖥️ **Hub Status Box**: Added dedicated status box for WOS Bot Hub.
- ⚙️ **Server Status Box**: Added dedicated status box for Whiteout Bot Server.
- 📱 **Mobile Optimized**: Responsive 2-column status box grid fits all smartphones.

## [3.3.27] - 2026-09-08
- 🤖 **Bots Badge**: Renamed idle runner compartment badge to 🤖Bots.
- ⏳ **Clean Cooldown**: Renamed rest compartment badge to clean ⏳ COOLDOWN.

## [3.3.26] - 2026-09-08
- 🏷️ **Cooldown Badge**: Added clean IDLE and ON status badge to cooldown.
- 🧹 **Removed Clutter**: Removed all Standby and Cycle Ready words from radar.
- ⏱️ **Clean Clock**: Digital clock shows during countdown and hides when idle.
- 🛡️ **Rotation Queue**: Fallback runner displays Rotation Queue instead of Standby.

## [3.3.25] - 2026-09-08
- ⏱️ **Single Clock**: Removed redundant second countdown timer from cooldown compartment.
- 🧹 **Clean Compartments**: Removed repetitive routine and wilderness status text from runner.
- 🛡️ **Independent Boxes**: Cooldown account never duplicates into active runner box.
- 💤 **Rest Status**: Updated cooldown text to resting between rotation runs.

## [3.3.24] - 2026-09-08
- 🛡️ **Offline Safety**: Fleet matrix marks accounts safe to login when offline.
- 🔴 **Consistent State**: Replaced contradictory occupied pills with automation offline indicator.

## [3.3.23] - 2026-09-07
- 🟢 **Online Green**: Runner box shines green when bot is actively online.
- 🔴 **Offline Red**: Compartment boxes switch to bold red when offline.
- 🤖 **Dynamic Badges**: Compartments dynamically switch between active, standby, and offline.

## [3.3.22] - 2026-09-07
- 🤖 **Radar Clean**: Removed repetitive halted and offline text inside compartments.
- ⏱️ **Calm Standby**: Queue shows peaceful standby when bot server is offline.
- 🔔 **Auto-Hide Events**: Concluded schedule events automatically disappear from bell feed.
- ✕ **Dismiss Events**: Easily dismiss any scheduled event from alerts view.

## [3.3.21] - 2026-09-07
- 🤖 **Dual Radar**: Decoupled live runner from cooldown queue.
- 🟢 **Active Runner**: Shows real-time running bot account.
- ⏳ **Cooldown Queue**: Accurate countdown timer with progress bar.
- 🛡️ **Safety Matrix**: Independent rest and active duty indicators.

## [3.3.20] - 2026-09-07
- 🔕 **Smart Alerts**: Inactive and departed accounts skip token sync reminders.
- 🚫 **Banned Accounts**: Banned characters are exempt from token sync alerts.
- 🎭 **Alt Filtering**: Departed alts never trigger bell sync alerts.
- 📋 **Clean Copy**: Unsynced list excludes departed and banned players.

## [3.3.19] - 2026-09-07
- 🔗 **Alt Manager**: Easily assign alts to any main account.
- ❄️ **Titan Frost**: Restored runaway Frost alt to main account.
- ⚡ **Instant Sync**: Updates database and active roster in real-time.
- 🛠️ **Admin Tools**: Quick alt assignment button in Admin Menu.

## [3.3.18] - 2026-09-07
- 🛡️ **Admin Menu**: Renamed leadership navigation button to Admin Menu.
- 🔗 **Navigation**: Aligned button label with the Admin Menu title.

## [3.3.17] - 2026-09-07
- 🎯 **Unified Roster**: Fallback resolution prevents dropped members in event trackers.
- 👥 **Dwarf 2 Healed**: Restored character profile, game ID, and active event records.
- ⚔️ **Mercenary Prestige**: Standardized roster deduplication and champion lookups across views.
- 🐻 **Bear Trap Sync**: Updated table rendering and donation toggles for alts.
- 🔍 **Alt Indexing**: Automatically maps registered user alts into global lookup maps.

## [3.3.16] - 2026-09-07
- 📋 **Required Type**: Forces members to pick bug or feature.
- 🚫 **Blank Placeholder**: Stops members from submitting without choosing a type.
- 🛠️ **Admin Type Editor**: Reclassify bug or feature directly from admin tables.
- ✏️ **Resolution Note Type**: Change ticket type inside the resolution note editor.

## [3.3.15] - 2026-09-07
- 🐞 **Bug Report Priority**: Positioned Bug Report first and preselected by default.
- 🔒 **Required Category**: Enforced mandatory category selection before feedback ticket submission.
- 🏷️ **Admin Category Editor**: Managers can reclassify miscategorized tickets directly from tables.
- ✏️ **Resolution Note Category**: Update categories directly inside resolution notes modal.

## [3.3.14] - 2026-09-07
- 👥 **Roster Deduplication**: Fixed double-counted chiefs on event Yes and No pages.
- 🛡️ **Accurate Member Totals**: Event trackers display exact active member counts without duplicates.
- ⚡ **Non-Enumerable Aliases**: Preserves instant Game ID lookups without inflating roster collections.
- 🗄️ **Archive Deduplication**: Cleaned cycle snapshot routines to prevent duplicate participant records.

## [3.3.13] - 2026-09-07
- ⚡ **Unified Sync Engine**: Updates all authoritative database nodes synchronously on every change.
- 🔄 **Cache Invalidation**: Instantly purges cached rosters and refreshes active views.
- 🔍 **Dual-Key Lookup**: Resolves member data by Game ID or Chief Name.
- 🛡️ **Furnace Fallback**: Guarantees player profile furnace levels never render blank.
- 🔗 **Alt Account Sync**: Synchronizes alt character unlinks, swaps, and registrations immediately.

## [3.3.12] - 2026-09-07
- 🤖 **Heartbeat Watchdog**: 60-second telemetry watchdog marks bots offline if host disconnects.
- 📡 **Dynamic Health Tags**: Separately displays live Hub and Bot Server connection statuses.
- 🔔 **Leadership Alerts**: Stale telemetry automatically triggers confidential Bell alerts for R4/R5.
- 🧹 **Clean House Protocol**: Enforced strict two-backup retention and pre-backup house cleaning.

## [3.3.11] - 2026-09-07
- 🤖 **Bot Server Detection**: Live dual-app process monitoring alerts when server closes.
- 🔔 **R4/R5 Bell Alerts**: Confidential offline notifications sent exclusively to leadership.
- 📡 **Dual-App Radar Health**: Displays compact live status tags for both programs.
- 🛡️ **Member Privacy**: Regular alliance members never see bot alerts or cards.

## [3.3.10] - 2026-09-07
- 🚀 **CI Build Fix**: Fixed GitHub Pages automated deployment pipeline failure.
- 🌐 **Cross-Platform Test**: Headless test suite now supports cloud CI runners.
- 📦 **Build Pipeline Order**: Vite build generates distribution assets before testing.

## [3.3.9] - 2026-09-07
- 🤖 **Bot Fleet Matrix**: Displays active status for all seven bots.
- ⛔ **Login Safety Warnings**: Red alerts indicate when accounts are occupied.
- ⏳ **Resting Countdowns**: Live timers show cooldowns between bot routines.
- 🟢 **Safe Login Tags**: Clear green tags show accounts safe to use.
- 👥 **Staff View Matrix**: Alliance officers can view fleet safety instantly.

## [3.3.8] - 2026-09-06
- ⚡ **Real-Time Sync**: Radar dynamically updates clock, progress, and stage.
- ⏱️ **Smooth Ticker**: Dynamic countdowns for active routines and cooldowns.
- 🤖 **Instant Refresh**: Telemetry updates instantly when viewing Bots tab.

## [3.3.7] - 2026-09-06
- 🛡️ **Admin Menu Relocation**: Bot Operations Radar moved into Admin Menu Bots tab.
- 🔒 **Restricted Access**: Radar visibility secured exclusively for authorized alliance officers.
- 🔄 **Multi-Account Tracking**: Real-time Firebase sync reflects active rotation bot names.

## [3.3.6] - 2026-09-06
- 🤖 **Bot Operations Radar**: Live bot status and telemetry displayed on Staff page.
- ⚡ **Real-Time Telemetry**: Real-time Firebase sync shows active bots and cooldown countdowns.
- ⏱️ **Smooth Countdown Ticker**: Live second-by-second cooldown timer keeps staff informed.

## [3.3.5] - 2026-09-06
- 🕐 **Split Sidebar Clocks**: Local and UTC clocks share one compact split row.
- 📱 **Clean Sidebar Layout**: Compact clock box saves vertical space in the sidebar.

## [3.3.4] - 2026-09-05
- 🎯 **Precise Round Targeting**: Highlights only the exact round modified by admin.
- 🛡️ **Eliminate Archive Bleed**: Prevents prior season rounds appearing as new changes.
- ⚔️ **Accurate Round 5 Log**: Thadwarf's update isolates Round 5 opponent and scores.

## [3.3.3] - 2026-09-05
- ⚡ **Highlight Changed Battles**: Glowing borders highlight rounds modified by admins.
- 🎯 **Visual Field Badges**: Shows NEW OPPONENT and NEW SCORE tags.
- 🔍 **Filter Modified Only**: One-click toggle hides unchanged battle rounds.
- 📜 **Dynamic Archive Diffs**: Computes exact change deltas from prior archive.

## [3.3.2] - 2026-09-05
- 📜 **Historical Archive Audit**: Recovers archived battle scores and opponent alliances.
- 🛡️ **Clean System Logs**: Non-member updates never batch into zero-chief groups.
- ⚡ **Typing Auto-Save Clean**: Prevents duplicate audit logs while typing scores.
- 🔍 **Accurate Opponent Names**: Modal displays opponent alliances from past updates.

## [3.3.1] - 2026-09-05
- 🏆 **Championship Audit Details**: View complete scores and flags in audit logs.
- 🚩 **Flag Delta Tracking**: Audit logs track flag changes for every update.
- ⚔️ **5-Round Battle Cards**: Interactive popup reveals round-by-round matchup scores and outcomes.
- 📋 **Matchup Summary Copy**: One-click button copies full 5-round results and flags.

## [3.3.0] - 2026-09-03
- 🔄 **Live Sync Telemetry**: Displays real-time sync timestamps for all master sheets.
- ⚡ **Instant Sync Trigger**: Added manual button to synchronize Google Sheets immediately.
- 🔍 **Sync Filters & Search**: Easily filter sheets by today, recent, or search.

## [3.2.9] - 2026-09-03
- 🌐 **Split Time Box**: Local and UTC times share one compact split row.
- 🔔 **Elevated Alert Toaster**: Notification toasts always float above all popups and modals.
- 📅 **Untimed Event Toasts**: Clicking events with no schedule shows clear info toasts.

## [3.2.8] - 2026-09-03
- ⏰ **Exact Alarm Time**: Reminder modal shows calculated alarm trigger time.
- ✅ **Active Reminder Banner**: Highlights active reminder and countdown to alarm.
- 🔔 **Live Trigger Calculator**: Updates alarm time instantly when changing warning minutes.
- 🕒 **Explicit Bell Badges**: Displays exact alarm trigger time on alert cards.

## [3.2.7] - 2026-09-03
- 🧹 **Showdown Purge**: Cleared expired past Alliance Showdown from schedule.
- 📆 **Smart Expiration**: Filters out ended events using sheet date ranges.
- 🚫 **Deduplicate Cards**: Removed redundant duplicate all-week block from upcoming.

## [3.2.6] - 2026-09-03
- 🐻 **Bear Trap Sync**: Active Bear Trap resolved and listed today.
- 🔔 **Bell Event Alerts**: 1-click reminders directly in notification bell.
- 📅 **Live Schedule Grid**: Unified weekly schedule syncs directly from sheets.
- ⏰ **Dynamic Event Countdown**: Real-time ticker tracks today's alliance events.

## [3.2.5] - 2026-09-01
- 🚪 **Alt Departure Unlink**: Departed or banned alts auto-removed from holder page.
- 🚫 **Account Hub Cleaner**: Only active member alts appear on character cards.
- 💾 **Departed Alts Archive**: Retains former alt record history safely in Firebase.
- ⚡ **Cascade Departure**: Main account departure automatically cascades to all alts.

## [3.2.4] - 2026-09-01
- 🎭 **Expand/Collapse Alts**: Toggle arrow on each player to show/hide alts.
- 👥 **Global Alt Toggle**: 1-click button to expand or collapse all alts.
- 🔍 **Smart Alt Search**: Searching for alts auto-reveals matching character rows.
- 🧹 **Clean Member View**: Compact roster view without alt row clutter.

## [3.2.3] - 2026-09-01
- ⚡ **Bulk Multi-Select**: Check multiple members to batch update status.
- 🚀 **Floating Action Bar**: 1-click bulk Active, Left, or Ban toolbar.
- 📋 **Bulk Manager Modal**: Dedicated interactive checklist with quick filter presets.
- 📝 **Paste List Mode**: Batch match and update pasted name lists.
- 🛡️ **Batch Safety**: Confirmation prompts with optional bulk reason notes.

## [3.2.2] - 2026-09-01
- 🛡️ **Membership Lifecycle**: Mark players as Active, Left Alliance, or Banned.
- 🚫 **Event Exclusion**: Former and banned members auto-hidden from all events.
- 🔍 **Status Filters**: Filter member lists by Active, Left, Banned, or Alts.
- ⚡ **1-Click Actions**: Quick dropdown to change status, ban, or restore.
- 💾 **Data Preserved**: Retain former player history without deleting account data.

## [3.2.1] - 2026-08-26
- 🗑️ **Archive Deletion**: Leaders can permanently delete archived Championship seasons.
- ✏️ **Edit Season Info**: Custom titles, records, and flag adjustments.
- ↩️ **Restore to Live**: 1-click restore archived seasons to live tracker.
- 🛡️ **Blank Season Guard**: Prevents accidental empty resets in archive vault.
- 🧹 **Purge Tool**: 1-click purge for all blank test archives.

## [3.2.0] - 2026-08-22
- 📅 **No Date Guard**: Events without times show friendly message.
- 🔕 **Silent Alerts Fixed**: Closing modal no longer triggers alerts.

## [3.1.9] - 2026-08-22
- 🔔 **Event Reminders**: Custom alerts for any scheduled alliance event.
- ⏰ **Pre-Event Timing**: Get warned 0m to 1h beforehand.
- 🎺 **Fanfare Chimes**: Audio fanfare alert when events begin.
- 🔥 **Live Event Ticker**: Real-time countdown for active running events.
- 📅 **1-Tap Subscriptions**: Instant quick reminders for all Bear Traps.

## [3.1.8] - 2026-08-22
- 🔄 **Real-Time Sync**: Live ticket synchronization across all ticket desks.
- 🟡 **Default Open View**: Completed tickets auto-hide from default queue.
- 🔔 **Smart Bell System**: Only unread actionable alerts show up.
- 🧹 **Universal Dismiss**: 1-click Mark All Read and card dismiss.
- ⏱️ **Timer Stream Cleanup**: Inactive timer cards hidden when idle.

## [3.1.7] - 2026-08-22
- 📁 **Google Drive Drop & Go**: Drag & drop auto-uploads video attachments to Google Drive.
- 🛡️ **3-Tier Quota Fallback**: Silent in-database storage fallback if Google Drive quotas hit.
- 🎬 **Drive Streaming Lightbox**: Embedded Drive video streaming with instant poster and downloads.
- 🔗 **Direct Drive Links**: Paste public Google Drive links with zero file limits.

## [3.1.6] - 2026-08-22
- 🎥 **Video Ticket Attachments**: Attach MP4/WebM bug and feature video clips.
- 🎬 **Video Player Lightbox**: Fullscreen video player with playback controls and download.
- 🖼️ **Auto Thumbnail Poster**: Automatically extracts crisp poster frame from uploaded videos.
- 🔗 **External Video Links**: Paste YouTube or Streamable links with zero upload limits.

## [3.1.5] - 2026-08-22
- 🧹 **Name Sanitizer**: Cleans corrupt characters and tags from Showdown names.
- 🔄 **Auto Deduplication**: Merges duplicate records and keeps highest day scores.
- ⚡ **Database Repair**: Auto-migrates legacy and corrupted Firebase player keys.

## [3.1.4] - 2026-08-21
- ⚙️ **Unified Options Menu**: Push settings and timers combined into one menu.
- 📌 **Sidebar Timers Toggle**: Show or hide shield and auto-join widgets.
- ⏱️ **Live Countdown Badges**: Ticking remaining time indicators across all menus.

## [3.1.3] - 2026-08-21
- ⚔️ **Auto-Join Timer**: Added rally auto-join renewal countdown with custom alerts.
- 🔔 **Renewal Push Notifications**: Get alerted before in-game auto-join expires.
- 🎵 **Rally March Chime**: Added harmonic audio alert when auto-join ends.
- 📱 **Sidebar & Stream Cards**: Quick 1-tap 8h restart buttons across dashboard.

## [3.1.2] - 2026-08-21
- 🌐 **Expanded Feeds**: Added PocketTactics, Beebom, and TouchTapPlay scraper sources.
- 🧹 **Noise Filtering**: Upgraded token blacklist to eliminate blog site artifacts.
- ⚡ **Multi-Source Sweeps**: 24/7 bot scans 5 high-speed code feeds concurrently.

## [3.1.1] - 2026-08-21
- 🎯 **Auto-Enrollment**: All members & alts auto-enrolled for gift codes.
- 🔄 **Login Sync**: Background giftcode_bot sync fires every sign-in.
- 🎁 **Dispatcher Upgrade**: Simplified radio filter for target audience.
- 🟢 **Auto-Redeem Badges**: Perks tab shows "Auto-Redeem" status.
- 🔧 **Resync Button**: Admin can 1-click resync claimed members.

## [3.1.0] - 2026-08-21
- 📱 **Fluid Vertical Scrolling**: Smooth full-page vertical scrolling across all rankings tables.
- 👆 **Zero Touch Trapping**: Removed nested scroll constraints on mobile and tablet devices.
- ↔️ **Dual-Axis Responsiveness**: Preserved smooth horizontal swiping with sticky rank/name headers.

## [3.0.9] - 2026-08-21
- ⚡ **Showdown Auto-Save**: Real-time Firebase sync on score edits.
- 📊 **Live Score Recalculation**: Showdown summary table live updates instantly.
- 👾 **Enemy Scores Auto-Save**: Enemy scores save automatically without losing focus.

## [3.0.8] - 2026-08-21
- 🛡️ **Cascade Delete**: Deleting players automatically cleans all 10 event tables.
- 🧹 **Event Orphan Purge**: 1-click tool to purge inactive/test records.

## [3.0.7] - 2026-08-21
- 🏷️ **thadwarf Normalization**: Cleaned duplicate Thadwarf and synced server name.
- 📊 **Accurate Rankings**: Showdown totals now cleanly show single thadwarf.

## [3.0.6] - 2026-08-21
- ⚔️ **Showdown Auto-Save**: Real-time Firebase auto-save on score input.
- ⚡ **Live Sync Status**: Instant visual feedback indicators on every edit.
- 📊 **Instant Recalculation**: Showdown summary table live updates during entry.

## [3.0.5] - 2026-08-20
- 🛡️ **Full Alt Isolation**: Hardened main profile state and in-game avatar isolation.

## [3.0.4] - 2026-08-20
- 🛡️ **Alt Token Isolation**: Protected main profile data during alt account token renewals.

## [3.0.3] - 2026-08-20
- 📱 **Mobile Header Optimization**: Streamlined alerts header for iOS and Android smartphones.

## [3.0.2] - 2026-08-20
- 🎨 **Cleaner Date Inputs**: Removed duplicate faded icons for a clean single button.

## [3.0.1] - 2026-08-20
- 📅 **Click-to-Pick Date & Time**: Click anywhere on input to open calendar picker.

## [3.0.0] - 2026-08-20
- 🛡️ **Shield Terminology**: Replaced all bubble wording with shield across the UI.

## [2.9.99] - 2026-08-20
- 🔴 **Expired Timer Styling**: Render expired timer status in bold alert red.

## [2.9.98] - 2026-08-20
- 🕒 **Live Time Preview**: Real-time UTC to local time conversion in alert modal.

## [2.9.97] - 2026-08-20
- 🛡️ **Shield in Timers Tab**: Integrated Personal Shield directly into Timers tab stream.

## [2.9.96] - 2026-08-20
- 🐻 **1-Click Game Presets**: Instant setup for Bear Trap, Castle, and Crazy Joe.
- 🛡️ **Personal Shield Timer**: Live countdown with custom pre-drop audio & push alerts.
- 🔁 **Auto-Recurring Timers**: Automatic 48-hour Bear Trap and weekly event resets.
- ⚙️ **Event Watchlist**: Customize which alliance event reminders you receive.

## [2.9.95] - 2026-08-20
- 🔔 **Accurate Bell Counter**: Badge count perfectly matches items needing attention.

## [2.9.94] - 2026-08-20
- 💡 **Dynamic Tabs**: Filter tabs only show when active alerts exist.

## [2.9.93] - 2026-08-20
- 🛡️ **Renamed Tab**: Changed 'Tokens' filter tab to compact 'Sync'.

## [2.9.92] - 2026-08-20
- 🏷️ **Clean Alt Cards**: Chief name first with compact Alt tag.
- 🧹 **No Duplicates**: Removed redundant expired status text from cards.

## [2.9.91] - 2026-08-20
- 🔔 **Unified Stream**: Combined all alerts into one continuous feed.
- 🏷️ **Category Tabs**: Quick filter by timers, broadcasts, tokens, or tickets.
- 🎯 **Clean Inbox**: Closed and archived tickets are automatically hidden.
- 🧹 **1-Click Clear**: Mark all notifications as read in one tap.

## [2.9.90] - 2026-08-20
- 🛡️ **Unified Token Status**: Standardized 30-day token expiry detection across website and profiles.
- ⚡ **Accurate Calculations**: Real-time token expiry checks for mains and alts.
- 📊 **Parity Tracking**: Perfect tally alignment across all dropdown filters and tabs.
- 🔄 **Realtime Cache**: Instant profile updates and navbar indicator synchronization.

## [2.9.89] - 2026-08-20
- 🛡️ **Automated Tests**: Auto-verifies version sync across all configuration files.
- 📋 **QA Protocol**: Added comprehensive TESTING.md safety checklist for releases.
- ⚡ **Core Fixes**: Hardened JavaScript AST syntax in ID name mapping.

## [2.9.88] - 2026-08-20
- 🐛 **Admin redirect bug fixed**: Actions stay in admin panel.
- ✅ **Done checkbox**: No longer jumps to public tracker.
- 🗑️ **Delete & vote**: Both fixed to stay in admin view.

## [2.9.87] - 2026-08-20
- 🎫 **Admin Ticket Tabs**: Open, In Progress, Done, Archived, All.
- 🟡 **Open is Default**: Closed tickets hidden from main view.
- 📋 **Live Tab Counts**: Each tab shows real-time ticket count.
- 🚫 **Public Hides Closed**: Completed tickets off by default for members.

## [2.9.83] - 2026-08-19
- 🧠 **Smart Name Sync**: Picks up in-game renames, ignores bad API values.
- 📡 **Discord Token Report**: Scan results post as rich embeds to Discord.
- ❓ **Unclaimed Accounts**: Gatekeeper now lists who hasn't registered.
- 🔢 **Discord 4096 Guard**: Embed auto-truncates if over Discord's limit.

## [2.9.82] - 2026-08-19
- 🛡️ **Name Protection**: Token renewal never overwrites your display name.
- 📋 **Healthy Token List**: Email report now lists all active sync tokens.
- ⚡ **Days Remaining**: Token scan report shows remaining days per token.

## [2.9.81] - 2026-08-19
- 🛡️ **Live Gatekeeper Telemetry**: Fixed active token counting across mains and alts.
- 📊 **Accurate Sync Metrics**: Scans full Firebase user and alt token records.
- ⚡ **Real-Time Discord Sync**: Roster reports display live active token counts.

## [2.9.80] - 2026-08-19
- 🛡️ **Main Account Protection**: Completely isolates main account during alt token renewals.
- 🔑 **Safe Alt Binding**: Binds tokens directly to specific alt account records.
- ⚡ **Dual Modal Isolation**: Dedicated independent verification modals for mains and alts.

## [2.9.79] - 2026-08-19
- 🛡️ **Instant Token Renewal**: Token renewal refreshes profile status and badges immediately.
- 🔄 **Live Expiry Clear**: Clears stale tokenExpired flag upon binding new token.
- ⚡ **Real-Time Account Hub**: Live status re-renders seamlessly without page reload.

## [2.9.78] - 2026-08-19
- 🔑 **Instant Code Entry**: Input active in-game mailbox codes directly.
- 🛡️ **Zero Quota Bypass**: Completely removed Google Apps Script urlfetch fallbacks.
- ⚡ **Enhanced Alt Linking**: Alt code verification input is always accessible.

## [2.9.77] - 2026-08-19
- 🌐 **3-Tier API Waterfall**: Added Vercel Edge Serverless backup proxy tier.
- ⚡ **Zero Quota Exhaustion**: Direct in-game server communication bypasses Google limits.
- 🛡️ **Instant Fallover**: Seamless automatic failover across all verification endpoints.

## [2.9.76] - 2026-08-19
- ⚡ **Seamless In-Game Verification**: Zero timeout verification across all devices.
- 🛡️ **Dual Backend Redundancy**: Central Command and Google Sheets sync automatically.
- 🎁 **Live Gift Code Testing**: Real-time gift code validation directly in admin.

## [2.9.75] - 2026-08-19
- Fixed alt token calculation to reflect true expired status.
- Synchronized Firebase token health with website account manager.

## [2.9.74] - 2026-08-19
- 👥 **41 Chief Roster**: Synced all 41 alliance chiefs across database views.
- 🎭 **Linked Alts Visibility**: View all linked alts with owner badges in database.
- ⭐ **Mains & Alts Tabs**: Switch easily between mains, alts, claimed, and unclaimed.
- 🗑️ **Delete Player Anywhere**: Instantly delete players or alts with one click.

## [2.9.73] - 2026-08-19
- 🛡️ **Live Token Health**: Added real-time token status to player profiles.
- 🔔 **Token Expiry Alerts**: Receive automatic reminders when tokens are expiring.

## [2.9.72] - 2026-08-19
- ⚡ **Central Command API**: Fast zero-timeout backend for instant game sync.
- 🔄 **Instant Game Sync**: Sub-second character verification and stat updates.

## [2.9.71] - 2026-08-19
- 🔥 **Furnace Sync**: Changing furnace levels updates Sheets and Firebase instantly.
- 🛡️ **Alt Editing**: Edit furnace levels and dates for linked alts.

## [2.9.70] - 2026-08-19
- 🎮 **Sync from Game**: Pull live game stats directly inside your profile.
- ⚡ **Token Days Indicator**: View active token days remaining inside your profile.

## [2.9.69] - 2026-08-19
- ⭐ **Mains-Only Filter**: View only primary accounts in Chief Sync sidebar.
- 🎭 **Alt Badges**: Alt cards display their main account owner.

## [2.9.68] - 2026-08-19
- 👥 **Chief Sync Sidebar**: Real-time chief sync sidebar in Google Sheets.
- 📋 **Copy Unsynced**: 1-click copy unsynced member names to clipboard.

## [2.9.67] - 2026-08-19
- 🔔 **Developer Notes**: View resolution notes directly inside notification modal.
- ⭐ **Your Ticket Badge**: Highlights your own submitted tickets.

## [2.9.66] - 2026-08-19
- 📁 **Roster Import**: Drag-and-drop roster import via CSV, JSON, TXT.
- ⚡ **Bulk Sync**: 1-click sync imported players to Firebase.

## [2.9.65] - 2026-08-19
- 📝 **Spacious Note Editor**: Multi-line resolution note editor with template tags.
- ✨ **Styled Notes Display**: Developer notes display in styled emerald callouts.

## [2.9.64] - 2026-08-19
- ☁️ **Background Auto-Save**: Championship matchups and scores auto-save in background.
- 💾 **Live Save Indicator**: Added live cloud synchronization status indicator.

## [2.9.63] - 2026-08-19
- 🔒 **Auto-Calculated Scores**: Matchup status and season flags calculate automatically.
- 🛡️ **Entry Safeguards**: Read-only safeguards prevent accidental score calculation errors.

## [2.9.62] - 2026-08-19
- ⚖️ **Match Draw Support**: Full support for tied rounds across tournaments.
- 📊 **Updated Records**: Tournament summaries format draws cleanly (e.g. 3W–1L–1D).

## [2.9.61] - 2026-08-19
- 🔕 **Cleaner Notification Bell**: Empty notification sections are hidden automatically.
- 🎉 **All Caught Up Card**: Clean summary card displays when all alerts clear.

## [2.9.60] - 2026-08-19
- 🔔 **Bug & Suggestion Alerts**: Feature suggestions and bug reports in notification bell.
- 📋 **In-Modal Previews**: Preview and open feedback items directly from notifications.

## [2.9.59] - 2026-08-19
- 🗑️ **Archive Vault Deletion**: Admin deletion tool to remove test season archives.
- ⚙️ **Clean Season Defaults**: Initialized clean match templates for upcoming tournaments.

## [2.9.58] - 2026-08-18
- 🏆 **Unified Leaderboard**: Merged Dynasty Leaderboard and Hall of Fame.
- 🛡️ **Chief Deduplication**: Resolved duplicate roster entries across tournament archives.

## [2.9.57] - 2026-08-18
- 🥇 **Championship Victory Medals**: Gold medals awarded exclusively for alliance championship titles.
- ⚔️ **Contender Tier**: Added contender status badges and tournament attendance tracking.

## [2.9.56] - 2026-08-18
- 👑 **All-Time Ranks**: Added win rates, tournament wins, and flags leaderboards.
- 🥇 **Golden Medals**: Added golden championship accolades to player profiles.

## [2.9.55] - 2026-08-18
- 🔄 **Event Reset**: 1-click reset for matchups and attendance signups.
- 📜 **Historical Archiving**: Automatically snapshots match records to the vault.

## [2.9.54] - 2026-08-18
- 📷 **Screenshot Attachments**: Attach screenshots to bug reports and suggestions.
- 🖼️ **HD Lightbox Viewer**: Tap image thumbnails to view full-resolution screenshots.

## [2.9.53] - 2026-08-18
- 🚩 **Flag Tracking**: Added flag counts with auto-calculated season totals.
- 🏆 **Public Flag Badges**: Display captured flags on live championship banners.

## [2.9.52] - 2026-08-18
- 💡 **Suggestions & Bug Tracker**: Submit ideas, report bugs, and upvote community posts.
- 🛡️ **Admin Checklist**: Manage tickets with status selectors and note tags.

## [2.9.51] - 2026-08-18
- 🚩 **Round Flags**: Added flag tracking to live battle scorecards.
- 💾 **Automated Cloud Backup**: Flag scores save automatically into Firebase.

## [2.9.50] - 2026-08-18
- 🗓️ **Time Active Standard**: Unified calculation of member play duration across profiles.
- 🔥 **Furnace Centerpiece**: Glowing dynamic Furnace Level icons on player cards.

## [2.9.49] - 2026-08-18
- 🏆 **Standings Loading**: Faster loading and error handling in Account Hub.
- 🥇 **Unified Medals**: Consolidated medal calculations across Bear Trap and Showdown.

## [2.9.48] - 2026-08-18
- 🏆 **Combat Records Fix**: Resolved standings loading in Combat & Records tab.
- ⚡ **Parallel Data Fetch**: Leaderboard archives and live scores load simultaneously.

## [2.9.47] - 2026-08-18
- 🛡️ **1-Tap Quick Shields**: Added 8h and 24h shield toggles with timers.
- 🎯 **Showdown Goals**: Visual progress bars tracking individual showdown target points.

## [2.9.46] - 2026-08-18
- ❄️ **Dedicated Frost Route**: Instant zero-lag loading via dedicated standalone route.
- ❄️ **Touch Checkboxes**: Upgraded showdown checkboxes with large touch targets.

## [2.9.45] - 2026-08-18
- 🚀 **Faster Account Hub**: Eliminated full-database scans for instantaneous profile loading.
- ⚡ **Deep Linking**: Direct `#frost` link opens Frost Clan immediately.

## [2.9.44] - 2026-08-18
- ❄️ **Direct Firebase Loading**: Fast alt loading directly from Firebase database.
- ⚡ **Asset Optimization**: Crisp CSS crystal badges replace missing images.
- 🚀 **Instant Cache**: Offline-ready cache loads alts in 0ms.

## [2.9.43] - 2026-08-18
- 🚫 **Private Frost Clan**: Frost Clan access moved exclusively to Account Hub.
- ⚡ **Instant Account Hub**: Zero-delay profile display with on-demand rankings.

## [2.9.42] - 2026-08-18
- 💾 **Automated Backups**: Nightly snapshot backups across all Firebase databases.
- ⚡ **Central Command Backup**: 1-click database backup button and auto-retention tools.

## [2.9.41] - 2026-08-18
- 📱 **Crystal App Icons**: 3D Amethyst crystal app icons for mobile.
- 👥 **Roster Polish**: Streamlined player management and bulk import tools.

## [2.9.40] - 2026-08-18
- 👥 **Add Player Modal**: Consolidated player entry and bulk roster importing.
- 🧹 **Cleaned Toolbar**: Removed redundant buttons for a compact roster view.

## [2.9.39] - 2026-08-18
- ⚡ **Frost Hub Speed**: Instant loading and zero-delay checkbox updates.
- 🔍 **Live Alt Search**: Search and filter alts in real time.

## [2.9.38] - 2026-08-18
- 🔄 **Active View Memory**: Dashboard remembers your active tab across refreshes.
- 👥 **Manager Enhancements**: Smoother navigation when editing alliance members.

## [2.9.37] - 2026-08-18
- ❄️ **Showdown Tracker**: 1-tap daily showdown checkable boxes for alts.
- 📊 **Progress Counters**: Real-time completion progress tracking for alliance tasks.

## [2.9.36] - 2026-08-18
- 📡 **Live Sync Tracker**: Real-time telemetry and background data sync monitoring.

## [2.9.35] - 2026-08-18
- 🛡️ **Account Hub Polish**: Improved date and profile display handling.
- ⚡ **Roster Reliability**: Hardened member lookups and status indicators.

## [2.9.34] - 2026-08-18
- 🛡️ **Account Verification**: Streamlined character binding for new chiefs.
- 🔗 **Sign-In Polish**: Enhanced automatic profile linking and session state.

## [2.9.33] - 2026-08-18
- 🖼️ **App Icon Switcher**: Choose 3D crystal emblems in Settings.

## [2.9.32] - 2026-08-18
- ⏱️ **Time Active Tracker**: Calculates playing duration directly from join date.

## [2.9.31] - 2026-08-18
- 📱 **Crystal Mobile Icons**: Vibrant high-definition app icons for mobile.

## [2.9.30] - 2026-08-18
- ⚙️ **Mobile Polish**: Improved navigation drawer and smooth mobile scrolling.

## [2.9.29] - 2026-08-18
- 🏰 **Gatekeeper Reports**: Real-time member tracking and live signup updates.
- 👥 **New Member Highlights**: Highlights new joins over the past week.

## [2.9.28] - 2026-08-17
- ✨ **Streamlined Audit Logs**: Clean 4-column layout for reviewing leadership actions.

## [2.9.27] - 2026-08-17
- 🖥️ **Widescreen Workspace**: Expanded layout for viewing detailed logs on desktop.

## [2.9.26] - 2026-08-17
- 👥 **Batch Summaries**: Consolidated multi-member donation logs into summary badges.

## [2.9.25] - 2026-08-17
- 👥 **Batch Action Inspector**: View breakdown cards for batch donations.

## [2.9.24] - 2026-08-17
- 💡 **Audit Hover Previews**: Hover previews showing affected members in batch actions.

## [2.9.23] - 2026-08-17
- 📋 **Redesigned Audit Logs**: Structured timestamps and clean category views.

## [2.9.22] - 2026-08-17
- 📝 **Perks Descriptions**: Clearer explanations of automated rewards.

## [2.9.21] - 2026-08-17
- 🎁 **Member Perks Tab**: View enrolled characters, sync status, and gift codes.

## [2.9.20] - 2026-08-17
- 🗺️ **State Identifiers**: State numbers displayed on Championship cards.
- 🥊 **Opponent Management**: Officers can configure opponent match details easily.

## [2.9.19] - 2026-08-17
- 🏆 **Matchup Badges**: Polished Victory and Defeat badges across match cards.

## [2.9.18] - 2026-08-17
- 🏆 **Championship Dashboard**: 5-round clash tracking with live scores and badges.
- 📂 **History Vault**: Browse historical tournament performances and summaries.

## [2.9.17] - 2026-08-17
- ⚔️ **Showdown Archives**: Complete history and leaderboards for past battles.

## [2.9.16] - 2026-08-17
- 👑 **Leadership Tiers**: Real-time officer detection across the directory.

## [2.9.15] - 2026-08-17
- ➕ **Add Player Shortcut**: Quick-access button in the database toolbar.
- 🎨 **Settings Layout**: Clean 2-column layout for themes and preferences.

## [2.9.14] - 2026-08-17
- 📋 **Batch Reminders**: 1-click export for character token renewal reminders.

## [2.9.13] - 2026-08-17
- 🕐 **Sidebar Event Clocks**: Alliance clocks and event countdowns in sidebar.

## [2.9.12] - 2026-08-17
- 🛡️ **Officer Tools**: Integrated leadership tools inside Account Hub.

## [2.9.11] - 2026-08-17
- 👤 **Quick Sign-In**: Faster transition into your account hub after login.

## [2.9.10] - 2026-08-17
- 🎁 **Smart Gift Codes**: Improved automatic detection of alliance promo codes.

## [2.9.9] - 2026-08-17
- 🏰 **Alliance Gatekeeper**: Custom report edits sync live to alliance channels.
- ⚡ **Furnace Level Sync**: Real-time level tracking across the roster.

## [2.9.8] - 2026-08-17
- 🔐 **Enhanced Sign-In**: Smoother login across mobile and desktop browsers.

## [2.9.7] - 2026-08-17
- 🎯 **Cleaner Navigation**: Streamlined toolbar and quick-access admin controls.

## [2.9.6] - 2026-08-17
- ✨ **Member Directory**: Cleaner visual layout for chief profiles and furnace levels.

## [2.9.5] - 2026-08-16
- 🛡️ **Leadership Suite**: Dedicated 1-click Admin Hub in navbar.
- 👑 **Officer Broadcasts**: Quick-access tools for sending instant push announcements.

## [2.9.4] - 2026-08-16
- ⚡ **Unified Alert Hub**: Structured cards for Timers, Announcements, and Staff Alerts.

## [2.9.3] - 2026-08-16
- ⚡ **Live Timers**: Dedicated countdown timers for active alliance events.

## [2.9.2] - 2026-08-16
- 🔔 **Push Indicators**: Push notification status indicators on members.

## [2.9.1] - 2026-08-16
- 🌐 **Game Time Clocks**: UTC game time with local time conversion.

## [2.9.0] - 2026-08-16
- 🔔 **Broadcast Metrics**: Live device subscriber counts for leadership broadcasts.

## [2.8.0] - 2026-08-16
- ⏳ **Countdown Timers**: Live timers for updates, maintenance, and events.

## [2.7.2] - 2026-08-16
- ⚡ **Quick Actions**: Streamlined actions menu for every player row.

## [2.7.1] - 2026-08-16
- 🔒 **Enhanced Privacy**: Linked alt accounts kept private to account owners.

## [2.7.0] - 2026-08-16
- 👥 **Player Command Center**: Unified member database with auto-filled chief stats.

## [2.6.2] - 2026-08-16
- 🎁 **Gift Codes Hub**: Integrated gift codes management into automated tools.

## [2.6.1] - 2026-08-16
- 🛡️ **Showdown Navigation**: Streamlined Showdown data entry headers.

## [2.6.0] - 2026-08-16
- 🔄 **Event Reset**: 1-click archive and reset for alliance events.

## [2.5.119] - 2026-08-16
- 🖥️ **Admin Gestures**: Smooth horizontal scroll and touch gestures.

## [2.5.118] - 2026-08-16
- 🖥️ **Desktop Layout**: Improved admin navigation on widescreen displays.

## [2.5.117] - 2026-08-16
- ⚡ **Scroll Stability**: Fixed page jumping when toggling tracker rows.

## [2.5.116] - 2026-08-16
- 🛡️ **Championship Signups**: Polished tournament signup toggle buttons.

## [2.5.115] - 2026-08-16
- 🔄 **Cross-Event Sync**: Real-time sync for Championship, Mercenary, and Showdown.

## [2.5.114] - 2026-08-15
- ✏️ **Report Editor**: Added customizable text sections to alliance reports.

## [2.5.113] - 2026-08-15
- 🤖 **Alert Reliability**: Enhanced delivery for automated broadcast reports.

## [2.5.112] - 2026-08-15
- ⚙️ **Auto-Maintenance**: Added nightly maintenance health reporting.

## [2.5.111] - 2026-08-15
- 📊 **Report Editor**: Preview and edit alliance reports before publishing.

## [2.5.110] - 2026-08-15
- 📱 **Mobile Cards**: Fixed card layout and alignment on mobile screens.

## [2.5.109] - 2026-08-15
- 🤖 **Automated Bots**: Centralized bot settings and webhook management.

## [2.5.108] - 2026-08-15
- 🤖 **Bots & Alts**: Added bots management and alt account filters.

## [2.5.91] - 2026-08-15
- 🔍 **Player Lookup**: Improved search matching for names and IDs.
- 🎁 **Auto-Gift Codes**: Enrolled characters automatically receive verified gift codes.

## [2.5.87] - 2026-08-15
- 🧹 **Announcement Cleaning**: 1-click batch cleaning for outdated alerts.

## [2.5.85] - 2026-08-15
- 🔍 **Alt Search**: Search alts in real time by name or ID.

## [2.5.82] - 2026-08-15
- 🔔 **Notification Bell**: Compact push toggle and device test options.

## [2.5.80] - 2026-08-15
- 🏰 **Gatekeeper Hub**: Master alliance overview of members and perks.

## [2.5.75] - 2026-08-15
- 🎁 **Auto-Discovery**: Autonomous detection of new promotional rewards.

## [2.5.70] - 2026-08-15
- 🔔 **Push Controls**: Master toggle with instant test alerts.

## [2.5.69] - 2026-08-15
- 🛡️ **Shield Defense**: Live shield defense counters and 1-tap bulk shielding.

## [2.5.60] - 2026-08-15
- 🎁 **Mass Gift Codes**: Automated reward testing and batch redemption.

## [2.5.59] - 2026-08-14
- ⭐️ **Character Switcher**: 1-click switcher to set active primary character.

## [2.5.56] - 2026-08-14
- 🔥 **Fire Crystal Badges**: Animated flame effects across all badge tiers.

## [2.5.53] - 2026-08-14
- 👤 **Chief Showcase**: Centered showcase for Furnace and Fire Crystal badges.

## [2.5.41] - 2026-08-14
- 🛡️ **Token Alerts**: Clear notifications when sync tokens need renewal.

## [2.5.36] - 2026-08-14
- ⚙️ **Profile Options**: Integrated profile actions into clean options menu.

## [2.5.33] - 2026-08-14
- 🚪 **Full Onboarding**: Seamless registration wizard with game code verification.

## [2.5.31] - 2026-08-14
- 🔗 **Linked Alts**: Dedicated tab for linking secondary characters and perks.

## [2.5.25] - 2026-08-14
- 🔔 **Alerts Overhaul**: Compact token status cards and clean notifications view.

## [2.5.23] - 2026-08-14
- 👤 **Navbar Chief**: Quick-access profile indicator in navigation bar.

## [2.5.16] - 2026-08-14
- 👥 **Users Database**: Clean filter controls and token countdown indicators.

## [2.5.11] - 2026-08-14
- 🔗 **Sync Tokens**: 30-day session tokens with 1-click refresh.

## [2.5.0] - 2026-08-14
- 🔑 **Unified Sign-In**: Quick Google and email authentication.

## [2.3.0] - 2026-08-14
- 🧙 **Onboarding Wizard**: 3-step character registration and verification.

## [2.1.0] - 2026-08-14
- 🎮 **Game Verification**: Real-time ownership verification and avatar syncing.

## [2.0.0] - 2026-08-13
- 🚀 **Next-Gen Architecture**: Faster loading, modern responsive design, and fluid themes.

## [1.98.0] - 2026-08-13
- 🐻 **Bear Trap Logs**: Live event logs and personal damage statistics.

## [1.95.0] - 2026-08-12
- 🎁 **Perks Auto-Claim**: Auto-claim rewards for enrolled main and alt characters.

## [1.90.0] - 2026-08-11
- 👥 **Alliance Directory**: Searchable member directory with furnace level filters.

## [1.80.0] - 2026-08-10
- 📱 **Installable App**: PWA support with offline caching and mobile guides.

## [1.50.0] - 2026-08-08
- 🏆 **Leaderboards**: Live alliance rankings, damage stats, and donation tracking.

## [1.0.0] - 2026-08-01
- ❄️ **Initial Release**: Official companion app for the BDC Alliance.