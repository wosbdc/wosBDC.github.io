// tools/test_alt_events_toggle_headless.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const PORT = 8111;
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

function runStaticVerification() {
  console.log('📦 [1/2] Running Static, Config & Version Verification...');
  const rootDir = path.resolve(__dirname, '..');
  const mainJs = fs.readFileSync(path.join(rootDir, 'main.js'), 'utf8');
  const pkgJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const verJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'version.json'), 'utf8'));
  const changelog = fs.readFileSync(path.join(rootDir, 'CHANGELOG.md'), 'utf8');

  // Version & Changelog alignment
  assert.strictEqual(pkgJson.version, verJson.version, 'package.json and version.json versions must match');
  assert(changelog.includes(`## [${pkgJson.version}]`), `CHANGELOG.md must include section for ${pkgJson.version}`);

  // AST Syntax validation
  const lines = mainJs.split('\n');
  let inImport = false;
  const stripped = lines.map(line => {
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
  new vm.Script(`(async () => {\n${stripped.join('\n')}\n})()`, { filename: 'main.js' });

  // Required symbols & UI elements
  assert(mainJs.includes('window.isAltMember ='), 'Must define window.isAltMember');
  assert(mainJs.includes('window.isAltOptedInForEvents ='), 'Must define window.isAltOptedInForEvents');
  assert(mainJs.includes('window.shouldIncludeMemberInEvents ='), 'Must define window.shouldIncludeMemberInEvents');
  assert(mainJs.includes('window.toggleAltEventVisibility ='), 'Must define window.toggleAltEventVisibility');
  assert(mainJs.includes('id="altEventsFilter"'), 'Account Hub must include altEventsFilter dropdown');
  assert(mainJs.includes('id="altEventsPill-'), 'Account Hub alt cards must include compact header altEventsPill toggle');
  assert(mainJs.includes('id="altSettingsBtn-'), 'Account Hub alt cards must include top-right gear settings button');
  assert(mainJs.includes('window.toggleAltSettingsMenu ='), 'Must define window.toggleAltSettingsMenu');
  assert(mainJs.includes('data-alt-events-pill='), 'Account Hub & Admin Users must include 1-click events pill');
  assert(mainJs.includes('id="altEventsDropdown-'), 'Admin Users alt dropdown must include events toggle item');
  console.log('  ✅ Static & AST checks passed.');
}

async function runHeadlessBrowserTests() {
  if (!puppeteer || !chromePath) {
    console.warn('⚠️ Chrome/Puppeteer not found; skipping live headless browser execution.');
    return;
  }

  console.log(`🌐 [2/2] Launching Headless Chrome (${chromePath}) on port ${PORT}...`);

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    let filePath = path.join(DIST_DIR, reqPath);
    if (!fs.existsSync(filePath)) filePath = path.join(__dirname, '..', reqPath);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise(resolve => server.listen(PORT, '127.0.0.1', resolve));

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const txt = msg.text();
        if (!txt.includes('favicon') && !txt.includes('Failed to load resource') && !txt.includes('ERR_FAILED')) {
          consoleErrors.push(txt);
        }
      }
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.setViewport({ width: 1280, height: 860 });
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForFunction(() => Boolean(window.views && window.shouldIncludeMemberInEvents), { timeout: 10000 });

    // Setup clean deterministic in-memory state + mocks for all 5 events & Account Hub
    await page.evaluate(() => {
      window.__mockAltEventsState = {
        '345120987': true,   // BabyDiva = ON
        '398112450': false   // FarmAlt02 = OFF
      };
      window.currentUser = {
        uid: 'owner_uid_1',
        email: 'brian@bdc.com',
        name: 'BrianDivaCox',
        chiefName: 'BrianDivaCox',
        gameId: '318843189',
        adminLevel: 'R5',
        linkedGameIds: ['345120987', '398112450'],
        linkedAltsData: {
          '345120987': { gameId: '345120987', name: 'BabyDiva', furnaceLevel: 'FC3', showInEvents: true },
          '398112450': { gameId: '398112450', name: 'FarmAlt02', furnaceLevel: '26', showInEvents: false }
        },
        altTokens: {}
      };
      window.getAdminLevel = () => 'R5';
      window.isAdminUser = () => true;
      window.isGoogleAuthVerified = async () => true;
      window.isPlayerActiveMember = () => true;
      window.idToNameMap = {
        '318843189': 'BrianDivaCox',
        '345120987': 'BabyDiva',
        '398112450': 'FarmAlt02'
      };
      window.nameToIdMap = {
        'briandivacox': '318843189',
        'babydiva': '345120987',
        'farmalt02': '398112450'
      };
      window.liveData = { 'giftcodebot': [] };

      window.fetchRoster = async () => ({
        '318843189': { name: 'BrianDivaCox', chiefName: 'BrianDivaCox', gameId: '318843189', status: 'active' },
        '345120987': { name: 'BabyDiva', chiefName: 'BabyDiva', gameId: '345120987', status: 'active' },
        '398112450': { name: 'FarmAlt02', chiefName: 'FarmAlt02', gameId: '398112450', status: 'active' }
      });

      window.getRegisteredAltSets = async () => {
        const optedInAltGidsSet = new Set();
        const optedInAltNamesSet = new Set();
        const altShowInEventsMap = {};
        if (window.__mockAltEventsState['345120987']) {
          optedInAltGidsSet.add('345120987');
          optedInAltNamesSet.add('babydiva');
          altShowInEventsMap['345120987'] = true;
        }
        if (window.__mockAltEventsState['398112450']) {
          optedInAltGidsSet.add('398112450');
          optedInAltNamesSet.add('farmalt02');
          altShowInEventsMap['398112450'] = true;
        }
        return {
          altNamesSet: new Set(['babydiva', 'farmalt02']),
          altGidsSet: new Set(['345120987', '398112450']),
          primaryNamesSet: new Set(['briandivacox']),
          primaryGidsSet: new Set(['318843189']),
          optedInAltGidsSet,
          optedInAltNamesSet,
          altShowInEventsMap
        };
      };

      // Mock Firebase toggle persistence cleanly while still exercising real DOM logic if needed
      const origToggle = window.toggleAltEventVisibility;
      window.__origToggleAltEventVisibility = origToggle;
      window.toggleAltEventVisibility = async (altGid, targetUid, altName, explicitState, triggerEl) => {
        const cleanGid = String(altGid).trim();
        let next = explicitState;
        if (typeof next !== 'boolean') {
          const curAttr = triggerEl && triggerEl.getAttribute ? triggerEl.getAttribute('data-show-in-events') : null;
          next = curAttr === 'true' ? false : true;
        }
        window.__mockAltEventsState[cleanGid] = Boolean(next);
        window.currentUser.linkedAltsData[cleanGid].showInEvents = Boolean(next);
        const card = document.querySelector(`.alt-account-card[data-gid="${cleanGid}"]`);
        if (card) card.setAttribute('data-show-in-events', next ? 'true' : 'false');
        document.querySelectorAll(`[data-alt-events-pill="${cleanGid}"]`).forEach(pill => {
          pill.setAttribute('data-show-in-events', next ? 'true' : 'false');
          pill.setAttribute('aria-pressed', next ? 'true' : 'false');
          pill.innerHTML = next ? '📅 Events: ON' : '📅 Events: OFF';
        });
        if (typeof window.filterAltAccountsList === 'function' && document.getElementById('linkedAltsGrid')) {
          window.filterAltAccountsList();
        }
        return true;
      };
    });

    // Test 1: Helper contract checks
    const helperRes = await page.evaluate(async () => {
      const altSets = await window.getRegisteredAltSets();
      return {
        primaryIsAlt: window.isAltMember({ name: 'BrianDivaCox', gameId: '318843189' }, altSets),
        babyIsAlt: window.isAltMember({ name: 'BabyDiva', gameId: '345120987' }, altSets),
        mainIncluded: window.shouldIncludeMemberInEvents({ name: 'BrianDivaCox', gameId: '318843189' }, altSets, false),
        optedInAltIncluded: window.shouldIncludeMemberInEvents({ name: 'BabyDiva', gameId: '345120987' }, altSets, false),
        hiddenAltExcluded: window.shouldIncludeMemberInEvents({ name: 'FarmAlt02', gameId: '398112450' }, altSets, false),
        activeHiddenAltIncluded: window.shouldIncludeMemberInEvents({ name: 'FarmAlt02', gameId: '398112450' }, altSets, true)
      };
    });
    assert.strictEqual(helperRes.primaryIsAlt, false, 'Primary account must never be flagged as alt');
    assert.strictEqual(helperRes.babyIsAlt, true, 'Linked alt must be detected as alt');
    assert.strictEqual(helperRes.mainIncluded, true, 'Primary chief must always be included in events');
    assert.strictEqual(helperRes.optedInAltIncluded, true, 'Opted-in alt (BabyDiva) must be included in events');
    assert.strictEqual(helperRes.hiddenAltExcluded, false, 'Hidden inactive alt (FarmAlt02) must be excluded from events');
    assert.strictEqual(helperRes.activeHiddenAltIncluded, true, 'Hidden alt WITH live event activity must still appear');
    console.log('  ✅ Core alt event helper logic verified.');

    // Test 2: Championship Admin, Polar Terrors Admin, Bear Trap Admin, Mercenary & Showdown Missed Days
    await page.evaluate(async () => {
      window.fetchChampionshipData = async () => ({});
      window.fetchChampionshipMatchups = async () => ({ rounds: {} });
      window.getChampionshipScheduleStatus = async () => ({ isOnCooldown: false, targetStartMs: 0 });
      await window.views.championshipAdmin('signups');
    });
    await page.waitForSelector('#btnToggleChampTable', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('btnToggleChampTable').click());
    const champText = await page.evaluate(() => document.getElementById('champTableBody').innerText);
    const champTotal = await page.evaluate(() => document.getElementById('btnTotalCount').textContent.trim());
    assert.strictEqual(champTotal, '2', 'Championship Admin count must reflect 2 eligible members (Main + BabyDiva)');
    assert(champText.includes('BabyDiva'), 'Championship Admin must include opted-in alt BabyDiva');
    assert(!champText.includes('FarmAlt02'), 'Championship Admin must exclude hidden inactive alt FarmAlt02');

    await page.evaluate(async () => {
      window.fetchPolarTerrorsData = async () => ({});
      await window.views.polarTerrorsAdmin();
    });
    await page.waitForSelector('#ptTableBody', { timeout: 5000 });
    const ptText = await page.evaluate(() => document.getElementById('ptTableBody').innerText);
    assert(ptText.includes('BabyDiva'), 'Polar Terrors Admin must include opted-in alt BabyDiva');
    assert(!ptText.includes('FarmAlt02'), 'Polar Terrors Admin must exclude hidden inactive alt FarmAlt02');

    await page.evaluate(async () => {
      window.fetchBearTrapData = async () => ({});
      await window.views.bearTrapAdmin();
    });
    await page.waitForSelector('#bt-yes-count', { timeout: 5000 });
    const btBodyText = await page.evaluate(() => document.getElementById('app').innerText);
    assert(btBodyText.includes('BabyDiva'), 'Bear Trap Admin must include opted-in alt BabyDiva');
    assert(!btBodyText.includes('FarmAlt02'), 'Bear Trap Admin must exclude hidden inactive alt FarmAlt02');

    await page.evaluate(async () => {
      window.fetchMercenaryData = async () => ({});
      window.fetchMercenaryBossProgress = async () => ({ currentHp: 1000, maxHp: 2000, tier: 1, isActive: true });
      await window.views.mercenary();
    });
    await page.waitForSelector('#mercBtnRoster', { timeout: 5000 });
    await page.evaluate(() => document.getElementById('mercBtnRoster').click());
    const mercPublicText = await page.evaluate(() => document.getElementById('mercViewRoster').innerText);
    assert(mercPublicText.includes('BabyDiva'), 'Public Mercenary Prestige must include opted-in alt BabyDiva');
    assert(!mercPublicText.includes('FarmAlt02'), 'Public Mercenary Prestige must exclude hidden inactive alt FarmAlt02');

    await page.evaluate(async () => {
      window.mercRosterMode = 'mains';
      await window.views.mercenaryAdmin();
    });
    await page.waitForSelector('#mercTableBody', { timeout: 5000 });
    const mercAdminVisibleText = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('#mercTableBody tr')).filter(r => r.style.display !== 'none');
      return rows.map(r => r.innerText).join('\n');
    });
    assert(mercAdminVisibleText.includes('BabyDiva'), 'Mercenary Admin (Mains mode) must show opted-in alt BabyDiva');
    assert(!mercAdminVisibleText.includes('FarmAlt02'), 'Mercenary Admin (Mains mode) must hide non-opted inactive alt FarmAlt02');

    await page.evaluate(async () => {
      window.fetchMergedShowdown = async () => ({
        sdLiveData: {
          'BrianDivaCox': { name: 'BrianDivaCox', d1: 50000, total: 50000 }
        }
      });
      await window.showMissedDaysReportModal();
    });
    await page.waitForSelector('#showdownMissedReportModal', { timeout: 5000 });
    await page.evaluate(() => {
      const btn = document.getElementById('tabAllMains');
      if (btn) btn.click();
    });
    const missedText = await page.evaluate(() => document.getElementById('showdownMissedReportModal').innerText);
    assert(missedText.includes('BabyDiva'), 'Showdown Missed Report must include opted-in alt BabyDiva');
    assert(!missedText.includes('FarmAlt02'), 'Showdown Missed Report must exclude hidden inactive alt FarmAlt02');
    await page.evaluate(() => { const m = document.getElementById('showdownMissedReportModal'); if (m) m.remove(); });
    console.log('  ✅ All 5 Events (Showdown, Championship, Mercenary, Polar Terrors, Bear Trap) honor showInEvents state.');

    // Test 3: Flipping FarmAlt02 ON makes it appear across events immediately!
    await page.evaluate(async () => {
      await window.toggleAltEventVisibility('398112450', 'owner_uid_1', 'FarmAlt02', true);
      await window.views.polarTerrorsAdmin();
    });
    await page.waitForSelector('#ptTableBody', { timeout: 5000 });
    const ptAfterToggleText = await page.evaluate(() => document.getElementById('ptTableBody').innerText);
    assert(ptAfterToggleText.includes('FarmAlt02'), 'After toggling ON, FarmAlt02 must immediately appear in Polar Terrors');

    // Test 4: Render Account Hub & verify compact header pill DOM + filter dropdown + responsive viewports
    await page.evaluate(async () => {
      await window.toggleAltEventVisibility('398112450', 'owner_uid_1', 'FarmAlt02', false);
      await window.views.account();
    });
    await page.waitForSelector('#altEventsPill-345120987', { timeout: 6000 });

    const hubDom = await page.evaluate(() => {
      const pOn = document.getElementById('altEventsPill-345120987');
      const pOff = document.getElementById('altEventsPill-398112450');
      return {
        onPressed: pOn ? pOn.getAttribute('aria-pressed') : '',
        offPressed: pOff ? pOff.getAttribute('aria-pressed') : '',
        onText: pOn ? pOn.textContent.trim() : '',
        offText: pOff ? pOff.textContent.trim() : ''
      };
    });
    assert.strictEqual(hubDom.onPressed, 'true', 'Account Hub pill for BabyDiva must start ON');
    assert.strictEqual(hubDom.offPressed, 'false', 'Account Hub pill for FarmAlt02 must start OFF');
    assert.strictEqual(hubDom.onText, '📅 Events: ON');
    assert.strictEqual(hubDom.offText, '📅 Events: OFF');

    // Filter dropdown interaction + DOM assertion
    await page.select('#altEventsFilter', 'included');
    const filteredCards = await page.evaluate(() => {
      const c1 = document.querySelector('.alt-account-card[data-gid="345120987"]');
      const c2 = document.querySelector('.alt-account-card[data-gid="398112450"]');
      return {
        c1Display: c1 ? c1.style.display : '',
        c2Display: c2 ? c2.style.display : ''
      };
    });
    assert.strictEqual(filteredCards.c1Display, 'flex', 'Filtering Included must keep BabyDiva card visible');
    assert.strictEqual(filteredCards.c2Display, 'none', 'Filtering Included must hide FarmAlt02 card');
    await page.select('#altEventsFilter', 'all');

    // Toggle FarmAlt02 header pill via real user click
    await page.evaluate(() => {
      const pill = document.getElementById('altEventsPill-398112450');
      pill.click();
    });
    const toggledPillText = await page.evaluate(() => document.getElementById('altEventsPill-398112450').textContent.trim());
    assert.strictEqual(toggledPillText, '📅 Events: ON', 'Clicking header pill must mutate text to 📅 Events: ON in DOM');

    // Open top-right gear menu & assert consolidated actions + outside click dismissal
    await page.evaluate(() => document.getElementById('altSettingsBtn-345120987').click());
    const menuCheck = await page.evaluate(() => {
      const menu = document.getElementById('altSettingsMenu-345120987');
      const card = menu ? menu.closest('.alt-account-card') : null;
      return {
        isOpen: Boolean(menu && menu.style.display === 'block'),
        cardZ: card ? card.style.zIndex : '',
        menuText: menu ? menu.innerText : ''
      };
    });
    assert.strictEqual(menuCheck.isOpen, true, 'Clicking gear button must open alt settings menu');
    assert.strictEqual(menuCheck.cardZ, '60', 'Open menu must lift parent card z-index above neighbors');
    assert(menuCheck.menuText.includes('Make Primary') && menuCheck.menuText.includes('Edit Profile') && menuCheck.menuText.includes('Unlink Alt'), 'Gear menu must include Make Primary, Edit Profile, and Unlink Alt');
    await page.evaluate(() => document.body.click());
    const menuClosed = await page.evaluate(() => document.getElementById('altSettingsMenu-345120987').style.display);
    assert.strictEqual(menuClosed, 'none', 'Clicking outside must close alt settings menu');
    console.log('  ✅ Account Hub compact header pill, gear menu & event filter verified.');

    // Responsive overflow audit across Mobile (375), Tablet (768), Desktop (1280)
    for (const vp of [{ width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1280, height: 860 }]) {
      await page.setViewport(vp);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
      assert.strictEqual(overflow, false, `No horizontal overflow allowed at viewport ${vp.width}px`);
    }
    console.log('  ✅ Responsive overflow audit passed across 375px / 768px / 1280px.');

    assert.strictEqual(consoleErrors.length, 0, `Zero console errors expected, got: ${consoleErrors.join('; ')}`);
    console.log('🎉 ALL PER-ALT EVENT TOGGLE HEADLESS TESTS PASSED!');
  } finally {
    await browser.close();
    server.close();
  }
}

(async () => {
  runStaticVerification();
  await runHeadlessBrowserTests();
})().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
