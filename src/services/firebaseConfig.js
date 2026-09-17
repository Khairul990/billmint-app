// ============================================================
// FIREBASE CONFIG — lazy SDK initializer.
//
// The firebase SDK (app + auth + firestore + storage, ~690KB
// uncompressed) loads via dynamic import() so it NEVER blocks
// module evaluation / first paint. `app`, `auth`, `db`,
// `storage` and `firebaseReady` are live bindings: they start
// as null/false and populate once init resolves (typically a
// few milliseconds after boot, and long before any user flow).
//
// `firebaseInitPromise` resolves to true/false — await it when
// you need the instances immediately after importing.
//
// Guards preserved from the previous synchronous version:
//   1. Missing env config → firebaseReady stays false (pure
//      offline/localStorage mode, the app works without cloud).
//   2. Init failure → graceful warn + offline fallback.
// ============================================================

let app = null;
let auth = null;
let db = null;
let storage = null;
let firebaseReady = false;

const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env?.VITE_FIREBASE_APP_ID,
};

// Check if critical config variables are defined
const hasConfig =
  import.meta.env?.VITE_FIREBASE_API_KEY &&
  import.meta.env?.VITE_FIREBASE_PROJECT_ID;

// FIREBASE APP CHECK (abuse prevention) — to enable:
// 1. Enable App Check in Firebase Console > App Check
// 2. Set VITE_APPCHECK_RECAPTCHA_KEY in .env.production
// 3. Set VITE_APPCHECK_DEBUG_TOKEN in .env.local for dev testing
// …then initializeAppCheck(app, { provider: new ReCaptchaEnterpriseProvider(key), isTokenAutoRefreshEnabled: true })
// inside the ready block below.

export const firebaseInitPromise = (async () => {
  if (!hasConfig) {
    if (typeof window !== 'undefined') window.billqyro_firebaseReady = false;
    return false;
  }
  try {
    const [
      { initializeApp, getApps, getApp },
      { getAuth },
      { getFirestore },
      { getStorage },
    ] = await Promise.all([
      import('firebase/app'),
      import('firebase/auth'),
      import('firebase/firestore'),
      import('firebase/storage'),
    ]);

    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    firebaseReady = true;
    if (typeof window !== 'undefined') window.billqyro_firebaseReady = true;
    return true;
  } catch (error) {
    if (typeof window !== 'undefined') window.billqyro_firebaseReady = false;
    console.warn('Firebase initialization failed, falling back to LocalStorage offline mode.', error);
    return false;
  }
})();

export { app, auth, db, storage, firebaseReady };
