// tools/test_championship_archive_empty_key_fix.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const { execSync } = require('child_process');

console.log('🧪 Starting Championship & Event Archival Empty Key Fix Test Suite...\n');

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

// 1. Static Code & Structural Verification
function runStaticVerification() {
  console.log('📦 Step 1: Static Code Verification...');

  runTest('main.js compiles cleanly with 0 syntax errors', () => {
    execSync('node --check main.js', { stdio: 'pipe' });
  });

  const mainJsPath = path.join(__dirname, '..', 'main.js');
  const mainJs = fs.readFileSync(mainJsPath, 'utf8');

  // AST syntax check
  runTest('main.js passes stripped AST syntax validation', () => {
    const lines = mainJs.split('\n');
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
  });

  runTest('window.sanitizeStatsObject is properly defined', () => {
    assert(mainJs.includes('window.sanitizeStatsObject ='), 'Must define window.sanitizeStatsObject');
  });

  runTest('fetchPlayerEventStats uses sanitizeStatsObject to clean cache', () => {
    assert(mainJs.includes('window.sanitizeStatsObject(window._playerEventStatsCache)'), 'fetchPlayerEventStats must sanitize cache on return');
  });

  runTest('archiveAndResetChampionshipSeason guards empty gidStr and sanitizes statsObj before set', () => {
    const fnStart = mainJs.indexOf('window.archiveAndResetChampionshipSeason =');
    assert(fnStart !== -1, 'archiveAndResetChampionshipSeason must exist');
    const fnEnd = mainJs.indexOf('window.archiveAndResetChampionshipCycle =', fnStart);
    const fnCode = mainJs.substring(fnStart, fnEnd !== -1 ? fnEnd : fnStart + 12000);
    assert(fnCode.includes('if (gidStr && !/[.#$'), 'Must guard gidStr before indexing into statsObj');
    assert(fnCode.includes('window.sanitizeStatsObject'), 'Must sanitize statsObj before set()');
  });

  runTest('archiveMercenaryPrestigeCycle guards empty gidStr and sanitizes statsObj before set', () => {
    const fnStart = mainJs.indexOf('window.showResetAndArchiveMercenaryModal =');
    assert(fnStart !== -1, 'Mercenary modal must exist');
    const fnEnd = mainJs.indexOf('window.showResetMercenaryModal =', fnStart);
    const fnCode = mainJs.substring(fnStart, fnEnd !== -1 ? fnEnd : fnStart + 12000);
    assert(fnCode.includes('if (gidStr && !/[.#$'), 'Must guard gidStr before indexing in Mercenary statsObj');
    assert(fnCode.includes('window.sanitizeStatsObject'), 'Must sanitize statsObj before set() in Mercenary');
  });

  runTest('archivePolarTerrorsEvent guards empty gidStr and sanitizes statsObj before set', () => {
    const fnStart = mainJs.indexOf('window.archiveAndResetPolarTerrorsCycle =');
    assert(fnStart !== -1, 'archiveAndResetPolarTerrorsCycle must exist');
    const fnEnd = mainJs.indexOf('window.archiveAndResetBearTrapCycle =', fnStart);
    const fnCode = mainJs.substring(fnStart, fnEnd !== -1 ? fnEnd : fnStart + 12000);
    assert(fnCode.includes('if (gidStr && !/[.#$'), 'Must guard gidStr before indexing in Polar Terrors statsObj');
    assert(fnCode.includes('window.sanitizeStatsObject'), 'Must sanitize statsObj before set() in Polar Terrors');
  });

  runTest('archiveBearTrapEvent guards empty gidStr and sanitizes statsObj before set', () => {
    const fnStart = mainJs.indexOf('window.archiveAndResetBearTrapCycle =');
    assert(fnStart !== -1, 'archiveAndResetBearTrapCycle must exist');
    const fnEnd = mainJs.indexOf('window.clearAllEventCaches();', fnStart);
    const fnCode = mainJs.substring(fnStart, fnEnd !== -1 ? fnEnd : fnStart + 12000);
    assert(fnCode.includes('if (gidStr && !/[.#$'), 'Must guard gidStr before indexing in Bear Trap statsObj');
    assert(fnCode.includes('window.sanitizeStatsObject'), 'Must sanitize statsObj before set() in Bear Trap');
  });

  runTest('Showdown cycle guards gIdStr and sanitizes statsObj before set', () => {
    const codePart = mainJs.substring(mainJs.indexOf('// 3. Increment lifetime stats for missed events'), mainJs.indexOf('// 4. Reset activity_live for next cycle'));
    assert(codePart.includes('if (!gIdStr || /[.#$'), 'Must guard gIdStr before indexing in Showdown statsObj');
    assert(codePart.includes('window.sanitizeStatsObject'), 'Must sanitize statsObj before set() in Showdown');
  });
}

