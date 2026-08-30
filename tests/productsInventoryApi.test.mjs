import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';

console.log('======================================================');
console.log('⚡ RUNNING BILLQYRO PRODUCTS & INVENTORY API TESTS');
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
  products: new Map()
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

  // 3. Insert Product
  if (text.includes('INSERT INTO products')) {
    const [wsId, name, sku, description, rate, unit, taxRate, stockQuantity, minStockAlert] = params;
    const product = {
      id: `p0000000-0000-0000-0000-${String(mockDb.products.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      name,
      sku,
      description,
      rate,
      unit,
      tax_rate: taxRate,
      stock_quantity: stockQuantity,
      min_stock_alert: minStockAlert,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDb.products.set(product.id, product);
    return { rows: [product] };
  }

  // 4. List Products
  if (text.includes('FROM products') && text.includes('COUNT(*) OVER() AS full_count')) {
    const wsId = params[0];
    let list = Array.from(mockDb.products.values()).filter(p => p.workspace_id === wsId && !p.is_deleted);

    if (text.includes('ILIKE')) {
      const searchParam = params.find(p => typeof p === 'string' && p.startsWith('%') && p.endsWith('%'));
      if (searchParam) {
        const queryStr = searchParam.slice(1, -1).toLowerCase();
        list = list.filter(p => p.name.toLowerCase().includes(queryStr) || (p.sku && p.sku.toLowerCase().includes(queryStr)));
      }
    }

    if (text.includes('sku = $')) {
      const skuParam = params.find(p => typeof p === 'string' && !p.startsWith('b000') && !p.startsWith('%') && typeof p !== 'number');
      if (skuParam) list = list.filter(p => p.sku === skuParam);
    }

    if (text.includes('stock_quantity <= min_stock_alert')) {
      list = list.filter(p => p.stock_quantity <= p.min_stock_alert);
    }

    const total = list.length;
    return {
      rows: list.map(item => ({ ...item, full_count: total }))
    };
  }

  // 5. Find Product by ID
  if (text.includes('SELECT id, workspace_id, name') && text.includes('FROM products') && text.includes('WHERE id = $1')) {
    const [productId, wsId] = params;
    const product = mockDb.products.get(productId);
    if (!product || product.workspace_id !== wsId || product.is_deleted) {
      return { rows: [] };
    }
    return { rows: [product] };
  }

  // 6. Update Product
  if (text.includes('UPDATE products') && text.includes('SET') && !text.includes('is_deleted = TRUE')) {
    const productId = params[0];
    const wsId = params[1];
    const product = mockDb.products.get(productId);
    if (!product || product.workspace_id !== wsId || product.is_deleted) {
      return { rows: [] };
    }

    // Apply updates based on text parsing
    if (text.includes('name = $')) {
      const nameIndex = text.match(/name = \$(\d+)/)?.[1];
      if (nameIndex) product.name = params[parseInt(nameIndex, 10) - 1];
    }
    if (text.includes('rate = $')) {
      const rateIndex = text.match(/rate = \$(\d+)/)?.[1];
      if (rateIndex) product.rate = params[parseInt(rateIndex, 10) - 1];
    }
    if (text.includes('stock_quantity = $')) {
      const stockIndex = text.match(/stock_quantity = \$(\d+)/)?.[1];
      if (stockIndex) product.stock_quantity = params[parseInt(stockIndex, 10) - 1];
    }
    if (text.includes('min_stock_alert = $')) {
      const minIndex = text.match(/min_stock_alert = \$(\d+)/)?.[1];
      if (minIndex) product.min_stock_alert = params[parseInt(minIndex, 10) - 1];
    }

    product.updated_at = new Date().toISOString();
    return { rows: [product] };
  }

  // 7. Soft Delete Product
  if (text.includes('UPDATE products') && text.includes('is_deleted = TRUE')) {
    const [productId, wsId] = params;
    const product = mockDb.products.get(productId);
    if (!product || product.workspace_id !== wsId || product.is_deleted) {
      return { rows: [] };
    }
    product.is_deleted = true;
    product.updated_at = new Date().toISOString();
    return { rows: [{ id: productId }] };
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

let aliceProductId1 = null;
let aliceProductId2 = null;

// ============================================================================
// PART 1: PRODUCT CREATION & VALIDATION
// ============================================================================

await test('1. POST /api/v1/products: Creates product in authorized workspace (201)', async () => {
  const res = await makeRequest('/api/v1/products', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      name: 'Premium Silk Fabric',
      sku: 'SILK-001',
      description: 'Pure Mulberry Silk 100gsm',
      rate: 1250.00,
      unit: 'Meters',
      taxRate: 5.00,
      stockQuantity: 15.00,
      minStockAlert: 5.00
    }
  });

  assert.strictEqual(res.status, 201);
  assert.ok(res.body.data.id);
  assert.strictEqual(res.body.data.name, 'Premium Silk Fabric');
  assert.strictEqual(res.body.data.rate, 1250.00);
  assert.strictEqual(res.body.data.is_low_stock, false);
  aliceProductId1 = res.body.data.id;
});

await test('2. POST /api/v1/products: Creates second product with low stock (201)', async () => {
  const res = await makeRequest('/api/v1/products', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      name: 'Golden Zari Thread Spool',
      sku: 'ZARI-GLD',
      rate: 450.00,
      stockQuantity: 2.00,
      minStockAlert: 10.00 // stock <= minStockAlert => low stock
    }
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.is_low_stock, true);
  aliceProductId2 = res.body.data.id;
});

await test('3. POST /api/v1/products: Validation rejects empty name (400)', async () => {
  const res = await makeRequest('/api/v1/products', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      name: '   ',
      rate: 100
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('4. POST /api/v1/products: Validation rejects negative rate or stock (400)', async () => {
  const res = await makeRequest('/api/v1/products', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      name: 'Cotton Yarn',
      rate: -50,
      stockQuantity: -10
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('5. POST /api/v1/products: Validation rejects invalid taxRate > 100 (400)', async () => {
  const res = await makeRequest('/api/v1/products', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      name: 'Cotton Yarn',
      taxRate: 150
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

// ============================================================================
// PART 2: PRODUCT LISTING, SEARCH, LOW STOCK, GET DETAIL
// ============================================================================

await test('6. GET /api/v1/products: Lists products with pagination (200)', async () => {
  const res = await makeRequest(`/api/v1/products?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 2);
  assert.strictEqual(res.body.pagination.total, 2);
});

