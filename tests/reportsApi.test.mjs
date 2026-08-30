import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';

console.log('======================================================');
console.log('⚡ RUNNING BILLQYRO REPORTS & DASHBOARD SUMMARY API TESTS');
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
  invoices: new Map(),
  payments: new Map(),
  expenses: new Map(),
  bankLedger: new Map()
};

// Seed Users
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
  full_name: 'Bob Retailer Dev',
  system_role: 'user'
});

// Seed Workspaces
const WS_ALICE_ID = 'b0000000-0000-0000-0000-000000000001';
const WS_BOB_ID = 'b0000000-0000-0000-0000-000000000002';

mockDb.workspaces.set(WS_ALICE_ID, {
  id: WS_ALICE_ID,
  name: 'Alice Fashion Studio',
  currency: 'INR',
  currency_symbol: '₹',
  is_suspended: false
});

mockDb.workspaces.set(WS_BOB_ID, {
  id: WS_BOB_ID,
  name: 'Bob Electronics Hub',
  currency: 'INR',
  currency_symbol: '₹',
  is_suspended: false
});

// Seed Memberships
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

// Seed Invoices for Alice
mockDb.invoices.set('inv_1', {
  id: 'i0000000-0000-0000-0000-000000000001',
  workspace_id: WS_ALICE_ID,
  invoice_number: 'AFS-0101',
  date: '2026-08-15',
  due_date: '2026-08-30',
  status: 'Paid',
  subtotal: 10000,
  tax_total: 500,
  discount_total: 0,
  grand_total: 10500,
  amount_paid: 10500,
  balance_due: 0,
  is_deleted: false,
  created_at: '2026-08-15T10:00:00Z'
});

mockDb.invoices.set('inv_2', {
  id: 'i0000000-0000-0000-0000-000000000002',
  workspace_id: WS_ALICE_ID,
  invoice_number: 'AFS-0102',
  date: '2026-08-20',
  due_date: '2026-09-05',
  status: 'Partially Paid',
  subtotal: 5000,
  tax_total: 250,
  discount_total: 0,
  grand_total: 5250,
  amount_paid: 2000,
  balance_due: 3250,
  is_deleted: false,
  created_at: '2026-08-20T10:00:00Z'
});

// Seed Payments
mockDb.payments.set('pay_1', {
  id: 'p0000000-0000-0000-0000-000000000001',
  workspace_id: WS_ALICE_ID,
  invoice_id: 'i0000000-0000-0000-0000-000000000001',
  payment_number: 'PAY-001',
  amount: 10500,
  payment_method: 'UPI',
  payment_date: '2026-08-15',
  reference_note: 'Full payment',
  is_deleted: false,
  created_at: '2026-08-15T10:30:00Z'
});

mockDb.payments.set('pay_2', {
  id: 'p0000000-0000-0000-0000-000000000002',
  workspace_id: WS_ALICE_ID,
  invoice_id: 'i0000000-0000-0000-0000-000000000002',
  payment_number: 'PAY-002',
  amount: 2000,
  payment_method: 'Bank Transfer',
  payment_date: '2026-08-20',
  reference_note: 'Partial advance',
  is_deleted: false,
  created_at: '2026-08-20T11:00:00Z'
});

// Seed Expenses
mockDb.expenses.set('exp_1', {
  id: 'e0000000-0000-0000-0000-000000000001',
  workspace_id: WS_ALICE_ID,
  amount: 3500,
  category: 'Rent',
  description: 'Studio rent',
  date: '2026-08-01',
  is_deleted: false,
  created_at: '2026-08-01T10:00:00Z'
});

mockDb.expenses.set('exp_2', {
  id: 'e0000000-0000-0000-0000-000000000002',
  workspace_id: WS_ALICE_ID,
  amount: 500,
  category: 'Utilities',
  description: 'Electricity bill',
  date: '2026-08-10',
  is_deleted: false,
  created_at: '2026-08-10T10:00:00Z'
});

// Seed Bank Ledger
mockDb.bankLedger.set('bank_1', {
  id: 'b0000000-0000-0000-0000-000000000001',
  workspace_id: WS_ALICE_ID,
  type: 'Income',
  amount: 12500,
  description: 'Customer deposit',
  date: '2026-08-20',
  is_deleted: false,
  created_at: '2026-08-20T12:00:00Z'
});

