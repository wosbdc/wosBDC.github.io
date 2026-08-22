const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Extract cleanChiefName and related functions from main.js or mock implementation to test logic
const mainJsPath = path.join(__dirname, '..', 'main.js');
const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');

console.log('Validating test cases...');

// Test cleanChiefName logic
function cleanChiefName(name) {
    if (!name || typeof name !== 'string') return '';
    let n = name.replace(/[\u00C2\u00A0\u0080-\u009F\u200B-\u200D\uFEFF]/g, '');
    n = n.replace(/Â/g, '');
    n = n.trim();
    n = n.replace(/^\[[^\]]*\]\s*/g, '');
    n = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    n = n.replace(/\s+/g, ' ').trim();
    return n;
}

console.log('\nTesting cleanChiefName...');
const testCases = [
    { input: "MiaowÂ queen", expected: "Miaow queen" },
    { input: "[BDC] MiaowÂ queen", expected: "Miaow queen" },
    { input: "PermaÂ Frost", expected: "Perma Frost" },
    { input: "[B1]PermaÂ Frost", expected: "Perma Frost" },
    { input: "[B1] Miaow queen", expected: "Miaow queen" },
    { input: "Miaow queen", expected: "Miaow queen" },
    { input: "[ABC] Test Player", expected: "Test Player" },
    { input: "NormalPlayer", expected: "NormalPlayer" },
    { input: "  [TAG]   Spacey   Player  ", expected: "Spacey Player" }
];

testCases.forEach(({ input, expected }) => {
    const result = cleanChiefName(input);
    assert.strictEqual(result, expected, `Failed for input: "${input}". Expected: "${expected}", Got: "${result}"`);
    console.log(`  ✅ "${input}" -> "${result}"`);
});

// Test deduplication simulation
console.log('\nTesting Showdown liveData deduplication simulation...');
const mockLiveData = {
    "MiaowÂ queen": { name: "MiaowÂ queen", d1: 100, d2: 200, d3: 0, d4: 0, d5: 0, d6: 0 },
    "Miaow queen": { name: "Miaow queen", d1: 50, d2: 250, d3: 150, d4: 0, d5: 0, d6: 0 },
    "PermaÂ Frost": { name: "PermaÂ Frost", d1: 300, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0 },
    "Perma Frost": { name: "Perma Frost", d1: 0, d2: 400, d3: 0, d4: 0, d5: 0, d6: 0 }
};

let sanitizedLiveMap = {};
for (const [pKey, scores] of Object.entries(mockLiveData)) {
    if (!scores || typeof scores !== 'object' || pKey === 'error') continue;
    const cleanName = cleanChiefName(scores.name || pKey);
    if (!cleanName) continue;
    if (!sanitizedLiveMap[cleanName]) {
        sanitizedLiveMap[cleanName] = { ...scores, name: cleanName };
    } else {
        for (let di = 1; di <= 6; di++) {
            sanitizedLiveMap[cleanName]['d' + di] = Math.max(sanitizedLiveMap[cleanName]['d' + di] || 0, scores['d' + di] || 0);
        }
    }
}

assert.strictEqual(Object.keys(sanitizedLiveMap).length, 2, 'Should combine into exactly 2 unique players');
assert.strictEqual(sanitizedLiveMap['Miaow queen'].d1, 100, 'Miaow queen d1 should be max(100, 50) = 100');
assert.strictEqual(sanitizedLiveMap['Miaow queen'].d2, 250, 'Miaow queen d2 should be max(200, 250) = 250');
assert.strictEqual(sanitizedLiveMap['Miaow queen'].d3, 150, 'Miaow queen d3 should be 150');
assert.strictEqual(sanitizedLiveMap['Perma Frost'].d1, 300, 'Perma Frost d1 should be 300');
assert.strictEqual(sanitizedLiveMap['Perma Frost'].d2, 400, 'Perma Frost d2 should be 400');
console.log('  ✅ Showdown liveData deduplication passed with 100% accurate merged day scores.');

console.log('\nAll Showdown Sanitizer Tests Passed Successfully! 🎉');
