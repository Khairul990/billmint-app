import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';

console.log('======================================================');
console.log('⚡ RUNNING BILLQYRO PAYMENTS LEDGER & AUDIT TRAIL SUITE');
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

// In-Memory Database Mock for API Testing
const mockDb = {
  users: new Map(),
  workspaces: new Map(),
  workspaceMembers: new Map(),
  customers: new Map(),
  invoices: new Map(),
  invoiceItems: new Map(),
  payments: new Map(),
  auditLogs: new Map(),
  syncOperations: new Map()
};

// Seed Users
mockDb.users.set('u_alice', {
  id: 'a0000000-0000-0000-0000-000000000001',
  firebase_uid: 'fb_dev_user_alice',
  email: 'alice@dev.billqyro.local',
  full_name: 'Alice Enterprise Dev',
  system_role: 'user'
});

mockDb.users.set('u_bob', {
  id: 'a0000000-0000-0000-0000-000000000002',
  firebase_uid: 'fb_dev_user_bob',
  email: 'bob@dev.billqyro.local',
  full_name: 'Bob Retailer Dev',
  system_role: 'user'
});

// Seed Workspaces
mockDb.workspaces.set('ws_alice', {
  id: 'b0000000-0000-0000-0000-000000000001',
  owner_id: 'a0000000-0000-0000-0000-000000000001',
  name: 'Alice Fashion Studio',
  currency: 'INR',
  currency_symbol: '₹',
  tax_label: 'GSTIN',
  is_suspended: false
});

mockDb.workspaces.set('ws_bob', {
  id: 'b0000000-0000-0000-0000-000000000002',
  owner_id: 'a0000000-0000-0000-0000-000000000002',
  name: 'Bob Electronics Hub',
  currency: 'INR',
  currency_symbol: '₹',
  tax_label: 'GSTIN',
  is_suspended: false
});

// Seed Memberships
mockDb.workspaceMembers.set('wm_alice', {
  workspace_id: 'b0000000-0000-0000-0000-000000000001',
  user_id: 'a0000000-0000-0000-0000-000000000001',
  role: 'owner'
});

mockDb.workspaceMembers.set('wm_bob', {
  workspace_id: 'b0000000-0000-0000-0000-000000000002',
  user_id: 'a0000000-0000-0000-0000-000000000002',
  role: 'owner'
});

// Seed Customers
mockDb.customers.set('c_alice_1', {
  id: 'c0000000-0000-0000-0000-000000000001',
  workspace_id: 'b0000000-0000-0000-0000-000000000001',
  name: 'Ramesh Textile Agency',
  opening_due: 0,
  current_due: 1000,
  is_deleted: false
});

// Seed Invoices
const ALICE_INV_ID = 'e0000000-0000-0000-0000-000000000001';
const BOB_INV_ID = 'e0000000-0000-0000-0000-000000000002';
const PUBLIC_TOKEN_ALICE = 'tok_alice_payment_test_123';

mockDb.invoices.set(ALICE_INV_ID, {
  id: ALICE_INV_ID,
  workspace_id: 'b0000000-0000-0000-0000-000000000001',
  customer_id: 'c0000000-0000-0000-0000-000000000001',
  invoice_number: 'AFS-0501',
  bill_type: 'Invoice',
  date: '2026-08-30',
  due_date: '2026-09-15',
  status: 'Unpaid',
  subtotal: 1000,
  tax_total: 0,
  discount_total: 0,
  shipping_charge: 0,
  grand_total: 1000,
  amount_paid: 0,
  balance_due: 1000,
  public_token: PUBLIC_TOKEN_ALICE,
  is_deleted: false,
  created_at: new Date().toISOString()
});

mockDb.invoiceItems.set('item-inv-1', {
  id: 'item-inv-1',
  invoice_id: ALICE_INV_ID,
  sequence_number: 1,
  name: 'Test Garment',
  quantity: 1,
  rate: 1000,
  tax_percent: 0,
  discount_amount: 0,
  total_amount: 1000
});

