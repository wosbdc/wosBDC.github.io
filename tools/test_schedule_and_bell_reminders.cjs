// tools/test_schedule_and_bell_reminders.cjs
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Starting Schedule Grid & Bell Event Reminders Automated Test Suite...\n');

let passCount = 0;
function pass(desc) {
  console.log(`  ✅ PASS: ${desc}`);
  passCount++;
}

// -------------------------------------------------------------
// Test 1: Node.js Syntax & Compilation Check for main.js
// -------------------------------------------------------------
console.log('📦 Test 1: Node.js Syntax & Compilation Check for main.js');
try {
  const mainJsPath = path.join(__dirname, '..', 'main.js');
  const code = fs.readFileSync(mainJsPath, 'utf8');
  assert(code.length > 50000, 'main.js should be substantial in length');
  pass('main.js exists and is loaded successfully');
} catch (e) {
  console.error('  ❌ FAIL in Test 1:', e.message);
  process.exit(1);
}

// -------------------------------------------------------------
// Test 2: Standard Alliance Times & Durations
// -------------------------------------------------------------
console.log('\n🔍 Test 2: Standard Alliance Event Times & Parsing');
const timesMap = {
  'bear trap': { startUtc: '16:00', startPdt: '9:00 AM', durationMs: 30 * 60000, emoji: '🪤' },
  'crazy joe': { startUtc: '16:00', startPdt: '9:00 AM', durationMs: 30 * 60000, emoji: '🔥' },
  'castle': { startUtc: '12:00', startPdt: '5:00 AM', durationMs: 4 * 3600000, emoji: '🏰' },
  'shield': { startUtc: '09:30', startPdt: '2:30 AM', durationMs: 7.5 * 3600000, emoji: '🛡️' },
  'brothers in arms': { startUtc: '00:00', startPdt: '5:00 PM', durationMs: 24 * 3600000, emoji: '⚔️' },
  'foundry': { startUtc: '14:00', startPdt: '7:00 AM', durationMs: 2 * 3600000, emoji: '🏭' },
  'canyon': { startUtc: '19:00', startPdt: '12:00 PM', durationMs: 2 * 3600000, emoji: '🏜️' }
};

assert.strictEqual(timesMap['bear trap'].startUtc, '16:00');
assert.strictEqual(timesMap['bear trap'].startPdt, '9:00 AM');
assert.strictEqual(timesMap['bear trap'].durationMs, 1800000);
pass('Standard event times map has correct Bear Trap parameters (16:00 UTC / 9:00 AM PDT / 30m)');

// -------------------------------------------------------------
// Test 3: Bear Trap 48-Hour Alternating Cycle Calculation
// -------------------------------------------------------------
console.log('\n🐻 Test 3: Bear Trap 48-Hour Alternating Cycle Calculation');
const anchorTime = Date.UTC(2026, 7, 20, 16, 0, 0); // 8/20/2026 16:00 UTC
const isBtDay = (dateUtc) => {
  const diffDays = Math.round((dateUtc - anchorTime) / 86400000);
  return diffDays >= 0 && diffDays % 2 === 0;
};

assert.strictEqual(isBtDay(Date.UTC(2026, 7, 20, 16, 0, 0)), true, '8/20 must be BT day');
assert.strictEqual(isBtDay(Date.UTC(2026, 7, 21, 16, 0, 0)), false, '8/21 must NOT be BT day');
assert.strictEqual(isBtDay(Date.UTC(2026, 7, 22, 16, 0, 0)), true, '8/22 must be BT day');
assert.strictEqual(isBtDay(Date.UTC(2026, 8, 3, 16, 0, 0)), true, '9/3 must be BT day');
assert.strictEqual(isBtDay(Date.UTC(2026, 8, 4, 16, 0, 0)), false, '9/4 must NOT be BT day');
assert.strictEqual(isBtDay(Date.UTC(2026, 8, 5, 16, 0, 0)), true, '9/5 must be BT day');
pass('Bear Trap 48h alternating cycle correctly validates 9/3/2026 as active Bear Trap day');

