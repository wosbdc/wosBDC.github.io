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

    console.log('\n--- PHASE 1: DESKTOP RENDERING & NAVIGATION ---');
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 1000));

    // Navigate to Staff view
    const navigated = await page.evaluate(() => {
      const staffBtn = document.querySelector('[data-target="staff"]');
      if (staffBtn) {
        staffBtn.click();
        return true;
      }
      return false;
    });

    if (!navigated) {
      throw new Error('Could not trigger navigation to Staff view via [data-target="staff"]');
    }
    console.log('  ✅ Navigated to Staff view successfully');
    await new Promise(r => setTimeout(r, 1200));

    // Verify Bot Operations Radar element physically exists in the DOM
    const radarDetails = await page.evaluate(() => {
      const radar = document.getElementById('bot-operations-radar');
      if (!radar) return null;
      const title = radar.querySelector('.bot-radar-title')?.textContent?.trim();
      const account = document.getElementById('bot-radar-account-val')?.textContent?.trim();
      const badge = document.getElementById('bot-radar-badge-el')?.textContent?.trim();
      const clock = document.getElementById('bot-radar-clock')?.textContent?.trim();
      const stage = document.getElementById('bot-radar-stage-val')?.textContent?.trim();
      return { found: true, title, account, badge, clock, stage };
    });

    if (!radarDetails || !radarDetails.found) {
      throw new Error('Assertion Failed: #bot-operations-radar not rendered in DOM on Staff page!');
    }
    console.log(`  ✅ #bot-operations-radar rendered in DOM: Title="${radarDetails.title}", Account="${radarDetails.account}", Badge="${radarDetails.badge}", Stage="${radarDetails.stage}"`);

    // Verify Real Visual DOM Mutation: Simulate Live Telemetry Update
    console.log('\n--- PHASE 2: VISUAL DOM MUTATION TEST ---');
    const mutationResult = await page.evaluate(() => {
      if (typeof window.updateBotOperationsRadarDom === 'function') {
        window.latestBotStatus = {
          status: 'COOLDOWN',
          account: 'ShrimpLeprechaun',
          stage: 'City Rest Interval (10m)',
          secondsLeft: 350,
          totalBots: 1,
          shortTime: '10:05 PM',
          receivedAt: Date.now()
        };
        window.updateBotOperationsRadarDom();

        const badge = document.getElementById('bot-radar-badge-el');
        const clock = document.getElementById('bot-radar-clock');
        const stage = document.getElementById('bot-radar-stage-val');
        const card = document.getElementById('bot-operations-radar');

        return {
          badgeText: badge?.textContent?.trim(),
          isCooldownBadge: badge?.classList?.contains('cooldown'),
          stageText: stage?.textContent?.trim(),
          hasCooldownBorder: card?.classList?.contains('border-cooldown')
        };
      }
      return null;
    });

    if (!mutationResult) {
      throw new Error('Assertion Failed: window.updateBotOperationsRadarDom function not found!');
    }
    if (!mutationResult.badgeText.includes('COOLDOWN') || !mutationResult.isCooldownBadge || !mutationResult.hasCooldownBorder) {
      throw new Error(`Assertion Failed: DOM mutation did not update visual classes! Result: ${JSON.stringify(mutationResult)}`);
    }
    console.log(`  ✅ DOM dynamically mutated: Badge="${mutationResult.badgeText}" (cooldown class=${mutationResult.isCooldownBadge}), BorderCooldown=${mutationResult.hasCooldownBorder}, Stage="${mutationResult.stageText}"`);

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
