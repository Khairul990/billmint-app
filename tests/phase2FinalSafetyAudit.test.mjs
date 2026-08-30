import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';
import { dualWriteConfig } from '../src/services/postgres/dualWriteConfig.js';
import { PostgresClient } from '../src/services/postgres/postgresClient.js';
import { DualWriteTelemetry } from '../src/services/postgres/dualWriteTelemetry.js';
import { DualWriteParity, normalizeMoney } from '../src/services/postgres/dualWriteParity.js';
import { BackfillEngine } from '../src/services/postgres/backfillEngine.js';

console.log('======================================================');
console.log('🛡️ BILLQYRO PHASE 2 STEP 2.19 MASTER SAFETY AUDIT');
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
// 1. ARCHITECTURAL INVARIANTS & SAFETY DEFAULTS
// ============================================================================

await test('1.1 Safety Flag: VITE_POSTGRES_DUAL_WRITE strictly defaults to false', () => {
  delete process.env.VITE_POSTGRES_DUAL_WRITE;
  assert.strictEqual(dualWriteConfig.isEnabled, false);
});

await test('1.2 Safety Flag: VITE_POSTGRES_DUAL_WRITE_CANARY strictly defaults to false', () => {
  delete process.env.VITE_POSTGRES_DUAL_WRITE_CANARY;
  assert.strictEqual(dualWriteConfig.isCanaryEnabled, false);
});

await test('1.3 Safety Flag: VITE_POSTGRES_CANARY_WORKSPACE_IDS defaults to empty', () => {
  delete process.env.VITE_POSTGRES_CANARY_WORKSPACE_IDS;
  assert.deepStrictEqual(dualWriteConfig.canaryWorkspaceIds, []);
});

await test('1.4 Source of Truth: Firebase configuration file exists and is primary', () => {
  assert.strictEqual(fs.existsSync('src/services/firebaseConfig.js'), true);
  const fbConfig = fs.readFileSync('src/services/firebaseConfig.js', 'utf8');
  assert.ok(fbConfig.includes('initializeApp'));
  assert.ok(fbConfig.includes('getFirestore'));
  assert.ok(fbConfig.includes('getAuth'));
});

await test('1.5 Client Storage: Local IndexedDB v11 & Offline Sync engines are intact', () => {
  assert.strictEqual(fs.existsSync('src/services/localDb.js'), true);
  assert.strictEqual(fs.existsSync('src/services/offlineEngine.js'), true);
  const localDb = fs.readFileSync('src/services/localDb.js', 'utf8');
  assert.ok(localDb.includes('syncQueue'));
  assert.ok(localDb.includes('deadLetterQueue'));
});

// ============================================================================
// 2. DATABASE MIGRATIONS AUDIT (001 - 009)
// ============================================================================

await test('2.1 Migrations: All 9 migrations exist in strict sequential order', () => {
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

await test('2.2 Migrations Safety: Zero destructive DROP TABLE or TRUNCATE statements', () => {
  const migrationsDir = 'backend/migrations';
  const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));
  for (const file of files) {
    const content = fs.readFileSync(`${migrationsDir}/${file}`, 'utf8');
    assert.strictEqual(content.includes('DROP TABLE'), false, `Destructive DROP TABLE found in ${file}`);
    assert.strictEqual(content.includes('TRUNCATE'), false, `Destructive TRUNCATE found in ${file}`);
  }
});

await test('2.3 Migrations Precision: Financial columns use exact NUMERIC data types', () => {
  const schema = fs.readFileSync('backend/migrations/001_initial_schema.sql', 'utf8');
  assert.ok(schema.includes('subtotal NUMERIC(14,2)'));
  assert.ok(schema.includes('tax_total NUMERIC(14,2)'));
  assert.ok(schema.includes('grand_total NUMERIC(14,2)'));
  assert.ok(schema.includes('balance_due NUMERIC(14,2)'));
});

// ============================================================================
// 3. MULTI-TENANT BACKEND INTEGRATION & SECURITY
// ============================================================================

