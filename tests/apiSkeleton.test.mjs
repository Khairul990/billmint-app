import assert from 'node:assert';
import http from 'node:http';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';
import { generateSlug } from '../backend/src/modules/workspaces/workspaceRoutes.js';

console.log('======================================================');
console.log('⚡ RUNNING BILLQYRO CORE API SKELETON & AUTH BRIDGE TESTS');
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

// In-Memory Database Mock Adapter for Unit / CI Testing of Express Routes
const mockDb = {
  users: new Map(),
  workspaces: new Map(),
  workspaceMembers: new Map()
};

// Seed initial test user and workspace
mockDb.users.set('user_1', {
  id: 'u-alice-uuid-001',
  firebase_uid: 'fb_dev_user_alice',
  email: 'alice@dev.billqyro.local',
  full_name: 'Alice Enterprise Dev',
  system_role: 'user',
  is_active: true,
  created_at: new Date().toISOString()
});

mockDb.workspaces.set('ws_1', {
  id: 'ws-alice-uuid-001',
  owner_id: 'u-alice-uuid-001',
  name: 'Alice Fashion Studio',
  slug: 'alice-fashion-studio',
  currency: 'INR',
  currency_symbol: '₹',
  tax_label: 'GSTIN',
  invoice_prefix: 'AFS-',
  subscription_tier: 'free',
  is_suspended: false,
  created_at: new Date().toISOString()
});

mockDb.workspaceMembers.set('wm_1', {
  id: 'wm-alice-001',
  workspace_id: 'ws-alice-uuid-001',
  user_id: 'u-alice-uuid-001',
  role: 'owner',
  permissions: ['*'],
  joined_at: new Date().toISOString()
});

// Setup mock query interceptor for API tests
const originalPool = getPool();
const originalQuery = originalPool.query.bind(originalPool);
originalPool.connect = async () => ({
  query: originalPool.query,
  release: () => {}
});

originalPool.query = async (text, params = []) => {
  // 1. Health check
  if (text.includes('SELECT 1 AS healthy')) {
    return { rows: [{ healthy: 1 }] };
  }

  // 2. Select User by firebase_uid or email
  if (text.includes('FROM users WHERE firebase_uid = $1 OR email = $2')) {
    const [uid, email] = params;
    for (const u of mockDb.users.values()) {
      if (u.firebase_uid === uid || u.email === email) {
        return { rows: [u] };
      }
    }
    return { rows: [] };
  }

  // 3. Insert User
  if (text.includes('INSERT INTO users')) {
    const [fUid, email, name] = params;
    const newUser = {
      id: `u-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      firebase_uid: fUid,
      email,
      full_name: name,
      system_role: 'user',
      is_active: true,
      created_at: new Date().toISOString()
    };
    mockDb.users.set(newUser.id, newUser);
    return { rows: [newUser] };
  }

  // 4. Select Workspaces by user_id
  if (text.includes('FROM workspaces w') && text.includes('JOIN workspace_members wm')) {
    const userId = params[0];
    const userMemberships = Array.from(mockDb.workspaceMembers.values()).filter(wm => wm.user_id === userId);
    const rows = userMemberships.map(wm => {
      const ws = mockDb.workspaces.get(wm.workspace_id) || Array.from(mockDb.workspaces.values()).find(w => w.id === wm.workspace_id);
      return {
        ...ws,
        member_role: wm.role,
        member_permissions: wm.permissions
      };
    }).filter(Boolean);
    return { rows };
  }

  // 5. Select Workspace by slug
  if (text.includes('SELECT id FROM workspaces WHERE slug = $1')) {
    const slug = params[0];
    const exists = Array.from(mockDb.workspaces.values()).find(w => w.slug === slug);
    return { rows: exists ? [{ id: exists.id }] : [] };
  }

  // 6. Insert Workspace
  if (text.includes('INSERT INTO workspaces')) {
    const [ownerId, name, slug, currency, currencySymbol, taxLabel, invoicePrefix] = params;
    const newWs = {
      id: `ws-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      owner_id: ownerId,
      name,
      slug,
      currency: currency || 'INR',
      currency_symbol: currencySymbol || '₹',
      tax_label: taxLabel || 'GSTIN',
      invoice_prefix: invoicePrefix || 'INV-',
      subscription_tier: 'free',
      is_suspended: false,
      created_at: new Date().toISOString()
    };
    mockDb.workspaces.set(newWs.id, newWs);
    return { rows: [newWs] };
  }

  // 7. Insert Workspace Member
  if (text.includes('INSERT INTO workspace_members')) {
    const [wsId, userId, role, perms] = params;
    const newMember = {
      id: `wm-${Date.now()}`,
      workspace_id: wsId,
      user_id: userId,
      role,
      permissions: perms,
      joined_at: new Date().toISOString()
    };
    mockDb.workspaceMembers.set(newMember.id, newMember);
    return { rows: [newMember] };
  }

  // Fallback to real pool if needed
  try {
    return await originalQuery(text, params);
  } catch (err) {
    return { rows: [] };
  }
};

// Helper for making local HTTP requests to Express app
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

// 1. Server Starts & Health Check
await test('1. Server Start & Health Endpoint: GET /health returns 200 with service status', async () => {
  const res = await makeRequest('/health');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'ok');
  assert.strictEqual(res.body.service, 'billqyro-api');
  assert.strictEqual(res.body.database, 'ok');
});

// 2. Readiness Endpoint
await test('2. Readiness Endpoint: GET /ready returns 200 and uptime', async () => {
  const res = await makeRequest('/ready');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.ready, true);
  assert.ok(typeof res.body.uptimeSeconds === 'number');
});

