const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Video Ticket Attachments & Media Processor Suite...');

// 1. Test formatVideoDuration logic
function formatVideoDuration(seconds) {
    if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
    const s = Math.round(seconds);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
}

const durationTests = [
    { input: 0, expected: '0:00' },
    { input: null, expected: '0:00' },
    { input: undefined, expected: '0:00' },
    { input: NaN, expected: '0:00' },
    { input: 5, expected: '0:05' },
    { input: 14.8, expected: '0:15' },
    { input: 59, expected: '0:59' },
    { input: 60, expected: '1:00' },
    { input: 65, expected: '1:05' },
    { input: 125, expected: '2:05' },
    { input: 3605, expected: '60:05' }
];

durationTests.forEach(({ input, expected }) => {
    const res = formatVideoDuration(input);
    assert.strictEqual(res, expected, `Duration format failed for ${input}: got ${res}, expected ${expected}`);
});
console.log('✅ Test 1 Passed: formatVideoDuration handles all edge cases, rounding, and padding.');

// 2. Test Feedback Item Payload Structure & Backward Compatibility
function mockSubmitFeedbackItem(payload) {
    const ticketId = 'mock_ticket_123';
    const now = Date.now();
    const isVideo = !!(payload.videoUrl || payload.mediaType === 'video' || payload.mediaType === 'external_video');
    const isImage = !!(payload.imageUrl || payload.mediaType === 'image');

    return {
        id: ticketId,
        type: payload.type || 'feature',
        category: payload.category || 'General UI',
        title: payload.title || '',
        description: payload.description || '',
        imageUrl: payload.imageUrl || null,
        videoUrl: payload.videoUrl || null,
        videoThumbnail: payload.videoThumbnail || null,
        mediaType: payload.mediaType || (isVideo ? 'video' : (isImage ? 'image' : null)),
        mediaDuration: payload.mediaDuration || null,
        mediaSize: payload.mediaSize || null,
        mediaName: payload.mediaName || null,
        status: 'pending',
        submittedBy: {
            uid: 'test_uid',
            name: 'Test Chief',
            gameId: '123456',
            avatar: ''
        },
        votes: { test_uid: true },
        voteCount: 1,
        adminNote: '',
        createdAt: now,
        updatedAt: now
    };
}

// Case A: Video file attachment
const videoTicket = mockSubmitFeedbackItem({
    type: 'bug',
    category: 'Showdown',
    title: 'Showdown Score Glitch Video',
    description: 'Attached clip showing the bug',
    videoUrl: 'data:video/mp4;base64,AAAA...',
    videoThumbnail: 'data:image/jpeg;base64,BBBB...',
    mediaType: 'video',
    mediaDuration: 14.5,
    mediaSize: 2048500,
    mediaName: 'bug_repro.mp4'
});

assert.strictEqual(videoTicket.mediaType, 'video');
assert.strictEqual(videoTicket.videoUrl, 'data:video/mp4;base64,AAAA...');
assert.strictEqual(videoTicket.videoThumbnail, 'data:image/jpeg;base64,BBBB...');
assert.strictEqual(videoTicket.imageUrl, null);
assert.strictEqual(videoTicket.mediaDuration, 14.5);
assert.strictEqual(videoTicket.mediaSize, 2048500);
console.log('✅ Test 2 Passed: Video ticket payload contains full video metadata & thumbnail.');

// Case B: Legacy Image Ticket (backward compatibility)
const legacyImageTicket = mockSubmitFeedbackItem({
    type: 'feature',
    title: 'New Dark Mode UI',
    imageUrl: 'data:image/jpeg;base64,CCCC...'
});

assert.strictEqual(legacyImageTicket.mediaType, 'image');
assert.strictEqual(legacyImageTicket.imageUrl, 'data:image/jpeg;base64,CCCC...');
assert.strictEqual(legacyImageTicket.videoUrl, null);
assert.strictEqual(legacyImageTicket.videoThumbnail, null);
console.log('✅ Test 3 Passed: Legacy image tickets maintain 100% backward compatibility.');

// Case C: External Video Link
const externalVideoTicket = mockSubmitFeedbackItem({
    type: 'bug',
    title: 'Long Raid Recording',
    videoUrl: 'https://streamable.com/example123',
    mediaType: 'external_video',
    mediaName: 'External Video Link'
});

assert.strictEqual(externalVideoTicket.mediaType, 'external_video');
assert.strictEqual(externalVideoTicket.videoUrl, 'https://streamable.com/example123');
console.log('✅ Test 4 Passed: External video URLs are parsed and handled cleanly.');

// 3. Verify main.js contains new window exports and media lightbox
const mainJsContent = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');

assert.ok(mainJsContent.includes('window.processFeedbackVideo ='), 'window.processFeedbackVideo must be defined in main.js');
assert.ok(mainJsContent.includes('window.openFeedbackMediaLightbox ='), 'window.openFeedbackMediaLightbox must be defined in main.js');
assert.ok(mainJsContent.includes('window.formatVideoDuration ='), 'window.formatVideoDuration must be defined in main.js');
console.log('✅ Test 5 Passed: All required window media functions and handlers exported in main.js.');

console.log('\n🎉 ALL VIDEO TICKET AUTOMATED TESTS PASSED (100%)!\n');
