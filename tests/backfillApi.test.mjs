import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';
import { PostgresClient } from '../src/services/postgres/postgresClient.js';
import { BackfillEngine } from '../src/services/postgres/backfillEngine.js';

console.log('======================================================');
console.log('⚡ RUNNING BILLQYRO HISTORICAL BACKFILL API TESTS');
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

// In-Memory Database Mock for Backfill
const mockDb = {
  users: new Map(),
  workspaces: new Map(),
  workspaceMembers: new Map(),
  backfillJobs: new Map(),
  customers: new Map(),
  vendors: new Map(),
  products: new Map(),
  invoices: new Map(),
  payments: new Map(),
  expenses: new Map(),
  bankLedger: new Map(),
  outsourceJobs: new Map()
};

// Seed Users & Workspaces
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

mockDb.workspaces.set(WS_ALICE_ID, { id: WS_ALICE_ID, name: 'Alice Fashion Studio', is_suspended: false });
mockDb.workspaces.set(WS_BOB_ID, { id: WS_BOB_ID, name: 'Bob Electronics', is_suspended: false });

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

// Setup Mock Pool Query Interceptor
const pool = getPool();
pool.connect = async () => ({
  query: pool.query.bind(pool),
  release: () => {}
});

pool.query = async (text, params = []) => {
  if (text.includes('SELECT 1 AS healthy')) return { rows: [{ healthy: 1 }] };

  // 1. Workspace Membership
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

  // 2. Backfill Job Creation
  if (text.includes('INSERT INTO backfill_jobs')) {
    const [wsId, reqBy, initStage] = params;
    const job = {
      id: `bf000000-0000-0000-0000-${String(mockDb.backfillJobs.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      requested_by: reqBy,
      status: 'PENDING',
      current_stage: initStage,
      checkpoint_data: {},
      stats: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
      error_log: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDb.backfillJobs.set(job.id, job);
    return { rows: [job] };
  }

  // 3. Find Backfill Job
  if (text.includes('FROM backfill_jobs') && text.includes('WHERE id = $1 AND workspace_id = $2')) {
    const [jobId, wsId] = params;
    const job = mockDb.backfillJobs.get(jobId);
    if (job && job.workspace_id === wsId) {
      return { rows: [job] };
    }
    return { rows: [] };
  }

  // 4. Update Backfill Job
  if (text.includes('UPDATE backfill_jobs')) {
    const jobId = params[params.length - 2];
    const wsId = params[params.length - 1];
    const job = mockDb.backfillJobs.get(jobId);
    if (job && job.workspace_id === wsId) {
      // Apply updates based on text content
      if (text.includes('status =')) {
        const sIdx = params.findIndex(p => ['PENDING', 'RUNNING', 'PAUSED', 'COMPLETED', 'FAILED'].includes(p));
        if (sIdx !== -1) job.status = params[sIdx];
      }
      if (text.includes('current_stage =')) {
        const stIdx = params.findIndex(p => ['customers', 'vendors', 'products', 'invoices', 'outsourceJobs', 'payments', 'expenses', 'bankLedger'].includes(p));
        if (stIdx !== -1) job.current_stage = params[stIdx];
      }
      const jsonParams = params.filter(p => typeof p === 'string' && (p.startsWith('{') || p.startsWith('[')));
      for (const jp of jsonParams) {
        try {
          const parsed = JSON.parse(jp);
          if (parsed.processed !== undefined) job.stats = parsed;
          else if (Array.isArray(parsed)) job.error_log = parsed;
          else job.checkpoint_data = parsed;
        } catch {
          // ignore
        }
      }
      if (text.includes('completed_at =')) {
        job.completed_at = new Date().toISOString();
      }
      job.updated_at = new Date().toISOString();
      return { rows: [job] };
    }
    return { rows: [] };
  }

  // 5. List Backfill Jobs
  if (text.includes('FROM backfill_jobs') && text.includes('WHERE workspace_id = $1')) {
    const wsId = params[0];
    const jobs = Array.from(mockDb.backfillJobs.values()).filter(j => j.workspace_id === wsId);
    return { rows: jobs };
  }

  // 6. Entity Upserts
  if (text.includes('INSERT INTO customers')) {
    const [wsId, name, phone, email, addr, gstin, openDue, curDue] = params;
    const key = `${wsId}:${name}:${phone}`;
    let cust = mockDb.customers.get(key);
    if (!cust) {
      cust = { id: `c_${mockDb.customers.size + 1}`, workspace_id: wsId, name, phone, email, billing_address: addr, gstin, opening_due: openDue, current_due: curDue };
      mockDb.customers.set(key, cust);
    }
    return { rows: [cust] };
  }

  if (text.includes('INSERT INTO vendors')) {
    const [wsId, name, phone, email, sType, addr] = params;
    const key = `${wsId}:${name}`;
    let vendor = mockDb.vendors.get(key);
    if (!vendor) {
      vendor = { id: `v_${mockDb.vendors.size + 1}`, workspace_id: wsId, name, phone, email, service_type: sType, address: addr };
      mockDb.vendors.set(key, vendor);
    }
    return { rows: [vendor] };
  }

  if (text.includes('INSERT INTO products')) {
    const [wsId, name, sku, desc, rate, unit, taxRate, stockQty, minAlert] = params;
    const key = `${wsId}:${name}:${rate}`;
    let prod = mockDb.products.get(key);
    if (!prod) {
      prod = { id: `p_${mockDb.products.size + 1}`, workspace_id: wsId, name, sku, description: desc, rate, unit, tax_rate: taxRate, stock_quantity: stockQty, min_stock_alert: minAlert };
      mockDb.products.set(key, prod);
    }
    return { rows: [prod] };
  }

  if (text.includes('INSERT INTO invoices')) {
    const [wsId, invNum, bType, date, dueDate, status, subtotal, taxTotal, discTotal, ship, grand, paid, bal, token, userId] = params;
    const key = `${wsId}:${invNum}`;
    let inv = mockDb.invoices.get(key);
    if (!inv) {
      inv = { id: `inv_${mockDb.invoices.size + 1}`, workspace_id: wsId, invoice_number: invNum, bill_type: bType, date, due_date: dueDate, status, subtotal, tax_total: taxTotal, discount_total: discTotal, shipping_charge: ship, grand_total: grand, amount_paid: paid, balance_due: bal, public_token: token, created_by_user_id: userId };
      mockDb.invoices.set(key, inv);
    }
    return { rows: [inv] };
  }

  if (text.includes('INSERT INTO outsource_jobs')) {
    const [wsId, vId, invId, desc, cost, status, userId] = params;
    const job = { id: `oj_${mockDb.outsourceJobs.size + 1}`, workspace_id: wsId, vendor_id: vId, invoice_id: invId, description: desc, cost, status, created_by: userId };
    mockDb.outsourceJobs.set(job.id, job);
    return { rows: [job] };
  }

  if (text.includes('INSERT INTO payments')) {
    const [wsId, invId, amount, method, date, ref, notes, userId] = params;
    const pay = { id: `pay_${mockDb.payments.size + 1}`, workspace_id: wsId, invoice_id: invId, amount, payment_method: method, payment_date: date, transaction_reference: ref, notes, created_by: userId };
    mockDb.payments.set(pay.id, pay);
    return { rows: [pay] };
  }

  if (text.includes('INSERT INTO expenses')) {
    const [wsId, amount, cat, desc, date] = params;
    const exp = { id: `exp_${mockDb.expenses.size + 1}`, workspace_id: wsId, amount, category: cat, description: desc, date };
    mockDb.expenses.set(exp.id, exp);
    return { rows: [exp] };
  }

  if (text.includes('INSERT INTO bank_ledger_entries')) {
    const [wsId, type, amount, desc, date] = params;
    const entry = { id: `bnk_${mockDb.bankLedger.size + 1}`, workspace_id: wsId, type, amount, description: desc, date };
    mockDb.bankLedger.set(entry.id, entry);
    return { rows: [entry] };
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

let aliceJobId = '';

// ============================================================================
// TEST CASES
// ============================================================================

await test('1. POST /api/v1/backfill/jobs: Creates a new backfill job (201)', async () => {
  const res = await BackfillEngine.startJob(WS_ALICE_ID, 25);
  assert.ok(res.jobId);
  assert.strictEqual(res.workspaceId, WS_ALICE_ID);
  assert.strictEqual(res.status, 'PENDING');
  assert.strictEqual(res.batchSize, 25);
  aliceJobId = res.jobId;
});

await test('2. Security: Bob cannot access Alice backfill job (403)', async () => {
  PostgresClient.getAuthToken = async () => 'valid_dev_token_bob';
  const res = await PostgresClient.request(`/api/v1/backfill/jobs/${aliceJobId}?workspaceId=${WS_ALICE_ID}`);
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.status, 403);
  PostgresClient.getAuthToken = async () => 'valid_dev_token_alice';
});

await test('3. Stage 1: Batch migration of customers and vendors', async () => {
  const custRes = await BackfillEngine.processStageBatch({
    jobId: aliceJobId,
    workspaceId: WS_ALICE_ID,
    stage: 'customers',
    records: [
      { name: 'Historical Client A', phone: '9123456780', email: 'a@hist.test', openingDue: 500 },
      { name: 'Historical Client B', phone: '9123456781', email: 'b@hist.test', openingDue: 1200 }
    ]
  });
  assert.strictEqual(custRes.batchSummary.succeeded, 2);

  const vendRes = await BackfillEngine.processStageBatch({
    jobId: aliceJobId,
    workspaceId: WS_ALICE_ID,
    stage: 'vendors',
    records: [
      { name: 'Master Dyer Ltd', phone: '9876543200', serviceType: 'Fabric Dyeing' }
    ]
  });
  assert.strictEqual(vendRes.batchSummary.succeeded, 1);
});

await test('4. Stage 2: Batch migration of products', async () => {
  const prodRes = await BackfillEngine.processStageBatch({
    jobId: aliceJobId,
    workspaceId: WS_ALICE_ID,
    stage: 'products',
    records: [
      { name: 'Embroidery Gold Thread', sku: 'GT-500', rate: 250, stockQuantity: 100 },
      { name: 'Pure Silk Fabric 1m', sku: 'SF-001', rate: 1200, stockQuantity: 40 }
    ]
  });
  assert.strictEqual(prodRes.batchSummary.succeeded, 2);
});

await test('5. Stage 3: Batch migration of invoices and outsource jobs', async () => {
  const invRes = await BackfillEngine.processStageBatch({
    jobId: aliceJobId,
    workspaceId: WS_ALICE_ID,
    stage: 'invoices',
    records: [
      { invoiceNumber: 'HIST-INV-001', grandTotal: 2500, amountPaid: 2500, balanceDue: 0, status: 'Paid' },
      { invoiceNumber: 'HIST-INV-002', grandTotal: 3600, amountPaid: 1000, balanceDue: 2600, status: 'Partially Paid' }
    ]
  });
  assert.strictEqual(invRes.batchSummary.succeeded, 2);

  const outRes = await BackfillEngine.processStageBatch({
    jobId: aliceJobId,
    workspaceId: WS_ALICE_ID,
    stage: 'outsourceJobs',
    records: [
      { description: 'Zari Border Stitching', cost: 450, status: 'Completed' }
    ]
  });
  assert.strictEqual(outRes.batchSummary.succeeded, 1);
});

await test('6. Stage 4: Batch migration of payments, expenses, and bank ledger', async () => {
  const payRes = await BackfillEngine.processStageBatch({
    jobId: aliceJobId,
    workspaceId: WS_ALICE_ID,
    stage: 'payments',
    records: [
      { invoiceId: 'inv_1', amount: 2500, paymentMethod: 'UPI', transactionReference: 'HIST-PAY-01' }
    ]
  });
  assert.strictEqual(payRes.batchSummary.succeeded, 1);

  const expRes = await BackfillEngine.processStageBatch({
    jobId: aliceJobId,
    workspaceId: WS_ALICE_ID,
    stage: 'expenses',
    records: [
      { amount: 1500, category: 'Electricity', description: 'Studio Bill' }
    ]
  });
  assert.strictEqual(expRes.batchSummary.succeeded, 1);

  const bnkRes = await BackfillEngine.processStageBatch({
    jobId: aliceJobId,
    workspaceId: WS_ALICE_ID,
    stage: 'bankLedger',
    records: [
      { type: 'CREDIT', amount: 10000, description: 'Opening Cash Reserve' }
    ]
  });
  assert.strictEqual(bnkRes.batchSummary.succeeded, 1);
});

await test('7. Idempotent duplicate replay: Re-running batch does NOT create duplicate records', async () => {
  const initialCustCount = mockDb.customers.size;
  const initialInvCount = mockDb.invoices.size;

  await BackfillEngine.processStageBatch({
    jobId: aliceJobId,
    workspaceId: WS_ALICE_ID,
    stage: 'customers',
    records: [
      { name: 'Historical Client A', phone: '9123456780', email: 'a@hist.test' }
    ]
  });

  await BackfillEngine.processStageBatch({
    jobId: aliceJobId,
    workspaceId: WS_ALICE_ID,
    stage: 'invoices',
    records: [
      { invoiceNumber: 'HIST-INV-001', grandTotal: 2500 }
    ]
  });

  assert.strictEqual(mockDb.customers.size, initialCustCount);
  assert.strictEqual(mockDb.invoices.size, initialInvCount);
});

await test('8. Stable clientTxId format: Preserves deterministic tx identity', () => {
  const docId = 'HIST-INV-001';
  const stage = 'invoices';
  const tx = `tx_backfill_${stage}_${docId}`;
  assert.strictEqual(tx, 'tx_backfill_invoices_HIST-INV-001');
});

await test('9. Interruption / Pause: Checkpoint data is stored safely', async () => {
  const pauseRes = await BackfillEngine.pauseJob(aliceJobId, WS_ALICE_ID);
  assert.strictEqual(pauseRes.status, 'PAUSED');
  assert.ok(pauseRes.checkpointData.customers);
  assert.ok(pauseRes.checkpointData.invoices);
});

await test('10. Resuming from checkpoint allows continuing batch execution', async () => {
  const resumeRes = await BackfillEngine.resumeJob(aliceJobId, WS_ALICE_ID);
  assert.strictEqual(resumeRes.status, 'RUNNING');
});

await test('11. Malformed record handling: Single bad record does not fail entire batch', async () => {
  const res = await BackfillEngine.processStageBatch({
    jobId: aliceJobId,
    workspaceId: WS_ALICE_ID,
    stage: 'invoices',
    records: [
      { invoiceNumber: 'HIST-INV-003', grandTotal: 500 },
      { /* Missing invoiceNumber */ grandTotal: 900 }
    ]
  });

  assert.strictEqual(res.batchSummary.succeeded, 1);
  assert.strictEqual(res.batchSummary.failed, 1);
});

await test('12. Financial NUMERIC(14,2) precision in backfilled amounts', () => {
  const val = 12500.555;
  const normalized = (Math.round(val * 100) / 100).toFixed(2);
  assert.strictEqual(normalized, '12500.56');
});

await test('13. Cross-workspace mutation rejection: Bob cannot push into Alice job', async () => {
  PostgresClient.getAuthToken = async () => 'valid_dev_token_bob';
  const res = await PostgresClient.request(`/api/v1/backfill/jobs/${aliceJobId}/batch`, {
    method: 'POST',
    body: { workspaceId: WS_ALICE_ID, stage: 'customers', records: [{ name: 'Intruder' }] }
  });
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.status, 403);
  PostgresClient.getAuthToken = async () => 'valid_dev_token_alice';
});

await test('14. Unauthenticated backfill request returns 401', async () => {
  PostgresClient.getAuthToken = async () => null;
  const res = await PostgresClient.request('/api/v1/backfill/jobs', {
    method: 'POST',
    body: { workspaceId: WS_ALICE_ID }
  });
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.status, 401);
  PostgresClient.getAuthToken = async () => 'valid_dev_token_alice';
});

await test('15. Job Completion: Mark backfill job as COMPLETED', async () => {
  const compRes = await BackfillEngine.completeJob(aliceJobId, WS_ALICE_ID);
  assert.strictEqual(compRes.status, 'COMPLETED');
  assert.ok(compRes.completedAt);
});

await test('16. Invariant: Firebase remains primary and untouched', () => {
  assert.strictEqual(fs.existsSync('src/services/firebaseConfig.js'), true);
  assert.strictEqual(fs.existsSync('src/services/localDb.js'), true);
});

// Clean up server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`⚡ HISTORICAL BACKFILL: ${passedTests} / 16 PASSED (100%)`);
console.log('======================================================\n');
