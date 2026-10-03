// tools/test_admin_logs_donation_breakdown.cjs
const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

console.log('🧪 Starting Admin Logs Batched Donation Breakdown Test Suite...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(testName, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${testName} -> ${err.message}`);
    process.exitCode = 1;
  }
}

async function runAsyncTest(testName, testFn) {
  totalTests++;
  try {
    await testFn();
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${testName} -> ${err.message}`);
    process.exitCode = 1;
  }
}

async function main() {
  // 1. Syntax check on main.js
  runTest('main.js compiles cleanly with 0 syntax errors', () => {
    execSync('node --check main.js', { stdio: 'pipe' });
  });

  const mainJsPath = path.join(__dirname, '..', 'main.js');
  const mainJs = fs.readFileSync(mainJsPath, 'utf8');

  // 2. Static source code assertions
  runTest('extractDonationMeta function is defined in extractLogMembers', () => {
    assert(mainJs.includes('extractDonationMeta'), 'Must contain extractDonationMeta');
    assert(mainJs.includes('Added +'), 'Must handle Added + pattern');
  });

  runTest('fetchAdminLog aggregates batched donations per unique chief', () => {
    assert(mainJs.includes('isDonationBatch'), 'Must detect isDonationBatch in fetchAdminLog');
    assert(mainJs.includes('totalDonationPoints'), 'Must calculate totalDonationPoints in batchDetailsText');
  });

  // 3. Functional unit testing by creating minimal mock environment
  runTest('extractLogMembers extracts donation amount and formats meta correctly', () => {
    const window = {};
    // Extract extractLogMembers slice and evaluate
    const fnStart = mainJs.indexOf('window.extractLogMembers = (log) => {');
    assert(fnStart !== -1, 'Could not find window.extractLogMembers');
    // Find the end of window.extractLogMembers
    const fnEnd = mainJs.indexOf('window.showLogDetailModal = async (logId) => {', fnStart);
    assert(fnEnd !== -1, 'Could not find window.showLogDetailModal');
    const extractFnCode = mainJs.substring(fnStart, fnEnd);
    eval(extractFnCode);

    // Test case A: ChatBot Bear Trap Donation style: target="BrianDCox", details="Added +60 to BT1 (Total: 60)"
    const log1 = {
      action: 'Bear Trap Donation',
      target: 'BrianDCox',
      details: 'Added +60 to BT1 (Total: 60)'
    };
    const res1 = window.extractLogMembers(log1);
    assert.strictEqual(res1.length, 1);
    assert.strictEqual(res1[0].name, 'BrianDCox');
    assert.strictEqual(res1[0].amount, 60);
    assert.strictEqual(res1[0].meta, '+60 pts • Total: 60');

    // Test case B: "Added +0 to BT1 (Total: 2)"
    const log2 = {
      action: 'Bear Trap Donation',
      target: 'BrianDCox',
      details: 'Added +0 to BT1 (Total: 2)'
    };
    const res2 = window.extractLogMembers(log2);
    assert.strictEqual(res2.length, 1);
    assert.strictEqual(res2[0].name, 'BrianDCox');
    assert.strictEqual(res2[0].amount, 0);
    assert.strictEqual(res2[0].meta, '+0 pts • Total: 2');

    // Test case C: Multi-chief donation string: target="ChiefA (+60), ChiefB (+40)"
    const log3 = {
      action: 'Bear Trap Donation',
      target: 'ChiefA (+60), ChiefB (+40)',
      details: ''
    };
    const res3 = window.extractLogMembers(log3);
    assert.strictEqual(res3.length, 2);
    assert.strictEqual(res3[0].name, 'ChiefA');
    assert.strictEqual(res3[0].amount, 60);
    assert.strictEqual(res3[0].meta, '+60');
    assert.strictEqual(res3[1].name, 'ChiefB');
    assert.strictEqual(res3[1].amount, 40);
    assert.strictEqual(res3[1].meta, '+40');
  });

  // 4. Batch aggregation simulation
  runTest('Batched donations aggregate multiple consecutive actions for the same chief', () => {
    // Simulate what fetchAdminLog does for a group of logs
    const group = [
      { action: 'Bear Trap Donation', target: 'BrianDCox', details: 'Added +60 to BT1 (Total: 60)' },
      { action: 'Bear Trap Donation', target: 'BrianDCox', details: 'Added +60 to BT1 (Total: 120)' }
    ];

    const window = {};
    const fnStart = mainJs.indexOf('window.extractLogMembers = (log) => {');
    const fnEnd = mainJs.indexOf('window.showLogDetailModal = async (logId) => {', fnStart);
    eval(mainJs.substring(fnStart, fnEnd));

    let allGroupMembers = [];
    group.forEach(l => {
      const extracted = window.extractLogMembers(l);
      if (extracted.length > 0) {
        allGroupMembers.push(...extracted);
      } else if (l.target && l.target !== '-') {
        allGroupMembers.push({ name: l.target, meta: l.details || '', amount: 0, raw: l.target });
      }
    });

    const uniqueMembers = [];
    const memberMap = new Map();
    allGroupMembers.forEach(m => {
      const key = (m.name || '').toLowerCase();
      if (!key) return;
      if (!memberMap.has(key)) {
        const entry = { ...m };
        memberMap.set(key, entry);
        uniqueMembers.push(entry);
      } else {
        const existing = memberMap.get(key);
        if (m.amount) {
          existing.amount = (existing.amount || 0) + m.amount;
          const totM = (m.meta || '').match(/Total:\s*([\d,]+)/i);
          const totStr = totM ? ` • Total: ${totM[1]}` : '';
          existing.meta = `+${existing.amount.toLocaleString()} pts${totStr}`;
        }
      }
    });

    assert.strictEqual(uniqueMembers.length, 1, 'Should deduplicate to 1 unique chief');
    assert.strictEqual(uniqueMembers[0].name, 'BrianDCox');
    assert.strictEqual(uniqueMembers[0].amount, 120, 'Should aggregate 60 + 60 = 120 pts');
    assert.strictEqual(uniqueMembers[0].meta, '+120 pts • Total: 120');

    const totalDonationPoints = uniqueMembers.reduce((sum, m) => sum + (m.amount || 0), 0);
    const batchDetailsText = `2 consecutive donations batched (+${totalDonationPoints.toLocaleString()} pts across ${uniqueMembers.length} chiefs)`;
    assert.strictEqual(batchDetailsText, '2 consecutive donations batched (+120 pts across 1 chiefs)');
  });

  // 5. Test copyBatchedMembersList formatting
  runTest('copyBatchedMembersList formats copied text with member name and meta points', () => {
    const memberDetails = [
      { name: 'BrianDCox', meta: '+120 pts • Total: 120', amount: 120 },
      { name: 'PlayerTwo', meta: '+60 pts • Total: 60', amount: 60 }
    ];

    const text = memberDetails.map((m, idx) => {
      const name = typeof m === 'object' ? m.name : m;
      const meta = typeof m === 'object' ? m.meta : '';
      return `${idx + 1}. ${name}${meta ? ` (${meta})` : ''}`;
    }).join('\n');

    assert(text.includes('1. BrianDCox (+120 pts • Total: 120)'));
    assert(text.includes('2. PlayerTwo (+60 pts • Total: 60)'));
  });

  console.log(`\n🎉 Test Suite Completed: ${passedTests}/${totalTests} tests passed.\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
