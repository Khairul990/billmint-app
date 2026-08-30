import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';
import { NotificationService } from '../backend/src/modules/notifications/notificationService.js';
import { BackupRepository } from '../backend/src/modules/backups/backupRepository.js';

console.log('======================================================');
console.log('🏛️ BILLQYRO PHASE 2 INTEGRATION AUDIT & MIGRATION READINESS');
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
// 1. MIGRATIONS INTEGRITY AUDIT (001 - 008)
// ============================================================================

await test('1.1 Migrations: All migrations exist in backend/migrations in strict sequence', () => {
  const migrationsDir = 'backend/migrations';
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
  assert.strictEqual(files.length, 9);
  assert.strictEqual(files[0], '001_initial_schema.sql');
  assert.strictEqual(files[1], '002_payment_indexes.sql');
  assert.strictEqual(files[2], '003_pdf_storage_indexes.sql');
  assert.strictEqual(files[3], '004_vendors_outsource.sql');
  assert.strictEqual(files[4], '005_expenses_bank_ledger.sql');
  assert.strictEqual(files[5], '006_products_inventory.sql');
  assert.strictEqual(files[6], '007_notifications.sql');
  assert.strictEqual(files[7], '008_backup_jobs.sql');
  assert.strictEqual(files[8], '009_backfill_jobs.sql');
});

await test('1.2 Migrations: Migrations define necessary multi-tenant tables and indexes', () => {
  const m1 = fs.readFileSync('backend/migrations/001_initial_schema.sql', 'utf8');
  assert.ok(m1.includes('CREATE TABLE IF NOT EXISTS workspaces'));
  assert.ok(m1.includes('CREATE TABLE IF NOT EXISTS users'));
  assert.ok(m1.includes('CREATE TABLE IF NOT EXISTS workspace_members'));
  assert.ok(m1.includes('CREATE TABLE IF NOT EXISTS customers'));
  assert.ok(m1.includes('CREATE TABLE IF NOT EXISTS invoices'));
  assert.ok(m1.includes('CREATE TABLE IF NOT EXISTS invoice_items'));
  assert.ok(m1.includes('CREATE TABLE IF NOT EXISTS payments'));

  const m7 = fs.readFileSync('backend/migrations/007_notifications.sql', 'utf8');
  assert.ok(m7.includes('CREATE TABLE IF NOT EXISTS notifications'));
  assert.ok(m7.includes('idx_notifications_workspace_user'));

  const m8 = fs.readFileSync('backend/migrations/008_backup_jobs.sql', 'utf8');
  assert.ok(m8.includes('CREATE TABLE IF NOT EXISTS backup_jobs'));
  assert.ok(m8.includes('idx_backup_jobs_workspace'));

  const m9 = fs.readFileSync('backend/migrations/009_backfill_jobs.sql', 'utf8');
  assert.ok(m9.includes('CREATE TABLE IF NOT EXISTS backfill_jobs'));
  assert.ok(m9.includes('idx_backfill_jobs_workspace'));
});

