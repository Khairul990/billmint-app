/**
 * App-shell detection (Phase 26/27): is this running inside the Android APK
 * (Trusted Web Activity) or as an installed PWA?
 *
 * In app-shell mode the marketing landing is NEVER shown — the product
 * opens like a native app, straight into its own entry screen (login /
 * signup / demo) and then the dashboard.
 *
 * Signals:
 *  - STRONG (a real install): document.referrer starting with
 *    android-app:// (set by Chrome when the APK opens the web app) or
 *    display-mode: standalone / navigator.standalone (installed PWA).
 *    Only strong signals PERSIST the flag — an app install stays app-mode.
 *  - WEAK: ?source=app / ?source=pwa in the URL (baked into the APK
 *    startUrl since v1.0.3). Applies to this page-load only and is never
 *    persisted, so opening such a link once in a desktop browser must not
 *    hijack that browser into app mode forever.
 *
 * Recovery: if the flag somehow got stuck in a desktop-class browser
 * (large screen, no touch, not standalone, no TWA referrer) it is cleared
 * and the visitor gets the website back — the marketing landing with the
 * APK download is always reachable from a normal browser.
 */
const KEY = 'billqyro_app_shell';

const evaluate = () => {
  try {
    const strongSignal =
      /^android-app:\/\//i.test(document.referrer || '') ||
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (strongSignal) {
      try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
      return true;
    }

    // Desktop-class browser (big screen, no touch): a stuck flag here means
    // someone once opened an app-mode link — recover to the website.
    const desktopBrowser =
      window.matchMedia('(min-width: 1024px)').matches && !('ontouchstart' in window);
    let flagged = false;
    try { flagged = localStorage.getItem(KEY) === '1'; } catch { /* ignore */ }
    if (desktopBrowser) {
      if (flagged) { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
      // ?source=app still shows the app view on desktop for that single
      // visit (someone explicitly previewing it), but never persists.
      const q = new URLSearchParams(window.location.search);
      return q.get('source') === 'app' || q.get('source') === 'pwa';
    }

    // Mobile-class device (the APK and phones): the app-link param persists,
    // because full-page navigations inside the app (e.g. the demo journey's
    // location.href = '/') drop the query string — without persistence the
    // app would fall back to the website mid-flow.
    const q = new URLSearchParams(window.location.search);
    const fromParam = q.get('source') === 'app' || q.get('source') === 'pwa';
    if (fromParam) {
      try { localStorage.setItem(KEY, '1'); } catch { /* ignore */ }
      return true;
    }
    return flagged;
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
