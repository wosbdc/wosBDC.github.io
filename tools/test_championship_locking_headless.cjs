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
  assert(code.includes('window.recalcChampNavigator ='), 'main.js must define window.recalcChampNavigator');
  assert(code.includes('window._champRoundLockState'), 'main.js must maintain window._champRoundLockState');
  assert(code.includes('window._champNextRoundNum'), 'main.js must compute window._champNextRoundNum');
  assert(code.includes('adm_champ_r'), 'main.js must have round inputs');
  assert(code.includes('Tournament Round Guide'), 'main.js must provide Tournament Round Guide in matchups view');
  assert(code.includes('WAITING ON UPDATE'), 'main.js must display WAITING ON UPDATE badge');
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
      if (!txt.includes('favicon.ico') && !txt.includes('404') && !txt.includes('403')) {
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

      // Provide mock championship matchups data matching the user's exact live scenario:
      // R1 won, R2 lost, R3/R4/R5 have scouted opponent names but 0-0 flags (unplayed)
      window._latestChampionshipMatchups = {
        seasonName: 'Alliance Championship Season',
        statusText: '1 Wins – 1 Losses',
        ourSeasonFlags: 3,
        enemySeasonFlags: 3,
        ourState: '2089',
        rounds: {
          r1: { roundNum: 1, date: 'Round 1', ourFlags: 2, ourState: '2089', enemyAlliance: { name: '[tka]TheKingsAssembl', state: '2045', flags: 1 } },
          r2: { roundNum: 2, date: 'Round 2', ourFlags: 1, ourState: '2089', enemyAlliance: { name: '[B4R]Brats4ndRum', state: '1988', flags: 2 } },
          r3: { roundNum: 3, date: 'Round 3', ourFlags: 0, ourState: '2089', enemyAlliance: { name: '[WIT]Wit', state: '2102', flags: 0 } },
          r4: { roundNum: 4, date: 'Round 4', ourFlags: 0, ourState: '2089', enemyAlliance: { name: '[AnH]AuFnachHouse', state: '2031', flags: 0 } },
          r5: { roundNum: 5, date: 'Round 5', ourFlags: 0, ourState: '2089', enemyAlliance: { name: '[NXS]NEXUS', state: '2015', flags: 0 } }
        }
      };

      // Mock fetchChampionshipMatchups
      window.fetchChampionshipMatchups = async () => window._latestChampionshipMatchups;
      window.fetchChampionshipData = async () => ({});
      window.fetchRoster = async () => ({});
      window.saveChampionshipAdminMatchups = async () => true;

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

    assert(guideStatus.badgeText && guideStatus.badgeText.includes('Round 3 Waiting on Update'), 'Guide badge must identify Round 3 as Waiting on Update');
    assert(guideStatus.hasJumpBtn, 'Must render Jump to Round 3 button');
    assert(guideStatus.jumpBtnText.includes('Jump to Round 3'), 'Jump button text must target Round 3');
    console.log('  ✅ Tournament Round Guide accurately identified Round 3 as Waiting on Update');

    console.log('  🔍 Verifying Stepper Chips and Alert Badges...');
    const stepperData = await page.evaluate(() => {
      const chips = [];
      for (let i = 1; i <= 5; i++) {
        const chip = document.getElementById(`champ_stepper_chip_${i}`);
        const lockSpan = document.getElementById(`champ_stepper_lock_${i}`);
        const outcomeSpan = document.getElementById(`champ_stepper_outcome_${i}`);
        const scoreDiv = document.getElementById(`champ_stepper_score_${i}`);
        chips.push({
          exists: Boolean(chip),
          lockIcon: lockSpan ? lockSpan.innerText : null,
          outcomeText: outcomeSpan ? outcomeSpan.innerText : null,
          scoreText: scoreDiv ? scoreDiv.innerText : null
        });
      }
      return chips;
    });

    assert.strictEqual(stepperData.length, 5, 'Must have 5 stepper chips');
    assert.strictEqual(stepperData[0].lockIcon, '🔒', 'Round 1 (completed) must show 🔒 in stepper');
    assert(stepperData[0].outcomeText.includes('WON'), 'Round 1 must show WON');
    assert.strictEqual(stepperData[1].lockIcon, '🔒', 'Round 2 (completed) must show 🔒 in stepper');
    assert(stepperData[1].outcomeText.includes('LOST'), 'Round 2 must show LOST');

    // Round 3 is the active round waiting on update!
    assert.strictEqual(stepperData[2].lockIcon, '🔓', 'Round 3 (active round) must show 🔓 in stepper');
    assert(stepperData[2].outcomeText.includes('WAITING ON UPDATE'), 'Round 3 must show WAITING ON UPDATE alert');
    assert(!stepperData[2].outcomeText.includes('DRAW'), 'Round 3 must NOT show DRAW');

    // Rounds 4 & 5 are upcoming rounds
    assert.strictEqual(stepperData[3].lockIcon, '🔒', 'Round 4 (upcoming) must show 🔒 in stepper');
    assert(stepperData[3].outcomeText.includes('UPCOMING'), 'Round 4 must show UPCOMING');
    assert(!stepperData[3].outcomeText.includes('DRAW'), 'Round 4 must NOT show DRAW');
    assert.strictEqual(stepperData[4].lockIcon, '🔒', 'Round 5 (upcoming) must show 🔒 in stepper');
    assert(stepperData[4].outcomeText.includes('UPCOMING'), 'Round 5 must show UPCOMING');
    assert(!stepperData[4].outcomeText.includes('DRAW'), 'Round 5 must NOT show DRAW');
    console.log('  ✅ 5 Stepper chips correctly rendered with Round 3 Waiting on Update alert and zero false DRAWS');

    console.log('  🔍 Verifying Round 3 Card Header Badge...');
    const r3CardHeader = await page.evaluate(() => {
      const nextBadge = document.getElementById('champ_next_badge_r3');
      const liveBadge = document.getElementById('live_badge_r3');
      return {
        nextBadgeDisplay: nextBadge ? nextBadge.style.display : null,
        nextBadgeText: nextBadge ? nextBadge.innerText : null,
        liveBadgeText: liveBadge ? liveBadge.innerText : null
      };
    });
    assert(r3CardHeader.nextBadgeText.includes('WAITING ON UPDATE'), 'Round 3 card header must show WAITING ON UPDATE');
    assert(r3CardHeader.liveBadgeText.includes('READY FOR INPUT'), 'Round 3 live badge must show READY FOR INPUT');
    console.log('  ✅ Round 3 card header displays active alert');

    console.log('  🔍 Testing Dynamic Alert Progression: Entering flags in Round 3 moves alert to Round 4...');
    await page.evaluate(() => {
      const ourFlagsInput = document.getElementById('adm_champ_r3_our_flags');
      const enemyFlagsInput = document.getElementById('adm_champ_r3_enemy_flags');
      ourFlagsInput.value = '3';
      enemyFlagsInput.value = '1';
      window.updateAdminChampPreview(3);
    });

    const progressionState = await page.evaluate(() => {
      const r3Outcome = document.getElementById('champ_stepper_outcome_3')?.innerText;
      const r4Outcome = document.getElementById('champ_stepper_outcome_4')?.innerText;
      const guideBadge = document.getElementById('champ_guide_status_badge')?.innerText;
      const jumpBtn = document.getElementById('champJumpNextBtn')?.innerText;
      const r4NextBadge = document.getElementById('champ_next_badge_r4')?.innerText;
      const r4NextDisplay = document.getElementById('champ_next_badge_r4')?.style.display;
      return {
        r3Outcome,
        r4Outcome,
        guideBadge,
        jumpBtn,
        r4NextBadge,
        r4NextDisplay
      };
    });

    assert(progressionState.r3Outcome.includes('WON'), 'Round 3 stepper must now show WON');
    assert(progressionState.r4Outcome.includes('WAITING ON UPDATE'), 'Round 4 stepper must now show WAITING ON UPDATE alert');
    assert(progressionState.guideBadge.includes('Round 4 Waiting on Update'), 'Guide badge must now target Round 4');
    assert(progressionState.jumpBtn.includes('Jump to Round 4'), 'Jump button must now target Round 4');
    assert(progressionState.r4NextBadge.includes('WAITING ON UPDATE'), 'Round 4 card header must now show WAITING ON UPDATE');
    assert.strictEqual(progressionState.r4NextDisplay, 'inline-flex', 'Round 4 header badge must be visible');
    console.log('  ✅ Entering flags on Round 3 successfully moved the Waiting on Update alert to Round 4!');

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
    await page.evaluate(() => {
      document.getElementById('champViewFilter_next').click();
    });

    const filterNextState = await page.evaluate(() => {
      return {
        r1Display: document.getElementById('champ_round_card_1')?.style.display,
        r2Display: document.getElementById('champ_round_card_2')?.style.display,
        r3Display: document.getElementById('champ_round_card_3')?.style.display,
        r4Display: document.getElementById('champ_round_card_4')?.style.display,
        r5Display: document.getElementById('champ_round_card_5')?.style.display,
        activeRoundNum: window._champNextRoundNum
      };
    });

    assert.strictEqual(filterNextState.activeRoundNum, 4, 'Active round must be Round 4 after R1, R2, R3 have flags');
    assert.strictEqual(filterNextState.r1Display, 'none', 'Round 1 card must be hidden in Focus Next mode');
    assert.strictEqual(filterNextState.r2Display, 'none', 'Round 2 card must be hidden in Focus Next mode');
    assert.strictEqual(filterNextState.r3Display, 'none', 'Round 3 card must be hidden in Focus Next mode');
    assert.strictEqual(filterNextState.r4Display, 'flex', 'Round 4 card must be visible in Focus Next mode');
    assert.strictEqual(filterNextState.r5Display, 'none', 'Round 5 card must be hidden in Focus Next mode');
    console.log('  ✅ Focus Next filter correctly displays only active Round 4');

    await page.evaluate(() => {
      document.getElementById('champViewFilter_all').click();
    });

    const filterAllState = await page.evaluate(() => {
      return {
        r1Display: document.getElementById('champ_round_card_1')?.style.display,
        r2Display: document.getElementById('champ_round_card_2')?.style.display,
        r3Display: document.getElementById('champ_round_card_3')?.style.display,
        r4Display: document.getElementById('champ_round_card_4')?.style.display,
        r5Display: document.getElementById('champ_round_card_5')?.style.display
      };
    });
    assert.strictEqual(filterAllState.r1Display, 'flex', 'Round 1 card must be visible in All mode');
    assert.strictEqual(filterAllState.r2Display, 'flex', 'Round 2 card must be visible in All mode');
    assert.strictEqual(filterAllState.r3Display, 'flex', 'Round 3 card must be visible in All mode');
    assert.strictEqual(filterAllState.r4Display, 'flex', 'Round 4 card must be visible in All mode');
    assert.strictEqual(filterAllState.r5Display, 'flex', 'Round 5 card must be visible in All mode');
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
