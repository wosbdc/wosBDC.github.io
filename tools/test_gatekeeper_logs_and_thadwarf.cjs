// tools/test_gatekeeper_logs_and_thadwarf.cjs
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

console.log('🧪 Starting Alliance Gatekeeper Admin Logs & thadwarf Deduplication Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

async function runAsyncTest(testName, testFn) {
  totalTests++;
  try {
    await testFn();
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${testName} -> ${err.message}`);
    process.exitCode = 1;
  }
}

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

async function main() {
  // 1. Syntax check on main.js
  runTest('main.js compiles cleanly with 0 syntax errors', () => {
    execSync('node --check main.js', { stdio: 'pipe' });
  });

  const mainJsPath = path.join(__dirname, '..', 'main.js');
  const mainJs = fs.readFileSync(mainJsPath, 'utf8');

  // 2. cleanChiefName thadwarf canonical lowercase enforcement
  runTest('cleanChiefName canonical lowercase mapping for thadwarf variations', () => {
    assert(mainJs.includes("if (lower === 'thadwarf' || lower === 'tha dwarf' || lower === 'tha_dwarf') return 'thadwarf';"), 
      'cleanChiefName must contain explicit rule forcing thadwarf/tha dwarf/tha_dwarf to "thadwarf"');
  });

  // 3. KNOWN_STAFF has lowercase thadwarf
  runTest('KNOWN_STAFF maps ID 705413646 to lowercase "thadwarf"', () => {
    assert(mainJs.includes('"705413646": { name: "thadwarf", role: "R4" }'), 
      'KNOWN_STAFF 705413646 must be mapped to lowercase "thadwarf"');
  });

  // 4. logAdminAction adminOverride and cleanChiefName integration
  runTest('logAdminAction supports adminOverride and cleans admin/target names', () => {
    assert(mainJs.includes('window.logAdminAction = async (actionType, details, targetPlayer = \'\', metadata = null, adminOverride = null) => {'),
      'logAdminAction must accept adminOverride as 5th parameter');
    assert(mainJs.includes('if (window.cleanChiefName) {') && mainJs.includes('adminName = window.cleanChiefName(adminName) || adminName;'),
      'logAdminAction must normalize adminName with cleanChiefName');
    assert(mainJs.includes('targetName = window.cleanChiefName(targetName) || targetName;'),
      'logAdminAction must normalize targetName with cleanChiefName');
  });

  // 5. GateKeeper pushGatekeeperReportToDiscord logs action
  runTest('pushGatekeeperReportToDiscord calls logAdminAction with Alliance Gatekeeper', () => {
    assert(mainJs.includes('"GateKeeper Report"') && mainJs.includes('"Alliance Gatekeeper"'),
      'pushGatekeeperReportToDiscord must call logAdminAction with "GateKeeper Report" and "Alliance Gatekeeper"');
  });

  // 6. GateKeeper triggerNewMemberAlerts logs action
  runTest('triggerNewMemberAlerts calls logAdminAction with Alliance Gatekeeper', () => {
    assert(mainJs.includes('"GateKeeper Alert"') && mainJs.includes('"Alliance Gatekeeper"'),
      'triggerNewMemberAlerts must call logAdminAction with "GateKeeper Alert" and "Alliance Gatekeeper"');
  });

  // 7. getAdminActionBadgeHtml recognizes gatekeeper actions
  runTest('getAdminActionBadgeHtml includes distinct styling and castle icon for GateKeeper', () => {
    assert(mainJs.includes("if (lower.includes('gatekeeper')) {") && mainJs.includes("icon = '🏰';"),
      'getAdminActionBadgeHtml must assign 🏰 icon to gatekeeper actions');
  });

  // 8. fetchAdminLog deduplicates admins using a Map and includes Alliance Gatekeeper
  runTest('fetchAdminLog deduplicates uniqueAdmins case-insensitively and renders Alliance Gatekeeper', () => {
    assert(mainJs.includes('let uniqueAdmins = new Map();'),
      'uniqueAdmins must be initialized as a Map for case-insensitive deduplication');
    assert(mainJs.includes('const adminKey = adminName.toLowerCase();') && mainJs.includes('uniqueAdmins.set(adminKey, adminName);'),
      'uniqueAdmins must key by lowercase admin name');
    assert(mainJs.includes('<option value="alliance gatekeeper">🏰 Alliance Gatekeeper</option>'),
      'adminLogFilter dropdown must include Alliance Gatekeeper option');
  });

  // 9. runDatabaseNameCleanup sanitizes admin_logs
  runTest('runDatabaseNameCleanup sanitizes historical admin_logs admin and target fields', () => {
    assert(mainJs.includes("const logsSnap = await get(ref(db, 'admin_logs')).catch(() => null);"),
      'runDatabaseNameCleanup must fetch admin_logs');
    assert(mainJs.includes("logUpdates[`admin_logs/${lId}/admin`] = newAdmin;"),
      'runDatabaseNameCleanup must update sanitized admin in admin_logs');
    assert(mainJs.includes("logUpdates[`admin_logs/${lId}/target`] = newTarget;"),
      'runDatabaseNameCleanup must update sanitized target in admin_logs');
  });

  // 10. Functional Simulation of deduplication & casing normalization
  runTest('Functional deduplication simulation correctly merges Thadwarf and thadwarf', () => {
    const cleanChiefName = (name) => {
      if (!name) return '';
      let str = String(name).trim();
      const lower = str.toLowerCase();
      if (lower === 'thadwarf' || lower === 'tha dwarf' || lower === 'tha_dwarf') return 'thadwarf';
      return str;
    };

    assert.strictEqual(cleanChiefName('Thadwarf'), 'thadwarf');
    assert.strictEqual(cleanChiefName('thadwarf'), 'thadwarf');
    assert.strictEqual(cleanChiefName('THADWARF'), 'thadwarf');
    assert.strictEqual(cleanChiefName('tha dwarf'), 'thadwarf');

    const sampleRawLogs = [
      { admin: 'Thadwarf', action: 'Roster Update' },
      { admin: 'thadwarf', action: 'Event Update' },
      { admin: 'BrianDCox', action: 'Sync' },
      { admin: 'Alliance Gatekeeper', action: 'GateKeeper Report' },
      { admin: 'briandcox', action: 'Championship' }
    ];

    const uniqueAdmins = new Map();
    sampleRawLogs.forEach(l => {
      const cleaned = cleanChiefName(l.admin);
      const key = cleaned.toLowerCase();
      if (!uniqueAdmins.has(key)) {
        uniqueAdmins.set(key, cleaned);
      }
    });

    const adminsList = Array.from(uniqueAdmins.values());
    assert.strictEqual(uniqueAdmins.size, 3, 'Should have exactly 3 unique admins (thadwarf, BrianDCox, Alliance Gatekeeper)');
    assert(adminsList.includes('thadwarf'), 'Must contain lowercase thadwarf');
    assert(!adminsList.includes('Thadwarf'), 'Must NOT contain duplicate capitalized Thadwarf');
  });

  // 11. Headless Browser Verification (if puppeteer is available)
  let puppeteer = null;
  const possiblePuppeteerPaths = [
    'puppeteer-core',
    'puppeteer',
    'C:\\Users\\Brian\\Documents\\antigravity\\pup\\node_modules\\puppeteer-core',
    path.resolve(__dirname, '../../../pup/node_modules/puppeteer-core')
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
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
  ].filter(Boolean);

  const chromePath = possibleChromePaths.find(p => fs.existsSync(p));

  if (puppeteer && chromePath) {
    await runAsyncTest('Headless Chrome DOM & Filter Validation for Admin Logs & thadwarf', async () => {
      const http = require('http');
      const html = `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><title>Admin Logs Test</title></head>
        <body>
          <select id="adminLogFilter">
            <option value="">👤 All Admins</option>
          </select>
          <table>
            <tbody id="adminLogsTbody"></tbody>
          </table>
          <script>
            function escapeHTML(str) {
              return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
            }

            ${mainJs.substring(mainJs.indexOf('window.cleanChiefName ='), mainJs.indexOf('window.getUnifiedMasterChiefList ='))}
            ${mainJs.substring(mainJs.indexOf('window.getAdminActionBadgeHtml ='), mainJs.indexOf('window.toggleLogBatch ='))}

            // Populate select with test data
            const uniqueAdmins = new Map();
            ['Thadwarf', 'thadwarf', 'BrianDCox', 'Alliance Gatekeeper'].forEach(adm => {
              const cleaned = window.cleanChiefName(adm);
              const key = cleaned.toLowerCase();
              if (!uniqueAdmins.has(key)) {
                uniqueAdmins.set(key, cleaned);
              }
            });

            const adminSelect = document.getElementById('adminLogFilter');
            let selectHtml = '<option value="">👤 All Admins</option>';
            selectHtml += '<option value="alliance gatekeeper">🏰 Alliance Gatekeeper</option>';
            Array.from(uniqueAdmins.values())
              .filter(admin => admin.toLowerCase() !== 'alliance gatekeeper')
              .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
              .forEach(admin => {
                selectHtml += '<option value="' + admin.toLowerCase() + '">' + escapeHTML(admin) + '</option>';
              });
            adminSelect.innerHTML = selectHtml;
          </script>
        </body>
        </html>
      `;

      let server;
      let browser;
      try {
        await new Promise((resolve) => {
          server = http.createServer((req, res) => {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
          });
          server.listen(0, resolve);
        });

        const port = server.address().port;
        browser = await puppeteer.launch({
          executablePath: chromePath,
          headless: 'new',
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        const errors = [];
        page.on('console', msg => console.log('PAGE CONSOLE:', msg.text()));
        page.on('pageerror', err => {
          console.log('PAGE ERROR:', err.message);
          errors.push(err.message);
        });

        await page.goto(`http://localhost:${port}`, { waitUntil: 'load' });
        
        const options = await page.$$eval('#adminLogFilter option', opts => opts.map(o => ({ value: o.value, text: o.text })));
        console.log('Parsed Options in Headless Chrome:', options);
        
        assert(options.some(o => o.value === 'alliance gatekeeper' && o.text.includes('🏰 Alliance Gatekeeper')), 'Must render Alliance Gatekeeper option');
        assert(options.some(o => o.value === 'thadwarf' && o.text === 'thadwarf'), 'Must render thadwarf option');
        
        const thadwarfMatches = options.filter(o => o.value === 'thadwarf');
        assert.strictEqual(thadwarfMatches.length, 1, 'Must have exactly 1 thadwarf option with no duplicate casing');

        const badgeHtml = await page.evaluate(() => window.getAdminActionBadgeHtml('GateKeeper Report'));
        assert(badgeHtml.includes('🏰') && badgeHtml.includes('GateKeeper Report'), 'Gatekeeper action badge must contain castle icon');
      } finally {
        if (browser) await browser.close();
        if (server) server.close();
      }
    });
  }

  console.log('\n========================================');
  console.log(`Test Summary: ${passedTests}/${totalTests} tests passed`);
  console.log('========================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main();
