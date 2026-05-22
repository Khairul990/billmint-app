// src/utils/adminAccess.js

/**
 * Centralized admin email configuration.
 * Uses environment variable VITE_ADMIN_EMAIL if defined, otherwise falls back
 * to the email specified by the user.
 */
export const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || 'khairul2052007@gmail.com';

/**
 * Checks whether a given email belongs to the admin.
 * Comparison is case‑insensitive and trims whitespace.
 *
 * @param {string} email - Email to check.
 * @returns {boolean} True if the email matches the admin email.
 */
export const isAdmin = (email) => {
  if (!email) return false;
  return email.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
};
