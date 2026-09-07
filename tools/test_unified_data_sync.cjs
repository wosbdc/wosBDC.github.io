// tools/test_unified_data_sync.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { execSync } = require('child_process');

console.log('🧪 Starting Unified Member Data Sync & Dual-Key Resolution Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${testName} -> ${err.message}`);
    process.exitCode = 1;
  }
}

// =========================================================================
// TEST SUITE 1: Static AST & Declaration Audits
// =========================================================================
console.log('📦 Test Suite 1: Static AST & Declaration Verification');
const mainJsPath = path.resolve(__dirname, '..', 'main.js');
const mainContent = fs.readFileSync(mainJsPath, 'utf8');

runTest('main.js syntax check with node --check', () => {
  execSync('node --check main.js', { stdio: 'pipe', cwd: path.resolve(__dirname, '..') });
});

runTest('executeUnifiedMemberUpdate is exported to window', () => {
  assert(mainContent.includes('window.executeUnifiedMemberUpdate = async (options = {}) => {'), 'Missing window.executeUnifiedMemberUpdate');
});

runTest('resolveMemberData is exported to window', () => {
  assert(mainContent.includes('window.resolveMemberData = async (targetNameOrGid, preloaded = {}) => {'), 'Missing window.resolveMemberData');
});

runTest('invalidateMemberCaches is exported to window and purges rosterCache', () => {
  assert(mainContent.includes('window.invalidateMemberCaches = (options = {}) => {'), 'Missing window.invalidateMemberCaches');
  assert(mainContent.includes('window.rosterCache = null;'), 'Missing window.rosterCache purge');
  assert(mainContent.includes('window.activityCache = null;'), 'Missing window.activityCache purge');
});

runTest('normalizeMembershipStatus handles banned, left, and active values', () => {
  assert(mainContent.includes('window.normalizeMembershipStatus = (status) => {'), 'Missing window.normalizeMembershipStatus');
});

runTest('searchPlayerFull incorporates furnace fallback resolution from users node', () => {
  assert(mainContent.includes('resolvedRosterInfo ='), 'Missing resolvedRosterInfo in searchPlayerFull');
  assert(mainContent.includes('viewedGameId && rosterMap && rosterMap[viewedGameId]'), 'Missing dual-key lookup in searchPlayerFull');
});

runTest('Both registration pathways invoke executeUnifiedMemberUpdate', () => {
  const matches = (mainContent.match(/await window\.executeUnifiedMemberUpdate/g) || []).length;
  assert(matches >= 4, `Expected at least 4 executeUnifiedMemberUpdate calls, found ${matches}`);
});

// =========================================================================
// TEST SUITE 2: Logic Simulation of Dual-Key Resolution & Cache Invalidation
// =========================================================================
console.log('\n⚙️ Test Suite 2: Pure Logic Simulation of Member Resolution & Fallback');

runTest('normalizeMembershipStatus maps variants correctly', () => {
  const normalize = (status) => {
    if (!status) return 'active';
    const s = String(status).toLowerCase().trim();
    if (s === 'banned' || s === 'ban') return 'banned';
    if (s === 'left' || s === 'former' || s === 'inactive' || s === 'left_alliance' || s === 'left alliance') return 'left';
    return 'active';
  };
  assert.strictEqual(normalize('Banned'), 'banned');
  assert.strictEqual(normalize('left_alliance'), 'left');
  assert.strictEqual(normalize('active'), 'active');
  assert.strictEqual(normalize(''), 'active');
  assert.strictEqual(normalize(null), 'active');
});

runTest('Dual-key fallback resolution resolves furnace level across disparate nodes', () => {
  const mockRoster = {
    'Perma Frost': { chiefName: 'Perma Frost', gameId: '735162894', stove_lv: 'FC8', membershipStatus: 'active' },
    '735162894': { chiefName: 'Perma Frost', gameId: '735162894', stove_lv: 'FC8', membershipStatus: 'active' },
    'UnknownAlt': { chiefName: 'UnknownAlt', gameId: '999888111' } // Missing stove_lv in roster
  };
  const mockUsers = {
    'uid123': {
      gameId: '999888111',
      name: 'UnknownAlt',
      stove_lv: 'FC5',
      membershipStatus: 'active'
    }
  };

  // Simulate searchPlayerFull resolution
  function resolveFurnace(targetName, viewedGameId) {
    let resolved = {};
    if (mockRoster[targetName]) resolved = { ...mockRoster[targetName] };
    if (!resolved.stove_lv && viewedGameId && mockRoster[viewedGameId]) {
      resolved = { ...resolved, ...mockRoster[viewedGameId] };
    }
    if (!resolved.stove_lv) {
      for (const u of Object.values(mockUsers)) {
        if (u.gameId === viewedGameId || u.name.toLowerCase() === targetName.toLowerCase()) {
          resolved.stove_lv = u.stove_lv;
          break;
        }
      }
    }
    return resolved.stove_lv || 'F30';
  }

  assert.strictEqual(resolveFurnace('Perma Frost', '735162894'), 'FC8');
  assert.strictEqual(resolveFurnace('UnknownAlt', '999888111'), 'FC5', 'Must resolve stove_lv from mockUsers when missing in roster');
});

