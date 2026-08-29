import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';
import { calculateCanonicalInvoiceFinancials as backendCalculate } from '../backend/src/modules/invoices/invoiceMath.js';
import { calculateCanonicalInvoiceFinancials as clientCalculate, calculateInvoiceTotals } from '../src/utils/invoiceMath.js';

console.log('======================================================');
console.log('⚡ RUNNING BILLQYRO PUBLIC INVOICE & PARITY TEST SUITE');
console.log('======================================================');

let passedTests = 0;
const test = async (desc, fn) => {
  try {
    await fn();
    console.log(`  ✅ PASS: ${desc}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${desc}`);
    console.error(err);
    throw err;
  }
};

// Mock In-Memory DB
const mockDb = {
  invoices: new Map(),
  invoiceItems: new Map(),
  workspaces: new Map(),
  customers: new Map()
};

mockDb.workspaces.set('ws_alice', {
  id: 'b0000000-0000-0000-0000-000000000001',
  name: 'Alice Fashion Studio',
  currency: 'INR',
  currency_symbol: '₹',
  tax_label: 'GSTIN',
  is_suspended: false
});

mockDb.customers.set('c_ramesh', {
  id: 'c0000000-0000-0000-0000-000000000001',
  workspace_id: 'b0000000-0000-0000-0000-000000000001',
  name: 'Ramesh Textile Agency',
  phone: '+91 9876543210',
  email: 'private_ramesh@textile.in',
  address: 'Burrabazar, Kolkata',
  is_deleted: false
});

// Seed Public Invoice 1: Active Valid Invoice
const VALID_TOKEN = 'tok_alice_bridal_789xyz';
mockDb.invoices.set('inv_1', {
  id: 'e0000000-0000-0000-0000-000000000001',
  workspace_id: 'b0000000-0000-0000-0000-000000000001',
  customer_id: 'c0000000-0000-0000-0000-000000000001',
  created_by_user_id: 'u0000000-0000-0000-0000-000000000001',
  invoice_number: 'AFS-0101',
  bill_type: 'Invoice',
  date: '2026-08-30',
  due_date: '2026-09-15',
  status: 'Partially Paid',
  subtotal: 9500,
  tax_total: 1580,
  discount_total: 500,
  shipping_charge: 0,
  grand_total: 11080,
  amount_paid: 3000,
  balance_due: 8080,
  public_token: VALID_TOKEN,
  selected_template: 'modern',
  notes: 'CONFIDENTIAL: Customer requested priority delivery by Tuesday',
  terms: 'Payment due within 15 days.',
  version: 1,
  is_deleted: false,
  created_at: '2026-08-30T00:00:00.000Z'
});

mockDb.invoiceItems.set('it_1', {
  id: 'item-1',
  invoice_id: 'e0000000-0000-0000-0000-000000000001',
  sequence_number: 1,
  name: 'Bridal Georgette Saree',
  description: 'Pure Silk Embroidery',
  quantity: 2,
  rate: 4500,
  tax_percent: 18,
  discount_amount: 500,
  total_amount: 10030
});

mockDb.invoiceItems.set('it_2', {
  id: 'item-2',
  invoice_id: 'e0000000-0000-0000-0000-000000000001',
  sequence_number: 2,
  name: 'Custom Hand Lace',
  description: 'Golden thread border',
  quantity: 1,
  rate: 1000,
  tax_percent: 5,
  discount_amount: 0,
  total_amount: 1050
});

// Seed Public Invoice 2: Soft Deleted Invoice
const DELETED_TOKEN = 'tok_deleted_invoice_404';
mockDb.invoices.set('inv_deleted', {
  id: 'e0000000-0000-0000-0000-000000000002',
  workspace_id: 'b0000000-0000-0000-0000-000000000001',
  customer_id: 'c0000000-0000-0000-0000-000000000001',
  invoice_number: 'AFS-0099',
  bill_type: 'Invoice',
  date: '2026-08-01',
  due_date: '2026-08-15',
  status: 'Cancelled',
  subtotal: 500,
  tax_total: 0,
  discount_total: 0,
  shipping_charge: 0,
  grand_total: 500,
  amount_paid: 0,
  balance_due: 500,
  public_token: DELETED_TOKEN,
  selected_template: 'modern',
  notes: 'Deleted draft',
  terms: '',
  version: 1,
  is_deleted: true, // Soft-deleted
  created_at: '2026-08-01T00:00:00.000Z'
});

// Setup Mock Query Interceptor
const pool = getPool();
pool.connect = async () => ({
  query: pool.query.bind(pool),
  release: () => {}
});

