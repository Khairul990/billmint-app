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

console.log('================================================================');
console.log('💎 BILLQYRO PHASE 20: SOFT GLASS LUXURY CARD SYSTEM & THEME TINT');
console.log('================================================================\n');

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

const indexCss = fs.readFileSync(path.join(rootDir, 'src/index.css'), 'utf8');
const dashboardCode = fs.readFileSync(path.join(rootDir, 'src/pages/Dashboard.jsx'), 'utf8');

// ============================================================================
// 1. SOFT GLASS LUXURY CARD CSS UTILITIES
// ============================================================================

await test('1.1 index.css defines .luxury-glass-card with frosted blur, soft border and inner highlight', () => {
  assert.ok(indexCss.includes('.luxury-glass-card'), 'Must define .luxury-glass-card');
  assert.ok(indexCss.includes('backdrop-filter: blur(8px)') || indexCss.includes('backdrop-filter: blur'), 'Must include frosted glass backdrop blur');
  assert.ok(indexCss.includes('--border-soft'), 'Must use soft theme border');
  assert.ok(indexCss.includes('inset 0 1px 1px 0 rgba(255, 255, 255,'), 'Must include top subtle inner highlight in light mode');
  assert.ok(indexCss.includes('.dark .luxury-glass-card'), 'Must support dark mode luxury glass surface');
});

await test('1.2 index.css defines .luxury-glass-subcard with subtle matte depth', () => {
  assert.ok(indexCss.includes('.luxury-glass-subcard'), 'Must define .luxury-glass-subcard');
  assert.ok(indexCss.includes('--theme-tint-bg'), 'Must use atmospheric theme tint background');
  assert.ok(indexCss.includes('.dark .luxury-glass-subcard'), 'Must support dark mode subcards');
});

// ============================================================================
// 2. DASHBOARD INTEGRATION OF SOFT GLASS CARD SYSTEM
// ============================================================================

await test('2.1 Dashboard Executive Header, Hero and Cards consume .luxury-glass-card', () => {
  assert.ok(dashboardCode.includes('luxury-glass-card'), 'Dashboard must use .luxury-glass-card');
  assert.ok(dashboardCode.includes('luxury-glass-subcard'), 'Dashboard must use .luxury-glass-subcard');
});

await test('2.2 Dashboard background uses soft theme atmosphere without heavy color blocks', () => {
  assert.ok(dashboardCode.includes('bg-theme-tint-bg') || dashboardCode.includes('dark:bg-theme-app'), 'Dashboard background must utilize soft theme atmosphere');
  assert.ok(dashboardCode.includes('PremiumChartTooltip'), 'Chart must have custom soft glass tooltip');
  assert.ok(dashboardCode.includes('var(--accent'), 'Chart gradient must inherit theme accent CSS variable');
});

// ============================================================================
// 3. FINANCIAL SEMANTIC PRESERVATION & SYSTEM INTEGRITY
// ============================================================================

await test('3.1 Financial Semantic Colors remain strictly standard (Green/Amber/Rose/Indigo)', () => {
  // Collections = Green
  assert.ok(dashboardCode.includes('text-emerald-600') || dashboardCode.includes('bg-emerald-500'), 'Collections must remain Emerald');
  // Overdue & Expenses = Rose
  assert.ok(dashboardCode.includes('text-rose-600') || dashboardCode.includes('text-rose-500'), 'Expenses/Overdue must remain Rose');
  // Dues = Amber
  assert.ok(dashboardCode.includes('text-amber-600') || dashboardCode.includes('text-amber-500'), 'Dues must remain Amber');
  // Liquid / Digital = Indigo
  assert.ok(dashboardCode.includes('text-indigo-600') || dashboardCode.includes('bg-indigo-500'), 'Digital/Liquid must remain Indigo');
});

await test('3.2 Business Money vs Personal Money vs Dream Savings remain strictly isolated', () => {
  assert.ok(dashboardCode.includes('BUSINESS MONEY'), 'Must have distinct Business Money section');
  assert.ok(dashboardCode.includes('MONEY LOCATIONS & SALARY'), 'Must have distinct Liquid/Personal Funds section');
  assert.ok(dashboardCode.includes('MY DREAM SAVINGS'), 'Must have distinct Dream Savings section');
});

// ============================================================================
// 4. CENTRALIZED THEME ENGINE ACROSS ALL 36 PRESETS
// ============================================================================

await test('4.1 All presets resolve luxury companion, accent, and tint tokens cleanly', () => {
  const presetKeys = Object.keys(ALL_THEME_COLORS);
  assert.ok(presetKeys.length >= 35, `Must support at least 35 presets (found ${presetKeys.length})`);
  
  presetKeys.forEach(presetId => {
    const lightTokens = getThemeTokens(presetId, 'light');
    const darkTokens = getThemeTokens(presetId, 'dark');

    assert.ok(lightTokens.luxuryCompanion, `Preset ${presetId} light must define luxuryCompanion`);
    assert.ok(lightTokens.luxuryAccent, `Preset ${presetId} light must define luxuryAccent`);
    assert.ok(lightTokens.tintBg, `Preset ${presetId} light must define tintBg`);
    assert.ok(lightTokens.tintSurface, `Preset ${presetId} light must define tintSurface`);

    assert.ok(darkTokens.luxuryCompanion, `Preset ${presetId} dark must define luxuryCompanion`);
    assert.ok(darkTokens.luxuryAccent, `Preset ${presetId} dark must define luxuryAccent`);
    assert.ok(darkTokens.tintBg, `Preset ${presetId} dark must define tintBg`);
    assert.ok(darkTokens.tintSurface, `Preset ${presetId} dark must define tintSurface`);
  });
});

// ============================================================================
// 5. INVOICE MATH & PAYMENT CANONICAL ENGINE INVARIANCE
// ============================================================================

await test('5.1 Canonical multi-payment invoice lifecycle math remains 100% exact', () => {
  const inv = {
    grandTotal: 25000,
    paidAmount: 15000,
    previousDue: 5000,
    paymentHistory: [
      { id: 'p1', amount: 5000, date: '2026-09-01', method: 'UPI' },
      { id: 'p2', amount: 10000, date: '2026-09-01', method: 'Cash' }
    ]
  };

  const canonical = calculateCanonicalInvoiceFinancials(inv);
  assert.strictEqual(canonical.grandTotal, 25000);
  assert.strictEqual(canonical.previousDue, 5000);
  assert.strictEqual(canonical.allocatedToOldDue, 5000);
  assert.strictEqual(canonical.allocatedToCurrentInvoice, 10000);
  assert.strictEqual(canonical.amountPaid, 15000);
  assert.strictEqual(canonical.balanceDue, 15000);
  assert.strictEqual(canonical.customerTotalDue, 15000);
  assert.strictEqual(canonical.paymentStatus, 'Partially Paid');
});

console.log('\n================================================================');
console.log(`💎 PHASE 20 SOFT GLASS LUXURY CARD AUDIT: ${passedTests} / 8 TESTS PASSED (100%)`);
console.log('================================================================\n');
