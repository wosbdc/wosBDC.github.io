const fs = require('fs');
let content = fs.readFileSync('main.js', 'utf8');

const s1 = '  showdownDataEntry: async () => {\r\n    const mainContent = document.getElementById(\'mainContent\');\r\n    if (!mainContent) return;';
const r1 = '  showdownDataEntry: async () => {\r\n    const app = document.getElementById(\'app\');\r\n    if (!app) return;';
content = content.replace(s1, r1);

const s2 = '       mainContent.innerHTML = html;\r\n       \r\n       window._currentSdLiveData = sdLiveData;';
const r2 = '       app.innerHTML = html;\r\n       \r\n       window._currentSdLiveData = sdLiveData;';
content = content.replace(s2, r2);

const s3 = '       mainContent.innerHTML = \'<div class="card"><div class="loading" style="color:var(--danger);">Error loading Data Entry UI</div></div>\';';
const r3 = '       app.innerHTML = \'<div class="card"><div class="loading" style="color:var(--danger);">Error loading Data Entry UI</div></div>\';';
content = content.replace(s3, r3);

const s4 = '  showdownEventSettings: async () => {\r\n    const mainContent = document.getElementById(\'mainContent\');\r\n    if (!mainContent) return;';
const r4 = '  showdownEventSettings: async () => {\r\n    const app = document.getElementById(\'app\');\r\n    if (!app) return;';
content = content.replace(s4, r4);

const s5 = '       mainContent.innerHTML = html;\r\n       \r\n       document.getElementById(\'saveMetaBtn\').addEventListener';
const r5 = '       app.innerHTML = html;\r\n       \r\n       document.getElementById(\'saveMetaBtn\').addEventListener';
content = content.replace(s5, r5);

// Check if successful
if (content.includes('mainContent.innerHTML')) {
    content = content.replace(/mainContent\.innerHTML/g, 'app.innerHTML');
}

fs.writeFileSync('main.js', content);
console.log('Replaced in main.js');
