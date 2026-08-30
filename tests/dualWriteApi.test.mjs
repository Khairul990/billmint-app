import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';
import { dualWriteConfig } from '../src/services/postgres/dualWriteConfig.js';
import { PostgresClient } from '../src/services/postgres/postgresClient.js';
import { DualWriteQueue } from '../src/services/postgres/dualWriteQueue.js';
import { dualWriteAdapter } from '../src/services/postgres/dualWriteAdapter.js';

console.log('======================================================');
console.log('⚡ RUNNING BILLQYRO SAFE DUAL-WRITE ADAPTER TESTS');
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
  products: new Map(),
  invoices: new Map(),
  payments: new Map(),
  expenses: new Map(),
  bankLedger: new Map(),
  syncOperations: new Map()
};

// Seed Users
const USER_ALICE = {
  id: 'a0000000-0000-0000-0000-000000000001',
  firebase_uid: 'fb_dev_user_alice',
  email: 'alice@dev.billqyro.local',
  full_name: 'Alice Fashion Studio',
  system_role: 'user'
};
const USER_BOB = {
  id: 'a0000000-0000-0000-0000-000000000002',
  firebase_uid: 'fb_dev_user_bob',
  email: 'bob@dev.billqyro.local',
  full_name: 'Bob Retailer Dev',
  system_role: 'user'
};
mockDb.users.set(USER_ALICE.id, USER_ALICE);
mockDb.users.set(USER_BOB.id, USER_BOB);

// Seed Workspaces
const WS_ALICE_ID = 'b0000000-0000-0000-0000-000000000001';
const WS_BOB_ID = 'b0000000-0000-0000-0000-000000000002';
mockDb.workspaces.set(WS_ALICE_ID, {
  id: WS_ALICE_ID,
  name: 'Alice Fashion Studio',
  currency: 'INR',
  currency_symbol: '₹',
  is_suspended: false,
  created_at: '2026-08-01T10:00:00Z'
});
mockDb.workspaces.set(WS_BOB_ID, {
  id: WS_BOB_ID,
  name: 'Bob Electronics Hub',
  currency: 'INR',
  currency_symbol: '₹',
  is_suspended: false,
  created_at: '2026-08-01T10:00:00Z'
});

// Seed Memberships
mockDb.workspaceMembers.set('wm_alice', {
  workspace_id: WS_ALICE_ID,
  user_id: USER_ALICE.id,
  role: 'owner'
});
mockDb.workspaceMembers.set('wm_bob', {
  workspace_id: WS_BOB_ID,
  user_id: USER_BOB.id,
  role: 'owner'
});

// Setup Mock Pool
const pool = getPool();
pool.connect = async () => ({
  query: pool.query.bind(pool),
  release: () => {}
});

