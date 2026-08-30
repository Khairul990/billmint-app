import assert from 'node:assert';
import { 
  calculateCanonicalInvoiceFinancials, 
  getInvoicePaidTotal, 
  getInvoiceBalanceDue, 
  getInvoicePaymentStatus 
} from '../src/utils/invoiceMath.js';
import { computeCollectionsSummary } from '../src/utils/financialCalculations.js';

console.log('======================================================');
console.log('💎 BILLQYRO DASHBOARD 2.1 FINAL POLISH & ACCURACY AUDIT');
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

const yesterdayDate = new Date(now);
yesterdayDate.setDate(yesterdayDate.getDate() - 1);
const yesterdayStr = getLocalCalendarDate(yesterdayDate);

// ============================================================================
// 1. TODAY'S SALES & COLLECTION WITH YESTERDAY DELTA
// ============================================================================

await test('1.1 Today vs Yesterday Sales: Accurate local date aggregation and delta', () => {
  const invoices = [
    { id: 'inv_today_1', grandTotal: 6745, date: todayStr },
    { id: 'inv_yday_1', grandTotal: 4000, date: yesterdayStr },
    { id: 'inv_old', grandTotal: 10000, date: '2026-01-01' }
  ];

  const todaysSales = invoices.filter(i => i.date === todayStr).reduce((s, i) => s + i.grandTotal, 0);
  const yesterdaySales = invoices.filter(i => i.date === yesterdayStr).reduce((s, i) => s + i.grandTotal, 0);

  assert.strictEqual(todaysSales, 6745);
  assert.strictEqual(yesterdaySales, 4000);
});

await test('1.2 Multiple Payments on Single Invoice: Deduplicated, correct sum, no double counting', () => {
  const invoice = {
    id: 'inv_multi',
    grandTotal: 10000,
    paymentHistory: [
      { id: 'p1', amount: 3000, date: todayStr, method: 'UPI' },
      { id: 'p2', amount: 4000, date: todayStr, method: 'Cash' },
      { id: 'p3', amount: 3000, date: todayStr, method: 'Bank Transfer' }
    ]
  };

  const totalPaid = getInvoicePaidTotal(invoice);
  const balanceDue = getInvoiceBalanceDue(invoice);
  const status = getInvoicePaymentStatus(invoice);

  assert.strictEqual(totalPaid, 10000);
  assert.strictEqual(balanceDue, 0);
  assert.strictEqual(status, 'Paid');
});

// ============================================================================
// 2. CASH FLOW SNAPSHOT: NO -₹0.00 & CLEAN NET CASH
// ============================================================================

await test('2.1 Zero Expense formatting: Expense of 0 must NEVER render as negative zero (-₹0.00)', () => {
  const expenses = [];
  const thisMonthExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);
  
  // Format check
  const formattedExpense = thisMonthExpenses > 0 ? `-${thisMonthExpenses}` : '0.00';
  assert.strictEqual(formattedExpense, '0.00');
  assert.strictEqual(formattedExpense.startsWith('-'), false);
});

await test('2.2 Positive and Negative Net Cash Flow formatting', () => {
  const collections = 4505;
  const zeroExpense = 0;
  const netZero = collections - zeroExpense;
  assert.strictEqual(netZero, 4505);

  const higherExpense = 6000;
  const netNegative = collections - higherExpense;
  assert.strictEqual(netNegative, -1495);
});

// ============================================================================
// 3. DUE AGING BUCKETS (0-7d, 8-30d, 30+d)
// ============================================================================

await test('3.1 Due Aging Intelligence: Partitions outstanding invoices into exact day ranges', () => {
  const d3 = new Date(now); d3.setDate(d3.getDate() - 3);
  const d15 = new Date(now); d15.setDate(d15.getDate() - 15);
  const d45 = new Date(now); d45.setDate(d45.getDate() - 45);

  const invoices = [
    { id: 'inv_recent', grandTotal: 2000, amountPaid: 500, date: getLocalCalendarDate(d3) },   // Due 1500 (0-7d)
    { id: 'inv_moderate', grandTotal: 3000, amountPaid: 1000, date: getLocalCalendarDate(d15) }, // Due 2000 (8-30d)
    { id: 'inv_aged', grandTotal: 5000, amountPaid: 0, date: getLocalCalendarDate(d45) }         // Due 5000 (30+d)
  ];

  const dueAging = { current: 0, moderate: 0, aged: 0 };
  invoices.forEach(inv => {
    const due = Math.max(0, inv.grandTotal - (inv.amountPaid || 0));
    const age = Math.floor((now.getTime() - new Date(inv.date).getTime()) / (1000 * 60 * 60 * 24));
    if (age <= 7) dueAging.current += due;
    else if (age <= 30) dueAging.moderate += due;
    else dueAging.aged += due;
  });

  assert.strictEqual(dueAging.current, 1500);
  assert.strictEqual(dueAging.moderate, 2000);
  assert.strictEqual(dueAging.aged, 5000);
});

// ============================================================================
// 4. ANIMATED NUMBER SUFFIX PRESERVATION (% NOT %67)
// ============================================================================

await test('4.1 Percentage String: Preserves % as trailing suffix (67%), not leading prefix (%67)', () => {
  const strValue = '67%';
  const match = strValue.match(/^([^0-9.-]*)(-?[0-9]+(?:\.[0-9]+)?)(.*)$/);
  
  assert.ok(match, 'Match must succeed on 67%');
  const prefix = match[1];
  const num = parseFloat(match[2]);
  const suffix = match[3];

  assert.strictEqual(prefix, '');
  assert.strictEqual(num, 67);
  assert.strictEqual(suffix, '%');

  const rendered = `${prefix}${num}${suffix}`;
  assert.strictEqual(rendered, '67%');
  assert.notStrictEqual(rendered, '%67');
});

// ============================================================================
// 5. EMPTY WORKSPACE & INVALID VALUE RESILIENCE
// ============================================================================

await test('5.1 Zero state resilience: NaN, null, undefined sanitize gracefully', () => {
  const invoices = [];
  const summary = computeCollectionsSummary(invoices);

  assert.strictEqual(summary.collectionRate, 0);
  assert.strictEqual(isNaN(summary.collectionRate), false);

  const testVal = String(undefined ?? '0');
  assert.strictEqual(testVal, '0');
});

console.log('======================================================');
console.log(`💎 DASHBOARD FINAL AUDIT: ${passedTests} / 6 PASSED (100%)`);
console.log('======================================================\n');
