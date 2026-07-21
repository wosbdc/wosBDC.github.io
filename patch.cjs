const fs = require('fs');
let content = fs.readFileSync('main.js', 'utf8');

const oldPlayerEditorLoop = `    const players = [];
    if (rosterRawData && rosterRawData.length > 0) {
      for (let i = 1; i < rosterRawData.length; i++) {
        let name = rosterRawData[i][0];
        if (name && name.toString().trim() !== "") {
          players.push(name.toString().trim());
        }
      }
    }`;

const newPlayerEditorLoop = `    const players = [];
    if (rosterRawData) {
        Object.values(rosterRawData).forEach(p => {
            if (p.name) players.push(p.name);
        });
    }`;

content = content.replace(oldPlayerEditorLoop.replace(/\n/g, '\r\n'), newPlayerEditorLoop.replace(/\n/g, '\r\n'));
fs.writeFileSync('main.js', content);