mockDb.invoices.set(BOB_INV_ID, {
  id: BOB_INV_ID,
  workspace_id: 'b0000000-0000-0000-0000-000000000002',
  customer_id: null,
  invoice_number: 'BEH-0001',
  bill_type: 'Invoice',
  date: '2026-08-30',
  due_date: null,
  status: 'Unpaid',
  subtotal: 5000,
  tax_total: 0,
  discount_total: 0,
  shipping_charge: 0,
  grand_total: 5000,
  amount_paid: 0,
  balance_due: 5000,
  public_token: 'tok_bob_payment_test_456',
  is_deleted: false,
  created_at: new Date().toISOString()
});

// Mock Query Interceptor
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

  // 2. Workspace Membership check
  if (text.includes('FROM workspace_members wm') && text.includes('JOIN users u')) {
    const [wsId, fbUid, email] = params;
    const user = Array.from(mockDb.users.values()).find(u => u.firebase_uid === fbUid || u.email === email);
    if (!user) return { rows: [] };
    const member = Array.from(mockDb.workspaceMembers.values()).find(wm => wm.workspace_id === wsId && wm.user_id === user.id);
    if (!member) return { rows: [] };
    return { rows: [{ role: member.role, user_id: user.id }] };
  }

  // 3. Find Sync Operation
  if (text.includes('FROM sync_operations') && text.includes('client_tx_id = $2')) {
    const [wsId, clientTxId] = params;
    const op = Array.from(mockDb.syncOperations.values()).find(s => s.workspace_id === wsId && s.client_tx_id === clientTxId);
    return { rows: op ? [op] : [] };
  }

  // 4. Lock Invoice For Update
  if (text.includes('FROM invoices') && text.includes('FOR UPDATE')) {
    const [invId, wsId] = params;
    const inv = mockDb.invoices.get(invId);
    if (inv && inv.workspace_id === wsId && !inv.is_deleted) {
      return { rows: [inv] };
    }
    return { rows: [] };
  }

  // 5. Sum Ledger Payments
  if (text.includes('COALESCE(SUM(amount), 0) AS total_paid') && text.includes('FROM payments')) {
    const [wsId, invId] = params;
    const payments = Array.from(mockDb.payments.values()).filter(p => p.workspace_id === wsId && p.invoice_id === invId);
    const sum = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    return { rows: [{ total_paid: sum }] };
  }

  // 6. Insert Payment
  if (text.includes('INSERT INTO payments')) {
    const [wsId, invId, custId, amount, method, ref, date, notes, createdBy] = params;
    const newPayment = {
      id: `p0000000-0000-0000-0000-${String(mockDb.payments.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      invoice_id: invId,
      customer_id: custId,
      amount,
      payment_method: method,
      transaction_reference: ref,
      payment_date: date,
      notes,
      created_by: createdBy,
      created_at: new Date().toISOString()
    };
    mockDb.payments.set(newPayment.id, newPayment);
    return { rows: [newPayment] };
  }

  // 7. Update Invoice Financials
  if (text.includes('UPDATE invoices') && text.includes('SET amount_paid = $1')) {
    const [amountPaid, balanceDue, status, invId, wsId] = params;
    const inv = mockDb.invoices.get(invId);
    if (inv && inv.workspace_id === wsId) {
      inv.amount_paid = amountPaid;
      inv.balance_due = balanceDue;
      inv.status = status;
      inv.updated_at = new Date().toISOString();
      return { rows: [inv] };
    }
    return { rows: [] };
  }

  // 8. Sync Customer Current Due
  if (text.includes('UPDATE customers') && text.includes('current_due = GREATEST(0')) {
    const [custId, wsId] = params;
    const cust = mockDb.customers.get(custId) || Array.from(mockDb.customers.values()).find(c => c.id === custId);
    if (cust && cust.workspace_id === wsId) {
      const invs = Array.from(mockDb.invoices.values()).filter(i => i.customer_id === cust.id && !i.is_deleted);
      const totalDue = invs.reduce((acc, i) => acc + (parseFloat(i.balance_due) || 0), 0);
      cust.current_due = (parseFloat(cust.opening_due) || 0) + totalDue;
      return { rows: [cust] };
    }
    return { rows: [] };
  }

  // 9. Insert Audit Log
  if (text.includes('INSERT INTO audit_logs')) {
    const [wsId, userId, userEmail, action, entityType, entityId, beforeState, afterState, ip, agent] = params;
    const newLog = {
      id: `log-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      workspace_id: wsId,
      user_id: userId,
      user_email: userEmail,
      action,
      entity_type: entityType,
      entity_id: entityId,
      before_state: typeof beforeState === 'string' ? JSON.parse(beforeState) : beforeState,
      after_state: typeof afterState === 'string' ? JSON.parse(afterState) : afterState,
      ip_address: ip,
      user_agent: agent,
      created_at: new Date().toISOString()
    };
    mockDb.auditLogs.set(newLog.id, newLog);
    return { rows: [newLog] };
  }

  // 10. Insert Sync Operation
  if (text.includes('INSERT INTO sync_operations')) {
    const [wsId, userId, clientTxId, entityType, docId, action, payload] = params;
    const newOp = {
      id: `sync-${Date.now()}`,
      workspace_id: wsId,
      user_id: userId,
      client_tx_id: clientTxId,
      entity_type: entityType,
      doc_id: docId,
      action,
      payload,
      status: 'COMPLETED',
      processed_at: new Date().toISOString()
    };
    mockDb.syncOperations.set(newOp.id, newOp);
    return { rows: [newOp] };
  }

  // 11. Find Payment by ID
  if (text.includes('FROM payments p') && text.includes('WHERE p.id = $1 AND p.workspace_id = $2')) {
    const [payId, wsId] = params;
    const payment = mockDb.payments.get(payId);
    if (payment && payment.workspace_id === wsId) {
      const inv = mockDb.invoices.get(payment.invoice_id);
      return {
        rows: [
          {
            ...payment,
            invoice_number: inv?.invoice_number,
            invoice_amount_paid: inv?.amount_paid,
            invoice_balance_due: inv?.balance_due,
            invoice_status: inv?.status
          }
        ]
      };
    }
    return { rows: [] };
  }

  // 12. List Payments
  if (text.includes('FROM payments p') && text.includes('WHERE p.workspace_id = $1')) {
    const wsId = params[0];
    let list = Array.from(mockDb.payments.values()).filter(p => p.workspace_id === wsId);
    const invoiceIdParam = params.find(p => typeof p === 'string' && p.startsWith('e0000000-'));
    if (invoiceIdParam) {
      list = list.filter(p => p.invoice_id === invoiceIdParam);
    }
    const fullCount = list.length;
    const limit = params[params.length - 2] || 25;
    const offset = params[params.length - 1] || 0;
    const paged = list.slice(offset, offset + limit).map(p => {
      const inv = mockDb.invoices.get(p.invoice_id);
      return { ...p, invoice_number: inv?.invoice_number, full_count: fullCount };
    });
    return { rows: paged };
  }

  // 13. Find Public Invoice
  if (text.includes('WHERE i.public_token = $1 AND i.is_deleted = FALSE AND w.is_suspended = FALSE')) {
    const [tok] = params;
    const inv = Array.from(mockDb.invoices.values()).find(i => i.public_token === tok && !i.is_deleted);
    if (!inv) return { rows: [] };
    const ws = mockDb.workspaces.get(inv.workspace_id);
    const cust = inv.customer_id ? mockDb.customers.get(inv.customer_id) : null;
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

  // 14. Find Line Items for Invoice
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

const makeRequest = async (path, options = {}) => {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, headers: res.headers, body: data };
};

