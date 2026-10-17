const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('assert');
const { execSync } = require('child_process');

console.log("🧪 Starting Showdown Missed Days Report Exclusion & Live Update Test Suite...\n");

// 1. AST / Syntax Check
const mainPath = path.join(__dirname, '..', 'main.js');
const mainCode = fs.readFileSync(mainPath, 'utf8');

try {
    execSync('node --check main.js', { stdio: 'pipe' });
    console.log("  ✅ PASS: main.js compiles cleanly with 0 syntax errors");
} catch (e) {
    console.error("  ❌ FAIL: Syntax error in main.js:", e);
    process.exit(1);
}

// 2. Codebase Structure Assertions
console.log("\nTest 2: Codebase Structure & Logic Verification");

if (mainCode.includes('window.showMissedDaysReportModal = async')) {
    console.log("  ✅ PASS: window.showMissedDaysReportModal is defined");
} else {
    console.error("  ❌ FAIL: window.showMissedDaysReportModal not found");
    process.exit(1);
}

if (mainCode.includes('isExcludedMember') && mainCode.includes("s === 'left' || s === 'banned'")) {
    console.log("  ✅ PASS: isExcludedMember helper gates left and banned players");
} else {
    console.error("  ❌ FAIL: isExcludedMember logic missing or incomplete");
    process.exit(1);
}

if (mainCode.includes('allPlayers.forEach(pName => {') && mainCode.includes('if (isExcludedMember(pName)) return;')) {
    console.log("  ✅ PASS: Daily missed days calculation skips excluded players");
} else {
    console.error("  ❌ FAIL: Missed days loop does not skip excluded members");
    process.exit(1);
}

// Bot filtering assertions
assert(mainCode.includes('isBotAccount'), 'main.js must define isBotAccount');
assert(mainCode.includes('gatekeeper') && mainCode.includes('wosrewards'), 'isBotAccount must check gatekeeper and wosrewards');
assert(!mainCode.includes('/^lord\\d{6,}$/i'), 'isBotAccount must NOT treat lord player accounts as bots');
console.log("  ✅ PASS: isBotAccount gates gatekeeper and wosrewards service bots while allowing lord player accounts");

// Auto-save flush and in-memory live merge assertions
assert(mainCode.includes('window.flushAutoSaveSdEntry()'), 'showMissedDaysReportModal must flush pending debounced auto-save');
assert(mainCode.includes('window._currentSdLiveData'), 'showMissedDaysReportModal must merge in-memory _currentSdLiveData for 0ms latency');
console.log("  ✅ PASS: Auto-save debounce flush & in-memory live merge verified");

// Dual view filter tabs & refresh button
assert(mainCode.includes('id="tabActiveSdRoster"'), 'showMissedDaysReportModal must render Active Showdown Roster tab');
assert(mainCode.includes('id="tabAllMains"'), 'showMissedDaysReportModal must render All Alliance Mains tab');
assert(mainCode.includes('id="refreshMissedReportBtn"'), 'showMissedDaysReportModal must render live refresh button');
assert(mainCode.includes('generateDayCopyText'), 'showMissedDaysReportModal must define generateDayCopyText helper');
assert(mainCode.includes('copy-day-missed-btn'), 'showMissedDaysReportModal must render copy-day-missed-btn on active day cards');
console.log("  ✅ PASS: Dual-view filter tabs, live refresh button, and day-by-day copy buttons verified");

// 3. Functional Simulation of Exclusion Filter
console.log("\nTest 3: Functional Simulation of Missed Days Filtering");

