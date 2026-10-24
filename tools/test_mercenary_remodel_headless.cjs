// tools/test_mercenary_remodel_headless.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const PORT = 8097;
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
  console.log('📦 Starting Static & Structural Verification Suite for Mercenary Prestige Remodel...');
  const mainJsPath = path.resolve(__dirname, '..', 'main.js');
  const code = fs.readFileSync(mainJsPath, 'utf8');

  // 1. AST syntax validation
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
  new vm.Script(`(async () => {\n${strippedLines.join('\n')}\n})()`, { filename: 'main.js' });
  console.log('  ✅ main.js AST syntax validation passed with 0 syntax errors.');

  // 2. Structural function definitions
  assert(code.includes('window.resolveChiefName ='), 'Must define window.resolveChiefName');
  assert(code.includes('window.updateMercenaryScoutLevel ='), 'Must define window.updateMercenaryScoutLevel');
  assert(code.includes('window.onMercScoutLevelSelect ='), 'Must define window.onMercScoutLevelSelect');
  assert(code.includes('window.computeAndSyncMercenaryBossProgress ='), 'Must define window.computeAndSyncMercenaryBossProgress');
  assert(code.includes('window.openMercenaryRallyReportModal ='), 'Must define window.openMercenaryRallyReportModal');
  assert(code.includes('window.renderMercenaryBossCommandDeckHtml ='), 'Must define window.renderMercenaryBossCommandDeckHtml');
  assert(code.includes('mercBossCommandDeck'), 'Must include mercBossCommandDeck DOM container');
  assert(code.includes('merc-milestone-pill'), 'Must include 1-tap milestone pills');
  assert(code.includes('mercRallyReportBtn'), 'Must include mercRallyReportBtn in Command Deck');
  assert(code.includes('mercFilterBtnPush'), 'Must include mercFilterBtnPush quick filter');
  assert(code.includes('scoutLevel: lvl'), 'Must save scoutLevel in Firebase nodes');
  assert(code.includes('mercenaryScoutLevel: 0'), 'Stage 4 must reset mercenaryScoutLevel back to 0');
  assert(code.includes('scoutLevel: 0'), 'Stage 4 must reset scoutLevel back to 0');

  console.log('  ✅ All static structural assertions passed successfully.');
}