await startTestServer();

const ALICE_WS_ID = 'b0000000-0000-0000-0000-000000000001';
const BOB_WS_ID = 'b0000000-0000-0000-0000-000000000002';
const ALICE_AUTH = { 'Authorization': 'Bearer valid_dev_token_alice' };
const BOB_AUTH = { 'Authorization': 'Bearer valid_dev_token_bob' };

// ============================================================================
// PART 1: VALIDATION & SECURITY CHECKS
// ============================================================================

await test('1. Validation: Zero payment amount is rejected (400)', async () => {
  const res = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: ALICE_WS_ID,
      invoiceId: ALICE_INV_ID,
      amount: 0,
      paymentMethod: 'UPI'
    }
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('2. Validation: Negative payment amount is rejected (400)', async () => {
  const res = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: ALICE_WS_ID,
      invoiceId: ALICE_INV_ID,
      amount: -500,
      paymentMethod: 'UPI'
    }
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('3. Validation: Unsupported payment method is rejected (400)', async () => {
  const res = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: ALICE_WS_ID,
      invoiceId: ALICE_INV_ID,
      amount: 100,
      paymentMethod: 'CryptoBitcoin'
    }
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('4. Security: Cross-workspace invoice reference is blocked (404)', async () => {
  // Alice tries to record a payment on Bob's invoice
  const res = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: ALICE_WS_ID,
      invoiceId: BOB_INV_ID,
      amount: 200,
      paymentMethod: 'Cash'
    }
  });
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'INVOICE_NOT_FOUND');
});

