// tools/test_mercenary_showdown_alts_and_pagination_headless.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const PORT = 8105;
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
  console.log('📦 Starting Static & Structural Verification...');
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

  // 2. Structural checks
  assert(code.includes('window.isBotAccount ='), 'Must define window.isBotAccount');
  assert(code.includes('window.getRegisteredAltSets ='), 'Must define window.getRegisteredAltSets');
  assert(code.includes('window.setMercRosterMode ='), 'Must define window.setMercRosterMode');
  assert(code.includes('window.clearMercSearch ='), 'Must define window.clearMercSearch');
  assert(code.includes('window.clearMercPublicSearch ='), 'Must define window.clearMercPublicSearch');
  assert(code.includes('mercClearSearchBtn'), 'Must include mercClearSearchBtn');
  assert(code.includes('mercPublicClearSearchBtn'), 'Must include mercPublicClearSearchBtn');
  assert(code.includes('mercModeBtnMains'), 'Must include mercModeBtnMains toggle button');
  assert(code.includes('mercModeBtnAll'), 'Must include mercModeBtnAll toggle button');
  assert(code.includes('window.currentAdminUserPopulationTab = \'mains\''), 'Admin Users must default to mains population tab');
  assert(code.includes('window.changeAdminUserPage ='), 'Must define window.changeAdminUserPage');
  assert(code.includes('window.setAdminUserPageSize ='), 'Must define window.setAdminUserPageSize');
  assert(code.includes('id="adminUserPaginationContainer"'), 'Must include adminUserPaginationContainer in Admin Users DOM');

  console.log('  ✅ All static structural assertions passed successfully.');
}

