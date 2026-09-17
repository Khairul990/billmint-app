// ============================================================
// FIREBASE FUNCTIONS HELPERS — lazy loader (see fsHelpers.js for
// the full rationale). Callables only run on user/admin actions.
// ============================================================

let getFunctions, httpsCallable;

export const fbFunctionsReady = import('firebase/functions').then((ff) => {
  ({ getFunctions, httpsCallable } = ff);
  return ff;
}).catch((e) => {
  console.warn('[fbFunctionsHelpers] Firebase Functions SDK unavailable:', e);
  return null;
});

export { getFunctions, httpsCallable };
