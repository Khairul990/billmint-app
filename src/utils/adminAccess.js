import { getAdminClaim, getAdminEmail } from '../services/adminAccess.js';

export function getUserEmail(user) {
  if (!user) return "";
  return (
    user.email ||
    user.userEmail ||
    user.providerData?.[0]?.email ||
    ""
  ).toLowerCase().trim();
}

/**
 * Checks if user object / session has superadmin permissions.
 * DEV mode returns true for local development. Production checks custom claim flags.
 */
export function isAdminUser(user) {
  if (!user) return false;
  if (user.isSuperAdmin === true || user.role === 'superadmin') return true;
  if (user.customClaims?.role === 'superadmin' || user.claims?.role === 'superadmin') return true;

  if (import.meta.env.DEV) return true;

  return false;
}

export { getAdminClaim, getAdminEmail };

