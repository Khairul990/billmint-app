/**
 * BILLQYRO — CUSTOMER DUE & PAYMENT LEDGER HARDENING TEST SUITE
 * Verifies Previous Due, Customer Identity Matching, Payment History Preservation,
 * Edit Mode Isolation, and Canonical Financial Ledger Invariants.
 */

import assert from 'assert';
import {
  computeCustomerLedger,
  getInvoicePaidTotal,
  getInvoiceBalanceDue,
  getInvoicePaymentStatus,
  normalizeInvoiceFinancials,
  computeCustomerReport,
  roundTo2
} from '../src/utils/financialCalculations.js';

console.log('\n======================================================');
console.log('💳 RUNNING BILLQYRO CUSTOMER DUE & PAYMENT LEDGER TEST SUITE');
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
// 1. OLD DUE MUST BE PREVIOUS OUTSTANDING
// =========================================================================
console.log('--- 1. Previous / Old Due Invariants ---');

test('1.1: Customer with ₹2,000 invoice and ₹500 paid has previous due of ₹1,500 for new invoice', () => {
  const customer = { id: 'cust_acme', name: 'Acme Corp', phone: '9876543210' };
  const invoices = [
    {
      id: 'inv_101',
      invoiceNumber: 'INV-101',
      customerId: 'cust_acme',
      customerName: 'Acme Corp',
      grandTotal: 2000,
      amountPaid: 500,
      paymentHistory: [{ id: 'pmt_1', amount: 500, date: '2026-08-01' }],
      status: 'Issued'
    }
  ];

  const ledger = computeCustomerLedger(customer, invoices);
  assert.strictEqual(ledger.totalBilled, 2000);
  assert.strictEqual(ledger.totalPaid, 500);
  assert.strictEqual(ledger.totalDue, 1500);
  assert.strictEqual(ledger.isSettled, false);

  // When creating a new invoice B for ₹800:
  const newInvoiceTotal = 800;
  const previousDue = ledger.totalDue; // ₹1,500
  const totalReceivable = newInvoiceTotal + previousDue; // ₹2,300
  const paidNow = 300;
  const balanceDue = Math.max(0, totalReceivable - paidNow); // ₹2,000

  assert.strictEqual(previousDue, 1500);
  assert.strictEqual(totalReceivable, 2300);
  assert.strictEqual(balanceDue, 2000);
});

// =========================================================================
// 2. CUSTOMER MATCHING & ISOLATION
// =========================================================================
console.log('\n--- 2. Customer Identity Matching & Isolation ---');

test('2.1: Different customers with identical names NEVER share dues when customerId differs', () => {
  const customerA = { id: 'cust_john_1', name: 'John Doe', phone: '1111111111' };
  const customerB = { id: 'cust_john_2', name: 'John Doe', phone: '2222222222' };

  const allInvoices = [
    {
      id: 'inv_a',
      customerId: 'cust_john_1',
      customerName: 'John Doe',
      grandTotal: 5000,
      amountPaid: 1000,
      status: 'Issued'
    },
    {
      id: 'inv_b',
      customerId: 'cust_john_2',
      customerName: 'John Doe',
      grandTotal: 1200,
      amountPaid: 1200,
      status: 'Issued'
    }
  ];

  const ledgerA = computeCustomerLedger(customerA, allInvoices);
  const ledgerB = computeCustomerLedger(customerB, allInvoices);

  // Customer A has 5000 billed, 1000 paid, 4000 due
  assert.strictEqual(ledgerA.totalBilled, 5000);
  assert.strictEqual(ledgerA.totalPaid, 1000);
  assert.strictEqual(ledgerA.totalDue, 4000);
  assert.strictEqual(ledgerA.isSettled, false);

  // Customer B has 1200 billed, 1200 paid, 0 due (Settled)
  assert.strictEqual(ledgerB.totalBilled, 1200);
  assert.strictEqual(ledgerB.totalPaid, 1200);
  assert.strictEqual(ledgerB.totalDue, 0);
  assert.strictEqual(ledgerB.isSettled, true);
});

test('2.2: Fallback to phone / normalized name only when customerId is absent on legacy invoices', () => {
  const customer = { id: 'cust_legacy', name: '  Alice Smith ', phone: '987-654-3210' };
  const invoices = [
    {
      id: 'inv_legacy_1',
      customerName: 'alice smith',
      customerPhone: '+91 9876543210',
      grandTotal: 3000,
      amountPaid: 1000,
      status: 'Issued'
    }
  ];

  const ledger = computeCustomerLedger(customer, invoices);
  assert.strictEqual(ledger.totalBilled, 3000);
  assert.strictEqual(ledger.totalDue, 2000);
});

// =========================================================================
// 3. EDIT MODE EXCLUSION (NO DOUBLE COUNTING)
// =========================================================================
console.log('\n--- 3. Edit Mode Exclusion ---');