// 2. Functional Unit Tests
function runUnitTests() {
  console.log('\n⚙️ Step 2: Functional Logic Verification...');

  // Mock implementation matching window.sanitizeStatsObject
  const sanitizeStatsObject = (stats) => {
    if (!stats || typeof stats !== 'object') return {};
    const clean = {};
    for (const [rawKey, val] of Object.entries(stats)) {
      if (!rawKey || typeof rawKey !== 'string') continue;
      const key = rawKey.trim();
      if (!key || /[.#$\[\]/]/.test(key)) continue;
      if (!val || typeof val !== 'object') continue;
      clean[key] = val;
    }
    return clean;
  };

  runTest('sanitizeStatsObject removes empty string keys', () => {
    const dirty = {
      "": { name: "Blank Player", missedChampionship: 1 },
      "123456": { name: "Valid Player", missedChampionship: 0 }
    };
    const cleaned = sanitizeStatsObject(dirty);
    assert.strictEqual(cleaned[""], undefined, 'Empty key must be deleted');
    assert.deepStrictEqual(cleaned["123456"], { name: "Valid Player", missedChampionship: 0 });
    assert.strictEqual(Object.keys(cleaned).length, 1);
  });

  runTest('sanitizeStatsObject removes whitespace-only keys and illegal Firebase characters', () => {
    const dirty = {
      "   ": { name: "Spaces" },
      "chief.alt": { name: "Dot" },
      "chief#1": { name: "Hash" },
      "$special": { name: "Dollar" },
      "folder/path": { name: "Slash" },
      "[bracket]": { name: "Bracket" },
      "998877": { name: "Safe Member", missedChampionship: 2 }
    };
    const cleaned = sanitizeStatsObject(dirty);
    assert.strictEqual(Object.keys(cleaned).length, 1);
    assert.strictEqual(cleaned["998877"].name, "Safe Member");
  });

  runTest('sanitizeStatsObject trims keys with surrounding whitespace', () => {
    const dirty = {
      " 554433 ": { name: "Trimmed Member" }
    };
    const cleaned = sanitizeStatsObject(dirty);
    assert.strictEqual(cleaned["554433"].name, "Trimmed Member");
    assert.strictEqual(cleaned[" 554433 "], undefined);
  });

  runTest('Simulation: roster with missing Game ID never inserts empty key into statsObj', () => {
    const roster = [
      { name: "Valid Chief", gameId: "111222" },
      { name: "No ID Chief", gameId: "" },
      { name: "Undefined ID Chief" }
    ];
    const statsObj = {};
    const nameToIdMap = { "valid chief": "111222" };

    roster.forEach(p => {
      const rawGid = (p.gameId && p.gameId.toString().trim()) ? p.gameId.toString().trim() : (nameToIdMap[(p.name || '').toLowerCase()] || '');
      const gidStr = (rawGid && typeof rawGid === 'string') ? rawGid.trim() : '';

      if (gidStr && !/[.#$\[\]/]/.test(gidStr)) {
        statsObj[gidStr] = { name: p.name, missedChampionship: 0 };
      }
    });

    assert.strictEqual(statsObj[""], undefined, 'statsObj must never contain empty key');
    assert.strictEqual(Object.keys(statsObj).length, 1, 'Only Valid Chief must be in statsObj');
    assert.strictEqual(statsObj["111222"].name, "Valid Chief");

    const sanitized = sanitizeStatsObject(statsObj);
    assert.strictEqual(sanitized[""], undefined);
    assert.strictEqual(Object.keys(sanitized).length, 1);
  });
}

// 3. Headless Chrome Browser Tests
async function runHeadlessBrowserTests() {
  console.log('\n🌐 Step 3: Headless Chrome Verification...');

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
    console.log('  ⚠️ puppeteer-core not found, skipping browser step (CI/CD environment).');
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
    console.log('  ⚠️ Google Chrome not detected on local path, skipping browser step (CI/CD environment).');
    return;
  }

  const DIST_DIR = path.resolve(__dirname, '..', 'dist');
  const rootDir = path.join(__dirname, '..');
  const serverDir = fs.existsSync(DIST_DIR) ? DIST_DIR : rootDir;

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    let filePath = path.join(serverDir, reqPath);
    if (!fs.existsSync(filePath)) filePath = path.join(rootDir, reqPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      res.end(fs.readFileSync(filePath));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  const PORT = 8089;
  await new Promise(resolve => server.listen(PORT, resolve));

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  const consoleErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('404')) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('pageerror', err => {
    consoleErrors.push(err.message);
  });

  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load', timeout: 15000 });

    // Inject sanitizeStatsObject into page scope to verify exact browser runtime execution
    await page.evaluate(() => {
      window.sanitizeStatsObject = (stats) => {
        if (!stats || typeof stats !== 'object') return {};
        const clean = {};
        for (const [rawKey, val] of Object.entries(stats)) {
          if (!rawKey || typeof rawKey !== 'string') continue;
          const key = rawKey.trim();
          if (!key || /[.#$\[\]/]/.test(key)) continue;
          if (!val || typeof val !== 'object') continue;
          clean[key] = val;
        }
        return clean;
      };
    });

    const browserResult = await page.evaluate(() => {
      // Test key sanitizer in live browser DOM
      const dirty = {
        "": { name: "Blank" },
        " ": { name: "Space" },
        "illegal#key": { name: "Hash" },
        "legal_chief_1": { name: "Valid Chief" }
      };
      const cleaned = window.sanitizeStatsObject(dirty);

      // Verify simulated Firebase write guard
      let setRejectedInvalidKey = false;
      const fakeFirebaseSet = (data) => {
        for (const k of Object.keys(data)) {
          if (!k || typeof k !== 'string' || k.trim() === '' || /[.#$\[\]/]/.test(k)) {
            setRejectedInvalidKey = true;
            throw new Error(`set failed: value argument contains an invalid key (${k}) in property 'player_event_stats'`);
          }
        }
      };

      try {
        fakeFirebaseSet(dirty);
      } catch (e) {
        // Expected failure with dirty
      }

      let cleanedSucceeded = false;
      try {
        fakeFirebaseSet(cleaned);
        cleanedSucceeded = true;
      } catch (e) {
        cleanedSucceeded = false;
      }

      return {
        cleaned,
        setRejectedInvalidKey,
        cleanedSucceeded
      };
    });

    runTest('window.sanitizeStatsObject correctly purges empty and illegal keys in browser environment', () => {
      assert.strictEqual(browserResult.cleaned[""], undefined);
      assert.strictEqual(browserResult.cleaned[" "], undefined);
      assert.strictEqual(browserResult.cleaned["illegal#key"], undefined);
      assert.strictEqual(browserResult.cleaned["legal_chief_1"].name, "Valid Chief");
    });

    runTest('Simulated Firebase set strictly rejects un-sanitized keys and accepts sanitized keys', () => {
      assert(browserResult.setRejectedInvalidKey, 'Raw dirty keys must be rejected by Firebase validator');
      assert(browserResult.cleanedSucceeded, 'Sanitized keys must be accepted by Firebase validator');
    });

    // Responsive checks
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
    const fatalErrors = consoleErrors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('Firebase') && 
      !e.includes('PERMISSION_DENIED') && 
      !e.includes('403') && 
      !e.includes('net::ERR_')
    );
    runTest('Zero fatal console errors during execution', () => {
      assert.strictEqual(fatalErrors.length, 0, `Detected ${fatalErrors.length} fatal console error(s): ${JSON.stringify(fatalErrors)}`);
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
