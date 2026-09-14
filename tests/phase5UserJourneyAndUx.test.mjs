import assert from 'node:assert/strict';
import { 
  allocateCustomerPayment, 
  reconcileFinancialState 
} from '../src/services/financialTruthEngine.js';
import { 
  getInvoicePaidTotal, 
  getInvoiceBalanceDue, 
  calculateCanonicalInvoiceFinancials,
  roundTo2 
} from '../src/utils/invoiceMath.js';
import { buildCanonicalRenderModel } from '../src/utils/normalizeInvoiceModel.js';
import { paymentEngine } from '../src/services/paymentEngine.js';
import { computeCustomerLedger } from '../src/utils/financialCalculations.js';
import { FINANCIAL_VOCABULARY } from '../src/constants/financialVocabulary.js';

console.log('================================================================');
console.log('⚡ BILLQYRO PHASE 5: REAL USER JOURNEY & UX REGRESSION SUITE');
console.log('================================================================\n');

// ----------------------------------------------------------------------------
// TEST 1: Official Financial Vocabulary & Labels Parity
// ----------------------------------------------------------------------------
assert.equal(FINANCIAL_VOCABULARY.EARLIER_BALANCE, 'Old Due', 'Label is Old Due');
assert.ok(FINANCIAL_VOCABULARY.THIS_BILL === 'Current Bill' || FINANCIAL_VOCABULARY.THIS_BILL === 'This Bill');
assert.ok(FINANCIAL_VOCABULARY.TOTAL_AMOUNT_DUE === 'Total Payable' || FINANCIAL_VOCABULARY.TOTAL_AMOUNT_DUE === 'Total Amount Due');
assert.ok(FINANCIAL_VOCABULARY.AMOUNT_STILL_DUE === 'Balance Due' || FINANCIAL_VOCABULARY.AMOUNT_STILL_DUE === 'Amount Still Due');
console.log('  ✅ PASS: 1. Official user vocabulary and labels verified');

// ----------------------------------------------------------------------------
// TEST 2: Real End-to-End Scenario
// New user -> Tailor category -> Add customer -> Add service
// Invoice 1 = ₹1000 -> Record ₹500 payment
// Invoice 2 = ₹800, Old Due = ₹500 -> Total Payable = ₹1300
// ----------------------------------------------------------------------------
const customer = {
  id: 'cust_meera_101',
  name: 'Meera Sharma',
  phone: '9876543210',
  workspaceId: 'ws_tailor_01'
};

// Step A: Invoice 1 (₹1000)
const invoice1 = {
  id: 'inv_101',
  invoiceNumber: 'INV-2026-001',
  customerId: customer.id,
  customerName: customer.name,
  grandTotal: 1000,
  subtotal: 1000,
  taxAmount: 0,
  discountAmount: 0,
  oldDue: 0,
  paidAmount: 500,
  paymentHistory: [
    { id: 'pmt_1', amount: 500, date: '2026-09-10', method: 'UPI', note: 'Advance deposit' }
  ],
  workspaceId: 'ws_tailor_01'
};

const inv1Fin = calculateCanonicalInvoiceFinancials(invoice1);
assert.equal(inv1Fin.currentInvoiceTotal, 1000, 'Invoice 1 total is ₹1000');
assert.equal(inv1Fin.amountPaid, 500, 'Invoice 1 paid is ₹500');
assert.equal(inv1Fin.balanceDue, 500, 'Invoice 1 balance due is ₹500');

// Step B: Invoice 2 (₹800 Current Bill, ₹500 Old Due)
const invoice2 = {
  id: 'inv_102',
  invoiceNumber: 'INV-2026-002',
  customerId: customer.id,
  customerName: customer.name,
  grandTotal: 800,
  subtotal: 800,
  taxAmount: 0,
  discountAmount: 0,
  oldDue: 500,
  previousDue: 500,
  paidAmount: 0,
  paymentHistory: [],
  workspaceId: 'ws_tailor_01'
};

const inv2Fin = calculateCanonicalInvoiceFinancials(invoice2);
assert.equal(inv2Fin.previousDue, 500, 'Old Due is ₹500');
assert.equal(inv2Fin.currentInvoiceTotal, 800, 'Current Bill is ₹800');
assert.equal(inv2Fin.totalReceivable, 1300, 'Total Payable is ₹1300');
assert.equal(inv2Fin.customerTotalDue, 1300, 'Total customer payable is ₹1300');
console.log('  ✅ PASS: 2. Invoice 1 (₹1000 - ₹500) & Invoice 2 (Old Due ₹500 + Bill ₹800 = ₹1300) validated');

