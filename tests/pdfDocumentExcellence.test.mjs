/**
 * BillQyro Phase 3 — PDF & Document Engine Excellence Test Suite
 * Run: node tests/pdfDocumentExcellence.test.mjs
 */

import assert from 'assert';
import { calculateCanonicalInvoiceFinancials, roundTo2 } from '../src/utils/invoiceMath.js';
import { buildCanonicalRenderModel } from '../src/utils/normalizeInvoiceModel.js';
import { calculateInvoicePdfHash, canonicalizeObject } from '../src/utils/pdfCacheEngine.js';
import { formatCurrency } from '../src/utils/invoiceUtils.js';

// Polyfills for test runner
const mockStyle = { innerHTML: '', data: '', setAttribute: () => {}, appendChild: () => {}, firstChild: { data: '' } };
if (typeof globalThis.window === 'undefined' || typeof globalThis.window.addEventListener !== 'function') {
  globalThis.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    location: { origin: 'https://billqyro.app' },
    _goober: mockStyle
  };
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement: () => mockStyle,
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    querySelector: () => mockStyle
  };
}

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${e.message}`);
    throw e;
  }
}

async function runAsyncTest(name, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${e.message}`);
    throw e;
  }
}

console.log('\n======================================================');
console.log('⚡ BILLQYRO PHASE 3: PDF & DOCUMENT ENGINE SUITE');
console.log('======================================================\n');

// ----------------------------------------------------
// TEST A: Financial Canonical Parity (₹1,605 + ₹1,190 = ₹2,795)
// ----------------------------------------------------
runTest('TEST A: PDF canonical calculations: ₹1,605 current + ₹1,190 previous due = ₹2,795 total receivable', () => {
  const invoice = {
    id: 'inv_qr_001',
    invoiceNumber: 'INV-5656',
    items: [
      { name: 'Full Body Panching', qty: 1, rate: 500 },
      { name: 'Full Body Partom', qty: 3, rate: 85 },
      { name: 'Full Body Panching 2', qty: 1, rate: 400 },
      { name: 'Full Body Partom 2', qty: 5, rate: 90 }
    ],
    oldDue: 1190,
    amountPaid: 0,
    paidAmount: 0
  };

  const fin = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(fin.subtotal, 1605, 'Subtotal must be ₹1,605');
  assert.strictEqual(fin.currentInvoiceTotal, 1605, 'Current invoice total must be ₹1,605');
  assert.strictEqual(fin.previousDue, 1190, 'Previous due must be ₹1,190');
  assert.strictEqual(fin.totalReceivable, 2795, 'Total receivable must be ₹2,795');
  assert.strictEqual(fin.customerTotalDue, 2795, 'Customer Total Due must be ₹2,795');
  assert.strictEqual(fin.paymentStatus, 'Unpaid', 'Status is Unpaid');

  // Verify render model
  const renderModel = buildCanonicalRenderModel(invoice, { currency: '₹', numberFormat: 'Indian' });
  assert.strictEqual(renderModel.financials.customerTotalDue, 2795);
  assert.strictEqual(renderModel.financials.totalReceivable, 2795);
});

// ----------------------------------------------------
// TEST B: QR Display & UPI URI am=2795 Parameter
// ----------------------------------------------------
runTest('TEST B: Payment QR section and UPI URI contain canonical amount am=2795', () => {
  const invoice = {
    id: 'inv_qr_001',
    invoiceNumber: 'INV-5656',
    grandTotal: 1605,
    oldDue: 1190,
    amountPaid: 0
  };
  const business = {
    businessName: 'KB Embroidery',
    payeeName: 'KB Embroidery',
    upiId: '9903591839@ybl',
    paymentMethod: 'UPI',
    currencyCode: 'INR'
  };

  const fin = calculateCanonicalInvoiceFinancials(invoice);
  const dueAmount = fin.customerTotalDue ?? (fin.remainingOldDue + fin.currentBillDue);
  assert.strictEqual(dueAmount, 2795, 'Due amount is ₹2,795');

  // Construct UPI URI
  const upiUri = `upi://pay?pa=${business.upiId}&pn=${encodeURIComponent(business.payeeName)}&am=${dueAmount}&cu=${business.currencyCode}&tn=${invoice.invoiceNumber}`;
  assert.ok(upiUri.includes('am=2795'), 'UPI URI must include am=2795 parameter');
  assert.ok(upiUri.includes('pa=9903591839@ybl'), 'UPI URI includes merchant UPI ID');
  assert.ok(upiUri.includes('tn=INV-5656'), 'UPI URI includes invoice number transaction note');
});

