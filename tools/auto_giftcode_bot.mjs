/**
 * ============================================================================
 * ALLIANCE AUTO GIFT CODE BOT DAEMON (LOCAL BRIDGE & NODE.JS RUNNER)
 * ============================================================================
 * Autonomous Background Gift Code Scraper, Century Games Validator, and
 * Mass Auto-Redeemer for Whiteout Survival Alliance BDC.
 *
 * Usage:
 *   node tools/auto_giftcode_bot.mjs          # Continuous loop mode (every 45 mins)
 *   node tools/auto_giftcode_bot.mjs --once   # Run a single sweep and exit
 */

import https from 'https';
import http from 'http';
import crypto from 'crypto';

const FIREBASE_DB_URL = 'https://wos-dashboard-38d4c-default-rtdb.firebaseio.com';
const CENTURY_API_SECRET = 'tB87#kPtkxqOS2';
const CENTURY_API_URL = 'https://wos-giftcode-api.centurygame.com/api/gift_code';
const TEST_PLAYER_ID = '318843189'; // Reference player ID for validity checks
const DEFAULT_KID = '2089';

const SCRAPE_SOURCES = [
  { name: 'WosRewards', url: 'https://www.wosrewards.com/giftcodes' },
  { name: 'GamsGo', url: 'https://www.gamsgo.com/blog/whiteout-survival-gift-codes' },
  { name: 'DotGG', url: 'https://dotgg.gg/whiteout-survival/gift-codes/' },
  { name: 'ProGameGuides', url: 'https://progameguides.com/whiteout-survival/whiteout-survival-codes/' },
  { name: 'PocketGamer', url: 'https://www.pocketgamer.com/whiteout-survival/codes/' }
];

const IGNORED_WORDS = new Set([
  'WHITEOUT', 'SURVIVAL', 'CENTURY', 'GAMES', 'DISCORD', 'FACEBOOK', 'REDDIT',
  'YOUTUBE', 'GOOGLE', 'CHROME', 'APPLE', 'ANDROID', 'UPDATE', 'EXPIRED',
  'ACTIVE', 'REWARD', 'REWARDS', 'GIFTCODE', 'PLAYERS', 'AVATAR', 'STOVE',
  'FURNACE', 'STATUS', 'SERVER', 'ONLINE', 'OFFLINE', 'METHOD', 'REPORT',
  'CODES', 'CODE', 'ADDED', 'LIST', 'CLAIM', 'EXCHANGE', 'PAGE', 'NOTES',
  'LINKS', 'CHECK', 'TOTAL', 'SOURCE', 'TABLE', 'TITLE', 'HEADER', 'FOOTER'
]);

