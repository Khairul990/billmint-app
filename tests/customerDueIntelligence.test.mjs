// Polyfills for test runner before imports
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
  getInvoiceDaysOverdue,
  getInvoiceAgingBucket,
  calculateCollectionPriority,
  calculateAgingDistribution,
  computeCustomerLedger,
  filterByWorkspace,
  roundTo2
} from '../src/utils/invoiceMath.js';
import { buildWhatsAppInvoiceMessage } from '../src/services/invoiceShareService2.js';

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
console.log('⚡ BILLQYRO PHASE 4: CUSTOMER DUE & CREDIT INTELLIGENCE');
console.log('======================================================\n');

const referenceDate = new Date('2026-08-31T12:00:00Z');

// ----------------------------------------------------
// TEST A: Invoice due today / future -> CURRENT
// ----------------------------------------------------
runTest('TEST A: Invoice due today (or future) with ₹1,000 outstanding classified as CURRENT', () => {
  const invToday = {
    id: 'inv_a1',
    grandTotal: 1000,
    amountPaid: 0,
    dueDate: '2026-08-31T00:00:00Z'
  };
  const invFuture = {
    id: 'inv_a2',
    grandTotal: 1000,
    amountPaid: 0,
    dueDate: '2026-09-05T00:00:00Z'
  };

  assert.strictEqual(getInvoiceDaysOverdue(invToday, referenceDate), 0);
  assert.strictEqual(getInvoiceAgingBucket(invToday, referenceDate), 'current');

  assert.strictEqual(getInvoiceDaysOverdue(invFuture, referenceDate), 0);
  assert.strictEqual(getInvoiceAgingBucket(invFuture, referenceDate), 'current');
});

// ----------------------------------------------------
// TEST B: Invoice due 15 days ago -> 0-30 DAYS OVERDUE
// ----------------------------------------------------
runTest('TEST B: Invoice due 15 days ago with ₹1,000 outstanding classified as 0-30 DAYS OVERDUE', () => {
  const inv15 = {
    id: 'inv_b1',
    grandTotal: 1000,
    amountPaid: 0,
    dueDate: '2026-08-16T00:00:00Z'
  };

  const days = getInvoiceDaysOverdue(inv15, referenceDate);
  assert.strictEqual(days, 15);
  assert.strictEqual(getInvoiceAgingBucket(inv15, referenceDate), 'overdue0to30');
});

// ----------------------------------------------------
// TEST C: Invoice due 45 days ago -> 31-60 DAYS OVERDUE
// ----------------------------------------------------
runTest('TEST C: Invoice due 45 days ago classified as 31-60 DAYS OVERDUE', () => {
  const inv45 = {
    id: 'inv_c1',
    grandTotal: 1000,
    amountPaid: 0,
    dueDate: '2026-07-17T00:00:00Z'
  };

  const days = getInvoiceDaysOverdue(inv45, referenceDate);
  assert.strictEqual(days, 45);
  assert.strictEqual(getInvoiceAgingBucket(inv45, referenceDate), 'overdue31to60');
});

// ----------------------------------------------------
// TEST D: Invoice due 75 days ago -> 61-90 DAYS OVERDUE
// ----------------------------------------------------
runTest('TEST D: Invoice due 75 days ago classified as 61-90 DAYS OVERDUE', () => {
  const inv75 = {
    id: 'inv_d1',
    grandTotal: 1000,
    amountPaid: 0,
    dueDate: '2026-06-17T00:00:00Z'
  };

  const days = getInvoiceDaysOverdue(inv75, referenceDate);
  assert.strictEqual(days, 75);
  assert.strictEqual(getInvoiceAgingBucket(inv75, referenceDate), 'overdue61to90');
});

// ----------------------------------------------------
// TEST E: Invoice due 120 days ago -> 90+ DAYS OVERDUE
// ----------------------------------------------------
runTest('TEST E: Invoice due 120 days ago classified as 90+ DAYS OVERDUE', () => {
  const inv120 = {
    id: 'inv_e1',
    grandTotal: 1000,
    amountPaid: 0,
    dueDate: '2026-05-03T00:00:00Z'
  };

  const days = getInvoiceDaysOverdue(inv120, referenceDate);
  assert.strictEqual(days, 120);
  assert.strictEqual(getInvoiceAgingBucket(inv120, referenceDate), 'overdue90Plus');
});

