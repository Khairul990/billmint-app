import assert from 'assert';
import { 
  roundTo2, 
  getInvoicePaidTotal, 
  getInvoiceBalanceDue, 
  getInvoicePaymentStatus, 
  normalizeInvoiceFinancials,
  calculateCanonicalInvoiceFinancials,
  calculateInvoiceTotals,
  allocatePayment,
  computeSalesSummary,
  computeCollectionsSummary,
  computeCustomerLedger,
  computeCustomerReport
} from '../src/utils/financialCalculations.js';

console.log('\n======================================================');
console.log('💎 BILLQYRO CANONICAL FINANCIAL PARITY AUDIT SUITE');
console.log('======================================================\n');

let passedTests = 0;
let totalTests = 0;

function runTest(description, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ PASS: ${description}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${description}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
}

// -------------------------------------------------------------------
// SCENARIOS 1 - 4: Core Payment Mathematical Invariants
// -------------------------------------------------------------------
console.log('--- PART 1: Core Payment Mathematical Invariants ---');

runTest('TEST 1: Invoice ₹10,000 with single payment ₹3,000', () => {
  const invoice = {
    id: 'inv_test_1',
    invoiceNumber: 'INV-1001',
    grandTotal: 10000,
    amountPaid: 3000,
    paidAmount: 3000,
    paymentHistory: [
      { id: 'pmt_1', amount: 3000, date: '2026-08-23T10:00:00Z', method: 'Cash' }
    ]
  };

  const paid = getInvoicePaidTotal(invoice);
  const due = getInvoiceBalanceDue(invoice);
  const status = getInvoicePaymentStatus(invoice);

  assert.strictEqual(paid, 3000, 'Paid should be exactly ₹3,000');
  assert.strictEqual(due, 7000, 'Due should be exactly ₹7,000');
  assert.strictEqual(status, 'Partially Paid', 'Status should be Partially Paid');
});

runTest('TEST 2: Invoice ₹10,000 with partial payments ₹3,000 then ₹2,000', () => {
  const invoice = {
    id: 'inv_test_2',
    invoiceNumber: 'INV-1002',
    grandTotal: 10000,
    paymentHistory: [
      { id: 'pmt_1', amount: 3000, date: '2026-08-23T10:00:00Z', method: 'Cash' },
      { id: 'pmt_2', amount: 2000, date: '2026-08-23T12:00:00Z', method: 'UPI' }
    ]
  };

  const normalized = normalizeInvoiceFinancials(invoice);
  assert.strictEqual(normalized.amountPaid, 5000, 'Normalized amountPaid should be ₹5,000');
  assert.strictEqual(normalized.paidAmount, 5000, 'Normalized paidAmount should be ₹5,000');
  assert.strictEqual(normalized.balanceDue, 5000, 'Normalized balanceDue should be ₹5,000');
  assert.strictEqual(normalized.paymentStatus, 'Partially Paid', 'Status should be Partially Paid');
});

runTest('TEST 3: Invoice ₹10,000 with full payment ₹10,000', () => {
  const invoice = {
    id: 'inv_test_3',
    invoiceNumber: 'INV-1003',
    grandTotal: 10000,
    paymentHistory: [
      { id: 'pmt_1', amount: 10000, date: '2026-08-23T10:00:00Z', method: 'Bank Transfer' }
    ]
  };

  const paid = getInvoicePaidTotal(invoice);
  const due = getInvoiceBalanceDue(invoice);
  const status = getInvoicePaymentStatus(invoice);

  assert.strictEqual(paid, 10000, 'Paid should be ₹10,000');
  assert.strictEqual(due, 0, 'Due should be ₹0');
  assert.strictEqual(status, 'Paid', 'Status should be Paid');
});

runTest('TEST 4: Invoice ₹10,000 with overpayment ₹12,000 (No invalid negative due)', () => {
  const invoice = {
    id: 'inv_test_4',
    invoiceNumber: 'INV-1004',
    grandTotal: 10000,
    paymentHistory: [
      { id: 'pmt_1', amount: 12000, date: '2026-08-23T10:00:00Z', method: 'UPI' }
    ]
  };

  const paid = getInvoicePaidTotal(invoice);
  const due = getInvoiceBalanceDue(invoice);
  const status = getInvoicePaymentStatus(invoice);

  assert.strictEqual(paid, 12000, 'Paid should be recorded as ₹12,000');
  assert.strictEqual(due, 0, 'Due must never be negative, capped cleanly at 0');
  assert.strictEqual(status, 'Paid', 'Status should be Paid');
});