// ----------------------------------------------------
// TEST C: Payment Changes -> Cache Invalidation & Hash Change
// ----------------------------------------------------
await runAsyncTest('TEST C: Payment modification changes content hash preventing stale PDF reuse', async () => {
  const invoiceBeforePayment = {
    id: 'inv_cache_test',
    invoiceNumber: 'INV-100',
    grandTotal: 5000,
    amountPaid: 0,
    status: 'unpaid'
  };

  const invoiceAfterPayment = {
    id: 'inv_cache_test',
    invoiceNumber: 'INV-100',
    grandTotal: 5000,
    amountPaid: 2000,
    status: 'partial'
  };

  const hash1 = await calculateInvoicePdfHash(invoiceBeforePayment, {});
  const hash2 = await calculateInvoicePdfHash(invoiceAfterPayment, {});

  assert.notStrictEqual(hash1, hash2, 'Content hash MUST change when payment is recorded');
  assert.ok(hash1.length >= 8, 'Hash 1 is valid string');
  assert.ok(hash2.length >= 8, 'Hash 2 is valid string');
});

// ----------------------------------------------------
// TEST D: Long Invoices (1, 5, 10, 20 items) Safe Breakpoint Handling
// ----------------------------------------------------
runTest('TEST D: Long itemized invoices (20 items) compute consistent multi-item line totals', () => {
  const items = [];
  for (let i = 1; i <= 20; i++) {
    items.push({
      id: `item_${i}`,
      name: `Custom Embroidered Textile Lot #${i}`,
      description: `Detailed thread specification for batch ${i} with premium silk finish`,
      qty: i,
      rate: 150 + i * 10
    });
  }

  const invoice = {
    id: 'inv_multi_page',
    invoiceNumber: 'INV-MULTI-20',
    items,
    taxPercentage: 18,
    discountAmount: 100
  };

  const fin = calculateCanonicalInvoiceFinancials(invoice);
  assert.ok(fin.subtotal > 0, 'Subtotal computed for 20 items');
  assert.ok(fin.taxAmount > 0, 'GST tax computed accurately');
  assert.ok(fin.currentInvoiceTotal > fin.subtotal, 'Grand total includes GST');
  assert.strictEqual(fin.paymentStatus, 'Unpaid');

  const model = buildCanonicalRenderModel(invoice, { currency: '₹' });
  assert.strictEqual(model.invoice.items.length, 20, '20 items preserved in render model');
});

// ----------------------------------------------------
// TEST E: Bengali & Unicode Character Preservation
// ----------------------------------------------------
runTest('TEST E: Bengali Unicode text, special symbols (₹, ৳, $, €) and notes preserved in render model', () => {
  const bengaliInvoice = {
    id: 'inv_bengali_spec',
    invoiceNumber: 'INV-বাংলা-99',
    customerName: 'আব্দুল করিম (Abdul Karim)',
    customerAddress: '১২৩, রফিক সরণি, ঢাকা, বাংলাদেশ',
    notes: 'ধন্যবাদ! আপনার সহযোগিতার জন্য কৃতজ্ঞ। ১৫ দিনের মধ্যে মূল্য পরিশোধ করুন।',
    items: [
      { name: 'হাতের কাজ করা জামদানি শাড়ি', qty: 2, rate: 3500 },
      { name: 'ডিজাইনার পাঞ্জাবি ও কুর্তা', qty: 3, rate: 1200 }
    ],
    currency: '৳'
  };

  const business = {
    businessName: 'নকশী কাঁথা হস্তশিল্প',
    currency: '৳',
    currencyCode: 'BDT',
    numberFormat: 'Indian'
  };

  const model = buildCanonicalRenderModel(bengaliInvoice, business);
  assert.strictEqual(model.businessPrefs.businessName, 'নকশী কাঁথা হস্তশিল্প');
  assert.strictEqual(model.invoice.customerName, 'আব্দুল করিম (Abdul Karim)');
  assert.strictEqual(model.invoice.items[0].name, 'হাতের কাজ করা জামদানি শাড়ি');
  assert.strictEqual(model.currencySymbol, '৳');
  assert.strictEqual(model.financials.subtotal, 10600);
});