await test('5. Security: Unauthorized workspace access is blocked (403)', async () => {
  // Alice tries to record payment directly into Bob's workspace
  const res = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: BOB_WS_ID,
      invoiceId: BOB_INV_ID,
      amount: 200,
      paymentMethod: 'Cash'
    }
  });
  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

// ============================================================================
// PART 2: ATOMIC PAYMENT, FINANCIAL INVARIANTS & AUDIT LOGS
// ============================================================================

let firstPaymentId = null;

await test('6. Atomic Partial Payment: ₹400 payment updates invoice due to ₹600 and Partially Paid (201)', async () => {
  const res = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: ALICE_WS_ID,
      invoiceId: ALICE_INV_ID,
      amount: 400,
      paymentMethod: 'UPI',
      transactionReference: 'UPI/20260830/987654',
      clientTxId: 'tx_pay_client_001'
    }
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.payment.amount, 400);
  assert.strictEqual(res.body.data.payment.paymentMethod, 'UPI');
  assert.strictEqual(res.body.data.invoice.amountPaid, 400);
  assert.strictEqual(res.body.data.invoice.balanceDue, 600);
  assert.strictEqual(res.body.data.invoice.status, 'Partially Paid');
  firstPaymentId = res.body.data.payment.id;
});

await test('7. Audit Trail: Successful payment records append-only audit log with before/after state', () => {
  const logs = Array.from(mockDb.auditLogs.values()).filter(l => l.entity_id === firstPaymentId);
  assert.strictEqual(logs.length, 1);
  assert.strictEqual(logs[0].action, 'PAYMENT_CREATED');
  assert.strictEqual(logs[0].entity_type, 'payment');
  assert.strictEqual(logs[0].before_state.amountPaid, 0);
  assert.strictEqual(logs[0].after_state.amountPaid, 400);
  assert.strictEqual(logs[0].after_state.balanceDue, 600);
});

await test('8. Idempotency: Duplicate clientTxId returns original payment record (Zero Duplication)', async () => {
  const initialPaymentCount = mockDb.payments.size;
  const res = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: ALICE_WS_ID,
      invoiceId: ALICE_INV_ID,
      amount: 400,
      paymentMethod: 'UPI',
      clientTxId: 'tx_pay_client_001' // Duplicate clientTxId
    }
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.payment.id, firstPaymentId);
  assert.strictEqual(res.body.data.isIdempotentReplay, true);
  assert.strictEqual(mockDb.payments.size, initialPaymentCount, 'Must not insert duplicate payment');
});

await test('9. Full Settlement: Subsequent ₹600 payment updates balance to ₹0 and status to Paid', async () => {
  const res = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: ALICE_WS_ID,
      invoiceId: ALICE_INV_ID,
      amount: 600,
      paymentMethod: 'Bank Transfer'
    }
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.invoice.amountPaid, 1000);
  assert.strictEqual(res.body.data.invoice.balanceDue, 0);
  assert.strictEqual(res.body.data.invoice.status, 'Paid');
});

await test('10. Overpayment Invariant: Additional ₹500 payment maintains balanceDue = 0 (Never Negative)', async () => {
  const res = await makeRequest('/api/v1/payments', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: ALICE_WS_ID,
      invoiceId: ALICE_INV_ID,
      amount: 500,
      paymentMethod: 'Cash'
    }
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.invoice.amountPaid, 1500);
  assert.strictEqual(res.body.data.invoice.balanceDue, 0, 'balanceDue must strictly remain 0');
  assert.strictEqual(res.body.data.invoice.status, 'Paid');
});

// ============================================================================
// PART 3: PUBLIC INVOICE INTEGRATION & CONCURRENCY
// ============================================================================

