// ============================================================
// LANDING AD ENGINE — admin-controlled promotional banner.
//
// The active ad lives in Firestore adminSettings/global.landingAd
// (edited from the Owner Console → Advertising). Consumers get an
// instant cached copy (localStorage) and a fresh fetch in the
// background, so the landing page never waits on the network.
//
// When no admin ad is configured, the built-in BillQyro self-promo
// runs in the slot — the slot is never empty.
// ============================================================
import { getGlobalAdminSettings, updateGlobalAdminSettings } from './dbEngine';
import { firebaseInitPromise } from './firebaseConfig';

const CACHE_KEY = 'billqyro_landing_ad';
const CACHE_TTL = 30 * 60 * 1000; // 30 min

export const DEFAULT_LANDING_AD = {
  enabled: true,
  badge: 'BillQyro Pro',
  title: 'Premium invoicing that feels effortless',
  subtitle: 'Smart billing, UPI QR payments, due-ledger reminders & live reports — free to start, upgrade when you grow.',
  cta: 'Start Free',
  link: '#login', // internal anchor scrolls; external URLs open in a new tab
  image: '/ads/billqyro-promo.jpg'
};

const readCache = () => {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE_KEY));
    if (c && c.ad && Date.now() - c.fetchedAt < CACHE_TTL) return c.ad;
  } catch { /* ignore */ }
  return null;
};

const writeCache = (ad) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ad, fetchedAt: Date.now() })); } catch { /* ignore */ }
};

// Resolves the effective ad: cache → Firestore (admin override) → default.
export const getLandingAd = async () => {
  const cached = readCache();
  if (cached) return cached;
  try {
    await firebaseInitPromise;
    const global = await getGlobalAdminSettings();
    const ad = global?.landingAd ? { ...DEFAULT_LANDING_AD, ...global.landingAd } : DEFAULT_LANDING_AD;
    writeCache(ad);
    return ad;
  } catch (e) {
    console.warn('[adEngine] falling back to default ad:', e);
    return DEFAULT_LANDING_AD;
  }
};

// Owner Console save — persists to Firestore and refreshes the cache.
export const saveLandingAd = async (ad) => {
  const clean = {
    enabled: ad?.enabled !== false,
    badge: String(ad?.badge || '').slice(0, 40),
    title: String(ad?.title || '').slice(0, 120),
    subtitle: String(ad?.subtitle || '').slice(0, 220),
    cta: String(ad?.cta || '').slice(0, 40),
    link: String(ad?.link || '#login').slice(0, 500),
    image: String(ad?.image || '').slice(0, 500)
  };
  const ok = await updateGlobalAdminSettings({ landingAd: clean });
  if (ok) writeCache(clean);
  return ok;
};
