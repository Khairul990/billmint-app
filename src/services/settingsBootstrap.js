// ============================================================
// FAST SETTINGS BOOTSTRAP — synchronous, zero heavy imports.
//
// First render only needs a best-effort snapshot of the saved
// settings. The canonical dbEngine.getSettings() (with schema
// migrations + legacy fixes) is merged in milliseconds later by
// App's mount effect. This module exists so the critical boot
// path does NOT have to pull dbEngine → firebase (~690KB
// uncompressed) before first paint.
//
// KEY SCOPING must mirror dbEngine.getScopedKey():
//   no uid  → 'billqyro_settings'
//   with uid → 'billqyro_settings_{uid}'
// ============================================================

const AUTH_KEY = 'billqyro_auth';        // GLOBAL_KEYS.AUTH (never scoped)
const SETTINGS_BASE = 'billqyro_settings'; // GLOBAL_KEYS.SETTINGS

export const getBootstrapSettings = () => {
  try {
    if (localStorage.getItem('billqyro_demo_session_active') === 'true') {
      const s = JSON.parse(localStorage.getItem('billqyro_demo_settings') || 'null');
      if (s) return s;
      const isVideo = localStorage.getItem('billqyro_demo_video_creator') === 'true';
      return {
        businessName: isVideo ? 'Demo Corp' : 'My Business (Demo)',
        ownerName: isVideo ? 'Demo Owner' : 'Me',
        email: isVideo ? 'hello@democorp.com' : 'demo@example.com',
        phone: isVideo ? '+1 555 0199' : '9999999999',
        themeColor: 'sapphire-noir',
      };
    }

    // Mirror dbEngine.getRealUserId()'s local fallback (firebase user is not
    // available synchronously at first render by design).
    let uid = null;
    try {
      const session = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null');
      uid = session?.uid || null;
    } catch { /* ignore */ }

    const key = uid ? `${SETTINGS_BASE}_${uid}` : SETTINGS_BASE;
    return JSON.parse(localStorage.getItem(key) || 'null') || {};
  } catch (e) {
    console.warn('[Bootstrap] settings snapshot failed:', e);
    return {};
  }
};
