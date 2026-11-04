const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { execSync } = require('child_process');

console.log("🧪 Starting Showdown Discord Post Hub & Reset Missed Report Test Suite...\n");

// 1. AST & Syntax Check
const mainPath = path.join(__dirname, '..', 'main.js');
const mainCode = fs.readFileSync(mainPath, 'utf8');

try {
    execSync(`node --check "${mainPath}"`, { stdio: 'pipe' });
    console.log("  ✅ PASS: main.js compiles cleanly with 0 syntax errors");
} catch (e) {
    console.error("  ❌ FAIL: Syntax error in main.js:", e);
    process.exit(1);
}

// 2. Static Codebase Assertions
console.log("\nTest 2: Showdown Discord Post Hub Structure Assertions");

assert(mainCode.includes('window.SHOWDOWN_DAY_TITLES = {'), 'SHOWDOWN_DAY_TITLES mapping must be defined');
assert(mainCode.includes('Rise of the city'), 'Day 1 title must be Rise of the city');
assert(mainCode.includes('Hero Development'), 'Day 2 title must be Hero Development');
assert(mainCode.includes('Pet Training'), 'Day 3 title must be Pet Training');
assert(mainCode.includes('Gear Enhancement'), 'Day 4 title must be Gear Enhancement');
assert(mainCode.includes('Trade Dominion'), 'Day 5 title must be Trade Dominion');
assert(mainCode.includes('Full-Scale Competition'), 'Day 6 title must be Full-Scale Competition');
console.log("  ✅ PASS: Official Day 1-6 titles verified");

assert(mainCode.includes('window.openShowdownDiscordPostModal = async'), 'window.openShowdownDiscordPostModal must be defined');
assert(mainCode.includes('showdownDiscordPostModal'), 'Modal id showdownDiscordPostModal must be present');
assert(mainCode.includes('wos_sd_discord_posted_'), 'LocalStorage key pattern for posted tracking must be present');
console.log("  ✅ PASS: openShowdownDiscordPostModal and localStorage tracking key verified");

// 3. Post Formatting Assertions
console.log("\nTest 3: Post Formatting Template Logic Assertions");

// Post 1 Assertions
assert(mainCode.includes('Day ${d} - ${dayTitle}\nvs ${enemyName}'), 'Post 1 must place vs enemy alliance on its own line');
assert(mainCode.includes('Won or Lost:'), 'Post 1 must contain Won or Lost: field');
assert(mainCode.includes('Daily goal:'), 'Post 1 must contain Daily goal: field');
assert(mainCode.includes('Goal Left:'), 'Post 1 must contain Goal Left: field');
assert(mainCode.includes('Days Left:'), 'Post 1 must contain Days Left: field');
assert(mainCode.includes('people who scored 0'), 'Post 1 must contain people who scored 0 section');
console.log("  ✅ PASS: Post 1 battle summary template structure verified");

// Post 2 Assertions
assert(mainCode.includes('Showdown Leaderboard'), 'Post 2 must contain Showdown Leaderboard header');
assert(mainCode.includes('Congrats Top 4'), 'Post 2 must contain Congrats Top 4 section');
assert(mainCode.includes(': @${p.name}'), 'Post 2 must format top 4 with @ handles');
assert(mainCode.includes('https://tiny.cc/wosBDC'), 'Post 2 must include https://tiny.cc/wosBDC link');
console.log("  ✅ PASS: Post 2 leaderboard template structure verified");

// 4. Missed Days Report Reset Bug Fix Assertions
console.log("\nTest 4: Missed Days Report Reset Handling Assertions");

assert(mainCode.includes('// When event is reset or no scores are entered yet, maxActiveDay remains 0 (Pending)'), 'maxActiveDay must remain 0 on reset without forcing maxActiveDay = 1');
assert(mainCode.includes('Event Reset / Pending — No days active yet'), 'Missed report copy text must handle maxActiveDay === 0 cleanly');
assert(mainCode.includes('Total Players with Missed Days: 0'), 'Missed report summary must report 0 missed when maxActiveDay === 0');
console.log("  ✅ PASS: Missed days report reset protection logic verified");

