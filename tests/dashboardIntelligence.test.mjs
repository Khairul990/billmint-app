// Polyfills for Node.js test environment before evaluation
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
  getInvoicePaidTotal,
  getInvoiceBalanceDue,
  getInvoicePaymentStatus,
  calculateAgingDistribution,
  calculateCollectionPriority,
  filterByWorkspace,
  roundTo2
} from '../src/utils/invoiceMath.js';
import { formatCurrency } from '../src/utils/invoiceUtils.js';

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

console.log('\n======================================================');
console.log('⚡ BILLQYRO PHASE 6: ADVANCED DASHBOARD INTELLIGENCE');
console.log('======================================================\n');

const now = new Date();
const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

// Helper to compute metrics mirroring Dashboard logic
function computeDashboardMetrics(invoices = [], expenses = [], activeWsId = null) {
  const scopedInvoices = activeWsId ? filterByWorkspace(invoices, activeWsId) : invoices;
  const activeInvoices = scopedInvoices.filter(inv => !inv.isDeleted && inv.status !== 'Cancelled' && inv.status !== 'Void');
  
  let totalRevenue = 0;
  let totalCollected = 0;
  let totalOutstanding = 0;
  let thisMonthRevenue = 0;
  let thisMonthCollected = 0;
  let overdueAmount = 0;
  let overdueCount = 0;
  let dueTodayAmount = 0;
  let dueTodayCount = 0;

  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  activeInvoices.forEach(inv => {
    const total = roundTo2(parseFloat(inv.grandTotal || inv.total) || 0);
    const paid = getInvoicePaidTotal(inv);
    const due = getInvoiceBalanceDue(inv);
    const dateStr = inv.date || inv.createdAt || '';

    totalRevenue += total;
    totalCollected += paid;
    totalOutstanding += due;

    if (dateStr.startsWith(currentMonthPrefix)) {
      thisMonthRevenue += total;
    }

    const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
    if (due > 0 && dueDate && !isNaN(dueDate.getTime()) && dueDate < now) {
      overdueCount++;
      overdueAmount += due;
    }

    if (inv.dueDate && inv.dueDate.startsWith(todayStr) && due > 0) {
      dueTodayCount++;
      dueTodayAmount += due;
    }

    if (Array.isArray(inv.paymentHistory)) {
      inv.paymentHistory.forEach(p => {
        const pAmt = roundTo2(parseFloat(p.amount) || 0);
        const pDate = p.date || dateStr;
        if (pDate.startsWith(currentMonthPrefix)) {
          thisMonthCollected += pAmt;
        }
      });
    } else if (paid > 0 && dateStr.startsWith(currentMonthPrefix)) {
      thisMonthCollected += paid;
    }
  });

  const collectionRate = totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0;
  const aging = calculateAgingDistribution(activeInvoices);

  // Top debtor
  const customerMap = new Map();
  activeInvoices.forEach(inv => {
    const due = getInvoiceBalanceDue(inv);
    if (due > 0) {
      const cName = inv.customerName || inv.customer?.name || 'Walk-in';
      const current = customerMap.get(cName) || { name: cName, totalDue: 0 };
      current.totalDue = roundTo2(current.totalDue + due);
      customerMap.set(cName, current);
    }
  });
  const topCustomer = Array.from(customerMap.values()).sort((a, b) => b.totalDue - a.totalDue)[0] || null;

  return {
    totalRevenue: roundTo2(totalRevenue),
    totalCollected: roundTo2(totalCollected),
    totalOutstanding: roundTo2(totalOutstanding),
    thisMonthRevenue: roundTo2(thisMonthRevenue),
    thisMonthCollected: roundTo2(thisMonthCollected),
    collectionRate,
    overdueAmount: roundTo2(overdueAmount),
    overdueCount,
    dueTodayCount,
    dueTodayAmount: roundTo2(dueTodayAmount),
    aging,
    topCustomer,
    invoiceCount: activeInvoices.length
  };
}

// ----------------------------------------------------
// TEST A: Current Month Revenue Calculation
// ----------------------------------------------------
runTest('TEST A: Current month revenue calculates accurately', () => {
  const invoices = [
    { id: 'inv_1', grandTotal: 5000, date: `${currentMonthPrefix}-05` },
    { id: 'inv_2', grandTotal: 3000, date: `${currentMonthPrefix}-10` },
    { id: 'inv_old', grandTotal: 4000, date: '2025-01-15' }
  ];

  const m = computeDashboardMetrics(invoices);
  assert.strictEqual(m.thisMonthRevenue, 8000);
  assert.strictEqual(m.totalRevenue, 12000);
});

