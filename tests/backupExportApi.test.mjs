import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';

console.log('======================================================');
console.log('⚡ RUNNING BILLQYRO BACKUP & EXPORT FOUNDATION API TESTS');
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
  backupJobs: new Map(),
  customers: new Map(),
  products: new Map(),
  invoices: new Map(),
  invoiceItems: new Map(),
  payments: new Map(),
  expenses: new Map(),
  bankLedger: new Map(),
  vendors: new Map(),
  outsourceJobs: new Map()
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

  // 3. Create Backup Job
  if (text.includes('INSERT INTO backup_jobs')) {
    const [wsId, requestedBy] = params;
    const job = {
      id: `j0000000-0000-0000-0000-${String(mockDb.backupJobs.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      requested_by: requestedBy,
      status: 'PROCESSING',
      storage_key: null,
      file_size_bytes: 0,
      content_hash: null,
      created_at: new Date().toISOString()
    };
    mockDb.backupJobs.set(job.id, job);
    return { rows: [job] };
  }

  // 4. Update Job Success
  if (text.includes('UPDATE backup_jobs') && text.includes('SET status = \'READY\'')) {
    const [jobId, storageKey, fileSizeBytes, contentHash] = params;
    const job = mockDb.backupJobs.get(jobId);
    if (job) {
      job.status = 'READY';
      job.storage_key = storageKey;
      job.file_size_bytes = fileSizeBytes;
      job.content_hash = contentHash;
      job.completed_at = new Date().toISOString();
      return { rows: [job] };
    }
    return { rows: [] };
  }

  // 5. Compile workspace snapshot
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

  // 6. Find Backup Job by ID
  if (text.includes('FROM backup_jobs') && text.includes('WHERE id = $1 AND workspace_id = $2')) {
    const [jobId, wsId] = params;
    const job = mockDb.backupJobs.get(jobId);
    if (job && job.workspace_id === wsId) {
      return { rows: [job] };
    }
    return { rows: [] };
  }

  // 7. List Backup Jobs
  if (text.includes('FROM backup_jobs') && text.includes('COUNT(*) OVER() AS full_count')) {
    const wsId = params[0];
    const list = Array.from(mockDb.backupJobs.values()).filter(j => j.workspace_id === wsId);
    return {
      rows: list.map(j => ({ ...j, full_count: list.length }))
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

let aliceJobId = null;

// ============================================================================
// PART 1: EXPORT CREATION & RETRIEVAL
// ============================================================================

await test('1. POST /api/v1/backups/export: Initiates and processes workspace export (201)', async () => {
  const res = await makeRequest('/api/v1/backups/export', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID
    }
  });

  assert.strictEqual(res.status, 201);
  assert.ok(res.body.data.id);
  assert.strictEqual(res.body.data.status, 'READY');
  assert.ok(res.body.data.content_hash);
  assert.ok(res.body.data.storage_key);
  assert.ok(res.body.data.storage_key.startsWith(`backups/${WS_ALICE_ID}/`));
  aliceJobId = res.body.data.id;
});

await test('2. GET /api/v1/backups: Lists workspace backup jobs (200)', async () => {
  const res = await makeRequest(`/api/v1/backups?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 1);
  assert.strictEqual(res.body.data[0].id, aliceJobId);
});

await test('3. GET /api/v1/backups/:id: Returns backup status and download URL (200)', async () => {
  const res = await makeRequest(`/api/v1/backups/${aliceJobId}?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.id, aliceJobId);
  assert.strictEqual(res.body.data.status, 'READY');
  assert.ok(res.body.data.downloadUrl);
});

// ============================================================================
// PART 2: EXPORT CONTENTS & SECRET EXCLUSION
// ============================================================================

await test('4. Export Snapshot: Compiles all entity modules without private secrets', async () => {
  const { BackupRepository } = await import('../backend/src/modules/backups/backupRepository.js');
  const snapshot = await BackupRepository.compileWorkspaceExport(WS_ALICE_ID);

  assert.ok(snapshot.metadata);
  assert.ok(snapshot.workspace);
  assert.ok(Array.isArray(snapshot.customers));
  assert.ok(Array.isArray(snapshot.products));
  assert.ok(Array.isArray(snapshot.invoices));
  assert.ok(Array.isArray(snapshot.invoiceItems));
  assert.ok(Array.isArray(snapshot.payments));
  assert.ok(Array.isArray(snapshot.expenses));
  assert.ok(Array.isArray(snapshot.bankLedger));
  assert.ok(Array.isArray(snapshot.vendors));
  assert.ok(Array.isArray(snapshot.outsourceJobs));

  // Verify secret exclusion
  const snapshotStr = JSON.stringify(snapshot);
  assert.strictEqual(snapshotStr.includes('password_hash'), false);
  assert.strictEqual(snapshotStr.includes('firebase_service_account'), false);
  assert.strictEqual(snapshotStr.includes('minio_dev_secret'), false);
  assert.strictEqual(snapshotStr.includes('dev_secure_password'), false);
});

// ============================================================================
// PART 3: CONCURRENCY & ERROR HANDLING
// ============================================================================

await test('5. Concurrency: Multiple concurrent exports execute cleanly and generate unique job IDs', async () => {
  const p1 = makeRequest('/api/v1/backups/export', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: { workspaceId: WS_ALICE_ID }
  });
  const p2 = makeRequest('/api/v1/backups/export', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: { workspaceId: WS_ALICE_ID }
  });

  const [res1, res2] = await Promise.all([p1, p2]);
  assert.strictEqual(res1.status, 201);
  assert.strictEqual(res2.status, 201);
  assert.notStrictEqual(res1.body.data.id, res2.body.data.id);
});

// ============================================================================
// PART 4: MULTI-TENANT ISOLATION & SECURITY
// ============================================================================

await test('6. Security: Bob cannot view Alice backup jobs (403)', async () => {
  const res = await makeRequest(`/api/v1/backups?workspaceId=${WS_ALICE_ID}`, {
    headers: BOB_AUTH
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

await test('7. Security: Bob cannot get Alice single backup job (403)', async () => {
  const res = await makeRequest(`/api/v1/backups/${aliceJobId}?workspaceId=${WS_ALICE_ID}`, {
    headers: BOB_AUTH
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

await test('8. Security: Alice cannot export Bob workspace (403)', async () => {
  const res = await makeRequest('/api/v1/backups/export', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_BOB_ID
    }
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

await test('9. Security: Unauthenticated export request rejected (401)', async () => {
  const res = await makeRequest('/api/v1/backups/export', {
    method: 'POST',
    body: {
      workspaceId: WS_ALICE_ID
    }
  });

  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error.code, 'AUTH_REQUIRED');
});

await test('10. Security: Malformed UUID parameter rejected cleanly (400)', async () => {
  const res = await makeRequest('/api/v1/backups?workspaceId=invalid-uuid', {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('11. Non-Regression: Existing client-side backup and restore utilities intact', () => {
  assert.strictEqual(fs.existsSync('src/pages/BackupRestore.jsx'), true);
  assert.strictEqual(fs.existsSync('src/pages/studios/BackupStudio.jsx'), true);
});

// Clean up server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`⚡ BACKUP & EXPORT: ${passedTests} / ${passedTests} PASSED (100%)`);
console.log('======================================================\n');

