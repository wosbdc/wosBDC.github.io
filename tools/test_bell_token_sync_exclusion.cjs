// test_bell_token_sync_exclusion.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Starting Bell Token Sync Exclusion Automated Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log('  ✅ PASS: ' + testName);
    passedTests++;
  } else {
    console.error('  ❌ FAIL: ' + testName);
    process.exitCode = 1;
  }
}

const ROOT_DIR = path.resolve(__dirname, '..');
process.chdir(ROOT_DIR);

// -------------------------------------------------------------
// Test 1: Node.js Syntax & Compilation Check for main.js
// -------------------------------------------------------------
console.log('Test 1: Node.js Syntax & Compilation Check for main.js');
try {
  execSync('node --check main.js', { stdio: 'pipe' });
  assert(true, 'main.js compiles cleanly with 0 syntax errors');
} catch (err) {
  assert(false, 'main.js compilation failed: ' + err.message);
}

// -------------------------------------------------------------
// Test 2: Static Codebase Verification in main.js
// -------------------------------------------------------------
console.log('\nTest 2: Static Codebase Verification in main.js');
const mainContent = fs.readFileSync('main.js', 'utf8');

assert(
  mainContent.includes("s === 'departed'") &&
  mainContent.includes("s === 'deleted'") &&
  mainContent.includes("s === 'archived'"),
  'normalizeMembershipStatus maps departed, deleted, and archived to left'
);

assert(
  mainContent.includes("status: 'exempt'") &&
  mainContent.includes('alert: false'),
  'getMemberTokenStatus and getAltTokenStatus define exempt status with alert: false'
);

assert(
  mainContent.includes('currentUser.departedAlts && currentUser.departedAlts[cleanAid]') &&
  mainContent.includes("aMem === 'banned' || aMem === 'left'"),
  'updateNewMemberBadge excludes departed and banned alts'
);

assert(
  mainContent.includes('isMainActive && tokenStatus.alert && tokenStatus.status !== \'exempt\''),
  'openAllianceAlertsModal gates main token alert behind isMainActive and not exempt'
);

assert(
  mainContent.includes('copyUnsyncedTokensList') &&
  mainContent.includes("mStatus === 'banned' || mStatus === 'left' || mStatus === 'departed' || mStatus === 'deleted'"),
  'copyUnsyncedTokensList skips banned, left, departed, and deleted rows'
);

// -------------------------------------------------------------
// Test 3: Real Headless Chrome Browser Execution
// -------------------------------------------------------------
console.log('\nTest 3: Headless Chrome Browser Lifecycle & UI State Assertions...');

const puppeteerPath = 'C:\\Users\\Brian\\Documents\\antigravity\\pup\\node_modules\\puppeteer-core';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let puppeteer;
try {
  puppeteer = require(puppeteerPath);
} catch (e) {
  console.warn('⚠️ Could not load puppeteer-core at ' + puppeteerPath);
}

const PORT = 8095;
const DIST_DIR = path.join(ROOT_DIR, 'dist');

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
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(indexPath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }
});

