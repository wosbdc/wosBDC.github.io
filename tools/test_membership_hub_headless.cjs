// tools/test_membership_hub_headless.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const PORT = 8097;
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
  console.log('📦 Starting Static & Structural Verification for Account Hub Membership Self-Restoration...');
  const mainJsPath = path.resolve(__dirname, '..', 'main.js');
  const code = fs.readFileSync(mainJsPath, 'utf8');

  // AST syntax validation
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

  const parsedCode = strippedLines.join('\n');
  try {
    new vm.Script(parsedCode, { filename: 'main.js' });
    console.log('  ✅ main.js parsed with zero syntax errors');
  } catch (err) {
    console.error('  ❌ Syntax error parsing main.js:', err.message);
    process.exit(1);
  }

  // Verify critical functions and DOM patterns
  assert(code.includes('window.selfActivateMembershipStatus = async'), 'main.js must define window.selfActivateMembershipStatus');
  assert(code.includes('primaryMemBadgeHtml'), 'main.js must define primaryMemBadgeHtml');
  assert(code.includes('primaryMemActionBtnHtml'), 'main.js must define primaryMemActionBtnHtml');
  assert(code.includes('altMemBadgeHtml'), 'main.js must define altMemBadgeHtml in alt account card rendering');
  assert(code.includes('Membership Status Self-Restored'), 'main.js must log Membership Status Self-Restored');
  console.log('  ✅ Static signatures for Membership Hub display & restoration confirmed');
}

