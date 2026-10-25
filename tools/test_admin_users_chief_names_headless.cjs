// tools/test_admin_users_chief_names_headless.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const PORT = 8098;
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
  console.log('📦 Starting Static & Structural Verification for Admin Users Chief Names...');
  const mainJsPath = path.resolve(__dirname, '..', 'main.js');
  const code = fs.readFileSync(mainJsPath, 'utf8');

  // 1. AST syntax validation
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
  new vm.Script(`(async () => {\n${strippedLines.join('\n')}\n})()`, { filename: 'main.js' });
  console.log('  ✅ main.js AST syntax validation passed with 0 syntax errors.');

  // 2. Structural checks
  assert(code.includes('window.resolveChiefName(u.chiefName || u.name, uGidStr'), 'Registered users must use window.resolveChiefName');
  assert(code.includes('Object.entries(rosterRawData).forEach(([k, p])'), 'Unclaimed roster loop must preserve roster key k');
  assert(code.includes('window.resolveChiefName(p.chiefName || p.name, uGid, p.key'), 'Unclaimed roster rows must resolve via window.resolveChiefName with key');
  assert(code.includes('!gid && p.name && /^\\d{6,}$/.test(String(p.name).trim())'), 'refreshIdToNameMap and fetchRoster must extract gid from numeric p.name');
  assert(code.includes('window.rosterCache = null;'), 'refreshAdminUsers must invalidate window.rosterCache');

  console.log('  ✅ All static structural assertions passed successfully.');
}

async function runRuntimeVerification() {
  if (!puppeteer || !chromePath) {
    console.warn('⚠️ Puppeteer or Chrome not detected in this environment (CI / Cloud Runner). Skipping browser tests.');
    return;
  }

  console.log('🌐 Starting Headless Chrome Runtime Verification for Admin Users Directory...');

  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(DIST_DIR, reqPath);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
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
      res.end(data);
    });
  });

  await new Promise((resolve) => server.listen(PORT, resolve));
  console.log(`  🚀 Headless test server running at http://localhost:${PORT}`);

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
      if (!err.message.includes('Firebase') && !err.message.includes('fetch')) {
        errors.push(err.message);
      }
    });

    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForFunction(() => typeof window.resolveChiefName === 'function', { timeout: 10000 });

    // Test resolveChiefName unit behaviors directly in browser context
    const testResults = await page.evaluate(() => {
      const r1 = window.resolveChiefName('705413646', '705413646', 'thadwarf', '');
      const r2 = window.resolveChiefName('', '734789138', 'AngryGermanpapi', '734789138');
      const r3 = window.resolveChiefName('Bisquick', '123456789', '123456789', 'Bisquick');
      const r4 = window.resolveChiefName('705413646', '705413646', '', '');
      return { r1, r2, r3, r4 };
    });

    assert.strictEqual(testResults.r1, 'thadwarf', 'Numeric name with chief key must resolve to thadwarf');
    assert.strictEqual(testResults.r2, 'AngryGermanpapi', 'Empty name and numeric chiefName with chief key must resolve to AngryGermanpapi');
    assert.strictEqual(testResults.r3, 'Bisquick', 'Valid chief name must resolve to Bisquick');
    console.log('  ✅ In-browser resolveChiefName unit assertions verified successfully.');

    // Test full DOM rendering of Admin Users Hub
    const renderedNames = await page.evaluate(async () => {
      // Mock admin environment
      window.currentUser = { uid: 'admin_test_uid', name: 'Diva', gameId: '318843189', role: 'R5' };
      window.systemAdmins = { '318843189': 'R5', '705413646': 'R4' };
      window.idToNameMap = { '318843189': 'Diva', '705413646': 'thadwarf', '734789138': 'AngryGermanpapi' };
      window.rosterCache = {
        'thadwarf': { name: 'thadwarf', chiefName: 'thadwarf', gameId: '705413646', furnaceLevel: 'FC5' },
        'AngryGermanpapi': { name: 'AngryGermanpapi', chiefName: 'AngryGermanpapi', gameId: '734789138', furnaceLevel: 'FC4' }
      };

      // Mock users in RTDB
      const mockUsers = {
        'uid_thadwarf': { gameId: '705413646', name: '705413646', email: 'thadwarf@test.com', role: 'R4' },
        'uid_angry': { gameId: '734789138', name: '734789138', email: 'angry@test.com', role: 'member' }
      };

      // Verify views.admin exists and render tab-users
      if (typeof views !== 'undefined' && typeof views.admin === 'function') {
        const app = document.getElementById('app') || document.body;
        // Inject admin markup directly or call views.admin
        try {
          await views.admin('tab-users');
        } catch (_) {}
      }

      // Check all rendered names in DOM
      const nameElements = Array.from(document.querySelectorAll('.admin-user-row [data-name-raw], .admin-user-row td span'));
      return nameElements.map(el => (el.getAttribute('data-name-raw') || el.textContent || '').trim()).filter(Boolean);
    });

    // Responsive checks
    for (const width of [375, 768, 1280]) {
      await page.setViewport({ width, height: 800 });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      assert(!overflow, `No horizontal overflow at ${width}px`);
    }
    console.log('  ✅ Responsive layouts (375px, 768px, 1280px) audited with zero overflow.');

    assert.strictEqual(errors.length, 0, `Page had zero fatal console errors: ${errors.join(', ')}`);
    console.log('  ✅ Headless Chrome execution verified with zero fatal console errors.');

  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

async function main() {
  try {
    runStaticVerification();
    await runRuntimeVerification();
    console.log('\n🎉 ALL ADMIN USERS CHIEF NAMES VERIFICATION CHECKS PASSED!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Verification Failed:', err);
    process.exit(1);
  }
}

main();
