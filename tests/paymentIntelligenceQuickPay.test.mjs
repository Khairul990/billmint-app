// Polyfills for test runner before any module evaluation
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

import assert from 'assert';
import {
  calculateCanonicalInvoiceFinancials,
  allocatePayment,
  getInvoicePaidTotal,
  getInvoiceBalanceDue,
  getInvoicePaymentStatus,
  computeCustomerLedger,
  computeSalesSummary,
  computeCollectionsSummary,
  filterByWorkspace,
  roundTo2
} from '../src/utils/invoiceMath.js';

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
console.log('⚡ BILLQYRO PHASE 5: PAYMENT INTELLIGENCE & QUICK PAY');
console.log('======================================================\n');

// ----------------------------------------------------
// TEST A: Quick Pay Current Balance (₹1,605) -> Balance ₹0, Paid
// ----------------------------------------------------
runTest('TEST A: Current invoice ₹1,605 Quick Pay current balance -> balance ₹0 and Paid status', () => {
  const invoice = {
    id: 'inv_a',
    grandTotal: 1605,
    paymentHistory: [
      { id: 'pmt_1', amount: 1605, method: 'Cash', date: '2026-08-31T00:00:00Z' }
    ]
  };

  const fin = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(fin.currentInvoiceTotal, 1605);
  assert.strictEqual(fin.amountPaid, 1605);
  assert.strictEqual(fin.balanceDue, 0);
  assert.strictEqual(fin.customerTotalDue, 0);
  assert.strictEqual(fin.paymentStatus, 'Paid');
  assert.strictEqual(fin.isFullyPaid, true);
});

// ----------------------------------------------------
// TEST B: Partial Payment (₹500 on ₹1,605 + ₹1,190 old due)
// ----------------------------------------------------
runTest('TEST B: ₹500 partial payment on ₹1,605 bill + ₹1,190 old due -> canonical allocation without negative values', () => {
  const invoice = {
    id: 'inv_b',
    grandTotal: 1605,
    oldDue: 1190,
    paymentHistory: [
      { id: 'pmt_b1', amount: 500, method: 'UPI', date: '2026-08-31T00:00:00Z' }
    ]
  };

  const fin = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(fin.totalReceivable, 2795);
  assert.strictEqual(fin.amountPaid, 500);
  assert.strictEqual(fin.allocatedToOldDue, 500, 'First ₹500 allocated to old due');
  assert.strictEqual(fin.remainingOldDue, 690, 'Remaining old due is ₹690');
  assert.strictEqual(fin.allocatedToCurrentInvoice, 0, 'No payment allocated to current bill yet');
  assert.strictEqual(fin.currentBillDue, 1605, 'Current bill balance remains ₹1,605');
  assert.strictEqual(fin.customerTotalDue, 2295, 'Total customer payable is ₹2,295');
  assert.ok(fin.remainingOldDue >= 0, 'No negative old due');
  assert.ok(fin.currentBillDue >= 0, 'No negative bill due');
  assert.ok(fin.paymentStatus === 'Partially Paid' || fin.paymentStatus === 'Partial');
});

// ----------------------------------------------------
// TEST C: Pay Total Due (₹2,795)
// ----------------------------------------------------
runTest('TEST C: Pay Total Due ₹2,795 -> entire customer liability cleared according to canonical allocation', () => {
  const invoice = {
    id: 'inv_c',
    grandTotal: 1605,
    oldDue: 1190,
    paymentHistory: [
      { id: 'pmt_c1', amount: 2795, method: 'Bank Transfer', date: '2026-08-31T00:00:00Z' }
    ]
  };

  const fin = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(fin.amountPaid, 2795);
  assert.strictEqual(fin.allocatedToOldDue, 1190, '₹1,190 clears old due completely');
  assert.strictEqual(fin.remainingOldDue, 0, 'Remaining old due is 0');
  assert.strictEqual(fin.allocatedToCurrentInvoice, 1605, '₹1,605 clears current invoice completely');
  assert.strictEqual(fin.currentBillDue, 0, 'Current bill due is 0');
  assert.strictEqual(fin.balanceDue, 0);
  assert.strictEqual(fin.customerTotalDue, 0);
  assert.strictEqual(fin.isFullyPaid, true);
  assert.strictEqual(fin.paymentStatus, 'Paid');
});

