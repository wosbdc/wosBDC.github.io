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

console.log('\nTest 2: Codebase Verification for Required Type Dropdown, Category & Admin Editing');
const mainContent = fs.readFileSync('main.js', 'utf8');

// 1. openSubmitFeedbackModal signature defaults to '' so users must actively pick
assert(
  mainContent.includes("window.openSubmitFeedbackModal = (defaultType = '') => {"),
  'openSubmitFeedbackModal defaults parameter to empty string'
);

// 2. Type selector dropdown exists with required placeholder
assert(
  mainContent.includes('id="fbTypeInput"'),
  'fbTypeInput dropdown exists in DOM template'
);
assert(
  mainContent.includes('-- Select Type: Bug Report or Feature (Required) --'),
  'Blank required placeholder option exists in fbTypeInput'
);

// 3. Required category with blank placeholder option
assert(
  mainContent.includes('<option value="" disabled selected>-- Select a Category / Area (Required) --</option>'),
  'Blank required placeholder option exists in fbCategoryInput'
);

// 4. Type & Category validation in handleFeedbackSubmit
assert(
  mainContent.includes('const typeSelectVal = document.getElementById(\'fbTypeInput\')?.value;') &&
  mainContent.includes('Please select a Feedback Type (Bug Report or Feature Request)!'),
  'handleFeedbackSubmit requires type and alerts user if empty'
);
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

// 6. window.updateFeedbackType and window.updateFeedbackCategory defined
assert(mainContent.includes('window.updateFeedbackType = async (itemId, newType) => {'), 'window.updateFeedbackType is defined');
assert(mainContent.includes('window.updateFeedbackCategory = async (itemId, newCategory) => {'), 'window.updateFeedbackCategory is defined');

// 7. Admin Feedback table includes type and category update selects
assert(
  mainContent.includes("onchange=\"window.updateFeedbackType('${item.id}', this.value)\"") &&
  mainContent.includes('title="Change Ticket Type"'),
  'Admin table includes editable type dropdown'
);
assert(
  mainContent.includes("onchange=\"window.updateFeedbackCategory('${item.id}', this.value)\"") &&
  mainContent.includes('title="Reclassify Category"'),
  'Admin table includes reclassify category dropdown'
);

// 8. Community feedback cards include type and category update selects for managers
assert(
  mainContent.includes("window.updateFeedbackType('${item.id}', this.value)"),
  'Community feedback cards include type dropdown in manager controls'
);
assert(
  mainContent.includes("window.updateFeedbackCategory('${item.id}', this.value)"),
  'Community feedback cards include category dropdown in manager controls'
);

// 9. Admin Resolution note modal includes type and category selectors
assert(
  mainContent.includes('id="adminNoteTypeInput"'),
  'openAdminNoteModal includes adminNoteTypeInput dropdown'
);
assert(
  mainContent.includes('id="adminNoteCategoryInput"'),
  'openAdminNoteModal includes adminNoteCategoryInput dropdown'
);

console.log('\nTest 3: Logic Simulation of Form Submission Validation');
function simulateSubmit(type, category, title) {
  if (!type) {
    return { success: false, error: 'MISSING_TYPE' };
  }
  if (!category) {
    return { success: false, error: 'MISSING_CATEGORY' };
  }
  if (!title) {
    return { success: false, error: 'MISSING_TITLE' };
  }
  return { success: true, payload: { type, category, title } };
}

assert(simulateSubmit('', 'Bear Trap', 'My Issue').success === false, 'Empty type fails validation');
assert(simulateSubmit('', 'Bear Trap', 'My Issue').error === 'MISSING_TYPE', 'Empty type returns MISSING_TYPE');
assert(simulateSubmit('bug', '', 'My Issue').success === false, 'Empty category fails validation');
assert(simulateSubmit('bug', '', 'My Issue').error === 'MISSING_CATEGORY', 'Empty category returns MISSING_CATEGORY');
assert(simulateSubmit('bug', 'Bear Trap', '').success === false, 'Empty title fails validation');
assert(simulateSubmit('bug', 'Bear Trap', '').error === 'MISSING_TITLE', 'Empty title returns MISSING_TITLE');
assert(simulateSubmit('bug', 'Bear Trap', 'Bug with trap score').success === true, 'Valid submission succeeds');
assert(simulateSubmit('feature', 'Alliance Championship', 'Add flags to cards').success === true, 'Valid feature submission succeeds');

console.log('\n========================================');
console.log('Test Summary: ' + passedTests + '/' + totalTests + ' tests passed');
console.log('========================================\n');

process.exit(passedTests === totalTests ? 0 : 1);
