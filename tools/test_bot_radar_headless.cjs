// scratch/test_bot_radar_headless.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');

const puppeteerPath = 'C:\\Users\\Brian\\Documents\\antigravity\\pup\\node_modules\\puppeteer-core';
const puppeteer = require(puppeteerPath);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PORT = 8092;
const DIST_DIR = 'C:\\Users\\Brian\\Documents\\antigravity\\wos-public-website\\dist';

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
    res.writeHead(200, { 'Content-Type': 'text/html' });
    fs.createReadStream(indexPath).pipe(res);
  }
});

server.listen(PORT, async () => {
  console.log('🚀 Radar Headless Chrome Test server listening on http://localhost:' + PORT);

  let browser;
  let exitCode = 0;
  try {
    browser = await puppeteer.launch({
      executablePath: chromePath,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
    });

    const page = await browser.newPage();
    const consoleErrors = [];

    page.on('response', resp => {
      if (!resp.ok() && resp.status() !== 304) {
        console.log(`  [HTTP ${resp.status()}] ${resp.url()}`);
      }
    });

    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!text.includes('Firebase') && !text.includes('fetch') && !text.includes('404') && !text.includes('403')) {
          consoleErrors.push(text);
        }
      }
    });

    page.on('pageerror', err => {
      if (!err.message.includes('Firebase') && !err.message.includes('fetch') && !err.message.includes('403')) {
        consoleErrors.push(err.message);
      }
    });

    console.log('\n--- PHASE 1: SECURITY & SECLUSION TEST (ABSENT FROM STAFF) ---');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    // Navigate to Staff view
    const navigatedStaff = await page.evaluate(() => {
      const staffBtn = document.querySelector('[data-target="staff"]');
      if (staffBtn) {
        staffBtn.click();
        return true;
      }
      return false;
    });

    if (!navigatedStaff) {
      throw new Error('Could not trigger navigation to Staff view via [data-target="staff"]');
    }
    await new Promise(r => setTimeout(r, 1000));

    // Assert that #bot-operations-radar is STRICTLY ABSENT from Staff view!
    const radarInStaff = await page.evaluate(() => {
      return document.getElementById('bot-operations-radar') !== null;
    });
    if (radarInStaff) {
      throw new Error('Security Breach: #bot-operations-radar was found on Staff page! It must be restricted to Admin menu only.');
    }
    console.log('  ✅ Verified: #bot-operations-radar is completely absent from Staff page.');

    console.log('\n--- PHASE 2: ADMIN MENU RELOCATION & MULTI-ACCOUNT ROTATION ---');
    // Mock admin authentication and navigate directly to views.admin('tab-bots')
    const navigatedAdmin = await page.evaluate(async () => {
      window.currentUser = { uid: '318843189', email: 'admin@bdc.com', displayName: 'R5 Leader' };
      window.systemAdmins = window.systemAdmins || {};
      window.systemAdmins['318843189'] = 'R5';
      window.isAdminUser = () => true;
      window.isGoogleAuthVerified = async () => true;
      window.getAdminLevel = () => 'R5';
      window.fetchRoster = async () => [];
      if (typeof window.views?.admin === 'function') {
        await window.views.admin('tab-bots');
        return true;
      }
      return false;
    });

    if (!navigatedAdmin) {
      throw new Error('Could not execute window.views.admin("tab-bots")');
    }
    await page.waitForSelector('#bot-operations-radar', { timeout: 10000 });

    // Verify Bot Operations Radar element physically exists inside #tab-bots
    const radarInAdmin = await page.evaluate(() => {
      const tabBots = document.getElementById('tab-bots');
      if (!tabBots) return { error: '#tab-bots not found' };
      const radar = tabBots.querySelector('#bot-operations-radar');
      if (!radar) return { error: '#bot-operations-radar not found inside #tab-bots' };
      const title = radar.querySelector('.bot-radar-title')?.textContent?.trim();
      const account = document.getElementById('bot-radar-account-val')?.textContent?.trim();
      const badge = document.getElementById('bot-radar-badge-el')?.textContent?.trim();
      return { found: true, title, account, badge };
    });

    if (!radarInAdmin || !radarInAdmin.found) {
      throw new Error('Assertion Failed: ' + (radarInAdmin?.error || 'Radar not found in Admin Bots tab'));
    }
    console.log(`  ✅ #bot-operations-radar verified in Admin Bots tab: Account="${radarInAdmin.account}", Badge="${radarInAdmin.badge}"`);

    // Verify Real Visual DOM Mutation: Simulate Multi-Account Rotation (Guardian -> Bisquick -> Shrimp Cooldown)
    console.log('\n--- PHASE 3: DYNAMIC ACCOUNT ROTATION & COOLDOWN TEST ---');
    const mutationResult = await page.evaluate(() => {
      if (typeof window.updateBotOperationsRadarDom === 'function') {
        // Step A: Guardian Active
        window.latestBotStatus = {
          status: 'ACTIVE',
          account: 'Guardian (Inst 1)',
          stage: 'Wilderness / Routine Tasks',
          secondsLeft: 0,
          totalBots: 1,
          shortTime: '10:45 PM',
          receivedAt: Date.now()
        };
        window.updateBotOperationsRadarDom();
        const accountA = document.getElementById('bot-radar-account-val')?.textContent?.trim();
        const badgeA = document.getElementById('bot-radar-badge-el')?.textContent?.trim();
        const clockA = document.getElementById('bot-radar-clock')?.textContent?.trim();
        const labelA = document.getElementById('bot-radar-timer-label')?.textContent?.trim();
        const progressWidthA = document.getElementById('bot-radar-progress-fill')?.style?.width;

        // Step B: Bisquick Active
        window.latestBotStatus = {
          status: 'ACTIVE',
          account: 'Bisquick (Inst 11)',
          stage: 'Wilderness / Routine Tasks',
          secondsLeft: 0,
          totalBots: 1,
          shortTime: '10:46 PM',
          receivedAt: Date.now()
        };
        window.updateBotOperationsRadarDom();
        const accountB = document.getElementById('bot-radar-account-val')?.textContent?.trim();

        // Step C: Shrimp Cooldown
        window.latestBotStatus = {
          status: 'COOLDOWN',
          account: 'ShrimpLeprechaun (Inst 14)',
          stage: 'Resting on City Tab',
          secondsLeft: 590,
          totalBots: 1,
          shortTime: '10:47 PM',
          receivedAt: Date.now()
        };
        window.updateBotOperationsRadarDom();
        const accountC = document.getElementById('bot-radar-account-val')?.textContent?.trim();
        const badgeC = document.getElementById('bot-radar-badge-el')?.textContent?.trim();
        const clockC = document.getElementById('bot-radar-clock')?.textContent?.trim();
        const labelC = document.getElementById('bot-radar-timer-label')?.textContent?.trim();
        const cardC = document.getElementById('bot-operations-radar');

        return {
          accountA,
          badgeA,
          clockA,
          labelA,
          progressWidthA,
          accountB,
          accountC,
          badgeC,
          clockC,
          labelC,
          hasCooldownBorder: cardC?.classList?.contains('border-cooldown')
        };
      }
      return null;
    });

    if (!mutationResult) {
      throw new Error('Assertion Failed: window.updateBotOperationsRadarDom function not found!');
    }
    if (mutationResult.accountA !== 'Guardian (Inst 1)' || mutationResult.accountB !== 'Bisquick (Inst 11)' || mutationResult.accountC !== 'ShrimpLeprechaun (Inst 14)' || !mutationResult.hasCooldownBorder) {
      throw new Error(`Assertion Failed: Multi-account rotation did not mutate DOM accurately! Result: ${JSON.stringify(mutationResult)}`);
    }
    if (mutationResult.clockA !== 'ROUTINES RUNNING' || mutationResult.labelA !== 'Cooldown Stage:' || mutationResult.progressWidthA !== '100%') {
      throw new Error(`Assertion Failed: ACTIVE status clock/label/progress failed! Result: ${JSON.stringify(mutationResult)}`);
    }
    if (mutationResult.clockC !== '00:09:50' || mutationResult.labelC !== 'Cooldown Countdown:') {
      throw new Error(`Assertion Failed: COOLDOWN status clock/label failed! Result: ${JSON.stringify(mutationResult)}`);
    }
    console.log(`  ✅ Multi-account rotation & Real-time DOM clock/progress verified:`);
    console.log(`     1. ${mutationResult.accountA} -> Badge="${mutationResult.badgeA}", Clock="${mutationResult.clockA}", Progress="${mutationResult.progressWidthA}"`);
    console.log(`     2. ${mutationResult.accountB} -> Active Switch`);
    console.log(`     3. ${mutationResult.accountC} -> Badge="${mutationResult.badgeC}", Clock="${mutationResult.clockC}", Label="${mutationResult.labelC}" (BorderCooldown=${mutationResult.hasCooldownBorder})`);

    // Responsive Audit across Mobile, Tablet, Desktop
    console.log('\n--- PHASE 3: RESPONSIVE OVERFLOW AUDIT ---');
    const viewports = [
      { name: 'Desktop (1280x800)', width: 1280, height: 800 },
      { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      { name: 'Mobile (375x667)', width: 375, height: 667 }
    ];

    for (const vp of viewports) {
      await page.setViewport({ width: vp.width, height: vp.height });
      await new Promise(r => setTimeout(r, 400));
      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth + 2;
      });
      if (overflow) {
        throw new Error(`Assertion Failed: Horizontal overflow detected on ${vp.name}`);
      }
      console.log(`  ✅ ${vp.name}: Zero horizontal overflow verified.`);
    }

    // Zero Console Errors Check
    console.log('\n--- PHASE 4: CONSOLE ERROR AUDIT ---');
    if (consoleErrors.length > 0) {
      throw new Error(`Fatal console errors encountered:\n${consoleErrors.join('\n')}`);
    }
    console.log('  ✅ Zero fatal console errors detected.');

    console.log('\n🎉 ALL HEADLESS CHROME BROWSER ASSERTIONS PASSED 100%!\n');
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
    process.exit(exitCode);
  }
});