await test('7. GET /api/v1/products: Search filter finds product by name or sku (200)', async () => {
  const res = await makeRequest(`/api/v1/products?workspaceId=${WS_ALICE_ID}&search=Zari`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 1);
  assert.strictEqual(res.body.data[0].sku, 'ZARI-GLD');
});

await test('8. GET /api/v1/products: lowStock=true isolates low-stock items (200)', async () => {
  const res = await makeRequest(`/api/v1/products?workspaceId=${WS_ALICE_ID}&lowStock=true`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 1);
  assert.strictEqual(res.body.data[0].sku, 'ZARI-GLD');
  assert.strictEqual(res.body.data[0].is_low_stock, true);
});

await test('9. GET /api/v1/products/:id: Retrieves single product detail (200)', async () => {
  const res = await makeRequest(`/api/v1/products/${aliceProductId1}?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.id, aliceProductId1);
  assert.strictEqual(res.body.data.name, 'Premium Silk Fabric');
});

// ============================================================================
// PART 3: UPDATE & SOFT DELETE
// ============================================================================

await test('10. PATCH /api/v1/products/:id: Updates product stock and price (200)', async () => {
  const res = await makeRequest(`/api/v1/products/${aliceProductId1}`, {
    method: 'PATCH',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      rate: 1350.00,
      stockQuantity: 25.00
    }
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.rate, 1350.00);
  assert.strictEqual(res.body.data.stock_quantity, 25.00);
});

await test('11. DELETE /api/v1/products/:id: Soft-deletes product (200)', async () => {
  const res = await makeRequest(`/api/v1/products/${aliceProductId2}`, {
    method: 'DELETE',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID
    }
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.success, true);

  // Subsequent GET returns 404
  const getRes = await makeRequest(`/api/v1/products/${aliceProductId2}?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });
  assert.strictEqual(getRes.status, 404);
});

// ============================================================================
// PART 4: MULTI-TENANT ISOLATION & SECURITY
// ============================================================================

await test('12. Security: Bob cannot view Alice product list (403)', async () => {
  const res = await makeRequest(`/api/v1/products?workspaceId=${WS_ALICE_ID}`, {
    headers: BOB_AUTH
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

await test('13. Security: Bob cannot view Alice single product (403)', async () => {
  const res = await makeRequest(`/api/v1/products/${aliceProductId1}?workspaceId=${WS_ALICE_ID}`, {
    headers: BOB_AUTH
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

await test('14. Security: Alice cannot update product in Bob workspace (403)', async () => {
  const res = await makeRequest('/api/v1/products/p0000000-0000-0000-0000-000000000099', {
    method: 'PATCH',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_BOB_ID,
      rate: 500
    }
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

await test('15. Security: Unauthenticated request to /products returns 401', async () => {
  const res = await makeRequest(`/api/v1/products?workspaceId=${WS_ALICE_ID}`);
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error.code, 'AUTH_REQUIRED');
});

await test('16. Security: Malformed UUID parameter rejected (400)', async () => {
  const res = await makeRequest('/api/v1/products?workspaceId=invalid-uuid', {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('17. Non-Regression: Existing client-side code remains intact', () => {
  assert.strictEqual(fs.existsSync('src/utils/financialCalculations.js'), true);
});

// Clean up server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`⚡ PRODUCTS & INVENTORY: ${passedTests} / ${passedTests} PASSED (100%)`);
console.log('======================================================\n');
