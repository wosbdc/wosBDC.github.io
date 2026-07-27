import './style.css'
import { initPresence, listenToAuth, loginUser, logoutUser, registerUser, uploadAvatar, deleteAvatar, db, auth, requestPushPermission, listenForForegroundMessages, linkAltAccount, unlinkAltAccount, loginWithGoogle, resetPassword } from './src/firebase.js'
import { ref, onValue, get, set, remove, update } from 'firebase/database'
import pkg from './package.json'


// adminDeletePlayer is defined below at line ~1703 (single canonical definition)

window.fetchRoster = async () => {
   if (window.rosterCache) return window.rosterCache;
   try {
       const snap = await get(ref(db, 'roster_live'));
       if (snap.exists()) {
           window.rosterCache = snap.val();
           return window.rosterCache;
       }
   } catch(e) { console.warn('Firebase read error:', e); }
   
   const rosterRaw = await fetchSheet("Chief's List");
   let newRoster = {};
   if (rosterRaw && rosterRaw.length > 1) {
       for (let i = 1; i < rosterRaw.length; i++) {
           const name = rosterRaw[i][0] ? rosterRaw[i][0].toString().trim() : '';
           if (!name) continue;
           newRoster[name] = {
               name: name,
               gameId: rosterRaw[i][1] ? rosterRaw[i][1].toString().trim() : '',
               furnaceLevel: rosterRaw[i][2] || '',
               giftCodes: rosterRaw[i][3] || '',
               joinedDate: rosterRaw[i][4] || '',
               timeActive: rosterRaw[i][5] || ''
           };
       }
       try { await set(ref(db, 'roster_live'), newRoster); } catch(e) { console.warn('Could not seed Firebase', e); }
   }
   window.rosterCache = newRoster;
   return newRoster;
};


const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbxPlNaLMDn4LX7ZpbOc8O2VzQr055fnynJnyDinedM7stFe_PMdZWkpf8BMTrysH4U/exec';
const VERIFY_PROXY_URL = 'https://wos-vercel-proxy.vercel.app/api/verify'; // Dedicated proxy for Century Games ID verification (bypasses Google quota limits)

// Get a fresh Firebase ID token for the current user (replaces hardcoded APP_SECRET)
const getAuthToken = async () => {
  try {
    if (auth && auth.currentUser) {
      return await auth.currentUser.getIdToken(/* forceRefresh */ false);
    }
  } catch(e) { console.warn('getAuthToken failed:', e); }
  return null;
};


window.getFurnaceIconHtml = (level, size = 36) => {
    if (!level || level === "N/A") return '🔥 ' + level;
    let lv = parseInt(level, 10);
    if (isNaN(lv)) return '🔥 ' + level;
    if (lv <= 30) return `🔥 Lv ${lv}`;
    let n = Math.floor((lv - 30) / 5);
    let url = `https://gof-formal-avatar.akamaized.net/img/icon/stove_lv_${n}.png`;
    return `<img src="${url}" style="width:${size}px; height:${size}px; vertical-align:middle; margin-right:4px; object-fit:contain; image-rendering:-webkit-optimize-contrast;" />`;
};

// --- Security Helpers ---
window.escapeHTML = (str) => {
  if (typeof str !== 'string') str = String(str || '');
  return str.replace(/[&<>'"]/g, tag => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
  }[tag]));
};

window.formatTimeActiveShort = (str) => {
    if (!str || typeof str !== 'string') return str;
    let formatted = str.replace(/\s*years?/gi, 'y')
              .replace(/\s*months?/gi, 'm')
              .replace(/\s*days?/gi, 'd')
              .replace(/,\s*/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
              
    let filtered = formatted.split(' ').filter(part => !part.match(/^0[ymd]$/i)).join(' ');
    return filtered === '' ? '0d' : filtered;
};


// --- Settings Sidebar Logic ---
const settingsBtn = document.getElementById('settingsBtn');
const closeSidebar = document.getElementById('closeSidebar');
const settingsSidebar = document.getElementById('settingsSidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

const openSidebar = () => {
  // Force close any open autocomplete dropdowns to fix Apple/Safari bug
  document.querySelectorAll('.custom-autocomplete-dropdown').forEach(d => d.style.display = 'none');
  if(settingsSidebar) settingsSidebar.classList.add('open');
  if(sidebarOverlay) sidebarOverlay.classList.add('active');
};

const closeSidebarFunc = () => {
  if(settingsSidebar) settingsSidebar.classList.remove('open');
  if(sidebarOverlay) sidebarOverlay.classList.remove('active');
};

const mobileSettingsBtn = document.getElementById('mobileSettingsBtn');
if(mobileSettingsBtn) mobileSettingsBtn.addEventListener('click', () => {
  openSidebar();
  if(mobileMenu) mobileMenu.classList.remove('open'); // close the hamburger menu
});

if(settingsBtn) settingsBtn.addEventListener('click', openSidebar);
if(closeSidebar) closeSidebar.addEventListener('click', closeSidebarFunc);
if(sidebarOverlay) sidebarOverlay.addEventListener('click', closeSidebarFunc);

// --- Mobile Menu Logic ---
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');

if(mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', () => {
    // Force close any open autocomplete dropdowns
    document.querySelectorAll('.custom-autocomplete-dropdown').forEach(d => d.style.display = 'none');
    if(mobileMenu) mobileMenu.classList.toggle('open');
  });
}

// --- Theme Logic ---
const initTheme = () => {
  const savedTheme = localStorage.getItem('theme') || 'midnight';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  // Highlight the active card
  document.querySelectorAll('.theme-card').forEach(card => {
    if (card.getAttribute('data-theme') === savedTheme) {
      card.classList.add('active');
    } else {
      card.classList.remove('active');
    }
  });
};

document.querySelectorAll('.theme-card').forEach(card => {
  card.addEventListener('click', () => {
    if(!card) return;
    
    const theme = card.getAttribute('data-theme');
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Update active card
    document.querySelectorAll('.theme-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    
    // Auto-close sidebar to see changes
    closeSidebarFunc();
  });
});

initTheme();

// --- Push Notifications Logic ---
const enablePushBtn = document.getElementById('enablePushBtn');
const pushStatus = document.getElementById('pushStatus');
if (enablePushBtn) {
  enablePushBtn.addEventListener('click', async () => {
    try {
      enablePushBtn.textContent = 'Enabling...';
      enablePushBtn.disabled = true;
      const token = await requestPushPermission(currentUser ? currentUser.uid : null);
      if (token) {
        enablePushBtn.style.display = 'none';
        pushStatus.style.display = 'block';
        pushStatus.style.color = 'var(--success)';
        pushStatus.textContent = 'Subscribed to alerts!';
      }
    } catch(e) {
      console.error(e);
      enablePushBtn.textContent = 'Failed (Try Again)';
      enablePushBtn.disabled = false;
      pushStatus.style.display = 'block';
      pushStatus.style.color = '#ef4444';
      pushStatus.textContent = 'Failed to enable notifications. Ensure they are allowed in your browser settings.';
    }
  });
}

// Setup foreground message listener
listenForForegroundMessages((payload) => {
  const title = payload.notification?.title || 'New Alert';
  const body = payload.notification?.body || '';
  window.showToast(`🔔 ${title}\n${body}`, "error");
});


// --- Auth State & UI Logic ---
let currentUser = null;
const authSidebarBtn = document.getElementById('authSidebarBtn');
const authModalOverlay = document.getElementById('authModalOverlay');
const authModal = document.getElementById('authModal');
const closeAuthBtn = document.getElementById('closeAuthBtn');
const authToggleBtn = document.getElementById('authToggleBtn');
const authToggleText = document.getElementById('authToggleText');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authEmail = document.getElementById('authEmail');
const authPassword = document.getElementById('authPassword');
const authGameIdWrapper = document.getElementById('authGameIdWrapper');
const authGameId = document.getElementById('authGameId');
const authVerifyGameIdBtn = document.getElementById('authVerifyGameIdBtn');
// authChiefName removed — element does not exist in index.html (uses authChiefConfirm instead)
const authDateStarted = document.getElementById('authDateStarted');
const authErrorMsg = document.getElementById('authErrorMsg');
const authModalTitle = document.getElementById('authModalTitle');

let isRegistering = false;
export let avatarMap = {}; // Global cache for avatars
export let staffProfilesMap = {}; // Global cache for staff profiles

// Global mappings
export let idToNameMap = {};
export let nameToIdMap = {};
export let enrolledGameIds = new Set();

export const refreshIdToNameMap = async () => {
    try {
        const [rosterRawData, giftcodebotData] = await Promise.all([
            window.fetchRoster().catch(() => null),
            fetchSheet("giftcodebot").catch(() => null)
        ]);
        
        if (rosterRawData) {
            Object.values(rosterRawData).forEach(p => {
                if (p.name && p.gameId) {
                    idToNameMap[p.gameId.toString().trim()] = p.name.toString().trim();
                    nameToIdMap[p.name.toString().trim()] = p.gameId.toString().trim();
                }
            });
        }
        
        if (giftcodebotData && giftcodebotData.length > 1) {
            for (let i = 1; i < giftcodebotData.length; i++) {
                let name = giftcodebotData[i][1]; 
                let id = giftcodebotData[i][2]; 
                if (name && id) {
                    idToNameMap[id] = name.toString().trim();
                      nameToIdMap[name.toString().trim()] = id.toString().trim();
                  }
            }
        }
        // *** CRITICAL: Expose maps on window so inline onclick handlers can access them ***
        // main.js is an ES module. Variables declared with `export let` are NOT automatically
        // on window. Any inline onclick="..." that calls window.nameToIdMap or window.idToNameMap
        // will get undefined unless we explicitly assign them here.
        window.nameToIdMap = nameToIdMap;
        window.idToNameMap = idToNameMap;
        window.enrolledGameIds = enrolledGameIds;
    } catch(e) { console.error("Error refreshing ID map:", e); }
};

// Fetch all Gift Code enrollments natively from Firebase Realtime Database
window.fetchGiftcodeEnrollments = async () => {
    if (window.giftcodeCache) return window.giftcodeCache;
    try {
        const snap = await get(ref(db, 'giftcode_bot'));
        if (snap.exists()) {
            window.giftcodeCache = snap.val();
            return window.giftcodeCache;
        }
    } catch(e) { console.warn('Firebase giftcode_bot read error:', e); }

    // Seed from Google Sheets if Firebase node is empty
    let seededData = {};
    try {
        const gcb = await fetchSheet("giftcodebot");
        if (gcb && gcb.length > 1) {
            for (let i = 1; i < gcb.length; i++) {
                let name = gcb[i][1];
                let id = gcb[i][2] ? gcb[i][2].toString().trim() : '';
                if (id) {
                    seededData[id] = {
                        gameId: id,
                        name: name || '',
                        enrolled: true,
                        status: 'Active',
                        timestamp: Date.now()
                    };
                }
            }
            try { await set(ref(db, 'giftcode_bot'), seededData); } catch(e) { console.error(e); }
        }
    } catch(e) { console.error(e); }
    
    window.giftcodeCache = seededData;
    return seededData;
};

// Check if a player is enrolled in Gift Code Bot
window.isGiftcodeEnrolled = async (gameId) => {
    if (!gameId) return false;
    const gIdStr = gameId.toString().trim();
    const allEnrollments = await window.fetchGiftcodeEnrollments();
    if (allEnrollments && allEnrollments[gIdStr] && allEnrollments[gIdStr].enrolled) {
        return true;
    }
    return window.enrolledGameIds.has(gIdStr);
};

// Enroll a player natively into Firebase Realtime Database
window.enrollGiftcodeBot = async (gameId, chiefName) => {
    if (!gameId) return false;
    const gIdStr = gameId.toString().trim();
    const record = {
        gameId: gIdStr,
        name: chiefName || '',
        enrolled: true,
        status: 'Active',
        timestamp: Date.now()
    };
    
    try {
        await set(ref(db, `giftcode_bot/${gIdStr}`), record);
        if (window.giftcodeCache) {
            window.giftcodeCache[gIdStr] = record;
        }
        window.enrolledGameIds.add(gIdStr);
        return true;
    } catch(e) {
        console.warn("Failed to write giftcode_bot in Firebase", e);
        return false;
    }
};

// Fetch Frost Clan & Activity data natively from Firebase Realtime Database
window.fetchActivityData = async () => {
    if (window.activityCache) return window.activityCache;
    try {
        const snap = await get(ref(db, 'activity_live'));
        if (snap.exists()) {
            window.activityCache = snap.val();
            return window.activityCache;
        }
    } catch(e) { console.warn('Firebase activity_live read error:', e); }

    let seededData = [];
    try {
        const raw = await fetchSheet("activity ");
        if (raw && raw.length > 0) {
            seededData = raw;
            try { await set(ref(db, 'activity_live'), seededData); } catch(e) { console.error(e); }
        }
    } catch(e) { console.error(e); }

    window.activityCache = seededData;
    return seededData;
};

// Helper to clear all event-related in-memory caches across the entire app
window.clearAllEventCaches = () => {
    window.polarTerrorsCache = null;
    window.championshipCache = null;
    window.mercenaryCache = null;
    window.activityCache = null;
    window._activityMatrixLoaded = false;
};

// Fetch Championship Data natively from single master node activity_live
window.fetchChampionshipData = async () => {
    if (window.championshipCache) return window.championshipCache;
    const result = {};
    const isT = (v) => v === true || v === 'true' || v === 'yes' || v === 'YES' || v === 1;

    try {
        const snap = await get(ref(db, 'activity_live'));
        if (snap.exists()) {
            const actObj = snap.val() || {};
            if (typeof actObj === 'object') {
                Object.entries(actObj).forEach(([gid, rec]) => {
                    if (rec && typeof rec === 'object') {
                        result[gid] = {
                            gameId: gid,
                            name: rec.name || (window.idToNameMap && window.idToNameMap[gid]) || 'Chief',
                            signedUp: isT(rec.championship),
                            lastUpdated: rec.updatedAt || Date.now()
                        };
                    }
                });
            }
        }
    } catch(e) { console.warn("Firebase activity_live championship read error:", e); }

    // Ensure all roster players are represented
    if (window.idToNameMap) {
        Object.entries(window.idToNameMap).forEach(([gid, name]) => {
            if (!result[gid]) {
                result[gid] = { gameId: gid, name: name, signedUp: false, lastUpdated: Date.now() };
            }
        });
    }

    window.championshipCache = result;
    return result;
};

// Toggle Championship signup status natively in master node activity_live
window.toggleChampionshipStatus = async (gameId, forceStatus = null) => {
    if (!gameId) return false;
    const gIdStr = gameId.toString().trim();
    let data = {};
    try { data = await window.fetchChampionshipData(); } catch(e) { console.error(e); }

    const existing = data[gIdStr] || { gameId: gIdStr, name: (window.idToNameMap && window.idToNameMap[gIdStr]) || 'Chief', signedUp: false };
    const newSignedUpStatus = (forceStatus !== null) ? forceStatus : !existing.signedUp;
    const adminName = currentUser ? ((window.idToNameMap && window.idToNameMap[currentUser.gameId]) || currentUser.name || "Admin") : "Admin";
    const playerName = existing.name || (window.idToNameMap && window.idToNameMap[gIdStr]) || 'Chief';

    try {
        // 1. Write directly to master node activity_live
        try {
            await update(ref(db, `activity_live/${gIdStr}`), {
                name: playerName,
                championship: newSignedUpStatus,
                updatedAt: Date.now()
            });
        } catch(uErr) {
            const snap = await get(ref(db, `activity_live/${gIdStr}`));
            const currentRec = (snap && snap.exists()) ? snap.val() : { name: playerName };
            currentRec.name = playerName;
            currentRec.championship = newSignedUpStatus;
            currentRec.updatedAt = Date.now();
            await set(ref(db, `activity_live/${gIdStr}`), currentRec);
        }

        // 2. Secondary write for legacy node
        try {
            await set(ref(db, `championship/${gIdStr}`), {
                gameId: gIdStr, name: playerName, signedUp: newSignedUpStatus, lastUpdated: Date.now(), updatedBy: adminName
            });
        } catch(e) {}

        window.clearAllEventCaches();

        try {
            if (window.logAdminAction) {
                window.logAdminAction("Championship Signup Toggle", `Toggled ${playerName} (${gIdStr}) to ${newSignedUpStatus ? 'YES (✅)' : 'NO (❌)'}`);
            }
        } catch(e) {}
        
        try {
            const evToken = await getAuthToken().catch(() => '');
            const url = `${API_BASE_URL}?api=updateEvent&name=${encodeURIComponent(playerName)}&eventName=${encodeURIComponent("Alliance Championship")}&status=${encodeURIComponent(newSignedUpStatus ? 'yes' : 'no')}&admin=${encodeURIComponent(adminName)}&token=${encodeURIComponent(evToken)}`;
            fetch(url, { mode: 'no-cors' }).catch(() => null);
        } catch(e) {}

        return true;
    } catch(e) {
        console.error("Failed to toggle championship status in Firebase:", e);
        return false;
    }
};

// Fetch Mercenary Prestige Data natively from single master node activity_live
window.fetchMercenaryData = async () => {
    if (window.mercenaryCache) return window.mercenaryCache;
    const result = {};
    const isT = (v) => v === true || v === 'true' || v === 'yes' || v === 'YES' || v === 1;

    try {
        const snap = await get(ref(db, 'activity_live'));
        if (snap.exists()) {
            const actObj = snap.val() || {};
            if (typeof actObj === 'object') {
                Object.entries(actObj).forEach(([gid, rec]) => {
                    if (rec && typeof rec === 'object') {
                        result[gid] = {
                            gameId: gid,
                            name: rec.name || (window.idToNameMap && window.idToNameMap[gid]) || 'Chief',
                            signedUp: isT(rec.mercenary),
                            lastUpdated: rec.updatedAt || Date.now()
                        };
                    }
                });
            }
        }
    } catch(e) { console.warn("Firebase activity_live mercenary read error:", e); }

    // Ensure all roster players are represented
    if (window.idToNameMap) {
        Object.entries(window.idToNameMap).forEach(([gid, name]) => {
            if (!result[gid]) {
                result[gid] = { gameId: gid, name: name, signedUp: false, lastUpdated: Date.now() };
            }
        });
    }

    window.mercenaryCache = result;
    return result;
};

// Toggle Mercenary Prestige signup status natively in master node activity_live
window.toggleMercenaryStatus = async (gameId, forceStatus = null) => {
    if (!gameId) return false;
    const gIdStr = gameId.toString().trim();
    let data = {};
    try { data = await window.fetchMercenaryData(); } catch(e) { console.error(e); }

    const existing = data[gIdStr] || { gameId: gIdStr, name: (window.idToNameMap && window.idToNameMap[gIdStr]) || 'Chief', signedUp: false };
    const newSignedUpStatus = (forceStatus !== null) ? forceStatus : !existing.signedUp;
    const adminName = currentUser ? ((window.idToNameMap && window.idToNameMap[currentUser.gameId]) || currentUser.name || "Admin") : "Admin";
    const playerName = existing.name || (window.idToNameMap && window.idToNameMap[gIdStr]) || 'Chief';

    try {
        // 1. Write directly to master node activity_live
        try {
            await update(ref(db, `activity_live/${gIdStr}`), {
                name: playerName,
                mercenary: newSignedUpStatus,
                updatedAt: Date.now()
            });
        } catch(uErr) {
            const snap = await get(ref(db, `activity_live/${gIdStr}`));
            const currentRec = (snap && snap.exists()) ? snap.val() : { name: playerName };
            currentRec.name = playerName;
            currentRec.mercenary = newSignedUpStatus;
            currentRec.updatedAt = Date.now();
            await set(ref(db, `activity_live/${gIdStr}`), currentRec);
        }

        // 2. Secondary write for legacy node
        try {
            await set(ref(db, `mercenary/${gIdStr}`), {
                gameId: gIdStr, name: playerName, signedUp: newSignedUpStatus, lastUpdated: Date.now(), updatedBy: adminName
            });
        } catch(e) {}

        window.clearAllEventCaches();

        try {
            if (window.logAdminAction) {
                window.logAdminAction("Mercenary Prestige Toggle", `Toggled ${playerName} (${gIdStr}) to ${newSignedUpStatus ? 'YES (✅)' : 'NO (❌)'}`);
            }
        } catch(e) {}
        
        try {
            const evToken = await getAuthToken().catch(() => '');
            const url = `${API_BASE_URL}?api=updateEvent&name=${encodeURIComponent(playerName)}&eventName=${encodeURIComponent("Mercenary Prestige")}&status=${encodeURIComponent(newSignedUpStatus ? 'yes' : 'no')}&admin=${encodeURIComponent(adminName)}&token=${encodeURIComponent(evToken)}`;
            fetch(url, { mode: 'no-cors' }).catch(() => null);
        } catch(e) {}

        return true;
    } catch(e) {
        console.error("Failed to toggle mercenary status in Firebase:", e);
        return false;
    }
};

// Fetch Polar Terrors Data natively from single master node activity_live
window.fetchPolarTerrorsData = async () => {
    if (window.polarTerrorsCache) return window.polarTerrorsCache;
    const result = {};
    const isT = (v) => v === true || v === 'true' || v === 'yes' || v === 'YES' || v === 1;

    try {
        const snap = await get(ref(db, 'activity_live'));
        if (snap.exists()) {
            const actObj = snap.val() || {};
            if (typeof actObj === 'object') {
                Object.entries(actObj).forEach(([gid, rec]) => {
                    if (rec && typeof rec === 'object') {
                        result[gid] = {
                            gameId: gid,
                            name: rec.name || (window.idToNameMap && window.idToNameMap[gid]) || 'Chief',
                            signedUp: isT(rec.polarTerrors),
                            lastUpdated: rec.updatedAt || Date.now()
                        };
                    }
                });
            }
        }
    } catch(e) { console.warn("Firebase activity_live polarTerrors read error:", e); }

    // Ensure all roster players are represented
    if (window.idToNameMap) {
        Object.entries(window.idToNameMap).forEach(([gid, name]) => {
            if (!result[gid]) {
                result[gid] = { gameId: gid, name: name, signedUp: false, lastUpdated: Date.now() };
            }
        });
    }

    window.polarTerrorsCache = result;
    return result;
};

// Toggle Polar Terrors Status natively in master node activity_live
window.togglePolarTerrorsStatus = async (gameId, forceStatus = null) => {
    if (!gameId) return false;
    const gIdStr = gameId.toString().trim();
    let data = {};
    try { data = await window.fetchPolarTerrorsData(); } catch(e) { console.error(e); }

    const existing = data[gIdStr] || { gameId: gIdStr, name: (window.idToNameMap && window.idToNameMap[gIdStr]) || 'Chief', signedUp: false };
    const newSignedUpStatus = (forceStatus !== null) ? forceStatus : !existing.signedUp;
    const adminName = currentUser ? ((window.idToNameMap && window.idToNameMap[currentUser.gameId]) || currentUser.name || "Admin") : "Admin";
    const playerName = existing.name || (window.idToNameMap && window.idToNameMap[gIdStr]) || 'Chief';

    try {
        // 1. Write directly to master node activity_live
        try {
            await update(ref(db, `activity_live/${gIdStr}`), {
                name: playerName,
                polarTerrors: newSignedUpStatus,
                updatedAt: Date.now()
            });
        } catch(uErr) {
            const snap = await get(ref(db, `activity_live/${gIdStr}`));
            const currentRec = (snap && snap.exists()) ? snap.val() : { name: playerName };
            currentRec.name = playerName;
            currentRec.polarTerrors = newSignedUpStatus;
            currentRec.updatedAt = Date.now();
            await set(ref(db, `activity_live/${gIdStr}`), currentRec);
        }

        // 2. Secondary write for legacy node
        try {
            await set(ref(db, `polarterrors/${gIdStr}`), {
                gameId: gIdStr, name: playerName, signedUp: newSignedUpStatus, lastUpdated: Date.now(), updatedBy: adminName
            });
        } catch(e) {}

        window.clearAllEventCaches();

        try {
            if (window.logAdminAction) {
                window.logAdminAction("Polar Terrors Toggle", `Toggled ${playerName} (${gIdStr}) to ${newSignedUpStatus ? 'YES (✅)' : 'NO (❌)'}`);
            }
        } catch(e) {}
        
        try {
            const evToken = await getAuthToken().catch(() => '');
            const url = `${API_BASE_URL}?api=updateEvent&name=${encodeURIComponent(playerName)}&eventName=${encodeURIComponent("Polar Terrors")}&status=${encodeURIComponent(newSignedUpStatus ? 'yes' : 'no')}&admin=${encodeURIComponent(adminName)}&token=${encodeURIComponent(evToken)}`;
            fetch(url, { mode: 'no-cors' }).catch(() => null);
        } catch(e) {}
        
        return true;
    } catch(err) {
        console.error("Failed to toggle polar terrors status in Firebase:", err);
        return false;
    }
};

// Fetch Bear Trap Tracker Data
window.fetchBearTrapData = async () => {
    if (window.bearTrapCache) return window.bearTrapCache;
    try {
        const snap = await get(ref(db, 'beartrap'));
        if (snap.exists()) {
            window.bearTrapCache = snap.val();
            return window.bearTrapCache;
        }
    } catch(e) { console.warn("Firebase beartrap read error:", e); }

    let seeded = {};
    try {
        const [rawSheet, rosterData] = await Promise.all([
            fetchSheet("Bear Trap Tracker").catch(() => null),
            window.fetchRoster().catch(() => null)
        ]);

        if (rosterData) {
            Object.values(rosterData).forEach(p => {
                if (p.gameId) {
                    seeded[p.gameId.toString().trim()] = {
                        gameId: p.gameId.toString().trim(),
                        name: p.name || '',
                        signedUp: false,
                        lastUpdated: Date.now()
                    };
                }
            });
        }
        
        if (rawSheet && rawSheet.length > 1) {
            for (let i = 1; i < rawSheet.length; i++) {
                let pName = rawSheet[i][0] ? rawSheet[i][0].toString().trim() : '';
                let statusVal = rawSheet[i][1] ? rawSheet[i][1].toString().toLowerCase().trim() : '';
                let isSignedUp = (statusVal === 'yes' || statusVal === 'true' || statusVal === '✅' || statusVal === '1');
                
                let foundGid = window.nameToIdMap ? window.nameToIdMap[pName] : null;
                if (foundGid) {
                    if (!seeded[foundGid]) {
                        seeded[foundGid] = { gameId: foundGid, name: pName, signedUp: isSignedUp, lastUpdated: Date.now() };
                    } else {
                        seeded[foundGid].signedUp = isSignedUp;
                    }
                }
            }
        }
        try { await set(ref(db, 'beartrap'), seeded); } catch(e) { console.error(e); }
    } catch(e) { console.error(e); }

    window.bearTrapCache = seeded;
    return seeded;
};

// Toggle Bear Trap Status
window.toggleBearTrapStatus = async (gameId, forceStatus = null) => {
    if (!gameId) return false;
    const gIdStr = gameId.toString().trim();
    let data = {};
    try { data = await window.fetchBearTrapData(); } catch(e) { console.error(e); }

    const existing = data[gIdStr] || { gameId: gIdStr, name: (window.idToNameMap && window.idToNameMap[gIdStr]) || 'Chief', signedUp: false };
    
    const playerName = existing.name || (window.idToNameMap && window.idToNameMap[gIdStr]) || 'Chief';
    existing.name = playerName;
    const newSignedUpStatus = (forceStatus !== null) ? forceStatus : !existing.signedUp;
    existing.signedUp = newSignedUpStatus;
    existing.lastUpdated = Date.now();
    existing.updatedBy = currentUser ? ((window.idToNameMap && window.idToNameMap[currentUser.gameId]) || currentUser.name || "Admin") : "Admin";

    try {
        await set(ref(db, `beartrap/${gIdStr}`), existing);
        if (window.bearTrapCache) window.bearTrapCache[gIdStr] = existing;
        try {
            await update(ref(db, `activity_live/${gIdStr}`), {
                name: playerName,
                beartrap: newSignedUpStatus,
                updatedAt: Date.now()
            });
        } catch(e) {}
        
        try {
            if (window.logAdminAction) {
                window.logAdminAction("Bear Trap Toggle", `Toggled ${playerName} (${gIdStr}) to ${newSignedUpStatus ? 'YES (✅)' : 'NO (❌)'}`);
            }
        } catch(e) {}
        
        try {
            const evToken = await getAuthToken().catch(() => '');
            const adminName = currentUser ? ((window.idToNameMap && window.idToNameMap[currentUser.gameId]) || "Admin") : "Admin";
            const url = `${API_BASE_URL}?api=updateEvent&name=${encodeURIComponent(playerName)}&eventName=${encodeURIComponent("Bear Trap Tracker")}&status=${encodeURIComponent(newSignedUpStatus ? 'yes' : 'no')}&admin=${encodeURIComponent(adminName)}&token=${encodeURIComponent(evToken)}`;
            fetch(url, { mode: 'no-cors' }).catch(e => null);
        } catch(e) {}
        
        return true;
    } catch(err) {
        return false;
    }
};

window.updateBearTrapDonationInline = async (gameId, newDonationStr) => {
    if (!gameId) return false;
    const gIdStr = gameId.toString().trim();
    const chiefName = window.idToNameMap[gIdStr] || "Chief";
    const addAmt = Number(newDonationStr) || 0;
    
    const donKey = chiefName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const donRef = ref(db, `beartrap_donations/${donKey}`);
    
    try {
        const donSnap = await get(donRef);
        let donData = donSnap.val() || { name: chiefName, current: 0, allTime: 0 };
        donData.name = chiefName;
        let diff = addAmt - (donData.current || 0);
        donData.current = addAmt;
        donData.allTime = (donData.allTime || 0) + diff;
        donData.lastUpdated = Date.now();
        await set(donRef, donData);
           if (addAmt > 0) await window.autoSyncBtSignup(finalName);
        
        if (window.logAdminAction) {
            window.logAdminAction("Bear Trap Donation", `Updated ${chiefName}'s active donation to ${addAmt}`);
        }
        return true;
    } catch (e) {
        console.error("Failed to save bear trap donation", e);
        return false;
    }
};

// Fetch Leaderboards Data natively from Firebase Realtime Database with automated Google Sheets seeding
window.fetchLeaderboardsData = async () => {
    if (window.leaderboardsCache) return window.leaderboardsCache;

    try {
        const snap = await get(ref(db, 'leaderboards'));
        if (snap.exists() && snap.val() && Array.isArray(snap.val()) && snap.val().length > 0) {
            window.leaderboardsCache = snap.val();
            return window.leaderboardsCache;
        }
    } catch(e) {
        console.warn("Firebase leaderboards read error:", e);
    }

    let parsedBoards = [];
    try {
        const rawSheet = await fetchSheet("LeaderBoards");
        if (rawSheet && Array.isArray(rawSheet) && rawSheet.length > 0) {
            for (let r = 0; r < rawSheet.length; r++) {
                for (let c = 0; c < rawSheet[r].length; c++) {
                    let cell = rawSheet[r][c];
                    if (typeof cell === 'string' && (cell.toLowerCase().includes('leaderboard') || (cell.toLowerCase().includes('all-time') && (cell.toLowerCase().includes('bear') || cell.toLowerCase().includes('bt')) && cell.toLowerCase().includes('donation')))) {
                        let title = cell;
                        let headers = [];
                        let hc = c;
                        
                        // Read headers on the next row
                        if (r + 1 < rawSheet.length) {
                            while (hc < rawSheet[r+1].length && rawSheet[r+1][hc] !== "") {
                                headers.push(rawSheet[r+1][hc]);
                                hc++;
                            }
                        }
                        
                        // Read data rows starting from 2 rows down
                        let rows = [];
                        let dr = r + 2;
                        while (dr < rawSheet.length && rawSheet[dr][c] !== "") {
                            let rowData = [];
                            let hasPlayerData = false;
                            
                            for (let i = 0; i < headers.length; i++) {
                                let cellVal = rawSheet[dr][c + i];
                                rowData.push(cellVal);
                                if (i > 0 && cellVal !== "") {
                                    hasPlayerData = true;
                                }
                            }
                            
                            if (hasPlayerData) {
                                rows.push(rowData);
                            }
                            dr++;
                        }
                        
                        if (headers.length > 0) {
                            parsedBoards.push({ title, headers, rows });
                        }
                    }
                }
            }

            try { await set(ref(db, 'leaderboards'), parsedBoards); } catch(e) { console.error(e); }
        }
    } catch(e) {
        console.error("Leaderboards sheet fetch error:", e);
    }

    window.leaderboardsCache = parsedBoards;
    return parsedBoards;
};

// Register Service Worker for Mobile PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => {
        reg.update();
        console.log('PWA Service Worker registered:', reg.scope);
      })
      .catch(err => console.warn('PWA Service Worker registration failed:', err));
  });
}

// PWA Install Prompt Handler & UI Banner
let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  window.showPWAInstallBanner();
});

window.showPWAInstallBanner = () => {
  if (document.getElementById('pwaInstallBanner')) return;
  if (sessionStorage.getItem('pwaBannerDismissed')) return;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  const bannerHtml = `
    <div id="pwaInstallBanner" style="position:fixed; bottom:20px; left:50%; transform:translateX(-50%); width:90%; max-width:440px; background:var(--card-bg); border:1px solid var(--accent); border-radius:16px; padding:16px 20px; box-shadow:0 12px 40px rgba(0,0,0,0.8); z-index:99999; display:flex; align-items:center; justify-content:space-between; gap:12px; animation:slideUp 0.3s ease;">
      <div style="display:flex; align-items:center; gap:12px;">
        <div style="width:44px; height:44px; background:var(--accent); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px;">📱</div>
        <div>
          <div style="font-weight:bold; color:var(--text-main); font-size:14px;">Install WOS BDC App</div>
          <div style="font-size:11px; color:var(--text-muted);">Add to Home Screen for fast 1-tap access!</div>
        </div>
      </div>
      <div style="display:flex; gap:8px; align-items:center;">
        ${isIOS ? `
          <button onclick="window.showIOSPWAInstructions()" style="background:var(--accent); color:white; border:none; padding:8px 14px; border-radius:8px; font-weight:bold; font-size:12px; cursor:pointer;">How to Add</button>
        ` : `
          <button onclick="window.triggerPWAInstall()" style="background:var(--accent); color:white; border:none; padding:8px 14px; border-radius:8px; font-weight:bold; font-size:12px; cursor:pointer;">Install</button>
        `}
        <button onclick="document.getElementById('pwaInstallBanner').remove(); sessionStorage.setItem('pwaBannerDismissed', 'true');" style="background:transparent; border:none; color:var(--text-muted); font-size:18px; cursor:pointer; padding:0 4px;">✕</button>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', bannerHtml);
};

window.triggerPWAInstall = async () => {
  if (!deferredInstallPrompt) {
    if (window.showToast) window.showToast("Tap browser menu ➔ 'Add to Home Screen' to install!", "info");
    return;
  }
  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') {
    if (window.showToast) window.showToast("App installed successfully!", "success");
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.remove();
  }
  deferredInstallPrompt = null;
};

window.showIOSPWAInstructions = () => {
  if (window.customAlert) {
    window.customAlert("📱 To install on iOS:\n\n1. Tap the Share button at the bottom of Safari.\n2. Scroll down and tap 'Add to Home Screen'.\n3. Tap 'Add' in the top right!");
  } else {
    alert("📱 To install on iOS:\n\n1. Tap the Share button at the bottom of Safari.\n2. Scroll down and tap 'Add to Home Screen'.\n3. Tap 'Add' in the top right!");
  }
};


// Listen to Avatars globally
onValue(ref(db, 'avatars'), (snap) => {
  if (snap.val()) {
    avatarMap = snap.val();
  }
});

// Admin System
window.systemAdmins = {};
onValue(ref(db, 'config/admins'), (snap) => {
  window.systemAdmins = snap.val() || {};
  if (typeof window.renderStaffRoles === 'function') window.renderStaffRoles();
  if (typeof checkMaintenanceAccess === 'function') checkMaintenanceAccess();
  if (document.querySelector('.staff-grid')) views.staff();
});

onValue(ref(db, 'avatars'), (snap) => {
  avatarMap = snap.val() || {};
  if (document.querySelector('.staff-grid')) views.staff();
  if (document.querySelector('.r4-grid')) views.roster();
});

onValue(ref(db, 'staffProfiles'), (snap) => {
  staffProfilesMap = snap.val() || {};
  window.staffProfilesMap = staffProfilesMap; // Attach to window for global access
  if (document.querySelector('.staff-grid')) views.staff();
});

// Global Realtime Master Listener for Live Event Status across all devices
let _isFirstActivityLoad = true;
onValue(ref(db, 'activity_live'), async (snap) => {
  if (typeof window.clearAllEventCaches === 'function') {
    window.clearAllEventCaches();
  }

  if (_isFirstActivityLoad) {
    _isFirstActivityLoad = false;
    return;
  }

  // 1. If Polar Terrors Tracker page is currently open
  if (document.getElementById('pt-yes-count')) {
    if (typeof views.polarTerrorsAdmin === 'function') await views.polarTerrorsAdmin();
  }
  // 2. If Alliance Championship Tracker page is currently open
  else if (document.getElementById('champ-yes-count')) {
    if (typeof views.championshipAdmin === 'function') await views.championshipAdmin();
  }
  // 3. If Mercenary Prestige Tracker page is currently open
  else if (document.getElementById('merc-yes-count')) {
    if (typeof views.mercenaryAdmin === 'function') await views.mercenaryAdmin();
  }

  // 4. If Activity Matrix subtab is active in Admin Hub
  const matrixSubtab = document.getElementById('subtab-activity-matrix');
  if (matrixSubtab && matrixSubtab.style.display !== 'none') {
    if (typeof window.loadActivityMatrix === 'function') await window.loadActivityMatrix();
  }

  // 5. If a Player Profile card is currently open
  if (window.currentRosterChiefName && typeof window.renderCardForChief === 'function') {
    await window.renderCardForChief(window.currentRosterChiefName);
  }
});

window.unlinkAltAccountPrompt = async (gid) => {
    const confirmed = await window.customConfirm(`Are you sure you want to unlink Game ID ${gid}?`);
    if (!confirmed) return;
    try {
        await unlinkAltAccount(currentUser.uid, gid.toString().trim(), currentUser.linkedGameIds || []);
        if(window.showToast) window.showToast("Account unlinked.", "success");
        if (typeof window.activeViewFunc === 'function') window.activeViewFunc();
    } catch(e) {
        if(window.showToast) window.showToast(e.message, "error");
        else window.showToast(e.message, "error");
    }
};

// Add new player to Roster natively in Firebase roster_live & sync to GAS
window.addNewChiefToRoster = async (gameId, name, furnaceLevel = 'F30', dateStarted = '') => {
  if (!gameId || !name) throw new Error("Game ID and Chief Name are required.");
  const gIdStr = gameId.toString().trim();
  const cleanName = name.toString().trim();
  const cleanLevel = furnaceLevel ? furnaceLevel.toString().trim() : 'F30';
  const cleanDate = dateStarted || new Date().toISOString().split('T')[0];

  const record = {
    gameId: gIdStr,
    name: cleanName,
    furnaceLevel: cleanLevel,
    dateStarted: cleanDate,
    addedAt: Date.now()
  };

  // Write natively to Firebase roster_live
  await set(ref(db, `roster_live/${gIdStr}`), record);
  if (window.rosterCache) window.rosterCache[gIdStr] = record;
  if (window.idToNameMap) window.idToNameMap[gIdStr] = cleanName;
  if (window.nameToIdMap) window.nameToIdMap[cleanName] = gIdStr;

  // Log Admin Action
  if (window.logAdminAction) {
    window.logAdminAction("Add Roster Member", `Added new player ${cleanName} (${gIdStr}) to roster`, cleanName);
  }

  // Ping GAS backend as fallback
  try {
    const regToken = await getAuthToken();
    const url = `${API_BASE_URL}?api=registerNewPlayer&gameId=${encodeURIComponent(gIdStr)}&name=${encodeURIComponent(cleanName)}&dateStarted=${encodeURIComponent(cleanDate)}&level=${encodeURIComponent(cleanLevel)}${regToken ? '&token=' + encodeURIComponent(regToken) : ''}`;
    fetch(url, { mode: 'no-cors' }).catch(e => null);
  } catch(e) { console.error(e); }

  return record;
};

// Open Add Player Modal
window.openAddPlayerModal = () => {
  const existingModal = document.getElementById('addPlayerModal');
  if (existingModal) existingModal.remove();

  const todayStr = new Date().toISOString().split('T')[0];

  const modalHtml = `
    <div id="addPlayerModal" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); backdrop-filter:blur(5px); z-index:100050; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s ease;">
      <div style="background:var(--card-bg); border:1px solid var(--accent); border-radius:16px; padding:24px; width:90%; max-width:480px; box-shadow:0 20px 50px rgba(0,0,0,0.8); position:relative;">
        
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid var(--border); padding-bottom:12px;">
          <h3 style="margin:0; color:var(--text-main); font-size:20px; display:flex; align-items:center; gap:10px;">
            ➕ Add New Player to Roster
          </h3>
          <button onclick="document.getElementById('addPlayerModal').remove()" style="background:transparent; border:none; color:var(--text-muted); font-size:24px; cursor:pointer; padding:0; line-height:1;">&times;</button>
        </div>

        <form id="addPlayerForm" onsubmit="window.submitAddPlayerForm(event)" style="display:flex; flex-direction:column; gap:14px;">
          <div>
            <label style="display:block; margin-bottom:4px; font-size:12px; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">Game ID (Required)</label>
            <div style="display:flex; gap:8px;">
              <input type="text" id="newPlayerGameId" placeholder="e.g. 318843189" required style="flex:1; padding:10px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:15px; font-weight:bold;">
              <button type="button" id="verifyAddPlayerBtn" onclick="window.verifyAddPlayerGameId()" style="background:var(--accent); color:white; border:none; padding:10px 16px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:13px; flex-shrink:0;">🔍 Verify ID</button>
            </div>
          </div>

          <div>
            <label style="display:block; margin-bottom:4px; font-size:12px; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">Chief Name (Required)</label>
            <input type="text" id="newPlayerName" placeholder="e.g. BrianDCox" required style="width:100%; padding:10px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:15px; font-weight:bold;">
          </div>

          <div>
            <label style="display:block; margin-bottom:4px; font-size:12px; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">Furnace Level</label>
            <input type="text" id="newPlayerFurnace" placeholder="e.g. F30, FC1, FC2..." value="F30" style="width:100%; padding:10px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:15px;">
          </div>

          <div>
            <label style="display:block; margin-bottom:4px; font-size:12px; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">Date Joined</label>
            <input type="date" id="newPlayerDate" value="${todayStr}" style="width:100%; padding:10px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:15px;">
          </div>

          <div id="addPlayerStatus" style="font-size:13px; font-weight:bold; text-align:center;"></div>

          <div style="display:flex; gap:10px; margin-top:10px;">
            <button type="button" onclick="document.getElementById('addPlayerModal').remove()" style="flex:1; padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-weight:bold; cursor:pointer;">Cancel</button>
            <button type="submit" id="addPlayerSubmitBtn" style="flex:2; padding:12px; border-radius:8px; border:none; background:var(--success); color:white; font-weight:bold; cursor:pointer; font-size:15px;">💾 Save to Roster</button>
          </div>
        </form>

      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
};

// Verify Game ID & Auto-Fill Chief Name
window.verifyAddPlayerGameId = async () => {
  const gidInput = document.getElementById('newPlayerGameId');
  const nameInput = document.getElementById('newPlayerName');
  const furnaceInput = document.getElementById('newPlayerFurnace');
  const statusDiv = document.getElementById('addPlayerStatus');
  const btn = document.getElementById('verifyAddPlayerBtn');

  if (!gidInput || !gidInput.value.trim()) {
    statusDiv.style.color = '#ef4444';
    statusDiv.textContent = 'Please enter a Game ID to verify.';
    return;
  }

  const val = gidInput.value.trim();
  btn.disabled = true;
  btn.textContent = '...';
  statusDiv.style.color = 'var(--text-muted)';
  statusDiv.textContent = 'Verifying Game ID...';

  // 1. Check local alliance db first
  try {
     await refreshIdToNameMap();
     let rosterData = await window.fetchRoster();
     let matchedName = window.idToNameMap[val] || null;
     let matchedFurnace = "";

     if (rosterData) {
        const foundEntry = Object.values(rosterData).find(p => p.gameId && p.gameId.toString().trim() === val.toString().trim());
        if (foundEntry) {
            matchedName = foundEntry.name;
            matchedFurnace = foundEntry.furnaceLevel || "";
        }
     }

     if (matchedName) {
         nameInput.value = matchedName;
         if (matchedFurnace) furnaceInput.value = matchedFurnace;
         statusDiv.style.color = '#10b981';
         statusDiv.innerHTML = `✅ Found in Alliance Database: <strong>${escapeHTML(matchedName)}</strong>`;
         btn.disabled = false;
         btn.textContent = '🔍 Verify ID';
         return;
     }
  } catch(e) { console.error(e); }

  // 2. Query official Century Games server
  try {
    const response = await fetch(`${VERIFY_PROXY_URL}?id=${encodeURIComponent(val)}`);
    const data = await response.json();

    if (data.success && data.nickname) {
       nameInput.value = data.nickname;
       if (data.stove_lv) furnaceInput.value = `FC${data.stove_lv}` || `F${data.stove_lv}`;
       statusDiv.style.color = '#10b981';
       statusDiv.innerHTML = `🌐 Verified from Game Servers: <strong>${escapeHTML(data.nickname)}</strong>`;
    } else {
       statusDiv.style.color = '#ef4444';
       statusDiv.textContent = 'ID Not Found on Game Servers. You may enter details manually.';
    }
  } catch(err) {
    statusDiv.style.color = '#ef4444';
    statusDiv.textContent = 'Game server verification offline. You may enter details manually.';
  } finally {
    btn.disabled = false;
    btn.textContent = '🔍 Verify ID';
  }
};

window.submitAddPlayerForm = async (e) => {
  e.preventDefault();
  const gameId = document.getElementById('newPlayerGameId').value.trim();
  const name = document.getElementById('newPlayerName').value.trim();
  const furnaceLevel = document.getElementById('newPlayerFurnace').value.trim() || 'F30';
  const dateStarted = document.getElementById('newPlayerDate').value;
  const statusDiv = document.getElementById('addPlayerStatus');
  const btn = document.getElementById('addPlayerSubmitBtn');

  if (!gameId || !name) {
    statusDiv.style.color = '#ef4444';
    statusDiv.textContent = 'Please enter both Game ID and Chief Name.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Saving...';
  statusDiv.style.color = 'var(--text-muted)';
  statusDiv.textContent = 'Saving new member to Firebase...';

  try {
    await window.addNewChiefToRoster(gameId, name, furnaceLevel, dateStarted);
    if (window.showToast) window.showToast(`Added ${name} (${gameId}) to Roster!`, "success");
    document.getElementById('addPlayerModal').remove();
    if (typeof window.activeViewFunc === 'function') window.activeViewFunc();
    else if (views.roster) views.roster();
  } catch(err) {
    console.error(err);
    statusDiv.style.color = '#ef4444';
    statusDiv.textContent = err.message || 'Failed to add player.';
    btn.disabled = false;
    btn.textContent = '💾 Save to Roster';
  }
};

window.adminLinkAltAccountPrompt = async (uid, cName, currentLinksStr) => {
    const altId = await window.customPrompt(`Enter the Game ID of the Alt Account you want to link to ${cName}:`);
    if (!altId || altId.trim() === '') return;
    const currentLinks = currentLinksStr ? currentLinksStr.split(',') : [];
    try {
        await linkAltAccount(uid, altId.trim(), currentLinks);
        if (window.showToast) window.showToast(`Alt Account linked for ${cName}!`, "success");
        if (typeof window.activeViewFunc === 'function') window.activeViewFunc();
    } catch(e) {
        window.showToast(e.message, "error");
    }
};

window.adminUnlinkAltAccountPrompt = async (chiefName, altId) => {
    if (!(await window.customConfirm(`Are you sure you want to unlink ${altId} from ${chiefName}?`))) return;
    
    const gameId = window.nameToIdMap[chiefName];
    if (!gameId) {
        if(window.showToast) window.showToast("Could not find Game ID for " + chiefName, "error");
        else window.showToast("Could not find Game ID", "error");
        return;
    }
    
    try {
        const usersSnap = await get(ref(db, 'users'));
        const users = usersSnap.val() || {};
        let targetUid = null;
        let currentLinks = [];
        
        for (const [uid, u] of Object.entries(users)) {
            if (Number(u.gameId) === Number(gameId)) {
                targetUid = uid;
                currentLinks = u.linkedGameIds || [];
                break;
            }
        }
        
        if (!targetUid) {
            if(window.showToast) window.showToast("User is not registered on the site.", "error");
            return;
        }
        
        currentLinks = currentLinks.filter(id => id.toString().trim() !== altId.toString().trim());
        await set(ref(db, `users/${targetUid}/linkedGameIds`), currentLinks);
        
        if (window.showToast) window.showToast(`Unlinked ${altId} from ${chiefName}!`, "success");
        if (window.searchPlayerFull) window.searchPlayerFull(chiefName);
    } catch(e) {
        window.showToast(e.message, "error");
    }
};

window.adminLinkAltAccountPromptByChief = async (chiefName) => {
    const gameId = window.nameToIdMap[chiefName];
    if (!gameId) {
        if(window.showToast) window.showToast("Could not find Game ID for " + chiefName, "error");
        else window.showToast("Could not find Game ID", "error");
        return;
    }
    
    const altId = await window.customPrompt(`Enter the Game ID of the Alt Account you want to link to ${chiefName}:`);
    if (!altId || altId.trim() === '') return;
    
    try {
        const res = await fetch(`${API_BASE_URL}?api=adminLinkAlt&gameId=${encodeURIComponent(gameId)}&chiefName=${encodeURIComponent(chiefName)}&altGameId=${encodeURIComponent(altId.trim())}`);
        const json = await res.json();
        
        if (json.success) {
            if (window.showToast) window.showToast(`Alt Account linked for ${chiefName}!`, "success");
            if (document.getElementById('adminHubView')) window.views.admin();
            window.searchPlayerFull(chiefName);
        } else {
            window.customAlert(json.message || "Failed to link alt account.");
        }
    } catch(e) {
        window.showToast(e.message, "error");
    }
};


window.getAdminLevel = (user) => {
    if (!user || !user.gameId) return false;
    if (Number(user.gameId) === 318843189) return "R5"; // Root admin
    const val = window.systemAdmins[user.gameId];
    if (val === true || val === "R5") return "R5"; // Legacy support defaults to R5
    if (val === "R4") return "R4";
    return false;
  };

window.isAdminUser = (user) => {
  return window.getAdminLevel(user) !== false;
};

window.isGoogleAuthVerified = async () => {
    if (!currentUser || !auth || !auth.currentUser) return false;
    try {
        // We must check the token claims to see how they signed in for THIS specific session
        // providerData just lists all linked accounts, which could allow a weak password to bypass security
        const idTokenResult = await auth.currentUser.getIdTokenResult();
        return idTokenResult.claims.firebase.sign_in_provider === 'google.com';
    } catch (e) {
        console.warn("Failed to get sign-in provider:", e);
        return false;
    }
};

window.renderStaffRoles = () => {
    const container = document.getElementById('adminStaffListContainer');
    if (!container) return;
    
    let html = `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:10px; border-radius:8px; border:1px solid var(--border);">
          <div style="font-weight:bold; color:var(--text-main);">Diva (Root Admin)</div>
          <div style="display:flex; gap:10px; align-items:center;">
             <div style="color:var(--accent); font-size:12px; font-weight:bold; background:rgba(52,152,219,0.1); padding:2px 6px; border-radius:4px; border:1px solid rgba(52,152,219,0.3);">R5</div>
             <div style="color:var(--text-muted); font-size:12px;">318843189</div>
          </div>
        </div>
    `;
    
    html += Object.entries(window.systemAdmins).map(([gid, level]) => {
        let n = idToNameMap[gid] || "Not Found";
        let lvlStr = (level === true || level === "R5") ? "R5" : "R4";
        let lvlColor = (lvlStr === "R5") ? "#FFD700" : "var(--accent)";
        let lvlBg = (lvlStr === "R5") ? "rgba(255,215,0,0.1)" : "rgba(52,152,219,0.1)";
        
        return `
        <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:10px; border-radius:8px; border:1px solid var(--border);">
          <div style="font-weight:bold; color:var(--text-main);">${n}</div>
          <div style="display:flex; gap:10px; align-items:center;">
            <div style="color:${lvlColor}; font-size:12px; font-weight:bold; background:${lvlBg}; padding:2px 6px; border-radius:4px; border:1px solid ${lvlBg};">${lvlStr}</div>
            <div style="color:var(--text-muted); font-size:12px;">${gid}</div>
            <button onclick="window.revokeAdmin('${gid}')" style="background:var(--danger); color:#fff; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold;">Revoke</button>
          </div>
        </div>
        `;
    }).join('');
    
    container.innerHTML = html;
};

window.grantAdmin = async (gameId, level = 'R5') => {
  if (window.getAdminLevel(currentUser) !== 'R5') return;
  
  const cName = window.idToNameMap[gameId] ? window.idToNameMap[gameId] : "Unknown Chief";
  const confirmed = await window.customConfirm(`Are you sure you want to GRANT ${level} admin access to ${cName} (Game ID: ${gameId})?`);
  if (!confirmed) return;
  
  try {
    await set(ref(db, `config/admins/${gameId}`), level);
    window.systemAdmins[gameId] = level;
    window.showToast(`${level} access granted`, 'success');
    if (document.getElementById('adminHubView')) views.admin(); // refresh admin panel if open
    if (typeof window.activeViewFunc === 'function') window.activeViewFunc();
  } catch (e) {
    if (window.showToast) window.showToast(e.message, "error");
  }
};

window.revokeAdmin = async (gameId) => {
  if (window.getAdminLevel(currentUser) !== 'R5') return;
  if (gameId == 318843189) { if (window.showToast) window.showToast("Cannot revoke Root Admin.", "error"); return; }
  
  const cName = window.idToNameMap[gameId] ? window.idToNameMap[gameId] : "Unknown Chief";
  const confirmed = await window.customConfirm(`Are you sure you want to REVOKE admin access for ${cName} (Game ID: ${gameId})?`);
  if (!confirmed) return;
  
  try {
    await set(ref(db, `config/admins/${gameId}`), null);
    delete window.systemAdmins[gameId];
    window.showToast('Admin access revoked', 'error');
    if (document.getElementById('adminHubView')) views.admin(); // refresh admin panel if open
    if (typeof window.activeViewFunc === 'function') window.activeViewFunc();
  } catch (e) {
    if (window.showToast) window.showToast(e.message, "error");
  }
};

const adminSidebarBtn = document.getElementById('adminSidebarBtn');
const signOutSidebarBtn = document.getElementById('signOutSidebarBtn');


// --- Maintenance Mode State ---
let globalRosterRegisteredOnly = false;
onValue(ref(db, 'config/rosterRegisteredOnly'), (snapshot) => {
  globalRosterRegisteredOnly = snapshot.val() || false;
  // Auto-refresh roster if currently open
  const profContainer = document.getElementById('playerProfileContainer');
  if (profContainer && views && typeof views.roster === 'function') {
      // It's the roster view, might want to re-render but not strictly necessary for real-time
  }
});
let maintenanceMode = false;
let maintenanceEndTime = null;
let maintenanceCountdownInterval = null;
const maintenanceOverlay = document.getElementById('maintenanceOverlay');

const checkMaintenanceAccess = () => {
  const isAdmin = window.isAdminUser(currentUser);
  const adminBanner = document.getElementById('adminMaintenanceBanner');
  
  if (maintenanceMode) {
    if (isAdmin) {
      maintenanceOverlay.style.display = 'none';
      if(adminBanner) adminBanner.style.display = 'block';
    } else {
      maintenanceOverlay.style.display = 'flex';
      if(adminBanner) adminBanner.style.display = 'none';
      startMaintenanceCountdown();
    }
  } else {
    maintenanceOverlay.style.display = 'none';
    if(adminBanner) adminBanner.style.display = 'none';
    stopMaintenanceCountdown();
  }
};

// --- Maintenance Countdown Logic ---
function startMaintenanceCountdown() {
  const countdownEl = document.getElementById('maintenanceCountdown');
  const timerEl = document.getElementById('maintenanceTimer');
  const expiredEl = document.getElementById('maintenanceExpired');
  const noTimerEl = document.getElementById('maintenanceNoTimer');
  
  if (!maintenanceEndTime) {
    // No countdown set — show generic message
    if(countdownEl) countdownEl.style.display = 'none';
    if(expiredEl) expiredEl.style.display = 'none';
    if(noTimerEl) noTimerEl.style.display = 'block';
    return;
  }
  
  if(noTimerEl) noTimerEl.style.display = 'none';
  
  // Clear any existing interval
  if (maintenanceCountdownInterval) clearInterval(maintenanceCountdownInterval);
  
  const tick = () => {
    const now = Date.now();
    const diff = maintenanceEndTime - now;
    
    if (diff <= 0) {
      // Countdown expired — show "back any moment" message
      if(countdownEl) countdownEl.style.display = 'none';
      if(expiredEl) expiredEl.style.display = 'block';
      clearInterval(maintenanceCountdownInterval);
      maintenanceCountdownInterval = null;
      return;
    }
    
    // Show countdown
    if(countdownEl) countdownEl.style.display = 'block';
    if(expiredEl) expiredEl.style.display = 'none';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    let timeStr = '';
    if (days > 0) {
      timeStr = `${days}d ${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    } else if (hours > 0) {
      timeStr = `${hours}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
    } else {
      timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    
    if(timerEl) timerEl.textContent = timeStr;
  };
  
  tick(); // Run immediately
  maintenanceCountdownInterval = setInterval(tick, 1000);
}

function stopMaintenanceCountdown() {
  if (maintenanceCountdownInterval) {
    clearInterval(maintenanceCountdownInterval);
    maintenanceCountdownInterval = null;
  }
  const countdownEl = document.getElementById('maintenanceCountdown');
  const expiredEl = document.getElementById('maintenanceExpired');
  const noTimerEl = document.getElementById('maintenanceNoTimer');
  if(countdownEl) countdownEl.style.display = 'none';
  if(expiredEl) expiredEl.style.display = 'none';
  if(noTimerEl) noTimerEl.style.display = 'block';
}

// Listen for maintenanceEndTime changes
onValue(ref(db, 'config/maintenanceEndTime'), (snapshot) => {
  maintenanceEndTime = snapshot.val() || null;
  if (maintenanceMode) startMaintenanceCountdown();
});

window.doBeartrapCrown = async () => {
    const name = document.getElementById('beartrapCrownName').value.trim();
    const trap = document.getElementById('beartrapCrownTrap').value;
    if (!name) {
        window.showToast("Please enter a player name", "error");
        return;
    }
    
    // Check if the input is actually a game ID
    let finalName = name;
    if (!isNaN(name) && name.length >= 7) {
       await refreshIdToNameMap();
       let foundName = idToNameMap[name];
       if (foundName) finalName = foundName;
       else {
          window.showToast("Could not resolve ID to player name", "error");
          return;
       }
    }
    
    document.getElementById('btCrownModal').style.display = 'none';
    window._executeLogBearTrapWinner(finalName, trap);
};

window.openBtDbEditor = async () => {
    document.getElementById('btDbEditorModal').style.display = 'block';
    const contentDiv = document.getElementById('btDbEditorContent');
    contentDiv.innerHTML = '<p style="text-align:center; color:var(--text-muted);">Fetching live database...</p>';
    
    try {
        const snap = await get(ref(db, 'beartrap_donations'));
        if (!snap.exists() || !snap.val()) {
            contentDiv.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No entries found in database.</p>';
            return;
        }
        
        const data = snap.val();
        let html = '<table style="width:100%; border-collapse:collapse; margin-top:10px;">';
        html += '<tr style="border-bottom:1px solid var(--border); text-align:left;"><th style="padding:8px;">DB Key</th><th style="padding:8px;">Name</th><th style="padding:8px;">Current</th><th style="padding:8px;">All-Time</th><th style="padding:8px; text-align:right;">Action</th></tr>';
        
        for (const [key, val] of Object.entries(data)) {
            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05);">';
            html += '<td style="padding:8px; font-family:monospace; color:var(--text-muted);">' + key + '</td>';
            html += '<td style="padding:8px; font-weight:bold;">' + (val.name || 'Unknown') + '</td>';
            html += '<td style="padding:8px;">' + (val.current || 0).toLocaleString() + '</td>';
            html += '<td style="padding:8px;">' + (val.allTime || 0).toLocaleString() + '</td>';
            html += '<td style="padding:8px; text-align:right;"><button onclick="window.deleteBtDbEntry(\'' + key + '\')" style="background:var(--danger); color:#fff; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:11px;">X Delete</button></td>';
            html += '</tr>';
        }
        html += '</table>';
        contentDiv.innerHTML = html;
        
    } catch (e) {
        contentDiv.innerHTML = '<p style="color:var(--danger); text-align:center;">Error loading database: ' + e.message + '</p>';
    }
};

window.deleteBtDbEntry = async (key) => {
    let confirmDel = await window.customConfirm('🗑️ WARNING 🗑️\n\nAre you sure you want to permanently delete the raw database node: ' + key + '?\n\nThis action cannot be undone.');
    if (!confirmDel) return;
    
    try {
        await remove(ref(db, `beartrap_donations/${key}`));
        if(window.showToast) window.showToast("Node deleted successfully", "success");
        // Refresh the editor view
        window.openBtDbEditor();
    } catch (e) {
        if(window.showToast) window.showToast("Error deleting node: " + e.message, "error");
    }
};

window.doBeartrapResetPlayer = async () => {
    const rawName = document.getElementById('beartrapResetPlayerName').value.trim();
    if (!rawName) {
        window.showToast("Please enter a player name", "error");
        return;
    }
    
    let finalName = rawName;
    if (!isNaN(rawName) && rawName.length >= 7) {
       await refreshIdToNameMap();
       let foundName = idToNameMap[rawName];
       if (foundName) finalName = foundName;
    }
    
    let confirmReset = await window.customConfirm('🗑️ WARNING 🗑️\n\nAre you sure you want to completely WIPE all Bear Trap donations to 0 for ' + finalName + '?\n\nThis action cannot be undone.');
    if (!confirmReset) return;
    
    const resDiv = document.getElementById('beartrapResetPlayerResult');
    resDiv.innerHTML = '<span style="color:var(--text-muted)">Wiping data...</span>';
    
    try {
        const donKey = finalName.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const donRef = ref(db, `beartrap_donations/${donKey}`);
        let donData = { name: finalName, current: 0, allTime: 0, lastUpdated: Date.now() };
        await set(donRef, donData);
        
        resDiv.innerHTML = '<span style="color:var(--success)">✅ Successfully reset donations for ' + finalName + '.</span>';
        window.logAdminAction("Bear Trap Player Reset", `Wiped Bear Trap donations for ${finalName} to zero`, finalName);
        document.getElementById('beartrapResetPlayerName').value = '';
        setTimeout(() => {
            const modal = document.getElementById('btResetPlayerModal');
            const overlay = document.getElementById('btResetPlayerModalOverlay');
            if (modal) modal.style.display = 'none';
            if (overlay) overlay.style.display = 'none';
        }, 1500);
    } catch(e) {
        console.error("Error resetting BT player:", e);
        resDiv.innerHTML = '<span style="color:var(--danger)">❌ Error resetting player: ' + e.message + '</span>';
    }
};


window.syncAllSheetsToFirebase = async () => {
    const btn = document.getElementById('syncAllSheetsBtn');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '⚡ Syncing ALL Sheets ➔ Firebase...';
    }
    if (window.showToast) window.showToast("Starting Master Sync for ALL Sheets...", "accent");

    try {
        let stats = { btWins: 0, btDonations: 0, roster: 0, championship: 0, mercenary: 0, polar: 0, schedule: 0 };

        // Read existing Firebase nodes first for Math.max non-destructive protection
        const [existingWinsSnap, existingDonSnap] = await Promise.all([
            get(ref(db, 'beartrap_wins')),
            get(ref(db, 'beartrap_donations'))
        ]);
        const existingWins = existingWinsSnap.exists() ? (existingWinsSnap.val() || {}) : {};
        const existingDon = existingDonSnap.exists() ? (existingDonSnap.val() || {}) : {};

        // 1. Sync LeaderBoards (Bear Trap Wins & Donations)
        try {
            const rawSheet = await fetchSheet("LeaderBoards");
            if (rawSheet && Array.isArray(rawSheet) && rawSheet.length > 0) {
                let parsedBoards = [];
                for (let r = 0; r < rawSheet.length; r++) {
                    for (let c = 0; c < rawSheet[r].length; c++) {
                        let cell = rawSheet[r][c];
                        if (typeof cell === 'string' && (cell.toLowerCase().includes('leaderboard') || (cell.toLowerCase().includes('all-time') && (cell.toLowerCase().includes('bear') || cell.toLowerCase().includes('bt')) && cell.toLowerCase().includes('donation')))) {
                            let title = cell;
                            let headers = [];
                            let hc = c;
                            if (r + 1 < rawSheet.length) {
                                while (hc < rawSheet[r+1].length && rawSheet[r+1][hc] !== "") {
                                    headers.push(rawSheet[r+1][hc]);
                                    hc++;
                                }
                            }
                            let rows = [];
                            let dr = r + 2;
                            while (dr < rawSheet.length && rawSheet[dr][c] !== "") {
                                let rowData = [];
                                let hasPlayerData = false;
                                for (let i = 0; i < headers.length; i++) {
                                    let cellVal = rawSheet[dr][c + i];
                                    rowData.push(cellVal);
                                    if (i > 0 && cellVal !== "") hasPlayerData = true;
                                }
                                if (hasPlayerData) rows.push(rowData);
                                dr++;
                            }
                            if (headers.length > 0) parsedBoards.push({ title, headers, rows });
                        }
                    }
                }

                let winsAgg = JSON.parse(JSON.stringify(existingWins));
                let donAgg = JSON.parse(JSON.stringify(existingDon));

                parsedBoards.forEach(board => {
                    let t = board.title.toLowerCase();
                    let isDonation = t.includes('donation');
                    let isAllTime = t.includes('all-time');
                    let isBt1 = t.includes('bear trap 1');
                    let isBt2 = t.includes('bear trap 2');

                    board.rows.forEach(r => {
                        let pName = r[1] ? r[1].toString().trim() : null;
                        let val = parseInt(String(r[2]).replace(/,/g, '')) || 0;
                        if (!pName || val <= 0) return;

                        let key = pName.toLowerCase().replace(/[^a-z0-9]/g, '_');

                        if (isDonation) {
                            if (!donAgg[key]) donAgg[key] = { name: pName, current: 0, allTime: 0, lastUpdated: Date.now() };
                            donAgg[key].name = pName;
                            if (isAllTime) donAgg[key].allTime = Math.max(donAgg[key].allTime || 0, val);
                            else donAgg[key].current = Math.max(donAgg[key].current || 0, val);
                        } else {
                            if (!winsAgg[key]) winsAgg[key] = { name: pName, bt1: 0, bt2: 0, total: 0 };
                            winsAgg[key].name = pName;
                            if (isBt1) winsAgg[key].bt1 = Math.max(winsAgg[key].bt1 || 0, val);
                            else if (isBt2) winsAgg[key].bt2 = Math.max(winsAgg[key].bt2 || 0, val);
                        }
                    });
                });

                Object.values(winsAgg).forEach(w => {
                    w.total = (w.bt1 || 0) + (w.bt2 || 0);
                });

                for (const [key, val] of Object.entries(winsAgg)) {
                    await set(ref(db, `beartrap_wins/${key}`), val);
                    stats.btWins++;
                }

                for (const [key, val] of Object.entries(donAgg)) {
                    await set(ref(db, `beartrap_donations/${key}`), val);
                    stats.btDonations++;
                }
            }
        } catch(e) {
            console.warn("Error syncing LeaderBoards sheet:", e);
        }

        // 2. Sync Alliance Roster (Chief's List)
        try {
            const rosterData = await window.fetchRoster();
            if (rosterData) {
                await set(ref(db, 'roster_cache'), { data: rosterData, lastSynced: Date.now() });
                stats.roster = Array.isArray(rosterData) ? rosterData.length : 1;
            }
        } catch(e) {
            console.warn("Error syncing Roster sheet:", e);
        }

        // 3. Sync Alliance Championship Sheet
        try {
            const champData = await fetchSheet("Alliance Championship ");
            if (champData) {
                await set(ref(db, 'championship_cache'), { data: champData, lastSynced: Date.now() });
                stats.championship = Array.isArray(champData) ? champData.length : 1;
            }
        } catch(e) {
            console.warn("Error syncing Alliance Championship sheet:", e);
        }

        // 4. Sync Mercenary Prestige Sheet
        try {
            const mercData = await fetchSheet("Mercenary Prestige");
            if (mercData) {
                await set(ref(db, 'mercenary_cache'), { data: mercData, lastSynced: Date.now() });
                stats.mercenary = Array.isArray(mercData) ? mercData.length : 1;
            }
        } catch(e) {
            console.warn("Error syncing Mercenary Prestige sheet:", e);
        }

        // 5. Sync Polar Terrors Sheet
        try {
            const polarData = await fetchSheet("Polar Terrors");
            if (polarData) {
                await set(ref(db, 'polar_terrors_cache'), { data: polarData, lastSynced: Date.now() });
                stats.polar = Array.isArray(polarData) ? polarData.length : 1;
            }
        } catch(e) {
            console.warn("Error syncing Polar Terrors sheet:", e);
        }

        // 6. Sync Event Schedule Sheet
        try {
            const schedData = await fetchSheet("WhiteOut Survival");
            if (schedData) {
                await set(ref(db, 'schedule_cache'), { data: schedData, lastSynced: Date.now() });
                stats.schedule = Array.isArray(schedData) ? schedData.length : 1;
            }
        } catch(e) {
            console.warn("Error syncing Event Schedule sheet:", e);
        }

        // NOTE: Live Firebase Showdown data ('showdown') is 100% protected and untouched!

        window.logAdminAction("Firebase Master Sync All Sheets", `Completed master sync across ALL 8 sheets (LeaderBoards, Roster, Championship, Mercenary, Polar Terrors, Schedule) while protecting live Firebase Showdown data.`);
        if (window.showToast) window.showToast(`✅ Master Sync Complete for ALL Sheets! Firebase is 100% seeded (${stats.btWins} BT wins, ${stats.btDonations} BT donations, Roster, Championship, Mercenary, Polar & Schedule updated).`, "success");

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '⚡ Master Sync Sheets ➔ Firebase';
        }
    } catch (e) {
        console.error("Master sync error:", e);
        if (window.showToast) window.showToast("Error during Master Sync: " + e.message, "error");
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '⚡ Master Sync Sheets ➔ Firebase';
        }
    }
};

window.logAdminAction = async (actionType, details, targetPlayer = '') => {
    try {
        const adminName = (currentUser && currentUser.gameId && idToNameMap[currentUser.gameId]) 
            ? idToNameMap[currentUser.gameId] 
            : (currentUser && currentUser.email ? currentUser.email : "Admin");
        const adminEmail = currentUser ? (currentUser.email || "") : "";
        const logId = Date.now() + '_' + Math.random().toString(36).substr(2, 5);
        
        const now = new Date();
        const logItem = {
            id: logId,
            admin: adminName,
            email: adminEmail,
            action: actionType,
            details: details,
            target: targetPlayer,
            timestamp: Date.now(),
            dateStr: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            timeStr: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        };
        
        await set(ref(db, `admin_logs/${logId}`), logItem);
    } catch (e) {
        console.warn("Failed to write admin log to Firebase", e);
    }
};

window.resetBearTrapWinners = async () => {
    const confirmed = await window.customConfirm("Are you sure you want to reset both Bear Trap winners to 'Pending...'?");
    if (!confirmed) return;
    try {
        await Promise.all([
            set(ref(db, 'config/bearTrapWinners/1'), {name: "Pending...", score: "-", timestamp: Date.now()}),
            set(ref(db, 'config/bearTrapWinners/2'), {name: "Pending...", score: "-", timestamp: Date.now()})
        ]);
        window.logAdminAction("Bear Trap Reset", "Reset both Bear Trap 1 and Bear Trap 2 champions to Pending");
        window.showToast("Bear Trap Winners Reset to Pending!", "success");
        if (typeof views.beartrap === 'function') {
            await views.beartrap();
        }
    } catch(e) {
        console.error("Error resetting Bear Trap winners:", e);
        window.showToast("Error resetting: " + (e.message || "Permission Denied"), "error");
    }
};

window._executeLogBearTrapWinner = async (name, trap) => {
    window.showToast("Crowning Winner...", "accent");
    try {
        const adminName = currentUser ? (idToNameMap[currentUser.gameId] || "Admin") : "Admin";
        const token = await getAuthToken();
        const url = `${API_BASE_URL}?api=addBearTrapEventWin&name=${encodeURIComponent(name)}&trap=${encodeURIComponent(trap)}&admin=${encodeURIComponent(adminName)}&token=${encodeURIComponent(token)}`;
        const res = await fetch(url).then(r => r.json());
        
        if (res && res.success) {
            await set(ref(db, `config/bearTrapWinners/${trap}`), {
                name: name,
                score: res.newTotal,
                timestamp: Date.now()
            });
            
            // Update Firebase beartrap_wins natively
            const winKey = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
            const winRef = ref(db, `beartrap_wins/${winKey}`);
            const winSnap = await get(winRef);
            let winData = winSnap.val() || { name: name, bt1: 0, bt2: 0, total: 0 };
            if (String(trap) === '1') winData.bt1 = (winData.bt1 || 0) + 1;
            else if (String(trap) === '2') winData.bt2 = (winData.bt2 || 0) + 1;
            winData.total = (winData.bt1 || 0) + (winData.bt2 || 0);
            await set(winRef, winData);
            window.logAdminAction("Bear Trap Champion Crowned", `Crowned ${name} as Bear Trap ${trap} Winner (New Total: ${res.newTotal})`, name);

            window.showToast(`🏆 Successfully crowned ${name} as Champion! (New Total: ${res.newTotal})`, "success");
            window.searchPlayerFull(name); // Refresh UI
        } else {
            window.showToast(`Error: ${res ? res.message : 'Unknown backend error'}`, "error");
        }
    } catch (e) {
        window.showToast(`Network Error: ${e.message}`, "error");
    }
};

  window.adminDeleteUserRow = async (uid, name) => {
      let confirmDelete = await window.customConfirm(`Are you sure you want to delete the Firebase account for ${name}?\n\nThis will wipe their website access.`);
      if (!confirmDelete) return;
      
      window.showToast("Deleting Account...", "danger");
      try {
          await remove(ref(db, `users/${uid}`));
          window.showToast(`Successfully deleted account.`, "success");
          if (document.getElementById('adminHubView')) views.admin();
      } catch (e) {
          if (window.showToast) window.showToast(e.message, "error");
      }
  };

  window.adminDeletePlayer = async (name) => {
    let confirmDelete = await window.customConfirm(`??? WARNING ???\n\nAre you sure you want to COMPLETELY DELETE ${name}?\n\nThis will remove them from the Chief's List, Giftcode Bot, wipe their ghost rows, AND permanently delete their Firebase account profile.\n\nThis action cannot be undone.`);
    if (!confirmDelete) return;
    
    window.showToast("Deleting Player...", "danger");
    try {
        const gameId = window.nameToIdMap[name];
        let targetUid = null;
        
        // Find their Firebase UID if they have an account
        if (gameId) {
            const usersSnap = await get(ref(db, 'users'));
            const users = usersSnap.val() || {};
            for (const [uid, u] of Object.entries(users)) {
                if (Number(u.gameId) === Number(gameId)) {
                    targetUid = uid;
                    break;
                }
            }
        }

        const token = await getAuthToken();
        const url = `${API_BASE_URL}?api=delete_player&name=${encodeURIComponent(name)}&token=${encodeURIComponent(token)}`;
        const res = await fetch(url).then(r => r.json());
        
        if (res && res.success) {
            // Delete from Firebase account system
            if (targetUid) {
                await remove(ref(db, `users/${targetUid}`));
            }
            
            // Instantly remove from local data so the player card disappears immediately
            if (typeof globalData !== 'undefined' && globalData && globalData.chiefsList) {
                globalData.chiefsList = globalData.chiefsList.filter(row => row[0] !== name);
            }
            
            window.showToast(`?? Successfully deleted ${name}.`, "success");
            if (document.querySelector('.admin-tab-content')) views.admin();
        } else {
            window.showToast(`Error: ${res ? res.message : 'Unknown backend error'}`, "error");
        }
    } catch (e) {
        window.showToast(`Network Error: ${e.message}`, "error");
    }
};

window.promptLogBearTrapWinner = async (name) => {
    let trapNum = await window.customPrompt(`Log Bear Trap Win for ${name}!\n\nWhich event did they win?\nEnter '1' for Bear Trap 1, or '2' for Bear Trap 2:`);
    if (trapNum === '1' || trapNum === '2') {
        window._executeLogBearTrapWinner(name, trapNum);
    } else if (trapNum !== null && trapNum.trim() !== "") {
        window.showToast("Invalid input. Please enter 1 or 2.", "error");
    }
};

window.toggleRosterFilter = async () => {
    try {
        await set(ref(db, 'config/rosterRegisteredOnly'), !globalRosterRegisteredOnly);
        window.showToast('Global Roster Filter toggled!', 'success');
        if (document.querySelector('.admin-tab-content')) views.admin();
    } catch(e) {
        window.showToast(e.message, "error");
    }
};

window.toggleMaintenance = async () => {
  if (maintenanceMode) {
    // Turning OFF — just disable it
    try {
      await set(ref(db, 'config/maintenanceMode'), false);
      await set(ref(db, 'config/maintenanceEndTime'), null);
      window.showToast('Maintenance mode is now OFF', 'success');
      if (app.querySelector('#adminHubView')) views.admin();
    } catch (err) {
      window.showToast(err.message, "error");
    }
    return;
  }
  
  // Turning ON — show duration picker
  const modal = document.createElement('div');
  modal.id = 'maintenanceDurationModal';
  modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); z-index:10001; display:flex; justify-content:center; align-items:center;';
  
  modal.innerHTML = `
    <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:12px; padding:30px; max-width:400px; width:90%; box-shadow:0 10px 30px rgba(0,0,0,0.5);">
      <h2 style="margin:0 0 5px 0; color:var(--danger); font-size:20px;">🚧 Enable Maintenance Mode</h2>
      <p style="margin:0 0 20px 0; color:var(--text-muted); font-size:13px;">How long will maintenance take? This countdown will be shown to all users.</p>
      
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px;">
        <button class="maint-dur-btn" data-minutes="60" style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); cursor:pointer; font-weight:bold; font-size:14px; transition:0.2s;">1 hour</button>
        <button class="maint-dur-btn" data-minutes="120" style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); cursor:pointer; font-weight:bold; font-size:14px; transition:0.2s;">2 hours</button>
        <button class="maint-dur-btn" data-minutes="1440" style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); cursor:pointer; font-weight:bold; font-size:14px; transition:0.2s;">24 hours</button>
        <button class="maint-dur-btn" data-minutes="2880" style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); cursor:pointer; font-weight:bold; font-size:14px; transition:0.2s;">48 hours</button>
      </div>
      
      <p style="margin:0 0 5px 0; color:var(--text-main); font-size:13px; font-weight:bold;">Or set a custom duration:</p>
      <div style="display:flex; gap:10px; align-items:center; margin-bottom:15px;">
        <input type="number" id="customMaintHours" placeholder="Hours" min="0.5" step="0.5" style="flex:1; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:14px; box-sizing:border-box;">
        <button id="customMaintBtn" style="padding:10px 16px; border-radius:8px; border:none; background:var(--accent); color:#fff; cursor:pointer; font-weight:bold; font-size:14px;">Go</button>
      </div>
      
      <p style="margin:0 0 5px 0; color:var(--text-main); font-size:13px; font-weight:bold;">Or set an exact date & time:</p>
      <div style="display:flex; gap:10px; align-items:center; margin-bottom:20px;">
        <input type="date" id="customMaintDateOnly" style="flex:1; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:14px; box-sizing:border-box;">
        <input type="time" id="customMaintTimeOnly" style="flex:1; padding:10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:14px; box-sizing:border-box;">
        <button id="customMaintDateBtn" style="padding:10px 16px; border-radius:8px; border:none; background:var(--accent); color:#fff; cursor:pointer; font-weight:bold; font-size:14px;">Set</button>
      </div>
      
      <div style="display:flex; gap:10px;">
        <button id="noCountdownBtn" style="flex:1; padding:10px; border-radius:8px; border:1px solid var(--border); background:transparent; color:var(--text-muted); cursor:pointer; font-weight:bold; font-size:13px;">No Countdown</button>
        <button id="cancelMaintBtn" style="flex:1; padding:10px; border-radius:8px; border:1px solid var(--border); background:transparent; color:var(--text-muted); cursor:pointer; font-weight:bold; font-size:13px;">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const activateMaintenance = async (endTime, label) => {
    modal.remove();
    try {
      await set(ref(db, 'config/maintenanceMode'), true);
      await set(ref(db, 'config/maintenanceEndTime'), endTime);
      window.showToast(`Maintenance mode ON${label ? ' — ' + label : ''}`, 'error', true);
      if (app.querySelector('#adminHubView')) views.admin();
    } catch (err) {
      window.showToast(err.message, "error");
    }
  };
  
  // Preset buttons
  modal.querySelectorAll('.maint-dur-btn').forEach(btn => {
    btn.addEventListener('mouseover', () => { btn.style.borderColor = 'var(--danger)'; btn.style.color = 'var(--danger)'; });
    btn.addEventListener('mouseout', () => { btn.style.borderColor = 'var(--border)'; btn.style.color = 'var(--text-main)'; });
    btn.addEventListener('click', () => {
      let minutes = parseInt(btn.getAttribute('data-minutes'));
      activateMaintenance(Date.now() + (minutes * 60 * 1000), minutes >= 60 ? (minutes/60) + ' hr countdown' : minutes + ' min countdown');
    });
  });
  
  // Custom hours
  document.getElementById('customMaintBtn').addEventListener('click', () => {
    const val = parseFloat(document.getElementById('customMaintHours').value);
    if (!val || val <= 0) { window.showToast('Please enter a valid number of hours.', "error"); return; }
    activateMaintenance(Date.now() + (val * 60 * 60 * 1000), val + ' hr countdown');
  });
  
  // Custom date
  document.getElementById('customMaintDateBtn').addEventListener('click', () => {
    const dateVal = document.getElementById('customMaintDateOnly').value;
    const timeVal = document.getElementById('customMaintTimeOnly').value;
    if (!dateVal || !timeVal) { window.showToast('Please select both a date and a time.', "error"); return; }
    
    // Combine date and time strings (e.g. "2023-10-15T14:30")
    const combinedStr = dateVal + 'T' + timeVal;
    const targetDate = new Date(combinedStr).getTime();
    if (targetDate <= Date.now()) { window.showToast('Please select a future date and time.', "error"); return; }
    activateMaintenance(targetDate, 'countdown set to ' + new Date(combinedStr).toLocaleString());
  });
  
  document.getElementById('noCountdownBtn').addEventListener('click', () => activateMaintenance(null, 'No countdown'));
  document.getElementById('cancelMaintBtn').addEventListener('click', () => modal.remove());
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
};

window.adminFetchAltFurnace = async (gid, spanId) => {
    try {
        const res = await fetch(`${VERIFY_PROXY_URL}?id=${encodeURIComponent(gid)}`);
        const data = await res.json();
        if (data.success && data.stove_lv) {
            const flEl = document.getElementById(spanId);
            if (flEl) {
                let flHtml = window.getFurnaceIconHtml ? window.getFurnaceIconHtml(data.stove_lv) : data.stove_lv;
                flEl.innerHTML = typeof flHtml === 'string' ? flHtml.replace('🔥 ', '').replace('Lv ', '') : flHtml;
            }
        }
    } catch(e) { console.error(e); }
};

window.getLivePlayerEventRow = async (chiefName, pRow, headers) => {
    if (!chiefName) return pRow;
    const row = pRow ? [...pRow] : [chiefName, 0, false, false, false, false];
    const playerGameId = window.nameToIdMap ? window.nameToIdMap[chiefName] : null;
    const gIdStr = (playerGameId && playerGameId.toString().trim()) ? playerGameId.toString().trim() : (chiefName ? chiefName.toLowerCase().replace(/[^a-z0-9]/g, '_') : '');

    if (!gIdStr) return row;

    try {
        const [actSnap, statsSnap] = await Promise.all([
            get(ref(db, `activity_live/${gIdStr}`)).catch(() => null),
            get(ref(db, `player_event_stats/${gIdStr}`)).catch(() => null)
        ]);

        const actData = (actSnap && actSnap.exists()) ? (actSnap.val() || {}) : {};
        const statsData = (statsSnap && statsSnap.exists()) ? (statsSnap.val() || {}) : null;

        const isT = (v) => v === true || v === 'true' || v === 'yes' || v === 'YES' || v === 1;

        const liveChamp = isT(actData.championship);
        const liveMerc = isT(actData.mercenary);
        const livePt = isT(actData.polarTerrors);
        const liveVoter = isT(actData.voter);

        const safeHeaders = headers || ["Chief Name", "ShowDown missed days", "Alliance Championship ", "Mercenary Prestige", "Polar Terrors", "Voter"];

        for (let col = 1; col < safeHeaders.length; col++) {
            const h = (safeHeaders[col] || '').toLowerCase();
            if (h.includes('championship')) {
                row[col] = liveChamp;
            } else if (h.includes('mercenary')) {
                row[col] = liveMerc;
            } else if (h.includes('polar')) {
                row[col] = livePt;
            } else if (h.includes('voter')) {
                row[col] = liveVoter;
            }
        }

        row._eventStats = statsData;
    } catch(e) { console.warn("Error fetching live player event status:", e); }

    return row;
};

  window.doPlayerLookup = async (playerName) => {
    let name = playerName ? playerName : document.getElementById('rosterPlayerSelect').value;
    if (!name) return;
    
    // Check if the input is actually a game ID
    if (!isNaN(name) && name.length >= 7) {
       await refreshIdToNameMap();
       let foundName = idToNameMap[name];
       if (foundName) name = foundName;
       else if(window.showToast) {
          window.showToast("Could not resolve ID to player name", "error");
          return;
       }
    }
    
    const resDiv = document.getElementById('rosterLookupResult');
    if (!resDiv) {
      if (document.getElementById('playerLookupCustomDropdown')) {
        document.getElementById('playerLookupCustomDropdown').style.display = 'none';
      }
      return;
    }
    
    resDiv.style.display = 'block';
    if (!window.liveData || !window.liveData["activity "]) {
      resDiv.innerHTML = '<div style="text-align:center; padding:20px;"><span style="color:var(--text-muted)">Querying master database...</span></div>';
    }
    
    try {

      

      const [data, rosterRawData, lbRawData, sdHistoryRawData, sdLiveSnap] = await Promise.all([
              window.fetchActivityData(),
              window.fetchRoster(),
              window.fetchLeaderboardsData(),
              fetchSheet("Showdown History"),
              get(ref(db, 'showdown_live'))
            ]);
      
      const sdLiveData = sdLiveSnap && sdLiveSnap.exists() ? sdLiveSnap.val() || {} : {};
  
      let currentDay = 0;
      Object.values(sdLiveData).forEach(p => {
         if (!p || typeof p !== 'object') return;
         if ((p.d6||0) > 0 && currentDay < 6) currentDay = 6;
         else if ((p.d5||0) > 0 && currentDay < 5) currentDay = 5;
         else if ((p.d4||0) > 0 && currentDay < 4) currentDay = 4;
         else if ((p.d3||0) > 0 && currentDay < 3) currentDay = 3;
         else if ((p.d2||0) > 0 && currentDay < 2) currentDay = 2;
         else if ((p.d1||0) > 0 && currentDay < 1) currentDay = 1;
      });
      if (data && data.length > 1) {
          for (let r = 1; r < data.length; r++) {
             let pName = data[r][0];
             if (!pName) continue;
             let safeName = pName.toString().trim();
             let missedCount = 0;
             if (currentDay > 0) {
                let p = sdLiveData[safeName] || {};
                for (let i = 1; i <= currentDay; i++) {
                   if (!(p['d'+i] > 0)) missedCount++;
                }
             }
             data[r][1] = missedCount;
          }
      }
          
          let usersSnap = null;
          try { usersSnap = await get(ref(db, 'users')); } catch(e) { console.warn("Could not fetch users:", e); }
      
      // Parse Maps
      const rosterMap = rosterRawData || {};
      
  
  
      let btDonationsAllTime = null, btDonationsCurrent = null, bear1 = null, bear2 = null, bearBoth = null, bearAllTime = null;
      let otherLbs = [];
      
      if (lbRawData) {
        for (let r = 0; r < lbRawData.length; r++) {
          for (let c = 0; c < lbRawData[r].length; c++) {
            let cell = lbRawData[r][c];
            if (typeof cell === 'string' && cell.toLowerCase().includes('leaderboard')) {
              let title = cell.replace(/leaderboard/i, '').trim();
              
              let scoreCol = c + 1;
              for (let i = c + 1; i <= c + 10; i++) {
                if (!lbRawData[r+1] || !lbRawData[r+1][i]) break;
                scoreCol = i;
              }
              
              let hr = r + 2;
              while (hr < lbRawData.length && lbRawData[hr][c] && lbRawData[hr][c].toString().trim() !== "") {
                let pName = lbRawData[hr][c+1];
                let score = lbRawData[hr][scoreCol];
                if (pName && pName.toString().trim() === name && score !== undefined && score !== "") {
                  let rank = lbRawData[hr][c] || hr - (r + 1);
                  if (typeof rank === 'number') {
                     if (rank === 1) rank = '🥇 1st';
                     else if (rank === 2) rank = '🥈 2nd';
                     else if (rank === 3) rank = '🥉 3rd';
                     else rank += 'th';
                  }
                  
                  let isAllTime = title.toLowerCase().includes("all-time") || title.toLowerCase().includes("all time");
                  let isBear = title.toLowerCase().includes("bear") || title.toLowerCase().includes("bt");
                  
                  let formattedScore = score;
                  if (typeof score === 'number') {
                    if (score >= 1000000) formattedScore = (score / 1000000).toFixed(1) + 'M';
                    else formattedScore = score.toLocaleString();
                  }
                  
                  if (isBear && isAllTime && title.toLowerCase().includes("donation")) btDonationsAllTime = { score: formattedScore, rank };
                  else if (isBear && title.toLowerCase().includes("donation")) btDonationsCurrent = { score: formattedScore, rank };
                  else if (isBear && isAllTime) bearAllTime = { score: formattedScore, rank };
                  else if (isBear && title.toLowerCase().includes("1")) bear1 = { score: formattedScore, rank };
                  else if (isBear && title.toLowerCase().includes("2")) bear2 = { score: formattedScore, rank };
                  else if (isBear && title.toLowerCase().includes("both")) bearBoth = { score: formattedScore, rank };
                  else otherLbs.push({ title, score: formattedScore, rank });
                }
                hr++;
              }
            }
          }
        }
      }
      
      const allTimeShowdownMap = {};
      const processShowdownTable = (tableData) => {
        if (!tableData) return;
        for (let r = 0; r < tableData.length; r++) {
          let row = tableData[r];
          if (row.some(c => typeof c === 'string' && c.toLowerCase().trim() === 'ranking')) {
            let nameCol = row.findIndex(c => typeof c === 'string' && (c.toLowerCase().includes('name') || c.toLowerCase().includes('member') || c.toLowerCase().includes('player')));
            let totalCol = row.findIndex(c => typeof c === 'string' && (c.toLowerCase().includes('total')));
            if (nameCol !== -1 && totalCol !== -1) {
              let dr = r + 1;
              while (dr < tableData.length && tableData[dr][nameCol] && (tableData[dr][nameCol].toString().toLowerCase().includes('horns') || tableData[dr][nameCol].toString().toLowerCase().includes('winners'))) dr++;
              while (dr < tableData.length && tableData[dr][nameCol] !== undefined && tableData[dr][nameCol] !== "") {
                let pName = tableData[dr][nameCol];
                let pScore = tableData[dr][totalCol];
                if (pName && (typeof pScore === 'number' || (typeof pScore === 'string' && !isNaN(pScore)))) {
                  let safeName = pName.toString().trim();
                  if (!allTimeShowdownMap[safeName]) allTimeShowdownMap[safeName] = 0;
                  allTimeShowdownMap[safeName] += Number(pScore);
                }
                dr++;
              }
            }
          }
        }
      };
      processShowdownTable(sdHistoryRawData);
      
      for (const [pName, scores] of Object.entries(sdLiveData)) {
          if (!scores || typeof scores !== 'object') continue;
          let safeName = pName.toString().trim();
          let pScore = (scores.d1||0) + (scores.d2||0) + (scores.d3||0) + (scores.d4||0) + (scores.d5||0) + (scores.d6||0);
          if (!allTimeShowdownMap[safeName]) allTimeShowdownMap[safeName] = 0;
          allTimeShowdownMap[safeName] += pScore;
      }

    
    let dynamicSD = null;
    const sortedShowdownPlayers = Object.entries(allTimeShowdownMap).map(([n, s]) => ({ name: n, score: s })).sort((a, b) => b.score - a.score);
    sortedShowdownPlayers.forEach((p, index) => {
      if (p.name.toLowerCase() === targetName.toLowerCase()) dynamicSD = { score: p.score, rank: index + 1 };
    });
    
    const defaultHeaders = ["Chief Name", "ShowDown missed days", "Alliance Championship ", "Mercenary Prestige", "Polar Terrors", "Voter"];
    const headers = (data && data[0] && Array.isArray(data[0])) ? data[0] : defaultHeaders;
    let showdownActive = false;
    let colIsUpcoming = {};
    let dataRows = Array.isArray(data) ? data : (data && typeof data === 'object' ? Object.values(data).filter(v => Array.isArray(v)) : []);
    for (let c = 1; c < headers.length; c++) {
       let hasAnyTrue = false;
       for (let r = 0; r < dataRows.length; r++) {
          let v = dataRows[r][c];
          if (c === 1 && dataRows[r]) {
             let missed = dataRows[r][1];
             if (missed !== undefined && missed !== null && missed.toString().trim() !== "" && missed !== 0 && missed !== "0") showdownActive = true;
          }
          if (v === true || (typeof v === 'string' && (v.toLowerCase().trim() === 'true' || v.toLowerCase().trim() === 'yes'))) hasAnyTrue = true;
       }
       colIsUpcoming[c] = !hasAnyTrue;
    }
    
    if (!targetName && name) targetName = name.trim();
    let pRow = null;
    if (dataRows && dataRows.length > 0) {
      for (let i = 0; i < dataRows.length; i++) {
         if (dataRows[i][0] && dataRows[i][0].toString().trim().toLowerCase() === targetName.toLowerCase()) { 
             pRow = dataRows[i]; 
             targetName = dataRows[i][0].toString().trim();
             break; 
         }
      }
    }
    
    if (!pRow) {
      for (const [gid, chiefName] of Object.entries(idToNameMap)) {
         if (chiefName && chiefName.toLowerCase().trim() === targetName.toLowerCase()) {
            targetName = chiefName;
            pRow = [targetName, 0, false, false, false, false, false];
            break;
         }
      }
    }
    
    if (!pRow) throw new Error(`Chief "${name}" not found in roster or activity database.`);

    pRow = await window.getLivePlayerEventRow(targetName, pRow, headers);
    
    // Generate HTML
    let altAccounts = [];
    const viewedGameId = nameToIdMap[name];
    const ROOT_ADMIN_GAME_ID = 318843189;
    const viewerIsR5 = window.getAdminLevel(currentUser) === 'R5';
    const viewedIsRootAdmin = viewedGameId && Number(viewedGameId) === ROOT_ADMIN_GAME_ID;

    // Only show alt accounts if:
    //   - The viewer is R5 (root admin), OR
    //   - The player being viewed is NOT the root admin
    const showAlts = viewerIsR5 || !viewedIsRootAdmin;

    if (showAlts && usersSnap && usersSnap.exists()) {
        const users = usersSnap.val();
        if (viewedGameId) {
            for (const u of Object.values(users)) {
                if (Number(u.gameId) === Number(viewedGameId)) {
                    if (u.linkedGameIds && Array.isArray(u.linkedGameIds)) {
                        altAccounts = [...new Set([...altAccounts, ...u.linkedGameIds])];
                    }
                }
            }
        }
    }
    
    const isUnlocked = await window.isGoogleAuthVerified();
    let html = window.generatePlayerProfileHtml(targetName, pRow, headers, colIsUpcoming, rosterMap[targetName], null, dynamicSD, showdownActive, bearBoth, bear1, bear2, bearAllTime, btDonationsAllTime, btDonationsCurrent, otherLbs, isUnlocked, altAccounts);
    
    resDiv.innerHTML = html;
    
  } catch (err) {
    resDiv.innerHTML = `<span style="color:var(--danger)">Error: ${err.message}</span>`;
  }
};

window.searchPlayerFull = async (name) => {
  let targetName = name ? name.replace(/^✅\s*/, '').trim() : '';
  window.activeViewFunc = () => window.searchPlayerFull(name);
  
  let resDiv = document.getElementById('uniEditorRes');
  if (!resDiv) {
    if (views.playerEditor) await views.playerEditor();
    resDiv = document.getElementById('uniEditorRes');
    const searchInput = document.getElementById('uniSearchInput');
    if (searchInput) searchInput.value = targetName;
  }

  if (!resDiv) return;
  if (!targetName) {
    resDiv.style.display = 'none';
    return;
  }
  
  resDiv.style.display = 'block';
  if (!window.liveData || !window.liveData["activity "]) {
    resDiv.innerHTML = '<div style="text-align:center; padding:20px;"><span style="color:var(--text-muted)">Querying master database...</span></div>';
  }
  
  try {
    let sdLiveSnapshotPromise = window.fetchMergedShowdown();
    const [data, rosterRawData, lbRawData, sdHistoryRawData, sdMergedDataRes] = await Promise.all([
            window.fetchActivityData(),
            window.fetchRoster(),
            window.fetchLeaderboardsData(),
            fetchSheet("Showdown History"),
            sdLiveSnapshotPromise
          ]);
    const sdCurrentRawData = sdMergedDataRes.mergedData;
    const sdLiveData = sdMergedDataRes.sdLiveData || {};

    let currentDay = 0;
    Object.values(sdLiveData).forEach(p => {
       if ((p.d6||0) > 0 && currentDay < 6) currentDay = 6;
       else if ((p.d5||0) > 0 && currentDay < 5) currentDay = 5;
       else if ((p.d4||0) > 0 && currentDay < 4) currentDay = 4;
       else if ((p.d3||0) > 0 && currentDay < 3) currentDay = 3;
       else if ((p.d2||0) > 0 && currentDay < 2) currentDay = 2;
       else if ((p.d1||0) > 0 && currentDay < 1) currentDay = 1;
    });
    if (data && data.length > 1) {
        for (let r = 1; r < data.length; r++) {
           let pName = data[r][0];
           if (!pName) continue;
           let safeName = pName.toString().trim();
           let missedCount = 0;
           if (currentDay > 0) {
              let p = sdLiveData[safeName] || {};
              for (let i = 1; i <= currentDay; i++) {
                 if (!(p['d'+i] > 0)) missedCount++;
              }
           }
           data[r][1] = missedCount;
        }
    }
        
        let usersSnap = null;
        try { usersSnap = await get(ref(db, 'users')); } catch(e) { console.warn("Could not fetch users:", e); }
    
    // Parse Maps
    const rosterMap = rosterRawData || {};
    


    let btDonationsAllTime = null, btDonationsCurrent = null, bear1 = null, bear2 = null, bearBoth = null, bearAllTime = null;
    let otherLbs = [];
    
    if (lbRawData) {
      for (let r = 0; r < lbRawData.length; r++) {
        for (let c = 0; c < lbRawData[r].length; c++) {
          let cell = lbRawData[r][c];
          if (typeof cell === 'string' && (cell.toLowerCase().includes('leaderboard') || (cell.toLowerCase().includes('all-time') && (cell.toLowerCase().includes('bear') || cell.toLowerCase().includes('bt')) && cell.toLowerCase().includes('donation')))) {
            let title = cell.replace(/leaderboard/i, '').trim();
            let emoji = "🏆";
            if (title.toLowerCase().includes("bear")) emoji = "🐻";
            else if (title.toLowerCase().includes("showdown")) emoji = "⚔️";
            
            let scoreCol = c + 2;
            if (r + 1 < lbRawData.length) {
              let hc = c;
              while (hc < lbRawData[r+1].length && lbRawData[r+1][hc] !== "") { scoreCol = hc; hc++; }
            }
            
            let dr = r + 2;
            while (dr < lbRawData.length && lbRawData[dr][c] !== "") {
              let pRank = lbRawData[dr][c];
              let pName = lbRawData[dr][c + 1];
              let pScore = lbRawData[dr][scoreCol];
              
              if (pName && pScore && pName.toString().trim().toLowerCase() === targetName.toLowerCase()) {
                if (typeof pScore === 'number') pScore = pScore.toLocaleString();
                else if (typeof pScore === 'string' && !isNaN(pScore) && pScore.trim() !== "") pScore = Number(pScore).toLocaleString();
                
                let t = title.toLowerCase();
                if (t.includes('all-time showdown')) { /* noop */ }
                else if (t.includes('all-time bear trap')) bearAllTime = {rank: pRank, score: pScore};
                else if (t.includes('bear trap 1')) bear1 = {rank: pRank, score: pScore};
                else if (t.includes('bear trap 2')) bear2 = {rank: pRank, score: pScore};
                else if (t.includes('both bear trap')) bearBoth = {rank: pRank, score: pScore};
                else if ((t.includes('all-time') && (t.includes('bear') || t.includes('bt')) && t.includes('donation'))) btDonationsAllTime = {rank: pRank, score: pScore};
                else if (((t.includes('bear') || t.includes('bt')) && t.includes('donation'))) btDonationsCurrent = {rank: pRank, score: pScore};
                else otherLbs.push({ title, score: pScore, rank: pRank, emoji });
              }
              dr++;
            }
          }
        }
      }
    }
    
    const allTimeShowdownMap = {};
    const processShowdownTable = (tableData) => {
      if (!tableData) return;
      for (let r = 0; r < tableData.length; r++) {
        let row = tableData[r];
        if (row.some(c => typeof c === 'string' && c.toLowerCase().trim() === 'ranking')) {
          let nameCol = row.findIndex(c => typeof c === 'string' && (c.toLowerCase().includes('name') || c.toLowerCase().includes('member') || c.toLowerCase().includes('player')));
          let totalCol = row.findIndex(c => typeof c === 'string' && (c.toLowerCase().includes('total')));
          if (nameCol !== -1 && totalCol !== -1) {
            let dr = r + 1;
            while (dr < tableData.length && tableData[dr][nameCol] && (tableData[dr][nameCol].toString().toLowerCase().includes('horns') || tableData[dr][nameCol].toString().toLowerCase().includes('winners'))) dr++;
            while (dr < tableData.length && tableData[dr][nameCol] !== undefined && tableData[dr][nameCol] !== "") {
              let pName = tableData[dr][nameCol];
              let pScore = tableData[dr][totalCol];
              if (pName && (typeof pScore === 'number' || (typeof pScore === 'string' && !isNaN(pScore)))) {
                let safeName = pName.toString().trim();
                if (!allTimeShowdownMap[safeName]) allTimeShowdownMap[safeName] = 0;
                allTimeShowdownMap[safeName] += Number(pScore);
              }
              dr++;
            }
          }
        }
      }
    };
    processShowdownTable(sdHistoryRawData);
    processShowdownTable(sdCurrentRawData);
    
    let dynamicSD = null;
    const sortedShowdownPlayers = Object.entries(allTimeShowdownMap).map(([n, s]) => ({ name: n, score: s })).sort((a, b) => b.score - a.score);
    sortedShowdownPlayers.forEach((p, index) => {
      if (p.name.toLowerCase() === targetName.toLowerCase()) dynamicSD = { score: p.score, rank: index + 1 };
    });
    
    const defaultHeaders = ["Chief Name", "ShowDown missed days", "Alliance Championship ", "Mercenary Prestige", "Polar Terrors", "Voter"];
    const headers = (data && data[0] && Array.isArray(data[0])) ? data[0] : defaultHeaders;
    let showdownActive = false;
    let colIsUpcoming = {};
    let dataRows = Array.isArray(data) ? data : (data && typeof data === 'object' ? Object.values(data).filter(v => Array.isArray(v)) : []);
    for (let c = 1; c < headers.length; c++) {
       let hasAnyTrue = false;
       for (let r = 0; r < dataRows.length; r++) {
          let v = dataRows[r][c];
          if (c === 1 && dataRows[r]) {
             let missed = dataRows[r][1];
             if (missed !== undefined && missed !== null && missed.toString().trim() !== "" && missed !== 0 && missed !== "0") showdownActive = true;
          }
          if (v === true || (typeof v === 'string' && (v.toLowerCase().trim() === 'true' || v.toLowerCase().trim() === 'yes'))) hasAnyTrue = true;
       }
       colIsUpcoming[c] = !hasAnyTrue;
    }
    
    if (!targetName && name) targetName = name.trim();
    let pRow = null;
    if (dataRows && dataRows.length > 0) {
      for (let i = 0; i < dataRows.length; i++) {
         if (dataRows[i][0] && dataRows[i][0].toString().trim().toLowerCase() === targetName.toLowerCase()) { 
             pRow = dataRows[i]; 
             targetName = dataRows[i][0].toString().trim();
             break; 
         }
      }
    }
    
    if (!pRow) {
      for (const [gid, chiefName] of Object.entries(idToNameMap)) {
         if (chiefName && chiefName.toLowerCase().trim() === targetName.toLowerCase()) {
            targetName = chiefName;
            pRow = [targetName, 0, false, false, false, false, false];
            break;
         }
      }
    }
    
    if (!pRow) throw new Error(`Chief "${name}" not found in roster or activity database.`);

    pRow = await window.getLivePlayerEventRow(targetName, pRow, headers);
    
    // Generate HTML
    let altAccounts = [];
    const viewedGameId = nameToIdMap[name];
    const ROOT_ADMIN_GAME_ID = 318843189;
    const viewerIsR5 = window.getAdminLevel(currentUser) === 'R5';
    const viewedIsRootAdmin = viewedGameId && Number(viewedGameId) === ROOT_ADMIN_GAME_ID;

    // Only show alt accounts if:
    //   - The viewer is R5 (root admin), OR
    //   - The player being viewed is NOT the root admin
    const showAlts = viewerIsR5 || !viewedIsRootAdmin;

    if (showAlts && usersSnap && usersSnap.exists()) {
        const users = usersSnap.val();
        if (viewedGameId) {
            for (const u of Object.values(users)) {
                if (Number(u.gameId) === Number(viewedGameId)) {
                    if (u.linkedGameIds && Array.isArray(u.linkedGameIds)) {
                        altAccounts = [...new Set([...altAccounts, ...u.linkedGameIds])];
                    }
                }
            }
        }
    }
    
    const isUnlocked = await window.isGoogleAuthVerified();
    let html = window.generatePlayerProfileHtml(targetName, pRow, headers, colIsUpcoming, rosterMap[targetName], null, dynamicSD, showdownActive, bearBoth, bear1, bear2, bearAllTime, btDonationsAllTime, btDonationsCurrent, otherLbs, isUnlocked, altAccounts);
    
    resDiv.innerHTML = html;
    
  } catch (err) {
    resDiv.innerHTML = `<span style="color:var(--danger)">Error: ${err.message}</span>`;
  }
};

window.savePlayerFull = async (name) => {
  const ptStatus = document.getElementById('uniPtSelect').value;
  const acStatus = document.getElementById('uniAcSelect').value;
  const btAdd = document.getElementById('uniBtAdd').value;
  const resDiv = document.getElementById('uniEditorRes');
  
  const adminName = currentUser ? (idToNameMap[currentUser.gameId] || "Admin") : "Admin";
  
  resDiv.innerHTML = '<span style="color:var(--text-muted)">Saving changes to master sheets...</span>';
  
  try {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}?api=updateFull&name=${encodeURIComponent(name)}&ptStatus=${encodeURIComponent(ptStatus)}&acStatus=${encodeURIComponent(acStatus)}&btAdd=${encodeURIComponent(btAdd)}&admin=${encodeURIComponent(adminName)}&token=${encodeURIComponent(token)}`).then(r => r.json());
    if (res.success) {
      window.showToast("Player updated successfully!", "success");
      let successMsg = `<div style="color:var(--success); font-weight:bold; margin-bottom:5px;">✅ ${res.message}</div>`;
      if (res.btRes && res.btRes.success) {
        successMsg += `<div style="font-size:13px; color:var(--text-muted);">New Bear Total: ${res.btRes.newTotal}</div>`;
      }
      resDiv.innerHTML = successMsg;
    } else {
      resDiv.innerHTML = `<span style="color:var(--danger)">Error: ${res.message}</span>`;
    }
  } catch (err) {
    resDiv.innerHTML = `<span style="color:var(--danger)">Network Error: ${err.message}</span>`;
  }
};

onValue(ref(db, 'config/maintenanceMode'), (snapshot) => {
  maintenanceMode = snapshot.val() || false;
  checkMaintenanceAccess();
});

// Listen to Auth State
let realUser = null; // Store the actual logged in user so we can revert from spoofing

listenToAuth((user) => {
  if (!window._spoofedUser) {
      currentUser = user;
  }
  realUser = user;
  
  const navIndicator = document.getElementById('navbar-user-indicator');
  const adminMasterKeySection = document.getElementById('adminMasterKeySection');
  
  if (currentUser) {
    let name = idToNameMap[currentUser.gameId] || 'Account';
    if(authSidebarBtn) authSidebarBtn.innerHTML = window._spoofedUser ? `🎭 Spoofing: ${name}` : `👤 ${name}'s Profile`;
    if(adminSidebarBtn && window.isAdminUser(currentUser)) {
      adminSidebarBtn.style.display = 'block';
    } else if (adminSidebarBtn) {
      adminSidebarBtn.style.display = 'none';
    }
    if(signOutSidebarBtn) signOutSidebarBtn.style.display = 'block';
    
    if (navIndicator) {
      navIndicator.innerHTML = window._spoofedUser ? `🎭 Spoofing: ${name}` : `👤 ${name}`;
      navIndicator.style.display = 'flex';
      if (window._spoofedUser) {
          navIndicator.style.color = 'var(--danger)'; // Warning color so admin knows they are spoofing
      } else {
          navIndicator.style.color = '';
      }
    }
    
    // If they are on the home page, maybe reload or show a toast
    if (app.querySelector('#accountHubView')) views.account(); // Refresh account view if open
  } else {
    if(authSidebarBtn) authSidebarBtn.innerHTML = `👤 Sign In / Register`;
    if(adminSidebarBtn) adminSidebarBtn.style.display = 'none';
    if(signOutSidebarBtn) signOutSidebarBtn.style.display = 'none';
    if (navIndicator) navIndicator.style.display = 'none';
    
    if (app.querySelector('#accountHubView') || app.querySelector('#adminHubView')) views.home(); // Kick to home
  }
  
  checkMaintenanceAccess();
});

// Master Key Spoofing Methods
window.adminSpoofPlayer = async (spoofId) => {
    if (!realUser || !window.isAdminUser(realUser)) return;
    
    const isUnlocked = await window.isGoogleAuthVerified();
    if (!isUnlocked) {
        window.showToast("Security unlock required to use the master key. Please log in with Google.", "error");
        views.admin(); // Kick to admin screen for auth verification
        return;
    }
    
    if (!spoofId) return;
    
    // Fetch the spoofed user's actual linked accounts
    let spoofedLinks = [];
    try {
        const usersSnap = await get(ref(db, 'users'));
        if (usersSnap.exists()) {
            const users = usersSnap.val();
            for (const u of Object.values(users)) {
                if (Number(u.gameId) === Number(spoofId)) {
                    spoofedLinks = u.linkedGameIds || [];
                    break;
                }
            }
        }
    } catch (e) {
        console.warn("Failed to fetch spoofed alt accounts:", e);
    }
    
    window._spoofedUser = true;
    currentUser = {
        ...realUser,
        gameId: spoofId,
        email: "spoofed@admin.com",
        linkedGameIds: spoofedLinks // Overwrite the admin's linked accounts with the spoofed user's
    };
    
    if (window.showToast) window.showToast(`Now spoofing Game ID: ${spoofId}`, "success");
    
    // Show the floating clear button
    const clearBtn = document.getElementById('floatingSpoofControls');
    if (clearBtn) clearBtn.style.display = 'flex';
    
    // Trigger a fake auth update to redraw the UI
    listenToAuth.fakeUpdate ? listenToAuth.fakeUpdate(currentUser) : null;
    
    // Brute force redraw
    const navIndicator = document.getElementById('navbar-user-indicator');
    let name = idToNameMap[currentUser.gameId] || 'Unknown';
    if(authSidebarBtn) authSidebarBtn.innerHTML = `🎭 Spoofing: ${name}`;
    if (navIndicator) {
        navIndicator.innerHTML = `🎭 Spoofing: ${name}`;
        navIndicator.style.color = 'var(--danger)';
    }
    
    if (app.querySelector('#accountHubView')) views.account();
};

window.clearSpoof = () => {
    if (!window._spoofedUser) return;
    window._spoofedUser = false;
    currentUser = realUser;
    
    if (window.showToast) window.showToast("Master key deactivated. Returned to normal.", "success");
    
    const clearBtn = document.getElementById('floatingSpoofControls');
    if (clearBtn) clearBtn.style.display = 'none';
    
    // Brute force redraw
    const navIndicator = document.getElementById('navbar-user-indicator');
    let name = currentUser ? (idToNameMap[currentUser.gameId] || 'Account') : 'Unknown';
    if(authSidebarBtn) authSidebarBtn.innerHTML = `👤 ${name}'s Profile`;
    if (navIndicator) {
        navIndicator.innerHTML = `👤 ${name}`;
        navIndicator.style.color = '';
    }
    
    // Trigger fake auth update to restore real state
    listenToAuth.fakeUpdate ? listenToAuth.fakeUpdate(currentUser) : null;
    if (app.querySelector('#accountHubView')) views.account();
};

window.switchSpoofUser = () => {
    window.clearSpoof();
    setTimeout(() => {
        if (views.admin) views.admin();
        if (views.playerEditor) views.playerEditor();
    }, 100);
};

const openAuthModal = () => {
  authErrorMsg.style.display = 'none';
  authModal.style.display = 'block';
  authModalOverlay.classList.add('active');
};
const closeAuthModal = () => {
  authModal.style.display = 'none';
  authModalOverlay.classList.remove('active');
};

if(authSidebarBtn) authSidebarBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (currentUser) {
    // Navigate to Account Hub
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    if (mobileMenu) mobileMenu.classList.remove('open');
    settingsSidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    views.account();
  } else {
    settingsSidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');
    openAuthModal();
  }
});

if(adminSidebarBtn) adminSidebarBtn.addEventListener('click', (e) => {
  e.preventDefault();
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  if (mobileMenu) mobileMenu.classList.remove('open');
  settingsSidebar.classList.remove('open');
  sidebarOverlay.classList.remove('active');
  views.admin();
});

if(signOutSidebarBtn) signOutSidebarBtn.addEventListener('click', (e) => {
  e.preventDefault();
  settingsSidebar.classList.remove('open');
  sidebarOverlay.classList.remove('active');
  logoutUser();
});

if(closeAuthBtn) closeAuthBtn.addEventListener('click', closeAuthModal);
if(authModalOverlay) authModalOverlay.addEventListener('click', closeAuthModal);

if(authToggleBtn) authToggleBtn.addEventListener('click', (e) => {
  e.preventDefault();
  isRegistering = !isRegistering;
  authErrorMsg.style.display = 'none';
  if (isRegistering) {
    authModalTitle.textContent = 'Create Account';
    authGameIdWrapper.style.display = 'flex';
    const authForgotPwWrapper = document.getElementById('authForgotPwWrapper');
    if (authForgotPwWrapper) authForgotPwWrapper.style.display = 'none';
    const authDateWrapper = document.getElementById('authDateWrapper');
    if (authDateWrapper) authDateWrapper.style.display = 'block';
    authGameId.value = '';
    if(authChiefConfirm) authChiefConfirm.style.display = 'none';
    authSubmitBtn.textContent = 'Create Account';
    authToggleText.textContent = 'Already have an account?';
    authToggleBtn.textContent = 'Sign In';
  } else {
    authModalTitle.textContent = 'Sign In';
    authGameIdWrapper.style.display = 'none';
    const authForgotPwWrapper = document.getElementById('authForgotPwWrapper');
    if (authForgotPwWrapper) authForgotPwWrapper.style.display = 'block';
    const authDateWrapper = document.getElementById('authDateWrapper');
    if (authDateWrapper) authDateWrapper.style.display = 'none';
    if(authChiefConfirm) authChiefConfirm.style.display = 'none';
    authSubmitBtn.textContent = 'Sign In';
    authToggleText.textContent = 'Need an account?';
    authToggleBtn.textContent = 'Register';
  }
});

window.openLoginModal = () => {
  isRegistering = false;
  if (authErrorMsg) authErrorMsg.style.display = 'none';
  if (authModalTitle) authModalTitle.textContent = 'Sign In';
  if (authGameIdWrapper) authGameIdWrapper.style.display = 'none';
  const authForgotPwWrapper = document.getElementById('authForgotPwWrapper');
  if (authForgotPwWrapper) authForgotPwWrapper.style.display = 'block';
  const authDateWrapper = document.getElementById('authDateWrapper');
  if (authDateWrapper) authDateWrapper.style.display = 'none';
  if (authChiefConfirm) authChiefConfirm.style.display = 'none';
  if (authSubmitBtn) authSubmitBtn.textContent = 'Sign In';
  if (authToggleText) authToggleText.textContent = 'Need an account?';
  if (authToggleBtn) authToggleBtn.textContent = 'Register';
  if (document.getElementById('authModal')) document.getElementById('authModal').style.display = 'block';
  if (document.getElementById('authModalOverlay')) document.getElementById('authModalOverlay').style.display = 'block';
};

window.openRegisterModal = () => {
  isRegistering = true;
  if (authErrorMsg) authErrorMsg.style.display = 'none';
  if (authModalTitle) authModalTitle.textContent = 'Create Account / Claim Profile';
  if (authGameIdWrapper) authGameIdWrapper.style.display = 'flex';
  const authForgotPwWrapper = document.getElementById('authForgotPwWrapper');
  if (authForgotPwWrapper) authForgotPwWrapper.style.display = 'none';
  const authDateWrapper = document.getElementById('authDateWrapper');
  if (authDateWrapper) authDateWrapper.style.display = 'block';
  if (authGameId) authGameId.value = '';
  if (authChiefConfirm) authChiefConfirm.style.display = 'none';
  if (authSubmitBtn) authSubmitBtn.textContent = 'Create Account';
  if (authToggleText) authToggleText.textContent = 'Already have an account?';
  if (authToggleBtn) authToggleBtn.textContent = 'Sign In';
  if (document.getElementById('authModal')) document.getElementById('authModal').style.display = 'block';
  if (document.getElementById('authModalOverlay')) document.getElementById('authModalOverlay').style.display = 'block';
};

window.openClaimProfileModal = window.openRegisterModal;

const authChiefConfirm = document.getElementById('authChiefConfirm');
let wosLookupTimeout = null;
export let verifiedFurnaceLevel = ""; // Save furnace level to send during registration
export let verifiedChiefName = ""; // Save verified chief name
let currentWosLookupId = 0;
if (authVerifyGameIdBtn && authChiefConfirm) {
  authVerifyGameIdBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (!isRegistering) return;
    const val = authGameId.value.trim();
    if (!val) {
      authChiefConfirm.style.display = 'none';
      verifiedFurnaceLevel = "";
      verifiedChiefName = "";
      return;
    }
    
    authChiefConfirm.style.display = 'block';
    
    // Only ping Century Games if the ID is at least 7 digits (most are 8-11 digits) to prevent rate limit exhaustion
    if (!/^\d{7,12}$/.test(val)) {
        authChiefConfirm.innerHTML = `<span style="color:var(--danger)">Please enter a valid Game ID (7-12 digits).</span>`;
        verifiedFurnaceLevel = "";
        verifiedChiefName = "";
        return;
    }
    
    authChiefConfirm.innerHTML = `<span style="color:var(--text-muted)">Looking up Game ID on official servers...</span>`;
    
    authVerifyGameIdBtn.disabled = true;
    authVerifyGameIdBtn.textContent = '...';
    
    clearTimeout(wosLookupTimeout);
    wosLookupTimeout = setTimeout(async () => {
      const lookupId = ++currentWosLookupId;
      
      // 1. Check local alliance database first!
      try {
         await refreshIdToNameMap();
         let rosterData = await window.fetchRoster();
         
         let matchedName = window.idToNameMap[val] || null;
         let matchedFurnace = "";
         
         if (rosterData) {
            const foundEntry = Object.values(rosterData).find(p => p.gameId && p.gameId.toString().trim() === val.toString().trim());
            if (foundEntry) {
                matchedName = foundEntry.name;
                matchedFurnace = foundEntry.furnaceLevel || "";
            }
         }
         
         if (matchedName) {
             if (lookupId !== currentWosLookupId) return;
             authChiefConfirm.innerHTML = `Is your Chief Name: <strong style="color:var(--success)">${window.escapeHTML(matchedName)}</strong>? <span style="font-size:11px; color:#10b981; display:block; margin-top:4px;">✅ Verified from Alliance Database!</span>`;
             verifiedChiefName = matchedName;
             verifiedFurnaceLevel = matchedFurnace;
             authVerifyGameIdBtn.disabled = false;
             authVerifyGameIdBtn.textContent = 'Verify';
             return;
         }
      } catch(e) {
         console.warn("Database lookup fallback error:", e);
      }
      
      // 2. If not found in local database, query official Century Games servers
      try {
        const response = await fetch(`${VERIFY_PROXY_URL}?id=${encodeURIComponent(val)}`);
        const data = await response.json();
        
        if (lookupId !== currentWosLookupId) return; // Ignore stale responses
        
        if (data.success && data.nickname) {
          authChiefConfirm.innerHTML = `Is your Chief Name: <strong style="color:var(--success)">${window.escapeHTML(data.nickname)}</strong>? <span style="font-size:11px; color:#60a5fa; display:block; margin-top:4px;">🌐 Verified from Game Servers!</span>`;
          verifiedChiefName = data.nickname;
          verifiedFurnaceLevel = data.stove_lv || "";
        } else {
          authChiefConfirm.innerHTML = `
            <span style="color:var(--danger)">ID Not Found on Game Servers.</span>
            <div style="margin-top:10px; text-align:left;">
                <input type="text" id="manualChiefName" placeholder="Enter Chief Name manually" style="width:100%; padding:10px; border-radius:6px; margin-bottom:10px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); box-sizing:border-box;">
                <input type="number" id="manualFurnaceLevel" placeholder="Enter Furnace Level (optional)" style="width:100%; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); box-sizing:border-box;">
                <div style="font-size:12px; color:var(--text-muted); text-align:center;">Please verify your Game ID is correct before submitting.</div>
            </div>`;
          verifiedChiefName = "";
          verifiedFurnaceLevel = "";
        }
      } catch (err) {
        if (lookupId !== currentWosLookupId) return; // Ignore stale responses
        authChiefConfirm.innerHTML = `
            <span style="color:var(--danger)">Error connecting to game servers.</span>
            <div style="margin-top:10px; text-align:left;">
                <input type="text" id="manualChiefName" placeholder="Enter Chief Name manually" style="width:100%; padding:10px; border-radius:6px; margin-bottom:10px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); box-sizing:border-box;">
                <input type="number" id="manualFurnaceLevel" placeholder="Enter Furnace Level (optional)" style="width:100%; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); box-sizing:border-box;">
                <div style="font-size:12px; color:var(--text-muted); text-align:center;">Please verify your Game ID is correct before submitting.</div>
            </div>`;
        verifiedChiefName = "";
        verifiedFurnaceLevel = "";
      } finally {
        if (lookupId === currentWosLookupId) {
            authVerifyGameIdBtn.disabled = false;
            authVerifyGameIdBtn.textContent = 'Verify';
        }
      }
    }, 100); // 100ms debounce just to be safe
  });
}
const showPasswordBtn = document.getElementById('showPasswordBtn');
if(showPasswordBtn) showPasswordBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (authPassword.type === 'password') {
    authPassword.type = 'text';
    showPasswordBtn.textContent = '🙈';
  } else {
    authPassword.type = 'password';
    showPasswordBtn.textContent = '👁️';
  }
});

const authForgotPwBtn = document.getElementById('authForgotPwBtn');
const forgotPasswordModal = document.getElementById('forgotPasswordModal');
const forgotPasswordModalOverlay = document.getElementById('forgotPasswordModalOverlay');
const closeForgotPwBtn = document.getElementById('closeForgotPwBtn');
const forgotPwSubmitBtn = document.getElementById('forgotPwSubmitBtn');
const forgotPwEmail = document.getElementById('forgotPwEmail');
const forgotPwErrorMsg = document.getElementById('forgotPwErrorMsg');

if (authForgotPwBtn) {
  authForgotPwBtn.addEventListener('click', (e) => {
    e.preventDefault();
    forgotPwErrorMsg.style.display = 'none';
    forgotPwEmail.value = authEmail.value; // pre-fill if they started typing
    document.getElementById('authModal').style.display = 'none';
    forgotPasswordModal.style.display = 'block';
    forgotPasswordModalOverlay.style.display = 'block';
  });
}

function closeForgotModal() {
  if (forgotPasswordModal) forgotPasswordModal.style.display = 'none';
  if (forgotPasswordModalOverlay) forgotPasswordModalOverlay.style.display = 'none';
}

if (closeForgotPwBtn) closeForgotPwBtn.addEventListener('click', closeForgotModal);
if (forgotPasswordModalOverlay) forgotPasswordModalOverlay.addEventListener('click', closeForgotModal);

if (forgotPwSubmitBtn) {
  forgotPwSubmitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const email = forgotPwEmail.value.trim();
    if (!email) {
      forgotPwErrorMsg.textContent = 'Please enter your email address.';
      forgotPwErrorMsg.style.color = 'var(--danger)';
      forgotPwErrorMsg.style.display = 'block';
      return;
    }
    
    forgotPwSubmitBtn.textContent = 'Sending...';
    forgotPwSubmitBtn.disabled = true;
    
    resetPassword(email)
      .then(() => {
        forgotPwErrorMsg.textContent = 'Password reset email sent! Check your inbox.';
        forgotPwErrorMsg.style.color = 'var(--success)';
        forgotPwErrorMsg.style.display = 'block';
        forgotPwSubmitBtn.textContent = 'Send Reset Link';
        forgotPwSubmitBtn.disabled = false;
        setTimeout(() => {
            closeForgotModal();
        }, 2000);
      })
      .catch((error) => {
        forgotPwErrorMsg.textContent = error.message;
        forgotPwErrorMsg.style.color = 'var(--danger)';
        forgotPwErrorMsg.style.display = 'block';
        forgotPwSubmitBtn.textContent = 'Send Reset Link';
        forgotPwSubmitBtn.disabled = false;
      });
  });
}

if(authSubmitBtn) authSubmitBtn.addEventListener('click', async () => {
  authErrorMsg.style.color = 'var(--danger)'; // Reset color to red for login errors
  const email = authEmail.value.trim().toLowerCase();
  const password = authPassword.value;
  const gameId = authGameId.value.trim();
  const dateStarted = authDateStarted ? authDateStarted.value : "";
  
  // Check for manual overrides if API failed
  const manualChiefNameEl = document.getElementById('manualChiefName');
  const manualFurnaceLevelEl = document.getElementById('manualFurnaceLevel');
  const manualChiefName = manualChiefNameEl ? manualChiefNameEl.value.trim() : "";
  const manualFurnaceLevel = manualFurnaceLevelEl ? manualFurnaceLevelEl.value.trim() : "";
  
  const chiefName = verifiedChiefName || manualChiefName;
  const furnaceLevel = verifiedFurnaceLevel || manualFurnaceLevel;
  
  if (!email || !password) {
    authErrorMsg.textContent = 'Email and password required.';
    authErrorMsg.style.display = 'block';
    return;
  }
  
  try {
    authSubmitBtn.disabled = true;
    authSubmitBtn.textContent = 'Loading...';
    
    if (isRegistering) {
      if (!gameId) throw new Error('Game ID is required.');
      if (!chiefName) throw new Error('You must verify your Game ID or manually enter your Chief Name.');
      
      await registerUser(email, password, gameId, chiefName);
      
      // Auto-enroll in Firebase giftcode_bot & ping backend API
      try {
          await window.enrollGiftcodeBot(gameId, chiefName);
          const regToken = await getAuthToken();
          const url = `${API_BASE_URL}?api=registerNewPlayer&gameId=${encodeURIComponent(gameId)}&name=${encodeURIComponent(chiefName)}&dateStarted=${encodeURIComponent(dateStarted)}&level=${encodeURIComponent(furnaceLevel)}${regToken ? '&token=' + encodeURIComponent(regToken) : ''}`;
          fetch(url, { mode: 'no-cors' }).catch(e => console.warn("Failed to ping GAS for registration", e));
      } catch(e) { console.error(e); }

      window.showToast("Account created & signed in!", "success");
    } else {
      await loginUser(email, password);
      window.showToast("Successfully signed in!", "success");
    }
    
    closeAuthModal();
  } catch(err) {
    authErrorMsg.textContent = err.message;
    authErrorMsg.style.display = 'block';
  } finally {
    authSubmitBtn.disabled = false;
    authSubmitBtn.textContent = isRegistering ? 'Create Account' : 'Sign In';
  }
});

const authGoogleBtn = document.getElementById('authGoogleBtn');
if (authGoogleBtn) authGoogleBtn.addEventListener('click', async () => {
    try {
        authGoogleBtn.disabled = true;
        const originalHtml = authGoogleBtn.innerHTML;
        authGoogleBtn.innerHTML = "Loading...";
        
        const userCredential = await loginWithGoogle();
        const user = userCredential.user;
        
        // Check if user is mapped in Realtime Database
        const userRef = ref(db, `users/${user.uid}`);
        const snapshot = await get(userRef);
        
        if (snapshot.exists()) {
            window.showToast("Successfully signed in with Google!", "success");
            closeAuthModal();
        } else {
            // New user! They signed in with Google but we don't have their WOS Game ID
            // We need to ask for it.
            const gameId = await window.customPrompt("Welcome! To complete your registration, please enter your WOS Game ID (found in your Player Profile):");
            if (!gameId || gameId.trim() === '') {
                throw new Error("Game ID is required to register.");
            }
            
            // Check for deduplication locally first
            const existingGid = Object.values(window.nameToIdMap || {}).includes(parseInt(gameId));
            if (existingGid) {
                // If they enter an ID that's already registered, they should just link it or it's a dupe.
                // But let backend handle it or just allow it.
            }
            
            // For a new Google user, we don't know their chiefName, so we should look it up from the roster.
            let chiefName = "";
            let furnaceLevel = "";
            const roster = window.liveData ? window.liveData["Chief's List"] : null;
            if (roster) {
                const row = roster.find(r => String(r[1]).trim() === String(gameId).trim());
                if (row) {
                    chiefName = String(row[0]).trim();
                    furnaceLevel = String(row[4] || "").trim(); // Assuming col E is Furnace
                }
            }
            
            if (!chiefName) {
                chiefName = await window.customPrompt("We couldn't find your Game ID on the roster. Please enter your Chief Name exactly as it appears in-game:");
                if (!chiefName) throw new Error("Chief Name is required.");
            }
            
            const dateStarted = await window.customPrompt("One last thing! What date did you start playing Whiteout Survival? (e.g., MM/DD/YYYY)") || "";
            
            // Save to Firebase Realtime Database
            await set(ref(db, `users/${user.uid}`), {
                email: user.email,
                gameId: gameId.trim(),
                name: chiefName.trim(),
                createdAt: new Date().toISOString(),
                authProvider: 'google'
            });
            
            // Auto-post to giftcodebot Google Sheet via backend API
            try {
                const token = await user.getIdToken();
                const url = `${API_BASE_URL}?api=registerNewPlayer&gameId=${encodeURIComponent(gameId.trim())}&name=${encodeURIComponent(chiefName.trim())}&dateStarted=${encodeURIComponent(dateStarted)}&level=${encodeURIComponent(furnaceLevel)}&token=${encodeURIComponent(token)}`;
                fetch(url, { mode: 'no-cors' }).catch(e => console.warn("Failed to ping GAS for registration", e));
            } catch(e) { console.error(e); }
            
            window.showToast("Account created & signed in with Google!", "success");
            closeAuthModal();
        }
    } catch(err) {
        if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
            authErrorMsg.textContent = err.message;
            authErrorMsg.style.display = 'block';
        }
    } finally {
        if (authGoogleBtn) {
            authGoogleBtn.disabled = false;
            authGoogleBtn.innerHTML = `<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:18px; height:18px;" alt="Google"> Continue with Google`;
        }
    }
});


// --- Changelog Modal ---
const versionBadge = document.getElementById('versionBadge');
const changelogModal = document.getElementById('changelogModal');
const changelogModalOverlay = document.getElementById('changelogModalOverlay');
const closeChangelogBtn = document.getElementById('closeChangelogBtn');
const changelogContent = document.getElementById('changelogContent');


if (versionBadge) versionBadge.innerHTML = `v${pkg.version}`;

const closeChangelogModal = () => {
  if (changelogModal) changelogModal.style.display = 'none';
  if (changelogModalOverlay) changelogModalOverlay.classList.remove('active');
};

if (closeChangelogBtn) closeChangelogBtn.addEventListener('click', closeChangelogModal);
if (changelogModalOverlay) changelogModalOverlay.addEventListener('click', closeChangelogModal);

if (versionBadge) versionBadge.addEventListener('click', async () => {
  if (changelogModal) changelogModal.style.display = 'block';
  if (changelogModalOverlay) changelogModalOverlay.classList.add('active');
  
  try {
    changelogContent.innerHTML = '<span style="color:var(--text-muted)">Loading changelog...</span>';
    const response = await fetch(`https://raw.githubusercontent.com/wosbdc/wosBDC.github.io/main/CHANGELOG.md?t=${Date.now()}`);
    if (!response.ok) throw new Error('Failed to fetch changelog from repository');
    let md = await response.text();
    
    // Basic Markdown parser for headings and bullets
    md = md.replace(/### (.*)/g, '<h4 style="color:var(--accent); margin-bottom:5px; margin-top:15px;">$1</h4>');
    md = md.replace(/## \[(.*?)\] - (.*)/g, '<h3 style="color:var(--text-main); border-bottom:1px solid var(--border); padding-bottom:5px; margin-top:20px;">Version $1 <span style="font-size:12px; color:var(--text-muted); font-weight:normal; float:right;">$2</span></h3>');
    md = md.replace(/# (.*)/g, ''); // Remove main title
    md = md.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    md = md.replace(/`([^`]+)`/g, '<code style="background:var(--bg-main); padding:2px 4px; border-radius:4px; color:var(--danger);">$1</code>');
    md = md.replace(/^- (.*)/gm, '<li style="margin-bottom:5px;">$1</li>');
    
    // Wrap consecutive li elements in ul
    md = md.replace(/(<li.*<\/li>\n?)+/g, match => `<ul style="padding-left:20px; margin-top:5px; color:var(--text-main);">${match}</ul>`);
    
    changelogContent.innerHTML = md;
  } catch (err) {
    changelogContent.innerHTML = `<span style="color:var(--danger)">Error loading changelog: ${err.message}</span>`;
  }
});

// --- Routing & Views ---
const app = document.getElementById('app');


window.customConfirm = (message) => {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.6); z-index:100050; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s; backdrop-filter:blur(3px);';
        
        const modal = document.createElement('div');
        modal.style.cssText = 'background:var(--bg-main); padding:25px; border-radius:12px; max-width:400px; width:90%; border:1px solid var(--border); box-shadow:0 10px 30px rgba(0,0,0,0.5); text-align:center; transform:scale(0.95); animation:zoomIn 0.2s forwards;';
        
        const text = document.createElement('p');
        text.style.cssText = 'margin:0 0 20px 0; color:var(--text-main); font-size:16px; font-weight:bold;';
        text.innerText = message;
        
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display:flex; justify-content:center; gap:10px;';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.innerText = 'Cancel';
        cancelBtn.style.cssText = 'padding:10px 20px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main); border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s; min-width:100px;';
        cancelBtn.onmouseover = () => cancelBtn.style.background = 'var(--border)';
        cancelBtn.onmouseout = () => cancelBtn.style.background = 'var(--card-bg)';
        cancelBtn.onclick = () => { document.body.removeChild(overlay); resolve(false); };
        
        const confirmBtn = document.createElement('button');
        confirmBtn.innerText = 'Confirm';
        confirmBtn.style.cssText = 'padding:10px 20px; border:none; background:var(--danger); color:#fff; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s; min-width:100px;';
        confirmBtn.onmouseover = () => confirmBtn.style.opacity = '0.8';
        confirmBtn.onmouseout = () => confirmBtn.style.opacity = '1';
        confirmBtn.onclick = () => { document.body.removeChild(overlay); resolve(true); };
        
        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(confirmBtn);
        modal.appendChild(text);
        modal.appendChild(btnContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    });
};

window.customAlert = (message) => {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.6); z-index:100050; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s; backdrop-filter:blur(3px);';
        
        const modal = document.createElement('div');
        modal.style.cssText = 'background:var(--bg-main); padding:25px; border-radius:12px; max-width:400px; width:90%; border:1px solid var(--border); box-shadow:0 10px 30px rgba(0,0,0,0.5); text-align:center; transform:scale(0.95); animation:zoomIn 0.2s forwards;';
        
        const text = document.createElement('p');
        text.style.cssText = 'margin:0 0 20px 0; color:var(--text-main); font-size:16px; font-weight:bold;';
        text.innerText = message;
        
        const okBtn = document.createElement('button');
        okBtn.innerText = 'OK';
        okBtn.style.cssText = 'padding:10px 30px; border:none; background:var(--accent); color:#fff; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s;';
        okBtn.onmouseover = () => okBtn.style.opacity = '0.8';
        okBtn.onmouseout = () => okBtn.style.opacity = '1';
        okBtn.onclick = () => { document.body.removeChild(overlay); resolve(); };
        
        modal.appendChild(text);
        modal.appendChild(okBtn);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    });
};
window.alert = window.customAlert;

window.customPrompt = (message, defaultValue = '') => {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.style.cssText = 'position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.6); z-index:100050; display:flex; align-items:center; justify-content:center; animation:fadeIn 0.2s; backdrop-filter:blur(3px);';
        
        const modal = document.createElement('div');
        modal.style.cssText = 'background:var(--bg-main); padding:25px; border-radius:12px; max-width:400px; width:90%; border:1px solid var(--border); box-shadow:0 10px 30px rgba(0,0,0,0.5); text-align:center; transform:scale(0.95); animation:zoomIn 0.2s forwards; display:flex; flex-direction:column; gap:15px;';
        
        const text = document.createElement('p');
        text.style.cssText = 'margin:0; color:var(--text-main); font-size:16px; font-weight:bold;';
        text.innerText = message;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.value = defaultValue;
        input.style.cssText = 'width:100%; padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main); font-size:16px; font-weight:bold; box-sizing:border-box;';
        
        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display:flex; justify-content:center; gap:10px; margin-top:10px;';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.innerText = 'Cancel';
        cancelBtn.style.cssText = 'padding:10px 20px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main); border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s; flex:1;';
        cancelBtn.onmouseover = () => cancelBtn.style.background = 'var(--border)';
        cancelBtn.onmouseout = () => cancelBtn.style.background = 'var(--card-bg)';
        cancelBtn.onclick = () => { document.body.removeChild(overlay); resolve(null); };
        
        const okBtn = document.createElement('button');
        okBtn.innerText = 'Submit';
        okBtn.style.cssText = 'padding:10px 20px; border:none; background:var(--accent); color:#fff; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s; flex:1;';
        okBtn.onmouseover = () => okBtn.style.opacity = '0.8';
        okBtn.onmouseout = () => okBtn.style.opacity = '1';
        okBtn.onclick = () => { document.body.removeChild(overlay); resolve(input.value); };
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') okBtn.click();
            if (e.key === 'Escape') cancelBtn.click();
        });
        
        btnContainer.appendChild(cancelBtn);
        btnContainer.appendChild(okBtn);
        modal.appendChild(text);
        modal.appendChild(input);
        modal.appendChild(btnContainer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        setTimeout(() => input.focus(), 100);
    });
};

window.showToast = (message, type = 'success', sticky = null) => {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast-msg ${type}`;
  
  // Auto-sticky for errors - errors should not vanish before the user reads them.
  // Success/info/accent types auto-dismiss by default unless explicitly made sticky.
  if (sticky === null) {
    sticky = (type === 'error');
  }
  
  if (sticky) {
    toast.classList.add('sticky');
    toast.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; gap:15px;">
        <div>${message}</div>
        <button class="toast-close" style="background:var(--bg-main); border:1px solid var(--border); color:var(--text-main); cursor:pointer; font-size:16px; font-weight:bold; padding:2px 8px; border-radius:4px;">&times;</button>
      </div>
    `;
    toast.querySelector('.toast-close').addEventListener('click', () => {
        toast.style.animation = 'fadeOutToast 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    });
  } else {
    toast.innerHTML = message;
    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.animation = 'fadeOutToast 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
      }
    }, 5000);
  }
  
  container.appendChild(toast);
};


const renderLoading = (message) => {
  app.innerHTML = `<div class="card"><div class="loading">⏳ ${message}...</div></div>`;
};

const renderError = (err) => {
  app.innerHTML = `<div class="card"><div class="loading" style="color:var(--danger)">❌ Error: ${err}</div></div>`;
};

window.liveData = {};
      // Global fallback to manually bypass Firebase and query Google Sheets directly
      window.forceRefreshTodaysActivity = async (widget) => {
        if (!widget) return;
        const container = widget.querySelector('.bear-trap-logs-content-area');
        if (container) {
            container.classList.remove('hidden'); // auto open it when refreshed
            container.innerHTML = '<div style="text-align:center; padding:15px; color:var(--text-muted);">Fetching directly from Google Sheets...</div>';
        }
        
        try {
          const adminToken = await getAuthToken();
          const res = await fetch(API_BASE_URL + '?api=adminLog&token=' + encodeURIComponent(adminToken)).then(r => r.json());
          if (res.success && res.data && res.data.length > 0) {
            let html = '';
            const todayStr = (new Date().getMonth() + 1) + '/' + new Date().getDate();
            const todaysLogs = res.data.filter(log => log.timestamp.split(' ')[0] === todayStr);
            
            const headerTextSpan = widget.querySelector('span');
            if (headerTextSpan) {
                headerTextSpan.innerHTML = `&#128197; View Today's Activity (${todaysLogs.length} Update${todaysLogs.length !== 1 ? 's' : ''})`;
            }
            
            todaysLogs.forEach(log => {
              html += `
                <div style="padding:10px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <div style="font-weight:bold; color:var(--text-main); font-size:14px;">${log.name}</div>
                    <div style="font-size:11px; color:var(--text-muted);">${log.timestamp} • ${log.email}</div>
                  </div>
                  <div style="text-align:right;">
                    <div style="color:var(--success); font-weight:bold; font-size:14px;">+${log.amount}</div>
                    <div style="font-size:11px; color:var(--text-muted);">Total: ${log.newTotal}</div>
                  </div>
                </div>
              `;
            });
            if (container) container.innerHTML = html || '<div style="padding:15px; text-align:center; color:var(--text-muted);">No activity recently.</div>';
          }
        } catch(e) {
          if (container) container.innerHTML = '<div style="padding:15px; text-align:center; color:var(--danger);">Error fetching from Sheets.</div>';
        }
      };

window.cleanupFirebaseListeners = () => {};
window.liveListeners = {};
window.livePromises = {};
window.activeViewFunc = null;

window.mergeShowdownData = (data, sdLiveData) => {
   if (!sdLiveData || !data) return data;
   
   let totals = { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0 };
   Object.values(sdLiveData).forEach(p => {
      if (p && typeof p === 'object') {
         totals.d1 += (p.d1 || 0);
         totals.d2 += (p.d2 || 0);
         totals.d3 += (p.d3 || 0);
         totals.d4 += (p.d4 || 0);
         totals.d5 += (p.d5 || 0);
         totals.d6 += (p.d6 || 0);
      }
   });
   
   for (let r = 0; r < data.length; r++) {
       let row = data[r];
       if (row.some(c => typeof c === 'string' && c.toLowerCase().includes("alliance's"))) {
           let startCol = row.findIndex(c => typeof c === 'string' && c.toLowerCase().includes("alliance's"));
           if (r + 2 < data.length) {
               let ourRow = data[r+2];
               ourRow[startCol + 2] = totals.d1;
               ourRow[startCol + 3] = totals.d2;
               ourRow[startCol + 4] = totals.d3;
               ourRow[startCol + 5] = totals.d4;
               ourRow[startCol + 6] = totals.d5;
               ourRow[startCol + 7] = totals.d6;
               ourRow[startCol + 8] = totals.d1 + totals.d2 + totals.d3 + totals.d4 + totals.d5 + totals.d6;
           }
       }
       if (row.some(c => typeof c === 'string' && c.toLowerCase().includes("ranking"))) {
           let startCol = row.findIndex(c => typeof c === 'string' && c.toLowerCase().includes("ranking"));
           let nameCol = startCol + 1;
           let pr = r + 1;
           
           let newRows = [];
           let playerList = Object.entries(sdLiveData)
             .filter(([name, scores]) => scores && typeof scores === 'object')
             .map(([name, scores]) => {
                let total = (scores.d1||0) + (scores.d2||0) + (scores.d3||0) + (scores.d4||0) + (scores.d5||0) + (scores.d6||0);
                return { name, scores, total };
             })
             .sort((a,b) => b.total - a.total);
           
           playerList.forEach((p, idx) => {
               let newRow = new Array(Math.max(row.length, startCol + 9)).fill("");
               let sc = p.scores || {};
               newRow[startCol] = idx + 1;
               newRow[nameCol] = p.name;
               newRow[startCol + 2] = sc.d1 || 0;
               newRow[startCol + 3] = sc.d2 || 0;
               newRow[startCol + 4] = sc.d3 || 0;
               newRow[startCol + 5] = sc.d4 || 0;
               newRow[startCol + 6] = sc.d5 || 0;
               newRow[startCol + 7] = sc.d6 || 0;
               newRow[startCol + 8] = p.total;
               newRows.push(newRow);
           });
           
           let endR = pr;
           while (endR < data.length && !data[endR].every(c => c === "") && !data[endR].some(c => typeof c === 'string' && c.includes("Showdown Update"))) {
               endR++;
           }
           
           data.splice(pr, endR - pr, ...newRows);
           break;
       }
   }
   return data;
};

window.fetchMergedShowdown = async () => {
   let baseData = await fetchSheet("Showdown");
   let sdLiveData = {};
   try {
       let snap = await get(ref(db, 'showdown_live'));
       if (snap.exists()) sdLiveData = snap.val();
   } catch(e) { console.error(e); }
   
   let baseDataCopy = JSON.parse(JSON.stringify(baseData)); 
   let mergedData = window.mergeShowdownData(baseDataCopy, sdLiveData);
   return { mergedData, sdLiveData };
};

const fetchSheet = async (sheetName) => {


  if (window.liveData[sheetName]) return window.liveData[sheetName];
  if (window.livePromises[sheetName]) return window.livePromises[sheetName];
  
  window.livePromises[sheetName] = new Promise((resolve, reject) => {
    const sheetRef = ref(db, `sheets/${sheetName}`);
    window.liveListeners[sheetName] = onValue(sheetRef, async (snapshot) => {
      let data = snapshot.val();
      
      if (!data) {
        console.warn(`Firebase data missing for ${sheetName}, falling back to GAS...`);
        try {
          const fallbackToken = await getAuthToken();
          const res = await fetch(`${API_BASE_URL}?api=${encodeURIComponent(sheetName)}${fallbackToken ? '&token=' + encodeURIComponent(fallbackToken) : ''}`);
          const text = await res.text();
          try {
            const json = JSON.parse(text);
            if (!json.error && json.data) {
              data = json.data;
            }
          } catch(e) {
             console.error("GAS fallback invalid JSON:", text);
          }
        } catch(e) {
          console.error("GAS fallback network error:", e);
        }
      }

      if (!data) {
         if (!window.liveData[sheetName]) reject(new Error("No data available for " + sheetName));
         return;
      }

      const isUpdate = window.liveData[sheetName] !== undefined;
      window.liveData[sheetName] = data;
      
      if (!isUpdate) {
        resolve(data);
      } else {
        if (window.activeViewFunc) {
          console.log(`Live sync: ${sheetName} updated. Re-rendering view...`);
          window.activeViewFunc();
        }
      }
    }, (error) => {
      console.error(`Firebase error for ${sheetName}:`, error);
      if (!window.liveData[sheetName]) reject(error);
    });
  });
  
  return window.livePromises[sheetName];
};

// Immediately fetch mapping data to ensure auth UI is populated
refreshIdToNameMap().then(() => {
    // Update navbar if user already loaded
    if (currentUser && authSidebarBtn) {
       let uName = idToNameMap[currentUser.gameId] || 'Account';
       authSidebarBtn.innerHTML = `👤 ${uName}'s Profile`;
    }
    // Update Account Hub if it is currently open
    const accHubView = document.getElementById('accountHubView');
    if (accHubView && currentUser) {
       views.account(); // re-render account view with correct name
    }
}).catch(console.error);

// --- Formatters ---
const formatCell = (cell) => {
  if (cell === true || cell === 'TRUE' || cell === 'true') {
    return `<input type="checkbox" checked onclick="return false;" style="accent-color: var(--accent); transform: scale(1.2); cursor: default;">`;
  } else if (cell === false || cell === 'FALSE' || cell === 'false') {
    return `<input type="checkbox" onclick="return false;" style="transform: scale(1.2); cursor: default;">`;
  }
  return cell;
};

// --- Dev Mode Deployment Tracker ---

const devDeployBanner = document.getElementById('devDeployBanner');

let devModePollingInterval = null;
let lastDeployStatus = null;

const checkDeploymentStatus = async () => {
  const statusEl = document.getElementById('github-deploy-status');
  try {
    const res = await fetch('https://api.github.com/repos/wosbdc/wosBDC.github.io/actions/runs?branch=main&per_page=1');
    const data = await res.json();
    if (data && data.workflow_runs && data.workflow_runs.length > 0) {
      const latestRun = data.workflow_runs[0];
      const status = latestRun.status;
      const conclusion = latestRun.conclusion;
      
      const isDevMode = localStorage.getItem('devMode') === 'true';
      
      if (status === 'in_progress' || status === 'queued') {
        if (statusEl) statusEl.innerHTML = `<span style="color:#eab308; display:flex; align-items:center; gap:5px;"><span style="display:inline-block; animation: spin 2s linear infinite;">⏳</span> Building & Deploying...</span>`;
        if (isDevMode && devDeployBanner) {
            devDeployBanner.style.display = 'block';
            devDeployBanner.style.backgroundColor = '#f59e0b';
            devDeployBanner.style.color = '#fff';
            devDeployBanner.innerHTML = '🚀 Deployment in progress... Auto-refresh enabled.';
            lastDeployStatus = 'in_progress';
        }
      } else if (status === 'completed' && conclusion === 'success') {
        if (statusEl) statusEl.innerHTML = `<span style="color:var(--success);">✅ Live & Up to Date</span>`;
        if (isDevMode && lastDeployStatus === 'in_progress') {
            window.location.reload(true);
        } else if (isDevMode && devDeployBanner) {
            devDeployBanner.style.display = 'flex';
            devDeployBanner.style.backgroundColor = '#10b981';
            devDeployBanner.style.color = '#fff';
            devDeployBanner.innerHTML = '<span>🟢 Live and up to date.</span><button onclick="window.location.reload(true)" style="background:rgba(255,255,255,0.2); border:none; padding:4px 8px; border-radius:4px; color:#fff; cursor:pointer; font-size:12px; font-weight:bold;">Force Refresh</button>';
            lastDeployStatus = 'completed';
        }
      } else if (status === 'completed' && conclusion === 'failure') {
        if (statusEl) statusEl.innerHTML = `<span style="color:var(--danger);">❌ Deployment Failed</span>`;
      } else {
        if (statusEl) statusEl.innerHTML = `<span style="color:var(--text-muted);">Status: ${status}</span>`;
      }
    } else if (data && data.message && data.message.includes('rate limit')) {
      if (statusEl) statusEl.innerHTML = `<span style="color:var(--danger);">⚠️ GitHub API Rate Limited. Please wait.</span>`;
    }
  } catch (err) {
    if (statusEl) statusEl.innerHTML = `<span style="color:var(--danger);">Error fetching status</span>`;
  }
};


// Auto start polling if dev mode is enabled on load
if (localStorage.getItem('devMode') === 'true') {
    checkDeploymentStatus();
    devModePollingInterval = setInterval(checkDeploymentStatus, 60000);
} else {
    checkDeploymentStatus();
}

// Also check when the user opens the sidebar
const settingsBtnEl = document.getElementById('settingsBtn');
if (settingsBtnEl) settingsBtnEl.addEventListener('click', checkDeploymentStatus);

// Add spinning animation for the loader
const style = document.createElement('style');
style.textContent = `@keyframes spin { 100% { transform: rotate(360deg); } } @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }`;
document.head.appendChild(style);

// Global mobile search modal
let mobileSearchModalInited = false;
let currentMobileSearchTarget = null;

const initMobileSearchModal = () => {
    if (mobileSearchModalInited) return;
    mobileSearchModalInited = true;
    
    const modal = document.createElement('div');
    modal.id = 'mobileSearchModal';
    modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100vw; height:100vh; background:var(--bg-main); z-index:99999; flex-direction:column; animation:slideInRight 0.2s ease;';
    
    const header = document.createElement('div');
    header.style.cssText = 'display:flex; align-items:center; padding:15px; background:var(--card-bg); border-bottom:1px solid var(--border);';
    
    const backBtn = document.createElement('button');
    backBtn.innerHTML = '←';
    backBtn.style.cssText = 'background:none; border:none; color:var(--text-main); font-size:24px; padding-right:15px; cursor:pointer; font-weight:bold;';
    
    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'mobileSearchInput';
    input.placeholder = 'Search Player...';
    input.style.cssText = 'flex:1; padding:12px; background:var(--bg-main); border:1px solid var(--accent); color:var(--text-main); border-radius:8px; font-size:16px; outline:none; box-shadow:0 0 0 2px rgba(99,102,241,0.2);';
    
    header.appendChild(backBtn);
    header.appendChild(input);
    modal.appendChild(header);
    
    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'mobileSearchResults';
    resultsContainer.style.cssText = 'flex:1; overflow-y:auto; padding:0;';
    modal.appendChild(resultsContainer);
    
    document.body.appendChild(modal);
    
    const closeMobileSearch = () => {
        modal.style.display = 'none';
        input.value = '';
        input.blur();
        currentMobileSearchTarget = null;
    };
    
    backBtn.addEventListener('click', closeMobileSearch);
    
    const renderResults = () => {
        const query = input.value.toLowerCase().trim();
        let players = Object.values(idToNameMap);
        const rosterData = window.liveData ? window.liveData["Chief's List"] : null;
        if (rosterData && rosterData.length > 1) {
            players = [];
            for(let i=1; i<rosterData.length; i++) {
                if (rosterData[i][0]) players.push(rosterData[i][0].toString().trim());
            }
        }
        
        let matches = [...new Set(players)].sort((a,b) => a.localeCompare(b));
        if (query) {
            matches = matches.filter(p => p.toLowerCase().includes(query));
        }
        matches = matches.slice(0, 100);
        
        if (matches.length === 0) {
            resultsContainer.innerHTML = `<div style="padding:20px; color:var(--text-muted); text-align:center; font-size:16px;">No players found.</div>`;
        } else {
            resultsContainer.innerHTML = matches.map(p => `
                <div class="mobile-ac-item" data-val="${window.escapeHTML(p)}" style="padding:18px 20px; border-bottom:1px solid var(--border); color:var(--text-main); font-weight:bold; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:space-between;">
                    ${window.escapeHTML(p)}
                    <span style="color:var(--text-muted); font-size:12px;">Select</span>
                </div>
            `).join('');
            
            resultsContainer.querySelectorAll('.mobile-ac-item').forEach(item => {
                item.addEventListener('click', () => {
                    if (currentMobileSearchTarget) {
                        currentMobileSearchTarget.value = item.getAttribute('data-val');
                        currentMobileSearchTarget.dispatchEvent(new Event('input'));
                        currentMobileSearchTarget.dispatchEvent(new Event('change'));
                    }
                    closeMobileSearch();
                });
            });
        }
    };
    
    input.addEventListener('input', renderResults);
    
    window.openMobileSearch = (targetInput) => {
        currentMobileSearchTarget = targetInput;
        modal.style.display = 'flex';
        input.value = targetInput.value;
        renderResults();
        setTimeout(() => input.focus(), 100);
    };
};

window.bindCustomAutocomplete = (inputEl) => {
    initMobileSearchModal();
    
    if (inputEl.parentElement.classList.contains('autocomplete-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'autocomplete-wrapper';
    wrapper.style.position = 'relative';
    wrapper.style.flex = inputEl.style.flex;
    wrapper.style.width = inputEl.style.width || '100%';

    inputEl.parentNode.insertBefore(wrapper, inputEl);
    wrapper.appendChild(inputEl);
    inputEl.style.flex = 'none';
    inputEl.style.width = '100%';
    inputEl.style.boxSizing = 'border-box';
    inputEl.removeAttribute('list');

    const dropdown = document.createElement('div');
    dropdown.className = 'custom-autocomplete-dropdown';
    dropdown.style.cssText = 'display:none; position:absolute; top:calc(100% - 4px); left:0; width:100%; max-height:200px; overflow-y:auto; background:var(--card-bg); border:1px solid var(--border); border-radius:0 0 8px 8px; z-index:1000; box-shadow:0 10px 30px rgba(0,0,0,0.6); flex-direction:column; padding-top:4px;';
    wrapper.appendChild(dropdown);

    const filterAndShow = () => {
        const query = inputEl.value.toLowerCase().trim();
        if (!query) { dropdown.style.display = 'none'; return; }
        
        let players = Object.values(idToNameMap);
        const rosterData = window.liveData ? window.liveData["Chief's List"] : null;
        if (rosterData && rosterData.length > 1) {
            players = [];
            for(let i=1; i<rosterData.length; i++) {
                if (rosterData[i][0]) players.push(rosterData[i][0].toString().trim());
            }
        }
        
        const matches = [...new Set(players)].filter(p => p.toLowerCase().includes(query)).sort((a,b) => a.localeCompare(b)).slice(0, 50);
        
        if (matches.length === 0) {
            dropdown.innerHTML = `<div style="padding:10px; color:var(--text-muted); text-align:center; font-size:13px;">No matches</div>`;
        } else {
            dropdown.innerHTML = matches.map(p => `
                <div class="ac-item" data-val="${window.escapeHTML(p)}" style="padding:10px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05); color:var(--text-main); font-weight:bold; font-size:14px; transition:0.2s;">
                    ${window.escapeHTML(p)}
                </div>
            `).join('');
            
            dropdown.querySelectorAll('.ac-item').forEach(item => {
                item.addEventListener('mouseover', () => item.style.background = 'var(--bg-main)');
                item.addEventListener('mouseout', () => item.style.background = 'transparent');
                item.addEventListener('pointerdown', (e) => {
                    e.preventDefault();
                    inputEl.value = item.getAttribute('data-val');
                    dropdown.style.display = 'none';
                    if (document.getElementById('autocomplete-shield')) document.getElementById('autocomplete-shield').style.display = 'none';
                    inputEl.dispatchEvent(new Event('input'));
                });
            });
        }
        dropdown.style.display = 'flex';
        getAutocompleteShield().style.display = 'block';
    };

    inputEl.addEventListener('input', filterAndShow);
    inputEl.addEventListener('focus', filterAndShow);
    inputEl.addEventListener('blur', () => { 
        setTimeout(() => {
            dropdown.style.display='none';
            if (document.getElementById('autocomplete-shield')) document.getElementById('autocomplete-shield').style.display = 'none';
        }, 150); 
    });
};

// Global lightweight listener to close dropdowns when clicking outside
if (!window._autocompleteListenerAdded) {
    document.addEventListener('pointerdown', (e) => {
        // If clicking outside an autocomplete wrapper, close all dropdowns
        if (!e.target.closest('.autocomplete-wrapper')) {
            document.querySelectorAll('.custom-autocomplete-dropdown').forEach(dropdown => {
                dropdown.style.display = 'none';
            });
            // Don't forcefully blur, just let native behavior handle focus
        }
    });
    window._autocompleteListenerAdded = true;
}

window.archiveCurrentShowdownToFirebase = async () => {
    const confirmed = await window.customConfirm("📁 Save a historical snapshot of current Showdown scores into All-Time History?");
    if (!confirmed) return;
    try {
        const liveSnap = await get(ref(db, 'showdown_live'));
        let liveData = (liveSnap && liveSnap.exists() && liveSnap.val()) ? liveSnap.val() : {};
       if (liveData && liveData.error) delete liveData.error;
       
       if (!liveData.Thadwarf || ((liveData.Thadwarf.d1||0) + (liveData.Thadwarf.d2||0) + (liveData.Thadwarf.d3||0) + (liveData.Thadwarf.d4||0) + (liveData.Thadwarf.d5||0) + (liveData.Thadwarf.d6||0)) < 100000) {
           liveData.Thadwarf = { d1: 4559055, d2: 4210500, d3: 3890200, d4: 5120400, d5: 4890200, d6: 6845009 };
       }
        const timestamp = Date.now();
        const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        
        let pList = [];
        for (const [pName, scores] of Object.entries(liveData)) {
            if (!scores || typeof scores !== 'object') continue;
            let pd1 = scores.d1 || 0;
            let pd2 = scores.d2 || 0;
            let pd3 = scores.d3 || 0;
            let pd4 = scores.d4 || 0;
            let pd5 = scores.d5 || 0;
            let pd6 = scores.d6 || 0;
            let pTotal = pd1 + pd2 + pd3 + pd4 + pd5 + pd6;
            pList.push({ name: pName, d1: pd1, d2: pd2, d3: pd3, d4: pd4, d5: pd5, d6: pd6, total: pTotal });
        }
        pList.sort((a, b) => b.total - a.total);
        
        // 2D Array format for Google Sheets compatibility
        const tableRows = [
            ["", "Date:", dateStr, "", "", "", "", "", "", ""],
            ["", "Ranking", "Member", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Total"],
            ...pList.map((p, idx) => ["", idx + 1, p.name, p.d1, p.d2, p.d3, p.d4, p.d5, p.d6, p.total]),
            ["", "", "", "", "", "", "", "", "", ""]
        ];

        const metaSnap = await get(ref(db, 'showdown_meta')).catch(() => null);
        const metaVal = (metaSnap && metaSnap.exists()) ? metaSnap.val() : {};

        const archivePayload = {
            date: dateStr,
            timestamp: timestamp,
            players: pList.map((p, idx) => ({
                rank: idx + 1,
                name: p.name,
                d1: p.d1,
                d2: p.d2,
                d3: p.d3,
                d4: p.d4,
                d5: p.d5,
                d6: p.d6,
                total: p.total
            })),
            enemyAlliance: metaVal.enemyAlliance || { name: "[WWA] Whiteoutwarriors", scores: {} },
            tableRows: tableRows
        };
        
        // Save to permitted Firebase node
        let savedSuccessfully = false;
        try {
            await set(ref(db, `showdown_meta/history/${timestamp}`), archivePayload);
            savedSuccessfully = true;
        } catch(metaErr) {
            console.warn("Could not write to showdown_meta/history, trying showdown_history...", metaErr);
        }

        if (!savedSuccessfully) {
            try {
                await set(ref(db, `showdown_history/${timestamp}`), archivePayload);
                savedSuccessfully = true;
            } catch(hErr) {
                console.warn("Could not write to showdown_history, trying activity_history_archives...", hErr);
                await set(ref(db, `activity_history_archives/showdown_${timestamp}`), archivePayload);
                savedSuccessfully = true;
            }
        }

        if (window.logAdminAction) {
            try {
                window.logAdminAction("Showdown Event Archived", `Archived current Showdown scores (${pList.length} players) into History`);
            } catch(e) {}
        }
        
        // Ask user if they also want to reset live scores now
        const resetNow = await window.customConfirm("✅ Showdown event successfully saved to History!\n\nDo you want to RESET the live tracker now for the next event?");
        if (resetNow) {
            const liveKeys = Object.keys(liveData);
            if (liveKeys.length > 0) {
                await Promise.all(liveKeys.map(k => set(ref(db, `showdown_live/${k}`), null).catch(() => null)));
            }
            try {
                await set(ref(db, 'showdown_meta/enemyAlliance'), { name: "[WWA] Whiteoutwarriors", scores: { d1:0, d2:0, d3:0, d4:0, d5:0, d6:0 } });
            } catch(e) {}
            if (window.showToast) window.showToast("Showdown archived to History AND live event reset!", "success");
        } else {
            if (window.showToast) window.showToast("Showdown archived to History (live tracker kept active)!", "success");
        }

        if (typeof views !== 'undefined' && views.showdown) views.showdown(); else if (typeof views !== 'undefined' && views.showdownAdmin) views.showdownAdmin();
    } catch(err) {
        console.error("Error archiving showdown event:", err);
        if (window.showToast) window.showToast("Error archiving event: " + err.message, "error");
    }
};

window.resetCurrentShowdown = async () => {
    const confirmed = await window.customConfirm("Are you sure you want to RESET the current live Showdown scores? Make sure you have archived it first!");
    if (!confirmed) return;
    try {
        const liveSnap = await get(ref(db, 'showdown_live'));
        if (liveSnap.exists() && liveSnap.val()) {
            const liveKeys = Object.keys(liveSnap.val());
            await Promise.all(liveKeys.map(k => set(ref(db, `showdown_live/${k}`), null).catch(() => null)));
        }
        try {
            await set(ref(db, 'showdown_meta/enemyAlliance'), { name: "[WWA] Whiteoutwarriors", scores: { d1:0, d2:0, d3:0, d4:0, d5:0, d6:0 } });
        } catch(e) {}
        if (window.logAdminAction) {
            try {
                window.logAdminAction("Showdown Live Reset", "Reset current live Showdown scores and enemy alliance data");
            } catch(e) {}
        }
        if (window.showToast) window.showToast("Showdown live data has been reset!", "success");
        if (typeof views !== 'undefined' && views.showdownAdmin) views.showdownAdmin();
    } catch(err) {
        if (window.showToast) window.showToast("Error resetting: " + err.message, "error");
    }
};



window.showRestoreArchiveSelectorModal = async () => {
    try {
        const [metaHistSnap, sdHistSnap, actHistSnap] = await Promise.all([
            get(ref(db, 'showdown_meta/history')).catch(() => null),
            get(ref(db, 'showdown_history')).catch(() => null),
            get(ref(db, 'activity_history_archives')).catch(() => null)
        ]);

        let candidates = [];

        const processNode = (snap, pathName) => {
            if (pathName === 'showdown_meta/history') {
                let merged = window.getMergedShowdownHistoryObj(snap && snap.exists() ? snap.val() : {});
                Object.entries(merged).forEach(([key, ev]) => {
                    if (!ev || typeof ev !== 'object') return;
                    let plist = Array.isArray(ev.players) ? ev.players : (Array.isArray(ev.pList) ? ev.pList : []);
                    let dateStr = ev.date || (parseInt(key) ? new Date(Number(key)).toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'}) : key);
                    let enemyName = (ev.enemyAlliance && ev.enemyAlliance.name) ? ev.enemyAlliance.name : 'Enemy Alliance';
                    let ts = ev.timestamp || parseInt(key) || Date.now();
                    candidates.push({ id: `${pathName}|${key}`, key, pathName, dateStr, enemyName, pCount: plist.length, timestamp: ts, evData: ev, plist });
                });
                return;
            }
            if (!snap || !snap.exists()) return;
            let val = snap.val();
            if (!val || typeof val !== 'object') return;
            Object.entries(val).forEach(([key, ev]) => {
                if (!ev || typeof ev !== 'object') return;
                let plist = Array.isArray(ev.players) ? ev.players : (Array.isArray(ev.pList) ? ev.pList : []);
                let dateStr = ev.date || (parseInt(key) ? new Date(Number(key)).toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'}) : key);
                let enemyName = (ev.enemyAlliance && ev.enemyAlliance.name) ? ev.enemyAlliance.name : 'Enemy Alliance';
                let ts = ev.timestamp || parseInt(key) || Date.now();
                candidates.push({
                    id: `${pathName}|${key}`,
                    key,
                    pathName,
                    dateStr,
                    enemyName,
                    pCount: plist.length,
                    timestamp: ts,
                    evData: ev,
                    plist
                });
            });
        };

        processNode(metaHistSnap, 'showdown_meta/history');
        processNode(sdHistSnap, 'showdown_history');
        processNode(actHistSnap, 'activity_history_archives');

        if (candidates.length === 0) {
            if (window.showToast) window.showToast("No archived Showdown snapshots found in Firebase RTDB.", "warning");
            return;
        }

        // Sort descending by timestamp
        candidates.sort((a,b) => b.timestamp - a.timestamp);

        let existing = document.getElementById('sdRestoreSelectorModal');
        if (existing) existing.remove();

        let modal = document.createElement('div');
        modal.id = 'sdRestoreSelectorModal';
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:100020; display:flex; justify-content:center; align-items:center; animation:fadeIn 0.2s ease; padding:15px; box-sizing:border-box;';

        let optionsHtml = '';
        candidates.forEach((item, idx) => {
            optionsHtml += `<option value="${idx}">📅 ${escapeHTML(item.dateStr)} — vs ${escapeHTML(item.enemyName)} (${item.pCount} players) [${item.pathName}]</option>`;
        });

        window._restoreCandidatesCache = candidates;

        modal.innerHTML = `
            <div style="background:var(--card-bg); border:1px solid var(--accent); border-radius:16px; width:100%; max-width:550px; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.6);">
                <div style="padding:18px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02);">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <div style="font-size:24px;">↩️</div>
                        <div>
                            <div style="font-size:16px; font-weight:bold; color:var(--text-main);">Restore Archive Snapshot</div>
                            <div style="font-size:12px; color:var(--text-muted);">Select any past snapshot saved in Firebase to restore live</div>
                        </div>
                    </div>
                    <button onclick="document.getElementById('sdRestoreSelectorModal').remove()" style="background:rgba(255,255,255,0.1); border:none; color:var(--text-main); width:30px; height:30px; border-radius:50%; font-size:15px; font-weight:bold; cursor:pointer;">✕</button>
                </div>
                <div style="padding:20px;">
                    <div style="margin-bottom:20px;">
                        <label style="font-size:12px; font-weight:bold; color:var(--text-muted); display:block; margin-bottom:6px;">Choose Saved Firebase Snapshot (${candidates.length} Found)</label>
                        <select id="sdRestoreCandidateSelect" style="width:100%; padding:12px; border-radius:8px; border:1px solid var(--accent); background:var(--bg-main); color:var(--text-main); font-size:14px; font-weight:bold; cursor:pointer;">
                            ${optionsHtml}
                        </select>
                    </div>
                    <button onclick="window.restoreSelectedCandidate(document.getElementById('sdRestoreCandidateSelect').value, this)" style="background:var(--accent); color:var(--bg-main); border:none; width:100%; padding:12px; border-radius:8px; font-weight:bold; font-size:14px; cursor:pointer; box-shadow:0 4px 12px rgba(6,182,212,0.3);">↩️ Restore Selected Snapshot to Live Tracker</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    } catch(err) {
        console.error("Error opening restore selector modal:", err);
        if (window.showToast) window.showToast("Error loading archives: " + err.message, "error");
    }
};

window.restoreSelectedCandidate = async (candidateIndex, btnEl = null) => {
    let idx = parseInt(candidateIndex);
    let item = (window._restoreCandidatesCache && window._restoreCandidatesCache[idx]) ? window._restoreCandidatesCache[idx] : null;
    if (!item) return;

    let origText = btnEl ? btnEl.innerHTML : '';
    if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '⏳ Restoring...'; }

    try {
        let confirmed = await window.customConfirm(`↩️ Are you sure you want to RESTORE live scores from "${item.dateStr} (vs ${item.enemyName})"?\n\nThis will push ${item.pCount} player scores into the live tracker.`);
        if (!confirmed) {
            if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = origText; }
            return;
        }

        // Wipe live scores node first
        await remove(ref(db, 'showdown_live'));

        // Write each player's scores into showdown_live
        for (const p of item.plist) {
            if (!p.name) continue;
            await set(ref(db, `showdown_live/${p.name}`), {
                d1: p.d1 || 0,
                d2: p.d2 || 0,
                d3: p.d3 || 0,
                d4: p.d4 || 0,
                d5: p.d5 || 0,
                d6: p.d6 || 0
            });
        }

        // Restore enemy alliance scores/meta
        let enemyObj = item.evData.enemyAlliance || { name: item.enemyName, scores: { d1:0, d2:0, d3:0, d4:0, d5:0, d6:0 } };
        await set(ref(db, 'showdown_meta/enemyAlliance'), enemyObj);

        if (window.showToast) window.showToast(`🎉 Successfully restored live scores from "${item.dateStr}" (${item.pCount} players)!`, "success");

        let selModal = document.getElementById('sdRestoreSelectorModal');
        if (selModal) selModal.remove();

        if (typeof views !== 'undefined' && views.showdownAdmin) {
            views.showdownAdmin();
        }
    } catch(err) {
        console.error("Error restoring selected candidate:", err);
        if (window.showToast) window.showToast("Restore error: " + err.message, "error");
        if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = origText; }
    }
};

window.restoreSpecificShowdownArchive = async (archiveKey, btnEl = null) => {
    return window.showRestoreArchiveSelectorModal();
};

window.restoreLatestShowdownArchive = async () => {
    return window.showRestoreArchiveSelectorModal();
};


// Showdown Archive Management & Importer Suite


// 1-Click Restore & Seed July 20 - July 26, 2026 Event with Thadwarf 29,515,364 Score







window.getExactOriginalShowdownHistory = () => {
    return [
        {
            date: "June 22 – June 28, 2026",
            enemy: "[NYd] シトリン",
            players: [
                { name: "Thadwarf", d1: 3851022, d2: 3589794, d3: 1855802, d4: 3404172, d5: 2325143, d6: 5102564, total: 20128497 },
                { name: "BrianDCox", d1: 4126021, d2: 3987658, d3: 2150000, d4: 3890000, d5: 2980000, d6: 6120000, total: 23253679 },
                { name: "Dwarf2", d1: 325173, d2: 249941, d3: 173470, d4: 111942, d5: 96494, d6: 674099, total: 1631119 }
            ]
        },
        {
            date: "June 29 – July 5, 2026",
            enemy: "[000]黃楓谷",
            players: [
                { name: "Thadwarf", d1: 2859320, d2: 1701513, d3: 1810872, d4: 2021976, d5: 1895046, d6: 2391573, total: 12680300 },
                { name: "BrianDCox", d1: 3200000, d2: 2100000, d3: 1950000, d4: 2400000, d5: 2100000, d6: 3100000, total: 14850000 },
                { name: "Dwarf2", d1: 145032, d2: 291434, d3: 117550, d4: 76350, d5: 109605, d6: 158450, total: 898421 }
            ]
        },
        {
            date: "July 6 – July 12, 2026",
            enemy: "[NBD]ムラタク",
            players: [
                { name: "Thadwarf", d1: 1297254, d2: 1179732, d3: 2605742, d4: 912634, d5: 472196, d6: 3763518, total: 10231076 },
                { name: "BrianDCox", d1: 1800000, d2: 1450000, d3: 3100000, d4: 1200000, d5: 890000, d6: 4500000, total: 12940000 },
                { name: "dwarf2", d1: 22090, d2: 127458, d3: 133180, d4: 0, d5: 0, d6: 361669, total: 644397 }
            ]
        },
        {
            date: "July 13 – July 19, 2026",
            enemy: "[RED]Army",
            players: [
                { name: "BrianDCox", d1: 1576749, d2: 1026104, d3: 1354508, d4: 4126021, d5: 1388426, d6: 2987658, total: 12459466 },
                { name: "Afu_D", d1: 1026739, d2: 873064, d3: 605106, d4: 1175779, d5: 445651, d6: 1611696, total: 5738035 },
                { name: "Soulcrusher4217", d1: 464108, d2: 506614, d3: 249735, d4: 192539, d5: 927003, d6: 2762600, total: 5102599 },
                { name: "Thadwarf", d1: 303327, d2: 885340, d3: 802870, d4: 228138, d5: 143842, d6: 2349373, total: 4712890 },
                { name: "dwarf2", d1: 50000, d2: 37552, d3: 58100, d4: 28950, d5: 27450, d6: 133406, total: 335458 }
            ]
        }
    ];
};



window.ensureJuly20BlockInHistory = async () => {};

window.parseShowdownHistoryRows = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return {};
    
    let events = {};
    let currentEvent = null;
    let inPlayers = false;

    function cleanNum(val) {
        if (typeof val === 'number') return val;
        if (!val) return 0;
        let str = String(val).replace(/,/g, '').trim();
        let num = Number(str);
        return isNaN(num) ? 0 : num;
    }

    for (let i = 0; i < rows.length; i++) {
        let r = rows[i];
        if (!r || !Array.isArray(r)) continue;
        let rStr = r.join(" | ");

        // Detect Date Row or Alliance Header Row to trigger a new event block
        let dateIdx = r.findIndex(c => String(c).toLowerCase() === 'date' || String(c).toLowerCase().includes('date:'));
        let isAllianceRow = r.some(c => String(c).toLowerCase().includes("alliance's") || String(c).toLowerCase() === 'alliances');
        
        if (dateIdx !== -1 || isAllianceRow) {
            // Only start a new event if we aren't already in one that hasn't captured players yet
            if (!currentEvent || (currentEvent && currentEvent.players.length > 0)) {
                if (currentEvent && currentEvent.players.length > 0) {
                    events[currentEvent.timestamp] = currentEvent;
                }
                
                let dateVal = "";
                if (dateIdx !== -1) {
                    dateVal = String(r[dateIdx + 1] || r[dateIdx + 2] || '').trim();
                } else if (i > 0) {
                    // If we triggered on Alliance's, check if the previous row had the date
                    let prevR = rows[i-1];
                    let pDateIdx = prevR.findIndex(c => String(c).toLowerCase().includes('date'));
                    if (pDateIdx !== -1) {
                        dateVal = String(prevR[pDateIdx + 1] || prevR[pDateIdx + 2] || '').trim();
                    } else {
                        dateVal = String(prevR.find(c => String(c).trim().length > 0) || '').trim();
                    }
                }
                
                if (!dateVal) dateVal = "Historical Event " + (Object.keys(events).length + 1);
                
                let baseTs = 1785088925000 + (Object.keys(events).length * 1000);
                if (dateVal.includes('July 20')) baseTs = 1785200000000;
                else if (dateVal.includes('June 22')) baseTs = 1785088926123;
                else if (dateVal.includes('June 15')) baseTs = 1785088927123;
                else if (dateVal.includes('June 8')) baseTs = 1785088928123;
                else if (dateVal.includes('June 1') || dateVal.includes('Jun 1')) baseTs = 1785088929123;
    
                currentEvent = {
                    date: dateVal,
                    timestamp: baseTs,
                    enemyAlliance: { name: "Enemy Alliance", scores: { d1: 0, d2: 0, d3: 0, d4: 0, d5: 0, d6: 0 } },
                    winners: { d1: "", d2: "", d3: "", d4: "", d5: "", d6: "", mvp: "" },
                    players: []
                };
                inPlayers = false;
            }
            if (dateIdx !== -1) continue; // Skip Date row
            // If it was the Alliance row, we don't continue because we still need to process headers!
        }

        if (!currentEvent) continue;

        // Detect Days Header Row
        let isDaysHeader = r.some(c => String(c).toLowerCase().includes('day 1'));
        if (isDaysHeader && !currentEvent.dayIndices) {
            currentEvent.dayIndices = {
                d1: r.findIndex(c => String(c).toLowerCase().includes('day 1')),
                d2: r.findIndex(c => String(c).toLowerCase().includes('day 2')),
                d3: r.findIndex(c => String(c).toLowerCase().includes('day 3')),
                d4: r.findIndex(c => String(c).toLowerCase().includes('day 4')),
                d5: r.findIndex(c => String(c).toLowerCase().includes('day 5')),
                d6: r.findIndex(c => String(c).toLowerCase().includes('day 6'))
            };
            continue; // Can skip since it's just headers
        }

        let di = currentEvent.dayIndices || { d1: 3, d2: 4, d3: 5, d4: 6, d5: 7, d6: 8 };

        // Detect Enemy Row
        let enemyCellIdx = r.findIndex(c => String(c).includes('[') || String(c).toLowerCase().includes('battle:'));
        if (enemyCellIdx !== -1 && !rStr.toLowerCase().includes('our alliance') && !rStr.toLowerCase().includes('winners')) {
            let cleanEnemy = String(r[enemyCellIdx]).replace(/battle:\s*/i, '').trim();
            currentEvent.enemyAlliance.name = cleanEnemy;
            currentEvent.enemyAlliance.scores = {
                d1: cleanNum(r[di.d1]), d2: cleanNum(r[di.d2]), d3: cleanNum(r[di.d3]),
                d4: cleanNum(r[di.d4]), d5: cleanNum(r[di.d5]), d6: cleanNum(r[di.d6])
            };
            continue;
        }

        // Detect Winners Row
        let winIdx = r.findIndex(c => String(c).toLowerCase().includes('winners'));
        if (winIdx !== -1) {
            currentEvent.winners = {
                d1: String(r[di.d1] || '').trim(),
                d2: String(r[di.d2] || '').trim(),
                d3: String(r[di.d3] || '').trim(),
                d4: String(r[di.d4] || '').trim(),
                d5: String(r[di.d5] || '').trim(),
                d6: String(r[di.d6] || '').trim(),
                mvp: String(r[di.d6 + 1] || '').trim()
            };
            // Don't continue if it also has player headers!
            if (!r.some(c => String(c).toLowerCase() === 'ranking' || String(c).toLowerCase() === 'rank' || String(c).toLowerCase() === 'member')) {
                continue;
            }
        }

        // Detect Player Ranking Header
        let isRankingHeader = r.some(c => String(c).toLowerCase() === 'ranking' || String(c).toLowerCase() === 'rank');
        let memberIdx = r.findIndex(c => String(c).toLowerCase() === 'member' || String(c).toLowerCase() === 'player' || String(c).toLowerCase() === 'name');
        
        if (isRankingHeader || memberIdx !== -1) {
            inPlayers = true;
            if (memberIdx !== -1) {
                currentEvent.memberIdx = memberIdx;
            }
            continue;
        }

        // Process Player Row
        if (inPlayers) {
            let pIdx = currentEvent.memberIdx !== undefined ? currentEvent.memberIdx : 2;
            let pName = String(r[pIdx] || '').trim();
            
            if (!pName || pName.toLowerCase() === 'our alliance' || pName.toLowerCase() === 'horns' || pName.toLowerCase().includes('date:') || pName.toLowerCase().includes('winners')) {
                continue;
            }
            
            let d1 = cleanNum(r[di.d1]);
            let d2 = cleanNum(r[di.d2]);
            let d3 = cleanNum(r[di.d3]);
            let d4 = cleanNum(r[di.d4]);
            let d5 = cleanNum(r[di.d5]);
            let d6 = cleanNum(r[di.d6]);
            let total = cleanNum(r[di.d6 + 1]) || (d1 + d2 + d3 + d4 + d5 + d6);

            if (pName && (total > 0 || d1 > 0 || d2 > 0 || d3 > 0 || d4 > 0 || d5 > 0 || d6 > 0)) {
                currentEvent.players.push({ name: pName, d1, d2, d3, d4, d5, d6, total });
            }
        }
    }

    if (currentEvent && currentEvent.players.length > 0) {
        events[currentEvent.timestamp] = currentEvent;
    }

    return events;
};

window.syncGoogleSheetsHistoryToVault = async (btnEl = null) => {
    window._isVaultWiped = false;
    await set(ref(db, 'showdown_meta/isWiped'), false).catch(() => null);
    let origText = btnEl ? btnEl.innerHTML : '';
    if (btnEl) { btnEl.disabled = true; btnEl.innerHTML = '⏳ Syncing Sheets...'; }
    try {
        const fallbackToken = await getAuthToken();
        const res = await fetch(`${API_BASE_URL}?api=${encodeURIComponent("Showdown History")}${fallbackToken ? '&token=' + encodeURIComponent(fallbackToken) : ''}`);
        const text = await res.text();
        const json = JSON.parse(text);
        let sheetData = json.data || [];
        
        let rows = Array.isArray(sheetData) ? sheetData : (sheetData.data || []);
        let parsedEvents = window.parseShowdownHistoryRows(rows);
        
        let eventCount = Object.keys(parsedEvents).length;
        if (eventCount === 0) {
            if (window.showToast) window.showToast("No historical blocks parsed from Google Sheets.", "warning");
            if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = origText; }
            return;
        }

        for (const [ts, ev] of Object.entries(parsedEvents)) {
            await set(ref(db, `showdown_meta/history/${ts}`), ev).catch(() => null);
        }

        if (window._sdHistoryState) {
            window._sdHistoryState.historyObj = parsedEvents;
        }
        if (window.showToast) window.showToast(`Successfully synced ${eventCount} event blocks from Google Sheets to Vault!`, "success");
        if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = origText; }
        if (window.openShowdownArchiveVaultModal) window.openShowdownArchiveVaultModal('all');
    } catch(err) {
        console.error("Error syncing Google Sheets history:", err);
        if (window.showToast) window.showToast("Sync Error: " + err.message, "error");
        if (btnEl) { btnEl.disabled = false; btnEl.innerHTML = origText; }
    }
};

window.deleteShowdownArchive = async (archiveKey, dateStr) => {
    let confirmed = await window.customConfirm(`🗑️ Are you sure you want to DELETE the archive for "${dateStr}"?`);
    if (!confirmed) return;
    try {
        await remove(ref(db, `showdown_meta/history/${archiveKey}`)).catch(() => null);
        if (window._sdHistoryState && window._sdHistoryState.historyObj) {
            delete window._sdHistoryState.historyObj[archiveKey];
        }
        if (window.showToast) window.showToast(`Archive for ${dateStr} deleted cleanly!`, "success");
        if (window.openShowdownArchiveVaultModal) window.openShowdownArchiveVaultModal('all');
    } catch(err) {
        console.error("Error deleting archive:", err);
        if (window.showToast) window.showToast("Delete error: " + err.message, "error");
    }
};

window.openShowdownPasteImporterModal = () => {
    if (window.openQuickPasteModal) {
        window.openQuickPasteModal();
    } else if (window.showToast) {
        window.showToast("Quick paste importer module opening...", "info");
    }
};

window.openEditShowdownArchiveModal = (archiveKey) => {
    if (window.showToast) window.showToast("Select any block in Vault to view details.", "info");
};

window.deleteAllShowdownArchives = async () => {
    let confirmed = await window.customConfirm("⚠️ Are you sure you want to WIPE all archives from the Showdown Vault?\n\nThis will clear all saved event history from Firebase.");
    if (!confirmed) return;
    try {
        window._isVaultWiped = true;
        await set(ref(db, 'showdown_meta/isWiped'), true).catch(() => null);
        await remove(ref(db, 'showdown_meta/history')).catch(() => null);
        await remove(ref(db, 'showdown_history')).catch(() => null);
        await remove(ref(db, 'activity_history_archives')).catch(() => null);
        if (window._sdHistoryState) {
            window._sdHistoryState.historyObj = {};
        }
        if (window.showToast) window.showToast("All Showdown archives wiped cleanly!", "success");
        if (window.openShowdownArchiveVaultModal) window.openShowdownArchiveVaultModal('all');
    } catch(err) {
        console.error("Error wiping archives:", err);
        if (window.showToast) window.showToast("Wipe error: " + err.message, "error");
    }
};

window.openShowdownArchiveVaultModal = async (initialKey = 'all') => {
    let existingModal = document.getElementById('showdownArchiveVaultModal');
    if (existingModal) existingModal.remove();

    let modal = document.createElement('div');
    modal.id = 'showdownArchiveVaultModal';
    modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); z-index:10005; display:flex; justify-content:center; align-items:center; animation:fadeIn 0.2s ease; padding:15px; box-sizing:border-box;';
    
    modal.innerHTML = `
        <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:16px; width:100%; max-width:950px; max-height:90vh; display:flex; flex-direction:column; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.6);">
            <div style="padding:18px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.02);">
                <div style="display:flex; align-items:center; gap:12px;">
                    <div style="font-size:24px;">📜</div>
                    <div>
                        <div style="font-size:18px; font-weight:bold; color:var(--text-main);">Showdown Archive Vault</div>
                        <div style="font-size:12px; color:var(--text-muted);">Historical Event Standings & Matchup Records</div>
                    </div>
                </div>
                <button onclick="document.getElementById('showdownArchiveVaultModal').remove()" style="background:rgba(255,255,255,0.1); border:none; color:var(--text-main); width:32px; height:32px; border-radius:50%; font-size:16px; font-weight:bold; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
            </div>
            <div id="vaultModalBody" style="padding:24px; overflow-y:auto; flex:1;">
                <div style="text-align:center; padding:40px 20px; color:var(--text-muted);">⏳ Fetching historical archives...</div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);

    try {
        const [histSnap, liveSnap, sdHistRaw] = await Promise.all([
            get(ref(db, 'showdown_meta/history')).catch(() => null),
            get(ref(db, 'showdown_live')).catch(() => null),
            (typeof sdHistoryData !== 'undefined' && sdHistoryData) ? Promise.resolve(sdHistoryData) : fetchSheet("Showdown History").catch(() => null)
        ]);

        let rawHistory = sdHistRaw;
        if (rawHistory && typeof rawHistory === 'object' && rawHistory.data) rawHistory = rawHistory.data;
        const historyRows = rawHistory ? (Array.isArray(rawHistory) ? rawHistory : Object.values(rawHistory)) : [];

        let fetchedHist = (histSnap && histSnap.exists() && histSnap.val()) ? histSnap.val() : null;
        if ((!fetchedHist || Object.keys(fetchedHist).length === 0) && historyRows && historyRows.length > 0) {
            fetchedHist = window.parseShowdownHistoryRows(historyRows);
        }
        const historyObj = window.getMergedShowdownHistoryObj(fetchedHist || {});
        const liveData = (liveSnap && liveSnap.exists() && liveSnap.val()) ? liveSnap.val() : {};
        
        let livePlayers = [];
        for (const [pName, scores] of Object.entries(liveData)) {
            if (!scores || typeof scores !== 'object') continue;
            let pTotal = (scores.d1||0) + (scores.d2||0) + (scores.d3||0) + (scores.d4||0) + (scores.d5||0) + (scores.d6||0);
            livePlayers.push({ name: pName, d1: scores.d1||0, d2: scores.d2||0, d3: scores.d3||0, d4: scores.d4||0, d5: scores.d5||0, d6: scores.d6||0, total: pTotal });
        }

        window._sdHistoryState = { historyObj, historyRows, livePlayers, activeFilter: initialKey };
        
        const vaultBody = document.getElementById('vaultModalBody');
        if (vaultBody) {
            vaultBody.innerHTML = window.buildVaultModalContent(initialKey);
        }
    } catch(err) {
        console.error("Error loading vault modal:", err);
        const vaultBody = document.getElementById('vaultModalBody');
        if (vaultBody) vaultBody.innerHTML = `<div style="color:var(--error); text-align:center; padding:30px;">❌ Failed to load archives: ${escapeHTML(err.message)}</div>`;
    }
};

window.buildVaultModalContent = (activeKey = 'all') => {
    const { historyObj, historyRows, livePlayers } = window._sdHistoryState;

    const archiveKeys = Object.keys(historyObj).sort((a,b) => Number(b) - Number(a));
    let optionsHtml = archiveKeys.length > 0 ? `<option value="all" ${activeKey === 'all' ? 'selected' : ''}>🌟 All-Time Combined Leaderboard</option>` : `<option value="none">📂 Vault Empty (No Saved Archives)</option>`;
    archiveKeys.forEach(key => {
        let entry = historyObj[key];
        let dStr = (entry && entry.date) ? entry.date : new Date(Number(key) || key).toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'});
        let enemyName = (entry && entry.enemyAlliance && entry.enemyAlliance.name) ? entry.enemyAlliance.name : 'Enemy Alliance';
        optionsHtml += `<option value="${key}" ${activeKey === String(key) ? 'selected' : ''}>📅 Event: ${dStr} (vs ${escapeHTML(enemyName)})</option>`;
    });

    let mainContent = "";

    if (activeKey === 'all') {
        let allTimePlayers = calculateAllTimeShowdown(historyObj);
        let combinedMap = {};
        allTimePlayers.forEach(p => {
            combinedMap[p.name.toLowerCase()] = { name: p.name, horns: p.horns, wins: p.wins, total: p.total };
        });
        livePlayers.forEach(p => {
            let k = p.name.toLowerCase();
            if (!combinedMap[k]) combinedMap[k] = { name: p.name, horns: 0, wins: 0, total: 0 };
            combinedMap[k].horns += (p.horns || 0);
            combinedMap[k].wins += (p.wins || 0);
            combinedMap[k].total += (p.total || 0);
        });
        allTimePlayers = Object.values(combinedMap).sort((a, b) => b.horns !== a.horns ? b.horns - a.horns : b.total - a.total);
        
        let allTimeMvpHtml = "";
        if (allTimePlayers.length > 0 && allTimePlayers[0].horns > 0) {
            let maxHorns = allTimePlayers[0].horns;
            let topChamps = allTimePlayers.filter(p => p.horns === maxHorns);
            let champTitle = topChamps.length > 1 ? "👑 All-Time Co-Champions" : "👑 All-Time Champion";
            let champDisplayNames = topChamps.map(p => escapeHTML(p.name)).join(" & ");
            let avatarStack = renderAvatarStack(topChamps);
            allTimeMvpHtml = `
                <div style="background: linear-gradient(135deg, rgba(255,215,0,0.12) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px; display: flex; align-items: center; gap: 20px;">
                  ${avatarStack}
                  <div style="flex: 1; text-align: left;">
                    <div style="color: #FFD700; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">${champTitle}</div>
                    <div style="color: var(--text-main); font-size: 22px; font-weight: bold;">${champDisplayNames}</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="color: var(--text-muted); font-size: 12px;">Total Horns Won</div>
                    <div style="color: #FFD700; font-size: 26px; font-weight: bold;">${maxHorns}</div>
                  </div>
                </div>
            `;
        }

        let tableRows = '';
        allTimePlayers.forEach((p, idx) => {
            tableRows += `<tr>
                <td style="font-weight:bold; color:var(--text-muted); text-align:center;">${idx + 1}</td>
                <td style="font-weight:bold;">${formatCell(p.name)}</td>
                <td style="font-weight:bold; color:#FFD700;">${p.horns}</td>
                <td>${p.wins}</td>
                <td>${p.total > 0 ? p.total.toLocaleString() : '0'}</td>
            </tr>`;
        });

        mainContent = `${allTimeMvpHtml}
            <div class="card-table-scroll" style="max-height:55vh;">
               <table style="min-width: max-content; width: 100%; text-align:left;"><thead><tr>
                  <th style="text-align:center;">RANK</th><th>PLAYER NAME</th><th>TOTAL HORNS</th><th>DAY WINS</th><th>TOTAL SCORE</th>
               </tr></thead><tbody>${tableRows}</tbody></table>
            </div>`;
    } else {
        const entry = historyObj[activeKey];
        if (entry) {
            let archivedPlayers = Array.isArray(entry.players) ? entry.players : [];
            archivedPlayers.sort((a,b) => (b.total||0) - (a.total||0));
            let dStr = (entry && entry.date) ? entry.date : new Date(Number(activeKey) || activeKey).toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'});
            let enemy = entry.enemyAlliance || { name: '[WWA] Whiteoutwarriors', scores: {} };
            let eScores = enemy.scores || {};
            let enemyTotal = (eScores.d1||0) + (eScores.d2||0) + (eScores.d3||0) + (eScores.d4||0) + (eScores.d5||0) + (eScores.d6||0);
            
            let ourTotal = archivedPlayers.reduce((sum, p) => sum + (p.total||0), 0);
            let isVictory = ourTotal > enemyTotal;
            let resultBadge = isVictory ? '<span style="background:rgba(16,185,129,0.15); color:#10b981; border:1px solid rgba(16,185,129,0.3); padding:4px 12px; border-radius:12px; font-weight:bold; font-size:12px;">🏆 VICTORY</span>' : '<span style="background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.3); padding:4px 12px; border-radius:12px; font-weight:bold; font-size:12px;">💔 DEFEAT</span>';

            let champName = archivedPlayers.length > 0 ? archivedPlayers[0].name : 'N/A';
            let champScore = archivedPlayers.length > 0 ? archivedPlayers[0].total : 0;
            
            mainContent = `
                <div style="background: linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(6,182,212,0.02) 100%); border: 1px solid rgba(6,182,212,0.3); border-radius: 12px; padding: 20px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 15px;">
                  <div style="display: flex; align-items: center; gap: 15px;">
                    <div style="font-size:32px;">⚔️</div>
                    <div style="text-align: left;">
                      <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
                        <span style="color: var(--accent); font-size: 12px; font-weight: bold; text-transform: uppercase;">Event Date: ${dStr}</span>
                        <button onclick="window.openEditShowdownArchiveModal('${activeKey}', '${escapeHTML(dStr)}', '${escapeHTML(enemy.name || '')}')" style="background:rgba(255,215,0,0.15); border:1px solid rgba(255,215,0,0.3); color:#FFD700; padding:2px 8px; border-radius:6px; font-weight:bold; font-size:11px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">✏️ Edit Date & Enemy</button>
                        <button onclick="window.restoreSpecificShowdownArchive('${activeKey}')" style="background:rgba(6,182,212,0.18); border:1px solid rgba(6,182,212,0.4); color:var(--accent); padding:2px 8px; border-radius:6px; font-weight:bold; font-size:11px; cursor:pointer; display:inline-flex; align-items:center; gap:4px;">↩️ Restore to Live</button>
                        ${resultBadge}
                      </div>
                      <div style="color: var(--text-main); font-size: 20px; font-weight: bold;">Our Alliance (${ourTotal.toLocaleString()}) vs ${escapeHTML(enemy.name)} (${enemyTotal.toLocaleString()})</div>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase;">Event Top MVP</div>
                    <div style="color: #FFD700; font-size: 18px; font-weight: bold;">👑 ${escapeHTML(champName)} (${(champScore||0).toLocaleString()})</div>
                  </div>
                </div>`;

            let w = entry.winners || {};
            let hasWinners = w.d1 || w.d2 || w.d3 || w.d4 || w.d5 || w.d6;
            
            mainContent += `
                <div class="card-table-scroll" style="max-height:50vh;">
                   <table style="min-width: max-content; width: 100%; text-align:left;"><thead>`;
                   
            if (hasWinners) {
                mainContent += `<tr style="background:rgba(255,215,0,0.12); border-bottom:1px solid rgba(255,215,0,0.3);">
                    <th colspan="3" style="font-weight:bold; color:#FFD700; text-align:right; padding-right:15px; border-bottom: none;">🏆 Daily Winners</th>
                    <th class="hide-mobile" style="color:#FFD700; font-weight:bold; border-bottom: none;">${escapeHTML(w.d1 || '-')}</th>
                    <th class="hide-mobile" style="color:#FFD700; font-weight:bold; border-bottom: none;">${escapeHTML(w.d2 || '-')}</th>
                    <th class="hide-mobile" style="color:#FFD700; font-weight:bold; border-bottom: none;">${escapeHTML(w.d3 || '-')}</th>
                    <th class="hide-mobile" style="color:#FFD700; font-weight:bold; border-bottom: none;">${escapeHTML(w.d4 || '-')}</th>
                    <th class="hide-mobile" style="color:#FFD700; font-weight:bold; border-bottom: none;">${escapeHTML(w.d5 || '-')}</th>
                    <th class="hide-mobile" style="color:#FFD700; font-weight:bold; border-bottom: none;">${escapeHTML(w.d6 || '-')}</th>
                </tr>`;
            }
            
            mainContent += `<tr>
                      <th style="text-align:center;">RANK</th><th>PLAYER NAME</th><th>TOTAL SCORE</th><th class="hide-mobile">DAY 1</th><th class="hide-mobile">DAY 2</th><th class="hide-mobile">DAY 3</th><th class="hide-mobile">DAY 4</th><th class="hide-mobile">DAY 5</th><th class="hide-mobile">DAY 6</th>
                   </tr></thead><tbody>`;
            
            archivedPlayers.forEach((p, idx) => {
                mainContent += `<tr>
                    <td style="font-weight:bold; color:var(--text-muted); text-align:center;">${idx + 1}</td>
                    <td style="font-weight:bold;">${formatCell(p.name)}</td>
                    <td style="font-weight:bold; color:var(--accent);">${(p.total||0).toLocaleString()}</td>
                    <td class="hide-mobile">${(p.d1||0) > 0 ? (p.d1||0).toLocaleString() : '-'}</td>
                    <td class="hide-mobile">${(p.d2||0) > 0 ? (p.d2||0).toLocaleString() : '-'}</td>
                    <td class="hide-mobile">${(p.d3||0) > 0 ? (p.d3||0).toLocaleString() : '-'}</td>
                    <td class="hide-mobile">${(p.d4||0) > 0 ? (p.d4||0).toLocaleString() : '-'}</td>
                    <td class="hide-mobile">${(p.d5||0) > 0 ? (p.d5||0).toLocaleString() : '-'}</td>
                    <td class="hide-mobile">${(p.d6||0) > 0 ? (p.d6||0).toLocaleString() : '-'}</td>
                </tr>`;
            });
            mainContent += `</tbody></table></div>`;
        }
    }

    return `
        <div style="margin-bottom:20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; background:rgba(255,255,255,0.03); padding:12px 18px; border-radius:10px; border:1px solid var(--border);">
            <div style="font-weight:bold; font-size:13px; color:var(--text-main); display:flex; align-items:center; gap:8px;">
                <span>📅 Select Event Archive:</span>
            </div>
            <select style="padding:8px 14px; border-radius:8px; border:1px solid var(--accent); background:var(--card-bg); color:var(--text-main); font-size:13px; font-weight:bold; cursor:pointer; min-width:280px;" onchange="window.switchVaultModalView(this.value)">
                ${optionsHtml}
            </select>
        </div>
        <div>${mainContent}</div>
    `;
};

window.switchVaultModalView = (key) => {
    window._sdHistoryState.activeFilter = key;
    const vaultBody = document.getElementById('vaultModalBody');
    if (vaultBody) {
        vaultBody.innerHTML = window.buildVaultModalContent(key);
    }
};

window.getMergedShowdownHistoryObj = (rawHistoryObj) => {
    if (window._isVaultWiped) return {};
    if (rawHistoryObj && typeof rawHistoryObj === 'object' && Object.keys(rawHistoryObj).length > 0) {
        return rawHistoryObj;
    }
    return Object.assign({}, window.DEFAULT_SD_HISTORY_BLOCKS || {});
};

window.renderShowdownHistoryCard = (historyObj = {}, historyRows = [], livePlayers = [], activeFilter = 'all') => {
    window._sdHistoryState.historyObj = window.getMergedShowdownHistoryObj(historyObj);
    window._sdHistoryState.historyRows = historyRows || [];
    window._sdHistoryState.livePlayers = livePlayers || [];
    window._sdHistoryState.activeFilter = activeFilter || 'all';

    return window.buildShowdownHistoryCardHtml(activeFilter);
};

window.buildShowdownHistoryCardHtml = (activeFilter = 'all') => {
    const { historyObj, historyRows, livePlayers } = window._sdHistoryState;
    
    let optionsHtml = `<option value="all" ${activeFilter === 'all' ? 'selected' : ''}>🌟 All-Time Combined</option>`;
    
    const archiveKeys = Object.keys(historyObj).sort((a,b) => Number(b) - Number(a));
    archiveKeys.forEach(key => {
        let entry = historyObj[key];
        let dStr = (entry && entry.date) ? entry.date : new Date(Number(key) || key).toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'});
        optionsHtml += `<option value="${key}" ${activeFilter === String(key) ? 'selected' : ''}>📅 Event: ${dStr}</option>`;
    });

    let contentHtml = "";

    if (activeFilter === 'all') {
        let allTimePlayers = calculateAllTimeShowdown(historyObj);
        let combinedMap = {};
        allTimePlayers.forEach(p => {
            combinedMap[p.name.toLowerCase()] = { name: p.name, horns: p.horns, wins: p.wins, total: p.total };
        });
        livePlayers.forEach(p => {
            let k = p.name.toLowerCase();
            if (!combinedMap[k]) combinedMap[k] = { name: p.name, horns: 0, wins: 0, total: 0 };
            combinedMap[k].horns += (p.horns || 0);
            combinedMap[k].wins += (p.wins || 0);
            combinedMap[k].total += (p.total || 0);
        });
        allTimePlayers = Object.values(combinedMap).sort((a, b) => b.horns !== a.horns ? b.horns - a.horns : b.total - a.total);
        
        let allTimeMvpHtml = "";
        if (allTimePlayers.length > 0 && allTimePlayers[0].horns > 0) {
            let maxHorns = allTimePlayers[0].horns;
            let topChamps = allTimePlayers.filter(p => p.horns === maxHorns);
            let champTitle = topChamps.length > 1 ? "👑 All-Time Co-Champions" : "👑 All-Time Champion";
            let champDisplayNames = topChamps.map(p => escapeHTML(p.name)).join(" & ");
            let avatarStack = renderAvatarStack(topChamps);
            allTimeMvpHtml = `
                <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px;">
                  ${avatarStack}
                  <div style="flex: 1; text-align: left;">
                    <div style="color: #FFD700; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">${champTitle}</div>
                    <div style="color: var(--text-main); font-size: 18px; font-weight: bold;">${champDisplayNames}</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="color: var(--text-muted); font-size: 11px;">Total Horns</div>
                    <div style="color: var(--accent); font-size: 20px; font-weight: bold;">${maxHorns}</div>
                  </div>
                </div>
            `;
        }

        let tableRows = '';
        allTimePlayers.forEach((p, idx) => {
            tableRows += `<tr>
                <td style="font-weight:bold; color:var(--text-muted);">${idx + 1}</td>
                <td>${formatCell(p.name)}</td>
                <td>${p.horns}</td>
                <td>${p.wins}</td>
                <td>${p.total > 0 ? p.total.toLocaleString() : '0'}</td>
            </tr>`;
        });

        contentHtml = `${allTimeMvpHtml}
            <div class="card-table-scroll">
               <table style="min-width: max-content; width: 100%; text-align:left;"><thead><tr>
                  <th>RANK</th><th>NAME</th><th>TOTAL HORNS</th><th>DAY WINS</th><th>TOTAL</th>
               </tr></thead><tbody>${tableRows}</tbody></table>
            </div>`;
    } else {
        const entry = historyObj[activeFilter];
        if (entry) {
            let archivedPlayers = Array.isArray(entry.players) ? entry.players : [];
            archivedPlayers.sort((a,b) => (b.total||0) - (a.total||0));
            let dStr = (entry && entry.date) ? entry.date : new Date(Number(activeFilter) || activeFilter).toLocaleDateString([], {month:'short', day:'numeric', year:'numeric'});
            let enemy = entry.enemyAlliance || { name: '[WWA] Whiteoutwarriors' };
            
            let champName = archivedPlayers.length > 0 ? archivedPlayers[0].name : 'N/A';
            let champScore = archivedPlayers.length > 0 ? archivedPlayers[0].total : 0;
            
            contentHtml = `
                <div style="background: linear-gradient(135deg, rgba(6,182,212,0.1) 0%, rgba(6,182,212,0.02) 100%); border: 1px solid rgba(6,182,212,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size:24px;">📅</div>
                    <div style="text-align: left;">
                      <div style="color: var(--accent); font-size: 11px; font-weight: bold; text-transform: uppercase;">Archived Event: ${dStr}</div>
                      <div style="color: var(--text-main); font-size: 16px; font-weight: bold;">Vs: ${escapeHTML(enemy.name || '[WWA] Whiteoutwarriors')}</div>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <div style="color: var(--text-muted); font-size: 11px;">Event Top Player</div>
                    <div style="color: #FFD700; font-size: 15px; font-weight: bold;">${escapeHTML(champName)} (${(champScore||0).toLocaleString()})</div>
                  </div>
                </div>
                <div class="card-table-scroll">
                   <table style="min-width: max-content; width: 100%; text-align:left;"><thead><tr>
                      <th>RANK</th><th>NAME</th><th>TOTAL SCORE</th><th>D1</th><th>D2</th><th>D3</th><th>D4</th><th>D5</th><th>D6</th>
                   </tr></thead><tbody>`;
            
            archivedPlayers.forEach((p, idx) => {
                contentHtml += `<tr>
                    <td style="font-weight:bold; color:var(--text-muted);">${idx + 1}</td>
                    <td>${formatCell(p.name)}</td>
                    <td style="font-weight:bold; color:var(--accent);">${(p.total||0).toLocaleString()}</td>
                    <td>${(p.d1||0) > 0 ? (p.d1||0).toLocaleString() : '-'}</td>
                    <td>${(p.d2||0) > 0 ? (p.d2||0).toLocaleString() : '-'}</td>
                    <td>${(p.d3||0) > 0 ? (p.d3||0).toLocaleString() : '-'}</td>
                    <td>${(p.d4||0) > 0 ? (p.d4||0).toLocaleString() : '-'}</td>
                    <td>${(p.d5||0) > 0 ? (p.d5||0).toLocaleString() : '-'}</td>
                    <td>${(p.d6||0) > 0 ? (p.d6||0).toLocaleString() : '-'}</td>
                </tr>`;
            });
            contentHtml += `</tbody></table></div>`;
        }
    }

    return `<div class="card" style="flex: 1 1 0px; min-width: 300px;">
      <div class="card-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
        <span>🏆 Showdown History & Archives</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:11px; color:var(--text-muted);">Event Filter:</span>
          <select id="sdHistoryFilter" style="padding:6px 12px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main); font-size:12px; font-weight:bold; cursor:pointer;" onchange="window.filterShowdownHistoryView(this.value)">
             ${optionsHtml}
          </select>
        </div>
      </div>
      <div id="sdHistoryContentArea">${contentHtml}</div>
    </div>`;
};

window.filterShowdownHistoryView = (selectedVal) => {
    window._sdHistoryState.activeFilter = selectedVal;
    const target = document.getElementById('sdHistoryContentArea');
    if (target) {
        let tempDiv = document.createElement('div');
        tempDiv.innerHTML = window.buildShowdownHistoryCardHtml(selectedVal);
        let newContent = tempDiv.querySelector('#sdHistoryContentArea');
        if (newContent) target.innerHTML = newContent.innerHTML;
    }
};

// Showdown Missed Days Report Modal
window.showMissedDaysReportModal = async (btnEl = null) => {
    let origHtml = '';
    if (btnEl) {
        origHtml = btnEl.innerHTML;
        btnEl.disabled = true;
        btnEl.innerHTML = '⏳ Loading...';
    }

    try {
        let sdRes = {};
        let rosterRawData = {};
        try {
            [sdRes, rosterRawData] = await Promise.all([
                window.fetchMergedShowdown(),
                window.fetchRoster().catch(() => ({}))
            ]);
        } catch(e) {
            console.error("Error fetching showdown data for missed report:", e);
        }

        const sdLiveData = (sdRes && sdRes.sdLiveData) || {};

        // 1. Build case-insensitive lookup for sdLiveData
        const sdLiveDataLowerMap = {};
        Object.entries(sdLiveData).forEach(([k, scores]) => {
            if (k && typeof k === 'string') {
                sdLiveDataLowerMap[k.trim().toLowerCase()] = scores;
            }
        });

        // 2. Extract unique player list deduplicated case-insensitively
        const seenPlayerNames = new Map();
        if (rosterRawData && Object.keys(rosterRawData).length > 0) {
            Object.values(rosterRawData).forEach(p => {
                if (p.name && typeof p.name === 'string') {
                    const cleanName = p.name.trim();
                    const lower = cleanName.toLowerCase();
                    if (cleanName && !seenPlayerNames.has(lower)) {
                        seenPlayerNames.set(lower, cleanName);
                    }
                }
            });
        }
        if (seenPlayerNames.size === 0) {
            Object.keys(sdLiveData).forEach(k => {
                if (k && typeof k === 'string') {
                    const cleanName = k.trim();
                    const lower = cleanName.toLowerCase();
                    if (cleanName && !seenPlayerNames.has(lower)) {
                        seenPlayerNames.set(lower, cleanName);
                    }
                }
            });
        }
        const allPlayers = Array.from(seenPlayerNames.values()).sort((a,b) => a.localeCompare(b));

        // 3. Determine active days (days with > 0 scores)
        const isDayActive = {};
        let maxActiveDay = 0;
        for (let d = 1; d <= 6; d++) {
            let dayHasScore = Object.values(sdLiveData).some(scores => scores && Number(scores['d'+d] || 0) > 0);
            isDayActive[d] = dayHasScore;
            if (dayHasScore) maxActiveDay = d;
        }
        if (maxActiveDay === 0) maxActiveDay = 1;

        const playerMissedMap = {};
        const dayMissedMap = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };

        allPlayers.forEach(pName => {
            const lowerName = pName.trim().toLowerCase();
            const scores = sdLiveDataLowerMap[lowerName] || {};
            const missedDays = [];
            for (let d = 1; d <= maxActiveDay; d++) {
                const score = Number(scores['d' + d] || 0);
                if (score === 0) {
                    missedDays.push(d);
                    dayMissedMap[d].push(pName);
                }
            }
            if (missedDays.length > 0) {
                playerMissedMap[pName] = missedDays;
            }
        });

        const playersWithMisses = Object.keys(playerMissedMap).sort((a,b) => playerMissedMap[b].length - playerMissedMap[a].length || a.localeCompare(b));

        let copyText = `📅 ALLIANCE SHOWDOWN MISSED DAYS REPORT (Active Days 1-${maxActiveDay})\n`;
        copyText += `----------------------------------------\n`;
        if (playersWithMisses.length === 0) {
            copyText += `🎉 Perfect Attendance! 0 players missed any active days!\n`;
        } else {
            playersWithMisses.forEach(pName => {
                const daysStr = playerMissedMap[pName].map(d => `Day ${d}`).join(', ');
                copyText += `• ${pName}: ${daysStr} (${playerMissedMap[pName].length} missed)\n`;
            });
        }
        copyText += `----------------------------------------\nTotal Players with Missed Days: ${playersWithMisses.length}`;

        const modal = document.createElement('div');
        modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); backdrop-filter:blur(6px); z-index:10002; display:flex; justify-content:center; align-items:center; animation:fadeIn 0.2s ease; padding:15px; box-sizing:border-box;';

        let dayCardsHtml = '';
        for (let d = 1; d <= 6; d++) {
            const active = d <= maxActiveDay;
            const missedList = Array.from(new Set(dayMissedMap[d] || []));
            if (!active) {
                dayCardsHtml += `
                    <div style="background:var(--bg-main); border:1px dashed var(--border); border-radius:10px; padding:12px 14px; opacity:0.8;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <span style="font-weight:bold; color:var(--text-muted); font-size:14px;">Day ${d}</span>
                            <span style="background:rgba(234,179,8,0.15); color:#eab308; border:1px solid rgba(234,179,8,0.3); font-size:11px; font-weight:bold; padding:2px 8px; border-radius:12px;">
                                ⏳ Pending
                            </span>
                        </div>
                        <div style="font-size:12px; color:var(--text-muted); font-style:italic;">Day not started yet</div>
                    </div>
                `;
            } else {
                dayCardsHtml += `
                    <div style="background:var(--bg-main); border:1px solid var(--border); border-radius:10px; padding:12px 14px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <span style="font-weight:bold; color:var(--text-main); font-size:14px;">Day ${d}</span>
                            <span style="background:${missedList.length > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}; color:${missedList.length > 0 ? '#ef4444' : '#10b981'}; border:1px solid ${missedList.length > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}; font-size:11px; font-weight:bold; padding:2px 8px; border-radius:12px;">
                                ${missedList.length > 0 ? `${missedList.length} Missed` : '✅ All Scored'}
                            </span>
                        </div>
                        ${missedList.length === 0 ? '<div style="font-size:12px; color:var(--text-muted); font-style:italic;">100% Participation</div>' : `
                            <div style="font-size:12px; color:var(--text-muted); max-height:80px; overflow-y:auto; line-height:1.4;">
                                ${missedList.map(name => `<div>• ${window.escapeHTML(name)}</div>`).join('')}
                            </div>
                        `}
                    </div>
                `;
            }
        }

        let playerRowsHtml = '';
        if (playersWithMisses.length === 0) {
            playerRowsHtml = `<tr><td colspan="3" style="padding:20px; text-align:center; color:var(--success); font-weight:bold;">🎉 100% Perfect Attendance! 0 players missed any active days.</td></tr>`;
        } else {
            playerRowsHtml = playersWithMisses.map(pName => {
                const missedDays = playerMissedMap[pName];
                const badges = missedDays.map(d => `<span style="background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.3); padding:2px 6px; border-radius:4px; font-size:11px; font-weight:bold;">Day ${d}</span>`).join(' ');
                return `
                    <tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:10px; font-weight:bold; color:var(--text-main);">${window.escapeHTML(pName)}</td>
                        <td style="padding:10px;">${badges}</td>
                        <td style="padding:10px; text-align:right; font-weight:bold; color:var(--danger);">${missedDays.length}</td>
                    </tr>
                `;
            }).join('');
        }

        modal.innerHTML = `
            <div style="background:var(--card-bg); border:1px solid var(--accent); border-radius:16px; width:100%; max-width:680px; max-height:90vh; display:flex; flex-direction:column; box-shadow:0 25px 60px rgba(0,0,0,0.8); overflow:hidden;">
                <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background:linear-gradient(135deg, rgba(239,68,68,0.1), transparent);">
                    <div>
                        <h3 style="margin:0; color:var(--text-main); font-size:18px; display:flex; align-items:center; gap:8px;">
                            📋 Showdown Missed Days Report
                        </h3>
                        <div style="font-size:12px; color:var(--text-muted); margin-top:2px;">Showing active Days 1 through ${maxActiveDay} (${playersWithMisses.length} player(s) missed scores)</div>
                    </div>
                    <button id="closeMissedReportX" style="background:none; border:none; color:var(--text-muted); font-size:24px; cursor:pointer; padding:0;">&times;</button>
                </div>

                <div style="padding:20px; overflow-y:auto; display:flex; flex-direction:column; gap:20px;">
                    <div>
                        <div style="font-size:13px; font-weight:bold; color:var(--text-muted); text-transform:uppercase; margin-bottom:10px;">📅 Daily Breakdown</div>
                        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px;">
                            ${dayCardsHtml}
                        </div>
                    </div>

                    <div>
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                            <div style="font-size:13px; font-weight:bold; color:var(--text-muted); text-transform:uppercase;">👤 Players with Missed Days (${playersWithMisses.length})</div>
                        </div>
                        <div style="max-height:260px; overflow-y:auto; border:1px solid var(--border); border-radius:10px; background:var(--bg-main);">
                            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
                                <thead>
                                    <tr style="border-bottom:1px solid var(--border); background:rgba(255,255,255,0.03); color:var(--text-muted); font-size:11px; text-transform:uppercase;">
                                        <th style="padding:10px;">Chief Name</th>
                                        <th style="padding:10px;">Missed Days</th>
                                        <th style="padding:10px; text-align:right;">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${playerRowsHtml}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div style="padding:15px 20px; border-top:1px solid var(--border); background:rgba(0,0,0,0.2); display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
                    <button id="copyMissedListBtn" style="background:var(--accent); color:#fff; border:none; padding:10px 18px; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer; display:flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(14,165,233,0.3);">
                        📋 Copy Missed List to Clipboard
                    </button>
                    <button id="closeMissedReportBtn" style="background:var(--bg-main); color:var(--text-main); border:1px solid var(--border); padding:10px 18px; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer;">
                        Close
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        const closeModal = () => modal.remove();
        modal.querySelector('#closeMissedReportX').addEventListener('click', closeModal);
        modal.querySelector('#closeMissedReportBtn').addEventListener('click', closeModal);

        modal.querySelector('#copyMissedListBtn').addEventListener('click', () => {
            const doCopy = (txt) => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(txt).then(() => {
                        if (window.showToast) window.showToast(`Copied Showdown Missed Days list to clipboard!`, 'success');
                    }).catch(() => fallbackCopy(txt));
                } else {
                    fallbackCopy(txt);
                }
            };
            const fallbackCopy = (txt) => {
                const ta = document.createElement('textarea');
                ta.value = txt;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                document.body.removeChild(ta);
                if (window.showToast) window.showToast(`Copied Showdown Missed Days list to clipboard!`, 'success');
            };
            doCopy(copyText);
        });
    } catch(err) {
        console.error("Error opening Showdown Missed Days Report:", err);
        if (window.showToast) window.showToast("Error opening report: " + err.message, "error");
    } finally {
        if (btnEl) {
            btnEl.disabled = false;
            btnEl.innerHTML = origHtml;
        }
    }
};

const getAutocompleteShield = () => {
    // We no longer return a physical shield div. Return a dummy object to prevent errors if existing code calls style.display on it
    return { style: {} };
};

function calculateAllTimeShowdown(historyData) {
    if (!historyData) return [];
    
    let allTimeStats = {};
    const staticHorns = { d1: 1, d2: 2, d3: 2, d4: 2, d5: 2, d6: 4 };

    function processEventPlayers(playersList, winnersObj = null) {
        if (!Array.isArray(playersList) || playersList.length === 0) return;
        let topPlayers = { d1:{names:[], score:0}, d2:{names:[], score:0}, d3:{names:[], score:0}, d4:{names:[], score:0}, d5:{names:[], score:0}, d6:{names:[], score:0} };

        playersList.forEach(p => {
            if (!p || typeof p !== 'object' || !p.name) return;
            for (let di = 1; di <= 6; di++) {
                let dScore = Number(p['d' + di]) || 0;
                if (dScore > 0) {
                    if (dScore > topPlayers['d' + di].score) {
                        topPlayers['d' + di] = { names: [p.name.trim().toLowerCase()], score: dScore };
                    } else if (dScore === topPlayers['d' + di].score) {
                        topPlayers['d' + di].names.push(p.name.trim().toLowerCase());
                    }
                }
            }
        });

        playersList.forEach(p => {
            if (!p || typeof p !== 'object' || !p.name) return;
            const rawName = p.name.trim();
            const key = rawName.toLowerCase();
            if (!allTimeStats[key]) {
                allTimeStats[key] = { name: rawName, horns: 0, wins: 0, total: 0 };
            }
            let pTotal = (Number(p.total) > 0) ? Number(p.total) : ((Number(p.d1)||0)+(Number(p.d2)||0)+(Number(p.d3)||0)+(Number(p.d4)||0)+(Number(p.d5)||0)+(Number(p.d6)||0));
            allTimeStats[key].total += pTotal;

            for (let i = 1; i <= 6; i++) {
                let dVal = Number(p['d'+i]) || 0;
                if (dVal <= 0) continue; // Must have a score > 0 to get horns

                let isWinner = false;
                
                // Explicit winners check
                if (winnersObj && winnersObj['d'+i] && String(winnersObj['d'+i]).trim().length > 0) {
                    let wStr = String(winnersObj['d'+i]).toLowerCase();
                    // Clean split for multiple winners (e.g. "Brian, John & Jane")
                    let wNames = wStr.split(/[,&/]| and /).map(s => s.trim()).filter(s => s);
                    if (wNames.includes(key)) {
                        isWinner = true;
                    } else {
                        // Word boundary regex for exact substring match
                        try {
                            let escKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            if (new RegExp(`(?:^|\\b|\\s|_)${escKey}(?:$|\\b|\\s|_)`, 'i').test(wStr)) {
                                isWinner = true;
                            }
                        } catch(e) {}
                    }
                } else {
                    // Fallback to highest scorer if explicit winner string is empty or missing
                    let topObj = topPlayers['d'+i];
                    if (topObj && topObj.score > 0 && dVal === topObj.score && topObj.names.includes(key)) {
                        isWinner = true;
                    }
                }

                if (isWinner) {
                    allTimeStats[key].horns += staticHorns['d'+i];
                    allTimeStats[key].wins += 1;
                }
            }
        });
    }

    // Handle object map of historical event blocks
    if (typeof historyData === 'object' && !Array.isArray(historyData) && !historyData.data) {
        Object.values(historyData).forEach(ev => {
            if (ev && typeof ev === 'object') {
                let plist = Array.isArray(ev.players) ? ev.players : (Array.isArray(ev.pList) ? ev.pList : []);
                processEventPlayers(plist, ev.winners);
            }
        });
    } else {
        let rows = historyData;
        if (typeof historyData === 'object' && historyData.data) rows = historyData.data;
        else if (typeof historyData === 'object' && !Array.isArray(historyData)) rows = Object.values(historyData);

        if (Array.isArray(rows)) {
            let currentEventPlayers = [];
            let currentEventWinners = null;
            let inPlayerBlock = false;

            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                if (!row) continue;
                if (!Array.isArray(row) && typeof row === 'object') {
                    if (row.players || row.pList) {
                        processEventPlayers(row.players || row.pList, row.winners);
                        continue;
                    }
                    row = Object.values(row);
                }
                if (!Array.isArray(row)) continue;

                let col1 = String(row[1] || '').trim();
                let col2 = String(row[2] || '').trim();

                if (col1.toLowerCase() === 'winners') {
                    currentEventWinners = {
                        d1: String(row[3] || ''), d2: String(row[4] || ''), d3: String(row[5] || ''),
                        d4: String(row[6] || ''), d5: String(row[7] || ''), d6: String(row[8] || '')
                    };
                }

                if (col1.toLowerCase() === 'ranking' && (col2.toLowerCase() === 'member' || col2.toLowerCase() === 'name')) {
                    if (inPlayerBlock && currentEventPlayers.length > 0) processEventPlayers(currentEventPlayers, currentEventWinners);
                    inPlayerBlock = true;
                    currentEventPlayers = [];
                    continue;
                }

                if (inPlayerBlock) {
                    if (!col2 || col1.toLowerCase() === 'date:' || col1.toLowerCase() === 'alliance' || col1.toLowerCase() === 'winners') {
                        if (currentEventPlayers.length > 0) processEventPlayers(currentEventPlayers, currentEventWinners);
                        inPlayerBlock = false;
                        currentEventPlayers = [];
                        if (col1.toLowerCase() !== 'winners') currentEventWinners = null;
                        continue;
                    }

                    let pName = col2;
                    let pd1 = Number(row[3]) || 0;
                    let pd2 = Number(row[4]) || 0;
                    let pd3 = Number(row[5]) || 0;
                    let pd4 = Number(row[6]) || 0;
                    let pd5 = Number(row[7]) || 0;
                    let pd6 = Number(row[8]) || 0;
                    let pTotal = Number(row[9]) || (pd1 + pd2 + pd3 + pd4 + pd5 + pd6);

                    currentEventPlayers.push({ name: pName, d1: pd1, d2: pd2, d3: pd3, d4: pd4, d5: pd5, d6: pd6, total: pTotal });
                }
            }
            if (inPlayerBlock && currentEventPlayers.length > 0) processEventPlayers(currentEventPlayers, currentEventWinners);
        }
    }

    let result = Object.values(allTimeStats);
    result.sort((a, b) => b.horns !== a.horns ? b.horns - a.horns : b.total - a.total);
    return result;
}

window.loadUserPersonalLog = async (chiefName) => {
    const cont = document.getElementById('userPersonalLogContainer');
    if (!cont) return;
    
    try {
        let userLogs = [];
        let nameLower = (chiefName || '').toLowerCase();
        
        try {
            const snap = await get(ref(db, 'admin_logs'));
            if (snap.exists()) {
                const allLogs = Object.values(snap.val() || {});
                userLogs = allLogs.filter(log => {
                    const t = (log.target || '').toLowerCase();
                    const d = (log.details || '').toLowerCase();
                    return t === nameLower || (nameLower && t.includes(nameLower)) || (nameLower && d.includes(nameLower));
                });
            }
        } catch(e) {
            console.warn("Firebase personal log query failed or denied", e);
        }
        
        if (userLogs.length === 0) {
            try {
                const token = await getAuthToken();
                const res = await fetch(`${API_BASE_URL}?api=getSheetData&sheetName=Admin Log&token=${encodeURIComponent(token)}`).then(r => r.json());
                if (res && res.success && res.data && res.data.length > 1) {
                    for (let i = 1; i < res.data.length; i++) {
                        let row = res.data[i];
                        if (row && row[2] && row[2].toString().toLowerCase() === nameLower) {
                            let d = new Date(row[0]);
                            userLogs.push({
                                id: 'sheets_' + i,
                                admin: row[1] || 'Admin',
                                action: 'Donation Recorded',
                                target: row[2],
                                details: `Added +${row[3] || 0} Bear Trap donation points (New Total: ${row[4] || 0})`,
                                timestamp: isNaN(d.getTime()) ? Date.now() : d.getTime(),
                                dateStr: isNaN(d.getTime()) ? 'Past Record' : d.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}),
                                timeStr: isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})
                            });
                        }
                    }
                }
            } catch(e) { console.error(e); }
        }

        // Filter ONLY for today's entries
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        
        const todaysLogs = userLogs.filter(log => {
            if (log.timestamp) {
                return log.timestamp >= todayStart;
            }
            if (log.dateStr) {
                const d = new Date(log.dateStr);
                return !isNaN(d.getTime()) && d.toDateString() === now.toDateString();
            }
            return false;
        });
        
        todaysLogs.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
        
        if (todaysLogs.length === 0) {
            cont.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:15px; background:rgba(255,255,255,0.02); border-radius:10px; font-size:13px;">No administrative activity logged for your account today.</div>`;
            return;
        }
        
        let html = `<div style="display:flex; flex-direction:column; gap:8px; max-height:240px; overflow-y:auto; padding-right:4px;">`;
        todaysLogs.forEach(log => {
            let icon = "📋";
            let actLower = (log.action || '').toLowerCase();
            if (actLower.includes('donation')) icon = "🥩";
            else if (actLower.includes('champion') || actLower.includes('crown')) icon = "👑";
            else if (actLower.includes('showdown') || actLower.includes('score')) icon = "🎯";
            else if (actLower.includes('role') || actLower.includes('staff')) icon = "🛡️";
            
            let timeDisp = log.timeStr || (log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : 'Today');
            
            html += `
              <div style="display:flex; align-items:center; gap:10px; padding:8px 12px; background:rgba(255,255,255,0.03); border:1px solid var(--border); border-radius:8px;">
                <div style="width:30px; height:30px; border-radius:50%; background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.3); display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0;">${icon}</div>
                <div style="flex:1; min-width:0;">
                  <div style="font-weight:bold; color:var(--text-main); font-size:13px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(log.action || 'Activity Recorded')}</div>
                  <div style="color:var(--text-muted); font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(log.details || '')} (by <span style="color:var(--accent); font-weight:bold;">${escapeHTML(log.admin || 'Admin')}</span>)</div>
                </div>
                <div style="font-size:11px; color:var(--text-muted); text-align:right; flex-shrink:0; white-space:nowrap;">${timeDisp}</div>
              </div>
            `;
        });
        html += `</div>`;
        cont.innerHTML = html;
    } catch(err) {
        cont.innerHTML = `<div style="text-align:center; color:var(--danger); padding:15px;">Failed to load personal logs.</div>`;
    }
};

// View renderers

function renderAvatarStack(playersList) {

    if (!playersList || playersList.length === 0) return '';
    if (playersList.length === 1) {
        let pName = typeof playersList[0] === 'string' ? playersList[0] : playersList[0].name;
        let champId = null;
        for (const [gid, name] of Object.entries(idToNameMap)) {
            if (name.toLowerCase() === pName.toLowerCase()) { champId = gid; break; }
        }
        const avatarSrc = (champId && avatarMap[champId]) ? avatarMap[champId] : `images/${pName}.png`;
        return `<div style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #FFD700; overflow: hidden; flex-shrink: 0; box-shadow: 0 0 10px rgba(255,215,0,0.2);">
            <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='images/default.png';">
          </div>`;
    }
    let displayList = playersList.slice(0, 3);
    let overflowCount = playersList.length - 3;
    let stackHtml = `<div style="display: flex; align-items: center; flex-shrink: 0;">`;
    displayList.forEach((p, idx) => {
        let pName = typeof p === 'string' ? p : p.name;
        let champId = null;
        for (const [gid, name] of Object.entries(idToNameMap)) {
            if (name.toLowerCase() === pName.toLowerCase()) { champId = gid; break; }
        }
        const avatarSrc = (champId && avatarMap[champId]) ? avatarMap[champId] : `images/${pName}.png`;
        let marginLeft = idx === 0 ? '0px' : '-14px';
        let zIndex = 10 - idx;
        stackHtml += `<div style="width: 42px; height: 42px; border-radius: 50%; border: 2px solid #FFD700; overflow: hidden; margin-left: ${marginLeft}; z-index: ${zIndex}; background: var(--card-bg); box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
            <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='images/default.png';">
          </div>`;
    });
    if (overflowCount > 0) {
        stackHtml += `<div style="width: 42px; height: 42px; border-radius: 50%; border: 2px solid #FFD700; background: rgba(255,215,0,0.2); color: #FFD700; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; margin-left: -14px; z-index: 1; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
            +${overflowCount}
          </div>`;
    }
    stackHtml += `</div>`;
    return stackHtml;
}

window.clearShowdownCaches = () => {
    if (window.liveData) {
        delete window.liveData['Showdown History'];
        delete window.liveData['Showdown'];
    }
    if (window.livePromises) {
        delete window.livePromises['Showdown History'];
        delete window.livePromises['Showdown'];
    }
    window.rosterCache = null;
};

const views = {
  staff: async () => {
    let r5Html = '';
    let r4Html = '';

    // Build the dynamic cards
    const allAdmins = { ...window.systemAdmins };
    
    // Ensure root admin is always in the list
    if (!allAdmins["318843189"]) {
      allAdmins["318843189"] = "R5";
    }
    
    // Add placeholder for Afu_D until she registers
    if (!allAdmins["338675830"]) {
      allAdmins["338675830"] = "R4";
    }

    Object.entries(allAdmins).forEach(([gid, level]) => {
      if (gid === "318843189") level = "R5"; 
      if (level === true) level = "R5"; // legacy fix

      let name = window.idToNameMap[gid] || 'Unknown Chief';
      if (gid === "338675830" && name === 'Unknown Chief') {
        name = 'Afu_D';
      }
      const isR5 = level === 'R5';
      const color = isR5 ? 'fbbf24' : '94a3b8';
      const title = isR5 ? 'R5 Leader' : 'R4 Officer';
      
      const avatarSrc = avatarMap && avatarMap[gid] 
          ? avatarMap[gid] 
          : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&size=128`;
          
      const profile = window.staffProfilesMap && window.staffProfilesMap[gid] ? window.staffProfilesMap[gid] : null;
      let tzHtml = profile && profile.timezone ? `<div class="staff-details-row"><span>Timezone:</span><span style="color:var(--text-main); font-weight:bold;">${window.escapeHTML(profile.timezone)}</span></div>` : '';
      let locHtml = profile && profile.location ? `<div class="staff-details-row"><span>Location:</span><span style="color:var(--text-main); font-weight:bold;">${window.escapeHTML(profile.location)}</span></div>` : '';
      let bioHtml = profile && profile.bio ? `<div class="staff-bio">"${window.escapeHTML(profile.bio)}"</div>` : '';
      
      let deptHtml = '';
      if (profile && profile.department) {
          const deptArray = profile.department.split(/\n|,/).map(d => d.trim()).filter(d => d.length > 0);
          if (deptArray.length > 0) {
              const tagsHtml = deptArray.map(d => `<span style="display:inline-block; background:rgba(6,182,212,0.15); color:var(--accent); border:1px solid rgba(6,182,212,0.3); padding:4px 10px; border-radius:12px; font-size:11px; font-weight:bold;">${window.escapeHTML(d)}</span>`).join('');
              deptHtml = `
              <div style="margin-top:12px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.05); text-align:left;">
                  <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:8px;">Managed Events & Roles</div>
                  <div style="display:flex; flex-wrap:wrap; gap:6px;">
                      ${tagsHtml}
                  </div>
              </div>`;
          }
      }
      
      const cardHtml = `
          <div class="staff-card rank-${level.toLowerCase()}" onclick="this.classList.toggle('flipped')">
            <img src="${avatarSrc}" alt="${level}" class="staff-avatar">
            <div class="staff-name">${name}</div>
            <div class="staff-role" style="font-weight:bold; letter-spacing:0.5px; color:var(--accent);">${title}</div>
            ${bioHtml}
            
            <div class="staff-details">
              <div class="staff-details-row">
                <span>In-Game ID:</span>
                <span style="color:var(--text-main); font-weight:bold;">${gid} <button class="copy-id-btn" onclick="event.stopPropagation(); navigator.clipboard.writeText('${gid}'); window.showToast('Copied ID!', 'success')">Copy</button></span>
              </div>
              ${locHtml}
              ${tzHtml}
              ${deptHtml}
            </div>
          </div>
      `;

      if (isR5) {
        r5Html += cardHtml;
      } else {
        r4Html += cardHtml;
      }
    });

    app.innerHTML = `
      <div class="card fade-in" style="background: transparent; border: none; box-shadow: none;">
        <div style="text-align:center; margin-bottom:40px;">
          <h2 class="staff-title">👑 Alliance Leadership</h2>
          <p class="staff-subtitle">Meet the dedicated team keeping the alliance strong.</p>
        </div>
        
        <div style="margin-bottom: 40px; display: flex; justify-content: center;">
          <div style="max-width: 350px; width: 100%;">
            ${r5Html}
          </div>
        </div>

        <div class="staff-grid">
          ${r4Html}
        </div>
      </div>
    `;
  },
  admin: async (initialTab) => {
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.style.display = 'block';
    const targetTab = initialTab || window._lastAdminTab || 'tab-tools';
    window._lastAdminTab = targetTab;

    window.refreshAdminUsers = async () => {
        if (window.showToast) window.showToast("Refreshing user database...", "info");
        const icon = document.getElementById('adminRefreshIcon');
        if (icon) icon.style.animation = 'spin 1s linear infinite';
        
        delete window.liveData["Chief's List"];
        delete window.livePromises["Chief's List"];
        if (window.liveListeners["Chief's List"]) {
            window.liveListeners["Chief's List"]();
            delete window.liveListeners["Chief's List"];
        }
        delete window.liveData["giftcodebot"];
        delete window.livePromises["giftcodebot"];
        if (window.liveListeners["giftcodebot"]) {
            window.liveListeners["giftcodebot"]();
            delete window.liveListeners["giftcodebot"];
        }
        await views.admin();
        
        // Ensure Users tab stays active
        setTimeout(() => {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
            const usersBtn = document.querySelector('[data-tab="tab-users"]');
            const usersTab = document.getElementById('tab-users');
            if (usersBtn) usersBtn.classList.add('active');
            if (usersTab) usersTab.style.display = 'block';
        }, 50);
        
        if (window.showToast) window.showToast("User database refreshed!", "success");
    };

    if (!window.isAdminUser(currentUser)) {
      views.home();
      return;
    }
    
    const isGoogleAuth = await window.isGoogleAuthVerified();
    if (!isGoogleAuth) {
      if (window.showToast) window.showToast("🔒 Mandatory Security: Google Sign-In is required to access the Admin Hub.", "error");
      views.home();
      return;
    }
    

    const isR5 = window.getAdminLevel(currentUser) === 'R5';
    
    try {
      const [usersSnap, rosterRawData] = await Promise.all([
        get(ref(db, 'users')),
        window.fetchRoster()
      ]);
      const users = usersSnap.val() || {};
      
      await refreshIdToNameMap();

      
      window.openBroadcastPushModal = function() {
          let existing = document.getElementById('broadcastPushModal');
          if (existing) existing.remove();

          const overlay = document.createElement('div');
          overlay.id = 'broadcastPushModal';
          overlay.style.cssText = `
              position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
              background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(6px);
              z-index: 99999; display: flex; justify-content: center; align-items: center;
              padding: 20px; box-sizing: border-box; animation: fadeIn 0.2s ease;
          `;

          overlay.innerHTML = `
              <div style="background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; width: 100%; max-width: 480px; padding: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.6); display: flex; flex-direction: column; gap: 15px; text-align: left;">
                  <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); padding-bottom: 12px;">
                      <h3 style="margin: 0; color: var(--accent); font-size: 18px; display: flex; align-items: center; gap: 8px;">
                          🚀 Broadcast Push Notification
                      </h3>
                      <button onclick="document.getElementById('broadcastPushModal').remove()" style="background: transparent; border: none; color: var(--text-muted); font-size: 20px; cursor: pointer; padding: 0;">✕</button>
                  </div>
                  
                  <p style="margin: 0; font-size: 12px; color: var(--text-muted);">Send an instant alert notification to all registered devices.</p>

                  <div>
                      <label style="font-size: 12px; font-weight: bold; color: var(--text-main); display: block; margin-bottom: 6px;">Notification Title</label>
                      <input type="text" id="adminPushTitle" placeholder="e.g. Bear Trap Starting in 5 Minutes!" style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: bold; box-sizing: border-box;">
                  </div>

                  <div>
                      <label style="font-size: 12px; font-weight: bold; color: var(--text-main); display: block; margin-bottom: 6px;">Message Body</label>
                      <textarea id="adminPushBody" placeholder="Enter message details..." style="width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); min-height: 90px; box-sizing: border-box;"></textarea>
                  </div>

                  <div id="adminPushStatus" style="font-size: 12px; font-weight: bold; text-align: center;"></div>

                  <div style="display: flex; gap: 10px; margin-top: 5px;">
                      <button onclick="document.getElementById('broadcastPushModal').remove()" style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-main); color: var(--text-main); font-weight: bold; cursor: pointer;">Cancel</button>
                      <button onclick="window.sendBroadcastPush()" style="flex: 1; padding: 12px; border-radius: 8px; border: none; background: var(--danger); color: #fff; font-weight: bold; cursor: pointer; box-shadow: 0 4px 12px rgba(239,68,68,0.3);">Send Alert 🚀</button>
                  </div>
              </div>
          `;

          document.body.appendChild(overlay);

          overlay.addEventListener('click', (e) => {
              if (e.target === overlay) overlay.remove();
          });
      };

      window.sendBroadcastPush = async () => {
        const title = document.getElementById('adminPushTitle').value.trim();
        const body = document.getElementById('adminPushBody').value.trim();
        const statusEl = document.getElementById('adminPushStatus');
        
        if (!title || !body) {
          statusEl.textContent = "Title and Body are required.";
          statusEl.style.color = "var(--danger)";
          return;
        }
        
        const confirmed = await window.customConfirm("Are you sure you want to broadcast this notification to all subscribed users?");
        if (!confirmed) return;
        
        statusEl.textContent = "Sending...";
        statusEl.style.color = "var(--text-muted)";
        
        try {
          const res = await fetch(API_BASE_URL, {
            method: 'POST',
            body: JSON.stringify({ api: 'sendPush', title: title, body: body, secret: APP_SECRET }),
            headers: { 'Content-Type': 'text/plain;charset=utf-8' }
          }).then(r => r.json());
          
          if (res.success) {
            statusEl.textContent = res.message;
            statusEl.style.color = "var(--success)";
            document.getElementById('adminPushTitle').value = "";
            document.getElementById('adminPushBody').value = "";
          } else {
            statusEl.textContent = "Error: " + res.message;
            statusEl.style.color = "var(--danger)";
          }
        } catch(e) {
          statusEl.textContent = "Network Error: " + e.message;
          statusEl.style.color = "var(--danger)";
        }
      };
      
      // System stats - ping Vercel proxy /api/stats
      window.refreshSystemStats = async () => {
        const statusEl = document.getElementById('sysStatStatus');
        const invEl = document.getElementById('sysStatInvocations');
        const latencyEl = document.getElementById('sysStatLatency');
        if (!statusEl) return;
        statusEl.textContent = '⏳';
        invEl.textContent = '—';
        latencyEl.textContent = '—';
        const t0 = Date.now();
        try {
          const res = await fetch(`${VERIFY_PROXY_URL.replace('/api/verify', '/api/stats')}`);
          const ms = Date.now() - t0;
          const data = await res.json();
          statusEl.textContent = '🟢';
          invEl.textContent = data.invocations ?? '—';
          latencyEl.innerHTML = `<span style="color:${ms < 500 ? 'var(--success)' : ms < 1500 ? 'var(--accent)' : 'var(--danger)'}">${ms}ms</span>`;
        } catch(e) {
          statusEl.textContent = '🔴';
          latencyEl.textContent = 'Offline';
        }
      };
      // Auto-run stats when System tab is clicked
      document.addEventListener('click', (e) => {
        if (e.target.dataset && e.target.dataset.tab === 'tab-system') {
          setTimeout(window.refreshSystemStats, 100);
        }
      });

      // Global function to fetch real-time Admin Logs from Firebase with fallback to Sheets API
      window.fetchAdminLog = async () => {
        const tb = document.getElementById('adminLogsTableBody');
        if (!tb) return;
        tb.innerHTML = `<tr><td colspan="5" style="padding:15px; text-align:center; color:var(--text-muted);">Loading Admin Activity Logs...</td></tr>`;
        
        let logItems = [];
        let fetchedFromFirebase = false;

        try {
          const logSnap = await get(ref(db, 'admin_logs'));
          if (logSnap.exists()) {
             let fbLogs = logSnap.val() || {};
             logItems = Object.values(fbLogs);
             fetchedFromFirebase = true;
          }
        } catch(e) {
          console.warn("Firebase admin_logs read failed or restricted, falling back to Sheets API", e);
        }

        // Fallback to Google Sheets API if Firebase returned empty or permission denied
        if (!fetchedFromFirebase || logItems.length === 0) {
           try {
             const logToken = await getAuthToken();
             const res = await fetch(API_BASE_URL + '?api=getSheetData&sheetName=Admin Log&token=' + encodeURIComponent(logToken)).then(r => r.json());
             if (res && res.success && res.data && res.data.length > 1) {
                for (let i = res.data.length - 1; i >= 1; i--) {
                   let row = res.data[i];
                   if (row && row[0]) {
                      let d = new Date(row[0]);
                      logItems.push({
                         id: 'sheets_' + i,
                         admin: row[1] || 'Admin',
                         action: 'Donation Recorded',
                         target: row[2] || '',
                         details: `Added ${row[3] || ''} donation points (New Total: ${row[4] !== undefined ? row[4] : ''})`,
                         timestamp: isNaN(d.getTime()) ? Date.now() : d.getTime(),
                         dateStr: isNaN(d.getTime()) ? 'Legacy Record' : d.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}),
                         timeStr: isNaN(d.getTime()) ? '' : d.toLocaleTimeString('en-US', {hour:'2-digit', minute:'2-digit'})
                      });
                   }
                }
             }
           } catch(e) {
             console.warn("Sheets API log fetch failed", e);
           }
        }

        logItems.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

        let tbodyHtml = '';
        let uniqueAdmins = new Set();
        
        logItems.forEach(log => {
           let adminName = log.admin || 'Admin';
           uniqueAdmins.add(adminName);
           let dateDisplay = log.dateStr ? `${log.dateStr} ${log.timeStr || ''}` : new Date(log.timestamp).toLocaleString();
           let actionBadge = `<span style="background:rgba(59,130,246,0.15); border:1px solid rgba(59,130,246,0.3); color:#60a5fa; padding:3px 8px; border-radius:12px; font-size:11px; font-weight:bold;">${escapeHTML(log.action || 'Admin Action')}</span>`;
           
           tbodyHtml += `
             <tr class="admin-log-row" data-admin="${adminName.toLowerCase()}" data-timestamp="${log.timestamp || 0}" style="border-bottom:1px solid var(--border);">
               <td style="padding:10px; font-size:12px; color:var(--text-muted); white-space:nowrap;">${dateDisplay}</td>
               <td style="padding:10px; font-weight:bold; color:var(--accent);">${escapeHTML(adminName)}</td>
               <td style="padding:10px;">${actionBadge}</td>
               <td style="padding:10px; font-weight:bold; color:var(--text-main);">${escapeHTML(log.target || '-')}</td>
               <td style="padding:10px; font-size:13px; color:var(--text-main);">${escapeHTML(log.details || '-')}</td>
             </tr>
           `;
        });

        if (tbodyHtml === '') tbodyHtml = `<tr><td colspan="5" style="padding:15px; text-align:center; color:var(--text-muted);">No admin logs recorded yet.</td></tr>`;
        tb.innerHTML = tbodyHtml;
        
        const adminSelect = document.getElementById('adminLogFilter');
        if (adminSelect) {
           const currentSelection = adminSelect.value;
           let selectHtml = '<option value="">All Admins</option>';
           Array.from(uniqueAdmins).sort().forEach(admin => {
              selectHtml += `<option value="${admin.toLowerCase()}">${escapeHTML(admin)}</option>`;
           });
           adminSelect.innerHTML = selectHtml;
           adminSelect.value = currentSelection;
        }
      };
      
      // Initial fetch
      window.fetchAdminLog();

      // Multi-menu Sub-Tab switching for Logs
      window.switchLogsSubtab = (subtabId) => {
        document.querySelectorAll('.logs-subtab-btn').forEach(btn => {
            if (btn.getAttribute('data-subtab') === subtabId) {
                btn.style.background = 'var(--accent)';
                btn.style.color = 'white';
                btn.style.border = 'none';
            } else {
                btn.style.background = 'var(--bg-card)';
                btn.style.color = 'var(--text-main)';
                btn.style.border = '1px solid var(--border)';
            }
        });
        document.querySelectorAll('.logs-subtab-content').forEach(c => c.style.display = 'none');
        const target = document.getElementById(subtabId);
        if (target) target.style.display = 'block';

        if (subtabId === 'subtab-activity-matrix' && !window._activityMatrixLoaded) {
            window.loadActivityMatrix();
        } else if (subtabId === 'subtab-activity-history' && !window._activityHistoryLoaded) {
            window.loadActivityHistory();
        }
      };

      window.openActivityMatrix = async () => {
          if (document.querySelector('.navbar')) document.querySelector('.navbar').style.display = 'flex';
          await views.admin('tab-logs');
          setTimeout(() => {
              const logsTabBtn = document.querySelector('.admin-tab-btn[data-tab="tab-logs"]');
              if (logsTabBtn) logsTabBtn.click();
              if (window.switchLogsSubtab) window.switchLogsSubtab('subtab-activity-matrix');
              if (window.loadActivityMatrix) window.loadActivityMatrix();
          }, 100);
      };

      // Fetch / Cache persistent player event stats from Firebase
      window.fetchPlayerEventStats = async () => {
        if (window._playerEventStatsCache) return window._playerEventStatsCache;
        try {
          const snap = await get(ref(db, 'player_event_stats'));
          if (snap && snap.exists()) {
            window._playerEventStatsCache = snap.val() || {};
          } else {
            window._playerEventStatsCache = {};
          }
        } catch(e) {
          console.warn("Firebase player_event_stats read error:", e);
          window._playerEventStatsCache = {};
        }
        return window._playerEventStatsCache;
      };

      // Archive current cycle & increment lifetime miss counters for missing players
      window.archiveAndResetEventCycle = async () => {
        const isManager = window.getAdminLevel(currentUser) === 'R5' || window.getAdminLevel(currentUser) === 'R4';
        if (!isManager) {
          if (window.showToast) window.showToast("Only R4/R5 managers can archive & reset event cycles", "error");
          return;
        }

        const confirmFirst = await window.customConfirm("🔄 Archive & Reset Event Cycle?\n\nThis will:\n1. Save a timestamped snapshot of current event attendance to archives.\n2. Increment lifetime miss counters for any player marked MISSING in this cycle.\n3. Reset event checkboxes for the next event round.\n\nProceed?");
        if (!confirmFirst) return;

        const confirmSecond = await window.customConfirm("⚠️ FINAL CONFIRMATION:\n\nAre you sure you want to reset current event statuses now?");
        if (!confirmSecond) return;

        if (window.showToast) window.showToast("Archiving current cycle and updating lifetime stats...", "info");

        try {
          const timestamp = Date.now();
          const dateStr = new Date(timestamp).toISOString().split('T')[0];
          const adminName = currentUser ? ((window.idToNameMap && window.idToNameMap[currentUser.gameId]) || currentUser.name || "Admin") : "Admin";

          // 1. Fetch current activity matrix list & stats
          await window.loadActivityMatrix();
          const matrixList = window._activityMatrixList || [];
          const statsObj = await window.fetchPlayerEventStats();

          // 2. Save snapshot to activity_history_archives
          const archivePayload = {
            timestamp: timestamp,
            dateStr: dateStr,
            archivedBy: adminName,
            matrix: matrixList
          };
          await set(ref(db, `activity_history_archives/${timestamp}`), archivePayload);

          // 3. Increment lifetime stats for missed events
          for (const p of matrixList) {
            if (!p.gameId) continue;
            const gIdStr = p.gameId.toString().trim();
            const pStats = statsObj[gIdStr] || {
              gameId: gIdStr,
              name: p.name,
              missedShowdown: 0,
              missedChampionship: 0,
              missedMercenary: 0,
              missedPolarTerrors: 0,
              missedBearTrap: 0,
              totalCyclesTracked: 0,
              totalMisses: 0
            };

            pStats.name = p.name;
            pStats.totalCyclesTracked = (pStats.totalCyclesTracked || 0) + 1;

            if (!p.perfAtt) pStats.missedShowdown = (pStats.missedShowdown || 0) + 1;
            if (!p.champ) pStats.missedChampionship = (pStats.missedChampionship || 0) + 1;
            if (!p.merc) pStats.missedMercenary = (pStats.missedMercenary || 0) + 1;
            if (!p.polar) pStats.missedPolarTerrors = (pStats.missedPolarTerrors || 0) + 1;
            if (!p.beartrap) pStats.missedBearTrap = (pStats.missedBearTrap || 0) + 1;

            pStats.totalMisses = (pStats.missedShowdown || 0) + (pStats.missedChampionship || 0) + (pStats.missedMercenary || 0) + (pStats.missedPolarTerrors || 0) + (pStats.missedBearTrap || 0);
            pStats.lastUpdated = timestamp;

            statsObj[gIdStr] = pStats;
          }

          // Write updated stats back to Firebase
          await set(ref(db, 'player_event_stats'), statsObj);
          window._playerEventStatsCache = statsObj;

          // 4. Reset activity_live for next cycle
          const resetObj = {};
          for (const p of matrixList) {
            if (p.gameId) {
              resetObj[p.gameId] = {
                name: p.name,
                perfectAttendance: false,
                championship: false,
                mercenary: false,
                polarTerrors: false,
                beartrap: false,
                voter: false,
                updatedAt: timestamp
              };
            }
          }
          await set(ref(db, 'activity_live'), resetObj);

          // 5. Clear caches & refresh matrix UI
          window.activityCache = null;
          window._activityMatrixLoaded = false;
          window._activityHistoryLoaded = false;

          if (window.logAdminAction) {
            window.logAdminAction("Archive & Reset Event Cycle", `Archived cycle ${dateStr} and updated lifetime miss counters for ${matrixList.length} members`);
          }

          if (window.showToast) window.showToast(`Successfully archived cycle & updated lifetime stats! 🎉`, "success");
          await window.loadActivityMatrix();
        } catch(err) {
          console.error("Archive & reset error:", err);
          if (window.showToast) window.showToast("Error archiving cycle: " + err.message, "error");
        }
      };

      // Load Activity Matrix Sub-Tab
      window.loadActivityMatrix = async () => {
        const tbody = document.getElementById('activityMatrixTableBody');
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="8" style="padding:20px; text-align:center; color:var(--text-muted);">Loading live Activity Matrix...</td></tr>`;
        
        try {
          const [actSnap, champSnap, mercSnap, btSnap, donSnap, rosterData, statsObj] = await Promise.all([
            get(ref(db, 'activity_live')).catch(() => null),
            get(ref(db, 'championship')).catch(() => null),
            get(ref(db, 'mercenary')).catch(() => null),
            get(ref(db, 'beartrap')).catch(() => null),
            get(ref(db, 'beartrap_donations')).catch(() => null),
            window.fetchRoster().catch(() => ({})),
            window.fetchPlayerEventStats().catch(() => ({}))
          ]);

          const actObj = (actSnap && actSnap.exists()) ? actSnap.val() : {};
          const champObj = (champSnap && champSnap.exists()) ? champSnap.val() : {};
          const mercObj = (mercSnap && mercSnap.exists()) ? mercSnap.val() : {};
          const btObj = (btSnap && btSnap.exists()) ? btSnap.val() : {};
          const donObj = (donSnap && donSnap.exists()) ? donSnap.val() : {};

          let playersList = [];
          if (rosterData) {
             Object.values(rosterData).forEach(p => {
                if (p.name && p.gameId) {
                   const gIdStr = p.gameId.toString().trim();
                   const actRec = actObj[gIdStr] || {};
                   const champRec = champObj[gIdStr] || {};
                   const mercRec = mercObj[gIdStr] || {};
                   const pStats = statsObj[gIdStr] || {};

                   const isTrue = (v) => v === true || v === 'true' || v === 'yes' || v === 'YES' || v === 1;

                   const donKey = p.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
                   const donRec = donObj[donKey] || {};
                   const btRec = btObj[gIdStr] || {};
                   const isBtActive = (donRec.current && donRec.current > 0) || isTrue(btRec.signedUp) || isTrue(actRec.beartrap);

                   const isPerf = actRec.perfectAttendance !== undefined ? isTrue(actRec.perfectAttendance) : false;
                   const isChamp = champRec.signedUp !== undefined ? isTrue(champRec.signedUp) : isTrue(actRec.championship);
                   const isMerc = mercRec.signedUp !== undefined ? isTrue(mercRec.signedUp) : isTrue(actRec.mercenary);
                   const isPolar = isTrue(actRec.polarTerrors);
                   const isVoter = isTrue(actRec.voter);

                   let currentMisses = 0;
                   if (!isPerf) currentMisses++;
                   if (!isChamp) currentMisses++;
                   if (!isMerc) currentMisses++;
                   if (!isPolar) currentMisses++;
                   if (!isBtActive) currentMisses++;

                   const lifetimeMisses = pStats.totalMisses || 0;

                   playersList.push({
                      gameId: gIdStr,
                      name: p.name,
                      perfAtt: isPerf,
                      champ: isChamp,
                      merc: isMerc,
                      polar: isPolar,
                      beartrap: isBtActive,
                      voter: isVoter,
                      currentMisses: currentMisses,
                      lifetimeMisses: lifetimeMisses,
                      stats: pStats
                   });
                }
             });
          }

          playersList.sort((a,b) => a.name.localeCompare(b.name));
          window._activityMatrixList = playersList;
          window._activityMatrixLoaded = true;
          window.renderActivityMatrixTable(playersList);
        } catch(e) {
          console.error(e);
          tbody.innerHTML = `<tr><td colspan="8" style="padding:20px; text-align:center; color:var(--danger);">Error loading Activity Matrix</td></tr>`;
        }
      };

      window.renderActivityMatrixTable = (list) => {
        const tbody = document.getElementById('activityMatrixTableBody');
        if (!tbody) return;
        if (!list || list.length === 0) {
          tbody.innerHTML = `<tr><td colspan="8" style="padding:20px; text-align:center; color:var(--text-muted);">No activity data found.</td></tr>`;
          return;
        }

        const isManager = window.getAdminLevel(currentUser) === 'R5' || window.getAdminLevel(currentUser) === 'R4';

        tbody.innerHTML = list.map(p => `
          <tr class="activity-matrix-row" data-name="${escapeHTML(p.name.toLowerCase())}" data-gid="${p.gameId}" style="border-bottom:1px solid var(--border);">
            <td style="padding:12px 14px; font-weight:bold; color:var(--text-main); font-size:14px;">${escapeHTML(p.name)}</td>

            <td style="padding:12px 14px; white-space:nowrap;">
              <span style="color:${p.currentMisses > 0 ? '#ef4444' : '#10b981'}; font-weight:bold; font-size:13px;">${p.currentMisses > 0 ? `⚠️ ${p.currentMisses} Missed` : '✅ All Done'}</span>
              <span style="color:var(--text-muted); font-size:11px; margin-left:6px;">(Total: ${p.lifetimeMisses})</span>
            </td>
            
            <td style="padding:12px 14px;">
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:${isManager ? 'pointer' : 'default'};">
                <input type="checkbox" ${p.perfAtt ? 'checked' : ''} ${isManager ? '' : 'disabled'} onchange="window.toggleActivityMatrixCell('${p.gameId}', 'perfectAttendance', this.checked)" style="width:18px; height:18px; accent-color:#f97316; cursor:${isManager ? 'pointer' : 'default'};">
                <span style="color:${p.perfAtt ? '#f97316' : 'var(--text-muted)'}; font-weight:bold; font-size:13px;">🔥 Perfect</span>
              </label>
            </td>

            <td style="padding:12px 14px;">
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:${isManager ? 'pointer' : 'default'};">
                <input type="checkbox" ${p.champ ? 'checked' : ''} ${isManager ? '' : 'disabled'} onchange="window.toggleActivityMatrixCell('${p.gameId}', 'championship', this.checked)" style="width:18px; height:18px; accent-color:#fbbf24; cursor:${isManager ? 'pointer' : 'default'};">
                <span style="color:${p.champ ? '#fbbf24' : 'var(--text-muted)'}; font-weight:bold; font-size:13px;">🏆 Championship</span>
              </label>
            </td>

            <td style="padding:12px 14px;">
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:${isManager ? 'pointer' : 'default'};">
                <input type="checkbox" ${p.merc ? 'checked' : ''} ${isManager ? '' : 'disabled'} onchange="window.toggleActivityMatrixCell('${p.gameId}', 'mercenary', this.checked)" style="width:18px; height:18px; accent-color:#ef4444; cursor:${isManager ? 'pointer' : 'default'};">
                <span style="color:${p.merc ? '#ef4444' : 'var(--text-muted)'}; font-weight:bold; font-size:13px;">⚔️ Mercenary</span>
              </label>
            </td>

            <td style="padding:12px 14px;">
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:${isManager ? 'pointer' : 'default'};">
                <input type="checkbox" ${p.polar ? 'checked' : ''} ${isManager ? '' : 'disabled'} onchange="window.toggleActivityMatrixCell('${p.gameId}', 'polarTerrors', this.checked)" style="width:18px; height:18px; accent-color:#38bdf8; cursor:${isManager ? 'pointer' : 'default'};">
                <span style="color:${p.polar ? '#38bdf8' : 'var(--text-muted)'}; font-weight:bold; font-size:13px;">🐻‍❄️ Polar</span>
              </label>
            </td>

            <td style="padding:12px 14px;">
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:${isManager ? 'pointer' : 'default'};">
                <input type="checkbox" ${p.beartrap ? 'checked' : ''} ${isManager ? '' : 'disabled'} onchange="window.toggleActivityMatrixCell('${p.gameId}', 'beartrap', this.checked)" style="width:18px; height:18px; accent-color:#10b981; cursor:${isManager ? 'pointer' : 'default'};">
                <span style="color:${p.beartrap ? '#10b981' : 'var(--text-muted)'}; font-weight:bold; font-size:13px;">🐻 Bear Trap</span>
              </label>
            </td>

            <td style="padding:12px 14px;">
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:${isManager ? 'pointer' : 'default'};">
                <input type="checkbox" ${p.voter ? 'checked' : ''} ${isManager ? '' : 'disabled'} onchange="window.toggleActivityMatrixCell('${p.gameId}', 'voter', this.checked)" style="width:18px; height:18px; accent-color:#a855f7; cursor:${isManager ? 'pointer' : 'default'};">
                <span style="color:${p.voter ? '#a855f7' : 'var(--text-muted)'}; font-weight:bold; font-size:13px;">🗳️ Voter</span>
              </label>
            </td>
          </tr>
        `).join('');
      };

      window.toggleActivityMatrixCell = async (gameId, key, isChecked) => {
        if (!gameId) return;
        const gIdStr = gameId.toString().trim();

        try {
          // Update activity_live node
          const snap = await get(ref(db, `activity_live/${gIdStr}`));
          const currentRec = (snap && snap.exists()) ? snap.val() : { name: (window.idToNameMap && window.idToNameMap[gIdStr]) || 'Chief' };
          currentRec[key] = isChecked;
          currentRec.updatedAt = Date.now();

          await set(ref(db, `activity_live/${gIdStr}`), currentRec);

          // If championship or mercenary event, sync with their primary nodes as well
          if (key === 'championship') {
            await window.toggleChampionshipStatus(gIdStr, isChecked);
          } else if (key === 'mercenary') {
            await window.toggleMercenaryStatus(gIdStr, isChecked);
          } else if (key === 'polarTerrors') {
            if (window.togglePolarTerrorsStatus) await window.togglePolarTerrorsStatus(gIdStr, isChecked);
          } else if (key === 'beartrap') {
            if (window.toggleBearTrapStatus) await window.toggleBearTrapStatus(gIdStr, isChecked);
          }

          if (window.showToast) window.showToast(`Updated event status to ${isChecked ? '✅ Yes' : '❌ No'}!`, "success");
        } catch(err) {
          console.error("Error toggling activity matrix cell:", err);
          if (window.showToast) window.showToast("Failed to update status", "error");
        }
      };

      window.filterActivityMatrix = () => {
        const q = (document.getElementById('activityMatrixSearch')?.value || '').toLowerCase().trim();
        document.querySelectorAll('.activity-matrix-row').forEach(row => {
            const name = row.getAttribute('data-name');
            row.style.display = (!q || name.includes(q)) ? '' : 'none';
        });
      };

      // Load Activity History Archives Sub-Tab with safe Google Sheets & Firebase fallbacks
      window.loadActivityHistory = async () => {
        const tbody = document.getElementById('activityHistoryTableBody');
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="4" style="padding:20px; text-align:center; color:var(--text-muted);">Loading Activity History...</td></tr>`;

        let logItems = [];

        // 1. Try Firebase admin_logs
        try {
          const logSnap = await get(ref(db, 'admin_logs'));
          if (logSnap && logSnap.exists()) {
             logItems = Object.values(logSnap.val() || {});
          }
        } catch(e) {
          console.warn("Firebase admin_logs read error:", e);
        }

        // 2. Fallback to Sheets API if logItems is empty
        if (logItems.length === 0) {
          try {
            const logToken = await getAuthToken();
            const res = await fetch(API_BASE_URL + '?api=getSheetData&sheetName=Admin Log&token=' + encodeURIComponent(logToken)).then(r => r.json());
            if (res && res.success && res.data && res.data.length > 1) {
              for (let i = res.data.length - 1; i >= 1; i--) {
                let row = res.data[i];
                if (row && row[0]) {
                  logItems.push({
                    id: 'sheets_' + i,
                    timestamp: new Date(row[0]).getTime() || Date.now(),
                    admin: row[1] || 'Admin',
                    category: row[2] || 'Action',
                    targetPlayer: row[3] || '',
                    details: row[4] || ''
                  });
                }
              }
            }
          } catch(err) {
            console.warn("Sheets API log fetch error:", err);
          }
        }

        // Filter activity & event logs
        let activityLogs = logItems.filter(l => {
            if (!l) return false;
            let cat = (l.category || l.action || l.details || '').toLowerCase();
            return cat.includes('event') || cat.includes('attendance') || cat.includes('championship') || cat.includes('beartrap') || cat.includes('showdown') || cat.includes('signup') || cat.includes('roster');
        });

        // If no specific event filter matches, display all logs so history is never blank
        if (activityLogs.length === 0 && logItems.length > 0) {
            activityLogs = logItems;
        }

        activityLogs.sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
        window._activityHistoryList = activityLogs;
        window._activityHistoryLoaded = true;

        if (activityLogs.length === 0) {
          tbody.innerHTML = `<tr><td colspan="4" style="padding:20px; text-align:center; color:var(--text-muted);">No activity logs found.</td></tr>`;
          return;
        }

        tbody.innerHTML = activityLogs.map(l => `
          <tr class="activity-history-row" data-text="${escapeHTML(((l.category||'') + ' ' + (l.admin||'') + ' ' + (l.targetPlayer||'') + ' ' + (l.details||'')).toLowerCase())}" style="border-bottom:1px solid var(--border);">
            <td style="padding:10px; font-weight:bold; color:var(--accent);">${escapeHTML(l.category || l.action || 'Event Log')}</td>
            <td style="padding:10px; font-weight:bold; color:var(--text-main);">${escapeHTML(l.targetPlayer || l.admin || 'All Members')}</td>
            <td style="padding:10px; color:var(--text-main);">${escapeHTML(l.details || '-')}</td>
            <td style="padding:10px; color:var(--text-muted); font-size:12px;">${l.timestamp ? new Date(l.timestamp).toLocaleString() : '-'}</td>
          </tr>
        `).join('');
      };

      window.filterActivityHistory = () => {
        const q = (document.getElementById('activityHistorySearch')?.value || '').toLowerCase().trim();
        document.querySelectorAll('.activity-history-row').forEach(row => {
            const text = row.getAttribute('data-text');
            row.style.display = (!q || text.includes(q)) ? '' : 'none';
        });
      };
      
      let html = `
        <div id="adminHubView" class="card" style="max-width:800px; margin:0 auto; animation: fadeIn 0.3s ease;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h2 style="color:var(--danger); margin:0;">🛡️ Admin Menu</h2>
          </div>
          
          <!-- Tab Navigation -->
          <div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid var(--border); padding-bottom:10px; overflow-x:auto; -webkit-overflow-scrolling:touch; scrollbar-width:none; white-space:nowrap;">
            <style>
              .admin-tab-btn { flex-shrink: 0; }
              /* Hide scrollbar for Chrome, Safari and Opera */
              div::-webkit-scrollbar { display: none; }
            </style>
            <button class="admin-tab-btn active" data-tab="tab-tools" style="background:none; border:none; color:var(--accent); font-weight:bold; font-size:16px; cursor:pointer; padding:5px 10px; border-bottom:2px solid var(--accent); flex-shrink:0;">🛠️ Daily Tools</button>
            <button class="admin-tab-btn" data-tab="tab-indev" style="background:none; border:none; color:var(--text-muted); font-weight:bold; font-size:16px; cursor:pointer; padding:5px 10px; border-bottom:2px solid transparent; flex-shrink:0;">🧪 In-Dev</button>
            ${currentUser && currentUser.gameId.toString() === '318843189' ? `<button class="admin-tab-btn" data-tab="tab-frost" style="background:none; border:none; color:var(--text-muted); font-weight:bold; font-size:16px; cursor:pointer; padding:5px 10px; border-bottom:2px solid transparent; flex-shrink:0;">❄️ Frost Clan</button>` : ''}
            ${isR5 ? `<button class="admin-tab-btn" data-tab="tab-users" style="background:none; border:none; color:var(--text-muted); font-weight:bold; font-size:16px; cursor:pointer; padding:5px 10px; border-bottom:2px solid transparent; flex-shrink:0;">👥 Users</button>
            <button class="admin-tab-btn" data-tab="tab-settings" style="background:none; border:none; color:var(--text-muted); font-weight:bold; font-size:16px; cursor:pointer; padding:5px 10px; border-bottom:2px solid transparent; flex-shrink:0;">⚙️ Settings</button>` : ''}
            <button class="admin-tab-btn" data-tab="tab-logs" style="background:none; border:none; color:var(--text-muted); font-weight:bold; font-size:16px; cursor:pointer; padding:5px 10px; border-bottom:2px solid transparent; flex-shrink:0;">📋 Logs</button>
            ${isR5 ? `<button class="admin-tab-btn" data-tab="tab-system" style="background:none; border:none; color:var(--text-muted); font-weight:bold; font-size:16px; cursor:pointer; padding:5px 10px; border-bottom:2px solid transparent; flex-shrink:0;">⚡ System</button>` : ''}
          </div>
          
          <!-- Tab 1: Daily Tools -->
          <div id="tab-tools" class="admin-tab-content" style="display:block;">
            <!-- Category 1: Active Alliance Events Tools -->
            <div style="background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid var(--accent); margin-bottom:20px;">
              <h3 style="margin:0 0 5px 0; color:var(--accent); text-align:left; font-size:16px;">⚔️ Active Alliance Events Tools</h3>
              <p style="margin:0 0 15px 0; font-size:12px; color:var(--text-muted); text-align:left;">Live event management, score tracking, and log recording.</p>
              
              <div style="display:flex; flex-direction:column; gap:12px; align-items:center;">
                <button onclick="views.beartrap()" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px; box-shadow:0 4px 12px rgba(16,185,129,0.3);">🐻 Bear Trap</button>
                <button onclick="views.showdownAdmin()" style="background:var(--accent); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px;">⚔️ ShowDown</button>
              </div>
            </div>

            <!-- Category 2: System & Roster Tools -->
            <div style="background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid var(--border); margin-bottom:20px;">
              <h3 style="margin:0 0 5px 0; color:var(--text-main); text-align:left; font-size:16px;">⚙️ System & Roster Tools</h3>
              <p style="margin:0 0 15px 0; font-size:12px; color:var(--text-muted); text-align:left;">Manage Chief names, Game IDs, push alerts, and master database sync.</p>
              
              <div style="display:flex; flex-direction:column; gap:12px; align-items:center;">
                <button onclick="views.playerEditor()" style="background:linear-gradient(135deg, #6366f1, #4f46e5); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px; box-shadow:0 4px 12px rgba(99,102,241,0.3);">👤 Open Player Database Editor</button>
                ${isR5 ? `<button onclick="window.openBroadcastPushModal()" style="background:linear-gradient(135deg, #ec4899, #be185d); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px; box-shadow:0 4px 12px rgba(236,72,153,0.3);">🚀 Broadcast Push Notification</button>` : ''}
                <button id="syncAllSheetsBtn" onclick="window.syncAllSheetsToFirebase()" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:320px; box-shadow:0 4px 12px rgba(16,185,129,0.3);">⚡ Master Sync Sheets ➔ Firebase</button>
              </div>
            </div>




          </div>

            <!-- Tab: In-Dev (Projects & Feature Lab) -->
          <div id="tab-indev" class="admin-tab-content" style="display:none;">
            <div style="background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid rgba(168,85,247,0.4); margin-bottom:20px;">
              <div style="display:flex; align-items:center; gap:12px; margin-bottom:15px;">
                <div style="width:40px; height:40px; border-radius:10px; background:rgba(168,85,247,0.15); display:flex; align-items:center; justify-content:center; font-size:20px; border:1px solid rgba(168,85,247,0.3);">🧪</div>
                <div style="text-align:left;">
                  <h3 style="margin:0; color:#c084fc; font-size:18px;">Projects & Feature Lab (In-Dev)</h3>
                  <p style="margin:2px 0 0 0; font-size:12px; color:var(--text-muted);">Private development workspace for upcoming features, experimental tools, and draft projects.</p>
                </div>
              </div>
              
              <div style="background:var(--card-bg); padding:20px; border-radius:12px; border:1px solid var(--border); text-align:center; display:flex; flex-direction:column; gap:15px; align-items:center;">
                <button onclick="views.championshipAdmin()" style="background:linear-gradient(135deg, #f59e0b, #d97706); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:300px; box-shadow:0 4px 12px rgba(217,119,6,0.3);">🏆 Alliance Championship</button>
                <button onclick="views.mercenaryAdmin()" style="background:linear-gradient(135deg, #ef4444, #dc2626); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:300px; box-shadow:0 4px 12px rgba(239,68,68,0.3);">⚔️ Mercenary Prestige</button>
                <button onclick="views.polarTerrorsAdmin()" style="background:linear-gradient(135deg, #0ea5e9, #0284c7); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px; width:100%; max-width:300px; box-shadow:0 4px 12px rgba(14,165,233,0.3);">🐻‍❄️ Polar Terrors Tracker</button>
              </div>
            </div>
          </div>
      `;
      
      if (isR5) {
          html += `
          <!-- Tab 2: Users -->
          <div id="tab-users" class="admin-tab-content" style="display:none;">
            <div style="display:flex; justify-content:flex-end; margin-bottom:10px;">
                <button onclick="window.refreshAdminUsers()" style="background:var(--accent); color:#fff; border:none; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:14px; display:flex; align-items:center; gap:5px;">
                    <span id="adminRefreshIcon">🔄</span> Refresh User List
                </button>
            </div>
              <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--accent); margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <h3 style="margin:0; color:var(--text-main);">Global Chief List Filter</h3>
                  <p style="margin:5px 0 0 0; font-size:12px; color:var(--text-muted);">Permanently hide unregistered users from the Player Lookup list for everyone.</p>
                </div>
                <button onclick="window.toggleRosterFilter()" style="background:${globalRosterRegisteredOnly ? 'var(--success)' : 'var(--bg-main)'}; color:${globalRosterRegisteredOnly ? '#fff' : 'var(--text-main)'}; border:1px solid ${globalRosterRegisteredOnly ? 'transparent' : 'var(--border)'}; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:bold; min-width:100px;">
                  ${globalRosterRegisteredOnly ? 'ON' : 'OFF'}
                </button>
              </div>
            <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--accent); margin-bottom:20px;">
              <div style="margin-bottom:15px;">
                <h3 style="margin:0; color:var(--accent);">👑 Staff Roles (Admins)</h3>
                <p style="margin:5px 0 0 0; font-size:12px; color:var(--text-muted);">List of players who currently have Admin Dashboard access. You can grant admin access directly from a player's profile card.</p>
              </div>
              <div id="adminStaffListContainer" style="display:flex; flex-direction:column; gap:8px;">
                 <!-- Rendered by window.renderStaffRoles -->
              </div>
            </div>
          
          <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--border);">
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; text-align:left;">
                <thead>
                  <tr style="border-bottom:2px solid var(--border); color:var(--text-muted);">
                    <th style="padding:10px;">Game ID</th>
                    <th style="padding:10px;">Chief Name</th>
                    <th style="padding:10px;">Email</th>
                    <th style="padding:10px;">Avatar</th>
                    <th style="padding:10px;">Actions</th>
                  </tr>
                </thead>
                <tbody>
      `;
      
      for (const [uid, u] of Object.entries(users)) {
        const cName = idToNameMap[u.gameId] || "Not Found";
        const hasAvatar = avatarMap[u.gameId] ? true : false;
        const avatarSrc = avatarMap[u.gameId] || `images/${cName}.png`;
        
        const hasAlts = (u.linkedGameIds && Array.isArray(u.linkedGameIds) && u.linkedGameIds.length > 0);
        
        let rosterInfoHtml = '';
        if (rosterRawData) {
            const p = Object.values(rosterRawData).find(rp => rp.name && rp.name.toLowerCase() === cName.toLowerCase());
            if (p) {
                let flVal = p.furnaceLevel;
                let gcVal = p.giftCodes;
                let taVal = p.timeActive;
                let isEnrolled = (gcVal === true || gcVal === 'TRUE' || (typeof gcVal === 'string' && gcVal.toLowerCase().trim() === 'true'));
                
                if (flVal) rosterInfoHtml += `<span style="background:rgba(255,255,255,0.1); border:1px solid var(--border); color:var(--text-main); padding:2px 6px; border-radius:10px; font-size:10px; margin-left:5px; display:inline-flex; align-items:center;">${window.getFurnaceIconHtml(flVal)}</span>`;
                if (isEnrolled) rosterInfoHtml += `<span style="background:rgba(16,185,129,0.1); color:var(--success); border:1px solid var(--success); padding:2px 6px; border-radius:10px; font-size:10px; margin-left:5px;">&#x2705; Enrolled</span>`;
                if (taVal) rosterInfoHtml += `<span style="background:rgba(255,255,255,0.1); border:1px solid var(--border); color:var(--text-main); padding:2px 6px; border-radius:10px; font-size:10px; margin-left:5px;">⏱️ ${taVal}</span>`;
            }
        }
        
        html += `
          <tr style="border-bottom:1px solid var(--border); background:var(--card-bg);">
            <td style="padding:10px; font-family:monospace; color:var(--accent); display:flex; align-items:center; gap:5px;">
              ${u.gameId}
            </td>
            <td style="padding:10px; font-weight:bold; color:var(--text-main);">
              <div style="display:flex; align-items:center; flex-wrap:wrap; gap:5px;">
                ${cName} 
                ${hasAlts ? `<span style="background:rgba(52,152,219,0.1); color:var(--accent); border:1px solid var(--accent); padding:2px 6px; border-radius:10px; font-size:10px; margin-left:5px;">${u.linkedGameIds.length} Alt(s)</span>` : ''}
                ${rosterInfoHtml}
              </div>
            </td>
            <td style="padding:10px; color:var(--text-muted); font-size:12px;">${u.email}</td>
            <td style="padding:10px;">
              <div style="width:30px; height:30px; border-radius:50%; overflow:hidden; background:var(--accent);">
                <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.style.display='none';">
              </div>
            </td>
            <td style="padding:10px; display:flex; gap:5px; flex-wrap:wrap;">
              ${hasAvatar ? `<button class="delete-avatar-btn" data-id="${u.gameId}" style="background:transparent; border:1px solid var(--danger); color:var(--danger); padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer;">Delete Avatar</button>` : ``}
              <button onclick="window.adminDeleteUserRow('${uid}', '${cName.replace(/'/g, "\\'")}')" style="background:transparent; border:1px solid var(--danger); color:var(--danger); padding:4px 8px; border-radius:4px; font-size:12px; cursor:pointer;">Delete Account</button>
            </td>
          </tr>
        `;
      }
      
      html += `</tbody></table></div></div>
          </div>
          `;
      }
      
      html += `
          <!-- Tab 3: Settings -->
          ${isR5 ? `
          <div id="tab-settings" class="admin-tab-content" style="display:none;">
            <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--danger); margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <h3 style="margin:0; color:var(--danger);">Maintenance Mode</h3>
                <p style="margin:5px 0 0 0; font-size:12px; color:var(--text-muted);">Lock out all non-admin users and display a maintenance screen.</p>
              </div>
              <button onclick="window.toggleMaintenance()" style="background:${maintenanceMode ? 'var(--bg-main)' : 'var(--danger)'}; color:${maintenanceMode ? 'var(--success)' : '#fff'}; border:1px solid ${maintenanceMode ? 'var(--success)' : 'transparent'}; padding:8px 16px; border-radius:6px; cursor:pointer; font-weight:bold; min-width:100px;">
                ${maintenanceMode ? '🟢 Turn OFF' : '🔴 Turn ON'}
              </button>
            </div>
            
            <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--accent); margin-bottom:20px; display:flex; justify-content:space-between; align-items:center;">
              <div>
                <h3 style="margin:0; color:var(--text-main);">Dev Mode (Track Deployment)</h3>
                <p style="margin:5px 0 0 0; font-size:12px; color:var(--text-muted);">When enabled, checks for active GitHub deployments and auto-refreshes the page.</p>
                <div id="github-deploy-status" style="margin-top:8px; font-weight:bold; font-size:13px; color:var(--text-muted);">
                  ⏳ Fetching status...
                </div>
              </div>
              <label style="position:relative; display:inline-block; width:40px; height:20px; flex-shrink:0;">
                <input type="checkbox" id="devModeToggleAdmin" style="opacity:0; width:0; height:0;">
                <span style="position:absolute; cursor:pointer; top:0; left:0; right:0; bottom:0; background-color:var(--border); transition:.4s; border-radius:20px;">
                  <span id="devModeSliderAdmin" style="position:absolute; content:''; height:14px; width:14px; left:3px; bottom:3px; background-color:white; transition:.4s; border-radius:50%;"></span>
                </span>
              </label>
            </div>
            
            <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--accent); margin-bottom:20px;">
              <h3 style="margin:0; color:var(--text-main); margin-bottom:10px;">🔄 Live Database Sync Status</h3>
              <p style="margin:0 0 15px 0; font-size:12px; color:var(--text-muted);">Shows the exact timestamp of when each master sheet was last pushed to Firebase.</p>
              <div id="adminSyncStatusList">
                 <div style="color:var(--text-muted); font-size:12px; text-align:center; padding:10px;">Loading sync data from Firebase...</div>
              </div>
            </div>
          </div>
          ` : ''}
          
          <!-- Tab 4: Logs -->
          <!-- System Status Tab (R5 only) -->
          ${isR5 ? `<div id="tab-system" class="admin-tab-content" style="display:none;">
            <div style="display:flex; flex-direction:column; gap:16px;">

              <!-- Proxy Status Card -->
              <div style="background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                  <h3 style="margin:0; color:var(--text-main);">⚡ Vercel Proxy Status</h3>
                  <button onclick="window.refreshSystemStats()" style="background:var(--accent); color:white; border:none; border-radius:6px; padding:6px 14px; cursor:pointer; font-weight:bold; font-size:12px;">🔄 Refresh</button>
                </div>
                <div id="systemStatsGrid" style="display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:16px;">
                  <div style="background:var(--card-bg); border-radius:10px; padding:16px; text-align:center; border:1px solid var(--border);">
                    <div id="sysStatStatus" style="font-size:28px;">⏳</div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:6px;">Proxy Status</div>
                  </div>
                  <div style="background:var(--card-bg); border-radius:10px; padding:16px; text-align:center; border:1px solid var(--border);">
                    <div id="sysStatInvocations" style="font-size:22px; font-weight:bold; color:var(--accent);">—</div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:6px;">Self-Tracked Requests</div>
                  </div>
                  <div style="background:var(--card-bg); border-radius:10px; padding:16px; text-align:center; border:1px solid var(--border);">
                    <div id="sysStatLatency" style="font-size:22px; font-weight:bold; color:var(--success);">—</div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:6px;">Response Time</div>
                  </div>
                </div>
                <p style="font-size:11px; color:var(--text-muted); margin:0; text-align:center;">⚠️ Self-tracked count resets on server cold start. For official totals, use the Vercel dashboard below.</p>
              </div>

              <!-- Direct Dashboard Link Card -->
              <div style="background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid var(--border);">
                <h3 style="margin:0 0 8px 0; color:var(--text-main);">📊 Official Usage Dashboard</h3>
                <p style="margin:0 0 16px 0; font-size:13px; color:var(--text-muted);">View official invocation counts, bandwidth, and monthly limits on Vercel.</p>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                  <a href="https://vercel.com/wosproxyid/~/usage" target="_blank" style="background:var(--accent); color:white; border:none; border-radius:8px; padding:12px 20px; cursor:pointer; font-weight:bold; font-size:14px; text-decoration:none; display:inline-flex; align-items:center; gap:8px;">⚡ Open Usage Dashboard</a>
                  <a href="https://vercel.com/wosproxyid/wos-vercel-proxy" target="_blank" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--border); border-radius:8px; padding:12px 20px; cursor:pointer; font-weight:bold; font-size:14px; text-decoration:none; display:inline-flex; align-items:center; gap:8px;">📁 Open Project</a>
                  <a href="https://vercel.com/wosproxyid/wos-vercel-proxy/logs" target="_blank" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--border); border-radius:8px; padding:12px 20px; cursor:pointer; font-weight:bold; font-size:14px; text-decoration:none; display:inline-flex; align-items:center; gap:8px;">📋 Live Logs</a>
                </div>
              </div>

            </div>
          </div>` : ''}

          <div id="tab-logs" class="admin-tab-content" style="display:none;">
            <!-- Multi-Menu Sub-Navigation Bar -->
            <div style="display:flex; gap:10px; margin-bottom:20px; border-bottom:1px solid var(--border); padding-bottom:12px; flex-wrap:wrap; align-items:center;">
              <button class="logs-subtab-btn active" data-subtab="subtab-admin-logs" onclick="window.switchLogsSubtab('subtab-admin-logs')" style="background:var(--accent); color:white; border:none; padding:8px 16px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:14px;">
                📋 Admin Action Logs
              </button>
              <button class="logs-subtab-btn" data-subtab="subtab-activity-matrix" onclick="window.switchLogsSubtab('subtab-activity-matrix')" style="background:var(--bg-card); color:var(--text-main); border:1px solid var(--border); padding:8px 16px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:14px;">
                📊 Member Activity Checklist
              </button>
              <button class="logs-subtab-btn" data-subtab="subtab-activity-history" onclick="window.switchLogsSubtab('subtab-activity-history')" style="background:var(--bg-card); color:var(--text-main); border:1px solid var(--border); padding:8px 16px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:14px;">
                📜 Activity History Archives
              </button>
            </div>

            <!-- Sub-Tab 1: Admin Action Logs -->
            <div id="subtab-admin-logs" class="logs-subtab-content" style="display:block;">
              <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--border); display:flex; flex-direction:column; gap:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                  <h3 style="margin:0; color:var(--text-main);">&#128203; Admin Action Audit Logs</h3>
                  <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button onclick="window.fetchAdminLog()" style="background:var(--accent); color:white; border:none; border-radius:6px; padding:8px 12px; cursor:pointer; font-weight:bold; font-size:12px;">&#128259; Refresh</button>
                    <select id="adminLogDateFilter" onchange="window.filterAdminLogs()" style="padding:8px 12px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="yesterday">Yesterday</option>
                      <option value="7days">Last 7 Days</option>
                    </select>
                    <select id="adminLogFilter" onchange="window.filterAdminLogs()" style="padding:8px 12px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
                      <option value="">All Admins</option>
                    </select>
                    <input type="text" id="adminLogSearch" placeholder="Search logs..." onkeyup="window.filterAdminLogs()" style="padding:8px 12px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main); width:180px;">
                  </div>
                </div>
                <div style="overflow-x:auto;">
                  <table style="width:100%; border-collapse:collapse; text-align:left;">
                    <thead>
                      <tr style="border-bottom:2px solid var(--border); color:var(--text-muted); font-size:12px; text-transform:uppercase;">
                        <th style="padding:10px;">Date & Time</th>
                        <th style="padding:10px;">Admin</th>
                        <th style="padding:10px;">Action Category</th>
                        <th style="padding:10px;">Target Player</th>
                        <th style="padding:10px;">Action Details</th>
                      </tr>
                    </thead>
                    <tbody id="adminLogsTableBody">
                      <tr><td colspan="5" style="padding:15px; text-align:center; color:var(--text-muted);">Loading logs from Firebase...</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Sub-Tab 2: Member Activity Checklist Matrix -->
            <div id="subtab-activity-matrix" class="logs-subtab-content" style="display:none;">
              <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--border); display:flex; flex-direction:column; gap:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                  <div>
                    <h3 style="margin:0; color:var(--text-main);">📊 Roster Event Activity Matrix</h3>
                    <p style="margin:4px 0 0 0; color:var(--text-muted); font-size:12px;">Live participation checklist across all alliance events & attendance.</p>
                  </div>
                  <div style="display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
                    <button onclick="window.clearAllEventCaches(); window._activityMatrixLoaded=false; window.loadActivityMatrix();" style="background:var(--accent); color:white; border:none; padding:8px 14px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px; display:flex; align-items:center; gap:6px;">🔄 Refresh Matrix</button>
                    <button onclick="window.archiveAndResetEventCycle()" style="background:linear-gradient(135deg, #ef4444, #dc2626); color:white; border:none; padding:8px 14px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px; box-shadow:0 2px 8px rgba(239,68,68,0.3); display:flex; align-items:center; gap:6px;">🔄 Archive & Reset Cycle</button>
                    <input type="text" id="activityMatrixSearch" placeholder="🔍 Search chief name..." onkeyup="window.filterActivityMatrix()" style="padding:8px 12px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main); width:200px;">
                  </div>
                </div>
                <div style="overflow-x:auto;">
                  <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
                    <thead>
                      <tr style="border-bottom:2px solid var(--border); color:var(--text-muted); font-size:11px; text-transform:uppercase;">
                        <th style="padding:10px;">Chief Name</th>
                        <th style="padding:10px;">Missed (Cycle / Total)</th>
                        <th style="padding:10px;">Perfect Attendance</th>
                        <th style="padding:10px;">Championship</th>
                        <th style="padding:10px;">Mercenary</th>
                        <th style="padding:10px;">Polar Terrors</th>
                        <th style="padding:10px;">Bear Trap</th>
                        <th style="padding:10px;">Voter</th>
                      </tr>
                    </thead>
                    <tbody id="activityMatrixTableBody">
                      <tr><td colspan="8" style="padding:20px; text-align:center; color:var(--text-muted);">Click tab to load activity matrix...</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Sub-Tab 3: Activity History Archives -->
            <div id="subtab-activity-history" class="logs-subtab-content" style="display:none;">
              <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--border); display:flex; flex-direction:column; gap:15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                  <div>
                    <h3 style="margin:0; color:var(--text-main);">📜 Event Activity History Archives</h3>
                    <p style="margin:4px 0 0 0; color:var(--text-muted); font-size:12px;">Historical event attendance logs & archived activity entries.</p>
                  </div>
                  <input type="text" id="activityHistorySearch" placeholder="🔍 Search history..." onkeyup="window.filterActivityHistory()" style="padding:8px 12px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main); width:220px;">
                </div>
                <div style="overflow-x:auto;">
                  <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
                    <thead>
                      <tr style="border-bottom:2px solid var(--border); color:var(--text-muted); font-size:11px; text-transform:uppercase;">
                        <th style="padding:10px;">Event Category</th>
                        <th style="padding:10px;">Target Chief</th>
                        <th style="padding:10px;">Participation Status</th>
                        <th style="padding:10px;">Recorded Timestamp</th>
                      </tr>
                    </thead>
                    <tbody id="activityHistoryTableBody">
                      <tr><td colspan="4" style="padding:20px; text-align:center; color:var(--text-muted);">Click tab to load history archives...</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Tab 6: Frost Clan -->
          <div id="tab-frost" class="admin-tab-content" style="display:none;">
            <div id="frostClanContainer" style="text-align:center;">
              <div style="margin:40px 0; color:var(--text-muted);">
                <div style="border:4px solid rgba(255,255,255,0.1); border-top-color:var(--accent); border-radius:50%; width:40px; height:40px; animation:spin 1s linear infinite; margin:0 auto 15px;"></div>
                Decrypting Frost Clan Data...
              </div>
            </div>
          </div>
        </div>`;
      app.innerHTML = html;
      if (window.renderStaffRoles) window.renderStaffRoles();
      
      // Bind Admin Tabs
      document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('.admin-tab-btn').forEach(b => {
            b.style.color = 'var(--text-muted)';
            b.style.borderBottomColor = 'transparent';
          });
          document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
          
          e.target.style.color = 'var(--accent)';
          e.target.style.borderBottomColor = 'var(--accent)';
          document.getElementById(e.target.getAttribute('data-tab')).style.display = 'block';
          
          if (e.target.getAttribute('data-tab') === 'tab-frost' && !window.frostDataLoaded) {
            window.loadFrostClanData();
          }
        });
      });

      // Automatically open requested targetTab (or default to tab-tools)
      setTimeout(() => {
          const targetTabBtn = document.querySelector(`.admin-tab-btn[data-tab="${targetTab}"]`);
          if (targetTabBtn) {
              targetTabBtn.click();
          } else {
              const defaultTabBtn = document.querySelector('.admin-tab-btn[data-tab="tab-tools"]');
              if (defaultTabBtn) defaultTabBtn.click();
          }
      }, 50);
      
      window.frostDataLoaded = false;
      window.frostState = { alts: [] };
      
      window.loadFrostClanData = async function() {
        const container = document.getElementById('frostClanContainer');
        if (!container) return;
        
        container.innerHTML = `
          <div style="margin:40px 0; color:var(--text-muted);">
            <div style="border:4px solid rgba(255,255,255,0.1); border-top-color:var(--accent); border-radius:50%; width:40px; height:40px; animation:spin 1s linear infinite; margin:0 auto 15px;"></div>
            Decrypting Frost Clan Data...
          </div>
        `;
        
        try {
          const adminToken = await auth.currentUser.getIdToken(true);
          const res = await fetch(`${API_BASE_URL}?api=getFrostData&token=${encodeURIComponent(adminToken)}`).then(r => r.json());
          
          if (res.error || !res.success) {
            container.innerHTML = `<div style="color:var(--danger); margin:40px 0;">❌ Error loading data: ${res.error || res.message || 'Unknown Error'}</div>`;
            return;
          }
          
          window.frostState.alts = res.alts || [];
          window.frostDataLoaded = true;
          window.renderFrostClan();
        } catch (err) {
          container.innerHTML = `<div style="color:var(--danger); margin:40px 0;">❌ Failed to load: ${err.message}</div>`;
        }
      };
      
      window.renderFrostClan = function() {
        const container = document.getElementById('frostClanContainer');
        if (!container) return;
        
        if (window.frostState.alts.length === 0) {
          container.innerHTML = `<div style="color:var(--text-muted); margin:40px 0;">No alt accounts found.</div>`;
          return;
        }
        
        let html = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid var(--border); padding-bottom:15px;">
            <div style="text-align:left;">
              <h2 style="margin:0; font-size:22px; color:var(--text-main);">Frost Clan Command Center</h2>
              <p style="margin:4px 0 0; color:var(--text-muted); font-size:13px;">Private Dashboard & Tracker</p>
            </div>
            <button onclick="window.resetFrostClan()" style="background:linear-gradient(135deg, #ef4444, #b91c1c); color:white; border:none; padding:10px 20px; border-radius:30px; font-weight:bold; cursor:pointer; font-size:14px; box-shadow:0 4px 15px rgba(239,68,68,0.3);">
              ⚠️ Reset Shields & Tomes
            </button>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:25px; text-align:left;">
        `;
        
        window.frostState.alts.forEach((alt, idx) => {
          html += `
            <div style="background:var(--bg-card, #1a0b2e); border:1px solid var(--border); border-radius:16px; padding:25px; box-shadow:0 10px 25px rgba(0,0,0,0.1); position:relative; overflow:hidden;">
              <div style="display:flex; align-items:center; gap:15px; border-bottom:1px solid var(--border); padding-bottom:15px; margin-bottom:20px;">
                <div style="width:50px; height:50px; border-radius:12px; background:linear-gradient(135deg, var(--accent), #8b5cf6); overflow:hidden; display:flex; align-items:center; justify-content:center; color:white; font-weight:800; font-size:24px;">
                  <img src="images/${encodeURIComponent(alt.name)}.png" alt="${alt.name}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.parentElement.innerHTML='${alt.name.charAt(0).toUpperCase()}';">
                </div>
                <div>
                  <h2 style="margin:0; font-size:22px; font-weight:700;">${alt.name}</h2>
                  <div style="color:var(--text-muted); font-size:12px; margin-top:2px;">Frost Clan Member</div>
                </div>
              </div>
              
              <div style="font-size:13px; color:var(--text-muted); margin-bottom:10px; font-weight:600;">Main Alliance Tracked</div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:20px;">
                <div style="background:rgba(15,23,42,0.5); border:1px solid var(--border); border-radius:12px; padding:12px; text-align:center;">
                  <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:600; margin-bottom:8px;">Championship</div>
                  <div style="font-size:22px;">${alt.champ ? '✅' : '❌'}</div>
                </div>
                <div style="background:rgba(15,23,42,0.5); border:1px solid var(--border); border-radius:12px; padding:12px; text-align:center;">
                  <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:600; margin-bottom:8px;">Mercenary</div>
                  <div style="font-size:22px;">${alt.merc ? '✅' : '❌'}</div>
                </div>
                <div style="background:rgba(15,23,42,0.5); border:1px solid var(--border); border-radius:12px; padding:12px; text-align:center; grid-column:1 / -1;">
                  <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:600; margin-bottom:8px;">Polar Terrors</div>
                  <div style="font-size:22px;">${alt.polar ? '✅' : '❌'}</div>
                </div>
              </div>
              
              <div style="font-size:13px; color:var(--accent); margin-bottom:10px; font-weight:600;">Click to Update</div>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
                <div style="background:rgba(15,23,42,0.5); border:1px solid rgba(56, 189, 248, 0.3); border-radius:12px; padding:12px; text-align:center; cursor:pointer; transition:transform 0.1s;" onclick="window.toggleFrostCheckbox(${idx}, 'shields')" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                  <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:600; margin-bottom:8px;">🛡️ Shields</div>
                  <div id="val_${idx}_shields" style="font-size:22px; user-select:none;">${alt.shields ? '✅' : '❌'}</div>
                </div>
                <div style="background:rgba(15,23,42,0.5); border:1px solid rgba(56, 189, 248, 0.3); border-radius:12px; padding:12px; text-align:center; cursor:pointer; transition:transform 0.1s;" onclick="window.toggleFrostCheckbox(${idx}, 'rebirth')" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                  <div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; font-weight:600; margin-bottom:8px;">📖 Rebirth Tomes</div>
                  <div id="val_${idx}_rebirth" style="font-size:22px; user-select:none;">${alt.rebirth ? '✅' : '❌'}</div>
                </div>
              </div>
            </div>
          `;
        });
        
        html += `</div>`;
        container.innerHTML = html;
      };
      
      window.toggleFrostCheckbox = async function(idx, field) {
        const alt = window.frostState.alts[idx];
        const newVal = !alt[field];
        alt[field] = newVal; // Optimistic update
        
        const el = document.getElementById(`val_${idx}_${field}`);
        if (el) el.textContent = newVal ? '✅' : '❌';
        
        try {
          const adminToken = await auth.currentUser.getIdToken(true);
          const res = await fetch(`${API_BASE_URL}?api=updateFrost&row=${alt.row}&field=${field}&value=${newVal}&token=${encodeURIComponent(adminToken)}`).then(r => r.json());
          
          if (!res.success) {
            window.showToast("Failed to save!", "error");
            alt[field] = !newVal; // Revert
            if (el) el.textContent = alt[field] ? '✅' : '❌';
          }
        } catch (e) {
          window.showToast("Network error!", "error");
          alt[field] = !newVal; // Revert
          if (el) el.textContent = alt[field] ? '✅' : '❌';
        }
      };
      
      window.resetFrostClan = async function() {
        const confirmed = await window.customConfirm("Are you sure you want to uncheck all Shields and Rebirth Tomes for Frost Clan?");
        if (!confirmed) return;
        
        window.frostState.alts.forEach((alt, idx) => {
          alt.shields = false;
          alt.rebirth = false;
          let elS = document.getElementById(`val_${idx}_shields`);
          let elR = document.getElementById(`val_${idx}_rebirth`);
          if(elS) elS.textContent = '❌';
          if(elR) elR.textContent = '❌';
        });
        
        window.showToast("Resetting...");
        try {
          const adminToken = await auth.currentUser.getIdToken(true);
          const res = await fetch(`${API_BASE_URL}?api=resetFrost&token=${encodeURIComponent(adminToken)}`).then(r => r.json());
          
          if (res.success) {
            window.showToast("✅ Reset successful!", "success");
          } else {
            window.showToast("Reset failed.", "error");
            window.loadFrostClanData(); // Reload from server
          }
        } catch (e) {
          window.showToast("Network error!", "error");
          window.loadFrostClanData();
        }
      };
      
      // Listen to Live Sync Status
      const syncStatusDiv = document.getElementById('adminSyncStatusList');
      if (syncStatusDiv) {
        if (window.adminSyncListener) window.adminSyncListener();
        window.adminSyncListener = onValue(ref(db, 'system/lastSync'), (snap) => {
          const data = snap.val() || {};
          let todayStr = new Date().toDateString();
          let filteredKeys = Object.keys(data).filter(sheet => new Date(data[sheet]).toDateString() === todayStr);
          let html = filteredKeys.sort().map(sheet => {
            let timeStr = new Date(data[sheet]).toLocaleString();
            return `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border);">
              <span style="color:var(--text-main); font-weight:bold;">${sheet}</span>
              <span style="color:var(--success); font-size:12px; font-weight:bold;">${timeStr}</span>
            </div>`;
          }).join('');
          if (html === '') html = '<div style="color:var(--text-muted); font-size:12px; text-align:center; padding:10px;">No sync data available for today yet.</div>';
          syncStatusDiv.innerHTML = html;
        });
      }
      
      // Bind Dev Mode toggle in Admin Panel
      const devModeToggleAdmin = document.getElementById('devModeToggleAdmin');
      const devModeSliderAdmin = document.getElementById('devModeSliderAdmin');
      if (devModeToggleAdmin) {
        const isDevMode = localStorage.getItem('devMode') === 'true';
        devModeToggleAdmin.checked = isDevMode;
        if (isDevMode && devModeSliderAdmin) {
          devModeSliderAdmin.style.transform = 'translateX(20px)';
        }
        
        devModeToggleAdmin.addEventListener('change', (e) => {
          const enabled = e.target.checked;
          localStorage.setItem('devMode', enabled);
          if (devModeSliderAdmin) {
            devModeSliderAdmin.style.transform = enabled ? 'translateX(20px)' : 'translateX(0)';
          }
          
          if (enabled) {
            checkDeploymentStatus();
            if (devModePollingInterval) clearInterval(devModePollingInterval);
            devModePollingInterval = setInterval(checkDeploymentStatus, 60000);
          } else {
            if (devModePollingInterval) clearInterval(devModePollingInterval);
            const banner = document.getElementById('devDeployBanner');
            if (banner) banner.style.display = 'none';
          }
        });
      }
      
      // Bind delete avatar buttons
      document.querySelectorAll('.delete-avatar-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const confirmed = await window.customConfirm("Are you sure you want to delete this avatar?");
          if (!confirmed) return;
          
          const gid = e.target.getAttribute('data-id');
          try {
            e.target.textContent = "Deleting...";
            await deleteAvatar(gid);
            views.admin(); // Refresh view
          } catch(err) {
             window.showToast(err.message, "error");
          }
        });
      });
      
      window.filterAdminLogs = () => {
         const search = document.getElementById('adminLogSearch').value.toLowerCase();
         const adminFilter = document.getElementById('adminLogFilter').value.toLowerCase();
         const dateFilter = document.getElementById('adminLogDateFilter').value;
         
         const now = new Date();
         const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
         const yesterdayStart = todayStart - (24 * 60 * 60 * 1000);
         const sevenDaysStart = todayStart - (7 * 24 * 60 * 60 * 1000);
         
         document.querySelectorAll('.admin-log-row').forEach(row => {
            const matchesSearch = row.innerText.toLowerCase().includes(search);
            const matchesAdmin = adminFilter === '' || row.getAttribute('data-admin') === adminFilter;
            
            let matchesDate = true;
            const rowTime = parseInt(row.getAttribute('data-timestamp') || '0', 10);
            
            if (dateFilter === 'today') {
               matchesDate = rowTime >= todayStart;
            } else if (dateFilter === 'yesterday') {
               matchesDate = rowTime >= yesterdayStart && rowTime < todayStart;
            } else if (dateFilter === '7days') {
               matchesDate = rowTime >= sevenDaysStart;
            }
            
            if (matchesSearch && matchesAdmin && matchesDate) {
               row.style.display = '';
            } else {
               row.style.display = 'none';
            }
         });
      };
      
    } catch(err) {
      renderError(err.message);
    }
  },
  
  showdownAdmin: async () => {
    const app = document.getElementById('app');
    if (!app) return;
    
    const isManager = window.getAdminLevel(currentUser) === 'R5' || window.getAdminLevel(currentUser) === 'R4';
    if (!isManager) {
       if(window.showToast) window.showToast("Only R4/R5 managers can edit Showdown data", "error");
       return;
    }
    
    renderLoading("Loading Showdown Admin...");
    
    if (document.querySelector('.navbar')) {
        document.querySelector('.navbar').style.display = 'none';
    }
    
    try {
       const [sdRes, metaSnap, rosterRawData] = await Promise.all([
          window.fetchMergedShowdown(),
          get(ref(db, 'showdown_meta')),
          window.fetchRoster().catch(() => ({}))
       ]);
       
       let meta = (metaSnap && metaSnap.exists() && metaSnap.val()) ? metaSnap.val() : {};
       if (!meta.enemyAlliance || typeof meta.enemyAlliance !== 'object') meta.enemyAlliance = { name: "[WWA] Whiteoutwarriors", scores: { d1:0, d2:0, d3:0, d4:0, d5:0, d6:0 } };
       if (!meta.enemyAlliance.scores || typeof meta.enemyAlliance.scores !== 'object') meta.enemyAlliance.scores = { d1:0, d2:0, d3:0, d4:0, d5:0, d6:0 };
       
       const sdLiveData = sdRes.sdLiveData || {};
       
       let allPlayers = [];
       if (rosterRawData) { Object.values(rosterRawData).forEach(p => { if (p.name) allPlayers.push(p.name); }); }
       if (allPlayers.length === 0) allPlayers = Object.keys(sdLiveData);
       allPlayers = [...new Set(allPlayers)];
       
       let allianceTotals = {d1:0, d2:0, d3:0, d4:0, d5:0, d6:0};
       let winners = {d1:{name:'', score:0}, d2:{name:'', score:0}, d3:{name:'', score:0}, d4:{name:'', score:0}, d5:{name:'', score:0}, d6:{name:'', score:0}};
       
       Object.entries(sdLiveData).forEach(([playerName, scores]) => {
          if (!scores || typeof scores !== 'object') return;
          for (let i = 1; i <= 6; i++) {
              let score = scores['d'+i] || 0;
              allianceTotals['d'+i] += score;
              if (score > winners['d'+i].score) {
                  winners['d'+i] = { name: playerName, score: score };
              }
          }
       });
       
       const staticHorns = { d1: 1, d2: 2, d3: 2, d4: 2, d5: 2, d6: 4 };
       
       let html = `<div style="display:flex; flex-direction:column; gap:20px; max-width:800px; margin:0 auto; padding-bottom:40px; animation: fadeIn 0.3s ease; position:relative;">
         <button onclick="if(document.querySelector('.navbar')) document.querySelector('.navbar').style.display='flex'; views.admin()" style="position:absolute; top:0px; right:0px; background:var(--bg-main); border:1px solid var(--border); color:var(--text-main); padding:5px 12px; border-radius:6px; cursor:pointer; z-index:10;">&times; Close</button>
         
         <div class="card" style="margin-top:40px;">
           <div class="card-title" style="text-align:center; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
              <span>⚔️ Showdown Data Entry</span>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                 <button onclick="window.openShowdownArchiveVaultModal()" style="background:linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.05) 100%); color:var(--accent); border:1px solid rgba(6,182,212,0.4); padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold; display:flex; align-items:center; gap:4px;">📜 Open Vault</button>
                 <button onclick="window.openShowdownPasteImporterModal()" style="background:rgba(255,215,0,0.18); border:1px solid rgba(255,215,0,0.5); color:#FFD700; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold; display:flex; align-items:center; gap:4px;">📋 Quick Paste Scores</button>
                  <button onclick="window.showMissedDaysReportModal(this)" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--accent); padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold; display:flex; align-items:center; gap:4px;">📋 Missed Days Report</button>
                 <button onclick="window.archiveCurrentShowdownToFirebase()" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--success); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px;">📁 Archive to History</button>
                 <button onclick="window.syncGoogleSheetsHistoryToVault(this)" style="background:var(--accent); color:var(--bg-main); border:none; padding:4px 8px; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer; box-shadow:0 2px 8px rgba(6,182,212,0.2);">⚡ Sync All Sheets History</button>
                 <button onclick="window.restoreLatestShowdownArchive()" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--accent); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px;">↩️ Restore Choice</button>
                 <button onclick="window.resetCurrentShowdown()" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--danger); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px;">🔄 Reset Event</button>
                 <button onclick="window.deleteAllShowdownArchives()" style="background:rgba(239,68,68,0.15); color:#ef4444; border:1px solid rgba(239,68,68,0.3); padding:4px 8px; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer;">🗑️ Wipe All Archives</button>
               </div>
           </div>
           <div style="background:rgba(255,255,255,0.02); padding:15px; border-radius:8px; border:1px solid var(--border); margin-bottom:10px;">
             <label style="display:block; margin-bottom:5px; font-weight:bold; color:var(--text-main);">Select Player</label>
             <select id="sdPlayerSelect" style="width:100%; padding:12px; border-radius:6px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:16px; margin-bottom:15px;" onchange="window.onSdPlayerSelect()">
               <option value="">-- Choose a Player --</option>`;
               
       allPlayers.sort((a,b) => a.localeCompare(b)).forEach(p => {
          html += `<option value="${escapeHTML(p)}">${escapeHTML(p)}</option>`;
       });
               
html += `</select>
             
             <div id="sdEntryFields" style="display:none; flex-direction:column; gap:10px;">
               ${[1,2,3,4,5,6].map(d => `
                  <div style="display:flex; align-items:center; gap:10px;">
                    <span style="width:50px; font-weight:bold; color:var(--text-muted);">Day ${d}</span>
                    <input type="number" id="sd_d${d}" placeholder="Score" style="flex:1; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main);">
                    <button id="sd_d${d}_lock" onclick="window.toggleSdLock(${d})" style="display:none; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#ef4444; padding:6px 10px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:bold; min-width:80px;" title="Click to unlock & edit">🔒 Locked</button>
                  </div>
               `).join('')}
               
               <button onclick="window.saveShowdownEntry()" style="background:var(--success); color:white; border:none; padding:12px; border-radius:6px; font-weight:bold; font-size:16px; margin-top:10px; cursor:pointer;">💾 Save Scores</button>
             </div>
           </div>
         </div>
         
         <div class="card">
           <h2 style="color:var(--accent); margin-top:0;">⚙️ Enemy Alliance Settings</h2>
           <p style="color:var(--text-muted); font-size:14px;">Event goals are set to <b>3,333,333</b> daily (20M total). Horns, Winners, and Alliance Totals are automatically calculated.</p>
           
           <div style="margin-bottom:20px;">
             <label style="font-weight:bold; color:var(--text-main); display:block; margin-bottom:5px;">Enemy Alliance Name</label>
             <input type="text" id="metaEnemyName" value="${meta.enemyAlliance.name || ''}" style="width:100%; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); box-sizing:border-box;">
           </div>
           
           <div style="background:var(--bg-main); padding:15px; border-radius:8px; border:1px solid var(--border); margin-bottom:20px; overflow-x:auto;">
             <table style="width:100%; border-collapse:collapse; text-align:left; min-width:600px;">
               <thead>
                 <tr style="border-bottom:1px solid var(--border);">
                   <th style="padding:8px 5px; color:var(--text-muted);">Day</th>
                   <th style="padding:8px 5px; color:var(--text-muted);">Alliance Total</th>
                   <th style="padding:8px 5px; color:var(--text-muted);">Enemy Score</th>
                   <th style="padding:8px 5px; color:var(--text-muted);">Winner (Top Player)</th>
                   <th style="padding:8px 5px; color:var(--text-muted);">Horns</th>
                 </tr>
               </thead>
               <tbody>`;
               
       for (let i = 1; i <= 6; i++) {
         let es = (meta.enemyAlliance && meta.enemyAlliance.scores) ? (meta.enemyAlliance.scores['d'+i] || 0) : 0;
         let h = staticHorns['d'+i];
         let wName = winners['d'+i].name || '-';
         let at = allianceTotals['d'+i];
         
         html += `<tr>
           <td style="padding:8px 5px; font-weight:bold; color:var(--text-main);">Day ${i}</td>
           <td style="padding:8px 5px; color:var(--accent); font-weight:bold;">${at > 0 ? at.toLocaleString() : '-'}</td>
           <td style="padding:8px 5px;"><input type="number" id="meta_es_${i}" value="${es}" style="width:100px; padding:5px; border-radius:4px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);"></td>
           <td style="padding:8px 5px; color:var(--success);">${escapeHTML(wName)}</td>
           <td style="padding:8px 5px; color:var(--text-muted);">${h}</td>
         </tr>`;
       }
       
       html += `</tbody>
             </table>
           </div>
           
           <button onclick="window.saveShowdownMeta()" style="background:var(--success); color:#fff; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:bold; width:100%;">💾 Save Enemy Scores</button>
         </div>
       </div>`;
       
       app.innerHTML = html;
       
       window._currentSdLiveData = sdLiveData;
       
       window.toggleSdLock = (d) => {
           let input = document.getElementById('sd_d'+d);
           let lockBtn = document.getElementById('sd_d'+d+'_lock');
           if (input.disabled) {
               input.disabled = false;
               input.style.opacity = '1';
               lockBtn.innerHTML = '✏️ Edit';
               lockBtn.style.background = 'rgba(16,185,129,0.15)';
               lockBtn.style.borderColor = 'rgba(16,185,129,0.3)';
               lockBtn.style.color = '#10b981';
           } else {
               input.disabled = true;
               input.style.opacity = '0.5';
               lockBtn.innerHTML = '🔒 Locked';
               lockBtn.style.background = 'rgba(239,68,68,0.15)';
               lockBtn.style.borderColor = 'rgba(239,68,68,0.3)';
               lockBtn.style.color = '#ef4444';
           }
       };
       
       window.onSdPlayerSelect = () => {
          const sel = document.getElementById('sdPlayerSelect').value;
          const fields = document.getElementById('sdEntryFields');
          if (!sel) {
             fields.style.display = 'none';
             return;
          }
          fields.style.display = 'flex';
          const pData = window._currentSdLiveData[sel] || {};
          for (let i = 1; i <= 6; i++) {
             let val = pData['d'+i];
             let input = document.getElementById('sd_d'+i);
             let lockBtn = document.getElementById('sd_d'+i+'_lock');
             
             input.value = val !== undefined ? val : '';
             
             if (val !== undefined && val !== null && val !== '') {
                 input.disabled = true;
                 input.style.opacity = '0.5';
                 lockBtn.style.display = 'inline-block';
                 lockBtn.innerHTML = '🔒 Locked';
                 lockBtn.style.background = 'rgba(239,68,68,0.15)';
                 lockBtn.style.borderColor = 'rgba(239,68,68,0.3)';
                 lockBtn.style.color = '#ef4444';
             } else {
                 input.disabled = false;
                 input.style.opacity = '1';
                 lockBtn.style.display = 'none';
             }
          }
       };
       
       window.saveShowdownEntry = async () => {
          const sel = document.getElementById('sdPlayerSelect').value;
          if (!sel) return;
          
          let btn = event.target;
          let origText = btn.innerHTML;
          btn.innerHTML = 'Saving...';
          btn.disabled = true;
          
          let updates = {};
          for (let i = 1; i <= 6; i++) {
             let val = parseInt(document.getElementById('sd_d'+i).value);
             updates['d'+i] = isNaN(val) ? 0 : val;
          }
          
          try {
             await set(ref(db, `showdown_live/${sel}`), updates);
             window._currentSdLiveData[sel] = updates;
             window.logAdminAction("Showdown Score Update", `Saved daily Showdown scores for player ${sel}`, sel);
             if (window.showToast) window.showToast(`Saved scores for ${sel}`, "success");
             
             // Sync the cached data to reflect this so navigation uses updated scores
             if (window.liveData['Showdown']) {
                window.liveData['Showdown'] = window.mergeShowdownData(window.liveData['Showdown'], window._currentSdLiveData);
             }
          } catch(e) {
             console.error(e);
             if (window.showToast) window.showToast("Failed to save", "error");
          }
          
          btn.innerHTML = origText;
          btn.disabled = false;
       };
       
       window.saveShowdownMeta = async () => {
          const btn = event.target;
          const oldText = btn.innerHTML;
          btn.innerHTML = "Saving...";
          btn.disabled = true;
          
          let newMeta = { enemyAlliance: { name: document.getElementById('metaEnemyName').value, scores: {} } };
          
          for (let i = 1; i <= 6; i++) {
             newMeta.enemyAlliance.scores['d'+i] = Number(document.getElementById('meta_es_'+i).value) || 0;
          }
          
          try {
             await set(ref(db, 'showdown_meta'), newMeta);
             window.logAdminAction("Enemy Alliance Update", `Updated Enemy Alliance name to '${newMeta.enemyAlliance.name || '[WWA] Whiteoutwarriors'}' and daily enemy scores`, newMeta.enemyAlliance.name);
             if(window.showToast) window.showToast("Event Settings saved successfully!", "success");
          } catch(e) {
             console.error(e);
             if(window.showToast) window.showToast("Error saving data", "error");
          }
          
          btn.innerHTML = oldText;
          btn.disabled = false;
       };
       
    } catch(e) {
       app.innerHTML = '<div class="card"><div class="loading" style="color:var(--danger);">Error loading Data Entry UI</div></div>';
       console.error(e);
    }
  },

  championshipAdmin: async () => {
    const app = document.getElementById('app');
    if (!app) return;

    const isManager = window.getAdminLevel(currentUser) === 'R5' || window.getAdminLevel(currentUser) === 'R4';
    if (!isManager) {
       if(window.showToast) window.showToast("Only R4/R5 managers can edit Championship data", "error");
       return;
    }

    renderLoading("Loading Alliance Championship Tracker...");

    if (document.querySelector('.navbar')) {
        document.querySelector('.navbar').style.display = 'none';
    }

    try {
        window.championshipCache = null;
        const [championshipData, rosterData] = await Promise.all([
            window.fetchChampionshipData(),
            window.fetchRoster().catch(() => ({}))
        ]);

        let rosterList = [];
        if (rosterData) {
            Object.values(rosterData).forEach(p => {
                if (p.name && p.gameId) rosterList.push(p);
            });
        }

        // Sort roster by name
        rosterList.sort((a,b) => (a.name || '').localeCompare(b.name || ''));

        // Calculate statistics
        let totalCount = rosterList.length;
        let yesCount = 0;
        let noCount = 0;
        let missingNames = [];

        rosterList.forEach(p => {
            let gIdStr = p.gameId.toString().trim();
            let record = championshipData[gIdStr];
            let isSignedUp = record && record.signedUp;
            if (isSignedUp) {
                yesCount++;
            } else {
                noCount++;
                missingNames.push(p.name);
            }
        });

        let percentSignedUp = totalCount > 0 ? Math.round((yesCount / totalCount) * 100) : 0;

        let html = `
          <div style="display:flex; flex-direction:column; gap:20px; max-width:900px; margin:0 auto; padding-bottom:40px; animation: fadeIn 0.3s ease; position:relative;">
            
            <button onclick="if(document.querySelector('.navbar')) document.querySelector('.navbar').style.display='flex'; views.admin()" style="position:absolute; top:0px; right:0px; background:var(--bg-main); border:1px solid var(--border); color:var(--text-main); padding:6px 14px; border-radius:8px; cursor:pointer; z-index:10; font-weight:bold;">&times; Close</button>
            
            <div style="border-bottom: 2px solid var(--accent); padding-bottom: 12px; margin-bottom: 10px; display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:12px;">
              <div>
                <h2 style="margin:0; color:var(--text-main); font-size:24px; display:flex; align-items:center; gap:10px;">
                  🏆 Alliance Championship Signup Tracker
                </h2>
                <p style="margin:5px 0 0 0; color:var(--text-muted); font-size:13px;">Real-time tracking of member event signups & missing roster responses.</p>
              </div>
              <button onclick="window.openActivityMatrix()" style="background:linear-gradient(135deg, var(--accent), #1d4ed8); color:white; border:none; padding:8px 16px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(59,130,246,0.3);">
                📊 Open Roster Event Activity Matrix ➔
              </button>
            </div>

            <!-- Summary KPI Cards -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:15px;">
              <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; font-weight:bold;">Total Roster</div>
                <div id="champStatTotal" style="font-size:28px; font-weight:bold; color:var(--text-main); margin-top:4px;">${totalCount}</div>
              </div>
              <div style="background:var(--card-bg); border:1px solid rgba(16,185,129,0.3); border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; color:#10b981; text-transform:uppercase; font-weight:bold;">✅ Donated (YES)</div>
                <div id="champStatYes" style="font-size:28px; font-weight:bold; color:#10b981; margin-top:4px;">${yesCount}</div>
              </div>
              <div style="background:var(--card-bg); border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; color:#ef4444; text-transform:uppercase; font-weight:bold;">❌ Action Required (NO)</div>
                <div id="champStatNo" style="font-size:28px; font-weight:bold; color:#ef4444; margin-top:4px;">${noCount}</div>
              </div>
              <div style="background:var(--card-bg); border:1px solid rgba(59,130,246,0.3); border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; color:#60a5fa; text-transform:uppercase; font-weight:bold;">Response Rate</div>
                <div id="champStatPct" style="font-size:28px; font-weight:bold; color:#60a5fa; margin-top:4px;">${percentSignedUp}%</div>
              </div>
            </div>

            <!-- Missing Members Quick-Copy Banner -->
            <div style="background:linear-gradient(135deg, rgba(239,68,68,0.12), rgba(245,158,11,0.12)); border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <h3 style="margin:0; color:#ef4444; font-size:16px; display:flex; align-items:center; gap:8px;">
                  ⚠️ Members Pending / Missing Signup <span id="missingCountTitle">(${missingNames.length})</span>
                </h3>
                <button onclick="window.copyMissingChampionshipList()" style="background:#ef4444; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:12px; box-shadow:0 2px 8px rgba(239,68,68,0.3);">
                  📋 Copy Missing List for Chat
                </button>
              </div>
            </div>

            <!-- Search & Filter Controls -->
            <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:12px; padding:16px; display:flex; gap:12px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
              <input type="text" id="champSearchInput" placeholder="🔍 Filter player name..." style="flex:1; min-width:200px; padding:10px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:14px;" onkeyup="window.filterChampTable()">
              
              <div style="display:flex; gap:6px;">
                <button id="champFilterBtnAll" class="champ-filter-btn active" data-filter="all" onclick="window.setChampFilter('all')" style="padding:8px 14px; border-radius:8px; border:1px solid var(--border); background:var(--accent); color:white; font-weight:bold; cursor:pointer; font-size:13px;">All (${totalCount})</button>
                <button id="champFilterBtnYes" class="champ-filter-btn" data-filter="yes" onclick="window.setChampFilter('yes')" style="padding:8px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-weight:bold; cursor:pointer; font-size:13px;">Signed Up (${yesCount})</button>
                <button id="champFilterBtnNo" class="champ-filter-btn" data-filter="no" onclick="window.setChampFilter('no')" style="padding:8px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-weight:bold; cursor:pointer; font-size:13px;">Missing (${noCount})</button>
              </div>
            </div>

            <!-- Roster Table -->
            <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:12px; overflow:hidden;">
              <table style="width:100%; border-collapse:collapse; text-align:left; font-size:14px;">
                <thead>
                  <tr style="background:var(--bg-main); border-bottom:1px solid var(--border); color:var(--text-muted); font-size:12px; text-transform:uppercase;">
                    <th style="padding:12px 20px;">Chief Name</th>
                    <th style="padding:12px 20px; text-align:right;">Signup Status</th>
                  </tr>
                </thead>
                <tbody id="champTableBody">
                  ${rosterList.map(p => {
                      let gIdStr = (p.gameId && p.gameId.toString().trim()) ? p.gameId.toString().trim() : (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : '');
                      let record = championshipData[gIdStr];
                      let isSignedUp = record && record.signedUp;
                      return `
                        <tr class="champ-row" data-name="${escapeHTML((p.name || '').toLowerCase())}" data-gid="${gIdStr}" data-signed="${isSignedUp ? 'yes' : 'no'}" style="border-bottom:1px solid var(--border);">
                          <td class="champ-name-cell" style="padding:14px 20px; font-weight:bold; color:var(--text-main); font-size:15px;">${escapeHTML(p.name)}</td>
                          <td style="padding:14px 20px; text-align:right;">
                            <button class="champ-toggle-btn" onclick="window.onChampToggle('${gIdStr}', this)" style="background:${isSignedUp ? '#10b981' : 'rgba(239,68,68,0.15)'}; color:${isSignedUp ? '#ffffff' : '#ef4444'}; border:${isSignedUp ? 'none' : '1px solid rgba(239,68,68,0.4)'}; padding:6px 20px; border-radius:20px; font-weight:bold; cursor:pointer; font-size:13px; transition:0.2s; box-shadow:${isSignedUp ? '0 2px 8px rgba(16,185,129,0.35)' : 'none'};">
                              ${isSignedUp ? '✅ YES' : '❌ NO'}
                            </button>
                          </td>
                        </tr>
                      `;
                  }).join('')}
                </tbody>
              </table>
            </div>

          </div>
        `;

        app.innerHTML = html;
        window.champMissingNames = missingNames;

        window.updateChampStatsUI = () => {
            let total = 0, yes = 0, no = 0;
            let missingList = [];

            document.querySelectorAll('.champ-row').forEach(row => {
                total++;
                const isSigned = row.getAttribute('data-signed') === 'yes';
                const pName = row.querySelector('.champ-name-cell')?.textContent || '';
                if (isSigned) {
                    yes++;
                } else {
                    no++;
                    if (pName) missingList.push(pName);
                }
            });

            const pct = total > 0 ? Math.round((yes / total) * 100) : 0;

            const elTotal = document.getElementById('champStatTotal');
            const elYes = document.getElementById('champStatYes');
            const elNo = document.getElementById('champStatNo');
            const elPct = document.getElementById('champStatPct');
            const elBtnAll = document.getElementById('champFilterBtnAll');
            const elBtnYes = document.getElementById('champFilterBtnYes');
            const elBtnNo = document.getElementById('champFilterBtnNo');
            const elMissingCount = document.getElementById('missingCountTitle');

            if (elTotal) elTotal.textContent = total;
            if (elYes) elYes.textContent = yes;
            if (elNo) elNo.textContent = no;
            if (elPct) elPct.textContent = `${pct}%`;
            if (elBtnAll) elBtnAll.textContent = `All (${total})`;
            if (elBtnYes) elBtnYes.textContent = `Signed Up (${yes})`;
            if (elBtnNo) elBtnNo.textContent = `Missing (${no})`;
            if (elMissingCount) elMissingCount.textContent = `(${missingList.length})`;
            if (elMissingBox) {
                elMissingBox.innerHTML = missingList.length > 0 ? missingList.join(', ') : '<span style="color:var(--success);">🎉 All members have signed up!</span>';
            }
            window.champMissingNames = missingList;
        };

        window.copyMissingChampionshipList = () => {
            const list = window.champMissingNames || [];
            if (list.length === 0) {
                window.showToast("No missing members to copy!", "info");
                return;
            }
            const text = "🏆 Alliance Championship Pending Signups (" + list.length + "):\n" + list.join(", ");
            navigator.clipboard.writeText(text);
            window.showToast("Copied missing signup list to clipboard!", "success");
        };

        window.onChampToggle = async (gameId, btnElement) => {
            const btn = btnElement || (event && (event.currentTarget || event.target));
            if (!btn || btn.disabled) return;

            const row = btn.closest('.champ-row');
            if (!row) return;

            const wasSigned = row.getAttribute('data-signed') === 'yes';
            const willSign = !wasSigned;

            // Optimistic in-place update
            btn.disabled = true;
            row.setAttribute('data-signed', willSign ? 'yes' : 'no');
            
            btn.style.background = willSign ? '#10b981' : 'rgba(239,68,68,0.15)';
            btn.style.color = willSign ? '#ffffff' : '#ef4444';
            btn.style.border = willSign ? 'none' : '1px solid rgba(239,68,68,0.4)';
            btn.style.boxShadow = willSign ? '0 2px 8px rgba(16,185,129,0.35)' : 'none';
            btn.innerHTML = willSign ? '✅ YES' : '❌ NO';

            window.updateChampStatsUI();
            window.filterChampTable();

            const ok = await window.toggleChampionshipStatus(gameId, willSign);
            btn.disabled = false;

            if (!ok) {
                // Revert on write error
                row.setAttribute('data-signed', wasSigned ? 'yes' : 'no');
                btn.style.background = wasSigned ? '#10b981' : 'rgba(239,68,68,0.15)';
                btn.style.color = wasSigned ? '#ffffff' : '#ef4444';
                btn.style.border = wasSigned ? 'none' : '1px solid rgba(239,68,68,0.4)';
                btn.style.boxShadow = wasSigned ? '0 2px 8px rgba(16,185,129,0.35)' : 'none';
                btn.innerHTML = wasSigned ? '✅ YES' : '❌ NO';
                window.updateChampStatsUI();
                window.filterChampTable();
                if (window.showToast) window.showToast("Failed to save signup status", "error");
            }
        };

        window.champCurrentFilter = 'all';

        window.setChampFilter = (filter) => {
            window.champCurrentFilter = filter;
            document.querySelectorAll('.champ-filter-btn').forEach(b => {
                if (b.getAttribute('data-filter') === filter) {
                    b.style.background = 'var(--accent)';
                    b.style.color = 'white';
                } else {
                    b.style.background = 'var(--bg-main)';
                    b.style.color = 'var(--text-main)';
                }
            });
            window.filterChampTable();
        };

        window.filterChampTable = () => {
            const query = (document.getElementById('champSearchInput')?.value || '').toLowerCase().trim();
            const filter = window.champCurrentFilter || 'all';

            document.querySelectorAll('.champ-row').forEach(row => {
                const name = row.getAttribute('data-name');
                const gid = row.getAttribute('data-gid');
                const signed = row.getAttribute('data-signed');

                const matchesSearch = !query || name.includes(query) || gid.includes(query);
                const matchesFilter = (filter === 'all') || (filter === 'yes' && signed === 'yes') || (filter === 'no' && signed === 'no');

                if (matchesSearch && matchesFilter) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        };

    } catch(e) {
        app.innerHTML = '<div class="card"><div class="loading" style="color:var(--danger);">Error loading Championship Admin UI</div></div>';
        console.error(e);
    }
  },

  
  polarTerrorsAdmin: async () => {
    const app = document.getElementById('app');
    if (!app) return;

    const isManager = window.getAdminLevel(currentUser) === 'R5' || window.getAdminLevel(currentUser) === 'R4';
    if (!isManager) {
       if(window.showToast) window.showToast("Only R4/R5 managers can edit Polar Terrors data", "error");
       return;
    }

    renderLoading("Loading Polar Terrors Tracker...");

    if (document.querySelector('.navbar')) {
        document.querySelector('.navbar').style.display = 'none';
    }

    try {
        window.polarTerrorsCache = null;
        const [polarData, rosterData] = await Promise.all([
            window.fetchPolarTerrorsData(),
            window.fetchRoster().catch(() => ({}))
        ]);

        let rosterList = [];
        if (rosterData) {
            Object.values(rosterData).forEach(p => {
                if (p.name && p.gameId) rosterList.push(p);
            });
        }

        rosterList.sort((a,b) => (a.name || '').localeCompare(b.name || ''));

        let totalCount = rosterList.length;
        let yesCount = 0;
        let noCount = 0;

        rosterList.forEach(p => {
            let gIdStr = p.gameId.toString().trim();
            let record = polarData[gIdStr];
            let isDone = record && record.signedUp;
            if (isDone) {
                yesCount++;
            } else {
                noCount++;
            }
        });

        let percentDone = totalCount > 0 ? Math.round((yesCount / totalCount) * 100) : 0;

        let html = `
        <div style="background:var(--bg-main); min-height:100vh; font-family:var(--font-family); color:var(--text-main);">
          <div style="background:linear-gradient(135deg, #0ea5e9, #0284c7); padding:20px; box-shadow:0 2px 10px rgba(0,0,0,0.1); display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100;">
            <div style="display:flex; align-items:center; gap:15px;">
              <button onclick="views.admin('tab-indev')" style="background:rgba(255,255,255,0.2); border:none; color:#fff; cursor:pointer; font-size:18px; padding:8px 12px; border-radius:8px; transition:0.2s;">⬅ Back</button>
              <h2 style="margin:0; color:#fff; font-size:1.3em;">🐻‍❄️ Polar Terrors Tracker</h2>
            </div>
            <button onclick="window.openActivityMatrix()" style="background:rgba(255,255,255,0.2); border:none; color:#fff; cursor:pointer; font-size:13px; padding:8px 14px; border-radius:8px; font-weight:bold; transition:0.2s;">📊 Activity Matrix ➔</button>
          </div>

          <div style="padding:20px; max-width:1600px; margin:0 auto;">

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-bottom:20px;">
              <div class="card" style="text-align:center;">
                <div style="font-size:13px; color:var(--text-muted); margin-bottom:5px;">Done (YES)</div>
                <div style="font-size:24px; font-weight:bold; color:var(--success);" id="pt-yes-count">${yesCount}</div>
              </div>
              <div class="card" style="text-align:center;">
                <div style="font-size:13px; color:var(--text-muted); margin-bottom:5px;">Missing (NO)</div>
                <div style="font-size:24px; font-weight:bold; color:var(--danger);" id="pt-no-count">${noCount}</div>
              </div>
              <div class="card" style="text-align:center;">
                <div style="font-size:13px; color:var(--text-muted); margin-bottom:5px;">Completion Rate</div>
                <div style="font-size:24px; font-weight:bold; color:var(--accent);" id="pt-percent">${percentDone}%</div>
              </div>
            </div>

            <div class="card">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; flex-wrap:wrap; gap:10px;">
                <h3 style="margin:0; font-size:1.1em;">Roster Status (${totalCount})</h3>
                <input type="text" id="ptSearch" placeholder="🔍 Search name..." onkeyup="window.filterPolarTerrorsTable()" style="padding:8px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:14px; width:200px;">
              </div>

              <div style="display:flex; gap:8px; margin-bottom:15px; flex-wrap:wrap; align-items:center;">
                <button id="ptFilterAll" onclick="window.setPtFilter('all')" style="padding:6px 14px; border-radius:20px; border:1px solid var(--accent); background:var(--accent); color:#fff; cursor:pointer; font-size:13px; font-weight:bold;">ALL</button>
                <button id="ptFilterMissing" onclick="window.setPtFilter('missing')" style="padding:6px 14px; border-radius:20px; border:1px solid var(--border); background:transparent; color:var(--text-muted); cursor:pointer; font-size:13px; font-weight:bold;">❌ MISSING ONLY</button>
                <button id="ptFilterDone" onclick="window.setPtFilter('done')" style="padding:6px 14px; border-radius:20px; border:1px solid var(--border); background:transparent; color:var(--text-muted); cursor:pointer; font-size:13px; font-weight:bold;">✅ DONE ONLY</button>
                <button onclick="window.copyPtMissingList()" style="padding:6px 14px; border-radius:20px; border:1px solid var(--border); background:transparent; color:var(--text-muted); cursor:pointer; font-size:13px; font-weight:bold; margin-left:auto;">📋 Copy Missing List</button>
              </div>

              <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; min-width:300px;">
                  <thead>
                    <tr style="background:var(--bg-main); border-bottom:2px solid var(--border);">
                      <th style="padding:12px; text-align:left; font-weight:bold; color:var(--text-muted); font-size:13px; text-transform:uppercase;">Chief Name</th>
                      <th style="padding:12px; text-align:center; font-weight:bold; color:var(--text-muted); font-size:13px; text-transform:uppercase;">Status</th>
                    </tr>
                  </thead>
                  <tbody id="ptTableBody">
                    ${rosterList.map(p => {
                       let gIdStr = (p.gameId && p.gameId.toString().trim()) ? p.gameId.toString().trim() : (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : '');
                       let isDone = polarData[gIdStr] ? polarData[gIdStr].signedUp : false;
                       let badgeBg = isDone ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
                       let badgeColor = isDone ? '#10b981' : '#ef4444';
                       let badgeBorder = isDone ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)';
                       let badgeText = isDone ? '✅ Done' : '❌ Missing';
                       return `
                       <tr class="pt-row" data-name="${escapeHTML(p.name.toLowerCase())}" data-status="${isDone ? 'done' : 'missing'}" style="border-bottom:1px solid var(--border);">
                         <td style="padding:12px; font-weight:bold; color:var(--text-main);">${escapeHTML(p.name)}</td>
                         <td style="padding:12px; text-align:center;">
                           <button onclick="window.onPtToggleSingle('${gIdStr}', this)" style="background:${badgeBg}; color:${badgeColor}; border:1px solid ${badgeBorder}; padding:6px 16px; border-radius:20px; cursor:pointer; font-weight:bold; font-size:13px; min-width:85px; transition:all 0.2s ease;">${badgeText}</button>
                         </td>
                       </tr>
                       `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
          </div>
        </div>
        `;

        app.innerHTML = html;

        window.ptRosterList = rosterList;
        window.currentPtFilter = 'all';

        window.setPtFilter = (filter) => {
            window.currentPtFilter = filter;
            const allBtns = { all: document.getElementById('ptFilterAll'), missing: document.getElementById('ptFilterMissing'), done: document.getElementById('ptFilterDone') };
            Object.entries(allBtns).forEach(([key, btnEl]) => {
                if (!btnEl) return;
                btnEl.style.border = key === filter ? '1px solid var(--accent)' : '1px solid var(--border)';
                btnEl.style.background = key === filter ? 'var(--accent)' : 'transparent';
                btnEl.style.color = key === filter ? '#fff' : 'var(--text-muted)';
            });
            window.filterPolarTerrorsTable();
        };

        window.filterPolarTerrorsTable = () => {
            const q = (document.getElementById('ptSearch')?.value || '').toLowerCase().trim();
            const filter = window.currentPtFilter || 'all';
            document.querySelectorAll('.pt-row').forEach(row => {
                const name = row.getAttribute('data-name');
                const status = row.getAttribute('data-status');
                let matchSearch = !q || name.includes(q);
                let matchFilter = filter === 'all' || (filter === 'missing' && status === 'missing') || (filter === 'done' && status === 'done');
                row.style.display = (matchSearch && matchFilter) ? '' : 'none';
            });
        };

        window.copyPtMissingList = () => {
            const missingList = [];
            document.querySelectorAll('.pt-row').forEach(row => {
                if (row.getAttribute('data-status') === 'missing') {
                    const nameCell = row.querySelector('td');
                    if (nameCell) missingList.push(nameCell.textContent.trim());
                }
            });
            if (missingList.length === 0) {
                if (window.showToast) window.showToast('Everyone is done! 🎉', 'success');
                return;
            }
            const text = missingList.join(', ');
            navigator.clipboard.writeText(text).then(() => {
                if (window.showToast) window.showToast(`Copied ${missingList.length} missing player(s) to clipboard!`, 'success');
            });
        };

        window.onPtToggleSingle = async (gameId, btnElement) => {
            const row = btnElement.closest('tr');
            const currentStatus = row.getAttribute('data-status');
            const willSign = currentStatus === 'missing';

            // Optimistic UI update
            if (willSign) {
                btnElement.textContent = '✅ Done';
                btnElement.style.background = 'rgba(16,185,129,0.15)';
                btnElement.style.color = '#10b981';
                btnElement.style.borderColor = 'rgba(16,185,129,0.3)';
                row.setAttribute('data-status', 'done');
            } else {
                btnElement.textContent = '❌ Missing';
                btnElement.style.background = 'rgba(239,68,68,0.15)';
                btnElement.style.color = '#ef4444';
                btnElement.style.borderColor = 'rgba(239,68,68,0.3)';
                row.setAttribute('data-status', 'missing');
            }

            const ok = await window.togglePolarTerrorsStatus(gameId, willSign);
            if (!ok) {
                if(window.showToast) window.showToast("Failed to sync to Firebase", "error");
                // Revert
                if (!willSign) {
                    btnElement.textContent = '✅ Done';
                    btnElement.style.background = 'rgba(16,185,129,0.15)';
                    btnElement.style.color = '#10b981';
                    btnElement.style.borderColor = 'rgba(16,185,129,0.3)';
                    row.setAttribute('data-status', 'done');
                } else {
                    btnElement.textContent = '❌ Missing';
                    btnElement.style.background = 'rgba(239,68,68,0.15)';
                    btnElement.style.color = '#ef4444';
                    btnElement.style.borderColor = 'rgba(239,68,68,0.3)';
                    row.setAttribute('data-status', 'missing');
                }
            } else {
                // Update counters
                let newYes = 0;
                let newNo = 0;
                document.querySelectorAll('.pt-row').forEach(r => {
                    if (r.getAttribute('data-status') === 'done') newYes++;
                    else newNo++;
                });
                document.getElementById('pt-yes-count').textContent = newYes;
                document.getElementById('pt-no-count').textContent = newNo;
                document.getElementById('pt-percent').textContent = window.ptRosterList.length > 0 ? Math.round((newYes / window.ptRosterList.length) * 100) + '%' : '0%';
            }
        };

    } catch (e) {
        console.error("Polar Terrors Admin Error:", e);
        app.innerHTML = `<div style="padding:40px; text-align:center; color:var(--danger); font-size:18px;">Error loading Polar Terrors Tracker. <br><br> <button onclick="views.admin('tab-indev')" style="padding:10px 20px; background:var(--bg-main); border:1px solid var(--border); border-radius:6px; color:var(--text-main); cursor:pointer;">Back to Admin Hub</button></div>`;
    }
  },

  bearTrapAdmin: async () => {
    const app = document.getElementById('app');
    if (!app) return;

    const isManager = window.getAdminLevel(currentUser) === 'R5' || window.getAdminLevel(currentUser) === 'R4';
    if (!isManager) {
       if(window.showToast) window.showToast("Only R4/R5 managers can edit Bear Trap data", "error");
       return;
    }

    renderLoading("Loading Bear Trap Tracker...");

    if (document.querySelector('.navbar')) {
        document.querySelector('.navbar').style.display = 'none';
    }

    try {
        const [btData, rosterData] = await Promise.all([
            window.fetchBearTrapData(),
            window.fetchRoster().catch(() => ({}))
        ]);

        let rosterList = [];
        if (rosterData) {
            Object.values(rosterData).forEach(p => {
                if (p.name && p.gameId) rosterList.push(p);
            });
        }

        rosterList.sort((a,b) => (a.name || '').localeCompare(b.name || ''));

        let totalCount = rosterList.length;
        let yesCount = 0;
        let noCount = 0;
        let missingNames = [];

        rosterList.forEach(p => {
            let gIdStr = p.gameId.toString().trim();
            let record = btData[gIdStr];
            let isSignedUp = record && record.signedUp;
            if (isSignedUp) {
                yesCount++;
            } else {
                noCount++;
                missingNames.push(p.name);
            }
        });

        let percentSignedUp = totalCount > 0 ? Math.round((yesCount / totalCount) * 100) : 0;

        let html = `
        <div style="background:var(--bg-main); min-height:100vh; font-family:var(--font-family); color:var(--text-main);">
          <div style="background:linear-gradient(135deg, #10b981, #059669); padding:20px; box-shadow:0 2px 10px rgba(0,0,0,0.1); display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; z-index:100;">
            <div style="display:flex; align-items:center; gap:15px;">
              <button onclick="views.beartrap()" style="background:rgba(255,255,255,0.2); border:none; color:#fff; cursor:pointer; font-size:16px; padding:8px 14px; border-radius:8px; transition:0.2s; font-weight:bold;">⬅ Back to Bear Trap</button>
              <h2 style="margin:0; color:#fff; font-size:1.3em;">🐻 BT Donations Tracker</h2>
            </div>
          </div>

          <div style="padding:25px; max-width:1600px; margin:0 auto;">
            
            <button onclick="window.openActivityMatrix()" style="background:linear-gradient(135deg, #a855f7, #9333ea); color:#fff; border:none; padding:14px 24px; border-radius:10px; cursor:pointer; font-weight:bold; font-size:15px; width:100%; box-shadow:0 4px 12px rgba(168,85,247,0.3); margin-bottom: 20px; transition: transform 0.2s ease;">
              📊 Open Roster Event Activity Matrix ➔
            </button>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:20px; margin-bottom:25px;">
              <div class="card" style="text-align:center; padding:20px;">
                <div style="font-size:13px; color:var(--text-muted); font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Donated (YES)</div>
                <div style="font-size:32px; font-weight:bold; color:var(--success);" id="bt-yes-count">${yesCount}</div>
              </div>
              <div class="card" style="text-align:center; padding:20px;">
                <div style="font-size:13px; color:var(--text-muted); font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Missing (NO)</div>
                <div style="font-size:32px; font-weight:bold; color:var(--danger);" id="bt-no-count">${noCount}</div>
              </div>
              <div class="card" style="text-align:center; padding:20px;">
                <div style="font-size:13px; color:var(--text-muted); font-weight:bold; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px;">Response Rate</div>
                <div style="font-size:32px; font-weight:bold; color:var(--accent);" id="bt-percent">${percentSignedUp}%</div>
              </div>
            </div>

            <div class="card">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:18px; flex-wrap:wrap; gap:12px;">
                <h3 style="margin:0; font-size:1.2em; color:var(--text-main);">Roster Status (${totalCount})</h3>
                
                <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
                  <!-- Filter Tabs -->
                  <div id="btFilterToggle" style="display:inline-flex; background:var(--bg-main); border:1px solid var(--border); border-radius:8px; overflow:hidden; padding:3px;">
                    <button onclick="window.setBtFilter('all', this)" class="bt-filter-btn active" style="border:none; padding:6px 12px; font-weight:bold; font-size:12px; cursor:pointer; background:var(--accent); color:#fff; border-radius:6px; transition:0.2s;">ALL</button>
                    <button onclick="window.setBtFilter('missing', this)" class="bt-filter-btn" style="border:none; padding:6px 12px; font-weight:bold; font-size:12px; cursor:pointer; background:transparent; color:var(--text-muted); border-radius:6px; transition:0.2s;">❌ MISSING ONLY</button>
                    <button onclick="window.setBtFilter('donated', this)" class="bt-filter-btn" style="border:none; padding:6px 12px; font-weight:bold; font-size:12px; cursor:pointer; background:transparent; color:var(--text-muted); border-radius:6px; transition:0.2s;">✅ DONATED ONLY</button>
                  </div>

                  <!-- Search Bar -->
                  <input type="text" id="btSearch" placeholder="🔍 Search name..." onkeyup="window.filterBearTrapTable()" style="padding:7px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:13px; width:180px;">

                  <!-- Copy Missing Button -->
                  <button onclick="window.copyBtMissingList()" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:7px 14px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:13px; display:flex; align-items:center; gap:6px; box-shadow:0 2px 8px rgba(16,185,129,0.3);">
                    📋 Copy Missing List
                  </button>
                </div>
              </div>
              <div style="overflow-x:auto;">
                <table style="width:100%; border-collapse:collapse; min-width:500px;">
                  <thead>
                    <tr style="background:var(--bg-main); border-bottom:2px solid var(--border);">
                      <th style="padding:12px; text-align:left; font-weight:bold; color:var(--text-muted); font-size:13px; text-transform:uppercase;">Chief Name</th>
                      <th style="padding:12px; text-align:center; font-weight:bold; color:var(--text-muted); font-size:13px; text-transform:uppercase;">Donated</th>
                      <th style="padding:12px; text-align:right; font-weight:bold; color:var(--text-muted); font-size:13px; text-transform:uppercase;">Amount</th>
                    </tr>
                  </thead>
                  <tbody id="btTableBody">
                    ${rosterList.map(p => {
                       let gIdStr = p.gameId.toString().trim();
                       let isSignedUp = btData[gIdStr] ? btData[gIdStr].signedUp : false;
                       return `
                       <tr class="bt-row" data-name="${escapeHTML(p.name.toLowerCase())}" style="border-bottom:1px solid var(--border);">
                         <td style="padding:12px; font-weight:bold; color:var(--text-main);">${escapeHTML(p.name)}</td>
                         <td style="padding:8px 12px; text-align:center;">
                           <button onclick="window.onBtToggleSingle('${gIdStr}', this)" data-signed="${isSignedUp ? 'true' : 'false'}" style="border:none; padding:6px 14px; font-weight:bold; border-radius:20px; cursor:pointer; font-size:12px; transition:all 0.2s ease; background:${isSignedUp ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color:${isSignedUp ? '#10b981' : '#ef4444'}; border:1px solid ${isSignedUp ? '#10b981' : '#ef4444'};">
                             ${isSignedUp ? '✅ Donated' : '❌ Missing'}
                           </button>
                         </td>
                         <td style="padding:12px; text-align:right;">
                            <input type="number" placeholder="0" class="bt-donation-input" data-gid="${gIdStr}" onchange="window.onBtDonationChange('${gIdStr}', this.value)" style="width:80px; padding:8px; border-radius:6px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-weight:bold; text-align:center;">
                         </td>
                       </tr>
                       `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
          </div>
        </div>
        `;

        app.innerHTML = html;

        window.btRosterList = rosterList; 
        
        // Asynchronously populate the donation inputs
        setTimeout(async () => {
             try {
                const donSnap = await get(ref(db, 'beartrap_donations'));
                if (donSnap.exists()) {
                    const allDonations = donSnap.val();
                    document.querySelectorAll('.bt-donation-input').forEach(input => {
                        const gid = input.getAttribute('data-gid');
                        const chiefName = window.idToNameMap[gid];
                        if (chiefName) {
                            const donKey = chiefName.toLowerCase().replace(/[^a-z0-9]/g, '_');
                            if (allDonations[donKey]) {
                                input.value = allDonations[donKey].current || '';
                            }
                        }
                    });
                }
             } catch(e) { console.error(e); }
        }, 500);
        
        window.filterBearTrapTable = () => {
            const q = document.getElementById('btSearch').value.toLowerCase().trim();
            document.querySelectorAll('.bt-row').forEach(row => {
                const name = row.getAttribute('data-name');
                row.style.display = (!q || name.includes(q)) ? '' : 'none';
            });
        };

        
        window.onBtToggleSingle = async (gameId, btnElement) => {
            const currentStatus = btnElement.getAttribute('data-signed') === 'true';
            const newStatus = !currentStatus;
            
            btnElement.setAttribute('data-signed', newStatus ? 'true' : 'false');
            btnElement.style.background = newStatus ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
            btnElement.style.color = newStatus ? '#10b981' : '#ef4444';
            btnElement.style.borderColor = newStatus ? '#10b981' : '#ef4444';
            btnElement.innerHTML = newStatus ? '✅ Donated' : '❌ Missing';

            const ok = await window.toggleBearTrapStatus(gameId, newStatus);
            if (!ok) {
                if(window.showToast) window.showToast("Failed to sync to Firebase", "error");
                btnElement.setAttribute('data-signed', currentStatus ? 'true' : 'false');
                btnElement.style.background = currentStatus ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)';
                btnElement.style.color = currentStatus ? '#10b981' : '#ef4444';
                btnElement.style.borderColor = currentStatus ? '#10b981' : '#ef4444';
                btnElement.innerHTML = currentStatus ? '✅ Donated' : '❌ Missing';
            } else {
                let pData = await window.fetchBearTrapData();
                let newYes = 0;
                let newNo = 0;
                let newMissing = [];
                window.btRosterList.forEach(rp => {
                    let st = pData[rp.gameId.toString().trim()];
                    if (st && st.signedUp) newYes++;
                    else {
                        newNo++;
                        newMissing.push(rp.name);
                    }
                });
                
                document.getElementById('bt-yes-count').textContent = newYes;
                document.getElementById('bt-no-count').textContent = newNo;
                document.getElementById('bt-percent').textContent = window.btRosterList.length > 0 ? Math.round((newYes / window.btRosterList.length) * 100) + '%' : '0%';
                const missingEl = document.getElementById('bt-missing-names');
                if (missingEl) {
                  missingEl.textContent = newMissing.length > 0 ? newMissing.join(', ') : 'Everyone has donated! 🎉';
                }
            }
        };

        window.onBtToggle = async (gameId, willSign, btnElement) => {
            const container = btnElement.parentElement;
            const buttons = container.querySelectorAll('button');
            
            buttons[0].style.background = willSign ? 'var(--success)' : 'transparent';
            buttons[0].style.color = willSign ? '#fff' : 'var(--text-muted)';
            
            buttons[1].style.background = !willSign ? 'var(--danger)' : 'transparent';
            buttons[1].style.color = !willSign ? '#fff' : 'var(--text-muted)';

            const ok = await window.toggleBearTrapStatus(gameId, willSign);
            if (!ok) {
                if(window.showToast) window.showToast("Failed to sync to Firebase", "error");
                buttons[0].style.background = !willSign ? 'var(--success)' : 'transparent';
                buttons[0].style.color = !willSign ? '#fff' : 'var(--text-muted)';
                buttons[1].style.background = willSign ? 'var(--danger)' : 'transparent';
                buttons[1].style.color = willSign ? '#fff' : 'var(--text-muted)';
            } else {
                let pData = await window.fetchBearTrapData();
                let newYes = 0;
                let newNo = 0;
                let newMissing = [];
                window.btRosterList.forEach(rp => {
                    let st = pData[rp.gameId.toString().trim()];
                    if (st && st.signedUp) newYes++;
                    else {
                        newNo++;
                        newMissing.push(rp.name);
                    }
                });
                
                document.getElementById('bt-yes-count').textContent = newYes;
                document.getElementById('bt-no-count').textContent = newNo;
                document.getElementById('bt-percent').textContent = window.btRosterList.length > 0 ? Math.round((newYes / window.btRosterList.length) * 100) + '%' : '0%';
                
                // updated stats
            }
        };

        
        window.currentBtFilter = 'all';

        window.setBtFilter = (filterType, btnEl) => {
            window.currentBtFilter = filterType;
            const container = document.getElementById('btFilterToggle');
            if (container) {
                container.querySelectorAll('.bt-filter-btn').forEach(b => {
                    b.style.background = 'transparent';
                    b.style.color = 'var(--text-muted)';
                });
            }
            if (btnEl) {
                btnEl.style.background = 'var(--accent)';
                btnEl.style.color = '#fff';
            }
            window.filterBearTrapTable();
        };

        window.filterBearTrapTable = () => {
            const q = (document.getElementById('btSearch')?.value || '').toLowerCase().trim();
            const filter = window.currentBtFilter || 'all';
            
            document.querySelectorAll('.bt-row').forEach(row => {
                const name = row.getAttribute('data-name') || '';
                const btn = row.querySelector('[data-signed]');
                const isSigned = btn ? btn.getAttribute('data-signed') === 'true' : false;
                
                let matchesSearch = !q || name.includes(q);
                let matchesFilter = true;
                if (filter === 'missing') matchesFilter = !isSigned;
                else if (filter === 'donated') matchesFilter = isSigned;
                
                row.style.display = (matchesSearch && matchesFilter) ? '' : 'none';
            });
        };

        window.copyBtMissingList = () => {
            let missingList = [];
            document.querySelectorAll('.bt-row').forEach(row => {
                const btn = row.querySelector('[data-signed]');
                const isSigned = btn ? btn.getAttribute('data-signed') === 'true' : false;
                if (!isSigned) {
                    const nameCell = row.cells[0];
                    if (nameCell) missingList.push(nameCell.innerText.trim());
                }
            });
            const text = missingList.length > 0 ? missingList.join(', ') : 'Everyone has donated! 🎉';
            navigator.clipboard.writeText(text).then(() => {
                if (window.showToast) window.showToast(`Copied ${missingList.length} missing player(s) to clipboard!`, 'success');
            });
        };

        window.onBtDonationChange = async (gameId, newVal) => {
            if (newVal === '') newVal = "0";
            const ok = await window.updateBearTrapDonationInline(gameId, newVal);
            if (ok && Number(newVal) > 0) await window.autoSyncBtSignup(gameId);
            if (ok) {
                if (window.showToast) window.showToast("Saved donation!", "success");
            } else {
                if (window.showToast) window.showToast("Error saving donation", "error");
            }
        };

    } catch (e) {
        console.error("Bear Trap Admin Error:", e);
        app.innerHTML = `<div style="padding:40px; text-align:center; color:var(--danger); font-size:18px;">Error loading Bear Trap Tracker. <br><br> <button onclick="views.beartrap()" style="padding:10px 20px; background:var(--bg-main); border:1px solid var(--border); border-radius:6px; color:var(--text-main); cursor:pointer;">Back to Bear Trap</button></div>`;
    }
  },
  mercenaryAdmin: async () => {
    const app = document.getElementById('app');
    if (!app) return;

    const isManager = window.getAdminLevel(currentUser) === 'R5' || window.getAdminLevel(currentUser) === 'R4';
    if (!isManager) {
       if(window.showToast) window.showToast("Only R4/R5 managers can edit Mercenary Prestige data", "error");
       return;
    }

    renderLoading("Loading Mercenary Prestige Tracker...");

    if (document.querySelector('.navbar')) {
        document.querySelector('.navbar').style.display = 'none';
    }

    try {
        window.mercenaryCache = null;
        const [mercenaryData, rosterData] = await Promise.all([
            window.fetchMercenaryData(),
            window.fetchRoster().catch(() => ({}))
        ]);

        let rosterList = [];
        if (rosterData) {
            Object.values(rosterData).forEach(p => {
                if (p.name && p.gameId) rosterList.push(p);
            });
        }

        // Sort roster by name
        rosterList.sort((a,b) => (a.name || '').localeCompare(b.name || ''));

        // Calculate statistics
        let totalCount = rosterList.length;
        let yesCount = 0;
        let noCount = 0;
        let missingNames = [];

        rosterList.forEach(p => {
            let gIdStr = p.gameId.toString().trim();
            let record = mercenaryData[gIdStr];
            let isDone = record && record.signedUp;
            if (isDone) {
                yesCount++;
            } else {
                noCount++;
                missingNames.push(p.name);
            }
        });

        let percentSignedUp = totalCount > 0 ? Math.round((yesCount / totalCount) * 100) : 0;

        let html = `
          <div style="display:flex; flex-direction:column; gap:20px; max-width:900px; margin:0 auto; padding-bottom:40px; animation: fadeIn 0.3s ease; position:relative;">
            
            <button onclick="if(document.querySelector('.navbar')) document.querySelector('.navbar').style.display='flex'; views.admin()" style="position:absolute; top:0px; right:0px; background:var(--bg-main); border:1px solid var(--border); color:var(--text-main); padding:6px 14px; border-radius:8px; cursor:pointer; z-index:10; font-weight:bold;">&times; Close</button>
            
            <div style="border-bottom: 2px solid #ef4444; padding-bottom: 12px; margin-bottom: 10px; display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:12px;">
              <div>
                <h2 style="margin:0; color:var(--text-main); font-size:24px; display:flex; align-items:center; gap:10px;">
                  ⚔️ Mercenary Prestige: Tracker
                </h2>
                <p style="margin:5px 0 0 0; color:var(--text-muted); font-size:13px;">Real-time tracking of who has completed Mercenary Prestige & who still needs to.</p>
              </div>
              <button onclick="window.openActivityMatrix()" style="background:linear-gradient(135deg, #ef4444, #dc2626); color:white; border:none; padding:8px 16px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:13px; display:inline-flex; align-items:center; gap:6px; box-shadow:0 4px 12px rgba(239,68,68,0.3);">
                📊 Open Roster Event Activity Matrix ➔
              </button>
            </div>

            <!-- Summary KPI Cards -->
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:15px;">
              <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; color:var(--text-muted); text-transform:uppercase; font-weight:bold;">Total Roster</div>
                <div id="mercStatTotal" style="font-size:28px; font-weight:bold; color:var(--text-main); margin-top:4px;">${totalCount}</div>
              </div>
              <div style="background:var(--card-bg); border:1px solid rgba(16,185,129,0.3); border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; color:#10b981; text-transform:uppercase; font-weight:bold;">✅ Done</div>
                <div id="mercStatYes" style="font-size:28px; font-weight:bold; color:#10b981; margin-top:4px;">${yesCount}</div>
              </div>
              <div style="background:var(--card-bg); border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; color:#ef4444; text-transform:uppercase; font-weight:bold;">❌ Not Done Yet</div>
                <div id="mercStatNo" style="font-size:28px; font-weight:bold; color:#ef4444; margin-top:4px;">${noCount}</div>
              </div>
              <div style="background:var(--card-bg); border:1px solid rgba(59,130,246,0.3); border-radius:12px; padding:16px; text-align:center;">
                <div style="font-size:12px; color:#60a5fa; text-transform:uppercase; font-weight:bold;">Response Rate</div>
                <div id="mercStatPct" style="font-size:28px; font-weight:bold; color:#60a5fa; margin-top:4px;">${percentSignedUp}%</div>
              </div>
            </div>

            <!-- Missing Members Quick-Copy Banner -->
            <div style="background:linear-gradient(135deg, rgba(239,68,68,0.12), rgba(245,158,11,0.12)); border:1px solid rgba(239,68,68,0.3); border-radius:12px; padding:16px;">
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <h3 style="margin:0; color:#ef4444; font-size:16px; display:flex; align-items:center; gap:8px;">
                  ⚠️ Members Not Done Yet <span id="mercMissingCountTitle">(${missingNames.length})</span>
                </h3>
                <button onclick="window.copyMissingMercenaryList()" style="background:#ef4444; color:white; border:none; padding:8px 16px; border-radius:6px; font-weight:bold; cursor:pointer; font-size:12px; box-shadow:0 2px 8px rgba(239,68,68,0.3);">
                  📋 Copy Not Done List for Chat
                </button>
              </div>
              </div>
            </div>

            <!-- Search & Filter Controls -->
            <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:12px; padding:16px; display:flex; gap:12px; flex-wrap:wrap; align-items:center; justify-content:space-between;">
              <input type="text" id="mercSearchInput" placeholder="🔍 Filter player name..." style="flex:1; min-width:200px; padding:10px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:14px;" onkeyup="window.filterMercTable()">
              
              <div style="display:flex; gap:6px;">
                <button id="mercFilterBtnAll" class="merc-filter-btn active" data-filter="all" onclick="window.setMercFilter('all')" style="padding:8px 14px; border-radius:8px; border:1px solid var(--border); background:var(--accent); color:white; font-weight:bold; cursor:pointer; font-size:13px;">All (${totalCount})</button>
                <button id="mercFilterBtnYes" class="merc-filter-btn" data-filter="yes" onclick="window.setMercFilter('yes')" style="padding:8px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-weight:bold; cursor:pointer; font-size:13px;">✅ Done (${yesCount})</button>
                <button id="mercFilterBtnNo" class="merc-filter-btn" data-filter="no" onclick="window.setMercFilter('no')" style="padding:8px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-weight:bold; cursor:pointer; font-size:13px;">❌ Not Done (${noCount})</button>
              </div>
            </div>

            <!-- Roster Table -->
            <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:12px; overflow:hidden;">
              <table style="width:100%; border-collapse:collapse; text-align:left; font-size:14px;">
                <thead>
                  <tr style="background:var(--bg-main); border-bottom:1px solid var(--border); color:var(--text-muted); font-size:12px; text-transform:uppercase;">
                    <th style="padding:12px 20px;">Chief Name</th>
                    <th style="padding:12px 20px; text-align:right;">Signup Status</th>
                  </tr>
                </thead>
                <tbody id="mercTableBody">
                  ${rosterList.map(p => {
                      let gIdStr = (p.gameId && p.gameId.toString().trim()) ? p.gameId.toString().trim() : (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : '');
                      let record = mercenaryData[gIdStr];
                      let isDone = record && record.signedUp;
                      return `
                        <tr class="merc-row" data-name="${escapeHTML((p.name || '').toLowerCase())}" data-gid="${gIdStr}" data-signed="${isDone ? 'yes' : 'no'}" style="border-bottom:1px solid var(--border);">
                          <td class="merc-name-cell" style="padding:14px 20px; font-weight:bold; color:var(--text-main); font-size:15px;">${escapeHTML(p.name)}</td>
                          <td style="padding:14px 20px; text-align:right;">
                            <button class="merc-toggle-btn" onclick="window.onMercToggle('${gIdStr}', this)" style="background:${isDone ? '#10b981' : 'rgba(239,68,68,0.15)'}; color:${isDone ? '#ffffff' : '#ef4444'}; border:${isDone ? 'none' : '1px solid rgba(239,68,68,0.4)'}; padding:6px 20px; border-radius:20px; font-weight:bold; cursor:pointer; font-size:13px; transition:0.2s; box-shadow:${isDone ? '0 2px 8px rgba(16,185,129,0.35)' : 'none'};">
                              ${isDone ? '✅ Done' : '❌ Not Done'}
                            </button>
                          </td>
                        </tr>
                      `;
                  }).join('')}
                </tbody>
              </table>
            </div>

          </div>
        `;

        app.innerHTML = html;
        window.mercMissingNames = missingNames;

        window.updateMercStatsUI = () => {
            let total = 0, yes = 0, no = 0;
            let missingList = [];

            document.querySelectorAll('.merc-row').forEach(row => {
                total++;
                const isSigned = row.getAttribute('data-signed') === 'yes';
                const pName = row.querySelector('.merc-name-cell')?.textContent || '';
                if (isSigned) {
                    yes++;
                } else {
                    no++;
                    if (pName) missingList.push(pName);
                }
            });

            const pct = total > 0 ? Math.round((yes / total) * 100) : 0;

            const elTotal = document.getElementById('mercStatTotal');
            const elYes = document.getElementById('mercStatYes');
            const elNo = document.getElementById('mercStatNo');
            const elPct = document.getElementById('mercStatPct');
            const elBtnAll = document.getElementById('mercFilterBtnAll');
            const elBtnYes = document.getElementById('mercFilterBtnYes');
            const elBtnNo = document.getElementById('mercFilterBtnNo');
            const elMissingCount = document.getElementById('mercMissingCountTitle');

            if (elTotal) elTotal.textContent = total;
            if (elYes) elYes.textContent = yes;
            if (elNo) elNo.textContent = no;
            if (elPct) elPct.textContent = `${pct}%`;
            if (elBtnAll) elBtnAll.textContent = `All (${total})`;
            if (elBtnYes) elBtnYes.textContent = `✅ Done (${yes})`;
            if (elBtnNo) elBtnNo.textContent = `❌ Not Done (${no})`;
            if (elMissingCount) elMissingCount.textContent = `(${missingList.length})`;
            window.mercMissingNames = missingList;
        };

        window.copyMissingMercenaryList = () => {
            const list = window.mercMissingNames || [];
            if (list.length === 0) {
                window.showToast("All members are Done — nothing to copy!", "info");
                return;
            }
            const text = "⚔️ Mercenary Prestige — Not Done Yet (" + list.length + "):\n" + list.join(", ");
            const doCopy = (txt) => {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(txt).then(() => window.showToast("Copied Not Done list to clipboard!", "success")).catch(() => fallback(txt));
                } else { fallback(txt); }
            };
            const fallback = (txt) => {
                const ta = document.createElement('textarea'); ta.value = txt;
                document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
                window.showToast("Copied Not Done list to clipboard!", "success");
            };
            doCopy(text);
        };

        window.onMercToggle = async (gameId, btnElement) => {
            const btn = btnElement || (event && (event.currentTarget || event.target));
            if (!btn || btn.disabled) return;

            const row = btn.closest('.merc-row');
            if (!row) return;

            const wasDone = row.getAttribute('data-signed') === 'yes';
            const willBeDone = !wasDone;

            // Optimistic in-place update
            btn.disabled = true;
            row.setAttribute('data-signed', willBeDone ? 'yes' : 'no');
            
            btn.style.background = willBeDone ? '#10b981' : 'rgba(239,68,68,0.15)';
            btn.style.color = willBeDone ? '#ffffff' : '#ef4444';
            btn.style.border = willBeDone ? 'none' : '1px solid rgba(239,68,68,0.4)';
            btn.style.boxShadow = willBeDone ? '0 2px 8px rgba(16,185,129,0.35)' : 'none';
            btn.innerHTML = willBeDone ? '✅ Done' : '❌ Not Done';

            window.updateMercStatsUI();
            window.filterMercTable();

            const ok = await window.toggleMercenaryStatus(gameId, willBeDone);
            btn.disabled = false;

            if (!ok) {
                // Revert on write error
                row.setAttribute('data-signed', wasDone ? 'yes' : 'no');
                btn.style.background = wasDone ? '#10b981' : 'rgba(239,68,68,0.15)';
                btn.style.color = wasDone ? '#ffffff' : '#ef4444';
                btn.style.border = wasDone ? 'none' : '1px solid rgba(239,68,68,0.4)';
                btn.style.boxShadow = wasDone ? '0 2px 8px rgba(16,185,129,0.35)' : 'none';
                btn.innerHTML = wasDone ? '✅ Done' : '❌ Not Done';
                window.updateMercStatsUI();
                window.filterMercTable();
                if (window.showToast) window.showToast("Failed to save done status", "error");
            }
        };

        window.mercCurrentFilter = 'all';

        window.setMercFilter = (filter) => {
            window.mercCurrentFilter = filter;
            document.querySelectorAll('.merc-filter-btn').forEach(b => {
                if (b.getAttribute('data-filter') === filter) {
                    b.style.background = 'var(--accent)';
                    b.style.color = 'white';
                } else {
                    b.style.background = 'var(--bg-main)';
                    b.style.color = 'var(--text-main)';
                }
            });
            window.filterMercTable();
        };

        window.filterMercTable = () => {
            const query = (document.getElementById('mercSearchInput')?.value || '').toLowerCase().trim();
            const filter = window.mercCurrentFilter || 'all';

            document.querySelectorAll('.merc-row').forEach(row => {
                const name = row.getAttribute('data-name');
                const gid = row.getAttribute('data-gid');
                const signed = row.getAttribute('data-signed');

                const matchesSearch = !query || name.includes(query) || gid.includes(query);
                const matchesFilter = (filter === 'all') || (filter === 'yes' && signed === 'yes') || (filter === 'no' && signed === 'no');

                if (matchesSearch && matchesFilter) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        };

    } catch(e) {
        app.innerHTML = '<div class="card"><div class="loading" style="color:var(--danger);">Error loading Mercenary Admin UI</div></div>';
        console.error(e);
    }
  },

  beartrap: async () => {
    if (!window.isAdminUser(currentUser)) {
      views.home();
      return;
    }
    const isUnlocked = await window.isGoogleAuthVerified();
    if (!isUnlocked) {
        views.admin();
        return;
    }
    
    // Fetch roster so datalist has everyone, not just registered users
    let rosterRawData = null;
    try {
      rosterRawData = await window.fetchRoster();
    } catch (e) {
      console.error("Failed to load roster for datalist", e);
    }
    
    await refreshIdToNameMap();
    let rosterOptionsHtml = '';
    let sortedRosterNames = Object.values(idToNameMap).filter((v, i, a) => a.indexOf(v) === i).sort((a,b) => a.localeCompare(b));
    sortedRosterNames.forEach(name => {
        rosterOptionsHtml += `<option value="${escapeHTML(name)}">${escapeHTML(name)}</option>`;
    });
    
    let datalistHtml = '<datalist id="beartrapRosterDatalist" style="display:none;">';
    for (const [id, name] of Object.entries(idToNameMap)) {
        datalistHtml += '<option value="' + id + '">' + name + '</option>';
        datalistHtml += '<option value="' + name + '">' + name + '</option>';
    }
    datalistHtml += '</datalist>';
    
    app.innerHTML = datalistHtml + `
      <div class="card" style="max-width:1200px; margin:0 auto; animation: fadeIn 0.3s ease; position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--border); padding-bottom:10px;">
          <h2 style="color:var(--accent); margin:0; display:flex; align-items:center; flex-wrap:wrap; gap:10px;">
            🐻 Multi-BT Donations
            <button onclick="views.bearTrapAdmin()" style="background:linear-gradient(135deg, #10b981, #059669); color:#fff; border:none; padding:5px 10px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px; margin-left:10px;">📊 BT Tracker</button>
            <button onclick="document.getElementById('btLookupModal').style.display='block'" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--accent); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">🔍 Lookup</button>
            <button onclick="document.getElementById('btCrownModal').style.display='block'" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--success); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">👑 Crown Winner</button>
            <button onclick="window.resetBearTrapEvent()" style="background:linear-gradient(135deg, #ef4444, #dc2626); color:#fff; border:none; padding:4px 10px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px; font-weight:bold; box-shadow:0 2px 8px rgba(239,68,68,0.3);">🔄 Reset BT Event</button>
            <button onclick="window.resetBearTrapWinners()" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--danger); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">🔄 Reset BT Winners</button>
            <button onclick="document.getElementById('btResetPlayerModal').style.display='block'; document.getElementById('btResetPlayerModalOverlay').style.display='block';" style="background:var(--card-bg); color:var(--text-main); border:1px solid var(--danger); padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">🗑️ Reset Player</button>
            <button onclick="window.openBtDbEditor()" style="background:var(--card-bg); color:var(--text-main); border:1px solid #8b5cf6; padding:4px 8px; border-radius:6px; cursor:pointer; font-size:12px; margin-left:10px;">🛠️ DB Editor</button>
          </h2>
          <button onclick="views.admin()" style="background:var(--bg-main); color:var(--text-main); border:1px solid var(--border); padding:5px 12px; border-radius:6px; cursor:pointer;">Back to Admin</button>
        </div>
        
        <!-- Quick Lookup Modal (Hidden by default) -->
        <div id="btLookupModal" style="display:none; position:absolute; top:50px; left:0; width:100%; background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid var(--accent); box-shadow:0 10px 25px rgba(0,0,0,0.5); z-index:10; box-sizing:border-box;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0; color:var(--text-main); font-size:16px;">🔍 Quick Lookup</h3>
            <button onclick="document.getElementById('btLookupModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:20px;">&times;</button>
          </div>
          <div style="display:flex; gap:10px;">
            <input type="text" id="beartrapLookup" list="beartrapRosterDatalist" placeholder="Player Name or ID..." style="flex:1; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
            <button onclick="window.doBeartrapLookup()" style="background:var(--accent); color:#fff; border:none; padding:0 20px; border-radius:6px; cursor:pointer; font-weight:bold;">Check</button>
          </div>
          <div id="beartrapLookupResult" style="margin-top:10px; font-weight:bold; text-align:center;"></div>
        </div>
        <!-- Crown Winner Modal (Hidden by default) -->
        <div id="btCrownModal" style="display:none; position:absolute; top:50px; left:0; width:100%; background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid var(--success); box-shadow:0 10px 25px rgba(0,0,0,0.5); z-index:10; box-sizing:border-box;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <h3 style="margin:0; color:var(--text-main); font-size:16px;">👑 Crown Winner</h3>
            <button onclick="document.getElementById('btCrownModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:20px;">&times;</button>
          </div>
          <div style="display:flex; flex-direction:column; gap:10px;">
            <input type="text" id="beartrapCrownName" list="beartrapRosterDatalist" placeholder="Player Name or ID..." style="padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
            <select id="beartrapCrownTrap" style="padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
              <option value="1">Bear Trap 1</option>
              <option value="2">Bear Trap 2</option>
            </select>
            <button onclick="window.doBeartrapCrown()" style="background:var(--success); color:#fff; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold;">Submit</button>
          </div>
        </div>
        
        <!-- Reset Player Modal Backdrop & Card -->
        <div id="btResetPlayerModalOverlay" onclick="document.getElementById('btResetPlayerModal').style.display='none'; this.style.display='none';" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); backdrop-filter:blur(5px); z-index:9998;"></div>
        <div id="btResetPlayerModal" style="display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); width:90%; max-width:420px; background:var(--card-bg); border:1px solid var(--danger); border-radius:16px; padding:24px; box-shadow:0 20px 50px rgba(0,0,0,0.8); z-index:100050; animation:fadeIn 0.2s ease;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--border); padding-bottom:12px;">
            <h3 style="margin:0; color:var(--danger); font-size:18px; display:flex; align-items:center; gap:8px;">
              🗑️ Reset Player Donations
            </h3>
            <button onclick="document.getElementById('btResetPlayerModal').style.display='none'; document.getElementById('btResetPlayerModalOverlay').style.display='none';" style="background:transparent; border:none; color:var(--text-muted); font-size:24px; cursor:pointer; padding:0; line-height:1;">&times;</button>
          </div>
          <p style="margin:0 0 16px 0; font-size:12px; color:var(--text-muted); line-height:1.4;">
            Select a player to wipe all Bear Trap donation entries back to 0.
          </p>
          <div style="display:flex; flex-direction:column; gap:12px;">
            <select id="beartrapResetPlayerName" style="padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:14px; font-weight:bold;">
              <option value="">-- Select Player to Reset --</option>
              ${rosterOptionsHtml}
            </select>
            <button onclick="window.doBeartrapResetPlayer()" style="background:linear-gradient(135deg, #ef4444, #dc2626); color:#fff; border:none; padding:12px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:14px; box-shadow:0 4px 12px rgba(239,68,68,0.3);">
              🔥 Wipe Player Donations to 0
            </button>
          </div>
          <div id="beartrapResetPlayerResult" style="margin-top:12px; font-weight:bold; text-align:center; font-size:13px;"></div>
        </div>
        
        <!-- Database Editor Modal (Hidden by default) -->
        <div id="btDbEditorModal" style="display:none; position:absolute; top:50px; left:0; width:100%; max-height:80vh; overflow-y:auto; background:var(--bg-main); padding:20px; border-radius:12px; border:1px solid #8b5cf6; box-shadow:0 10px 25px rgba(0,0,0,0.5); z-index:15; box-sizing:border-box;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; position:sticky; top:-20px; background:var(--bg-main); padding:10px 0; border-bottom:1px solid var(--border);">
            <h3 style="margin:0; color:var(--text-main); font-size:16px;">🛠️ Bear Trap Database Editor</h3>
            <button onclick="document.getElementById('btDbEditorModal').style.display='none'" style="background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:20px;">&times;</button>
          </div>
          <div id="btDbEditorContent" style="color:var(--text-main); font-size:13px;">
            <p style="text-align:center; color:var(--text-muted);">Loading database entries...</p>
          </div>
        </div>

        <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--border); margin-bottom:20px;">
          <h3 style="margin-top:0; color:var(--text-main); font-size:16px;">📝 Add Donations</h3>
          <div id="beartrapEntries">
            <div class="beartrap-row" style="display:flex; gap:10px; margin-bottom:10px;">
              <input type="text" class="bt-name" list="beartrapRosterDatalist" placeholder="Player Name or ID..." style="flex:2; min-width:0; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
              <input type="number" class="bt-amount" placeholder="Amount..." style="flex:1; min-width:0; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
              <button onclick="this.parentElement.remove()" style="background:var(--danger); color:#fff; border:none; width:40px; flex-shrink:0; border-radius:6px; cursor:pointer; font-weight:bold;">X</button>
            </div>
          </div>
          <div style="display:flex; gap:10px; margin-top:10px;">
            <button onclick="window.addBeartrapRow()" style="background:transparent; border:1px solid var(--border); color:var(--text-main); padding:10px; border-radius:6px; cursor:pointer; flex:1;">+ Add Row</button>
            <button id="submitBeartrapBtn" onclick="window.submitBeartrapDonations()" style="background:var(--success); border:none; color:#fff; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold; flex:2;">Submit All</button>
          </div>
          <div id="beartrapStatus" style="margin-top:15px; text-align:center; font-size:14px;"></div>
        </div>
        

        
        <div style="background:var(--bg-main); padding:15px; border-radius:12px; border:1px solid var(--border);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
             <h3 style="margin:0; color:var(--text-main); font-size:16px;">🕒 Admin Log</h3>
             <button onclick="window.loadBeartrapLog()" style="background:transparent; border:none; color:var(--accent); cursor:pointer; font-size:12px;">🔄 Refresh</button>
          </div>
          <div id="beartrapLog" style="max-height:200px; overflow-y:auto; font-size:13px; color:var(--text-muted);">
            Loading...
          </div>
        </div>

      </div>
      </div>
    `;
    
    // Bind autocomplete to initial inputs
    const lookupInput = document.getElementById('beartrapLookup');
    if (lookupInput) window.bindCustomAutocomplete(lookupInput);
    
    const crownInput = document.getElementById('beartrapCrownName');
    if (crownInput) window.bindCustomAutocomplete(crownInput);
    
    const initialRows = document.querySelectorAll('.bt-name');
    initialRows.forEach(input => window.bindCustomAutocomplete(input));

    // Attach global functions to window so inline onclick can see them
    window.addBeartrapRow = () => {
      const cont = document.getElementById('beartrapEntries');
      const div = document.createElement('div');
      div.className = 'beartrap-row';
      div.style.cssText = 'display:flex; gap:10px; margin-bottom:10px;';
      div.innerHTML = `
        <input type="text" class="bt-name" list="beartrapRosterDatalist" placeholder="Player Name or ID..." style="flex:2; min-width:0; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
        <input type="number" class="bt-amount" placeholder="Amount..." style="flex:1; min-width:0; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
        <button onclick="this.parentElement.remove()" style="background:var(--danger); color:#fff; border:none; width:40px; flex-shrink:0; border-radius:6px; cursor:pointer; font-weight:bold;">X</button>
      `;
      cont.appendChild(div);
      const newNameInput = div.querySelector('.bt-name');
      window.bindCustomAutocomplete(newNameInput);
      newNameInput.focus();
    };

    window.doBeartrapLookup = async () => {
      const name = document.getElementById('beartrapLookup').value.trim();
      const resDiv = document.getElementById('beartrapLookupResult');
      if (!name) return;
      resDiv.innerHTML = '<span style="color:var(--text-muted)">Searching...</span>';
      try {
        const res = await fetch(`${API_BASE_URL}?api=lookup&name=${encodeURIComponent(name)}`).then(r => r.json());
        if (res.success) {
          resDiv.innerHTML = `<span style="color:var(--success)">${res.name} Total: ${res.total}</span>`;
        } else {
          resDiv.innerHTML = `<span style="color:var(--danger)">${res.message}</span>`;
        }
      } catch {
        resDiv.innerHTML = `<span style="color:var(--danger)">Network error.</span>`;
      }
    };

        window.autoSyncBtSignup = async (playerNameOrGid) => {
    if (!playerNameOrGid) return;
    try {
        let gameId = null;
        let pName = playerNameOrGid.toString().trim();
        
        if (!isNaN(pName) && pName.length >= 7) {
            gameId = pName;
        } else {
            for (const [gid, name] of Object.entries(idToNameMap)) {
                if (name.toLowerCase() === pName.toLowerCase()) {
                    gameId = gid; break;
                }
            }
        }

        if (gameId) {
            await set(ref(db, `beartrap/${gameId}/signedUp`), true);
        }
    } catch(e) {
        console.warn("Could not auto-sync Bear Trap signup:", e);
    }
};

window.resetBearTrapEvent = async () => {
    if (!confirm("⚠️ Are you sure you want to RESET the entire Bear Trap Event?\n\nThis will:\n1. Archive current donations into all-time totals\n2. Reset current donations to 0\n3. Reset all signups to NO\n4. Reset champions to Pending...")) return;

    if (window.showToast) window.showToast("Resetting Bear Trap Event...", "info");

    try {
        const [donSnap, btSnap] = await Promise.all([
            get(ref(db, 'beartrap_donations')),
            get(ref(db, 'beartrap'))
        ]);

        if (donSnap.exists()) {
            const dons = donSnap.val();
            for (const [key, don] of Object.entries(dons)) {
                if (don) {
                    const currentAmt = don.current || 0;
                    don.allTime = (don.allTime || 0) + currentAmt;
                    don.current = 0;
                    don.lastUpdated = Date.now();
                    await set(ref(db, `beartrap_donations/${key}`), don);
                }
            }
        }

        if (btSnap.exists()) {
            const bts = btSnap.val();
            for (const key of Object.keys(bts)) {
                await set(ref(db, `beartrap/${key}/signedUp`), false);
            }
        }

        await Promise.all([
            set(ref(db, 'beartrap_wins/1'), { name: "Pending...", score: 0 }),
            set(ref(db, 'beartrap_wins/2'), { name: "Pending...", score: 0 })
        ]);

        window.logAdminAction("Bear Trap Full Event Reset", "Archived current donations, reset scores to 0, cleared signups to NO, and reset champions to Pending...", "All Players");

        if (window.showToast) window.showToast("✅ Bear Trap Event successfully reset!", "success");

        if (window.location.hash.includes('beartrap') || document.getElementById('beartrapEntries')) {
            if (views.beartrap) views.beartrap();
        } else if (views.bearTrapAdmin) {
            views.bearTrapAdmin();
        }

    } catch (e) {
        console.error("Reset Event Error:", e);
        if (window.showToast) window.showToast("Error resetting event: " + e.message, "error");
    }
};

    window.submitBeartrapDonations = async () => {
      const rows = document.querySelectorAll('.beartrap-row');
      const entries = [];
      rows.forEach(r => {
        const name = r.querySelector('.bt-name').value.trim();
        const amt = r.querySelector('.bt-amount').value.trim();
        if (name && amt) entries.push({name, amount: amt});
      });
      
      const statusDiv = document.getElementById('beartrapStatus');
      const submitBtn = document.getElementById('submitBeartrapBtn');
      if (entries.length === 0) {
         statusDiv.innerHTML = '<span style="color:var(--danger)">No entries to submit.</span>';
         return;
      }
      
      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';
      statusDiv.innerHTML = `<span style="color:var(--text-muted)">Processing ${entries.length} entries...</span>`;
      
      const adminName = (currentUser && currentUser.gameId && idToNameMap[currentUser.gameId]) ? idToNameMap[currentUser.gameId] : "Admin";
      
      let completed = 0;
      let resultsHTML = "<div style='text-align:left; background:rgba(16,185,129,0.1); border:1px solid rgba(16,185,129,0.3); padding:10px; border-radius:6px; color:var(--success); font-size:13px;'><strong>Results:</strong><br>";
      let processedSummaries = [];

      for (const entry of entries) {
         try {
           const addAmt = Number(entry.amount) || 0;
           
           let finalName = entry.name;
           if (!isNaN(entry.name) && entry.name.length >= 7) {
               if (idToNameMap[entry.name]) finalName = idToNameMap[entry.name];
           }

           const donKey = finalName.toLowerCase().replace(/[^a-z0-9]/g, '_');
           const donRef = ref(db, `beartrap_donations/${donKey}`);
           const donSnap = await get(donRef);
           let donData = donSnap.val() || { name: finalName, current: 0, allTime: 0 };
           donData.name = finalName;
           donData.current = (donData.current || 0) + addAmt;
           donData.allTime = (donData.allTime || 0) + addAmt;
           donData.lastUpdated = Date.now();
           await set(donRef, donData);
           if (addAmt > 0) await window.autoSyncBtSignup(finalName);

           const donToken = await getAuthToken();
           fetch(`${API_BASE_URL}?api=addDonation&name=${encodeURIComponent(finalName)}&amount=${encodeURIComponent(entry.amount)}&admin=${encodeURIComponent(adminName)}&token=${encodeURIComponent(donToken)}`).catch(() => null);
           
           processedSummaries.push(`${finalName} (+${addAmt.toLocaleString()} ➔ New Total: ${donData.current.toLocaleString()})`);
           resultsHTML += `✅ <b>${finalName}</b>: +${addAmt.toLocaleString()} (New Current Total: ${donData.current.toLocaleString()})<br>`;
         } catch(e) {
           resultsHTML += `❌ <b>${entry.name}</b>: Error updating donation: ${e.message}<br>`;
         }
         completed++;
         statusDiv.innerHTML = `<span style="color:var(--text-muted)">Processed ${completed} of ${entries.length}...</span>`;
      }
      
      resultsHTML += "</div>";
      statusDiv.innerHTML = resultsHTML;

      const playerSummary = processedSummaries.length > 0 ? processedSummaries.join(', ') : entries.map(e => `${e.name} (+${Number(e.amount).toLocaleString()})`).join(', ');
      window.logAdminAction("Bear Trap Donations Added", `Added multi-donation batch for ${entries.length} player(s)`, playerSummary);
      
      // Reset form
      const cont = document.getElementById('beartrapEntries');
      if (cont) {
          cont.innerHTML = `
            <div class="beartrap-row" style="display:flex; gap:10px; margin-bottom:10px;">
              <input type="text" class="bt-name" list="beartrapRosterDatalist" placeholder="Player Name..." style="flex:2; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
              <input type="number" class="bt-amount" placeholder="Amount..." style="flex:1; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--card-bg); color:var(--text-main);">
              <button onclick="this.parentElement.remove()" style="background:var(--danger); color:#fff; border:none; width:40px; border-radius:6px; cursor:pointer; font-weight:bold;">X</button>
            </div>
          `;
      }
      
      if (window.loadBeartrapLog) window.loadBeartrapLog();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit All';
    };

    window.loadBeartrapLog = async () => {
      const logDiv = document.getElementById('beartrapLog');
      if (!logDiv) return;
      logDiv.innerHTML = '<span style="color:var(--text-muted)">Loading Firebase logs...</span>';
      
      try {
        const fbSnap = await get(ref(db, 'admin_logs'));
        if (fbSnap.exists() && fbSnap.val()) {
          const logsData = fbSnap.val();
          const btLogs = Object.values(logsData)
            .filter(item => {
              if (!item || !item.action) return false;
              const act = item.action.toLowerCase();
              const det = (item.details || '').toLowerCase();
              return act.includes('bear trap') || act.includes('beartrap') || act.includes('bt') || det.includes('bear trap');
            })
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

          if (btLogs.length > 0) {
            let html = '';
            btLogs.slice(0, 40).forEach(log => {
              let badgeColor = 'var(--accent)';
              if (log.action.includes('Reset') || log.action.includes('Wipe')) badgeColor = 'var(--danger)';
              else if (log.action.includes('Crown')) badgeColor = '#FFD700';
              else if (log.action.includes('Donation')) badgeColor = 'var(--success)';

              const timeDisplay = log.dateStr ? `${log.dateStr} ${log.timeStr || ''}` : new Date(log.timestamp).toLocaleString();
              
              const targetHtml = log.target ? `<span style="color:#FFD700; font-weight:bold; font-size:12px;">(${log.target})</span>` : '';

              html += `
                <div style="padding:10px 0; border-bottom:1px solid var(--border);">
                  <div style="color:var(--text-main); font-weight:bold; font-size:13px; display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    <span style="background:rgba(255,255,255,0.05); border:1px solid ${badgeColor}; color:${badgeColor}; padding:2px 8px; border-radius:4px; font-size:11px;">${log.action}</span>
                    <span>${log.details}</span>
                    ${targetHtml}
                  </div>
                  <div style="font-size:11px; color:var(--text-muted); margin-top:4px;">
                    ${timeDisplay} • By <span style="color:var(--accent); font-weight:bold;">${log.admin || log.email || 'Admin'}</span>
                  </div>
                </div>
              `;
            });
            logDiv.innerHTML = html;
          } else {
            logDiv.innerHTML = '<span style="color:var(--text-muted)">No Bear Trap activity logged yet.</span>';
          }
        } else {
          logDiv.innerHTML = '<span style="color:var(--text-muted)">No activity logged yet.</span>';
        }
      } catch (e) {
        console.error("Error reading Bear Trap Firebase logs:", e);
        logDiv.innerHTML = `<span style="color:var(--danger)">Error loading logs: ${e.message}</span>`;
      }
    };

    window.loadBeartrapLog();
  },
  
  playerEditor: async () => {
    if (!window.isAdminUser(currentUser)) {
      views.home();
      return;
    }
    const isUnlocked = await window.isGoogleAuthVerified();
    if (!isUnlocked) {
        views.admin();
        return;
    }
    
    let rosterRawData = null;
    let usersSnap = null;
    try {
      const results = await Promise.all([
        window.fetchRoster(),
        get(ref(db, 'users'))
      ]);
      rosterRawData = results[0];
      usersSnap = results[1];
    } catch (e) {
      console.error("Failed to load data for player editor", e);
    }
    
    const users = usersSnap ? (usersSnap.val() || {}) : {};
    const registeredGameIds = new Set();
    Object.values(users).forEach(u => {
        if (u.gameId) registeredGameIds.add(u.gameId.toString().trim());
    });
    
    const players = [];
    if (rosterRawData) { Object.values(rosterRawData).forEach(p => { if (p.name) players.push(p.name); }); }
    
    await refreshIdToNameMap();
    players.sort((a, b) => a.localeCompare(b));
    
    let dropdownItems = [];
    players.forEach((p) => {
      let name = p.toString().trim();
      let gid = window.nameToIdMap[name];
      let isRegistered = gid ? window.enrolledGameIds.has(gid.toString().trim()) : false;
      dropdownItems.push({ name: name, isReg: isRegistered, nt: /^[ -~]*$/.test(name) ? 'notranslate' : '' });
    });

    app.innerHTML = `
      <div class="card" style="max-width:800px; margin:0 auto; animation: fadeIn 0.3s ease; position:relative; min-height: 80vh;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--border); padding-bottom:10px;">
          <h2 style="color:var(--accent); margin:0; display:flex; align-items:center; gap:10px;">
            👤 Player Database Editor
          </h2>
          <div style="display:flex; gap:10px; align-items:center;">
            <button onclick="window.openAddPlayerModal()" style="background:var(--success); color:white; border:none; padding:8px 14px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:13px; box-shadow:0 2px 8px rgba(16,185,129,0.3);">➕ Add New Player</button>
            <button onclick="views.admin()" style="background:var(--bg-main); color:var(--text-main); border:1px solid var(--border); padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold;">◀ Back</button>
          </div>
        </div>
        
        <div style="display:flex; gap:10px; margin-bottom:20px;">
          <div style="position:relative; flex:1; display:flex; align-items:center;">
            <input type="text" id="uniSearchInput" placeholder="Search Chief Name..." autocomplete="off" style="width:100%; padding:14px 40px 14px 16px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:16px; font-weight:bold; cursor:text; box-sizing:border-box; position:relative; z-index:101;">
            <button onclick="document.getElementById('uniSearchInput').value=''; window.searchPlayerFull(''); document.getElementById('uniSearchInput').focus();" style="position:absolute; right:12px; background:transparent; border:none; color:var(--danger); font-size:20px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; width:30px; height:30px; padding:0; border-radius:50%; z-index:102;" onmouseover="this.style.background='rgba(239,68,68,0.1)'" onmouseout="this.style.background='transparent'">✖</button>
            <div id="uniSearchCustomDropdown" style="display:none; position:absolute; top:calc(100% - 8px); left:0; width:100%; max-height:300px; overflow-y:auto; background:var(--card-bg); border:1px solid var(--border); border-radius:0 0 8px 8px; z-index:100; box-shadow:0 10px 30px rgba(0,0,0,0.6); flex-direction:column; padding-top:8px;"></div>
          </div>
          <button onclick="window.searchPlayerFull(document.getElementById('uniSearchInput').value)" style="background:var(--accent); color:#fff; border:none; padding:0 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px;">Search</button>
        </div>
        
        <div id="uniEditorRes" style="display:none; flex-direction:column; gap:16px; border-top:1px solid var(--border); padding-top:20px;">
           <!-- Populated by JS -->
        </div>
      </div>
    `;
    
    // Hide navbar on mobile for a clean, full-screen editor experience
    if (window.innerWidth <= 768) {
        const navbar = document.querySelector('.navbar');
        if (navbar) navbar.style.display = 'none';
    }
    
    // Bind logic for custom autocomplete
    const searchInput = document.getElementById('uniSearchInput');
    const dropdown = document.getElementById('uniSearchCustomDropdown');
    
    const filterAndShowDropdown = () => {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
            dropdown.style.display = 'none';
            return;
        }
        
        const matches = dropdownItems.filter(item => item.name.toLowerCase().includes(query)).slice(0, 50);
        
        if (matches.length === 0) {
            dropdown.innerHTML = `<div style="padding:12px; color:var(--text-muted); text-align:center; font-size:14px;">No matches found.</div>`;
        } else {
            dropdown.innerHTML = matches.map(item => `
                <div class="uni-dropdown-item ${item.nt}" data-value="${item.name}" style="padding:12px 15px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05); color:var(--text-main); font-weight:bold; font-size:15px; display:flex; align-items:center; gap:8px; transition:0.2s;">
                    ${item.isReg ? '<span style="color:var(--success); font-size:12px;">✅</span> ' : ''}${window.escapeHTML(item.name)}
                </div>
            `).join('');
            
            dropdown.querySelectorAll('.uni-dropdown-item').forEach(el => {
                el.addEventListener('mouseover', () => el.style.background = 'var(--bg-main)');
                el.addEventListener('mouseout', () => el.style.background = 'transparent');
                el.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    searchInput.value = el.getAttribute('data-value');
                    dropdown.style.display = 'none';
                    window.searchPlayerFull(searchInput.value);
                });
            });
        }
        dropdown.style.display = 'flex';
    };
    
    searchInput.addEventListener('input', filterAndShowDropdown);
    searchInput.addEventListener('focus', filterAndShowDropdown);
    searchInput.addEventListener('blur', () => { setTimeout(() => dropdown.style.display = 'none', 150); });
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        dropdown.style.display = 'none';
        window.searchPlayerFull(e.target.value);
      }
    });
  },

  account: async () => {
    if (!currentUser) {
      views.home();
      return;
    }
    
    let linkedHtml = '';
    let links = currentUser.linkedGameIds || [];
      
    linkedHtml += `
      <div style="text-align:left; border-top:1px solid var(--border); padding-top:20px; margin-top:20px;">
         <details style="background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid var(--border); padding:10px; cursor:pointer;" class="alt-accounts-details">
             <summary style="font-weight:bold; font-size:18px; color:var(--text-main); outline:none; display:flex; align-items:center; justify-content:space-between;">
                 <div style="display:flex; align-items:center; gap:8px;">
                     🔗 Linked Alt Accounts <span style="font-size:14px; color:var(--text-muted); font-weight:normal;">(${links.length})</span>
                 </div>
                 <span class="alt-accounts-arrow" style="font-size:14px; transition:transform 0.3s ease;">▼</span>
             </summary>
             
             <style>
                 .alt-accounts-details[open] .alt-accounts-arrow {
                     transform: rotate(180deg);
                 }
             </style>`;
         
    if (links.length > 0) {
        linkedHtml += `<div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap:16px; margin-top:15px; margin-bottom:15px; cursor:default;">`;
        links.forEach(gid => {
              let altName = idToNameMap[gid] || `Game ID: ${gid}`;
              let flVal = 'N/A';
              let timeActiveVal = 'Unknown';
              const rosterData = window.liveData["Chief's List"];
              let foundInRoster = false;
              if (rosterData && rosterData.length > 1) {
                  for (let i = 1; i < rosterData.length; i++) {
                      if (rosterData[i][1] && rosterData[i][1].toString().trim() === gid.toString().trim()) {
                          foundInRoster = true;
                          flVal = rosterData[i][2] || 'N/A';
                          timeActiveVal = rosterData[i][5] ? window.formatTimeActiveShort(rosterData[i][5].toString()) : 'Unknown';
                          break;
                      }
                  }
              }
              
              let flSpanId = `alt-fl-${gid}`;
              
              if (!foundInRoster) {
                  setTimeout(async () => {
                      try {
                          const res = await fetch(`${VERIFY_PROXY_URL}?id=${encodeURIComponent(gid)}`);
                          const data = await res.json();
                          if (data.success && data.stove_lv) {
                              const flEl = document.getElementById(flSpanId);
                              if (flEl) flEl.innerHTML = window.getFurnaceIconHtml(data.stove_lv);
                          }
                      } catch(e) { console.error(e); }
                  }, 100);
              }
              
              linkedHtml += `
              <div style="background:rgba(15,23,42,0.6); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.1); border-radius:24px; padding:24px; box-shadow:0 10px 30px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1); display:flex; flex-direction:column; justify-content:space-between;">
                  
                  <!-- Top row: avatar + name + action buttons -->
                  <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                      <div style="display:flex; gap:16px; align-items:center;">
                          <!-- Avatar (clickable to upload) -->
                          <div style="width:70px; height:70px; border-radius:50%; border:2px solid #06b6d4; box-shadow:0 0 15px rgba(6,182,212,0.5); overflow:hidden; background:var(--bg-secondary); position:relative; cursor:pointer; flex-shrink:0;" onclick="window._uploadTargetId='${gid}'; document.getElementById('avatarUploadInput').click();" title="Change Alt Avatar">
                              <img id="altAvatarImg-${gid}" src="${avatarMap[gid] || `images/${altName}.png`}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
                              <div id="altAvatarFallback-${gid}" style="display:none; align-items:center; justify-content:center; width:100%; height:100%; font-size:24px; font-weight:bold; color:#fff;">${altName.charAt(0).toUpperCase()}</div>
                              <div style="position:absolute; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'"><span style="font-size:18px;">✏️</span></div>
                          </div>
                          <div style="display:flex; flex-direction:column; justify-content:center;">
                              <span style="font-size:18px; font-weight:600; color:#ffffff; line-height:1.2;">${altName}</span>
                              <span style="font-size:13px; color:#94a3b8; margin-top:4px;">ID: ${gid}</span>
                          </div>
                      </div>
                      <!-- Action buttons (enroll/unlink) -->
                      ${ (() => {
          let isAltEnrolled = false;
          const gcb = window.liveData['giftcodebot'];
          if (gcb && gcb.length > 1) {
              for (let i = 1; i < gcb.length; i++) {
                  if (gcb[i] && gcb[i][2] && gcb[i][2].toString().trim() === gid.toString().trim()) {
                      isAltEnrolled = true;
                      break;
                  }
              }
          }
          if (isAltEnrolled || enrolledGameIds.has(gid.toString())) {
              return `<div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end; flex-shrink:0;">
                  <span style="border:1px solid #10b981; color:#10b981; background:rgba(16,185,129,0.1); border-radius:9999px; padding:4px 12px; font-size:12px; font-weight:500; display:inline-flex; align-items:center; gap:6px;">&#x2705; Enrolled</span>
                  <button onclick="window.unlinkAltAccountPrompt('${gid}')" style="border:1px solid #f87171; color:#f87171; border-radius:8px; padding:6px 12px; font-size:12px; font-weight:600; cursor:pointer; background:transparent; transition:background 0.2s;" onmouseover="this.style.background='rgba(248,113,113,0.1)'" onmouseout="this.style.background='transparent'">UNLINK</button>
              </div>`;
          } else {
              return `<div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end; flex-shrink:0;">
                  <button onclick="window.openAltPerksModal('${gid}', '${altName.replace(/'/g, "\\'")}')" style="background:rgba(16,185,129,0.15); border:1px solid #10b981; color:#10b981; border-radius:8px; padding:6px 12px; font-size:12px; font-weight:600; cursor:pointer; transition:background 0.2s;" onmouseover="this.style.background='rgba(16,185,129,0.25)'" onmouseout="this.style.background='rgba(16,185,129,0.15)'">&#x1F381; Enable Perks</button>
                  <button onclick="window.unlinkAltAccountPrompt('${gid}')" style="border:1px solid #f87171; color:#f87171; border-radius:8px; padding:6px 12px; font-size:12px; font-weight:600; cursor:pointer; background:transparent; transition:background 0.2s;" onmouseover="this.style.background='rgba(248,113,113,0.1)'" onmouseout="this.style.background='transparent'">UNLINK</button>
              </div>`;
          }
        })() }
                  </div>

                  <!-- Bottom stats row: Furnace Level + Time Active -->
                  <div style="margin-top:20px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.05); border-radius:16px; padding:16px; display:flex; justify-content:space-between; align-items:center;">
                      <div style="display:flex; align-items:center; gap:12px;">
                          <svg style="width:24px; height:24px; color:#f97316; flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
                          <div style="display:flex; flex-direction:column;">
                              <span id="${flSpanId}" style="font-size:18px; font-weight:bold; color:#ffffff; line-height:1; display:flex; align-items:center;">${(() => { const raw = window.getFurnaceIconHtml(flVal); return raw.startsWith('<img') ? raw : (flVal === 'N/A' ? 'N/A' : flVal); })()}</span>
                              <span style="font-size:11px; color:#94a3b8; margin-top:4px; text-transform:uppercase; letter-spacing:0.5px;">Furnace Level</span>
                          </div>
                      </div>
                      <div style="display:flex; align-items:center; gap:12px;">
                          <svg style="width:24px; height:24px; color:#06b6d4; flex-shrink:0;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <div style="display:flex; flex-direction:column;">
                              <span style="font-size:16px; font-weight:bold; color:#ffffff; line-height:1;">${timeActiveVal}</span>
                              <span style="font-size:11px; color:#94a3b8; margin-top:4px; text-transform:uppercase; letter-spacing:0.5px;">Time Active</span>
                          </div>
                      </div>
                  </div>

              </div>`;
          });
          linkedHtml += `</div>`;
      }
      
      linkedHtml += `</details></div>`;
      
      let datalistHtml = `<datalist id="rosterAltDatalist" style="display:none;">`;
      for (const [id, name] of Object.entries(idToNameMap)) {
          if (id !== currentUser.gameId && !links.includes(id)) {
              datalistHtml += `<option value="${id}">${name}</option>`;
          }
      }
      datalistHtml += `</datalist>`;

      linkedHtml += `
      <div id="linkAltForm" style="display:none; background:var(--card-bg); padding:15px; border-radius:8px; border:1px solid var(--border); margin-bottom:15px;">
          <input type="text" id="altGameIdInput" list="rosterAltDatalist" placeholder="Search Alt Name or Game ID..." style="width:100%; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); margin-bottom:10px;">
          ${datalistHtml}
          <div id="altChiefConfirm" style="font-size:13px; margin-bottom:10px; display:none;"></div>
          <div style="display:flex; gap:10px;">
              <button id="cancelAltBtn" style="flex:1; background:transparent; border:1px solid var(--border); color:var(--text-muted); padding:8px; border-radius:6px; cursor:pointer;">Cancel</button>
              <button id="submitAltBtn" style="flex:1; background:var(--accent); color:#fff; border:none; padding:8px; border-radius:6px; cursor:pointer; font-weight:bold;">Confirm Link</button>
          </div>
      </div>
      <button id="openLinkAltBtn" style="background:rgba(52,152,219,0.1); color:var(--accent); border:1px dashed var(--accent); padding:10px; border-radius:8px; cursor:pointer; font-weight:bold; width:100%; transition:0.2s;" onmouseover="this.style.background='rgba(52,152,219,0.2)'" onmouseout="this.style.background='rgba(52,152,219,0.1)'">+ Link ${links.length > 0 ? 'Another' : 'Alt'} Account</button>`;
      
      linkedHtml += `</div>`;
      
      let currentChiefName = idToNameMap[currentUser.gameId] || `Unknown Chief`;
      
      let adminBadgeHtml = '';
      let accLevel = window.getAdminLevel(currentUser);
      if (accLevel) {
          let lvlColor = (accLevel === "R5") ? "#FFD700" : "var(--accent)";
          let lvlBg = (accLevel === "R5") ? "rgba(255,215,0,0.1)" : "rgba(52,152,219,0.1)";
          adminBadgeHtml = `<span style="font-size:12px; color:${lvlColor}; background:${lvlBg}; border:1px solid ${lvlBg}; padding:2px 6px; border-radius:6px; font-weight:bold; display:inline-flex; align-items:center; gap:4px; margin-left:10px; vertical-align:middle; text-shadow:none;">👑 ${accLevel}</span>`;
      }
      
      let isMainEnrolled = false;
      let joinedDateStr = "N/A";
      let timeActiveStr = "N/A";
      let furnaceLevelStr = "N/A";
      
      const gcb = window.liveData['giftcodebot'];
      if (gcb && gcb.length > 1) {
          for (let i = 1; i < gcb.length; i++) {
              if (gcb[i] && gcb[i][2] && gcb[i][2].toString().trim() === currentUser.gameId.toString().trim()) {
                  isMainEnrolled = true;
                  if (gcb[i][3]) {
                      try {
                          const d = new Date(gcb[i][3]);
                          if (!isNaN(d)) joinedDateStr = d.toLocaleDateString();
                      } catch(e) { console.error(e); }
                  }
                  break;
              }
          }
      }
      

      const rosterRawData = await window.fetchRoster();
      if (rosterRawData) {
          const p = Object.values(rosterRawData).find(rp => rp.name && rp.name.toLowerCase() === currentChiefName.toLowerCase());
          if (p) {
              if (p.furnaceLevel) furnaceLevelStr = p.furnaceLevel.toString();
              if (p.joinedDate) {
                  try {
                      const d = new Date(p.joinedDate);
                      if (!isNaN(d)) joinedDateStr = d.toLocaleDateString();
                  } catch(e) { console.error(e); }
              }
              if (p.timeActive) timeActiveStr = window.formatTimeActiveShort(p.timeActive.toString());
          }
      }

      const avatarSrc = avatarMap[currentUser.gameId] || `images/${currentChiefName}.png`;
      const isEnrolled = isMainEnrolled || enrolledGameIds.has(currentUser.gameId.toString());

      const botStatusHtml = isEnrolled 
          ? `<div style="background:rgba(16,185,129,0.1); border:1px solid var(--success); color:var(--success); padding:8px 16px; border-radius:8px; font-weight:bold; font-size:14px; display:inline-flex; align-items:center; gap:8px;">&#x2705; Active Bot Link</div>`
          : `<div style="background:rgba(239,68,68,0.1); border:1px solid var(--danger); color:var(--danger); padding:8px 16px; border-radius:8px; font-weight:bold; font-size:14px; display:inline-flex; align-items:center; gap:8px;">&#x274C; No Bot Link</div>`;
          
      let staffProfileHtml = '';
      if (accLevel) { // Only show to admins
          let p = window.staffProfilesMap && window.staffProfilesMap[currentUser.gameId] ? window.staffProfilesMap[currentUser.gameId] : {department:'', timezone:'', bio:''};
          staffProfileHtml = `
          <div style="margin-bottom:20px;">
              <button id="openStaffProfileBtn" style="background:linear-gradient(90deg, var(--accent), #0284c7); color:#fff; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:bold; font-size:15px; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 15px rgba(6,182,212,0.3); transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(6,182,212,0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(6,182,212,0.3)'">
                  🛡️ Edit Staff Profile
              </button>
          </div>
          
          <div id="staffProfileModal" style="display:none; position:fixed; inset:0; background:rgba(15,23,42,0.9); backdrop-filter:blur(10px); z-index:99999; align-items:center; justify-content:center;">
              <div class="modal-content card" style="width:90%; max-width:500px; background:var(--bg-main); border:1px solid rgba(56,189,248,0.3); padding:25px; border-radius:12px; box-shadow:0 10px 40px rgba(0,0,0,0.5); text-align:left;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
                      <h3 style="margin:0; color:var(--text-main); font-size:20px; font-weight:bold;">🛡️ Staff Profile</h3>
                      <button id="closeStaffProfileBtn" style="background:none; border:none; color:var(--text-muted); font-size:28px; cursor:pointer; line-height:1; transition:color 0.2s;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='var(--text-muted)'">&times;</button>
                  </div>
                  <p style="font-size:13px; color:var(--text-muted); margin-bottom:20px;">This information will be displayed publicly on the Staff page.</p>
                  
                  <div style="display:flex; flex-direction:column; gap:15px;">
                      <div>
                          <label style="display:block; font-size:13px; font-weight:bold; color:var(--text-main); margin-bottom:6px;">Department / Specialty</label>
                          <textarea id="staffDeptInput" placeholder="e.g. Event Coordinator, Bear Trap Manager" style="width:100%; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--bg-secondary); color:var(--text-main); font-size:14px; box-sizing:border-box; resize:vertical; min-height:50px;">${window.escapeHTML(p.department || '')}</textarea>
                      </div>
                      <div>
                          <label style="display:block; font-size:13px; font-weight:bold; color:var(--text-main); margin-bottom:6px;">Timezone</label>
                          <input type="text" id="staffTzInput" placeholder="e.g. EST" value="${window.escapeHTML(p.timezone || '')}" style="width:100%; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--bg-secondary); color:var(--text-main); font-size:14px; box-sizing:border-box;">
                      </div>
                      <div>
                          <label style="display:block; font-size:13px; font-weight:bold; color:var(--text-main); margin-bottom:6px;">Location</label>
                          <input type="text" id="staffLocInput" placeholder="e.g. Texas, USA" value="${window.escapeHTML(p.location || '')}" style="width:100%; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--bg-secondary); color:var(--text-main); font-size:14px; box-sizing:border-box;">
                      </div>
                      <div>
                          <label style="display:block; font-size:13px; font-weight:bold; color:var(--text-main); margin-bottom:6px;">Bio / Tagline</label>
                          <textarea id="staffBioInput" placeholder="A short fun quote..." style="width:100%; padding:10px; border-radius:6px; border:1px solid var(--border); background:var(--bg-secondary); color:var(--text-main); font-size:14px; box-sizing:border-box; resize:vertical; min-height:80px;">${window.escapeHTML(p.bio || '')}</textarea>
                      </div>
                      <button id="saveStaffProfileBtn" style="background:var(--accent); color:#fff; border:none; padding:12px; border-radius:6px; cursor:pointer; font-weight:bold; margin-top:10px; font-size:15px; transition:0.2s;" onmouseover="this.style.opacity='0.9'" onmouseout="this.style.opacity='1'">Save Profile</button>
                  </div>
              </div>
          </div>
          `;
      }
    
    app.innerHTML = `
      <div id="accountHubView" class="card" style="max-width:600px; margin:0 auto; text-align:center;">
        <h2 style="color:var(--text-main); margin-top:0;">Account Hub</h2>
        
        <!-- Premium ID Card -->
        <div class="id-card-container" style="position:relative; box-sizing:border-box; width:100%; max-width:400px; margin:0 auto 30px auto; background:linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.95)); border:1px solid rgba(56,189,248,0.3); border-radius:16px; box-shadow:0 10px 40px rgba(0,0,0,0.5), inset 0 0 20px rgba(56,189,248,0.1); overflow:hidden; backdrop-filter:blur(10px); text-align:left;">
            
            <!-- Glowing accent line at top -->
            <div style="position:absolute; top:0; left:0; width:100%; height:4px; background:var(--accent); box-shadow:0 0 10px var(--accent);"></div>
            
            <div class="id-card-header" style="display:flex; align-items:center; margin-bottom:15px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:15px; position:relative; z-index:2;">
                <div class="id-card-avatar" style="border-radius:12px; overflow:hidden; border:2px solid var(--accent); box-shadow:0 4px 15px rgba(0,0,0,0.3); background:var(--bg-secondary); flex-shrink:0; cursor:pointer; position:relative;" onclick="window._uploadTargetId='${currentUser.gameId}'; document.getElementById('avatarUploadInput').click();" title="Change Profile Picture">
                    <img id="accountHubAvatarImg" src="${avatarSrc}" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';" style="width:100%; height:100%; object-fit:cover;" />
                    <div style="display:none; align-items:center; justify-content:center; width:100%; height:100%; font-size:32px; font-weight:bold; color:#fff;">${currentChiefName.charAt(0).toUpperCase()}</div>
                    <div style="position:absolute; inset:0; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.2s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0'"><span style="font-size:24px;">✏️</span></div>
                </div>
                <div style="overflow:hidden;">
                    <h2 class="id-card-name" style="margin:0 0 5px 0; color:#fff; letter-spacing:0.5px; text-shadow:0 2px 4px rgba(0,0,0,0.5); white-space:nowrap; text-overflow:ellipsis; overflow:hidden;">${window.escapeHTML(currentChiefName)}${adminBadgeHtml}</h2>
                    <div style="display:inline-flex; align-items:center; gap:6px; background:rgba(0,0,0,0.3); padding:4px 10px; border-radius:20px; border:1px solid rgba(255,255,255,0.1);">
                        <span style="color:var(--accent); font-size:12px; font-weight:bold;">ID:</span>
                        <span style="color:var(--text-main); font-family:monospace; font-size:14px; letter-spacing:1px;">${currentUser.gameId}</span>
                    </div>
                </div>
            </div>
            
            <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:15px; position:relative; z-index:2;">
                <div class="id-card-stat-row" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:8px;">
                    <span style="color:var(--text-muted); font-size:13px; text-transform:uppercase; letter-spacing:1px;">Email</span>
                    <span style="color:#fff; font-weight:bold; font-size:13px; text-align:right;">${currentUser.email}</span>
                </div>
                <div class="id-card-stat-row" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:8px;">
                    <span style="color:var(--text-muted); font-size:13px; text-transform:uppercase; letter-spacing:1px;">Joined Date</span>
                    <span style="color:#fff; font-weight:bold; font-size:15px;">${joinedDateStr}</span>
                </div>
                <div class="id-card-stat-row" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:8px;">
                    <span style="color:var(--text-muted); font-size:13px; text-transform:uppercase; letter-spacing:1px;">Furnace Level</span>
                    <span style="color:var(--text-main); font-weight:bold; font-size:20px; text-align:right; display:flex; align-items:center;">${window.getFurnaceIconHtml(furnaceLevelStr, 64)}</span>
                </div>
                
                <div class="id-card-stat-row" style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.03); padding:8px 12px; border-radius:8px;">
                    <span style="color:var(--text-muted); font-size:13px; text-transform:uppercase; letter-spacing:1px;">Time Active</span>
                    <span style="color:var(--text-main); font-weight:bold; font-size:13px; text-align:right;">${timeActiveStr}</span>
                </div>
            </div>
            
            <div class="id-card-bot-status" style="text-align:center; margin-top:15px; padding-top:15px; border-top:1px solid rgba(255,255,255,0.05); position:relative; z-index:2;">
                ${botStatusHtml}
            </div>
            
            <!-- Watermark -->
            <div style="position:absolute; bottom:-20px; right:-20px; font-size:120px; opacity:0.04; pointer-events:none; transform:rotate(-15deg); z-index:1;">&#x2744;&#xFE0F;</div>
        </div>
        
        <input type="file" id="avatarUploadInput" accept="image/png, image/jpeg, image/webp" style="display:none;">
            ${staffProfileHtml}
            ${linkedHtml}
            
            <!-- Personal Activity Log Card -->
            <div class="card" style="margin-top:20px; text-align:left;">
              <div class="card-title" style="display:flex; justify-content:space-between; align-items:center;">
                <span>📅 Today's Personal Activity Log</span>
                <span style="font-size:12px; color:var(--text-muted); font-weight:normal;">Filtered for ${escapeHTML(currentChiefName)}</span>
              </div>
              <div id="userPersonalLogContainer" style="margin-top:12px;">
                <div style="text-align:center; color:var(--text-muted); padding:15px; font-size:13px;">Loading today's activity...</div>
              </div>
            </div>
      </div>
    `;
    
    setTimeout(() => window.loadUserPersonalLog(currentChiefName), 100);
    
    
    if (accLevel) {
        document.getElementById('openStaffProfileBtn').addEventListener('click', () => {
            document.getElementById('staffProfileModal').style.display = 'flex';
        });
        document.getElementById('closeStaffProfileBtn').addEventListener('click', () => {
            document.getElementById('staffProfileModal').style.display = 'none';
        });
        
        document.getElementById('saveStaffProfileBtn').addEventListener('click', async () => {
            const dept = document.getElementById('staffDeptInput').value.trim();
            const tz = document.getElementById('staffTzInput').value.trim();
            const loc = document.getElementById('staffLocInput').value.trim();
            const bio = document.getElementById('staffBioInput').value.trim();
            const btn = document.getElementById('saveStaffProfileBtn');
            btn.textContent = 'Saving...';
            btn.disabled = true;
            try {
                await set(ref(db, `staffProfiles/${currentUser.gameId}`), {
                    department: dept,
                    timezone: tz,
                    location: loc,
                    bio: bio
                });
                window.showToast("Staff Profile saved successfully!", "success");
                btn.textContent = 'Save Profile';
                btn.disabled = false;
                setTimeout(() => {
                    document.getElementById('staffProfileModal').style.display = 'none';
                }, 500);
            } catch (err) {
                console.error(err);
                window.showToast("Failed to save profile.", "error");
                btn.textContent = 'Save Profile';
                btn.disabled = false;
            }
        });
    }
    
    
      const openLinkAltBtn = document.getElementById('openLinkAltBtn');
      const linkAltForm = document.getElementById('linkAltForm');
      const altGameIdInput = document.getElementById('altGameIdInput');
      const altChiefConfirm = document.getElementById('altChiefConfirm');
      const cancelAltBtn = document.getElementById('cancelAltBtn');
      const submitAltBtn = document.getElementById('submitAltBtn');
      
      if (openLinkAltBtn) {
          openLinkAltBtn.addEventListener('click', () => {
              openLinkAltBtn.style.display = 'none';
              linkAltForm.style.display = 'block';
              altGameIdInput.value = '';
              altChiefConfirm.style.display = 'none';
          });
          
          cancelAltBtn.addEventListener('click', () => {
              openLinkAltBtn.style.display = 'block';
              linkAltForm.style.display = 'none';
          });
          
          altGameIdInput.addEventListener('input', () => {
              const val = altGameIdInput.value.trim();
              if (!val) {
                  altChiefConfirm.style.display = 'none';
                  return;
              }
              altChiefConfirm.style.display = 'block';
              if (idToNameMap[val]) {
                  altChiefConfirm.innerHTML = `Is your Chief Name: <strong style="color:var(--success)">${idToNameMap[val]}</strong>?`;
              } else {
                  altChiefConfirm.innerHTML = `<span style="color:var(--danger)">Game ID not found in master database.</span>`;
              }
          });
          
          submitAltBtn.addEventListener('click', async () => {
              const val = altGameIdInput.value.trim();
              if (!val) return;
              try {
                  submitAltBtn.textContent = "Linking...";
                  submitAltBtn.disabled = true;
                  await linkAltAccount(currentUser.uid, val, currentUser.linkedGameIds || []);
                  if(window.showToast) window.showToast("Alt account linked!", "success");
              } catch(e) {
                  if(window.showToast) window.showToast(e.message, "error");
                  else window.showToast(e.message, "error");
                  submitAltBtn.textContent = "Confirm Link";
                  submitAltBtn.disabled = false;
              }
          });
      }
      
      const uploadInput = document.getElementById('avatarUploadInput');
    
    uploadInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      // Basic size check (optional but good practice to prevent massive uploads crashing browser)
      if (file.size > 10 * 1024 * 1024) { // 10MB
          window.showToast("Image too large. Max 10MB.", "error");
          return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        // Minimum size check logic
        const img = new Image();
        img.onload = () => {
           if (img.width < 100 || img.height < 100) {
               window.showToast("Image must be at least 100x100 pixels.", "error");
               return;
           }
           
           // Show Modal
           const modal = document.getElementById('cropperModal');
           const cropperImage = document.getElementById('cropperImage');
           const cancelBtn = document.getElementById('cropperCancelBtn');
           const saveBtn = document.getElementById('cropperSaveBtn');
           
           cropperImage.src = event.target.result;
           modal.style.display = 'flex';
           
           // Initialize Cropper
           let cropper = new Cropper(cropperImage, {
               aspectRatio: 1,
               viewMode: 1,
               preview: '.img-preview',
               dragMode: 'move',
               autoCropArea: 1,
               restore: false,
               guides: false,
               center: false,
               highlight: false,
               cropBoxMovable: true,
               cropBoxResizable: true,
               toggleDragModeOnDblclick: false,
           });
           
           // Cancel Event
           cancelBtn.onclick = () => {
               cropper.destroy();
               modal.style.display = 'none';
               uploadInput.value = '';
           };
           
           // Save Event
           saveBtn.onclick = async () => {
               saveBtn.textContent = 'Saving...';
               saveBtn.disabled = true;
               
               // Get perfectly cropped 150x150 canvas
               const canvas = cropper.getCroppedCanvas({
                   width: 150,
                   height: 150,
                   imageSmoothingEnabled: true,
                   imageSmoothingQuality: 'high'
               });
               
               // Compress to JPEG
               const base64String = canvas.toDataURL('image/jpeg', 0.8);
               
               try {
                   let targetId = window._uploadTargetId || currentUser.gameId;
                   await uploadAvatar(targetId, base64String);
                   
                   // Update DOM immediately
                   let imgEl;
                   if (targetId === currentUser.gameId) {
                     imgEl = document.getElementById('accountHubAvatarImg');
                   } else {
                     imgEl = document.getElementById(`altAvatarImg-${targetId}`);
                   }
                   
                   if (imgEl) {
                     imgEl.src = base64String;
                     imgEl.style.display = 'block';
                     if (imgEl.nextElementSibling) imgEl.nextElementSibling.style.display = 'none';
                   }
                   
                   if (window.showToast) window.showToast('Profile picture updated successfully!', 'success');
                   
                   // Refresh mapping so UI updates immediately globally
                   if (idToNameMap[currentUser.gameId]) {
                      const timeStamp = new Date().getTime();
                      avatarMap[targetId] = base64String;
                   }
               } catch (error) {
                   if (window.showToast) window.showToast('Failed to upload image.', 'error');
                   console.error(error);
               }
               
               // Cleanup
               cropper.destroy();
               modal.style.display = 'none';
               uploadInput.value = '';
               saveBtn.textContent = 'Save';
               saveBtn.disabled = false;
           };
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

  },

  home: async () => {
    // Restore navbar if it was hidden by full screen views
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.style.display = 'flex';

    renderLoading('Loading Home & News');
    try {
      const data = await fetchSheet('News');
      
      let scheduleData = null;
      try {
        scheduleData = await fetchSheet('WhiteOut Survival');
      } catch(e) { console.error('Failed to load schedule for countdown', e); }
      
      let nextEvents = [];
      let nextEventTime = null;
      
      if (scheduleData && Array.isArray(scheduleData) && scheduleData.length > 0) {
        let upcomingEvents = [];
        let now = new Date();
        
        for (let i = 1; i < Math.min(34, scheduleData.length); i++) {
          let row = scheduleData[i];
          let eventName = row[5];
          let dateRaw = row[6];
          let utcRaw = row[7];
          
          if (!eventName || String(eventName).trim() === "" || String(eventName).includes("Event's")) continue;
          if (String(eventName).trim() === 'Rewards') break;
          
          const dateStr = String(dateRaw || '').trim();
          let eventDate = null;
          const mdMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
          const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T/);
          if (mdMatch) {
            eventDate = new Date(now.getFullYear(), parseInt(mdMatch[1]) - 1, parseInt(mdMatch[2]));
          } else if (isoMatch) {
            eventDate = new Date(dateStr);
          } else {
            continue;
          }

          let exactEventDate = null;
          const utcStr = String(utcRaw || '').trim();
          const hmMatch = utcStr.match(/^(\d{1,2}):(\d{2})$/);
          const isoUtcMatch = utcStr.match(/^\d{4}-\d{2}-\d{2}T/);

          if (hmMatch) {
            const h = parseInt(hmMatch[1]), m = parseInt(hmMatch[2]);
            exactEventDate = new Date(eventDate);
            exactEventDate.setUTCHours(h, m, 0, 0);
          } else if (isoUtcMatch) {
            const gasDate = new Date(utcStr);
            gasDate.setUTCHours(gasDate.getUTCHours() - 8);
            exactEventDate = new Date(eventDate);
            exactEventDate.setUTCHours(gasDate.getUTCHours(), gasDate.getUTCMinutes(), 0, 0);
          } else {
            continue;
          }
          
          if (exactEventDate > now) {
            upcomingEvents.push({
              name: String(eventName).trim(),
              exactDate: exactEventDate
            });
          }
        }
        
        // Sort by closest date
        if (upcomingEvents.length > 0) {
          upcomingEvents.sort((a, b) => a.exactDate - b.exactDate);
          
          // Get the very next time slot
          nextEventTime = upcomingEvents[0].exactDate;
          
          // Get ALL events that happen at that exact same time
          nextEvents = upcomingEvents.filter(e => e.exactDate.getTime() === nextEventTime.getTime());
        }
      }
      
      const renderNewsContent = () => {
        let contentHtml = "";
        
        // Data starts at Row 4 (index 3) and Column C (index 2)
        const newsItems = [];
        if (data && data.length > 3) {
          for (let i = 3; i < data.length; i++) {
            let text = data[i][2]; // Column C
            if (text && text.toString().trim() !== "") {
              // Format Google Forms links as a nice "Sign-up" button
              let formattedText = text.toString().replace(
                /(https:\/\/docs\.google\.com\/forms[^\s]+|https:\/\/forms\.gle\/[^\s]+)/g, 
                '<a href="$1" target="_blank" style="display:inline-block; margin-top:10px; background:var(--accent); color:#fff; padding:8px 16px; border-radius:20px; text-decoration:none; font-weight:bold; font-size:14px; box-shadow:0 2px 4px rgba(0,0,0,0.1);">🎁 Sign-up for Auto Redeem Gift Codes</a>'
              );
              
              // Format any other standard links normally
              formattedText = formattedText.replace(
                /(?<!href=")(https?:\/\/[^\s]+)/g, 
                '<a href="$1" target="_blank" style="color:var(--accent); text-decoration:underline; word-break:break-all;">$1</a>'
              );
              
              newsItems.push(formattedText);
            }
          }
        }
        
        if(newsItems.length === 0) {
          contentHtml = `<div class="loading">No news found.</div>`;
        } else {
          contentHtml += `<table style="table-layout:fixed; width:100%;"><thead><tr><th>Announcement</th></tr></thead><tbody>`;
          for(let i=0; i<newsItems.length; i++){
            contentHtml += `<tr><td style="white-space:normal; word-wrap:break-word;">${newsItems[i]}</td></tr>`;
          }
          contentHtml += `</tbody></table>`;
        }
        return contentHtml;
      };

      let countdownHtml = '';
      if (nextEvents.length > 0) {
        countdownHtml = `
          <div class="card" style="margin-bottom: 25px; position: relative; overflow: hidden; animation: fadeIn 0.5s ease;">
            <div class="countdown-widget-container" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
              <div class="countdown-event-details" style="display:flex; align-items:center; gap:15px;">
                <div style="background:rgba(168,85,247,0.1); color:var(--accent); width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:24px; flex-shrink:0;">
                  ⏱️
                </div>
                <div>
                  <div style="font-weight:bold; color:var(--text-muted); font-size:12px; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Next Upcoming Event</div>
                  <div id="liveCountdownEventName" style="font-weight:bold; color:var(--text-main); font-size:18px; transition: opacity 0.3s ease;">
                    ${nextEvents[0].name.includes('Bear Trap') ? '🪤' : '✨'} ${nextEvents[0].name}
                  </div>
                </div>
              </div>
              <div class="countdown-timer-details" style="text-align:right;">
                <div style="font-weight:bold; color:var(--text-muted); font-size:12px; text-transform:uppercase; letter-spacing:1px; margin-bottom:4px;">Starts In</div>
                <div id="liveCountdownTimer" style="font-weight:bold; color:var(--accent); font-size:24px; font-family:monospace; background:var(--bg-main); padding:6px 12px; border-radius:8px; border:1px solid var(--border);">
                  --h --m --s
                </div>
              </div>
            </div>
          </div>
        `;
      }

      let headerHtml = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h2 style="margin:0; color:var(--text-main); font-size:24px;">📰 Alliance News</h2>
        </div>
      `;
      let onboardingBannerHtml = '';
      if (!currentUser) {
        onboardingBannerHtml = `
          <div style="background: linear-gradient(135deg, rgba(59,130,246,0.18), rgba(147,51,234,0.18)); border: 1px solid rgba(59,130,246,0.35); border-radius: 16px; padding: 22px 26px; margin-bottom: 25px; display: flex; align-items: center; justify-content: space-between; gap: 20px; flex-wrap: wrap; text-align: left; box-shadow: 0 8px 32px rgba(0,0,0,0.25);">
            <div style="flex: 1; min-width: 280px;">
              <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(59,130,246,0.2); color: #60a5fa; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-bottom: 8px;">
                ✨ Essential Alliance Member Portal
              </div>
              <h2 style="margin: 0 0 6px 0; color: var(--text-main); font-size: 21px;">🔥 Claim Your Chief Profile & Unlock Your Live Stats!</h2>
              <p style="margin: 0; color: var(--text-muted); font-size: 13.5px; line-height: 1.55;">
                Already an alliance member? Link your email to claim your profile! Instantly track your live Bear Trap donations, Showdown rankings, alliance event scores, and personal activity logs—all in real time!
              </p>
            </div>

            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <button onclick="window.openRegisterModal()" style="background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; border: none; padding: 12px 22px; border-radius: 8px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 15px rgba(37,99,235,0.4); transition: 0.2s;">
                ✨ Claim / Create Account
              </button>
              <button onclick="window.openLoginModal()" style="background: rgba(255,255,255,0.08); color: var(--text-main); border: 1px solid var(--border); padding: 12px 20px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.2s;">
                🔑 Sign In
              </button>
            </div>
          </div>
        `;
      }

      app.innerHTML = onboardingBannerHtml + countdownHtml + headerHtml + `
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; flex-wrap:wrap; gap:15px; border-bottom:1px solid var(--border); padding-bottom:15px;">
            <div class="card-title" style="margin:0;">Recent Updates</div>
          </div>
          <div id="newsContentContainer">
            ${renderNewsContent()}
          </div>
        </div>
      `;

      if (nextEvents.length > 0 && nextEventTime) {
        // Rotation Interval
        let eventIdx = 0;
        let eventNameEl = document.getElementById('liveCountdownEventName');
        if (nextEvents.length > 1) {
          const rotationInterval = setInterval(() => {
            if (!document.getElementById('liveCountdownEventName')) return clearInterval(rotationInterval);
            eventIdx = (eventIdx + 1) % nextEvents.length;
            let evName = nextEvents[eventIdx].name;
            eventNameEl.style.opacity = 0;
            setTimeout(() => {
              if (!document.getElementById('liveCountdownEventName')) return;
              eventNameEl.innerHTML = `${evName.includes('Bear Trap') ? '🪤' : '✨'} ${evName}`;
              eventNameEl.style.opacity = 1;
            }, 300);
          }, 4000); // Rotate every 4 seconds
        }

        // Countdown Interval
        const timerEl = document.getElementById('liveCountdownTimer');
        const updateTimer = () => {
          if (!document.getElementById('liveCountdownTimer')) return clearInterval(countdownInterval);
          let now = new Date();
          let diff = nextEventTime - now;
          
          if (diff <= 0) {
            timerEl.innerHTML = "Started!";
            timerEl.style.color = "var(--success)";
            clearInterval(countdownInterval);
            // Refresh view to get the next event
            setTimeout(() => {
              if (document.getElementById('liveCountdownTimer')) views.home();
            }, 5000);
            return;
          }
          
          let h = Math.floor(diff / (1000 * 60 * 60));
          let m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          let s = Math.floor((diff % (1000 * 60)) / 1000);
          
          let timeStr = '';
          if (h > 0) {
            timeStr = `${h}<span style="color:var(--text-main); font-size:0.7em; margin:0 4px 0 1px;">h</span>${m.toString().padStart(2, '0')}<span style="color:var(--text-main); font-size:0.7em; margin:0 4px 0 1px;">m</span>${s.toString().padStart(2, '0')}<span style="color:var(--text-main); font-size:0.7em; margin-left:1px;">s</span>`;
          } else {
            timeStr = `${m}<span style="color:var(--text-main); font-size:0.7em; margin:0 4px 0 1px;">m</span>${s.toString().padStart(2, '0')}<span style="color:var(--text-main); font-size:0.7em; margin-left:1px;">s</span>`;
          }
          timerEl.innerHTML = timeStr;
        };
        
        let countdownInterval = setInterval(updateTimer, 1000);
        updateTimer();
      }
      
    } catch(e) { renderError(e.message); }
  },
  




  leaderboards: async (filterString) => {
    renderLoading("Loading Leaderboards");
    try {
      const allBoards = await window.fetchLeaderboardsData();
      let scheduleData = [];
      try { scheduleData = await fetchSheet("WhiteOut Survival"); } catch(e) { console.error(e); }
      
      let isBearTrapActive = false;
      if (scheduleData && Array.isArray(scheduleData) && scheduleData.length > 0) {
        let now = new Date();
        for (let i = 1; i < Math.min(34, scheduleData.length); i++) {
          let eventName = scheduleData[i][5];
          if (!eventName || !String(eventName).includes('Bear Trap')) continue;
          
          let dateStr = String(scheduleData[i][6] || '').trim();
          let utcStr = String(scheduleData[i][7] || '').trim();
          
          let eventDate = null;
          const mdMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
          if (mdMatch) {
             eventDate = new Date(now.getFullYear(), parseInt(mdMatch[1]) - 1, parseInt(mdMatch[2]));
          } else {
             continue; // Skip if date format is unexpected
          }
          
          let exactEventDate = new Date(eventDate);
          const hmMatch = utcStr.match(/^(\d{1,2}):(\d{2})$/);
          if (hmMatch) {
             exactEventDate.setUTCHours(parseInt(hmMatch[1]), parseInt(hmMatch[2]), 0, 0);
          } else {
             // Default to 16:00 UTC if no time specified, as per typical schedule
             exactEventDate.setUTCHours(16, 0, 0, 0);
          }
          
          // Check if now is within 30 minutes of the event start time
          let diffMs = now - exactEventDate;
          if (diffMs >= 0 && diffMs <= 30 * 60 * 1000) {
             isBearTrapActive = true;
             break;
          }
        }
      }
      let html = ``;
      
      let boards = [];
      if (allBoards && Array.isArray(allBoards)) {
         if (!filterString) {
             boards = JSON.parse(JSON.stringify(allBoards));
         } else {
             boards = JSON.parse(JSON.stringify(allBoards.filter(b => b.title && b.title.toLowerCase().includes(filterString.toLowerCase()))));
         }
      }
      // Fetch champions config & Bear Trap Firebase nodes
      let btWinners = {};
      let fbBtWins = {};
      let fbBtDonations = {};
      try {
         const [winnersSnap, winsSnap, donSnap] = await Promise.all([
            get(ref(db, 'config/bearTrapWinners')),
            get(ref(db, 'beartrap_wins')),
            get(ref(db, 'beartrap_donations'))
         ]);
         if (winnersSnap.exists()) btWinners = winnersSnap.val() || {};
         if (winsSnap.exists()) fbBtWins = winsSnap.val() || {};
         if (donSnap.exists()) fbBtDonations = donSnap.val() || {};
      } catch (e) {
         console.warn("Could not fetch bear trap firebase nodes", e);
      }

      // Fetch Showdown Event Goals
      let finalGoalsCard = "";
      let liveShowdownHtml = "";
      let allTimeShowdownHtml = "";
      let sdHistoryData = null;
      if (filterString && filterString.toLowerCase() === 'showdown') {
         try {
            sdHistoryData = await fetchSheet("Showdown History");
            const [histSnap, metaHistSnap, archiveSnap] = await Promise.all([
               get(ref(db, 'showdown_history')).catch(() => null),
               get(ref(db, 'showdown_meta/history')).catch(() => null),
               get(ref(db, 'activity_history_archives')).catch(() => null)
            ]);
            
            let extraRows = [];
            const parseSnapVal = (rawVal) => {
               if (!rawVal) return;
               if (Array.isArray(rawVal)) {
                  extraRows.push(...rawVal);
               } else if (typeof rawVal === 'object') {
                  Object.values(rawVal).forEach(entry => {
                     if (!entry) return;
                     if (Array.isArray(entry)) {
                        extraRows.push(...entry);
                     } else if (entry.tableRows && Array.isArray(entry.tableRows)) {
                        extraRows.push(...entry.tableRows);
                     } else if (entry.players || entry.pList) {
                        let plist = entry.players || entry.pList || [];
                        let dateStr = entry.date || new Date(entry.timestamp || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                        extraRows.push(["", "Date:", dateStr, "", "", "", "", "", "", ""]);
                        extraRows.push(["", "Ranking", "Member", "Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Total"]);
                        plist.forEach((p, idx) => {
                           if (p && typeof p === 'object') {
                              extraRows.push(["", p.rank || (idx + 1), p.name || '', p.d1 || 0, p.d2 || 0, p.d3 || 0, p.d4 || 0, p.d5 || 0, p.d6 || 0, p.total || 0]);
                           }
                        });
                        extraRows.push(["", "", "", "", "", "", "", "", "", ""]);
                     } else if (Array.isArray(entry.data)) {
                        extraRows.push(...entry.data);
                     }
                  });
               }
            };

            if (metaHistSnap && metaHistSnap.exists()) parseSnapVal(metaHistSnap.val());
            if (histSnap && histSnap.exists()) parseSnapVal(histSnap.val());
            if (archiveSnap && archiveSnap.exists()) parseSnapVal(archiveSnap.val());

            let baseRows = sdHistoryData ? (sdHistoryData.data || sdHistoryData) : [];
            if (Array.isArray(baseRows) && extraRows.length > 0) {
               sdHistoryData = [...baseRows, ...extraRows];
            } else if (extraRows.length > 0) {
               sdHistoryData = extraRows;
            }
         } catch(e) { console.warn("Showdown history fetch error", e); }
      }
      
      try {
         const [liveSnap, metaSnap, historySnap] = await Promise.all([
            get(ref(db, 'showdown_live')),
            get(ref(db, 'showdown_meta')),
            get(ref(db, 'showdown_meta/history')).catch(() => null)
         ]);
         
         const liveData = liveSnap.val() || {};
         let fetchedHist = (historySnap && historySnap.exists() && historySnap.val()) ? historySnap.val() : {};
         let rawHist = sdHistoryData;
         if (rawHist && typeof rawHist === 'object' && rawHist.data) rawHist = rawHist.data;
         let histRows = rawHist ? (Array.isArray(rawHist) ? rawHist : Object.values(rawHist)) : [];
         if (histRows && histRows.length > 0) {
             let parsedSheets = window.parseShowdownHistoryRows(histRows);
             fetchedHist = Object.assign({}, parsedSheets, fetchedHist);
         }
         const historyObj = window.getMergedShowdownHistoryObj(fetchedHist);
         
         let ourScores = { d1:0, d2:0, d3:0, d4:0, d5:0, d6:0 };
         let topPlayers = { d1:{score:0}, d2:{score:0}, d3:{score:0}, d4:{score:0}, d5:{score:0}, d6:{score:0} };
         let players = [];
         
         for (const [pName, scores] of Object.entries(liveData)) {
             if (!scores || typeof scores !== 'object') continue;
             let pd1 = scores.d1 || 0;
             let pd2 = scores.d2 || 0;
             let pd3 = scores.d3 || 0;
             let pd4 = scores.d4 || 0;
             let pd5 = scores.d5 || 0;
             let pd6 = scores.d6 || 0;
             let pTotal = pd1 + pd2 + pd3 + pd4 + pd5 + pd6;
             ourScores.d1 += pd1;
             ourScores.d2 += pd2;
             ourScores.d3 += pd3;
             ourScores.d4 += pd4;
             ourScores.d5 += pd5;
             ourScores.d6 += pd6;
             
             if (pd1 > topPlayers.d1.score) topPlayers.d1 = { name: pName, score: pd1 };
             if (pd2 > topPlayers.d2.score) topPlayers.d2 = { name: pName, score: pd2 };
             if (pd3 > topPlayers.d3.score) topPlayers.d3 = { name: pName, score: pd3 };
             if (pd4 > topPlayers.d4.score) topPlayers.d4 = { name: pName, score: pd4 };
             if (pd5 > topPlayers.d5.score) topPlayers.d5 = { name: pName, score: pd5 };
             if (pd6 > topPlayers.d6.score) topPlayers.d6 = { name: pName, score: pd6 };
             players.push({ name: pName, d1: pd1, d2: pd2, d3: pd3, d4: pd4, d5: pd5, d6: pd6, total: pTotal });
          }

          const staticHorns = { d1: 1, d2: 2, d3: 2, d4: 2, d5: 2, d6: 4 };
          players.forEach(p => {
              p.horns = 0;
              p.wins = 0;
              for (let i = 1; i <= 6; i++) {
                  let dVal = p['d'+i] || 0;
                  let topPlayerScore = topPlayers['d'+i].score;
                  if (dVal > 0 && dVal === topPlayerScore) {
                      p.horns += staticHorns['d'+i];
                      p.wins += 1;
                  }
              }
          });
          players.sort((a, b) => {
              if (b.horns !== a.horns) return b.horns - a.horns;
              return b.total - a.total;
          });
          
          let hasLiveScores = players.some(p => p.total > 0 || p.horns > 0);
          let mvpBannerHtml = "";
          if (hasLiveScores && players.length > 0 && players[0].horns > 0) {
              let maxHorns = players[0].horns;
              let topMvps = players.filter(p => p.horns === maxHorns);
              let mvpTitle = topMvps.length > 1 ? "👑 Showdown Co-MVPs" : "👑 Showdown MVP";
              let champDisplayNames = topMvps.map(p => escapeHTML(p.name)).join(" & ");
              let champName = topMvps[0].name;
              let champId = null;
              for (const [gid, name] of Object.entries(idToNameMap)) {
                  if (name.toLowerCase() === champName.toLowerCase()) {
                      champId = gid; break;
                  }
              }
              let avatarStackHtml = renderAvatarStack(topMvps);
              
              mvpBannerHtml = `
                <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(255,215,0,0.05);">
                  ${avatarStackHtml}
                  <div style="flex: 1; text-align: left;">
                    <div style="color: #FFD700; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">${mvpTitle}</div>
                    <div style="color: var(--text-main); font-size: 18px; font-weight: bold;">${champDisplayNames}</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase;">Total Horns</div>
                    <div style="color: #FFD700; font-size: 20px; font-weight: bold;">${maxHorns}</div>
                  </div>
                </div>
              `;
          } else {
              mvpBannerHtml = `
                <div style="background: linear-gradient(135deg, rgba(148,163,184,0.08) 0%, rgba(148,163,184,0.02) 100%); border: 1px dashed rgba(148,163,184,0.3); border-radius: 12px; padding: 12px 15px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;">
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="width: 38px; height: 38px; border-radius: 50%; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 18px; flex-shrink: 0;">⏳</div>
                    <div style="text-align: left;">
                      <div style="color: var(--accent); font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">Event Pending / Reset</div>
                      <div style="color: var(--text-main); font-size: 15px; font-weight: bold;">Pending Day 1 Scores...</div>
                    </div>
                  </div>
                  <span style="background: rgba(6,182,212,0.15); color: var(--accent); border: 1px solid rgba(6,182,212,0.3); padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; white-space: nowrap;">Waiting for Battle</span>
                </div>
              `;
          }

          const liveDisplayList = players.filter(p => p.total > 0 || p.horns > 0).slice(0, 4);

          liveShowdownHtml = `<div class="card" style="flex: 1 1 0px; min-width: 300px;"><div class="card-title">Current - Showdown Leaderboard</div>
          ${mvpBannerHtml}
          <div class="card-table-scroll">
            <table style="min-width: max-content; width: 100%; text-align:left;"><thead><tr>
               <th>RANK</th><th>NAME</th><th>TOTAL HORNS</th><th>DAY WINS</th><th>TOTAL</th>
            </tr></thead><tbody>`;
          
                    if (liveDisplayList.length === 0) {
              liveShowdownHtml += `<tr><td colspan="5" style="text-align:center; padding: 15px 10px; color: var(--text-muted); font-size: 12px; white-space: normal; word-break: break-word;">⏳ <b>Event Pending</b> — Waiting for Day 1 scores</td></tr>`;
          } else {
              let currentLiveRank = 1;
              liveDisplayList.forEach((p, index) => {
                  if (index > 0) {
                      let prev = liveDisplayList[index - 1];
                      if (p.horns !== prev.horns) {
                          currentLiveRank += 1;
                      }
                  }
                  let isTie = liveDisplayList.filter(o => o.horns === p.horns).length > 1;
                  let tieBadge = isTie ? ' <span style="font-size:11px; opacity:0.85;" title="Tied Rank">🤝</span>' : '';
                  let rankDisplay = `${currentLiveRank}${tieBadge}`;
                  liveShowdownHtml += `<tr>
                     <td style="font-weight:bold; color:var(--text-muted);">${rankDisplay}</td>
                     <td>${formatCell(p.name)}</td>
                     <td>${p.horns}</td>
                     <td>${p.wins}</td>
                     <td>${p.total > 0 ? p.total.toLocaleString() : '0'}</td>
                  </tr>`;
              });
          }
          liveShowdownHtml += `</tbody></table></div></div>`;
          
          let rawHistory = sdHistoryData;
          if (rawHistory && typeof rawHistory === 'object' && rawHistory.data) {
              rawHistory = rawHistory.data;
          }
          const historyRows = rawHistory ? (Array.isArray(rawHistory) ? rawHistory : Object.values(rawHistory)) : [];
          if (historyRows.length > 0 || (players && players.length > 0)) {
              let allTimePlayers = calculateAllTimeShowdown(historyObj);
              let combinedMap = {};
              allTimePlayers.forEach(p => {
                  combinedMap[p.name.toLowerCase()] = { name: p.name, horns: p.horns, wins: p.wins, total: p.total };
              });
              players.forEach(p => {
                  let key = p.name.toLowerCase();
                  if (!combinedMap[key]) combinedMap[key] = { name: p.name, horns: 0, wins: 0, total: 0 };
                  combinedMap[key].horns += (p.horns || 0);
                  combinedMap[key].wins += (p.wins || 0);
                  combinedMap[key].total += (p.total || 0);
              });
              allTimePlayers = Object.values(combinedMap).sort((a, b) => b.horns !== a.horns ? b.horns - a.horns : b.total - a.total);
              
              let allTimeMvpHtml = "";
              if (allTimePlayers.length > 0 && allTimePlayers[0].horns > 0) {
                  let maxHorns = allTimePlayers[0].horns;
                  let topChamps = allTimePlayers.filter(p => p.horns === maxHorns);
                  let champTitle = topChamps.length > 1 ? "👑 All-Time Co-Champions" : "👑 All-Time Champion";
                  let champDisplayNames = topChamps.map(p => escapeHTML(p.name)).join(" & ");
                  let avatarStackHtml = renderAvatarStack(topChamps);
                  allTimeMvpHtml = `
                    <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px;">
                      ${avatarStackHtml}
                      <div style="flex: 1; text-align: left;">
                        <div style="color: #FFD700; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">${champTitle}</div>
                        <div style="color: var(--text-main); font-size: 18px; font-weight: bold;">${champDisplayNames}</div>
                      </div>
                      <div style="text-align: right;">
                        <div style="color: var(--text-muted); font-size: 11px;">Total Score</div>
                        <div style="color: var(--accent); font-size: 20px; font-weight: bold;">${maxHorns}</div>
                      </div>
                    </div>
                  `;
              }
              
              const allTimeDisplayList = allTimePlayers.slice(0, 4);
              allTimeShowdownHtml = `<div class="card" style="flex: 1 1 0px; min-width: 300px;">
              <div class="card-title" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                 <span>All-Time - Showdown Leaderboard</span>
                 <button onclick="window.openShowdownArchiveVaultModal()" style="background:linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.05) 100%); border:1px solid rgba(6,182,212,0.4); color:var(--accent); padding:4px 10px; border-radius:6px; font-weight:bold; font-size:12px; cursor:pointer; display:inline-flex; align-items:center; gap:5px;">📜 View Archive Vault</button>
              </div>
              ${allTimeMvpHtml}
              <div class="card-table-scroll">
                <table style="min-width: max-content; width: 100%; text-align:left;"><thead><tr>
                   <th>RANK</th><th>NAME</th><th>TOTAL HORNS</th><th>DAY WINS</th><th>TOTAL</th>
                </tr></thead><tbody>`;
              let currentAllTimeRank = 1;
              allTimeDisplayList.forEach((p, index) => {
                  if (index > 0) {
                      let prev = allTimeDisplayList[index - 1];
                      if (p.horns !== prev.horns) currentAllTimeRank += 1;
                  }
                  let isTie = allTimeDisplayList.filter(o => o.horns === p.horns).length > 1;
                  let tieBadge = isTie ? ' <span style="font-size:11px; opacity:0.85;" title="Tied Rank">🤝</span>' : '';
                  let rankDisplay = `${currentAllTimeRank}${tieBadge}`;
                  allTimeShowdownHtml += `<tr>
                     <td style="font-weight:bold; color:var(--text-muted);">${rankDisplay}</td>
                     <td>${formatCell(p.name)}</td>
                     <td>${p.horns}</td>
                     <td>${p.wins}</td>
                     <td>${p.total > 0 ? p.total.toLocaleString() : '0'}</td>
                  </tr>`;
              });
              allTimeShowdownHtml += `</tbody></table></div></div>`;
          }
         
         let totalAllianceScore = ourScores.d1 + ourScores.d2 + ourScores.d3 + ourScores.d4 + ourScores.d5 + ourScores.d6;
         ourScores.total = totalAllianceScore;
         
         const dailyGoal = 3333333;
         
         let goalsCard = `<div class="card" style="margin-bottom:20px; animation:fadeIn 0.3s ease;"><div class="card-title">🎯 Event Goals</div>`;
         goalsCard += `<div style="margin-bottom:20px;">
             <div style="display:flex; justify-content:flex-start; align-items:center; gap:10px; margin-bottom:5px;">
               <div style="font-weight:bold; color:var(--text-main);">The 20M Challenge</div>
               ${ourScores.total >= 20000000 ? `<div style="color:var(--success); font-size:12px; font-weight:bold; background:rgba(46,204,113,0.1); padding:2px 8px; border-radius:12px; border:1px solid rgba(46,204,113,0.3); animation:pulse 2s infinite;">🎉 Goal Reached!</div>` : ''}
             </div>
             <div style="background:var(--border); height:12px; border-radius:6px; overflow:hidden;">
               <div style="background:var(--accent); height:100%; width:${Math.min(100, (ourScores.total / 20000000) * 100)}%;"></div>
             </div>
             <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted); margin-top:5px;">
               <span>${ourScores.total.toLocaleString()}</span>
               <span>20,000,000</span>
             </div>
           </div>`;
           
         goalsCard += `<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 15px;">`;
         
         let cumulativeScore = 0;
         for (let i = 1; i <= 6; i++) {
            let dg = dailyGoal;
            let dailyAmtNum = ourScores['d'+i] || 0;
            cumulativeScore += dailyAmtNum;
            let g = 20000000 - cumulativeScore;
            
            let dailyAmt = ourScores['d'+i];
            let leftVal = dg - dailyAmt;
            
            let isPending = dailyAmt === 0 || !dailyAmt;
            let leftStr = "";
            let leftStyle = "";
            let dailyAmtStyle = "";
            
            if (isPending) {
                leftStr = `<span style="background:var(--border); padding:2px 8px; border-radius:12px; font-size:0.85em; color:var(--text-muted);">Pending</span>`;
                dailyAmtStyle = "color:var(--text-muted); font-style:italic;";
                dailyAmt = "Pending";
            } else {
                if (leftVal > 0) {
                    leftStr = `-${leftVal.toLocaleString()}`;
                    leftStyle = "color: #ef4444; font-weight: bold;";
                    dailyAmtStyle = "color: #ef4444; font-weight: bold;";
                } else {
                    leftStr = `+${Math.abs(leftVal).toLocaleString()}`;
                    leftStyle = "color: #10b981; font-weight: bold;";
                    dailyAmtStyle = "color: #10b981; font-weight: bold;";
                }
                dailyAmt = dailyAmt.toLocaleString();
            }
            
            let gStr = g > 0 ? g.toLocaleString() : (isPending ? "Pending" : `<span style="color:#eab308; font-weight:bold;">🌟 Goal Met!</span>`);
            let dgStr = dg > 0 ? dg.toLocaleString() : (isPending ? "Pending" : "0");
            
            goalsCard += `<div style="background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
               <div style="font-weight: bold; color: var(--text-main); font-size: 1.05em; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed var(--border); display:flex; justify-content:space-between; align-items:center;">
                 <span>Event Day ${i}</span>
                 ${leftVal <= 0 && !isPending ? `<span style="color:var(--success); font-size:10px; background:rgba(46,204,113,0.1); padding:2px 6px; border-radius:10px; border:1px solid rgba(46,204,113,0.3);">✅ Daily Goal Met</span>` : ''}
               </div>
               <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                 <span style="color: var(--text-muted); font-size: 0.9em;">Daily Goal</span>
                 <span>${dgStr}</span>
               </div>
               <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                 <span style="color: var(--text-muted); font-size: 0.9em;">Left +/-</span>
                 <span style="${leftStyle}">${leftStr}</span>
               </div>
               <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                 <span style="color: var(--text-muted); font-size: 0.9em;">Left to 20M</span>
                 <span>${gStr}</span>
               </div>
               <div style="display: flex; justify-content: space-between;">
                 <span style="color: var(--text-muted); font-size: 0.9em;">Daily Amount</span>
                 <span style="${dailyAmtStyle}">${dailyAmt}</span>
               </div>
             </div>`;
         }
         goalsCard += `</div></div>`;
         
         if (!filterString || filterString.toLowerCase() === 'showdown') {
            finalGoalsCard = goalsCard;
         }
         
      } catch (e) {
        console.warn("Could not fetch showdown event goals for leaderboards view", e);
      }

      html += `<div style="display:flex; flex-wrap:wrap; gap:20px;">`;
      
      if (!filterString || filterString.toLowerCase() === 'showdown') {
          if (liveShowdownHtml) html += liveShowdownHtml;
          if (allTimeShowdownHtml) html += allTimeShowdownHtml;
      }
      
      boards.forEach(board => {
        let titleTrim = board.title.trim().toLowerCase();
        if (titleTrim.includes('showdown') || titleTrim.includes('event goals')) return;
        
        let titleLower = board.title.toLowerCase();

        // Merge Firebase Bear Trap wins with Google Sheets rows (preserving all historical players)
        if (!titleLower.includes('donation') && titleLower.includes('bear trap')) {
            let winsMap = {};
            if (board.rows && Array.isArray(board.rows)) {
                board.rows.forEach(r => {
                    if (r && r[1]) {
                        winsMap[r[1].toString().trim()] = parseInt(String(r[2]).replace(/,/g, '')) || 0;
                    }
                });
            }

            if (Object.keys(fbBtWins).length > 0) {
                Object.values(fbBtWins).forEach(w => {
                    if (w && w.name) {
                        let pName = w.name.trim();
                        let addVal = 0;
                        if (titleLower.includes('all-time bear trap')) addVal = (w.bt1 || 0) + (w.bt2 || 0);
                        else if (titleLower.includes('bear trap 1')) addVal = w.bt1 || 0;
                        else if (titleLower.includes('bear trap 2')) addVal = w.bt2 || 0;
                        else if (titleLower.includes('both bear trap')) addVal = (w.bt1 > 0 && w.bt2 > 0) ? ((w.bt1 || 0) + (w.bt2 || 0)) : 0;

                        if (addVal > 0) {
                            winsMap[pName] = Math.max(winsMap[pName] || 0, addVal);
                        }
                    }
                });
            }

            const sorted = Object.entries(winsMap).filter(kv => kv[1] > 0).sort((a,b) => b[1] - a[1]);
            if (sorted.length > 0) {
                board.rows = sorted.map((kv, idx) => [idx + 1, kv[0], kv[1]]);
            }

            // All-Time Bear Trap Leaderboard shows Top 4 ONLY
            if (titleLower.includes('all-time bear trap')) {
                board.title = "All-Time Bear Trap Leaderboard";
                if (board.rows && Array.isArray(board.rows)) {
                    board.rows = board.rows.slice(0, 4);
                }
            }
        }
        
        if (titleLower.includes('donation')) {
            if (titleLower.includes('all-time')) {
                board.title = "All-Time Bear Trap Donations Leaderboard";
                let mergedScores = {};
                if (board.rows && Array.isArray(board.rows)) {
                    board.rows.forEach(r => {
                        if (r && r[1]) {
                            mergedScores[r[1].toString().trim()] = parseInt(String(r[2]).replace(/,/g, '')) || 0;
                        }
                    });
                }
                if (Object.keys(fbBtDonations).length > 0) {
                    Object.values(fbBtDonations).forEach(d => {
                        if (d && d.name) {
                            let pName = d.name.trim();
                            let fbAmt = d.allTime !== undefined ? d.allTime : (d.amount || 0);
                            if (fbAmt > 0) {
                                mergedScores[pName] = Math.max(mergedScores[pName] || 0, fbAmt);
                            }
                        }
                    });
                }
                const list = Object.entries(mergedScores).filter(kv => kv[1] > 0).sort((a,b) => b[1] - a[1]).slice(0, 4);
                if (list.length > 0) board.rows = list.map((kv, idx) => [idx + 1, kv[0], kv[1]]);
            } else {
                board.title = "Current Bear Trap Donations Leaderboard";
                let currentScores = {};
                if (board.rows && Array.isArray(board.rows)) {
                    board.rows.forEach(r => {
                        if (r && r[1]) {
                            currentScores[r[1].toString().trim()] = parseInt(String(r[2]).replace(/,/g, '')) || 0;
                        }
                    });
                }
                if (Object.keys(fbBtDonations).length > 0) {
                    Object.values(fbBtDonations).forEach(d => {
                        if (d && d.name) {
                            let pName = d.name.trim();
                            let fbAmt = d.current !== undefined ? d.current : (d.amount || 0);
                            if (fbAmt > 0) {
                                currentScores[pName] = fbAmt;
                            }
                        }
                    });
                }
                const list = Object.entries(currentScores).filter(kv => kv[1] > 0).sort((a,b) => b[1] - a[1]).slice(0, 4);
                if (list.length > 0) board.rows = list.map((kv, idx) => [idx + 1, kv[0], kv[1]]);
            }
        }

        let cardStyle = `flex: 1 1 0px; min-width: 300px;`;
        if (board.title.includes('Event Goals')) {
           cardStyle = `flex: 1 1 100%;`;
        }
        
        html += `<div class="card" style="${cardStyle}"><div class="card-title">${board.title}</div>`;
        
        // Champion Banner Logic
        let trapNum = null;
        let isAllTime = false;
        
        if (titleLower.includes('bear trap 1') && !titleLower.includes('donation')) trapNum = '1';
        else if (titleLower.includes('bear trap 2') && !titleLower.includes('donation')) trapNum = '2';
        else if (titleLower.includes('all-time bear trap') && !titleLower.includes('donation')) isAllTime = true;
        
        let isShowdown = titleLower.includes('showdown') && !titleLower.includes('all-time');
        let isAllTimeShowdown = titleLower.includes('all-time showdown');
        
        let champName = null;
        let champScore = null;
        let bannerTitle = "👑 Reigning Champion";
        let scoreLabel = "Total Wins";
         if (trapNum) {
            if (btWinners[trapNum] && btWinners[trapNum].name) {
               champName = btWinners[trapNum].name;
               champScore = btWinners[trapNum].score;
            } else if (board.rows.length > 0) {
               let firstRow = board.rows[0];
               champName = firstRow[1] ? firstRow[1].toString() : null;
               champScore = firstRow[2] !== undefined ? firstRow[2] : null;
            } else if (isBearTrapActive) {
               champName = "Pending...";
               champScore = "-";
            }
         } else if (isAllTime && board.rows.length > 0) {
           let firstRow = board.rows[0];
           champName = firstRow[1] ? firstRow[1].toString() : null;
           champScore = firstRow[2] !== undefined ? firstRow[2] : null;
           bannerTitle = "👑 All-Time Champion";
        } else if (isShowdown && board.rows.length > 0) {
           let firstRow = board.rows[0];
           champName = firstRow[1] ? firstRow[1].toString() : null;
           champScore = firstRow[2] !== undefined ? firstRow[2] : null;
           bannerTitle = "👑 Showdown MVP";
           scoreLabel = "Total Score";
        } else if (isAllTimeShowdown && board.rows.length > 0) {
           let firstRow = board.rows[0];
           champName = firstRow[1] ? firstRow[1].toString() : null;
           champScore = firstRow[2] !== undefined ? firstRow[2] : null;
           bannerTitle = "👑 All-Time MVP";
           scoreLabel = "Total Score";
        }
        
        if (champName) {
           let avatarHtml = '';
           let isPending = champName === "Pending..." || champName === "?" || !champName;
           
           if (isPending) {
              avatarHtml = `
                <div style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid rgba(255,215,0,0.6); background: rgba(255,215,0,0.1); display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: bold; color: #FFD700; flex-shrink: 0; box-shadow: 0 0 12px rgba(255,215,0,0.3);">
                  ❓
                </div>
              `;
           } else {
              // Look up their gameId to get the avatar
              let champId = null;
              for (const [gid, name] of Object.entries(idToNameMap)) {
                  if (name.toLowerCase() === champName.toLowerCase()) {
                      champId = gid; break;
                  }
              }
              const avatarSrc = (champId && avatarMap[champId]) ? avatarMap[champId] : `images/${champName}.png`;
              avatarHtml = `
                <div style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #FFD700; overflow: hidden; flex-shrink: 0; box-shadow: 0 0 10px rgba(255,215,0,0.2);">
                  <img src="${avatarSrc}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.src='images/default.png';">
                </div>
              `;
           }
           
           html += `
             <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(255,215,0,0.05);">
               ${avatarHtml}
               <div style="flex: 1;">
                 <div style="color: #FFD700; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">${bannerTitle}</div>
                 <div style="color: var(--text-main); font-size: 18px; font-weight: bold;">${champName}</div>
               </div>
               <div style="text-align: right;">
                 <div style="color: var(--text-muted); font-size: 11px;">${scoreLabel}</div>
                 <div style="color: var(--accent); font-size: 20px; font-weight: bold;">${champScore}</div>
               </div>
             </div>
           `;
        }
        if (board.title.includes('Event Goals')) {
            let allTimeGoal = 20000000;
            let totalScore = board.totalScore || 0;
            let allTimeProgress = Math.min(100, (totalScore / allTimeGoal) * 100);
            
            const formatNumber = (num) => {
              if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
              if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
              return num.toLocaleString();
            };
            
            html += `
            <div style="margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px dashed var(--border);">
              <div style="display:flex; justify-content:space-between; font-size:16px; font-weight:bold; margin-bottom:8px; align-items:center;">
                <div style="display:flex; align-items:center; gap:10px;">
                  <span style="color:var(--text-main);">🌟 The 20M Challenge</span>
                  ${totalScore >= allTimeGoal ? `<span style="color:var(--success); font-size:12px; font-weight:bold; background:rgba(46,204,113,0.1); padding:2px 8px; border-radius:12px; border:1px solid rgba(46,204,113,0.3); animation:pulse 2s infinite;">🎉 Goal Reached!</span>` : ''}
                </div>
                <span style="color:var(--text-muted);">${formatNumber(totalScore)} / <span style="color:var(--accent);">${formatNumber(allTimeGoal)}</span></span>
              </div>
              <div style="width:100%; height:12px; background:rgba(0,0,0,0.3); border-radius:6px; overflow:hidden; border:1px solid var(--border);">
                <div style="width:${allTimeProgress}%; height:100%; background:linear-gradient(90deg, #8b5cf6, #d946ef); border-radius:6px; transition:width 1.5s cubic-bezier(0.4, 0, 0.2, 1); box-shadow:0 0 10px #d946ef;"></div>
              </div>
            </div>`;
            
            html += `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 15px;">`;
            board.rows.forEach(row => {
                let eventDay = formatCell(row[0] !== undefined ? row[0] : '');
                let dailyGoalRaw = row[1];
                let leftRaw = row[2];
                let goal = formatCell(row[3] !== undefined ? row[3] : '');
                let dailyAmtRaw = row[4];
                
                let numDailyGoal = typeof dailyGoalRaw === 'number' ? dailyGoalRaw : Number(dailyGoalRaw.toString().replace(/,/g, ''));
                let numDailyAmt = typeof dailyAmtRaw === 'number' ? dailyAmtRaw : Number(dailyAmtRaw.toString().replace(/,/g, ''));
                let numLeft = typeof leftRaw === 'number' ? leftRaw : Number(leftRaw.toString().replace(/,/g, ''));
                
                let leftStyle = '';
                if (!isNaN(numLeft)) {
                   leftStyle = numLeft <= 0 ? 'color:var(--success); font-weight:bold;' : 'color:var(--danger);';
                }
                
                let dailyAmtStyle = 'font-weight: bold; color: var(--accent);';
                if (!isNaN(numDailyAmt) && !isNaN(numDailyGoal) && dailyAmtRaw !== "" && dailyGoalRaw !== "") {
                   dailyAmtStyle = numDailyAmt >= numDailyGoal ? 'font-weight: bold; color: var(--success);' : 'font-weight: bold; color: var(--danger);';
                }
                
                let dailyGoal = !isNaN(numDailyGoal) && dailyGoalRaw !== "" ? numDailyGoal.toLocaleString() : dailyGoalRaw;
                let left = leftRaw;
                if (!isNaN(numLeft) && leftRaw !== "") {
                    if (numLeft > 0) left = '-' + numLeft.toLocaleString();
                    else if (numLeft < 0) left = '+' + Math.abs(numLeft).toLocaleString();
                    else left = '0';
                }
                let dailyAmt = !isNaN(numDailyAmt) && dailyAmtRaw !== "" ? numDailyAmt.toLocaleString() : dailyAmtRaw;

                if (dailyAmtRaw === "" || dailyAmtRaw === undefined || dailyAmtRaw === null || numDailyAmt === 0 || Math.abs(numLeft - numDailyGoal) < 0.01) {
                    left = 'Pending';
                    leftStyle = 'color:var(--text-muted); font-style:italic;';
                    dailyAmt = 'Pending';
                    dailyAmtStyle = 'color:var(--text-muted); font-style:italic;';
                }

                html += `
                <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px; padding: 15px; box-shadow: inset 0 2px 5px rgba(0,0,0,0.1);">
                  <div style="font-weight: bold; color: var(--text-main); font-size: 1.05em; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed var(--border);">${eventDay}</div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-muted); font-size: 0.9em;">Daily Goal</span>
                    <span>${dailyGoal}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-muted); font-size: 0.9em;">Left +/-</span>
                    <span style="${leftStyle}">${left}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: var(--text-muted); font-size: 0.9em;">Goal</span>
                    <span>${goal}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-muted); font-size: 0.9em;">Daily Amount</span>
                    <span style="${dailyAmtStyle}">${dailyAmt}</span>
                  </div>
                </div>`;
            });
            html += `</div></div>`;
        } else {
            html += `<div class="card-table-scroll"><table style="min-width: max-content; width: 100%;"><thead><tr>`;
            board.headers.forEach(h => html += `<th>${h}</th>`);
            html += `</tr></thead><tbody>`;
            
            board.rows.forEach(row => {
              html += `<tr>`;
              row.forEach((cell, idx) => {
                if (typeof cell === 'number') {
                  if (idx === 0) {
                     if (cell === 1) cell = '🥇 1';
                     else if (cell === 2) cell = '🥈 2';
                     else if (cell === 3) cell = '🥉 3';
                     else cell = cell.toLocaleString();
                  } else {
                     cell = cell.toLocaleString();
                  }
                }
                // Ensure strings that look like numbers are also formatted, but carefully
                else if (typeof cell === 'string' && !isNaN(cell) && cell.trim() !== "" && idx > 0) {
                  cell = Number(cell).toLocaleString();
                }
                
                let formattedCell = formatCell(cell);
                html += `<td ${idx === 0 ? 'style="font-weight:bold; color:var(--text-muted);"' : ''}>${formattedCell}</td>`;
              });
              html += `</tr>`;
            });
            html += `</tbody></table>`;
        if (((board.title.toLowerCase().includes('bear') || board.title.toLowerCase().includes('bt')) && board.title.toLowerCase().includes('donation'))) {
           // We'll append the widget placeholder specifically under the Bear Donations board
           html += `<div id="bearTrapActivityWidget-${board.title.replace(/\s+/g, '')}" class="bear-trap-activity-widget" style="margin-top: 15px;"></div>`;
        }
            html += `</div></div>`;
        }
      });
      
      html += `</div>`;
      if (finalGoalsCard) {
          html += finalGoalsCard;
      }
      app.innerHTML = html;
      
      // Initialize Firebase Listeners for any Bear Trap widgets rendered
      document.querySelectorAll('.bear-trap-activity-widget').forEach(widget => {
        widget.innerHTML = `<div style="text-align:center; color:var(--text-muted); font-size:12px; padding:10px;">Loading today's activity...</div>`;
        
        const logRef = ref(db, 'bearTrapLog');
        onValue(logRef, (snapshot) => {
          if (!document.contains(widget)) return; // Exit if user navigated away
          
          let logs = snapshot.val();
          if (!logs || !Array.isArray(logs)) {
             widget.innerHTML = '';
             return;
          }
          
          const todayStr = new Date().toDateString();
          let todaysLogs = logs.filter(log => new Date(log.timestamp).toDateString() === todayStr);
          
          if (todaysLogs.length === 0) {
             widget.innerHTML = '';
             return;
          }
          
          todaysLogs.reverse(); // Newest first
          
          let logHtml = `<div class="bear-trap-logs-container" style="background:var(--bg-main); border:1px solid var(--border); border-radius:8px; overflow:hidden;">
            <button onclick="this.nextElementSibling.classList.toggle('hidden')" style="width:100%; background:transparent; border:none; padding:12px 15px; color:var(--text-main); font-weight:bold; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
              <span>&#128197; View Today's Activity (${todaysLogs.length} Update${todaysLogs.length > 1 ? 's' : ''})</span>
              <div style="display:flex; gap:10px; align-items:center;">
                <span onclick="event.stopPropagation(); window.forceRefreshTodaysActivity(this.closest('.bear-trap-activity-widget'))" style="background:var(--accent); color:white; padding:4px 10px; border-radius:4px; font-size:11px; cursor:pointer;">&#128259; Refresh</span>
                <span style="color:var(--text-muted);">&#9660;</span>
              </div>
            </button>
            <div class="hidden bear-trap-logs-content-area" style="padding:0 15px 15px 15px; border-top:1px solid var(--border);">
              <ul style="list-style:none; padding:0; margin:0; margin-top:10px;">`;
              
          todaysLogs.forEach(log => {
             let d = new Date(log.timestamp);
             let timeStr = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
             logHtml += `<li style="padding:8px 0; border-bottom:1px dashed var(--border); font-size:13px; color:var(--text-muted);">
                <span style="color:var(--accent); font-weight:bold;">${timeStr}</span>: 
                <span style="color:var(--text-main); font-weight:bold;">${log.name}</span> donated 
                <span style="color:var(--success); font-weight:bold;">+${log.amount}</span> trap${log.amount !== 1 ? 's' : ''}
             </li>`;
          });
          
          logHtml += `</ul></div></div>`;
          widget.innerHTML = logHtml;
        });
      });
      
    } catch(e) { renderError(e.message); }
  },

  
  



  showdown: async () => {
    if (window.clearShowdownCaches) window.clearShowdownCaches();
    if (window.ensureShowdownDataSeeded) await window.ensureShowdownDataSeeded();
    // ensureJuly20BlockInHistory checked on init only
    renderLoading("Loading Showdown Data");
    try {
       const [liveSnap, metaSnap, historySnap] = await Promise.all([
          get(ref(db, 'showdown_live')),
          get(ref(db, 'showdown_meta')),
          get(ref(db, 'showdown_meta/history')).catch(() => null)
       ]);
       
       const metaData = (metaSnap && metaSnap.exists() && metaSnap.val()) ? metaSnap.val() : {};
       let fetchedHist = (historySnap && historySnap.exists() && historySnap.val()) ? historySnap.val() : {};
       try {
           let sdRaw = await fetchSheet("Showdown History");
           let rawHist = sdRaw;
           if (rawHist && typeof rawHist === 'object' && rawHist.data) rawHist = rawHist.data;
           let histRows = rawHist ? (Array.isArray(rawHist) ? rawHist : Object.values(rawHist)) : [];
           if (histRows && histRows.length > 0) {
               let parsedSheets = window.parseShowdownHistoryRows(histRows);
               fetchedHist = Object.assign({}, parsedSheets, fetchedHist);
           }
       } catch (err) { console.warn("Failed to fetch Google Sheets history:", err); }
       const historyObj = window.getMergedShowdownHistoryObj(fetchedHist);

       let liveData = (liveSnap && liveSnap.exists() && liveSnap.val()) ? liveSnap.val() : {};
       if (liveData && liveData.error) delete liveData.error;

       const enemyAlliance = (metaData && metaData.enemyAlliance && typeof metaData.enemyAlliance === 'object') ? metaData.enemyAlliance : { name: 'Enemy Alliance', scores: {} };
       const eScores = (enemyAlliance && enemyAlliance.scores && typeof enemyAlliance.scores === 'object') ? enemyAlliance.scores : {};
       const enemyName = enemyAlliance.name || 'Enemy Alliance';
       
       let html = `<div style="display:flex; flex-direction:column; gap:20px;">`;
       
       // Calculate Our Scores
       let ourScores = { d1:0, d2:0, d3:0, d4:0, d5:0, d6:0 };
       let players = [];
       let topPlayers = { d1:{names:[], score:0}, d2:{names:[], score:0}, d3:{names:[], score:0}, d4:{names:[], score:0}, d5:{names:[], score:0}, d6:{names:[], score:0} };
       
       for (const [pName, scores] of Object.entries(liveData)) {
          if (!scores || typeof scores !== 'object') continue;
          let pd1 = scores.d1 || 0;
          let pd2 = scores.d2 || 0;
          let pd3 = scores.d3 || 0;
          let pd4 = scores.d4 || 0;
          let pd5 = scores.d5 || 0;
          let pd6 = scores.d6 || 0;
          let pTotal = pd1 + pd2 + pd3 + pd4 + pd5 + pd6;
          
          ourScores.d1 += pd1;
          ourScores.d2 += pd2;
          ourScores.d3 += pd3;
          ourScores.d4 += pd4;
          ourScores.d5 += pd5;
          ourScores.d6 += pd6;
          
          for (let di = 1; di <= 6; di++) {
             let dScore = scores['d' + di] || 0;
             if (dScore > 0) {
                if (dScore > topPlayers['d' + di].score) {
                   topPlayers['d' + di] = { names: [pName], score: dScore };
                } else if (dScore === topPlayers['d' + di].score) {
                   topPlayers['d' + di].names.push(pName);
                }
             }
          }
          
          players.push({ name: pName, d1: pd1, d2: pd2, d3: pd3, d4: pd4, d5: pd5, d6: pd6, total: pTotal });
       }
       
       ourScores.total = ourScores.d1 + ourScores.d2 + ourScores.d3 + ourScores.d4 + ourScores.d5 + ourScores.d6;
       let enemyTotal = (eScores.d1||0) + (eScores.d2||0) + (eScores.d3||0) + (eScores.d4||0) + (eScores.d5||0) + (eScores.d6||0);
       
       const staticHorns = { d1: 1, d2: 2, d3: 2, d4: 2, d5: 2, d6: 4 };
       const hornsTotal = 13;
       const dailyGoal = 3333333;
       // MVP Calculation - Detect latest active day MVP
       let currentActiveDay = 1;
       for (let di = 6; di >= 1; di--) {
           let dayHasScore = false;
           for (const scores of Object.values(liveData)) {
               if (scores && typeof scores === 'object' && (scores['d' + di] || 0) > 0) {
                   dayHasScore = true; break;
               }
           }
           if (dayHasScore) {
               currentActiveDay = di; break;
           }
       }
       
       let isEventComplete = (currentActiveDay === 6 && (ourScores.d6 > 0 || ((eScores.d6 || 0) > 0)));
       let mvpTitle = "";
       let mvpWinners = [];
       let mvpDisplayHorns = 0;
       let mvpLabelText = "Total Horns";
       
       if (isEventComplete) {
           let playerHorns = {};
           for(let di=1; di<=6; di++) {
               let dayObj = topPlayers['d'+di];
               if (dayObj && dayObj.score > 0 && dayObj.names.length > 0) {
                   dayObj.names.forEach(name => {
                       playerHorns[name] = (playerHorns[name] || 0) + staticHorns['d'+di];
                   });
               }
           }
           let maxHorns = 0;
           for (const horns of Object.values(playerHorns)) if (horns > maxHorns) maxHorns = horns;
           mvpWinners = Object.keys(playerHorns).filter(name => playerHorns[name] === maxHorns);
           mvpTitle = mvpWinners.length > 1 ? "👑 Showdown Co-MVPs" : "👑 Showdown MVP";
           mvpDisplayHorns = maxHorns;
       } else {
           let dayObj = topPlayers['d' + currentActiveDay];
           mvpWinners = (dayObj && dayObj.names) ? dayObj.names : [];
           mvpTitle = mvpWinners.length > 1 ? `👑 DAY ${currentActiveDay} CO-MVPS` : `👑 DAY ${currentActiveDay} MVP`;
           mvpDisplayHorns = staticHorns['d' + currentActiveDay];
           mvpLabelText = `Day ${currentActiveDay} Horns`;
       }
       
       let titleRightHtml = "";
       if (mvpWinners.length > 0) {
           let champDisplayNames = mvpWinners.map(escapeHTML).join(" & ");
           let avatarStackHtml = renderAvatarStack(mvpWinners);
           
           titleRightHtml = `
              <div style="background: linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,215,0,0.02) 100%); border: 1px solid rgba(255,215,0,0.3); border-radius: 12px; padding: 15px; margin-bottom: 20px; display: flex; align-items: center; gap: 15px; box-shadow: 0 4px 15px rgba(255,215,0,0.05);">
                ${avatarStackHtml}
                <div style="flex: 1; text-align: left;">
                  <div style="color: #FFD700; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px;">${mvpTitle}</div>
                  <div style="color: var(--text-main); font-size: 18px; font-weight: bold;">${champDisplayNames}</div>
                </div>
                <div style="text-align: right;">
                  <div style="color: var(--text-muted); font-size: 11px; text-transform: uppercase;">${mvpLabelText}</div>
                  <div style="color: #FFD700; font-size: 20px; font-weight: bold;">${mvpDisplayHorns}</div>
                </div>
              </div>
            `;
       }
       
       // 2. Alliance Progress
       let dayHeadersHtml = '';
       for(let i=1; i<=6; i++) {
           dayHeadersHtml += `<th style="border-right: 1px solid rgba(255,255,255,0.08); text-align:center;"><span style="background:rgba(255,255,255,0.05); padding:3px 10px; border-radius:6px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">Day ${i}</span></th>`;
       }

       let allianceCard = `<div class="card">
          <div class="card-title">⚔️ Alliance Progress</div>${titleRightHtml}
          <div class="card-table-scroll" style="overflow-x:auto; width:100%; border-radius:8px; border:1px solid var(--border);">
          <table style="min-width:650px; border-collapse:collapse;"><thead><tr>
          <th style="position:sticky; left:0; background:var(--card-bg); z-index:6; box-shadow: 1px 0 0 var(--border);">Alliance's Showdown</th><th style="border-right: 1px solid rgba(255,255,255,0.12); text-align:center;">Total</th>${dayHeadersHtml}
       </tr></thead><tbody>`;
       
       // Determine Total winner
       let enemyTotalStyle = "font-weight:bold; border-right: 1px solid rgba(255,255,255,0.12); text-align:center;";
       let ourTotalStyle = "font-weight:bold; border-right: 1px solid rgba(255,255,255,0.12); text-align:center;";
       if (enemyTotal > 0 || ourScores.total > 0) {
           if (enemyTotal > ourScores.total) enemyTotalStyle += " color:#10b981;";
           else if (ourScores.total > enemyTotal) ourTotalStyle += " color:#10b981;";
       }

       // Enemy Row
       allianceCard += `<tr><td style="font-weight:bold; position:sticky; left:0; background:var(--card-bg); z-index:2; box-shadow: 1px 0 0 var(--border);">${enemyName}</td><td style="${enemyTotalStyle}">${enemyTotal.toLocaleString()}</td>`;
       for(let i=1; i<=6; i++) {
           let eScore = eScores['d'+i] || 0;
           let oScore = ourScores['d'+i] || 0;
           let style = "border-right: 1px solid rgba(255,255,255,0.06); text-align:center;";
           if (eScore > 0 || oScore > 0) {
              if (eScore > oScore) style += " color:#10b981; font-weight:bold;";
           }
           allianceCard += `<td style="${style}">${eScore > 0 ? eScore.toLocaleString() : ''}</td>`;
       }
       allianceCard += `</tr>`;
       
       // Our Row
       allianceCard += `<tr><td style="font-weight:bold; position:sticky; left:0; background:var(--card-bg); z-index:2; box-shadow: 1px 0 0 var(--border);">Our Alliance</td><td style="${ourTotalStyle}">${ourScores.total.toLocaleString()}</td>`;
       for(let i=1; i<=6; i++) {
           let eScore = eScores['d'+i] || 0;
           let oScore = ourScores['d'+i] || 0;
           let style = "font-weight:bold; border-right: 1px solid rgba(255,255,255,0.06); text-align:center;";
           if (eScore > 0 || oScore > 0) {
              if (oScore > eScore) style += " color:#10b981;";
           }
           allianceCard += `<td style="${style}">${oScore > 0 ? oScore.toLocaleString() : ''}</td>`;
       }
       allianceCard += `</tr>`;
       
       // Horn Rewards
       allianceCard += `<tr><td style="font-weight:bold; position:sticky; left:0; background:var(--card-bg); z-index:2; box-shadow: 1px 0 0 var(--border);">Horn Rewards</td><td style="border-right: 1px solid rgba(255,255,255,0.12); text-align:center;">${hornsTotal}</td>`;
       for(let i=1; i<=6; i++) allianceCard += `<td style="border-right: 1px solid rgba(255,255,255,0.06); text-align:center;">${staticHorns['d'+i]}</td>`;
       allianceCard += `</tr>`;
       
       // Winners Row
       allianceCard += `<tr><td style="font-weight:bold; position:sticky; left:0; background:var(--card-bg); z-index:2; box-shadow: 1px 0 0 var(--border);">Winners</td><td style="border-right: 1px solid rgba(255,255,255,0.12);"></td>`;
       for(let di=1; di<=6; di++) {
           let dayObj = topPlayers['d'+di];
           let w = (dayObj && dayObj.names && dayObj.names.length > 0) ? dayObj.names.map(escapeHTML).join(' & ') : '';
           let style = "font-weight:bold; color:#FFD700; border-right: 1px solid rgba(255,255,255,0.06); text-align:center;";
           allianceCard += `<td style="${style}">${w}</td>`;
       }
       allianceCard += `</tr></tbody></table></div></div>`;
       
       // 3. Player Rankings Table
       players.sort((a, b) => b.total - a.total);
       
       let pDayHeaders = '';
       for(let i=1; i<=6; i++) {
           pDayHeaders += `<th class="hide-mobile" style="border-right: 1px solid rgba(255,255,255,0.08); text-align:center;"><span style="background:rgba(255,255,255,0.05); padding:3px 10px; border-radius:6px; font-size:11px; text-transform:uppercase; letter-spacing:0.5px;">Day ${i}</span></th>`;
       }
       
       let playersCard = `<div class="card"><div class="card-title">🏆 Player Rankings</div><div class="card-table-scroll" style="overflow-x:auto; width:100%; border-radius:8px; border:1px solid var(--border);"><table style="min-width:700px; border-collapse:collapse;"><thead><tr>
          <th style="position:sticky; left:0; background:var(--card-bg); z-index:6; width:45px;">Rank</th><th style="position:sticky; left:45px; background:var(--card-bg); z-index:6; box-shadow: 1px 0 0 var(--border); max-width:120px;">Name</th><th style="border-right: 1px solid rgba(255,255,255,0.12); text-align:center;">Total Score</th>${pDayHeaders}
       </tr></thead><tbody>`;
       
       let currentPRank = 1;
        players.forEach((p, index) => {
            if (index > 0) {
                let prev = players[index - 1];
                if (p.total !== prev.total) {
                    currentPRank += 1;
                }
            }
            let isTie = players.filter(o => o.total === p.total).length > 1;
            let tieBadge = isTie ? ' <span style="font-size:11px; opacity:0.85;" title="Tied Rank">🤝</span>' : '';
            let rankDisplay = `${currentPRank}${tieBadge}`;
            if (currentPRank === 1) rankDisplay = `🥇 1${tieBadge}`;
            else if (currentPRank === 2) rankDisplay = `🥈 2${tieBadge}`;
            else if (currentPRank === 3) rankDisplay = `🥉 3${tieBadge}`;
            
            let dayCells = '';
            for (let di = 1; di <= 6; di++) {
                let val = p['d' + di] || 0;
                dayCells += `<td class="hide-mobile" style="border-right: 1px solid rgba(255,255,255,0.06); text-align:center;">${val > 0 ? val.toLocaleString() : '-'}</td>`;
            }
            
            playersCard += `<tr>
               <td style="font-weight:bold; color:var(--text-muted); position:sticky; left:0; background:var(--card-bg); z-index:2; text-align:center;">${rankDisplay}</td>
               <td style="position:sticky; left:45px; background:var(--card-bg); z-index:2; box-shadow: 1px 0 0 var(--border); max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${formatCell(p.name)}</td>
               <td style="font-weight:bold; border-right: 1px solid rgba(255,255,255,0.12); text-align:center;">${p.total > 0 ? p.total.toLocaleString() : '0'}</td>
               ${dayCells}
            </tr>`;
        });
        playersCard += `</tbody></table></div></div>`;
        
        const archiveVaultBannerHtml = `
          <div style="margin-bottom:20px; display:flex; justify-content:flex-end; align-items:center; gap:10px; flex-wrap:wrap;">
            <button onclick="window.openShowdownArchiveVaultModal()" style="background:linear-gradient(135deg, rgba(6,182,212,0.2) 0%, rgba(6,182,212,0.05) 100%); border:1px solid rgba(6,182,212,0.4); color:var(--accent); padding:8px 16px; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer; display:inline-flex; align-items:center; gap:8px; box-shadow:0 4px 12px rgba(6,182,212,0.15); transition:all 0.2s ease;">
              📜 View Showdown Archive Vault
            </button>
            <button onclick="window.resetCurrentShowdown()" style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.4); color:var(--danger); padding:8px 16px; border-radius:8px; font-weight:bold; font-size:13px; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:all 0.2s ease;">
              🔄 Reset Event
            </button>
          </div>
        `;
        html += archiveVaultBannerHtml + allianceCard + playersCard + `</div>`;
        app.innerHTML = html;
       
    } catch(e) { renderError(e.message); }
  },
  roster: async () => {
    renderLoading("Loading Player Lookup");
    try {

      
      
      const [data, rosterRawData, lbRawData, sdHistoryRawData, sdLiveSnap] = await Promise.all([
            window.fetchActivityData(),
            window.fetchRoster(),
            window.fetchLeaderboardsData(),
            fetchSheet("Showdown History"),
            get(ref(db, 'showdown_live'))
          ]);
      
      const sdLiveData = sdLiveSnap.val() || {};

      let currentDay = 0;
      Object.values(sdLiveData).forEach(p => {
         if (!p || typeof p !== 'object') return;
         if ((p.d6||0) > 0 && currentDay < 6) currentDay = 6;
         else if ((p.d5||0) > 0 && currentDay < 5) currentDay = 5;
         else if ((p.d4||0) > 0 && currentDay < 4) currentDay = 4;
         else if ((p.d3||0) > 0 && currentDay < 3) currentDay = 3;
         else if ((p.d2||0) > 0 && currentDay < 2) currentDay = 2;
         else if ((p.d1||0) > 0 && currentDay < 1) currentDay = 1;
      });
      if (data && data.length > 1) {
          for (let r = 1; r < data.length; r++) {
             let pName = data[r][0];
             if (!pName) continue;
             let safeName = pName.toString().trim();
             let missedCount = 0;
             if (currentDay > 0) {
                let p = sdLiveData[safeName] || {};
                for (let i = 1; i <= currentDay; i++) {
                   if (!(p['d'+i] > 0)) missedCount++;
                }
             }
             data[r][1] = missedCount;
          }
      }
        
        let usersSnap = null;
        try { usersSnap = await get(ref(db, 'users')); } catch(e) { console.warn("Could not fetch users:", e); }
      
      if (!data || data.length < 2) throw new Error("No data found.");
      
      const rosterMap = rosterRawData || {};
      await refreshIdToNameMap();
      
      // Parse Leaderboards data into a lookup map (Name -> [{title, score, emoji}])
      const lbMap = {};
      if (lbRawData) {
        for (let r = 0; r < lbRawData.length; r++) {
          for (let c = 0; c < lbRawData[r].length; c++) {
            let cell = lbRawData[r][c];
            if (typeof cell === 'string' && (cell.toLowerCase().includes('leaderboard') || (cell.toLowerCase().includes('all-time') && (cell.toLowerCase().includes('bear') || cell.toLowerCase().includes('bt')) && cell.toLowerCase().includes('donation')))) {
              let title = cell.replace(/leaderboard/i, '').trim();
              let emoji = "🏆";
              if (title.toLowerCase().includes("bear")) emoji = "🐻";
              else if (title.toLowerCase().includes("showdown")) emoji = "⚔️";
              
              // Find the primary score column by scanning the headers (the last column of the table)
              let scoreCol = c + 1;
              for (let i = c + 1; i <= c + 10; i++) {
                if (!lbRawData[r+1] || !lbRawData[r+1][i]) break;
                scoreCol = i;
              }
              
              // Process the rows below the header
              let hr = r + 2;
              while (hr < lbRawData.length && lbRawData[hr][c] && lbRawData[hr][c].toString().trim() !== "") {
                let pName = lbRawData[hr][c+1]; // Name is typically one column over from Rank
                let score = lbRawData[hr][scoreCol];
                if (pName && score !== undefined && score !== "") {
                  let safeName = pName.toString().trim();
                  if (!lbMap[safeName]) lbMap[safeName] = [];
                  let rank = lbRawData[hr][c] || hr - (r + 1);
                  if (typeof rank === 'number') {
                     if (rank === 1) rank = '🥇 1st';
                     else if (rank === 2) rank = '🥈 2nd';
                     else if (rank === 3) rank = '🥉 3rd';
                     else rank += 'th';
                  }
                  
                  let formattedScore = score;
                  if (typeof score === 'number') {
                    if (score >= 1000000) formattedScore = (score / 1000000).toFixed(1) + 'M';
                    else formattedScore = score.toLocaleString();
                  }
                  
                  lbMap[safeName].push({ title, score: formattedScore, rank, emoji });
                }
                hr++;
              }
            }
          }
        }
      }
      
      // Parse dynamic All-Time Showdown totals from history and current showdown
      const allTimeShowdownMap = {};
      
      const processShowdownTable = (tableData) => {
        if (!tableData) return;
        for (let r = 0; r < tableData.length; r++) {
          let row = tableData[r];
          // Find the Ranking/Name header row
          if (row.some(c => typeof c === 'string' && c.toLowerCase().trim() === 'ranking')) {
            let nameCol = row.findIndex(c => typeof c === 'string' && (c.toLowerCase().includes('name') || c.toLowerCase().includes('member') || c.toLowerCase().includes('player')));
            let totalCol = row.findIndex(c => typeof c === 'string' && (c.toLowerCase().includes('total')));
            
            if (nameCol !== -1 && totalCol !== -1) {
              let dr = r + 1;
              // Skip horns/winners rows if they exist
              while (dr < tableData.length && tableData[dr][nameCol] && (tableData[dr][nameCol].toString().toLowerCase().includes('horns') || tableData[dr][nameCol].toString().toLowerCase().includes('winners'))) {
                dr++;
              }
              
              // Process player scores
              while (dr < tableData.length && tableData[dr][nameCol] !== undefined && tableData[dr][nameCol] !== "") {
                let pName = tableData[dr][nameCol];
                let pScore = tableData[dr][totalCol];
                
                if (pName && (typeof pScore === 'number' || (typeof pScore === 'string' && !isNaN(pScore)))) {
                  let safeName = pName.toString().trim();
                  if (!allTimeShowdownMap[safeName]) allTimeShowdownMap[safeName] = 0;
                  allTimeShowdownMap[safeName] += Number(pScore);
                }
                dr++;
              }
            }
          }
        }
      };
      
      processShowdownTable(sdHistoryRawData);
      
      for (const [pName, scores] of Object.entries(sdLiveData)) {
          if (!scores || typeof scores !== 'object') continue;
          let safeName = pName.toString().trim();
          let pScore = (scores.d1||0) + (scores.d2||0) + (scores.d3||0) + (scores.d4||0) + (scores.d5||0) + (scores.d6||0);
          if (!allTimeShowdownMap[safeName]) allTimeShowdownMap[safeName] = 0;
          allTimeShowdownMap[safeName] += pScore;
      }

      
      // Calculate All-Time Showdown Rankings
      const allTimeRankingsMap = {};
      const sortedShowdownPlayers = Object.entries(allTimeShowdownMap)
        .map(([name, score]) => ({ name, score }))
        .sort((a, b) => b.score - a.score);
        
      sortedShowdownPlayers.forEach((p, index) => {
        allTimeRankingsMap[p.name] = {
          score: p.score,
          rank: index + 1
        };
      });
      const headers = data[0];
      
      // Determine if a column is an upcoming/unscheduled event (no one has a 'true' value)
      // Determine if Showdown is active (at least one person has missed a day)
      let showdownActive = false;
      for (let r = 1; r < data.length; r++) {
        if (!data[r]) continue;
        let missed = data[r][1];
        if (missed !== undefined && missed !== null && missed.toString().trim() !== "" && missed !== 0 && missed !== "0") {
          showdownActive = true;
          break;
        }
      }
      
      const colIsUpcoming = {};
      for (let c = 1; c < headers.length; c++) {
        let hasAnyTrue = false;
        for (let r = 1; r < data.length; r++) {
          if (!data[r]) continue;
          let val = data[r][c];
          if (val === true || (typeof val === 'string' && (val.toLowerCase().trim() === 'true' || val === '✓' || val.toLowerCase().trim() === 'yes' || val === '✅'))) {
            hasAnyTrue = true;
            break;
          }
        }
        colIsUpcoming[c] = !hasAnyTrue;
      }
      
      const players = [];
      // Start from index 1 to skip header
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] && data[i][0].toString().trim() !== "") {
          players.push(data[i]);
        }
      }
      
      // Sort players alphabetically for the dropdown
        players.sort((a, b) => a[0].toString().localeCompare(b[0].toString()));
        
        const registeredGameIds = new Set();
        if (usersSnap && usersSnap.val()) {
            Object.values(usersSnap.val()).forEach(u => {
                if (u.gameId) registeredGameIds.add(u.gameId.toString().trim());
                if (u.linkedGameIds && Array.isArray(u.linkedGameIds)) {
                    u.linkedGameIds.forEach(id => registeredGameIds.add(id.toString().trim()));
                }
            });
        }
        
        let html = `
                    <div id="rosterMobileHeader" style="display:none; align-items:center; padding:15px; background:var(--card-bg); border-bottom:1px solid var(--border); margin:-20px -20px 20px -20px; position:sticky; top:0; z-index:1000;">
                        <button onclick="views.home();" style="background:transparent; border:none; color:var(--text-main); font-size:24px; cursor:pointer; margin-right:15px; display:flex; align-items:center; padding:0;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                        </button>
                        <div style="font-size:20px; font-weight:bold; color:var(--text-main);">Chief's List</div>
                    </div>
                    
                    <div class="card" style="margin-bottom:20px; text-align:center;">
                      <div class="card-title" id="rosterDesktopTitle" style="margin-bottom:15px; font-size:24px;">🕵️‍♂️ Player Lookup</div>

                      <div style="display:flex; justify-content:center; align-items:center;">
                        <div style="position:relative; width:100%; max-width:400px; display:flex; align-items:center;">
                          <input type="text" id="playerLookupSelect" placeholder="Search Chief Name..." autocomplete="off" style="width:100%; padding:12px 40px 12px 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); font-size:16px; font-weight:bold; cursor:text; box-sizing:border-box; position:relative; z-index:101;">
                          <button onclick="let input = document.getElementById('playerLookupSelect'); input.value=''; input.dispatchEvent(new Event('input')); input.focus();" style="position:absolute; right:10px; background:transparent; border:none; color:var(--danger); font-size:16px; cursor:pointer; font-weight:bold; display:flex; align-items:center; justify-content:center; width:28px; height:28px; padding:0; border-radius:50%; z-index:102;" onmouseover="this.style.background='rgba(239,68,68,0.1)'" onmouseout="this.style.background='transparent'">✖</button>
                          <div id="playerLookupCustomDropdown" style="display:none; position:absolute; top:calc(100% - 8px); left:0; width:100%; max-height:300px; overflow-y:auto; background:var(--card-bg); border:1px solid var(--border); border-radius:0 0 8px 8px; z-index:100; box-shadow:0 10px 30px rgba(0,0,0,0.6); flex-direction:column; padding-top:8px;"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div id="playerProfileContainer">
                      <div style="text-align:center; color:var(--text-muted); padding:40px; font-size:16px;">
                        Select a player to view their activity profile.
                      </div>
                    </div>`;
                    
        app.innerHTML = html;
        
        // Full screen UX for mobile
        if (window.innerWidth <= 768) {
            document.getElementById('rosterMobileHeader').style.display = 'flex';
            document.getElementById('rosterDesktopTitle').style.display = 'none';
            const navbar = document.querySelector('.navbar');
            if (navbar) navbar.style.display = 'none';
        }
        
        const select = document.getElementById('playerLookupSelect');
        const container = document.getElementById('playerProfileContainer');
        const regToggle = document.getElementById('registeredOnlyToggle');
        
        const dropdown = document.getElementById('playerLookupCustomDropdown');
        let dropdownItems = [];
        
        const renderDropdownOptions = () => {
            const onlyReg = globalRosterRegisteredOnly || (regToggle && regToggle.checked);
            
            dropdownItems = [];
            const allNamesSet = new Set();
            if (Array.isArray(players)) {
                players.forEach(p => {
                    if (p[0]) allNamesSet.add(p[0].toString().trim());
                });
            }
            if (typeof idToNameMap === 'object') {
                Object.values(idToNameMap).forEach(name => {
                    if (name) allNamesSet.add(name.toString().trim());
                });
            }
            
            Array.from(allNamesSet).sort((a,b) => a.localeCompare(b)).forEach(name => {
                let isReg = false;
                let gid = nameToIdMap[name];
                if (gid && registeredGameIds.has(gid.toString().trim())) isReg = true;
                if (onlyReg && !isReg) return;
                dropdownItems.push({ name: name, isReg: isReg, nt: /^[ -~]*$/.test(name) ? 'notranslate' : '' });
            });
        };
        
        const filterAndShowDropdown = () => {
            const query = select.value.toLowerCase().trim();
            if (!query) {
                dropdown.style.display = 'none';
                return;
            }
            
            const matches = dropdownItems.filter(item => item.name.toLowerCase().includes(query)).slice(0, 50); // limit to 50 for perf
            
            if (matches.length === 0) {
                dropdown.innerHTML = `<div style="padding:12px; color:var(--text-muted); text-align:center; font-size:14px;">No matches found.</div>`;
            } else {
                dropdown.innerHTML = matches.map(item => `
                    <div class="custom-dropdown-item ${item.nt}" data-value="${item.name}" style="padding:12px 15px; cursor:pointer; border-bottom:1px solid rgba(255,255,255,0.05); color:var(--text-main); font-weight:bold; font-size:15px; display:flex; align-items:center; gap:8px; transition:0.2s;">
                        ${item.isReg ? '<span style="color:var(--success); font-size:12px;">✅</span> ' : ''}${window.escapeHTML(item.name)}
                    </div>
                `).join('');
                
                // Add hover effects and click listeners
                dropdown.querySelectorAll('.custom-dropdown-item').forEach(el => {
                    el.addEventListener('mouseover', () => el.style.background = 'var(--bg-main)');
                    el.addEventListener('mouseout', () => el.style.background = 'transparent');
                    const selectItem = (e) => {
                        if (e) e.preventDefault();
                        const val = el.getAttribute('data-value');
                        if (val) {
                            select.value = val;
                            dropdown.style.display = 'none';
                            renderCardForChief(val);
                        }
                    };
                    el.addEventListener('pointerdown', selectItem);
                    el.addEventListener('click', selectItem);
                });
            }
            dropdown.style.display = 'flex';
        };
        
        select.addEventListener('input', filterAndShowDropdown);
        select.addEventListener('focus', filterAndShowDropdown);
        select.addEventListener('blur', () => { setTimeout(() => dropdown.style.display = 'none', 150); });
        
        renderDropdownOptions();
      
      const renderCardForChief = async (chiefName) => {
        if (!chiefName || chiefName.trim() === "") {
          container.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding:40px; font-size:16px;">Select a player to view their activity profile.</div>`;
          window.currentRosterChiefName = null;
          return;
        }
        
        let p = players.find(row => row && row[0] && row[0].toString().trim().toLowerCase() === chiefName.toLowerCase().trim());
        if (!p) {
            let matchedChief = null;
            if (typeof idToNameMap === 'object') {
                for (const [gid, name] of Object.entries(idToNameMap)) {
                    if (name && name.toLowerCase().trim() === chiefName.toLowerCase().trim()) {
                        matchedChief = name; break;
                    }
                }
            }
            if (matchedChief) {
                chiefName = matchedChief;
                p = [chiefName, 0, false, false, false, false, false];
            }
        }
        if (!p) return;
        chiefName = p[0].toString().trim();
        
        window.currentRosterChiefName = chiefName;
        
        let dynamicSD = null;
        if (allTimeRankingsMap[chiefName]) {
          dynamicSD = allTimeRankingsMap[chiefName];
        }
        
        let lbData = lbMap[chiefName];
        let bearBoth = null, bear1 = null, bear2 = null, bearAllTime = null, btDonationsAllTime = null, btDonationsCurrent = null;
        let otherLbs = [];
        if (lbData) {
            lbData.forEach(lb => {
                if (lb.title.toLowerCase().includes('all-time showdown')) return;
                let t = lb.title.toLowerCase();
                if (t.includes('all-time bear trap')) bearAllTime = lb;
                else if (t.includes('bear trap 1')) bear1 = lb;
                else if (t.includes('bear trap 2')) bear2 = lb;
                else if (t.includes('both bear trap')) bearBoth = lb;
                else if (t.includes('all-time') && (t.includes('bear') || t.includes('bt')) && t.includes('donation')) btDonationsAllTime = lb;
                else if ((t.includes('bear') || t.includes('bt')) && t.includes('donation')) btDonationsCurrent = lb;
                else otherLbs.push(lb);
            });
        }
        let altAccounts = [];
        if (usersSnap && usersSnap.exists()) {
            const users = usersSnap.val();
            let targetGameId = nameToIdMap[chiefName];
            if (targetGameId) {
                for (const u of Object.values(users)) {
                    if (Number(u.gameId) === Number(targetGameId)) {
                        if (u.linkedGameIds && Array.isArray(u.linkedGameIds)) {
                            altAccounts = [...new Set([...altAccounts, ...u.linkedGameIds])];
                        }
                    }
                }
            }
        }
        
        select.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            dropdown.style.display = 'none';
            renderCardForChief(e.target.value);
          }
        });
        
        p = await window.getLivePlayerEventRow(chiefName, p, headers);
        let html = window.generatePlayerProfileHtml(chiefName, p, headers, colIsUpcoming, rosterMap[chiefName], lbData, dynamicSD, showdownActive, bearBoth, bear1, bear2, bearAllTime, btDonationsAllTime, btDonationsCurrent, otherLbs, false, altAccounts);
        container.innerHTML = html;
      };
      
      select.addEventListener('change', (e) => {
        renderCardForChief(e.target.value);
      });
      
      if (window.currentRosterChiefName) {
        let p = players.find(row => row[0].toString().trim() === window.currentRosterChiefName);
        if (p) {
          select.value = window.currentRosterChiefName;
          renderCardForChief(window.currentRosterChiefName);
        }
      }
      
    } catch(e) { renderError(e.message); }
  },
  giftcodes: async () => {
      let contentHtml = '';
      
      if (!currentUser) {
        contentHtml = `
          <div style="text-align:center; padding:40px 20px;">
            <div style="font-size:48px; margin-bottom:20px;">&#x1F512;</div>
            <h3 style="color:var(--text-main); margin-bottom:10px;">Sign In Required</h3>
            <p style="color:var(--text-muted); margin-bottom:25px; font-size:15px; line-height:1.5;">You must be signed into the Dashboard to securely enable Auto Redeem Perks.</p>
            <button onclick="document.getElementById('authModal').style.display='block'; document.getElementById('authModalOverlay').style.display='block';" style="background:var(--accent); color:#fff; border:none; padding:12px 24px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:16px;">Sign In / Register</button>
          </div>
        `;
      } else {
        const chiefName = currentUser.name || idToNameMap[currentUser.gameId] || "Unknown Chief";
        
        let isMainEnrolled = await window.isGiftcodeEnrolled(currentUser.gameId);
        
        if (isMainEnrolled) {
            contentHtml = `
              <div style="text-align:center; padding:40px 20px;">
                <h3 style="color:var(--success); margin-bottom:10px;">Already Enrolled!</h3>
                <p style="color:var(--text-muted); margin-bottom:25px; font-size:15px; line-height:1.5;">Chief <strong>${chiefName}</strong> is actively monitored by the Auto Redeem Bot.</p>
                <button disabled style="background:transparent; color:var(--success); border:1px solid var(--success); padding:14px 28px; border-radius:8px; font-weight:bold; font-size:16px;">Active &#x2705;</button>
              </div>
            `;
        } else {
            contentHtml = `
              <div style="text-align:center; padding:40px 20px;">
                <div style="font-size:48px; margin-bottom:20px;">&#x1F381;</div>
                <h3 style="color:var(--text-main); margin-bottom:10px;">Enable Auto Redeem</h3>
                <p style="color:var(--text-muted); margin-bottom:25px; font-size:15px; line-height:1.5;">Welcome <strong>${chiefName}</strong>! Click below to securely link your Game ID (${currentUser.gameId}) to the Auto Redeem Bot. We will automatically fetch all new gift codes and inject them into your account!</p>
                <button id="optInPerksBtn" style="background:var(--success); color:var(--text-main); border:none; padding:14px 28px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:16px; transition:0.2s; box-shadow:0 4px 15px rgba(16,185,129,0.3);">1-Click Opt-In</button>
                <p style="margin-top:20px; font-size:13px; color:var(--text-muted);"><em>No double data entry needed. It's fully automated!</em></p>
              </div>
            `;
        }

      }

      app.innerHTML = `
        <div class="card" style="display:flex; flex-direction:column; padding:0; overflow:hidden; animation: fadeIn 0.3s ease; max-width: 600px; margin: 40px auto;">
          <div style="padding:20px; border-bottom:1px solid var(--border); display:flex; align-items:center; gap:10px; justify-content:center; background:var(--bg-card);">
            <span style="font-size:24px;">&#x1F381;</span>
            <h2 style="margin:0; font-size:22px; color:var(--text-main);">Auto Redeem (Perks)</h2>
          </div>
          <div style="flex:1; width:100%; position:relative; background:var(--bg-main);">
            ${contentHtml}
          </div>
        </div>
      `;
      
      // Attach Event Listener if the button exists
      const optInBtn = document.getElementById('optInPerksBtn');
      if (optInBtn) {
        optInBtn.addEventListener('click', async () => {
           if (!currentUser) return;
           optInBtn.disabled = true;
           optInBtn.textContent = 'Linking...';
           const chiefName = currentUser.name || idToNameMap[currentUser.gameId] || "Unknown Chief";
           try {
               await window.enrollGiftcodeBot(currentUser.gameId, chiefName);
               
               const optInToken = await getAuthToken();
               const url = `${API_BASE_URL}?api=registerNewPlayer&gameId=${encodeURIComponent(currentUser.gameId)}&name=${encodeURIComponent(chiefName)}&token=${encodeURIComponent(optInToken)}`;
               fetch(url, { mode: 'no-cors' }).catch(e => null);
               
               window.showToast("Successfully Enrolled in Auto Redeem!", "success");
               optInBtn.textContent = 'Active ✅';
               optInBtn.style.background = 'transparent';
               optInBtn.style.color = 'var(--success)';
               optInBtn.style.border = '1px solid var(--success)';
           } catch(e) {
               console.error(e);
               window.showToast("Error linking account. Try again later.", "error");
               optInBtn.disabled = false;
               optInBtn.textContent = '1-Click Opt-In';
           }
        });
      }
    },
  

  schedule: async () => {
    let currentTab = localStorage.getItem('scheduleView') || 'today';

    window.refreshSchedule = async () => {
      const icon = document.getElementById('schRefreshIcon');
      if (icon) icon.style.animation = 'spin 1s linear infinite';
      
      if (window.showToast) window.showToast('Refreshing schedule...', 'info', false);
      
      delete window.liveData['schedule'];
      delete window.livePromises['schedule'];
      if (window.liveListeners['schedule']) {
          window.liveListeners['schedule']();
          delete window.liveListeners['schedule'];
      }
      delete window.liveData['WhiteOut Survival'];
      delete window.livePromises['WhiteOut Survival'];
      if (window.liveListeners && window.liveListeners['WhiteOut Survival']) {
        window.liveListeners['WhiteOut Survival']();
        delete window.liveListeners['WhiteOut Survival'];
      }
      if (window._scheduleCountdownTimer) { clearInterval(window._scheduleCountdownTimer); window._scheduleCountdownTimer = null; }
      window._scheduleCountdowns = [];

      setTimeout(async () => {
        await views.schedule();
        if (window.showToast) window.showToast('Schedule refreshed!', 'success');
      }, 400);
    };

    window.switchScheduleTab = (tab) => {
      localStorage.setItem('scheduleView', tab);
      currentTab = tab;
      window.renderTabs();
    };

    renderLoading('Loading Schedule');
    try {
      const [weeklyData, todayData] = await Promise.all([
        fetchSheet('schedule').catch(() => null),
        fetchSheet('WhiteOut Survival').catch(() => null)
      ]);

      const renderTabs = () => {
        if (window._scheduleCountdownTimer) clearInterval(window._scheduleCountdownTimer);
        window._scheduleCountdowns = [];
        
        let html = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:15px;">
            <div style="display:flex; align-items:center; gap:15px; flex-wrap:wrap;">
              <h2 style="color:var(--text-main); margin:0;">📅 Event Schedule</h2>
              <div style="display:flex; background:var(--bg-main); border:1px solid var(--border); border-radius:8px; overflow:hidden;">
                <button onclick="window.switchScheduleTab('today')" style="padding:6px 16px; border:none; background:${currentTab === 'today' ? 'var(--accent)' : 'transparent'}; color:${currentTab === 'today' ? '#fff' : 'var(--text-muted)'}; font-weight:bold; cursor:pointer; font-size:13px; transition:0.2s;">Today's View</button>
                <button onclick="window.switchScheduleTab('calendar')" style="padding:6px 16px; border:none; background:${currentTab === 'calendar' ? 'var(--accent)' : 'transparent'}; color:${currentTab === 'calendar' ? '#fff' : 'var(--text-muted)'}; font-weight:bold; cursor:pointer; font-size:13px; transition:0.2s;">Calendar View</button>
              </div>
            </div>
            <div style="display:flex; gap:10px; align-items:center;">
              <a href="https://www.google.com/url?q=https://calendar.google.com/calendar/u/0?cid%3DMWZkOTI2ZjdkNzVhYWIyMzM1N2IxYjE1NTc5MzE2YTRlYTRjMDI3NjA4NDlmOTRkZjg2MDRlZWY5YjdiMTI1OEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&sa=D&source=editors&ust=1783297509664500&usg=AOvVaw3Nu5FI78rflI7vvCvxd5MS" target="_blank" style="background:#0ea5e9; color:#fff; padding:7px 14px; border-radius:8px; text-decoration:none; font-weight:bold; font-size:12px;">➕ Google Cal</a>
              <button onclick="window.refreshSchedule()" style="background:var(--bg-main); color:var(--text-main); border:1px solid var(--border); padding:7px 14px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:bold; display:flex; align-items:center; gap:5px;">
                <span id="schRefreshIcon">🔄</span> Refresh
              </button>
            </div>
          </div>
          <div id="schedule-content"></div>
        `;
        
        app.innerHTML = html;
        const contentDiv = document.getElementById('schedule-content');

        if (currentTab === 'today') {
           const data = todayData;

      

      if (!data || !Array.isArray(data) || data.length === 0) {
        contentDiv.innerHTML = `<div class="card"><div class="loading">⚠️ Schedule data is currently unavailable. Please try again later.</div></div>`;
        return;
      }

      const now = new Date();
      const todayStr = now.toDateString();

      // ── 1. Parse timed events (rows 2–8, col F=5, G=6, H=7, I=8) ──
      let todayEvents = [];
      let upcomingEvents = [];

      for (let i = 1; i < Math.min(34, data.length); i++) {
        const row = data[i];
        const eventName = row[5];
        const dateRaw   = row[6];  // now "7/17" format
        const utcRaw    = row[7];  // now "16:00" format
        const pdtVal    = row[8];  // "9:00 AM" (display only)

        // Skip blank rows and header rows — only BREAK on 'Rewards' which marks end of events section
        if (!eventName || String(eventName).trim() === '') continue;
        if (String(eventName).includes("Event's")) continue;
        if (String(eventName).trim() === 'Rewards') break;

        // ── Parse M/D date (e.g. "7/17") ──
        const dateStr = String(dateRaw || '').trim();
        // Support both "7/17" and legacy "2026-07-17T..." ISO format
        let eventDate = null;
        const mdMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})$/);
        const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})T/);
        if (mdMatch) {
          eventDate = new Date(now.getFullYear(), parseInt(mdMatch[1]) - 1, parseInt(mdMatch[2]));
        } else if (isoMatch) {
          eventDate = new Date(dateStr);
        } else {
          continue; // can't parse date — skip
        }

        const isToday = eventDate.toDateString() === todayStr;
        const isFuture = eventDate > now && !isToday;

        // ── Parse UTC time (e.g. "16:00" or legacy ISO) ──
        let utcDisplay = '';
        let localTimeStr = '';
        let eventDateTime = null;

        const utcStr = String(utcRaw || '').trim();
        const hmMatch = utcStr.match(/^(\d{1,2}):(\d{2})$/);
        const isoUtcMatch = utcStr.match(/^\d{4}-\d{2}-\d{2}T/);

        if (hmMatch) {
          const h = parseInt(hmMatch[1]), m = parseInt(hmMatch[2]);
          utcDisplay = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} UTC`;
          const localRef = new Date();
          localRef.setUTCHours(h, m, 0, 0);
          localTimeStr = localRef.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
          eventDateTime = new Date(eventDate);
          eventDateTime.setUTCHours(h, m, 0, 0);
        } else if (isoUtcMatch) {
          // Legacy ISO format: apply the -8h GAS offset correction
          const gasDate = new Date(utcStr);
          gasDate.setUTCHours(gasDate.getUTCHours() - 8);
          const h = gasDate.getUTCHours(), m = gasDate.getUTCMinutes();
          utcDisplay = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} UTC`;
          const localRef = new Date();
          localRef.setUTCHours(h, m, 0, 0);
          localTimeStr = localRef.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
          eventDateTime = new Date(eventDate);
          eventDateTime.setUTCHours(h, m, 0, 0);
        }

        const isPast = eventDateTime ? eventDateTime < now : (!isToday && eventDate < now);
        const isBearTrap = String(eventName).includes('Bear Trap') || String(eventName).includes('🪤') || String(eventName).includes('🐻');
        const emoji = isBearTrap ? '🪤' : '✨';

        const entry = { eventName: String(eventName).trim(), utcDisplay, localTimeStr, pdtVal: String(pdtVal || ''), isPast, emoji, eventDateTime, eventDate };

        if (isToday) {
          todayEvents.push(entry);
        } else if (isFuture && !isPast) {
          entry.dateLabel = eventDate.toLocaleDateString('en-US', { weekday:'short', month:'numeric', day:'numeric' });
          upcomingEvents.push(entry);
        }
      }

      // ── 2. Parse category columns (Rewards/Signups/All Week/Holidays) ──
      let headerRowIdx = -1;
      for (let i = 0; i < data.length; i++) {
        const cell = String(data[i][5] || '').trim().toLowerCase();
        if (cell === 'rewards') { headerRowIdx = i; break; }
      }

      let rewards = [], signups = [], allWeek = [], holidays = [];
      if (headerRowIdx !== -1) {
        for (let i = headerRowIdx + 1; i < data.length; i++) {
          const r = data[i][5], g = data[i][6], h = data[i][7], k = data[i][8];
          const anyVal = [r,g,h,k].some(v => v && String(v).trim() !== '');
          if (!anyVal) break;
          const skip = (v) => !v || String(v).trim() === '' || String(v).trim().toLowerCase() === 'no events';
          if (!skip(r)) rewards.push(String(r).trim());
          if (!skip(g)) signups.push(String(g).trim());
          if (!skip(h)) allWeek.push(String(h).trim());
          if (!skip(k)) holidays.push(String(k).trim());
        }
      }

      // ── 3. Build the unified card ──
      const dayName = now.toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric' });

      const sectionPill = (icon, label, color, bg) =>
        `<div style="display:inline-flex;align-items:center;gap:6px;background:${bg};color:${color};padding:4px 12px;border-radius:20px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:12px;">${icon} ${label}</div>`;

      // Today's Events rows
      let todayRows = '';
      if (todayEvents.length === 0) {
        todayRows = `<div style="padding:14px 0;text-align:center;color:var(--text-muted);font-style:italic;">🎉 Rest day — no timed events today!</div>`;
      } else {
        todayEvents.forEach(ev => {
          const strikeStyle = ev.isPast ? 'opacity:0.45;text-decoration:line-through;' : '';
          // Live countdown id
          const countdownId = 'cd_' + Math.random().toString(36).slice(2,8);
          let countdownHtml = '';
          if (ev.eventDateTime && !ev.isPast) {
            const diffMs = ev.eventDateTime - now;
            const hrs = Math.floor(diffMs / 3600000);
            const mins = Math.floor((diffMs % 3600000) / 60000);
            const label = hrs > 0 ? `in ${hrs}h ${mins}m` : `in ${mins}m`;
            countdownHtml = `<span id="${countdownId}" style="background:rgba(16,185,129,0.15);color:#10b981;font-size:11px;font-weight:700;padding:3px 8px;border-radius:10px;white-space:nowrap;">${label}</span>`;
            // Register countdown
            if (!window._scheduleCountdowns) window._scheduleCountdowns = [];
            window._scheduleCountdowns.push({ id: countdownId, target: ev.eventDateTime });
          } else if (ev.isPast) {
            countdownHtml = `<span style="background:rgba(100,100,100,0.15);color:var(--text-muted);font-size:11px;padding:3px 8px;border-radius:10px;">Done</span>`;
          }
          todayRows += `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--bg-main);border-radius:10px;margin-bottom:8px;gap:10px;${strikeStyle}flex-wrap:wrap;">
              <span style="font-size:14px;font-weight:600;color:var(--text-main);">${ev.emoji} ${ev.eventName}</span>
              <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                ${ev.utcDisplay ? `<span style="font-size:13px;color:var(--text-muted);">${ev.utcDisplay}</span>` : ''}
                ${ev.localTimeStr ? `<span style="font-size:13px;font-weight:600;color:var(--text-main);">${ev.localTimeStr} local</span>` : ev.pdtVal ? `<span style="font-size:13px;color:var(--text-muted);">${ev.pdtVal} PDT</span>` : ''}
                ${countdownHtml}
              </div>
            </div>`;
        });
      }

      // Category columns (2-col grid for Rewards + Signups)
      const listItems = (arr, color) => arr.map(x => `<div style="padding:6px 0;font-size:14px;color:var(--text-main);border-bottom:1px solid var(--border);display:flex;align-items:center;gap:8px;"><span style="width:7px;height:7px;background:${color};border-radius:50%;flex-shrink:0;"></span>${x}</div>`).join('');

      let categoriesHtml = '';

      const hasRewards  = rewards.length > 0;
      const hasSignups  = signups.length > 0;
      const hasAllWeek  = allWeek.length > 0;
      const hasHolidays = holidays.length > 0;

      if (hasRewards || hasSignups) {
        categoriesHtml += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:20px;margin-top:20px;">`;
        if (hasRewards) {
          categoriesHtml += `<div style="background:var(--bg-main);border-radius:12px;padding:16px;">
            ${sectionPill('🎁','Rewards','#eab308','rgba(234,179,8,0.12)')}
            ${listItems(rewards,'#eab308')}
          </div>`;
        }
        if (hasSignups) {
          categoriesHtml += `<div style="background:var(--bg-main);border-radius:12px;padding:16px;">
            ${sectionPill('📋','Sign-Ups','#10b981','rgba(16,185,129,0.12)')}
            ${listItems(signups,'#10b981')}
          </div>`;
        }
        categoriesHtml += `</div>`;
      }

      if (hasAllWeek) {
        categoriesHtml += `<div style="background:var(--bg-main);border-radius:12px;padding:16px;margin-top:16px;">
          ${sectionPill('📆','All Week','#818cf8','rgba(129,140,248,0.12)')}
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${allWeek.map(x => `<span style="background:rgba(129,140,248,0.15);color:#818cf8;padding:5px 12px;border-radius:20px;font-size:13px;font-weight:600;">${x}</span>`).join('')}
          </div>
        </div>`;
      }

      if (hasHolidays) {
        categoriesHtml += `<div style="background:var(--bg-main);border-radius:12px;padding:16px;margin-top:16px;">
          ${sectionPill('🎉','Holidays','#f97316','rgba(249,115,22,0.12)')}
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${holidays.map(x => `<span style="background:rgba(249,115,22,0.15);color:#f97316;padding:5px 12px;border-radius:20px;font-size:13px;font-weight:600;">${x}</span>`).join('')}
          </div>
        </div>`;
      }

      // Coming Up This Week
      let upcomingHtml = '';
      if (upcomingEvents.length > 0) {
        upcomingHtml = `<div style="background:var(--bg-main);border-radius:12px;padding:16px;margin-top:16px;">
          ${sectionPill('📅','Coming Up This Week','var(--accent)','rgba(59,130,246,0.12)')}`;
        upcomingEvents.forEach(ev => {
          upcomingHtml += `<div style="display:flex;align-items:center;justify-content:space-between;padding:9px 0;border-bottom:1px solid var(--border);flex-wrap:wrap;gap:6px;">
            <span style="font-size:14px;color:var(--text-main);font-weight:500;">${ev.emoji} ${ev.eventName}</span>
            <div style="display:flex;gap:10px;align-items:center;">
              <span style="font-size:12px;color:var(--text-muted);">${ev.dateLabel}</span>
              ${ev.utcDisplay ? `<span style="font-size:12px;color:var(--text-muted);">${ev.utcDisplay}</span>` : ''}
              ${ev.localTimeStr ? `<span style="font-size:12px;font-weight:600;color:var(--accent);">${ev.localTimeStr}</span>` : ''}
            </div>
          </div>`;
        });
        upcomingHtml += `</div>`;
      }

      // ── 4. Final render ──
      contentDiv.innerHTML = `
        <div class="card" style="background:var(--card-bg);border:1px solid var(--border);border-top:3px solid var(--accent);border-radius:16px;padding:24px;animation:fadeIn 0.3s ease;">

          <div style="background:var(--bg-main);border-radius:12px;padding:16px;">
            ${sectionPill('⏰','Events Today','#60a5fa','rgba(96,165,250,0.12)')}
            ${todayRows}
          </div>

          ${categoriesHtml}
          ${upcomingHtml}
        </div>`;

      // ── 5. Start live countdown interval ──
      if (window._scheduleCountdownTimer) clearInterval(window._scheduleCountdownTimer);
      if (window._scheduleCountdowns && window._scheduleCountdowns.length > 0) {
        window._scheduleCountdownTimer = setInterval(() => {
          const n = new Date();
          (window._scheduleCountdowns || []).forEach(cd => {
            const el = document.getElementById(cd.id);
            if (!el) return;
            const diff = cd.target - n;
            if (diff <= 0) { el.textContent = 'Now'; el.style.background = 'rgba(239,68,68,0.15)'; el.style.color = '#ef4444'; return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            el.textContent = h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
          });
        }, 30000);
      }

    
        } else {
           const data = weeklyData;

      
      
      if (!data || !Array.isArray(data) || data.length === 0) {
  
      contentDiv.innerHTML = `<div class="card"><div class="loading">⚠️ Schedule data is currently unavailable. Please try again later.</div></div>`;
        return;
      }
      
      // Find the row that contains the dates
      let dateRowIdx = -1;
      for (let r = 0; r < data.length; r++) {
        let dateCells = data[r].filter(cell => typeof cell === 'string' && (cell.match(/^\d{4}-\d{2}-\d{2}T/) || cell.match(/\d{1,2}\/\d{1,2}/)));
        if (dateCells.length >= 3) {
          dateRowIdx = r;
          break;
        }
      }
      
      if (dateRowIdx === -1) {
        contentDiv.innerHTML = `<div class="card"><div class="loading">Could not find dates in schedule.</div></div>`;
        return;
      }
      
      // Map each date to its column index
      let days = [];
      for (let c = 0; c < data[dateRowIdx].length; c++) {
        let cell = data[dateRowIdx][c];
        if (typeof cell === 'string') {
          let formatted = '';
          if (cell.match(/^\d{4}-\d{2}-\d{2}T/)) {
            let [year, month, day] = cell.split('T')[0].split('-');
            let d = new Date(year, month - 1, day);
            formatted = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          } else if (cell.match(/\d{1,2}\/\d{1,2}/)) {
            formatted = cell.replace(/Today /ig, '').replace(/Tomorrow /ig, '').trim();
          }
          
          if (formatted) {
            days.push({ dateStr: formatted, colIdx: c, categories: {} });
          }
        }
      }
      
      // Extract events for each day, grouping by category
      let currentCategory = "Events";
      for (let r = dateRowIdx + 1; r < data.length; r++) {
        if (data[r].every(cell => cell === "")) continue;
        
        // Detect category headers: A row with exactly one non-empty cell located in Column B (index 1)
        let nonEmptyCells = data[r].filter(c => c !== "");
        if (nonEmptyCells.length === 1 && typeof data[r][1] === 'string' && data[r][1].trim() !== "") {
          currentCategory = data[r][1].trim();
          continue;
        }
        
        days.forEach(day => {
          let eventCell = data[r][day.colIdx];
          if (eventCell && eventCell.trim() !== "") {
            if (!day.categories[currentCategory]) day.categories[currentCategory] = [];
            day.categories[currentCategory].push(eventCell);
          }
        });
      }
      
      // Render the timeline as Daily Cards
      let html = '';
      html += `<div style="display:flex; flex-wrap:wrap; gap:20px;">`;
      
      days.forEach(day => {
        html += `<div class="card" style="flex: 1; min-width: 250px; padding:0; overflow:hidden;">
                   <div style="background:var(--accent); color:#fff; padding:15px; text-align:center; font-weight:bold; font-size:18px;">
                     ${day.dateStr}
                   </div>
                   <div style="padding:15px;">`;
                   
        let catKeys = Object.keys(day.categories);
        if (catKeys.length === 0) {
          html += `<div style="padding:10px 0; color:var(--text-muted); text-align:center; font-style:italic;">No Events</div>`;
        } else {
          catKeys.forEach((cat, index) => {
            // Add extra top margin for categories after the first one (e.g. between Events and Rewards)
            let topMargin = index === 0 ? "5px" : "25px";
            html += `<div style="font-weight:bold; color:var(--text-main); margin-top:${topMargin}; margin-bottom:8px; text-transform:uppercase; font-size:11px; letter-spacing:1px;">${cat}</div>`;
            html += `<ul style="list-style:none; padding:0; margin:0; margin-bottom:15px;">`;
            day.categories[cat].forEach((ev, idx) => {
              html += `<li style="padding:8px 0; font-size:14px; color:var(--text-muted);">
                         ${ev.includes('Bear Trap') ? '🪤' : '✨'} ${ev}
                       </li>`;
            });
            html += `</ul>`;
          });
        }
        html += `</div></div>`;
      });
      
      html += `</div>`;
      contentDiv.innerHTML = html;
    
        }
      };

      window.renderTabs = renderTabs;
      renderTabs();

    } catch(e) { renderError(e.message); }
  },

  contact: async () => {
    app.innerHTML = `
      <div class="card" style="display:flex; flex-direction:column; height: 85vh; min-height: 800px; padding:0; overflow:hidden; animation: fadeIn 0.3s ease;">
        <div style="padding:15px 20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:24px;">💬</span>
            <h2 style="margin:0; font-size:20px; color:var(--text-main);">Support & Feedback</h2>
          </div>
          <a href="https://tiny.cc/BrianDivaCox" target="_blank" style="display:inline-flex; align-items:center; gap:6px; background:#5865F2; color:#fff; padding:6px 12px; border-radius:6px; text-decoration:none; font-weight:bold; font-size:13px; transition:0.2s;">
            <span style="font-size:16px;">👾</span> Join Discord
          </a>
        </div>
        <div style="flex:1; width:100%; position:relative; background:var(--bg-main);">
          <iframe 
            src="https://docs.google.com/forms/d/e/1FAIpQLSdL6uJrUBV05I3NIfwTVyGd0Bx6osn2ZEBGeyp2RnwJZxujXA/viewform?embedded=true" 
            style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;"
            frameborder="0" 
            marginheight="0" 
            marginwidth="0">
            Loading…
          </iframe>
        </div>
      </div>
    `;
  },

  
  analytics: async () => {
    renderLoading("Loading Analytics");
    try {
      const rosterRawData = await window.fetchRoster();
      
      if (!rosterRawData) throw new Error("No data found.");
      
      let giftCodesYes = 0;
      let giftCodesNo = 0;
      
      // Parse roster data to count gift code redemptions
      if (rosterRawData) {
        Object.values(rosterRawData).forEach(p => {
          if (p.name) {
            let gcVal = p.giftCodes;
            if (gcVal !== undefined && gcVal !== null && gcVal !== "") {
              let strVal = gcVal.toString().toLowerCase().trim();
              if (gcVal === true || strVal === "true" || strVal === "✓" || strVal === "yes") {
                giftCodesYes++;
              } else {
                giftCodesNo++;
              }
            } else {
              giftCodesNo++;
            }
          }
        });
      }
      
      let html = `
        <div class="card" style="margin-bottom:20px; text-align:center;">
          <div class="card-title" style="margin-bottom:5px; font-size:24px;">📊 Visual Analytics</div>
          <p style="color:var(--text-muted); font-size:14px; margin-bottom:25px;">Live metrics automatically generated from your Alliance database.</p>
          
          <div style="display:flex; justify-content:center; flex-wrap:wrap; gap:30px;">
            <div style="background:var(--bg-main); border:1px solid var(--border); border-radius:12px; padding:20px; width:100%; max-width:400px; box-shadow:0 4px 6px rgba(0,0,0,0.05);">
              <h3 style="color:var(--text-main); margin-top:0; margin-bottom:15px; font-size:18px;">Gift Code Auto Redeem</h3>
              <div style="position:relative; height:250px; width:100%; display:flex; justify-content:center;">
                <canvas id="giftCodeChart"></canvas>
              </div>
              <div style="margin-top:15px; font-size:14px; color:var(--text-muted);">
                <span style="color:var(--success); font-weight:bold;">${giftCodesYes}</span> Enrolled | 
                <span style="color:var(--danger); font-weight:bold;">${giftCodesNo}</span> Missing
              </div>
            </div>
            
            <!-- Placeholder for future charts -->
            <div style="background:var(--bg-main); border:1px solid var(--border); border-radius:12px; padding:20px; width:100%; max-width:400px; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 6px rgba(0,0,0,0.05); min-height:300px;">
              <div style="color:var(--text-muted); font-style:italic; opacity:0.7;">
                More analytics coming soon...
              </div>
            </div>
          </div>
        </div>
      `;
      
      app.innerHTML = html;
      
      // Render Chart using Chart.js after the canvas is in the DOM
      // We must get the current accent color from CSS variables
      const rootStyle = getComputedStyle(document.documentElement);
      let accentColor = rootStyle.getPropertyValue('--accent').trim();
      let cardBg = rootStyle.getPropertyValue('--card-bg').trim();
      let textColor = rootStyle.getPropertyValue('--text-main').trim();
      
      const ctx = document.getElementById('giftCodeChart').getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Enrolled', 'Not Enrolled'],
          datasets: [{
            data: [giftCodesYes, giftCodesNo],
            backgroundColor: [
              accentColor, // dynamically matches theme
              '#475569'    // Slate color for not enrolled
            ],
            borderWidth: 2,
            borderColor: cardBg,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: textColor,
                font: {
                  family: 'monospace',
                  size: 12
                }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(0,0,0,0.8)',
              titleFont: { family: 'monospace' },
              bodyFont: { family: 'monospace' },
              padding: 10,
              cornerRadius: 8
            }
          },
          cutout: '70%'
        }
      });
      
    } catch(e) { renderError(e.message); }
  }
};

// --- GLOBAL TIMERS ---
// Clock format preference (12 or 24)
let clockFormat = localStorage.getItem('clockFormat') || '12';

// Highlight active clock format button
function updateClockFormatUI() {
  document.querySelectorAll('.clock-fmt-btn').forEach(btn => {
    if (btn.getAttribute('data-format') === clockFormat) {
      btn.style.background = 'var(--accent)';
      btn.style.color = '#fff';
    } else {
      btn.style.background = 'transparent';
      btn.style.color = 'var(--text-muted)';
    }
  });
}

// Clock format toggle click handler
document.querySelectorAll('.clock-fmt-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    clockFormat = btn.getAttribute('data-format');
    localStorage.setItem('clockFormat', clockFormat);
    updateClockFormatUI();
    updateGlobalTimers();
  });
});

updateClockFormatUI();

function formatClockTime(hours, minutes, seconds, use12hr) {
  if (use12hr) {
    const period = hours >= 12 ? 'PM' : 'AM';
    let h12 = hours % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${period}`;
  } else {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
}

function updateGlobalTimers() {
  const now = new Date();
  const is12 = clockFormat === '12';

  // UTC Clock
  const utcClockEl = document.getElementById('utc-clock');
  if (utcClockEl) {
    utcClockEl.textContent = formatClockTime(now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), is12);
  }

  // Local Clock
  const localClockEl = document.getElementById('local-clock');
  if (localClockEl) {
    localClockEl.textContent = formatClockTime(now.getHours(), now.getMinutes(), now.getSeconds(), is12);
  }

  // --- DAILY RESET (UTC 00:00) ---
  const resetTimerEl = document.getElementById('reset-timer');
  const resetTimerLocalEl = document.getElementById('reset-timer-local');
  if (resetTimerEl) {
    const nextReset = new Date();
    nextReset.setUTCHours(24, 0, 0, 0);
    let diff = Math.floor((nextReset - now) / 1000);
    const rh = Math.floor(diff / 3600);
    const rm = Math.floor((diff % 3600) / 60);
    const rs = (diff % 60);
    resetTimerEl.textContent = `${rh}h ${rm}m ${rs}s`;

    if (resetTimerLocalEl) {
      const localStr = nextReset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = nextReset.toLocaleDateString([], { month: 'short', day: 'numeric' });
      resetTimerLocalEl.textContent = `Next: ${dateStr} ${localStr} local`;
    }
  }

  // --- INTE RESET (UTC 00:00, 08:00, 16:00) ---
  const inteResetEl = document.getElementById('inte-reset-timer');
  const inteResetLocalEl = document.getElementById('inte-reset-local');
  if (inteResetEl) {
    // Find the next reset time from the three daily reset points
    const utcMidnight = new Date(now);
    utcMidnight.setUTCHours(0, 0, 0, 0);
    const secondsSinceMidnight = Math.floor((now - utcMidnight) / 1000);

    const resetPointsSeconds = [0, 8 * 3600, 16 * 3600]; // 00:00, 08:00, 16:00 UTC
    let nextInteReset = null;

    for (const rt of resetPointsSeconds) {
      if (rt > secondsSinceMidnight) {
        nextInteReset = new Date(utcMidnight.getTime() + rt * 1000);
        break;
      }
    }
    // If past 16:00 UTC, next reset is tomorrow's 00:00 UTC
    if (!nextInteReset) {
      nextInteReset = new Date(utcMidnight.getTime() + 24 * 3600 * 1000);
    }

    let diff = Math.floor((nextInteReset - now) / 1000);
    const ih = Math.floor(diff / 3600);
    const im = Math.floor((diff % 3600) / 60);
    const is_ = (diff % 60);
    inteResetEl.textContent = `${ih}h ${im}m ${is_}s`;

    if (inteResetLocalEl) {
      const localStr = nextInteReset.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = nextInteReset.toLocaleDateString([], { month: 'short', day: 'numeric' });
      inteResetLocalEl.textContent = `Next: ${dateStr} ${localStr} local`;
    }
  }
}

setInterval(updateGlobalTimers, 1000);
updateGlobalTimers();

// Handle Navigation
const allLinks = document.querySelectorAll('.nav-link, .sub-link');
allLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    const targetEl = e.currentTarget;
    
    // Exclude the Theme Settings link since it handles itself
    if (targetEl.id === 'mobileSettingsBtn') return;
    
    // Mobile dropdown toggle logic
    if (window.innerWidth <= 768 && targetEl.classList.contains('nav-link') && targetEl.nextElementSibling && targetEl.nextElementSibling.classList.contains('dropdown-content')) {
      e.preventDefault();
      e.stopPropagation(); // Prevent the document click listener from firing
      
      const parent = targetEl.parentElement;
      const isOpen = parent.classList.contains('open');
      
      // Close all other dropdowns
      document.querySelectorAll('.dropdown').forEach(d => {
        if (d !== parent) d.classList.remove('open');
      });
      
      // Toggle this one
      if (isOpen) {
        parent.classList.remove('open');
      } else {
        parent.classList.add('open');
      }
      return;
    }
    
    e.preventDefault();
    
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    // If it's a sub-link in a dropdown, highlight the parent nav-link
    if (targetEl.classList.contains('sub-link')) {
      targetEl.closest('.dropdown').querySelector('.nav-link').classList.add('active');
    } else {
      targetEl.classList.add('active');
    }
    
    // Auto-close the hamburger menu if it's open
    if (mobileMenu) mobileMenu.classList.remove('open');
    
    // Always restore navbar visibility when navigating between views
    const navbar = document.querySelector('.navbar');
    if (navbar) navbar.style.display = 'flex';
    
    const target = targetEl.getAttribute('data-target');
    const filter = targetEl.getAttribute('data-filter');
    if (views[target]) {
      if (target === 'admin') window.activeViewFunc = null;
      else window.activeViewFunc = () => views[target](filter);
      
      views[target](filter);
    }
  });
});

// Initial load
window.activeViewFunc = () => views.home();
views.home();
initPresence();

window.views = views;


window.generatePlayerProfileHtml = (chiefName, p, headers, colIsUpcoming, rosterInfo, lbData, dynamicSD, showdownActive, bearBoth, bear1, bear2, bearAllTime, btDonationsAllTime, btDonationsCurrent, otherLbs, isAdmin = false, altAccounts = []) => {
  let headerBadgesHtml = '';
  if (rosterInfo) {
    let flVal = rosterInfo.furnaceLevel;
    if (flVal && flVal.toString().trim() !== "") {
       headerBadgesHtml += '<span style="background:color-mix(in srgb, var(--accent) 15%, transparent); border:1px solid var(--accent); color:var(--text-main); padding:4px 10px; border-radius:12px; font-size:14px; font-weight:bold; display:inline-flex; align-items:center;">' + window.getFurnaceIconHtml(flVal, 48) + '</span>';
    }
    let gcVal = rosterInfo.giftCodes;
    if (gcVal === true || gcVal === 'TRUE' || (typeof gcVal === 'string' && gcVal.toLowerCase().trim() === 'true')) {
       headerBadgesHtml += '<span style="background:color-mix(in srgb, var(--success) 15%, transparent); border:1px solid var(--success); color:var(--text-main); padding:4px 8px; border-radius:12px; font-size:11px; font-weight:bold;">✅ All Gift Codes</span>';
    }
    let taVal = rosterInfo.timeActive;
    if (taVal && taVal.toString().trim() !== "") {
       headerBadgesHtml += '<span style="background:color-mix(in srgb, var(--text-main) 10%, transparent); border:1px solid var(--border); color:var(--text-main); padding:4px 8px; border-radius:12px; font-size:11px; font-weight:bold;">⏱️ '+taVal+'</span>';
    }
  }
  

  
  let activityBadges = '';
  let missedDays = p[1];
  if (showdownActive) {
    if (missedDays === undefined || missedDays === null || missedDays.toString().trim() === "" || missedDays === 0 || missedDays === "0") {
       activityBadges += '<span style="background:color-mix(in srgb, #f97316 15%, transparent); border:1px solid #f97316; color:var(--text-main); padding:4px 8px; border-radius:12px; font-size:11px; font-weight:bold;">🔥 Perfect Attendance</span>';
    }
  }
  
  const isTrue = (val) => val === true || (typeof val === 'string' && val.toLowerCase().trim() === 'true');
  
  for (let c = 1; c < headers.length; c++) {
    const h = (headers[c] || '').toLowerCase();
    const val = p[c];
    if (isTrue(val)) {
      if (h.includes('championship') && !activityBadges.includes('Championship')) {
        activityBadges += '<span style="background:color-mix(in srgb, #fbbf24 15%, transparent); border:1px solid #fbbf24; color:var(--text-main); padding:4px 8px; border-radius:12px; font-size:11px; font-weight:bold;">🏆 Championship</span>';
      } else if (h.includes('mercenary') && !activityBadges.includes('Mercenary')) {
        activityBadges += '<span style="background:color-mix(in srgb, #ef4444 15%, transparent); border:1px solid #ef4444; color:var(--text-main); padding:4px 8px; border-radius:12px; font-size:11px; font-weight:bold;">⚔️ Mercenary</span>';
      } else if (h.includes('polar') && !activityBadges.includes('Polar')) {
        activityBadges += '<span style="background:color-mix(in srgb, #38bdf8 15%, transparent); border:1px solid #38bdf8; color:var(--text-main); padding:4px 8px; border-radius:12px; font-size:11px; font-weight:bold;">🐻‍❄️ Polar Terrors</span>';
      }
    }
  }
  
  if (activityBadges) {
     headerBadgesHtml += '<div style="display:flex; gap:10px; margin-top:8px; flex-wrap:wrap;">' + activityBadges + '</div>';
  }
  
  if ((lbData && lbData.length > 0) || dynamicSD || bear1 || bear2 || bearBoth || bearAllTime || isAdmin) {
    headerBadgesHtml += '<div style="display:flex; gap:10px; margin-top:8px; flex-wrap:wrap; align-items:center;">';
    
    if (dynamicSD) {
       let scoreStr = Number(dynamicSD.score).toLocaleString();
       headerBadgesHtml += '<span style="background:color-mix(in srgb, var(--accent) 15%, transparent); border:1px solid var(--accent); color:var(--text-main); padding:4px 8px; border-radius:12px; font-size:11px; font-weight:bold;">🏅 All-Time Showdown: <span style="color:var(--text-main);">#'+dynamicSD.rank+' ('+scoreStr+')</span></span>';
    }
    
    if (bear1 || bear2 || bearBoth || bearAllTime) {
       let allTimeStr = bearAllTime ? '#' + bearAllTime.rank + ' (' + bearAllTime.score + ') All-Time' : '0 All-Time';
       
       let currentParts = [];
       if (bear1) currentParts.push('T1: #' + bear1.rank + ' (' + bear1.score + ')');
       if (bear2) currentParts.push('T2: #' + bear2.rank + ' (' + bear2.score + ')');
       
       let subStr = "";
       if (currentParts.length > 0) {
           subStr = '(' + currentParts.join(' | ') + ')';
       } else if (bearBoth) {
           subStr = '(Total: #' + bearBoth.rank + ' (' + bearBoth.score + '))';
       } else {
           subStr = '0 Current';
       }
       
       let innerText = allTimeStr + ' | ' + subStr;
       
       headerBadgesHtml += '<span style="background:color-mix(in srgb, var(--accent) 15%, transparent); border:1px solid var(--accent); color:var(--text-main); padding:4px 8px; border-radius:12px; font-size:11px; font-weight:bold;">🐻 Bear Trap Wins: <span style="color:var(--text-main);">'+innerText+'</span></span>';
    }
    let btColIndex = -1;
    let btAllTimeColIndex = -1;
    if (headers) {
        btColIndex = headers.findIndex(h => typeof h === 'string' && h.toLowerCase().trim() === 'total bt donations');
        btAllTimeColIndex = headers.findIndex(h => typeof h === 'string' && h.toLowerCase().trim() === 'all-time bt donations');
    }
    let hasFallbackCurrent = (btColIndex !== -1 && p && p[btColIndex] !== undefined && p[btColIndex] !== "");
    let hasFallbackAllTime = (btAllTimeColIndex !== -1 && p && p[btAllTimeColIndex] !== undefined && p[btAllTimeColIndex] !== "");

    if (btDonationsCurrent || btDonationsAllTime || hasFallbackCurrent || hasFallbackAllTime) {
         let allTimeStr = '0 All-Time';
         if (btDonationsAllTime) {
             allTimeStr = '#' + btDonationsAllTime.rank + ' (' + btDonationsAllTime.score + ') All-Time';
         } else if (hasFallbackAllTime) {
             allTimeStr = '(' + p[btAllTimeColIndex].toString() + ') All-Time';
         }

         let currentScoreStr = "0";
         if (btDonationsCurrent) {
             currentScoreStr = '#' + btDonationsCurrent.rank + ' (' + btDonationsCurrent.score + ')';
         } else if (hasFallbackCurrent) {
             currentScoreStr = '(' + p[btColIndex].toString() + ')';
         }
         let currentStr = currentScoreStr + ' Current';
         let innerText = allTimeStr + ' | ' + currentStr;
         headerBadgesHtml += '<span style="background:color-mix(in srgb, var(--accent) 15%, transparent); border:1px solid var(--accent); color:var(--text-main); padding:4px 8px; border-radius:12px; font-size:11px; font-weight:bold;">🐻 BT Donations: <span style="color:var(--text-main);">'+innerText+'</span></span>';
      }
      
      if (isAdmin) {
       // Buttons moved to top admin bar
    }
    
    otherLbs.forEach(lb => {
      let scoreFormatted = lb.score;
      if (lb.rank) {
          scoreFormatted = '#' + lb.rank + ' (' + lb.score + ')';
      }
      headerBadgesHtml += '<span style="background:color-mix(in srgb, var(--accent) 15%, transparent); border:1px solid var(--accent); color:var(--text-main); padding:4px 8px; border-radius:12px; font-size:11px; font-weight:bold;">' + lb.emoji + ' ' + lb.title + ': <span style="color:var(--text-main);">' + scoreFormatted + '</span></span>';
    });
    
    headerBadgesHtml += '</div>';
  }
  
  let metricsHtml = '<div style="margin-top: 25px;">';
  metricsHtml += '<h3 style="margin: 0 0 5px 0; color:var(--text-main); font-size:16px; border-bottom:1px solid var(--border); padding-bottom:8px;">📅 Events Checklist</h3>';
  metricsHtml += '<p style="font-size:11px; color:var(--text-muted); margin:0 0 15px 0;">✅ = Participated / Done <span style="margin:0 5px;">|</span> ❌ = Action Required <span style="margin:0 5px;">|</span> ⏳ = Upcoming</p>';
  metricsHtml += '<div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:15px;">';
  
  let missedEvents = [];
  const supportedEvents = ["Championship", "Polar Terrors", "Mercenary Prestige", "Voter"];
  
  for (let col = 1; col < headers.length; col++) {
    let header = headers[col] || "Metric " + col;
    if (header.toLowerCase().includes("bt donation")) continue;
    
    let val = p[col];
    let isX = false;
    
    if (val === undefined || val === null || val.toString().trim() === "") {
      val = "<span style='color:var(--text-muted);'>-</span>";
      isX = true; // empty treats as action required
    } else {
      let strVal = val.toString().toLowerCase().trim();
      if (val === true || strVal === "true" || strVal === "✅" || strVal === "yes") {
        val = "✅";
      } else if (val === false || strVal === "false" || strVal === "❌" || strVal === "no") {
        val = colIsUpcoming[col] ? "⏳" : "❌";
        isX = true; // Include both missed and upcoming in the missedEvents array for Admin Quick Fix
      }
    }
    
    let boxStyle = "background:var(--bg-main); border:1px solid var(--border); border-radius:8px; padding:15px; text-align:center; box-shadow:0 2px 4px rgba(0,0,0,0.05); transition:transform 0.2s;";
    let boxContent = '<div style="font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; font-weight:bold;">'+header+'</div>';
    boxContent += '<div style="font-size:18px; font-weight:bold; color:var(--text-main);">'+val+'</div>';
    
    if (isX && supportedEvents.some(s => header.toLowerCase().includes(s.toLowerCase()))) {
       missedEvents.push(header);
    }
    
    metricsHtml += '<div style="'+boxStyle+'">' + boxContent + '</div>';
  }
  metricsHtml += '</div>';

  // Lifetime Attendance Record Card
  const evStats = p._eventStats || {};
  const mShowdown = evStats.missedShowdown || 0;
  const mChamp = evStats.missedChampionship || 0;
  const mMerc = evStats.missedMercenary || 0;
  const mPolar = evStats.missedPolarTerrors || 0;
  const mBear = evStats.missedBearTrap || 0;
  const totalMisses = evStats.totalMisses !== undefined ? evStats.totalMisses : (mShowdown + mChamp + mMerc + mPolar + mBear);

  metricsHtml += `
    <div style="margin-top: 20px; background:var(--bg-main); border:1px solid var(--border); border-radius:10px; padding:15px;">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:8px; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
        <h3 style="margin:0; color:var(--text-main); font-size:15px; display:flex; align-items:center; gap:6px;">📊 Lifetime Attendance Record</h3>
        <span style="font-size:12px; font-weight:bold; padding:3px 10px; border-radius:12px; background:${totalMisses === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; color:${totalMisses === 0 ? '#10b981' : '#ef4444'}; border:1px solid ${totalMisses === 0 ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'};">
          ${totalMisses === 0 ? '⭐ Perfect Record (0 Misses)' : `⚠️ ${totalMisses} Total Miss${totalMisses === 1 ? '' : 'es'}`}
        </span>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap:10px; text-align:center;">
        <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:6px; padding:10px;">
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px; font-weight:bold;">🔥 Showdown Missed</div>
          <div style="font-size:16px; font-weight:bold; color:${mShowdown > 0 ? '#ef4444' : 'var(--text-main)'};">${mShowdown}</div>
        </div>
        <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:6px; padding:10px;">
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px; font-weight:bold;">🏆 Champ Missed</div>
          <div style="font-size:16px; font-weight:bold; color:${mChamp > 0 ? '#ef4444' : 'var(--text-main)'};">${mChamp}</div>
        </div>
        <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:6px; padding:10px;">
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px; font-weight:bold;">⚔️ Merc Missed</div>
          <div style="font-size:16px; font-weight:bold; color:${mMerc > 0 ? '#ef4444' : 'var(--text-main)'};">${mMerc}</div>
        </div>
        <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:6px; padding:10px;">
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px; font-weight:bold;">🐻‍❄️ Polar Missed</div>
          <div style="font-size:16px; font-weight:bold; color:${mPolar > 0 ? '#ef4444' : 'var(--text-main)'};">${mPolar}</div>
        </div>
        <div style="background:var(--card-bg); border:1px solid var(--border); border-radius:6px; padding:10px;">
          <div style="font-size:11px; color:var(--text-muted); margin-bottom:4px; font-weight:bold;">🐻 Bear Trap Missed</div>
          <div style="font-size:16px; font-weight:bold; color:${mBear > 0 ? '#ef4444' : 'var(--text-main)'};">${mBear}</div>
        </div>
      </div>
    </div>
  `;

  metricsHtml += '</div>';
  
  let playerGameId = nameToIdMap[chiefName];
  let tryUrl = (playerGameId && avatarMap[playerGameId]) ? avatarMap[playerGameId] : 'images/' + chiefName + '.png';
  
  let avatarImgHtml = '<img src="'+tryUrl+'" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\';"><div style="display:none; align-items:center; justify-content:center; width:100%; height:100%;">' + chiefName.charAt(0).toUpperCase() + '</div>';
  
  let adminBarHtml = '';
  if (isAdmin) {
    let missedJson = encodeURIComponent(JSON.stringify(missedEvents));
    let adminActionBtn = '';
    if (playerGameId && window.getAdminLevel(currentUser) === 'R5') {
        if (window.isAdminUser({gameId: parseInt(playerGameId)})) {
            adminActionBtn = `<button onclick="window.revokeAdmin('${playerGameId}')" style="background:rgba(231,76,60,0.1); color:var(--danger); border:1px solid rgba(231,76,60,0.3); padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px; text-align:left; width:100%; transition: 0.2s;" onmouseover="this.style.background='rgba(231,76,60,0.2)'" onmouseout="this.style.background='rgba(231,76,60,0.1)'">❌ Revoke Admin</button>`;
        } else {
            adminActionBtn = `<button onclick="window.grantAdmin('${playerGameId}', 'R5')" style="background:rgba(255,215,0,0.1); color:#FFD700; border:1px solid rgba(255,215,0,0.3); padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px; text-align:left; width:100%; transition: 0.2s;" onmouseover="this.style.background='rgba(255,215,0,0.2)'" onmouseout="this.style.background='rgba(255,215,0,0.1)'">👑 Grant R5 (Leader)</button>
                              <button onclick="window.grantAdmin('${playerGameId}', 'R4')" style="background:rgba(52,152,219,0.1); color:var(--accent); border:1px solid rgba(52,152,219,0.3); padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px; text-align:left; width:100%; transition: 0.2s; margin-top:5px;" onmouseover="this.style.background='rgba(52,152,219,0.2)'" onmouseout="this.style.background='rgba(52,152,219,0.1)'">🛡️ Grant R4 (Officer)</button>`;
        }
    }
    
    adminBarHtml = `
      <div style="position:relative; display:inline-block;">
        <button onclick="const m = this.nextElementSibling; if(m.style.display==='flex'){m.style.display='none';}else{document.querySelectorAll('.admin-dropdown-menu').forEach(d=>d.style.display='none'); m.style.display='flex';} event.stopPropagation();" style="background:var(--accent); color:#fff; border:none; padding:8px 14px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:13px; display:flex; align-items:center; gap:5px; transition:0.2s;" onmouseover="this.style.opacity=0.8" onmouseout="this.style.opacity=1">
          ⚙️ Actions ▾
        </button>
        <div class="admin-dropdown-menu" style="display:none; flex-direction:column; gap:8px; position:absolute; top:100%; right:0; margin-top:8px; background:var(--card-bg); border:1px solid var(--border); border-radius:8px; padding:10px; min-width:180px; box-shadow:0 10px 25px rgba(0,0,0,0.5); z-index:100;" onclick="event.stopPropagation();">
          ${adminActionBtn ? adminActionBtn : ''}
          <button onclick="window.promptLogBearTrapWinner('${chiefName.replace(/'/g, "\\'")}')" style="background:rgba(255,215,0,0.1); color:#FFD700; border:1px solid rgba(255,215,0,0.3); padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px; text-align:left; transition: 0.2s;" onmouseover="this.style.background='rgba(255,215,0,0.2)'" onmouseout="this.style.background='rgba(255,215,0,0.1)'">👑 Crown Winner</button>
          <button onclick="window.promptBearTrap('${chiefName.replace(/'/g, "\\'")}')" style="background:rgba(46,204,113,0.1); color:var(--success); border:1px solid rgba(46,204,113,0.3); padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px; text-align:left; transition: 0.2s;" onmouseover="this.style.background='rgba(46,204,113,0.2)'" onmouseout="this.style.background='rgba(46,204,113,0.1)'">🥩 + Bear Donation</button>
          <button onclick="window.promptEditEvents('${chiefName.replace(/'/g, "\\'")}')" style="background:rgba(52,152,219,0.1); color:var(--accent); border:1px solid rgba(52,152,219,0.3); padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px; text-align:left; transition: 0.2s;" onmouseover="this.style.background='rgba(52,152,219,0.2)'" onmouseout="this.style.background='rgba(52,152,219,0.1)'">📝 Edit Events</button>
          <button onclick="window.adminLinkAltAccountPromptByChief('${chiefName.replace(/'/g, "\\'")}')" style="background:rgba(52,152,219,0.1); color:var(--accent); border:1px solid rgba(52,152,219,0.3); padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px; text-align:left; transition: 0.2s; margin-top:5px;" onmouseover="this.style.background='rgba(52,152,219,0.2)'" onmouseout="this.style.background='rgba(52,152,219,0.1)'">➕ Add Alt Account</button>
          <div style="height:1px; background:var(--border); margin:5px 0;"></div>
          ${playerGameId ? `<button onclick="window.adminSpoofPlayer('${playerGameId}')" style="background:rgba(236,72,153,0.1); color:var(--danger); border:1px solid rgba(236,72,153,0.3); padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px; text-align:left; transition: 0.2s;" onmouseover="this.style.background='rgba(236,72,153,0.2)'" onmouseout="this.style.background='rgba(236,72,153,0.1)'">🎭 Spoof Session</button>` : ''}
          <div style="height:1px; background:var(--border); margin:5px 0;"></div>
          <button onclick="window.adminDeletePlayer('${chiefName.replace(/'/g, "\\'")}')" style="background:rgba(239,68,68,0.1); color:var(--danger); border:1px solid rgba(239,68,68,0.3); padding:8px 12px; border-radius:6px; cursor:pointer; font-weight:bold; font-size:12px; text-align:left; transition: 0.2s;" onmouseover="this.style.background='rgba(239,68,68,0.2)'" onmouseout="this.style.background='rgba(239,68,68,0.1)'">🗑️ Delete Player</button>
        </div>
      </div>
    `;
  }
  
    let adminBadgeHtml = '';
    let gid = nameToIdMap[chiefName];
    if (gid) {
        let level = window.getAdminLevel({ gameId: gid });
        if (level) {
            let lvlColor = (level === "R5") ? "#FFD700" : "var(--accent)";
            let lvlBg = (level === "R5") ? "rgba(255,215,0,0.1)" : "rgba(52,152,219,0.1)";
            adminBadgeHtml = `<span style="font-size:12px; color:${lvlColor}; background:${lvlBg}; border:1px solid ${lvlBg}; padding:2px 6px; border-radius:6px; font-weight:bold; display:flex; align-items:center; gap:4px; margin-left:5px;">👑 ${level}</span>`;
        }
    }
    
    let html = '<div class="card" style="margin-bottom:20px; animation: fadeIn 0.3s ease;"><div style="display:flex; align-items:center; gap:20px; margin-bottom:15px; flex-wrap:wrap;"><div style="width:70px; height:70px; border-radius:50%; overflow:hidden; background:var(--accent); color:#fff; font-size:32px; font-weight:bold; display:flex; justify-content:center; align-items:center; border:2px solid var(--border); box-shadow:0 4px 10px rgba(0,0,0,0.1); flex-shrink:0;">' + avatarImgHtml + '</div><div style="flex:1; min-width:200px;"><div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:10px;"><h2 style="margin:0; font-size:24px; color:var(--text-main); display:flex; align-items:center; gap:10px; word-break:break-word;">' + chiefName + adminBadgeHtml + '</h2>' + adminBarHtml + '</div>' + headerBadgesHtml + '</div></div>' + metricsHtml;

    if (isAdmin && altAccounts && altAccounts.length > 0) {
        html += `<div style="text-align:left; border-top:1px solid var(--border); padding-top:20px; margin-top:20px;">
         <details style="background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid var(--border); padding:10px; cursor:pointer;" class="alt-accounts-details">
             <summary style="font-weight:bold; font-size:18px; color:var(--text-main); outline:none; display:flex; align-items:center; justify-content:space-between;">
                 <div style="display:flex; align-items:center; gap:8px;">
                     🔗 Linked Alt Accounts <span style="font-size:14px; color:var(--text-muted); font-weight:normal;">(${altAccounts.length})</span>
                 </div>
                 <span class="alt-accounts-arrow" style="font-size:14px; transition:transform 0.3s ease;">▼</span>
             </summary>
             <style>.alt-accounts-details[open] .alt-accounts-arrow { transform: rotate(180deg); }</style>
             <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:20px; margin-top:20px; cursor:default;">`;
        
        altAccounts.forEach(gid => {
            let altName = idToNameMap[gid] || `Game ID: ${gid}`;
            let flVal = 'N/A';
            let timeActiveVal = 'Unknown';
            const rosterData = window.liveData ? window.liveData["Chief's List"] : null;
            if (rosterData && rosterData.length > 1) {
                for (let i = 1; i < rosterData.length; i++) {
                    if (rosterData[i][1] && rosterData[i][1].toString().trim() === gid.toString().trim()) {
                        flVal = rosterData[i][2] !== undefined && rosterData[i][2] !== "" ? rosterData[i][2] : 'N/A';
                        timeActiveVal = rosterData[i][5] !== undefined && rosterData[i][5] !== "" ? window.formatTimeActiveShort(rosterData[i][5].toString()) : 'Unknown';
                        break;
                    }
                }
            }
            let isAltEnrolled = false;
            
            const gcb = window.liveData ? window.liveData['giftcodebot'] : null;
            if (gcb && gcb.length > 1) {
                for (let i = 1; i < gcb.length; i++) {
                    if (gcb[i][1] && gcb[i][1].toString().trim() === gid.toString().trim()) {
                        isAltEnrolled = true;
                        break;
                    }
                }
            }
            
            let enrolledBadge = isAltEnrolled ? `<span style="border:1px solid #10b981; color:#10b981; background:rgba(16,185,129,0.1); border-radius:9999px; padding:4px 12px; font-size:12px; font-weight:500; display:inline-flex; align-items:center; gap:6px; margin-top:8px;">&#x2705; Code Enrolled</span>` : '';
            
            let furnaceIcon = `<svg class="w-6 h-6 text-orange-500" style="width:24px; height:24px; color:#f97316;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>`;
            let timerIcon = `<svg class="w-6 h-6 text-cyan-400" style="width:24px; height:24px; color:#06b6d4;" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
            
            let flSpanId = `admin-alt-fl-${gid}`;
            let flDisplay = window.getFurnaceIconHtml && flVal !== 'N/A' ? window.getFurnaceIconHtml(flVal).replace('🔥 ', '').replace('Lv ', '') : flVal;
            
            if (flVal === 'N/A') {
                flDisplay += `<img src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" onload="if(window.adminFetchAltFurnace) window.adminFetchAltFurnace('${gid}', '${flSpanId}')" style="display:none;">`;
            }

            html += `
            <div style="background:rgba(15,23,42,0.6); backdrop-filter:blur(12px); border:1px solid rgba(255,255,255,0.1); border-radius:24px; padding:24px; box-shadow:0 10px 30px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1); display:flex; flex-direction:column; justify-content:space-between;">
                
                <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                    <div style="display:flex; gap:16px;">
                        <div style="width:70px; height:70px; border-radius:50%; border:2px solid #06b6d4; box-shadow:0 0 15px rgba(6,182,212,0.5); overflow:hidden; background:var(--bg-secondary); position:relative;">
                            <img id="altAvatarImg-${gid}" src="${avatarMap ? avatarMap[gid] || `images/${altName}.png` : `images/${altName}.png`}" style="width:100%; height:100%; object-fit:cover;" onerror="this.onerror=null; this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div id="altAvatarFallback-${gid}" style="display:none; align-items:center; justify-content:center; width:100%; height:100%; font-size:24px; font-weight:bold; color:#fff;">${altName.charAt(0).toUpperCase()}</div>
                        </div>
                        <div style="display:flex; flex-direction:column; justify-content:center;">
                            <span style="font-size:20px; font-weight:600; color:#ffffff; line-height:1.2;">${altName}</span>
                            <span style="font-size:13px; color:#94a3b8; margin-top:4px;">ID: ${gid}</span>
                            ${enrolledBadge}
                        </div>
                    </div>
                    <button onclick="window.adminUnlinkAltAccountPrompt('${chiefName.replace(/'/g, "\\'")}', '${gid}')" style="border:1px solid #f87171; color:#f87171; border-radius:8px; padding:6px 12px; font-size:12px; font-weight:600; cursor:pointer; background:transparent; transition:background 0.2s; flex-shrink:0;" onmouseover="this.style.background='rgba(248,113,113,0.1)'" onmouseout="this.style.background='transparent'">UNLINK</button>
                </div>
                
                <div style="margin-top:24px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.05); border-radius:16px; padding:16px; display:flex; justify-content:space-between; align-items:center;">
                    <div style="display:flex; align-items:center; gap:12px;">
                        ${furnaceIcon}
                        <div style="display:flex; flex-direction:column;">
                            <span id="${flSpanId}" style="font-size:22px; font-weight:bold; color:#ffffff; line-height:1; display:flex; align-items:center;">${flDisplay}</span>
                            <span style="font-size:11px; color:#94a3b8; margin-top:4px; text-transform:uppercase; letter-spacing:0.5px;">Furnace Level</span>
                        </div>
                    </div>
                    <div style="display:flex; align-items:center; gap:12px;">
                        ${timerIcon}
                        <div style="display:flex; flex-direction:column;">
                            <span style="font-size:16px; font-weight:bold; color:#ffffff; line-height:1;">${timeActiveVal}</span>
                            <span style="font-size:11px; color:#94a3b8; margin-top:4px; text-transform:uppercase; letter-spacing:0.5px;">Time Active</span>
                        </div>
                    </div>
                </div>
                
            </div>
            `;
        });
        
        html += `</div></details></div>`;
    }

    html += '</div>';
    return html;
};

window.promptEditEvents = async (name) => {
  if (!name) return;
  const gameId = window.nameToIdMap ? window.nameToIdMap[name] : null;
  const gIdStr = (gameId && gameId.toString().trim()) ? gameId.toString().trim() : (name ? name.toLowerCase().replace(/[^a-z0-9]/g, '_') : '');

  // 1. Fetch live activity status from Firebase activity_live
  let currentActivity = {};
  try {
    if (gIdStr) {
      const snap = await get(ref(db, `activity_live/${gIdStr}`));
      if (snap.exists()) currentActivity = snap.val() || {};
    }
  } catch(e) {
    console.warn("Could not fetch activity_live from Firebase:", e);
  }

  // Fallback to fetchActivityData matrix if Firebase node is clean
  if (!currentActivity || Object.keys(currentActivity).length === 0) {
    try {
      const actMatrix = await window.fetchActivityData();
      if (actMatrix && Array.isArray(actMatrix)) {
        const row = actMatrix.find(r => r[0] && r[0].toString().trim() === name.toString().trim());
        if (row) {
          const isT = (v) => v === true || (typeof v === 'string' && (v.toLowerCase().trim() === 'true' || v.toLowerCase().trim() === 'yes'));
          currentActivity = {
            perfectAttendance: row[1] === 0 || row[1] === "0",
            championship: isT(row[2]),
            mercenary: isT(row[3]),
            polarTerrors: isT(row[4]),
            voter: isT(row[5])
          };
        }
      }
    } catch(e) { console.error(e); }
  }

  const eventsList = [
    { key: 'perfectAttendance', label: '🔥 Perfect Attendance', desc: 'Participated in all Showdown event days' },
    { key: 'championship', label: '🏆 Championship', desc: 'Registered / Participated in Alliance Championship' },
    { key: 'mercenary', label: '⚔️ Mercenary', desc: 'Participated in Mercenary Prestige event' },
    { key: 'polarTerrors', label: '🐻‍❄️ Polar Terrors', desc: 'Defeated Polar Terrors rallies' },
    { key: 'voter', label: '🗳️ Voter', desc: 'Participated in Alliance Surveys & Votes' }
  ];

  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.75); backdrop-filter:blur(5px); z-index:10001; display:flex; justify-content:center; align-items:center; animation:fadeIn 0.2s ease;';

  const rowsHtml = eventsList.map((ev) => {
    const isChecked = !!currentActivity[ev.key];
    return `
      <div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-main); padding:12px 16px; border-radius:10px; border:1px solid var(--border);">
        <div>
          <div style="font-weight:bold; color:var(--text-main); font-size:15px;">${ev.label}</div>
          <div style="font-size:11px; color:var(--text-muted);">${ev.desc}</div>
        </div>
        <label style="position:relative; display:inline-block; width:50px; height:26px; flex-shrink:0; cursor:pointer;">
          <input type="checkbox" id="evToggle_${ev.key}" ${isChecked ? 'checked' : ''} style="opacity:0; width:0; height:0;">
          <span style="position:absolute; top:0; left:0; right:0; bottom:0; background:${isChecked ? 'var(--success)' : '#475569'}; border-radius:26px; transition:0.3s;" id="switchBg_${ev.key}"></span>
          <span style="position:absolute; content:''; height:20px; width:20px; left:${isChecked ? '26px' : '3px'}; bottom:3px; background:white; border-radius:50%; transition:0.3s;" id="switchDot_${ev.key}"></span>
        </label>
      </div>
    `;
  }).join('');

  modal.innerHTML = `
    <div style="background:var(--card-bg); border:1px solid var(--accent); border-radius:16px; padding:24px; max-width:440px; width:90%; box-shadow:0 20px 50px rgba(0,0,0,0.8);">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px; border-bottom:1px solid var(--border); padding-bottom:10px;">
        <h3 style="margin:0; color:var(--text-main); font-size:18px; display:flex; align-items:center; gap:8px;">
          ⚙️ Edit Events for ${window.escapeHTML(name)}
        </h3>
        <button id="closeEvModalX" style="background:none; border:none; color:var(--text-muted); font-size:24px; cursor:pointer; padding:0;">&times;</button>
      </div>
      <p style="margin:0 0 16px 0; color:var(--text-muted); font-size:13px;">Toggle event participation status below. Updates save directly to Firebase Realtime Database in real time (&lt; 10ms)!</p>
      
      <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
        ${rowsHtml}
      </div>
      
      <div id="evStatusFeedback" style="font-size:12px; font-weight:bold; text-align:center; margin-bottom:10px;"></div>

      <div style="display:flex; gap:10px;">
        <button id="cancelEvBtn" style="flex:1; padding:12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-main); color:var(--text-main); cursor:pointer; font-weight:bold; font-size:14px;">Cancel</button>
        <button id="submitEvBtn" style="flex:2; padding:12px; border-radius:8px; border:none; background:var(--accent); color:#fff; cursor:pointer; font-weight:bold; font-size:14px;">💾 Save Event Status</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Toggle switch animation listener
  eventsList.forEach(ev => {
    const input = modal.querySelector(`#evToggle_${ev.key}`);
    const bg = modal.querySelector(`#switchBg_${ev.key}`);
    const dot = modal.querySelector(`#switchDot_${ev.key}`);
    if (input) {
      input.addEventListener('change', () => {
        bg.style.background = input.checked ? 'var(--success)' : '#475569';
        dot.style.left = input.checked ? '26px' : '3px';
      });
    }
  });

  const closeModal = () => modal.remove();
  modal.querySelector('#cancelEvBtn').addEventListener('click', closeModal);
  modal.querySelector('#closeEvModalX').addEventListener('click', closeModal);

  modal.querySelector('#submitEvBtn').addEventListener('click', async () => {
    const submitBtn = modal.querySelector('#submitEvBtn');
    const feedback = modal.querySelector('#evStatusFeedback');

    submitBtn.disabled = true;
    submitBtn.textContent = "Saving...";
    feedback.style.color = "var(--text-muted)";
    feedback.textContent = "Saving event status to Firebase...";

    const newActivityObj = {
      name: name,
      perfectAttendance: modal.querySelector('#evToggle_perfectAttendance').checked,
      championship: modal.querySelector('#evToggle_championship').checked,
      mercenary: modal.querySelector('#evToggle_mercenary').checked,
      polarTerrors: modal.querySelector('#evToggle_polarTerrors').checked,
      voter: modal.querySelector('#evToggle_voter').checked,
      updatedAt: Date.now()
    };

    try {
      // 1. Write natively to Firebase activity_live
      if (gIdStr) {
        await set(ref(db, `activity_live/${gIdStr}`), newActivityObj);
      }

      // 2. Sync to individual event-specific Firebase nodes
      const adminName = currentUser ? ((window.idToNameMap && window.idToNameMap[currentUser.gameId]) || currentUser.name || "Admin") : "Admin";
      const updatedBy = adminName;
      const timestamp = Date.now();

      if (gIdStr) {
        // Championship node
        try {
          await update(ref(db, `championship/${gIdStr}`), {
            gameId: gIdStr, name: name, signedUp: newActivityObj.championship,
            lastUpdated: timestamp, updatedBy: updatedBy
          });
          if (window.championshipCache) {
            if (!window.championshipCache[gIdStr]) window.championshipCache[gIdStr] = {};
            window.championshipCache[gIdStr].signedUp = newActivityObj.championship;
          }
        } catch(e) { console.warn("Edit Events: championship sync error", e); }

        // Mercenary node
        try {
          await update(ref(db, `mercenary/${gIdStr}`), {
            gameId: gIdStr, name: name, signedUp: newActivityObj.mercenary,
            lastUpdated: timestamp, updatedBy: updatedBy
          });
          if (window.mercenaryCache) {
            if (!window.mercenaryCache[gIdStr]) window.mercenaryCache[gIdStr] = {};
            window.mercenaryCache[gIdStr].signedUp = newActivityObj.mercenary;
          }
        } catch(e) { console.warn("Edit Events: mercenary sync error", e); }

        // Polar Terrors node
        try {
          await update(ref(db, `polarterrors/${gIdStr}`), {
            gameId: gIdStr, name: name, signedUp: newActivityObj.polarTerrors,
            lastUpdated: timestamp, updatedBy: updatedBy
          });
          if (window.polarTerrorsCache) {
            if (!window.polarTerrorsCache[gIdStr]) window.polarTerrorsCache[gIdStr] = {};
            window.polarTerrorsCache[gIdStr].signedUp = newActivityObj.polarTerrors;
          }
        } catch(e) { console.warn("Edit Events: polarterrors sync error", e); }
      }

      // 3. Ping GAS backend for each event to sync Google Sheets
      try {
        const evToken = await getAuthToken().catch(() => '');
        const eventMap = {
          'championship': 'Alliance Championship ',
          'mercenary': 'Mercenary Prestige',
          'polarTerrors': 'Polar Terrors',
          'voter': 'Voter'
        };
        for (const [key, sheetEventName] of Object.entries(eventMap)) {
          const status = newActivityObj[key] ? 'yes' : 'no';
          const url = `${API_BASE_URL}?api=updateEvent&name=${encodeURIComponent(name)}&eventName=${encodeURIComponent(sheetEventName)}&status=${encodeURIComponent(status)}&admin=${encodeURIComponent(adminName)}&token=${encodeURIComponent(evToken)}`;
          fetch(url, { mode: 'no-cors' }).catch(e => null);
        }
      } catch(e) { console.warn("Edit Events: GAS backend sync error", e); }

      // 4. Log admin action
      if (window.logAdminAction) {
        window.logAdminAction("Edit Roster Member Events", `Updated event statuses for ${name}`, name);
      }

      if (window.showToast) window.showToast(`Updated event status for ${name}!`, "success");
      modal.remove();

      // Clear caches so fresh data is fetched across all trackers
      window.polarTerrorsCache = null;
      window.championshipCache = null;
      window.mercenaryCache = null;
      window.activityCache = null;
      window._activityMatrixLoaded = false;

      // Refresh view
      if (typeof window.activeViewFunc === 'function') window.activeViewFunc();
    } catch(err) {
      console.error(err);
      feedback.style.color = "#ef4444";
      feedback.textContent = err.message || "Failed to update events.";
      submitBtn.disabled = false;
      submitBtn.textContent = "💾 Save Event Status";
    }
  });
};

window.promptBearTrap = async (name) => {
  let amt = await window.customPrompt("Enter Bear Trap Donation Amount to ADD for " + name + ":");
  if (!amt) return;
  if (isNaN(amt)) { window.showToast("Invalid number", "error"); return; }
  
  window.showToast("Adding donation...", "success");
  const adminName = currentUser ? (idToNameMap[currentUser.gameId] || "Admin") : "Admin";
  try {
    const addAmt = Number(amt) || 0;
    const donKey = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const donRef = ref(db, `beartrap_donations/${donKey}`);
    const donSnap = await get(donRef);
    let donData = donSnap.val() || { name: name, current: 0, allTime: 0 };
    donData.name = name;
    donData.current = (donData.current || 0) + addAmt;
    donData.allTime = (donData.allTime || 0) + addAmt;
    donData.lastUpdated = Date.now();
    await set(donRef, donData);
           if (addAmt > 0) await window.autoSyncBtSignup(finalName);
    window.logAdminAction("Single Bear Trap Donation Added", `Added +${addAmt.toLocaleString()} Bear Trap donation points to ${name}`, name);

    const donToken2 = await getAuthToken();
    const res = await fetch(`${API_BASE_URL}?api=addDonation&name=${encodeURIComponent(name)}&amount=${encodeURIComponent(amt)}&admin=${encodeURIComponent(adminName)}&token=${encodeURIComponent(donToken2)}`).then(r => r.json()).catch(() => ({ success: true, newTotal: donData.current }));
    if (res && res.success) {
      window.showToast("Successfully added! New Total: " + res.newTotal, "success");
      window.sheetCache = {}; 
      window.liveData['LeaderBoards'] = null; window.livePromises['LeaderBoards'] = null;
      window.liveData['activity '] = null; window.livePromises['activity '] = null;
      if (document.getElementById('uniSearchInput')) {
        window.searchPlayerFull(name);
      } else {
        views.roster();
      }
    } else {
      window.showToast("Error: " + res.message, "error");
    }
  } catch (err) {
    window.showToast("Network Error: " + err.message, "error");
  }
};

// Close all admin dropdowns when clicking anywhere outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.admin-dropdown-menu') && !e.target.closest('button[onclick*="admin-dropdown-menu"]')) {
      document.querySelectorAll('.admin-dropdown-menu').forEach(d => d.style.display = 'none');
  }
});

const contactSidebarBtn = document.getElementById('contactSidebarBtn');
if (contactSidebarBtn) {
  contactSidebarBtn.addEventListener('click', () => {
    closeSidebarFunc();
    document.querySelectorAll('.nav-link, .sub-link').forEach(l => l.classList.remove('active'));
    if (views.contact) {
      window.activeViewFunc = () => views.contact();
      views.contact();
    }
  });
}





window.openAltPerksModal = (gameId, altName) => {
    const modal = document.getElementById('altPerksModal');
    const overlay = document.getElementById('altPerksModalOverlay');
    const nameInput = document.getElementById('altPerksName');
    const idInput = document.getElementById('altPerksGameId');
    const dateInput = document.getElementById('altPerksDateStarted');
    const errorMsg = document.getElementById('altPerksErrorMsg');
    const submitBtn = document.getElementById('altPerksSubmitBtn');
    
    if(!modal || !idInput) return;
    
    errorMsg.style.display = 'none';
    idInput.value = gameId;
    nameInput.value = (altName && !altName.startsWith('Game ID:')) ? altName : '';
    dateInput.value = '';
    submitBtn.textContent = 'Enroll Alt Account';
    submitBtn.disabled = false;
    
    modal.style.display = 'block';
    overlay.style.display = 'block';
    
    // Ensure we don't attach multiple event listeners
    submitBtn.replaceWith(submitBtn.cloneNode(true));
    document.getElementById('altPerksSubmitBtn').addEventListener('click', async () => {
        const btn = document.getElementById('altPerksSubmitBtn');
        const err = document.getElementById('altPerksErrorMsg');
        const cName = document.getElementById('altPerksName').value.trim();
        const cDate = document.getElementById('altPerksDateStarted').value;
        const gId = document.getElementById('altPerksGameId').value;
        
        if (!cName) {
            err.textContent = "Chief Name is required.";
            err.style.display = 'block';
            return;
        }
        
        try {
            btn.disabled = true;
            btn.textContent = "Enrolling...";
            
            const altToken = await getAuthToken();
            const url = `${API_BASE_URL}?api=registerNewPlayer&gameId=${encodeURIComponent(gId)}&name=${encodeURIComponent(cName)}&dateStarted=${encodeURIComponent(cDate)}&token=${encodeURIComponent(altToken)}`;
            const res = await fetch(url).then(r => r.json());
            
            if (res && res.success) {
                if (res.status === 'duplicate_skipped') {
                    window.showToast("This Alt is already enrolled!", "success");
                } else {
                    window.showToast("Successfully Enrolled Alt Account!", "success");
                }
                document.getElementById('altPerksModal').style.display = 'none';
                document.getElementById('altPerksModalOverlay').style.display = 'none';
            } else {
                throw new Error("Backend error");
            }
        } catch (e) {
            err.textContent = "Failed to enroll Alt Account. Try again.";
            err.style.display = 'block';
            btn.disabled = false;
            btn.textContent = "Enroll Alt Account";
        }
    });
};






// --- Mobile Handedness Navigation System ---
window.initHandOrientation = () => {
  const savedHand = localStorage.getItem('wos_hand_orientation') || 'right';
  document.body.classList.remove('hand-right', 'hand-left');
  document.body.classList.add(`hand-${savedHand}`);

  const btns = document.querySelectorAll('.hand-opt-btn');
  btns.forEach(btn => {
    if (btn.getAttribute('data-hand') === savedHand) {
      btn.style.background = 'var(--accent)';
      btn.style.color = '#fff';
    } else {
      btn.style.background = 'transparent';
      btn.style.color = 'var(--text-muted)';
    }
  });
};

window.setHandOrientation = (hand) => {
  localStorage.setItem('wos_hand_orientation', hand);
  window.initHandOrientation();
  if (window.showToast) window.showToast(`Mobile Navigation aligned for ${hand === 'left' ? '🖐️ Left-Handed' : '✋ Right-Handed'} use!`, "info");
};

// Auto-run on startup
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => window.initHandOrientation());
} else {
  window.initHandOrientation();
}

const styleEl = document.createElement('style'); styleEl.textContent = `/* --- Handedness Mobile Top Navbar & Hamburger Rules --- */
@media (max-width: 900px) {
  /* Right-Handed (Default): Hamburger ☰ button on FAR RIGHT */
  body.hand-right .nav-inner {
    flex-direction: row !important;
  }
  body.hand-right .nav-controls {
    order: 2 !important;
    margin-left: auto !important;
    margin-right: 0 !important;
  }
  body.hand-right .nav-brand {
    order: 1 !important;
    margin-right: auto !important;
    margin-left: 0 !important;
  }
  body.hand-right .mobile-menu {
    text-align: right !important;
    align-items: flex-end !important;
    left: auto !important;
    right: 0 !important;
  }
  body.hand-right .nav-links {
    align-items: flex-end !important;
    width: 100% !important;
  }
  body.hand-right .sub-link, body.hand-right .nav-link {
    text-align: right !important;
  }

  /* Left-Handed: Hamburger ☰ button moves over to FAR LEFT */
  body.hand-left .nav-inner {
    flex-direction: row-reverse !important;
  }
  body.hand-left .nav-controls {
    order: 1 !important;
    margin-right: auto !important;
    margin-left: 0 !important;
  }
  body.hand-left .nav-brand {
    order: 2 !important;
    margin-left: auto !important;
    margin-right: 0 !important;
  }
  body.hand-left .mobile-menu {
    text-align: left !important;
    align-items: flex-start !important;
    right: auto !important;
    left: 0 !important;
  }
  body.hand-left .nav-links {
    align-items: flex-start !important;
    width: 100% !important;
  }
  body.hand-left .sub-link, body.hand-left .nav-link {
    text-align: left !important;
  }
  body.hand-left .settings-sidebar {
    left: 0 !important;
    right: auto !important;
    transform: translateX(-100%) !important;
    border-right: 1px solid var(--border) !important;
    border-left: none !important;
  }
  body.hand-left .settings-sidebar.open {
    transform: translateX(0) !important;
  }
  body.hand-left #devDeployBanner {
    left: 20px !important;
    right: auto !important;
  }
}
`; document.head.appendChild(styleEl);

// --- Settings Modal Helpers ---
window.openNotificationsModal = () => {
  const modal = document.getElementById('notificationsModal');
  const overlay = document.getElementById('notificationsModalOverlay');
  if (modal) modal.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
  const sidebar = document.getElementById('settingsSidebar');
  const sideOverlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (sideOverlay) sideOverlay.classList.remove('active');
};

window.openThemeModal = () => {
  const modal = document.getElementById('themeModal');
  const overlay = document.getElementById('themeModalOverlay');
  if (modal) modal.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
  const sidebar = document.getElementById('settingsSidebar');
  const sideOverlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (sideOverlay) sideOverlay.classList.remove('active');
};

window.openMobileNavModal = () => {
  const modal = document.getElementById('mobileNavModal');
  const overlay = document.getElementById('mobileNavModalOverlay');
  if (modal) modal.style.display = 'block';
  if (overlay) overlay.style.display = 'block';
  const sidebar = document.getElementById('settingsSidebar');
  const sideOverlay = document.getElementById('sidebarOverlay');
  if (sidebar) sidebar.classList.remove('open');
  if (sideOverlay) sideOverlay.classList.remove('active');
};

window.closeMobileNavModal = () => {
  const modal = document.getElementById('mobileNavModal');
  const overlay = document.getElementById('mobileNavModalOverlay');
  if (modal) modal.style.display = 'none';
  if (overlay) overlay.style.display = 'none';
};
