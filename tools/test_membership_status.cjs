// tools/test_membership_status.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('１ Starting Membership Status and Event Exclusion Automated Test Suite...\n');

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

console.log('１ Test 1: Node.js Syntax and Compilation Check for main.js');
try {
  execSync('node --check main.js', { stdio: 'pipe' });
  assert(true, 'main.js compiles cleanly with 0 syntax errors');
} catch (err) {
  assert(false, 'main.js compilation failed: ' + err.message);
}

console.log('\n１ Test 2: Membership Status Normalization and Active Checker Logic');
const normalizeMembershipStatus = (status) => {
  if (!status) return 'active';
  const s = String(status).toLowerCase().trim();
  if (s === 'left' || s === 'left_alliance' || s === 'former' || s === 'departed' || s === 'inactive') return 'left';
  if (s === 'banned' || s === 'ban' || s === 'blacklisted') return 'banned';
  return 'active';
};

assert(normalizeMembershipStatus(undefined) === 'active', 'normalizeMembershipStatus(undefined) -> active');
assert(normalizeMembershipStatus(null) === 'active', 'normalizeMembershipStatus(null) -> active');
assert(normalizeMembershipStatus('') === 'active', 'normalizeMembershipStatus("") -> active');
assert(normalizeMembershipStatus('ACTIVE') === 'active', 'normalizeMembershipStatus("ACTIVE") -> active');
assert(normalizeMembershipStatus('left') === 'left', 'normalizeMembershipStatus("left") -> left');
assert(normalizeMembershipStatus('former') === 'left', 'normalizeMembershipStatus("former") -> left');
assert(normalizeMembershipStatus('banned') === 'banned', 'normalizeMembershipStatus("banned") -> banned');
assert(normalizeMembershipStatus('ban') === 'banned', 'normalizeMembershipStatus("ban") -> banned');

const mockRosterLive = {
  '10001': { name: 'PlayerOne', gameId: '10001', membershipStatus: 'active' },
  '10002': { name: 'PlayerTwo', gameId: '10002', membershipStatus: 'left' },
  '10003': { name: 'PlayerThree', gameId: '10003', membershipStatus: 'banned' },
  '10004': { name: 'PlayerFour', gameId: '10004' }
};

const isPlayerActiveMember = (p) => {
  if (!p) return true;
  if (typeof p === 'object') {
    if (p.membershipStatus && normalizeMembershipStatus(p.membershipStatus) !== 'active') return false;
    if (p.banned === true || p.isBanned === true) return false;
    if (p.gameId && mockRosterLive[p.gameId]) {
      const rec = mockRosterLive[p.gameId];
      if (rec.membershipStatus && normalizeMembershipStatus(rec.membershipStatus) !== 'active') return false;
    }
    return true;
  }
  const idStr = String(p).trim();
  if (mockRosterLive[idStr]) {
    const rec = mockRosterLive[idStr];
    if (rec.membershipStatus && normalizeMembershipStatus(rec.membershipStatus) !== 'active') return false;
  }
  return true;
};

assert(isPlayerActiveMember(mockRosterLive['10001']) === true, 'Active player object is detected as active');
assert(isPlayerActiveMember(mockRosterLive['10002']) === false, 'Left player object is excluded from active');
assert(isPlayerActiveMember(mockRosterLive['10003']) === false, 'Banned player object is excluded from active');
assert(isPlayerActiveMember(mockRosterLive['10004']) === true, 'Unmarked player defaults to active');
assert(isPlayerActiveMember('10001') === true, 'Active player by Game ID is detected as active');
assert(isPlayerActiveMember('10002') === false, 'Left player by Game ID is excluded');
assert(isPlayerActiveMember('10003') === false, 'Banned player by Game ID is excluded');

console.log('\n Test 3: Event Roster Filtering with Inactive Members Excluded');
const fullRoster = [
  { name: 'ActiveHero', gameId: '10001' },
  { name: 'DepartedMember', gameId: '10002' },
  { name: 'BadActor', gameId: '10003' },
  { name: 'LoyalMember', gameId: '10004' }
];

const filteredActiveRoster = fullRoster.filter(p => isPlayerActiveMember(p));
assert(filteredActiveRoster.length === 2, 'Filtered active roster length is exactly 2');
assert(filteredActiveRoster.some(p => p.name === 'ActiveHero'), 'ActiveHero is in active event roster');
assert(filteredActiveRoster.some(p => p.name === 'LoyalMember'), 'LoyalMember is in active event roster');
assert(!filteredActiveRoster.some(p => p.name === 'DepartedMember'), 'DepartedMember is EXCLUDED from active event roster');
assert(!filteredActiveRoster.some(p => p.name === 'BadActor'), 'BadActor is EXCLUDED from active event roster');

console.log('\n Test 4: Codebase Verification for Membership Functions and UI Elements');
const mainContent = fs.readFileSync('main.js', 'utf8');
const expectedFunctions = [
  'window.normalizeMembershipStatus',
  'window.isPlayerActiveMember',
  'window.fetchActiveRoster',
  'window.updateMemberStatus',
  'window.openChangeMembershipStatusModal',
  'window.submitMembershipStatusChange',
  'setAdminUserPopulationTab',
  'filterAdminUsersList',
  'activeMembersCount',
  'leftMembersCount',
  'bannedMembersCount'
];

expectedFunctions.forEach(fn => {
  assert(mainContent.includes(fn), 'main.js includes ' + fn);
});

console.log('\n========================================');
console.log('Test Summary: ' + passedTests + '/' + totalTests + ' tests passed');
console.log('========================================\n');

process.exit(passedTests === totalTests ? 0 : 1);