// -------------------------------------------------------------------
// SCENARIOS 5 - 8: Offline, Sync, Proof Approvals & Idempotency
// -------------------------------------------------------------------
console.log('\n--- PART 2: Offline, Proof Approvals & Idempotency ---');

runTest('TEST 5: Offline payment ₹3,000 -> Reconnect -> No duplicate payment', () => {
  const invoice = {
    id: 'inv_test_5',
    grandTotal: 10000,
    paymentHistory: [
      { id: 'pmt_offline_1', amount: 3000, date: '2026-08-23T10:00:00Z', method: 'Cash' }
    ]
  };

  // Simulate refresh / pull from cloud with same transaction
  const reloadedHistory = [...invoice.paymentHistory];
  // Deduplication check simulation
  const newPayment = { id: 'pmt_offline_1', amount: 3000, date: '2026-08-23T10:00:00Z', method: 'Cash' };
  if (!reloadedHistory.some(p => p.id === newPayment.id)) {
    reloadedHistory.push(newPayment);
  }

  const normalized = normalizeInvoiceFinancials({ ...invoice, paymentHistory: reloadedHistory });
  assert.strictEqual(normalized.paidAmount, 3000, 'Paid must remain ₹3,000 without duplication');
  assert.strictEqual(normalized.balanceDue, 7000, 'Due must remain ₹7,000');
});

runTest('TEST 6: Payment proof submitted -> Not counted until approved', () => {
  const invoiceWithPendingProof = {
    id: 'inv_test_6',
    grandTotal: 10000,
    paymentStatus: 'Pending Verification',
    amountPaid: 0,
    paidAmount: 0,
    paymentHistory: [],
    paymentProofs: [
      { id: 'proof_101', amount: 3000, status: 'Pending Verification' }
    ]
  };

  assert.strictEqual(getInvoicePaidTotal(invoiceWithPendingProof), 0, 'Unapproved proof must not count as paid');
  assert.strictEqual(getInvoiceBalanceDue(invoiceWithPendingProof), 10000, 'Due remains ₹10,000 before approval');

  // Simulate approval
  const approvedHistory = [
    { id: 'pmt_proof_101', proofId: 'proof_101', amount: 3000, method: 'UPI', date: '2026-08-23T14:00:00Z' }
  ];
  const approvedInvoice = normalizeInvoiceFinancials({
    ...invoiceWithPendingProof,
    paymentProofs: [{ id: 'proof_101', amount: 3000, status: 'Approved' }],
    paymentHistory: approvedHistory
  });

  assert.strictEqual(approvedInvoice.amountPaid, 3000, 'After approval paid is exactly ₹3,000');
  assert.strictEqual(approvedInvoice.paidAmount, 3000, 'paidAmount is synchronized to ₹3,000');
  assert.strictEqual(approvedInvoice.balanceDue, 7000, 'Due is updated to ₹7,000');
  assert.strictEqual(approvedInvoice.paymentStatus, 'Partially Paid', 'Status updated to Partially Paid');
});

runTest('TEST 7: Approve same payment proof twice -> Idempotent, no duplicate payment', () => {
  const invoice = {
    id: 'inv_test_7',
    grandTotal: 10000,
    paymentHistory: [
      { id: 'pmt_proof_202', proofId: 'proof_202', amount: 3000, method: 'UPI' }
    ]
  };

  // Attempting duplicate approval
  const proofToApprove = { id: 'proof_202', amount: 3000 };
  const history = [...invoice.paymentHistory];
  const alreadyApplied = history.some(p => p.proofId === proofToApprove.id || p.id === ('pmt_' + proofToApprove.id));
  
  if (!alreadyApplied) {
    history.push({ id: 'pmt_' + proofToApprove.id, proofId: proofToApprove.id, amount: proofToApprove.amount });
  }

  const normalized = normalizeInvoiceFinancials({ ...invoice, paymentHistory: history });
  assert.strictEqual(normalized.paidAmount, 3000, 'Double approval must NOT duplicate payment amount');
  assert.strictEqual(normalized.balanceDue, 7000, 'Due remains ₹7,000');
});

