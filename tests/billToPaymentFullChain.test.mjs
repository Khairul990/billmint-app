// Mock window and localStorage for headless Node environment
const store = new Map();
global.localStorage = {
  getItem: (k) => store.get(k) || null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};
global.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {}
};
global.CustomEvent = class CustomEvent { constructor(type, options) { this.type = type; this.detail = options?.detail; } };
global.Event = class Event { constructor(type) { this.type = type; } };

import assert from 'node:assert/strict';
import { calculateInvoiceTotals, calculateCanonicalInvoiceFinancials, normalizeInvoiceFinancials, getInvoicePaidTotal, getInvoiceBalanceDue, getInvoicePaymentStatus } from '../src/utils/invoiceMath.js';
import { invoiceEngine } from '../src/services/invoiceEngine.js';
import { paymentEngine } from '../src/services/paymentEngine.js';

console.log('======================================================');
console.log('🔄 BILLQYRO END-TO-END FLOW: BILL CREATION TO PAYMENT COLLECTION');
console.log('======================================================\n');

// Mock in-memory invoice database
const mockDb = new Map();

invoiceEngine.getInvoices = async () => Array.from(mockDb.values());
invoiceEngine.saveInvoice = async (inv) => {
  const normalized = normalizeInvoiceFinancials(inv);
  mockDb.set(normalized.id, JSON.parse(JSON.stringify(normalized)));
  return JSON.parse(JSON.stringify(normalized));
};

