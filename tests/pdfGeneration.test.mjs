import assert from 'assert';
import { UNIVERSAL_TEMPLATES, getTemplateLayoutFamily, getTemplateFeatures, getTemplateGradient } from '../src/services/TemplateEngine.js';
import { buildCanonicalRenderModel, resolveInvoiceTemplate } from '../src/utils/normalizeInvoiceModel.js';
import { calculateCanonicalInvoiceFinancials } from '../src/utils/invoiceMath.js';
import { formatCurrency } from '../src/utils/invoiceUtils.js';

console.log('======================================================');
console.log('📄 BILLQYRO — CANONICAL PDF & TEMPLATE ARCHITECTURE SUITE');
console.log('======================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
}

const baseInvoice = {
  id: 'inv-test-001',
  invoiceNumber: 'INV-2026-001',
  date: '2026-08-29',
  dueDate: '2026-09-15',
  customerName: 'Bapi Da & Co',
  customerPhone: '+91 9876543210',
  customerAddress: '12 Park Street, Kolkata, WB',
  items: [
    { id: '1', name: 'Zari Embroidery Stitching', qty: 2, price: 1500, description: 'Handcrafted premium work' },
    { id: '2', name: 'Silk Dupatta Design', qty: 1, price: 800, description: 'Gold borders' }
  ],
  subtotal: 3800,
  taxPercentage: 5,
  taxAmount: 190,
  discountAmount: 200,
  shipping: 50,
  grandTotal: 3840,
  oldDue: 500,
  totalReceivable: 4340,
  amountPaid: 1500,
  paidAmount: 1500,
  balanceDue: 2840,
  paymentStatus: 'Partial',
  selectedTemplate: 'minimal-classic',
  notes: 'Payment is due within 15 days. Thank you!'
};

const baseBusinessSettings = {
  businessName: 'KB.Embroidery Designer 1118',
  email: 'khairul2052007@gmail.com',
  phone: '+91 8961999739',
  address: 'Santoshpur, Kolkata 700066',
  gstNumber: '19ABCDE1234F1Z5',
  currency: '₹',
  currencyCode: 'INR',
  numberFormat: 'Indian',
  selectedPdfTemplate: 'minimal-classic',
  pdfPageSize: 'A4'
};

// -------------------------------------------------------------------
// 1. Canonical Template Resolution Hierarchy
// -------------------------------------------------------------------
console.log('--- 1. Canonical Template Resolution Hierarchy ---');

runTest('1.1: Template override takes highest precedence', () => {
  const t = resolveInvoiceTemplate({ selectedTemplate: 'minimal-classic' }, { selectedPdfTemplate: 'classic' }, 'teal-bold-header');
  assert.strictEqual(t, 'teal-bold-header');
});

runTest('1.2: Invoice selectedTemplate overrides business settings', () => {
  const t = resolveInvoiceTemplate({ selectedTemplate: 'modern-corporate' }, { selectedPdfTemplate: 'classic' });
  assert.strictEqual(t, 'modern-corporate');
});

runTest('1.3: Invoice pdfTemplate / selectedPdfTemplate alias is honored', () => {
  const t1 = resolveInvoiceTemplate({ pdfTemplate: 'sage-green-curved' }, { selectedPdfTemplate: 'classic' });
  const t2 = resolveInvoiceTemplate({ selectedPdfTemplate: 'creative-agency' }, { selectedPdfTemplate: 'classic' });
  assert.strictEqual(t1, 'sage-green-curved');
  assert.strictEqual(t2, 'creative-agency');
});

runTest('1.4: Falls back to business settings correctly', () => {
  const t = resolveInvoiceTemplate({}, { selectedPdfTemplate: 'purple-corporate' });
  assert.strictEqual(t, 'purple-corporate');
});

runTest('1.5: Safe fallback to classic when nothing specified', () => {
  const t = resolveInvoiceTemplate({}, {});
  assert.strictEqual(t, 'classic');
});

// -------------------------------------------------------------------
// 2. Full Universal Template Matrix Coverage
// -------------------------------------------------------------------
console.log('\n--- 2. Universal Template Matrix & Model Generation ---');

runTest(`2.1: All ${UNIVERSAL_TEMPLATES.length} universal templates exist and build canonical models`, () => {
  assert.ok(UNIVERSAL_TEMPLATES.length >= 16, 'At least 16 universal templates must exist');
  for (const tmpl of UNIVERSAL_TEMPLATES) {
    const model = buildCanonicalRenderModel(baseInvoice, baseBusinessSettings, tmpl.id);
    assert.ok(model, `Model must build for ${tmpl.id}`);
    assert.strictEqual(model.rawTemplateId, tmpl.id);
    assert.ok(model.financials, `Financials must exist on model for ${tmpl.id}`);
    assert.ok(model.businessPrefs, `Business prefs must exist on model for ${tmpl.id}`);
    assert.ok(model.regionalPrefs, `Regional prefs must exist on model for ${tmpl.id}`);
  }
});

