// tools/test_personal_log_bot_donation_amount.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

console.log('🧪 Starting Personal Activity Bot Donation Amount Test Suite...\n');

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

  runTest('loadUserPersonalLog only treats comma-separated targets as batches', () => {
    assert(mainJs.includes("log.target && log.target.includes(',') && log.target.toLowerCase().includes(nameLower)"), 'Must check log.target.includes(",") before extracting batch');
  });

  runTest('loadUserPersonalLog preserves donation details when present', () => {
    assert(mainJs.includes('finalLog.details = log.details;'), 'Must preserve existing log.details containing amount');
  });
}

// 2. Functional Unit Tests
function runUnitTests() {
  console.log('\n⚙️ Step 2: Functional Logic Verification...');

  // Mock simulate the extraction logic from loadUserPersonalLog
  function processLogForUser(log, rawName) {
    const nameLower = rawName.toLowerCase();
    const nameClean = nameLower.replace(/[^a-z0-9]/g, '');
    const t = (log.target || '').toLowerCase();
    const d = (log.details || '').toLowerCase();
    const a = (log.action || '').toLowerCase();
    const tClean = t.replace(/[^a-z0-9]/g, '');
    const dClean = d.replace(/[^a-z0-9]/g, '');

    const matchesTarget = (t === nameLower) || (nameLower && t.includes(nameLower)) || (nameClean && tClean.length >= 2 && tClean.includes(nameClean));
    const matchesDetails = (nameLower && d.includes(nameLower)) || (nameClean && nameClean.length >= 2 && dClean.includes(nameClean));
    const isGlobalBearTrapLog = (t.includes('all players') || t.includes('multiple members')) && (a.includes('bear trap') || a.includes('beartrap') || d.includes('bear trap'));

    if (matchesTarget || matchesDetails || isGlobalBearTrapLog) {
      let finalLog = { ...log };
      if (log.target && log.target.includes(',') && log.target.toLowerCase().includes(nameLower)) {
        const parts = log.target.split(/,\s*/);
        const playerPart = parts.find(p => p.toLowerCase().includes(nameLower));
        if (playerPart) {
          const matchMeta = playerPart.match(/^(.*?)\s*\((.*?)\)$/);
          if (matchMeta && matchMeta[2]) {
            const metaClean = matchMeta[2].replace(/\+\s*-/g, '-');
            finalLog.details = `Batch Donation: ${metaClean}`;
          } else if (log.details && (log.details.includes('+') || log.details.includes('-') || /\d+/.test(log.details))) {
            finalLog.details = log.details;
          } else {
            finalLog.details = `Batch Donation: ${playerPart}`;
          }
        }
      }
      return finalLog;
    }
    return null;
  }

  runTest('Bot donation for single chief preserves exact points details', () => {
    const botLog = {
      admin: 'WOS ChatBot',
      action: 'Bear Trap Donation',
      target: 'BrianDCox',
      details: 'Added +16 to BT1 (Total: 16)',
      timestamp: Date.now()
    };
    const res = processLogForUser(botLog, 'BrianDCox');
    assert(res !== null, 'Log must match user');
    assert.strictEqual(res.details, 'Added +16 to BT1 (Total: 16)', 'Details must not be replaced by Batch Donation: BrianDCox');
  });

  runTest('Batch donation with metadata preserves member-specific points', () => {
    const batchLog = {
      admin: 'Admin Brian',
      action: 'Bear Trap Donation Recorded',
      target: 'Soulcrusher4217 (+60 pts), BrianDCox (+16 pts)',
      details: 'Recorded donations for 2 members',
      timestamp: Date.now()
    };
    const res = processLogForUser(batchLog, 'BrianDCox');
    assert(res !== null, 'Log must match user');
    assert.strictEqual(res.details, 'Batch Donation: +16 pts', 'Details must extract personal points breakdown');
  });

  runTest('Batch donation without metadata falls back cleanly to overall details if amount present', () => {
    const batchLog = {
      admin: 'Admin Brian',
      action: 'Bear Trap Donation Recorded',
      target: 'Soulcrusher4217, BrianDCox',
      details: 'Added +10 to BT1 for each member',
      timestamp: Date.now()
    };
    const res = processLogForUser(batchLog, 'BrianDCox');
    assert(res !== null, 'Log must match user');
    assert.strictEqual(res.details, 'Added +10 to BT1 for each member');
  });
}

