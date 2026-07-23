const fs = require('fs');
let content = fs.readFileSync('main.js', 'utf8');

content = content.replace("const { get, ref, remove } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js');\\n        const snap = await get(ref(window.db, 'beartrap_donations'));", "const snap = await get(ref(db, 'beartrap_donations'));");
content = content.replace("const { get, ref, remove } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js');\r\n        const snap = await get(ref(window.db, 'beartrap_donations'));", "const snap = await get(ref(db, 'beartrap_donations'));");
content = content.replace("const { get, ref, remove } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js');\n        const snap = await get(ref(window.db, 'beartrap_donations'));", "const snap = await get(ref(db, 'beartrap_donations'));");

content = content.replace("const { ref, remove } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js');\\n        await remove(ref(window.db, `beartrap_donations/${key}`));", "await remove(ref(db, `beartrap_donations/${key}`));");
content = content.replace("const { ref, remove } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js');\r\n        await remove(ref(window.db, `beartrap_donations/${key}`));", "await remove(ref(db, `beartrap_donations/${key}`));");
content = content.replace("const { ref, remove } = await import('https://www.gstatic.com/firebasejs/11.0.1/firebase-database.js');\n        await remove(ref(window.db, `beartrap_donations/${key}`));", "await remove(ref(db, `beartrap_donations/${key}`));");

// In case the template literals failed, let's just do it directly using a regex
content = content.replace(/const\s*{\s*get,\s*ref,\s*remove\s*}\s*=\s*await\s*import\('https:\/\/www\.gstatic\.com\/firebasejs\/11\.0\.1\/firebase-database\.js'\);\s*const\s*snap\s*=\s*await\s*get\(ref\(window\.db,\s*'beartrap_donations'\)\);/g, "const snap = await get(ref(db, 'beartrap_donations'));");

content = content.replace(/const\s*{\s*ref,\s*remove\s*}\s*=\s*await\s*import\('https:\/\/www\.gstatic\.com\/firebasejs\/11\.0\.1\/firebase-database\.js'\);\s*await\s*remove\(ref\(window\.db,\s*`beartrap_donations\/\$\{key\}`\)\);/g, "await remove(ref(db, `beartrap_donations/${key}`));");

fs.writeFileSync('main.js', content, 'utf8');
console.log('Patched');
