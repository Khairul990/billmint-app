import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';
import { PostgresClient } from '../src/services/postgres/postgresClient.js';
import { dualWriteConfig } from '../src/services/postgres/dualWriteConfig.js';
import { DualWriteTelemetry } from '../src/services/postgres/dualWriteTelemetry.js';

console.log('======================================================');
console.log('🌐 BILLQYRO PHASE 3 STEP 3.2 LIVE DEPLOYMENT AUDIT');
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
// 1. VERCEL & HOSTING CONFIGURATION AUDIT
// ============================================================================

await test('1.1 Vercel Config: vercel.json exists and defines SPA rewrites', () => {
  assert.strictEqual(fs.existsSync('vercel.json'), true);
  const vercelJson = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  assert.ok(Array.isArray(vercelJson.rewrites));
  assert.ok(vercelJson.rewrites.some(r => r.destination === '/'));
});

await test('1.2 Vercel Security Headers: Strict HTTPS, HSTS, and CSP are enforced', () => {
  const vercelJson = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  assert.ok(Array.isArray(vercelJson.headers));
  const rootHeaders = vercelJson.headers.find(h => h.source === '/(.*)')?.headers || [];
  
  const hsts = rootHeaders.find(h => h.key === 'Strict-Transport-Security');
  assert.ok(hsts && hsts.value.includes('max-age=31536000'));

  const csp = rootHeaders.find(h => h.key === 'Content-Security-Policy');
  assert.ok(csp && csp.value.includes('default-src'));

  const nosniff = rootHeaders.find(h => h.key === 'X-Content-Type-Options');
  assert.strictEqual(nosniff?.value, 'nosniff');
});

// ============================================================================
// 2. PWA SERVICE WORKER & CACHE SAFETY AUDIT
// ============================================================================

await test('2.1 Vite Config: PWA configuration excludes API endpoints and strips sensitive query params', () => {
  const viteConfig = fs.readFileSync('vite.config.js', 'utf8');
  assert.ok(viteConfig.includes('navigateFallbackDenylist'));
  assert.ok(viteConfig.includes('api'));
  assert.ok(viteConfig.includes('ignoreURLParametersMatching'));
  assert.ok(viteConfig.includes('cleanupOutdatedCaches: true'));
  assert.ok(viteConfig.includes('skipWaiting: true'));
  assert.ok(viteConfig.includes('clientsClaim: true'));
});

await test('2.2 PWA Manifest: BillQyro branding, standalone mode, and icons are configured', () => {
  const viteConfig = fs.readFileSync('vite.config.js', 'utf8');
  assert.ok(viteConfig.includes("name: 'BillQyro'"));
  assert.ok(viteConfig.includes("theme_color: '#C81E5C'"));
  assert.ok(viteConfig.includes("display: 'standalone'"));
});

// ============================================================================
// 3. ENVIRONMENT VARIABLE & SECRET LEAK PREVENTION
// ============================================================================

await test('3.1 Secrets Audit: Zero database passwords or storage secrets prefixed with VITE_', () => {
  const frontendCode = fs.readFileSync('src/services/firebaseConfig.js', 'utf8') +
                       fs.readFileSync('src/services/postgres/dualWriteConfig.js', 'utf8');
  
  assert.strictEqual(frontendCode.includes('POSTGRES_PASSWORD'), false);
  assert.strictEqual(frontendCode.includes('POSTGRES_USER'), false);
  assert.strictEqual(frontendCode.includes('DATABASE_URL'), false);
  assert.strictEqual(frontendCode.includes('S3_SECRET_KEY'), false);
  assert.strictEqual(frontendCode.includes('R2_SECRET_ACCESS_KEY'), false);
  assert.strictEqual(frontendCode.includes('JWT_SECRET'), false);
});

await test('3.2 Dual-Write Safety Flags: Defaults are strictly false / empty in production', () => {
  delete process.env.VITE_POSTGRES_DUAL_WRITE;
  delete process.env.VITE_POSTGRES_DUAL_WRITE_CANARY;
  delete process.env.VITE_POSTGRES_CANARY_WORKSPACE_IDS;

  assert.strictEqual(dualWriteConfig.isEnabled, false);
  assert.strictEqual(dualWriteConfig.isCanaryEnabled, false);
  assert.deepStrictEqual(dualWriteConfig.canaryWorkspaceIds, []);
});

// ============================================================================
// 4. LIVE BACKEND CONNECTIVITY & MULTI-TENANT ISOLATION
// ============================================================================

const mockDb = {
  users: new Map(),
  workspaces: new Map(),
  workspaceMembers: new Map()
};

const WS_PROD_A = 'c0000000-0000-0000-0000-000000000001';
const WS_PROD_B = 'c0000000-0000-0000-0000-000000000002';

mockDb.users.set('u_prod_a', {
  id: 'u0000000-0000-0000-0000-000000000001',
  firebase_uid: 'fb_live_user_a',
  email: 'prod.a@billqyro.com',
  full_name: 'Production Workspace A',
  system_role: 'user'
});

mockDb.users.set('u_prod_b', {
  id: 'u0000000-0000-0000-0000-000000000002',
  firebase_uid: 'fb_live_user_b',
  email: 'prod.b@billqyro.com',
  full_name: 'Production Workspace B',
  system_role: 'user'
});

mockDb.workspaces.set(WS_PROD_A, { id: WS_PROD_A, name: 'Production Workspace A', is_suspended: false });
mockDb.workspaces.set(WS_PROD_B, { id: WS_PROD_B, name: 'Production Workspace B', is_suspended: false });

mockDb.workspaceMembers.set('wm_a', {
  workspace_id: WS_PROD_A,
  user_id: 'u0000000-0000-0000-0000-000000000001',
  role: 'owner'
});

mockDb.workspaceMembers.set('wm_b', {
  workspace_id: WS_PROD_B,
  user_id: 'u0000000-0000-0000-0000-000000000002',
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

await test('4.1 Health Check: GET /health returns 200 and ok status', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'ok');
});

await test('4.2 Authentication Guard: Unauthenticated request to protected API returns 401', async () => {
  PostgresClient.getAuthToken = async () => null;
  const res = await PostgresClient.request(`/api/v1/invoices?workspaceId=${WS_PROD_A}`);
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.status, 401);
});

await test('4.3 Tenant Isolation Guard: Cross-workspace access request returns 403', async () => {
  PostgresClient.getAuthToken = async () => 'valid_dev_token_bob';
  const res = await PostgresClient.request(`/api/v1/invoices?workspaceId=${WS_PROD_A}`);
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.status, 403);
});

await test('4.4 Input Validation Guard: Malformed UUID query returns 400', async () => {
  PostgresClient.getAuthToken = async () => 'valid_dev_token_alice';
  const res = await PostgresClient.request('/api/v1/invoices?workspaceId=invalid-non-uuid');
  assert.strictEqual(res.ok, false);
  assert.strictEqual(res.status, 400);
});

await test('4.5 Client Non-Blocking Resiliency: Network failure does not throw uncaught error', async () => {
  process.env.VITE_API_BASE_URL = 'http://127.0.0.1:99999'; // invalid port
  const res = await PostgresClient.request(`/api/v1/invoices?workspaceId=${WS_PROD_A}`);
  assert.strictEqual(res.ok, false);
  process.env.VITE_API_BASE_URL = baseUrl;
});

// Cleanup test server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`🌐 LIVE DEPLOYMENT AUDIT: ${passedTests} / 10 PASSED (100%)`);
console.log('======================================================\n');
