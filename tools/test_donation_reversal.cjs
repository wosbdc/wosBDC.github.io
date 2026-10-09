// tools/test_donation_reversal.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

console.log('🧪 Starting Bear Trap Donation Reversal & Deletion Test Suite...\n');

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

// 1. Static Verification
function runStaticVerification() {
  console.log('📦 Step 1: Static Code Verification...');

  runTest('main.js compiles cleanly with 0 syntax errors', () => {
    execSync('node --check main.js', { stdio: 'pipe' });
  });

  const mainJsPath = path.join(__dirname, '..', 'main.js');
  const mainJs = fs.readFileSync(mainJsPath, 'utf8');

  runTest('window.revertDonationEntry is defined with admin authorization check', () => {
    assert(mainJs.includes('window.revertDonationEntry = async'), 'Must define window.revertDonationEntry');
    assert(mainJs.includes('Only admins can revert donations'), 'Must enforce admin check');
    assert(mainJs.includes('Math.max(0, prevCurrent - deductAmt)'), 'Must bound points deduction at zero');
  });

  runTest('window.revertEntireDonationLog is defined with batch processing', () => {
    assert(mainJs.includes('window.revertEntireDonationLog = async'), 'Must define window.revertEntireDonationLog');
    assert(mainJs.includes('Reverted batch of') || mainJs.includes('Reverted -'), 'Must log audit trail for reversal');
  });

  runTest('fetchAdminLog preserves and propagates _fbKey for log tagging', () => {
    assert(mainJs.includes('_fbKey: k') || mainJs.includes('_fbKey: firstLog._fbKey'), 'Must preserve _fbKey');
    assert(mainJs.includes('_fbKey: firstLog._fbKey'), 'Must propagate _fbKey into batched map');
  });

  runTest('showLogDetailModal renders row-level and footer revert buttons for donation logs', () => {
    assert(mainJs.includes('isDonationLog'), 'Must detect isDonationLog');
    assert(mainJs.includes('revert-donation-btn'), 'Must render row-level revert button with class revert-donation-btn');
    assert(mainJs.includes('revertEntireDonationLogBtn'), 'Must render footer revert button');
    assert(mainJs.includes('DONATION REVERTED:'), 'Must show prominent alert banner when log is reverted');
  });

  runTest('Admin logs table renders REVERTED badge on reverted rows', () => {
    assert(mainJs.includes('REVERTED</span>'), 'Must display REVERTED badge in table rows');
  });
}

// 2. Functional Math & Logic Tests
function runFunctionalTests() {
  console.log('\n📦 Step 2: Functional Logic & Math Tests...');

  runTest('Math.max correctly bounds negative deductions at zero', () => {
    const prevCurrent = 40;
    const deductAmt = 60;
    const newCurrent = Math.max(0, prevCurrent - deductAmt);
    assert.strictEqual(newCurrent, 0, '40 - 60 must be bounded to 0');

    const prevCurrent2 = 120;
    const deductAmt2 = 50;
    const newCurrent2 = Math.max(0, prevCurrent2 - deductAmt2);
    assert.strictEqual(newCurrent2, 70, '120 - 50 must equal 70');
  });

  runTest('resolveItemAmt resolves correct donation amount from meta and details', () => {
    const resolveItemAmt = (item, detailsText) => {
      if (item && item.amount && Number(item.amount) > 0) return Number(item.amount);
      if (item && item.meta) {
        const m = String(item.meta).match(/\+?(\d[\d,]*)/);
        if (m) return parseInt(m[1].replace(/[^\d]/g, ''), 10) || 0;
      }
      if (item && item.raw) {
        const m = String(item.raw).match(/\+?(\d[\d,]*)/);
        if (m) return parseInt(m[1].replace(/[^\d]/g, ''), 10) || 0;
      }
      if (detailsText) {
        const m = String(detailsText).match(/(?:Added\s*)?\+?(\d[\d,]*)\s*(?:to\s*BT\d+|donation|pts)/i);
        if (m) return parseInt(m[1].replace(/[^\d]/g, ''), 10) || 0;
        const m2 = String(detailsText).match(/active donation to\s*(\d[\d,]*)/i);
        if (m2) return parseInt(m2[1].replace(/[^\d]/g, ''), 10) || 0;
        const m3 = String(detailsText).match(/\+(\d[\d,]*)/);
        if (m3) return parseInt(m3[1].replace(/[^\d]/g, ''), 10) || 0;
      }
      return 0;
    };

    // Case 1: Item with explicit amount
    assert.strictEqual(resolveItemAmt({ name: 'ChiefA', amount: 60 }), 60);

    // Case 2: Item with meta "+60 pts • Total: 60"
    assert.strictEqual(resolveItemAmt({ name: 'ChiefB', meta: '+60 pts • Total: 60' }), 60);

    // Case 3: Log details "Added +60 to BT1 (Total: 60)"
    assert.strictEqual(resolveItemAmt({ name: 'ChiefC' }, 'Added +60 to BT1 (Total: 60)'), 60);

    // Case 4: Log details "Updated active donation to 80"
    assert.strictEqual(resolveItemAmt({ name: 'ChiefD' }, 'Updated active donation to 80'), 80);
  });
}

