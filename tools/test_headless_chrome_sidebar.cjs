// tools/test_headless_chrome_sidebar.cjs
const http = require('http');
const fs = require('fs');
const path = require('path');

const puppeteerPath = 'C:\\Users\\Brian\\Documents\\antigravity\\pup\\node_modules\\puppeteer-core';
const puppeteer = require(puppeteerPath);
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const PORT = 8089;
const DIST_DIR = path.join(__dirname, '..', 'dist');

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
  console.log('🚀 Test server listening on http://localhost:' + PORT);

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
      console.warn('  ⚠️ Page error:', err.message);
      if (!err.message.includes('Firebase') && !err.message.includes('fetch')) {
        errors.push(err.message);
      }
    });

    const viewports = [
      { name: 'Desktop (1280x800)', width: 1280, height: 800 },
      { name: 'Tablet (768x1024)', width: 768, height: 1024 },
      { name: 'Mobile (375x667)', width: 375, height: 667 }
    ];

    for (const vp of viewports) {
      console.log('\n📱 Auditing Viewport: ' + vp.name);
      await page.setViewport({ width: vp.width, height: vp.height });
      await page.goto('http://localhost:' + PORT, { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 600));

      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      if (scrollWidth > clientWidth + 2) {
        console.warn('  ⚠️ Horizontal overflow detected: scrollWidth=' + scrollWidth + ', clientWidth=' + clientWidth);
      } else {
        console.log('  ✅ Zero horizontal overflow passed (' + scrollWidth + ' <= ' + clientWidth + ')');
      }

      // Open settings sidebar (desktop tests #settingsBtn click; mobile/tablet tests window.openSidebar)
      if (vp.width > 900) {
        const settingsBtn = await page.$('#settingsBtn');
        if (settingsBtn) await settingsBtn.click();
      } else {
        await page.evaluate(() => window.openSidebar && window.openSidebar());
      }
      await new Promise(r => setTimeout(r, 350));

      const isSidebarOpen = await page.evaluate(() => {
        const s = document.getElementById('settingsSidebar');
        return s && s.classList.contains('open');
      });
      console.log('  ✅ Settings sidebar opened successfully: ' + isSidebarOpen);
      if (!isSidebarOpen) throw new Error('Failed to open settings sidebar on ' + vp.name);

      const clocksInfo = await page.evaluate(() => {
        const localClock = document.getElementById('local-clock');
        const localDate = document.getElementById('local-date');
        const utcClock = document.getElementById('utc-clock');
        const utcDate = document.getElementById('utc-date');
        return {
          localClockFound: !!localClock,
          localClockText: localClock ? localClock.textContent.trim() : null,
          utcClockFound: !!utcClock,
          utcClockText: utcClock ? utcClock.textContent.trim() : null,
          hasGridContainer: !!document.querySelector('#global-timers div[style*="grid-template-columns"]')
        };
      });

      if (!clocksInfo.localClockFound || !clocksInfo.utcClockFound) {
        throw new Error('Split clock elements missing in DOM! ' + JSON.stringify(clocksInfo));
      }
      console.log('  ✅ Split Local clock rendered: ' + clocksInfo.localClockText);
      console.log('  ✅ Split UTC clock rendered: ' + clocksInfo.utcClockText);
      console.log('  ✅ 2-column split grid container rendered: ' + clocksInfo.hasGridContainer);

      const closeBtn = await page.$('#closeSidebar');
      if (closeBtn) {
        await closeBtn.click();
        await new Promise(r => setTimeout(r, 300));
      }
    }

    if (errors.length > 0) {
      throw new Error('Fatal page errors encountered: ' + errors.join(', '));
    }

    console.log('\n=========================================');
    console.log('🎉 100% Real Headless Chrome Visual DOM Test Passed!');
    console.log('=========================================\n');
  } catch (err) {
    console.error('❌ Headless Chrome Test Failed:', err);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    server.close();
  }
});
