import assert from 'assert';
import { 
  roundTo2, 
  getInvoicePaidTotal, 
  getInvoiceBalanceDue, 
  getInvoicePaymentStatus, 
  normalizeInvoiceFinancials,
  computeSalesSummary,
  computeCollectionsSummary,
  computeCustomerLedger,
  computeCustomerReport
} from '../src/utils/financialCalculations.js';

console.log('\n======================================================');
console.log('⚡ BILLQYRO REAL-TIME PAYMENT SYNC & FINANCIAL STATE AUDIT');
console.log('======================================================\n');

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
    console.error(`     ${e.message}`);
    throw e;
  }
}

// -------------------------------------------------------------------
// 1. Payment Accumulation & Parity Lifecycle
// -------------------------------------------------------------------
console.log('--- 1. Payment Accumulation & Exact Lifecycle ---');

let currentInvoice = {
  id: 'inv_realtime_1',
  invoiceNumber: 'INV-8001',
  customerId: 'cust_rk',
  customerName: 'Rahim Khan',
  grandTotal: 10000,
  amountPaid: 0,
  paidAmount: 0,
  balanceDue: 10000,
  paymentStatus: 'Unpaid',
  paymentHistory: [],
  isDeleted: false,
  date: '2026-08-23'
};

runTest('1.1: Initial State ₹10,000 Unpaid', () => {
  const norm = normalizeInvoiceFinancials(currentInvoice);
  assert.strictEqual(norm.amountPaid, 0);
  assert.strictEqual(norm.paidAmount, 0);
  assert.strictEqual(norm.balanceDue, 10000);
  assert.strictEqual(norm.paymentStatus, 'Unpaid');
});

runTest('1.2: Payment 1: ₹3,000 -> Paid ₹3,000, Due ₹7,000, Status Partially Paid', () => {
  const p1 = { id: 'pmt_1', amount: 3000, method: 'Cash', date: '2026-08-23T10:00:00Z' };
  currentInvoice.paymentHistory.push(p1);
  currentInvoice = normalizeInvoiceFinancials(currentInvoice);

  assert.strictEqual(currentInvoice.amountPaid, 3000);
  assert.strictEqual(currentInvoice.paidAmount, 3000);
  assert.strictEqual(currentInvoice.balanceDue, 7000);
  assert.strictEqual(currentInvoice.paymentStatus, 'Partially Paid');
});

runTest('1.3: Payment 2: Additional ₹2,000 -> Paid ₹5,000, Due ₹5,000', () => {
  const p2 = { id: 'pmt_2', amount: 2000, method: 'UPI', date: '2026-08-23T12:00:00Z' };
  currentInvoice.paymentHistory.push(p2);
  currentInvoice = normalizeInvoiceFinancials(currentInvoice);

  assert.strictEqual(currentInvoice.amountPaid, 5000);
  assert.strictEqual(currentInvoice.paidAmount, 5000);
  assert.strictEqual(currentInvoice.balanceDue, 5000);
  assert.strictEqual(currentInvoice.paymentStatus, 'Partially Paid');
});

runTest('1.4: Payment 3: Final ₹5,000 -> Paid ₹10,000, Due ₹0, Status Paid', () => {
  const p3 = { id: 'pmt_3', amount: 5000, method: 'Bank Transfer', date: '2026-08-23T14:00:00Z' };
  currentInvoice.paymentHistory.push(p3);
  currentInvoice = normalizeInvoiceFinancials(currentInvoice);

  assert.strictEqual(currentInvoice.amountPaid, 10000);
  assert.strictEqual(currentInvoice.paidAmount, 10000);
  assert.strictEqual(currentInvoice.balanceDue, 0);
  assert.strictEqual(currentInvoice.paymentStatus, 'Paid');
});

// -------------------------------------------------------------------
// 2. React Global State Invariant & Propagator
// -------------------------------------------------------------------
console.log('\n--- 2. Real-Time State Propagator & Cross-Screen Invariant ---');

