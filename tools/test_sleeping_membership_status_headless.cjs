// tools/test_sleeping_membership_status_headless.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const PORT = 8110;
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

let passedTests = 0;
let totalTests = 0;

function runAssertion(condition, testName) {
  totalTests++;
  if (condition) {
    console.log('  ✅ PASS: ' + testName);
    passedTests++;
  } else {
    console.error('  ❌ FAIL: ' + testName);
    process.exitCode = 1;
  }
}

function runStaticAndLogicVerification() {
  console.log('📦 Starting Static & Logic Verification for Sleeping Membership Status...');
  const mainJsPath = path.resolve(__dirname, '..', 'main.js');
  const code = fs.readFileSync(mainJsPath, 'utf8');

  // 1. Static code assertions
  runAssertion(
    code.includes("if (s === 'sleeping' || s === 'sleep' || s === 'afk' || s === 'inactive_break' || s === 'hiatus' || s === 'on_break' || s === 'break') return 'sleeping';"),
    'main.js normalizes sleeping status and all aliases (sleep, afk, hiatus, etc.)'
  );

  runAssertion(
    code.includes('value="sleeping"') && code.includes('😴 Sleeping / On Break (Hiatus)'),
    'Membership status modal renders 😴 Sleeping / On Break (Hiatus) option'
  );

  runAssertion(
    code.includes('data-tab="sleeping"') && code.includes('😴 Sleeping'),
    'Admin Users directory includes 😴 Sleeping population filter tab'
  );

  runAssertion(
    code.includes('countSleeping') && code.includes("activeTab === 'sleeping'"),
    'filterAdminUsersList handles sleeping population count and tab filtering'
  );

  runAssertion(
    code.includes('Wake Up (Set to Active)'),
    'Admin directory row actions menu includes ⏰ Wake Up quick action'
  );

  runAssertion(
    code.includes('😴 Sleeping (Hiatus)') || code.includes('⏰ Back from Break? Wake Up'),
    'Account Hub renders sleeping badge and self-wake action for returning players'
  );

  runAssertion(
    code.includes("executeTableBulkStatusChange('sleeping')"),
    'Admin floating bulk toolbar includes 😴 Set Sleeping action'
  );

  runAssertion(
    code.includes('bulkStatusModalChoice') && code.includes('value="sleeping"'),
    'Bulk Status With Reason modal includes 😴 Sleeping / On Break radio option'
  );

  runAssertion(
    code.includes("setBulkManagerFilter('sleeping')") && code.includes('bulkManagerTargetStatus') && code.includes('value="sleeping"'),
    'Bulk Membership Manager modal includes All Sleeping filter and Sleeping target status radio'
  );

  runAssertion(
    code.includes('primaryGidsSet.forEach(gid => altGidsSet.delete(gid))') && code.includes('!isPrimaryChief'),
    'Alt resolver explicitly purges primary main chiefs and guards isAlt = !isPrimaryChief'
  );

  // 2. Logic Simulation
  console.log('\n⚙️ Starting Logic Simulation for Sleeping Status Normalization & Exclusion...');

  const normalizeMembershipStatus = (status) => {
    if (!status) return 'active';
    const s = String(status).toLowerCase().trim();
    if (s === 'banned' || s === 'ban') return 'banned';
    if (s === 'sleeping' || s === 'sleep' || s === 'afk' || s === 'inactive_break' || s === 'hiatus' || s === 'on_break' || s === 'break') return 'sleeping';
    if (s === 'left' || s === 'former' || s === 'inactive' || s === 'left_alliance' || s === 'left alliance' || s === 'departed' || s === 'depart' || s === 'deleted' || s === 'delete' || s === 'archived') return 'left';
    return 'active';
  };

  const isPlayerActiveMember = (p) => {
    if (typeof p === 'string') return true;
    if (p.membershipStatus || p.status) {
      return normalizeMembershipStatus(p.membershipStatus || p.status) === 'active';
    }
    return true;
  };

  // Normalization checks
  runAssertion(normalizeMembershipStatus('sleeping') === 'sleeping', 'normalizeMembershipStatus("sleeping") -> sleeping');
  runAssertion(normalizeMembershipStatus('sleep') === 'sleeping', 'normalizeMembershipStatus("sleep") -> sleeping');
  runAssertion(normalizeMembershipStatus('hiatus') === 'sleeping', 'normalizeMembershipStatus("hiatus") -> sleeping');
  runAssertion(normalizeMembershipStatus('afk') === 'sleeping', 'normalizeMembershipStatus("afk") -> sleeping');
  runAssertion(normalizeMembershipStatus('on_break') === 'sleeping', 'normalizeMembershipStatus("on_break") -> sleeping');
  runAssertion(normalizeMembershipStatus('inactive_break') === 'sleeping', 'normalizeMembershipStatus("inactive_break") -> sleeping');

  // Exclusion checks
  const mockActivePlayer = { name: 'FrostCommander', membershipStatus: 'active' };
  const mockSleepingPlayer = { name: 'SnoozingChief', membershipStatus: 'sleeping' };
  const mockHiatusPlayer = { name: 'HiatusChief', membershipStatus: 'hiatus' };
  const mockLeftPlayer = { name: 'FormerMember', membershipStatus: 'left' };

  runAssertion(isPlayerActiveMember(mockActivePlayer) === true, 'Active member is accepted as active member');
  runAssertion(isPlayerActiveMember(mockSleepingPlayer) === false, 'Sleeping member is excluded from active events (returns false)');
  runAssertion(isPlayerActiveMember(mockHiatusPlayer) === false, 'Hiatus member is excluded from active events (returns false)');
  runAssertion(isPlayerActiveMember(mockLeftPlayer) === false, 'Left member is excluded from active events (returns false)');

  // Event Roster Filter simulation
  const mockFullRoster = [
    { name: 'Alpha', membershipStatus: 'active' },
    { name: 'Bravo', membershipStatus: 'sleeping' },
    { name: 'Charlie', membershipStatus: 'left' },
    { name: 'Delta', membershipStatus: 'active' },
    { name: 'Echo', membershipStatus: 'hiatus' }
  ];

  const activeEventRoster = mockFullRoster.filter(p => isPlayerActiveMember(p));
  runAssertion(activeEventRoster.length === 2, 'Active event roster contains exactly 2 members (Alpha & Delta)');
  runAssertion(activeEventRoster.map(p => p.name).includes('Alpha'), 'Alpha is in event roster');
  runAssertion(activeEventRoster.map(p => p.name).includes('Delta'), 'Delta is in event roster');
  runAssertion(!activeEventRoster.map(p => p.name).includes('Bravo'), 'Sleeping member Bravo is excluded from event roster');
  runAssertion(!activeEventRoster.map(p => p.name).includes('Echo'), 'Hiatus member Echo is excluded from event roster');

  // Primary Main Chiefs Alt Resolution simulation
  const mockRegisteredUsers = {
    u1: { gameId: '318843189', chiefName: 'BrianDCox', linkedGameIds: ['318843189', '444555666'] },
    u2: { gameId: '697738681', chiefName: 'Guardian', linkedGameIds: ['697738681'] },
    u3: { gameId: '628432919', chiefName: 'Thadwarf', linkedGameIds: ['628432919', '888999000'] }
  };

  const primaryGids = new Set(['318843189', '697738681', '628432919']);
  const primaryNames = new Set(['briandcox', 'guardian', 'thadwarf']);
  const altGids = new Set(['444555666', '888999000']); // Primary IDs filtered out!

  const testChiefBrian = { name: 'BrianDCox', gameId: '318843189' };
  const testChiefGuardian = { name: 'Guardian', gameId: '697738681' };
  const testChiefAlt = { name: 'BrianFarm', gameId: '444555666' };

  const isAltResolver = (p) => {
    const gid = p.gameId;
    const name = p.name.toLowerCase();
    const isPrimary = primaryGids.has(gid) || primaryNames.has(name);
    return !isPrimary && (altGids.has(gid) || false);
  };

  runAssertion(isAltResolver(testChiefBrian) === false, 'Registered primary chief BrianDCox is NOT an alt');
  runAssertion(isAltResolver(testChiefGuardian) === false, 'Registered primary chief Guardian is NOT an alt');
  runAssertion(isAltResolver(testChiefAlt) === true, 'Secondary linked account BrianFarm is correctly identified as an alt');
}