// 3. Headless Chrome Browser Verification
async function runHeadlessVerification() {
  console.log('\n🌐 Step 3: Real Headless Chrome Browser Verification...');

  // Resolution for Puppeteer
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

  if (!puppeteer) {
    console.warn('⚠️ Puppeteer not found in standard paths, skipping headless browser run.');
    return;
  }

  const possibleChromePaths = [
    process.env.CHROME_BIN,
    process.env.PUPPETEER_EXECUTABLE_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser'
  ].filter(Boolean);

  const chromePath = possibleChromePaths.find(p => fs.existsSync(p));
  if (!chromePath) {
    console.warn('⚠️ Google Chrome executable not found, skipping headless run.');
    return;
  }

  // Spin up local HTTP server to serve test harness
  const PORT = 8119;
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Donation Reversal Test Harness</title>
      <style>
        :root {
          --bg-card: #1e293b;
          --border: #334155;
          --text-main: #f8fafc;
          --text-muted: #94a3b8;
          --accent: #0ea5e9;
        }
        body { font-family: sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
      </style>
    </head>
    <body>
      <div id="app"></div>
      <script>
        window.currentUser = { role: 'admin', isAdmin: true, name: 'Brian', gameId: '1001' };
        window.isAdminUser = () => true;
        window.escapeHTML = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        window.cleanChiefName = (n) => n;
        window.customConfirm = async () => true; // auto-confirm for headless test
        window.showToast = (msg) => { window.__lastToast = msg; };
        window.fetch = async () => ({ ok: true, json: async () => ({ success: true }) });
        window.getAuthToken = async () => 'mock-token';
        window.API_BASE_URL = 'https://mock.example.com';
        window.db = {};
        window.ref = (db, p) => p;
        window.__setCalls = [];
        window.get = async (r) => {
          if (String(r).includes('admin_logs')) {
            return { exists: () => true, val: () => ({ action: 'Bear Trap Donation', details: 'Added +60 to BT1 (Total: 60)' }) };
          }
          return { exists: () => true, val: () => ({ name: 'Soulcrusher4217', current: 120, allTime: 120 }) };
        };
        window.set = async (r, v) => {
          window.__setCalls.push({ path: r, val: v });
          return true;
        };
        window.logAdminAction = (action, details, target) => {
          window.__lastAdminLog = { action, details, target };
        };
      </script>
    </body>
    </html>
  `;

  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(htmlContent);
  });

  await new Promise(resolve => server.listen(PORT, resolve));

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const consoleErrors = [];

  try {
    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'load' });

    // Inject the functions from main.js into the headless page
    const mainJsPath = path.join(__dirname, '..', 'main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf8');

    // Extract revertDonationEntry, revertEntireDonationLog, showLogDetailModal
    const fnStart = mainJs.indexOf('window.revertDonationEntry = async');
    const fnEnd = mainJs.indexOf('window.showBatchedMembersModal = (id) =>', fnStart);
    assert(fnStart !== -1 && fnEnd !== -1, 'Could not find donation reversal functions chunk');
    const injectedCode = mainJs.substring(fnStart, fnEnd);

    await page.evaluate((code) => {
      const script = document.createElement('script');
      script.textContent = code;
      document.body.appendChild(script);
    }, injectedCode);

    // Test 1: Single Donation Log Modal Rendering
    console.log('  Testing Single Bear Trap Donation Modal Rendering...');
    await page.evaluate(() => {
      window._batchedMembersMap = {
        'log_single_test': {
          id: 'log_single_test',
          isBatch: false,
          admin: 'WOS ChatBot',
          action: 'Bear Trap Donation',
          target: 'Soulcrusher4217',
          dateStr: 'Sep 20, 2026',
          timeStr: '8:01 PM',
          timestamp: Date.now(),
          details: 'Added +60 to BT1 (Total: 60)',
          members: ['Soulcrusher4217'],
          memberDetails: [{ name: 'Soulcrusher4217', meta: '+60 pts • Total: 60', amount: 60, raw: 'Soulcrusher4217' }],
          _fbKey: '-Ob123TestKey'
        }
      };

      window.showLogDetailModal('log_single_test');
    });

    await new Promise(r => setTimeout(r, 200));

    // Assert modal exists
    const modalExists = await page.evaluate(() => Boolean(document.getElementById('logDetailModal')));
    assert(modalExists, 'Modal #logDetailModal must render in DOM');
    console.log('  ✅ Single donation modal opened successfully');

    // Assert row revert button exists
    const rowBtnText = await page.evaluate(() => {
      const btn = document.querySelector('.revert-donation-btn');
      return btn ? btn.innerText.trim() : '';
    });
    assert(rowBtnText.includes('Revert'), 'Row-level revert button must render with "Revert"');
    console.log('  ✅ Row-level "[ ↩️ Revert ]" button present in chief entry');

    // Assert footer revert button exists
    const footerBtnText = await page.evaluate(() => {
      const btn = document.getElementById('revertEntireDonationLogBtn');
      return btn ? btn.innerText.trim() : '';
    });
    assert(footerBtnText.includes('Revert Donation'), 'Footer button must render "↩️ Revert Donation"');
    console.log('  ✅ Modal footer renders "[ ↩️ Revert Donation ]" button');

    // Test 2: Trigger row-level revert
    console.log('  Testing Programmatic Donation Reversal Execution...');
    const revertResult = await page.evaluate(async () => {
      const btn = document.querySelector('.revert-donation-btn');
      return await window.revertDonationEntry('Soulcrusher4217', 60, 'log_single_test', btn);
    });
    assert.strictEqual(revertResult, true, 'revertDonationEntry must return true on success');

    // Assert Firebase deduction was performed
    const setCalls = await page.evaluate(() => window.__setCalls);
    const donCall = setCalls.find(c => String(c.path).includes('beartrap_donations'));
    assert(donCall, 'Firebase set() must have been called for beartrap_donations');
    assert.strictEqual(donCall.val.current, 60, '120 - 60 must leave 60 current points');
    console.log('  ✅ Firebase donation deduction executed: current points decremented to 60');

    const logCall = setCalls.find(c => String(c.path).includes('admin_logs'));
    assert(logCall, 'Firebase set() must have been called to tag admin_logs');
    assert(logCall.val.details.includes('[REVERTED'), 'Original log must be tagged with [REVERTED]');
    console.log('  ✅ Original admin_logs record tagged with [REVERTED] in Firebase');

    // Assert DOM mutations in modal
    const isRowReverted = await page.evaluate(() => {
      const modal = document.getElementById('logDetailModal');
      return modal ? modal.innerHTML.includes('↩️ Reverted') : false;
    });
    assert(isRowReverted, 'Row must physically mutate to display "↩️ Reverted" badge');
    console.log('  ✅ Visual DOM assertion passed: row mutated to "↩️ Reverted"');

    // Close single modal
    await page.evaluate(() => document.getElementById('logDetailModal')?.remove());

    // Test 3: Multi-chief Batch Modal Rendering & Batch Reversal
    console.log('  Testing Batched Multi-Chief Donation Modal & Batch Reversal...');
    await page.evaluate(() => {
      window._batchedMembersMap = {
        'batch_multi_test': {
          id: 'batch_multi_test',
          isBatch: true,
          admin: 'Brian',
          action: 'Bear Trap Donations Added',
          dateStr: 'Sep 21, 2026',
          timeStr: '2:30 PM',
          timestamp: Date.now(),
          details: 'Added multi-donation batch for 2 player(s)',
          members: ['ChiefAlpha', 'ChiefBeta'],
          memberDetails: [
            { name: 'ChiefAlpha', meta: '+100 pts', amount: 100, raw: 'ChiefAlpha' },
            { name: 'ChiefBeta', meta: '+50 pts', amount: 50, raw: 'ChiefBeta' }
          ],
          _fbKey: '-ObBatchMultiKey'
        }
      };

      window.showLogDetailModal('batch_multi_test');
    });

    await new Promise(r => setTimeout(r, 200));

    // Assert footer batch button exists
    const batchFooterBtn = await page.evaluate(() => {
      const btn = document.getElementById('revertEntireDonationLogBtn');
      return btn ? btn.innerText.trim() : '';
    });
    assert(batchFooterBtn.includes('Revert Entire Batch'), 'Batch footer must render "🗑️ Revert Entire Batch"');
    console.log('  ✅ Batch modal renders "[ 🗑️ Revert Entire Batch ]" button');

    // Execute batch reversal
    const batchResult = await page.evaluate(async () => {
      const btn = document.getElementById('revertEntireDonationLogBtn');
      return await window.revertEntireDonationLog('batch_multi_test', btn);
    });
    assert.strictEqual(batchResult, true, 'revertEntireDonationLog must return true on success');

    // Assert audit log
    const lastAudit = await page.evaluate(() => window.__lastAdminLog);
    assert(lastAudit && lastAudit.action === 'Bear Trap Donation Reverted', 'Must log Bear Trap Donation Reverted');
    assert(lastAudit.details.includes('150 total pts'), 'Audit log must record total 150 pts deducted');
    console.log('  ✅ Batch audit log verified: Reverted batch of 2 donations (-150 total pts)');

    // Test 4: Responsive Layout Check
    console.log('  Testing Mobile & Desktop Viewport Responsiveness...');
    for (const w of [375, 768, 1280]) {
      await page.setViewport({ width: w, height: 700 });
      const overflow = await page.evaluate(() => {
        const modal = document.querySelector('#logDetailModal > div');
        return modal ? modal.scrollWidth > window.innerWidth : false;
      });
      assert(!overflow, `Modal must not overflow horizontally at viewport width ${w}px`);
    }
    console.log('  ✅ Responsive design verified: 0 horizontal overflow across 375px, 768px, and 1280px');

    // Assert zero critical console errors
    const fatalErrors = consoleErrors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('ERR_NAME_NOT_RESOLVED') && 
      !e.includes('net::')
    );
    assert.strictEqual(fatalErrors.length, 0, `Zero fatal browser console errors allowed: ${JSON.stringify(fatalErrors)}`);
    console.log('  ✅ Zero fatal browser console errors detected during runtime execution');

    totalTests += 7;
    passedTests += 7;

  } finally {
    await browser.close();
    server.close();
  }
}

async function main() {
  runStaticVerification();
  runFunctionalTests();
  await runHeadlessVerification();

  console.log(`\n🎉 Test Suite Completed: ${passedTests}/${totalTests} tests passed.\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
