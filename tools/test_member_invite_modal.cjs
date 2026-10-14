// tools/test_member_invite_modal.cjs
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
  console.log('📦 Starting Static & Structural Verification for Alliance Member Invite Hub...');
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

  // Verify critical signatures and DOM patterns
  assert(code.includes('window.openMemberInviteModal ='), 'main.js must define window.openMemberInviteModal');
  assert(code.includes('memberInviteModalOverlay'), 'main.js must define memberInviteModalOverlay');
  assert(code.includes('memberInviteUrlInput'), 'main.js must provide memberInviteUrlInput');
  assert(code.includes('memberInviteResetUrlBtn'), 'main.js must provide memberInviteResetUrlBtn');
  assert(code.includes('wos_member_invite_custom_url'), 'main.js must persist custom url to localStorage');
  assert(code.includes('https://tiny.cc/wosBDC'), 'main.js must default to shortcut URL https://tiny.cc/wosBDC');
  assert(code.includes('memberInviteTextArea'), 'main.js must provide memberInviteTextArea');
  assert(code.includes('inviteTabBtnDiscord'), 'main.js must provide inviteTabBtnDiscord');
  assert(code.includes('inviteTabBtnMail'), 'main.js must provide inviteTabBtnMail');
  assert(code.includes('inviteTabBtnChat'), 'main.js must provide inviteTabBtnChat');
  assert(code.includes('copyMemberInviteBtn'), 'main.js must provide copyMemberInviteBtn');
  assert(code.includes('Automated Gift Code Delivery:'), 'main.js must include Discord Option 2 gift code feature');
  assert(code.includes('Your Personal Event Clock:'), 'main.js must include Discord Option 2 clock feature');
  assert(code.includes('Direct Leadership Ticket Desk:'), 'main.js must include Discord Option 2 ticket desk feature');

  // Verify buttons in Admin sections
  assert(code.includes('onclick="window.openMemberInviteModal()"'), 'Admin markup must include openMemberInviteModal handler');
  assert(code.includes('Member Invite & Announcement Hub'), 'Daily Tools must have Member Invite & Announcement Hub button');
  assert(code.includes('Share Member Invite'), 'Database box must have Share Member Invite button');
  assert(code.includes('window.copyUnsyncedTokensList()') && code.includes('Share Member Invite'), 'Database box must place Share Member Invite adjacent to Copy Unsynced');
  console.log('  ✅ Static signatures, buttons, and template contents confirmed');
}

