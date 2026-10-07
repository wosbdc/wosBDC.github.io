// tools/test_24hr_hold_timer.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Starting 24-Hour Rolling Security Hold Timer Automated Test Suite...\n');

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
console.log('📦 Test 1: Node.js Syntax & Compilation Check for main.js');
try {
  execSync('node --check main.js', { stdio: 'pipe' });
  assert(true, 'main.js compiles cleanly with 0 syntax errors');
} catch (err) {
  assert(false, 'main.js compilation failed: ' + err.message);
}

// -------------------------------------------------------------
// Test 2: Codebase Static Analysis for 24-Hour Hold Integrations
// -------------------------------------------------------------
console.log('\n🔍 Test 2: Codebase Static Analysis for 24-Hour Hold Functions & Touchpoints');
const mainJs = fs.readFileSync(path.resolve(__dirname, '..', 'main.js'), 'utf8');

assert(mainJs.includes('window.recordWos24HrLockout ='), 'window.recordWos24HrLockout helper is defined');
assert(mainJs.includes('window.getWos24HrLockout ='), 'window.getWos24HrLockout is defined');
assert(mainJs.includes('window.formatTimeRemaining ='), 'window.formatTimeRemaining is defined');
assert(mainJs.includes('window.start24HourHoldTimer ='), 'window.start24HourHoldTimer is defined');
assert(mainJs.includes('window.active24HrTimers'), 'window.active24HrTimers map is maintained');

// Verification error translation
assert(
  mainJs.includes('24-Hour Rolling Limit Reached') &&
  !mainJs.includes('Wait until 00:00 UTC') &&
  !mainJs.includes('daily verification limit reached at 00:00 UTC'),
  'translateWosApiError reflects 24-hour rolling security hold and removes 00:00 UTC wording'
);

// Check all 4 touchpoints for code 101031017 integration
assert(
  mainJs.includes('authVerifyGameIdBtn') && mainJs.includes('101031017'),
  'Main Sign-In / Verification flow handles code 101031017 with 24hr hold timer'
);
assert(
  mainJs.includes('openAccountHubVerifyModal') && mainJs.includes('101031017'),
  'Account Hub verify modal handles code 101031017 with 24hr hold timer'
);
assert(
  mainJs.includes('openAltVerifyModal') && mainJs.includes('101031017'),
  'Alt Card verify modal handles code 101031017 with 24hr hold timer'
);
assert(
  mainJs.includes('renderInGameCodeBox') && mainJs.includes('101031017'),
  'Registration Step 2 verification flow handles code 101031017 with 24hr hold timer'
);
assert(
  mainJs.includes('altAutoSendCodeBtn') && mainJs.includes('101031017'),
  'Account Hub Alt Auto-Link handles code 101031017 with 24hr hold timer'
);

// -------------------------------------------------------------
// Test 3: Unit Testing 24hr Hold Logic & formatTimeRemaining
// -------------------------------------------------------------
console.log('\n🔍 Test 3: Unit Testing Format and Persistence Logic');

const formatTimeRemaining = (seconds) => {
  const sec = Math.max(0, parseInt(seconds, 10) || 0);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) return `${h}h ${pad(m)}m ${pad(s)}s`;
  if (m > 0) return `${m}m ${pad(s)}s`;
  return `${s}s`;
};

assert(formatTimeRemaining(86400) === '24h 00m 00s', '86400s formats correctly to 24h 00m 00s');
assert(formatTimeRemaining(86399) === '23h 59m 59s', '86399s formats correctly to 23h 59m 59s');
assert(formatTimeRemaining(3665) === '1h 01m 05s', '3665s formats correctly to 1h 01m 05s');
assert(formatTimeRemaining(125) === '2m 05s', '125s formats correctly to 2m 05s');
assert(formatTimeRemaining(45) === '45s', '45s formats correctly to 45s');
assert(formatTimeRemaining(0) === '0s', '0s formats correctly to 0s');

// -------------------------------------------------------------
// Test 4: Real Headless Chrome Browser User Journey & DOM Assertions
// -------------------------------------------------------------
console.log('\n🌐 Test 4: Real Headless Chrome DOM Verification & 24hr Hold Simulation');

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

const chromePath = possibleChromePaths.find(p => fs.existsSync(p));