runTest('2.1: CustomerLedger payment updates global invoices state immutably', () => {
  let globalInvoices = [
    { id: 'inv_100', customerId: 'cust_a', grandTotal: 650, amountPaid: 0, paidAmount: 0, balanceDue: 650, paymentStatus: 'Unpaid', paymentHistory: [] },
    { id: 'inv_200', customerId: 'cust_b', grandTotal: 1000, amountPaid: 1000, paidAmount: 1000, balanceDue: 0, paymentStatus: 'Paid', paymentHistory: [{ id: 'p_200', amount: 1000 }] }
  ];

  // Simulate payment recorded in CustomerLedger
  const paymentPayload = { id: 'pmt_650_1', amount: 500, method: 'Cash', date: '2026-08-23T15:00:00Z' };
  const targetInv = { ...globalInvoices[0] };
  targetInv.paymentHistory = [...targetInv.paymentHistory, paymentPayload];
  const updatedInvoice = normalizeInvoiceFinancials(targetInv);

  // Propagator handler
  const handlePaymentRecorded = (inv) => {
    globalInvoices = globalInvoices.map(i => i.id === inv.id ? { ...i, ...inv } : i);
  };

  handlePaymentRecorded(updatedInvoice);

  // Assert global state is immediately updated
  const updated = globalInvoices.find(i => i.id === 'inv_100');
  assert.strictEqual(updated.amountPaid, 500);
  assert.strictEqual(updated.paidAmount, 500);
  assert.strictEqual(updated.balanceDue, 150);
  assert.strictEqual(updated.paymentStatus, 'Partially Paid');

  // Verify Dashboard collections calculation immediately reflects the ₹500
  const dashCollected = globalInvoices.reduce((s, i) => s + getInvoicePaidTotal(i), 0);
  assert.strictEqual(dashCollected, 1500, 'Total Dashboard collections becomes ₹1,500 (1000 + 500)');

  const dashDue = globalInvoices.reduce((s, i) => s + getInvoiceBalanceDue(i), 0);
  assert.strictEqual(dashDue, 150, 'Total Dashboard due becomes ₹150');
});

runTest('2.2: Second payment of ₹150 on invoice ₹650 -> Paid ₹650, Due ₹0, Status Paid', () => {
  let invoice650 = {
    id: 'inv_650',
    customerId: 'cust_xyz',
    grandTotal: 650,
    amountPaid: 500,
    paidAmount: 500,
    balanceDue: 150,
    paymentStatus: 'Partially Paid',
    paymentHistory: [{ id: 'pmt_1', amount: 500 }]
  };

  // Add ₹150
  invoice650.paymentHistory.push({ id: 'pmt_2', amount: 150 });
  invoice650 = normalizeInvoiceFinancials(invoice650);

  assert.strictEqual(invoice650.amountPaid, 650);
  assert.strictEqual(invoice650.paidAmount, 650);
  assert.strictEqual(invoice650.balanceDue, 0);
  assert.strictEqual(invoice650.paymentStatus, 'Paid');

  // Verify Customer Ledger calculates total due as 0
  const customer = { id: 'cust_xyz', name: 'XYZ' };
  const ledger = computeCustomerLedger(customer, [invoice650]);
  assert.strictEqual(ledger.totalBilled, 650);
  assert.strictEqual(ledger.totalPaid, 650);
  assert.strictEqual(ledger.totalDue, 0);
  assert.strictEqual(ledger.isSettled, true);
});

// -------------------------------------------------------------------
// 3. Reversal & Bank Mirroring Parity
// -------------------------------------------------------------------
console.log('\n--- 3. Reversal, Proof Idempotency & Bank Parity ---');

runTest('3.1: Reversing payment removes it from history and recalculates due', () => {
  let inv = {
    id: 'inv_rev_1',
    grandTotal: 5000,
    paymentHistory: [
      { id: 'p_a', amount: 2000 },
      { id: 'p_b', amount: 3000 }
    ]
  };
  inv = normalizeInvoiceFinancials(inv);
  assert.strictEqual(inv.amountPaid, 5000);
  assert.strictEqual(inv.balanceDue, 0);

  // Remove p_b
  inv.paymentHistory = inv.paymentHistory.filter(p => p.id !== 'p_b');
  inv = normalizeInvoiceFinancials(inv);
  assert.strictEqual(inv.amountPaid, 2000);
  assert.strictEqual(inv.balanceDue, 3000);
  assert.strictEqual(inv.paymentStatus, 'Partially Paid');
});

runTest('3.2: Double proof approval prevents duplicate payments', () => {
  let inv = {
    id: 'inv_proof_test',
    grandTotal: 4000,
    paymentHistory: [
      { id: 'pmt_prf_999', proofId: 'prf_999', amount: 1500 }
    ]
  };

  const proof = { id: 'prf_999', amount: 1500 };
  const alreadyApplied = inv.paymentHistory.some(p => p.proofId === proof.id || p.id === ('pmt_' + proof.id));
  if (!alreadyApplied) {
    inv.paymentHistory.push({ id: 'pmt_' + proof.id, proofId: proof.id, amount: proof.amount });
  }

  inv = normalizeInvoiceFinancials(inv);
  assert.strictEqual(inv.paidAmount, 1500, 'Duplicate approval was blocked');
  assert.strictEqual(inv.balanceDue, 2500);
});

console.log('\n======================================================');
console.log(`📊 REAL-TIME PAYMENT SYNC AUDIT: ${passed} / ${total} PASSED (100%)`);
console.log('======================================================\n');
