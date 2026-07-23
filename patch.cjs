const fs = require('fs');

try {
  let content = fs.readFileSync('main.js', 'utf8');
  
  const targetRegex = /if\s*\(Object\.keys\(fbBtDonations\)\.length\s*>\s*0\s*&&\s*titleLower\.includes\('donation'\)\)\s*\{\s*if\s*\(titleLower\.includes\('all-time'\)\)\s*\{\s*const\s*list\s*=\s*Object\.values\(fbBtDonations\)\.filter\(d\s*=>\s*\(d\.allTime\s*\|\|\s*d\.amount\)\s*>\s*0\)\.sort\(\(a,b\)\s*=>\s*\(b\.allTime\s*\|\|\s*b\.amount\)\s*-\s*\(a\.allTime\s*\|\|\s*a\.amount\)\);\s*if\s*\(list\.length\s*>\s*0\)\s*board\.rows\s*=\s*list\.map\(\(d,\s*idx\)\s*=>\s*\[idx\s*\+\s*1,\s*d\.name,\s*d\.allTime\s*\|\|\s*d\.amount\]\);\s*\}\s*else\s*\{\s*const\s*list\s*=\s*Object\.values\(fbBtDonations\)\.filter\(d\s*=>\s*\(d\.current\s*\|\|\s*d\.amount\)\s*>\s*0\)\.sort\(\(a,b\)\s*=>\s*\(b\.current\s*\|\|\s*b\.amount\)\s*-\s*\(a\.current\s*\|\|\s*a\.amount\)\);\s*if\s*\(list\.length\s*>\s*0\)\s*board\.rows\s*=\s*list\.map\(\(d,\s*idx\)\s*=>\s*\[idx\s*\+\s*1,\s*d\.name,\s*d\.current\s*\|\|\s*d\.amount\]\);\s*\}\s*\}/;

  const replaceStr = `if (Object.keys(fbBtDonations).length > 0 && titleLower.includes('donation')) {
            if (titleLower.includes('all-time')) {
                let mergedScores = {};
                if (board.rows) {
                    board.rows.forEach(r => {
                        mergedScores[r[1]] = parseInt(String(r[2]).replace(/,/g, '')) || 0;
                    });
                }
                Object.values(fbBtDonations).forEach(d => {
                    let fbAmt = d.allTime || d.amount || 0;
                    if (fbAmt > 0) {
                        mergedScores[d.name] = (mergedScores[d.name] || 0) + fbAmt;
                    }
                });
                const list = Object.entries(mergedScores).filter(kv => kv[1] > 0).sort((a,b) => b[1] - a[1]);
                if (list.length > 0) board.rows = list.map((kv, idx) => [idx + 1, kv[0], kv[1]]);
            } else {
                const list = Object.values(fbBtDonations).filter(d => (d.current || d.amount) > 0).sort((a,b) => (b.current || b.amount) - (a.current || a.amount));
                if (list.length > 0) board.rows = list.map((d, idx) => [idx + 1, d.name, d.current || d.amount]);
            }
        }`;

  if (targetRegex.test(content)) {
      content = content.replace(targetRegex, replaceStr);
      fs.writeFileSync('main.js', content, 'utf8');
      console.log('Successfully patched main.js');
  } else {
      console.log('Could not find target string in main.js. Please check exact characters.');
  }
} catch (e) {
  console.error(e);
}
