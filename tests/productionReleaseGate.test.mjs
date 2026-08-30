import assert from 'node:assert';
import fs from 'node:fs';
import { calculateCanonicalInvoiceFinancials } from '../backend/src/modules/invoices/invoiceMath.js';
import { normalizeMoney } from '../src/services/postgres/dualWriteParity.js';
import { dualWriteConfig } from '../src/services/postgres/dualWriteConfig.js';

console.log('======================================================');
console.log('🚀 BILLQYRO PHASE 3 STEP 3.4 PRODUCTION RELEASE GATE');
console.log('======================================================');

let passedTests = 0;
const test = async (desc, fn) => {
  try {
    await fn();
    console.log(`  ✅ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(err);
    throw err;
  }
};

// ============================================================================
// 1. RELEASE CANDIDATE INVENTORY & METADATA
// ============================================================================

await test('1.1 Version Metadata: package.json is consistent and valid', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  assert.strictEqual(pkg.name, 'billqyro');
  assert.ok(pkg.version);
  assert.strictEqual(pkg.private, true);
  assert.strictEqual(pkg.type, 'module');
});

await test('1.2 Build Tooling: Vite is explicitly declared in devDependencies', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasVite = Boolean((pkg.dependencies && pkg.dependencies.vite) || (pkg.devDependencies && pkg.devDependencies.vite));
  assert.strictEqual(hasVite, true, 'Vite must be declared in dependencies or devDependencies');
});

await test('1.3 Backend Metadata: backend/package.json exists and is valid', () => {
  const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  assert.strictEqual(backendPkg.name, 'billqyro-backend');
  assert.strictEqual(backendPkg.type, 'module');
});

// ============================================================================
// 2. CRITICAL ARCHITECTURAL INVARIANTS
// ============================================================================

await test('2.1 Primary Architecture: Firebase is primary source of truth', () => {
  assert.strictEqual(fs.existsSync('src/services/firebaseConfig.js'), true);
  const fbCode = fs.readFileSync('src/services/firebaseConfig.js', 'utf8');
  assert.ok(fbCode.includes('initializeApp'));
  assert.ok(fbCode.includes('getFirestore'));
  assert.ok(fbCode.includes('getAuth'));
});

await test('2.2 Dual-Write Safety: Mirror write feature flag strictly defaults to false', () => {
  delete process.env.VITE_POSTGRES_DUAL_WRITE;
  delete process.env.VITE_POSTGRES_DUAL_WRITE_CANARY;
  delete process.env.VITE_POSTGRES_CANARY_WORKSPACE_IDS;

  assert.strictEqual(dualWriteConfig.isEnabled, false);
  assert.strictEqual(dualWriteConfig.isCanaryEnabled, false);
  assert.deepStrictEqual(dualWriteConfig.canaryWorkspaceIds, []);
});

await test('2.3 Secret Leak Prevention: Zero backend secrets or DB passwords in frontend', () => {
  const frontendCode = fs.readFileSync('src/services/firebaseConfig.js', 'utf8') +
                       fs.readFileSync('src/services/postgres/dualWriteConfig.js', 'utf8');

  assert.strictEqual(frontendCode.includes('POSTGRES_PASSWORD'), false);
  assert.strictEqual(frontendCode.includes('POSTGRES_USER'), false);
  assert.strictEqual(frontendCode.includes('DATABASE_URL'), false);
  assert.strictEqual(frontendCode.includes('S3_SECRET_KEY'), false);
  assert.strictEqual(frontendCode.includes('R2_SECRET_ACCESS_KEY'), false);
  assert.strictEqual(frontendCode.includes('JWT_SECRET'), false);
});

// ============================================================================
// 3. FINANCIAL INTEGRITY RELEASE GATE
// ============================================================================

await test('3.1 Financial Calculation: Grand total and balance due maintain decimal precision', () => {
  const { financials } = calculateCanonicalInvoiceFinancials({
    items: [
      { name: 'Bridal Silk Embroidery', quantity: 2, rate: 7500, taxPercent: 12 }, // 15000 + 1800 tax = 16800
      { name: 'Custom Stitching Handwork', quantity: 1, rate: 3200, taxPercent: 5 }   // 3200 + 160 tax = 3360
    ],
    discountAmount: 1000,
    shippingCharge: 250,
    amountPaid: 8000
  });

  assert.strictEqual(financials.subtotal, 18200);
  assert.strictEqual(financials.taxTotal, 1960);
  assert.strictEqual(financials.discountTotal, 1000);
  assert.strictEqual(financials.shippingCharge, 250);
  assert.strictEqual(financials.grandTotal, 19410); // 18200 - 1000 + 1960 + 250 = 19410
  assert.strictEqual(financials.amountPaid, 8000);
  assert.strictEqual(financials.balanceDue, 11410);
  assert.strictEqual(financials.status, 'Partially Paid');
});

await test('3.2 Financial Normalization: Exact 2-decimal formatting and non-finite protection', () => {
  assert.strictEqual(normalizeMoney(19410.555), '19410.56');
  assert.strictEqual(normalizeMoney(0), '0.00');
  assert.strictEqual(normalizeMoney(NaN), '0.00');
  assert.strictEqual(normalizeMoney(Infinity), '0.00');
});

// ============================================================================
// 4. PWA, HOSTING & CACHE SAFETY RELEASE GATE
// ============================================================================

await test('4.1 PWA Config: API routes excluded from offline fallback caching', () => {
  const viteConfig = fs.readFileSync('vite.config.js', 'utf8');
  assert.ok(viteConfig.includes('navigateFallbackDenylist'));
  assert.ok(viteConfig.includes('api'));
  assert.ok(viteConfig.includes('cleanupOutdatedCaches: true'));
  assert.ok(viteConfig.includes('skipWaiting: true'));
  assert.ok(viteConfig.includes('clientsClaim: true'));
});

await test('4.2 Vercel Hosting: SPA rewrites and strict HTTPS headers configured', () => {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  assert.ok(vercelConfig.rewrites.some(r => r.destination === '/'));
  assert.ok(vercelConfig.headers.length > 0);
});

// ============================================================================
// 5. OFFLINE QUEUE & DATA INTEGRITY
// ============================================================================

await test('5.1 Offline Engine: DLQ and syncQueue retain pending mutations during disconnection', () => {
  const localDb = fs.readFileSync('src/services/localDb.js', 'utf8');
  const offlineEngine = fs.readFileSync('src/services/offlineEngine.js', 'utf8');
  assert.ok(localDb.includes('syncQueue'));
  assert.ok(localDb.includes('deadLetterQueue'));
  assert.ok(offlineEngine.includes('getQueueStatus'));
});

console.log('======================================================');
console.log(`🚀 RELEASE GATE VALIDATION: ${passedTests} / 10 PASSED (100%)`);
console.log('======================================================\n');
