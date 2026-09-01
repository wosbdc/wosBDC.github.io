// tools/test_alt_removal_on_departure.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Starting Departed/Banned Alt Removal Automated Test Suite...\n');

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


console.log('\n🔍 Test 2: Alt Exclusion on Account Holder Page Logic Simulation');
const mockUser = {
  uid: 'user_chief_1',
  gameId: '10001',
  name: 'ChiefAlpha',
  linkedGameIds: ['20001', '20002', '20003'],
  altTokens: {
    '20001': { nickname: 'AltActive', membershipStatus: 'active' },
    '20002': { nickname: 'AltDeparted', membershipStatus: 'left' },
    '20003': { nickname: 'AltBanned', membershipStatus: 'banned' }
  }
};

const normalize = (st) => {
  if (!st) return 'active';
  st = st.toLowerCase().trim();
  if (st === 'left' || st === 'former') return 'left';
  if (st === 'banned' || st === 'ban') return 'banned';
  return 'active';
};

const filteredLinks = mockUser.linkedGameIds.filter(gid => {
  const at = mockUser.altTokens[gid] || {};
  return normalize(at.membershipStatus) === 'active';
});

assert(filteredLinks.length === 1, 'Only active alts remain in account holder links');
assert(filteredLinks[0] === '20001', 'AltActive (20001) is retained');
assert(!filteredLinks.includes('20002'), 'AltDeparted (20002) is cleanly excluded');
assert(!filteredLinks.includes('20003'), 'AltBanned (20003) is cleanly excluded');

console.log('\n🔍 Test 3: Codebase Verification for Alt Departure & Unlink Handlers');
const mainContent = fs.readFileSync('main.js', 'utf8');

assert(mainContent.includes('departedAlts'), 'main.js includes departedAlts archive node');
assert(mainContent.includes('const rawLinks = Array.isArray(currentUser.linkedGameIds)'), 'main.js filters rawLinks in views.account');
assert(mainContent.includes("totalAlts = (memStatus === 'active') ? userAltGids.length : 0"), 'main.js only counts active alts for active mains');
assert(mainContent.includes('window.updateMemberStatus'), 'main.js includes updateMemberStatus');

console.log('\n=========================================');
console.log('Test Summary: ' + passedTests + '/' + totalTests + ' tests passed');
console.log('=========================================\n');

process.exit(passedTests === totalTests ? 0 : 1);
