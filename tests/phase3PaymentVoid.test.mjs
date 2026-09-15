import assert from 'assert';
import { invoiceEngine } from '../src/services/invoiceEngine.js';
import { paymentEngine } from '../src/services/paymentEngine.js';
import { calculateCanonicalInvoiceFinancials, computeCustomerLedger, getInvoicePaidTotal, getInvoiceBalanceDue } from '../src/utils/invoiceMath.js';

async function runTest() {
  console.log("=== STARTING PHASE 3 WATERFALL VOID REGRESSION TEST ===");
  
  // 1. Mock DB state
  const mockInvoices = [
    {
      id: 'inv_A',
      invoiceNumber: 'INV-A',
      createdAt: '2025-01-01T10:00:00.000Z',
      customerId: 'cust_1',
      customerName: 'Test Customer',
      grandTotal: 1000,
      paymentHistory: [
        { id: 'pmt_initial', amount: 500, type: 'customer_payment', date: '2025-01-02T10:00:00.000Z' }
      ]
    },
    {
      id: 'inv_B',
      invoiceNumber: 'INV-B',
      createdAt: '2025-01-05T10:00:00.000Z',
      customerId: 'cust_1',
      customerName: 'Test Customer',
      grandTotal: 800,
      paymentHistory: []
    }
  ];
  
  // Set mock state
  invoiceEngine.getInvoices = async () => mockInvoices;
  invoiceEngine.saveInvoice = async (inv) => {
    const idx = mockInvoices.findIndex(i => i.id === inv.id);
    if (idx !== -1) mockInvoices[idx] = inv;
    return inv;
  };
  
  // Calculate initial ledger
  let ledger = computeCustomerLedger({ id: 'cust_1' }, mockInvoices);
  assert.strictEqual(ledger.totalBilled, 1800, "Initial Billed should be 1800");
  assert.strictEqual(ledger.totalPaid, 500, "Initial Paid should be 500");
  assert.strictEqual(ledger.totalDue, 1300, "Initial Due should be 1300");
  
  const finA_before = calculateCanonicalInvoiceFinancials(mockInvoices.find(i => i.id === 'inv_A'));
  assert.strictEqual(finA_before.balanceDue, 500, "Inv A balance before = 500");
  const finB_before = calculateCanonicalInvoiceFinancials(mockInvoices.find(i => i.id === 'inv_B'));
  assert.strictEqual(finB_before.balanceDue, 800, "Inv B balance before = 800");
  
  console.log("? Initial state correctly calculated.");

  // 2. Record new payment of 600
  console.log("Recording payment of 600...");
  const res = await paymentEngine.recordCustomerPayment({
    customerId: 'cust_1',
    invoiceId: 'inv_B',
    amount: 600,
    paymentMethod: 'Cash',
    reference: 'TEST_TX'
  });
  
  // Check allocation
  const invA_afterPmt = mockInvoices.find(i => i.id === 'inv_A');
  const invB_afterPmt = mockInvoices.find(i => i.id === 'inv_B');
  
  const finA_after = calculateCanonicalInvoiceFinancials(invA_afterPmt);
  const finB_after = calculateCanonicalInvoiceFinancials(invB_afterPmt);
  
  assert.strictEqual(finA_after.balanceDue, 0, "Inv A balance after payment should be 0 (500 applied)");
  assert.strictEqual(finA_after.amountPaid, 1000, "Inv A amount paid = 1000");
  
  assert.strictEqual(finB_after.balanceDue, 700, "Inv B balance after payment should be 700 (100 applied)");
  assert.strictEqual(finB_after.amountPaid, 100, "Inv B amount paid = 100");
  
  let ledger2 = computeCustomerLedger({ id: 'cust_1' }, mockInvoices);
  assert.strictEqual(ledger2.totalDue, 700, "Customer outstanding should drop to 700");
  
  console.log("? Payment accurately cascaded across Waterfall.");

  // 3. Void the new payment
  console.log("Voiding the payment...");
  const pmtEntry = invB_afterPmt.paymentHistory.find(p => p.transactionId === 'TEST_TX');
  assert.ok(pmtEntry, "Found primary payment entry");
  
  await paymentEngine.voidCustomerPayment(pmtEntry.originalPaymentId || pmtEntry.id, 'Void test');
  
  // Check restoration
  const invA_afterVoid = mockInvoices.find(i => i.id === 'inv_A');
  const invB_afterVoid = mockInvoices.find(i => i.id === 'inv_B');
  
  const finA_void = calculateCanonicalInvoiceFinancials(invA_afterVoid);
  const finB_void = calculateCanonicalInvoiceFinancials(invB_afterVoid);
  
  console.log("Inv A history:", invA_afterVoid.paymentHistory); assert.strictEqual(finA_void.balanceDue, 500, "Inv A balance restored to 500");
  assert.strictEqual(finA_void.amountPaid, 500, "Inv A amount paid restored to 500");
  assert.strictEqual(finB_void.balanceDue, 800, "Inv B balance restored to 800");
  assert.strictEqual(finB_void.amountPaid, 0, "Inv B amount paid restored to 0");
  
  let ledger3 = computeCustomerLedger({ id: 'cust_1' }, mockInvoices);
  assert.strictEqual(ledger3.totalDue, 1300, "Customer outstanding restored to 1300");
  
  // Check Business Money bucket
  const buckets = paymentEngine.calculateFinancialBuckets({ invoices: mockInvoices });
  assert.strictEqual(buckets.totalWebsiteRevenue, 500, "Net business collected should be 500 (1100 recorded, 600 voided)");
  
  console.log("? Payment accurately voided! Financials mathematically preserved.");
  
  console.log("=== PHASE 3 TESTS PASSED ===");
}

runTest().catch(console.error);

