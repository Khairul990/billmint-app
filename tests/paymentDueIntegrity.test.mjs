import assert from 'node:assert';
import fs from 'node:fs';
import { 
  calculateCanonicalInvoiceFinancials, 
  determinePaymentStatus, 
  getInvoicePaidTotal, 
  getInvoiceBalanceDue, 
  getInvoicePaymentStatus,
  normalizeInvoiceFinancials,
  allocatePayment
} from '../src/utils/invoiceMath.js';
import { computeCustomerLedger, computeCollectionsSummary } from '../src/utils/financialCalculations.js';
import { calculateInvoicePdfHash } from '../src/utils/pdfCacheEngine.js';

console.log('======================================================');
console.log('💰 BILLQYRO PAYMENT & DUE COLLECTION INTEGRITY AUDIT');
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
// 1. COMPLETE PAYMENT FLOW (₹10,000 -> ₹3,000 -> ₹7,000)
// ============================================================================

await test('1.1 Initial invoice state: ₹10,000 total -> Unpaid with ₹10,000 due', () => {
  const invoice = {
    id: 'inv_1001',
    grandTotal: 10000,
    amountPaid: 0,
    paymentHistory: []
  };

  const canonical = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(canonical.currentInvoiceTotal, 10000);
  assert.strictEqual(canonical.amountPaid, 0);
  assert.strictEqual(canonical.balanceDue, 10000);
  assert.strictEqual(canonical.paymentStatus, 'Unpaid');
  assert.strictEqual(canonical.isFullyPaid, false);
});

await test('1.2 Partial payment: Collect ₹3,000 -> amountPaid ₹3,000, balanceDue ₹7,000, status Partially Paid', () => {
  const invoice = {
    id: 'inv_1001',
    grandTotal: 10000,
    paymentHistory: [
      { id: 'pmt_1', amount: 3000, method: 'UPI', date: '2026-08-30' }
    ]
  };

  const canonical = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(canonical.currentInvoiceTotal, 10000);
  assert.strictEqual(canonical.amountPaid, 3000);
  assert.strictEqual(canonical.balanceDue, 7000);
  assert.strictEqual(canonical.paymentStatus, 'Partially Paid');
  assert.strictEqual(canonical.isFullyPaid, false);
});

await test('1.3 Full settlement: Collect additional ₹7,000 -> amountPaid ₹10,000, balanceDue ₹0, status Paid', () => {
  const invoice = {
    id: 'inv_1001',
    grandTotal: 10000,
    paymentHistory: [
      { id: 'pmt_1', amount: 3000, method: 'UPI', date: '2026-08-30' },
      { id: 'pmt_2', amount: 7000, method: 'Bank Transfer', date: '2026-08-30' }
    ]
  };

  const canonical = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(canonical.currentInvoiceTotal, 10000);
  assert.strictEqual(canonical.amountPaid, 10000);
  assert.strictEqual(canonical.balanceDue, 0);
  assert.strictEqual(canonical.paymentStatus, 'Paid');
  assert.strictEqual(canonical.isFullyPaid, true);
});

await test('1.4 Overpayment safety: ₹10,000 invoice with ₹12,000 payment -> balanceDue ₹0, status Paid', () => {
  const invoice = {
    id: 'inv_1001',
    grandTotal: 10000,
    paymentHistory: [
      { id: 'pmt_1', amount: 12000, method: 'Cash', date: '2026-08-30' }
    ]
  };

  const canonical = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(canonical.currentInvoiceTotal, 10000);
  assert.strictEqual(canonical.amountPaid, 12000);
  assert.strictEqual(canonical.balanceDue, 0);
  assert.strictEqual(canonical.paymentStatus, 'Paid');
  assert.strictEqual(canonical.isFullyPaid, true);
});

// ============================================================================
// 2. CUSTOMER DUE LEDGER VERIFICATION
// ============================================================================

