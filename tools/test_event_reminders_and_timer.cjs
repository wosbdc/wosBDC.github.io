/**
 * Automated Verification Suite for Schedule Event Reminders & Event Timers (v3.1.9)
 */
const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Starting Schedule Event Reminders & Timers Automated Tests...');

const mainJsPath = path.resolve(__dirname, '../main.js');
const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

// Test 1: Verify parseScheduleEventDate and parseScheduleEventTime
console.log('Testing Test 1: Enhanced schedule date & time parsing functions...');
assert(
  mainJsContent.includes("window.parseScheduleEventDate = (dateStr) => {") &&
  mainJsContent.includes("window.parseScheduleEventTime = (timeStr, pdtVal) => {"),
  "parseScheduleEventDate and parseScheduleEventTime must be defined on window"
);
console.log('✅ Test 1 Passed: Schedule date & time parsers defined.');

// Test 2: Verify getUnifiedScheduleEvents and initScheduleRealtimeSync
console.log('Testing Test 2: getUnifiedScheduleEvents and initScheduleRealtimeSync...');
assert(
  mainJsContent.includes("window.initScheduleRealtimeSync = () => {") &&
  mainJsContent.includes("window.getUnifiedScheduleEvents = () => {"),
  "getUnifiedScheduleEvents and initScheduleRealtimeSync must be defined on window"
);
console.log('✅ Test 2 Passed: Unified schedule resolver and real-time sync defined.');

// Test 3: Verify updateGlobalTimers uses getUnifiedScheduleEvents
console.log('Testing Test 3: updateGlobalTimers dynamic event timer...');
assert(
  mainJsContent.includes("const events = (typeof window.getUnifiedScheduleEvents === 'function') ? window.getUnifiedScheduleEvents() : [];"),
  "updateGlobalTimers must use window.getUnifiedScheduleEvents for sidebar event card"
);
console.log('✅ Test 3 Passed: Sidebar event timer updated to unified event resolver.');

// Test 4: Verify Event Reminders API
console.log('Testing Test 4: Event Reminders API (set, get, cancel, isSet)...');
assert(
  mainJsContent.includes("window.setEventReminder = async (eventName, exactStartTimeMs, warningMins = 15, emoji = '✨') => {") &&
  mainJsContent.includes("window.getEventReminders = () => {") &&
  mainJsContent.includes("window.cancelEventReminder = (reminderId) => {") &&
  mainJsContent.includes("window.isEventReminderSet = (eventName, exactStartTimeMs) => {"),
  "Event Reminders API functions must be defined on window"
);
console.log('✅ Test 4 Passed: Event Reminders API fully defined.');

// Test 5: Verify Event Reminder Modals & Audio Fanfare
console.log('Testing Test 5: Reminder Modals and Web Audio chime...');
assert(
  mainJsContent.includes("window.openEventReminderModal = function(") &&
  mainJsContent.includes("window.openEventRemindersManagerModal = function()") &&
  mainJsContent.includes("window.playEventAlertSound = () => {"),
  "openEventReminderModal, openEventRemindersManagerModal, and playEventAlertSound must be defined"
);
console.log('✅ Test 5 Passed: Reminder modals and fanfare audio chime defined.');

// Test 6: Verify views.home active and upcoming event dual rendering
console.log('Testing Test 6: views.home dual active/upcoming countdown...');
assert(
  mainJsContent.includes("ACTIVE ALLIANCE EVENT • LIVE NOW") &&
  mainJsContent.includes("Next Upcoming Alliance Event") &&
  mainJsContent.includes("window.openEventReminderModal"),
  "views.home must support both active LIVE events and upcoming events with 1-tap reminders"
);
console.log('✅ Test 6 Passed: views.home dual mode event banner verified.');

// Test 7: Verify Schedule view reminder buttons
console.log('Testing Test 7: Schedule view reminder buttons...');
assert(
  mainJsContent.includes("window.openEventRemindersManagerModal()") &&
  mainJsContent.includes("window.openEventReminderModal('"),
  "views.schedule must contain reminder buttons in header and rows"
);
console.log('✅ Test 7 Passed: Schedule view reminder buttons verified.');

console.log('\n🎉 ALL 7 SCHEDULE REMINDER & EVENT TIMER TESTS PASSED 100%!\n');