runTest('TEST 8: Two separate payment proofs: ₹2,000 + ₹3,000 -> Paid ₹5,000', () => {
  const invoice = {
    id: 'inv_test_8',
    grandTotal: 10000,
    paymentHistory: [
      { id: 'pmt_proof_a', proofId: 'proof_a', amount: 2000, method: 'UPI' },
      { id: 'pmt_proof_b', proofId: 'proof_b', amount: 3000, method: 'Bank Transfer' }
    ]
  };

  const normalized = normalizeInvoiceFinancials(invoice);
  assert.strictEqual(normalized.paidAmount, 5000, 'Total paid is ₹5,000');
  assert.strictEqual(normalized.balanceDue, 5000, 'Due is ₹5,000');
  assert.strictEqual(normalized.paymentStatus, 'Partially Paid', 'Status is Partially Paid');
});

// -------------------------------------------------------------------
// SCENARIOS 9 - 10: Invoice Editing, Double-Counting & Cancellation
// -------------------------------------------------------------------
console.log('\n--- PART 3: Invoice Editing, Double-Counting & Cancellation ---');

runTest('TEST 9: Edit invoice -> Prior customer due isolates editing invoice without double-counting', () => {
  const customer = { id: 'cust_abc', name: 'John Doe' };
  const invoices = [
    { id: 'inv_prior', customerId: 'cust_abc', grandTotal: 5000, amountPaid: 2000, isDeleted: false }, // Due: 3000
    { id: 'inv_editing', customerId: 'cust_abc', grandTotal: 4000, amountPaid: 1000, isDeleted: false } // Due: 3000
  ];

  // While editing inv_editing, prior customer due must exclude inv_editing
  const ledgerDuringEdit = computeCustomerLedger(customer, invoices, 'inv_editing');
  assert.strictEqual(ledgerDuringEdit.totalDue, 3000, 'Prior due during edit must be ₹3,000 (excluding inv_editing)');
  assert.strictEqual(ledgerDuringEdit.totalBilled, 5000, 'Prior billed during edit must be ₹5,000');
  assert.strictEqual(ledgerDuringEdit.totalPaid, 2000, 'Prior paid during edit must be ₹2,000');
});

runTest('TEST 10: Delete/cancel invoice -> Excluded from active customer ledger and reports', () => {
  const customer = { id: 'cust_xyz', name: 'Acme Corp' };
  const invoices = [
    { id: 'inv_active', customerId: 'cust_xyz', grandTotal: 8000, amountPaid: 5000, isDeleted: false, status: 'Active' },
    { id: 'inv_cancelled', customerId: 'cust_xyz', grandTotal: 6000, amountPaid: 0, isDeleted: false, status: 'Cancelled' },
    { id: 'inv_deleted', customerId: 'cust_xyz', grandTotal: 4000, amountPaid: 0, isDeleted: true, status: 'Active' }
  ];

  const ledger = computeCustomerLedger(customer, invoices);
  assert.strictEqual(ledger.totalBilled, 8000, 'Cancelled and deleted invoices are excluded from total billed');
  assert.strictEqual(ledger.totalPaid, 5000, 'Total paid is ₹5,000');
  assert.strictEqual(ledger.totalDue, 3000, 'Total due is ₹3,000 (8k - 5k)');

  const salesReport = computeSalesSummary(invoices);
  assert.strictEqual(salesReport.totalSales, 8000, 'Sales report excludes cancelled & deleted');
  assert.strictEqual(salesReport.totalDue, 3000, 'Sales report due is ₹3,000');
});

// -------------------------------------------------------------------
// CROSS-MODULE FINANCIAL PARITY TEST (10 SYSTEM SCREENS)
// -------------------------------------------------------------------
console.log('\n--- PART 4: Cross-Module Financial Parity Across 10 Screens ---');

