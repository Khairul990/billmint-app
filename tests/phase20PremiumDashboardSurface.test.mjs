import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 
  calculateCanonicalInvoiceFinancials, 
  getInvoiceBalanceDue, 
  getInvoicePaidTotal,
  roundTo2
} from '../src/utils/invoiceMath.js';
import { ALL_THEME_COLORS, getThemeTokens } from '../src/utils/themeUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('======================================================');
console.log('👑 BILLQYRO PHASE 20: PREMIUM THEME-AWARE DASHBOARD SURFACE');
console.log('======================================================\n');

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

const dashboardCode = fs.readFileSync(path.join(rootDir, 'src/pages/Dashboard.jsx'), 'utf8');

// ============================================================================
// 1. DASHBOARD SURFACE & THEME TOKEN INTEGRATION
// ============================================================================

await test('1.1 Dashboard consumes centralized theme surface & card tokens', () => {
  assert.ok(dashboardCode.includes('bg-theme-surface'), 'Dashboard must consume bg-theme-surface');
  assert.ok(dashboardCode.includes('dark:bg-theme-card'), 'Dashboard must consume dark:bg-theme-card');
  assert.ok(dashboardCode.includes('border-theme-border-soft'), 'Dashboard must consume border-theme-border-soft');
  assert.ok(dashboardCode.includes('text-theme-primary'), 'Dashboard must consume text-theme-primary');
  assert.ok(dashboardCode.includes('text-theme-muted'), 'Dashboard must consume text-theme-muted');
  assert.ok(dashboardCode.includes('text-theme-accent'), 'Dashboard must consume text-theme-accent');
});

await test('1.2 Dashboard incorporates soft atmospheric tint tokens without heavy saturation', () => {
  assert.ok(dashboardCode.includes('bg-theme-tint-bg') || dashboardCode.includes('bg-theme-tint-surface'), 'Dashboard must consume soft atmospheric tint tokens');
  assert.ok(dashboardCode.includes('hover:bg-theme-tint-hover') || dashboardCode.includes('hover:bg-theme-surface'), 'Dashboard must use soft theme hover states');
});

await test('1.3 Tooltip and Chart elements consume theme variables with backdrop blur', () => {
  assert.ok(dashboardCode.includes('PremiumChartTooltip'), 'Must include custom premium chart tooltip');
  assert.ok(dashboardCode.includes('backdrop-blur-md'), 'Tooltip must use refined backdrop blur');
  assert.ok(dashboardCode.includes('var(--accent'), 'Chart gradient/strokes must bind to dynamic css accent variable');
});

// ============================================================================
// 2. FINANCIAL SEMANTICS PRESERVATION (INVIOLABLE RULES)
// ============================================================================

await test('2.1 Financial Semantic Colors remain strictly preserved', () => {
  // Success / Money In = Emerald
  assert.ok(dashboardCode.includes('text-emerald-600') || dashboardCode.includes('bg-emerald-500'), 'Collections must remain Emerald Green');
  // Danger / Expenses = Rose
  assert.ok(dashboardCode.includes('text-rose-600') || dashboardCode.includes('text-rose-500'), 'Expenses/Overdue must remain Rose Red');
  // Warning / Due = Amber
  assert.ok(dashboardCode.includes('text-amber-600') || dashboardCode.includes('text-amber-500'), 'Dues must remain Amber');
  // Digital / Info = Indigo
  assert.ok(dashboardCode.includes('text-indigo-600') || dashboardCode.includes('bg-indigo-500'), 'Digital/Liquid funds must remain Indigo');
});

await test('2.2 Business Money vs Personal Money vs Dream Savings remain strictly isolated', () => {
  assert.ok(dashboardCode.includes('BUSINESS MONEY'), 'Must have distinct Business Money section');
  assert.ok(dashboardCode.includes('MONEY LOCATIONS & SALARY'), 'Must have distinct Liquid/Personal Funds section');
  assert.ok(dashboardCode.includes('MY DREAM SAVINGS'), 'Must have distinct Dream Savings section');
  assert.ok(dashboardCode.includes('Clean Business & Personal Separation'), 'Must maintain executive separation banner');
});

// ============================================================================
// 3. THEME SYSTEM TOKENS VALIDATION ACROSS ALL PRESETS
// ============================================================================

await test('3.1 Every preset defines complete luxury companion, tint, and surface tokens', () => {
  Object.keys(ALL_THEME_COLORS).forEach(presetId => {
    const tokens = getThemeTokens(presetId);
    assert.ok(tokens.luxuryCompanion, `Preset ${presetId} must define luxuryCompanion`);
    assert.ok(tokens.luxuryAccent, `Preset ${presetId} must define luxuryAccent`);
    assert.ok(tokens.tintBg, `Preset ${presetId} must define tintBg`);
    assert.ok(tokens.tintSurface, `Preset ${presetId} must define tintSurface`);
    assert.ok(tokens.tintBorder, `Preset ${presetId} must define tintBorder`);
    assert.ok(tokens.tintHover, `Preset ${presetId} must define tintHover`);
  });
});

// ============================================================================
// 4. FINANCIAL INVARIANT INTEGRITY UNDER THEME LAYER
// ============================================================================

await test('4.1 Canonical multi-payment invoice lifecycle math remains 100% exact', () => {
  const inv = {
    grandTotal: 15000,
    paidAmount: 9000,
    previousDue: 3000,
    paymentHistory: [
      { id: 'p1', amount: 3000, date: '2026-09-01', method: 'UPI' },
      { id: 'p2', amount: 6000, date: '2026-09-01', method: 'Cash' }
    ]
  };

  const canonical = calculateCanonicalInvoiceFinancials(inv);
  assert.strictEqual(canonical.grandTotal, 15000);
  assert.strictEqual(canonical.previousDue, 3000);
  assert.strictEqual(canonical.allocatedToOldDue, 3000);
  assert.strictEqual(canonical.allocatedToCurrentInvoice, 6000);
  assert.strictEqual(canonical.amountPaid, 9000);
  assert.strictEqual(canonical.balanceDue, 9000);
  assert.strictEqual(canonical.customerTotalDue, 9000);
  assert.strictEqual(canonical.paymentStatus, 'Partially Paid');
});

console.log('\n======================================================');
console.log(`👑 PHASE 20 AUDIT COMPLETE: ${passedTests} / 7 TESTS PASSED (100%)`);
console.log('======================================================\n');