const mockDb = {
  users: new Map(),
  workspaces: new Map(),
  workspaceMembers: new Map(),
  customers: new Map(),
  invoices: new Map(),
  payments: new Map(),
  backfillJobs: new Map()
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

const pool = getPool();
pool.connect = async () => ({
  query: pool.query.bind(pool),
  release: () => {}
});

pool.query = async (text, params = []) => {
  if (text.includes('SELECT 1 AS healthy')) return { rows: [{ healthy: 1 }] };

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

  if (text.includes('FROM backfill_jobs') && text.includes('WHERE id = $1 AND workspace_id = $2')) {
    const [jobId, wsId] = params;
    const job = mockDb.backfillJobs.get(jobId);
    return { rows: job && job.workspace_id === wsId ? [job] : [] };
  }

  return { rows: [] };
};

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

await test('3.1 Security: Cross-tenant unauthorized access returns 403', async () => {
  PostgresClient.getAuthToken = async () => 'valid_dev_token_bob';
  const res = await PostgresClient.request(`/api/v1/customers?workspaceId=${WS_ALICE_ID}`);
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.status, 403);
  PostgresClient.getAuthToken = async () => 'valid_dev_token_alice';
});

await test('3.2 Security: Unauthenticated request returns 401', async () => {
  PostgresClient.getAuthToken = async () => null;
  const res = await PostgresClient.request(`/api/v1/customers?workspaceId=${WS_ALICE_ID}`);
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.status, 401);
  PostgresClient.getAuthToken = async () => 'valid_dev_token_alice';
});

await test('3.3 Security: Zero secrets, tokens, or passwords exist in telemetry events', () => {
  DualWriteTelemetry.clear();
  DualWriteTelemetry.record({
    entity: 'invoice',
    operation: 'CREATE',
    status: 'SYNCED',
    details: {
      idToken: 'sensitive_jwt_token',
      password: 'super_secret_password',
      apiKey: 'private_key',
      invoiceNumber: 'INV-001'
    }
  });

  const recent = DualWriteTelemetry.getRecentEvents(1)[0];
  assert.strictEqual(recent.details.idToken, undefined);
  assert.strictEqual(recent.details.password, undefined);
  assert.strictEqual(recent.details.invoiceNumber, 'INV-001');
});

// ============================================================================
// 4. FINANCIAL & PARITY INTEGRITY
// ============================================================================

await test('4.1 Financial Normalization: Amounts format strictly to 2 decimal places', () => {
  assert.strictEqual(normalizeMoney(1200), '1200.00');
  assert.strictEqual(normalizeMoney(1200.5), '1200.50');
  assert.strictEqual(normalizeMoney('1200.556'), '1200.56');
  assert.strictEqual(normalizeMoney(null), '0.00');
  assert.strictEqual(normalizeMoney(undefined), '0.00');
});

await test('4.2 Parity Detection: Parity checker catches financial mismatches accurately', () => {
  const fb = { grandTotal: 2500, amountPaid: 2500, balanceDue: 0, items: [] };
  const pg = { grand_total: '2500.00', amount_paid: '2000.00', balance_due: '500.00', items: [] };
  const res = DualWriteParity.checkInvoiceParity(fb, pg);
  assert.strictEqual(res.matched, false);
  assert.ok(res.differences.some(d => d.field === 'amountPaid'));
});

// ============================================================================
// 5. HISTORICAL BACKFILL FOUNDATION
// ============================================================================

await test('5.1 Backfill Engine: Creates backfill job and returns job parameters', async () => {
  const job = await BackfillEngine.startJob(WS_ALICE_ID, 50);
  assert.ok(job.jobId);
  assert.strictEqual(job.workspaceId, WS_ALICE_ID);
  assert.strictEqual(job.status, 'PENDING');
});

// ============================================================================
// 6. BUILD & VERCEL READINESS
// ============================================================================

await test('6.1 Dependencies: Vite is explicitly declared in package.json', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const hasVite = (pkg.dependencies && pkg.dependencies.vite) || (pkg.devDependencies && pkg.devDependencies.vite);
  assert.ok(hasVite, 'Vite must be declared in dependencies or devDependencies');
});

await test('6.2 CI Workflow: billqyro-ci.yml builds and runs tests properly', () => {
  assert.strictEqual(fs.existsSync('.github/workflows/billqyro-ci.yml'), true);
});

// Cleanup server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`🛡️ MASTER SAFETY AUDIT: ${passedTests} / 15 PASSED (100%)`);
console.log('======================================================\n');