runTest('CROSS-SCREEN AUDIT: Customer Rahim Khan ₹10,000 bill with ₹3,000 payment', () => {
  const customer = { id: 'cust_rahim', name: 'Rahim Khan', phone: '9876543210' };
  const invoice = {
    id: 'inv_rahim_1',
    invoiceNumber: 'INV-7001',
    customerId: 'cust_rahim',
    customerName: 'Rahim Khan',
    grandTotal: 10000,
    amountPaid: 3000,
    paidAmount: 3000,
    balanceDue: 7000,
    paymentStatus: 'Partially Paid',
    paymentHistory: [
      { id: 'pmt_r1', amount: 3000, method: 'Cash', date: '2026-08-23T09:00:00Z' }
    ],
    isDeleted: false,
    documentType: 'Invoice',
    date: '2026-08-23'
  };
  const invoices = [invoice];

  // Screen 1: Invoice Card
  const cardPaid = getInvoicePaidTotal(invoice);
  const cardDue = getInvoiceBalanceDue(invoice);
  assert.strictEqual(cardPaid, 3000, 'Screen 1: Invoice Card Paid = ₹3,000');
  assert.strictEqual(cardDue, 7000, 'Screen 1: Invoice Card Due = ₹7,000');

  // Screen 2: Invoice Details / Preview
  const normDetails = normalizeInvoiceFinancials(invoice);
  assert.strictEqual(normDetails.paidAmount, 3000, 'Screen 2: Invoice Details Paid = ₹3,000');
  assert.strictEqual(normDetails.balanceDue, 7000, 'Screen 2: Invoice Details Due = ₹7,000');

  // Screen 3 & 4: Customer 360 / Customer Ledger Modal
  const custLedger = computeCustomerLedger(customer, invoices);
  assert.strictEqual(custLedger.totalBilled, 10000, 'Screen 3 & 4: Customer Ledger Billed = ₹10,000');
  assert.strictEqual(custLedger.totalPaid, 3000, 'Screen 3 & 4: Customer Ledger Paid = ₹3,000');
  assert.strictEqual(custLedger.totalDue, 7000, 'Screen 3 & 4: Customer Ledger Due = ₹7,000');

  // Screen 5: Due Ledger
  const dueScreenItem = invoices.map(i => ({
    dueAmount: getInvoiceBalanceDue(i),
    paidAmount: getInvoicePaidTotal(i)
  }))[0];
  assert.strictEqual(dueScreenItem.paidAmount, 3000, 'Screen 5: Due Ledger Paid = ₹3,000');
  assert.strictEqual(dueScreenItem.dueAmount, 7000, 'Screen 5: Due Ledger Due = ₹7,000');

  // Screen 6: Dashboard Aggregation
  const dashSales = invoices.reduce((s, i) => s + i.grandTotal, 0);
  const dashCollected = invoices.reduce((s, i) => s + getInvoicePaidTotal(i), 0);
  const dashDue = invoices.reduce((s, i) => s + getInvoiceBalanceDue(i), 0);
  assert.strictEqual(dashSales, 10000, 'Screen 6: Dashboard Sales = ₹10,000');
  assert.strictEqual(dashCollected, 3000, 'Screen 6: Dashboard Collected = ₹3,000');
  assert.strictEqual(dashDue, 7000, 'Screen 6: Dashboard Due = ₹7,000');

  // Screen 7: Reports -> Sales Summary
  const salesSummary = computeSalesSummary(invoices);
  assert.strictEqual(salesSummary.totalSales, 10000, 'Screen 7: Reports Sales = ₹10,000');
  assert.strictEqual(salesSummary.totalCollected, 3000, 'Screen 7: Reports Collected = ₹3,000');
  assert.strictEqual(salesSummary.totalDue, 7000, 'Screen 7: Reports Due = ₹7,000');

  // Screen 8: Reports -> Collections Summary
  const collectionsSummary = computeCollectionsSummary(invoices);
  assert.strictEqual(collectionsSummary.totalInvoiced, 10000, 'Screen 8: Collections Invoiced = ₹10,000');
  assert.strictEqual(collectionsSummary.totalCollected, 3000, 'Screen 8: Collections Collected = ₹3,000');
  assert.strictEqual(collectionsSummary.totalDue, 7000, 'Screen 8: Collections Due = ₹7,000');

  // Screen 9: Customer Intelligence Report
  const custReport = computeCustomerReport(invoices, [customer]);
  assert.strictEqual(custReport.allCustomerStats[0].totalBilled, 10000, 'Screen 9: Customer Report Billed = ₹10,000');
  assert.strictEqual(custReport.allCustomerStats[0].totalPaid, 3000, 'Screen 9: Customer Report Paid = ₹3,000');
  assert.strictEqual(custReport.allCustomerStats[0].totalDue, 7000, 'Screen 9: Customer Report Due = ₹7,000');

  // Screen 10: Public Invoice / Live Link Normalization
  const publicView = normalizeInvoiceFinancials(invoice);
  assert.strictEqual(publicView.amountPaid, 3000, 'Screen 10: Public Invoice Paid = ₹3,000');
  assert.strictEqual(publicView.balanceDue, 7000, 'Screen 10: Public Invoice Due = ₹7,000');
});