async function runBrowserTests() {
  if (!puppeteer) {
    console.log('⚠️ Skipping browser test: puppeteer not available');
    finish();
    return;
  }
  if (!fs.existsSync(chromePath)) {
    console.log('⚠️ Skipping browser test: Chrome executable not found at ' + chromePath);
    finish();
    return;
  }

  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`  🌐 Local test server running on http://127.0.0.1:${PORT}`);

  let browser;
  const consoleErrors = [];

  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon') && !text.includes('net::ERR_') && !text.includes('403')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', err => {
      consoleErrors.push('PAGE ERROR: ' + err.message);
    });

    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'networkidle2', timeout: 30000 });
    assert(true, 'Application successfully loaded in Headless Chrome');

    // Wait for core functions to be available
    await page.waitForFunction(() => typeof window.getMemberTokenStatus === 'function' && typeof window.normalizeMembershipStatus === 'function', { timeout: 10000 });
    assert(true, 'window.getMemberTokenStatus and normalizeMembershipStatus loaded');

    // -------------------------------------------------------------
    // Test 3A: getMemberTokenStatus for Inactive / Banned / Departed
    // -------------------------------------------------------------
    const tokenStatusResults = await page.evaluate(() => {
      const results = {};

      // 1. Departed member
      results.departed = window.getMemberTokenStatus({
        gameId: '111111',
        membershipStatus: 'left',
        tokenStatus: { status: 'expired' }
      });

      // 2. Banned member
      results.banned = window.getMemberTokenStatus({
        gameId: '222222',
        membershipStatus: 'banned',
        tokenStatus: { status: 'unverified' }
      });

      // 3. Deleted member
      results.deleted = window.getMemberTokenStatus({
        gameId: '333333',
        deleted: true,
        tokenStatus: null
      });

      // 4. Active member with expired token
      results.activeExpired = window.getMemberTokenStatus({
        gameId: '444444',
        membershipStatus: 'active',
        tokenStatus: { status: 'expired' }
      });

      // 5. Active member with valid token
      results.activeValid = window.getMemberTokenStatus({
        gameId: '555555',
        membershipStatus: 'active',
        tokenStatus: { status: 'active', expiresAt: Date.now() + 20 * 86400000 }
      });

      return results;
    });

    assert(tokenStatusResults.departed.status === 'exempt' && tokenStatusResults.departed.alert === false, 'Departed member token status is exempt with alert: false');
    assert(tokenStatusResults.banned.status === 'exempt' && tokenStatusResults.banned.alert === false, 'Banned member token status is exempt with alert: false');
    assert(tokenStatusResults.deleted.status === 'exempt' && tokenStatusResults.deleted.alert === false, 'Deleted member token status is exempt with alert: false');
    assert(tokenStatusResults.activeExpired.status === 'expired' && tokenStatusResults.activeExpired.alert === true, 'Active member with expired token has alert: true');
    assert(tokenStatusResults.activeValid.status === 'active' && tokenStatusResults.activeValid.alert === false, 'Active member with valid token has alert: false');

    // -------------------------------------------------------------
    // Test 3B: getAltTokenStatus for Inactive / Banned / Departed Alts
    // -------------------------------------------------------------
    const altTokenStatusResults = await page.evaluate(() => {
      const results = {};

      // 1. Departed alt
      results.departedAlt = window.getAltTokenStatus({
        gameId: '990001',
        membershipStatus: 'left',
        tokenExpired: true
      });

      // 2. Banned alt
      results.bannedAlt = window.getAltTokenStatus({
        gameId: '990002',
        membershipStatus: 'banned',
        status: 'unverified'
      });

      // 3. Active alt with expired token
      results.activeAltExpired = window.getAltTokenStatus({
        gameId: '990003',
        membershipStatus: 'active',
        tokenExpired: true
      });

      return results;
    });

    assert(altTokenStatusResults.departedAlt.status === 'exempt' && altTokenStatusResults.departedAlt.alert === false, 'Departed alt token status is exempt with alert: false');
    assert(altTokenStatusResults.bannedAlt.status === 'exempt' && altTokenStatusResults.bannedAlt.alert === false, 'Banned alt token status is exempt with alert: false');
    assert(altTokenStatusResults.activeAltExpired.status === 'expired', 'Active alt with expired token reports expired');

    // -------------------------------------------------------------
    // Test 3C: Bell Badge Calculation & Alerts Modal Exclusions
    // -------------------------------------------------------------
    const bellAlertsResult = await page.evaluate(async () => {
      // Simulate user who has left the alliance
      window.currentUser = {
        uid: 'user-departed-01',
        gameId: '123456789',
        chiefName: 'ExMember',
        membershipStatus: 'left',
        tokenStatus: { status: 'expired' },
        linkedGameIds: ['987654321'],
        altTokens: {
          '987654321': { tokenExpired: true, nickname: 'ExAlt' }
        }
      };

      // Call updateNewMemberBadge
      await window.updateNewMemberBadge();
      const badgeDeparted = document.getElementById('newMemberBadge')?.style?.display;

      // Simulate active user with a departed alt and an active alt
      window.currentUser = {
        uid: 'user-active-01',
        gameId: '318843189',
        chiefName: 'ActiveChief',
        membershipStatus: 'active',
        tokenStatus: { status: 'active', expiresAt: Date.now() + 15 * 86400000 },
        linkedGameIds: ['111222', '333444'],
        departedAlts: {
          '111222': { name: 'DepartedAlt', status: 'left' }
        },
        altTokens: {
          '111222': { tokenExpired: true, nickname: 'DepartedAlt', membershipStatus: 'left' },
          '333444': { tokenExpired: false, nickname: 'ActiveAlt', expiresAt: Date.now() + 15 * 86400000, membershipStatus: 'active' }
        }
      };

      await window.updateNewMemberBadge();
      const badgeActiveNoExpiring = document.getElementById('newMemberBadge')?.style?.display;

      return {
        badgeDeparted,
        badgeActiveNoExpiring
      };
    });

    assert(bellAlertsResult.badgeDeparted === 'none' || !bellAlertsResult.badgeDeparted, 'Bell badge is hidden for departed user with expired token');
    assert(bellAlertsResult.badgeActiveNoExpiring === 'none' || !bellAlertsResult.badgeActiveNoExpiring, 'Bell badge is hidden when all remaining active accounts are valid');

    // -------------------------------------------------------------
    // Test 3D: Copy Unsynced Tokens List Functionality
    // -------------------------------------------------------------
    const copyUnsyncedResult = await page.evaluate(async () => {
      // Mount admin user so admin permissions pass
      window.currentUser = { uid: 'admin-user-01', gameId: '318843189', role: 'admin' };
      window.isAdminUser = () => true;

      let adminErr = null;
      if (window.views && window.views.admin) {
        try {
          await window.views.admin('tab-tools');
        } catch(e) {
          adminErr = e.message;
        }
      }

      // Create mock DOM rows mimicking admin table
      const container = document.createElement('div');
      container.id = 'test-table-container';
      container.innerHTML = `
        <input type="hidden" id="adminUserTokenFilter" value="all" />
        <table><tbody>
          <tr class="admin-user-row" data-name="Active Expired" data-name-raw="Active Expired" data-gid="1001" data-is-alt="false" data-is-claimed="true" data-token-status="expired" data-membership-status="active"></tr>
          <tr class="admin-user-row" data-name="Departed Expired" data-name-raw="Departed Expired" data-gid="1002" data-is-alt="false" data-is-claimed="true" data-token-status="exempt" data-membership-status="left"></tr>
          <tr class="admin-user-row" data-name="Banned Expired" data-name-raw="Banned Expired" data-gid="1003" data-is-alt="false" data-is-claimed="true" data-token-status="exempt" data-membership-status="banned"></tr>
          <tr class="admin-user-row" data-name="Active Alt Unverified" data-name-raw="Active Alt Unverified" data-gid="1004" data-is-alt="true" data-is-claimed="true" data-token-status="unverified" data-membership-status="active"></tr>
          <tr class="admin-user-row" data-name="Departed Alt Unverified" data-name-raw="Departed Alt Unverified" data-gid="1005" data-is-alt="true" data-is-claimed="true" data-token-status="exempt" data-membership-status="left"></tr>
        </tbody></table>
      `;
      document.body.appendChild(container);

      // Mock navigator.clipboard via Object.defineProperty (read-only in Chrome)
      let copiedText = '';
      let resolveClipboard;
      const clipboardPromise = new Promise(r => { resolveClipboard = r; });
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: (text) => {
            copiedText = text;
            resolveClipboard(text);
            return Promise.resolve();
          }
        },
        configurable: true,
        writable: true
      });

      const copyFnType = typeof window.copyUnsyncedTokensList;
      const rowCount = document.querySelectorAll('.admin-user-row').length;

      if (typeof window.copyUnsyncedTokensList === 'function') {
        window.copyUnsyncedTokensList();
      }

      const finalCopied = await Promise.race([
        clipboardPromise,
        new Promise(r => setTimeout(() => r(copiedText), 1500))
      ]);

      container.remove();
      return finalCopied;
    });

    assert(copyUnsyncedResult.includes('Active Expired (ID: 1001)'), 'copyUnsyncedTokensList includes active expired member');
    assert(copyUnsyncedResult.includes('Active Alt Unverified (ID: 1004)'), 'copyUnsyncedTokensList includes active unverified alt');
    assert(!copyUnsyncedResult.includes('Departed Expired'), 'copyUnsyncedTokensList omits departed member');
    assert(!copyUnsyncedResult.includes('Banned Expired'), 'copyUnsyncedTokensList omits banned member');
    assert(!copyUnsyncedResult.includes('Departed Alt Unverified'), 'copyUnsyncedTokensList omits departed alt');

    // -------------------------------------------------------------
    // Test 3E: Responsive Layout Audits
    // -------------------------------------------------------------
    const viewports = [
      { name: 'Desktop (1280x800)', width: 1280, height: 800 },
      { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      { name: 'Mobile (375x667)', width: 375, height: 667 }
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert(!overflow, `Zero horizontal overflow on ${vp.name}`);
    }

    // -------------------------------------------------------------
    // Test 3F: Console Error Audit
    // -------------------------------------------------------------
    assert(consoleErrors.length === 0, `Zero fatal browser console errors detected (${consoleErrors.length} found: ${consoleErrors.join(', ')})`);

  } catch (err) {
    assert(false, 'Headless Chrome test failed: ' + err.message);
  } finally {
    if (browser) await browser.close();
    server.close();
    finish();
  }
}

function finish() {
  console.log('\n==========================================');
  console.log(`📊 TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
  console.log('==========================================');
  process.exit(totalTests > 0 && passedTests === totalTests ? 0 : 1);
}

runBrowserTests();
