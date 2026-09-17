/**
 * BillQyro Premium / Subscription Chain — regression suite.
 * Run: node tests/premiumChain.test.mjs   (also picked up by `node --test tests/`)
 *
 * Bundles the REAL service modules (subscriptionEngine, adminEngine,
 * platformRevenueService) with esbuild, stubbing react-hot-toast (its goober
 * engine needs a live DOM). Firebase stays uninitialized in Node, so the
 * suite exercises the offline/sandbox paths plus the plan invariants —
 * exactly the logic UpgradeCenter and PaymentProofCenter rely on.
 */
import assert from 'node:assert';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const TMP = '/tmp/bq-premium-test';
fs.mkdirSync(TMP, { recursive: true });

console.log('\n======================================================');
console.log('👑 RUNNING PREMIUM / SUBSCRIPTION CHAIN REGRESSION');
console.log('======================================================\n');

let passedTests = 0;
let failedTests = 0;
function it(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}
async function itAsync(name, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

// ── Browser shims (before importing the bundle) ────────────────────────────
const store = new Map();
global.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};
const fakeEl = () => ({
  getContext: () => null, style: {}, setAttribute: () => {}, appendChild: () => {},
  removeChild: () => {}, remove: () => {}, addEventListener: () => {}, childNodes: [],
  classList: { add: () => {}, remove: () => {} }
});
global.document = {
  createElement: fakeEl,
  documentElement: { classList: { add: () => {}, remove: () => {}, contains: () => false }, setAttribute: () => {}, style: { setProperty: () => {}, removeProperty: () => {} } },
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  head: fakeEl(), body: fakeEl(), addEventListener: () => {}, removeEventListener: () => {}
};
global.window = {
  dispatchEvent: () => true, addEventListener: () => {}, removeEventListener: () => {},
  location: { href: 'http://localhost/', pathname: '/' }
};
global.navigator = { userAgent: 'node-test', onLine: true };

// ── Bundle the real services with esbuild ─────────────────────────────────
const stub = path.join(TMP, 'rhtStub.mjs');
fs.writeFileSync(stub, `export const toast = Object.assign(() => {}, { success: () => {}, error: () => {}, loading: () => {}, dismiss: () => {} });\nexport const Toaster = () => null;\nexport default { toast };\n`);

const entry = path.join(TMP, 'entry.mjs');
fs.writeFileSync(entry, `
export { subscriptionEngine } from '${REPO}/src/services/subscriptionEngine.js';
export { adminEngine } from '${REPO}/src/services/adminEngine.js';
export { getGlobalRevenueSettings } from '${REPO}/src/services/platformRevenueService.js';
`);

const out = path.join(TMP, 'bundle.cjs');
const esbuildBin = path.join(REPO, 'node_modules', '.bin', 'esbuild');
execFileSync(esbuildBin, [
  entry, '--bundle', '--platform=node', '--format=cjs',
  `--alias:react-hot-toast=${stub}`,
  `--outfile=${out}`
], { stdio: 'pipe' });

const _mod = await import(out);
const { subscriptionEngine, adminEngine, getGlobalRevenueSettings } = _mod.default || _mod;

// ── 1. Plan catalog invariants ─────────────────────────────────────────────
it('1.1: Plan catalog exposes free, pro and enterprise', () => {
  const plans = subscriptionEngine.getAvailablePlans();
  const ids = plans.map(p => String(p.id).toLowerCase());
  assert.ok(ids.includes('free'), 'free plan missing');
  assert.ok(ids.includes('pro'), 'pro plan missing');
  assert.ok(ids.includes('enterprise'), 'enterprise plan missing');
});

it('1.2: FREE limits = 10 invoices / 5 customers / 10 products / 1 user', () => {
  const d = subscriptionEngine.getSubscriptionDetailsSync({});
  assert.strictEqual(String(d.planId).toLowerCase(), 'free');
  assert.strictEqual(d.limits.invoices, 10);
  assert.strictEqual(d.limits.customers, 5);
  assert.strictEqual(d.limits.products, 10);
  assert.strictEqual(d.limits.users, 1);
});

it('1.3: Pro limits = 500 invoices / 200 customers / 500 products / 3 users', () => {
  const plans = subscriptionEngine.getAvailablePlans();
  const pro = plans.find(p => String(p.id).toLowerCase() === 'pro');
  assert.ok(pro, 'pro plan missing');
  assert.strictEqual(pro.limits.invoices, 500);
  assert.strictEqual(pro.limits.customers, 200);
  assert.strictEqual(pro.limits.products, 500);
  assert.strictEqual(pro.limits.users, 3);
});

