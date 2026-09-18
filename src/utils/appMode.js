/**
 * App-shell detection (Phase 26/27): is this running inside the Android APK
 * (Trusted Web Activity) or as an installed PWA?
 *
 * In app-shell mode the marketing landing is NEVER shown — the product
 * opens like a native app, straight into its own entry screen (login /
 * signup / demo) and then the dashboard.
 *
 * How app mode is detected:
 *  - STRONG (a real install, every launch): document.referrer starting
 *    with android-app:// (Chrome sets this when the APK opens the web app)
 *    or display-mode: standalone / navigator.standalone (installed PWA).
 *  - APP LINK (?source=app / ?source=pwa, baked into the APK startUrl):
 *    applies to the CURRENT TAB SESSION only (sessionStorage). The APK's
 *    cold start always carries the param, and full-page navigations inside
 *    the same tab (e.g. the demo journey's location.href = '/') keep the
 *    session flag — so the app experience is continuous. But a visitor
 *    who merely opens such a link once in a normal browser (phone or
 *    desktop) gets the website back as soon as they open a fresh tab —
 *    the marketing landing and APK download always stay reachable.
 *
 * Migration: older builds persisted 'billqyro_app_shell' in localStorage,
 * which permanently hijacked browsers that had once opened an app link.
 * Any such stale flag is deleted on sight (no strong signal present).
 */
const KEY = 'billqyro_app_shell';
const SESSION_KEY = 'billqyro_app_shell_session';

const evaluate = () => {
  try {
    const strongSignal =
      /^android-app:\/\//i.test(document.referrer || '') ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (strongSignal) return true;

    // Clean up stale flags from older builds (link visits used to persist).
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }

    const q = new URLSearchParams(window.location.search);
    const fromParam = q.get('source') === 'app' || q.get('source') === 'pwa';
    if (fromParam) {
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
      return true;
    }
    try { return sessionStorage.getItem(SESSION_KEY) === '1'; } catch { return false; }
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
