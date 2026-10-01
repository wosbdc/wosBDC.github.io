const fs = require('fs');
const path = require('path');

function testChampionshipArchive() {
    console.log('[TEST SUITE] Testing Championship Archive Vault features in main.js...');
    const mainJsPath = path.join(__dirname, '../main.js');
    const code = fs.readFileSync(mainJsPath, 'utf8');

    const errors = [];

    const requiredFunctions = [
        'deleteChampionshipArchive',
        'openEditChampionshipArchiveModal',
        'saveEditedChampionshipArchive',
        'restoreChampionshipArchive',
        'purgeBlankChampionshipArchives',
        'openChampionshipArchiveVaultModal',
        'renderChampionshipVaultBody',
        'archiveAndResetChampionshipSeason'
    ];

    requiredFunctions.forEach(fn => {
        if (!code.includes('window.' + fn + ' =') && !code.includes('window.' + fn + '=')) {
            errors.push('Missing function definition: window.' + fn);
        }
    });

    const deleteFnIdx = code.indexOf('window.deleteChampionshipArchive =');
    if (deleteFnIdx === -1) {
        errors.push('window.deleteChampionshipArchive not found');
    } else {
        const nextFnIdx = code.indexOf('window.openEditChampionshipArchiveModal =', deleteFnIdx);
        const deleteFnCode = code.substring(deleteFnIdx, nextFnIdx !== -1 ? nextFnIdx : deleteFnIdx + 1600);
        if (deleteFnCode.includes('currentUser.isAdmin')) {
            errors.push('deleteChampionshipArchive is still using legacy currentUser.isAdmin check!');
        }
        if (!deleteFnCode.includes('isAdminUser') && !deleteFnCode.includes('getAdminLevel')) {
            errors.push('deleteChampionshipArchive missing proper isAdminUser / getAdminLevel check!');
        }
    }

    const renderFnIdx = code.indexOf('window.renderChampionshipVaultBody =');
    if (renderFnIdx === -1) {
        errors.push('window.renderChampionshipVaultBody not found');
    } else {
        const nextFnIdx = code.indexOf('window.filterChampLeaderboard =', renderFnIdx);
        const renderFnCode = code.substring(renderFnIdx, nextFnIdx !== -1 ? nextFnIdx : renderFnIdx + 15000);
        if (renderFnCode.includes('currentUser.isAdmin')) {
            errors.push('renderChampionshipVaultBody is still using legacy currentUser.isAdmin check!');
        }
        if (!renderFnCode.includes('isAdminUser') && !renderFnCode.includes('getAdminLevel')) {
            errors.push('renderChampionshipVaultBody missing proper isAdminUser / getAdminLevel check!');
        }
        if (!renderFnCode.includes('deleteChampionshipArchive')) {
            errors.push('renderChampionshipVaultBody missing deleteChampionshipArchive button call!');
        }
        if (!renderFnCode.includes('openEditChampionshipArchiveModal')) {
            errors.push('renderChampionshipVaultBody missing openEditChampionshipArchiveModal button call!');
        }
        if (!renderFnCode.includes('restoreChampionshipArchive')) {
            errors.push('renderChampionshipVaultBody missing restoreChampionshipArchive button call!');
        }
    }

    const archiveFnIdx = code.indexOf('window.archiveAndResetChampionshipSeason =');
    if (archiveFnIdx !== -1) {
        const nextFnIdx = code.indexOf('window.openChampionshipArchiveVaultModal =', archiveFnIdx);
        const archiveFnCode = code.substring(archiveFnIdx, nextFnIdx !== -1 ? nextFnIdx : archiveFnIdx + 3000);
        if (!archiveFnCode.includes('BLANK SEASON WARNING') && !archiveFnCode.includes('hasAnyBattleData')) {
            errors.push('archiveAndResetChampionshipSeason missing blank season guard check!');
        }
    }

    // Score removal & report generator assertions
    if (code.includes('id="adm_champ_r${i}_our"')) {
        errors.push('adm_champ_r${i}_our score input should NOT exist in championshipAdmin');
    }
    if (code.includes('id="adm_champ_r${i}_enemy_score"')) {
        errors.push('adm_champ_r${i}_enemy_score score input should NOT exist in championshipAdmin');
    }
    if (code.includes('${ourScoreColor}')) {
        errors.push('ourScoreColor should be removed from public championship view');
    }
    if (code.includes('${enemyScoreColor}')) {
        errors.push('enemyScoreColor should be removed from public championship view');
    }
    if (!code.includes('window.getChampRoundReportData =')) {
        errors.push('window.getChampRoundReportData should be defined');
    }
    if (!code.includes('window.copyChampRoundReport =')) {
        errors.push('window.copyChampRoundReport should be defined');
    }
    if (!code.includes('window.copyChampFullReport =')) {
        errors.push('window.copyChampFullReport should be defined');
    }
    if (!code.includes('window.copyChampRoundReport(${i})')) {
        errors.push('Admin view should have Copy Report button for each round');
    }
    if (!code.includes('window.copyChampRoundReport(${rNum})')) {
        errors.push('Public view should have Copy Report button for each round');
    }
    if (!code.includes('window.copyChampFullReport()')) {
        errors.push('Full report copy button should be available');
    }
    if (!code.includes('window.extractAllianceTagOnly =')) {
        errors.push('window.extractAllianceTagOnly helper should be defined');
    }
    if (!code.includes('Alliance Championship Report\\n\\n            Round ${d.roundNum}: ${d.outcome}\\n   BDC: ${d.ourFlags} flags Vs ${oppTag} : ${d.enemyFlags} flags')) {
        errors.push('copyChampRoundReport should have centered alignment and colon formatting');
    }

    // Responsive mobile layout assertions
    const stylePath = path.join(__dirname, '../style.css');
    const styleContent = fs.readFileSync(stylePath, 'utf8');

    if (!styleContent.includes('.champ-match-card')) {
        errors.push('style.css must contain .champ-match-card styles');
    }
    if (!styleContent.includes('.champ-match-battle-row')) {
        errors.push('style.css must contain .champ-match-battle-row styles');
    }
    if (!styleContent.includes('grid-template-columns: 1fr auto 1fr')) {
        errors.push('.champ-match-battle-row must use balanced 3-column layout: 1fr auto 1fr');
    }
    if (!styleContent.includes('.champ-match-team')) {
        errors.push('style.css must contain .champ-match-team styles');
    }
    if (!styleContent.includes('.champ-match-vs-circle')) {
        errors.push('style.css must contain .champ-match-vs-circle styles');
    }
    if (!code.includes('class="champ-match-card')) {
        errors.push('main.js must render .champ-match-card for matchup cards');
    }
    if (!code.includes('class="champ-match-battle-row"')) {
        errors.push('main.js must render .champ-match-battle-row for 3-column battle layout');
    }
    if (!code.includes('class="champ-match-team our-team"')) {
        errors.push('main.js must render .champ-match-team.our-team for left team');
    }
    if (!code.includes('class="champ-match-team enemy-team"')) {
        errors.push('main.js must render .champ-match-team.enemy-team for right team');
    }

    // Vault modal specific assertions
    const vaultRenderIdx = code.indexOf('window.renderChampionshipVaultBody =');
    if (vaultRenderIdx !== -1) {
        const vaultRenderCode = code.substring(vaultRenderIdx, vaultRenderIdx + 7000);
        if (!vaultRenderCode.includes('class="champ-match-battle-row"')) {
            errors.push('renderChampionshipVaultBody must render .champ-match-battle-row for responsive mobile layout');
        }
        if (!vaultRenderCode.includes('champ-match-card')) {
            errors.push('renderChampionshipVaultBody must render .champ-match-card for responsive cards');
        }
    }

    // Clean status text assertion
    if (!code.includes('window.cleanChampStatusText =')) {
        errors.push('main.js must define window.cleanChampStatusText');
    }
    if (code.includes(": ' (Championship Series)'")) {
        errors.push('autoCalculateChampRecord must not append (Championship Series) suffix');
    }
    // Tab label assertions
    if (!code.includes('📋 Signups')) {
        errors.push('views.championshipAdmin must render renamed tab: 📋 Signups');
    }
    if (!code.includes('⚔️ Season Edit')) {
        errors.push('views.championshipAdmin must render renamed tab: ⚔️ Season Edit');
    }
    if (code.includes('Member Signups & Roster Tracker')) {
        errors.push('Old tab label "Member Signups & Roster Tracker" should be replaced with "Signups"');
    }
    if (code.includes('5-Round Matchups & Scores Entry')) {
        errors.push('Old tab label "5-Round Matchups & Scores Entry" should be replaced with "Season Edit"');
    }

    if (errors.length > 0) {
        console.error('FAILED: Championship Archive Test Failed:');
        errors.forEach(e => console.error('  - ' + e));
        process.exit(1);
    } else {
        console.log('PASSED: Championship Archive Test Passed: All permission checks, vault controls, blank season guards, and mobile responsive layout verified!');
        process.exit(0);
    }
}

testChampionshipArchive();