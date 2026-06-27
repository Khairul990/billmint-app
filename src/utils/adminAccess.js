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
  
  return null;
}

export function isAdminUser(user) {
  const userEmail = getUserEmail(user);
  
  if (!userEmail) return false;

  const adminEmail = getAdminEmail();
  
  if (import.meta.env.DEV) return true;
  if (!adminEmail) return false;
  
  return userEmail === adminEmail;
}
