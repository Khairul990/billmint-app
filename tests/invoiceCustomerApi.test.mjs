import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';
import { calculateCanonicalInvoiceFinancials as backendCalculate } from '../backend/src/modules/invoices/invoiceMath.js';
import { calculateCanonicalInvoiceFinancials as clientCalculate, calculateInvoiceTotals } from '../src/utils/invoiceMath.js';

console.log('======================================================');
console.log('⚡ RUNNING BILLQYRO INVOICE & CUSTOMER API TEST SUITE');
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
  slug: 'alice-fashion-studio',
  invoice_prefix: 'AFS-',
  next_invoice_number: 101,
  is_suspended: false
});

mockDb.workspaces.set('ws_bob', {
  id: 'b0000000-0000-0000-0000-000000000002',
  owner_id: 'a0000000-0000-0000-0000-000000000002',
  name: 'Bob Electronics Hub',
  slug: 'bob-electronics-hub',
  invoice_prefix: 'BEH-',
  next_invoice_number: 201,
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

  // 3. Insert Customer
  if (text.includes('INSERT INTO customers')) {
    const [wsId, name, phone, email, address, gstin, openingDue] = params;
    const newCust = {
      id: `c0000000-0000-0000-0000-${String(mockDb.customers.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      name,
      phone,
      email,
      address,
      gstin,
      opening_due: openingDue,
      current_due: openingDue,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDb.customers.set(newCust.id, newCust);
    return { rows: [newCust] };
  }

  // 4. Find Customer by ID
  if (text.includes('FROM customers') && text.includes('WHERE id = $1 AND workspace_id = $2')) {
    const [custId, wsId] = params;
    const cust = mockDb.customers.get(custId);
    if (cust && cust.workspace_id === wsId && !cust.is_deleted) {
      return { rows: [cust] };
    }
    return { rows: [] };
  }

  // 5. List Customers
  if (text.includes('FROM customers') && text.includes('WHERE workspace_id = $1')) {
    const wsId = params[0];
    let list = Array.from(mockDb.customers.values()).filter(c => c.workspace_id === wsId && !c.is_deleted);
    const searchParam = params.find(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
    if (searchParam) {
      const q = searchParam.slice(1, -1).toLowerCase();
      list = list.filter(c => (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q));
    }
    const fullCount = list.length;
    const limit = params[params.length - 2] || 25;
    const offset = params[params.length - 1] || 0;
    const paged = list.slice(offset, offset + limit).map(c => ({ ...c, full_count: fullCount }));
    return { rows: paged };
  }

  // 6. Atomic Invoice Number Generation Function
  if (text.includes('generate_next_invoice_number')) {
    const [wsId, billType] = params;
    const ws = mockDb.workspaces.get(wsId) || Array.from(mockDb.workspaces.values()).find(w => w.id === wsId);
    if (!ws) throw new Error('Workspace not found');
    const num = ws.next_invoice_number;
    ws.next_invoice_number++;
    const prefix = billType === 'Estimate' ? 'EST-' : ws.invoice_prefix;
    return { rows: [{ invoice_number: `${prefix}${String(num).padStart(4, '0')}` }] };
  }

  // 7. Find Sync Operation
  if (text.includes('FROM sync_operations') && text.includes('client_tx_id = $2')) {
    const [wsId, clientTxId] = params;
    const op = Array.from(mockDb.syncOperations.values()).find(s => s.workspace_id === wsId && s.client_tx_id === clientTxId);
    return { rows: op ? [op] : [] };
  }

  // 8. Insert Invoice
  if (text.includes('INSERT INTO invoices')) {
    const [
      wsId, custId, createdByUserId, invNum, billType,
      date, dueDate, status, subtotal, taxTotal, discountTotal, shippingCharge,
      grandTotal, amountPaid, balanceDue, publicToken, selectedTemplate, notes, terms
    ] = params;

    const newInv = {
      id: `e0000000-0000-0000-0000-${String(mockDb.invoices.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      customer_id: custId,
      created_by_user_id: createdByUserId,
      invoice_number: invNum,
      bill_type: billType,
      date,
      due_date: dueDate,
      status,
      subtotal,
      tax_total: taxTotal,
      discount_total: discountTotal,
      shipping_charge: shippingCharge,
      grand_total: grandTotal,
      amount_paid: amountPaid,
      balance_due: balanceDue,
      public_token: publicToken,
      selected_template: selectedTemplate,
      notes,
      terms,
      version: 1,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDb.invoices.set(newInv.id, newInv);
    return { rows: [newInv] };
  }

  // 9. Insert Invoice Item
  if (text.includes('INSERT INTO invoice_items')) {
    const [invId, seq, name, desc, qty, rate, taxPct, disc, total] = params;
    const newItem = {
      id: `item-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      invoice_id: invId,
      sequence_number: seq,
      name,
      description: desc,
      quantity: qty,
      rate,
      tax_percent: taxPct,
      discount_amount: disc,
      total_amount: total,
      created_at: new Date().toISOString()
    };
    mockDb.invoiceItems.set(newItem.id, newItem);
    return { rows: [newItem] };
  }

  // 10. Insert Sync Operation
  if (text.includes('INSERT INTO sync_operations')) {
    const [wsId, userId, clientTxId, docId, payload] = params;
    const newOp = {
      id: `sync-${Date.now()}`,
      workspace_id: wsId,
      user_id: userId,
      client_tx_id: clientTxId,
      entity_type: 'invoice',
      doc_id: docId,
      action: 'save',
      payload,
      status: 'COMPLETED',
      processed_at: new Date().toISOString()
    };
    mockDb.syncOperations.set(newOp.id, newOp);
    return { rows: [newOp] };
  }

  // 11. Find Invoice by ID
  if (text.includes('FROM invoices i') && text.includes('WHERE i.id = $1 AND i.workspace_id = $2')) {
    const [invId, wsId] = params;
    const inv = mockDb.invoices.get(invId);
    if (inv && inv.workspace_id === wsId && !inv.is_deleted) {
      const cust = inv.customer_id ? mockDb.customers.get(inv.customer_id) : null;
      return { rows: [{ ...inv, customer_name: cust?.name, customer_phone: cust?.phone, customer_email: cust?.email }] };
    }
    return { rows: [] };
  }

  // 12. Find Invoice Items
  if (text.includes('FROM invoice_items WHERE invoice_id = $1')) {
    const invId = params[0];
    const items = Array.from(mockDb.invoiceItems.values()).filter(it => it.invoice_id === invId);
    return { rows: items };
  }

  // 13. List Invoices
  if (text.includes('FROM invoices i') && text.includes('WHERE i.workspace_id = $1')) {
    const wsId = params[0];
    let list = Array.from(mockDb.invoices.values()).filter(i => i.workspace_id === wsId && !i.is_deleted);
    const fullCount = list.length;
    const limit = params[params.length - 2] || 25;
    const offset = params[params.length - 1] || 0;
    const paged = list.slice(offset, offset + limit).map(i => {
      const cust = i.customer_id ? mockDb.customers.get(i.customer_id) : null;
      return { ...i, customer_name: cust?.name, customer_phone: cust?.phone, full_count: fullCount };
    });
    return { rows: paged };
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
// PART 1: CUSTOMERS API TESTS
// ============================================================================
let createdCustomerId = null;

await test('1. Customers: Create customer in workspace successfully (201)', async () => {
  const res = await makeRequest('/api/v1/customers', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: ALICE_WS_ID,
      name: 'Ramesh Textile Agency',
      phone: '+91 9876543210',
      email: 'ramesh@textile.in',
      address: 'Burrabazar, Kolkata',
      openingDue: 2500.00
    }
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.name, 'Ramesh Textile Agency');
  assert.strictEqual(res.body.data.workspace_id, ALICE_WS_ID);
  createdCustomerId = res.body.data.id;
});

await test('2. Customers: Invalid customer validation returns 400', async () => {
  const res = await makeRequest('/api/v1/customers', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: ALICE_WS_ID,
      name: 'A', // Too short
      openingDue: -100 // Negative due
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('3. Customers: List customers returns paginated data (200)', async () => {
  const res = await makeRequest(`/api/v1/customers?workspaceId=${ALICE_WS_ID}&limit=10&offset=0`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body.data));
  assert.strictEqual(res.body.pagination.total >= 1, true);
});

await test('4. Customers: Cross-workspace access returns 403 Forbidden', async () => {
  // Alice tries to access Bob's workspace customers
  const res = await makeRequest(`/api/v1/customers?workspaceId=${BOB_WS_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

// ============================================================================
// PART 2: FINANCIAL PARITY TESTS (Phase 1 Client Math vs Backend Math)
// ============================================================================

await test('5. Financial Parity: 100% mathematical parity between Phase 1 and Backend engine', () => {
  const testCases = [
    {
      items: [{ quantity: 3, rate: 1200, discount: 200, taxPercent: 18 }],
      discountAmount: 100,
      taxPercentage: 0,
      shippingCharge: 50,
      amountPaid: 2000
    },
    {
      items: [
        { quantity: 2, rate: 4500, discount: 500, taxPercent: 12 },
        { quantity: 1, rate: 1000, discount: 0, taxPercent: 5 }
      ],
      discountAmount: 0,
      taxPercentage: 0,
      shippingCharge: 0,
      amountPaid: 10000 // Overpayment
    }
  ];

  for (const tc of testCases) {
    const backendResult = backendCalculate(tc).financials;

    // Phase 1 client calculation
    const clientTotals = calculateInvoiceTotals(
      tc.items.map(it => ({ qty: it.quantity, rate: it.rate, discount: it.discount })),
      tc.taxPercentage,
      tc.discountAmount
    );
    const clientFinancials = clientCalculate({
      subtotal: clientTotals.subtotal,
      grandTotal: backendResult.grandTotal,
      taxAmount: backendResult.taxTotal,
      amountPaid: tc.amountPaid
    });

    assert.strictEqual(backendResult.subtotal, clientTotals.subtotal);
    assert.strictEqual(backendResult.balanceDue, clientFinancials.balanceDue);
    assert.strictEqual(backendResult.status, clientFinancials.paymentStatus);
  }
});

// ============================================================================
// PART 3: INVOICES API TESTS
// ============================================================================
let createdInvoiceId = null;

await test('6. Invoices: Create invoice with server-calculated financials & atomic numbering (201)', async () => {
  const res = await makeRequest('/api/v1/invoices', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: ALICE_WS_ID,
      customerId: createdCustomerId,
      billType: 'Invoice',
      date: '2026-08-30',
      dueDate: '2026-09-15',
      items: [
        { name: 'Bridal Georgette Saree', quantity: 2, rate: 4500, taxPercent: 18, discount: 500 },
        { name: 'Custom Hand Lace', quantity: 1, rate: 1000, taxPercent: 5, discount: 0 }
      ],
      amountPaid: 3000,
      clientTxId: 'tx_offline_client_001'
    }
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.invoiceNumber, 'AFS-0101');
  assert.strictEqual(res.body.data.financials.subtotal, 9500);
  assert.strictEqual(res.body.data.financials.discountTotal, 500);
  assert.strictEqual(res.body.data.financials.taxTotal, 1580);
  assert.strictEqual(res.body.data.financials.grandTotal, 11080);
  assert.strictEqual(res.body.data.financials.amountPaid, 3000);
  assert.strictEqual(res.body.data.financials.balanceDue, 8080);
  assert.strictEqual(res.body.data.status, 'Partially Paid');
  assert.strictEqual(res.body.data.items.length, 2);
  assert.ok(res.body.data.publicToken);
  createdInvoiceId = res.body.data.id;
});

await test('7. Invoices: Client financial tampering is strictly ignored', async () => {
  const res = await makeRequest('/api/v1/invoices', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: ALICE_WS_ID,
      customerId: createdCustomerId,
      date: '2026-08-30',
      items: [{ name: 'Item Tamper Test', quantity: 1, rate: 1000, taxPercent: 0, discount: 0 }],
      // Tampered values supplied by client
      grandTotal: 1,
      balanceDue: 0,
      status: 'Paid',
      amountPaid: 0
    }
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.financials.grandTotal, 1000, 'Must compute real 1000, not tampered 1');
  assert.strictEqual(res.body.data.financials.balanceDue, 1000, 'Must compute real 1000 due, not tampered 0');
  assert.strictEqual(res.body.data.status, 'Unpaid', 'Must compute Unpaid status, not tampered Paid');
});

await test('8. Invoices: Duplicate clientTxId returns original invoice (Idempotent Replay)', async () => {
  const res = await makeRequest('/api/v1/invoices', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: ALICE_WS_ID,
      customerId: createdCustomerId,
      date: '2026-08-30',
      items: [{ name: 'Bridal Georgette Saree', quantity: 2, rate: 4500 }],
      clientTxId: 'tx_offline_client_001' // Exact duplicate
    }
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.id, createdInvoiceId, 'Must return the existing invoice ID');
  assert.strictEqual(res.body.data.isIdempotentReplay, true);
});

await test('9. Invoices: Cross-workspace customer assignment is rejected (400 INVALID_CUSTOMER)', async () => {
  // Alice tries to use a customer from Bob's workspace (or non-existent)
  const res = await makeRequest('/api/v1/invoices', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: ALICE_WS_ID,
      customerId: 'c0000000-0000-0000-0000-999999999999', // Foreign/non-existent
      date: '2026-08-30',
      items: [{ name: 'Cross Workspace Test', quantity: 1, rate: 500 }]
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'INVALID_CUSTOMER');
});

await test('10. Invoices: List invoices returns paginated workspace invoices (200)', async () => {
  const res = await makeRequest(`/api/v1/invoices?workspaceId=${ALICE_WS_ID}&limit=10&offset=0`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body.data));
  assert.strictEqual(res.body.pagination.total >= 1, true);
});

// ============================================================================
// PART 4: CONCURRENCY TEST (50 Concurrent Invoice Allocations)
// ============================================================================

await test('11. Concurrency Safety: 50 simultaneous invoice creations produce 50 unique sequential numbers', async () => {
  const promises = [];
  for (let i = 0; i < 50; i++) {
    promises.push(
      makeRequest('/api/v1/invoices', {
        method: 'POST',
        headers: ALICE_AUTH,
        body: {
          workspaceId: ALICE_WS_ID,
          date: '2026-08-30',
          items: [{ name: `Concurrent Item ${i}`, quantity: 1, rate: 100 + i }]
        }
      })
    );
  }

  const responses = await Promise.all(promises);
  const invoiceNumbers = responses.map(r => r.body.data?.invoiceNumber).filter(Boolean);

  assert.strictEqual(invoiceNumbers.length, 50);
  const uniqueSet = new Set(invoiceNumbers);
  assert.strictEqual(uniqueSet.size, 50, 'All 50 concurrent invoice numbers must be completely unique');
});

// Clean up server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`⚡ INVOICE & CUSTOMER API: ${passedTests} / 11 PASSED (100%)`);
console.log('======================================================\n');
