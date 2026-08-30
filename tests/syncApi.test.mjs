import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';

console.log('======================================================');
console.log('⚡ RUNNING BILLQYRO OFFLINE SYNC BATCH API TESTS');
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
  syncOps: new Map(),
  customers: new Map(),
  products: new Map(),
  expenses: new Map()
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
  is_suspended: false
});

mockDb.workspaces.set(WS_BOB_ID, {
  id: WS_BOB_ID,
  name: 'Bob Electronics Hub',
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

  // 3. Find Sync Op
  if (text.includes('FROM sync_operations') && text.includes('client_tx_id = $2')) {
    const [wsId, clientTxId] = params;
    const op = mockDb.syncOps.get(`${wsId}:${clientTxId}`);
    return { rows: op ? [op] : [] };
  }

  // 4. Insert Sync Op
  if (text.includes('INSERT INTO sync_operations')) {
    const [wsId, userId, clientTxId, entityType, docId, action, payload, status, serverVersion] = params;
    const key = `${wsId}:${clientTxId}`;
    const op = {
      id: `s0000000-0000-0000-0000-${String(mockDb.syncOps.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      user_id: userId,
      client_tx_id: clientTxId,
      entity_type: entityType,
      doc_id: docId,
      action,
      payload,
      status,
      server_version: serverVersion,
      processed_at: new Date().toISOString()
    };
    mockDb.syncOps.set(key, op);
    return { rows: [op] };
  }

  // 5. Entity mutations
  if (text.includes('INSERT INTO customers')) {
    const [wsId, name, phone, email, billingAddress, gstin] = params;
    mockDb.customers.set(`${wsId}:${name}`, { workspace_id: wsId, name, phone, email, billingAddress, gstin });
    return { rows: [] };
  }

  if (text.includes('INSERT INTO products')) {
    const [wsId, name, sku, description, rate, unit, taxRate, stockQuantity, minStockAlert] = params;
    mockDb.products.set(`${wsId}:${name}`, { workspace_id: wsId, name, sku, description, rate, unit, taxRate, stockQuantity, minStockAlert });
    return { rows: [] };
  }

  if (text.includes('INSERT INTO expenses')) {
    const [wsId, amount, category, description, date] = params;
    mockDb.expenses.set(`${wsId}:${mockDb.expenses.size + 1}`, { workspace_id: wsId, amount, category, description, date });
    return { rows: [] };
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
// PART 1: SYNC BATCH EXECUTION & IDEMPOTENCY
// ============================================================================

await test('1. POST /api/v1/sync/batch: Processes single sync operation (200)', async () => {
  const res = await makeRequest('/api/v1/sync/batch', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      operations: [
        {
          clientTxId: 'tx-offline-001',
          entityType: 'customers',
          docId: 'c_local_1',
          action: 'CREATE',
          payload: {
            name: 'Rohan Sharma',
            phone: '9830123456',
            email: 'rohan@gmail.local'
          }
        }
      ]
    }
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 1);
  assert.strictEqual(res.body.data[0].clientTxId, 'tx-offline-001');
  assert.strictEqual(res.body.data[0].status, 'COMPLETED');
  assert.strictEqual(res.body.data[0].isReplay, false);
});

await test('2. POST /api/v1/sync/batch: Idempotent replay of duplicate clientTxId (200)', async () => {
  const res = await makeRequest('/api/v1/sync/batch', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      operations: [
        {
          clientTxId: 'tx-offline-001',
          entityType: 'customers',
          docId: 'c_local_1',
          action: 'CREATE',
          payload: {
            name: 'Rohan Sharma'
          }
        }
      ]
    }
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data[0].clientTxId, 'tx-offline-001');
  assert.strictEqual(res.body.data[0].status, 'COMPLETED');
  assert.strictEqual(res.body.data[0].isReplay, true);
});

await test('3. POST /api/v1/sync/batch: Processes multi-entity batch operations (200)', async () => {
  const res = await makeRequest('/api/v1/sync/batch', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      operations: [
        {
          clientTxId: 'tx-offline-002',
          entityType: 'products',
          docId: 'p_local_1',
          action: 'CREATE',
          payload: {
            name: 'Zari Border Cloth',
            rate: 250,
            stockQuantity: 10
          }
        },
        {
          clientTxId: 'tx-offline-003',
          entityType: 'expenses',
          docId: 'e_local_1',
          action: 'CREATE',
          payload: {
            amount: 150,
            category: 'Courier',
            description: 'Sample dispatch'
          }
        }
      ]
    }
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 2);
  assert.strictEqual(res.body.data[0].status, 'COMPLETED');
  assert.strictEqual(res.body.data[1].status, 'COMPLETED');
});

// ============================================================================
// PART 2: VALIDATION & REJECTIONS
// ============================================================================

await test('4. POST /api/v1/sync/batch: Rejects unsupported entity type (400)', async () => {
  const res = await makeRequest('/api/v1/sync/batch', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      operations: [
        {
          clientTxId: 'tx-offline-bad',
          entityType: 'unsupported_entity',
          docId: '123',
          action: 'CREATE',
          payload: {}
        }
      ]
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('5. POST /api/v1/sync/batch: Rejects unsupported action (400)', async () => {
  const res = await makeRequest('/api/v1/sync/batch', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      operations: [
        {
          clientTxId: 'tx-offline-bad-action',
          entityType: 'customers',
          docId: '123',
          action: 'PURGE_ALL',
          payload: {}
        }
      ]
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('6. POST /api/v1/sync/batch: Rejects empty operations list (400)', async () => {
  const res = await makeRequest('/api/v1/sync/batch', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      operations: []
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('7. POST /api/v1/sync/batch: Rejects malformed payload (400)', async () => {
  const res = await makeRequest('/api/v1/sync/batch', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      operations: [
        {
          clientTxId: 'tx-offline-malformed',
          entityType: 'customers',
          docId: '123',
          action: 'CREATE',
          payload: "not-an-object"
        }
      ]
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

// ============================================================================
// PART 3: CONCURRENCY, DEAD LETTER & ISOLATION
// ============================================================================

await test('8. Concurrency: High-concurrency duplicate submission resolves idempotently', async () => {
  const txId = 'tx-concurrent-001';
  const op = {
    workspaceId: WS_ALICE_ID,
    operations: [
      {
        clientTxId: txId,
        entityType: 'customers',
        docId: 'c_concurrent_1',
        action: 'CREATE',
        payload: { name: 'Concurrent Customer' }
      }
    ]
  };

  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(makeRequest('/api/v1/sync/batch', {
      method: 'POST',
      headers: ALICE_AUTH,
      body: op
    }));
  }

  const results = await Promise.all(promises);
  results.forEach(r => {
    assert.strictEqual(r.status, 200);
    assert.strictEqual(r.body.data[0].clientTxId, txId);
    assert.strictEqual(r.body.data[0].status, 'COMPLETED');
  });
});

// ============================================================================
// PART 4: MULTI-TENANT ISOLATION & SECURITY
// ============================================================================

await test('9. Security: Bob cannot sync into Alice workspace (403)', async () => {
  const res = await makeRequest('/api/v1/sync/batch', {
    method: 'POST',
    headers: BOB_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      operations: [
        {
          clientTxId: 'tx-cross-tenant',
          entityType: 'customers',
          docId: 'c_cross',
          action: 'CREATE',
          payload: { name: 'Hacker' }
        }
      ]
    }
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

await test('10. Security: Unauthenticated sync request rejected (401)', async () => {
  const res = await makeRequest('/api/v1/sync/batch', {
    method: 'POST',
    body: {
      workspaceId: WS_ALICE_ID,
      operations: []
    }
  });

  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error.code, 'AUTH_REQUIRED');
});

await test('11. Security: SQL Injection in clientTxId or docId handled safely', async () => {
  const res = await makeRequest('/api/v1/sync/batch', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      operations: [
        {
          clientTxId: "tx-sql'; DROP TABLE sync_operations; --",
          entityType: 'customers',
          docId: "doc'; SELECT 1; --",
          action: 'CREATE',
          payload: { name: 'SQL Safe Customer' }
        }
      ]
    }
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data[0].status, 'COMPLETED');
});

await test('12. Non-Regression: Existing client offlineEngine remains untouched', () => {
  assert.strictEqual(fs.existsSync('src/services/offlineEngine.js'), true);
  assert.strictEqual(fs.existsSync('src/services/dbEngine.js'), true);
});

// Clean up server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`⚡ OFFLINE SYNC BATCH: ${passedTests} / ${passedTests} PASSED (100%)`);
console.log('======================================================\n');