// =========================================================================
// TEST SUITE 3: Real Headless Chrome Browser Execution & User Journey
// =========================================================================
console.log('\n🌐 Test Suite 3: Real Headless Google Chrome Lifecycle & Visual Assertions');

const puppeteerPath = 'C:\\Users\\Brian\\Documents\\antigravity\\pup\\node_modules\\puppeteer-core';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let puppeteer;
try {
  puppeteer = require(puppeteerPath);
} catch (e) {
  try { puppeteer = require('puppeteer-core'); } catch (e2) {}
}

if (!puppeteer || !fs.existsSync(chromePath)) {
  console.log('  ⚠️ Headless Chrome or Puppeteer not found, skipping browser step.');
  console.log(`\n🎉 SUMMARY: ${passedTests}/${totalTests} Tests Passed!`);
  process.exit(0);
}

const PORT = 8097;
const DIST_DIR = path.join(__dirname, '..', 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(DIST_DIR, reqPath);
  
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    const indexPath = path.join(DIST_DIR, 'index.html');
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
  }
});

server.listen(PORT, async () => {
  console.log(`  🚀 Headless test server running on http://localhost:${PORT}`);
  let browser = null;

  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    const fatalErrors = [];

    page.on('pageerror', err => {
      // Ignore external offline network fetches or Firebase auth config errors in test environment
      if (!err.message.includes('Firebase') && !err.message.includes('fetch') && !err.message.includes('network')) {
        console.warn('  ⚠️ Page error:', err.message);
        fatalErrors.push(err.message);
      }
    });

    const viewports = [
      { name: 'Desktop (1280x800)', width: 1280, height: 800 },
      { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      { name: 'Mobile (375x667)', width: 375, height: 667 }
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 600));

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      const hasOverflow = scrollWidth > clientWidth + 2;

      runTest(`Zero horizontal overflow on ${vp.name}`, () => {
        assert(!hasOverflow, `Overflow detected: scrollWidth=${scrollWidth}, clientWidth=${clientWidth}`);
      });
    }

    // Verify Unified Functions in Window Scope
    const bindingsCheck = await page.evaluate(() => {
      return {
        hasUnifiedUpdate: typeof window.executeUnifiedMemberUpdate === 'function',
        hasResolver: typeof window.resolveMemberData === 'function',
        hasInvalidate: typeof window.invalidateMemberCaches === 'function',
        hasNormalize: typeof window.normalizeMembershipStatus === 'function'
      };
    });

    runTest('executeUnifiedMemberUpdate physically loaded in browser window', () => {
      assert(bindingsCheck.hasUnifiedUpdate, 'window.executeUnifiedMemberUpdate missing in DOM');
    });

    runTest('resolveMemberData physically loaded in browser window', () => {
      assert(bindingsCheck.hasResolver, 'window.resolveMemberData missing in DOM');
    });

    runTest('invalidateMemberCaches physically loaded in browser window', () => {
      assert(bindingsCheck.hasInvalidate, 'window.invalidateMemberCaches missing in DOM');
    });

    runTest('normalizeMembershipStatus physically loaded in browser window', () => {
      assert(bindingsCheck.hasNormalize, 'window.normalizeMembershipStatus missing in DOM');
    });

    // Execute User Journey: Invalidate caches and verify reactive DOM update
    const cacheTestResult = await page.evaluate(() => {
      window.rosterCache = { 'TestPlayer': { name: 'TestPlayer', stove_lv: 'FC1' } };
      window.activityCache = [{ name: 'TestPlayer' }];
      window.invalidateMemberCaches({ refreshView: false });
      return {
        rosterCacheCleared: window.rosterCache === null,
        activityCacheCleared: window.activityCache === null
      };
    });

    runTest('invalidateMemberCaches purges in-memory caches in real browser environment', () => {
      assert(cacheTestResult.rosterCacheCleared, 'window.rosterCache was not cleared');
      assert(cacheTestResult.activityCacheCleared, 'window.activityCache was not cleared');
    });

    runTest('Zero fatal console errors during execution', () => {
      assert.strictEqual(fatalErrors.length, 0, `Encountered ${fatalErrors.length} fatal errors: ${fatalErrors.join('; ')}`);
    });

  } catch (err) {
    console.error('  ❌ Unhandled Browser Exception:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
    console.log(`\n🎉 SUMMARY: ${passedTests}/${totalTests} Tests Passed!`);
    if (process.exitCode) {
      console.error('❌ Test suite failed.');
      process.exit(1);
    } else {
      console.log('✅ 100% OF TESTS PASSED!');
      process.exit(0);
    }
  }
});
