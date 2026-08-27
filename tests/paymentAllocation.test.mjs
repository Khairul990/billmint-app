/**
 * BILLQYRO — OLD DUE & INVOICE PAYMENT ALLOCATION TEST SUITE
 * Tests deterministic payment allocation:
 * 1. Priority 1: Settle Previous / Old Due
 * 2. Priority 2: Remainder goes toward Current Invoice
 * 3. Exact breakdown for single and multi-payment lifecycles
 */

import assert from 'assert';
import {
  allocatePayment,
  allocateMultiplePayments,
  computeCustomerLedger,
  getInvoicePaidTotal,
  getInvoiceBalanceDue,
  getInvoicePaymentStatus
} from '../src/utils/financialCalculations.js';

console.log('\n======================================================');
console.log('💰 RUNNING BILLQYRO PAYMENT ALLOCATION TEST SUITE');
console.log('======================================================\n');

let passCount = 0;
let totalCount = 0;

const test = (title, fn) => {
  totalCount++;
  try {
    fn();
    console.log(`  ✅ PASS: ${title}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${title}`);
    console.error(err);
    process.exit(1);
  }
};

// =========================================================================
// MANDATORY TEST CASES
// =========================================================================
console.log('--- Mandatory Allocation Tests ---');

// TEST 1: Partial payment covering only portion of Old Due
test('TEST 1: Payment of ₹1,000 on Old Due ₹1,500 + New Invoice ₹800 leaves Old Due ₹500 and Current Invoice Due ₹800', () => {
  const oldDue = 1500;
  const currentInvoiceTotal = 800;
  const paymentAmount = 1000;

  const result = allocatePayment(paymentAmount, oldDue, currentInvoiceTotal);

  assert.strictEqual(result.allocatedToOldDue, 1000, 'Old Due paid must be ₹1,000');
  assert.strictEqual(result.remainingOldDue, 500, 'Old Due remaining must be ₹500');
  assert.strictEqual(result.allocatedToCurrentInvoice, 0, 'Current Invoice paid must be ₹0');
  assert.strictEqual(result.remainingCurrentInvoiceDue, 800, 'Current Invoice due must be ₹800');
  assert.strictEqual(result.customerTotalDue, 1300, 'Customer total due must be ₹1,300 (500 + 800)');
  assert.strictEqual(result.currentInvoicePaymentStatus, 'Unpaid');
  assert.strictEqual(result.isSettled, false);
});

// TEST 2: Payment covering Old Due fully + partial Current Invoice
test('TEST 2: Payment of ₹2,000 on Old Due ₹1,500 + New Invoice ₹800 settles Old Due to ₹0 and Current Due to ₹300', () => {
  const oldDue = 1500;
  const currentInvoiceTotal = 800;
  const paymentAmount = 2000;

  const result = allocatePayment(paymentAmount, oldDue, currentInvoiceTotal);

  assert.strictEqual(result.allocatedToOldDue, 1500, 'Old Due paid must be ₹1,500');
  assert.strictEqual(result.remainingOldDue, 0, 'Old Due remaining must be ₹0');
  assert.strictEqual(result.allocatedToCurrentInvoice, 500, 'Current Invoice paid must be ₹500 (2000 - 1500)');
  assert.strictEqual(result.remainingCurrentInvoiceDue, 300, 'Current Invoice due must be ₹300 (800 - 500)');
  assert.strictEqual(result.customerTotalDue, 300, 'Customer total due must be ₹300');
  assert.strictEqual(result.currentInvoicePaymentStatus, 'Partial');
  assert.strictEqual(result.isSettled, false);
});

// TEST 3: Exact full settlement of both Old Due and Current Invoice
test('TEST 3: Payment of ₹2,300 on Old Due ₹1,500 + New Invoice ₹800 fully settles account (Status Paid, Total Due ₹0)', () => {
  const oldDue = 1500;
  const currentInvoiceTotal = 800;
  const paymentAmount = 2300;

  const result = allocatePayment(paymentAmount, oldDue, currentInvoiceTotal);

  assert.strictEqual(result.allocatedToOldDue, 1500, 'Old Due paid must be ₹1,500');
  assert.strictEqual(result.remainingOldDue, 0, 'Old Due remaining must be ₹0');
  assert.strictEqual(result.allocatedToCurrentInvoice, 800, 'Current Invoice paid must be ₹800');
  assert.strictEqual(result.remainingCurrentInvoiceDue, 0, 'Current Invoice due must be ₹0');
  assert.strictEqual(result.customerTotalDue, 0, 'Customer total due must be ₹0');
  assert.strictEqual(result.currentInvoicePaymentStatus, 'Paid');
  assert.strictEqual(result.isSettled, true);
});

