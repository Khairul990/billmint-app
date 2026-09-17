/**
 * First-7-days onboarding check-ins (Phase 25).
 *
 * A brand-new user gets one contextual tip per milestone day — gentle,
 * dismissable, and tied to what they have (or haven't) done yet:
 *   Day 0 — welcome + create the first invoice
 *   Day 2 — payment recording / product catalog nudges
 *   Day 6 — reports, live links and the first backup
 * After day 6 the user graduates; nothing is ever shown again.
 */

const START_KEY = 'billqyro_onboarding_started_at';
const SHOWN_KEY = 'billqyro_onboarding_shown';
const DAY_MS = 86400000;

const readShown = () => {
  try { return JSON.parse(localStorage.getItem(SHOWN_KEY) || '[]'); } catch { return []; }
};

export const ensureOnboardingStarted = () => {
  try {
    if (!localStorage.getItem(START_KEY)) {
      localStorage.setItem(START_KEY, String(Date.now()));
    }
    return parseInt(localStorage.getItem(START_KEY), 10);
  } catch { return Date.now(); }
};

/**
 * Returns today's onboarding tip (or null when not due / already shown /
 * graduated). `ctx` mirrors the live workspace counts so tips stay relevant.
 */
export const getOnboardingTip = ({ invoices = [], customers = [], products = [] } = {}) => {
  const startedAt = ensureOnboardingStarted();
  const day = Math.floor((Date.now() - startedAt) / DAY_MS);
  // Graduated — the first week is over, never nag again.
  if (day > 6) return null;

  // Milestone days and their tips (checked in order).
  const plan = [
    {
      day: 0, id: 'ob-day0-welcome',
      title: 'BillQyro-তে স্বাগতম! 👋',
      body: 'প্রথম ইনভয়েসটা বানিয়ে ফেলুন — ২ মিনিটেই হয়ে যাবে, আর ডেমো-ডেটা দেখেও শিখতে পারবেন।',
      action: { label: 'ইনভয়েস বানান', tab: 'create-invoice' },
      skipIf: () => invoices.length > 0
    },
    {
      day: 1, id: 'ob-day1-customers',
      title: 'কাস্টমার-লিস্ট সাজান',
      body: 'নিয়মিত ক্রেতাদের যোগ করে রাখলে বাকির হিসাব আর লেজার নিজে থেকেই ম্যানেজ হবে।',
      action: { label: 'কাস্টমার যোগ করুন', tab: 'customers' },
      skipIf: () => customers.length >= 5
    },
    {
      day: 3, id: 'ob-day3-payments',
      title: 'পেমেন্ট রেকর্ড করা শুরু করুন',
      body: 'টাকা পেলে ইনভয়েসে "Record Payment" চাপুন — ব্যালান্স, লেজার আর ড্যাশবোর্ড একসাথে আপডেট হয়ে যাবে।',
      action: { label: 'Due দেখুন', tab: 'due' },
      skipIf: () => invoices.some((i) => (parseFloat(i.amountPaid) || 0) > 0)
    },
    {
      day: 5, id: 'ob-day5-products',
      title: 'প্রোডাক্ট ক্যাটালগ বানান',
      body: 'পণ্য একবার যোগ করলে পরের বিলে দাম-স্টক অটো চলে আসবে — বিলিং আরও দ্রুত হবে।',
      action: { label: 'প্রোডাক্ট যোগ করুন', tab: 'products' },
      skipIf: () => products.length >= 5
    },
    {
      day: 6, id: 'ob-day6-reports-backup',
      title: 'এক সপ্তাহ পূর্ণ! 🎉',
      body: 'রিপোর্টসে লাভ-ক্ষতি দেখুন, আর প্রথম ব্যাকআপটা নামিয়ে রাখুন — ডেটা চিরকাল সুরক্ষিত থাকবে।',
      action: { label: 'ব্যাকআপ নিন', tab: 'backup-restore' }
    }
  ];

  const shown = readShown();
  for (const tip of plan) {
    if (day < tip.day) break;
    if (shown.includes(tip.id)) continue;
    if (tip.skipIf && tip.skipIf()) { 
      // already done by themselves — count it as seen silently
      shown.push(tip.id);
      try { localStorage.setItem(SHOWN_KEY, JSON.stringify(shown)); } catch { /* ignore */ }
      continue;
    }
    try { localStorage.setItem(SHOWN_KEY, JSON.stringify([...shown, tip.id])); } catch { /* ignore */ }
    return tip;
  }
  return null;
};

export const onboardingGraduated = () => {
  const startedAt = ensureOnboardingStarted();
  const day = Math.floor((Date.now() - startedAt) / DAY_MS);
  return day > 6;
};