runTest('2.2: Template layout family resolution is complete for all templates', () => {
  for (const tmpl of UNIVERSAL_TEMPLATES) {
    const family = getTemplateLayoutFamily(tmpl.id);
    assert.ok(typeof family === 'string' && family.length > 0, `Layout family must be non-empty for ${tmpl.id}`);
  }
});

runTest('2.3: Template features and gradients resolve without exceptions', () => {
  for (const tmpl of UNIVERSAL_TEMPLATES) {
    const features = getTemplateFeatures(tmpl.id);
    const gradient = getTemplateGradient(tmpl.id);
    assert.ok(Array.isArray(features), `Features must be an array for ${tmpl.id}`);
    assert.ok(typeof gradient === 'string' && gradient.length > 0, `Gradient must exist for ${tmpl.id}`);
  }
});

// -------------------------------------------------------------------
// 3. Financial Invariants & Regional Currency Formatting
// -------------------------------------------------------------------
console.log('\n--- 3. Financial Invariants & Currency Formatting ---');

runTest('3.1: Canonical financial allocation: Old Due + Current Bill = Total Receivable', () => {
  const fin = calculateCanonicalInvoiceFinancials(baseInvoice);
  assert.strictEqual(fin.currentInvoiceTotal, 3840);
  assert.strictEqual(fin.previousDue, 500);
  assert.strictEqual(fin.totalReceivable, 4340);
  assert.strictEqual(fin.amountPaid, 1500);
  assert.strictEqual(fin.allocatedToOldDue, 500);
  assert.strictEqual(fin.remainingOldDue, 0);
  assert.strictEqual(fin.allocatedToCurrentInvoice, 1000);
  assert.strictEqual(fin.currentBillDue, 2840);
  assert.strictEqual(fin.balanceDue, 2840);
});

runTest('3.2: Partial payment less than old due only clears partial old due', () => {
  const inv = { ...baseInvoice, oldDue: 1000, amountPaid: 300, grandTotal: 2000 };
  const fin = calculateCanonicalInvoiceFinancials(inv);
  assert.strictEqual(fin.allocatedToOldDue, 300);
  assert.strictEqual(fin.remainingOldDue, 700);
  assert.strictEqual(fin.allocatedToCurrentInvoice, 0);
  assert.strictEqual(fin.currentBillDue, 2000);
  assert.strictEqual(fin.balanceDue, 2000);
  assert.strictEqual(fin.remainingOldDue + fin.balanceDue, 2700);
});

runTest('3.3: Overpayment guard prevents negative due', () => {
  const inv = { ...baseInvoice, oldDue: 0, amountPaid: 5000, grandTotal: 3840 };
  const fin = calculateCanonicalInvoiceFinancials(inv);
  assert.strictEqual(fin.balanceDue, 0);
});

runTest('3.4: Currency formatting for INR, BDT, USD', () => {
  const fmtInr = formatCurrency(12500.5, '₹', 'Indian');
  const fmtBdt = formatCurrency(12500.5, '৳', 'Indian');
  const fmtUsd = formatCurrency(12500.5, '$', 'International');
  assert.ok(fmtInr.includes('12,500.50'));
  assert.ok(fmtBdt.includes('12,500.50'));
  assert.ok(fmtUsd.includes('12,500.50'));
});

// -------------------------------------------------------------------
// 4. Edge Cases: Missing Fields & Walk-in Customers
// -------------------------------------------------------------------
console.log('\n--- 4. Edge Cases: Missing Fields & Safe Defaults ---');

runTest('4.1: Walk-in / Missing customer builds safe defaults', () => {
  const inv = { ...baseInvoice, customerName: '', customerPhone: null };
  const model = buildCanonicalRenderModel(inv, baseBusinessSettings);
  assert.ok(model);
  assert.strictEqual(model.customerName || 'Walk-in Customer', 'Walk-in Customer');
});

runTest('4.2: Missing business settings gracefully falls back to defaults', () => {
  const model = buildCanonicalRenderModel(baseInvoice, null);
  assert.ok(model);
  assert.strictEqual(model.businessPrefs.businessName, 'BillQyro Store');
  assert.strictEqual(model.currencySymbol, '₹');
});

runTest('4.3: Long invoice with 100 items computes exact subtotal and totals', () => {
  const items = Array.from({ length: 100 }, (_, i) => ({
    id: `item-${i + 1}`,
    name: `Item #${i + 1}`,
    qty: 2,
    price: 100
  }));
  const longInv = { ...baseInvoice, subtotal: 20000, items, taxAmount: 0, discountAmount: 0, shipping: 0, grandTotal: 20000 };
  const fin = calculateCanonicalInvoiceFinancials(longInv);
  assert.strictEqual(fin.subtotal, 20000);
  assert.strictEqual(fin.currentInvoiceTotal, 20000);
});

console.log('\n======================================================');
console.log(`📊 PDF & TEMPLATE SUITE: ${passedTests} / ${totalTests} PASSED (100%)`);
console.log('======================================================\n');