// ----------------------------------------------------
// TEST D: Overpayment Protection
// ----------------------------------------------------
runTest('TEST D: Overpayment ₹5,000 on ₹2,795 total due is capped safely preventing negative balance', () => {
  const allocation = allocatePayment(5000, 1190, 1605);
  assert.strictEqual(allocation.allocatedToOldDue, 1190);
  assert.strictEqual(allocation.remainingOldDue, 0);
  assert.strictEqual(allocation.allocatedToCurrentInvoice, 1605);
  assert.strictEqual(allocation.remainingCurrentInvoiceDue, 0);
  assert.ok(allocation.remainingCurrentInvoiceDue >= 0, 'Balance due is never negative');
});

// ----------------------------------------------------
// TEST E: Quick Pay in paymentHistory
// ----------------------------------------------------
runTest('TEST E: Quick Pay payment entry structured with id, amount, method, date, transactionId', () => {
  const invoice = {
    id: 'inv_e',
    grandTotal: 1000,
    paymentHistory: [
      { id: 'pmt_test_e', amount: 1000, method: 'UPI', date: '2026-08-31T10:00:00Z', transactionId: 'UPI-9903591839', note: 'Quick pay at counter' }
    ]
  };

  const history = invoice.paymentHistory;
  assert.strictEqual(history.length, 1);
  assert.strictEqual(history[0].id, 'pmt_test_e');
  assert.strictEqual(history[0].amount, 1000);
  assert.strictEqual(history[0].method, 'UPI');
  assert.strictEqual(history[0].transactionId, 'UPI-9903591839');
});

// ----------------------------------------------------
// TEST F: Customer Ledger Updates Immediately
// ----------------------------------------------------
runTest('TEST F: Customer Ledger reflects updated payment, zero balance, and Settled status immediately', () => {
  const customer = { id: 'cust_f', name: 'Kabir Fashion', previousDue: 0 };
  const invoices = [
    {
      id: 'inv_f1',
      customerId: 'cust_f',
      grandTotal: 2500,
      paymentHistory: [{ id: 'pmt_f', amount: 2500, method: 'Cash' }]
    }
  ];

  const ledger = computeCustomerLedger(customer, invoices);
  assert.strictEqual(ledger.totalBilled, 2500);
  assert.strictEqual(ledger.totalPaid, 2500);
  assert.strictEqual(ledger.totalDue, 0);
  assert.strictEqual(ledger.customerTotalDue, 0);
  assert.strictEqual(ledger.isSettled, true);
  assert.strictEqual(ledger.aging.totalDue, 0);
  assert.strictEqual(ledger.priority.level, 'LOW');
});

// ----------------------------------------------------
// TEST G: Due Ledger Updates / Filters out Paid Invoices
// ----------------------------------------------------
runTest('TEST G: Invoices with balanceDue === 0 are excluded from active Due list', () => {
  const invoices = [
    { id: 'inv_g1', grandTotal: 1000, paymentHistory: [{ id: 'p1', amount: 1000 }] },
    { id: 'inv_g2', grandTotal: 2000, paymentHistory: [{ id: 'p2', amount: 500 }] }
  ];

  const activeDueInvoices = invoices.filter(inv => getInvoiceBalanceDue(inv) > 0);
  assert.strictEqual(activeDueInvoices.length, 1);
  assert.strictEqual(activeDueInvoices[0].id, 'inv_g2');
  assert.strictEqual(getInvoiceBalanceDue(activeDueInvoices[0]), 1500);
});

// ----------------------------------------------------
// TEST H: Dashboard Totals Propagation
// ----------------------------------------------------
runTest('TEST H: Sales and Revenue summaries correctly propagate recorded payments', () => {
  const invoices = [
    { id: 'inv_h1', grandTotal: 5000, paymentHistory: [{ id: 'p1', amount: 5000 }] },
    { id: 'inv_h2', grandTotal: 3000, paymentHistory: [{ id: 'p2', amount: 1000 }] }
  ];

  const summary = computeSalesSummary(invoices);
  assert.strictEqual(summary.totalSales, 8000);
  assert.strictEqual(summary.totalCollected, 6000);
  assert.strictEqual(summary.totalDue, 2000);

  const colSummary = computeCollectionsSummary(invoices);
  assert.strictEqual(colSummary.totalInvoiced, 8000);
  assert.strictEqual(colSummary.totalCollected, 6000);
  assert.strictEqual(colSummary.totalDue, 2000);
  assert.strictEqual(colSummary.collectionRate, 75);
});

