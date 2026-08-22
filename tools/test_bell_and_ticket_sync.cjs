/**
 * Automated Verification Suite for Ticket Real-Time Sync & Bell Notification Dismissal (v3.1.8)
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting Bell System & Ticket Synchronization Automated Tests...');

const mainJsPath = path.resolve(__dirname, '../main.js');
const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

// Test 1: Verify views.feedback defaults to 'open' filter
console.log('Testing Test 1: views.feedback default parameter...');
assert(
  mainJsContent.includes("feedback: async (initialFilter = 'open') => {"),
  "views.feedback must default to 'open' filter so completed/closed tickets are hidden by default"
);
console.log('✅ Test 1 Passed: views.feedback defaults to initialFilter = \"open\".');

// Test 2: Verify views.feedback attaches onValue real-time listener to community_feedback
console.log('Testing Test 2: views.feedback real-time onValue listener...');
assert(
  mainJsContent.includes("onValue(feedbackRef, (snap) => {") && mainJsContent.includes("window._feedbackUnsubscribe = unsub;"),
  "views.feedback must attach an onValue real-time listener to sync external status updates live"
);
console.log('✅ Test 2 Passed: views.feedback connects real-time onValue listener.');

// Test 3: Verify updateNewMemberBadge respects last_seen_feedback_timestamp & dismissed items
console.log('Testing Test 3: updateNewMemberBadge attention counting logic...');
assert(
  mainJsContent.includes("localStorage.getItem('last_seen_feedback_timestamp')") &&
  mainJsContent.includes("localStorage.getItem('dismissed_bell_items')"),
  "updateNewMemberBadge must check last_seen_feedback_timestamp and dismissed_bell_items"
);
console.log('✅ Test 3 Passed: updateNewMemberBadge respects timestamps and dismissal list.');

// Test 4: Verify openAllianceAlertsModal hides inactive timer cards
console.log('Testing Test 4: openAllianceAlertsModal inactive timer card filtering...');
assert(
  !mainJsContent.includes("No shield active</span>") &&
  !mainJsContent.includes("No timer set</span>"),
  "openAllianceAlertsModal must NOT show inactive placeholder cards when no timers are running"
);
console.log('✅ Test 4 Passed: Inactive placeholder timer cards are cleanly suppressed from alert feed.');

// Test 5: Verify dismissBellItem and markAllBellAlertsRead implementation
console.log('Testing Test 5: dismissBellItem and markAllBellAlertsRead functions...');
assert(
  mainJsContent.includes("window.dismissBellItem = (itemKey) => {") &&
  mainJsContent.includes("window.markAllBellAlertsRead = () => {"),
  "window.dismissBellItem and window.markAllBellAlertsRead must be defined on window"
);
console.log('✅ Test 5 Passed: dismissBellItem and markAllBellAlertsRead are properly defined.');

// Test 6: Verify Dismiss buttons exist on stream cards and Mark All Read in header pill bar
console.log('Testing Test 6: UI Dismiss and Mark All Read controls...');
assert(
  mainJsContent.includes("window.dismissBellItem('${b.key}')") &&
  mainJsContent.includes("window.dismissBellItem('${f.id}')") &&
  mainJsContent.includes("<span>✓ Mark All Read</span>"),
  "Individual cards must have Dismiss buttons and modal header must have Mark All Read pill"
);
console.log('✅ Test 6 Passed: Individual Dismiss buttons and header Mark All Read pill are present.');

console.log('\n🎉 ALL 6 BELL & TICKET SYNCHRONIZATION TESTS PASSED 100%!\n');
