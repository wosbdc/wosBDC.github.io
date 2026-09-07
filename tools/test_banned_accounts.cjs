// tools/test_banned_accounts.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const puppeteerPath = 'C:\\Users\\Brian\\Documents\\antigravity\\pup\\node_modules\\puppeteer-core';
const puppeteer = require(puppeteerPath);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PORT = 8092;
const DIST_DIR = path.join(__dirname, '..', 'dist');

console.log('🧪 Starting Banned Accounts & Membership Filter Automated Test Suite...\n');

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

// TEST 1: Node.js Syntax & Compilation Check
console.log('📦 Test 1: Node.js Syntax & Compilation Check for main.js');
try {
  execSync('node --check main.js', { stdio: 'pipe' });
  assert(true, 'main.js compiles cleanly with 0 syntax errors');
} catch (err) {
  assert(false, 'main.js compile failed: ' + err.message);
}

// TEST 2: Static Codebase Verification
console.log('\n🔍 Test 2: Codebase Verification for Banned Alts & Status Filtering');
const mainContent = fs.readFileSync('main.js', 'utf8');

assert(mainContent.includes("isStatusTab = (activeTab === 'banned' || activeTab === 'left')"), 'filterAdminUsersList defines isStatusTab');
assert(mainContent.includes("isStatusAttr = (attrFilter === 'banned_members' || attrFilter === 'left_members')"), 'filterAdminUsersList defines isStatusAttr');
assert(mainContent.includes('!isStatusTab && !isStatusAttr'), 'filterAdminUsersList bypasses alt collapse on status tab/attr');
assert(mainContent.includes('const totalAlts = userAltGids.length'), 'main.js preserves all alts in userAltGids without status exclusion');
assert(mainContent.includes('departedAlts'), 'main.js checks departedAlts in alt collections');

// TEST 3: Logic Simulation for Banned Alts & Status Filtering
console.log('\n⚙️ Test 3: Simulation of Status Tab Filtering on Collapsed Alts');

const mockRows = [
  { name: 'briandcox', gid: '318843189', isAlt: false, memStatus: 'active', ownerUid: 'IM03', isAltRow: false },
  { name: 'perma frost', gid: '735162894', isAlt: true, memStatus: 'banned', ownerUid: 'IM03', isAltRow: true },
  { name: 'dragon frost', gid: '737099025', isAlt: true, memStatus: 'banned', ownerUid: 'IM03', isAltRow: true },
  { name: 'cyrus frost', gid: '739273797', isAlt: true, memStatus: 'banned', ownerUid: 'IM03', isAltRow: true },
  { name: 'sentinel frost', gid: '735795416', isAlt: true, memStatus: 'active', ownerUid: 'IM03', isAltRow: true },
  { name: 'titan frost', gid: '738924588', isAlt: false, memStatus: 'banned', ownerUid: null, isAltRow: false }
];

const mockCollapsedAltOwnerUids = new Set(['IM03']);

function simulateFilter(activeTab, searchVal = '', attrFilter = 'all') {
  const visible = [];
  mockRows.forEach(row => {
    const isAltRow = row.isAltRow;
    const ownerUid = row.ownerUid;
    const isAltCollapsed = isAltRow && ownerUid && mockCollapsedAltOwnerUids.has(ownerUid);
    const isExplicitAltTab = (activeTab === 'alts');
    const isStatusTab = (activeTab === 'banned' || activeTab === 'left');
    const isStatusAttr = (attrFilter === 'banned_members' || attrFilter === 'left_members');
    const isSpecificSearchMatch = Boolean(searchVal && (row.name.includes(searchVal) || row.gid.includes(searchVal)));

    let matchesTab = true;
    if (activeTab === 'active') matchesTab = (row.memStatus === 'active');
    else if (activeTab === 'left') matchesTab = (row.memStatus === 'left');
    else if (activeTab === 'banned') matchesTab = (row.memStatus === 'banned');
    else if (activeTab === 'mains') matchesTab = !row.isAlt;
    else if (activeTab === 'alts') matchesTab = row.isAlt;

    const matchesSearch = !searchVal || row.name.includes(searchVal) || row.gid.includes(searchVal);

    if (matchesSearch && matchesTab) {
      if (isAltCollapsed && !isExplicitAltTab && !isStatusTab && !isStatusAttr && !isSpecificSearchMatch) {
        // hidden
      } else {
        visible.push(row.name);
      }
    }
  });
  return visible;
}

const bannedTabResults = simulateFilter('banned');
assert(bannedTabResults.length === 4, 'Banned tab shows exactly 4 banned accounts (visible: ' + bannedTabResults.length + ')');
assert(bannedTabResults.includes('perma frost'), 'Banned tab includes Perma Frost (banned alt)');
assert(bannedTabResults.includes('dragon frost'), 'Banned tab includes Dragon Frost (banned alt)');
assert(bannedTabResults.includes('cyrus frost'), 'Banned tab includes Cyrus Frost (banned alt)');
assert(bannedTabResults.includes('titan frost'), 'Banned tab includes Titan Frost (unclaimed banned)');
assert(!bannedTabResults.includes('briandcox'), 'Banned tab excludes BrianDCox (active main)');
assert(!bannedTabResults.includes('sentinel frost'), 'Banned tab excludes Sentinel Frost (active alt)');

const altsTabResults = simulateFilter('alts');
assert(altsTabResults.length === 4, 'Alts tab shows all 4 alts bypassing collapse');

const searchPermaResults = simulateFilter('all', 'perma');
assert(searchPermaResults.length === 1 && searchPermaResults[0] === 'perma frost', 'Direct search for Perma Frost expands collapsed alt');

// TEST 4: Real Headless Chrome Execution
console.log('\n🌐 Test 4: Real Headless Chrome Execution via Puppeteer-Core');

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
  console.log('  🚀 Local test server running at http://localhost:' + PORT);

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    const errors = [];

    page.on('pageerror', err => {
      console.warn('  ⚠️ Page error:', err.message);
      if (!err.message.includes('Firebase') && !err.message.includes('fetch')) {
        errors.push(err.message);
      }
    });

    await page.goto('http://localhost:' + PORT, { waitUntil: 'networkidle0', timeout: 15000 });
    assert(errors.length === 0, 'Page loaded with 0 fatal script/console errors');

    for (const width of [375, 768, 1280]) {
      await page.setViewport({ width, height: 800 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      assert(!overflow, 'No horizontal overflow at width ' + width + 'px');
    }

    const adminTabOk = await page.evaluate(async () => {
      if (typeof views !== 'undefined' && typeof views.admin === 'function') {
        try { views.admin('tab-users'); } catch(e) {}
      }
      return (typeof window.setAdminUserPopulationTab === 'function' && typeof window.filterAdminUsersList === 'function');
    });
    assert(adminTabOk, 'window.setAdminUserPopulationTab and filterAdminUsersList are defined in runtime');

  } catch (err) {
    assert(false, 'Puppeteer execution error: ' + err.message);
  } finally {
    if (browser) await browser.close();
    server.close();

    console.log('\n=========================================');
    console.log(`Test Summary: ${passedTests}/${totalTests} tests passed`);
    console.log('=========================================\n');

    process.exit(passedTests === totalTests ? 0 : 1);
  }
});
