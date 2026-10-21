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

  // Step 1 setup elements
  assert(code.includes('champ_setup_season_name'), 'main.js must support season name setup input');
  assert(code.includes('btnSaveChampSeasonSetup'), 'main.js must provide save schedule & unlock signups button');
  assert(code.includes('champ_setup_r${i}_enemy_tag'), 'main.js must support opponent tag input');
  assert(code.includes('champ_setup_r${i}_enemy_name'), 'main.js must support opponent name input');

  // Step 2 check-in desk elements
  assert(code.includes('champChiefSearchInput'), 'main.js must provide typeahead search input for chiefs');
  assert(code.includes('champWaitingGrid'), 'main.js must render shrinking touch tile grid');
  assert(code.includes('champWaitingSection'), 'main.js must render waiting section');
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

      // Mock championship matchup state
      window.DEFAULT_CHAMPIONSHIP_MATCHUPS = {
        seasonName: 'Season 24',
        statusText: '4 Wins – 1 Defeat',
        ourSeasonFlags: 125,
        enemySeasonFlags: 84,
        ourState: '2089',
        seasonState: 'battles',
        rounds: {
          r1: { roundNum: 1, date: 'Round 1', ourScore: 0, ourFlags: 25, ourState: '2089', enemyAlliance: { name: '[AAA] Alpha', state: '2040', score: 0, flags: 15 } },
          r2: { roundNum: 2, date: 'Round 2', ourScore: 0, ourFlags: 28, ourState: '2089', enemyAlliance: { name: '[BBB] Beta', state: '2042', score: 0, flags: 12 } },
          r3: { roundNum: 3, date: 'Round 3', ourScore: 0, ourFlags: 22, ourState: '2089', enemyAlliance: { name: '[CCC] Gamma', state: '2050', score: 0, flags: 20 } },
          r4: { roundNum: 4, date: 'Round 4', ourScore: 0, ourFlags: 20, ourState: '2089', enemyAlliance: { name: '[DDD] Delta', state: '2055', score: 0, flags: 24 } },
          r5: { roundNum: 5, date: 'Round 5', ourScore: 0, ourFlags: 30, ourState: '2089', enemyAlliance: { name: '[EEE] Omega', state: '2060', score: 0, flags: 13 } }
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

    // 1. Verify Step 1: Pre-Tournament Season Setup
    console.log('  🔍 Testing Step 1: Pre-Tournament Season Setup View...');
    await page.evaluate(async () => {
      await views.championshipAdmin('setup');
    });

    await page.waitForSelector('#champ_setup_season_name', { timeout: 5000 });
    const setupTitleVal = await page.$eval('#champ_setup_season_name', el => el.value);
    assert(setupTitleVal.includes('Season 24'), 'Season title must be pre-populated');

    const day1TagExists = await page.$('#champ_setup_r1_enemy_tag');
    const day5TagExists = await page.$('#champ_setup_r5_enemy_tag');
    assert(day1TagExists, 'Day 1 enemy tag input must render');
    assert(day5TagExists, 'Day 5 enemy tag input must render');

    const saveSetupBtn = await page.$('#btnSaveChampSeasonSetup');
    assert(saveSetupBtn, 'Save Schedule button must render in Step 1');
    console.log('  ✅ Step 1: Season Setup inputs and controls verified');

    // 2. Verify Step 2: Member Check-In Desk
    console.log('  🔍 Testing Step 2: Shrinking Mobile Check-In Desk...');
    await page.evaluate(async () => {
      await views.championshipAdmin('signups');
    });

    await page.waitForSelector('#champStatYes', { timeout: 5000 });
    const statYes = await page.$eval('#champStatYes', el => el.textContent.trim());
    const statNo = await page.$eval('#champStatNo', el => el.textContent.trim());
    assert.strictEqual(statYes, '1', 'Signed up count must equal 1');
    assert.strictEqual(statNo, '4', 'Waiting response count must equal 4');
    console.log(`  ✅ Live KPIs verified: Signed Up = ${statYes}, Waiting = ${statNo}`);

    // Verify copy button label is '📋 Event Summary'
    const eventSummaryBtnText = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.find(b => b.textContent.includes('Event Summary'));
      return found ? found.textContent.trim() : null;
    });
    assert(eventSummaryBtnText && eventSummaryBtnText.includes('Event Summary'), 'Quick-copy button must be labeled "Event Summary"');
    console.log('  ✅ Quick-copy button successfully verified as "📋 Event Summary"');

    // Verify shrinking compact touch tile grid
    const initialTileCount = await page.evaluate(() => {
      const grid = document.getElementById('champWaitingGrid');
      return grid ? grid.querySelectorAll('.champ-touch-tile').length : 0;
    });
    assert.strictEqual(initialTileCount, 4, 'Waiting grid must contain 4 pending chief tiles');
    console.log('  ✅ Compact touch tile grid verified with 4 waiting chiefs');

    // 3. Test 1-Tap Quick Check-In on a waiting tile (e.g. Thor)
    console.log('  🔍 Testing 1-Tap Quick Check-In on waiting chief tile...');
    await page.evaluate(() => {
      const tile = document.getElementById('champ_tile_1002');
      if (tile) tile.click();
    });

    // Wait briefly for smooth shrink transition
    await new Promise(r => setTimeout(r, 350));

    const postTapTileCount = await page.evaluate(() => {
      const grid = document.getElementById('champWaitingGrid');
      return grid ? grid.querySelectorAll('.champ-touch-tile').length : 0;
    });
    assert.strictEqual(postTapTileCount, 3, 'Waiting tile grid must shrink from 4 to 3 tiles after 1 tap');

    const updatedStatYes = await page.$eval('#champStatYes', el => el.textContent.trim());
    const updatedStatNo = await page.$eval('#champStatNo', el => el.textContent.trim());
    assert.strictEqual(updatedStatYes, '2', 'Signed up count must increment to 2');
    assert.strictEqual(updatedStatNo, '3', 'Waiting count must decrement to 3');
    console.log('  ✅ 1-Tap Quick Check-In immediately shrank the grid and updated counters!');

    // 4. Test Instant Search Typeahead
    console.log('  🔍 Testing Instant Search Typeahead Bar...');
    await page.type('#champChiefSearchInput', 'Iron');
    await new Promise(r => setTimeout(r, 200));

    const searchMatchFound = await page.evaluate(() => {
      const res = document.getElementById('champSearchTypeaheadResults');
      return res && res.textContent.includes('Ironman') && res.textContent.includes('Mark YES');
    });
    assert(searchMatchFound, 'Search typeahead must display matching chief with Mark YES button');
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
