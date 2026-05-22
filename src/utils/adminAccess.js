const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'khairul2052007@gmail.com';

export function isAdminUser(user) {
  if (!user || !user.email) return false;
  return user.email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
}

export function getAdminEmail() {
  return ADMIN_EMAIL;
}