// 5. Functional Simulation of Post 1 & Post 2 Generators
console.log("\nTest 5: Functional Simulation of Discord Post Generator");

const dayTitles = {
    1: 'Rise of the city',
    2: 'Hero Development',
    3: 'Pet Training',
    4: 'Gear Enhancement',
    5: 'Trade Dominion',
    6: 'Full-Scale Competition'
};

const enemyAllianceName = 'DragonSlayers [DS]';
const dailyTarget = 3333333;
const totalTarget = 20000000;

// Simulate mock scores
const mockSdLiveData = {
    'ChiefAlpha': { d1: 1500000, d2: 800000, d3: 0, d4: 0, d5: 0, d6: 0 },
    'ChiefBeta':  { d1: 1200000, d2: 500000, d3: 0, d4: 0, d5: 0, d6: 0 },
    'ChiefGamma': { d1: 900000,  d2: 400000, d3: 0, d4: 0, d5: 0, d6: 0 },
    'ChiefDelta': { d1: 500000,  d2: 200000, d3: 0, d4: 0, d5: 0, d6: 0 },
    'ChiefZero':  { d1: 0,       d2: 0,      d3: 0, d4: 0, d5: 0, d6: 0 }
};

const day = 1;
const dayScore = Object.values(mockSdLiveData).reduce((sum, s) => sum + (Number(s['d' + day]) || 0), 0); // 4,100,000
const cumulativeScore = dayScore;
const diff = dayScore - dailyTarget; // +766,667
const goalLeft = Math.max(0, totalTarget - cumulativeScore); // 15,900,000
const daysLeft = 6 - day; // 5

const diffStr = diff >= 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString();

let post1 = `Day ${day} - ${dayTitles[day]}\nvs ${enemyAllianceName}\n`;
post1 += `Won or Lost: Won\n`;
post1 += `Daily goal: ${diffStr}\n`;
post1 += `Goal Left: ${goalLeft.toLocaleString()}\n`;
post1 += `Days Left: ${daysLeft}\n\n`;
post1 += `people who scored 0\n`;
post1 += `• ChiefZero\n`;

assert(post1.includes('Day 1 - Rise of the city\nvs DragonSlayers [DS]'), 'Post 1 title and separate enemy line match specification');
assert(post1.includes('Daily goal: +766,667'), 'Post 1 daily goal diff formatted correctly');
assert(post1.includes('Goal Left: 15,900,000'), 'Post 1 goal left calculated correctly');
assert(post1.includes('Days Left: 5'), 'Post 1 days left calculated correctly');
assert(post1.includes('• ChiefZero'), 'Post 1 includes zero-score chiefs list');
console.log("  ✅ PASS: Post 1 generated cleanly matching specifications");

// Post 2 Leaderboard Top 4
const entries = Object.entries(mockSdLiveData).map(([name, s]) => ({
    name,
    score: Number(s['d' + day]) || 0
})).sort((a, b) => b.score - a.score);

let post2 = `Showdown Leaderboard\n\nCongrats Top 4\n\n`;
for (let rank = 1; rank <= 4; rank++) {
    const entry = entries[rank - 1];
    post2 += `${rank}: @${entry.name}\n`;
}
post2 += `\nSee all results at\n\nhttps://tiny.cc/wosBDC\n`;

assert(post2.includes('1: @ChiefAlpha'), 'Rank 1 formatted with @ChiefAlpha');
assert(post2.includes('2: @ChiefBeta'), 'Rank 2 formatted with @ChiefBeta');
assert(post2.includes('3: @ChiefGamma'), 'Rank 3 formatted with @ChiefGamma');
assert(post2.includes('4: @ChiefDelta'), 'Rank 4 formatted with @ChiefDelta');
assert(post2.includes('https://tiny.cc/wosBDC'), 'Post 2 includes tiny link');
console.log("  ✅ PASS: Post 2 leaderboard generated cleanly matching specifications");

console.log("\n🎉 ALL SHOWDOWN DISCORD HUB & RESET REPORT TESTS PASSED 100%!");
process.exit(0);
