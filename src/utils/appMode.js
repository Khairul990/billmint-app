/**
 * App-shell detection (Phase 26): is this running inside the Android APK
 * (Trusted Web Activity) or as an installed PWA?
 *
 * In app-shell mode the marketing landing is NEVER shown — the product
 * opens like a native app, straight into its own entry screen (login /
 * signup / demo) and then the dashboard. No hero, no feature sections,
 * no website chrome.
 *
 * Signals (any one of them switches app-mode on and persists it):
 *  - ?source=app or ?source=pwa in the launch URL (baked into the APK
 *    startUrl / shortcuts since v1.0.3)
 *  - document.referrer starting with android-app:// (the canonical TWA
 *    signal — set by Chrome when the APK opens the web app)
 *  - display-mode: standalone / navigator.standalone (installed PWA)
 *
 * Persisted because TWA navigations can drop the query string.
 */
const KEY = 'billqyro_app_shell';

const evaluate = () => {
  try {
    const q = new URLSearchParams(window.location.search);
    const fromParam = q.get('source') === 'app' || q.get('source') === 'pwa';
    const fromReferrer = /^android-app:\/\//i.test(document.referrer || '');
    const fromDisplay =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (fromParam || fromReferrer || fromDisplay) {
      try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
      return true;
    }
    return (() => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } })();
  } catch {
    return false;
  }
};

let cached = null;

/** True when running inside the APK / installed PWA app shell. */
export const isAppMode = () => {
  if (cached === null) cached = evaluate();
  return cached;
};

/** Tests only — forget the cached answer. */
export const __resetAppModeCache = () => { cached = null; };
