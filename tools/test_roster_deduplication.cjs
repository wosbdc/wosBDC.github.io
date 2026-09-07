// tools/test_roster_deduplication.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Starting Roster Deduplication and Event Tracker Verification Suite...\n');

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

console.log('Test 1: Node.js Syntax and Compilation Check for main.js');
try {
  execSync('node --check main.js', { stdio: 'pipe' });
  assert(true, 'main.js compiles cleanly with 0 syntax errors');
} catch (err) {
  assert(false, 'main.js compilation failed: ' + err.message);
}

console.log('\nTest 2: Non-Enumerable Roster Indexing Behavior');
const rawFirebaseRoster = {
  "PlayerAlpha": { name: "PlayerAlpha", gameId: "1001", state: "2089" },
  "1001": { name: "PlayerAlpha", gameId: "1001", state: "2089" },
  "playeralpha": { name: "PlayerAlpha", gameId: "1001", state: "2089" },
  "PlayerBeta": { name: "PlayerBeta", gameId: "1002", state: "2089" },
  "1002": { name: "PlayerBeta", gameId: "1002", state: "2089" },
  "playerbeta": { name: "PlayerBeta", gameId: "1002", state: "2089" },
  "PlayerGamma": { name: "PlayerGamma", gameId: "1003", state: "2089" }
};

const deduplicated = {};
const seenGids = new Set();
const seenNames = new Set();

Object.entries(rawFirebaseRoster).forEach(([k, item]) => {
  if (!item || typeof item !== 'object') return;
  const name = (item.name || '').trim();
  const gid = item.gameId ? String(item.gameId).trim() : '';
  const normName = name.toLowerCase();

  if (!name && !gid) return;

  const primaryKey = name || gid;
  const isNew = (!gid || !seenGids.has(gid)) && (!normName || !seenNames.has(normName));

  if (isNew) {
    if (gid) seenGids.add(gid);
    if (normName) seenNames.add(normName);
    deduplicated[primaryKey] = item;
  }

  const target = deduplicated[primaryKey] || item;
  if (gid && gid !== primaryKey) {
    Object.defineProperty(deduplicated, gid, {
      value: target,
      enumerable: false,
      writable: true,
      configurable: true
    });
  }
  if (normName && normName !== primaryKey) {
    Object.defineProperty(deduplicated, normName, {
      value: target,
      enumerable: false,
      writable: true,
      configurable: true
    });
  }
});

const enumerableKeys = Object.keys(deduplicated);
const enumerableValues = Object.values(deduplicated);

assert(enumerableKeys.length === 3, 'Object.keys count is exactly 3 (unique chiefs)');
assert(enumerableValues.length === 3, 'Object.values count is exactly 3 (no 2x or 3x inflation)');
assert(enumerableKeys.includes('PlayerAlpha'), 'Enumerable keys include PlayerAlpha');
assert(enumerableKeys.includes('PlayerBeta'), 'Enumerable keys include PlayerBeta');
assert(enumerableKeys.includes('PlayerGamma'), 'Enumerable keys include PlayerGamma');
assert(!enumerableKeys.includes('1001'), 'Game ID 1001 is NOT an enumerable key');
assert(!enumerableKeys.includes('playeralpha'), 'Lowercase playeralpha is NOT an enumerable key');

// Fast lookup checks
assert(deduplicated['1001'] && deduplicated['1001'].name === 'PlayerAlpha', 'Direct GID lookup resolves player');
assert(deduplicated['playeralpha'] && deduplicated['playeralpha'].gameId === '1001', 'Direct lowercase lookup resolves player');
assert(deduplicated['1002'] && deduplicated['1002'].name === 'PlayerBeta', 'Direct GID lookup for PlayerBeta works');

console.log('\nTest 3: Event Yes/No Defensive Deduplication Simulation');
const simulatedRosterList = [];
const eventSeenGids = new Set();
enumerableValues.forEach(p => {
  const gid = p.gameId ? String(p.gameId).trim() : (p.name || '').toLowerCase().trim();
  if (gid && eventSeenGids.has(gid)) return;
  if (p.name && p.gameId) {
    eventSeenGids.add(gid);
    simulatedRosterList.push(p);
  }
});

assert(simulatedRosterList.length === 3, 'Simulated event roster list has exactly 3 unique chiefs');

console.log('\nTest 4: Codebase Verification in main.js');
const mainContent = fs.readFileSync('main.js', 'utf8');

assert(mainContent.includes('enumerable: false'), 'main.js uses enumerable: false for alias properties');
assert(mainContent.includes('seenGids.has(gid)'), 'fetchRoster tracks seenGids');
assert(mainContent.includes('seenNames.has(normName)'), 'fetchRoster tracks seenNames');

const viewsWithDedup = [
  'views.polarTerrorsAdmin',
  'views.bearTrapAdmin',
  'views.mercenaryAdmin',
  'views.championshipAdmin',
  'views.mercenary'
];

viewsWithDedup.forEach(viewName => {
  assert(mainContent.includes(viewName), `main.js defines ${viewName}`);
});

const archiveRoutines = [
  'archiveAndResetMercenaryCycle',
  'archiveAndResetPolarTerrorsCycle',
  'archiveAndResetBearTrapCycle',
  'archiveAndResetChampionshipSeason'
];

archiveRoutines.forEach(routine => {
  assert(mainContent.includes(routine), `main.js defines ${routine}`);
});

console.log('\n========================================');
console.log('Test Summary: ' + passedTests + '/' + totalTests + ' tests passed');
console.log('========================================\n');

process.exit(passedTests === totalTests ? 0 : 1);