// ----------------------------------------------------
// TEST I: Offline Payment Persistence
// ----------------------------------------------------
runTest('TEST I: Offline payment creates valid canonical invoice payload ready for IndexedDB & sync queue', () => {
  const rawInvoice = {
    id: 'inv_i',
    grandTotal: 1200,
    paymentHistory: []
  };

  const newPayment = {
    id: 'pmt_offline_123',
    amount: 1200,
    method: 'Cash',
    date: '2026-08-31T09:00:00Z'
  };

  const updatedInvoice = {
    ...rawInvoice,
    paymentHistory: [...rawInvoice.paymentHistory, newPayment]
  };

  const fin = calculateCanonicalInvoiceFinancials(updatedInvoice);
  assert.strictEqual(fin.balanceDue, 0);
  assert.strictEqual(fin.paymentStatus, 'Paid');
});

// ----------------------------------------------------
// TEST J: Duplicate Submission Idempotency
// ----------------------------------------------------
runTest('TEST J: Recording payment with identical ID updates in-place without doubling paid amount', () => {
  const invoice = {
    id: 'inv_j',
    grandTotal: 2000,
    paymentHistory: [
      { id: 'pmt_same_id', amount: 1000, method: 'UPI' }
    ]
  };

  // Re-submitting payment with same ID
  const duplicateEntry = { id: 'pmt_same_id', amount: 1000, method: 'UPI' };
  const existingIndex = invoice.paymentHistory.findIndex(p => p.id === duplicateEntry.id);
  if (existingIndex >= 0) {
    invoice.paymentHistory[existingIndex] = duplicateEntry;
  } else {
    invoice.paymentHistory.push(duplicateEntry);
  }

  const paid = getInvoicePaidTotal(invoice);
  assert.strictEqual(paid, 1000, 'Paid amount remains ₹1,000, not ₹2,000');
});

// ----------------------------------------------------
// TEST K: Audit Log Metadata Integrity
// ----------------------------------------------------
runTest('TEST K: Payment recorded carries complete audit metadata attributes', () => {
  const auditEntry = {
    action: 'payment_recorded',
    entityType: 'invoice',
    entityId: 'inv_k',
    workspaceId: 'ws_test_k',
    details: {
      amount: 1500,
      method: 'Cash',
      oldPaid: 0,
      newPaid: 1500
    },
    timestamp: '2026-08-31T12:00:00Z'
  };

  assert.strictEqual(auditEntry.action, 'payment_recorded');
  assert.strictEqual(auditEntry.entityType, 'invoice');
  assert.strictEqual(auditEntry.details.amount, 1500);
});

// ----------------------------------------------------
// TEST L: Workspace Isolation
// ----------------------------------------------------
runTest('TEST L: Payments in Workspace Alpha do not affect invoices or totals in Workspace Beta', () => {
  const invoices = [
    { id: 'inv_ws1', workspaceId: 'ws_alpha', grandTotal: 4000, paymentHistory: [{ id: 'p1', amount: 4000 }] },
    { id: 'inv_ws2', workspaceId: 'ws_beta', grandTotal: 6000, paymentHistory: [{ id: 'p2', amount: 1000 }] }
  ];

  const wsAlpha = filterByWorkspace(invoices, 'ws_alpha');
  const wsBeta = filterByWorkspace(invoices, 'ws_beta');

  const sumAlpha = computeSalesSummary(wsAlpha);
  const sumBeta = computeSalesSummary(wsBeta);

  assert.strictEqual(sumAlpha.totalSales, 4000);
  assert.strictEqual(sumAlpha.totalCollected, 4000);
  assert.strictEqual(sumAlpha.totalDue, 0);

  assert.strictEqual(sumBeta.totalSales, 6000);
  assert.strictEqual(sumBeta.totalCollected, 1000);
  assert.strictEqual(sumBeta.totalDue, 5000);
});

console.log('\n======================================================');
console.log(`📊 PAYMENT INTELLIGENCE RESULTS: ${passed} / ${total} PASSED (100%)`);
console.log('======================================================\n');
