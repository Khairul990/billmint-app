import { getAuth } from 'firebase/auth';

/**
 * Reads the Firebase Custom Auth Claims from the user's ID token.
 * Checks if request.auth.token.role === "superadmin" or superAdmin === true.
 * 
 * @param {Object} [user] - Optional Firebase user or session object
 * @returns {Promise<boolean>}
 */
export async function getAdminClaim(user) {
  try {
    const auth = getAuth();
    const currentUser = user || auth.currentUser;
    if (!currentUser) return false;

    if (user?.isSuperAdmin === true || user?.role === 'superadmin') return true;

    if (typeof currentUser.getIdTokenResult === 'function') {
      const tokenResult = await currentUser.getIdTokenResult(true);
      return tokenResult.claims?.role === 'superadmin' || tokenResult.claims?.superAdmin === true;
    }

    return false;
  } catch (err) {
    console.error('[adminAccess] Error verifying custom auth claim:', err);
    return false;
  }
}

/**
 * Synchronous check for superadmin privileges on a user or session object.
 * @param {Object} user - User or session object
 * @returns {boolean}
 */
export function isAdminUser(user) {
  if (!user) return false;
  if (user.isSuperAdmin === true || user.role === 'superadmin') return true;
  if (user.customClaims?.role === 'superadmin' || user.claims?.role === 'superadmin') return true;
  if (import.meta.env.DEV && import.meta.env.VITE_DEV_FORCE_ADMIN === 'true') return true;
  return false;
}

export function getAdminEmail() {
  return (import.meta.env?.VITE_ADMIN_EMAIL || '').toLowerCase().trim();
}

export function getUserEmail(user) {
  if (!user) return "";
  return (
    user.email ||
    user.userEmail ||
    user.providerData?.[0]?.email ||
    ""
  ).toLowerCase().trim();
}

export default {
  getAdminClaim,
  isAdminUser,
  getAdminEmail,
  getUserEmail
};

