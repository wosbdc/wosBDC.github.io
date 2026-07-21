const fs = require('fs');
let content = fs.readFileSync('main.js', 'utf8');

const target = '       const sdRes = await window.fetchMergedShowdown();\r\n       const sdLiveData = sdRes.sdLiveData || {};\r\n       let allPlayers = Object.keys(sdLiveData);';

const replacement = `       const sdRes = await window.fetchMergedShowdown();
       const sdLiveData = sdRes.sdLiveData || {};
       
       let allPlayers = [];
       try {
          const rosterRawData = await fetchSheet("Chief's List");
          if (rosterRawData && rosterRawData.length > 0) {
             for (let i = 1; i < rosterRawData.length; i++) {
                if (rosterRawData[i][0]) allPlayers.push(rosterRawData[i][0].toString().trim());
             }
          }
       } catch(e) { console.error("Error fetching roster", e); }
       
       if (allPlayers.length === 0) allPlayers = Object.keys(sdLiveData);
       allPlayers = [...new Set(allPlayers)];`.replace(/\n/g, '\r\n');

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync('main.js', content);
    console.log('Replaced allPlayers logic successfully');
} else {
    console.log('Target string not found in main.js!');
}
