// tools/test_championship_locking_headless.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const PORT = 8104;
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
  console.log('📦 Starting Static & Structural Verification for Alliance Championship Locking & Navigator...');
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

  // Verify critical signatures and DOM patterns
  assert(code.includes('window.toggleChampRoundLock ='), 'main.js must define window.toggleChampRoundLock');
  assert(code.includes('window.jumpToChampRound ='), 'main.js must define window.jumpToChampRound');
  assert(code.includes('window.filterChampRoundView ='), 'main.js must define window.filterChampRoundView');
  assert(code.includes('window._champRoundLockState'), 'main.js must maintain window._champRoundLockState');
  assert(code.includes('window._champNextRoundNum'), 'main.js must compute window._champNextRoundNum');
  assert(code.includes('adm_champ_r'), 'main.js must have round inputs');
  assert(code.includes('adm_champ_r${i}_lock_btn') || code.includes('adm_champ_r') && code.includes('_lock_btn'), 'main.js must define round lock buttons');
  assert(code.includes('Tournament Round Guide'), 'main.js must provide Tournament Round Guide in matchups view');
  assert(code.includes('NEXT ROUND TO UPDATE'), 'main.js must display NEXT ROUND TO UPDATE badge');
  assert(code.includes('champ_stepper_chip_'), 'main.js must render stepper chips');

  console.log('  ✅ Static signatures, buttons, and template contents confirmed');
}