// ----------------------------------------------------
// TEST B: Collected Amount Matches Payment Records
// ----------------------------------------------------
runTest('TEST B: Collected amount strictly matches payment history sum', () => {
  const invoices = [
    {
      id: 'inv_b1',
      grandTotal: 5000,
      paymentHistory: [
        { id: 'p1', amount: 2000, date: `${currentMonthPrefix}-01` },
        { id: 'p2', amount: 1500, date: `${currentMonthPrefix}-02` }
      ]
    }
  ];

  const m = computeDashboardMetrics(invoices);
  assert.strictEqual(m.totalCollected, 3500);
  assert.strictEqual(m.thisMonthCollected, 3500);
  assert.strictEqual(m.totalOutstanding, 1500);
});

// ----------------------------------------------------
// TEST C: Outstanding Matches Canonical Due
// ----------------------------------------------------
runTest('TEST C: Total Outstanding matches totalRevenue - totalCollected', () => {
  const invoices = [
    { id: 'inv_c1', grandTotal: 1605, paymentHistory: [{ id: 'p1', amount: 500 }] },
    { id: 'inv_c2', grandTotal: 2000, paymentHistory: [] }
  ];

  const m = computeDashboardMetrics(invoices);
  assert.strictEqual(m.totalRevenue, 3605);
  assert.strictEqual(m.totalCollected, 500);
  assert.strictEqual(m.totalOutstanding, 3105);
});

// ----------------------------------------------------
// TEST D: Collection Rate Calculation
// ----------------------------------------------------
runTest('TEST D: Collection rate computes accurate percentage and handles zero without error', () => {
  const invoices = [
    { id: 'inv_d1', grandTotal: 10000, paymentHistory: [{ id: 'p1', amount: 7500 }] }
  ];

  const m = computeDashboardMetrics(invoices);
  assert.strictEqual(m.collectionRate, 75);

  const emptyMetrics = computeDashboardMetrics([]);
  assert.strictEqual(emptyMetrics.collectionRate, 0);
});

// ----------------------------------------------------
// TEST E: Previous Due Inclusion
// ----------------------------------------------------
runTest('TEST E: Canonical invoice calculation accurately tracks old due and current bill due', () => {
  const invoice = {
    id: 'inv_e',
    grandTotal: 1605,
    oldDue: 1190,
    paymentHistory: [{ id: 'p1', amount: 1190 }]
  };

  const fin = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(fin.allocatedToOldDue, 1190);
  assert.strictEqual(fin.remainingOldDue, 0);
  assert.strictEqual(fin.currentBillDue, 1605);
  assert.strictEqual(fin.customerTotalDue, 1605);
});

// ----------------------------------------------------
// TEST F: Overdue Amount Uses Phase 4 Aging Engine
// ----------------------------------------------------
runTest('TEST F: Overdue invoices accurately categorized in aging distribution', () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 45);

  const invoices = [
    { id: 'inv_f1', grandTotal: 2500, dueDate: pastDate.toISOString(), paymentHistory: [] }
  ];

  const m = computeDashboardMetrics(invoices);
  assert.strictEqual(m.overdueCount, 1);
  assert.strictEqual(m.overdueAmount, 2500);
  assert.strictEqual(m.aging.overdue31to60, 2500);
});

// ----------------------------------------------------
// TEST G: Needs Attention Appears for Overdue Invoices
// ----------------------------------------------------
runTest('TEST G: Needs Attention triggers when overdue invoices exist', () => {
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 10);

  const invoices = [
    { id: 'inv_g', grandTotal: 4500, dueDate: pastDate.toISOString() }
  ];

  const m = computeDashboardMetrics(invoices);
  const needsAttention = m.overdueCount > 0;
  assert.strictEqual(needsAttention, true);
});

// ----------------------------------------------------
// TEST H: Needs Attention Is Clean When Zero Overdues
// ----------------------------------------------------
runTest('TEST H: Needs Attention shows all clear when no dues are overdue', () => {
  const invoices = [
    { id: 'inv_h', grandTotal: 2000, paymentHistory: [{ id: 'p1', amount: 2000 }] }
  ];

  const m = computeDashboardMetrics(invoices);
  const needsAttention = m.overdueCount > 0;
  assert.strictEqual(needsAttention, false);
  assert.strictEqual(m.overdueCount, 0);
});

// ----------------------------------------------------
// TEST I: Top Outstanding Customer Is Correct
// ----------------------------------------------------
runTest('TEST I: Top outstanding customer identifies the highest debtor', () => {
  const invoices = [
    { id: 'inv_i1', customerName: 'Alice Fabrics', grandTotal: 1000 },
    { id: 'inv_i2', customerName: 'Bapi Da', grandTotal: 2795 },
    { id: 'inv_i3', customerName: 'Zahir Textile', grandTotal: 1500 }
  ];

  const m = computeDashboardMetrics(invoices);
  assert.ok(m.topCustomer !== null);
  assert.strictEqual(m.topCustomer.name, 'Bapi Da');
  assert.strictEqual(m.topCustomer.totalDue, 2795);
});

