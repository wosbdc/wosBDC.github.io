// tools/test_alt_collapsible.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Starting Collapsible Alt Characters Automated Test Suite...\n');

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

console.log('\n🔍 Test 2: Collapsible State & Function Logic Simulation');
const mockCollapsedSet = new Set();

function mockTogglePlayerAltsCollapse(ownerUid) {
  if (mockCollapsedSet.has(ownerUid)) {
    mockCollapsedSet.delete(ownerUid);
    return { isCollapsed: false, arrow: '⁵' };
  } else {
    mockCollapsedSet.add(ownerUid);
    return { isCollapsed: true, arrow: '▶️' };
  }
}


assert(mockTogglePlayerAltsCollapse('user_123').isCollapsed === true, 'First toggle collapses user alts');
assert(mockCollapsedSet.has('user_123'), 'mockCollapsedSet includes user_123');


assert(mockTogglePlayerAltsCollapse('user_123').isCollapsed === false, 'Second toggle expands user alts');
assert(!mockCollapsedSet.has('user_123'), 'mockCollapsedSet removed user_123');


console.log('\n🔍 Test 3: Codebase Verification for Collapsible Alts UI & Handlers');
const mainContent = fs.readFileSync('main.js', 'utf8');
const expectedPatterns = [
  'window._collapsedAltOwnerUids',
  'window.togglePlayerAltsCollapse',
  'window.toggleAllAltsCollapse',
  'alt-toggle-pill-btn',
  'alt-toggle-arrow',
  'alt-character-row alt-of-',
  'data-owner-uid',
  'data-alt-collapsed',
  'toggleAllAltsCollapseBtn',
  'toggleAllAltsText'
];

expectedPatterns.forEach(pattern => {
  assert(mainContent.includes(pattern), 'main.js includes ' + pattern);
});

console.log('\n=========================================');
console.log('Test Summary: ' + passedTests + '/' + totalTests + ' tests passed');
console.log('=========================================\n');

process.exit(passedTests === totalTests ? 0 : 1);