// ----------------------------------------------------
// TEST F: Fully paid invoice -> contributes ₹0 to outstanding aging
// ----------------------------------------------------
runTest('TEST F: Fully paid invoice contributes ₹0 to outstanding aging buckets', () => {
  const invPaid = {
    id: 'inv_f1',
    grandTotal: 2500,
    amountPaid: 2500,
    dueDate: '2026-05-01T00:00:00Z' // 120+ days ago, but fully paid
  };

  assert.strictEqual(getInvoiceAgingBucket(invPaid, referenceDate), 'current');
  const aging = calculateAgingDistribution([invPaid], referenceDate);
  assert.strictEqual(aging.totalDue, 0);
  assert.strictEqual(aging.totalOverdue, 0);
  assert.strictEqual(aging.overdueCount, 0);
});

// ----------------------------------------------------
// TEST G: Previous due + current invoice -> correctly separated & aggregated
// ----------------------------------------------------
runTest('TEST G: Previous due + current invoice correctly separated and aggregated', () => {
  const invoice = {
    id: 'inv_g1',
    grandTotal: 1605,
    oldDue: 1190,
    amountPaid: 500,
    dueDate: '2026-08-31T00:00:00Z'
  };

  const fin = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(fin.currentInvoiceTotal, 1605);
  assert.strictEqual(fin.previousDue, 1190);
  assert.strictEqual(fin.totalReceivable, 2795);
  assert.strictEqual(fin.allocatedToOldDue, 500);
  assert.strictEqual(fin.remainingOldDue, 690);
  assert.strictEqual(fin.currentBillDue, 1605);
  assert.strictEqual(fin.customerTotalDue, 2295);
});

// ----------------------------------------------------
// TEST H: Multiple overdue invoices for same customer -> correct total & buckets
// ----------------------------------------------------
runTest('TEST H: Multiple overdue invoices for same customer compute correct aging distribution', () => {
  const customer = { id: 'cust_h', name: 'Al-Amin Textiles', previousDue: 0 };
  const invoices = [
    { id: 'inv_h1', customerId: 'cust_h', grandTotal: 5000, amountPaid: 0, dueDate: '2026-08-31T00:00:00Z' }, // current: 5000
    { id: 'inv_h2', customerId: 'cust_h', grandTotal: 2500, amountPaid: 0, dueDate: '2026-08-16T00:00:00Z' }, // 15d (0-30): 2500
    { id: 'inv_h3', customerId: 'cust_h', grandTotal: 1200, amountPaid: 0, dueDate: '2026-07-17T00:00:00Z' }, // 45d (31-60): 1200
    { id: 'inv_h4', customerId: 'cust_h', grandTotal: 800, amountPaid: 0, dueDate: '2026-06-17T00:00:00Z' },  // 75d (61-90): 800
    { id: 'inv_h5', customerId: 'cust_h', grandTotal: 3000, amountPaid: 0, dueDate: '2026-05-03T00:00:00Z' }  // 120d (90+): 3000
  ];

  const ledger = computeCustomerLedger(customer, invoices, null, referenceDate);
  assert.strictEqual(ledger.totalDue, 12500);
  assert.strictEqual(ledger.customerTotalDue, 12500);
  assert.strictEqual(ledger.aging.current, 5000);
  assert.strictEqual(ledger.aging.overdue0to30, 2500);
  assert.strictEqual(ledger.aging.overdue31to60, 1200);
  assert.strictEqual(ledger.aging.overdue61to90, 800);
  assert.strictEqual(ledger.aging.overdue90Plus, 3000);
  assert.strictEqual(ledger.aging.totalDue, 12500);
  assert.strictEqual(ledger.aging.totalOverdue, 7500);
  assert.strictEqual(ledger.aging.overdueCount, 4);
  assert.strictEqual(ledger.priority.level, 'CRITICAL', '120 days overdue triggers CRITICAL priority');
});