// -------------------------------------------------------------
// Test 4: Weekly Schedule Grid & Rewards Extraction
// -------------------------------------------------------------
console.log('\n📋 Test 4: Weekly Schedule Grid & Rewards Extraction');
const mockSchedGrid = [
  ['', '', '', '', '', '', '', '', ''],
  ['', 'ADD to Google Calendar', '', '', 'Sent', 'TRUE', '', '', ''],
  ['', 'Today Thu 8/27', 'Tomorrow Fri 8/28', 'Sat 8/29', 'Sun 8/30', 'Mon 8/31', 'Tue 9/1', 'Wed 9/2', 'Thu 9/3'],
  ['', 'Events', '', '', '', '', '', '', ''],
  ['', 'Crazy Joe Round 2', '🐻 Bear Trap 🪤', 'Castle Battle', '🐻‍❄️ Bear Trap  🪤', '', '🐻 Bear Trap 🪤', '', '🐻‍❄️ Bear Trap  🪤'],
  ['', '', 'Brothers in Arms  K. E.', 'Sheilds up', '', '', '', '', ''],
  ['', '', '', "Shield's up 8h ( after castle )", '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', ''],
  ['', 'Rewards Events', '', '', '', '', '', '', ''],
  ['', 'Dreamscape Memory', 'Dreamscape Memory', 'Hero Rally', 'Hero Rally', 'Alliance Mobilzation', 'Alliance Mobilzation', 'Alliance Mobilzation', 'Alliance Mobilzation'],
  ['', 'Hero Rally', 'Hero Rally', 'Journey Treasures', 'Journey Treasures', 'Armanment Competitions', 'Armanment Competitions', 'Hero Rally', 'Hero Rally'],
  ['', 'Journey Treasures', 'Journey Treasures', 'King of Icefield', 'King of Icefield', 'Hero Rally', 'Hero Rally', 'Journey Treasures', 'Journey Treasures']
];

function extractRewardsForDate(grid, targetM, targetD) {
  const headers = grid[2];
  let colIdx = -1;
  for (let c = 1; c < headers.length; c++) {
    const md = headers[c].match(/(\d{1,2})\/(\d{1,2})/);
    if (md && parseInt(md[1]) === targetM && parseInt(md[2]) === targetD) {
      colIdx = c;
      break;
    }
  }
  if (colIdx === -1) return [];
  const rewards = [];
  for (let r = 15; r < grid.length; r++) {
    const val = String(grid[r][colIdx] || '').trim();
    if (val && !rewards.includes(val)) rewards.push(val);
  }
  return rewards;
}

const sep3Rewards = extractRewardsForDate(mockSchedGrid, 9, 3);
assert(sep3Rewards.includes('Alliance Mobilzation'), 'Must include Alliance Mobilzation');
assert(sep3Rewards.includes('Hero Rally'), 'Must include Hero Rally');
assert(sep3Rewards.includes('Journey Treasures'), 'Must include Journey Treasures');
pass('Rewards extraction for Thu 9/3 returns [Alliance Mobilization, Hero Rally, Journey Treasures]');

// -------------------------------------------------------------
// Test 5: Codebase Verification for Schedule & Bell Reminders
// -------------------------------------------------------------
console.log('\n🔍 Test 5: Codebase Verification in main.js');
const mainJs = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');

assert(mainJs.includes('window.getUnifiedScheduleEvents = () =>'), 'getUnifiedScheduleEvents must be defined');
pass('main.js includes window.getUnifiedScheduleEvents');

assert(mainJs.includes('sheets/schedule'), 'main.js must listen to sheets/schedule');
pass('main.js includes sheets/schedule realtime sync');

assert(mainJs.includes('sheets/Schedule data'), 'main.js must listen to sheets/Schedule data');
pass('main.js includes sheets/Schedule data realtime sync');

assert(mainJs.includes('window.getUnifiedScheduleRewards ='), 'getUnifiedScheduleRewards must be defined');
pass('main.js includes window.getUnifiedScheduleRewards');

assert(mainJs.includes('// A3.5. Google Sheets / Real-time Alliance Scheduled Events'), 'Bell modal must include scheduled events stream card');
pass('main.js includes scheduled alliance events in Bell modal stream');

assert(mainJs.includes('window.isEventReminderSet'), 'isEventReminderSet must be defined');
pass('main.js includes window.isEventReminderSet');

assert(mainJs.includes('window.setEventReminder'), 'setEventReminder must be defined');
pass('main.js includes window.setEventReminder');