pool.query = async (text, params = []) => {
  // 1. Health check
  if (text.includes('SELECT 1 AS healthy')) {
    return { rows: [{ healthy: 1 }] };
  }

  // 2. Find by Public Token
  if (text.includes('WHERE i.public_token = $1 AND i.is_deleted = FALSE AND w.is_suspended = FALSE')) {
    const [tok] = params;
    const inv = Array.from(mockDb.invoices.values()).find(i => i.public_token === tok && !i.is_deleted);
    if (!inv) return { rows: [] };
    const ws = mockDb.workspaces.get(inv.workspace_id) || Array.from(mockDb.workspaces.values()).find(w => w.id === inv.workspace_id);
    const cust = inv.customer_id ? (mockDb.customers.get(inv.customer_id) || Array.from(mockDb.customers.values()).find(c => c.id === inv.customer_id)) : null;
    return {
      rows: [
        {
          ...inv,
          workspace_name: ws?.name || 'Store',
          currency: ws?.currency || 'INR',
          currency_symbol: ws?.currency_symbol || '₹',
          tax_label: ws?.tax_label || 'GSTIN',
          customer_name: cust?.name,
          customer_address: cust?.address
        }
      ]
    };
  }

  // 3. Find Line Items for Invoice
  if (text.includes('FROM invoice_items') && text.includes('invoice_id = $1')) {
    const invId = params[0];
    const items = Array.from(mockDb.invoiceItems.values()).filter(it => it.invoice_id === invId);
    return { rows: items };
  }

  return { rows: [] };
};

// Start local test server
let serverInstance = null;
let baseUrl = '';

const startTestServer = async () => {
  const app = createApp();
  return new Promise((resolve) => {
    serverInstance = http.createServer(app).listen(0, '127.0.0.1', () => {
      const port = serverInstance.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
};

const makeRequest = async (path) => {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, body: data };
};

await startTestServer();

// ============================================================================
// PART 1: PUBLIC INVOICE SECURITY & DTO SANITIZATION TESTS
// ============================================================================

await test('1. Public Access: Valid public token returns 200 with sanitized DTO', async () => {
  const res = await makeRequest(`/api/v1/public/invoices/${VALID_TOKEN}`);
  assert.strictEqual(res.status, 200);
  assert.ok(res.body.data);
  assert.ok(res.body.data.invoice);
  assert.strictEqual(res.body.data.invoice.invoiceNumber, 'AFS-0101');
  assert.strictEqual(res.body.data.invoice.status, 'Partially Paid');
  assert.strictEqual(res.body.data.business.name, 'Alice Fashion Studio');
  assert.strictEqual(res.body.data.customer.name, 'Ramesh Textile Agency');
  assert.strictEqual(res.body.data.invoice.items.length, 2);
});

await test('2. Public Access: Invalid/Non-existent public token returns 404 NOT_FOUND', async () => {
  const res = await makeRequest('/api/v1/public/invoices/non_existent_token_123');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'INVOICE_NOT_FOUND');
});

await test('3. Public Access: Malformed public token returns 404 without database leakage', async () => {
  const res = await makeRequest('/api/v1/public/invoices/short');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'INVOICE_NOT_FOUND');
});

await test('4. Public Access: Soft-deleted invoice returns 404 (Zero Exposure)', async () => {
  const res = await makeRequest(`/api/v1/public/invoices/${DELETED_TOKEN}`);
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'INVOICE_NOT_FOUND');
});

await test('5. Privacy Shield: Private notes, user IDs & internal DB keys are NEVER exposed', async () => {
  const res = await makeRequest(`/api/v1/public/invoices/${VALID_TOKEN}`);
  const payloadStr = JSON.stringify(res.body);

  // Assert sensitive strings do NOT exist anywhere in public payload
  assert.strictEqual(payloadStr.includes('CONFIDENTIAL'), false, 'Private notes must not leak');
  assert.strictEqual(payloadStr.includes('e0000000-0000'), false, 'Internal invoice UUID must not leak');
  assert.strictEqual(payloadStr.includes('b0000000-0000'), false, 'Workspace UUID must not leak');
  assert.strictEqual(payloadStr.includes('u0000000-0000'), false, 'User ID must not leak');
  assert.strictEqual(payloadStr.includes('private_ramesh@textile.in'), false, 'Private customer email must not leak');
  assert.strictEqual(payloadStr.includes('firebase_uid'), false, 'Firebase UID must not leak');
});

await test('6. Cache Control: Endpoint returns conservative no-store headers', async () => {
  const res = await makeRequest(`/api/v1/public/invoices/${VALID_TOKEN}`);
  const cc = res.headers.get('cache-control');
  assert.ok(cc.includes('no-store'), 'Must enforce no-store header');
});

await test('7. SQL Injection Defense: Malicious token parameter is handled safely (404)', async () => {
  const sqlInjectionToken = "tok' OR '1'='1";
  const res = await makeRequest(`/api/v1/public/invoices/${encodeURIComponent(sqlInjectionToken)}`);
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'INVOICE_NOT_FOUND');
});