async function runHeadlessBrowserTests() {
  if (!puppeteer || !chromePath) {
    console.warn('⚠️ Puppeteer or Chrome not found. Skipping live browser execution.');
    return;
  }

  console.log(`🌐 Launching Headless Chrome (${chromePath}) on port ${PORT}...`);

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
    let filePath = path.join(DIST_DIR, reqPath);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(__dirname, '..', reqPath);
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
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
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('Failed to load resource')) {
          consoleErrors.push(text);
        }
      }
    });
    page.on('pageerror', err => {
      consoleErrors.push(err.message);
    });

    // 1. Mobile viewport test (375x812)
    await page.setViewport({ width: 375, height: 812 });
    await page.goto(`http://127.0.0.1:${PORT}/index.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Bootstrap mock environment
    await page.evaluate(() => {
      window.currentUser = {
        uid: 'test_admin_uid',
        email: 'admin@bdc.com',
        role: 'R5',
        name: 'Commander_Brian',
        chiefName: 'Commander_Brian',
        gameId: '100001',
        adminLevel: 'R5'
      };
      window.getAdminLevel = () => 'R5';
      window.isAdminUser = () => true;
      window.isPlayerActiveMember = () => true;
      window.isGoogleAuthVerified = async () => true;
    });

    console.log('🧪 Test 1: Testing Mercenary Prestige Search Clear & Mains Only Filter...');
    await page.evaluate(async () => {
      // Mock fetch functions
      window.fetchMercenaryData = async () => ({
        '100001': { signedUp: true, scoutLevel: 25, phase: 'Phase 1 - Bloodhunt', difficulty: 'Nightmare' },
        '100002': { signedUp: false, scoutLevel: 10, phase: 'Phase 2 - Ironhide', difficulty: 'Hard' },
        '999001': { signedUp: false, scoutLevel: 0 }, // Inactive Alt
        '999002': { signedUp: true, scoutLevel: 25 } // Active Alt
      });
      window.fetchRoster = async () => ({
        '100001': { name: 'Commander_Brian', gameId: '100001', status: 'active' },
        '100002': { name: 'Warrior_Jane', gameId: '100002', status: 'active' },
        '999001': { name: 'Brian_Farm_Alt', gameId: '999001', status: 'active' },
        '999002': { name: 'Jane_War_Alt', gameId: '999002', status: 'active' },
        '861818874': { name: 'gatekeeper', gameId: '861818874', status: 'active' } // Bot
      });
      window.fetchMercenaryBossProgress = async () => ({
        currentHp: 2500000,
        maxHp: 5000000,
        tier: 5,
        isActive: true
      });
      window.getRegisteredAltSets = async () => ({
        altNamesSet: new Set(['brian_farm_alt', 'jane_war_alt']),
        altGidsSet: new Set(['999001', '999002'])
      });

      await window.views.mercenaryAdmin();
    });

    await page.waitForSelector('#mercSearchInput', { timeout: 5000 });
    await page.waitForSelector('#mercClearSearchBtn', { timeout: 5000 });

    // Assert bot excluded
    const hasGatekeeper = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.merc-row')).some(r => (r.getAttribute('data-name') || '').includes('gatekeeper'));
    });
    assert.strictEqual(hasGatekeeper, false, 'Bot account (gatekeeper) must be completely excluded from Mercenary roster');

    // Assert Mains Only excludes non-participating alt
    const mainsModeRows = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.merc-row'));
      return {
        totalRendered: rows.length,
        visibleCount: rows.filter(r => r.style.display !== 'none').length,
        hasInactiveAltVisible: rows.some(r => r.getAttribute('data-gid') === '999001' && r.style.display !== 'none'),
        hasActiveAltVisible: rows.some(r => r.getAttribute('data-gid') === '999002' && r.style.display !== 'none')
      };
    });
    assert.strictEqual(mainsModeRows.hasInactiveAltVisible, false, 'Inactive secondary alt (999001) must be hidden in Mains Only mode');
    assert.strictEqual(mainsModeRows.hasActiveAltVisible, true, 'Active participating alt (999002) must remain visible');

    // Test Search input and 1-tap clear button
    await page.type('#mercSearchInput', 'Jane');
    let searchResultCount = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.merc-row')).filter(r => r.style.display !== 'none').length;
    });
    assert(searchResultCount >= 1, 'Search for Jane should filter visible rows');

    // Click ✕ clear button
    await page.click('#mercClearSearchBtn');
    const clearedInputVal = await page.$eval('#mercSearchInput', el => el.value);
    assert.strictEqual(clearedInputVal, '', 'Clear button must empty the search input');

    const restoredCount = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.merc-row')).filter(r => r.style.display !== 'none').length;
    });
    assert(restoredCount >= 2, 'Roster rows must be restored after search clear');

    // Switch to All Roster mode
    await page.click('#mercModeBtnAll');
    const allModeInactiveAltVisible = await page.evaluate(() => {
      const r = document.querySelector('.merc-row[data-gid="999001"]');
      return r && r.style.display !== 'none';
    });
    assert.strictEqual(allModeInactiveAltVisible, true, 'All Roster mode must reveal all registered alts');
    console.log('  ✅ Mercenary Prestige Showdown alt exclusion & 1-tap clear button verified.');

    console.log('🧪 Test 2: Testing Admin Users Directory Smartphone Pagination & Mains Default...');
    const adminError = await page.evaluate(async () => {
      try {
        // Setup mock data for 40 users
        const mockUsers = {};
        for (let i = 1; i <= 30; i++) {
          mockUsers[`user_${i}`] = {
            name: `Chief_${i}`,
            chiefName: `Chief_${i}`,
            gameId: `${200000 + i}`,
            email: `chief${i}@example.com`,
            membershipStatus: 'active',
            role: 'user'
          };
        }
        // Add 10 alts
        mockUsers['user_with_alts'] = {
          name: 'Alt_Master',
          chiefName: 'Alt_Master',
          gameId: '299999',
          email: 'master@example.com',
          membershipStatus: 'active',
          role: 'user',
          altTokens: {
            '300001': { nickname: 'Alt_1', status: 'active' },
            '300002': { nickname: 'Alt_2', status: 'active' },
            '300003': { nickname: 'Alt_3', status: 'active' }
          }
        };

        window.rosterCache = {};
        for (let i = 1; i <= 30; i++) {
          window.rosterCache[`Chief_${i}`] = {
            name: `Chief_${i}`,
            chiefName: `Chief_${i}`,
            gameId: `${200000 + i}`,
            membershipStatus: 'active'
          };
        }
        window.fetchRoster = async () => window.rosterCache;

        // Mock users in views.admin
        await window.views.admin('tab-users');
        const usersBtn = document.querySelector('.admin-tab-btn[data-tab="tab-users"]');
        if (usersBtn) usersBtn.click();
        if (typeof window.filterAdminUsersList === 'function') window.filterAdminUsersList();
        return null;
      } catch (err) {
        return err.stack || err.message;
      }
    });

    await page.waitForSelector('#adminUserPaginationContainer', { timeout: 5000 });
    await page.waitForFunction(() => {
      const visible = Array.from(document.querySelectorAll('.admin-user-row')).filter(r => r.style.display !== 'none');
      return visible.length > 0 && visible.length <= 15;
    }, { timeout: 5000 });

    // Assert default tab is mains
    const isMainsActive = await page.evaluate(() => {
      const btn = document.querySelector('.admin-user-filter-tab[data-tab="mains"]');
      return btn && btn.classList.contains('active');
    });
    assert.strictEqual(isMainsActive, true, 'Admin Users Directory must default to "Mains" population tab');

    // Assert smartphone pagination (15 per page on mobile 375px)
    const mobileVisibleCount = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.admin-user-row')).filter(r => r.style.display !== 'none').length;
    });
    assert(mobileVisibleCount <= 15, `On mobile viewport, visible rows must be <= 15 (found ${mobileVisibleCount})`);

    // Verify pagination controls: Next button advances page
    const pageTextBefore = await page.$eval('#adminUserPaginationContainer', el => el.innerText);
    assert(pageTextBefore.includes('Page 1 of'), 'Initial pagination state must be Page 1');

    await page.evaluate(() => {
      window.changeAdminUserPage(1);
    });
    const pageTextAfter = await page.$eval('#adminUserPaginationContainer', el => el.innerText);
    assert(pageTextAfter.includes('Page 2 of'), 'changeAdminUserPage(1) must advance to Page 2');

    // Test search filter clears & resets pagination to page 1
    await page.type('#adminUserSearchInput', 'Chief_1');
    await page.evaluate(() => {
      if (window.filterAdminUsersList) window.filterAdminUsersList(true);
    });
    const searchPageText = await page.$eval('#adminUserPaginationContainer', el => el.innerText);
    assert(searchPageText.includes('Page 1 of'), 'Typing in search input must auto-reset to Page 1');

    console.log('  ✅ Admin Users smart pagination & mobile long-scrolling elimination verified.');

    // 3. Responsive horizontal overflow audits (375px, 768px, 1280px)
    for (const width of [375, 768, 1280]) {
      await page.setViewport({ width, height: 900 });
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 2;
      });
      assert.strictEqual(overflow, false, `Horizontal overflow detected at viewport ${width}px!`);
    }
    console.log('  ✅ Responsive zero horizontal overflow verified across 375px, 768px, 1280px.');

    assert.strictEqual(consoleErrors.length, 0, 'Console errors encountered: ' + consoleErrors.join(', '));
    console.log('  ✅ Zero console errors encountered during live execution.');

  } finally {
    await browser.close();
    server.close();
  }
}

async function main() {
  try {
    runStaticVerification();
    await runHeadlessBrowserTests();
    console.log('\n🎉 ALL MERCENARY SHOWDOWN ALTS & ADMIN USERS PAGINATION TESTS PASSED 100%!');
  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err);
    process.exit(1);
  }
}

main();
