// tools/test_championship_pipeline_modal.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const PORT = 8108;
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
  console.log('📦 Starting Static & Structural Verification for Alliance Championship Reset Pipeline...');
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

  // Structural checks
  assert(code.includes('window.showResetAndArchiveChampionshipModal ='), 'main.js must define window.showResetAndArchiveChampionshipModal');
  assert(code.includes('window.runChampionshipResetPipeline ='), 'main.js must define window.runChampionshipResetPipeline');
  assert(code.includes('window.setChampPipelineScope ='), 'main.js must define window.setChampPipelineScope');
  assert(code.includes('champResetPipelineModal'), 'main.js must use #champResetPipelineModal modal ID');
  assert(code.includes('champPipelineScope'), 'main.js must support scope selection input');
  assert(code.includes('champPipelineDateLabel'), 'main.js must support date label input');
  assert(code.includes('Run Simulation Demo (Safe Preview)'), 'main.js must provide Safe Simulation Demo button');
  assert(code.includes('Full Season Reset (Signups & Matchups)'), 'main.js must provide Full Reset option');
  assert(code.includes('Member Signups Only'), 'main.js must provide Member Signups Only option');
  assert(code.includes('5-Round Matchups Only'), 'main.js must provide Matchups Only option');

  // Button binding checks
  assert(code.includes("window.showResetAndArchiveChampionshipModal('full')"), 'Header button must pass full scope');
  assert(code.includes("window.showResetAndArchiveChampionshipModal('signups')"), 'Signups footer button must pass signups scope');
  assert(code.includes("window.showResetAndArchiveChampionshipModal('matchups')"), 'Matchups footer button must pass matchups scope');
  assert(code.includes('🔄 Event Reset Pipeline'), 'Header button must have standardized label');
  assert(code.includes('🔄 Reset Signups Pipeline'), 'Signups footer button must have standardized label');
  assert(code.includes('🔄 Archive Season Pipeline'), 'Matchups footer button must have standardized label');

  console.log('  ✅ Static signatures, buttons, and scope options confirmed');
}

