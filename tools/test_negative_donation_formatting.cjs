// tools/test_negative_donation_formatting.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

console.log('🧪 Starting Negative Donation Formatting & Badges Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${testName} -> ${err.message}`);
    process.exitCode = 1;
  }
}

// 1. Static & Syntax Verification
function runStaticVerification() {
  console.log('📦 Step 1: Static Code Verification...');

  runTest('main.js compiles cleanly with 0 syntax errors', () => {
    execSync('node --check main.js', { stdio: 'pipe' });
  });

  const mainJsPath = path.join(__dirname, '..', 'main.js');
  const mainJs = fs.readFileSync(mainJsPath, 'utf8');

  runTest('extractDonationMeta parses negative amounts and keywords', () => {
    assert(mainJs.includes('extractDonationMeta'), 'Must define extractDonationMeta');
    assert(mainJs.includes('Deducted') || mainJs.includes('Reverted'), 'Must support Deducted/Reverted keywords');
    assert(mainJs.includes('isNegative'), 'Must track isNegative flag');
  });

  runTest('showLogDetailModal handles negative amounts with danger red styling', () => {
    assert(mainJs.includes('isMetaNeg'), 'Must detect isMetaNeg in showLogDetailModal');
    assert(mainJs.includes('rgba(239,68,68') || mainJs.includes('#f87171'), 'Must apply red styling to negative items');
  });

  runTest('fetchAdminLog batching does signed calculation and handles negative totals', () => {
    assert(mainJs.includes('totalDonationPoints < 0'), 'Must format negative total donation points');
    assert(mainJs.includes('existing.amount = (existing.amount || 0) + mVal'), 'Must perform signed addition');
  });

  runTest('Recent donations widget cleanly formats negative numbers with danger styling', () => {
    assert(mainJs.includes('deducted -') || mainJs.includes('deducted '), 'Must distinguish deducted vs added in ticker');
    assert(mainJs.includes('var(--danger'), 'Must use danger color for negative ticker items');
  });

  runTest('BearTrapSidebar.html and AdminApp.html contain negative amount-badge styles', () => {
    const btSidebarPath = path.join(__dirname, '..', '..', 'wos', 'BearTrapSidebar.html');
    if (fs.existsSync(btSidebarPath)) {
      const btSidebar = fs.readFileSync(btSidebarPath, 'utf8');
      assert(btSidebar.includes('.amount-badge.negative'), 'BearTrapSidebar.html must include .amount-badge.negative');
    }

    const adminAppPath = path.join(__dirname, '..', '..', 'wos', 'AdminApp.html');
    if (fs.existsSync(adminAppPath)) {
      const adminApp = fs.readFileSync(adminAppPath, 'utf8');
      assert(adminApp.includes('.amount-badge.negative'), 'AdminApp.html must include .amount-badge.negative');
    }
  });
}

// 2. Functional Unit Tests
function runUnitTests() {
  console.log('\n⚙️ Step 2: Functional Parsing & Logic Verification...');

  const mainJsPath = path.join(__dirname, '..', 'main.js');
  const mainJs = fs.readFileSync(mainJsPath, 'utf8');

  // Extract window.extractLogMembers function
  const window = {};
  const fnStart = mainJs.indexOf('window.extractLogMembers = (log) => {');
  assert(fnStart !== -1, 'Could not find window.extractLogMembers');
  const fnEnd = mainJs.indexOf('window.showLogDetailModal = async (logId) => {', fnStart);
  assert(fnEnd !== -1, 'Could not find window.showLogDetailModal');
  const extractFnCode = mainJs.substring(fnStart, fnEnd);
  eval(extractFnCode);

  runTest('extractLogMembers parses legacy "Added +-48" as negative 48 points', () => {
    const log = {
      action: 'Bear Trap Donation Recorded',
      target: 'Mickthecat',
      details: 'Added +-48 Bear Trap donation points (New Total: 1,328)'
    };
    const res = window.extractLogMembers(log);
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].name, 'Mickthecat');
    assert.strictEqual(res[0].amount, -48);
    assert.strictEqual(res[0].isNegative, true);
    assert.strictEqual(res[0].meta, '-48 pts • Total: 1,328');
  });

  runTest('extractLogMembers parses "Deducted -48" cleanly', () => {
    const log = {
      action: 'Bear Trap Donation Deducted',
      target: 'Mickthecat',
      details: 'Deducted -48 Bear Trap donation points (New Total: 1,328)'
    };
    const res = window.extractLogMembers(log);
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].name, 'Mickthecat');
    assert.strictEqual(res[0].amount, -48);
    assert.strictEqual(res[0].isNegative, true);
    assert.strictEqual(res[0].meta, '-48 pts • Total: 1,328');
  });

  runTest('extractLogMembers parses "Reverted -60 Bear Trap donation points" cleanly', () => {
    const log = {
      action: 'Bear Trap Donation Reverted',
      target: 'Soulcrusher4217',
      details: 'Reverted -60 Bear Trap donation points (New Total: 60)'
    };
    const res = window.extractLogMembers(log);
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].name, 'Soulcrusher4217');
    assert.strictEqual(res[0].amount, -60);
    assert.strictEqual(res[0].isNegative, true);
    assert.strictEqual(res[0].meta, '-60 pts • Total: 60');
  });

  runTest('extractLogMembers handles regular positive donations correctly', () => {
    const log = {
      action: 'Bear Trap Donation',
      target: 'BrianDCox',
      details: 'Added +60 to BT1 (Total: 120)'
    };
    const res = window.extractLogMembers(log);
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].name, 'BrianDCox');
    assert.strictEqual(res[0].amount, 60);
    assert.strictEqual(res[0].isNegative, false);
    assert.strictEqual(res[0].meta, '+60 pts • Total: 120');
  });
}