// TEST 4: Customer with zero Old Due
test('TEST 4: Customer with Old Due ₹0 and New Invoice ₹800 paying ₹300 has Current Due ₹500', () => {
  const oldDue = 0;
  const currentInvoiceTotal = 800;
  const paymentAmount = 300;

  const result = allocatePayment(paymentAmount, oldDue, currentInvoiceTotal);

  assert.strictEqual(result.allocatedToOldDue, 0, 'Old Due paid must be ₹0');
  assert.strictEqual(result.remainingOldDue, 0, 'Old Due remaining must be ₹0');
  assert.strictEqual(result.allocatedToCurrentInvoice, 300, 'Current Invoice paid must be ₹300');
  assert.strictEqual(result.remainingCurrentInvoiceDue, 500, 'Current Invoice due must be ₹500');
  assert.strictEqual(result.customerTotalDue, 500, 'Customer total due must be ₹500');
  assert.strictEqual(result.currentInvoicePaymentStatus, 'Partial');
});

// TEST 5: Multiple payments sequence
test('TEST 5: Multiple payments (₹500 + ₹700 + ₹400 = ₹1,600) on Old Due ₹1,500 + New Invoice ₹800', () => {
  const oldDue = 1500;
  const currentInvoiceTotal = 800;
  const payments = [
    { id: 'p1', amount: 500, method: 'Cash' },
    { id: 'p2', amount: 700, method: 'UPI' },
    { id: 'p3', amount: 400, method: 'Bank Transfer' }
  ];

  const result = allocateMultiplePayments(payments, oldDue, currentInvoiceTotal);

  assert.strictEqual(result.totalPaid, 1600, 'Total paid must be ₹1,600');
  assert.strictEqual(result.allocatedToOldDue, 1500, 'Old Due paid must be ₹1,500');
  assert.strictEqual(result.remainingOldDue, 0, 'Old Due remaining must be ₹0');
  assert.strictEqual(result.allocatedToCurrentInvoice, 100, 'Current Invoice paid must be ₹100');
  assert.strictEqual(result.remainingCurrentInvoiceDue, 700, 'Current Invoice due must be ₹700');
  assert.strictEqual(result.customerTotalDue, 700, 'Customer total due must be ₹700');

  // Check per-payment breakdown
  assert.strictEqual(result.paymentBreakdown[0].allocatedToOldDue, 500);
  assert.strictEqual(result.paymentBreakdown[0].allocatedToCurrentInvoice, 0);

  assert.strictEqual(result.paymentBreakdown[1].allocatedToOldDue, 700);
  assert.strictEqual(result.paymentBreakdown[1].allocatedToCurrentInvoice, 0);

  assert.strictEqual(result.paymentBreakdown[2].allocatedToOldDue, 300); // 1500 - (500 + 700) = 300 needed
  assert.strictEqual(result.paymentBreakdown[2].allocatedToCurrentInvoice, 100); // 400 - 300 = 100
});

// =========================================================================
// INVARIANT & REVENUE NON-DOUBLE COUNTING RULES
// =========================================================================
console.log('\n--- Invariants & Double Counting Guards ---');

test('Invariant 1: Overpayment does not produce negative dues', () => {
  const result = allocatePayment(3000, 1000, 1000);
  assert.strictEqual(result.remainingOldDue, 0);
  assert.strictEqual(result.remainingCurrentInvoiceDue, 0);
  assert.strictEqual(result.customerTotalDue, 0);
  assert.strictEqual(result.currentInvoicePaymentStatus, 'Paid');
  assert.strictEqual(result.isSettled, true);
});

test('Invariant 2: Customer Outstanding = SUM(valid receivables) - SUM(valid payments)', () => {
  const customer = { id: 'cust_alloc_inv', name: 'Allocation Corp' };
  const invoices = [
    {
      id: 'inv_1',
      customerId: 'cust_alloc_inv',
      grandTotal: 2000,
      amountPaid: 500,
      status: 'Issued'
    },
    {
      id: 'inv_2',
      customerId: 'cust_alloc_inv',
      grandTotal: 800,
      amountPaid: 800,
      status: 'Issued'
    }
  ];

  const ledger = computeCustomerLedger(customer, invoices);
  assert.strictEqual(ledger.totalBilled, 2800);
  assert.strictEqual(ledger.totalPaid, 1300);
  assert.strictEqual(ledger.totalDue, 1500); // 2800 - 1300 = 1500
});

console.log(`\n======================================================`);
console.log(`📊 PAYMENT ALLOCATION TEST RESULTS: ${passCount} / ${totalCount} PASSED (100%)`);
console.log(`======================================================\n`);
