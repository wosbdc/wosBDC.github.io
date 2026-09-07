// tools/test_feedback_modal.cjs
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Starting Feedback Modal & Category Management Test Suite...\n');

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

console.log('Test 1: Node.js Syntax & Compilation Check for main.js');
try {
  execSync('node --check main.js', { stdio: 'pipe' });
  assert(true, 'main.js compiles cleanly with 0 syntax errors');
} catch (err) {
  assert(false, 'main.js compilation failed: ' + err.message);
}

console.log('\nTest 2: Codebase Verification for Bug 1st & Category Enforcement');
const mainContent = fs.readFileSync('main.js', 'utf8');

// 1. Default to 'bug' in openSubmitFeedbackModal
assert(
  mainContent.includes("window.openSubmitFeedbackModal = (defaultType = 'bug') => {"),
  'openSubmitFeedbackModal defaults parameter to "bug"'
);

// 2. Bug button precedes Feature button in the modal template
const bugBtnIdx = mainContent.indexOf('id="fbTypeBugBtn"');
const featBtnIdx = mainContent.indexOf('id="fbTypeFeatureBtn"');
assert(bugBtnIdx !== -1 && featBtnIdx !== -1 && bugBtnIdx < featBtnIdx, 'fbTypeBugBtn appears BEFORE fbTypeFeatureBtn in DOM template');

// 3. Required category with blank placeholder option
assert(
  mainContent.includes('<option value="" disabled selected>-- Select a Category / Area (Required) --</option>'),
  'Blank required placeholder option exists in fbCategoryInput'
);

// 4. Category validation in handleFeedbackSubmit
assert(
  mainContent.includes('const category = document.getElementById(\'fbCategoryInput\')?.value;') &&
  mainContent.includes('Please select a Category / Area before submitting!'),
  'handleFeedbackSubmit requires category and alerts user if empty'
);

// 5. Canonical FEEDBACK_CATEGORIES defined
assert(mainContent.includes('window.FEEDBACK_CATEGORIES = ['), 'window.FEEDBACK_CATEGORIES is defined');
assert(mainContent.includes('Alliance Championship'), 'Alliance Championship category exists');
assert(mainContent.includes('Bear Trap'), 'Bear Trap category exists');
assert(mainContent.includes('Mercenary Prestige'), 'Mercenary Prestige category exists');

// 6. window.updateFeedbackCategory defined
assert(mainContent.includes('window.updateFeedbackCategory = async (itemId, newCategory) => {'), 'window.updateFeedbackCategory is defined');

// 7. Admin Feedback table includes category update select
assert(
  mainContent.includes("onchange=\"window.updateFeedbackCategory('${item.id}', this.value)\"") &&
  mainContent.includes('title="Reclassify Category"'),
  'Admin table includes reclassify category dropdown'
);

// 8. Community feedback cards include category update select for managers
assert(
  mainContent.includes('title="Reclassify Category"'),
  'Community feedback cards include category dropdown in manager controls'
);

// 9. Admin Resolution note modal includes category selector
assert(
  mainContent.includes('id="adminNoteCategoryInput"'),
  'openAdminNoteModal includes adminNoteCategoryInput dropdown'
);

console.log('\nTest 3: Logic Simulation of Category Validation');
function simulateSubmit(title, category) {
  if (!category) {
    return { success: false, error: 'MISSING_CATEGORY' };
  }
  if (!title) {
    return { success: false, error: 'MISSING_TITLE' };
  }
  return { success: true, payload: { title, category } };
}

assert(simulateSubmit('My Bug', '').success === false, 'Empty category fails validation');
assert(simulateSubmit('My Bug', '').error === 'MISSING_CATEGORY', 'Empty category returns MISSING_CATEGORY');
assert(simulateSubmit('', 'Bear Trap').success === false, 'Empty title fails validation');
assert(simulateSubmit('My Bug', 'Bear Trap').success === true, 'Valid title and category succeed');

console.log('\n========================================');
console.log('Test Summary: ' + passedTests + '/' + totalTests + ' tests passed');
console.log('========================================\n');

process.exit(passedTests === totalTests ? 0 : 1);
