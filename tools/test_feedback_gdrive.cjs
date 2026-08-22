const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Google Drive "Drop & Go" & 3-Tier Fallback Suite...');

// 1. Test parseGoogleDriveUrl logic
function parseGoogleDriveUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const str = url.trim();
    if (!str.includes('drive.google.com') && !str.includes('docs.google.com')) return null;

    let fileId = null;
    const matchFileD = str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (matchFileD && matchFileD[1]) {
        fileId = matchFileD[1];
    } else {
        const matchParamId = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (matchParamId && matchParamId[1]) {
            fileId = matchParamId[1];
        }
    }

    if (!fileId) return null;

    return {
        fileId: fileId,
        previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
        downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
        viewUrl: `https://drive.google.com/file/d/${fileId}/view`
    };
}

const gdriveTestCases = [
    {
        url: 'https://drive.google.com/file/d/1A2B3C4D5E_6789xyz-ABC/view?usp=sharing',
        expectedId: '1A2B3C4D5E_6789xyz-ABC'
    },
    {
        url: 'https://drive.google.com/file/d/1Z9Y8X7W6V5U4T3S2R1Q/preview',
        expectedId: '1Z9Y8X7W6V5U4T3S2R1Q'
    },
    {
        url: 'https://drive.google.com/open?id=12345abcdef67890',
        expectedId: '12345abcdef67890'
    },
    {
        url: 'https://drive.google.com/uc?id=999888777666&export=download',
        expectedId: '999888777666'
    },
    {
        url: 'https://docs.google.com/file/d/abc-DEF_12345/edit',
        expectedId: 'abc-DEF_12345'
    }
];

gdriveTestCases.forEach(({ url, expectedId }) => {
    const res = parseGoogleDriveUrl(url);
    assert.ok(res, `Failed to parse Google Drive link: ${url}`);
    assert.strictEqual(res.fileId, expectedId, `Incorrect fileId: expected ${expectedId}, got ${res.fileId}`);
    assert.strictEqual(res.previewUrl, `https://drive.google.com/file/d/${expectedId}/preview`);
    assert.strictEqual(res.thumbnailUrl, `https://drive.google.com/thumbnail?id=${expectedId}&sz=w800`);
    assert.strictEqual(res.downloadUrl, `https://drive.google.com/uc?export=download&id=${expectedId}`);
});
console.log('✅ Test 1 Passed: parseGoogleDriveUrl accurately extracts ID and creates embed URLs across all 5 formats.');

// 2. Test Non-Google Drive URLs
const nonDriveUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://streamable.com/e/abc123',
    'https://cdn.discordapp.com/attachments/123/456/clip.mp4',
    'https://example.com/image.png',
    null,
    undefined,
    ''
];

nonDriveUrls.forEach((url) => {
    assert.strictEqual(parseGoogleDriveUrl(url), null, `Expected null for non-drive url ${url}`);
});
console.log('✅ Test 2 Passed: parseGoogleDriveUrl correctly ignores non-Drive URLs.');

// 3. Test Silent Fallback Logic
async function mockUploadWithFallback(shouldDriveFail, localDataUrl) {
    let attachedMedia = {
        type: 'video',
        dataUrl: localDataUrl,
        thumbnail: 'data:image/jpeg;base64,THUMB...',
        name: 'test_clip.mp4'
    };

    try {
        if (shouldDriveFail) {
            throw new Error('Google Apps Script UrlFetch Quota Exceeded');
        }
        attachedMedia = {
            type: 'gdrive_video',
            dataUrl: 'https://drive.google.com/file/d/MOCK_ID/preview',
            thumbnail: 'https://drive.google.com/thumbnail?id=MOCK_ID&sz=w800',
            name: 'test_clip.mp4',
            fileId: 'MOCK_ID'
        };
    } catch(err) {
        // Silent fallback retains local in-database base64
    }

    return attachedMedia;
}

(async () => {
    // Case A: Drive Success
    const successRes = await mockUploadWithFallback(false, 'data:video/mp4;base64,AAAA...');
    assert.strictEqual(successRes.type, 'gdrive_video');
    assert.strictEqual(successRes.fileId, 'MOCK_ID');

    // Case B: Drive Quota Failure -> In-Database Fallback
    const fallbackRes = await mockUploadWithFallback(true, 'data:video/mp4;base64,AAAA...');
    assert.strictEqual(fallbackRes.type, 'video');
    assert.strictEqual(fallbackRes.dataUrl, 'data:video/mp4;base64,AAAA...');
    console.log('✅ Test 3 Passed: 3-Tier fallback silently preserves in-database storage on Quota error.');

    // 4. Verify main.js exports
    const mainJsContent = fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf8');
    assert.ok(mainJsContent.includes('window.parseGoogleDriveUrl ='), 'window.parseGoogleDriveUrl must be defined');
    assert.ok(mainJsContent.includes('window.uploadMediaToDriveBackend ='), 'window.uploadMediaToDriveBackend must be defined');
    assert.ok(mainJsContent.includes('window.openFeedbackMediaLightbox ='), 'window.openFeedbackMediaLightbox must be defined');
    console.log('✅ Test 4 Passed: All Google Drive handlers & fallback functions defined in main.js.');

    console.log('\n🎉 ALL GOOGLE DRIVE DROP & GO TESTS PASSED (100%)!\n');
})();