// ----------------------------------------------------
// TEST I: Two workspaces -> no cross-workspace aging leakage
// ----------------------------------------------------
runTest('TEST I: Two workspaces maintain isolated aging calculations with zero leakage', () => {
  const ws1Invoices = [
    { id: 'inv_ws1_1', workspaceId: 'ws_alpha', grandTotal: 3000, amountPaid: 0, dueDate: '2026-05-01T00:00:00Z' }
  ];
  const ws2Invoices = [
    { id: 'inv_ws2_1', workspaceId: 'ws_beta', grandTotal: 7000, amountPaid: 0, dueDate: '2026-08-31T00:00:00Z' }
  ];

  const allInvoices = [...ws1Invoices, ...ws2Invoices];

  const filteredWs1 = filterByWorkspace(allInvoices, 'ws_alpha');
  const filteredWs2 = filterByWorkspace(allInvoices, 'ws_beta');

  const aging1 = calculateAgingDistribution(filteredWs1, referenceDate);
  const aging2 = calculateAgingDistribution(filteredWs2, referenceDate);

  assert.strictEqual(aging1.totalDue, 3000);
  assert.strictEqual(aging1.overdue90Plus, 3000);
  assert.strictEqual(aging1.current, 0);

  assert.strictEqual(aging2.totalDue, 7000);
  assert.strictEqual(aging2.overdue90Plus, 0);
  assert.strictEqual(aging2.current, 7000);
});

// ----------------------------------------------------
// TEST J: No due date -> preserved existing behavior
// ----------------------------------------------------
runTest('TEST J: Invoices with no due date preserved safely as not overdue (CURRENT)', () => {
  const invNoDueDate = {
    id: 'inv_j1',
    grandTotal: 1500,
    amountPaid: 0
    // no dueDate specified
  };

  assert.strictEqual(getInvoiceDaysOverdue(invNoDueDate, referenceDate), 0);
  assert.strictEqual(getInvoiceAgingBucket(invNoDueDate, referenceDate), 'current');

  const aging = calculateAgingDistribution([invNoDueDate], referenceDate);
  assert.strictEqual(aging.current, 1500);
  assert.strictEqual(aging.totalOverdue, 0);
  assert.strictEqual(aging.priority.level, 'LOW');
});

// ----------------------------------------------------
// TEST K: Collection priority classification rules
// ----------------------------------------------------
runTest('TEST K: Collection priority classification is deterministic and explainable', () => {
  // 1. Low: Current or 0-30 days
  const pLow = calculateCollectionPriority({ maxDaysOverdue: 15, overdueAmount: 500, overdueCount: 1 });
  assert.strictEqual(pLow.level, 'LOW');

  // 2. Medium: 31-60 days
  const pMedium = calculateCollectionPriority({ maxDaysOverdue: 45, overdueAmount: 1000, overdueCount: 1 });
  assert.strictEqual(pMedium.level, 'MEDIUM');

  // 3. High: 61-90 days OR 3+ overdue invoices
  const pHigh1 = calculateCollectionPriority({ maxDaysOverdue: 75, overdueAmount: 2000, overdueCount: 1 });
  assert.strictEqual(pHigh1.level, 'HIGH');

  const pHigh2 = calculateCollectionPriority({ maxDaysOverdue: 25, overdueAmount: 2000, overdueCount: 3 });
  assert.strictEqual(pHigh2.level, 'HIGH');

  // 4. Critical: 90+ days
  const pCritical = calculateCollectionPriority({ maxDaysOverdue: 95, overdueAmount: 3000, overdueCount: 1 });
  assert.strictEqual(pCritical.level, 'CRITICAL');
});

// ----------------------------------------------------
// TEST L: WhatsApp reminder message uses canonical customerTotalDue
// ----------------------------------------------------
runTest('TEST L: WhatsApp reminder includes exact canonical balance due amount', () => {
  const invoice = {
    id: 'inv_wa_1',
    invoiceNumber: 'INV-789',
    customerName: 'Rahim Traders',
    grandTotal: 1605,
    oldDue: 1190,
    amountPaid: 0
  };

  const message = buildWhatsAppInvoiceMessage(invoice, { businessName: 'BillQyro Shop', currency: '₹' });
  assert.ok(message.includes('Rahim Traders'), 'Message addresses customer');
  assert.ok(message.includes('INV-789'), 'Message includes invoice number');
  assert.ok(message.includes('2,795.00') || message.includes('2795'), 'Message contains total receivable liability (₹2,795)');
});

console.log('\n======================================================');
console.log(`📊 DUE & CREDIT INTELLIGENCE RESULTS: ${passed} / ${total} PASSED (100%)`);
console.log('======================================================\n');