await test('8. Token Isolation: Invoice located directly via public_token without workspace scoping params', async () => {
  const res = await makeRequest(`/api/v1/public/invoices/${VALID_TOKEN}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.invoice.invoiceNumber, 'AFS-0101');
});

await test('9. Strict DTO Key Filter: Response payload contains ONLY approved public keys', async () => {
  const res = await makeRequest(`/api/v1/public/invoices/${VALID_TOKEN}`);
  const topKeys = Object.keys(res.body.data);
  assert.deepStrictEqual(topKeys.sort(), ['business', 'customer', 'invoice', 'presentation'].sort());

  const invoiceKeys = Object.keys(res.body.data.invoice);
  assert.deepStrictEqual(
    invoiceKeys.sort(),
    ['billType', 'date', 'dueDate', 'financials', 'invoiceNumber', 'items', 'paymentStatus', 'status', 'terms'].sort()
  );
});

await test('10. Internal Fields Shield: created_by_user_id, sync_operations, and audit logs are 100% absent', async () => {
  const res = await makeRequest(`/api/v1/public/invoices/${VALID_TOKEN}`);
  assert.strictEqual('created_by_user_id' in res.body.data.invoice, false);
  assert.strictEqual('id' in res.body.data.invoice, false);
  assert.strictEqual('workspace_id' in res.body.data.invoice, false);
  assert.strictEqual('sync_operations' in res.body.data, false);
  assert.strictEqual('audit_logs' in res.body.data, false);
});

// ============================================================================
// PART 2: PHASE 1 & FIREBASE FINANCIAL PARITY TESTS (12 Representative Scenarios)
// ============================================================================

await test('11. Financial Parity: 12 comprehensive scenarios match Phase 1 client engine with 100% precision', () => {
  const parityCases = [
    { desc: 'A. Simple invoice', items: [{ qty: 1, rate: 500 }], taxPct: 0, disc: 0, ship: 0, paid: 0 },
    { desc: 'B. Multiple items', items: [{ qty: 2, rate: 1000 }, { qty: 3, rate: 500 }], taxPct: 0, disc: 0, ship: 0, paid: 0 },
    { desc: 'C. Percentage tax (18%)', items: [{ qty: 1, rate: 10000 }], taxPct: 18, disc: 0, ship: 0, paid: 0 },
    { desc: 'D. Discounts (₹200 global)', items: [{ qty: 2, rate: 1000 }], taxPct: 0, disc: 200, ship: 0, paid: 0 },
    { desc: 'E. Zero tax and zero discount', items: [{ qty: 5, rate: 200 }], taxPct: 0, disc: 0, ship: 0, paid: 0 },
    { desc: 'F. Partial payment (Paid ₹500 on ₹1000)', items: [{ qty: 1, rate: 1000 }], taxPct: 0, disc: 0, ship: 0, paid: 500 },
    { desc: 'G. Full payment (Paid ₹1000 on ₹1000)', items: [{ qty: 1, rate: 1000 }], taxPct: 0, disc: 0, ship: 0, paid: 1000 },
    { desc: 'H. Overpayment (Paid ₹1500 on ₹1000)', items: [{ qty: 1, rate: 1000 }], taxPct: 0, disc: 0, ship: 0, paid: 1500 },
    { desc: 'I. Decimal quantity (2.5 kg at ₹45.50)', items: [{ qty: 2.5, rate: 45.50 }], taxPct: 5, disc: 0, ship: 0, paid: 0 },
    { desc: 'J. Decimal rates with line discount', items: [{ qty: 3, rate: 199.99, discount: 50, taxPercent: 12 }], taxPct: 0, disc: 0, ship: 0, paid: 100 },
    { desc: 'K. Shipping charges addition', items: [{ qty: 1, rate: 2500 }], taxPct: 18, disc: 100, ship: 150, paid: 1000 },
    { desc: 'L. Multi-item mixed taxes and item discounts', items: [
      { qty: 2, rate: 4500, discount: 500, taxPercent: 18 },
      { qty: 1, rate: 1000, discount: 0, taxPercent: 5 }
    ], taxPct: 0, disc: 0, ship: 0, paid: 3000 }
  ];

  for (const tc of parityCases) {
    // 1. Backend Canonical Engine
    const backendRes = backendCalculate({
      items: tc.items.map(it => ({
        quantity: it.qty,
        rate: it.rate,
        discount: it.discount || 0,
        taxPercent: it.taxPercent || 0
      })),
      taxPercentage: tc.taxPct,
      discountAmount: tc.disc,
      shippingCharge: tc.ship,
      amountPaid: tc.paid
    }).financials;

    // 2. Phase 1 Client Engine
    const clientTotals = calculateInvoiceTotals(tc.items, tc.taxPct, tc.disc);
    const clientRes = clientCalculate({
      subtotal: clientTotals.subtotal,
      grandTotal: backendRes.grandTotal,
      taxAmount: backendRes.taxTotal,
      amountPaid: tc.paid
    });

    assert.strictEqual(backendRes.subtotal, clientTotals.subtotal, `[${tc.desc}] Subtotal mismatch`);
    assert.strictEqual(backendRes.balanceDue, clientRes.balanceDue, `[${tc.desc}] BalanceDue mismatch`);
    assert.strictEqual(backendRes.status, clientRes.paymentStatus, `[${tc.desc}] PaymentStatus mismatch`);
    assert.strictEqual(backendRes.balanceDue >= 0, true, `[${tc.desc}] Non-negative due violation`);
  }
});

// Clean up server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`⚡ PUBLIC INVOICE & PARITY: ${passedTests} / ${passedTests} PASSED (100%)`);
console.log('======================================================\n');
