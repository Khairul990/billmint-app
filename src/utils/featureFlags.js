/**
 * Feature Flags Configuration
 * 
 * Centralizes the management of experimental or premium features.
 * Used to safely roll out functionality to users.
 */

// Default configuration (can be fetched/overridden from Firebase Remote Config or Global Settings)
const FLAG_DEFAULTS = {
  ENABLE_PARTIAL_PAYMENTS: true,
  ENABLE_AI_SCREENSHOT_ANALYSIS: true,
  ENABLE_WHATSAPP_SHARE: true,
  ENABLE_EMAIL_SHARE: true,
  ENABLE_AUDIT_LOGS_UI: true,
  ENABLE_EXPENSE_TRACKING: true,
  STRICT_PWA_CACHE_PRIVACY: true
};

let currentFlags = { ...FLAG_DEFAULTS };

/**
 * Initializes flags from an external source if available
 */
export const initializeFeatureFlags = (remoteConfig = {}) => {
  currentFlags = { ...FLAG_DEFAULTS, ...remoteConfig };
};

/**
 * Checks if a specific feature flag is enabled
 */
export const isFeatureEnabled = (flagName) => {
  return !!currentFlags[flagName];
};

/**
 * Returns all current feature flags
 */
export const getAllFeatureFlags = () => {
  return { ...currentFlags };
};
