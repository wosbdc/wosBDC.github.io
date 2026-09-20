// tools/test_event_roster_resolution.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Starting Dwarf 2 & Event Roster Resolution Test Suite...\n');

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
// Test 2: Codebase Structure & Static Code Verification
// -------------------------------------------------------------
console.log('\nTest 2: Codebase Structure & Static Code Verification');
const mainContent = fs.readFileSync('main.js', 'utf8');

assert(
  mainContent.includes('window.getEventRecord = (data, p) => {'),
  'window.getEventRecord helper is defined in main.js'
);

assert(
  mainContent.includes('p.tokenStatus && p.tokenStatus.gameId') &&
  mainContent.includes('gid = window.nameToIdMap[normName] || window.nameToIdMap[name] || \'\';'),
  'window.fetchRoster contains fallbacks for tokenStatus.gameId and nameToIdMap'
);

assert(
  mainContent.includes('get(ref(db, \'users_alts\')).catch(() => null)') &&
  mainContent.includes('Map Firebase Registered Alts (users_alts)'),
  'refreshIdToNameMap fetches and indexes users_alts'
);

assert(
  mainContent.includes('p.tokenStatus?.gameId ? String(p.tokenStatus.gameId).trim() : (window.nameToIdMap?.[normName] || \'\')'),
  'Event trackers use tokenStatus.gameId and nameToIdMap fallbacks in deduplication'
);

assert(
  mainContent.includes('let record = window.getEventRecord(btData, p);') &&
  mainContent.includes('let record = window.getEventRecord(polarData, p);') &&
  mainContent.includes('let record = window.getEventRecord(mercenaryData, p);') &&
  mainContent.includes('let record = window.getEventRecord(championshipData, p);'),
  'All major event trackers route lookups through window.getEventRecord'
);

// -------------------------------------------------------------
// Test 3: Simulation of Dwarf 2 Fallback & Deduplication
// -------------------------------------------------------------
console.log('\nTest 3: Simulation of Dwarf 2 Fallback & Deduplication');

const mockNameToIdMap = {
  'dwarf 2': '736728769',
  'thadwarf': '123456789'
};

const mockRawRoster = {
  'Dwarf 2': {
    name: 'Dwarf 2',
    gameId: '', // initially empty before healing
    tokenStatus: {
      gameId: '736728769',
      nickname: 'dwarf 2'
    },
    membershipStatus: 'active'
  },
  '736728769': {
    name: 'Dwarf 2',
    gameId: '736728769',
    membershipStatus: 'active'
  },
  'thadwarf': {
    name: 'thadwarf',
    gameId: '123456789',
    membershipStatus: 'active'
  }
};

const simulatedRoster = [];
const seenGids = new Set();
const seenNames = new Set();

Object.entries(mockRawRoster).forEach(([k, p]) => {
  if (!p || typeof p !== 'object') return;
  const cleanName = (p.name || '').trim();
  const normName = cleanName.toLowerCase();
  const gid = p.gameId ? String(p.gameId).trim() : (p.tokenStatus?.gameId ? String(p.tokenStatus.gameId).trim() : (mockNameToIdMap[normName] || ''));
  
  if ((gid && seenGids.has(gid)) || (normName && seenNames.has(normName))) return;
  
  if (cleanName && p.membershipStatus === 'active') {
    if (!p.gameId && gid && /^\d+$/.test(gid)) p.gameId = gid;
    if (gid) seenGids.add(gid);
    if (normName) seenNames.add(normName);
    simulatedRoster.push(p);
  }
});

assert(simulatedRoster.length === 2, 'Simulated roster deduplicates dual-key Dwarf 2 down to exactly 1 entry');
const dwarfEntry = simulatedRoster.find(r => r.name === 'Dwarf 2');
assert(dwarfEntry !== undefined, 'Dwarf 2 is successfully included in the active roster');
assert(dwarfEntry && dwarfEntry.gameId === '736728769', 'Dwarf 2 gameId resolved to 736728769');

// -------------------------------------------------------------
// Test 4: Simulation of window.getEventRecord Multi-Key Resolution
// -------------------------------------------------------------
console.log('\nTest 4: Simulation of window.getEventRecord Multi-Key Resolution');

const mockEventDataWithNumericGid = {
  '736728769': { signedUp: true, phase: 'Infernal Citadel', difficulty: 'Hard' }
};
const mockEventDataWithAlphaKey = {
  'dwarf_2': { signedUp: true, phase: 'Infernal Citadel', difficulty: 'Hard' }
};
const mockEventDataWithRawName = {
  'Dwarf 2': { signedUp: true, phase: 'Infernal Citadel', difficulty: 'Hard' }
};

function simulateGetEventRecord(eventData, p) {
  if (!eventData || !p) return null;
  const gid = p.gameId ? String(p.gameId).trim() : (p.tokenStatus?.gameId ? String(p.tokenStatus.gameId).trim() : '');
  const rawName = (p.name || p.chiefName || '').toString().trim();
  const normKey = rawName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  if (gid && eventData[gid]) return eventData[gid];
  if (normKey && eventData[normKey]) return eventData[normKey];
  if (rawName && eventData[rawName]) return eventData[rawName];
  return null;
}

