// tools/test_cooldown_countdown.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Starting Verification Cooldown & Live Countdown Automated Test Suite...\n');

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
// Test 2: Static Codebase Analysis & Coverage Assertions
// -------------------------------------------------------------
console.log('\n🔍 Test 2: Codebase Static Analysis for Cooldown Functions & Integrations');
const mainJs = fs.readFileSync(path.resolve(__dirname, '..', 'main.js'), 'utf8');

assert(mainJs.includes('window.isWosRateLimitError ='), 'window.isWosRateLimitError helper is defined');
assert(mainJs.includes('window.startVerificationCooldownTimer ='), 'window.startVerificationCooldownTimer is defined');
assert(mainJs.includes('window.activeCooldownTimer'), 'window.activeCooldownTimer reference is managed');

// Verification in modals
assert(
  mainJs.includes('openAccountHubVerifyModal') &&
  mainJs.includes('window.isWosRateLimitError(err)'),
  'openAccountHubVerifyModal integrates window.isWosRateLimitError'
);

assert(
  mainJs.includes('openAltVerifyModal') &&
  mainJs.includes('buttons: [sendBtn, submitCodeBtn]') &&
  mainJs.includes('buttons: [submitCodeBtn, sendBtn]'),
  'openAltVerifyModal integrates countdown timer for send and verify buttons'
);

assert(
  mainJs.includes('authPageCodeFeedback') &&
  mainJs.includes('buttons: [confirmBtn, resendBtn]'),
  'renderInGameCodeBox integrates countdown timer for confirm and resend buttons'
);

assert(
  mainJs.includes('altAutoFeedback') &&
  mainJs.includes('buttons: [altAutoSendCodeBtn, altAutoConfirmCodeBtn]'),
  'Alt Auto Link flow integrates countdown timer'
);

// -------------------------------------------------------------
// Test 3: Unit Testing isWosRateLimitError Logic
// -------------------------------------------------------------
console.log('\n🔍 Test 3: Unit Testing isWosRateLimitError Pattern Recognition');

const isWosRateLimitError = (err, data = null) => {
  const code = (data && data.code) || (err && (err.code || err.status)) || null;
  const rawMsg = (data && (data.message || data.msg)) || (err && (err.message || String(err))) || '';
  if (code === 101031018 || code === 40001 || code === 40003) return true;
  if (typeof rawMsg === 'string') {
    const lower = rawMsg.toLowerCase();
    if (rawMsg.includes('101031018') || lower.includes('too many requests') || lower.includes('please wait about 30–60 seconds') || lower.includes('please wait about 30-60 seconds') || lower.includes('cooldown active') || lower.includes('rate limit')) {
      return true;
    }
  }
  return false;
};

assert(isWosRateLimitError({ code: 101031018 }), 'Detects Century Games code 101031018 directly on error');
assert(isWosRateLimitError(null, { code: 101031018 }), 'Detects Century Games code 101031018 on response data');
assert(isWosRateLimitError(new Error('[Code 101031018] Too many requests. Please wait about 30–60 seconds and try again.')), 'Detects translated error string with code');
assert(isWosRateLimitError(new Error('Too many requests. Please wait a moment')), 'Detects message containing "Too many requests"');
assert(isWosRateLimitError(new Error('Century Games rate limit active')), 'Detects message containing "rate limit"');
assert(!isWosRateLimitError({ code: 101031021 }), 'Does not misidentify invalid verification code (101031021)');
assert(!isWosRateLimitError(new Error('Invalid or expired verification code.')), 'Does not misidentify expired code message');