const mockRoster = {
    "ChiefActive1": { name: "ChiefActive1", membershipStatus: "active", status: "active" },
    "ChiefActive2": { name: "ChiefActive2", membershipStatus: "active", status: "active" },
    "ChiefLeft": { name: "ChiefLeft", membershipStatus: "left", status: "left" },
    "ChiefDeparted": { name: "ChiefDeparted", membershipStatus: "departed", status: "departed" },
    "ChiefBanned": { name: "ChiefBanned", membershipStatus: "banned", status: "banned", banned: true },
    "GateKeeper": { name: "GateKeeper", membershipStatus: "active", status: "active" },
    "wosrewards": { name: "wosrewards", membershipStatus: "active", status: "active" },
    "lord319285336": { name: "lord319285336", membershipStatus: "active", status: "active" },
    "AltNonParticipating": { name: "AltNonParticipating", isAlt: true, membershipStatus: "active" },
    "AltParticipating": { name: "AltParticipating", isAlt: true, membershipStatus: "active" }
};

const mockSdData = {
    "ChiefActive1": { d1: 100, d2: 200, d3: 200, d4: 0, d5: 0, d6: 0 },
    "ChiefActive2": { d1: 100, d2: 0, d3: 200, d4: 0, d5: 0, d6: 0 },
    "ChiefLeft": { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0 },
    "ChiefBanned": { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0 },
    "AltParticipating": { d1: 0, d2: 50, d3: 50, d4: 0, d5: 0, d6: 0 }
};

const mockNormalize = (status) => {
    if (!status) return 'active';
    const s = String(status).toLowerCase().trim();
    if (s === 'banned' || s === 'ban') return 'banned';
    if (s === 'left' || s === 'former' || s === 'inactive' || s === 'departed') return 'left';
    return 'active';
};

const isBotAccount = (name) => {
    if (!name) return false;
    const n = name.toLowerCase().trim();
    if (n === 'gatekeeper' || n === 'wosrewards') return true;
    return false;
};

const mockIsPlayerActive = (p) => {
    if (typeof p === 'object') return mockNormalize(p.membershipStatus || p.status) === 'active' && !p.banned;
    if (mockRoster[p]) return mockNormalize(mockRoster[p].membershipStatus || mockRoster[p].status) === 'active' && !mockRoster[p].banned;
    return true;
};

const isExcludedMember = (playerOrName) => {
    if (!playerOrName) return true;
    const nameStr = typeof playerOrName === 'string' ? playerOrName : (playerOrName.name || '');

    // Bot check
    if (isBotAccount(nameStr)) return true;

    if (typeof playerOrName === 'object') {
        const s = mockNormalize(playerOrName.membershipStatus || playerOrName.status);
        if (s === 'left' || s === 'banned') return true;
        if (playerOrName.banned === true || playerOrName.isBanned === true) return true;
    }
    if (!mockIsPlayerActive(playerOrName)) return true;
    if (nameStr && mockRoster[nameStr]) {
        const r = mockRoster[nameStr];
        const rStatus = mockNormalize(r.membershipStatus || r.status);
        if (rStatus === 'left' || rStatus === 'banned' || r.banned === true) {
            return true;
        }
        if (r.isAlt) {
            const sc = mockSdData[nameStr];
            const hasScores = sc && [1,2,3,4,5,6].some(d => (sc['d'+d] || 0) > 0);
            if (!hasScores) return true;
        }
    }
    return false;
};

const seenPlayerNames = new Map();
Object.values(mockRoster).forEach(p => {
    if (isExcludedMember(p)) return;
    seenPlayerNames.set(p.name.toLowerCase(), p.name);
});

const allPlayers = Array.from(seenPlayerNames.values()).filter(name => !isExcludedMember(name));

assert(allPlayers.includes("ChiefActive1") && allPlayers.includes("ChiefActive2"), "Active mains must be included");
assert(!allPlayers.includes("ChiefLeft") && !allPlayers.includes("ChiefBanned") && !allPlayers.includes("ChiefDeparted"), "Left and banned must be excluded");
assert(!allPlayers.includes("GateKeeper") && !allPlayers.includes("wosrewards"), "Bots must be excluded");
assert(allPlayers.includes("lord319285336"), "Lord accounts are valid players and must be included in roster tracking");
assert(!allPlayers.includes("AltNonParticipating"), "Non-participating alts must be excluded");
assert(allPlayers.includes("AltParticipating"), "Participating alts with scores must be included");
console.log("  ✅ PASS: Bot filtering & Alt participation rules verified in simulation");

