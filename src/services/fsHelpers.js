// ============================================================
// FIRESTORE HELPERS — single lazy loader for the Firestore SDK.
//
// WHY: a dozen services statically import firestore functions,
// which dragged the whole ~690KB firebase SDK onto the blocking
// boot path. Here the SDK loads via dynamic import() — module
// evaluation is never blocked — and every function is exposed as
// a live binding that populates within milliseconds of startup.
//
// SAFETY: every cloud call in the consuming engines is already
// guarded by `if (!firebaseReady || !db …)` or wrapped in
// try/catch with a localStorage/offline-first fallback, so a
// call that races the loader simply takes the existing
// offline path instead of crashing.
// ============================================================

let doc, setDoc, deleteDoc, getDoc, getDocs, collection, query, where,
    orderBy, limit, onSnapshot, getDocFromServer, getDocsFromServer,
    getCountFromServer, runTransaction, updateDoc, addDoc, serverTimestamp;

// Kicked off at module evaluation; the promise resolves with the SDK
// module (or null when it cannot load, e.g. fully offline first boot).
export const fsReady = import('firebase/firestore').then((fs) => {
  (
    {
      doc, setDoc, deleteDoc, getDoc, getDocs, collection, query, where,
      orderBy, limit, onSnapshot, getDocFromServer, getDocsFromServer,
      getCountFromServer, runTransaction, updateDoc, addDoc, serverTimestamp
    } = fs
  );
  return fs;
}).catch((e) => {
  console.warn('[fsHelpers] Firestore SDK unavailable — offline-first mode:', e);
  return null;
});

export {
  doc, setDoc, deleteDoc, getDoc, getDocs, collection, query, where,
  orderBy, limit, onSnapshot, getDocFromServer, getDocsFromServer,
  getCountFromServer, runTransaction, updateDoc, addDoc, serverTimestamp
};