test('3.1: In edit mode, the current invoice is strictly excluded from previous due calculation', () => {
  const customer = { id: 'cust_bob', name: 'Bob Enterprises' };
  const invoices = [
    {
      id: 'inv_bob_1',
      customerId: 'cust_bob',
      customerName: 'Bob Enterprises',
      grandTotal: 1000,
      amountPaid: 200,
      status: 'Issued'
    },
    {
      id: 'inv_bob_2', // Invoice currently being edited
      customerId: 'cust_bob',
      customerName: 'Bob Enterprises',
      grandTotal: 1500,
      amountPaid: 500,
      status: 'Issued'
    }
  ];

  // When editing inv_bob_2, excludeInvoiceId = 'inv_bob_2'
  const ledgerOnEdit = computeCustomerLedger(customer, invoices, 'inv_bob_2');
  
  // Previous due must only count inv_bob_1 (1000 - 200 = 800), NOT inv_bob_2!
  assert.strictEqual(ledgerOnEdit.totalBilled, 1000);
  assert.strictEqual(ledgerOnEdit.totalPaid, 200);
  assert.strictEqual(ledgerOnEdit.totalDue, 800);
});

// =========================================================================
// 4. PAYMENT HISTORY PRESERVATION & MULTI-PAYMENT
// =========================================================================
console.log('\n--- 4. Payment History Preservation ---');

test('4.1: Adding payment in edit mode accumulates into history without replacing earlier payments', () => {
  const existingInvoice = {
    id: 'inv_multi_pay',
    invoiceNumber: 'INV-MP-01',
    grandTotal: 1000,
    amountPaid: 300,
    paymentHistory: [
      { id: 'pmt_01', amount: 300, date: '2026-08-10', method: 'Cash', note: 'Advance' }
    ]
  };

  // User edits invoice and increases total paid to ₹500
  const existingHistory = [...existingInvoice.paymentHistory];
  const historySum = existingHistory.reduce((s, p) => s + p.amount, 0); // 300
  const newTotalPaid = 500;
  const delta = newTotalPaid - historySum; // 200

  assert.strictEqual(delta, 200);

  const updatedHistory = [
    ...existingHistory,
    { id: 'pmt_02', amount: delta, date: '2026-08-20', method: 'UPI', note: 'Second Payment' }
  ];

  const updatedInvoice = normalizeInvoiceFinancials({
    ...existingInvoice,
    paymentHistory: updatedHistory,
    amountPaid: newTotalPaid
  });

  assert.strictEqual(updatedInvoice.paymentHistory.length, 2);
  assert.strictEqual(updatedInvoice.paymentHistory[0].amount, 300);
  assert.strictEqual(updatedInvoice.paymentHistory[1].amount, 200);
  assert.strictEqual(updatedInvoice.amountPaid, 500);
  assert.strictEqual(updatedInvoice.balanceDue, 500);
  assert.strictEqual(updatedInvoice.paymentStatus, 'Partially Paid');
});

// =========================================================================
// 5. CANONICAL FINANCIAL RESOLVERS & STATUS
// =========================================================================
console.log('\n--- 5. Canonical Financial Invariants ---');

test('5.1: Non-negative balance due when overpaid', () => {
  const overpaidInv = {
    grandTotal: 500,
    amountPaid: 700,
    paymentHistory: [{ id: 'p1', amount: 700 }]
  };
  assert.strictEqual(getInvoicePaidTotal(overpaidInv), 700);
  assert.strictEqual(getInvoiceBalanceDue(overpaidInv), 0);
  assert.strictEqual(getInvoicePaymentStatus(overpaidInv), 'Paid');
});

test('5.2: Cancelled or Void invoice is excluded from customer due', () => {
  const customer = { id: 'cust_cancelled_test', name: 'Test User' };
  const invoices = [
    {
      id: 'inv_valid',
      customerId: 'cust_cancelled_test',
      grandTotal: 1000,
      amountPaid: 0,
      status: 'Issued'
    },
    {
      id: 'inv_cancelled',
      customerId: 'cust_cancelled_test',
      grandTotal: 5000,
      amountPaid: 0,
      status: 'Cancelled'
    },
    {
      id: 'inv_void',
      customerId: 'cust_cancelled_test',
      grandTotal: 3000,
      amountPaid: 0,
      status: 'Void'
    }
  ];

  const ledger = computeCustomerLedger(customer, invoices);
  assert.strictEqual(ledger.totalBilled, 1000);
  assert.strictEqual(ledger.totalDue, 1000);
});

console.log(`\n======================================================`);
console.log(`📊 CUSTOMER DUE & PAYMENT LEDGER RESULTS: ${passCount} / ${totalCount} PASSED (100%)`);
console.log(`======================================================\n`);