// Helper for HTTP/HTTPS requests
function fetchUrl(targetUrl, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(targetUrl);
    const client = urlObj.protocol === 'http:' ? http : https;

    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,application/json,*/*;q=0.8',
        ...(options.headers || {})
      },
      timeout: 12000
    };

    const req = client.request(targetUrl, reqOptions, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location, options));
      }

      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

// REST helper for Firebase Realtime Database
async function getFirebase(path) {
  try {
    const res = await fetchUrl(`${FIREBASE_DB_URL}/${path}.json`);
    return JSON.parse(res.body);
  } catch (e) {
    console.warn(`[Firebase Read Error] /${path}:`, e.message);
    return null;
  }
}

async function setFirebase(path, data) {
  try {
    const res = await fetchUrl(`${FIREBASE_DB_URL}/${path}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return JSON.parse(res.body);
  } catch (e) {
    console.warn(`[Firebase Write Error] /${path}:`, e.message);
    return null;
  }
}

async function updateFirebase(path, data) {
  try {
    const res = await fetchUrl(`${FIREBASE_DB_URL}/${path}.json`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return JSON.parse(res.body);
  } catch (e) {
    console.warn(`[Firebase Update Error] /${path}:`, e.message);
    return null;
  }
}

// Century Games Gift Code Redemption API with Signature
async function testOrRedeemCenturyCode(roleId, cdk, kid = DEFAULT_KID) {
  const cleanId = String(roleId || '').trim();
  const cleanCode = String(cdk || '').trim().toUpperCase();
  const t = Math.floor(Date.now() / 1000);

  // Alphabetical param order: cdk, fid, kid, time
  const signStr = `cdk=${cleanCode}&fid=${cleanId}&kid=${kid}&time=${t}${CENTURY_API_SECRET}`;
  const sign = crypto.createHash('md5').update(signStr).digest('hex');

  const formBody = `cdk=${encodeURIComponent(cleanCode)}&fid=${encodeURIComponent(cleanId)}&kid=${encodeURIComponent(kid)}&time=${t}&sign=${sign}`;

  try {
    const res = await fetchUrl(CENTURY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Origin': 'https://wos-giftcode.centurygame.com',
        'Referer': 'https://wos-giftcode.centurygame.com/'
      },
      body: formBody
    });

    const json = JSON.parse(res.body || '{}');
    const msg = (json.msg || '').toLowerCase();

    if (json.code === 0 || json.status === 'success') {
      return { success: true, status: 'success', msg: json.msg || 'Redeemed successfully' };
    }
    if (msg.includes('already') || msg.includes('received') || msg.includes('has been claimed') || json.code === 20002) {
      return { success: true, status: 'already_claimed', msg: json.msg || 'Already claimed' };
    }
    if (msg.includes('expired') || msg.includes('not exist') || msg.includes('does not exist') || json.code === 20001 || json.code === 20005) {
      return { success: false, status: 'expired', msg: json.msg || 'Expired or invalid code' };
    }
    return { success: false, status: 'error', msg: json.msg || 'Unknown API response', rawCode: json.code };
  } catch (err) {
    return { success: false, status: 'network_error', msg: err.message };
  }
}

async function sendDiscordGiftCodeAlert(code, successCount, totalTargets) {
  const webhookUrl = "https://discord.com/api/webhooks/1537465776750203060/pjDG_gWRnnS6QyRXaxvrudoq7inLhFi_4xjk-2WfpuiTp3gNJVCS4eGuH0y9CoUL4dUY";
  const payload = {
    embeds: [{
      title: "🎁 ALLIANCE PERK BOT — NEW GIFT CODE CLAIMED!",
      description: `🎉 **New Promo Code Found:** \`${code}\`\n\n⚡ **Mass Auto-Redeem Status:**\n• ✅ **Successfully Claimed:** \`${successCount}\` Chiefs & Alts\n• 👥 **Total Alliance Targets:** \`${totalTargets}\` Accounts\n\nCheck your in-game mailbox to collect your rewards! 💎📦`,
      color: 15483801,
      footer: { text: "Alliance Gatekeeper • Rewards Bot 🤖" },
      timestamp: new Date().toISOString()
    }]
  };
  try {
    const res = await fetch(`${webhookUrl}?wait=true`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      console.log(`📢 [Discord Alert] Sent new gift code announcement for [${code}]!`);
    }
  } catch (e) {
    console.warn(`Discord alert warning: ${e.message}`);
  }
}

// Scrape candidate codes from web pages
async function scrapeCandidateCodes() {
  const candidateCodes = new Set();
  console.log(`🔍 [Scraper] Checking ${SCRAPE_SOURCES.length} public sources...`);

  for (const src of SCRAPE_SOURCES) {
    try {
      console.log(`   🌐 Fetching ${src.name} (${src.url})...`);
      const res = await fetchUrl(src.url);
      if (res.status !== 200 || !res.body) continue;

      // Specialized parser for WosRewards.com
      if (src.name === 'WosRewards' || src.url.includes('wosrewards.com')) {
        const activeMatch = res.body.match(/Active Codes<\/div>([\s\S]*?)<details/i);
        const targetHtml = activeMatch ? activeMatch[1] : res.body;
        const codeRegex = /data-code="([^"]+)"/g;
        let m;
        while ((m = codeRegex.exec(targetHtml)) !== null) {
          const code = m[1].trim();
          if (code.length >= 4 && code.length <= 25 && !IGNORED_WORDS.has(code.toUpperCase())) {
            candidateCodes.add(code);
          }
        }
      }

      // Extract uppercase words or alphanumeric tokens inside strong, code, b, td tags
      const patterns = [
        /<(?:strong|b|code)[^>]*>\s*([A-Za-z0-9_]{4,20})\s*<\/(?:strong|b|code)>/gi,
        /<td[^>]*>\s*([A-Za-z0-9_]{4,20})\s*<\/td>/gi,
        /(?:code|cdk|coupon|gift)[:\s]+([A-Za-z0-9_]{4,20})/gi
      ];

      for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(res.body)) !== null) {
          const raw = match[1].trim().toUpperCase();
          if (raw.length >= 4 && raw.length <= 20 && !IGNORED_WORDS.has(raw) && !/^\d+$/.test(raw)) {
            candidateCodes.add(raw);
          }
        }
      }
    } catch (e) {
      console.warn(`   ⚠️ Scraper warning for ${src.name}:`, e.message);
    }
  }

  console.log(`✅ [Scraper] Extracted ${candidateCodes.size} unique candidate promo code(s).`);
  return Array.from(candidateCodes);
}

// Main autonomous sweep routine
export async function runAutoGiftCodeSweep() {
  console.log('\n===============================================================');
  console.log(`🤖 [AUTO GIFT CODE BOT] Starting Sweep at ${new Date().toLocaleString()}`);
  console.log('===============================================================');

  const startTime = Date.now();
  const existingHistory = (await getFirebase('gift_codes_history')) || {};
  const candidates = await scrapeCandidateCodes();

  let newlyFoundCodes = [];
  let validNewCodes = [];

  for (const code of candidates) {
    const cleanKey = code.replace(/[^A-Za-z0-9_-]/g, '_');
    if (existingHistory[cleanKey]) {
      // Code already known in database
      continue;
    }

    newlyFoundCodes.push(code);
    console.log(`\n🧪 [Testing Candidate] [${code}] against Century Games API...`);
    const testRes = await testOrRedeemCenturyCode(TEST_PLAYER_ID, code);

    if (testRes.status === 'success' || testRes.status === 'already_claimed') {
      console.log(`🎉 [VERIFIED ACTIVE] Code [${code}] is valid! (${testRes.msg})`);
      validNewCodes.push(code);

      // Register code in Firebase
      await setFirebase(`gift_codes_history/${cleanKey}`, {
        code: code,
        status: 'active',
        description: `Auto-discovered via Web Scraper on ${new Date().toLocaleDateString()}`,
        createdAt: new Date().toISOString(),
        createdBy: 'AutoBot Scraper',
        lastDispatchedAt: new Date().toISOString(),
        stats: { total: 0, success: 0, already: 0, failed: 0 }
      });
    } else if (testRes.status === 'expired') {
      console.log(`🔴 [EXPIRED / INVALID] Code [${code}] skipped.`);
      await setFirebase(`gift_codes_history/${cleanKey}`, {
        code: code,
        status: 'expired',
        description: 'Auto-tested and found expired',
        createdAt: new Date().toISOString(),
        createdBy: 'AutoBot Scraper'
      });
    } else {
      console.log(`⚠️ [UNVERIFIED / ERROR] Code [${code}]: ${testRes.msg}`);
    }

    await new Promise(r => setTimeout(r, 600));
  }

  // If new valid codes were found, auto-redeem for all enrolled alliance members!
  let totalClaimsDelivered = 0;
  if (validNewCodes.length > 0) {
    console.log(`\n🚀 [Auto-Redeem] Processing ${validNewCodes.length} new code(s) for all enrolled accounts...`);

    const usersObj = (await getFirebase('users')) || {};
    const enrolledObj = (await getFirebase('giftcode_bot')) || {};

    const targetsMap = new Map();

    // 1. Enrolled main accounts
    Object.entries(enrolledObj).forEach(([gid, rec]) => {
      if (rec && rec.enrolled !== false) {
        targetsMap.set(String(gid).trim(), rec.chiefName || rec.name || `Chief ${gid}`);
      }
    });

    // 2. Verified linked alts
    Object.values(usersObj).forEach(u => {
      if (u && u.linkedGameIds && Array.isArray(u.linkedGameIds)) {
        u.linkedGameIds.forEach(altId => {
          const cleanAltId = String(altId).trim();
          if (cleanAltId && !targetsMap.has(cleanAltId)) {
            targetsMap.set(cleanAltId, (u.altTokens && u.altTokens[cleanAltId]?.nickname) || `Alt ${cleanAltId}`);
          }
        });
      }
    });

    const targets = Array.from(targetsMap.entries()).map(([gid, name]) => ({ gameId: gid, name: name }));
    console.log(`👥 Target Audience: ${targets.length} enrolled chiefs & alts.`);

    for (const code of validNewCodes) {
      const cleanKey = code.replace(/[^A-Za-z0-9_-]/g, '_');
      let successCount = 0;
      let alreadyCount = 0;
      let failedCount = 0;

      for (let i = 0; i < targets.length; i++) {
        const item = targets[i];
        const res = await testOrRedeemCenturyCode(item.gameId, code);

        if (res.status === 'success') {
          successCount++;
          console.log(`   [${i + 1}/${targets.length}] ${item.name} (${item.gameId}): ✅ Claimed!`);
        } else if (res.status === 'already_claimed') {
          alreadyCount++;
          console.log(`   [${i + 1}/${targets.length}] ${item.name} (${item.gameId}): ⏩ Already Had`);
        } else {
          failedCount++;
          console.log(`   [${i + 1}/${targets.length}] ${item.name} (${item.gameId}): ❌ ${res.msg}`);
        }

        await new Promise(r => setTimeout(r, 250));
      }

      totalClaimsDelivered += successCount;

      // Update final stats in Firebase
      await updateFirebase(`gift_codes_history/${cleanKey}`, {
        lastDispatchedAt: new Date().toISOString(),
        stats: {
          total: targets.length,
          success: successCount,
          already: alreadyCount,
          failed: failedCount
        }
      });

      // Broadcast Discord Alert
      await sendDiscordGiftCodeAlert(code, successCount, targets.length);
    }
  }

  // Update Telemetry & Heartbeat in Firebase
  const historyList = Object.values((await getFirebase('gift_codes_history')) || {});
  const activeCodesCount = historyList.filter(c => c.status === 'active').length;
  let lifetimeClaims = 0;
  historyList.forEach(c => {
    if (c.stats && c.stats.success) lifetimeClaims += Number(c.stats.success) || 0;
  });

  const nextSweepTime = new Date(Date.now() + 45 * 60 * 1000).toISOString();
  const botTelemetry = {
    status: 'online',
    lastSweep: new Date().toISOString(),
    nextSweep: nextSweepTime,
    durationMs: Date.now() - startTime,
    sourcesChecked: SCRAPE_SOURCES.map(s => s.name),
    totalTrackedCodes: historyList.length,
    activeCodesCount: activeCodesCount,
    lifetimeClaimsDelivered: lifetimeClaims,
    lastDiscoveredCode: validNewCodes.length > 0 ? validNewCodes[validNewCodes.length - 1] : (historyList[0]?.code || 'WOS0815'),
    recentLog: `Sweep completed: ${candidates.length} candidate(s) checked, ${validNewCodes.length} new code(s) verified & redeemed.`
  };

  await setFirebase('system/giftcode_bot_status', botTelemetry);

  console.log('\n===============================================================');
  console.log(`✅ [SWEEP FINISHED] Status updated in Firebase!`);
  console.log(`   • Sources Checked: ${SCRAPE_SOURCES.map(s => s.name).join(', ')}`);
  console.log(`   • New Valid Codes: ${validNewCodes.length}`);
  console.log(`   • Total Alliance Claims This Run: ${totalClaimsDelivered}`);
  console.log(`   • Next Auto-Sweep Scheduled: ${new Date(nextSweepTime).toLocaleTimeString()}`);
  console.log('===============================================================\n');

  return botTelemetry;
}

// Auto-execution check
const isRunOnce = process.argv.includes('--once');
if (isRunOnce) {
  runAutoGiftCodeSweep().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
} else {
  // Start continuous scheduler (runs sweep immediately, then every 45 minutes)
  runAutoGiftCodeSweep().catch(console.error);
  setInterval(() => {
    runAutoGiftCodeSweep().catch(console.error);
  }, 45 * 60 * 1000);
}