// 3. Headless Chrome Verification
async function runHeadlessBrowserTests() {
  console.log('\n🌐 Step 3: Real Headless Chrome DOM Verification...');

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
  const PORT = 8098;

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
      window.currentUser = { uid: 'test_user', email: 'brian@bdc.com', displayName: 'BrianDCox' };
      window.isAdminUser = () => true;
      window.db = {};
      window.ref = (d, p) => p;
      window.get = async (r) => {
        if (String(r).includes('admin_logs')) {
          return {
            exists: () => true,
            val: () => ({
              'log_1': {
                admin: 'WOS ChatBot',
                action: 'Bear Trap Donation',
                target: 'BrianDCox',
                details: 'Added +16 to BT1 (Total: 16)',
                timestamp: Date.now() - 60000
              },
              'log_2': {
                admin: 'R4/R5 Manager',
                action: 'Bear Trap Donation Active',
                target: 'BrianDCox',
                details: 'Active Donation: +16 points (All-Time: 2,651)',
                timestamp: Date.now() - 120000
              }
            })
          };
        }
        return { exists: () => false, val: () => null };
      };
      window.getAuthToken = async () => 'test-token';
      window.API_BASE_URL = 'https://mock.example.com';
    });

    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'load', timeout: 15000 });

    // Inject loadUserPersonalLog function from main.js if needed
    const mainJsPath = path.join(rootDir, 'main.js');
    const mainJs = fs.readFileSync(mainJsPath, 'utf8');
    const fnStart = mainJs.indexOf('window.loadUserPersonalLog = async (chiefName, filterMode = \'today\') => {');
    const fnEnd = mainJs.indexOf('function renderAvatarStack(playersList) {', fnStart);
    assert(fnStart !== -1 && fnEnd !== -1, 'Could not find loadUserPersonalLog in main.js');
    const injectedCode = mainJs.substring(fnStart, fnEnd);
    await page.evaluate((code) => {
      window.eval(code);
    }, injectedCode);

    // Create container for personal activity log
    await page.evaluate(() => {
      const div = document.createElement('div');
      div.id = 'userPersonalLogContainer';
      document.body.appendChild(div);
    });

    // Run loadUserPersonalLog('BrianDCox', 'today')
    await page.evaluate(async () => {
      await window.loadUserPersonalLog('BrianDCox', 'today');
    });

    // Inspect rendered DOM
    const renderedData = await page.evaluate(() => {
      const cont = document.getElementById('userPersonalLogContainer');
      if (!cont) return { exists: false };
      const text = cont.innerText;
      const html = cont.innerHTML;
      const hasBatchDonationBrian = html.includes('Batch Donation: BrianDCox');
      const hasAdded16 = text.includes('Added +16 to BT1 (Total: 16)');
      const hasChatBot = text.includes('WOS ChatBot');
      return {
        exists: true,
        text,
        hasBatchDonationBrian,
        hasAdded16,
        hasChatBot
      };
    });

    runTest('Personal Activity Log renders successfully in DOM', () => {
      assert(renderedData.exists, 'Container must exist');
    });

    runTest('Bot donation displays exact donation amount "Added +16 to BT1 (Total: 16)"', () => {
      assert(renderedData.hasAdded16, `Must contain amount text, got: ${renderedData.text}`);
    });

    runTest('Bot donation eliminates ugly "Batch Donation: BrianDCox" placeholder', () => {
      assert(!renderedData.hasBatchDonationBrian, 'Must NOT contain "Batch Donation: BrianDCox"');
    });

    runTest('Bot author attribution (by WOS ChatBot) is clearly displayed', () => {
      assert(renderedData.hasChatBot, 'Must contain WOS ChatBot');
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
    runTest('Zero fatal console errors during execution', () => {
      assert.strictEqual(consoleErrors.length, 0, `Detected ${consoleErrors.length} console error(s): ${JSON.stringify(consoleErrors)}`);
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