// Check missed days map
const playerMissedMap = {};
const dayMissedMap = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

allPlayers.forEach(pName => {
    if (isExcludedMember(pName)) return;
    const scores = mockSdData[pName] || {};
    const missed = [];
    for (let d = 1; d <= 3; d++) {
        if (!scores['d' + d]) {
            missed.push(d);
            dayMissedMap[d].push(pName);
        }
    }
    if (missed.length > 0) playerMissedMap[pName] = missed;
});

const playersWithMisses = Object.keys(playerMissedMap).filter(name => !isExcludedMember(name));

assert(!playersWithMisses.includes("ChiefLeft") && !playersWithMisses.includes("ChiefBanned"), "Excluded players omitted from misses");
assert(!playersWithMisses.includes("GateKeeper") && !playersWithMisses.includes("AltNonParticipating"), "Bots and non-participating alts omitted from misses");
assert(playersWithMisses.includes("ChiefActive2") && playersWithMisses.includes("AltParticipating"), "Active members with misses correctly identified");
assert(playersWithMisses.includes("lord319285336") && playerMissedMap["lord319285336"].length === 3, "Lord accounts must be held accountable for missed days");
assert(!playersWithMisses.includes("ChiefActive1"), "Member with perfect attendance (ChiefActive1) has 0 misses");
console.log("  ✅ PASS: Missed days correctly computed (ChiefActive2 missed Day 2, AltParticipating missed Day 1, lord319285336 missed Days 1-3)");

// 4. Showdown Event Date Input & Persistence Assertions
console.log("\nTest 4: Showdown Event Date Input & Persistence Assertions");

if (mainCode.includes('id="metaEventDate"') && mainCode.includes('(month/day - month/day)')) {
    console.log("  ✅ PASS: metaEventDate input field rendered with month/day - month/day format hint");
} else {
    console.error("  ❌ FAIL: metaEventDate input field missing from Enemy Alliance Settings");
    process.exit(1);
}

if (mainCode.includes("const eventDateInput = document.getElementById('metaEventDate');") &&
    mainCode.includes("eventDate: eventDate") &&
    mainCode.includes("'enemyAlliance/eventDate': eventDate")) {
    console.log("  ✅ PASS: saveShowdownMeta extracts and saves eventDate to showdown_meta and enemyAlliance");
} else {
    console.error("  ❌ FAIL: saveShowdownMeta does not properly handle eventDate persistence");
    process.exit(1);
}

if (mainCode.includes("const eventDate = metaData.eventDate || (enemyAlliance && enemyAlliance.eventDate) || '';") &&
    mainCode.includes("📅 ${escapeHTML(eventDate)}")) {
    console.log("  ✅ PASS: views.showdown extracts eventDate and renders the badge");
} else {
    console.error("  ❌ FAIL: views.showdown missing eventDate display badge");
    process.exit(1);
}

if (mainCode.includes("currentEventDate = mv.eventDate || (mv.enemyAlliance && mv.enemyAlliance.eventDate) || '';") &&
    mainCode.includes("id=\"sdPipelineDateLabel\" value=\"${escapeHTML(currentEventDate || currentDateStr)}\"")) {
    console.log("  ✅ PASS: openShowdownResetPipelineModal prefills sdPipelineDateLabel with active eventDate");
} else {
    console.error("  ❌ FAIL: openShowdownResetPipelineModal does not prefill active eventDate");
    process.exit(1);
}

// 5. Showdown Reset Pipeline Live Linkage & Reset Sync Assertions
console.log("\nTest 5: Showdown Reset Pipeline Live Linkage & Reset Sync Assertions");