// -------------------------------------------------------------------
// REGRESSION TESTS A–F: Payment Proof Approval & Stale Status Scenarios
// -------------------------------------------------------------------
console.log('\n--- PART 5: Payment Proof Approval & Stale Status Regression ---');

runTest('CASE A: Pending proof, no approved payment => Pending Verification', () => {
  const invoice = {
    id: 'inv_case_a',
    grandTotal: 10000,
    paymentHistory: [],
    amountPaid: 0,
    paidAmount: 0,
    paymentProofs: [
      { id: 'proof_a1', amount: 3000, status: 'Pending Verification' }
    ]
  };
  const paid = getInvoicePaidTotal(invoice);
  const status = getInvoicePaymentStatus(invoice);
  const normalized = normalizeInvoiceFinancials(invoice);

  assert.strictEqual(paid, 0, 'Case A: No payment has cleared yet');
  assert.strictEqual(status, 'Pending Verification', 'Case A: Status must be Pending Verification');
  assert.strictEqual(normalized.paymentStatus, 'Pending Verification', 'Case A: normalizeInvoiceFinancials must also return Pending Verification');
  assert.strictEqual(normalized.amountPaid, 0, 'Case A: amountPaid must be 0');
  assert.strictEqual(normalized.balanceDue, 10000, 'Case A: balanceDue must be full ₹10,000');
});

runTest('CASE B: Approved proof ₹3,000 on ₹10,000 invoice => Partially Paid, Paid=₹3,000, Due=₹7,000', () => {
  const invoice = {
    id: 'inv_case_b',
    grandTotal: 10000,
    paymentHistory: [
      { id: 'pmt_proof_b1', proofId: 'proof_b1', amount: 3000, method: 'UPI', date: '2026-08-23T14:00:00Z' }
    ],
    paymentProofs: [{ id: 'proof_b1', amount: 3000, status: 'Approved' }]
  };
  const paid = getInvoicePaidTotal(invoice);
  const due = getInvoiceBalanceDue(invoice);
  const status = getInvoicePaymentStatus(invoice);
  const normalized = normalizeInvoiceFinancials(invoice);

  assert.strictEqual(paid, 3000, 'Case B: Paid must be ₹3,000');
  assert.strictEqual(due, 7000, 'Case B: Due must be ₹7,000');
  assert.strictEqual(status, 'Partially Paid', 'Case B: Status must be Partially Paid');
  assert.strictEqual(normalized.amountPaid, 3000, 'Case B: normalized amountPaid = ₹3,000');
  assert.strictEqual(normalized.paidAmount, 3000, 'Case B: normalized paidAmount = ₹3,000');
  assert.strictEqual(normalized.balanceDue, 7000, 'Case B: normalized balanceDue = ₹7,000');
  assert.strictEqual(normalized.paymentStatus, 'Partially Paid', 'Case B: normalized status = Partially Paid');
});

runTest('CASE C: Approved proof with full payment => Paid, Due=₹0', () => {
  const invoice = {
    id: 'inv_case_c',
    grandTotal: 10000,
    paymentHistory: [
      { id: 'pmt_proof_c1', proofId: 'proof_c1', amount: 10000, method: 'Bank Transfer', date: '2026-08-23T15:00:00Z' }
    ],
    paymentProofs: [{ id: 'proof_c1', amount: 10000, status: 'Approved' }]
  };
  const normalized = normalizeInvoiceFinancials(invoice);

  assert.strictEqual(normalized.amountPaid, 10000, 'Case C: amountPaid = ₹10,000');
  assert.strictEqual(normalized.balanceDue, 0, 'Case C: balanceDue = ₹0');
  assert.strictEqual(normalized.paymentStatus, 'Paid', 'Case C: paymentStatus = Paid');
});

