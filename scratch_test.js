import fs from 'fs';

// Mock data matching the screenshot exactly
// Note: Google sheets API returns rows as arrays of strings. 
// If a cell is blank or merged, it might drop trailing cells, but leading empty cells are usually included as empty strings.
const mockRows = [
    ["", "Date:", "July 20 - 26 2026"],
    ["", "Alliance's", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Total"],
    ["", "[WWA] WhiteoutWarriors", "1,469,154", "1,076,313", "1,711,263", "1,213,145", "1,755,679", "2,111,001", "9,336,555"],
    ["", "Our Alliance", "15,004,563", "14,480,703", "18,679,782", "7,596,059", "13,009,754", "12,179,080", "80,949,941"],
    ["", "Horns", "1", "2", "2", "2", "2", "4", "13"],
    ["", "Winners", "BrianDCox", "Soulcrusher4217", "Thadwarf", "Thadwarf", "Thadwarf", "Thadwarf", "Thadwarf - 10 horns"],
    [],
    ["Ranking", "Member", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Total"],
    ["3", "BrianDCox", "4,881,161", "1,904,509", "755,438", "999,765", "381,875", "442,564", "9,365,312"],
    ["26", "Afu_D", "0", "0", "0", "0", "0", "0", "0"],
    ["9", "Miaow Queen", "627,850", "460,350", "309,225", "107,908", "63,800", "76,800", "1,645,933"],
    ["2", "Soulcrusher4217", "2,969,963", "4,937,979", "4,464,096", "1,624,156", "1,823,805", "3,474,804", "19,294,803"],
    ["1", "Thadwarf", "4,559,055", "2,335,039", "10,769,860", "2,645,813", "5,205,016", "4,000,581", "29,515,364"]
];

const code = fs.readFileSync('./main.js', 'utf8');

const parseStr = code.substring(code.indexOf('window.parseShowdownHistoryRows ='), code.indexOf('window.syncGoogleSheetsHistoryToVault'));
let calculateStr = code.substring(code.indexOf('function calculateAllTimeShowdown('), code.indexOf('function renderAvatarStack('));
calculateStr = calculateStr.replace('function calculateAllTimeShowdown(', 'window.calculateAllTimeShowdown = function(');

const script = \`
    const window = {};
    \${parseStr}
    \${calculateStr}
    
    let parsedEvents = window.parseShowdownHistoryRows(\${JSON.stringify(mockRows)});
    console.log("Parsed Events:", JSON.stringify(parsedEvents, null, 2));

    let allTime = window.calculateAllTimeShowdown(parsedEvents);
    console.log("All Time Stats:", JSON.stringify(allTime, null, 2));
\`;

fs.writeFileSync('scratch_test_run.js', script);
