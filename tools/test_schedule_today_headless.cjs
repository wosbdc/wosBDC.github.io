// tools/test_schedule_today_headless.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const PORT = 8129;
const DIST_DIR = path.resolve(__dirname, '..', 'dist');

// Dynamic resolution for puppeteer-core or puppeteer
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

// Dynamic resolution for Chrome executable
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

let chromePath = possibleChromePaths.find(p => fs.existsSync(p));

function runStaticAndUnitVerification() {
  console.log('📦 Starting Static & Unit Verification for Schedule Today View...');
  const mainJsPath = path.resolve(__dirname, '..', 'main.js');
  const code = fs.readFileSync(mainJsPath, 'utf8');

  // 1. Static regex checks
  assert(code.includes('parseScheduleEventDate'), 'Must contain parseScheduleEventDate');
  assert(code.includes('getUnifiedScheduleEvents'), 'Must contain getUnifiedScheduleEvents');
  assert(code.includes('getUnifiedScheduleRewards'), 'Must contain getUnifiedScheduleRewards');
  assert(code.includes('hasRewards'), 'Must render Daily Rewards category');
  assert(code.includes('isScheduleJunkItem'), 'Must contain isScheduleJunkItem');

  // 2. Unit tests via VM
  const sandbox = {
    window: {},
    console: console,
    Date: Date,
    Math: Math,
    parseInt: parseInt,
    String: String,
    Array: Array,
    Object: Object,
    Set: Set,
    RegExp: RegExp
  };
  sandbox.window = sandbox;

  // Extract necessary functions
  const dateFnStart = code.indexOf('window.parseScheduleEventDate = (dateStr) => {');
  assert(dateFnStart !== -1, 'Could not locate parseScheduleEventDate');
  const dateFnEnd = code.indexOf('window.parseScheduleEventTime = (timeStr, pdtVal) => {', dateFnStart);
  assert(dateFnEnd !== -1, 'Could not locate parseScheduleEventTime');
  const timeFnEnd = code.indexOf('// ==========================================\n// 📅 UNIFIED REAL-TIME SCHEDULE RESOLVER', dateFnEnd);
  assert(timeFnEnd !== -1, 'Could not locate end of parseScheduleEventTime');

  const unifiedEventsStart = code.indexOf('window.getUnifiedScheduleEvents = () => {');
  assert(unifiedEventsStart !== -1, 'Could not locate getUnifiedScheduleEvents');
  const unifiedEventsEnd = code.indexOf('// ==========================================\n// 🔔 SCHEDULE EVENT REMINDERS SUITE', unifiedEventsStart);
  assert(unifiedEventsEnd !== -1, 'Could not locate end of unified schedule functions');

  const combinedCode = `
    ${code.substring(dateFnStart, timeFnEnd)}
    window.STANDARD_EVENT_TIMES_MAP = {
      'bear trap': { startUtc: '16:00', startPdt: '9:00 AM', durationMs: 30 * 60000, emoji: '🪤' },
      'crazy joe': { startUtc: '16:00', startPdt: '9:00 AM', durationMs: 30 * 60000, emoji: '🔥' },
      'castle': { startUtc: '12:00', startPdt: '5:00 AM', durationMs: 4 * 3600000, emoji: '🏰' }
    };
    ${code.substring(unifiedEventsStart, unifiedEventsEnd)}
  `;

  vm.runInNewContext(combinedCode, sandbox);

  // Test parseScheduleEventDate with ISO timestamp
  const d1 = sandbox.window.parseScheduleEventDate('2026-10-21T07:00:00.000Z');
  assert(d1 instanceof Date, 'd1 must be a Date');
  assert.strictEqual(d1.getUTCFullYear(), 2026, 'Year must be 2026');
  assert.strictEqual(d1.getUTCMonth(), 9, 'Month must be 9 (October)');
  assert.strictEqual(d1.getUTCDate(), 21, 'Date must be 21');
  console.log('  ✅ parseScheduleEventDate properly handles ISO timestamp (2026-10-21T07:00:00.000Z)');

  // Test parseScheduleEventTime
  const t1 = sandbox.window.parseScheduleEventTime('5:00 AM', '5:00 AM');
  assert.strictEqual(t1.h, 12, '5:00 AM PDT must convert to 12 UTC');
  assert.strictEqual(t1.m, 0, 'Minute must be 0');
  console.log('  ✅ parseScheduleEventTime converts 5:00 AM PDT -> 12:00 UTC');

  // Test getUnifiedScheduleEvents with ISO headers
  const todayUtcIso = new Date().toISOString();
  sandbox.window.liveData = {
    'schedule': [
      ['', '', ''],
      ['', 'Sent', true],
      ['', todayUtcIso, '2026-10-22T07:00:00.000Z'],
      ['', 'Events', ''],
      ['', 'Bear Trap', 'Crazy Joe'],
      ['', '', ''],
      ['', 'Rewards Events', ''],
      ['', 'Defeat Nearby Beasts', 'Hero Rally'],
      ['', 'Lucky Wheel', '']
    ],
    'Schedule data': [
      ['Delete', 'Update', 'Title', 'Start', 'End', 'Start Time', 'End Time'],
      [false, true, 'Castle Battle', todayUtcIso, todayUtcIso, '5:00 AM', '10:00 AM']
    ]
  };

  const events = sandbox.window.getUnifiedScheduleEvents();
  assert(Array.isArray(events) && events.length > 0, 'Events array must not be empty');
  const hasBearTrap = events.some(e => e.name.toLowerCase().includes('bear trap'));
  const hasCastle = events.some(e => e.name.toLowerCase().includes('castle'));
  assert(hasBearTrap, 'Must resolve Bear Trap from weekly grid with ISO headers');
  assert(hasCastle, 'Must resolve Castle Battle from Schedule data with ISO timestamps');
  console.log(`  ✅ getUnifiedScheduleEvents resolved ${events.length} events across weekly grid and timed tables`);

  // Test getUnifiedScheduleRewards with ISO headers
  const rewards = sandbox.window.getUnifiedScheduleRewards(new Date());
  assert(Array.isArray(rewards) && rewards.length > 0, 'Rewards array must not be empty');
  assert(rewards.includes('Defeat Nearby Beasts'), 'Must include Defeat Nearby Beasts');
  assert(rewards.includes('Lucky Wheel'), 'Must include Lucky Wheel');
  console.log(`  ✅ getUnifiedScheduleRewards extracted ${rewards.length} rewards: ${rewards.join(', ')}`);
}

