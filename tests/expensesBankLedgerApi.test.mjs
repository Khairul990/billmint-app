import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';

console.log('======================================================');
console.log('⚡ RUNNING BILLQYRO EXPENSES & BANK LEDGER API TESTS');
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
  expenses: new Map(),
  bankLedger: new Map()
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

  // 3. Insert Expense
  if (text.includes('INSERT INTO expenses')) {
    const [wsId, amount, category, description, date] = params;
    const expense = {
      id: `e0000000-0000-0000-0000-${String(mockDb.expenses.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      amount,
      category,
      description,
      date,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDb.expenses.set(expense.id, expense);
    return { rows: [expense] };
  }

  // 4. List Expenses
  if (text.includes('FROM expenses') && text.includes('COUNT(*) OVER() AS full_count')) {
    const wsId = params[0];
    let list = Array.from(mockDb.expenses.values()).filter(e => e.workspace_id === wsId && !e.is_deleted);

    if (text.includes('category = $')) {
      const catParam = params.find(p => typeof p === 'string' && !p.startsWith('b000') && !p.match(/^\d{4}-\d{2}-\d{2}$/) && typeof p !== 'number');
      if (catParam) list = list.filter(e => e.category === catParam);
    }

    if (text.includes('date >= $')) {
      const startParam = params.find(p => typeof p === 'string' && p.match(/^\d{4}-\d{2}-\d{2}$/));
      if (startParam) list = list.filter(e => e.date >= startParam);
    }

    if (text.includes('date <= $')) {
      const dates = params.filter(p => typeof p === 'string' && p.match(/^\d{4}-\d{2}-\d{2}$/));
      const endParam = dates.length > 1 ? dates[1] : dates[0];
      if (endParam) list = list.filter(e => e.date <= endParam);
    }

    const total = list.length;
    return {
      rows: list.map(item => ({ ...item, full_count: total }))
    };
  }

  // 5. Insert Bank Ledger Entry
  if (text.includes('INSERT INTO bank_ledger_entries')) {
    const [wsId, type, amount, description, date] = params;
    const entry = {
      id: `b0000000-0000-0000-0000-${String(mockDb.bankLedger.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      type,
      amount,
      description,
      date,
      is_deleted: false,
      created_at: new Date().toISOString()
    };
    mockDb.bankLedger.set(entry.id, entry);
    return { rows: [entry] };
  }

  // 6. List Bank Ledger Entries
  if (text.includes('FROM bank_ledger_entries') && text.includes('COUNT(*) OVER() AS full_count')) {
    const wsId = params[0];
    let list = Array.from(mockDb.bankLedger.values()).filter(b => b.workspace_id === wsId && !b.is_deleted);

    if (text.includes('type = $')) {
      const typeParam = params.find(p => ['Income', 'Expense'].includes(p));
      if (typeParam) list = list.filter(b => b.type === typeParam);
    }

    if (text.includes('date >= $')) {
      const startParam = params.find(p => typeof p === 'string' && p.match(/^\d{4}-\d{2}-\d{2}$/));
      if (startParam) list = list.filter(b => b.date >= startParam);
    }

    if (text.includes('date <= $')) {
      const dates = params.filter(p => typeof p === 'string' && p.match(/^\d{4}-\d{2}-\d{2}$/));
      const endParam = dates.length > 1 ? dates[1] : dates[0];
      if (endParam) list = list.filter(b => b.date <= endParam);
    }

    const total = list.length;
    return {
      rows: list.map(item => ({ ...item, full_count: total }))
    };
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
// PART 1: EXPENSES CRUD & VALIDATION
// ============================================================================

let aliceExpenseId1 = null;

await test('1. POST /api/v1/expenses: Successfully creates expense in authorized workspace (201)', async () => {
  const res = await makeRequest('/api/v1/expenses', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      amount: 3500.50,
      category: 'Rent',
      description: 'Studio Monthly Rent for August',
      date: '2026-08-30'
    }
  });

  assert.strictEqual(res.status, 201);
  assert.ok(res.body.data.id);
  assert.strictEqual(res.body.data.amount, 3500.50);
  assert.strictEqual(res.body.data.category, 'Rent');
  assert.strictEqual(res.body.data.date, '2026-08-30');
  aliceExpenseId1 = res.body.data.id;
});

await test('2. POST /api/v1/expenses: Rejects negative expense amount (400)', async () => {
  const res = await makeRequest('/api/v1/expenses', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      amount: -500,
      category: 'Utilities'
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('3. POST /api/v1/expenses: Rejects zero expense amount (400)', async () => {
  const res = await makeRequest('/api/v1/expenses', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      amount: 0,
      category: 'Utilities'
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('4. POST /api/v1/expenses: Rejects empty category (400)', async () => {
  const res = await makeRequest('/api/v1/expenses', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      amount: 250,
      category: '   '
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('5. POST /api/v1/expenses: Creates second expense with automatic today date (201)', async () => {
  const res = await makeRequest('/api/v1/expenses', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      amount: 450,
      category: 'Tea & Snacks',
      description: 'Client hospitality'
    }
  });

  assert.strictEqual(res.status, 201);
  assert.ok(res.body.data.date);
});

await test('6. GET /api/v1/expenses: Lists all expenses for authorized workspace (200)', async () => {
  const res = await makeRequest(`/api/v1/expenses?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 2);
  assert.strictEqual(res.body.pagination.total, 2);
});

await test('7. GET /api/v1/expenses: Filters expenses by category (200)', async () => {
  const res = await makeRequest(`/api/v1/expenses?workspaceId=${WS_ALICE_ID}&category=Rent`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 1);
  assert.strictEqual(res.body.data[0].category, 'Rent');
});

// ============================================================================
// PART 2: BANK LEDGER CRUD & VALIDATION
// ============================================================================

await test('8. POST /api/v1/bank-ledger: Creates Income bank ledger entry (201)', async () => {
  const res = await makeRequest('/api/v1/bank-ledger', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      type: 'Income',
      amount: 12000,
      description: 'NEFT Invoice Payment from Client A',
      date: '2026-08-30'
    }
  });

  assert.strictEqual(res.status, 201);
  assert.ok(res.body.data.id);
  assert.strictEqual(res.body.data.type, 'Income');
  assert.strictEqual(res.body.data.amount, 12000);
});

await test('9. POST /api/v1/bank-ledger: Creates Expense bank ledger entry (201)', async () => {
  const res = await makeRequest('/api/v1/bank-ledger', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      type: 'Expense',
      amount: 3000,
      description: 'Vendor Outsource Bank Transfer',
      date: '2026-08-30'
    }
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.type, 'Expense');
  assert.strictEqual(res.body.data.amount, 3000);
});

await test('10. POST /api/v1/bank-ledger: Rejects invalid transaction type (400)', async () => {
  const res = await makeRequest('/api/v1/bank-ledger', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      type: 'Transfer', // Not in ('Income', 'Expense')
      amount: 1000,
      description: 'Internal transfer'
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('11. POST /api/v1/bank-ledger: Rejects negative or zero amount (400)', async () => {
  const res = await makeRequest('/api/v1/bank-ledger', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      type: 'Income',
      amount: -500,
      description: 'Invalid negative deposit'
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('12. POST /api/v1/bank-ledger: Rejects empty description (400)', async () => {
  const res = await makeRequest('/api/v1/bank-ledger', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      type: 'Income',
      amount: 500,
      description: '   '
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('13. GET /api/v1/bank-ledger: Lists bank ledger entries for authorized workspace (200)', async () => {
  const res = await makeRequest(`/api/v1/bank-ledger?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 2);
  assert.strictEqual(res.body.pagination.total, 2);
});

await test('14. GET /api/v1/bank-ledger: Filters ledger entries by type=Income (200)', async () => {
  const res = await makeRequest(`/api/v1/bank-ledger?workspaceId=${WS_ALICE_ID}&type=Income`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 1);
  assert.strictEqual(res.body.data[0].type, 'Income');
});

await test('15. Financial Precision: Rounds amounts accurately to 2 decimal places', async () => {
  const res = await makeRequest('/api/v1/expenses', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      amount: 199.999, // Should round to 200.00
      category: 'Stationery'
    }
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.amount, 200.00);
});

// ============================================================================
// PART 3: WORKSPACE ISOLATION & SECURITY
// ============================================================================

await test('16. Security: Bob cannot view Alice expenses (403)', async () => {
  const res = await makeRequest(`/api/v1/expenses?workspaceId=${WS_ALICE_ID}`, {
    headers: BOB_AUTH
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

await test('17. Security: Bob cannot view Alice bank ledger (403)', async () => {
  const res = await makeRequest(`/api/v1/bank-ledger?workspaceId=${WS_ALICE_ID}`, {
    headers: BOB_AUTH
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

await test('18. Security: Alice cannot create expense in Bob workspace (403)', async () => {
  const res = await makeRequest('/api/v1/expenses', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_BOB_ID,
      amount: 1000,
      category: 'Rent'
    }
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

await test('19. Security: Alice cannot create bank ledger in Bob workspace (403)', async () => {
  const res = await makeRequest('/api/v1/bank-ledger', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_BOB_ID,
      type: 'Income',
      amount: 1000,
      description: 'Cross-tenant deposit'
    }
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

await test('20. Security: Unauthenticated request to /expenses returns 401', async () => {
  const res = await makeRequest(`/api/v1/expenses?workspaceId=${WS_ALICE_ID}`);
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error.code, 'AUTH_REQUIRED');
});

await test('21. Security: Unauthenticated request to /bank-ledger returns 401', async () => {
  const res = await makeRequest(`/api/v1/bank-ledger?workspaceId=${WS_ALICE_ID}`);
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error.code, 'AUTH_REQUIRED');
});

await test('22. Security: Malformed UUID parameter rejected cleanly (400)', async () => {
  const res = await makeRequest('/api/v1/expenses?workspaceId=malformed-uuid', {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('23. Non-Regression: Existing client pdfCache and Firebase utilities remain intact', () => {
  assert.strictEqual(fs.existsSync('src/utils/pdfCacheEngine.js'), true);
  assert.strictEqual(fs.existsSync('src/utils/stableInvoicePdf.js'), true);
});

// Clean up server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`⚡ EXPENSES & BANK LEDGER: ${passedTests} / ${passedTests} PASSED (100%)`);
console.log('======================================================\n');