runTest('CASE D: Stale paymentStatus="Pending Verification" but approved ₹3,000 payment exists => Partially Paid', () => {
  // This is the exact scenario that was failing (TEST 6 in Part 2 above).
  // The invoice object still carries the stale paymentStatus from before approval.
  const staleInvoice = {
    id: 'inv_case_d',
    grandTotal: 10000,
    paymentStatus: 'Pending Verification',   // ← stale stored value
    amountPaid: 0,
    paidAmount: 0,
    paymentProofs: [{ id: 'proof_d1', amount: 3000, status: 'Approved' }], // already approved
    paymentHistory: [
      { id: 'pmt_proof_d1', proofId: 'proof_d1', amount: 3000, method: 'UPI', date: '2026-08-23T14:00:00Z' }
    ]
  };

  const normalized = normalizeInvoiceFinancials(staleInvoice);

  assert.strictEqual(normalized.amountPaid, 3000, 'Case D: amountPaid must reflect approved payment ₹3,000');
  assert.strictEqual(normalized.balanceDue, 7000, 'Case D: balanceDue must be ₹7,000');
  assert.strictEqual(normalized.paymentStatus, 'Partially Paid',
    'Case D: stale "Pending Verification" MUST NOT override canonical Partially Paid'
  );
});

runTest('CASE E: Duplicate approval of same proof => payment counted only once', () => {
  // paymentHistory deduplication — same proof ID appears only once in history
  const invoice = {
    id: 'inv_case_e',
    grandTotal: 10000,
    paymentProofs: [
      { id: 'proof_e1', amount: 3000, status: 'Approved' }
    ],
    paymentHistory: [
      { id: 'pmt_proof_e1', proofId: 'proof_e1', amount: 3000, method: 'UPI' }
      // If duplicate approval was applied the same entry would be added twice,
      // but idempotency check prevents that; history should still contain only one entry.
    ]
  };

  const normalized = normalizeInvoiceFinancials(invoice);

  assert.strictEqual(normalized.amountPaid, 3000, 'Case E: Paid must be ₹3,000 (not ₹6,000 from double-count)');
  assert.strictEqual(normalized.balanceDue, 7000, 'Case E: Due must be ₹7,000');
  assert.strictEqual(normalized.paymentStatus, 'Partially Paid', 'Case E: Status must be Partially Paid');
});

runTest('CASE F: Normal invoice without payment proof => canonical math determines status (Unpaid/Partial/Paid)', () => {
  // F1: Unpaid
  const unpaid = normalizeInvoiceFinancials({ id: 'inv_f1', grandTotal: 5000, paymentHistory: [] });
  assert.strictEqual(unpaid.paymentStatus, 'Unpaid', 'Case F1: No payment => Unpaid');
  assert.strictEqual(unpaid.balanceDue, 5000, 'Case F1: balanceDue = ₹5,000');

  // F2: Partially Paid
  const partial = normalizeInvoiceFinancials({
    id: 'inv_f2', grandTotal: 5000,
    paymentHistory: [{ id: 'pmt_f2', amount: 2000, method: 'Cash' }]
  });
  assert.strictEqual(partial.paymentStatus, 'Partially Paid', 'Case F2: Partial payment => Partially Paid');
  assert.strictEqual(partial.amountPaid, 2000, 'Case F2: amountPaid = ₹2,000');
  // F3: Paid
  const paid = normalizeInvoiceFinancials({
    id: 'inv_f3', grandTotal: 5000,
    paymentHistory: [{ id: 'pmt_f3', amount: 5000, method: 'UPI' }]
  });
  assert.strictEqual(paid.paymentStatus, 'Paid', 'Case F3: Full payment => Paid');
  assert.strictEqual(paid.balanceDue, 0, 'Case F3: balanceDue = ₹0');
});

// -------------------------------------------------------------------
// SCENARIOS 11 - 18: Previous-Due, Allocation & Edge-Case Regressions
// -------------------------------------------------------------------
console.log('\n--- PART 6: Previous-Due, Allocation & Edge-Case Regressions ---');

runTest('TEST 11: Core Previous-Due Scenario (Invoice ₹1,000, Previous Due ₹500, Paid ₹200)', () => {
  const invoice = {
    id: 'inv_prev_due_1',
    invoiceNumber: 'INV-2001',
    grandTotal: 1000,
    oldDue: 500,
    amountPaid: 200,
    paidAmount: 200,
    paymentHistory: [
      { id: 'pmt_pd1', amount: 200, method: 'Cash' }
    ]
  };

  const canonical = calculateCanonicalInvoiceFinancials(invoice);
  assert.strictEqual(canonical.currentInvoiceTotal, 1000, 'currentInvoiceTotal must be ₹1,000');
  assert.strictEqual(canonical.previousDue, 500, 'previousDue must be ₹500');
  assert.strictEqual(canonical.totalReceivable, 1500, 'totalReceivable must be ₹1,500 (₹1,000 + ₹500)');
  assert.strictEqual(canonical.amountPaid, 200, 'amountPaid must be ₹200');
  assert.strictEqual(canonical.allocatedToOldDue, 200, 'First ₹200 clears old due');
  assert.strictEqual(canonical.remainingOldDue, 300, 'Remaining old due is ₹300');
  assert.strictEqual(canonical.currentBillDue, 1000, 'Current bill balance is ₹1,000');
  assert.strictEqual(canonical.remainingOldDue + canonical.currentBillDue, 1300, 'Net total customer liability is ₹1,300');
});

