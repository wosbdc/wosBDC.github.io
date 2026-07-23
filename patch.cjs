const fs = require('fs');

try {
  let content = fs.readFileSync('main.js', 'utf8');
  
  const searchStr = `    if (!isNaN(rawName) && rawName.length >= 7) {
       await refreshIdToNameMap();
       let foundName = idToNameMap[rawName];
       if (foundName) finalName = foundName;
       else if(window.showToast) {
          window.showToast("Could not resolve ID to player name", "error");
          return;
       }
    }`;
    
  const replaceStr = `    if (!isNaN(rawName) && rawName.length >= 7) {
       await refreshIdToNameMap();
       let foundName = idToNameMap[rawName];
       if (foundName) finalName = foundName;
       // If not found in roster, we just use the raw numeric ID they typed in,
       // because it might be a ghost entry that was orphaned in the database!
    }`;

  if (content.includes(searchStr)) {
      content = content.replace(searchStr, replaceStr);
      fs.writeFileSync('main.js', content, 'utf8');
      console.log('Successfully patched main.js');
  } else {
      console.log('Could not find target string in main.js');
  }
} catch (e) {
  console.error(e);
}
