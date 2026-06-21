const DEFAULT_ADMIN_EMAIL = "khairul2052007@gmail.com";

export function getUserEmail(user) {
  if (!user) return "";
  return (
    user.email ||
    user.userEmail ||
    user.providerData?.[0]?.email ||
    ""
  ).toLowerCase().trim();
}

export function getAdminEmail() {
  return (
    import.meta.env.VITE_ADMIN_EMAIL ||
    import.meta.env.VITE_ADMIN_OWNER_EMAIL ||
    DEFAULT_ADMIN_EMAIL
  ).toLowerCase().trim();
}

export function isAdminUser(user) {
  const userEmail = getUserEmail(user);
  
  if (!userEmail) return false;

  // IMPORTANT SECURITY NOTE: 
  // In a true production environment with untrusted clients, checking the email 
  // string on the client-side is insufficient because it can be spoofed in memory.
  // PRODUCTION RECOMMENDATION: Use Firebase Custom Auth Claims.
  // e.g. return user.getIdTokenResult().then(idTokenResult => !!idTokenResult.claims.admin);
  
  // PRODUCTION MODE CHECK: If VITE_ADMIN_EMAIL is set via env, use it only
  if (import.meta.env.PROD && import.meta.env.VITE_ADMIN_EMAIL) {
    return userEmail === import.meta.env.VITE_ADMIN_EMAIL.toLowerCase().trim();
  }
  
  // DEV MODE: Allow hardcoded email for development convenience
  // MASTER OVERRIDE: Always grant access to the exact owner email
  // This prevents any Vercel environment variable misconfigurations from locking the owner out.
  if (!import.meta.env.PROD && userEmail === "khairul2052007@gmail.com") {
    return true;
  }
  
  const adminEmail = getAdminEmail();
  return userEmail === adminEmail;
}