runTest('TEST 12: Scenario A - Invoice ₹1,000, Paid ₹0 => balance ₹1,000, Unpaid', () => {
  const inv = { id: 'inv_sc_a', grandTotal: 1000, amountPaid: 0, paymentHistory: [] };
  const canonical = calculateCanonicalInvoiceFinancials(inv);
  assert.strictEqual(canonical.balanceDue, 1000, 'Balance must be ₹1,000');
  assert.strictEqual(canonical.paymentStatus, 'Unpaid', 'Status must be Unpaid');
});

runTest('TEST 13: Scenario B - Invoice ₹1,000, Paid ₹500 => balance ₹500, Partially Paid', () => {
  const inv = { id: 'inv_sc_b', grandTotal: 1000, amountPaid: 500, paymentHistory: [{ id: 'p1', amount: 500 }] };
  const canonical = calculateCanonicalInvoiceFinancials(inv);
  assert.strictEqual(canonical.balanceDue, 500, 'Balance must be ₹500');
  assert.strictEqual(canonical.paymentStatus, 'Partially Paid', 'Status must be Partially Paid');
});

runTest('TEST 14: Scenario C - Invoice ₹1,000, Paid ₹1,000 => balance ₹0, Paid', () => {
  const inv = { id: 'inv_sc_c', grandTotal: 1000, amountPaid: 1000, paymentHistory: [{ id: 'p1', amount: 1000 }] };
  const canonical = calculateCanonicalInvoiceFinancials(inv);
  assert.strictEqual(canonical.balanceDue, 0, 'Balance must be ₹0');
  assert.strictEqual(canonical.paymentStatus, 'Paid', 'Status must be Paid');
  assert.strictEqual(canonical.isFullyPaid, true, 'isFullyPaid must be true');
});

runTest('TEST 15: Scenario D - Invoice ₹1,000, Previous due ₹500, Paid ₹500 => clears ₹500 old due, ₹1,000 current bill due, net customer liability ₹1,000', () => {
  const inv = {
    id: 'inv_sc_d',
    grandTotal: 1000,
    oldDue: 500,
    amountPaid: 500,
    paymentHistory: [{ id: 'p1', amount: 500 }]
  };
  const canonical = calculateCanonicalInvoiceFinancials(inv);
  assert.strictEqual(canonical.currentInvoiceTotal, 1000, 'currentInvoiceTotal = ₹1,000');
  assert.strictEqual(canonical.allocatedToOldDue, 500, 'Paid ₹500 clears old due');
  assert.strictEqual(canonical.remainingOldDue, 0, 'Remaining old due = 0');
  assert.strictEqual(canonical.currentBillDue, 1000, 'currentBillDue = ₹1,000');
  assert.strictEqual(canonical.balanceDue, 1000, 'balanceDue = ₹1,000');
  assert.strictEqual(canonical.previousDue, 500, 'previousDue = ₹500');
  assert.strictEqual(canonical.totalReceivable, 1500, 'totalReceivable before payments = ₹1,500');
  assert.strictEqual(canonical.remainingOldDue + canonical.balanceDue, 1000, 'Total remaining customer due = ₹1,000');
});

runTest('TEST 16: Scenario E - Line items with tax + discount', () => {
  const items = [
    { qty: 2, rate: 500, discount: 50 },  // 2*500 - 50 = 950
    { qty: 1, rate: 1000, discount: 100 } // 1*1000 - 100 = 900
  ]; // Subtotal = 1850
  const totals = calculateInvoiceTotals(items, 18, 50); // global disc 50 -> taxable 1800, 18% tax = 324 -> grandTotal = 2124
  assert.strictEqual(totals.subtotal, 1850, 'Subtotal should be ₹1,850');
  assert.strictEqual(totals.discountAmount, 50, 'Discount should be ₹50');
  assert.strictEqual(totals.taxAmount, 324, 'Tax should be ₹324 (18% of ₹1,800)');
  assert.strictEqual(totals.grandTotal, 2124, 'Grand Total should be ₹2,124');
});