async function testFullChain() {
  // Step 1: Create a Bill with items, tax, discount, and initial partial payment
  console.log('1. Creating new Bill with line items...');
  const items = [
    { id: 'item_1', description: 'Embroidered Kurti', qty: 2, rate: 1200, amount: 2400 },
    { id: 'item_2', description: 'Design GK-115 Stitching', qty: 1, rate: 600, amount: 600 }
  ];
  const taxPercentage = 5;
  const discountAmount = 200;
  
  const totals = calculateInvoiceTotals(items, taxPercentage, discountAmount);
  assert.equal(totals.subtotal, 3000, 'Subtotal should be 3000');
  assert.equal(totals.taxAmount, 140, 'Tax (5% of 2800) should be 140');
  assert.equal(totals.grandTotal, 2940, 'Grand Total should be 2940 (3000 - 200 + 140)');

  // Initial payment of 1000 paid via UPI
  const initialInvoice = {
    id: 'inv_chain_001',
    invoiceNumber: 'INV-0001',
    date: '2026-10-01',
    customerId: 'cust_chain_1',
    customerName: 'Ananya Roy',
    customerPhone: '+919876543210',
    items,
    subtotal: totals.subtotal,
    taxPercentage,
    taxAmount: totals.taxAmount,
    discountAmount,
    grandTotal: totals.grandTotal,
    paidAmount: 1000,
    amountPaid: 1000,
    balanceDue: 1940,
    paymentMethod: 'UPI',
    paymentStatus: 'Partially Paid',
    paymentHistory: [
      {
        id: 'pmt_init_1',
        amount: 1000,
        method: 'UPI',
        date: '2026-10-01T10:00:00.000Z',
        note: 'Advance payment via UPI'
      }
    ]
  };

  const saved1 = await invoiceEngine.saveInvoice(initialInvoice);
  assert.equal(saved1.paidAmount, 1000);
  assert.equal(saved1.amountPaid, 1000);
  assert.equal(saved1.balanceDue, 1940);
  assert.equal(saved1.paymentStatus, 'Partially Paid');
  assert.equal(saved1.paymentMethod, 'UPI');
  console.log('  ✅ PASS: Bill successfully created: Grand Total = ₹2940, Paid = ₹1000, Due = ₹1940, Status = Partially Paid');

  // Step 2: Record second partial payment of ₹940 via PhonePe in Money & Payment Center
  console.log('\n2. Recording second payment (₹940 via PhonePe)...');
  const paymentResult = await paymentEngine.recordCustomerPayment({
    customerId: 'cust_chain_1',
    invoiceId: 'inv_chain_001',
    amount: 940,
    paymentMethod: 'PhonePe',
    paymentDate: '2026-10-01',
    reference: 'UPI_TXN_998877',
    note: 'Second payment collected'
  });

  assert.ok(paymentResult.success, 'Payment should be successful');
  const targetAfterPmt = mockDb.get('inv_chain_001');
  assert.equal(targetAfterPmt.amountPaid, 1940, 'Total paid should now be 1940');
  assert.equal(targetAfterPmt.balanceDue, 1000, 'Balance due should be 1000');
  assert.equal(targetAfterPmt.paymentStatus, 'Partially Paid');
  assert.equal(targetAfterPmt.paymentHistory.length, 2, 'Should have 2 payment history entries');
  assert.equal(targetAfterPmt.paymentHistory[1].method, 'PhonePe', 'Second payment method must be PhonePe');
  assert.equal(targetAfterPmt.paymentHistory[1].amount, 940, 'Second payment amount must be 940');
  console.log('  ✅ PASS: Payment accurately added to paymentHistory with method PhonePe (Paid: ₹1940, Due: ₹1000)');

  // Step 3: Full final settlement of remaining ₹1000 via Cash
  console.log('\n3. Recording final settlement (₹1000 via Cash)...');
  const finalResult = await paymentEngine.recordCustomerPayment({
    customerId: 'cust_chain_1',
    invoiceId: 'inv_chain_001',
    amount: 1000,
    paymentMethod: 'Cash',
    paymentDate: '2026-10-01',
    reference: 'CASH_REC_01',
    note: 'Final settlement'
  });

  assert.ok(finalResult.success);
  const settledInv = mockDb.get('inv_chain_001');
  assert.equal(settledInv.amountPaid, 2940, 'Total paid should be exactly 2940');
  assert.equal(settledInv.balanceDue, 0, 'Balance due must be 0');
  assert.equal(settledInv.paymentStatus, 'Paid', 'Status must transition to Paid');
  assert.equal(settledInv.paymentHistory.length, 3, 'Should have 3 payment records');
  console.log('  ✅ PASS: Full settlement successful: Paid = ₹2940, Due = ₹0, Status = Paid');

  // Step 4: Verification of Canonical Reader parity
  console.log('\n4. Verifying cross-system mathematical parity...');
  assert.equal(getInvoicePaidTotal(settledInv), 2940);
  assert.equal(getInvoiceBalanceDue(settledInv), 0);
  assert.equal(getInvoicePaymentStatus(settledInv), 'Paid');
  console.log('  ✅ PASS: All canonical resolvers agree 100% on financial state');

  // Step 5: Sequential Save Race Condition Safety Test
  console.log('\n5. Verifying sequential save safety across multiple invoices...');
  const invA = {
    id: 'inv_multi_A',
    invoiceNumber: 'INV-A',
    grandTotal: 1000,
    paidAmount: 500,
    amountPaid: 500,
    balanceDue: 500,
    paymentStatus: 'Partially Paid',
    paymentHistory: [{ id: 'p1', amount: 500, method: 'Cash' }]
  };
  const invB = {
    id: 'inv_multi_B',
    invoiceNumber: 'INV-B',
    grandTotal: 800,
    paidAmount: 0,
    amountPaid: 0,
    balanceDue: 800,
    paymentStatus: 'Unpaid',
    paymentHistory: []
  };

  mockDb.set(invA.id, invA);
  mockDb.set(invB.id, invB);

  // Sequentially save
  const batch = [invA, invB];
  const savedBatch = [];
  for (const inv of batch) {
    savedBatch.push(await invoiceEngine.saveInvoice(inv));
  }
  assert.equal(savedBatch.length, 2);
  assert.equal(mockDb.get('inv_multi_A').amountPaid, 500);
  assert.equal(mockDb.get('inv_multi_B').balanceDue, 800);
  console.log('  ✅ PASS: Multi-invoice sequential saving retains all values with zero clobbering');

  console.log('\n======================================================');
  console.log('🎉 ALL END-TO-END BILL TO PAYMENT VERIFICATIONS PASSED (100%)');
  console.log('======================================================');
}

testFullChain().catch(err => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
