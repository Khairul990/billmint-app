/**
 * BillQyro Phase 25 — First-7-Days Onboarding Check-in Tips
 * Run: node tests/onboardingTips.test.mjs
 *
 * Verifies:
 *  1. Day-0 welcome tip fires for a fresh user with empty data
 *  2. Tips already accomplished by the user are skipped silently
 *  3. Day-1 / day-3 / day-5 / day-6 milestone tips fire on schedule
 *  4. Payment tip skips once any invoice has a recorded payment
 *  5. A tip is never repeated (shown-list persists)
 *  6. Graduation after day 6
 *  7. Corrupt localStorage payloads never crash the service
 */

// --- localStorage shim (node has none) ---
function makeStorage(initial = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear(),
  };
}

let passed = 0;
let failures = 0;
function assert(condition, message) {
  if (condition) { passed++; console.log(`  ✅ PASS: ${message}`); }
  else { failures++; console.error(`  ❌ FAIL: ${message}`); }
}

const DAY_MS = 86400000;
const startedAt = (daysAgo) => String(Date.now() - daysAgo * DAY_MS);

// The service reads localStorage at call time; re-import fresh each scenario
// by resetting the module cache and swapping the global shim.
async function loadService(initialStorage) {
  const mod = await import(`../src/services/onboardingTipsService.js?t=${Date.now()}-${Math.random()}`);
  globalThis.localStorage = makeStorage(initialStorage);
  return mod;
}

console.log('\n======================================================');
console.log('🌱 RUNNING BILLQYRO ONBOARDING TIPS TEST SUITE (Phase 25)');
console.log('======================================================\n');

// ----------------------------------------------------
console.log('--- 1. Day-0 welcome tip ---');
{
  const { getOnboardingTip } = await loadService({});
  globalThis.localStorage = makeStorage({ billqyro_onboarding_started_at: startedAt(0) });
  const tip = getOnboardingTip({ invoices: [], customers: [], products: [] });
  assert(tip && tip.id === 'ob-day0-welcome', 'fresh user gets the day-0 welcome tip');
  assert(tip.action && tip.action.tab === 'create-invoice', 'day-0 action navigates to create-invoice');
  const again = getOnboardingTip({ invoices: [], customers: [], products: [] });
  assert(again === null, 'same tip is never repeated within the day');
}

// ----------------------------------------------------
console.log('--- 2. Already-accomplished milestones skip silently ---');
{
  const { getOnboardingTip } = await loadService({});
  globalThis.localStorage = makeStorage({ billqyro_onboarding_started_at: startedAt(0) });
  const tip = getOnboardingTip({ invoices: [{ id: 'i1' }], customers: [], products: [] });
  assert(tip === null, 'user who already invoiced gets no day-0 nudge');
}

// ----------------------------------------------------
console.log('--- 3. Milestone schedule (day 1 / 3 / 5 / 6) ---');
{
  const { getOnboardingTip } = await loadService({});
  globalThis.localStorage = makeStorage({ billqyro_onboarding_started_at: startedAt(1) });
  let tip = getOnboardingTip({ invoices: [{ id: 'i1' }], customers: [], products: [] });
  assert(tip && tip.id === 'ob-day1-customers', 'day-1 user gets the customers tip');

  globalThis.localStorage = makeStorage({ billqyro_onboarding_started_at: startedAt(3) });
  tip = getOnboardingTip({ invoices: [{ id: 'i1', amountPaid: 0 }], customers: [1, 2, 3, 4, 5], products: [] });
  assert(tip && tip.id === 'ob-day3-payments', 'day-3 user with zero payments gets the payments tip');

  tip = getOnboardingTip({ invoices: [{ id: 'i1', amountPaid: 500 }], customers: [1, 2, 3, 4, 5], products: [] });
  assert(tip === null, 'payment recorded → nothing left until day 5 unlocks');

  globalThis.localStorage = makeStorage({ billqyro_onboarding_started_at: startedAt(5) });
  tip = getOnboardingTip({ invoices: [{ id: 'i1', amountPaid: 500 }], customers: [1, 2, 3, 4, 5], products: [] });
  assert(tip && tip.id === 'ob-day5-products', 'day-5 user with few products gets the catalog tip');

  globalThis.localStorage = makeStorage({ billqyro_onboarding_started_at: startedAt(6) });
  tip = getOnboardingTip({ invoices: [{ amountPaid: 500 }], customers: [1, 2, 3, 4, 5], products: [1, 2, 3, 4, 5] });
  assert(tip && tip.id === 'ob-day6-reports-backup', 'day-6 user gets the graduation/backup tip');
  assert(tip.action.tab === 'backup-restore', 'graduation tip points at backup-restore');
}

// ----------------------------------------------------
console.log('--- 4. Graduation ---');
{
  const { getOnboardingTip, onboardingGraduated } = await loadService({});
  globalThis.localStorage = makeStorage({ billqyro_onboarding_started_at: startedAt(8) });
  assert(getOnboardingTip({ invoices: [], customers: [], products: [] }) === null, 'no tips after day 6');
  assert(onboardingGraduated() === true, 'onboardingGraduated() true on day 8');
  globalThis.localStorage = makeStorage({ billqyro_onboarding_started_at: startedAt(2) });
  assert(onboardingGraduated() === false, 'onboardingGraduated() false mid-week');
}

// ----------------------------------------------------
console.log('--- 5. Corrupt storage never crashes ---');
{
  const { getOnboardingTip } = await loadService({});
  globalThis.localStorage = makeStorage({
    billqyro_onboarding_started_at: 'not-a-number',
    billqyro_onboarding_shown: '{broken json',
  });
  let tip = null, crashed = false;
  try { tip = getOnboardingTip({ invoices: [], customers: [], products: [] }); } catch { crashed = true; }
  assert(!crashed, 'corrupt localStorage does not throw');
  assert(tip === null || typeof tip.id === 'string', 'degrades gracefully (null or valid tip)');
}

console.log('\n======================================================');
console.log(`📊 RESULT: ${passed} passed, ${failures} failed`);
console.log('======================================================\n');
process.exit(failures > 0 ? 1 : 0);