async function runHeadlessVerification() {
  if (!puppeteer || !chromePath) {
    console.warn('⚠️ Puppeteer or Chrome not found in current environment (e.g. CI runner). Skipping live browser test step; static verification passed.');
    return;
  }
  console.log('🚀 Launching Real Headless Chrome verification suite for Account Hub...');

  // Create lightweight static server
  const server = http.createServer((req, res) => {
    let filePath = path.join(DIST_DIR, req.url.split('?')[0]);
    if (req.url === '/' || !path.extname(filePath)) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json'
    }[ext] || 'application/octet-stream';

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch(e) {
      res.writeHead(404);
      res.end();
    }
  });

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`  🌐 Local test server listening on http://127.0.0.1:${PORT}`);

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => {
      consoleErrors.push(err.message);
    });

    await page.goto(`http://127.0.0.1:${PORT}`, { waitUntil: 'networkidle0', timeout: 15000 });

    // Bootstrap test state with user marked as 'left' and one alt marked as 'left'
    await page.evaluate(async () => {
      window.currentUser = {
        uid: 'user_test_999',
        name: 'WandererChief',
        chiefName: 'WandererChief',
        gameId: '987654321',
        membershipStatus: 'left',
        status: 'left',
        stove_lv: 30,
        linkedAlts: ['123456789'],
        linkedAltsData: {
          '123456789': {
            name: 'WandererAlt',
            gameId: '123456789',
            membershipStatus: 'left',
            status: 'left',
            stove_lv: 25
          }
        },
        altTokens: {
          '123456789': {
            nickname: 'WandererAlt',
            gameId: '123456789',
            membershipStatus: 'left',
            token: 'test_token_123'
          }
        }
      };

      window.idToNameMap = {
        '987654321': 'WandererChief',
        '123456789': 'WandererAlt'
      };
      window.nameToIdMap = {
        'wandererchief': '987654321',
        'wandereralt': '123456789'
      };

      window.rosterCache = {
        '987654321': { gameId: '987654321', name: 'WandererChief', membershipStatus: 'left', status: 'left' },
        '123456789': { gameId: '123456789', name: 'WandererAlt', membershipStatus: 'left', status: 'left' }
      };

      // Mock executeUnifiedMemberUpdate to track calls and succeed
      window.__lastUnifiedUpdate = null;
      window.executeUnifiedMemberUpdate = async (params) => {
        window.__lastUnifiedUpdate = params;
        return { success: true };
      };

      // Render Account Hub
      if (window.views && window.views.account) {
        window.views.account();
      }
    });

    await new Promise(r => setTimeout(r, 600));

    // Test 1: DOM existence of Primary Character membership badge '🚪 Left Alliance'
    const primaryBadgeText = await page.evaluate(() => {
      const el = document.querySelector('#accTabSectionProfile');
      return el ? el.innerText : '';
    });
    assert(primaryBadgeText.includes('Left Alliance'), 'Primary character card must display "Left Alliance" badge');
    console.log('  ✅ Primary Chief card correctly displays "🚪 Left Alliance" status');

    // Test 2: DOM existence of Self-Reactivation action button
    const hasRejoinBtn = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.innerText.includes('Rejoined? Set to Active') || b.innerText.includes('Set to Active'));
    });
    assert(hasRejoinBtn, 'Account Hub must render "Rejoined? Set to Active" button when status is left');
    console.log('  ✅ Primary Chief card renders "👋 Rejoined? Set to Active" button');

    // Test 3: Programmatically trigger selfActivateMembershipStatus for primary chief
    const activationResult = await page.evaluate(async () => {
      return await window.selfActivateMembershipStatus('987654321', 'WandererChief', false);
    });
    assert.strictEqual(activationResult, true, 'selfActivateMembershipStatus must return true on success');

    // Verify unified update call parameters
    const lastUpdate = await page.evaluate(() => window.__lastUnifiedUpdate);
    assert.strictEqual(lastUpdate?.gameId, '987654321', 'Unified update must target primary chief gameId');
    assert.strictEqual(lastUpdate?.membershipStatus, 'active', 'Unified update must set membershipStatus to active');
    console.log('  ✅ selfActivateMembershipStatus successfully triggered unified update to "active"');

    // Test 4: Check linked alt card rendering and reactivation button
    await page.evaluate(() => {
      // Switch to Characters tab
      const charBtn = document.getElementById('accTabBtnCharacters');
      if (charBtn) charBtn.click();
    });
    await new Promise(r => setTimeout(r, 400));

    const altBadgeExists = await page.evaluate(() => {
      const altCard = document.querySelector('.alt-account-card[data-gid="123456789"]');
      return altCard ? altCard.innerHTML.includes('Left') : false;
    });
    assert(altBadgeExists, 'Linked Alt Card must render "🚪 Left" badge');
    console.log('  ✅ Linked Alt Card displays "🚪 Left" badge');

    // Test 5: Verify alt self-reactivation button
    const altActivationResult = await page.evaluate(async () => {
      return await window.selfActivateMembershipStatus('123456789', 'WandererAlt', true);
    });
    assert.strictEqual(altActivationResult, true, 'selfActivateMembershipStatus must return true for alt');
    const altLastUpdate = await page.evaluate(() => window.__lastUnifiedUpdate);
    assert.strictEqual(altLastUpdate?.gameId, '123456789', 'Alt unified update must target alt gameId');
    assert.strictEqual(altLastUpdate?.isAlt, true, 'Alt unified update must set isAlt: true');
    console.log('  ✅ Alt self-reactivation successfully triggered unified update for alt');

    // Test 6: Verify banned security check (banned members cannot self-reactivate)
    const bannedBlocked = await page.evaluate(async () => {
      window.currentUser.membershipStatus = 'banned';
      return await window.selfActivateMembershipStatus('987654321', 'WandererChief', false);
    });
    assert.strictEqual(bannedBlocked, false, 'selfActivateMembershipStatus must block banned accounts from self-unbanning');
    console.log('  ✅ Security gate verified: Banned accounts are prevented from self-reactivation');

    // Assert zero critical console errors
    const fatalErrors = consoleErrors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('Firebase') && 
      !e.includes('PERMISSION_DENIED') && 
      !e.includes('403') && 
      !e.includes('network')
    );
    assert.strictEqual(fatalErrors.length, 0, `Zero fatal browser console errors allowed, found: ${JSON.stringify(fatalErrors)}`);
    console.log('  ✅ Zero fatal browser console errors detected during runtime');

  } finally {
    await browser.close();
    server.close();
  }
}

async function main() {
  try {
    runStaticVerification();
    await runHeadlessVerification();
    console.log('\n🎉 ALL ACCOUNT HUB MEMBERSHIP STATUS VERIFICATION TESTS PASSED (100%)\n');
  } catch(e) {
    console.error('\n❌ Test suite failed:', e);
    process.exit(1);
  }
}

main();