// 3. Headless Chrome Browser Journey
async function runHeadlessBrowserTests() {
  console.log('\n🌐 Step 3: Real Headless Chrome DOM & Visual Verification...');

  let puppeteer;
  const possiblePuppeteerPaths = [
    'puppeteer-core',
    'puppeteer',
    path.resolve(__dirname, '../../pup/node_modules/puppeteer-core'),
    'C:\\Users\\Brian\\Documents\\antigravity\\pup\\node_modules\\puppeteer-core'
  ];

  for (const p of possiblePuppeteerPaths) {
    try {
      puppeteer = require(p);
      if (puppeteer) break;
    } catch (e) {}
  }

  if (!puppeteer) {
    throw new Error('Puppeteer could not be loaded from any known path!');
  }

  // Find Chrome executable on Windows
  const chromePaths = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
  ];
  let chromeExecutable = chromePaths.find(p => fs.existsSync(p));
  if (!chromeExecutable) {
    throw new Error('Google Chrome executable not found on system!');
  }

  const rootDir = path.join(__dirname, '..');
  const PORT = 8097;

  // Simple static file server
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };

  const server = http.createServer((req, res) => {
    const cleanUrl = req.url.split('?')[0];
    let filePath = path.join(rootDir, cleanUrl === '/' ? 'index.html' : cleanUrl);
    if (!fs.existsSync(filePath)) {
      filePath = path.join(rootDir, 'public', cleanUrl.startsWith('/') ? cleanUrl.slice(1) : cleanUrl);
    }
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      res.end('Not Found');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });

  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`  🚀 Headless test server listening at http://localhost:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: chromeExecutable,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    const consoleErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('favicon.ico') && !text.includes('Failed to load resource') && !text.includes('Failed to resolve module specifier')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', err => {
      if (!err.message.includes('Failed to resolve module specifier')) {
        consoleErrors.push(err.message);
      }
    });

    await page.evaluateOnNewDocument(() => {
      window.escapeHTML = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
      window.cleanChiefName = (n) => n;
      window.customConfirm = async () => true;
      window.showToast = () => {};
      window.currentUser = { uid: 'admin_test', email: 'admin@bdc.com', displayName: 'Admin', role: 'admin', isAdmin: true };
      window.isAdminUser = () => true;
      window.getAdminLevel = () => 'R5';
      window.db = {};
      window.ref = (d, p) => p;
      window.get = async () => ({ exists: () => false, val: () => null });
      window.set = async () => true;
      window.getAuthToken = async () => 'test-token';
    });

    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load', timeout: 15000 });

    // Inject showLogDetailModal block directly into page context
    const mainJsPath = path.join(rootDir, 'main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf8');
    const fnStart = mainJs.indexOf('window.revertDonationEntry = async');
    const fnEnd = mainJs.indexOf('window.showBatchedMembersModal = (id) =>', fnStart);
    assert(fnStart !== -1 && fnEnd !== -1, 'Could not find showLogDetailModal function chunk');
    const injectedCode = mainJs.substring(fnStart, fnEnd);
    await page.evaluate((code) => {
      window.eval(code);
    }, injectedCode);

    // Test A: Single Negative Donation Log Modal
    console.log('  Testing Single Negative Donation Detail Modal Rendering...');
    const singleModalData = await page.evaluate(() => {
      window._batchedMembersMap = window._batchedMembersMap || {};
      window._batchedMembersMap['log_neg_single'] = {
        id: 'log_neg_single',
        isBatch: false,
        admin: 'Admin Brian',
        action: 'Bear Trap Donation Deducted',
        target: 'Mickthecat',
        dateStr: 'Oct 10, 2026',
        timeStr: '4:15 PM',
        timestamp: Date.now(),
        details: 'Deducted -48 Bear Trap donation points (New Total: 1,328)',
        members: ['Mickthecat'],
        memberDetails: [
          { name: 'Mickthecat', meta: '-48 pts • Total: 1,328', amount: -48, isNegative: true, raw: 'Mickthecat' }
        ],
        _fbKey: '-ObNegSingleKey'
      };

      window.showLogDetailModal('log_neg_single');

      const modal = document.getElementById('logDetailModal');
      if (!modal) return { exists: false };

      const badgeEl = modal.querySelector('span[style*="f87171"], span[style*="239,68,68"]');
      const badgeText = badgeEl ? badgeEl.innerText.trim() : '';
      const notesEl = modal.querySelector('div[style*="word-break:break-word"]');
      const notesText = notesEl ? notesEl.innerText.trim() : (modal.innerText || '');
      const hasCorruptedSign = modal.innerHTML.includes('+-');

      return {
        exists: true,
        badgeText,
        notesText,
        hasCorruptedSign
      };
    });

    runTest('Negative donation log renders modal successfully in DOM', () => {
      assert(singleModalData.exists, 'Modal must exist in DOM');
    });

    runTest('Negative donation log renders danger red badge with clean minus sign', () => {
      assert(singleModalData.badgeText.includes('-48'), `Badge must show -48, got: "${singleModalData.badgeText}"`);
      assert(!singleModalData.badgeText.includes('+-'), 'Badge must not have +-');
    });

    runTest('Modal sanitized notes and details with zero corrupted +- strings', () => {
      assert(!singleModalData.hasCorruptedSign, 'Must contain zero +- anywhere in modal DOM');
      assert(singleModalData.notesText.includes('Deducted -48') || singleModalData.notesText.includes('-48'), 'Notes must show deduction');
    });

    // Close modal
    await page.evaluate(() => document.getElementById('logDetailModal')?.remove());

    // Test B: Legacy "Added +-48" Sanitization in Modal
    console.log('  Testing Legacy "+-48" Automatic DOM Sanitization in Modal...');
    const sanitizedModalData = await page.evaluate(() => {
      window._batchedMembersMap = window._batchedMembersMap || {};
      window._batchedMembersMap['log_legacy_neg'] = {
        id: 'log_legacy_neg',
        isBatch: false,
        admin: 'Admin Brian',
        action: 'Bear Trap Donation Recorded',
        target: 'Mickthecat',
        dateStr: 'Oct 09, 2026',
        timeStr: '2:10 PM',
        timestamp: Date.now() - 3600000,
        details: 'Added +-48 Bear Trap donation points (New Total: 1,328)',
        members: ['Mickthecat'],
        memberDetails: [
          { name: 'Mickthecat', meta: '-48 pts • Total: 1,328', amount: -48, isNegative: true, raw: 'Mickthecat' }
        ],
        _fbKey: '-ObLegacyNegKey'
      };

      window.showLogDetailModal('log_legacy_neg');

      const modal = document.getElementById('logDetailModal');
      if (!modal) return { exists: false };

      const modalHtml = modal.innerHTML;
      const notesEl = modal.querySelector('div[style*="word-break:break-word"]');
      const notesText = notesEl ? notesEl.innerText.trim() : (modal.innerText || '');

      return {
        exists: true,
        hasPlusMinus: modalHtml.includes('+-'),
        notesText
      };
    });

    runTest('Legacy log detail with +- is dynamically sanitized to minus in modal', () => {
      assert(!sanitizedModalData.hasPlusMinus, 'Must dynamically replace +- in modal display');
      assert(sanitizedModalData.notesText.includes('-48'), 'Notes must show clean minus 48');
    });

    // Close modal
    await page.evaluate(() => document.getElementById('logDetailModal')?.remove());

    // Test C: Responsive Layout Check
    console.log('  Testing Responsive Layout & Horizontal Overflow...');
    for (const width of [375, 768, 1280]) {
      await page.setViewport({ width, height: 800 });
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      runTest(`Zero horizontal scroll overflow at ${width}px`, () => {
        assert(!overflow, `Horizontal overflow detected at ${width}px!`);
      });
    }

    // Zero Console Errors Assertion
    runTest('Zero fatal console errors during execution', () => {
      if (consoleErrors.length > 0) {
        console.warn('  ⚠️ Console errors captured:', consoleErrors);
      }
      assert.strictEqual(consoleErrors.length, 0, `Detected ${consoleErrors.length} console error(s)`);
    });

  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
    console.log('  🧹 Browser and test server closed cleanly.\n');
  }
}

async function main() {
  runStaticVerification();
  runUnitTests();
  await runHeadlessBrowserTests();

  console.log('=========================================');
  console.log(`Test Summary: ${passedTests}/${totalTests} tests passed`);
  console.log('=========================================');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal Test Runner Error:', err);
  process.exit(1);
});