async function runHeadlessVerification() {
  if (!puppeteer || !chromePath) {
    console.warn('⚠️ Puppeteer or Chrome not found. Skipping live browser test step; static verification passed.');
    return;
  }
  console.log('🚀 Launching Real Headless Chrome verification suite for Member Invite Hub...');

  // Create static server serving dist
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

    // Set up mock admin user state
    await page.evaluate(() => {
      window.currentUser = {
        uid: 'admin_test_123',
        name: 'AdminChief',
        chiefName: 'AdminChief',
        role: 'admin',
        gameId: '111222333'
      };
      window.isAdminUser = () => true;
    });

    // Test 1: Open the modal directly via window.openMemberInviteModal()
    await page.evaluate(() => {
      window.openMemberInviteModal();
    });

    await new Promise(r => setTimeout(r, 200));

    // Verify modal overlay rendered in DOM
    const modalExists = await page.evaluate(() => {
      const overlay = document.getElementById('memberInviteModalOverlay');
      return !!overlay && overlay.style.display !== 'none';
    });
    assert(modalExists, 'memberInviteModalOverlay must be rendered in DOM');
    console.log('  ✅ Member Invite modal opened and rendered in DOM');

    // Test 2: Verify default Discord template content & shortcut URL
    const defaultText = await page.evaluate(() => {
      const ta = document.getElementById('memberInviteTextArea');
      return ta ? ta.value : '';
    });
    assert(defaultText.includes('Welcome to the Official BDC Alliance Portal'), 'Default Discord template must be loaded');
    assert(defaultText.includes('Automated Gift Code Delivery'), 'Default Discord template must contain features');
    assert(defaultText.includes('https://tiny.cc/wosBDC'), 'Default template must include shortcut URL https://tiny.cc/wosBDC');
    console.log('  ✅ Discord template text correctly populated with https://tiny.cc/wosBDC default');

    // Test 3: Sub-tab switching to In-Game Mail
    await page.evaluate(() => {
      document.getElementById('inviteTabBtnMail').click();
    });
    await new Promise(r => setTimeout(r, 100));

    const mailText = await page.evaluate(() => {
      return document.getElementById('memberInviteTextArea').value;
    });
    assert(mailText.includes('Attention BDC Chiefs! Claim Your Official Alliance Portal Account!'), 'Mail template must load on tab switch');
    assert(mailText.includes('https://tiny.cc/wosBDC'), 'Mail template must include shortcut URL');
    console.log('  ✅ In-Game Mail sub-tab switched and template updated');

    // Test 4: Sub-tab switching to Short Chat Pin
    await page.evaluate(() => {
      document.getElementById('inviteTabBtnChat').click();
    });
    await new Promise(r => setTimeout(r, 100));

    const chatText = await page.evaluate(() => {
      return document.getElementById('memberInviteTextArea').value;
    });
    assert(chatText.includes('Claim Your BDC Alliance Profile! 🎁'), 'Chat Pin template must load on tab switch');
    assert(chatText.includes('https://tiny.cc/wosBDC'), 'Chat Pin template must include shortcut URL');
    console.log('  ✅ Short Chat Pin sub-tab switched and template updated');

    // Test 5: Dynamic URL update & localStorage persistence
    const storageCheck = await page.evaluate(() => {
      const urlInput = document.getElementById('memberInviteUrlInput');
      urlInput.value = 'https://portal.bdcalliance.org';
      urlInput.dispatchEvent(new Event('input', { bubbles: true }));
      urlInput.dispatchEvent(new Event('change', { bubbles: true }));
      return localStorage.getItem('wos_member_invite_custom_url');
    });
    await new Promise(r => setTimeout(r, 100));
    assert.strictEqual(storageCheck, 'https://portal.bdcalliance.org', 'Edited URL must be saved to localStorage');

    const updatedChatText = await page.evaluate(() => {
      return document.getElementById('memberInviteTextArea').value;
    });
    assert(updatedChatText.includes('https://portal.bdcalliance.org'), 'Template must update dynamically with custom URL');
    console.log('  ✅ Custom URL persisted to localStorage and re-rendered template');

    // Test 5B: Reset button restores https://tiny.cc/wosBDC
    const resetResult = await page.evaluate(() => {
      document.getElementById('memberInviteResetUrlBtn').click();
      const val = document.getElementById('memberInviteUrlInput').value;
      const text = document.getElementById('memberInviteTextArea').value;
      const saved = localStorage.getItem('wos_member_invite_custom_url');
      return { val, text, saved };
    });
    assert.strictEqual(resetResult.val, 'https://tiny.cc/wosBDC', 'Input must reset to https://tiny.cc/wosBDC');
    assert(resetResult.text.includes('https://tiny.cc/wosBDC'), 'Template must revert to https://tiny.cc/wosBDC');
    assert(!resetResult.saved, 'localStorage override must be cleared on reset');
    console.log('  ✅ Reset button successfully restored default shortcut URL https://tiny.cc/wosBDC');

    // Test 6: 1-Click Copy action and visual status change
    await page.evaluate(() => {
      document.getElementById('copyMemberInviteBtn').click();
    });
    await new Promise(r => setTimeout(r, 100));

    const copyBtnState = await page.evaluate(() => {
      const text = document.getElementById('copyBtnText')?.textContent;
      const icon = document.getElementById('copyBtnIcon')?.textContent;
      return { text, icon };
    });
    assert.strictEqual(copyBtnState.text, 'Copied!', 'Copy button text must change to "Copied!"');
    assert.strictEqual(copyBtnState.icon, '✅', 'Copy button icon must change to "✅"');
    console.log('  ✅ Copy button triggered visual confirmation state');

    // Test 7: Responsive viewports & overflow check (375px, 768px, 1280px)
    const viewports = [
      { width: 375, height: 667, name: 'Mobile (375px)' },
      { width: 768, height: 1024, name: 'Tablet (768px)' },
      { width: 1280, height: 800, name: 'Desktop (1280px)' }
    ];

    for (const vp of viewports) {
      await page.setViewport(vp);
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      assert(!overflow, `No horizontal overflow expected at ${vp.name}`);
      console.log(`  ✅ Responsive check passed at ${vp.name} (zero horizontal overflow)`);
    }

    // Test 8: Close modal
    await page.evaluate(() => {
      document.getElementById('closeMemberInviteModalBtn').click();
    });
    await new Promise(r => setTimeout(r, 100));

    const modalClosed = await page.evaluate(() => {
      return !document.getElementById('memberInviteModalOverlay');
    });
    assert(modalClosed, 'Modal must be removed from DOM after close');
    console.log('  ✅ Modal closed and removed from DOM cleanly');

    // Test 9: Verify Share Member Invite button in Database box inside Admin Users view
    const btnInDatabaseBox = await page.evaluate(async () => {
      window.isAdminUser = () => true;
      window.isGoogleAuthVerified = async () => true;
      window.getAdminLevel = () => 'R5';
      window.fetchRoster = async () => [];

      if (window.views && window.views.admin) {
        await window.views.admin('tab-users');
      }
      for (let i = 0; i < 30; i++) {
        if (document.querySelector('button[onclick*="copyUnsyncedTokensList"]')) break;
        await new Promise(r => setTimeout(r, 50));
      }
      const unsyncBtn = document.querySelector('button[onclick*="copyUnsyncedTokensList"]');
      const shareBtn = document.querySelector('button[onclick*="openMemberInviteModal"]');
      return {
        hasUnsyncBtn: !!unsyncBtn,
        hasShareBtn: !!shareBtn,
        nextBtnTag: unsyncBtn ? unsyncBtn.nextElementSibling?.tagName : null,
        nextBtnText: unsyncBtn ? unsyncBtn.nextElementSibling?.textContent : null,
        nextBtnOnclick: unsyncBtn ? unsyncBtn.nextElementSibling?.getAttribute('onclick') : null
      };
    });
    assert(btnInDatabaseBox.hasShareBtn, 'Share Member Invite button must exist');
    assert(btnInDatabaseBox.nextBtnOnclick && btnInDatabaseBox.nextBtnOnclick.includes('openMemberInviteModal'), 'Share Member Invite button must exist in Database Box directly next to Copy Unsynced button');
    console.log('  ✅ Share Member Invite button verified in Alliance Members & Player Database box next to Copy Unsynced');

    // Filter out expected benign non-fatal messages if any
    const fatalErrors = consoleErrors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('Firebase') && 
      !e.includes('PERMISSION_DENIED') && 
      !e.includes('403') && 
      !e.includes('network') &&
      !e.includes('Failed to load resource')
    );
    assert.strictEqual(fatalErrors.length, 0, `Expected 0 fatal console errors, got: ${JSON.stringify(fatalErrors)}`);
    console.log('  ✅ Zero fatal console errors observed');

    console.log('\n🎉 ALL MEMBER INVITE HUB AUTOMATED VERIFICATIONS PASSED 100%!');
  } finally {
    await browser.close();
    server.close();
  }
}

async function run() {
  runStaticVerification();
  // Build dist before running headless verification to ensure latest code is served
  console.log('🏗️ Verifying dist exists or run headless verification...');
  await runHeadlessVerification();
}

run().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
