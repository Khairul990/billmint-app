// ============================================================
// FIREBASE AUTH HELPERS — lazy loader (see fsHelpers.js for the
// full rationale). Auth actions only ever run on user interaction
// (login / signup / logout), long after the SDK has settled.
// ============================================================

let signInWithEmailAndPassword, createUserWithEmailAndPassword,
    GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, signOut;

export const fbAuthReady = import('firebase/auth').then((fa) => {
  (
    {
      signInWithEmailAndPassword, createUserWithEmailAndPassword,
      GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, signOut
    } = fa
  );
  return fa;
}).catch((e) => {
  console.warn('[fbAuthHelpers] Firebase Auth SDK unavailable:', e);
  return null;
});

export {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, signOut
};