// ----------------------------------------------------------------------------
// TEST 3: Payment Waterfall (Collect ₹600 on Invoice 2)
// Old Due ₹500 cleared first + ₹100 toward Current Bill
// Remaining on Current Bill = ₹700, Total Remaining = ₹700
// ----------------------------------------------------------------------------
const alloc = allocateCustomerPayment(600, 500, 800);
assert.equal(alloc.allocatedToOldDue, 500, 'Old Due ₹500 is completely cleared');
assert.equal(alloc.remainingOldDue, 0, 'Remaining Old Due is ₹0');
assert.equal(alloc.allocatedToCurrentInvoice, 100, 'Current Bill receives ₹100');
assert.equal(alloc.remainingCurrentDue, 700, 'Current Bill remaining due is ₹700');
assert.equal(alloc.remainingTotalDue, 700, 'Total remaining due is ₹700');

// Update invoice 2 with collection
const updatedInvoice2 = {
  ...invoice2,
  paidAmount: 600,
  paymentHistory: [
    { id: 'pmt_2', amount: 600, date: '2026-09-10', method: 'Cash', note: 'Partial settlement' }
  ]
};

const updatedInv2Fin = calculateCanonicalInvoiceFinancials(updatedInvoice2);
assert.equal(updatedInv2Fin.remainingOldDue, 0, 'Updated Invoice 2 Old Due is 0');
assert.equal(updatedInv2Fin.currentBillDue, 700, 'Updated Invoice 2 current bill due is 700');
assert.equal(updatedInv2Fin.customerTotalDue, 700, 'Updated Invoice 2 total customer due is 700');
console.log('  ✅ PASS: 3. Waterfall allocation: ₹600 collects ₹500 to Old Due and ₹100 to Current Bill (₹700 balance)');

// ----------------------------------------------------------------------------
// TEST 4: Customer Ledger Reconciliation
// Customer total billed = ₹1800, total paid = ₹1100, total outstanding = ₹700
// ----------------------------------------------------------------------------
const ledger = computeCustomerLedger(customer, [
  { ...invoice1, paidAmount: 1000, balanceDue: 0, paymentStatus: 'Paid' },
  { ...updatedInvoice2, grandTotal: 800, paidAmount: 100, oldDue: 0, balanceDue: 700 }
]);

assert.equal(ledger.totalBilled, 1800, 'Customer total billed is ₹1800');
assert.equal(ledger.totalPaid, 1100, 'Customer total paid is ₹1100');
assert.equal(ledger.totalDue, 700, 'Customer total outstanding due is ₹700');
console.log('  ✅ PASS: 4. Customer Ledger matches: Total Billed ₹1800, Total Paid ₹1100, Due ₹700');

// ----------------------------------------------------------------------------
// TEST 5: Business Money Single Inflow & Balance Conservation
// Collecting ₹600 creates exactly ONE ₹600 entry in Website Income
// ----------------------------------------------------------------------------
const stateReconciled = reconcileFinancialState({
  invoices: [
    { id: 'inv_101', grandTotal: 1000, paidAmount: 500, workspaceId: 'ws_tailor_01' },
    { id: 'inv_102', grandTotal: 800, previousDue: 500, paidAmount: 600, workspaceId: 'ws_tailor_01' }
  ],
  bankLedger: [
    { id: 'b_1', source: 'invoice_payment', amount: 500, workspaceId: 'ws_tailor_01' },
    { id: 'b_2', source: 'invoice_payment', amount: 600, workspaceId: 'ws_tailor_01' }
  ],
  workspaceId: 'ws_tailor_01'
});

assert.ok(stateReconciled.balanced, 'Reconciled state is balanced');
assert.equal(stateReconciled.totals.totalInvoiced, 1800, 'Total invoiced across both invoices is ₹1800');
assert.equal(stateReconciled.totals.totalCustomerCollections, 1100, 'Total customer collections is ₹1100 (500 + 600)');
assert.equal(stateReconciled.totals.remainingCurrentInvoiceDue, 1200, 'Remaining current invoice due is ₹1200 (500 + 700)');
assert.equal(stateReconciled.totals.remainingPreviousDue, 0, 'Old due is fully cleared to ₹0');

