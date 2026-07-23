const fs = require('fs');

try {
  let content = fs.readFileSync('main.js', 'utf8');
  
  // 1. Wipe instead of 0
  content = content.replace(
    `const donRef = ref(db, \`beartrap_donations/\${donKey}\`);\n        let donData = { name: finalName, current: 0, allTime: 0, lastUpdated: Date.now() };\n        await set(donRef, donData);\n        \n        resDiv.innerHTML = '<span style="color:var(--success)">✅ Successfully reset donations for ' + finalName + '.</span>';`,
    `const donRef = ref(db, \`beartrap_donations/\${donKey}\`);\n        await set(donRef, null);\n        \n        resDiv.innerHTML = '<span style="color:var(--success)">✅ Successfully wiped and removed ' + finalName + '.</span>';`
  );

  // 2. Add Modify Donations Toggle UI
  content = content.replace(
    `<h3 style="margin-top:0; color:var(--text-main); font-size:16px;">📝 Add Donations</h3>\n          <div id="beartrapEntries">`,
    `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">\n            <h3 style="margin:0; color:var(--text-main); font-size:16px;">📝 Modify Donations</h3>\n            <select id="beartrapMultiMode" style="padding:5px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main); font-size:12px;">\n              <option value="add">➕ Add Amounts</option>\n              <option value="remove">➖ Remove Amounts</option>\n            </select>\n          </div>\n          <div id="beartrapEntries">`
  );

  // 3. Add mode capture
  content = content.replace(
    `const adminName = idToNameMap[currentUser.gameId] || "Admin";\n      \n      let completed = 0;`,
    `const adminName = idToNameMap[currentUser.gameId] || "Admin";\n      const mode = document.getElementById('beartrapMultiMode') ? document.getElementById('beartrapMultiMode').value : 'add';\n      \n      let completed = 0;`
  );

  // 4. Update addAmt logic
  content = content.replace(
    `const addAmt = Number(entry.amount) || 0;\n           const donKey = entry.name.toLowerCase().replace(/[^a-z0-9]/g, '_');`,
    `let addAmt = Number(entry.amount) || 0;\n           if (mode === 'remove') addAmt = -Math.abs(addAmt);\n           const donKey = entry.name.toLowerCase().replace(/[^a-z0-9]/g, '_');`
  );

  // 5. Update HTML Output sign
  content = content.replace(
    `fetch(\`\${API_BASE_URL}?api=addDonation&name=\${encodeURIComponent(entry.name)}&amount=\${encodeURIComponent(entry.amount)}&admin=\${encodeURIComponent(adminName)}&token=\${encodeURIComponent(donToken)}\`).catch(() => null);\n           \n           resultsHTML += \`✅ <b>\${entry.name}</b>: +\${addAmt.toLocaleString()} (New Current Total: \${donData.current.toLocaleString()})<br>\`;`,
    `fetch(\`\${API_BASE_URL}?api=addDonation&name=\${encodeURIComponent(entry.name)}&amount=\${encodeURIComponent(addAmt)}&admin=\${encodeURIComponent(adminName)}&token=\${encodeURIComponent(donToken)}\`).catch(() => null);\n           \n           const sign = addAmt >= 0 ? '+' : '';\n           resultsHTML += \`✅ <b>\${entry.name}</b>: \${sign}\${addAmt.toLocaleString()} (New Current Total: \${donData.current.toLocaleString()})<br>\`;`
  );

  fs.writeFileSync('main.js', content, 'utf8');
  console.log('Successfully patched main.js');
} catch (e) {
  console.error(e);
}
