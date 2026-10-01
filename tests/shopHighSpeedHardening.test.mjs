import test from 'node:test';
import assert from 'node:assert/strict';

// Mock localStorage and window
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear()
};
const mockStyle = { innerHTML: '', data: '', setAttribute: () => {}, appendChild: () => {}, firstChild: { data: '' } };
globalThis.document = {
  createElement: () => mockStyle,
  head: { appendChild: () => {} },
  body: { appendChild: () => {} },
  querySelector: () => mockStyle
};
globalThis.window = {
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
  location: { origin: 'http://localhost:3000' },
  _goober: mockStyle
};
globalThis.CustomEvent = class {
  constructor(type, eventInitDict) {
    this.type = type;
    this.detail = eventInitDict?.detail;
  }
};
globalThis.Event = class {
  constructor(type) {
    this.type = type;
  }
};

test('SHOP HIGH-SPEED & STABILITY HARDENING SUITE', async (t) => {
  const { exportBackup, importRestore } = await import('../src/services/dbEngine.js');
  const { bankEngine, paiseToRupees } = await import('../src/services/bankEngine.js');
  const { subscriptionEngine } = await import('../src/services/subscriptionEngine.js');

  await t.test('1. Free plan has valid operational limits and features', () => {
    const details = subscriptionEngine.getSubscriptionDetailsSync({ plan: 'free' });
    assert.equal(details.planId, 'free');
    assert.ok(details.features.includes('pdf_download'));
    assert.ok(details.features.includes('basic_invoicing'));
  });

  await t.test('2. Bank autoPostPayment maps payment methods to appropriate accounts', async () => {
    // PhonePe payment
    const phonePeTx = await bankEngine.autoPostPayment({
      id: 'pay-phonepe-001',
      invoiceNumber: 'INV-101',
      customerName: 'Rahim Ali',
      amount: 450,
      method: 'PhonePe'
    });
    assert.ok(phonePeTx);
    assert.equal(phonePeTx.account, 'PhonePe');
    assert.equal(paiseToRupees(phonePeTx.amountPaise), 450);

    // Cash payment
    const cashTx = await bankEngine.autoPostPayment({
      id: 'pay-cash-002',
      invoiceNumber: 'INV-102',
      customerName: 'Karim Uddin',
      amount: 1200,
      method: 'Cash'
    });
    assert.ok(cashTx);
    assert.equal(cashTx.account, 'Cash');
    assert.equal(paiseToRupees(cashTx.amountPaise), 1200);

    // Bank transfer payment
    const bankTx = await bankEngine.autoPostPayment({
      id: 'pay-bank-003',
      invoiceNumber: 'INV-103',
      customerName: 'Faruk Mia',
      amount: 5000,
      method: 'Bank Transfer'
    });
    assert.ok(bankTx);
    assert.equal(bankTx.account, 'Bank Account');
    assert.equal(paiseToRupees(bankTx.amountPaise), 5000);
  });

  await t.test('3. importRestore accepts partial backup files without throwing missing key error', async () => {
    // Only invoices provided
    await assert.doesNotReject(async () => {
      await importRestore({
        invoices: [
          { id: 'inv-test-1', invoiceNumber: 'INV-001', grandTotal: 500 }
        ]
      });
    }, 'Should not throw Missing database key error for partial backup');

    // Direct invoice array
    await assert.doesNotReject(async () => {
      await importRestore([
        { id: 'inv-test-2', invoiceNumber: 'INV-002', grandTotal: 800 }
      ]);
    }, 'Should accept direct array of invoices');

    // Single invoice
    await assert.doesNotReject(async () => {
      await importRestore({
        id: 'inv-test-3',
        invoiceNumber: 'INV-003',
        grandTotal: 1500
      });
    }, 'Should accept single invoice object');
  });

  await t.test('4. PDF hash and canonical models resolve cleanly with missing business settings', async () => {
    const { calculateInvoicePdfHash } = await import('../src/utils/pdfCacheEngine.js');
    const { buildCanonicalRenderModel } = await import('../src/utils/normalizeInvoiceModel.js');

    const bareInvoice = {
      id: 'bare-1',
      invoiceNumber: 'INV-999',
      grandTotal: 1000
    };

    // calculateInvoicePdfHash without business settings
    const hash = await calculateInvoicePdfHash(bareInvoice, {});
    assert.ok(hash && typeof hash === 'string', 'Hash should be computed successfully');

    // buildCanonicalRenderModel without business settings
    const canonical = buildCanonicalRenderModel(bareInvoice, {});
    assert.ok(canonical, 'Canonical model should not be null');
    assert.equal(canonical.businessPrefs.businessName, 'BillQyro Store');
    assert.equal(canonical.financials.grandTotal, 1000);
  });
});