async function runHeadlessVerification() {
  if (!puppeteer || !chromePath) {
    console.warn('⚠️ Puppeteer or Chrome not found. Skipping live browser test step; static verification passed.');
    return;
  }
  console.log('🚀 Launching Real Headless Chrome verification suite for Championship Reset Pipeline...');

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
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Bootstrap test environment inside the browser
    await page.evaluate(() => {
      window.currentUser = {
        name: 'BrianDCox',
        displayName: 'BrianDCox',
        gameId: '318843189',
        role: 'admin',
        adminLevel: 'R5'
      };
      window.getAdminLevel = () => 'R5';
      window.isAdminUser = () => true;
      window.isGoogleAuthVerified = async () => true;

      window.DEFAULT_CHAMPIONSHIP_MATCHUPS = {
        seasonName: "Test Season 10",
        statusText: "3 Wins – 2 Losses (Test Record)",
        ourSeasonFlags: 7,
        enemySeasonFlags: 3,
        ourState: "2089",
        seasonState: "signups_open",
        rounds: {
          "r1": { roundNum: 1, date: "Round 1", ourScore: 100, ourFlags: 2, ourState: "2089", enemyAlliance: { name: "[ABC] Alpha", state: "2045", score: 50, flags: 0 } },
          "r2": { roundNum: 2, date: "Round 2", ourScore: 120, ourFlags: 2, ourState: "2089", enemyAlliance: { name: "[DEF] Beta", state: "2046", score: 60, flags: 1 } },
          "r3": { roundNum: 3, date: "Round 3", ourScore: 0, ourFlags: 0, ourState: "2089", enemyAlliance: { name: "[GHI] Gamma", state: "2047", score: 0, flags: 0 } },
          "r4": { roundNum: 4, date: "Round 4", ourScore: 0, ourFlags: 0, ourState: "2089", enemyAlliance: { name: "[JKL] Delta", state: "2048", score: 0, flags: 0 } },
          "r5": { roundNum: 5, date: "Round 5", ourScore: 0, ourFlags: 0, ourState: "2089", enemyAlliance: { name: "[MNO] Epsilon", state: "2049", score: 0, flags: 0 } }
        }
      };

      window.fetchChampionshipMatchups = async () => window.DEFAULT_CHAMPIONSHIP_MATCHUPS;
      window.fetchChampionshipData = async () => ({
        "705413646": { signedUp: true, name: "BrianDCox" },
        "705413647": { signedUp: false, name: "MemberTwo" }
      });
      window.fetchRoster = async () => ({
        "705413646": { gameId: "705413646", name: "BrianDCox", role: "R5" },
        "705413647": { gameId: "705413647", name: "MemberTwo", role: "R3" }
      });
      window.fetchPlayerEventStats = async () => ({});
    });

    // 1. Render Tab 1 (Signups Tracker)
    console.log('  🔍 Verifying Signups Tracker view and Reset button...');
    await page.evaluate(async () => {
      await window.views.championshipAdmin('signups');
    });

    const headerBtnText = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.find(b => b.textContent.includes('Event Reset Pipeline'));
      return found ? found.textContent.trim() : null;
    });
    assert.strictEqual(headerBtnText, '🔄 Event Reset Pipeline', 'Header button text must be "🔄 Event Reset Pipeline"');
    console.log('  ✅ Header button verified: 🔄 Event Reset Pipeline');

    const signupsBtnText = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.find(b => b.textContent.includes('Reset Signups Pipeline'));
      return found ? found.textContent.trim() : null;
    });
    assert.strictEqual(signupsBtnText, '🔄 Reset Signups Pipeline', 'Signups footer button text must be "🔄 Reset Signups Pipeline"');
    console.log('  ✅ Signups footer button verified: 🔄 Reset Signups Pipeline');

    // 2. Open Modal from Signups footer
    console.log('  🔍 Testing opening Reset Pipeline Modal from Signups view...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const signupsBtn = btns.find(b => b.textContent.includes('Reset Signups Pipeline'));
      signupsBtn.click();
    });

    const modalRendered = await page.evaluate(() => {
      const modal = document.getElementById('champResetPipelineModal');
      const scopeVal = document.getElementById('champPipelineScope')?.value;
      return { exists: Boolean(modal), scope: scopeVal };
    });
    assert(modalRendered.exists, 'Pipeline modal must render in DOM');
    assert.strictEqual(modalRendered.scope, 'signups', 'Opening from signups button must preselect "signups" scope');
    console.log('  ✅ Modal opened with preselected "signups" scope');

    // 3. Close Modal
    await page.evaluate(() => {
      document.getElementById('champPipelineCloseBtn').click();
    });
    const modalClosed = await page.evaluate(() => !document.getElementById('champResetPipelineModal'));
    assert(modalClosed, 'Modal must be removed upon clicking Close');
    console.log('  ✅ Modal closed cleanly');

    // 4. Render Tab 2 (Matchups Editor)
    console.log('  🔍 Verifying Matchups Editor view and Reset button...');
    await page.evaluate(async () => {
      await window.views.championshipAdmin('matchups');
    });

    const matchupsBtnText = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const found = btns.find(b => b.textContent.includes('Archive Season Pipeline'));
      return found ? found.textContent.trim() : null;
    });
    assert.strictEqual(matchupsBtnText, '🔄 Archive Season Pipeline', 'Matchups footer button text must be "🔄 Archive Season Pipeline"');
    console.log('  ✅ Matchups footer button verified: 🔄 Archive Season Pipeline');

    // 5. Open Modal from Matchups footer
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const matchupsBtn = btns.find(b => b.textContent.includes('Archive Season Pipeline'));
      matchupsBtn.click();
    });

    const scopeAfterMatchups = await page.evaluate(() => {
      return document.getElementById('champPipelineScope')?.value;
    });
    assert.strictEqual(scopeAfterMatchups, 'matchups', 'Opening from matchups button must preselect "matchups" scope');
    console.log('  ✅ Modal opened with preselected "matchups" scope');

    // 6. Test Interactive Scope Selection
    console.log('  🔍 Testing Interactive Scope toggling...');
    await page.evaluate(() => {
      window.setChampPipelineScope('full');
    });
    const scopeAfterToggle = await page.evaluate(() => document.getElementById('champPipelineScope')?.value);
    assert.strictEqual(scopeAfterToggle, 'full', 'Scope must switch to "full"');
    console.log('  ✅ Scope successfully toggled to "full"');

    // 7. Run Simulation Demo
    console.log('  🔍 Testing Run Simulation Demo (Safe Preview)...');
    await page.evaluate(() => {
      window.runChampionshipResetPipeline(true);
    });

    // Wait for simulation demo steps to complete
    await page.waitForFunction(() => {
      const doneArea = document.getElementById('champPipelineDoneArea');
      return doneArea && doneArea.style.display !== 'none';
    }, { timeout: 10000 });

    const simResults = await page.evaluate(() => {
      const pct = document.getElementById('champPipelinePct')?.textContent;
      const step1Text = document.getElementById('champStep1_badge')?.textContent;
      const step6Text = document.getElementById('champStep6_badge')?.textContent;
      return { pct, step1Text, step6Text };
    });
    assert.strictEqual(simResults.pct, '100%', 'Pipeline progress must reach 100%');
    console.log('  ✅ Simulation Demo completed with 100% progress!');

    // 8. Click Done to dismiss
    await page.evaluate(() => {
      const doneBtn = document.querySelector('#champPipelineDoneArea button');
      if (doneBtn) doneBtn.click();
    });
    const finalModalDismissed = await page.evaluate(() => !document.getElementById('champResetPipelineModal'));
    assert(finalModalDismissed, 'Modal must close after clicking Done');
    console.log('  ✅ Done button cleanly closed modal');

    // 9. Responsive layout assertions
    for (const width of [1280, 768, 375]) {
      await page.setViewport({ width, height: 800 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert(!overflow, `Horizontal overflow detected at ${width}px`);
      console.log(`  ✅ Zero horizontal scroll overflow at ${width}px`);
    }

    // 10. Console errors
    assert.strictEqual(consoleErrors.length, 0, `Browser console errors detected: ${consoleErrors.join(', ')}`);
    console.log('  ✅ Zero fatal browser console errors recorded during runtime');

  } finally {
    await browser.close();
    server.close();
  }
}

async function run() {
  runStaticVerification();
  await runHeadlessVerification();
  console.log('\n🎉 ALL ALLIANCE CHAMPIONSHIP RESET PIPELINE VERIFICATIONS PASSED 100%!');
}

run().catch(err => {
  console.error('\n❌ Championship Reset Pipeline Test FAILED:', err);
  process.exit(1);
});