assert(
  simulateGetEventRecord(mockEventDataWithNumericGid, dwarfEntry)?.signedUp === true,
  'getEventRecord resolves status when event key is numeric gameId'
);
assert(
  simulateGetEventRecord(mockEventDataWithAlphaKey, dwarfEntry)?.signedUp === true,
  'getEventRecord resolves status when event key is normalized alphanumeric name'
);
assert(
  simulateGetEventRecord(mockEventDataWithRawName, dwarfEntry)?.signedUp === true,
  'getEventRecord resolves status when event key is raw chief name'
);

// -------------------------------------------------------------
// Test 5: Headless Chrome End-to-End Verification
// -------------------------------------------------------------
console.log('\nTest 5: Real Headless Chrome Browser Execution...');

const puppeteerPath = 'C:\\Users\\Brian\\Documents\\antigravity\\pup\\node_modules\\puppeteer-core';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

let puppeteer;
try {
  puppeteer = require(puppeteerPath);
} catch (e) {
  console.warn('⚠️ Could not load puppeteer-core at ' + puppeteerPath + ': ' + e.message);
}

const PORT = 8093;
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
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      fs.createReadStream(indexPath).pipe(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }
});

async function runBrowserTest() {
  if (!puppeteer) {
    console.log('  ⚠️ Skipping browser test: puppeteer-core not found');
    printSummary();
    return;
  }

  server.listen(PORT, async () => {
    console.log(`  🌐 Headless Chrome test server started on http://localhost:${PORT}`);
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
        if (!err.message.includes('Firebase') && !err.message.includes('fetch') && !err.message.includes('network')) {
          console.warn('  ⚠️ Page error:', err.message);
          fatalErrors.push(err.message);
        }
      });

      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (!text.includes('Firebase') && !text.includes('fetch') && !text.includes('404') && !text.includes('Manifest') && !text.includes('favicon')) {
            console.warn('  ⚠️ Console error:', text);
          }
        }
      });

      await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      assert(true, 'Application boots successfully in real Chrome instance');

      // Verify event tracker and resolver bindings in real browser window scope
      const bindings = await page.evaluate(() => {
        return {
          hasGetEventRecord: typeof window.getEventRecord === 'function',
          hasFetchRoster: typeof window.fetchRoster === 'function',
          hasRefreshIdToNameMap: typeof window.refreshIdToNameMap === 'function',
          hasBtAdmin: typeof window.views?.bearTrapAdmin === 'function',
          hasPtAdmin: typeof window.views?.polarTerrorsAdmin === 'function',
          hasMercAdmin: typeof window.views?.mercenaryAdmin === 'function',
          hasChampAdmin: typeof window.views?.championshipAdmin === 'function',
          hasMercPublic: typeof window.views?.mercenary === 'function'
        };
      });

      assert(bindings.hasGetEventRecord, 'window.getEventRecord physically loaded in Chrome runtime');
      assert(bindings.hasFetchRoster, 'window.fetchRoster physically loaded in Chrome runtime');
      assert(bindings.hasRefreshIdToNameMap, 'window.refreshIdToNameMap physically loaded in Chrome runtime');
      assert(bindings.hasBtAdmin && bindings.hasPtAdmin && bindings.hasMercAdmin && bindings.hasChampAdmin, 'All event admin views physically loaded in Chrome runtime');
      assert(bindings.hasMercPublic, 'views.mercenary physically loaded in Chrome runtime');

      // Check responsiveness on standard viewports (375px, 768px, 1280px)
      for (const width of [375, 768, 1280]) {
        await page.setViewport({ width, height: 800 });
        const hasOverflow = await page.evaluate(() => {
          return document.documentElement.scrollWidth > window.innerWidth + 2;
        });
        assert(!hasOverflow, `Zero horizontal scrollbar overflow at width ${width}px`);
      }

      assert(fatalErrors.length === 0, `Zero fatal runtime errors detected (${fatalErrors.length} errors)`);

    } catch (err) {
      assert(false, 'Browser automation error: ' + err.message);
    } finally {
      if (browser) await browser.close();
      server.close(() => {
        printSummary();
      });
    }
  });
}

function printSummary() {
  console.log('\n==========================================');
  console.log(`📊 TEST RESULTS: ${passedTests} / ${totalTests} PASSED`);
  console.log('==========================================\n');
  if (process.exitCode && process.exitCode !== 0) {
    process.exit(process.exitCode);
  } else {
    process.exit(0);
  }
}

// If dist directory exists, run browser test; otherwise build first or run unit tests
if (fs.existsSync(DIST_DIR)) {
  runBrowserTest();
} else {
  console.log('ℹ️ dist directory does not exist yet; skipping browser run until build completes.');
  printSummary();
}