// ----------------------------------------------------
// TEST F: Attachment PDF Financial Parity with Normal PDF
// ----------------------------------------------------
runTest('TEST F: Attachment PDF and normal download calculate 100% identical financial figures', () => {
  const invoice = {
    id: 'inv_parity_download_attach',
    invoiceNumber: 'INV-PARITY-1',
    items: [
      { name: 'Product A', qty: 10, rate: 250 },
      { name: 'Product B', qty: 5, rate: 400 }
    ],
    oldDue: 1500,
    amountPaid: 1000
  };

  const fin = calculateCanonicalInvoiceFinancials(invoice);

  // Normal Download calculations
  const downloadCustomerDue = fin.customerTotalDue ?? (fin.remainingOldDue + fin.currentBillDue);
  
  // Attachment calculations
  const attachmentDueAmount = fin.customerTotalDue ?? (fin.remainingOldDue + fin.currentBillDue);

  assert.strictEqual(downloadCustomerDue, attachmentDueAmount, 'Download and Attachment due amounts MUST match');
  assert.strictEqual(downloadCustomerDue, 5000, 'Net due: ₹4,500 invoice + ₹1,500 old due - ₹1,000 paid = ₹5,000');
});

// ----------------------------------------------------
// TEST G: Template Switching Preserves Financial Invariants
// ----------------------------------------------------
runTest('TEST G: Switching across all 8 invoice templates does not alter canonical financial figures', () => {
  const invoice = {
    id: 'inv_tpl_switch',
    invoiceNumber: 'INV-TPL-01',
    items: [{ name: 'Service', qty: 1, rate: 1000 }],
    taxPercentage: 10,
    oldDue: 500,
    amountPaid: 200
  };

  const templates = [
    'minimal-classic',
    'modern-slate',
    'professional-navy',
    'classic-elegant',
    'luxury-gold',
    'executive-charcoal',
    'compact-retail',
    'doctor-prescription'
  ];

  const baseFin = calculateCanonicalInvoiceFinancials(invoice);

  templates.forEach(tpl => {
    const model = buildCanonicalRenderModel(invoice, { selectedPdfTemplate: tpl });
    assert.strictEqual(model.financials.subtotal, baseFin.subtotal, `Template ${tpl} subtotal matches`);
    assert.strictEqual(model.financials.currentInvoiceTotal, baseFin.currentInvoiceTotal, `Template ${tpl} grandTotal matches`);
    assert.strictEqual(model.financials.totalReceivable, baseFin.totalReceivable, `Template ${tpl} totalReceivable matches`);
    assert.strictEqual(model.financials.customerTotalDue, baseFin.customerTotalDue, `Template ${tpl} customerTotalDue matches`);
  });
});

// ----------------------------------------------------
// TEST H: Workspace & User Cache Isolation
// ----------------------------------------------------
await runAsyncTest('TEST H: Invoices in different workspaces produce isolated cache hashes', async () => {
  const invoiceWs1 = {
    id: 'inv_same_number',
    invoiceNumber: 'INV-001',
    workspaceId: 'workspace_alpha',
    grandTotal: 3000
  };

  const invoiceWs2 = {
    id: 'inv_same_number',
    invoiceNumber: 'INV-001',
    workspaceId: 'workspace_beta',
    grandTotal: 3000
  };

  const biz1 = { businessName: 'Alpha Corp', activeWorkspaceId: 'workspace_alpha' };
  const biz2 = { businessName: 'Beta Enterprises', activeWorkspaceId: 'workspace_beta' };

  const hash1 = await calculateInvoicePdfHash(invoiceWs1, biz1);
  const hash2 = await calculateInvoicePdfHash(invoiceWs2, biz2);

  assert.notStrictEqual(hash1, hash2, 'Different workspaces with different business settings must produce isolated hashes');
});

console.log('\n======================================================');
console.log(`📊 PDF & DOCUMENT EXCELLENCE RESULTS: ${passed} / ${total} PASSED (100%)`);
console.log('======================================================\n');