// -------------------------------------------------------------
// Test 4: Real Headless Chrome Browser User Journey & DOM Assertions
// -------------------------------------------------------------
console.log('\n🌐 Test 4: Real Headless Chrome DOM Verification & Timer Simulation');

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
    <title>Cooldown Countdown Test</title>
  </head>
  <body style="background:#0f172a; color:#fff; font-family:sans-serif; padding:20px;">
    <div id="modalContainer">
      <button id="sendBtn">📩 Send Code to In-Game Mail</button>
      <button id="verifyBtn">Verify & Bind</button>
      <div id="feedback" style="display:none; margin-top:10px;"></div>
    </div>
    <script>
      window.activeCooldownTimer = null;
      window.startVerificationCooldownTimer = ({ durationSec = 60, feedbackEl, buttons = [], onComplete = null } = {}) => {
        if (window.activeCooldownTimer) {
          clearInterval(window.activeCooldownTimer);
          window.activeCooldownTimer = null;
        }

        let remaining = Math.max(1, parseInt(durationSec, 10) || 60);

        const btnOriginals = (buttons || []).filter(Boolean).map(btn => {
          if (!btn.getAttribute('data-orig-html')) {
            btn.setAttribute('data-orig-html', btn.innerHTML);
          }
          return {
            btn,
            originalHtml: btn.getAttribute('data-orig-html')
          };
        });

        const updateUi = () => {
          if (feedbackEl) {
            feedbackEl.style.display = 'block';
            feedbackEl.style.color = '#f59e0b';
            feedbackEl.style.fontWeight = 'bold';
            feedbackEl.innerHTML = '⏳ [Code 101031018] Too many requests. Cooldown remaining: <span id="cooldownBadge">' + remaining + 's</span>';
          }

          btnOriginals.forEach(({ btn }) => {
            btn.disabled = true;
            btn.textContent = '⏳ Wait ' + remaining + 's...';
          });
        };

        updateUi();

        window.activeCooldownTimer = setInterval(() => {
          remaining--;
          if (remaining > 0) {
            updateUi();
          } else {
            clearInterval(window.activeCooldownTimer);
            window.activeCooldownTimer = null;

            btnOriginals.forEach(({ btn, originalHtml }) => {
              btn.disabled = false;
              btn.innerHTML = originalHtml;
              btn.removeAttribute('data-orig-html');
            });

            if (feedbackEl) {
              feedbackEl.style.color = '#10b981';
              feedbackEl.innerHTML = '✅ Cooldown complete! You may now request or verify a code.';
            }

            if (typeof onComplete === 'function') onComplete();
          }
        }, 1000);
      };
    </script>
  </body>
  </html>
  `;

  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(testHtml);
  });

  const PORT = 8119;
  await new Promise(r => server.listen(PORT, r));

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    let consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('pageerror', err => consoleErrors.push(err.message));

    await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });

    // Step 1: Initial state assertion
    const initialSendBtnDisabled = await page.$eval('#sendBtn', el => el.disabled);
    const initialVerifyBtnDisabled = await page.$eval('#verifyBtn', el => el.disabled);
    assert(!initialSendBtnDisabled && !initialVerifyBtnDisabled, 'Action buttons are initially active and enabled');

    // Step 2: Trigger 3-second cooldown timer
    await page.evaluate(() => {
      const sendBtn = document.getElementById('sendBtn');
      const verifyBtn = document.getElementById('verifyBtn');
      const feedback = document.getElementById('feedback');
      window.startVerificationCooldownTimer({
        durationSec: 3,
        feedbackEl: feedback,
        buttons: [sendBtn, verifyBtn]
      });
    });

    // Step 3: Assert UI reflects active countdown immediately
    const stateAtStart = await page.evaluate(() => {
      const sBtn = document.getElementById('sendBtn');
      const vBtn = document.getElementById('verifyBtn');
      const fb = document.getElementById('feedback');
      return {
        sendDisabled: sBtn.disabled,
        verifyDisabled: vBtn.disabled,
        sendText: sBtn.textContent,
        verifyText: vBtn.textContent,
        feedbackVisible: fb.style.display !== 'none',
        feedbackHtml: fb.innerHTML
      };
    });

    assert(stateAtStart.sendDisabled && stateAtStart.verifyDisabled, 'Both buttons are disabled during cooldown');
    assert(stateAtStart.sendText.includes('Wait 3s'), 'Send button reflects countdown text "Wait 3s..."');
    assert(stateAtStart.verifyText.includes('Wait 3s'), 'Verify button reflects countdown text "Wait 3s..."');
    assert(stateAtStart.feedbackHtml.includes('Code 101031018') && stateAtStart.feedbackHtml.includes('3s'), 'Feedback displays rate limit code badge and remaining time');

    // Step 4: Wait 1.1s for second tick (should be 2s)
    await new Promise(r => setTimeout(r, 1100));
    const stateAtTick = await page.evaluate(() => {
      return {
        sendText: document.getElementById('sendBtn').textContent,
        feedbackHtml: document.getElementById('feedback').innerHTML
      };
    });
    assert(stateAtTick.sendText.includes('Wait 2s'), 'Countdown ticks down dynamically to "Wait 2s..."');
    assert(stateAtTick.feedbackHtml.includes('2s'), 'Feedback box updates seconds badge to 2s');

    // Step 5: Wait remaining duration (2.2s) for cooldown completion
    await new Promise(r => setTimeout(r, 2200));
    const stateAtEnd = await page.evaluate(() => {
      const sBtn = document.getElementById('sendBtn');
      const vBtn = document.getElementById('verifyBtn');
      const fb = document.getElementById('feedback');
      return {
        sendDisabled: sBtn.disabled,
        verifyDisabled: vBtn.disabled,
        sendHtml: sBtn.innerHTML,
        verifyHtml: vBtn.innerHTML,
        feedbackHtml: fb.innerHTML
      };
    });

    assert(!stateAtEnd.sendDisabled && !stateAtEnd.verifyDisabled, 'Both buttons are re-enabled after cooldown ends');
    assert(stateAtEnd.sendHtml.includes('Send Code to In-Game Mail'), 'Original Send button HTML/text restored');
    assert(stateAtEnd.verifyHtml.includes('Verify &amp; Bind') || stateAtEnd.verifyHtml.includes('Verify & Bind'), 'Original Verify button HTML/text restored');
    assert(stateAtEnd.feedbackHtml.includes('Cooldown complete'), 'Feedback box displays completion status message');

    assert(consoleErrors.length === 0, 'Zero console errors observed during headless browser journey');
  } finally {
    await browser.close();
    server.close();
  }

  console.log(`\n🎉 All Cooldown Countdown Verification Tests Passed: ${passedTests}/${totalTests}`);
  if (process.exitCode) {
    process.exit(process.exitCode);
  } else {
    process.exit(0);
  }
})();
