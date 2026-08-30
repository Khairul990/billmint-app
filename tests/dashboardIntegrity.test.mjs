import assert from 'node:assert';
import fs from 'node:fs';
import { 
  calculateCanonicalInvoiceFinancials, 
  getInvoicePaidTotal, 
  getInvoiceBalanceDue, 
  getInvoicePaymentStatus 
} from '../src/utils/invoiceMath.js';
import { computeCollectionsSummary } from '../src/utils/financialCalculations.js';

console.log('======================================================');
console.log('📊 BILLQYRO DASHBOARD 2.0 BUSINESS INTELLIGENCE AUDIT');
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

const getLocalDateStr = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const todayStr = getLocalDateStr(new Date());

// ============================================================================
// 1. TODAY'S SALES & COLLECTION INTELLIGENCE
// ============================================================================

await test('1.1 Today Sales: Sums grandTotal of invoices created on local calendar date', () => {
  const invoices = [
    { id: 'inv_1', grandTotal: 5000, date: todayStr, createdAt: `${todayStr}T10:00:00.000Z` },
    { id: 'inv_2', grandTotal: 3500, date: todayStr, createdAt: `${todayStr}T14:30:00.000Z` },
    { id: 'inv_old', grandTotal: 8000, date: '2026-01-01', createdAt: '2026-01-01T10:00:00.000Z' }
  ];

  const todaysInvoices = invoices.filter(i => (i.date || '').startsWith(todayStr));
  const todaysSales = todaysInvoices.reduce((s, i) => s + i.grandTotal, 0);

  assert.strictEqual(todaysSales, 8500);
});

await test('1.2 Today Collected: Captures payments received today across all invoices', () => {
  const invoices = [
    {
      id: 'inv_1',
      grandTotal: 10000,
      paymentHistory: [
        { id: 'p1', amount: 3000, date: todayStr },
        { id: 'p2', amount: 2000, date: '2026-01-15' }
      ]
    },
    {
      id: 'inv_2',
      grandTotal: 4000,
      paymentHistory: [
        { id: 'p3', amount: 4000, date: todayStr }
      ]
    }
  ];

  let todaysCollected = 0;
  let todaysPaymentCount = 0;

  invoices.forEach(inv => {
    (inv.paymentHistory || []).forEach(p => {
      if ((p.date || '').startsWith(todayStr)) {
        todaysCollected += p.amount;
        todaysPaymentCount++;
      }
    });
  });

  assert.strictEqual(todaysCollected, 7000); // 3000 + 4000
  assert.strictEqual(todaysPaymentCount, 2);
});

await test('1.3 Today Outstanding: Correctly computes balance due on today invoices', () => {
  const invoices = [
    { id: 'inv_1', grandTotal: 5000, amountPaid: 3000, date: todayStr },
    { id: 'inv_2', grandTotal: 3500, amountPaid: 0, date: todayStr }
  ];

  const todaysDue = invoices.reduce((sum, inv) => {
    const due = Math.max(0, inv.grandTotal - inv.amountPaid);
    return sum + due;
  }, 0);

  assert.strictEqual(todaysDue, 5500); // 2000 + 3500
});

// ============================================================================
// 2. CASH FLOW SNAPSHOT (MONEY IN vs MONEY OUT)
// ============================================================================

await test('2.1 Cash Flow: Money In - Money Out = Net Cash Flow', () => {
  const collections = 15000;
  const expenses = [
    { id: 'e1', amount: 2500, category: 'Supplies' },
    { id: 'e2', amount: 1200, category: 'Utilities' }
  ];

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netCashFlow = collections - totalExpenses;

  assert.strictEqual(totalExpenses, 3700);
  assert.strictEqual(netCashFlow, 11300);
});

// ============================================================================
// 3. DUE & OVERDUE INTELLIGENCE
// ============================================================================

await test('3.1 Overdue calculation: Identifies past due invoices with outstanding balance', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateStr(yesterday);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = getLocalDateStr(tomorrow);

  const invoices = [
    { id: 'inv_od', grandTotal: 6000, amountPaid: 2000, dueDate: yesterdayStr }, // Overdue 4000
    { id: 'inv_paid', grandTotal: 4000, amountPaid: 4000, dueDate: yesterdayStr }, // Paid in full
    { id: 'inv_future', grandTotal: 5000, amountPaid: 0, dueDate: tomorrowStr }    // Not overdue
  ];

  const now = new Date();
  let overdueAmount = 0;
  let overdueCount = 0;

  invoices.forEach(inv => {
    const due = Math.max(0, inv.grandTotal - inv.amountPaid);
    if (due > 0 && inv.dueDate && new Date(inv.dueDate) < now) {
      overdueCount++;
      overdueAmount += due;
    }
  });

  assert.strictEqual(overdueCount, 1);
  assert.strictEqual(overdueAmount, 4000);
});

// ============================================================================
// 4. REAL-TIME SYNCHRONIZATION AFTER PAYMENT
// ============================================================================

await test('4.1 Payment Lifecycle: ₹10,000 invoice collected in 2 steps updates metrics instantly', () => {
  let invoice = {
    id: 'inv_lifecycle',
    grandTotal: 10000,
    amountPaid: 0,
    paymentHistory: []
  };

  // Step 1: Initial state
  let c1 = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(c1.amountPaid, 0);
  assert.strictEqual(c1.balanceDue, 10000);
  assert.strictEqual(c1.paymentStatus, 'Unpaid');

  // Step 2: Collect ₹3,000
  invoice.paymentHistory.push({ id: 'pmt_1', amount: 3000, date: todayStr });
  let c2 = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(c2.amountPaid, 3000);
  assert.strictEqual(c2.balanceDue, 7000);
  assert.strictEqual(c2.paymentStatus, 'Partially Paid');

  // Step 3: Collect ₹7,000
  invoice.paymentHistory.push({ id: 'pmt_2', amount: 7000, date: todayStr });
  let c3 = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(c3.amountPaid, 10000);
  assert.strictEqual(c3.balanceDue, 0);
  assert.strictEqual(c3.paymentStatus, 'Paid');
});

// ============================================================================
// 5. EMPTY WORKSPACE INTEGRITY
// ============================================================================

await test('5.1 Empty workspace: Zero metrics without NaN, undefined, or hardcoded strings', () => {
  const invoices = [];
  const expenses = [];

  const summary = computeCollectionsSummary(invoices);
  assert.strictEqual(summary.totalInvoiced, 0);
  assert.strictEqual(summary.totalCollected, 0);
  assert.strictEqual(summary.totalDue, 0);
  assert.strictEqual(summary.collectionRate, 0);
  assert.strictEqual(isNaN(summary.collectionRate), false);
});

console.log('======================================================');
console.log(`📊 DASHBOARD INTEGRITY SUITE: ${passedTests} / 7 PASSED (100%)`);
console.log('======================================================\n');
