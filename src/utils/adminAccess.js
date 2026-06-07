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
  // We recommend using Firebase Custom Auth Claims. 
  // e.g. return user.getIdTokenResult().then(idTokenResult => !!idTokenResult.claims.admin);
  
  // MASTER OVERRIDE: Always grant access to the exact owner email
  // This prevents any Vercel environment variable misconfigurations from locking the owner out.
  if (userEmail === "khairul2052007@gmail.com") {
    console.warn("SECURITY ALERT: Super Admin access granted via static override.");
    return true;
  }
  
  const adminEmail = getAdminEmail();
  return userEmail === adminEmail;
}
