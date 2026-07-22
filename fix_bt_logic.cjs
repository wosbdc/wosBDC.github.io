const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

const oldBearTrapLogic = `         if (trapNum && board.rows.length > 0) {
            let firstRow = board.rows[0];
            let rawScore = firstRow[2] !== undefined ? firstRow[2].toString().replace(/,/g, "") : "0";
            let topScore = parseInt(rawScore) || 0;
            
            if (topScore === 0) {
               champName = "Pending...";
               champScore = "-";
            } else {
               champName = firstRow[1] ? firstRow[1].toString() : "Pending...";
               champScore = firstRow[2] !== undefined ? firstRow[2] : "-";
            }
         } else if (isAllTime && board.rows.length > 0) {`;

const bearTrapLogic = `         if (trapNum && btWinners[trapNum]) {
            if (isBearTrapActive) {
               champName = "Pending...";
               champScore = "-";
            } else {
               champName = btWinners[trapNum].name;
               champScore = btWinners[trapNum].score;
            }
         } else if (isAllTime && board.rows.length > 0) {`;

code = code.replace(oldBearTrapLogic, bearTrapLogic);

fs.writeFileSync('main.js', code, 'utf8');
console.log('Successfully updated champName logic!');
