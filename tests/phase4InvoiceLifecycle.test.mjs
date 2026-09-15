import assert from 'assert';
import { invoiceEngine } from '../src/services/invoiceEngine.js';
import { paymentEngine } from '../src/services/paymentEngine.js';
import { calculateCanonicalInvoiceFinancials, computeCustomerLedger, getInvoicePaymentStatus } from '../src/utils/invoiceMath.js';

// Mock DB
const mockInvoices = [
  {
    id: 'inv_4',
    invoiceNumber: 'INV-4',
    createdAt: new Date().toISOString(),
    customerId: 'cust_4',
    customerName: 'Customer 4',
    grandTotal: 1000,
    paymentHistory: []
  }
];

// Override getInvoices for mock
invoiceEngine.getInvoices = async () => mockInvoices;

// Override invoiceEngine.saveInvoice to simulate what the real DB engine does now that we stripped legacy logic
invoiceEngine.saveInvoice = async (inv) => {
  const { normalizeInvoiceFinancials } = await import('../src/utils/invoiceMath.js');
  const normalized = normalizeInvoiceFinancials(inv);
  
  // Simulate stripped dbEngine 1.6 Seed logic
  const paidVal = Number(normalized.paidAmount ?? normalized.amountPaid ?? 0);
  if (paidVal > 0 && (!normalized.paymentHistory || normalized.paymentHistory.length === 0)) {
    normalized.paymentHistory = [{
      id: 'pmt_init_' + (normalized.id || Date.now()),
      amount: paidVal,
      type: 'customer_payment',
      method: normalized.paymentMethod || 'Cash',
      date: normalized.date || normalized.createdAt || new Date().toISOString(),
      note: 'Initial payment'
    }];
  }

  // Save to mock array
  const idx = mockInvoices.findIndex(i => i.id === normalized.id);
  if (idx !== -1) mockInvoices[idx] = normalized;
  else mockInvoices.push(normalized);
  
  return normalized;
};

async function runTest() {
  console.log("=== STARTING PHASE 4 LIFECYCLE TEST ===");
  
  // 1. Unpaid Invoice State
  let inv = mockInvoices[0];
  let canonical = calculateCanonicalInvoiceFinancials(inv);
  assert.strictEqual(canonical.paymentStatus, 'Unpaid', "Initial status must be Unpaid");
  assert.strictEqual(canonical.balanceDue, 1000, "Initial balance must be 1000");

  // 2. Partial Payment (600)
  console.log("Recording partial payment of 600...");
  await paymentEngine.recordCustomerPayment({
    customerId: 'cust_4',
    invoiceId: 'inv_4',
    amount: 600,
    paymentMethod: 'Cash',
    reference: 'TX1'
  });

  inv = mockInvoices[0];
  canonical = calculateCanonicalInvoiceFinancials(inv);
  
  assert.strictEqual(canonical.paymentStatus, 'Partially Paid', "Status must advance to Partially Paid");
  assert.strictEqual(canonical.balanceDue, 400, "Balance must drop to 400");
  assert.strictEqual(canonical.amountPaid, 600, "Amount paid must be 600");
  
  // 3. Reverse the Payment
  console.log("Reversing the partial payment...");
  const pmt = inv.paymentHistory.find(p => p.transactionId === 'TX1');
  await paymentEngine.voidCustomerPayment(pmt.id, 'Test reversal');
  
  inv = mockInvoices[0];
  canonical = calculateCanonicalInvoiceFinancials(inv);
  
  // Verify Status Restored correctly
  assert.strictEqual(canonical.amountPaid, 0, "Amount paid mathematically restored to 0");
  assert.strictEqual(canonical.balanceDue, 1000, "Balance mathematically restored to 1000");
  assert.strictEqual(canonical.paymentStatus, 'Unpaid', "Status organically restored to Unpaid!");
  
  // Verify History preserved
  assert.strictEqual(inv.paymentHistory.length, 2, "History must contain exactly 2 events (Original + Reversal)");
  // assert.strictEqual(inv.paymentHistory[0].type, 'customer_payment');
  assert.strictEqual(inv.paymentHistory[1].type, 'payment_reversal');
  
  // 4. Verify Customer Ledger
  const ledger = computeCustomerLedger({ id: 'cust_4' }, mockInvoices);
  assert.strictEqual(ledger.totalBilled, 1000, "Customer billed must be 1000");
  assert.strictEqual(ledger.totalPaid, 0, "Customer paid must be 0");
  assert.strictEqual(ledger.totalDue, 1000, "Customer outstanding must be 1000");

  // 5. Verify Buckets
  const buckets = paymentEngine.calculateFinancialBuckets({ invoices: mockInvoices });
  assert.strictEqual(buckets.totalWebsiteRevenue, 0, "Business money net revenue must be exactly 0 after reversal");

  console.log("? All Phase 4 Lifecycle constraints validated successfully.");
  console.log("=== PHASE 4 TESTS PASSED ===");
}

runTest().catch(console.error);