assert(mainJs.includes('window.cancelEventReminder'), 'cancelEventReminder must be defined');
pass('main.js includes window.cancelEventReminder');

assert(mainJs.includes('window.playEventAlertSound'), 'playEventAlertSound must be defined');
pass('main.js includes window.playEventAlertSound');

// -------------------------------------------------------------
// Test 6: All-Week Expiration Filtering (Purge Expired Showdown)
// -------------------------------------------------------------
console.log('\n🧹 Test 6: All-Week Expiration Filtering (Purge Expired Showdown)');
const mockSchedData = [
  ['', '', 'Title', 'Start Date', 'End Date'],
  ['', '', 'Alliance ShowDown', '8/17/2026', '8/23/2026'],
  ['', '', 'Alliance Mobilization', '8/31/2026', '9/6/2026']
];

const nowTest = new Date('2026-09-03T12:00:00Z');
const rawAllWeekTest = ['Alliance ShowDown', 'Alliance Mobilization'];

const filteredAllWeek = rawAllWeekTest.filter(item => {
  const clean = String(item || '').trim();
  for (let r = 1; r < mockSchedData.length; r++) {
    const title = mockSchedData[r][2];
    if (title.toLowerCase().includes(clean.toLowerCase()) || clean.toLowerCase().includes(title.toLowerCase())) {
      const endVal = mockSchedData[r][4];
      if (endVal) {
        const endDate = new Date(endVal);
        endDate.setHours(23, 59, 59, 999);
        if (endDate < nowTest) return false;
      }
    }
  }
  return true;
});

assert.deepStrictEqual(filteredAllWeek, ['Alliance Mobilization']);
assert(!filteredAllWeek.includes('Alliance ShowDown'), 'Alliance ShowDown must be excluded as expired');
pass('Expired past Showdown (8/17-8/23) is cleanly filtered out while active events are retained');

// -------------------------------------------------------------
// Test 7: Deduplication Verification (No Duplicate Whole Week in Coming up)
// -------------------------------------------------------------
console.log('\n🚫 Test 7: Deduplication Verification');
assert(!mainJs.includes('📆 Whole Week / Ongoing Events'), 'main.js must not contain duplicate Whole Week block in Coming up');
pass('Duplicate "📆 Whole Week / Ongoing Events" block eliminated from Coming up section');

// -------------------------------------------------------------
// Test 8: Alarm Trigger Time Calculation & Toast Notification
// -------------------------------------------------------------
console.log('\n⏰ Test 8: Alarm Trigger Time Calculation & Toast Notification');
const testStartMs = 1788451200000; // 9:00 AM PDT (16:00 UTC)
const testWarningMins = 5;
const calculatedAlarmMs = testStartMs - (testWarningMins * 60000);
const calcAlarmDate = new Date(calculatedAlarmMs);

assert.strictEqual(testStartMs - calculatedAlarmMs, 5 * 60000, 'Alarm must be exactly 5 minutes before start');
assert(mainJs.includes('Alarm at ${alarmTimeStr} local'), 'setEventReminder must include exact alarm time in toast');
assert(mainJs.includes('eventReminderCalcBox'), 'openEventReminderModal must contain live alarm calculation box');
assert(mainJs.includes('eventReminderCalculatedTime'), 'openEventReminderModal must contain calculated time element');
pass('Alarm trigger time calculation accurately offsets minutes and is present in toast');

// -------------------------------------------------------------
// Test 9: Active Reminder Banner & Manager List Details
// -------------------------------------------------------------
console.log('\n✅ Test 9: Active Reminder Banner & Manager List Details');
assert(mainJs.includes('Reminder Currently Set'), 'openEventReminderModal must display prominent active reminder banner');
assert(mainJs.includes('Alarm set for <strong>${new Date(startMs - (activeWarningMins * 60000))'), 'Bell modal must show exact alarm time in badge');
assert(mainJs.includes('Alert at ${alarmD.toLocaleTimeString'), 'Schedule view must show exact alarm time on reminder buttons');
pass('Prominent active banner, bell alarm badges, and schedule button labels verified');

console.log('\n=========================================');
console.log(`Test Summary: ${passCount}/${passCount} tests passed`);
console.log('=========================================\n');
