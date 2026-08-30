/**
 * Dual-Write Configuration & Feature Flag
 * Controls safe mirror-writing from Firebase to PostgreSQL backend.
 * Default is strictly FALSE to ensure 100% safety and zero regression.
 */

const getEnvVar = (key, defaultVal = '') => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key] !== undefined) {
    return import.meta.env[key];
  }
  const gProcess = typeof globalThis !== 'undefined' ? globalThis.process : null;
  if (gProcess && gProcess.env && gProcess.env[key] !== undefined) {
    return gProcess.env[key];
  }
  return defaultVal;
};

export const dualWriteConfig = {
  // Feature flag: MUST DEFAULT TO FALSE
  get isEnabled() {
    return getEnvVar('VITE_POSTGRES_DUAL_WRITE', 'false') === 'true';
  },

  // Backend API URL
  get apiBaseUrl() {
    return getEnvVar('VITE_API_BASE_URL', 'http://localhost:3000').replace(/\/$/, '');
  },

  // Request timeout in milliseconds
  timeoutMs: 5000,

  // Logging prefix & sanitizer
  logPrefix: '[BillQyro DualWrite]',

  log(level, message, metadata = {}) {
    // Sanitize metadata to never log sensitive credentials
    const sanitized = { ...metadata };
    delete sanitized.password;
    delete sanitized.token;
    delete sanitized.idToken;
    delete sanitized.secret;
    delete sanitized.privateKey;

    const logFn = console[level] || console.log;
    logFn(`${this.logPrefix} ${message}`, Object.keys(sanitized).length > 0 ? sanitized : '');
  }
};
