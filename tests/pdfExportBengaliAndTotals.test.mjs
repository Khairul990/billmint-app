import assert from 'node:assert';
import { calculateCanonicalInvoiceFinancials } from '../src/utils/invoiceMath.js';
import { buildCanonicalRenderModel } from '../src/utils/normalizeInvoiceModel.js';
import { formatCurrency } from '../src/utils/invoiceUtils.js';

console.log('🧪 RUNNING PDF EXPORT, BENGALI SUPPORT & FINANCIAL CLARITY TESTS\n');

// 1. Bengali Character & Regional Currency Test
const bdtInvoice = {
  invoiceNumber: 'INV-বাংলা-001',
  customerName: 'খায়রুল এন্টারপ্রাইজ (Khairul Enterprise)',
  customerPhone: '+880 1712-345678',
  billType: 'Invoice',
  items: [
    { name: 'সিল্ক শাড়ি ও এমব্রয়ডারি ডিজাইন', qty: 2, price: 1500 },
    { name: 'কটন পাঞ্জাবি স্পেশাল কাজ', qty: 1, price: 2000 }
  ],
  subtotal: 5000,
  taxAmount: 0,
  discountAmount: 500,
  shipping: 100,
  grandTotal: 4600,
  oldDue: 1400,
  totalReceivable: 6000,
  amountPaid: 2000,
  paidAmount: 2000,
  balanceDue: 4000,
  paymentStatus: 'Partial',
  selectedTemplate: 'minimal-classic'
};

const bdtBusinessSettings = {
  businessName: 'খায়ের মুরাফিক এম্পায়ার',
  currency: '৳',
  currencyCode: 'BDT',
  country: 'Bangladesh',
  numberFormat: 'Indian',
  selectedPdfTemplate: 'minimal-classic'
};

const canonical = buildCanonicalRenderModel(bdtInvoice, bdtBusinessSettings);
assert.strictEqual(canonical.currencySymbol, '৳', 'Currency symbol should be ৳');
assert.strictEqual(canonical.rawTemplateId, 'minimal-classic', 'Raw Template ID should be minimal-classic');
assert.strictEqual(canonical.businessPrefs.businessName, 'খায়ের মুরাফিক এম্পায়ার', 'Bengali business name must be preserved');

console.log('  ✅ PASS: 1. Bengali Unicode name and currency symbol (৳) correctly resolved');

// 2. Financial Totals & Old Due Allocation
const fin = calculateCanonicalInvoiceFinancials(bdtInvoice);
assert.strictEqual(fin.currentInvoiceTotal, 4600, 'Current invoice total must be 4600');
assert.strictEqual(fin.previousDue, 1400, 'Previous due must be 1400');
assert.strictEqual(fin.totalReceivable, 6000, 'Total receivable must be 4600 + 1400 = 6000');
assert.strictEqual(fin.amountPaid, 2000, 'Amount paid must be 2000');
assert.strictEqual(fin.allocatedToOldDue, 1400, 'First 1400 of payment must clear Old Due');
assert.strictEqual(fin.remainingOldDue, 0, 'Remaining old due should be 0');
assert.strictEqual(fin.allocatedToCurrentInvoice, 600, 'Remaining 600 of payment allocated to current invoice');
assert.strictEqual(fin.currentBillDue, 4000, 'Remaining current bill due must be 4000');
assert.strictEqual(fin.remainingOldDue + fin.currentBillDue, 4000, 'Total customer net due must be 4000');

console.log('  ✅ PASS: 2. Financial allocation: 2000 payment clears 1400 old due + leaves 4000 current bill due');

// 3. Currency Formatting with BDT
const formattedBdt = formatCurrency(fin.totalReceivable, '৳', 'Indian');
assert.ok(formattedBdt.includes('৳'), 'Formatted string must include ৳');
assert.ok(formattedBdt.includes('6,000') || formattedBdt.includes('6000'), 'Formatted string must format 6000');

console.log('  ✅ PASS: 3. Currency formatting outputs correct regional symbol: ' + formattedBdt);

console.log('\n🎉 ALL PDF EXPORT & BENGALI FINANCIAL TESTS PASSED (100%)!\n');