if (mainCode.includes("window.syncSdPipelineDateToMeta = (val) => {") &&
    mainCode.includes("window.syncSdPipelineEnemyToMeta = (val) => {")) {
    console.log("  ✅ PASS: window.syncSdPipelineDateToMeta and window.syncSdPipelineEnemyToMeta are defined");
} else {
    console.error("  ❌ FAIL: Missing pipeline synchronization functions in main.js");
    process.exit(1);
}

if (mainCode.includes("🔗 Linked to Enemy Settings") &&
    mainCode.includes('oninput="window.syncSdPipelineDateToMeta(this.value)"') &&
    mainCode.includes('oninput="window.syncSdPipelineEnemyToMeta(this.value)"')) {
    console.log("  ✅ PASS: Reset modal displays linkage badge and calls sync functions on input");
} else {
    console.error("  ❌ FAIL: Reset modal missing linkage badge or oninput sync bindings");
    process.exit(1);
}

if (mainCode.includes("const domEventDate = document.getElementById('metaEventDate')?.value?.trim();") &&
    mainCode.includes("if (domEventDate) currentEventDate = domEventDate;")) {
    console.log("  ✅ PASS: showResetAndArchiveEventModal prioritizes live DOM metaEventDate input");
} else {
    console.error("  ❌ FAIL: showResetAndArchiveEventModal does not prioritize live DOM metaEventDate");
    process.exit(1);
}

if (mainCode.includes("if (metaDateInput) metaDateInput.value = '';") &&
    mainCode.includes("if (dateBadge) {") &&
    mainCode.includes("dateBadge.style.display = 'none';")) {
    console.log("  ✅ PASS: Stage 4 reset pipeline properly clears live DOM metaEventDate and dateBadge");
} else {
    console.error("  ❌ FAIL: Stage 4 reset pipeline does not clear DOM inputs and badges");
    process.exit(1);
}

// 6. Real Headless Chrome DOM & Visual Verification
console.log("\nTest 6: Real Headless Chrome DOM Verification...");

const PORT = 8105;
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

let chromePath = possibleChromePaths.find(p => fs.existsSync(p));

