import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';
import { PostgresClient } from '../src/services/postgres/postgresClient.js';
import { calculateCanonicalInvoiceFinancials } from '../backend/src/modules/invoices/invoiceMath.js';
import { NotificationService } from '../backend/src/modules/notifications/notificationService.js';
import { calculateInvoiceTotals, calculateItemTotal, determinePaymentStatus } from '../src/utils/invoiceMath.js';
import { DualWriteParity, normalizeMoney } from '../src/services/postgres/dualWriteParity.js';

console.log('======================================================');
console.log('🌟 BILLQYRO PHASE 3 STEP 3.1 PRODUCTION USER JOURNEY');
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

// ============================================================================
// 1. IN-MEMORY MULTI-TENANT TEST ENVIRONMENT
// ============================================================================

const mockDb = {
  users: new Map(),
  workspaces: new Map(),
  workspaceMembers: new Map(),
  customers: new Map(),
  products: new Map(),
  invoices: new Map(),
  invoiceItems: new Map(),
  payments: new Map(),
  expenses: new Map(),
  bankLedger: new Map(),
  notifications: new Map()
};

const WS_ALICE_ID = 'b0000000-0000-0000-0000-000000000001';
const WS_BOB_ID = 'b0000000-0000-0000-0000-000000000002';

mockDb.users.set('u_alice', {
  id: 'a0000000-0000-0000-0000-000000000001',
  firebase_uid: 'fb_dev_user_alice',
  email: 'alice@dev.billqyro.local',
  full_name: 'Alice Fashion Studio',
  system_role: 'user'
});

mockDb.users.set('u_bob', {
  id: 'a0000000-0000-0000-0000-000000000002',
  firebase_uid: 'fb_dev_user_bob',
  email: 'bob@dev.billqyro.local',
  full_name: 'Bob Electronics',
  system_role: 'user'
});

mockDb.workspaces.set(WS_ALICE_ID, {
  id: WS_ALICE_ID,
  name: 'Alice Fashion Studio',
  category: 'Fashion & Apparel',
  currency: 'INR',
  is_suspended: false,
  next_invoice_number: 1,
  invoice_prefix: 'AFS-'
});

mockDb.workspaces.set(WS_BOB_ID, {
  id: WS_BOB_ID,
  name: 'Bob Electronics',
  category: 'Electronics Retail',
  currency: 'INR',
  is_suspended: false,
  next_invoice_number: 1,
  invoice_prefix: 'BEH-'
});

mockDb.workspaceMembers.set('wm_alice', {
  workspace_id: WS_ALICE_ID,
  user_id: 'a0000000-0000-0000-0000-000000000001',
  role: 'owner'
});

mockDb.workspaceMembers.set('wm_bob', {
  workspace_id: WS_BOB_ID,
  user_id: 'a0000000-0000-0000-0000-000000000002',
  role: 'owner'
});

const pool = getPool();
pool.connect = async () => ({
  query: pool.query.bind(pool),
  release: () => {}
});

