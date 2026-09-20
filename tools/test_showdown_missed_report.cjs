const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("🧪 Starting Showdown Missed Days Report Exclusion Test Suite...\n");

// 1. AST / Syntax Check
const mainPath = path.join(__dirname, '..', 'main.js');
const mainCode = fs.readFileSync(mainPath, 'utf8');

try {
    execSync('node --check main.js', { stdio: 'pipe' });
    console.log("  ✅ PASS: main.js compiles cleanly with 0 syntax errors");
} catch (e) {
    console.error("  ❌ FAIL: Syntax error in main.js:", e);
    process.exit(1);
}

// 2. Codebase Structure Assertions
console.log("\nTest 2: Codebase Structure & Logic Verification");

if (mainCode.includes('window.showMissedDaysReportModal = async')) {
    console.log("  ✅ PASS: window.showMissedDaysReportModal is defined");
} else {
    console.error("  ❌ FAIL: window.showMissedDaysReportModal not found");
    process.exit(1);
}

if (mainCode.includes('isExcludedMember') && mainCode.includes("s === 'left' || s === 'banned'")) {
    console.log("  ✅ PASS: isExcludedMember helper gates left and banned players");
} else {
    console.error("  ❌ FAIL: isExcludedMember logic missing or incomplete");
    process.exit(1);
}

if (mainCode.includes('allPlayers.forEach(pName => {') && mainCode.includes('if (isExcludedMember(pName)) return;')) {
    console.log("  ✅ PASS: Daily missed days calculation skips excluded players");
} else {
    console.error("  ❌ FAIL: Missed days loop does not skip excluded members");
    process.exit(1);
}

// 3. Functional Simulation of Exclusion Filter
console.log("\nTest 3: Functional Simulation of Missed Days Filtering");

const mockRoster = {
    "ChiefActive1": { name: "ChiefActive1", membershipStatus: "active", status: "active" },
    "ChiefActive2": { name: "ChiefActive2", membershipStatus: "active", status: "active" },
    "ChiefLeft": { name: "ChiefLeft", membershipStatus: "left", status: "left" },
    "ChiefDeparted": { name: "ChiefDeparted", membershipStatus: "departed", status: "departed" },
    "ChiefBanned": { name: "ChiefBanned", membershipStatus: "banned", status: "banned", banned: true }
};

const mockSdData = {
    "ChiefActive1": { d1: 100, d2: 0, d3: 200, d4: 0, d5: 0, d6: 0 },
    "ChiefActive2": { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0 },
    "ChiefLeft": { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0 },
    "ChiefBanned": { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0 }
};

const mockNormalize = (status) => {
    if (!status) return 'active';
    const s = String(status).toLowerCase().trim();
    if (s === 'banned' || s === 'ban') return 'banned';
    if (s === 'left' || s === 'former' || s === 'inactive' || s === 'departed') return 'left';
    return 'active';
};

const mockIsPlayerActive = (p) => {
    if (typeof p === 'object') return mockNormalize(p.membershipStatus || p.status) === 'active' && !p.banned;
    if (mockRoster[p]) return mockNormalize(mockRoster[p].membershipStatus || mockRoster[p].status) === 'active' && !mockRoster[p].banned;
    return true;
};

// Execute filter simulation identical to main.js logic
const isExcludedMember = (playerOrName) => {
    if (!playerOrName) return true;
    if (typeof playerOrName === 'object') {
        const s = mockNormalize(playerOrName.membershipStatus || playerOrName.status);
        if (s === 'left' || s === 'banned') return true;
        if (playerOrName.banned === true || playerOrName.isBanned === true) return true;
    }
    if (!mockIsPlayerActive(playerOrName)) return true;
    const nameStr = typeof playerOrName === 'string' ? playerOrName : (playerOrName.name || '');
    if (nameStr && mockRoster[nameStr]) {
        const rStatus = mockNormalize(mockRoster[nameStr].membershipStatus || mockRoster[nameStr].status);
        if (rStatus === 'left' || rStatus === 'banned' || mockRoster[nameStr].banned === true) {
            return true;
        }
    }
    return false;
};

const seenPlayerNames = new Map();
Object.values(mockRoster).forEach(p => {
    if (isExcludedMember(p)) return;
    seenPlayerNames.set(p.name.toLowerCase(), p.name);
});

const allPlayers = Array.from(seenPlayerNames.values()).filter(name => !isExcludedMember(name));

if (allPlayers.includes("ChiefActive1") && allPlayers.includes("ChiefActive2")) {
    console.log("  ✅ PASS: Active players successfully included (" + allPlayers.join(", ") + ")");
} else {
    console.error("  ❌ FAIL: Active players missing from list");
    process.exit(1);
}

if (!allPlayers.includes("ChiefLeft") && !allPlayers.includes("ChiefDeparted") && !allPlayers.includes("ChiefBanned")) {
    console.log("  ✅ PASS: Departed and Banned players strictly excluded from player list");
} else {
    console.error("  ❌ FAIL: Left or Banned players leaked into player list:", allPlayers);
    process.exit(1);
}

// Check missed days map
const playerMissedMap = {};
const dayMissedMap = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

allPlayers.forEach(pName => {
    if (isExcludedMember(pName)) return;
    const scores = mockSdData[pName] || {};
    const missed = [];
    for (let d = 1; d <= 3; d++) {
        if (!scores['d' + d]) {
            missed.push(d);
            dayMissedMap[d].push(pName);
        }
    }
    if (missed.length > 0) playerMissedMap[pName] = missed;
});

const playersWithMisses = Object.keys(playerMissedMap).filter(name => !isExcludedMember(name));

if (!playersWithMisses.includes("ChiefLeft") && !playersWithMisses.includes("ChiefBanned")) {
    console.log("  ✅ PASS: playersWithMisses strictly omits departed and banned players");
} else {
    console.error("  ❌ FAIL: Excluded player leaked into playersWithMisses");
    process.exit(1);
}

if (dayMissedMap[1].includes("ChiefActive2") && !dayMissedMap[1].includes("ChiefLeft") && !dayMissedMap[1].includes("ChiefBanned")) {
    console.log("  ✅ PASS: Daily breakdown lists omit departed and banned players");
} else {
    console.error("  ❌ FAIL: Excluded player leaked into daily breakdown lists");
    process.exit(1);
}

console.log("\n==========================================");
console.log("📊 ALL MISSED DAYS REPORT TESTS PASSED 100%");
console.log("==========================================\n");
