import './style.css'
import { initPresence, listenToAuth, loginUser, logoutUser, registerUser, uploadAvatar, deleteAvatar, db, auth, requestPushPermission, listenForForegroundMessages, linkAltAccount, unlinkAltAccount, loginWithGoogle, resetPassword } from './src/firebase.js'
import { ref, onValue, get, set, remove } from 'firebase/database'

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
const authChiefName = document.getElementById('authChiefName');
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
            fetchSheet("Chief's List").catch(() => null),
            fetchSheet("giftcodebot").catch(() => null)
        ]);
        
        if (rosterRawData && rosterRawData.length > 0) {
            for (let i = 1; i < rosterRawData.length; i++) {
                let name = rosterRawData[i][0];
                let id = rosterRawData[i][1];
                if (name && id) {
                    idToNameMap[id] = name.toString().trim();
                      nameToIdMap[name.toString().trim()] = id.toString().trim();
                  }
            }
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
            alert(json.message || "Failed to link alt account.");
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
    } catch(e) {}
};