async function runHeadlessVerification() {
  if (!puppeteer || !chromePath) {
    console.warn('⚠️ Puppeteer or Chrome not found. Skipping live browser test step; static verification passed.');
    return;
  }
  console.log('🚀 Launching Real Headless Chrome verification suite for Championship Locking & Guide...');

  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    let safeUrl = req.url.split('?')[0];
    if (safeUrl === '/') safeUrl = '/index.html';
    const filePath = path.join(DIST_DIR, safeUrl);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  await new Promise(resolve => server.listen(PORT, resolve));

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1280,800']
  });

  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      if (!txt.includes('favicon.ico') && !txt.includes('404')) {
        consoleErrors.push(txt);
      }
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.toString());
  });

  try {
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle0', timeout: 30000 });

    // Inject staff mock and open Championship Admin Matchups tab
    await page.evaluate(async () => {
      window.currentUser = { uid: 'test_admin_123', email: 'admin@bdc.test', displayName: 'Staff Leader' };
      window.isAdminUser = () => true;
      window.getAdminLevel = () => 'R5';
      window.isGoogleAuthVerified = async () => true;

      // Provide mock championship matchups data: Round 1 has entered data, Round 2 is next up
      window._latestChampionshipMatchups = {
        seasonName: 'Test Championship Season',
        statusText: '1 Wins – 0 Losses (Season Active)',
        ourSeasonFlags: 32,
        enemySeasonFlags: 20,
        ourState: '2089',
        rounds: {
          r1: { roundNum: 1, date: 'Round 1', ourFlags: 32, ourState: '2089', enemyAlliance: { name: '[KOR] KoreaKings', state: '2045', flags: 20 } },
          r2: { roundNum: 2, date: 'Round 2', ourFlags: 0, ourState: '2089', enemyAlliance: { name: 'Opponent 2', state: '1988', flags: 0 } },
          r3: { roundNum: 3, date: 'Round 3', ourFlags: 0, ourState: '2089', enemyAlliance: { name: 'Opponent 3', state: '2102', flags: 0 } },
          r4: { roundNum: 4, date: 'Round 4', ourFlags: 0, ourState: '2089', enemyAlliance: { name: 'Opponent 4', state: '2031', flags: 0 } },
          r5: { roundNum: 5, date: 'Round 5', ourFlags: 0, ourState: '2089', enemyAlliance: { name: 'Opponent 5', state: '2015', flags: 0 } }
        }
      };

      // Mock fetchChampionshipMatchups
      window.fetchChampionshipMatchups = async () => window._latestChampionshipMatchups;
      window.fetchChampionshipData = async () => ({});
      window.fetchRoster = async () => ({});

      // Navigate to Matchups editor tab
      await window.views.championshipAdmin('matchups');
    });

    await page.waitForSelector('#champ_round_card_1', { timeout: 10000 });

    console.log('  🔍 Verifying Tournament Round Guide DOM elements...');
    const guideStatus = await page.evaluate(() => {
      const guideBadge = document.getElementById('champ_guide_status_badge');
      const jumpBtn = document.getElementById('champJumpNextBtn');
      const allFilter = document.getElementById('champViewFilter_all');
      const nextFilter = document.getElementById('champViewFilter_next');
      return {
        badgeText: guideBadge ? guideBadge.innerText : null,
        hasJumpBtn: Boolean(jumpBtn),
        jumpBtnText: jumpBtn ? jumpBtn.innerText : null,
        hasAllFilter: Boolean(allFilter),
        hasNextFilter: Boolean(nextFilter)
      };
    });

    assert(guideStatus.badgeText && guideStatus.badgeText.includes('Round 2 Needs Update'), 'Guide badge must identify Round 2 as needing update');
    assert(guideStatus.hasJumpBtn, 'Must render Jump to Round 2 button');
    assert(guideStatus.jumpBtnText.includes('Jump to Round 2'), 'Jump button text must target Round 2');
    console.log('  ✅ Tournament Round Guide accurately identified Round 2 as Next Up');

    console.log('  🔍 Verifying Stepper Chips...');
    const stepperData = await page.evaluate(() => {
      const chips = [];
      for (let i = 1; i <= 5; i++) {
        const chip = document.getElementById(`champ_stepper_chip_${i}`);
        const lockSpan = document.getElementById(`champ_stepper_lock_${i}`);
        chips.push({
          exists: Boolean(chip),
          lockIcon: lockSpan ? lockSpan.innerText : null
        });
      }
      return chips;
    });

    assert.strictEqual(stepperData.length, 5, 'Must have 5 stepper chips');
    assert.strictEqual(stepperData[0].lockIcon, '🔒', 'Round 1 (has data) must show 🔒 in stepper');
    assert.strictEqual(stepperData[1].lockIcon, '🔓', 'Round 2 (pending) must show 🔓 in stepper');
    console.log('  ✅ 5 Stepper chips rendered with correct lock icons');

    console.log('  🔍 Verifying Round 1 Input Locking Protection...');
    const r1Inputs = await page.evaluate(() => {
      const ourFlags = document.getElementById('adm_champ_r1_our_flags');
      const enemyFlags = document.getElementById('adm_champ_r1_enemy_flags');
      const enemyName = document.getElementById('adm_champ_r1_enemy_name');
      const lockBtn = document.getElementById('adm_champ_r1_lock_btn');

      return {
        ourFlagsDisabled: ourFlags ? ourFlags.disabled : null,
        enemyFlagsDisabled: enemyFlags ? enemyFlags.disabled : null,
        enemyNameDisabled: enemyName ? enemyName.disabled : null,
        btnText: lockBtn ? lockBtn.innerText : null
      };
    });

    assert(r1Inputs.ourFlagsDisabled === true, 'Round 1 ourFlags input must be disabled by default');
    assert(r1Inputs.enemyFlagsDisabled === true, 'Round 1 enemyFlags input must be disabled by default');
    assert(r1Inputs.enemyNameDisabled === true, 'Round 1 enemyName input must be disabled by default');
    assert(r1Inputs.btnText.includes('Locked'), 'Round 1 lock button must indicate Locked state');
    console.log('  ✅ Round 1 inputs are safely locked against accidental edits');

    console.log('  🔍 Testing Interactive Unlock & Lock Toggling...');
    await page.click('#adm_champ_r1_lock_btn');

    const r1Unlocked = await page.evaluate(() => {
      const ourFlags = document.getElementById('adm_champ_r1_our_flags');
      const lockBtn = document.getElementById('adm_champ_r1_lock_btn');
      const stepperLock = document.getElementById('champ_stepper_lock_1');
      return {
        ourFlagsDisabled: ourFlags ? ourFlags.disabled : null,
        btnText: lockBtn ? lockBtn.innerText : null,
        stepperLock: stepperLock ? stepperLock.innerText : null
      };
    });

    assert(r1Unlocked.ourFlagsDisabled === false, 'Round 1 inputs must be enabled after unlock');
    assert(r1Unlocked.btnText.includes('Unlocked'), 'Lock button must change to Unlocked');
    assert.strictEqual(r1Unlocked.stepperLock, '🔓', 'Stepper lock must sync to 🔓');
    console.log('  ✅ Unlocking Round 1 enabled all inputs and synchronized the stepper');

    // Re-lock Round 1
    await page.click('#adm_champ_r1_lock_btn');
    const r1Relocked = await page.evaluate(() => {
      return document.getElementById('adm_champ_r1_our_flags')?.disabled;
    });
    assert.strictEqual(r1Relocked, true, 'Round 1 must re-lock on second click');
    console.log('  ✅ Re-locking successfully secured the inputs again');

    console.log('  🔍 Testing View Filter ("Focus Next" vs "All")...');
    await page.click('#champViewFilter_next');
    const filterNextState = await page.evaluate(() => {
      return {
        r1Display: document.getElementById('champ_round_card_1')?.style.display,
        r2Display: document.getElementById('champ_round_card_2')?.style.display,
        r3Display: document.getElementById('champ_round_card_3')?.style.display
      };
    });

    assert.strictEqual(filterNextState.r1Display, 'none', 'Round 1 card must be hidden in Focus Next mode');
    assert.strictEqual(filterNextState.r2Display, 'flex', 'Round 2 card must be visible in Focus Next mode');
    assert.strictEqual(filterNextState.r3Display, 'none', 'Round 3 card must be hidden in Focus Next mode');
    console.log('  ✅ Focus Next filter correctly displays only Round 2');

    await page.click('#champViewFilter_all');
    const filterAllState = await page.evaluate(() => {
      return {
        r1Display: document.getElementById('champ_round_card_1')?.style.display,
        r2Display: document.getElementById('champ_round_card_2')?.style.display,
        r3Display: document.getElementById('champ_round_card_3')?.style.display
      };
    });
    assert.strictEqual(filterAllState.r1Display, 'flex', 'Round 1 card must be visible in All mode');
    assert.strictEqual(filterAllState.r2Display, 'flex', 'Round 2 card must be visible in All mode');
    assert.strictEqual(filterAllState.r3Display, 'flex', 'Round 3 card must be visible in All mode');
    console.log('  ✅ All filter correctly restores all 5 round cards');

    assert.strictEqual(consoleErrors.length, 0, `Expected 0 console errors, but got:\n${consoleErrors.join('\n')}`);
    console.log('  ✅ Zero browser console errors recorded during runtime tests');

    console.log('🎉 All automated Championship Locking & Guidance verification tests PASSED with 100% success!');
  } finally {
    await browser.close();
    server.close();
  }
}

async function main() {
  runStaticVerification();
  await runHeadlessVerification();
}

main().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
