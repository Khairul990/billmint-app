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
  const adminEmail = getAdminEmail();
  
  if (!userEmail) return false;
  return userEmail === adminEmail;
}