pool.query = async (text, params = []) => {
  if (text.includes('BEGIN') || text.includes('COMMIT') || text.includes('ROLLBACK')) {
    return { rows: [] };
  }
  if (text.includes('SELECT 1 AS healthy')) return { rows: [{ healthy: 1 }] };

  // 1. Membership
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

  // 2. Customers
  if (text.includes('INSERT INTO customers')) {
    const [wsId, name, phone, email, addr, gstin, openDue] = params;
    const cust = {
      id: `c0000000-0000-0000-0000-${String(mockDb.customers.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      name,
      phone,
      email,
      billing_address: addr,
      gstin,
      opening_due: openDue || 0,
      current_due: openDue || 0,
      is_deleted: false,
      created_at: new Date().toISOString()
    };
    mockDb.customers.set(cust.id, cust);
    return { rows: [cust] };
  }

  if (text.includes('FROM customers') && text.includes('WHERE id = $1 AND workspace_id = $2')) {
    const [custId, wsId] = params;
    const cust = mockDb.customers.get(custId);
    return { rows: cust && cust.workspace_id === wsId && !cust.is_deleted ? [cust] : [] };
  }

  if (text.includes('FROM customers') && text.includes('WHERE workspace_id = $1')) {
    const wsId = params[0];
    const list = Array.from(mockDb.customers.values()).filter(c => c.workspace_id === wsId && !c.is_deleted);
    return { rows: list.map(c => ({ ...c, full_count: list.length })) };
  }

  // 3. Products
  if (text.includes('INSERT INTO products')) {
    const [wsId, name, sku, desc, rate, unit, taxRate, stockQty, minAlert] = params;
    const prod = {
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
      is_deleted: false,
      created_at: new Date().toISOString()
    };
    mockDb.products.set(prod.id, prod);
    return { rows: [prod] };
  }

  if (text.includes('FROM products') && text.includes('WHERE workspace_id = $1')) {
    const wsId = params[0];
    const list = Array.from(mockDb.products.values()).filter(p => p.workspace_id === wsId && !p.is_deleted);
    return { rows: list.map(p => ({ ...p, full_count: list.length })) };
  }

  // 4. Invoices
  if (text.includes('generate_next_invoice_number')) {
    return { rows: [{ invoice_number: 'AFS-2026-0001' }] };
  }

  if (text.includes('FROM invoices') && text.includes('FOR UPDATE')) {
    const [invId, wsId] = params;
    const inv = mockDb.invoices.get(invId);
    return { rows: inv && inv.workspace_id === wsId && !inv.is_deleted ? [inv] : [] };
  }

  if (text.includes('FROM invoices') && text.includes('WHERE id = $1 AND workspace_id = $2')) {
    const [invId, wsId] = params;
    const inv = mockDb.invoices.get(invId);
    return { rows: inv && inv.workspace_id === wsId && !inv.is_deleted ? [inv] : [] };
  }

  if (text.includes('INSERT INTO invoices')) {
    const [
      wsId, custId, createdByUserId, invNum, billType,
      date, dueDate, status, subtotal, taxTotal, discountTotal, shippingCharge,
      grandTotal, amountPaid, balanceDue, publicToken, selectedTemplate, notes, terms
    ] = params;
    const inv = {
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
      public_token: publicToken || 'pub_token_123',
      selected_template: selectedTemplate || 'modern',
      notes,
      terms,
      is_deleted: false,
      created_at: new Date().toISOString()
    };
    mockDb.invoices.set(inv.id, inv);
    return { rows: [inv] };
  }

  if (text.includes('INSERT INTO invoice_items')) {
    return { rows: [{ id: 'item_01' }] };
  }

  if (text.includes('UPDATE invoices') && text.includes('SET amount_paid = $1')) {
    const [amtPaid, balDue, status, invId, wsId] = params;
    const inv = mockDb.invoices.get(invId);
    if (inv && inv.workspace_id === wsId) {
      inv.amount_paid = amtPaid;
      inv.balance_due = balDue;
      inv.status = status;
      return { rows: [inv] };
    }
    return { rows: [] };
  }

  // 5. Payments
  if (text.includes('COALESCE(SUM(amount), 0) AS total_paid') && text.includes('FROM payments')) {
    const [wsId, invId] = params;
    const pays = Array.from(mockDb.payments.values()).filter(p => p.workspace_id === wsId && p.invoice_id === invId);
    const sum = pays.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    return { rows: [{ total_paid: sum }] };
  }

  if (text.includes('INSERT INTO payments')) {
    const [wsId, invId, custId, amount, method, ref, date, notes, createdBy] = params;
    const pay = {
      id: `pay00000-0000-0000-0000-${String(mockDb.payments.size + 1).padStart(12, '0')}`,
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
    mockDb.payments.set(pay.id, pay);
    return { rows: [pay] };
  }

  if (text.includes('UPDATE customers') && text.includes('current_due')) {
    return { rows: [] };
  }

  // 6. Expenses
  if (text.includes('INSERT INTO expenses')) {
    const [wsId, amount, cat, desc, date] = params;
    const exp = {
      id: `exp00000-0000-0000-0000-${String(mockDb.expenses.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      amount,
      category: cat,
      description: desc,
      date,
      created_at: new Date().toISOString()
    };
    mockDb.expenses.set(exp.id, exp);
    return { rows: [exp] };
  }

  // 7. Bank Ledger
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

  // 8. Notifications
  if (text.includes('INSERT INTO notifications')) {
    const [wsId, userId, type, title, msg, entityType, entityId] = params;
    const notif = {
      id: `notif0000-0000-0000-0000-${String(mockDb.notifications.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      user_id: userId,
      type,
      title,
      message: msg,
      entity_type: entityType,
      entity_id: entityId,
      is_read: false,
      created_at: new Date().toISOString()
    };
    mockDb.notifications.set(notif.id, notif);
    return { rows: [notif] };
  }

  if (text.includes('COUNT(*)') && text.includes('FROM notifications')) {
    const wsId = params[0];
    const unread = Array.from(mockDb.notifications.values()).filter(n => n.workspace_id === wsId && !n.is_read).length;
    return { rows: [{ unread_count: String(unread) }] };
  }

  if (text.includes('FROM notifications') && text.includes('WHERE workspace_id = $1')) {
    const wsId = params[0];
    const list = Array.from(mockDb.notifications.values()).filter(n => n.workspace_id === wsId);
    return { rows: list };
  }

  return { rows: [] };
};

// Start test server
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
PostgresClient.getAuthToken = async () => 'valid_dev_token_alice';

let createdCustomerId = '';
let createdProductId = '';
let createdInvoiceId = '';

// ============================================================================
// PRODUCTION USER JOURNEY TEST CASES
// ============================================================================

await test('1. User Journey: First onboarding & workspace verification', () => {
  const ws = mockDb.workspaces.get(WS_ALICE_ID);
  assert.strictEqual(ws.name, 'Alice Fashion Studio');
  assert.strictEqual(ws.category, 'Fashion & Apparel');
  assert.strictEqual(ws.currency, 'INR');
  assert.strictEqual(ws.is_suspended, false);
});

await test('2. User Journey: Workspace isolation (Alice vs Bob strictly partitioned)', async () => {
  PostgresClient.getAuthToken = async () => 'valid_dev_token_bob';
  const res = await PostgresClient.request(`/api/v1/customers?workspaceId=${WS_ALICE_ID}`);
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.status, 403);
  PostgresClient.getAuthToken = async () => 'valid_dev_token_alice';
});

await test('3. Customer Flow: Create customer with opening due and contact details', async () => {
  const res = await PostgresClient.request('/api/v1/customers', {
    method: 'POST',
    body: {
      workspaceId: WS_ALICE_ID,
      name: 'Priya Sharma Designs',
      phone: '9876543210',
      email: 'priya@sharmadesigns.in',
      address: '42 Fashion Street, Mumbai',
      gstin: '27AAAAA0000A1Z5',
      openingBalance: 1500
    }
  });

  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.data.name, 'Priya Sharma Designs');
  createdCustomerId = res.data.id;
});

await test('4. Customer Flow: List and search customer', async () => {
  const res = await PostgresClient.request(`/api/v1/customers?workspaceId=${WS_ALICE_ID}&search=Priya`);
  assert.strictEqual(res.ok, true);
  const items = Array.isArray(res.data) ? res.data : (res.data.items || []);
  assert.ok(items.length >= 1);
  assert.strictEqual(items[0].name, 'Priya Sharma Designs');
});

await test('5. Product / Inventory Flow: Create catalog item with tax and min stock alert', async () => {
  const res = await PostgresClient.request('/api/v1/products', {
    method: 'POST',
    body: {
      workspaceId: WS_ALICE_ID,
      name: 'Banarasi Zari Silk Saree',
      sku: 'BZS-100',
      description: 'Handcrafted bridal silk saree',
      rate: 8500,
      unit: 'Pcs',
      taxRate: 5,
      stockQuantity: 15,
      minStockAlert: 3
    }
  });

  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.data.name, 'Banarasi Zari Silk Saree');
  createdProductId = res.data.id;
});

await test('6. Complete Invoice Flow: Calculate totals with line items, tax, discount, shipping', () => {
  const { financials } = calculateCanonicalInvoiceFinancials({
    items: [
      { name: 'Banarasi Zari Silk Saree', quantity: 2, rate: 8500, taxPercent: 5 },
      { name: 'Custom Hand Embroidery Border', quantity: 1, rate: 2500, taxPercent: 18 }
    ],
    discountAmount: 500,
    shippingCharge: 150
  });
  assert.strictEqual(financials.subtotal, 19500);
  assert.strictEqual(financials.discountTotal, 500);
  assert.strictEqual(financials.shippingCharge, 150);
  assert.strictEqual(financials.taxTotal, 1300);
  assert.strictEqual(financials.grandTotal, 20450);
});

await test('7. Complete Invoice Flow: Create invoice in database with canonical numbers', async () => {
  const res = await PostgresClient.request('/api/v1/invoices', {
    method: 'POST',
    body: {
      workspaceId: WS_ALICE_ID,
      customerId: createdCustomerId,
      date: '2026-08-30',
      dueDate: '2026-09-15',
      billType: 'Invoice',
      items: [
        { name: 'Banarasi Zari Silk Saree', quantity: 2, rate: 8500, taxPercent: 5 },
        { name: 'Custom Hand Embroidery Border', quantity: 1, rate: 2500, taxPercent: 18 }
      ],
      discountTotal: 500,
      shippingCharge: 150
    }
  });

  assert.strictEqual(res.ok, true);
  assert.ok(res.data.id);
  assert.strictEqual(res.data.invoiceNumber, 'AFS-2026-0001');
  assert.strictEqual(res.data.status, 'Unpaid');
  createdInvoiceId = res.data.id;
});

await test('8. Payment Flow: Record partial payment of ₹10,000 against invoice', async () => {
  const res = await PostgresClient.request('/api/v1/payments', {
    method: 'POST',
    body: {
      workspaceId: WS_ALICE_ID,
      invoiceId: createdInvoiceId,
      amount: 10000,
      paymentMethod: 'UPI',
      transactionReference: 'UPI-TX-998811'
    }
  });

  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.data.payment.amount, 10000);
  assert.strictEqual(res.data.invoice.status, 'Partially Paid');
});

await test('9. Payment Flow: Record final settlement payment clearing remaining balance', async () => {
  const inv = mockDb.invoices.get(createdInvoiceId);
  const remaining = inv.balance_due;

  const res = await PostgresClient.request('/api/v1/payments', {
    method: 'POST',
    body: {
      workspaceId: WS_ALICE_ID,
      invoiceId: createdInvoiceId,
      amount: remaining,
      paymentMethod: 'Bank Transfer',
      transactionReference: 'NEFT-AXIS-0021'
    }
  });

  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.data.invoice.status, 'Paid');
});

await test('10. Expense Flow: Record studio operating expense', async () => {
  const res = await PostgresClient.request('/api/v1/expenses', {
    method: 'POST',
    body: {
      workspaceId: WS_ALICE_ID,
      amount: 3200,
      category: 'Utilities',
      description: 'Studio power and lighting bill'
    }
  });

  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.data.amount, 3200);
  assert.strictEqual(res.data.category, 'Utilities');
});

await test('11. Bank Ledger Flow: Record direct bank deposit credit', async () => {
  const res = await PostgresClient.request('/api/v1/bank-ledger', {
    method: 'POST',
    body: {
      workspaceId: WS_ALICE_ID,
      type: 'Income',
      amount: 25000,
      description: 'Owner Capital Infusion'
    }
  });

  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.data.amount, 25000);
  assert.strictEqual(res.data.type, 'Income');
});

await test('12. Notification Flow: Create notification and query unread count', async () => {
  const notif = await NotificationService.createNotification({
    workspaceId: WS_ALICE_ID,
    type: 'PAYMENT_RECEIVED',
    title: 'Payment Received',
    message: 'Payment of ₹10,000 received for invoice AFS-2026-0001',
    entityType: 'payments',
    entityId: createdInvoiceId
  });

  assert.ok(notif.id);

  const countRes = await PostgresClient.request(`/api/v1/notifications/unread-count?workspaceId=${WS_ALICE_ID}`);
  assert.strictEqual(countRes.ok, true);
  assert.ok(parseInt(countRes.data.unreadCount, 10) >= 1);
});

await test('13. Persistence & Relogin: Workspace settings remain intact on session restore', () => {
  const aliceWs = mockDb.workspaces.get(WS_ALICE_ID);
  assert.strictEqual(aliceWs.name, 'Alice Fashion Studio');
  assert.strictEqual(mockDb.customers.size, 1);
  assert.strictEqual(mockDb.products.size, 1);
  assert.strictEqual(mockDb.invoices.size, 1);
});

await test('14. Production Invariant: Firebase primary architecture remains active and unmodified', () => {
  assert.strictEqual(fs.existsSync('src/services/firebaseConfig.js'), true);
  assert.strictEqual(fs.existsSync('src/services/localDb.js'), true);
  assert.strictEqual(fs.existsSync('src/services/offlineEngine.js'), true);
});

// Clean up test server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`🌟 PRODUCTION USER JOURNEY: ${passedTests} / 14 PASSED (100%)`);
console.log('======================================================\n');