// ── 2. Sandbox premium request flow (the exact UpgradeCenter path) ─────────
await itAsync('2.1: submitPremiumRequest stores a Pending request with full payload', async () => {
  global.localStorage.removeItem('billqyro_sandbox_premium_requests');
  global.localStorage.setItem('billqyro_demo_session_active', 'true');
  const r = await subscriptionEngine.submitPremiumRequest('Monthly', 499, 'UPI', 'UTR-TEST-001', '');
  assert.strictEqual(r.status, 'Pending');
  assert.strictEqual(r.plan, 'Monthly');
  assert.strictEqual(r.paidAmount, 499);
  assert.strictEqual(r.paymentMethod, 'UPI');
  assert.strictEqual(r.transactionId, 'UTR-TEST-001');
  assert.ok(r.requestId && r.createdAt > 0, 'missing request id/timestamp');
  const saved = JSON.parse(global.localStorage.getItem('billqyro_sandbox_premium_requests'));
  assert.strictEqual(saved.length, 1);
  assert.strictEqual(saved[0].status, 'Pending');
});

await itAsync('2.2: Duplicate pending request is blocked (no double-submission)', async () => {
  let blocked = false;
  try {
    await subscriptionEngine.submitPremiumRequest('Yearly', 4999, 'UPI', 'UTR-TEST-002', '');
  } catch (e) {
    blocked = /pending/i.test(e.message);
  }
  assert.ok(blocked, 'duplicate submission should throw a pending-request error');
});

await itAsync('2.3: After the pending request is resolved, a new request can be submitted', async () => {
  const saved = JSON.parse(global.localStorage.getItem('billqyro_sandbox_premium_requests'));
  saved[0].status = 'Approved';
  global.localStorage.setItem('billqyro_sandbox_premium_requests', JSON.stringify(saved));
  const r = await subscriptionEngine.submitPremiumRequest('Lifetime', 14999, 'UPI', 'UTR-TEST-003', '');
  assert.strictEqual(r.status, 'Pending');
  assert.strictEqual(r.plan, 'Lifetime');
});

// ── 3. Admin side (offline-safe behaviour) ──────────────────────────────────
await itAsync('3.1: adminEngine.getPremiumRequests degrades gracefully offline (empty list, no crash)', async () => {
  const list = await adminEngine.getPremiumRequests();
  assert.ok(Array.isArray(list), 'should always resolve to an array');
});

await itAsync('3.2: adminEngine.updatePremiumRequestStatus never partially applies offline', async () => {
  // Without Firebase the call must return false (or throw) — but crucially it
  // must NOT write a local "approved" state that the app would then trust.
  const before = global.localStorage.getItem('billqyro_sandbox_premium_requests');
  let result = 'no-throw';
  try {
    const ok = await adminEngine.updatePremiumRequestStatus('req-fake', 'Approved', 'user-fake', 'pro', 'test');
    result = ok === false ? 'returned-false' : 'returned-true';
  } catch {
    result = 'threw';
  }
  const after = global.localStorage.getItem('billqyro_sandbox_premium_requests');
  assert.ok(result !== 'returned-true', 'offline approval must not report success');
  assert.strictEqual(after, before, 'offline approval must not mutate sandbox state');
});

// ── 4. Pricing source of truth (UpgradeCenter reads these) ─────────────────
await itAsync('4.1: Global revenue settings expose the four plan prices + UPI id', async () => {
  const gs = await getGlobalRevenueSettings();
  for (const key of ['priceMonthly', 'priceQuarterly', 'priceYearly', 'priceLifetime', 'upiId', 'freeBillLimit']) {
    assert.ok(key in gs, `missing pricing key: ${key}`);
  }
});

await itAsync('4.2: Default pricing matches the shipped plan (499 / 1299 / 4999 / 14999)', async () => {
  const gs = await getGlobalRevenueSettings();
  assert.strictEqual(gs.priceMonthly, 499);
  assert.strictEqual(gs.priceQuarterly, 1299);
  assert.strictEqual(gs.priceYearly, 4999);
  assert.strictEqual(gs.priceLifetime, 14999);
});

console.log(`\n  ${passedTests} passed, ${failedTests} failed\n`);
if (failedTests > 0) process.exit(1);