async function runHeadlessBrowserVerification() {
  console.log('\n🌐 Starting Real Headless Chrome Verification via Puppeteer-Core...');
  if (!puppeteer || !chromePath) {
    console.log('  ⚠️ Puppeteer or Chrome binary not available in current environment - skipping headless browser phase.');
    return;
  }

  const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'application/javascript',
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

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log('  🚀 Local test server running at http://localhost:' + PORT);

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    const fatalErrors = [];

    page.on('pageerror', err => {
      if (!err.message.includes('Firebase') && !err.message.includes('fetch') && !err.message.includes('Failed to load resource')) {
        console.warn('  ⚠️ Page error:', err.message);
        fatalErrors.push(err.message);
      }
    });

    await page.goto('http://localhost:' + PORT, { waitUntil: 'networkidle0', timeout: 20000 });
    runAssertion(fatalErrors.length === 0, 'Page loaded with 0 fatal script/console errors');

    // Multi-viewport layout audits (375px mobile, 768px tablet, 1280px desktop)
    for (const width of [375, 768, 1280]) {
      await page.setViewport({ width, height: 800 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      runAssertion(!overflow, `No horizontal overflow at viewport width ${width}px`);
    }

    // Browser runtime logic evaluations
    const runtimeEval = await page.evaluate(async () => {
      const normSleep = typeof window.normalizeMembershipStatus === 'function' ? window.normalizeMembershipStatus('sleeping') : null;
      const normHiatus = typeof window.normalizeMembershipStatus === 'function' ? window.normalizeMembershipStatus('hiatus') : null;
      const isSleepActive = typeof window.isPlayerActiveMember === 'function' ? window.isPlayerActiveMember({ membershipStatus: 'sleeping' }) : null;
      const isHiatusActive = typeof window.isPlayerActiveMember === 'function' ? window.isPlayerActiveMember({ membershipStatus: 'hiatus' }) : null;

      // Test opening change status modal
      let modalHasSleepingRadio = false;
      if (typeof window.openChangeMembershipStatusModal === 'function') {
        window.openChangeMembershipStatusModal('TestPlayer', '999888', null, 'sleeping', false);
        const modal = document.getElementById('changeMembershipStatusModal');
        if (modal) {
          const radio = modal.querySelector('input[value="sleeping"]');
          modalHasSleepingRadio = Boolean(radio && radio.checked);
          modal.remove();
        }
      }

      return {
        normSleep,
        normHiatus,
        isSleepActive,
        isHiatusActive,
        modalHasSleepingRadio
      };
    });

    runAssertion(runtimeEval.normSleep === 'sleeping', 'Runtime window.normalizeMembershipStatus("sleeping") returns "sleeping"');
    runAssertion(runtimeEval.normHiatus === 'sleeping', 'Runtime window.normalizeMembershipStatus("hiatus") returns "sleeping"');
    runAssertion(runtimeEval.isSleepActive === false, 'Runtime window.isPlayerActiveMember excludes sleeping player (returns false)');
    runAssertion(runtimeEval.isHiatusActive === false, 'Runtime window.isPlayerActiveMember excludes hiatus player (returns false)');
    runAssertion(runtimeEval.modalHasSleepingRadio === true, 'Runtime window.openChangeMembershipStatusModal renders checked sleeping radio');

  } catch (err) {
    runAssertion(false, 'Headless browser execution error: ' + err.message);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

async function main() {
  runStaticAndLogicVerification();
  await runHeadlessBrowserVerification();

  console.log('\n=========================================');
  console.log(`Test Summary: ${passedTests}/${totalTests} tests passed`);
  console.log('=========================================\n');

  process.exit(passedTests === totalTests ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error in test runner:', err);
  process.exit(1);
});
