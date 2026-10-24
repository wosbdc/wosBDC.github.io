// tools/test_championship_redesign_headless.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const PORT = 8121;
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

function runStaticVerification() {
  console.log('📦 Starting Static & Structural Verification for Championship 3-Step Redesign...');
  const mainJsPath = path.resolve(__dirname, '..', 'main.js');
  const code = fs.readFileSync(mainJsPath, 'utf8');

  // AST syntax validation
  const lines = code.split('\n');
  let inImport = false;
  const strippedLines = lines.map(line => {
    const trimmed = line.trim();
    if (/^import\s+['"].*?['"]\s*;?$/.test(trimmed)) return '// ' + line;
    if (/^import\s+[\s\S]*?\s+from\s+['"].*?['"]\s*;?$/.test(trimmed)) return '// ' + line;
    if (/^import\b/.test(trimmed)) { inImport = true; return '// ' + line; }
    if (inImport) { if (/from\s+['"].*?['"]\s*;?$/.test(trimmed)) inImport = false; return '// ' + line; }
    if (/^export\s+(default|const|let|var|function|class)\b/.test(trimmed)) {
      return line.replace(/^export\s+default\s+/, 'const __default_export__ = ').replace(/^export\s+/, '');
    }
    return line;
  });

  const parsedCode = strippedLines.join('\n');
  try {
    new vm.Script(parsedCode, { filename: 'main.js' });
    console.log('  ✅ main.js parsed with zero syntax errors');
  } catch (err) {
    console.error('  ❌ Syntax error parsing main.js:', err.message);
    process.exit(1);
  }

  // Structural checks for 3-step redesign
  assert(code.includes('window.showChampSeasonCompleteModal ='), 'main.js must define window.showChampSeasonCompleteModal');
  assert(code.includes('window.onChampModalKeepViewing ='), 'main.js must define window.onChampModalKeepViewing');
  assert(code.includes('window.onChampModalArchiveNow ='), 'main.js must define window.onChampModalArchiveNow');
  assert(code.includes('window.saveChampSeasonSetup ='), 'main.js must define window.saveChampSeasonSetup');
  assert(code.includes('window.onChampQuickCheckIn ='), 'main.js must define window.onChampQuickCheckIn');
  assert(code.includes('window.onChampQuickUndo ='), 'main.js must define window.onChampQuickUndo');
  assert(code.includes('window.onChampChiefSearchInput ='), 'main.js must define window.onChampChiefSearchInput');
  assert(code.includes('window.autoFillChampScheduleDates ='), 'main.js must define window.autoFillChampScheduleDates');
  assert(code.includes('window.toggleChampRosterTable ='), 'main.js must define window.toggleChampRosterTable');
  assert(code.includes('window.isChampScheduleDoneCorrectly ='), 'main.js must define window.isChampScheduleDoneCorrectly');
  assert(code.includes('window.getChampionshipScheduleStatus ='), 'main.js must define window.getChampionshipScheduleStatus');
  assert(code.includes('window.startChampCooldownTicker ='), 'main.js must define window.startChampCooldownTicker');
  assert(code.includes('window.unlockChampSetupEarly ='), 'main.js must define window.unlockChampSetupEarly');
  assert(code.includes('champCooldownGateCard'), 'main.js must define #champCooldownGateCard for pre-event cooldown');
  assert(code.includes('window.showChampSetupLockedAlert ='), 'main.js must define window.showChampSetupLockedAlert');

  // Step 1 setup elements
  assert(code.includes('champ_setup_season_name'), 'main.js must support season name setup input');
  assert(code.includes('Season Date :'), 'main.js must label season name as Season Date :');
  assert(code.includes('Fixed Round #'), 'main.js must display locked fixed round # badge');
  assert(code.includes('champSetupLockedAlertModal'), 'main.js must define #champSetupLockedAlertModal');
  assert(code.includes('Go Back to Setup Tab!'), 'main.js must display Go Back to Setup Tab! alert heading');
  assert(code.includes('btnSaveChampSeasonSetup'), 'main.js must provide save schedule & unlock signups button');
  assert(code.includes('btnAutoFillChampDatesInline'), 'main.js must provide inline auto-fill button adjacent to season date');
  assert(!code.includes('champ_setup_r${i}_enemy_tag'), 'Redundant separate opponent tag input must be removed from Step 1');
  assert(code.includes('champ_setup_r${i}_enemy_name'), 'main.js must support opponent name input');

  // Step 2 check-in desk & gating elements
  assert(code.includes('champSignupsLockedCard'), 'main.js must render locked barrier card when season is not setup');
  assert(code.includes('btnLockedGoToSetup'), 'main.js must render button to go to setup from lock barrier');
  assert(code.includes('champChiefSearchInput'), 'main.js must provide typeahead search input for chiefs');
  assert(code.includes('champSearchTypeaheadResults'), 'main.js must render typeahead search results');
  assert(code.includes('btnToggleChampTable'), 'main.js must provide toggle button for full roster table');
  assert(code.includes('📋 Event Summary'), 'main.js must rename quick-copy button to Event Summary');

  // Step 3 celebration modal elements
  assert(code.includes('champSeasonCompleteModal'), 'main.js must define #champSeasonCompleteModal');
  assert(code.includes('Round 5 Complete! Season Finished!'), 'main.js must display Round 5 completion celebration header');

  console.log('  ✅ All static signatures, helper functions, and template elements verified!');
}

async function runHeadlessVerification() {
  if (!puppeteer || !chromePath) {
    console.warn('⚠️ Puppeteer or Chrome not found. Skipping live browser test step; static verification passed.');
    return;
  }
  console.log('🚀 Launching Real Headless Chrome verification suite for Championship Redesign (Port 8121)...');

  // 1. Boot local static HTTP test server
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    const filePath = path.join(DIST_DIR, reqPath);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise(resolve => server.listen(PORT, resolve));

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter harmless favicon or network noise
      if (!text.includes('favicon') && !text.includes('Failed to load resource')) {
        consoleErrors.push(text);
      }
    }
  });

  try {
    await page.setViewport({ width: 1280, height: 900 });
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Establish mock environment with manager permissions
    await page.evaluate(() => {
      window.currentUser = {
        uid: 'test_manager_1',
        email: 'manager@bdc.com',
        displayName: 'TestManager',
        isAdmin: true
      };
      window.getAdminLevel = () => 'R5';

      // Mock championship unconfigured state with blank defaults
      window.DEFAULT_CHAMPIONSHIP_MATCHUPS = {
        seasonName: '',
        statusText: '0 Wins – 0 Losses (New Season)',
        ourSeasonFlags: 0,
        enemySeasonFlags: 0,
        ourState: '2089',
        seasonState: 'unconfigured',
        rounds: {
          r1: { roundNum: 1, date: 'Round 1', ourScore: 0, ourFlags: 0, ourState: '2089', enemyAlliance: { tag: '', name: '', state: '', score: 0, flags: 0 } },
          r2: { roundNum: 2, date: 'Round 2', ourScore: 0, ourFlags: 0, ourState: '2089', enemyAlliance: { tag: '', name: '', state: '', score: 0, flags: 0 } },
          r3: { roundNum: 3, date: 'Round 3', ourScore: 0, ourFlags: 0, ourState: '2089', enemyAlliance: { tag: '', name: '', state: '', score: 0, flags: 0 } },
          r4: { roundNum: 4, date: 'Round 4', ourScore: 0, ourFlags: 0, ourState: '2089', enemyAlliance: { tag: '', name: '', state: '', score: 0, flags: 0 } },
          r5: { roundNum: 5, date: 'Round 5', ourScore: 0, ourFlags: 0, ourState: '2089', enemyAlliance: { tag: '', name: '', state: '', score: 0, flags: 0 } }
        }
      };

      window.fetchChampionshipMatchups = async () => window.DEFAULT_CHAMPIONSHIP_MATCHUPS;

      // Mock roster with 5 test chiefs
      window.fetchRoster = async () => ({
        p1: { gameId: '1001', name: 'Brian' },
        p2: { gameId: '1002', name: 'Thor' },
        p3: { gameId: '1003', name: 'Ironman' },
        p4: { gameId: '1004', name: 'Hulk' },
        p5: { gameId: '1005', name: 'Captain' }
      });

      // Initially only Brian is signed up
      window.fetchChampionshipData = async () => ({
        '1001': { gameId: '1001', name: 'Brian', signedUp: true }
      });

      window.isPlayerActiveMember = () => true;
      window.cleanChiefName = n => n;
    });

    // 1. Verify Cooldown Gate & Step 1 defaults
    console.log('  🔍 Testing Schedule-Driven Cooldown Countdown Gate and Early Setup Override...');
    await page.evaluate(async () => {
      window._champBypassCooldown = false;
      await views.championshipAdmin();
    });

    await page.waitForSelector('#champCooldownGateCard', { timeout: 5000 });
    const setupInputWhileCooldown = await page.$('#champ_setup_season_name');
    assert(!setupInputWhileCooldown, 'Setup page must NOT show while event is on cooldown');

    const cdDays = await page.$eval('#champCdDays', el => el.textContent.trim());
    const cdNextStart = await page.$eval('#champCdNextStartUtc', el => el.textContent.trim());
    assert(/^\d{2,}$/.test(cdDays), 'Cooldown timer Days box must render numeric digits');
    assert(cdNextStart.includes('UTC'), `Next scheduled start must display UTC timestamp from Schedule, got "${cdNextStart}"`);

    // Check Cooldown Gate responsive layout on 375px mobile before unlocking
    await page.setViewport({ width: 375, height: 812 });
    await new Promise(r => setTimeout(r, 150));
    const cdScrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    const cdClientW = await page.evaluate(() => document.documentElement.clientWidth);
    assert(cdScrollW <= cdClientW, `Cooldown Gate horizontal overflow at 375px (${cdScrollW}px > ${cdClientW}px)`);
    await page.setViewport({ width: 1280, height: 900 });
    console.log(`  ✅ Cooldown Countdown Gate & 375px mobile layout verified (Next Start: ${cdNextStart})`);

    // Click Early Setup Override button to unlock Step 1 Setup
    await page.click('#btnUnlockChampSetupEarly');
    await page.waitForSelector('#champ_setup_season_name', { timeout: 5000 });

    // Verify Return to Cooldown Timer button works and then re-open Setup
    const returnBtnExists = await page.evaluate(() => Boolean(document.getElementById('btnReturnToChampCooldown')));
    assert(returnBtnExists, 'Early Setup Override banner must include Back to Cooldown Timer button');
    await page.click('#btnReturnToChampCooldown');
    await page.waitForSelector('#champCooldownGateCard', { timeout: 5000 });
    await page.click('#btnUnlockChampSetupEarly');

    console.log('  🔍 Testing Blank Opponent Defaults and Locked Round Numbers in Step 1...');
    await page.waitForSelector('#champ_setup_season_name', { timeout: 5000 });
    const seasonDateVal = await page.$eval('#champ_setup_season_name', el => el.value);
    assert.strictEqual(seasonDateVal, '', 'Season Date input must be empty by default');

    const day1TagInput = await page.$('#champ_setup_r1_enemy_tag');
    assert(!day1TagInput, 'Separate enemy tag input must NOT exist in DOM (centralized into Tag & Name)');
    const day1NameVal = await page.$eval('#champ_setup_r1_enemy_name', el => el.value);
    const day1StateVal = await page.$eval('#champ_setup_r1_enemy_state', el => el.value);
    assert.strictEqual(day1NameVal, '', 'Day 1 enemy name input must be blank by default');
    assert.strictEqual(day1StateVal, '', 'Day 1 enemy state input must be blank by default');

    const fixedRoundText = await page.evaluate(() => {
      return document.querySelector('#app')?.textContent.includes('Fixed Round #');
    });
    assert(fixedRoundText, 'Locked fixed round badge must be visible in Step 1');
    console.log('  ✅ Blank defaults (Season Date, opponent tags/names/states) and locked round badges verified');

    // 2. Verify Strict Tab Lockdown: Other pages must NOT even show when schedule is unconfigured
    console.log('  🔍 Testing Strict Tab Lockdown: Step 2 & Step 3 must NOT be rendered when schedule incomplete...');
    const signupsLockedBtnText = await page.$eval('#tabBtnSignups', el => el.textContent.trim());
    const matchupsLockedBtnText = await page.$eval('#tabBtnMatchups', el => el.textContent.trim());
    assert(signupsLockedBtnText.includes('🔒 Signups'), 'Signups tab button must be locked with lock icon');
    assert(matchupsLockedBtnText.includes('🔒 Matchups'), 'Matchups tab button must be locked with lock icon');

    // Confirm that neither signups roster nor matchups editor is rendered in the DOM
    const rosterTableInDOM = await page.evaluate(() => Boolean(document.getElementById('champTableBody')));
    const matchupsSaveBtnInDOM = await page.evaluate(() => Boolean(document.getElementById('adm_champ_save_btn')));
    assert(!rosterTableInDOM, 'Signups roster table must NOT be rendered in DOM when schedule is incomplete');
    assert(!matchupsSaveBtnInDOM, 'Matchups editor must NOT be rendered in DOM when schedule is incomplete');
    console.log('  ✅ Other pages are completely withheld from rendering (strict page lockdown verified)');

    // 3. Test Clicking Locked Tab pops up "Go Back to Setup Tab!" alert modal
    console.log('  🔍 Testing Alert Modal on locked tab click...');
    await page.click('#tabBtnSignups');
    await page.waitForSelector('#champSetupLockedAlertModal', { timeout: 3000 });

    const alertHeader = await page.$eval('#champSetupLockedAlertModal h3', el => el.textContent.trim());
    assert.strictEqual(alertHeader, 'Go Back to Setup Tab!', 'Alert modal header must say "Go Back to Setup Tab!"');

    // Click "Go Back to Setup Tab" button inside the alert modal
    await page.evaluate(() => {
      const modalBtn = document.querySelector('#champSetupLockedAlertModal button');
      if (modalBtn) modalBtn.click();
    });
    await new Promise(r => setTimeout(r, 200));

    const alertModalClosed = await page.evaluate(() => !document.getElementById('champSetupLockedAlertModal'));
    assert(alertModalClosed, 'Alert modal must close cleanly when button clicked');
    console.log('  ✅ "Go Back to Setup Tab!" alert modal verified on locked tab navigation');

    // 4. Test Step 1: Schedule Dates Auto-Fill from Google Sheet / Schedule
    console.log('  🔍 Testing Step 1: Schedule Dates Auto-Fill from Google Sheet...');
    await page.click('#btnAutoFillChampDatesInline');
    
    // Wait for auto-fill to resolve and populate fields
    await page.waitForFunction(() => {
      const el = document.getElementById('champ_setup_season_name');
      return el && el.value.trim().length > 0;
    }, { timeout: 8000 });

    const autoSeasonDate = await page.$eval('#champ_setup_season_name', el => el.value);
    const perRoundDateInput = await page.$('#champ_setup_r1_date');
    assert(!perRoundDateInput, 'Per-round date inputs must be removed from Step 1 (centralized on Season Date)');
    assert(autoSeasonDate && autoSeasonDate.includes('–'), `Season Date must be auto-filled with date range, got "${autoSeasonDate}"`);
    assert((autoSeasonDate.includes('Oct 19') && autoSeasonDate.includes('Oct 25')) || (autoSeasonDate.includes('Oct 26') && autoSeasonDate.includes('Nov 1')), `Season Date must reflect live Google Sheet dates, got "${autoSeasonDate}"`);
    console.log(`  ✅ Tournament date centralized on live Google Sheet Season Date: "${autoSeasonDate}" (per-round date inputs cleanly removed)`);

    // 5. Fill valid 5-day opponents and save Step 1 schedule to unlock Step 2
    console.log('  🔍 Filling 5-day opponent alliances and saving schedule...');
    await page.evaluate(async () => {
      for (let i = 1; i <= 5; i++) {
        document.getElementById(`champ_setup_r${i}_enemy_name`).value = `[OPP${i}] Alliance ${i}`;
        document.getElementById(`champ_setup_r${i}_enemy_state`).value = `${2040 + i}`;
      }
      window.saveChampionshipMatchups = async (payload) => {
        window.DEFAULT_CHAMPIONSHIP_MATCHUPS = payload;
      };
      await window.saveChampSeasonSetup();
    });
    await new Promise(r => setTimeout(r, 600));

    // Verify Step 2 is now unlocked!
    await page.waitForSelector('#champStatYes', { timeout: 5000 });
    const statYes = await page.$eval('#champStatYes', el => el.textContent.trim());
    const statNo = await page.$eval('#champStatNo', el => el.textContent.trim());
    assert.strictEqual(statYes, '1', 'Signed up count must equal 1');
    assert.strictEqual(statNo, '4', 'Waiting response count must equal 4');
    console.log(`  ✅ Signups unlocked! Live KPIs: Signed Up = ${statYes}, Waiting = ${statNo}`);

    // Verify bulky touch tile grid is completely REMOVED from DOM
    const bulkyGridExists = await page.evaluate(() => Boolean(document.getElementById('champWaitingGrid')));
    assert(!bulkyGridExists, 'Bulky 50-person touch tile grid must NOT exist in DOM');
    console.log('  ✅ Bulky touch tile grid successfully eliminated (clean, lightweight layout)');

    // Verify copy button label is '📋 Event Summary'
    const eventSummaryBtnText = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.find(b => b.textContent.includes('Event Summary'));
      return found ? found.textContent.trim() : null;
    });
    assert(eventSummaryBtnText && eventSummaryBtnText.includes('Event Summary'), 'Quick-copy button must be labeled "Event Summary"');
    console.log('  ✅ Quick-copy button verified as "📋 Event Summary"');

    // 4. Test Streamlined Chief Search & Quick Check-In Desk
    console.log('  🔍 Testing Streamlined Chief Search & Check-In Desk...');
    await page.type('#champChiefSearchInput', 'Iron');
    await new Promise(r => setTimeout(r, 200));

    const searchMatchFound = await page.evaluate(() => {
      const res = document.getElementById('champSearchTypeaheadResults');
      return res && res.textContent.includes('Ironman') && res.textContent.includes('Mark YES');
    });
    assert(searchMatchFound, 'Search typeahead must display matching chief with Mark YES button');

    // 1-Click Check-In: Click Mark YES
    await page.waitForSelector('#champ_search_action_1003 button', { timeout: 3000 });
    await page.click('#champ_search_action_1003 button');
    await new Promise(r => setTimeout(r, 300));

    const updatedStatYes = await page.$eval('#champStatYes', el => el.textContent.trim());
    assert.strictEqual(updatedStatYes, '2', 'Signed up count must increment to 2 after checking in Ironman');

    const searchItemState = await page.evaluate(() => {
      const badge = document.getElementById('champ_search_badge_1003');
      const action = document.getElementById('champ_search_action_1003');
      return {
        badgeText: badge ? badge.textContent.trim() : '',
        btnText: action ? action.textContent.trim() : ''
      };
    });
    assert(searchItemState.badgeText.includes('Signed Up'), 'Search card badge must update to Signed Up');
    assert(searchItemState.btnText.includes('Undo to NO'), 'Search card action button must change to Undo to NO');
    console.log('  ✅ In-place Check-In verified: live badge, Undo to NO button, and KPI counters updated');

    // 1-Click Undo: Click Undo to NO
    await page.click('#champ_search_action_1003 button');
    await new Promise(r => setTimeout(r, 300));

    const revertedStatYes = await page.$eval('#champStatYes', el => el.textContent.trim());
    assert.strictEqual(revertedStatYes, '1', 'Signed up count must revert to 1 after undo');

    const revertedItemState = await page.evaluate(() => {
      const badge = document.getElementById('champ_search_badge_1003');
      const action = document.getElementById('champ_search_action_1003');
      return {
        badgeText: badge ? badge.textContent.trim() : '',
        btnText: action ? action.textContent.trim() : ''
      };
    });
    assert(revertedItemState.badgeText.includes('Pending'), 'Search card badge must revert to Pending');
    assert(revertedItemState.btnText.includes('Mark YES'), 'Search card action button must revert to Mark YES');
    console.log('  ✅ In-place Undo verified: status reverted to NO smoothly');

    // Test Toggle Roster Table View button
    console.log('  🔍 Testing Toggle Full Roster Table button...');
    const initialTableDisplay = await page.$eval('#champTableContainer', el => el.style.display);
    assert.strictEqual(initialTableDisplay, 'none', 'Roster table must be collapsed by default');

    await page.click('#btnToggleChampTable');
    const openedTableDisplay = await page.$eval('#champTableContainer', el => el.style.display);
    assert.strictEqual(openedTableDisplay, 'block', 'Roster table must expand when toggle button clicked');

    await page.click('#btnToggleChampTable');
    const closedTableDisplay = await page.$eval('#champTableContainer', el => el.style.display);
    assert.strictEqual(closedTableDisplay, 'none', 'Roster table must collapse when clicked again');
    console.log('  ✅ Toggle Roster Table button verified expanding and collapsing cleanly');
    console.log('  ✅ Typeahead search accurately surfaced Ironman with 1-click [🟢 Mark YES]');

    // 5. Verify Step 3: Matchups & Round 5 Auto-Archive Celebration Modal
    console.log('  🔍 Testing Step 3: Matchups and Round 5 Auto-Archive Prompt...');
    await page.evaluate(async () => {
      await views.championshipAdmin('matchups');
    });

    await page.waitForSelector('#adm_champ_save_btn', { timeout: 5000 });
    const finishBtnExists = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent.includes('Finish & Archive Season'));
    });
    assert(finishBtnExists, 'Matchups view must feature Finish & Archive Season button');

    // Trigger celebration modal programmatically to simulate Round 5 completion
    await page.evaluate(() => {
      window.showChampSeasonCompleteModal(window.DEFAULT_CHAMPIONSHIP_MATCHUPS);
    });

    await page.waitForSelector('#champSeasonCompleteModal', { timeout: 5000 });
    const modalHeader = await page.$eval('#champSeasonCompleteModal h2', el => el.textContent);
    assert(modalHeader.includes('Round 5 Complete'), 'Celebration modal header must announce Round 5 completion');

    const archiveNowBtn = await page.$('#btnChampModalArchiveNow');
    const keepViewingBtn = await page.$('#btnChampModalKeepViewing');
    assert(archiveNowBtn, 'Celebration modal must provide Archive Season & Prepare Next button');
    assert(keepViewingBtn, 'Celebration modal must provide Keep Viewing button');
    console.log('  ✅ Round 5 Auto-Archive Celebration Modal verified with record showcase & action buttons');

    // Test Keep Viewing closes modal cleanly
    await page.click('#btnChampModalKeepViewing');
    await new Promise(r => setTimeout(r, 200));
    const modalDismissed = await page.evaluate(() => !document.getElementById('champSeasonCompleteModal'));
    assert(modalDismissed, 'Keep Viewing button must cleanly dismiss modal');
    console.log('  ✅ Modal dismissed cleanly when Keep Viewing selected');

    // 6. Test Responsive Layout across Viewports
    const viewports = [
      { name: 'Desktop (1280px)', width: 1280, height: 900 },
      { name: 'Tablet (768px)', width: 768, height: 1024 },
      { name: 'Mobile (375px)', width: 375, height: 812 }
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise(r => setTimeout(r, 200));

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      assert(scrollWidth <= clientWidth, `Horizontal scroll overflow detected at ${vp.name} (${scrollWidth}px > ${clientWidth}px)`);
      console.log(`  ✅ Zero horizontal scroll overflow at ${vp.name}`);
    }

    assert.strictEqual(consoleErrors.length, 0, `Fatal console errors occurred: ${JSON.stringify(consoleErrors)}`);
    console.log('  ✅ Zero fatal browser console errors recorded during runtime');

  } finally {
    await browser.close();
    server.close();
  }

  console.log('\n🎉 ALL ALLIANCE CHAMPIONSHIP 3-STEP REDESIGN TESTS PASSED 100%!');
}

async function main() {
  runStaticVerification();
  await runHeadlessVerification();
}

main().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
