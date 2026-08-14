const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, '../main.js');
const code = fs.readFileSync(mainJsPath, 'utf-8');

// Auto-sync CHANGELOG.md to public/ folder so it's instantly available without CDN delay
try {
  const rootChangelog = path.join(__dirname, '../CHANGELOG.md');
  const publicChangelog = path.join(__dirname, '../public/CHANGELOG.md');
  if (fs.existsSync(rootChangelog)) {
    fs.copyFileSync(rootChangelog, publicChangelog);
  }
} catch(e) {}

console.log("🔍 Running Automated Window & Event Binding Audit...");

// Find all onclick="window.xxx(" or onclick="views.xxx("
const windowOnclickRegex = /onclick=["']window\.([a-zA-Z0-9_]+)\s*\(/g;
const viewsOnclickRegex = /onclick=["']views\.([a-zA-Z0-9_]+)\s*\(/g;

const missingHandlers = new Set();
let match;

// Test window.xxx calls (stateless check)
while ((match = windowOnclickRegex.exec(code)) !== null) {
    const fnName = match[1];
    const hasDef = code.includes(`window.${fnName} =`) || 
                   code.includes(`window.${fnName}=`) || 
                   new RegExp(`function\\s+${fnName}\\s*\\(`).test(code);
    if (!hasDef) {
        missingHandlers.add(`window.${fnName}`);
    }
}

// Test views.xxx calls (stateless check)
while ((match = viewsOnclickRegex.exec(code)) !== null) {
    const fnName = match[1];
    const hasDef = new RegExp(`${fnName}\\s*:\\s*async`).test(code) || 
                   new RegExp(`${fnName}\\s*:\\s*function`).test(code) || 
                   code.includes(`views.${fnName} =`) || 
                   code.includes(`views.${fnName}=`);
    if (!hasDef) {
        missingHandlers.add(`views.${fnName}`);
    }
}

if (missingHandlers.size > 0) {
    console.error("❌ CRITICAL ERROR: Found broken or unattached event handlers in main.js:");
    missingHandlers.forEach(h => console.error(`   - Missing handler definition: ${h}`));
    process.exit(1);
} else {
    console.log("✅ SUCCESS: All window and views onclick handlers are valid and defined!");
    process.exit(0);
}