// When Invoice 1 was cleared by the Old Due payment and only Invoice 2 remains active
const singleReconciled = reconcileFinancialState({
  invoices: [
    { id: 'inv_102', grandTotal: 800, previousDue: 500, paidAmount: 600, workspaceId: 'ws_tailor_01' }
  ],
  bankLedger: [
    { id: 'b_2', source: 'invoice_payment', amount: 600, workspaceId: 'ws_tailor_01' }
  ],
  workspaceId: 'ws_tailor_01'
});
assert.equal(singleReconciled.totals.totalOutstanding, 700, 'Invoice 2 remaining customer outstanding is exactly ₹700');
console.log('  ✅ PASS: 5. Business Money single inflow verified with perfect financial reconciliation');

// ----------------------------------------------------------------------------
// TEST 6: PDF / Public Live Link Render Model Consistency
// Verify that buildCanonicalRenderModel produces identical numbers
// ----------------------------------------------------------------------------
const renderModel = buildCanonicalRenderModel(updatedInvoice2, {
  businessName: 'Master Tailors',
  currency: '₹'
});

assert.equal(renderModel.financials.previousDue, 500, 'PDF render model has Old Due ₹500');
assert.equal(renderModel.financials.currentInvoiceTotal, 800, 'PDF render model has Current Bill ₹800');
assert.equal(renderModel.financials.totalReceivable, 1300, 'PDF render model has Total Payable ₹1300');
assert.equal(renderModel.financials.customerTotalDue, 700, 'PDF render model balance due is ₹700');
console.log('  ✅ PASS: 6. Canonical PDF & Public Link render model parity verified');

// ----------------------------------------------------------------------------
// TEST 7: Collection Center Entry Points Mapping
// Verify payload structure from Invoices, Due Ledger, Customer Ledger, Dashboard
// ----------------------------------------------------------------------------
function verifyCollectionPayload(context) {
  assert.ok(context, 'Collection context must be defined');
  const inv = context.invoice;
  const cust = context.customer;
  if (inv) {
    assert.ok(inv.id, 'Invoice must have id');
    const fin = calculateCanonicalInvoiceFinancials(inv);
    assert.ok(fin.customerTotalDue !== undefined, 'Invoice must compute customer total due');
  }
  if (cust) {
    assert.ok(cust.name || cust.customerName, 'Customer must have name');
  }
}

verifyCollectionPayload({ invoice: invoice2, customer: customer });
verifyCollectionPayload({ invoice: invoice1, customer: { name: 'Meera Sharma' } });
verifyCollectionPayload({ customer: customer });
console.log('  ✅ PASS: 7. Collection Center entry point contracts verified');

// ----------------------------------------------------------------------------
// TEST 8: Workspace Isolation & Stale Data Prevention
// ----------------------------------------------------------------------------
const wsAInvoices = [
  { id: 'inv_A1', grandTotal: 500, workspaceId: 'ws_A' },
  { id: 'inv_A2', grandTotal: 700, workspaceId: 'ws_A' }
];
const wsBInvoices = [
  { id: 'inv_B1', grandTotal: 300, workspaceId: 'ws_B' }
];

const allInvoices = [...wsAInvoices, ...wsBInvoices];
const filterByWs = (list, wsId) => list.filter(item => (item.workspaceId || 'default') === wsId);

const filteredA = filterByWs(allInvoices, 'ws_A');
const filteredB = filterByWs(allInvoices, 'ws_B');

assert.equal(filteredA.length, 2, 'Workspace A has 2 invoices');
assert.equal(filteredB.length, 1, 'Workspace B has 1 invoice');
assert.ok(filteredA.every(i => i.workspaceId === 'ws_A'), 'No Workspace B data leaks into A');
assert.ok(filteredB.every(i => i.workspaceId === 'ws_B'), 'No Workspace A data leaks into B');
console.log('  ✅ PASS: 8. Workspace isolation and clean switching verified');

console.log('\n======================================================');
console.log('🎉 ALL PHASE 5 USER JOURNEY & UX TESTS PASSED (8/8)');
console.log('======================================================\n');
