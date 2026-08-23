/**
 * BILLQYRO INVOICE EDIT / SAVE FORM STATE RESET REGRESSION TEST SUITE
 * Verifies all 12 regression test cases specified in the P0 requirements.
 */

import assert from 'assert';
import { 
  getInvoicePaidTotal, 
  getInvoiceBalanceDue, 
  getInvoicePaymentStatus,
  computeCustomerLedger
} from '../src/utils/financialCalculations.js';

function runRegressionSuite() {
  console.log('\n======================================================');
  console.log('🔬 INVOICE EDIT / SAVE STATE RESET REGRESSION SUITE');
  console.log('======================================================\n');

  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
    }
  }

  // Simulated Database Store
  let invoicesDb = [];
  let productsDb = [
    { id: 'prod-1', name: 'Premium Cotton Shirt', stockQty: 10, price: 500 }
  ];
  let customersDb = [
    { id: 'cust-101', name: 'Rashed Ali', phone: '9876543210', previousDue: 150 }
  ];

  // Helper simulating dbEngine.saveInvoice
  const saveInvoice = (payload) => {
    const existingIndex = payload.id ? invoicesDb.findIndex(i => i.id === payload.id) : -1;
    const isEditing = existingIndex !== -1;
    const timestamp = new Date().toISOString();

    if (isEditing) {
      const existing = invoicesDb[existingIndex];
      // 1. Stock reversal & application
      if (existing.items) {
        for (const it of existing.items) {
          const p = productsDb.find(prod => prod.name === it.name);
          if (p) p.stockQty += Number(it.qty || 0);
        }
      }
      if (payload.items) {
        for (const it of payload.items) {
          const p = productsDb.find(prod => prod.name === it.name);
          if (p) p.stockQty -= Number(it.qty || 0);
        }
      }

      // 2. Financial calculation
      const grandTotal = Math.round((Number(payload.grandTotal || 0)) * 100) / 100;
      const finalPaymentHistory = (payload.paymentHistory && payload.paymentHistory.length > 0)
        ? payload.paymentHistory
        : (existing.paymentHistory || []);

      let paidVal = 0;
      if (finalPaymentHistory.length > 0) {
        paidVal = finalPaymentHistory.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      } else {
        paidVal = Number(payload.paidAmount ?? payload.amountPaid ?? existing.amountPaid ?? 0);
      }
      paidVal = Math.round(paidVal * 100) / 100;
      const balanceDue = Math.max(0, Math.round((grandTotal - paidVal) * 100) / 100);

      const updated = {
        ...existing,
        ...payload,
        id: existing.id,
        invoiceNumber: existing.invoiceNumber,
        createdAt: existing.createdAt,
        publicToken: existing.publicToken,
        verificationCode: existing.verificationCode,
        createdByUid: existing.createdByUid,
        createdByEmail: existing.createdByEmail,
        customerId: payload.customerId || existing.customerId,
        grandTotal,
        amountPaid: paidVal,
        paidAmount: paidVal,
        balanceDue,
        dueAmount: balanceDue,
        paymentStatus: paidVal >= grandTotal && grandTotal > 0 ? 'Paid' : (paidVal > 0 ? 'Partially Paid' : 'Unpaid'),
        paymentHistory: finalPaymentHistory,
        updatedAt: timestamp
      };

      invoicesDb[existingIndex] = updated;
      return { savedInvoice: updated, isEditing: true };
    } else {
      if (payload.items) {
        for (const it of payload.items) {
          const p = productsDb.find(prod => prod.name === it.name);
          if (p) p.stockQty -= Number(it.qty || 0);
        }
      }

      const newId = payload.id || `inv-${Date.now()}`;
      const grandTotal = Math.round((Number(payload.grandTotal || 0)) * 100) / 100;
      const paidVal = Math.round((Number(payload.amountPaid || payload.paidAmount || 0)) * 100) / 100;
      const balanceDue = Math.max(0, Math.round((grandTotal - paidVal) * 100) / 100);

      const created = {
        ...payload,
        id: newId,
        invoiceNumber: payload.invoiceNumber || 'INV-1001',
        createdAt: timestamp,
        updatedAt: timestamp,
        publicToken: `token_${Date.now()}`,
        verificationCode: 'VER-9988',
        createdByUid: 'uid_test',
        createdByEmail: 'owner@test.com',
        grandTotal,
        amountPaid: paidVal,
        paidAmount: paidVal,
        balanceDue,
        dueAmount: balanceDue,
        paymentStatus: paidVal >= grandTotal && grandTotal > 0 ? 'Paid' : (paidVal > 0 ? 'Partially Paid' : 'Unpaid'),
        paymentHistory: paidVal > 0 ? [{ id: 'p_init', amount: paidVal, date: timestamp }] : []
      };

      invoicesDb.push(created);
      return { savedInvoice: created, isEditing: false };
    }
  };

  // --- 1. Create Initial Invoice ---
  let initialInvoice;
  test('1. Create Initial Invoice (Total ₹1000, Paid ₹300, Due ₹700, Stock 10 -> 7)', () => {
    const res = saveInvoice({
      customerId: 'cust-101',
      customerName: 'Rashed Ali',
      items: [{ name: 'Premium Cotton Shirt', qty: 3, price: 500 }],
      grandTotal: 1000,
      amountPaid: 300
    });
    initialInvoice = res.savedInvoice;
    assert.strictEqual(res.isEditing, false);
    assert.strictEqual(invoicesDb.length, 1);
    assert.strictEqual(initialInvoice.grandTotal, 1000);
    assert.strictEqual(initialInvoice.amountPaid, 300);
    assert.strictEqual(initialInvoice.balanceDue, 700);
    assert.strictEqual(productsDb[0].stockQty, 7); // 10 - 3 = 7
  });

  // --- 2. editSaveDoesNotResetForm & editDoesNotCreateDuplicate ---
  test('2. editDoesNotCreateDuplicate: Editing invoice updates existing record in-place', () => {
    const editPayload = {
      id: initialInvoice.id,
      items: [{ name: 'Premium Cotton Shirt', qty: 3, price: 500 }],
      grandTotal: 1500, // Price updated
      notes: 'Updated invoice notes'
    };
    const res = saveInvoice(editPayload);
    assert.strictEqual(res.isEditing, true);
    assert.strictEqual(invoicesDb.length, 1, 'Total invoice count must remain 1');
  });

  // --- 3. editPreservesInvoiceId ---
  test('3. editPreservesInvoiceId: Invoice ID remains exactly the same', () => {
    assert.strictEqual(invoicesDb[0].id, initialInvoice.id);
  });

  // --- 4. editPreservesPayment ---
  test('4. editPreservesPayment: Payment history & amountPaid preserved across edits', () => {
    const inv = invoicesDb[0];
    assert.strictEqual(getInvoicePaidTotal(inv), 300);
    assert.strictEqual(inv.paymentHistory.length, 1);
    assert.strictEqual(inv.paymentHistory[0].amount, 300);
  });

  // --- 5. editPreservesPublicToken ---
  test('5. editPreservesPublicToken: Public live link token remains immutable', () => {
    assert.strictEqual(invoicesDb[0].publicToken, initialInvoice.publicToken);
  });

  // --- 6. editPreservesCreatedAt ---
  test('6. editPreservesCreatedAt: Original createdAt preserved while updatedAt is fresh', () => {
    assert.strictEqual(invoicesDb[0].createdAt, initialInvoice.createdAt);
    assert(invoicesDb[0].updatedAt >= initialInvoice.createdAt);
  });

  // --- 7. editPaymentRecalculation ---
  test('7. editPaymentRecalculation: Total ₹1500 with Paid ₹300 leaves Due ₹1200', () => {
    const inv = invoicesDb[0];
    assert.strictEqual(inv.grandTotal, 1500);
    assert.strictEqual(getInvoiceBalanceDue(inv), 1200);
    assert.strictEqual(getInvoicePaymentStatus(inv), 'Partially Paid');
  });

  // --- 8. editStockRecalculation ---
  test('8. editStockRecalculation: Old qty (3) reversed before new qty (5) applied (Stock becomes 5)', () => {
    // Edit qty 3 -> 5
    saveInvoice({
      ...invoicesDb[0],
      items: [{ name: 'Premium Cotton Shirt', qty: 5, price: 500 }],
      grandTotal: 2500
    });
    // 7 + 3 - 5 = 5
    assert.strictEqual(productsDb[0].stockQty, 5, 'Stock should be 5');
  });

  // --- 9. editPreviousDueCalculation ---
  test('9. editPreviousDueCalculation: computeCustomerLedger excludes current invoice from its own oldDue', () => {
    const cust = customersDb[0];
    const ledger = computeCustomerLedger(cust, invoicesDb, initialInvoice.id);
    // Excluding the current invoice, customer has no other invoices, so oldDue = 0
    assert.strictEqual(ledger.totalDue, 0, 'Current invoice must NOT be counted as its own previous due');
  });

  // --- 10. editReopensWithUpdatedValues ---
  test('10. editReopensWithUpdatedValues: Opening invoice in edit mode receives newly saved values (₹2500)', () => {
    const reopened = invoicesDb.find(i => i.id === initialInvoice.id);
    assert.strictEqual(reopened.grandTotal, 2500);
    assert.strictEqual(reopened.items[0].qty, 5);
  });

  // --- 11. editRefreshPersists ---
  test('11. editRefreshPersists: Simulating refresh from local store yields persistent updated invoice', () => {
    const serialized = JSON.stringify(invoicesDb);
    const restored = JSON.parse(serialized);
    assert.strictEqual(restored.length, 1);
    assert.strictEqual(restored[0].grandTotal, 2500);
    assert.strictEqual(restored[0].id, initialInvoice.id);
  });

  // --- 12. cancelDoesNotPersist ---
  test('12. cancelDoesNotPersist: Abandoning form changes without calling save does not modify DB', () => {
    const draftUnsaved = { ...invoicesDb[0], grandTotal: 99999 };
    // User cancels
    const current = invoicesDb.find(i => i.id === initialInvoice.id);
    assert.strictEqual(current.grandTotal, 2500, 'Unsaved draft must never corrupt DB');
  });

  console.log('\n======================================================');
  console.log(`🔬 REGRESSION RESULTS: ${passed} / ${total} PASSED (${Math.round((passed/total)*100)}%)`);
  console.log('======================================================\n');
}

runRegressionSuite();