runTest('TEST 17: Scenario G - Zero-value invoice edge cases', () => {
  const zeroInv = { id: 'inv_zero', grandTotal: 0, amountPaid: 0, paymentHistory: [] };
  const canonical = calculateCanonicalInvoiceFinancials(zeroInv);
  assert.strictEqual(canonical.currentInvoiceTotal, 0, 'currentInvoiceTotal = 0');
  assert.strictEqual(canonical.balanceDue, 0, 'balanceDue = 0');
  assert.strictEqual(canonical.paymentStatus, 'Unpaid', 'Zero value invoice is Unpaid');
});

runTest('TEST 18: Scenario H - Overpayment protection (Paid ₹1,500 on ₹1,000 invoice)', () => {
  const overpaidInv = {
    id: 'inv_overpaid',
    grandTotal: 1000,
    amountPaid: 1500,
    paymentHistory: [{ id: 'p1', amount: 1500 }]
  };
  const canonical = calculateCanonicalInvoiceFinancials(overpaidInv);
  assert.strictEqual(canonical.amountPaid, 1500, 'amountPaid = ₹1,500');
  assert.strictEqual(canonical.balanceDue, 0, 'balanceDue cannot be negative, capped at 0');
  assert.strictEqual(canonical.paymentStatus, 'Paid', 'Status is Paid');
});

runTest('TEST 19: QR Payment Exact Scenario 1 (Current Invoice = ₹1,605, Previous Due = ₹1,190, Paid = ₹0)', () => {
  const inv = {
    id: 'inv_qr_1',
    invoiceNumber: 'INV-QR-001',
    grandTotal: 1605,
    oldDue: 1190,
    amountPaid: 0,
    paymentHistory: []
  };
  const canonical = calculateCanonicalInvoiceFinancials(inv);
  assert.strictEqual(canonical.currentInvoiceTotal, 1605, 'currentInvoiceTotal = 1605');
  assert.strictEqual(canonical.balanceDue, 1605, 'currentInvoiceBalance = 1605');
  assert.strictEqual(canonical.previousDue, 1190, 'previousDue = 1190');
  assert.strictEqual(canonical.totalReceivable, 2795, 'totalReceivable = 2795 (1605 + 1190)');
  
  const qrDueAmount = (canonical.remainingOldDue !== undefined && canonical.currentBillDue !== undefined)
    ? roundTo2(canonical.remainingOldDue + canonical.currentBillDue)
    : canonical.totalReceivable;
  assert.strictEqual(qrDueAmount, 2795, 'QR Due Amount must be ₹2,795');
});

runTest('TEST 20: QR Payment Exact Scenario 2 (Current Invoice = ₹1,605, Previous Due = ₹1,190, Paid = ₹500)', () => {
  const inv = {
    id: 'inv_qr_2',
    invoiceNumber: 'INV-QR-002',
    grandTotal: 1605,
    oldDue: 1190,
    amountPaid: 500,
    paymentHistory: [{ id: 'p1', amount: 500 }]
  };
  const canonical = calculateCanonicalInvoiceFinancials(inv);
  assert.strictEqual(canonical.currentInvoiceTotal, 1605, 'currentInvoiceTotal = 1605');
  assert.strictEqual(canonical.previousDue, 1190, 'previousDue = 1190');
  assert.strictEqual(canonical.allocatedToOldDue, 500, 'allocatedToOldDue = 500');
  assert.strictEqual(canonical.remainingOldDue, 690, 'remainingOldDue = 690 (1190 - 500)');
  assert.strictEqual(canonical.currentBillDue, 1605, 'currentBillDue = 1605');
  assert.strictEqual(canonical.totalReceivable, 2795, 'Gross totalReceivable before payment = 2795');
  
  const qrDueAmount = (canonical.remainingOldDue !== undefined && canonical.currentBillDue !== undefined)
    ? roundTo2(canonical.remainingOldDue + canonical.currentBillDue)
    : canonical.totalReceivable;
  assert.strictEqual(qrDueAmount, 2295, 'QR Due Amount must reflect remaining outstanding ₹2,295 (690 + 1605)');
});

console.log('\n======================================================');
console.log(`📊 CANONICAL FINANCIAL PARITY RESULTS: ${passedTests} / ${totalTests} PASSED (100%)`);
console.log('======================================================\n');