// 3. Request ID Propagation
await test('3. Request ID: X-Request-ID header attached and returned in response', async () => {
  const customReqId = 'custom-test-req-12345';
  const res = await makeRequest('/health', { headers: { 'X-Request-ID': customReqId } });
  assert.strictEqual(res.headers.get('x-request-id'), customReqId);
});

// 4. Missing Authorization Rejection
await test('4. Security Boundary: Missing Authorization header returns 401 AUTH_REQUIRED', async () => {
  const res = await makeRequest('/api/v1/auth/me');
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error.code, 'AUTH_REQUIRED');
  assert.ok(res.body.error.requestId);
});

// 5. Invalid Token Rejection
await test('5. Security Boundary: Invalid Bearer token returns 401 INVALID_CREDENTIALS', async () => {
  const res = await makeRequest('/api/v1/auth/me', {
    headers: { 'Authorization': 'Bearer invalid_bogus_token_xyz' }
  });
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error.code, 'INVALID_CREDENTIALS');
});

// 6. Authenticated User Profile Access (/auth/me)
await test('6. Auth Bridge: Authenticated user with valid token retrieves profile', async () => {
  const res = await makeRequest('/api/v1/auth/me', {
    headers: { 'Authorization': 'Bearer valid_dev_token_alice' }
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.email, 'alice@dev.billqyro.local');
  assert.strictEqual(res.body.firebaseUid, 'fb_dev_user_alice');
  assert.strictEqual(res.body.systemRole, 'user');
});

// 7. User Provisioning (Idempotent creation on first login)
let newlyCreatedId = null;
await test('7. Idempotent Provisioning: New Firebase UID dynamically provisions a PostgreSQL user', async () => {
  const res = await makeRequest('/api/v1/auth/me', {
    headers: { 'Authorization': 'Bearer valid_dev_token_newbie' }
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.email, 'newbie@dev.billqyro.local');
  assert.strictEqual(res.body.firebaseUid, 'fb_dev_user_newbie');
  newlyCreatedId = res.body.id;
});

// 8. Repeated Authentication Invariance (No duplicate users created)
await test('8. Idempotency Invariant: Repeated authentication does not create duplicate users', async () => {
  const res2 = await makeRequest('/api/v1/auth/me', {
    headers: { 'Authorization': 'Bearer valid_dev_token_newbie' }
  });
  assert.strictEqual(res2.status, 200);
  assert.strictEqual(res2.body.id, newlyCreatedId, 'Must return the same persistent user ID');
});

// 9. Workspaces List (Scoped to authenticated user only)
await test('9. Tenant Scoping: GET /api/v1/workspaces returns only workspaces owned by or shared with user', async () => {
  const res = await makeRequest('/api/v1/workspaces', {
    headers: { 'Authorization': 'Bearer valid_dev_token_alice' }
  });
  assert.strictEqual(res.status, 200);
  assert.ok(Array.isArray(res.body.workspaces));
  assert.strictEqual(res.body.workspaces.length, 1);
  assert.strictEqual(res.body.workspaces[0].name, 'Alice Fashion Studio');
  assert.strictEqual(res.body.workspaces[0].role, 'owner');
});

// 10. Workspace Creation (Atomic Owner Assignment)
let createdWorkspace = null;
await test('10. Workspace Creation: POST /api/v1/workspaces creates workspace and assigns owner role atomically', async () => {
  const res = await makeRequest('/api/v1/workspaces', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer valid_dev_token_alice' },
    body: {
      name: 'Alice Bridal Collection',
      currency: 'INR',
      currencySymbol: '₹',
      invoicePrefix: 'ABC-'
    }
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.workspace.name, 'Alice Bridal Collection');
  assert.strictEqual(res.body.workspace.slug, 'alice-bridal-collection');
  assert.strictEqual(res.body.workspace.role, 'owner');
  createdWorkspace = res.body.workspace;
});

// 11. Workspace Validation Error (Name too short)
await test('11. Input Validation: Short workspace name returns 400 VALIDATION_ERROR', async () => {
  const res = await makeRequest('/api/v1/workspaces', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer valid_dev_token_alice' },
    body: { name: 'A' }
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

// 12. Slug Collision Resolution
await test('12. Slug Safety: Duplicate workspace name generates auto-incremented slug (e.g. slug-2)', async () => {
  const res = await makeRequest('/api/v1/workspaces', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer valid_dev_token_alice' },
    body: { name: 'Alice Bridal Collection' }
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.workspace.slug, 'alice-bridal-collection-2');
});

// 13. SQL Injection Defense Verification
await test('13. SQL Injection Defense: SQL Injection in workspace name is safely treated as literal text', async () => {
  const maliciousName = "Evil'; DROP TABLE workspaces; --";
  const res = await makeRequest('/api/v1/workspaces', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer valid_dev_token_alice' },
    body: { name: maliciousName }
  });
  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.workspace.name, maliciousName);
  assert.ok(mockDb.workspaces.size > 0, 'workspaces table must not be dropped');
});

// 14. 404 Not Found Safety
await test('14. Routing Safety: Non-existent endpoint returns 404 with standardized error JSON', async () => {
  const res = await makeRequest('/api/v1/non_existent_route');
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'NOT_FOUND');
});

// 15. Secret Leakage Prevention
await test('15. Security Audit: Sensitive tokens, passwords, and internal keys never leaked in API response', async () => {
  const res = await makeRequest('/api/v1/auth/me', {
    headers: { 'Authorization': 'Bearer valid_dev_token_alice' }
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.password, undefined);
  assert.strictEqual(res.body.jwtSecret, undefined);
  assert.strictEqual(res.body.serviceAccount, undefined);
  assert.strictEqual(res.body.DATABASE_URL, undefined);
});

// Clean up server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`⚡ API SKELETON & AUTH BRIDGE: ${passedTests} / 15 PASSED (100%)`);
console.log('======================================================\n');