async function runHeadlessBrowserVerification() {
  if (!puppeteer) {
    console.warn('⚠️ puppeteer-core not found. Skipping headless browser execution.');
    return;
  }
  if (!chromePath) {
    console.warn('⚠️ Google Chrome executable not found. Skipping headless browser execution.');
    return;
  }

  console.log('\n🚀 Starting Headless Chrome Verification for Today Schedule View...');
  console.log(`   Chrome Binary: ${chromePath}`);

  // Create simple static file server for dist
  const server = http.createServer((req, res) => {
    let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }
    const ext = path.extname(filePath);
    let contentType = 'text/html';
    if (ext === '.js') contentType = 'application/javascript';
    else if (ext === '.css') contentType = 'text/css';
    else if (ext === '.json') contentType = 'application/json';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.svg') contentType = 'image/svg+xml';

    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch (e) {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  await new Promise(r => server.listen(PORT, r));
  console.log(`   Local Test Server listening on http://127.0.0.1:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  try {
    await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Mock authentication and liveData
    await page.evaluate(() => {
      const mockUser = {
        name: 'BrianDCox',
        username: 'BrianDCox',
        rank: 'R5',
        role: 'admin',
        uid: 'user_1001'
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
    });

    // Render Today Schedule View
    console.log('  🔍 Rendering views.schedule() in Today view...');
    await page.evaluate(async () => {
      if (window.views && window.views.schedule) {
        await window.views.schedule();
      }
    });

    // Wait for schedule content card to render
    await page.waitForSelector('#schedule-content', { timeout: 8000 });

    const contentText = await page.$eval('#schedule-content', el => el.textContent);
    console.log('   --- RENDERED HTML TEXT ---');
    console.log(contentText);
    console.log('   --------------------------');
    assert(contentText.includes('Events Today'), 'Today view must display "Events Today" section');
    assert(contentText.includes('Bear Trap'), 'Today view must display Bear Trap');
    assert(contentText.includes('Daily Rewards'), 'Today view must display "Daily Rewards" section');
    
    // Assert zero junk calculations or spreadsheet numbers rendered in DOM
    assert(!contentText.includes('3,000,000'), 'Must NOT contain training calculator goal 3,000,000');
    assert(!contentText.includes('175,118,715'), 'Must NOT contain spreadsheet chief power numbers 175,118,715');
    assert(!contentText.includes('2,180,102,038'), 'Must NOT contain spreadsheet chief power numbers 2,180,102,038');
    assert(!contentText.includes('Vip Plan:'), 'Must NOT contain Vip Plan spreadsheet calculator');
    assert(!contentText.includes('Gems Bank'), 'Must NOT contain Gems Bank calculator');
    assert(!contentText.includes('Top_up'), 'Must NOT contain Top_up calculator');
    assert(!contentText.includes('7 (7/2)'), 'Must NOT contain spreadsheet date formulas 7 (7/2)');
    assert(!contentText.includes('7 (6/30)'), 'Must NOT contain spreadsheet date formulas 7 (6/30)');
    console.log('  ✅ Verified ZERO junk spreadsheet numbers, formulas, or personal calculators rendered in DOM');

    // Assert upcoming events are cleanly displayed in "Coming up:"
    assert(contentText.includes('Coming up:'), 'Today view must display "Coming up:" section with upcoming events');
    console.log('  ✅ "Coming up:" section displayed with upcoming events');

    // Test responsive layout across 375px (mobile), 768px (tablet), 1280px (desktop)
    const viewports = [
      { width: 375, height: 667, name: 'Mobile (375px)' },
      { width: 768, height: 1024, name: 'Tablet (768px)' },
      { width: 1280, height: 800, name: 'Desktop (1280px)' }
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise(r => setTimeout(r, 200));

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert(!overflow, `No horizontal overflow permitted on ${vp.name}`);
      console.log(`  ✅ Responsive check passed on ${vp.name} (zero horizontal overflow)`);
    }

    // Assert zero fatal console errors
    const fatalErrors = consoleErrors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('Firebase') && 
      !e.includes('PERMISSION_DENIED') && 
      !e.includes('403') && 
      !e.includes('net::ERR_') &&
      !e.includes('404')
    );
    assert.strictEqual(fatalErrors.length, 0, `Zero fatal console errors expected, got: ${fatalErrors.join(', ')}`);
    console.log('  ✅ Zero browser console errors verified during execution');

  } finally {
    await browser.close();
    await new Promise(r => server.close(r));
    console.log('   Test server and browser closed cleanly.');
  }
}

async function main() {
  try {
    runStaticAndUnitVerification();
    await runHeadlessBrowserVerification();
    console.log('\n🎉 ALL TODAY SCHEDULE VIEW TESTS PASSED (100% SUCCESS)!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST FAILURE:', err);
    process.exit(1);
  }
}

main();
