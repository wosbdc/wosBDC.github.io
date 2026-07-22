const fs = require('fs');
let code = fs.readFileSync('main.js', 'utf8');

// 1. Add datalist generation logic inside views.beartrap
const datalistGenTarget = /app\.innerHTML = `/;
const datalistGenStr = `await refreshIdToNameMap();
    let datalistHtml = '<datalist id="beartrapRosterDatalist">';
    for (const [id, name] of Object.entries(idToNameMap)) {
        datalistHtml += '<option value="' + id + '">' + name + '</option>';
        datalistHtml += '<option value="' + name + '">' + name + '</option>';
    }
    datalistHtml += '</datalist>';
    
    app.innerHTML = \`
      \${datalistHtml}
`;
code = code.replace(datalistGenTarget, datalistGenStr);

// 2. Add list attribute to beartrapLookup input
const lookupInputTarget = /<input type="text" id="beartrapLookup" placeholder="Player Name\.\.\." style="flex:1;/;
const lookupInputStr = `<input type="text" id="beartrapLookup" list="beartrapRosterDatalist" placeholder="Player Name or ID..." style="flex:1;`;
code = code.replace(lookupInputTarget, lookupInputStr);

// 3. Add list attribute to beartrapCrownName input
const crownInputTarget = /<input type="text" id="beartrapCrownName" placeholder="Player Name\.\.\." style="padding:10px;/;
const crownInputStr = `<input type="text" id="beartrapCrownName" list="beartrapRosterDatalist" placeholder="Player Name or ID..." style="padding:10px;`;
code = code.replace(crownInputTarget, crownInputStr);

// 4. Add list attribute to .bt-name input
const btNameTarget = /<input type="text" class="bt-name" placeholder="Player Name\.\.\." style="flex:2;/;
const btNameStr = `<input type="text" class="bt-name" list="beartrapRosterDatalist" placeholder="Player Name or ID..." style="flex:2;`;
code = code.replace(btNameTarget, btNameStr);

// Wait, the .bt-name input is also added dynamically when "Add Row" is clicked!
// Let's also patch window.addBeartrapRow
const addRowTarget = /<input type="text" class="bt-name" placeholder="Player Name\.\.\." style="flex:2;/g;
code = code.replace(addRowTarget, `<input type="text" class="bt-name" list="beartrapRosterDatalist" placeholder="Player Name or ID..." style="flex:2;`);

fs.writeFileSync('main.js', code, 'utf8');
console.log("Successfully added datalists!");
