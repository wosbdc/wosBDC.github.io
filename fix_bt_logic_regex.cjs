const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const regex = /if \(trapNum && board\.rows\.length > 0\) \{[\s\S]*?\} else if \(isAllTime && board\.rows\.length > 0\) \{/;
const replacement = `if (trapNum && btWinners[trapNum]) {
            if (isBearTrapActive) {
               champName = "Pending...";
               champScore = "-";
            } else {
               champName = btWinners[trapNum].name;
               champScore = btWinners[trapNum].score;
            }
         } else if (isAllTime && board.rows.length > 0) {`;

code = code.replace(regex, replacement);

fs.writeFileSync('main.js', code, 'utf8');
console.log("Regex replacement complete.");