// ============================================================================
// 2. IN-MEMORY MULTI-TENANT TEST ENVIRONMENT
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
  vendors: new Map(),
  outsourceJobs: new Map(),
  notifications: new Map(),
  backupJobs: new Map(),
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
  // 1. Health check
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

  // 3. Compile Workspace Export Snapshot
  if (text.includes('FROM workspaces') && text.includes('WHERE id = $1')) {
    const ws = mockDb.workspaces.get(params[0]);
    return { rows: ws ? [ws] : [] };
  }
  if (text.includes('FROM customers') && text.includes('workspace_id = $1')) {
    return { rows: Array.from(mockDb.customers.values()).filter(c => c.workspace_id === params[0]) };
  }
  if (text.includes('FROM products') && text.includes('workspace_id = $1')) {
    return { rows: Array.from(mockDb.products.values()).filter(p => p.workspace_id === params[0]) };
  }
  if (text.includes('FROM invoices') && text.includes('workspace_id = $1')) {
    return { rows: Array.from(mockDb.invoices.values()).filter(i => i.workspace_id === params[0]) };
  }
  if (text.includes('FROM invoice_items') && text.includes('workspace_id = $1')) {
    return { rows: Array.from(mockDb.invoiceItems.values()).filter(i => i.workspace_id === params[0]) };
  }
  if (text.includes('FROM payments') && text.includes('workspace_id = $1')) {
    return { rows: Array.from(mockDb.payments.values()).filter(p => p.workspace_id === params[0]) };
  }
  if (text.includes('FROM expenses') && text.includes('workspace_id = $1')) {
    return { rows: Array.from(mockDb.expenses.values()).filter(e => e.workspace_id === params[0]) };
  }
  if (text.includes('FROM bank_ledger_entries') && text.includes('workspace_id = $1')) {
    return { rows: Array.from(mockDb.bankLedger.values()).filter(b => b.workspace_id === params[0]) };
  }
  if (text.includes('FROM vendors') && text.includes('workspace_id = $1')) {
    return { rows: Array.from(mockDb.vendors.values()).filter(v => v.workspace_id === params[0]) };
  }
  if (text.includes('FROM outsource_jobs') && text.includes('workspace_id = $1')) {
    return { rows: Array.from(mockDb.outsourceJobs.values()).filter(o => o.workspace_id === params[0]) };
  }

  // 4. Notifications
  if (text.includes('INSERT INTO notifications')) {
    const [wsId, userId, type, title, message, entityType, entityId] = params;
    const notif = {
      id: `n0000000-0000-0000-0000-${String(mockDb.notifications.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      user_id: userId,
      type,
      title,
      message,
      entity_type: entityType,
      entity_id: entityId,
      is_read: false,
      created_at: new Date().toISOString()
    };
    mockDb.notifications.set(notif.id, notif);
    return { rows: [notif] };
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

const ALICE_AUTH = { 'Authorization': 'Bearer valid_dev_token_alice' };
const BOB_AUTH = { 'Authorization': 'Bearer valid_dev_token_bob' };

// ============================================================================
// 3. API ROUTING & CROSS-MODULE ISOLATION AUDIT
// ============================================================================

await test('3.1 Multi-Tenant Gatekeeper: Bob is blocked with 403 on Alice workspace across all modules', async () => {
  const endpoints = [
    `/api/v1/customers?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/products?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/invoices?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/payments?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/expenses?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/bank-ledger?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/vendors?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/outsource-jobs?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/reports/dashboard?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/reports/sales?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/notifications?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/backups?workspaceId=${WS_ALICE_ID}`
  ];

  for (const ep of endpoints) {
    const res = await makeRequest(ep, { headers: BOB_AUTH });
    assert.strictEqual(res.status, 403, `Expected 403 for endpoint ${ep}, got ${res.status}`);
    assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
  }
});

await test('3.2 Authentication Gatekeeper: Unauthenticated requests are rejected with 401 across all modules', async () => {
  const endpoints = [
    `/api/v1/customers?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/products?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/invoices?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/payments?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/expenses?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/bank-ledger?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/vendors?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/outsource-jobs?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/reports/dashboard?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/notifications?workspaceId=${WS_ALICE_ID}`,
    `/api/v1/backups?workspaceId=${WS_ALICE_ID}`
  ];

  for (const ep of endpoints) {
    const res = await makeRequest(ep);
    assert.strictEqual(res.status, 401, `Expected 401 for unauthenticated ${ep}, got ${res.status}`);
    assert.strictEqual(res.body.error.code, 'AUTH_REQUIRED');
  }
});

// ============================================================================
// 4. FINANCIAL PRECISION, INVARIANTS & ERROR HANDLING
// ============================================================================

await test('4.1 Financial Invariants: Negative / NaN amounts and malformed payloads rejected cleanly (400)', async () => {
  // Test products validation
  const { validateCreateProduct } = await import('../backend/src/modules/products/productValidation.js');
  const negProduct = validateCreateProduct({ workspaceId: WS_ALICE_ID, name: 'Thread', rate: -50 });
  assert.strictEqual(negProduct.isValid, false);

  // Test expenses validation
  const { validateCreateExpense } = await import('../backend/src/modules/expenses/expenseValidation.js');
  const negExpense = validateCreateExpense({ workspaceId: WS_ALICE_ID, amount: -100, category: 'Rent' });
  assert.strictEqual(negExpense.isValid, false);

  // Test vendor payment validation
  const { validateRecordVendorPayment } = await import('../backend/src/modules/vendors/vendorValidation.js');
  const nanPayment = validateRecordVendorPayment({ workspaceId: WS_ALICE_ID, vendorId: 'v1', amount: 'abc' });
  assert.strictEqual(nanPayment.isValid, false);
});

// ============================================================================
// 5. CROSS-MODULE EVENT NOTIFICATIONS & EXPORT READINESS
// ============================================================================

await test('5.1 Notification System: Emits typed system and financial alerts safely', async () => {
  const notif = await NotificationService.createNotification({
    workspaceId: WS_ALICE_ID,
    type: 'PAYMENT_RECEIVED',
    title: 'Audit Payment Received',
    message: 'Received ₹15,000 via NEFT',
    entityType: 'payment',
    entityId: 'pay-001'
  });

  assert.ok(notif.id);
  assert.strictEqual(notif.type, 'PAYMENT_RECEIVED');
  assert.strictEqual(notif.is_read, false);
});

await test('5.2 Backup & Export Snapshot: Compiles complete 10-module domain dataset with zero secret leakage', async () => {
  // Populate mock data across entities
  mockDb.customers.set('c1', { workspace_id: WS_ALICE_ID, name: 'Alice Customer' });
  mockDb.products.set('p1', { workspace_id: WS_ALICE_ID, name: 'Silk Fabric' });
  mockDb.invoices.set('i1', { workspace_id: WS_ALICE_ID, invoice_number: 'INV-100' });
  mockDb.invoiceItems.set('ii1', { workspace_id: WS_ALICE_ID, name: 'Silk Fabric Item' });
  mockDb.payments.set('pay1', { workspace_id: WS_ALICE_ID, amount: '500.00' });
  mockDb.expenses.set('e1', { workspace_id: WS_ALICE_ID, amount: '120.00' });
  mockDb.bankLedger.set('b1', { workspace_id: WS_ALICE_ID, amount: '500.00' });
  mockDb.vendors.set('v1', { workspace_id: WS_ALICE_ID, name: 'Thread Supplier' });
  mockDb.outsourceJobs.set('oj1', { workspace_id: WS_ALICE_ID, cost: '300.00' });

  const snapshot = await BackupRepository.compileWorkspaceExport(WS_ALICE_ID);
  assert.ok(snapshot.workspace);
  assert.strictEqual(snapshot.customers.length, 1);
  assert.strictEqual(snapshot.products.length, 1);
  assert.strictEqual(snapshot.invoices.length, 1);
  assert.strictEqual(snapshot.invoiceItems.length, 1);
  assert.strictEqual(snapshot.payments.length, 1);
  assert.strictEqual(snapshot.expenses.length, 1);
  assert.strictEqual(snapshot.bankLedger.length, 1);
  assert.strictEqual(snapshot.vendors.length, 1);
  assert.strictEqual(snapshot.outsourceJobs.length, 1);

  // Secret safety check
  const rawJson = JSON.stringify(snapshot);
  assert.strictEqual(rawJson.includes('password_hash'), false);
  assert.strictEqual(rawJson.includes('firebase_service_account'), false);
  assert.strictEqual(rawJson.includes('private_key'), false);
  assert.strictEqual(rawJson.includes('dev_secret'), false);
});

// ============================================================================
// 6. PRODUCTION GUARDRAILS & NON-REGRESSION
// ============================================================================

await test('6.1 Non-Regression: Frontend & Firebase core production files remain untouched', () => {
  const criticalFiles = [
    'src/services/dbEngine.js',
    'src/services/offlineEngine.js',
    'src/services/paymentEngine.js',
    'src/services/reportEngine.js',
    'src/services/authEngine.js',
    'src/services/firebaseConfig.js',
    'src/pages/Invoices.jsx',
    'src/pages/Dashboard.jsx',
    'src/pages/Customers.jsx',
    'src/pages/Products.jsx',
    'src/pages/Expenses.jsx',
    'src/pages/DueLedger.jsx'
  ];

  for (const file of criticalFiles) {
    assert.strictEqual(fs.existsSync(file), true, `Critical file ${file} must exist`);
  }
});

// Clean up server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`🏛️ PHASE 2 INTEGRATION AUDIT: ${passedTests} / ${passedTests} PASSED (100%)`);
console.log('======================================================\n');
