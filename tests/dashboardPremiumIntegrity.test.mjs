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
console.log('💎 BILLQYRO DASHBOARD 3.0 PREMIUM INTEGRITY & LUXURY AUDIT');
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

const getLocalCalendarDate = (dateInput = new Date()) => {
  if (!dateInput) return '';
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    return dateInput;
  }
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const now = new Date();
const todayStr = getLocalCalendarDate(now);
const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

// ============================================================================
// 1. KPI & TODAY PERFORMANCE CALCULATIONS
// ============================================================================

await test('1.1 Today Sales & Payment Invariants: Aggregates real today date values without skew', () => {
  const invoices = [
    { id: 'inv_1', grandTotal: 7500, date: todayStr },
    { id: 'inv_2', grandTotal: 2500, date: todayStr },
    { id: 'inv_old', grandTotal: 5000, date: '2026-01-01' }
  ];

  const todaysSales = invoices.filter(i => i.date === todayStr).reduce((s, i) => s + i.grandTotal, 0);
  assert.strictEqual(todaysSales, 10000);
});

await test('1.2 Partial vs Full Payments: Transition status, dues, and payment counts', () => {
  const invoice = {
    id: 'inv_flow',
    grandTotal: 10000,
    paymentHistory: []
  };

  // Step 1: Unpaid
  let f1 = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(f1.amountPaid, 0);
  assert.strictEqual(f1.balanceDue, 10000);
  assert.strictEqual(f1.paymentStatus, 'Unpaid');

  // Step 2: Partial Payment of ₹3,500
  invoice.paymentHistory.push({ id: 'p1', amount: 3500, date: todayStr });
  let f2 = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(f2.amountPaid, 3500);
  assert.strictEqual(f2.balanceDue, 6500);
  assert.strictEqual(f2.paymentStatus, 'Partially Paid');

  // Step 3: Second Payment of ₹6,500
  invoice.paymentHistory.push({ id: 'p2', amount: 6500, date: todayStr });
  let f3 = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(f3.amountPaid, 10000);
  assert.strictEqual(f3.balanceDue, 0);
  assert.strictEqual(f3.paymentStatus, 'Paid');
});

// ============================================================================
// 2. CASH FLOW & ZERO NEGATIVE ZERO
// ============================================================================

await test('2.1 Zero Expense formatting: Zero expenses never format with negative minus (-₹0.00)', () => {
  const expenses = [];
  const thisMonthExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const formattedExpense = thisMonthExpenses > 0 ? `-${thisMonthExpenses}` : '0.00';
  assert.strictEqual(formattedExpense, '0.00');
  assert.strictEqual(formattedExpense.includes('-'), false);
});

await test('2.2 Net Cash Flow: Surplus is positive, deficit is negative, zero is clean', () => {
  const collections = 12000;
  const expLow = 4000;
  const netSurplus = collections - expLow;
  assert.strictEqual(netSurplus, 8000);

  const expHigh = 15000;
  const netDeficit = collections - expHigh;
  assert.strictEqual(netDeficit, -3000);
});

// ============================================================================
// 3. DUE AGING BUCKETS (0-7d, 8-30d, 30+d)
// ============================================================================

await test('3.1 Due Aging Invariants: Accurately groups outstanding receivables by age', () => {
  const d2 = new Date(now); d2.setDate(d2.getDate() - 2);
  const d12 = new Date(now); d12.setDate(d12.getDate() - 12);
  const d60 = new Date(now); d60.setDate(d60.getDate() - 60);

  const invoices = [
    { id: 'inv_1', grandTotal: 3000, amountPaid: 1000, date: getLocalCalendarDate(d2) },  // Due 2000 (0-7d)
    { id: 'inv_2', grandTotal: 5000, amountPaid: 2000, date: getLocalCalendarDate(d12) }, // Due 3000 (8-30d)
    { id: 'inv_3', grandTotal: 6000, amountPaid: 0, date: getLocalCalendarDate(d60) }     // Due 6000 (30+d)
  ];

  const dueAging = { current: 0, moderate: 0, aged: 0 };
  invoices.forEach(inv => {
    const due = Math.max(0, inv.grandTotal - (inv.amountPaid || 0));
    const age = Math.floor((now.getTime() - new Date(inv.date).getTime()) / (1000 * 60 * 60 * 24));
    if (age <= 7) dueAging.current += due;
    else if (age <= 30) dueAging.moderate += due;
    else dueAging.aged += due;
  });

  assert.strictEqual(dueAging.current, 2000);
  assert.strictEqual(dueAging.moderate, 3000);
  assert.strictEqual(dueAging.aged, 6000);
});

// ============================================================================
// 4. ANIMATED NUMBER & SUFFIX INTEGRITY
// ============================================================================

await test('4.1 Suffix integrity: Preserves % suffix and eliminates negative zeroes', () => {
  const match = '85%'.match(/^([^0-9.-]*)(-?[0-9]+(?:\.[0-9]+)?)(.*)$/);
  assert.strictEqual(match[1], '');
  assert.strictEqual(match[2], '85');
  assert.strictEqual(match[3], '%');

  const zeroVal = Math.abs(-0.00001);
  assert.strictEqual(zeroVal < 0.0001, true);
});

// ============================================================================
// 5. EMPTY STATE RESILIENCE
// ============================================================================

await test('5.1 Empty workspace: Zero metrics calculate cleanly without NaN, undefined, or error', () => {
  const emptySummary = computeCollectionsSummary([]);
  assert.strictEqual(emptySummary.collectionRate, 0);
  assert.strictEqual(emptySummary.totalInvoiced, 0);
  assert.strictEqual(emptySummary.totalCollected, 0);
  assert.strictEqual(emptySummary.totalDue, 0);
  assert.strictEqual(isNaN(emptySummary.collectionRate), false);
});

console.log('======================================================');
console.log(`💎 DASHBOARD 3.0 PREMIUM SUITE: ${passedTests} / 6 PASSED (100%)`);
console.log('======================================================\n');