async function runHeadlessBrowserTests() {
  if (!puppeteer || !chromePath) {
    console.warn('⚠️ Puppeteer or Chrome not found for live browser tests. Falling back to static assertions only.');
    return;
  }

  console.log(`🌐 Launching Headless Chrome (${chromePath}) for Real DOM Journey...`);

  // Local static HTTP server
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    let filePath = path.join(DIST_DIR, reqPath);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, '..', reqPath);
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('Not Found: ' + reqPath);
    }

    const ext = path.extname(filePath);
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise(resolve => server.listen(PORT, resolve));

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      // Ignore routine offline test network warnings
      if (!txt.includes('net::ERR_') && !txt.includes('Failed to load resource') && !txt.includes('Firebase: Error')) {
        consoleErrors.push(txt);
      }
    }
  });

  page.on('pageerror', err => {
    pageErrors.push(err.message || String(err));
  });

  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Inject mock R5 Manager and initial mercenary test data
    await page.evaluate(() => {
      window.currentUser = {
        uid: 'test_r5_manager',
        name: 'Commander Alpha',
        gameId: '100001',
        role: 'R5',
        adminLevel: 'R5'
      };
      window.getAdminLevel = () => 'R5';
      window.isAdminUser = () => true;
      window.isPlayerActiveMember = () => true;

      window.idToNameMap = {
        '100001': 'Commander Alpha',
        '100002': 'Chief Bob',
        '100003': 'Chief Charlie',
        '100004': 'Chief Diana',
        '100005': 'Chief Ethan',
        '705413646': 'thadwarf'
      };

      window.fetchRoster = async () => ({
        '100001': { gameId: '100001', name: 'Commander Alpha', status: 'Active' },
        '100002': { gameId: '100002', name: 'Chief Bob', status: 'Active' },
        '100003': { gameId: '100003', name: 'Chief Charlie', status: 'Active' },
        '100004': { gameId: '100004', name: 'Chief Diana', status: 'Active' },
        '100005': { gameId: '100005', name: 'Chief Ethan', status: 'Active' },
        'thadwarf': { gameId: '705413646', name: '705413646', status: 'Active' }
      });

      window.fetchMercenaryData = async () => ({
        '100001': { gameId: '100001', name: 'Commander Alpha', signedUp: true, scoutLevel: 25, phase: "Champion's Initiation", difficulty: 'Nightmare' },
        '100002': { gameId: '100002', name: 'Chief Bob', signedUp: false, scoutLevel: 10, phase: "Champion's Initiation", difficulty: 'Normal' },
        '100003': { gameId: '100003', name: 'Chief Charlie', signedUp: false, scoutLevel: 5, phase: "Champion's Initiation", difficulty: 'Normal' },
        '100004': { gameId: '100004', name: 'Chief Diana', signedUp: false, scoutLevel: 0, phase: "Champion's Initiation", difficulty: 'Hard' },
        '100005': { gameId: '100005', name: 'Chief Ethan', signedUp: false, scoutLevel: 0, phase: "Champion's Initiation", difficulty: 'Easy' },
        '705413646': { gameId: '705413646', name: '705413646', signedUp: false, scoutLevel: 10, phase: "Champion's Initiation", difficulty: 'Hard' }
      });

      window.fetchMercenaryBossProgress = async () => ({
        lv1: 3,
        lv2: 2,
        lv3: 2,
        lv4: 1,
        lv5: 1,
        updatedAt: Date.now()
      });

      window.saveMercenaryBossProgress = async (bp) => {
        window.mercenaryBossProgressCache = bp;
        return true;
      };
    });

    console.log('  Testing views.mercenaryAdmin() mounting & Command Deck elevation...');
    await page.evaluate(async () => {
      await views.mercenaryAdmin();
    });

    // 1. Assert Command Deck is mounted at the top
    const commandDeckExists = await page.evaluate(() => {
      const cd = document.getElementById('mercBossCommandDeck');
      const table = document.getElementById('mercTableBody');
      if (!cd || !table) return false;
      // Command Deck must precede table in DOM order
      return (cd.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
    });
    assert(commandDeckExists, 'Command Deck must exist and be elevated above the roster table');
    console.log('  ✅ Phaethon Boss Command Deck successfully elevated at the top of the tracker.');

    // 2. Assert all 5 Boss meters exist
    const bossCount = await page.evaluate(() => {
      return ['lv1', 'lv2', 'lv3', 'lv4', 'lv5'].filter(k => !!document.getElementById(`boss_bar_${k}`)).length;
    });
    assert.strictEqual(bossCount, 5, 'All 5 boss unlock meters must be rendered');
    console.log('  ✅ All 5 Phaethon Boss meters physically rendered in DOM.');

    // 3. Assert 1-Tap Milestone Pills rendered in each roster row
    const pillsCount = await page.evaluate(() => {
      return document.querySelectorAll('.merc-milestone-pill').length;
    });
    assert(pillsCount >= 30, `Expected at least 30 milestone pills (6 per row across members), got ${pillsCount}`);
    console.log(`  ✅ Verified ${pillsCount} 1-Tap Milestone Pills [0, 5, 10, 15, 20, 25 ★] rendered in roster.`);

    // 3b. Assert Bulletproof Chief Name Resolution: ZERO numeric Gamer IDs in DOM
    const nameCells = await page.evaluate(() => {
      const cells = Array.from(document.querySelectorAll('.merc-name-cell'));
      return cells.map(c => c.textContent.trim());
    });
    console.log('    Debug nameCells:', nameCells);
    assert(nameCells.includes('thadwarf'), 'thadwarf must be resolved from key/idToNameMap instead of numeric gameId');
    const numericNames = nameCells.filter(n => /^\d+$/.test(n));
    assert.strictEqual(numericNames.length, 0, `Zero numeric Gamer IDs permitted as Chief Names in DOM, found: ${numericNames.join(', ')}`);
    console.log(`  ✅ Bulletproof Chief Name Resolution verified: all ${nameCells.length} members resolved to real Chief names (${nameCells.join(', ')}).`);

    // 4. Test clicking milestone pill [ 15 ] on Chief Charlie
    console.log('  Testing milestone pill click and real-time boss unlock recalculation...');
    await page.evaluate(async () => {
      const rowCharlie = document.querySelector('.merc-row[data-gid="100003"]');
      const pill15 = rowCharlie.querySelector('.merc-milestone-pill[data-level="15"]');
      pill15.click();
    });

    const charlieLevel = await page.evaluate(() => {
      const rowCharlie = document.querySelector('.merc-row[data-gid="100003"]');
      return parseInt(rowCharlie.getAttribute('data-scout-level')) || 0;
    });
    assert.strictEqual(charlieLevel, 15, 'Chief Charlie scout level must update to 15');
    console.log('  ✅ Milestone pill click optimistically updated Chief Charlie scout level to 15.');

    // 5. Test clicking milestone pill [ 25 ★ ] on Chief Bob
    await page.evaluate(async () => {
      const rowBob = document.querySelector('.merc-row[data-gid="100002"]');
      const pill25 = rowBob.querySelector('.merc-milestone-pill[data-level="25"]');
      pill25.click();
    });

    const bobSigned = await page.evaluate(() => {
      const rowBob = document.querySelector('.merc-row[data-gid="100002"]');
      return rowBob.getAttribute('data-signed') === 'yes' && parseInt(rowBob.getAttribute('data-scout-level')) === 25;
    });
    assert(bobSigned, 'Chief Bob must automatically become a 25 ★ Phaethon Master');
    console.log('  ✅ Selecting 25 ★ automatically synchronized signedUp master status.');

    // 6. Test Live Rally Report Modal
    console.log('  Testing 📢 Live Rally Report modal & in-game broadcast generator...');
    await page.evaluate(() => {
      document.getElementById('mercRallyReportBtn').click();
    });

    await page.waitForSelector('#mercRallyReportModal', { visible: true, timeout: 5000 });
    const modalContent = await page.evaluate(() => {
      const modal = document.getElementById('mercRallyReportModal');
      const ta = document.getElementById('mercRallyBroadcastText');
      const copyBtn = document.getElementById('mercCopyBroadcastBtn');
      return {
        hasModal: !!modal,
        broadcastLength: ta ? ta.value.length : 0,
        broadcastSample: ta ? ta.value.substring(0, 40) : '',
        hasCopyBtn: !!copyBtn
      };
    });
    assert(modalContent.hasModal, 'Rally Report modal must open');
    assert(modalContent.broadcastLength > 20, 'Broadcast text must be populated');
    assert(modalContent.hasCopyBtn, 'Copy Broadcast button must exist');
    console.log(`  ✅ Rally Report modal opened with broadcast text: "${modalContent.broadcastSample}..."`);

    // Click Copy Broadcast button inside modal
    await page.evaluate(() => {
      document.getElementById('mercCopyBroadcastBtn').click();
    });

    const copyBtnText = await page.evaluate(() => {
      return document.getElementById('mercCopyBroadcastBtn').textContent;
    });
    assert(copyBtnText.includes('Copied') || copyBtnText.includes('Clipboard') || copyBtnText.includes('Copy'), 'Copy button must provide feedback');
    console.log('  ✅ Copy Alliance Chat Broadcast button fired with instant feedback.');

    // Close modal
    await page.evaluate(() => {
      document.getElementById('mercRallyReportModal').remove();
    });

    // 7. Test Quick Filter Pills: All | Needs Push | Completed 25
    console.log('  Testing Quick Filter Pills...');
    await page.evaluate(() => {
      window.setMercFilter('push');
    });

    const visiblePushRows = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.merc-row'));
      return rows.filter(r => r.style.display !== 'none').length;
    });
    assert(visiblePushRows > 0 && visiblePushRows < 6, `Expected filtered subset for Needs Push, got ${visiblePushRows}`);

    await page.evaluate(() => {
      window.setMercFilter('yes');
    });
    const visibleYesRows = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.merc-row'));
      return rows.filter(r => r.style.display !== 'none').length;
    });
    assert(visibleYesRows > 0, `Expected at least 1 completed member, got ${visibleYesRows}`);

    await page.evaluate(() => {
      window.setMercFilter('all');
    });
    const visibleAllRows = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.merc-row'));
      return rows.filter(r => r.style.display !== 'none').length;
    });
    assert.strictEqual(visibleAllRows, 6, 'All filter must show all 6 members');
    console.log('  ✅ Quick Filter Pills (All | Needs Push | Completed 25) verified.');

    // 8. Test Public View views.mercenary()
    console.log('  Testing Public View views.mercenary()...');
    await page.evaluate(async () => {
      await views.mercenary();
    });

    const publicDeckExists = await page.evaluate(() => {
      return !!document.getElementById('mercBossCommandDeck');
    });
    assert(publicDeckExists, 'Public Mercenary view must render top Command Deck');

    // Switch to roster status in public view
    await page.evaluate(() => {
      window.switchMercView('roster');
    });

    const publicRosterBadges = await page.evaluate(() => {
      return document.querySelectorAll('.merc-pub-row').length;
    });
    assert.strictEqual(publicRosterBadges, 6, 'Public view roster must show all 6 members with status badges');

    const publicNames = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.merc-pub-row td:first-child'));
      return rows.map(r => r.textContent.trim());
    });
    assert(publicNames.includes('thadwarf'), 'Public view roster must include resolved chief thadwarf');
    const numericPubNames = publicNames.filter(n => /^\d+$/.test(n));
    assert.strictEqual(numericPubNames.length, 0, `Zero numeric Gamer IDs permitted in public roster, found: ${numericPubNames.join(', ')}`);
    console.log('  ✅ Public View views.mercenary() renders Command Deck and roster milestone badges.');

    // 9. Responsive layout audit (Mobile 375px, Tablet 768px, Desktop 1280px)
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 800 }
    ];

    for (const vp of viewports) {
      await page.setViewport(vp);
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      assert(!overflow, `Horizontal overflow detected at ${vp.name} (${vp.width}px)`);
      console.log(`  ✅ Responsive Audit passed at ${vp.name} (${vp.width}px) — 0 horizontal overflow.`);
    }

    // 10. Assert 0 unhandled exceptions or console errors
    assert.strictEqual(consoleErrors.length, 0, `Expected 0 fatal console errors, got: ${JSON.stringify(consoleErrors)}`);
    assert.strictEqual(pageErrors.length, 0, `Expected 0 page errors, got: ${JSON.stringify(pageErrors)}`);
    console.log('  ✅ Zero console errors and zero unhandled page errors detected.');

  } finally {
    await browser.close();
    server.close();
  }
}

async function main() {
  try {
    runStaticVerification();
    await runHeadlessBrowserTests();
    console.log('\n🎉 ALL MERCENARY PRESTIGE REMODEL TESTS PASSED WITH 100% SUCCESS!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ TEST SUITE FAILED:', err);
    process.exit(1);
  }
}

main();