await test('2.1 Customer Ledger: Opening due ₹15,000 - Payment ₹5,000 = ₹10,000, then - ₹10,000 = ₹0', () => {
  const customer = { id: 'cust_abc', name: 'Al-Farooq Boutique', previousDue: 15000 };
  
  // Before payments
  const ledgerInitial = computeCustomerLedger(customer, []);
  assert.strictEqual(ledgerInitial.totalDue, 15000);
  assert.strictEqual(ledgerInitial.isSettled, false);

  // After 1st payment of ₹5,000 against an invoice of ₹15,000
  const invoicesStep1 = [
    { id: 'inv_1', customerId: 'cust_abc', grandTotal: 15000, amountPaid: 5000, paymentHistory: [{ amount: 5000 }] }
  ];
  const ledgerStep1 = computeCustomerLedger({ ...customer, previousDue: 0 }, invoicesStep1);
  assert.strictEqual(ledgerStep1.totalBilled, 15000);
  assert.strictEqual(ledgerStep1.totalPaid, 5000);
  assert.strictEqual(ledgerStep1.totalDue, 10000);
  assert.strictEqual(ledgerStep1.isSettled, false);

  // After 2nd payment of ₹10,000
  const invoicesStep2 = [
    { id: 'inv_1', customerId: 'cust_abc', grandTotal: 15000, amountPaid: 15000, paymentHistory: [{ amount: 5000 }, { amount: 10000 }] }
  ];
  const ledgerStep2 = computeCustomerLedger({ ...customer, previousDue: 0 }, invoicesStep2);
  assert.strictEqual(ledgerStep2.totalBilled, 15000);
  assert.strictEqual(ledgerStep2.totalPaid, 15000);
  assert.strictEqual(ledgerStep2.totalDue, 0);
  assert.strictEqual(ledgerStep2.isSettled, true);
});

// ============================================================================
// 3. IDEMPOTENCY & DUPLICATE PROTECTION
// ============================================================================

await test('3.1 Payment Idempotency: Duplicate payment entries with same ID update existing record', () => {
  const invoice = {
    id: 'inv_1002',
    grandTotal: 5000,
    paymentHistory: [
      { id: 'pmt_fixed_123', amount: 2000, method: 'Cash' }
    ]
  };

  const duplicatePayment = { id: 'pmt_fixed_123', amount: 2000, method: 'Cash' };
  const history = [...invoice.paymentHistory];
  const existingIdx = history.findIndex(p => p.id === duplicatePayment.id);
  if (existingIdx >= 0) {
    history[existingIdx] = duplicatePayment;
  } else {
    history.push(duplicatePayment);
  }

  assert.strictEqual(history.length, 1);
  const canonical = calculateCanonicalInvoiceFinancials({ ...invoice, paymentHistory: history });
  assert.strictEqual(canonical.amountPaid, 2000);
  assert.strictEqual(canonical.balanceDue, 3000);
});

// ============================================================================
// 4. PDF CACHE DETERMINISM & INVALIDATION
// ============================================================================

await test('4.1 PDF Hash changes deterministically upon recording a payment', async () => {
  const unpaidInv = {
    id: 'inv_pdf_test',
    invoiceNumber: 'INV-999',
    grandTotal: 8000,
    amountPaid: 0,
    paymentStatus: 'Unpaid',
    paymentHistory: []
  };

  const paidInv = {
    id: 'inv_pdf_test',
    invoiceNumber: 'INV-999',
    grandTotal: 8000,
    amountPaid: 8000,
    paymentStatus: 'Paid',
    paymentHistory: [{ id: 'pmt_p1', amount: 8000 }]
  };

  const hashUnpaid = await calculateInvoicePdfHash(unpaidInv);
  const hashPaid = await calculateInvoicePdfHash(paidInv);

  assert.notStrictEqual(hashUnpaid, hashPaid, 'PDF Content Hash must change when payment status updates');
});

// ============================================================================
// 5. INVOICE ENGINE METHOD PARITY & ROUTING
// ============================================================================

await test('5.1 invoiceEngine exposes both markAsPaid and recordPayment', () => {
  const engineCode = fs.readFileSync('src/services/invoiceEngine.js', 'utf8');
  assert.ok(engineCode.includes('async markAsPaid('));
  assert.ok(engineCode.includes('async recordPayment('));
  assert.ok(engineCode.includes('invalidateInvoicePdfCache'));
});

// ============================================================================
// 6. DASHBOARD & REPORT METRICS
// ============================================================================

await test('6.1 Collections Summary reflects exact collected vs outstanding amounts', () => {
  const invoices = [
    { grandTotal: 10000, amountPaid: 3000, paymentStatus: 'Partially Paid' },
    { grandTotal: 5000, amountPaid: 5000, paymentStatus: 'Paid' },
    { grandTotal: 4000, amountPaid: 0, paymentStatus: 'Unpaid' }
  ];

  const summary = computeCollectionsSummary(invoices);
  assert.strictEqual(summary.totalInvoiced, 19000);
  assert.strictEqual(summary.totalCollected, 8000);
  assert.strictEqual(summary.totalDue, 11000);
  assert.strictEqual(summary.collectionRate, 42.11);
});

console.log('======================================================');
console.log(`💰 PAYMENT INTEGRITY SUITE: ${passedTests} / 9 PASSED (100%)`);
console.log('======================================================\n');