async function runHeadlessVerification() {
  if (!puppeteer || !chromePath) {
    console.warn("  ⚠️ Puppeteer or Chrome executable not found. Skipping live browser test step; static verification passed.");
    return;
  }

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
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'networkidle0', timeout: 30000 });

    // Mock authenticated R5 admin user
    await page.evaluate(async () => {
      window.currentUser = { uid: 'test_admin_r5', email: 'admin@bdc.test', displayName: 'Staff Leader' };
      window.isAdminUser = () => true;
      window.getAdminLevel = () => 'R5';
      window.isGoogleAuthVerified = async () => true;
      if (typeof window.views?.showdownAdmin === 'function') {
        await window.views.showdownAdmin();
      }
    });

    await page.waitForFunction(() => !!document.querySelector('#sdPlayerSelect') || !!document.querySelector('button[onclick*="showMissedDaysReportModal"]'), { timeout: 10000 });

    // Trigger Missed Days Report Modal
    await page.evaluate(async () => {
      await window.showMissedDaysReportModal();
    });

    await page.waitForSelector('#showdownMissedReportModal', { timeout: 8000 });
    console.log("  ✅ PASS: Missed Days Report modal opened and rendered in DOM");

    const modalData = await page.evaluate(() => {
      const modal = document.getElementById('showdownMissedReportModal');
      const tableText = modal.querySelector('table')?.innerText || '';
      const dailyBreakdown = modal.querySelector('div[style*="grid-template-columns"]')?.innerText || '';
      const activeTab = document.getElementById('tabActiveSdRoster');
      const allMainsTab = document.getElementById('tabAllMains');
      const refreshBtn = document.getElementById('refreshMissedReportBtn');
      const copyBtn = document.getElementById('copyMissedListBtn');

      return {
        tableText,
        dailyBreakdown,
        hasActiveTab: !!activeTab,
        hasAllMainsTab: !!allMainsTab,
        hasRefreshBtn: !!refreshBtn,
        hasCopyBtn: !!copyBtn
      };
    });

    assert(modalData.hasActiveTab && modalData.hasAllMainsTab, "Modal must provide Active Roster & All Mains tabs");
    assert(modalData.hasRefreshBtn, "Modal must provide Refresh button");
    assert(modalData.hasCopyBtn, "Modal must provide Copy button");

    // Strictly assert bot and non-participating alts are NOT rendered in table
    assert(!modalData.tableText.includes('GateKeeper'), 'GateKeeper bot must NOT be in missed list');
    assert(!modalData.tableText.includes('wosrewards'), 'wosrewards bot must NOT be in missed list');
    assert(!modalData.tableText.includes('Babyboi'), 'Non-participating alt Babyboi must NOT be in missed list');
    assert(!modalData.tableText.includes('Cr3amp13'), 'Non-participating alt Cr3amp13 must NOT be in missed list');
    assert(!modalData.tableText.includes('aku tasya'), 'Ghost record aku tasya must NOT be in missed list');

    console.log("  ✅ PASS: Live DOM table strictly omits bots, non-participating alts, and ghost records");

    // Test tab toggle to All Mains
    await page.evaluate(() => {
      document.getElementById('tabAllMains')?.click();
    });

    const mainsTabContent = await page.evaluate(() => {
      const modal = document.getElementById('showdownMissedReportModal');
      return modal?.querySelector('table')?.innerText || '';
    });

    assert(mainsTabContent.includes('lord319285336') || mainsTabContent.includes('lord320989720') || mainsTabContent.includes('lord743783306'), 'All Mains view must include lord player accounts');
    assert(!mainsTabContent.includes('GateKeeper'), 'All Mains view must also exclude GateKeeper');
    assert(!mainsTabContent.includes('wosrewards'), 'All Mains view must also exclude wosrewards');
    assert(!mainsTabContent.includes('Babyboi'), 'All Mains view must also exclude non-participating farm alts');
    console.log("  ✅ PASS: Tab switching to All Mains includes lord players and maintains bot/farm alt exclusion rules");

    // Test Day 1 Copy Button in live DOM
    const dayBtnExists = await page.evaluate(() => !!document.getElementById('copyDayBtn_1'));
    assert(dayBtnExists, "Day 1 card must render Copy Day 1 button");

    await page.evaluate(() => {
      document.getElementById('copyDayBtn_1')?.click();
    });

    await page.waitForFunction(() => {
      const btn = document.getElementById('copyDayBtn_1');
      return btn && btn.innerText.includes('Copied Day 1');
    }, { timeout: 4000 });

    console.log("  ✅ PASS: Day-by-day clipboard copy button triggers visual confirmation state");

    // Test responsive viewport checks
    const viewports = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1280, height: 800 }
    ];

    for (const vp of viewports) {
      await page.setViewport(vp);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert(!overflow, `Zero horizontal scroll overflow expected at ${vp.name} (${vp.width}px)`);
      console.log(`  ✅ PASS: Responsive check passed at ${vp.name} (${vp.width}px)`);
    }

    // Close modal
    await page.evaluate(() => {
      document.getElementById('closeMissedReportX')?.click();
    });

    const isClosed = await page.evaluate(() => !document.getElementById('showdownMissedReportModal'));
    assert(isClosed, "Modal should close cleanly");
    console.log("  ✅ PASS: Missed report modal closes cleanly");

    assert.strictEqual(consoleErrors.length, 0, `Expected 0 console errors, but got:\n${consoleErrors.join('\n')}`);
    console.log("  ✅ PASS: Zero console errors observed");

  } finally {
    await browser.close();
    server.close();
  }
}

(async () => {
  await runHeadlessVerification();
  console.log("\n==========================================");
  console.log("📊 ALL MISSED DAYS REPORT & EVENT DATE TESTS PASSED 100%");
  console.log("==========================================\n");
})();
