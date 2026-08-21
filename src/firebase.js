import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, onDisconnect, set, push, runTransaction, get, increment, update } from "firebase/database";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  sendPasswordResetEmail,
  browserPopupRedirectResolver
} from "firebase/auth";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
const firebaseConfig = {
  apiKey: "AIzaSyBuw51XRkUz5sbr-i8DKiGUgMpAPSiR-vs",
  authDomain: "wos-dashboard-38d4c.firebaseapp.com",
  databaseURL: "https://wos-dashboard-38d4c-default-rtdb.firebaseio.com",
  projectId: "wos-dashboard-38d4c",
  storageBucket: "wos-dashboard-38d4c.firebasestorage.app",
  messagingSenderId: "1041082078621",
  appId: "1:1041082078621:web:9cce2bb45b76fb86404b74",
  measurementId: "G-8SZCNHML68"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

export function initPresence() {
  const onlineEl = document.getElementById('online-counter');
  const viewsEl = document.getElementById('views-counter');
  
  if (!onlineEl || !viewsEl) return;

  // 1. Manage "Currently Online"
  const myConnectionsRef = push(ref(db, 'presence'));
  onDisconnect(myConnectionsRef).remove();

  const connectedRef = ref(db, '.info/connected');
  onValue(connectedRef, (snap) => {
    if (snap.val() === true) {
      set(myConnectionsRef, true);
    }
  });

  const presenceRef = ref(db, 'presence');
  onValue(presenceRef, (snapshot) => {
    let count = 0;
    snapshot.forEach(() => { count++; });
    onlineEl.textContent = count;
  });

  // 2. Manage "Total Views"
  const viewsRef = ref(db, 'stats/totalViews');
  set(viewsRef, increment(1)).catch(() => {
    runTransaction(viewsRef, (currentViews) => (currentViews || 0) + 1);
  });

  onValue(viewsRef, (snapshot) => {
    viewsEl.textContent = (snapshot.val() || 0).toLocaleString();
  });
}

// Authentication
export function listenToAuth(callback) {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // 1. Immediately emit active authenticated user session so UI is never locked in a Sign In loop
      const initialUser = {
        uid: user.uid,
        email: user.email || '',
        name: user.displayName || (user.email ? user.email.split('@')[0] : 'Chief'),
        displayName: user.displayName || 'Chief',
        createdAt: new Date().toISOString()
      };
      if (initialUser.email && initialUser.email.toLowerCase().includes('briandivacox')) {
        initialUser.gameId = '318843189';
        initialUser.name = 'Chief Brian';
        initialUser.displayName = 'Chief Brian';
      }
      callback(initialUser);

      // 2. Attach live Realtime Database listener for dynamic updates (alts, badges, furnace, etc.)
      const usersRef = ref(db, `users/${user.uid}`);
      onValue(usersRef, async (snapshot) => {
        if (snapshot.exists()) {
          let data = snapshot.val() || {};
          data.uid = user.uid; // Inject UID for easy access
          if (!data.email && user.email) data.email = user.email;
          if (!data.name && user.displayName) data.name = user.displayName;
          if (data.email && data.email.toLowerCase().includes('briandivacox') && !data.gameId) {
            data.gameId = '318843189';
          }
          callback(data);
        } else {
          let fallbackData = { ...initialUser };
          // Auto-persist profile under users/{uid}
          try {
            await set(ref(db, `users/${user.uid}`), fallbackData).catch(() => null);
          } catch(e) {}
          callback(fallbackData);
        }
      }, (err) => {
        console.warn("Realtime Database user profile listener error:", err);
        callback(initialUser);
      });
    } else {
      callback(null);
    }
  });
}

export async function linkAltAccount(uid, newGameId, currentLinks = []) {
  if (currentLinks.includes(newGameId)) throw new Error("This account is already linked.");
  
  const updatedLinks = [...currentLinks, newGameId];
  await set(ref(db, `users/${uid}/linkedGameIds`), updatedLinks);

  // Automatically enroll linked alt into giftcode_bot so it receives auto-redemptions
  try {
    const cleanGid = String(newGameId).trim();
    if (cleanGid) {
      await set(ref(db, `giftcode_bot/${cleanGid}`), {
        gameId: cleanGid,
        name: '',
        enrolled: true,
        status: 'Active',
        isAlt: true,
        ownerUid: uid,
        timestamp: Date.now()
      });
    }
  } catch(e) {}
}

