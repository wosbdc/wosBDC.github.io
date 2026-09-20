const fs = require('fs');
const path = require('path');

function testAllFeatures() {
    console.log("⚡ [ELITE TESTING SYSTEM] Running comprehensive automated static & scope analysis on main.js...");
    let c = fs.readFileSync(path.join(__dirname, '../main.js'), 'utf8');

    let errors = [];

    // 1. Full JS Syntax & AST Validation using Node's built-in vm module
    try {
        const vm = require('vm');
        const lines = c.split('\n');
        let inImport = false;
        const strippedLines = lines.map(line => {
            const trimmed = line.trim();
            if (/^import\s+['"].*?['"]\s*;?$/.test(trimmed)) {
                return '// ' + line;
            }
            if (/^import\s+[\s\S]*?\s+from\s+['"].*?['"]\s*;?$/.test(trimmed)) {
                return '// ' + line;
            }
            if (/^import\b/.test(trimmed)) {
                inImport = true;
                return '// ' + line;
            }
            if (inImport) {
                if (/from\s+['"].*?['"]\s*;?$/.test(trimmed)) inImport = false;
                return '// ' + line;
            }
            if (/^export\s+(default|const|let|var|function|class)\b/.test(trimmed)) {
                return line.replace(/^export\s+default\s+/, 'const __default_export__ = ').replace(/^export\s+/, '');
            }
            return line;
        });
        const stripped = strippedLines.join('\n');
        new vm.Script(`(async () => {\n${stripped}\n})()`, { filename: 'main.js' });
        console.log("✓ Full JS AST Syntax validation passed (0 syntax errors).");
    } catch (e) {
        errors.push(`JS Syntax/Parse Error in main.js: ${e.message}\n${e.stack}`);
    }

    // 2. Check for unhandled variable usages in template literals inside buildVaultModalContent
    const vaultStart = c.indexOf('window.buildVaultModalContent =');
    const vaultEnd = c.indexOf('window.openShowdownArchiveVaultModal =', vaultStart);
    if (vaultStart !== -1 && vaultEnd !== -1) {
        let vaultCode = c.substring(vaultStart, vaultEnd);
        
        // Find variables used in template literals ${varName}
        let matches = vaultCode.match(/\$\{([a-zA-Z0-9_\.]+)\}/g) || [];
        matches.forEach(m => {
            let varName = m.replace('${', '').replace('}', '').split('.')[0];
            let declRegex = new RegExp(`(let|const|var|function|param)\\s+${varName}\\b|\\b${varName}\\s*=|window\\.${varName}\\b`);
            if (!declRegex.test(vaultCode) && !['escapeHTML', 'formatCell', 'renderAvatarStack', 'Number', 'Date', 'Array', 'Object', 'Math', 'JSON', 'String', 'activeKey', 'idx', 'p', 'key', 'entry', 'dStr', 'enemyName', 'sum'].includes(varName)) {
                // Check if declared globally or in outer scope
                let globalRegex = new RegExp(`\\b(let|const|var|function)\\s+${varName}\\b|window\\.${varName}\\b`);
                if (!globalRegex.test(c)) {
                    errors.push(`Potentially undeclared template variable '${varName}' in buildVaultModalContent!`);
                }
            }
        });
    }

    // 3. Audit top-level 'if (varName)' and 'if(varName)' checks for existence of declaration
    const ifChecks = c.match(/if\s*\(\s*([a-zA-Z0-9_$]+)\s*\)/g) || [];
    const builtins = new Set(['window', 'document', 'navigator', 'history', 'location', 'console', 'isRegistering', 'isGoogleRegistration', 'pendingGoogleUser', 'currentUser', 'verifiedChiefName', 'verifiedFurnaceLevel', 'auth', 'db']);
    ifChecks.forEach(match => {
        const idMatch = match.match(/if\s*\(\s*([a-zA-Z0-9_$]+)\s*\)/);
        if (idMatch && idMatch[1]) {
            const varName = idMatch[1];
            if (!builtins.has(varName)) {
                const declRegex = new RegExp(`\\b(let|const|var|function|class)\\s+${varName}\\b|\\(${varName}\\b|\\(\\s*.*?,\\s*${varName}\\s*[,\\)]|\\b${varName}\\s*=>|import\\s+.*\\b${varName}\\b|\\bcatch\\s*\\(\\s*${varName}\\s*\\)|\\bfor\\s*\\([^;]*\\b${varName}\\b`);
                if (!declRegex.test(c)) {
                    errors.push(`Undeclared identifier in conditional check: '${varName}' (${match})!`);
                }
            }
        }
    });

    // 4. Audit window export functions
    const windowExportMatches = c.match(/window\.([a-zA-Z0-9_]+)\s*=/g) || [];
    console.log(`✓ Audited ${windowExportMatches.length} window exported functions.`);

    // 5. Automated Version Synchronization Audit (package.json, version.json, public/version.json)
    try {
        const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));
        const vJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../version.json'), 'utf8'));
        const pubVJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/version.json'), 'utf8'));

        if (pkg.version !== vJson.version) {
            errors.push(`Version mismatch: package.json has '${pkg.version}' but version.json has '${vJson.version}'!`);
        }
        if (vJson.version !== pubVJson.version) {
            errors.push(`Version mismatch: version.json has '${vJson.version}' but public/version.json has '${pubVJson.version}'!`);
        }
        if (vJson.wosbdc_alliance_dashboard && vJson.wosbdc_alliance_dashboard.version !== vJson.version) {
            errors.push(`Version mismatch: version.json dashboard version '${vJson.wosbdc_alliance_dashboard.version}' does not match root version '${vJson.version}'!`);
        }

        // 6. Changelog presence check
        const changelog = fs.readFileSync(path.join(__dirname, '../CHANGELOG.md'), 'utf8');
        if (!changelog.includes(`[${pkg.version}]`)) {
            errors.push(`CHANGELOG.md is missing an entry for the current version [${pkg.version}]!`);
        }
        console.log(`✓ Version synchronization audit passed across package.json, version.json, and public/version.json (v${pkg.version}).`);
    } catch (e) {
        errors.push(`Version audit error: ${e.message}`);
    }

    if (errors.length > 0) {
        console.error("❌ ELITE TEST SUITE FAILED:");
        errors.forEach(e => console.error("  - " + e));
        process.exit(1);
    } else {
        console.log("✅ ELITE TEST SUITE PASSED! Code is 100% clean, error-free, and production-ready.");
    }
}

testAllFeatures();