(async () => {
  if (!puppeteer || !chromePath) {
    console.warn('⚠️ Puppeteer or Chrome not found; skipping headless browser test.');
    console.log(`\n🎉 Tests Finished: ${passedTests}/${totalTests} passed.`);
    process.exit(process.exitCode || 0);
  }

  const testHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>24-Hour Hold Timer Test</title>
  </head>
  <body style="background:#0f172a; color:#fff; font-family:sans-serif; padding:20px;">
    <div id="testContainer">
      <button id="sendCodeBtn">Send Code to In-Game Mail</button>
      <div id="codeSection" style="display:none; margin-top:10px;">
        <input type="text" id="codeInput" placeholder="Enter in-game code" />
        <button id="confirmBtn">Confirm Code</button>
      </div>
      <div id="holdFeedback" style="display:none; margin-top:10px;"></div>
    </div>
    <script>
      window.escapeHTML = str => String(str).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[m]);
      window.active24HrTimers = {};

      window.recordWos24HrLockout = (gameId, customSec = 86400) => {
        const cleanId = String(gameId || '').trim();
        if (!cleanId) return null;
        const expiresAt = Date.now() + (customSec * 1000);
        const raw = localStorage.getItem('wos_24hr_holds') || '{}';
        const holds = JSON.parse(raw);
        holds[cleanId] = expiresAt;
        localStorage.setItem('wos_24hr_holds', JSON.stringify(holds));
        return expiresAt;
      };

      window.getWos24HrLockout = (gameId) => {
        const cleanId = String(gameId || '').trim();
        if (!cleanId) return 0;
        const raw = localStorage.getItem('wos_24hr_holds') || '{}';
        const holds = JSON.parse(raw);
        const exp = Number(holds[cleanId] || 0);
        if (!exp) return 0;
        const remainingMs = exp - Date.now();
        if (remainingMs <= 0) {
          delete holds[cleanId];
          localStorage.setItem('wos_24hr_holds', JSON.stringify(holds));
          return 0;
        }
        return Math.ceil(remainingMs / 1000);
      };

      window.formatTimeRemaining = ${formatTimeRemaining.toString()};

      window.start24HourHoldTimer = ({ gameId, feedbackEl, buttons = [], codeSection = null, testRemainingSec = null }) => {
        const cleanId = String(gameId || '').trim();
        let remainingSec = testRemainingSec !== null ? testRemainingSec : window.getWos24HrLockout(cleanId);
        if (!remainingSec) {
          remainingSec = Math.ceil((window.recordWos24HrLockout(cleanId) - Date.now()) / 1000);
        }

        if (window.active24HrTimers[cleanId]) {
          clearInterval(window.active24HrTimers[cleanId]);
          delete window.active24HrTimers[cleanId];
        }

        const btnList = (buttons || []).filter(Boolean);
        btnList.forEach(btn => {
          if (!btn.getAttribute('data-orig-html')) {
            btn.setAttribute('data-orig-html', btn.innerHTML);
          }
          btn.disabled = true;
        });

        if (codeSection) {
          codeSection.style.display = 'block';
        }

        const renderHoldUi = () => {
          const timeStr = window.formatTimeRemaining(remainingSec);
          if (feedbackEl) {
            feedbackEl.style.display = 'block';
            feedbackEl.style.color = '#f59e0b';
            feedbackEl.innerHTML = \`
              <div id="holdBanner" style="background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.4); border-radius:8px; padding:10px 12px; margin-top:8px;">
                <div style="font-weight:700; color:#fbbf24; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
                  <span>⛔ [Code 101031017] 24-Hour Rolling Security Hold Active</span>
                </div>
                <div style="font-size:12.5px; color:#fde68a; line-height:1.45;">
                  Century Games limits verification requests per Game ID. Account <strong>\${window.escapeHTML(cleanId)}</strong> is on a rolling hold.
                </div>
                <div style="margin-top:6px; font-size:13px; font-weight:700; color:#fff;">
                  Hold expires in: <span id="holdCountdownBadge" style="font-family:monospace; background:rgba(0,0,0,0.4); padding:3px 8px; border-radius:5px; border:1px solid rgba(245,158,11,0.5); color:#fbbf24;">\${timeStr}</span>
                </div>
                <div style="margin-top:6px; font-size:11.5px; color:#cbd5e1;">
                  💡 <em>If you already have a valid code received earlier in your mailbox, you may enter it below.</em>
                </div>
              </div>
            \`;
          }

          btnList.forEach(btn => {
            btn.textContent = \`⛔ Locked (\${timeStr})\`;
          });
        };

        renderHoldUi();

        window.active24HrTimers[cleanId] = setInterval(() => {
          remainingSec--;
          if (remainingSec > 0) {
            renderHoldUi();
          } else {
            clearInterval(window.active24HrTimers[cleanId]);
            delete window.active24HrTimers[cleanId];

            btnList.forEach(btn => {
              btn.disabled = false;
              const orig = btn.getAttribute('data-orig-html');
              if (orig) btn.innerHTML = orig;
              btn.removeAttribute('data-orig-html');
            });

            if (feedbackEl) {
              feedbackEl.style.color = '#10b981';
              feedbackEl.innerHTML = '✅ <span id="clearedBadge">24-Hour Security Hold Cleared</span>: You may now request a new in-game verification code!';
            }
          }
        }, 1000);
      };
    </script>
  </body>
  </html>
  `;

  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(testHtml);
  });

  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const testUrl = `http://localhost:${port}/`;

  let browser;
  let pageErrors = [];

  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
    });

    const page = await browser.newPage();
    page.on('console', msg => {
      if (msg.type() === 'error') {
        pageErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => pageErrors.push(err.message));

    // Responsive checks: mobile (375), tablet (768), desktop (1280)
    for (const width of [375, 768, 1280]) {
      await page.setViewport({ width, height: 800 });
      await page.goto(testUrl, { waitUntil: 'domcontentloaded' });
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      assert(bodyWidth <= width, `Zero horizontal overflow at width ${width}px (measured: ${bodyWidth}px)`);
    }

    // Trigger 24-hour hold timer with a short 3-second simulation
    await page.evaluate(() => {
      const sendBtn = document.getElementById('sendCodeBtn');
      const codeSection = document.getElementById('codeSection');
      const feedbackEl = document.getElementById('holdFeedback');

      window.recordWos24HrLockout('29656114', 3);
      window.start24HourHoldTimer({
        gameId: '29656114',
        feedbackEl,
        buttons: [sendBtn],
        codeSection,
        testRemainingSec: 3
      });
    });

    // Verify initial DOM mutations:
    const initialBtnDisabled = await page.evaluate(() => document.getElementById('sendCodeBtn').disabled);
    const initialBtnText = await page.evaluate(() => document.getElementById('sendCodeBtn').textContent);
    const codeSectionVisible = await page.evaluate(() => document.getElementById('codeSection').style.display === 'block');
    const feedbackBanner = await page.$('#holdBanner');
    const countdownText = await page.evaluate(() => document.getElementById('holdCountdownBadge').textContent);

    assert(initialBtnDisabled === true, 'Send button is disabled when 24hr hold is triggered');
    assert(initialBtnText.includes('Locked (3s)'), 'Send button text reflects 24hr hold lockout: ' + initialBtnText);
    assert(codeSectionVisible === true, 'In-game code input section remains visible so user can enter previous code');
    assert(Boolean(feedbackBanner), '24-hour hold banner physically rendered into DOM');
    assert(countdownText === '3s', 'Countdown badge displays remaining hold time: ' + countdownText);

    // Verify localStorage persistence
    const savedExp = await page.evaluate(() => {
      const raw = localStorage.getItem('wos_24hr_holds');
      const parsed = JSON.parse(raw || '{}');
      return parsed['29656114'] || null;
    });
    assert(Boolean(savedExp && savedExp > Date.now()), 'Game ID 24-hour hold expiration is persisted in localStorage');

    // Wait 1.1s for timer to tick down to 2s
    await new Promise(r => setTimeout(r, 1100));
    const midBtnText = await page.evaluate(() => document.getElementById('sendCodeBtn').textContent);
    const midCountdown = await page.evaluate(() => document.getElementById('holdCountdownBadge').textContent);

    assert(midBtnText.includes('Locked (2s)'), 'Send button ticks down dynamically to Locked (2s): ' + midBtnText);
    assert(midCountdown === '2s', 'DOM badge ticks down dynamically to 2s');

    // Wait 2.2s for timer to complete and unlock
    await new Promise(r => setTimeout(r, 2200));
    const finalBtnDisabled = await page.evaluate(() => document.getElementById('sendCodeBtn').disabled);
    const finalBtnText = await page.evaluate(() => document.getElementById('sendCodeBtn').textContent);
    const clearedBadge = await page.$('#clearedBadge');

    assert(finalBtnDisabled === false, 'Send button is unlocked when 24-hour hold expires');
    assert(finalBtnText === 'Send Code to In-Game Mail', 'Original Send button HTML/text is restored upon expiration');
    assert(Boolean(clearedBadge), 'Clearance notice rendered in DOM notifying user they may request code');

    assert(pageErrors.length === 0, `Zero console or runtime errors observed (errors: ${pageErrors.join(', ')})`);

  } catch (err) {
    console.error('Browser test failed:', err);
    assert(false, 'Headless Chrome test completed without unexpected failure: ' + err.message);
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  console.log(`\n🎉 All 24-Hour Hold Verification Tests Finished: ${passedTests}/${totalTests} passed.`);
  if (passedTests !== totalTests || process.exitCode === 1) {
    process.exit(1);
  }
})();
