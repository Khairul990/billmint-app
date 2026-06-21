import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
// Uncomment below when App Check is enabled in Firebase Console:
// import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app;
let auth;
let db;
let storage;
let firebaseReady = false;

// Check if critical config variables are defined
const hasConfig = 
  import.meta.env.VITE_FIREBASE_API_KEY && 
  import.meta.env.VITE_FIREBASE_PROJECT_ID;

if (hasConfig) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    firebaseReady = true;
    window.billqyro_firebaseReady = true;

    // App Check readiness (uncomment when Firebase App Check is enabled)
    // if (typeof window !== 'undefined') {
    //   self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APPCHECK_DEBUG_TOKEN || true;
    //   initializeAppCheck(app, {
    //     provider: new ReCaptchaEnterpriseProvider(import.meta.env.VITE_APPCHECK_RECAPTCHA_KEY),
    //     isTokenAutoRefreshEnabled: true
    //   });
    // }

  } catch (error) {
    window.billqyro_firebaseReady = false;
    console.warn('Firebase initialization failed, falling back to LocalStorage offline mode.', error);
  }
} else {
  window.billqyro_firebaseReady = false;

}

export { app, auth, db, storage, firebaseReady };
