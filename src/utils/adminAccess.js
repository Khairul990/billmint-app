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
  const envEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const envOwnerEmail = import.meta.env.VITE_ADMIN_OWNER_EMAIL;
  
  if (envEmail && envEmail !== 'undefined') return envEmail.toLowerCase().trim();
  if (envOwnerEmail && envOwnerEmail !== 'undefined') return envOwnerEmail.toLowerCase().trim();
  
  return DEFAULT_ADMIN_EMAIL.toLowerCase().trim();
}

export function isAdminUser(user) {
  const userEmail = getUserEmail(user);
  
  if (!userEmail) return false;

  const adminEmail = getAdminEmail();
  
  // Allow if it matches the resolved admin email, OR the hardcoded default
  // We also always allow localhost/dev environment for testing
  if (import.meta.env.DEV) return true;
  
  return userEmail === adminEmail || userEmail === DEFAULT_ADMIN_EMAIL.toLowerCase().trim();
}