await test('11. Public Invoice Integration: Public invoice API reflects updated payments and zero balance', async () => {
  const res = await makeRequest(`/api/v1/public/invoices/${PUBLIC_TOKEN_ALICE}`);
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.invoice.financials.amountPaid, 1500);
  assert.strictEqual(res.body.data.invoice.financials.balanceDue, 0);
  assert.strictEqual(res.body.data.invoice.status, 'Paid');
});

await test('12. Payment History: GET /api/v1/payments returns paginated payment list for invoice', async () => {
  const res = await makeRequest(`/api/v1/payments?workspaceId=${ALICE_WS_ID}&invoiceId=${ALICE_INV_ID}&limit=10&offset=0`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body.data));
  assert.strictEqual(res.body.pagination.total, 3); // ₹400 + ₹600 + ₹500
});

await test('13. Concurrency Safety: 10 concurrent duplicate submissions produce exactly 1 payment record', async () => {
  const duplicateTxId = 'tx_concurrent_duplicate_999';
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(
      makeRequest('/api/v1/payments', {
        method: 'POST',
        headers: ALICE_AUTH,
        body: {
          workspaceId: ALICE_WS_ID,
          invoiceId: ALICE_INV_ID,
          amount: 50,
          paymentMethod: 'Cash',
          clientTxId: duplicateTxId
        }
      })
    );
  }

  const responses = await Promise.all(promises);
  const successful = responses.filter(r => r.status === 201);
  assert.strictEqual(successful.length, 10);
  const paymentIds = new Set(responses.map(r => r.body.data?.payment?.id));
  assert.strictEqual(paymentIds.size, 1, 'All 10 concurrent requests must resolve to the identical single payment');
});

await test('14. High Concurrency: 50 simultaneous payments maintain accurate ledger aggregation', async () => {
  // Create dedicated fresh invoice for 50-concurrency test
  const CONCURRENT_INV_ID = 'e0000000-0000-0000-0000-000000000099';
  mockDb.invoices.set(CONCURRENT_INV_ID, {
    id: CONCURRENT_INV_ID,
    workspace_id: ALICE_WS_ID,
    customer_id: null,
    invoice_number: 'AFS-0999',
    bill_type: 'Invoice',
    date: '2026-08-30',
    grand_total: 5000,
    amount_paid: 0,
    balance_due: 5000,
    status: 'Unpaid',
    is_deleted: false,
    created_at: new Date().toISOString()
  });

  const promises = [];
  for (let i = 0; i < 50; i++) {
    promises.push(
      makeRequest('/api/v1/payments', {
        method: 'POST',
        headers: ALICE_AUTH,
        body: {
          workspaceId: ALICE_WS_ID,
          invoiceId: CONCURRENT_INV_ID,
          amount: 100, // 50 * 100 = 5000
          paymentMethod: 'UPI'
        }
      })
    );
  }

  const responses = await Promise.all(promises);
  const successful = responses.filter(r => r.status === 201);
  assert.strictEqual(successful.length, 50);

  const updatedInv = mockDb.invoices.get(CONCURRENT_INV_ID);
  assert.strictEqual(updatedInv.amount_paid, 5000);
  assert.strictEqual(updatedInv.balance_due, 0);
  assert.strictEqual(updatedInv.status, 'Paid');
});

await test('15. Immutability Boundary: PATCH and DELETE on /payments are strictly unexposed (404)', async () => {
  const patchRes = await fetch(`${baseUrl}/api/v1/payments/${firstPaymentId}`, {
    method: 'PATCH',
    headers: { ...ALICE_AUTH, 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount: 999 })
  });
  assert.strictEqual(patchRes.status, 404);

  const deleteRes = await fetch(`${baseUrl}/api/v1/payments/${firstPaymentId}`, {
    method: 'DELETE',
    headers: ALICE_AUTH
  });
  assert.strictEqual(deleteRes.status, 404);
});

await test('16. Customer Due Sync: Customer current_due updates deterministically with payment settlement', () => {
  const cust = mockDb.customers.get('c_alice_1');
  assert.strictEqual(cust.current_due, 0, 'Customer current_due must decrease to 0 after full invoice settlement');
});

// Clean up server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`⚡ PAYMENTS LEDGER & AUDIT TRAIL: ${passedTests} / ${passedTests} PASSED (100%)`);
console.log('======================================================\n');
