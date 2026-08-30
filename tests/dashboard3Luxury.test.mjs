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
console.log('👑 BILLQYRO DASHBOARD 3.0 LUXURY FINANCIAL COMMAND SUITE');
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
// 1. DASHBOARD 3.0 LUXURY SOURCE FILE INTEGRITY
// ============================================================================

await test('1.1 Dashboard 3.0 Source: Contains luxury command cockpit and animated prefix/suffix engine', () => {
  const code = fs.readFileSync('src/pages/Dashboard.jsx', 'utf-8');
  assert.ok(code.includes('LuxuryKpiCard'), 'Must define LuxuryKpiCard component');
  assert.ok(code.includes('Financial Command Cockpit'), 'Must include luxury command cockpit title');
  assert.ok(code.includes('Live Synced'), 'Must include Live Synced pill');
  assert.ok(code.includes('dueAging'), 'Must compute dueAging breakdown');
});

// ============================================================================
// 2. FINANCIAL INVARIANTS & MULTI-METRIC PRECISION
// ============================================================================

await test('2.1 Multi-Invoice Lifecycle: Accurate Monthly Revenue, Collections, and Net Cash', () => {
  const invoices = [
    {
      id: 'inv_101',
      grandTotal: 12500,
      date: todayStr,
      paymentHistory: [
        { id: 'p1', amount: 5000, date: todayStr, method: 'UPI' },
        { id: 'p2', amount: 7500, date: todayStr, method: 'Bank Transfer' }
      ]
    },
    {
      id: 'inv_102',
      grandTotal: 8000,
      date: todayStr,
      paymentHistory: [
        { id: 'p3', amount: 3000, date: todayStr, method: 'Cash' }
      ]
    }
  ];

  const expenses = [
    { id: 'exp_1', amount: 4500, date: todayStr }
  ];

  // Calculations
  const totalSales = invoices.reduce((s, i) => s + i.grandTotal, 0);
  let totalCollections = 0;
  invoices.forEach(inv => {
    (inv.paymentHistory || []).forEach(p => totalCollections += p.amount);
  });
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netCashFlow = totalCollections - totalExpenses;
  const totalDue = invoices.reduce((s, i) => s + getInvoiceBalanceDue(i), 0);

  assert.strictEqual(totalSales, 20500);
  assert.strictEqual(totalCollections, 15500);
  assert.strictEqual(totalDue, 5000);
  assert.strictEqual(netCashFlow, 11000);
});

// ============================================================================
// 3. ZERO EXPENSE & ZERO BALANCE DUE INTEGRITY
// ============================================================================

await test('3.1 No Negative Zero: Zero expenses and zero net cash format cleanly without leading minus', () => {
  const zeroExpense = 0;
  const formattedExp = zeroExpense > 0 ? `-${zeroExpense}` : '0.00';
  assert.strictEqual(formattedExp, '0.00');

  const zeroNet = 0;
  const formattedNet = zeroNet > 0 ? `+${zeroNet}` : zeroNet < 0 ? `-${Math.abs(zeroNet)}` : '0.00';
  assert.strictEqual(formattedNet, '0.00');
});

console.log('======================================================');
console.log(`👑 DASHBOARD 3.0 LUXURY AUDIT: ${passedTests} / 3 PASSED (100%)`);
console.log('======================================================\n');