export async function unlinkAltAccount(uid, gameIdToRemove, currentLinks = []) {
  const updatedLinks = currentLinks.filter(id => id !== gameIdToRemove);
  await set(ref(db, `users/${uid}/linkedGameIds`), updatedLinks);
  await set(ref(db, `users/${uid}/altTokens/${gameIdToRemove}`), null);
  try {
    const cleanGid = String(gameIdToRemove).trim();
    if (cleanGid) {
      await set(ref(db, `giftcode_bot/${cleanGid}`), null);
    }
  } catch(e) {}
}

export async function registerUser(email, password, gameId, chiefName, furnaceLevel = '') {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  const userData = {
    email: user.email,
    gameId: gameId,
    name: chiefName,
    createdAt: new Date().toISOString()
  };
  if (furnaceLevel) {
    userData.furnaceLevel = furnaceLevel;
  }
  
  // Save user profile in Realtime Database mapped by UID
  await set(ref(db, `users/${user.uid}`), userData);

  // Automatically enroll registered member into giftcode_bot
  if (gameId) {
    try {
      const cleanGid = String(gameId).trim();
      await set(ref(db, `giftcode_bot/${cleanGid}`), {
        gameId: cleanGid,
        name: chiefName || '',
        enrolled: true,
        status: 'Active',
        ownerUid: user.uid,
        timestamp: Date.now()
      });
    } catch(e) {}
  }
  
  return user;
}

export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

export async function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.addScope('profile');
  provider.addScope('email');
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    return await signInWithPopup(auth, provider, browserPopupRedirectResolver);
  } catch (err) {
    console.error("[Firebase Google Auth Error]:", err);
    if (err.code === 'auth/internal-error') {
      console.error("[Firebase Diagnostic]: auth/internal-error typically occurs when Google Sign-in provider or Project Support Email is not configured in Firebase Console (Authentication > Sign-in method > Google), or when the current domain is not in Authorized Domains.");
    }
    throw err;
  }
}

export async function logoutUser() {
  return signOut(auth);
}

// Avatar Management using Base64 String
export async function uploadAvatar(gameId, base64String) {
  if (!gameId) throw new Error("Game ID is required to upload an avatar");
  if (!base64String) throw new Error("Image data is missing");
  
  // Save Base64 string directly to Realtime Database
  await set(ref(db, `avatars/${gameId}`), base64String);
  return base64String;
}

export async function deleteAvatar(gameId) {
  if (!gameId) return;
  // Remove from Realtime DB
  await set(ref(db, `avatars/${gameId}`), null);
}

export { get, set, ref, db, update };

// Push Notifications Setup
let messaging = null;
try {
  messaging = getMessaging(app);
} catch(e) {
  console.warn("Firebase Messaging not supported in this browser.", e);
}

export async function requestPushPermission(uid, userInfo = null) {
  if (!messaging) throw new Error("Push notifications are not supported in your browser.");
  
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    let registration;
    try {
      registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}firebase-messaging-sw.js`);
    } catch(err) {
      console.error("Service worker registration failed:", err);
      throw new Error("Failed to register background sync.");
    }

    const token = await getToken(messaging, { 
      vapidKey: 'BPb1AoYfDZ396gJao3kuPtnBZqvV8KB6ufRGukiCW5INPh4oIyYno-3Noovj8ExY25wb-BXYgNHTP6sL9iESIpM',
      serviceWorkerRegistration: registration
    });
    
    if (token) {
      // Save token securely with Chief metadata
      const payload = {
        createdAt: new Date().toISOString(),
        uid: uid || 'anonymous',
        token: token
      };
      if (userInfo && typeof userInfo === 'object') {
        if (userInfo.gameId) payload.gameId = String(userInfo.gameId);
        if (userInfo.name || userInfo.chiefName) payload.chiefName = userInfo.name || userInfo.chiefName;
      }
      await set(ref(db, `fcmTokens/${token}`), payload);
      if (uid && uid !== 'anonymous') {
        await update(ref(db, `users/${uid}`), {
          pushEnabled: true,
          fcmToken: token,
          lastPushEnabledAt: Date.now()
        }).catch(() => null);
      }
      return token;
    }
  }
  throw new Error("Permission denied or failed to get token.");
}

export function listenForForegroundMessages(callback) {
  if (messaging) {
    onMessage(messaging, (payload) => {
      callback(payload);
    });
  }
}

export { auth };