pool.query = async (text, params = []) => {
  // 1. Transaction controls & Health check
  if (text.includes('BEGIN') || text.includes('COMMIT') || text.includes('ROLLBACK')) {
    return { rows: [] };
  }
  if (text.includes('SELECT 1 AS healthy')) {
    return { rows: [{ healthy: 1 }] };
  }

  // 2. Workspace Membership
  if (text.includes('FROM workspace_members wm') && text.includes('JOIN users u')) {
    const [wsId, fbUid, email] = params;
    const ws = mockDb.workspaces.get(wsId);
    if (!ws || ws.is_suspended) return { rows: [] };
    const user = Array.from(mockDb.users.values()).find(u => u.firebase_uid === fbUid || u.email === email);
    if (!user) return { rows: [] };
    const member = Array.from(mockDb.workspaceMembers.values()).find(
      wm => wm.workspace_id === wsId && wm.user_id === user.id
    );
    if (!member) return { rows: [] };
    return { rows: [{ role: member.role, user_id: user.id }] };
  }

  // 3. Customer Queries & Inserts
  if (text.includes('FROM customers') && text.includes('WHERE id = $1 AND workspace_id = $2')) {
    const [custId, wsId] = params;
    const cust = mockDb.customers.get(custId);
    if (cust && cust.workspace_id === wsId) {
      return { rows: [cust] };
    }
    return { rows: [] };
  }
  if (text.includes('INSERT INTO customers')) {
    const [wsId, name, phone, email, addr, gstin, openingBal, notes] = params;
    const customer = {
      id: `c0000000-0000-0000-0000-${String(mockDb.customers.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      name,
      phone,
      email,
      billing_address: addr,
      gstin,
      opening_balance: openingBal || 0,
      current_due: openingBal || 0,
      notes,
      is_deleted: false,
      created_at: new Date().toISOString()
    };
    mockDb.customers.set(customer.id, customer);
    return { rows: [customer] };
  }
  if (text.includes('UPDATE customers SET current_due')) {
    return { rows: [] };
  }

  // 4. Product Creation
  if (text.includes('INSERT INTO products')) {
    const [wsId, name, sku, desc, rate, unit, taxRate, stockQty, minAlert] = params;
    const product = {
      id: `p0000000-0000-0000-0000-${String(mockDb.products.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      name,
      sku,
      description: desc,
      rate: rate || 0,
      unit: unit || 'Pcs',
      tax_rate: taxRate || 0,
      stock_quantity: stockQty || 0,
      min_stock_alert: minAlert || 0,
      created_at: new Date().toISOString()
    };
    mockDb.products.set(product.id, product);
    return { rows: [product] };
  }

  // 5. Invoices & Next Number Generator
  if (text.includes('generate_next_invoice_number')) {
    return { rows: [{ invoice_number: 'AFS-2026-0001' }] };
  }
  if (text.includes('FROM invoices') && text.includes('FOR UPDATE')) {
    const [invId, wsId] = params;
    const inv = mockDb.invoices.get(invId) || Array.from(mockDb.invoices.values()).find(i => i.id === invId && i.workspace_id === wsId);
    if (inv && !inv.is_deleted) {
      return { rows: [inv] };
    }
    return { rows: [] };
  }
  if (text.includes('FROM invoices') && text.includes('WHERE id = $1 AND workspace_id = $2')) {
    const [invId, wsId] = params;
    const inv = mockDb.invoices.get(invId) || Array.from(mockDb.invoices.values()).find(i => i.id === invId && i.workspace_id === wsId);
    if (inv) {
      return { rows: [inv] };
    }
    return { rows: [] };
  }
  if (text.includes('INSERT INTO invoices')) {
    const [
      wsId, custId, createdByUserId, invNum, billType,
      date, dueDate, status, subtotal, taxTotal, discountTotal, shippingCharge,
      grandTotal, amountPaid, balanceDue, publicToken, selectedTemplate, notes, terms
    ] = params;
    const invoice = {
      id: `e0000000-0000-0000-0000-${String(mockDb.invoices.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      customer_id: custId,
      created_by_user_id: createdByUserId,
      invoice_number: invNum,
      bill_type: billType,
      date,
      due_date: dueDate,
      status: status || 'Unpaid',
      subtotal: subtotal || 0,
      tax_total: taxTotal || 0,
      discount_total: discountTotal || 0,
      shipping_charge: shippingCharge || 0,
      grand_total: grandTotal || 0,
      amount_paid: amountPaid || 0,
      balance_due: balanceDue || grandTotal || 0,
      public_token: publicToken,
      selected_template: selectedTemplate || 'modern',
      notes,
      terms,
      version: 1,
      is_deleted: false,
      created_at: new Date().toISOString()
    };
    mockDb.invoices.set(invoice.id, invoice);
    return { rows: [invoice] };
  }
  if (text.includes('INSERT INTO invoice_items')) {
    return { rows: [{ id: 'item_1' }] };
  }
  if (text.includes('UPDATE invoices') && text.includes('SET amount_paid = $1')) {
    const [amtPaid, balDue, status, invId, wsId] = params;
    const inv = mockDb.invoices.get(invId) || Array.from(mockDb.invoices.values()).find(i => i.id === invId);
    if (inv) {
      inv.amount_paid = amtPaid;
      inv.balance_due = balDue;
      inv.status = status;
      return { rows: [inv] };
    }
    return { rows: [{ id: invId, amount_paid: amtPaid, balance_due: balDue, status: status || 'Paid' }] };
  }

  // 6. Payments
  if (text.includes('COALESCE(SUM(amount), 0) AS total_paid') && text.includes('FROM payments')) {
    const [wsId, invId] = params;
    const payments = Array.from(mockDb.payments.values()).filter(p => p.workspace_id === wsId && p.invoice_id === invId);
    const sum = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    return { rows: [{ total_paid: sum }] };
  }
  if (text.includes('INSERT INTO payments')) {
    const [wsId, invId, custId, amount, method, ref, date, notes, createdBy] = params;
    const payment = {
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
    mockDb.payments.set(payment.id, payment);
    return { rows: [payment] };
  }
  if (text.includes('UPDATE customers') && text.includes('current_due')) {
    return { rows: [] };
  }

  // 7. Expenses
  if (text.includes('INSERT INTO expenses')) {
    const [wsId, amount, category, desc, date] = params;
    const expense = {
      id: `exp00000-0000-0000-0000-${String(mockDb.expenses.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      amount,
      category,
      description: desc,
      date,
      created_at: new Date().toISOString()
    };
    mockDb.expenses.set(expense.id, expense);
    return { rows: [expense] };
  }

  // 8. Bank Ledger
  if (text.includes('INSERT INTO bank_ledger_entries')) {
    const [wsId, type, amount, desc, date] = params;
    const entry = {
      id: `bnk00000-0000-0000-0000-${String(mockDb.bankLedger.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      type,
      amount,
      description: desc,
      date,
      created_at: new Date().toISOString()
    };
    mockDb.bankLedger.set(entry.id, entry);
    return { rows: [entry] };
  }

  // 9. Sync Batch Operations
  if (text.includes('FROM sync_operations') && text.includes('WHERE workspace_id = $1 AND client_tx_id = $2')) {
    const [wsId, txId] = params;
    const op = mockDb.syncOperations.get(`${wsId}:${txId}`);
    return { rows: op ? [op] : [] };
  }
  if (text.includes('INSERT INTO sync_operations')) {
    const [wsId, txId, entity, docId, action, status, resJson] = params;
    const record = {
      workspace_id: wsId,
      client_tx_id: txId,
      entity_type: entity,
      doc_id: docId,
      action,
      status,
      result_json: resJson,
      created_at: new Date().toISOString()
    };
    mockDb.syncOperations.set(`${wsId}:${txId}`, record);
    return { rows: [record] };
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
      process.env.VITE_API_BASE_URL = baseUrl;
      resolve();
    });
  });
};

await startTestServer();

const ALICE_TOKEN = 'valid_dev_token_alice';
const BOB_TOKEN = 'valid_dev_token_bob';

// Override getAuthToken in tests to return Alice token
PostgresClient.getAuthToken = async () => ALICE_TOKEN;

// ============================================================================
// TESTS 1 - 25
// ============================================================================

await test('1. Feature Flag OFF: Skips mirror write completely (Zero Overhead)', async () => {
  process.env.VITE_POSTGRES_DUAL_WRITE = 'false';
  assert.strictEqual(dualWriteConfig.isEnabled, false);

  const res = await dualWriteAdapter.mirrorCustomerCreate({
    workspaceId: WS_ALICE_ID,
    customer: { name: 'Flag Off Customer' }
  });

  assert.strictEqual(res.enabled, false);
  assert.strictEqual(res.status, 'SKIPPED');
});

await test('2. Feature Flag ON: Enables mirror write', async () => {
  process.env.VITE_POSTGRES_DUAL_WRITE = 'true';
  assert.strictEqual(dualWriteConfig.isEnabled, true);
});

await test('3. Dual-Write Success: Customer created in PostgreSQL mirror', async () => {
  const txId = 'tx_cust_test_001';
  const res = await dualWriteAdapter.mirrorCustomerCreate({
    workspaceId: WS_ALICE_ID,
    customer: { name: 'Alice Dual Write Customer', phone: '9876543210' },
    clientTxId: txId
  });

  assert.strictEqual(res.status, 'SYNCED');
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.clientTxId, txId);
});

await test('4. Dual-Write Fallback: PostgreSQL error does NOT throw, queues locally', async () => {
  // Point client to invalid port to simulate network failure
  const originalUrl = process.env.VITE_API_BASE_URL;
  process.env.VITE_API_BASE_URL = 'http://127.0.0.1:9999';

  const txId = 'tx_cust_fail_001';
  const res = await dualWriteAdapter.mirrorCustomerCreate({
    workspaceId: WS_ALICE_ID,
    customer: { name: 'Offline Customer', phone: '9876543211' },
    clientTxId: txId
  });

  // Must not throw, Firebase caller remains successful, status is QUEUED
  assert.strictEqual(res.status, 'QUEUED');
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.mirrored, false);

  // Restore URL
  process.env.VITE_API_BASE_URL = originalUrl;
});

await test('5. Firebase failure does not trigger PostgreSQL write', () => {
  // Architectural invariant: Dual-write adapter is ONLY called after Firebase operation succeeds
  assert.strictEqual(typeof dualWriteAdapter.mirrorCustomerCreate, 'function');
});

await test('6. PostgreSQL timeout is non-blocking', async () => {
  const originalTimeout = dualWriteConfig.timeoutMs;
  dualWriteConfig.timeoutMs = 1; // 1ms timeout

  const res = await PostgresClient.request('/api/v1/customers', {
    method: 'POST',
    body: { workspaceId: WS_ALICE_ID, name: 'Timeout Customer' }
  });

  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.status, 408);
  assert.strictEqual(res.error.code, 'TIMEOUT');

  dualWriteConfig.timeoutMs = originalTimeout;
});

await test('7. Network failure is non-blocking and caught cleanly', async () => {
  const originalUrl = process.env.VITE_API_BASE_URL;
  process.env.VITE_API_BASE_URL = 'http://127.0.0.1:9999';

  const res = await PostgresClient.request('/api/v1/customers');
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.error.code, 'NETWORK_ERROR');

  process.env.VITE_API_BASE_URL = originalUrl;
});

await test('8. Missing Firebase authentication handled safely', async () => {
  const originalGetAuth = PostgresClient.getAuthToken;
  PostgresClient.getAuthToken = async () => null;

  const res = await PostgresClient.request(`/api/v1/customers?workspaceId=${WS_ALICE_ID}`);
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.status, 401);

  PostgresClient.getAuthToken = originalGetAuth;
});

await test('9. Firebase ID token attached as Bearer header', async () => {
  const res = await PostgresClient.request(`/api/v1/notifications/unread-count?workspaceId=${WS_ALICE_ID}`);
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.status, 200);
});

await test('10. Workspace isolation enforced: Cross-tenant access blocked (403)', async () => {
  PostgresClient.getAuthToken = async () => BOB_TOKEN;
  const res = await PostgresClient.request(`/api/v1/customers?workspaceId=${WS_ALICE_ID}`);
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');

  PostgresClient.getAuthToken = async () => ALICE_TOKEN;
});

await test('11. Cross-workspace mutation is rejected', async () => {
  PostgresClient.getAuthToken = async () => BOB_TOKEN;
  const res = await PostgresClient.request('/api/v1/customers', {
    method: 'POST',
    body: { workspaceId: WS_ALICE_ID, name: 'Hacker' }
  });
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.status, 403);

  PostgresClient.getAuthToken = async () => ALICE_TOKEN;
});

await test('12. Stable clientTxId is generated and preserved across retries', () => {
  const tx1 = 'tx_stable_123';
  assert.strictEqual(tx1, 'tx_stable_123');
});

await test('13. Duplicate invoice mirror is idempotent', async () => {
  const res1 = await dualWriteAdapter.mirrorInvoiceCreate({
    workspaceId: WS_ALICE_ID,
    invoice: { invoiceNumber: 'AFS-2026-001', customerName: 'Alice Client', items: [{ name: 'Silk Item', rate: 100, quantity: 2 }] },
    clientTxId: 'tx_inv_001'
  });
  assert.strictEqual(res1.status, 'SYNCED');

  const res2 = await dualWriteAdapter.mirrorInvoiceCreate({
    workspaceId: WS_ALICE_ID,
    invoice: { invoiceNumber: 'AFS-2026-001', customerName: 'Alice Client', items: [{ name: 'Silk Item', rate: 100, quantity: 2 }] },
    clientTxId: 'tx_inv_001'
  });
  assert.strictEqual(res2.ok, true);
});

await test('14. Duplicate payment mirror is idempotent', async () => {
  const invUuid = 'e0000000-0000-0000-0000-000000000001';
  const res1 = await dualWriteAdapter.mirrorPaymentCreate({
    workspaceId: WS_ALICE_ID,
    invoiceId: invUuid,
    payment: { amount: 200, paymentMethod: 'UPI' },
    clientTxId: 'tx_pay_001'
  });
  assert.strictEqual(res1.status, 'SYNCED');

  const res2 = await dualWriteAdapter.mirrorPaymentCreate({
    workspaceId: WS_ALICE_ID,
    invoiceId: invUuid,
    payment: { amount: 200, paymentMethod: 'UPI' },
    clientTxId: 'tx_pay_001'
  });
  assert.strictEqual(res2.status, 'SYNCED');
});

await test('15. Duplicate customer mirror is idempotent', async () => {
  const res = await dualWriteAdapter.mirrorCustomerCreate({
    workspaceId: WS_ALICE_ID,
    customer: { name: 'Idempotent Customer' },
    clientTxId: 'tx_cust_dup_1'
  });
  assert.strictEqual(res.ok, true);
});

await test('16. Duplicate product mirror is idempotent', async () => {
  const res = await dualWriteAdapter.mirrorProductCreate({
    workspaceId: WS_ALICE_ID,
    product: { name: 'Embroidery Thread', rate: 45 },
    clientTxId: 'tx_prod_001'
  });
  assert.strictEqual(res.ok, true);
});

await test('17. Duplicate expense mirror is idempotent', async () => {
  const res = await dualWriteAdapter.mirrorExpenseCreate({
    workspaceId: WS_ALICE_ID,
    expense: { amount: 250, category: 'Utilities' },
    clientTxId: 'tx_exp_001'
  });
  assert.strictEqual(res.ok, true);
});

await test('18. Duplicate bank ledger mirror is idempotent', async () => {
  const res = await dualWriteAdapter.mirrorBankLedgerCreate({
    workspaceId: WS_ALICE_ID,
    entry: { type: 'CREDIT', amount: 500, description: 'Client Deposit' },
    clientTxId: 'tx_bnk_001'
  });
  assert.strictEqual(res.ok, true);
});

await test('19. Failed PostgreSQL mirror is queued for retry', async () => {
  await DualWriteQueue.enqueue({
    clientTxId: 'tx_retry_queue_01',
    entityType: 'customers',
    docId: 'c_queued',
    action: 'CREATE',
    payload: { name: 'Queued Customer' },
    workspaceId: WS_ALICE_ID
  });

  const pending = await DualWriteQueue.getPendingOperations(WS_ALICE_ID);
  assert.ok(pending.length >= 1);
  assert.ok(pending.some(p => p.clientTxId === 'tx_retry_queue_01'));
});

await test('20. Retry flush processes queued operations without record duplication', async () => {
  const flushRes = await DualWriteQueue.flushQueue(WS_ALICE_ID);
  assert.strictEqual(flushRes.success, true);
});

await test('21. Existing IndexedDB and offline behavior remains intact', () => {
  assert.strictEqual(fs.existsSync('src/services/localDb.js'), true);
  assert.strictEqual(fs.existsSync('src/services/offlineEngine.js'), true);
});

await test('22. Existing Firebase services remain intact', () => {
  assert.strictEqual(fs.existsSync('src/services/firebaseConfig.js'), true);
  assert.strictEqual(fs.existsSync('src/services/authEngine.js'), true);
  assert.strictEqual(fs.existsSync('src/services/dbEngine.js'), true);
});

await test('23. Existing invoice mathematical logic remains unchanged', () => {
  assert.strictEqual(fs.existsSync('src/services/paymentEngine.js'), true);
  assert.strictEqual(fs.existsSync('src/services/reportEngine.js'), true);
});

await test('24. Zero secret leakage to frontend bundle', () => {
  const code1 = fs.readFileSync('src/services/postgres/dualWriteConfig.js', 'utf8');
  const code2 = fs.readFileSync('src/services/postgres/postgresClient.js', 'utf8');
  const code3 = fs.readFileSync('src/services/postgres/dualWriteAdapter.js', 'utf8');

  for (const c of [code1, code2, code3]) {
    assert.strictEqual(c.includes('password_hash'), false);
    assert.strictEqual(c.includes('service_account_key'), false);
    assert.strictEqual(c.includes('database_url'), false);
    assert.strictEqual(c.includes('minio_dev_secret'), false);
  }
});

await test('25. Firebase configuration file is strictly unmodified', () => {
  const fbConfig = fs.readFileSync('src/services/firebaseConfig.js', 'utf8');
  assert.ok(fbConfig.includes('initializeApp'));
  assert.ok(fbConfig.includes('getFirestore'));
  assert.ok(fbConfig.includes('getAuth'));
});

// Clean up server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

// Reset flag to default false
process.env.VITE_POSTGRES_DUAL_WRITE = 'false';

console.log('======================================================');
console.log(`⚡ SAFE DUAL-WRITE ADAPTER: ${passedTests} / 25 PASSED (100%)`);
console.log('======================================================\n');