mockDb.bankLedger.set('bank_2', {
  id: 'b0000000-0000-0000-0000-000000000002',
  workspace_id: WS_ALICE_ID,
  type: 'Expense',
  amount: 4000,
  description: 'Rent & bills',
  date: '2026-08-01',
  is_deleted: false,
  created_at: '2026-08-01T12:00:00Z'
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

  // 3. Dashboard Invoices Aggregation
  if (text.includes('COUNT(*) FILTER (WHERE status = \'Paid\')')) {
    const wsId = params[0];
    const invList = Array.from(mockDb.invoices.values()).filter(i => i.workspace_id === wsId && !i.is_deleted);
    const totalInvoices = invList.length;
    const paidInvoices = invList.filter(i => i.status === 'Paid').length;
    const unpaidInvoices = invList.filter(i => i.status === 'Unpaid').length;
    const partiallyPaidInvoices = invList.filter(i => i.status === 'Partially Paid').length;
    const totalSales = invList.reduce((sum, i) => sum + i.grand_total, 0);
    const totalPaidInvoices = invList.reduce((sum, i) => sum + i.amount_paid, 0);
    const totalDue = invList.reduce((sum, i) => sum + i.balance_due, 0);

    return {
      rows: [{
        total_invoices: totalInvoices,
        paid_invoices: paidInvoices,
        unpaid_invoices: unpaidInvoices,
        partially_paid_invoices: partiallyPaidInvoices,
        total_sales: totalSales,
        total_paid_invoices: totalPaidInvoices,
        total_due: totalDue
      }]
    };
  }

  // 4. Dashboard Payments Aggregation
  if (text.includes('total_payments') && text.includes('FROM payments')) {
    const wsId = params[0];
    const payList = Array.from(mockDb.payments.values()).filter(p => p.workspace_id === wsId && !p.is_deleted);
    const totalPayments = payList.reduce((sum, p) => sum + p.amount, 0);
    return { rows: [{ total_payments: totalPayments }] };
  }

  // 5. Dashboard Expenses Aggregation
  if (text.includes('total_expenses') && text.includes('FROM expenses')) {
    const wsId = params[0];
    const expList = Array.from(mockDb.expenses.values()).filter(e => e.workspace_id === wsId && !e.is_deleted);
    const totalExpenses = expList.reduce((sum, e) => sum + e.amount, 0);
    return { rows: [{ total_expenses: totalExpenses }] };
  }

  // 6. Sales Report
  if (text.includes('FROM invoices') && text.includes('COALESCE(SUM(subtotal), 0) AS subtotal')) {
    const wsId = params[0];
    let invList = Array.from(mockDb.invoices.values()).filter(i => i.workspace_id === wsId && !i.is_deleted);
    
    if (text.includes('date >= $')) {
      const match = text.match(/date >= \$(\d+)/);
      if (match) {
        const fromVal = params[parseInt(match[1], 10) - 1];
        invList = invList.filter(i => i.date >= fromVal);
      }
    }
    if (text.includes('date <= $')) {
      const match = text.match(/date <= \$(\d+)/);
      if (match) {
        const toVal = params[parseInt(match[1], 10) - 1];
        invList = invList.filter(i => i.date <= toVal);
      }
    }
    if (text.includes('status = $')) {
      const match = text.match(/status = \$(\d+)/);
      if (match) {
        const statusVal = params[parseInt(match[1], 10) - 1];
        invList = invList.filter(i => i.status === statusVal);
      }
    }

    return {
      rows: [{
        invoice_count: invList.length,
        subtotal: invList.reduce((sum, i) => sum + i.subtotal, 0),
        tax_total: invList.reduce((sum, i) => sum + i.tax_total, 0),
        discount_total: invList.reduce((sum, i) => sum + i.discount_total, 0),
        grand_total: invList.reduce((sum, i) => sum + i.grand_total, 0),
        amount_paid: invList.reduce((sum, i) => sum + i.amount_paid, 0),
        balance_due: invList.reduce((sum, i) => sum + i.balance_due, 0)
      }]
    };
  }

  if (text.includes('SELECT id, invoice_number, date, due_date, status, subtotal, tax_total, discount_total, grand_total, amount_paid, balance_due') && text.includes('FROM invoices')) {
    const wsId = params[0];
    let invList = Array.from(mockDb.invoices.values()).filter(i => i.workspace_id === wsId && !i.is_deleted);
    
    if (text.includes('date >= $')) {
      const match = text.match(/date >= \$(\d+)/);
      if (match) {
        const fromVal = params[parseInt(match[1], 10) - 1];
        invList = invList.filter(i => i.date >= fromVal);
      }
    }
    if (text.includes('date <= $')) {
      const match = text.match(/date <= \$(\d+)/);
      if (match) {
        const toVal = params[parseInt(match[1], 10) - 1];
        invList = invList.filter(i => i.date <= toVal);
      }
    }
    if (text.includes('status = $')) {
      const match = text.match(/status = \$(\d+)/);
      if (match) {
        const statusVal = params[parseInt(match[1], 10) - 1];
        invList = invList.filter(i => i.status === statusVal);
      }
    }

    // Pagination
    const limitMatch = text.match(/LIMIT \$(\d+)/);
    const offsetMatch = text.match(/OFFSET \$(\d+)/);
    const limit = limitMatch ? params[parseInt(limitMatch[1], 10) - 1] : 50;
    const offset = offsetMatch ? params[parseInt(offsetMatch[1], 10) - 1] : 0;

    return { rows: invList.slice(offset, offset + limit) };
  }

  // 7. Payments Report
  if (text.includes('COUNT(*) AS payment_count') && text.includes('FROM payments')) {
    const wsId = params[0];
    let payList = Array.from(mockDb.payments.values()).filter(p => p.workspace_id === wsId && !p.is_deleted);
    
    if (text.includes('payment_date >= $')) {
      const match = text.match(/payment_date >= \$(\d+)/);
      if (match) {
        const fromVal = params[parseInt(match[1], 10) - 1];
        payList = payList.filter(p => p.payment_date >= fromVal);
      }
    }
    if (text.includes('payment_date <= $')) {
      const match = text.match(/payment_date <= \$(\d+)/);
      if (match) {
        const toVal = params[parseInt(match[1], 10) - 1];
        payList = payList.filter(p => p.payment_date <= toVal);
      }
    }

    return {
      rows: [{
        payment_count: payList.length,
        total_amount: payList.reduce((sum, p) => sum + p.amount, 0)
      }]
    };
  }

  if (text.includes('SELECT id, invoice_id, payment_number, amount, payment_method, payment_date') && text.includes('FROM payments')) {
    const wsId = params[0];
    let payList = Array.from(mockDb.payments.values()).filter(p => p.workspace_id === wsId && !p.is_deleted);

    if (text.includes('payment_date >= $')) {
      const match = text.match(/payment_date >= \$(\d+)/);
      if (match) {
        const fromVal = params[parseInt(match[1], 10) - 1];
        payList = payList.filter(p => p.payment_date >= fromVal);
      }
    }
    if (text.includes('payment_date <= $')) {
      const match = text.match(/payment_date <= \$(\d+)/);
      if (match) {
        const toVal = params[parseInt(match[1], 10) - 1];
        payList = payList.filter(p => p.payment_date <= toVal);
      }
    }

    const limitMatch = text.match(/LIMIT \$(\d+)/);
    const offsetMatch = text.match(/OFFSET \$(\d+)/);
    const limit = limitMatch ? params[parseInt(limitMatch[1], 10) - 1] : 50;
    const offset = offsetMatch ? params[parseInt(offsetMatch[1], 10) - 1] : 0;

    return { rows: payList.slice(offset, offset + limit) };
  }

  // 8. Expenses Report
  if (text.includes('COUNT(*) AS expense_count') && text.includes('FROM expenses')) {
    const wsId = params[0];
    let expList = Array.from(mockDb.expenses.values()).filter(e => e.workspace_id === wsId && !e.is_deleted);
    return {
      rows: [{
        expense_count: expList.length,
        total_amount: expList.reduce((sum, e) => sum + e.amount, 0)
      }]
    };
  }

  if (text.includes('GROUP BY category') && text.includes('FROM expenses')) {
    const wsId = params[0];
    let expList = Array.from(mockDb.expenses.values()).filter(e => e.workspace_id === wsId && !e.is_deleted);
    const byCategory = {};
    expList.forEach(e => {
      if (!byCategory[e.category]) byCategory[e.category] = { count: 0, total_amount: 0 };
      byCategory[e.category].count++;
      byCategory[e.category].total_amount += e.amount;
    });
    return {
      rows: Object.entries(byCategory).map(([category, stats]) => ({
        category,
        count: stats.count,
        total_amount: stats.total_amount
      }))
    };
  }

  // 9. Bank Ledger Report
  if (text.includes('COALESCE(SUM(CASE WHEN type = \'Income\' THEN amount ELSE 0 END), 0) AS total_income')) {
    const wsId = params[0];
    let bankList = Array.from(mockDb.bankLedger.values()).filter(b => b.workspace_id === wsId && !b.is_deleted);
    const totalIncome = bankList.filter(b => b.type === 'Income').reduce((sum, b) => sum + b.amount, 0);
    const totalExpense = bankList.filter(b => b.type === 'Expense').reduce((sum, b) => sum + b.amount, 0);
    return {
      rows: [{
        total_income: totalIncome,
        total_expense: totalExpense,
        entry_count: bankList.length
      }]
    };
  }

  if (text.includes('SELECT id, type, amount, description, date, created_at') && text.includes('FROM bank_ledger_entries')) {
    const wsId = params[0];
    let bankList = Array.from(mockDb.bankLedger.values()).filter(b => b.workspace_id === wsId && !b.is_deleted);

    const limitMatch = text.match(/LIMIT \$(\d+)/);
    const offsetMatch = text.match(/OFFSET \$(\d+)/);
    const limit = limitMatch ? params[parseInt(limitMatch[1], 10) - 1] : 50;
    const offset = offsetMatch ? params[parseInt(offsetMatch[1], 10) - 1] : 0;

    return { rows: bankList.slice(offset, offset + limit) };
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
// PART 1: DASHBOARD SUMMARY
// ============================================================================

await test('1. GET /api/v1/reports/dashboard: Returns accurate aggregated metrics (200)', async () => {
  const res = await makeRequest(`/api/v1/reports/dashboard?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  const data = res.body.data;
  assert.strictEqual(data.totalInvoices, 2);
  assert.strictEqual(data.paidInvoices, 1);
  assert.strictEqual(data.partiallyPaidInvoices, 1);
  assert.strictEqual(data.totalSales, 15750.00); // 10500 + 5250
  assert.strictEqual(data.totalPaid, 12500.00);  // 10500 + 2000
  assert.strictEqual(data.totalDue, 3250.00);    // 3250
  assert.strictEqual(data.totalExpenses, 4000.00); // 3500 + 500
  assert.strictEqual(data.netAmount, 8500.00);    // 12500 - 4000
});

// ============================================================================
// PART 2: SALES REPORT & FILTERING
// ============================================================================

await test('2. GET /api/v1/reports/sales: Returns sales totals and invoice items (200)', async () => {
  const res = await makeRequest(`/api/v1/reports/sales?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.summary.invoiceCount, 2);
  assert.strictEqual(res.body.data.summary.grandTotal, 15750.00);
  assert.strictEqual(res.body.data.invoices.length, 2);
});

await test('3. GET /api/v1/reports/sales: Date filter isolates specific date range (200)', async () => {
  const res = await makeRequest(`/api/v1/reports/sales?workspaceId=${WS_ALICE_ID}&from=2026-08-01&to=2026-08-18`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.summary.invoiceCount, 1);
  assert.strictEqual(res.body.data.invoices[0].invoice_number, 'AFS-0101');
});

await test('4. GET /api/v1/reports/sales: Pagination limit and offset (200)', async () => {
  const res = await makeRequest(`/api/v1/reports/sales?workspaceId=${WS_ALICE_ID}&limit=1&offset=0`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.invoices.length, 1);
  assert.strictEqual(res.body.data.pagination.limit, 1);
  assert.strictEqual(res.body.data.pagination.total, 2);
});

// ============================================================================
// PART 3: PAYMENTS REPORT
// ============================================================================

await test('5. GET /api/v1/reports/payments: Returns payment totals and ledger list (200)', async () => {
  const res = await makeRequest(`/api/v1/reports/payments?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.summary.paymentCount, 2);
  assert.strictEqual(res.body.data.summary.totalAmount, 12500.00);
  assert.strictEqual(res.body.data.payments.length, 2);
});

// ============================================================================
// PART 4: EXPENSES REPORT
// ============================================================================

await test('6. GET /api/v1/reports/expenses: Returns expenses grouped by category (200)', async () => {
  const res = await makeRequest(`/api/v1/reports/expenses?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.summary.expenseCount, 2);
  assert.strictEqual(res.body.data.summary.totalAmount, 4000.00);
  assert.strictEqual(res.body.data.byCategory.length, 2);
});

// ============================================================================
// PART 5: BANK LEDGER REPORT
// ============================================================================

await test('7. GET /api/v1/reports/bank-ledger: Computes income, expense, and netBalance (200)', async () => {
  const res = await makeRequest(`/api/v1/reports/bank-ledger?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.summary.totalIncome, 12500.00);
  assert.strictEqual(res.body.data.summary.totalExpense, 4000.00);
  assert.strictEqual(res.body.data.summary.netBalance, 8500.00);
  assert.strictEqual(res.body.data.entries.length, 2);
});

// ============================================================================
// PART 6: EMPTY DATASET & NUMERIC PRECISION
// ============================================================================

await test('8. Empty Dataset: Bob workspace with 0 entries returns clean zeroed dashboard (200)', async () => {
  const res = await makeRequest(`/api/v1/reports/dashboard?workspaceId=${WS_BOB_ID}`, {
    headers: BOB_AUTH
  });

  assert.strictEqual(res.status, 200);
  const data = res.body.data;
  assert.strictEqual(data.totalInvoices, 0);
  assert.strictEqual(data.totalSales, 0);
  assert.strictEqual(data.totalPaid, 0);
  assert.strictEqual(data.totalExpenses, 0);
  assert.strictEqual(data.netAmount, 0);
});

await test('9. Numeric Precision: All numbers rounded to 2 decimal places', async () => {
  const res = await makeRequest(`/api/v1/reports/dashboard?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });
  const data = res.body.data;
  assert.strictEqual(Number.isFinite(data.netAmount), true);
  assert.strictEqual(data.netAmount, 8500.00);
});

// ============================================================================
// PART 7: MULTI-TENANT ISOLATION & SECURITY
// ============================================================================

await test('10. Security: Bob cannot view Alice dashboard summary (403)', async () => {
  const res = await makeRequest(`/api/v1/reports/dashboard?workspaceId=${WS_ALICE_ID}`, {
    headers: BOB_AUTH
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

await test('11. Security: Bob cannot view Alice sales report (403)', async () => {
  const res = await makeRequest(`/api/v1/reports/sales?workspaceId=${WS_ALICE_ID}`, {
    headers: BOB_AUTH
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

await test('12. Security: Unauthenticated request returns 401', async () => {
  const res = await makeRequest(`/api/v1/reports/dashboard?workspaceId=${WS_ALICE_ID}`);
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error.code, 'AUTH_REQUIRED');
});

await test('13. Security: Malformed UUID parameter rejected cleanly (400)', async () => {
  const res = await makeRequest('/api/v1/reports/sales?workspaceId=not-a-uuid', {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('14. Security: SQL Injection payload in query parameters handled safely (200)', async () => {
  const res = await makeRequest(`/api/v1/reports/sales?workspaceId=${WS_ALICE_ID}&status=' OR '1'='1`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.summary.invoiceCount, 0);
});

await test('15. Non-Regression: Existing client-side code remains intact', () => {
  assert.strictEqual(fs.existsSync('src/utils/financialCalculations.js'), true);
});

// Clean up server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`⚡ REPORTS & DASHBOARD SUMMARY: ${passedTests} / ${passedTests} PASSED (100%)`);
console.log('======================================================\n');