// ----------------------------------------------------
// TEST J: Workspace Isolation
// ----------------------------------------------------
runTest('TEST J: Workspace Alpha metrics do not include Workspace Beta records', () => {
  const invoices = [
    { id: 'inv_ws1', workspaceId: 'ws_a', grandTotal: 10000, date: `${currentMonthPrefix}-01` },
    { id: 'inv_ws2', workspaceId: 'ws_b', grandTotal: 20000, date: `${currentMonthPrefix}-01` }
  ];

  const mA = computeDashboardMetrics(invoices, [], 'ws_a');
  const mB = computeDashboardMetrics(invoices, [], 'ws_b');

  assert.strictEqual(mA.totalRevenue, 10000);
  assert.strictEqual(mB.totalRevenue, 20000);
});

// ----------------------------------------------------
// TEST K: Offline Local Data Drives Dashboard
// ----------------------------------------------------
runTest('TEST K: Local offline invoices evaluate synchronously without network dependency', () => {
  const localInvoices = [
    { id: 'inv_off1', grandTotal: 3000, paymentHistory: [{ id: 'p1', amount: 1000 }] }
  ];

  const m = computeDashboardMetrics(localInvoices);
  assert.strictEqual(m.totalRevenue, 3000);
  assert.strictEqual(m.totalCollected, 1000);
  assert.strictEqual(m.totalOutstanding, 2000);
});

// ----------------------------------------------------
// TEST L: Recording Payment Updates Figures Immediately
// ----------------------------------------------------
runTest('TEST L: Adding a payment entry dynamically updates totalCollected and collectionRate', () => {
  const invoice = { id: 'inv_l', grandTotal: 4000, paymentHistory: [] };
  const initial = computeDashboardMetrics([invoice]);
  assert.strictEqual(initial.totalCollected, 0);
  assert.strictEqual(initial.collectionRate, 0);

  const updatedInvoice = {
    ...invoice,
    paymentHistory: [{ id: 'p_new', amount: 4000 }]
  };
  const updated = computeDashboardMetrics([updatedInvoice]);
  assert.strictEqual(updated.totalCollected, 4000);
  assert.strictEqual(updated.totalOutstanding, 0);
  assert.strictEqual(updated.collectionRate, 100);
});

// ----------------------------------------------------
// TEST M: Creating Invoice Updates Dashboard Activity
// ----------------------------------------------------
runTest('TEST M: Adding new invoice increments invoiceCount and totalRevenue', () => {
  const invoices = [{ id: 'inv_m1', grandTotal: 2000 }];
  const m1 = computeDashboardMetrics(invoices);
  assert.strictEqual(m1.invoiceCount, 1);

  invoices.push({ id: 'inv_m2', grandTotal: 3500 });
  const m2 = computeDashboardMetrics(invoices);
  assert.strictEqual(m2.invoiceCount, 2);
  assert.strictEqual(m2.totalRevenue, 5500);
});

// ----------------------------------------------------
// TEST N: Currency and Regional Localization
// ----------------------------------------------------
runTest('TEST N: Currency formatter respects custom symbols without hardcoded rupee', () => {
  assert.strictEqual(formatCurrency(2795, '$'), '$2,795.00');
  assert.strictEqual(formatCurrency(2795, '€'), '€2,795.00');
  assert.strictEqual(formatCurrency(2795, '৳'), '৳2,795.00');
  assert.strictEqual(formatCurrency(2795, '₹'), '₹2,795.00');
});

// ----------------------------------------------------
// TEST O: Zero-Data Clean Handling
// ----------------------------------------------------
runTest('TEST O: Zero-data dashboard handles empty states without NaN or Infinity', () => {
  const m = computeDashboardMetrics([]);
  assert.strictEqual(m.totalRevenue, 0);
  assert.strictEqual(m.totalCollected, 0);
  assert.strictEqual(m.totalOutstanding, 0);
  assert.strictEqual(m.collectionRate, 0);
  assert.strictEqual(isNaN(m.collectionRate), false);
  assert.strictEqual(isFinite(m.collectionRate), true);
});

// ----------------------------------------------------
// TEST P: Recent Invoices Quick Pay Compatibility
// ----------------------------------------------------
runTest('TEST P: Unpaid and partially paid invoices present actionable balance for Quick Pay', () => {
  const invoice = { id: 'inv_p', grandTotal: 1605, paymentHistory: [{ id: 'p1', amount: 500 }] };
  const balance = getInvoiceBalanceDue(invoice);
  assert.strictEqual(balance, 1105);
  assert.ok(balance > 0, 'Quick Pay action is enabled');
});

console.log('\n======================================================');
console.log(`📊 ADVANCED DASHBOARD RESULTS: ${passed} / ${total} PASSED (100%)`);
console.log('======================================================\n');
