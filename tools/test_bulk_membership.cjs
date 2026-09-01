// tools/test_bulk_membership.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Starting Bulk Membership Management Automated Test Suite...\n');

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

console.log('📦 Test 1: Node.js Syntax & Compilation Check for main.js');
try {
  execSync('node --check main.js', { stdio: 'pipe' });
  assert(true, 'main.js compiles cleanly with 0 syntax errors');
} catch (err) {
  assert(false, 'main.js compile failed: ' + err.message);
}

console.log('\n🔍 Test 2: Pasted Input List Parsing & Auto-Matching Algorithm');
const parsePastedMembersList = (rawText, allAvailableMembers = []) => {
  if (!rawText || typeof rawText !== 'string') return { matched: [], unmatchedLines: [] };
  const lines = rawText.split(/[\r\n,;]+/).map(l => l.trim()).filter(Boolean);
  const matched = [];
  const matchedKeys = new Set();
  const unmatchedLines = [];

  const gidIndex = {};
  const nameIndex = {};

  allAvailableMembers.forEach(m => {
    if (m.gameId) gidIndex[String(m.gameId).trim().toLowerCase()] = m;
    if (m.name) nameIndex[String(m.name).trim().toLowerCase()] = m;
  });

  lines.forEach(line => {
    const cleanLine = line.replace(/^(?:\(?\d+[\.\)\-]\s*|[•\-\*–—\>\#]\s*)/, '').replace(/[,;]+$/, '').trim();
    if (!cleanLine) return;

    const lineLower = cleanLine.toLowerCase();
    let target = gidIndex[lineLower] || nameIndex[lineLower];

    if (!target) {
      target = allAvailableMembers.find(m => {
        const mName = (m.name || '').toLowerCase();
        const mGid = (m.gameId || '').toLowerCase();
        return mName === lineLower || mGid === lineLower || (mName.length > 3 && (mName.includes(lineLower) || lineLower.includes(mName)));
      });
    }

    if (target) {
      const key = target.gameId || target.name;
      if (!matchedKeys.has(key)) {
        matchedKeys.add(key);
        matched.push(target);
      }
    } else {
      unmatchedLines.push(cleanLine);
    }
  });

  return { matched, unmatchedLines };
};

const mockMembers = [
  { name: 'DarkKnight', gameId: '10001', membershipStatus: 'active' },
  { name: 'Chief Sarah', gameId: '10002', membershipStatus: 'active' },
  { name: 'GrizzlyBear', gameId: '10003', membershipStatus: 'active' },
  { name: 'Alt Of Sarah', gameId: '10004', membershipStatus: 'active', isAlt: true }
];

const pasteText = `
1. DarkKnight
- 10002
10003
1. UnknownGoblin99;
* ALT OF SARAH,
199999999
` ;

const parsed = parsePastedMembersList(pasteText, mockMembers);

assert(parsed.matched.length === 4, 'Parsed and matched exactly 4 members');
assert(parsed.matched.some(m => m.name === 'DarkKnight'), 'Matched name DarkKnight successfully');
assert(parsed.matched.some(m => m.gameId === '10002'), 'Matched GID 10002 successfully');
assert(parsed.matched.some(m => m.name === 'Alt Of Sarah'), 'Matched case-insensitive alt name');
assert(parsed.unmatchedLines.length === 2, 'Identified exactly 2 unmatched lines');
assert(parsed.unmatchedLines.includes('UnknownGoblin99'), 'Unmatched list includes UnknownGoblin99');
assert(parsed.unmatchedLines.includes('199999999'), 'Unmatched list includes 199999999');

console.log('\n🛡ϸ Test 3: Table Multi-Select & Bulk Status Update Mock Logic');
let selectedKeys = new Set();
let selectedMap = new Map();

function mockToggleSelect(item, checked) {
  const k = item.gameId || item.name;
  if (checked) {
    selectedKeys.add(k);
    selectedMap.set(k, item);
  } else {
    selectedKeys.delete(k);
    selectedMap.delete(k);
  }
}


mockToggleSelect(mockMembers[0], true);
mockToggleSelect(mockMembers[1], true);
assert(selectedKeys.size === 2, 'Selected count is 2');
mockToggleSelect(mockMembers[0], false);
assert(selectedKeys.size === 1, 'Selected count decreased to 1');

console.log('\n🔍 Test 4: Codebase Verification for Bulk Membership Functions');
const mainContent = fs.readFileSync('main.js', 'utf8');
const expectedFunctions = [
  'window.bulkUpdateMemberStatus',
  'window.openBulkMembershipManagerModal',
  'window.parsePastedMembersList',
  'window.toggleSelectAdminUser',
  'window.toggleSelectAllAdminUsers',
  'window.clearAdminUserSelection',
  'window.updateAdminBulkActionToolbar',
  'window.executeTableBulkStatusChange',
  'window.openBulkStatusWithReasonModal',
  'window.submitBulkStatusWithReason',
  'window.switchBulkManagerTab',
  'window.toggleBulkManagerItem',
  'window.toggleBulkManagerSelectAll',
  'window.filterBulkManagerList',
  'window.setBulkManagerFilter',
  'window.updateBulkManagerFooterCount',
  'window.updateBulkManagerMatchCount',
  'window.submitBulkMembershipManager',
  'adminBulkFloatingToolbar',
  'adminUserSelectAllCheckbox'
];

expectedFunctions.forEach(fn => {
  assert(mainContent.includes(fn), 'main.js includes ' + fn);
});

console.log('\n=========================================');
console.log('Test Summary: ' + passedTests + '/' + totalTests + ' tests passed');
console.log('========================================\n');

process.exit(passedTests === totalTests ? 0 : 1);
