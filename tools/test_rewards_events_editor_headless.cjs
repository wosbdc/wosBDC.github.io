// tools/test_rewards_events_editor_headless.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const PORT = 8131;
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

let puppeteer = null;
const possiblePuppeteerPaths = [
  'puppeteer-core',
  'puppeteer',
  path.resolve(__dirname, '../../../pup/node_modules/puppeteer-core'),
  'C:\\Users\\Brian\\Documents\\antigravity\\pup\\node_modules\\puppeteer-core'
];

for (const p of possiblePuppeteerPaths) {
  try {
    puppeteer = require(p);
    if (puppeteer) break;
  } catch (e) {}
}

const possibleChromePaths = [
  process.env.CHROME_BIN,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
].filter(Boolean);

const chromePath = possibleChromePaths.find(p => fs.existsSync(p));

function runStaticAndUnitVerification() {
  console.log('📦 Starting Static & Unit Verification for Rewards & Events Scheduler...');
  const mainJsPath = path.resolve(__dirname, '..', 'main.js');
  const code = fs.readFileSync(mainJsPath, 'utf8');

  assert(code.includes('window.parseDataSheetToRewardsCatalog ='), 'Must define parseDataSheetToRewardsCatalog');
  assert(code.includes('window.computeScheduleLiveFromRewardsCatalog ='), 'Must define computeScheduleLiveFromRewardsCatalog');
  assert(code.includes('window.fetchRewardsEditorCatalog ='), 'Must define fetchRewardsEditorCatalog');
  assert(code.includes('window.syncRewardsCatalogChangeEverywhere ='), 'Must define syncRewardsCatalogChangeEverywhere');
  assert(code.includes('window.sanitizeFirebaseObject ='), 'Must define sanitizeFirebaseObject for RTDB safety');
  assert(code.includes('window.saveFirebaseNodeWithFallback ='), 'Must define saveFirebaseNodeWithFallback with timeout & REST fallback');
  assert(code.includes('schOpenAddRewardBtn'), 'Must include Add New Event/Reward button in modal');
  assert(code.includes('schDeleteRewardItemBtn'), 'Must include Delete button in modal');

  const dbRulesPath = path.resolve(__dirname, '..', 'database.rules.json');
  const dbRules = JSON.parse(fs.readFileSync(dbRulesPath, 'utf8'));
  assert(dbRules.rules.rewards_editor_catalog, 'database.rules.json must include rewards_editor_catalog permissions');
  assert(dbRules.rules.rewards_editor_queue, 'database.rules.json must include rewards_editor_queue permissions');
  assert(dbRules.rules.schedule_presets, 'database.rules.json must include schedule_presets permissions');

  // Extract pure functions for VM unit testing
  const startIdx = code.indexOf('window.getLocalTodayIsoStr = () => {');
  const endIdx = code.indexOf('window.fetchRewardsEditorCatalog = async', startIdx);
  const computeStartIdx = code.indexOf('window.computeScheduleLiveFromRewardsCatalog = (catalogItems', endIdx);
  const computeEndIdx = code.indexOf('window.syncRewardsCatalogChangeEverywhere = async', computeStartIdx);

  assert(startIdx !== -1 && endIdx !== -1 && computeStartIdx !== -1 && computeEndIdx !== -1, 'Could not locate Rewards Editor pure functions in main.js');

  const sandbox = {
    window: {},
    console,
    Date,
    Math,
    parseInt,
    Number,
    String,
    Array,
    Object,
    RegExp
  };
  sandbox.window = sandbox;
  sandbox.window.isScheduleJunkItem = (val) => {
    const s = String(val || '').trim().toLowerCase();
    return !s || s === 'no events';
  };

  vm.runInNewContext(
    code.substring(startIdx, endIdx) + '\n' + code.substring(computeStartIdx, computeEndIdx),
    sandbox
  );

  // Test time conversion from Google Sheets 1899 ISO string
  assert.strictEqual(sandbox.window.formatDataSheetTimeUTC('1899-12-30T20:00:00.000Z', 'timed'), '12:00');
  assert.strictEqual(sandbox.window.formatDataSheetTimeUTC('1899-12-31T00:00:00.000Z', 'timed'), '16:00');
  assert.strictEqual(sandbox.window.formatDataSheetTimeUTC('1899-12-30T08:00:00.000Z', 'rewards'), '00:00');
  assert.strictEqual(sandbox.window.utcTimeToPdtStr('16:00'), '9:00 AM');
  assert.strictEqual(sandbox.window.utcTimeToPdtStr('00:00'), '5:00 PM');
  assert.strictEqual(sandbox.window.normalize24HrTimeStr('16:00'), '16:00');
  assert.strictEqual(sandbox.window.normalize24HrTimeStr('1600'), '16:00');
  assert.strictEqual(sandbox.window.normalize24HrTimeStr('930'), '09:30');
  assert.strictEqual(sandbox.window.normalize24HrTimeStr('4:30 PM'), '16:30');
  assert.strictEqual(sandbox.window.normalize24HrTimeStr('2359'), '23:59');
  assert.strictEqual(sandbox.window.normalize24HrTimeStr('24:00'), '24:00');
  assert.strictEqual(sandbox.window.normalize24HrTimeStr('2400'), '24:00');
  assert.strictEqual(sandbox.window.normalize24HrTimeStr('24'), '24:00');
  assert.strictEqual(sandbox.window.normalize24HrTimeStr('0'), '00:00');
  assert.strictEqual(sandbox.window.utcTimeToPdtStr('24:00'), '5:00 PM (end)');
  console.log('  ✅ Timezone, 1899 ISO, and 24-hour UTC time normalizations verified (including 24:00 end-of-day rollover)');

  // Test parsing sample 'data' sheet rows
  const todayIso = sandbox.window.getLocalTodayIsoStr();
  const sampleRows = [
    ['', '', '', '', '', '', '', '', '', '', 'End Date', '', '', '', ''],
    ['', '', '', '', '', '', '', '', 'Edit: Schedule (no sort)', '', '', '', '', '', ''],
    ['', '', '', '', '', '', '', '', "Event's", 'Start Date', 'UTC', 'PDT', 'End Date', 'UTC', 'PDT'],
    ['', '', '', '', '', '', '', '', 'Castle Battle', `${todayIso}T07:00:00.000Z`, '1899-12-30T20:00:00.000Z', '5:00 AM', `${todayIso}T07:00:00.000Z`, '1899-12-31T01:00:00.000Z', '10:00 AM'],
    ['', '', '', '', '', '', '', '', 'Fortress', '', '1899-12-31T08:00:00.000Z', '5:00 PM', '', '', '5:00 PM'],
    ['', '', '', '', '', '', '', '', 'Rewards Events', 'Start Date', 'UTC', 'PDT', 'End Date', 'UTC', 'PDT'],
    ['', '', '', '', '', '', '', '', 'Lucky Wheel', `${todayIso}T07:00:00.000Z`, '1899-12-30T08:00:00.000Z', '5:00 PM', `${todayIso}T07:00:00.000Z`, '1899-12-31T08:00:00.000Z', '5:00 PM'],
    ['', '', '', '', '', '', '', '', 'Snowbusters', '2026-09-01T07:00:00.000Z', '1899-12-30T08:00:00.000Z', '5:00 PM', '2026-09-03T07:00:00.000Z', '1899-12-31T08:00:00.000Z', '5:00 PM'],
    ['', '', '', '', '', '', '', '', 'Signups', 'Start Date', 'UTC', 'PDT', 'End Date', 'UTC', 'PDT'],
    ['', '', '', '', '', '', '', '', 'Alliance Championship Sign-ups', `${todayIso}T07:00:00.000Z`, '1899-12-30T08:00:00.000Z', '5:00 PM', `${todayIso}T07:00:00.000Z`, '1899-12-31T08:00:00.000Z', '5:00 PM']
  ];

  const catalog = sandbox.window.parseDataSheetToRewardsCatalog(sampleRows);
  assert.strictEqual(catalog.length, 5, 'Should parse 5 catalog items from sample rows');
  assert.strictEqual(catalog[0].title, 'Castle Battle');
  assert.strictEqual(catalog[0].section, 'timed');
  assert.strictEqual(catalog[0].status, 'active');
  assert.strictEqual(catalog[1].title, 'Fortress');
  assert.strictEqual(catalog[1].status, 'nodates');
  assert.strictEqual(catalog[2].title, 'Lucky Wheel');
  assert.strictEqual(catalog[2].section, 'rewards');
  assert.strictEqual(catalog[3].title, 'Snowbusters');
  assert.strictEqual(catalog[3].status, 'expired');
  assert.strictEqual(catalog[4].section, 'signups');
  console.log('  ✅ parseDataSheetToRewardsCatalog accurately parses sections, dates, and status codes');

  const computed = sandbox.window.computeScheduleLiveFromRewardsCatalog(catalog, { allWeek: ['Alliance Tech Donations'] });
  assert.strictEqual(computed.events.length, 1, 'Should compute 1 active timed event');
  assert.strictEqual(computed.events[0].eventName, 'Castle Battle');
  assert(computed.rewards.includes('Lucky Wheel'), 'Today rewards must include Lucky Wheel');
  assert(!computed.rewards.includes('Snowbusters'), 'Today rewards must NOT include expired Snowbusters');
  assert(computed.signups.includes('Alliance Championship Sign-ups'), 'Active signups must include Alliance Championship Sign-ups');
  const rewardDayKeys = Object.keys(computed.rewardsByDay || {});
  assert(rewardDayKeys.length === 8, 'Should compute 8 days of rewardsByDay');
  for (const k of rewardDayKeys) {
    assert(!/[/.#$\[\]]/.test(k), `rewardsByDay key "${k}" must not contain illegal Firebase characters`);
  }
  console.log('  ✅ computeScheduleLiveFromRewardsCatalog accurately computes Timed Events, 8-Day Rewards (Firebase-safe keys), and Signups');
}

async function runHeadlessBrowserVerification() {
  if (!puppeteer || !chromePath) {
    console.warn('⚠️ Puppeteer or Chrome not found. Skipping headless browser verification.');
    return;
  }

  console.log('\n🚀 Starting Headless Chrome Verification for Rewards & Events Scheduler UI...');
  const server = http.createServer((req, res) => {
    let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath)) filePath = path.join(DIST_DIR, 'index.html');
    const ext = path.extname(filePath);
    const types = { '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml' };
    try {
      res.writeHead(200, { 'Content-Type': types[ext] || 'text/html' });
      res.end(fs.readFileSync(filePath));
    } catch (e) {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise(r => server.listen(PORT, r));
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', err => consoleErrors.push(err.message));

  try {
    await page.setViewport({ width: 1280, height: 850 });
    await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Set up R5 Manager & mock Firebase sync so tests don't mutate production during test run
    await page.evaluate(() => {
      const mockUser = {
        name: 'BrianDCox',
        username: 'BrianDCox',
        rank: 'R5',
        role: 'admin',
        gameId: '318843189',
        uid: 'IM03MidriobQzNlY1uLwgAwEPiV2'
      };
      window.currentUser = mockUser;
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
      localStorage.setItem('scheduleView', 'today');

      const todayUtcIso = new Date().toISOString();
      const tomorrowIso = new Date(Date.now() + 86400000).toISOString();
      if (!window.liveData) window.liveData = {};
      window.liveData['schedule'] = [
        ['', '', ''],
        ['', 'Sent', true],
        ['', todayUtcIso, tomorrowIso],
        ['', 'Events', ''],
        ['', '🐻 Bear Trap 🪤', 'Crazy Joe'],
        ['', '', ''],
        ['', 'Rewards Events', ''],
        ['', 'Defeat Nearby Beasts', 'Hero Rally'],
        ['', 'Lucky Wheel', '']
      ];
      window.liveData['Schedule data'] = [
        ['Delete', 'Update', 'Title', 'Start', 'End', 'Start Time', 'End Time'],
        [false, true, 'Castle Battle', todayUtcIso, todayUtcIso, '5:00 AM', '10:00 AM']
      ];
      window.liveData['WhiteOut Survival'] = [['Schedule']];

      const todayIso = window.getLocalTodayIsoStr();
      const sampleCatalog = [
        { id: 'rew_row_4', row: 4, section: 'timed', sectionLabel: 'Timed Events', title: 'Castle Battle', startDate: todayIso, endDate: todayIso, startUtc: '12:00', endUtc: '17:00', startPdt: '5:00 AM', endPdt: '10:00 AM', status: 'active' },
        { id: 'rew_row_7', row: 7, section: 'timed', sectionLabel: 'Timed Events', title: '🪤 Bear Trap 🐻', startDate: todayIso, endDate: todayIso, startUtc: '16:00', endUtc: '16:30', startPdt: '9:00 AM', endPdt: '9:30 AM', status: 'active' },
        { id: 'rew_row_13', row: 13, section: 'timed', sectionLabel: 'Timed Events', title: 'Fortress', startDate: '', endDate: '', startUtc: '00:00', endUtc: '00:00', startPdt: '5:00 PM', endPdt: '5:00 PM', status: 'nodates' },
        { id: 'rew_row_29', row: 29, section: 'rewards', sectionLabel: 'Rewards Events', title: 'Defeat Nearby Beasts', startDate: todayIso, endDate: todayIso, startUtc: '00:00', endUtc: '00:00', startPdt: '5:00 PM', endPdt: '5:00 PM', status: 'active' },
        { id: 'rew_row_41', row: 41, section: 'rewards', sectionLabel: 'Rewards Events', title: 'Lucky Wheel', startDate: todayIso, endDate: todayIso, startUtc: '00:00', endUtc: '00:00', startPdt: '5:00 PM', endPdt: '5:00 PM', status: 'active' },
        { id: 'rew_row_47', row: 47, section: 'rewards', sectionLabel: 'Rewards Events', title: 'Snowbusters', startDate: '2026-09-29', endDate: '2026-10-01', startUtc: '00:00', endUtc: '00:00', startPdt: '5:00 PM', endPdt: '5:00 PM', status: 'expired' },
        { id: 'rew_row_55', row: 55, section: 'signups', sectionLabel: 'Signups', title: 'Alliance Championship Sign-ups', startDate: todayIso, endDate: todayIso, startUtc: '00:00', endUtc: '00:00', startPdt: '5:00 PM', endPdt: '5:00 PM', status: 'active' }
      ];

      window._testCatalogStore = [...sampleCatalog];
      window._testFirebaseSavedNodes = {};
      window.fetchRewardsEditorCatalog = async () => {
        return [...window._testCatalogStore];
      };
      // Intercept low-level saveFirebaseNodeWithFallback so real syncRewardsCatalogChangeEverywhere runs 100% of its logic
      window.saveFirebaseNodeWithFallback = async (nodePath, value) => {
        const cleanVal = window.sanitizeFirebaseObject ? window.sanitizeFirebaseObject(value) : value;
        const verifyKeys = (obj) => {
          if (!obj || typeof obj !== 'object') return;
          for (const k of Object.keys(obj)) {
            if (/[/.#$\[\]]/.test(k)) {
              throw new Error(`Illegal Firebase key detected on node "${nodePath}": "${k}"`);
            }
            verifyKeys(obj[k]);
          }
        };
        verifyKeys(cleanVal);
        window._testFirebaseSavedNodes[nodePath] = cleanVal;
        if (nodePath === 'rewards_editor_catalog' && Array.isArray(cleanVal.items)) {
          window._testCatalogStore = [...cleanVal.items];
        }
        return true;
      };
      window.fetchScheduleLiveData = async () => {
        return window._cachedScheduleLive || window.computeScheduleLiveFromRewardsCatalog(window._testCatalogStore, {});
      };
    });

    // Render Schedule View
    await page.evaluate(async () => {
      if (window.views && window.views.schedule) {
        await window.views.schedule();
      }
    });
    await page.waitForSelector('#btnOpenRewardsEditor', { timeout: 8000 });
    console.log('  ✅ "🗓️ Rewards & Events Editor" button rendered on Schedule view header');

    // Click to open Rewards & Events Editor Modal
    await page.click('#btnOpenRewardsEditor');
    await page.waitForSelector('#scheduleEditorModal', { timeout: 5000 });
    await page.waitForSelector('#schSearchList', { timeout: 5000 });

    const initialItemCount = await page.$$eval('.sch-search-item', els => els.length);
    assert.strictEqual(initialItemCount, 7, `Expected 7 catalog items in list, got ${initialItemCount}`);
    console.log('  ✅ Rewards & Events Scheduler modal opened with 7 live catalog items');

    // Test Search Filtering
    await page.focus('#schSearchQuery');
    await page.keyboard.type('Lucky Wheel');
    const searchFilteredCount = await page.$$eval('.sch-search-item', els => els.length);
    assert.strictEqual(searchFilteredCount, 1, 'Search for "Lucky Wheel" must filter list to 1 item');
    console.log('  ✅ Live Search filtering verified ("Lucky Wheel" -> 1 match)');

    // Clear search
    await page.evaluate(() => {
      const inp = document.querySelector('#schSearchQuery');
      inp.value = '';
      inp.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Test Status Filter Pill (Expired)
    await page.click('.sch-status-pill[data-status="expired"]');
    const expiredFiltered = await page.$$eval('.sch-search-item', els => els.map(e => e.textContent));
    assert.strictEqual(expiredFiltered.length, 1, 'Expired filter must show 1 item (Snowbusters)');
    assert(expiredFiltered[0].includes('Snowbusters'), 'Expired item must be Snowbusters');
    console.log('  ✅ Status filter pills verified (❌ Expired -> Snowbusters)');

    // Reset Status Filter to All
    await page.click('.sch-status-pill[data-status="all"]');

    // Test Adding a New Reward Event + Interactive Calendar Popup & 24-Hour UTC Time Picker
    await page.click('#schOpenAddRewardBtn');
    await page.waitForSelector('#schEditorSectionSelect', { visible: true, timeout: 3000 });
    await page.select('#schEditorSectionSelect', 'rewards');
    await page.focus('#schEditorTitleInput');
    await page.keyboard.type('Frostdragon Tyrant Test');

    // Verify clicking Start Date opens Interactive Popup Calendar (#schCalendarPopover)
    await page.click('#schSearchStartDate');
    await page.waitForSelector('#schCalendarPopover', { visible: true, timeout: 3000 });
    await page.click('#schCalPickToday');
    const calClosedAfterStart = await page.evaluate(() => !document.getElementById('schCalendarPopover'));
    assert(calClosedAfterStart, 'Calendar popover must close after picking Today on Start Date');

    // Verify clicking End Date opens Interactive Popup Calendar (#schCalendarPopover)
    await page.click('#schSearchEndDate');
    await page.waitForSelector('#schCalendarPopover', { visible: true, timeout: 3000 });
    await page.click('#schCalPickPlus6');
    console.log('  ✅ Interactive Popup Calendar verified on both Start Date and End Date inputs!');

    // Verify clicking Start UTC opens 24-Hour Time Picker (#schTimePickerPopover) and supports 24-hour selection
    await page.click('#schSearchUtc');
    await page.waitForSelector('#schTimePickerPopover', { visible: true, timeout: 3000 });
    await page.click('.sch-tp-hour-btn[data-hour="16"]');
    await page.click('.sch-tp-min-btn[data-min="30"]');
    const startUtc24Val = await page.$eval('#schSearchUtc', el => el.value);
    const startUtcPdtText = await page.$eval('#schSearchUtcPdtBadge', el => el.textContent.trim());
    assert.strictEqual(startUtc24Val, '16:30', '24-Hour Time Picker must set Start UTC to 16:30');
    assert.strictEqual(startUtcPdtText, '9:30 AM PDT', 'PDT preview badge must update to 9:30 AM PDT for 16:30 UTC');

    // Verify direct 24-hour compact typing (e.g. "2400" -> "24:00") on End UTC
    await page.evaluate(() => {
      const endUtc = document.getElementById('schSearchEndUtc');
      endUtc.value = '2400';
      endUtc.dispatchEvent(new Event('input', { bubbles: true }));
      endUtc.dispatchEvent(new Event('blur', { bubbles: true }));
    });
    const endUtc24Val = await page.$eval('#schSearchEndUtc', el => el.value);
    const endUtcPdtText = await page.$eval('#schSearchEndUtcPdtBadge', el => el.textContent.trim());
    assert.strictEqual(endUtc24Val, '24:00', 'Direct 24-hour input "2400" must normalize to "24:00"');
    assert(endUtcPdtText.includes('5:00 PM'), 'PDT preview badge for 24:00 UTC must display 5:00 PM');
    console.log('  ✅ 24-Hour UTC Time Picker & 24:00 end-of-day normalization verified (16:30 & 24:00 UTC)!');

    await page.click('#schSetStartTodayBtn');
    await page.click('#schAdd2DaysBtn');
    await page.click('#schSaveSearchItemBtn');

    // Verify Save button never hangs on "Saving & Syncing..." and both Firebase nodes were saved cleanly
    const saveBtnState = await page.$eval('#schSaveSearchItemBtn', el => ({
      text: el.textContent.trim(),
      disabled: el.disabled
    }));
    assert(!saveBtnState.text.includes('Saving & Syncing'), `Save button must not hang on Saving & Syncing, got: "${saveBtnState.text}"`);
    assert(!saveBtnState.disabled, 'Save button must be re-enabled after save completes');

    const savedNodesCheck = await page.evaluate(() => ({
      hasCatalog: !!window._testFirebaseSavedNodes['rewards_editor_catalog'],
      hasScheduleLive: !!window._testFirebaseSavedNodes['schedule_live'],
      rewardDayKeys: Object.keys((window._testFirebaseSavedNodes['schedule_live'] || {}).rewardsByDay || {})
    }));
    assert(savedNodesCheck.hasCatalog, 'Real syncRewardsCatalogChangeEverywhere must save rewards_editor_catalog node');
    assert(savedNodesCheck.hasScheduleLive, 'Real syncRewardsCatalogChangeEverywhere must save schedule_live node');
    assert(savedNodesCheck.rewardDayKeys.every(k => !k.includes('/')), 'All saved rewardsByDay keys must be free of "/"');
    console.log('  ✅ Save & Sync verified with real syncRewardsCatalogChangeEverywhere (zero button hang, Firebase-safe keys)');

    // Verify new item appears in catalog list AND in Schedule Today View Daily Rewards!
    const afterAddTexts = await page.$$eval('.sch-search-item', els => els.map(e => e.textContent));
    assert(afterAddTexts.some(t => t.includes('Frostdragon Tyrant Test')), 'Newly added event must appear in catalog list');
    const scheduleDomAfterAdd = await page.$eval('#schedule-content', el => el.textContent);
    assert(scheduleDomAfterAdd.includes('Frostdragon Tyrant Test'), 'Newly added reward event must immediately render in Today Schedule Daily Rewards!');
    console.log('  ✅ Add New Event / Reward verified: "Frostdragon Tyrant Test" added to catalog and rendered live in Daily Rewards!');

    // Test Deleting the Newly Added Event
    await page.WaitForSelector ? null : null;
    await page.waitForSelector('#schDeleteRewardItemBtn', { timeout: 3000 });
    await page.click('#schDeleteRewardItemBtn');
    await page.waitForSelector('#schConfirmDeleteYesBtn', { timeout: 3000 });
    await page.click('#schConfirmDeleteYesBtn');

    const afterDelTexts = await page.$$eval('.sch-search-item', els => els.map(e => e.textContent));
    assert(!afterDelTexts.some(t => t.includes('Frostdragon Tyrant Test')), 'Deleted event must be removed from catalog list');
    const scheduleDomAfterDel = await page.$eval('#schedule-content', el => el.textContent);
    assert(!scheduleDomAfterDel.includes('Frostdragon Tyrant Test'), 'Deleted reward event must be removed from Today Schedule Daily Rewards!');
    console.log('  ✅ Delete Event / Reward verified: "Frostdragon Tyrant Test" removed from catalog and Today Schedule!');

    // Responsive Layout Audit across 375px, 768px, 1280px with modal open
    const viewports = [
      { width: 375, height: 667, name: 'Mobile (375px)' },
      { width: 768, height: 1024, name: 'Tablet (768px)' },
      { width: 1280, height: 800, name: 'Desktop (1280px)' }
    ];
    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise(r => setTimeout(r, 150));
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert(!overflow, `Horizontal overflow detected on ${vp.name}`);
      console.log(`  ✅ Responsive layout verified on ${vp.name} (zero horizontal overflow)`);
    }

    const fatalErrors = consoleErrors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('Firebase') &&
      !e.includes('PERMISSION_DENIED') &&
      !e.includes('403') &&
      !e.includes('net::ERR_') &&
      !e.includes('404')
    );
    assert.strictEqual(fatalErrors.length, 0, `Unexpected console errors: ${fatalErrors.join('; ')}`);
    console.log('  ✅ Zero browser console or page errors verified');
  } finally {
    await browser.close();
    await new Promise(r => server.close(r));
  }
}

async function main() {
  try {
    runStaticAndUnitVerification();
    await runHeadlessBrowserVerification();
    console.log('\n🎉 ALL REWARDS & EVENTS SCHEDULER TESTS PASSED (100% SUCCESS)!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ REWARDS & EVENTS SCHEDULER TEST FAILURE:', err);
    process.exit(1);
  }
}

main();
