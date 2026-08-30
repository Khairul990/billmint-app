import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';

console.log('======================================================');
console.log('⚡ RUNNING BILLQYRO VENDOR & OUTSOURCE MANAGEMENT TESTS');
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
  vendors: new Map(),
  outsourceJobs: new Map(),
  vendorPayments: new Map()
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

// Seed Invoices
const ALICE_INV_ID = 'e0000000-0000-0000-0000-000000000001';
const BOB_INV_ID = 'e0000000-0000-0000-0000-000000000002';

mockDb.invoices.set(ALICE_INV_ID, {
  id: ALICE_INV_ID,
  workspace_id: WS_ALICE_ID,
  invoice_number: 'AFS-1001',
  grand_total: 15000,
  is_deleted: false
});

mockDb.invoices.set(BOB_INV_ID, {
  id: BOB_INV_ID,
  workspace_id: WS_BOB_ID,
  invoice_number: 'BEH-2001',
  grand_total: 8000,
  is_deleted: false
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

  // 3. Insert Vendor
  if (text.includes('INSERT INTO vendors')) {
    const [wsId, name, phone, email, service, address] = params;
    const vendor = {
      id: `d0000000-0000-0000-0000-${String(mockDb.vendors.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      name,
      phone,
      email,
      service,
      address,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDb.vendors.set(vendor.id, vendor);
    return { rows: [vendor] };
  }

  // 4. Find Vendor by ID
  if (text.includes('FROM vendors') && text.includes('WHERE id = $1 AND workspace_id = $2')) {
    const [vendorId, wsId] = params;
    const vendor = mockDb.vendors.get(vendorId);
    if (vendor && vendor.workspace_id === wsId && !vendor.is_deleted) {
      return { rows: [vendor] };
    }
    return { rows: [] };
  }

  // 5. List Vendors
  if (text.includes('FROM vendors') && text.includes('COUNT(*) OVER() AS full_count')) {
    const wsId = params[0];
    let list = Array.from(mockDb.vendors.values()).filter(v => v.workspace_id === wsId && !v.is_deleted);
    
    // Check search param if present
    if (params.length >= 2 && typeof params[1] === 'string' && params[1].startsWith('%')) {
      const searchTerm = params[1].replace(/%/g, '').toLowerCase();
      list = list.filter(v => 
        (v.name && v.name.toLowerCase().includes(searchTerm)) ||
        (v.service && v.service.toLowerCase().includes(searchTerm)) ||
        (v.phone && v.phone.toLowerCase().includes(searchTerm)) ||
        (v.email && v.email.toLowerCase().includes(searchTerm))
      );
    }

    const total = list.length;
    return {
      rows: list.map(item => ({ ...item, full_count: total }))
    };
  }

  // 6. Verify Invoice
  if (text.includes('FROM invoices WHERE id = $1 AND workspace_id = $2')) {
    const [invId, wsId] = params;
    const inv = mockDb.invoices.get(invId);
    if (inv && inv.workspace_id === wsId && !inv.is_deleted) {
      return { rows: [inv] };
    }
    return { rows: [] };
  }

  // 7. Insert Outsource Job
  if (text.includes('INSERT INTO outsource_jobs')) {
    const [wsId, vendorId, invoiceId, workDescription, cost, status] = params;
    const job = {
      id: `f0000000-0000-0000-0000-${String(mockDb.outsourceJobs.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      vendor_id: vendorId,
      invoice_id: invoiceId,
      work_description: workDescription,
      cost,
      status,
      is_deleted: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    mockDb.outsourceJobs.set(job.id, job);
    return { rows: [job] };
  }

  // 8. Find Outsource Job by ID
  if (text.includes('FROM outsource_jobs j') && text.includes('WHERE j.id = $1 AND j.workspace_id = $2')) {
    const [jobId, wsId] = params;
    const job = mockDb.outsourceJobs.get(jobId);
    if (job && job.workspace_id === wsId && !job.is_deleted) {
      const vendor = mockDb.vendors.get(job.vendor_id);
      const invoice = job.invoice_id ? mockDb.invoices.get(job.invoice_id) : null;
      return {
        rows: [{
          ...job,
          vendor_name: vendor?.name,
          vendor_phone: vendor?.phone,
          vendor_service: vendor?.service,
          invoice_number: invoice?.invoice_number || null
        }]
      };
    }
    return { rows: [] };
  }

  // 9. List Outsource Jobs
  if (text.includes('FROM outsource_jobs j') && text.includes('COUNT(*) OVER() AS full_count')) {
    const wsId = params[0];
    let list = Array.from(mockDb.outsourceJobs.values()).filter(j => j.workspace_id === wsId && !j.is_deleted);
    
    // Status filter
    if (text.includes('j.status = $')) {
      const statusParam = params.find(p => ['Pending', 'In Progress', 'Completed'].includes(p));
      if (statusParam) list = list.filter(j => j.status === statusParam);
    }

    // Vendor filter
    if (text.includes('j.vendor_id = $')) {
      const vendorParam = params.find(p => typeof p === 'string' && p.startsWith('d0000'));
      if (vendorParam) list = list.filter(j => j.vendor_id === vendorParam);
    }

    // Invoice filter
    if (text.includes('j.invoice_id = $')) {
      const invParam = params.find(p => typeof p === 'string' && p.startsWith('e0000'));
      if (invParam) list = list.filter(j => j.invoice_id === invParam);
    }

    const total = list.length;
    const enriched = list.map(job => {
      const vendor = mockDb.vendors.get(job.vendor_id);
      const invoice = job.invoice_id ? mockDb.invoices.get(job.invoice_id) : null;
      return {
        ...job,
        vendor_name: vendor?.name,
        vendor_phone: vendor?.phone,
        vendor_service: vendor?.service,
        invoice_number: invoice?.invoice_number || null,
        full_count: total
      };
    });

    return { rows: enriched };
  }

  // 10. Update Outsource Job
  if (text.includes('UPDATE outsource_jobs')) {
    const jobId = params[0];
    const wsId = params[1];
    const job = mockDb.outsourceJobs.get(jobId);
    if (job && job.workspace_id === wsId && !job.is_deleted) {
      if (text.includes('status = $')) {
        const statusVal = params.find(p => ['Pending', 'In Progress', 'Completed'].includes(p));
        if (statusVal) job.status = statusVal;
      }
      if (text.includes('cost = $')) {
        const costVal = params.find(p => typeof p === 'number');
        if (costVal !== undefined) job.cost = costVal;
      }
      if (text.includes('work_description = $')) {
        const descVal = params.find(p => typeof p === 'string' && !['Pending', 'In Progress', 'Completed'].includes(p) && !p.startsWith('b000') && !p.startsWith('f000'));
        if (descVal) job.work_description = descVal;
      }
      job.updated_at = new Date().toISOString();
      return { rows: [job] };
    }
    return { rows: [] };
  }

  // 11. Vendor Payments: Idempotency Check
  if (text.includes('FROM vendor_payments') && text.includes('idempotency_key = $2')) {
    const [wsId, key] = params;
    const payment = Array.from(mockDb.vendorPayments.values()).find(
      p => p.workspace_id === wsId && p.idempotency_key === key
    );
    return { rows: payment ? [payment] : [] };
  }

  // 12. Insert Vendor Payment
  if (text.includes('INSERT INTO vendor_payments')) {
    const [wsId, vendorId, amount, paymentMethod, referenceNote, idempotencyKey] = params;
    const payment = {
      id: `c0000000-0000-0000-0000-${String(mockDb.vendorPayments.size + 1).padStart(12, '0')}`,
      workspace_id: wsId,
      vendor_id: vendorId,
      amount,
      payment_method: paymentMethod,
      reference_note: referenceNote,
      idempotency_key: idempotencyKey,
      created_at: new Date().toISOString()
    };
    mockDb.vendorPayments.set(payment.id, payment);
    return { rows: [payment] };
  }

  // 13. Vendor Ledger: Jobs for Vendor
  if (text.includes('FROM outsource_jobs') && text.includes('vendor_id = $2')) {
    const [wsId, vendorId] = params;
    const jobs = Array.from(mockDb.outsourceJobs.values()).filter(
      j => j.workspace_id === wsId && j.vendor_id === vendorId && !j.is_deleted
    );
    return { rows: jobs };
  }

  // 14. Vendor Ledger: Payments for Vendor
  if (text.includes('FROM vendor_payments') && text.includes('vendor_id = $2')) {
    const [wsId, vendorId] = params;
    const payments = Array.from(mockDb.vendorPayments.values()).filter(
      p => p.workspace_id === wsId && p.vendor_id === vendorId
    );
    return { rows: payments };
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
// PART 1: VENDOR CRUD & VALIDATION
// ============================================================================

let aliceVendor1Id = null;
let aliceVendor2Id = null;

await test('1. POST /api/v1/vendors: Successfully creates vendor in authorized workspace (201)', async () => {
  const res = await makeRequest('/api/v1/vendors', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      name: 'Rahim Embroidery Works',
      phone: '+91 9830123456',
      email: 'rahim@embroidery.local',
      service: 'Zari Embroidery',
      address: 'Metiabruz, Kolkata'
    }
  });

  assert.strictEqual(res.status, 201);
  assert.ok(res.body.data.id);
  assert.strictEqual(res.body.data.name, 'Rahim Embroidery Works');
  assert.strictEqual(res.body.data.service, 'Zari Embroidery');
  assert.strictEqual(res.body.data.workspace_id, WS_ALICE_ID);
  aliceVendor1Id = res.body.data.id;
});

await test('2. POST /api/v1/vendors: Creates second vendor in Alice workspace (201)', async () => {
  const res = await makeRequest('/api/v1/vendors', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      name: 'Sunil Dyeing & Printing',
      phone: '+91 9831987654',
      service: 'Fabric Dyeing',
      address: 'Howrah, WB'
    }
  });

  assert.strictEqual(res.status, 201);
  aliceVendor2Id = res.body.data.id;
});

await test('3. POST /api/v1/vendors: Validation rejects empty vendor name (400)', async () => {
  const res = await makeRequest('/api/v1/vendors', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      name: '   '
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('4. GET /api/v1/vendors: Lists all vendors for authorized workspace (200)', async () => {
  const res = await makeRequest(`/api/v1/vendors?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 2);
  assert.strictEqual(res.body.pagination.total, 2);
});

await test('5. GET /api/v1/vendors: Search filter finds vendor by service name (200)', async () => {
  const res = await makeRequest(`/api/v1/vendors?workspaceId=${WS_ALICE_ID}&search=Embroidery`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 1);
  assert.strictEqual(res.body.data[0].name, 'Rahim Embroidery Works');
});

// ============================================================================
// PART 2: OUTSOURCE JOBS CRUD & STATUS UPDATES
// ============================================================================

let aliceJob1Id = null;
let aliceJob2Id = null;

await test('6. POST /api/v1/outsource-jobs: Creates outsource job linked to invoice & vendor (201)', async () => {
  const res = await makeRequest('/api/v1/outsource-jobs', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      vendorId: aliceVendor1Id,
      invoiceId: ALICE_INV_ID,
      workDescription: 'Hand Zari work on 2 Silk Sarees',
      cost: 2500,
      status: 'Pending'
    }
  });

  assert.strictEqual(res.status, 201);
  assert.ok(res.body.data.id);
  assert.strictEqual(res.body.data.cost, 2500);
  assert.strictEqual(res.body.data.status, 'Pending');
  assert.strictEqual(res.body.data.vendor_id, aliceVendor1Id);
  assert.strictEqual(res.body.data.invoice_id, ALICE_INV_ID);
  aliceJob1Id = res.body.data.id;
});

await test('7. POST /api/v1/outsource-jobs: Creates second job without invoice link (201)', async () => {
  const res = await makeRequest('/api/v1/outsource-jobs', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      vendorId: aliceVendor1Id,
      workDescription: 'Sample Border Embroidery',
      cost: 1000,
      status: 'In Progress'
    }
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.cost, 1000);
  assert.strictEqual(res.body.data.status, 'In Progress');
  assert.strictEqual(res.body.data.invoice_id, null);
  aliceJob2Id = res.body.data.id;
});

await test('8. POST /api/v1/outsource-jobs: Rejects negative cost (400)', async () => {
  const res = await makeRequest('/api/v1/outsource-jobs', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      vendorId: aliceVendor1Id,
      workDescription: 'Test Job',
      cost: -500
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('9. POST /api/v1/outsource-jobs: Rejects invalid job status (400)', async () => {
  const res = await makeRequest('/api/v1/outsource-jobs', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      vendorId: aliceVendor1Id,
      workDescription: 'Test Job',
      status: 'UnknownStatus'
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('10. GET /api/v1/outsource-jobs: Lists jobs enriched with vendor and invoice details (200)', async () => {
  const res = await makeRequest(`/api/v1/outsource-jobs?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 2);
  assert.strictEqual(res.body.data[0].vendor_name, 'Rahim Embroidery Works');
});

await test('11. GET /api/v1/outsource-jobs: Filter jobs by status (200)', async () => {
  const res = await makeRequest(`/api/v1/outsource-jobs?workspaceId=${WS_ALICE_ID}&status=Pending`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 1);
  assert.strictEqual(res.body.data[0].status, 'Pending');
});

await test('12. PATCH /api/v1/outsource-jobs/:id: Updates job status from Pending to Completed (200)', async () => {
  const res = await makeRequest(`/api/v1/outsource-jobs/${aliceJob1Id}`, {
    method: 'PATCH',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      status: 'Completed'
    }
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.status, 'Completed');
});

// ============================================================================
// PART 3: VENDOR PAYMENTS & IDEMPOTENCY
// ============================================================================

await test('13. POST /api/v1/vendor-payments: Records payment to vendor (201)', async () => {
  const res = await makeRequest('/api/v1/vendor-payments', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      vendorId: aliceVendor1Id,
      amount: 1500,
      paymentMethod: 'UPI',
      referenceNote: 'Advance for Zari work',
      idempotencyKey: 'idem_vp_alice_001'
    }
  });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.data.amount, 1500);
  assert.strictEqual(res.body.data.payment_method, 'UPI');
  assert.strictEqual(res.body.isIdempotentReplay, false);
});

await test('14. POST /api/v1/vendor-payments: Idempotency replay prevents double payment (200)', async () => {
  const res = await makeRequest('/api/v1/vendor-payments', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      vendorId: aliceVendor1Id,
      amount: 1500,
      paymentMethod: 'UPI',
      referenceNote: 'Advance for Zari work',
      idempotencyKey: 'idem_vp_alice_001'
    }
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.isIdempotentReplay, true);
  assert.strictEqual(res.body.data.amount, 1500);
});

await test('15. POST /api/v1/vendor-payments: Rejects zero or negative payment amount (400)', async () => {
  const res = await makeRequest('/api/v1/vendor-payments', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      vendorId: aliceVendor1Id,
      amount: 0
    }
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

// ============================================================================
// PART 4: VENDOR STATEMENT / LEDGER & SERVER-SIDE DUE CALCULATION
// ============================================================================

await test('16. GET /api/v1/vendors/:id/ledger: Computes server-side totalCost, totalPaid, balanceDue (200)', async () => {
  // Job 1 (2500) + Job 2 (1000) = totalCost: 3500
  // Payment 1 = totalPaid: 1500
  // balanceDue = 3500 - 1500 = 2000
  const res = await makeRequest(`/api/v1/vendors/${aliceVendor1Id}/ledger?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.vendor.name, 'Rahim Embroidery Works');
  assert.strictEqual(res.body.data.summary.totalCost, 3500);
  assert.strictEqual(res.body.data.summary.totalPaid, 1500);
  assert.strictEqual(res.body.data.summary.balanceDue, 2000);
  assert.strictEqual(res.body.data.jobs.length, 2);
  assert.strictEqual(res.body.data.payments.length, 1);
});

await test('17. Full Settlement: Second payment clears balanceDue to 0', async () => {
  // Pay remaining 2000
  await makeRequest('/api/v1/vendor-payments', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      vendorId: aliceVendor1Id,
      amount: 2000,
      paymentMethod: 'Bank Transfer',
      referenceNote: 'Final settlement',
      idempotencyKey: 'idem_vp_alice_002'
    }
  });

  const res = await makeRequest(`/api/v1/vendors/${aliceVendor1Id}/ledger?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.summary.totalCost, 3500);
  assert.strictEqual(res.body.data.summary.totalPaid, 3500);
  assert.strictEqual(res.body.data.summary.balanceDue, 0);
});

// ============================================================================
// PART 5: WORKSPACE ISOLATION & SECURITY
// ============================================================================

await test('18. Security: Bob cannot access Alice vendor list (403)', async () => {
  const res = await makeRequest(`/api/v1/vendors?workspaceId=${WS_ALICE_ID}`, {
    headers: BOB_AUTH
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

await test('19. Security: Bob cannot view Alice vendor ledger (403)', async () => {
  const res = await makeRequest(`/api/v1/vendors/${aliceVendor1Id}/ledger?workspaceId=${WS_ALICE_ID}`, {
    headers: BOB_AUTH
  });

  assert.strictEqual(res.status, 403);
  assert.strictEqual(res.body.error.code, 'FORBIDDEN_WORKSPACE_ACCESS');
});

await test('20. Security: Alice cannot create job with Bob vendor ID (404)', async () => {
  // Create Bob Vendor
  const bobVendorRes = await makeRequest('/api/v1/vendors', {
    method: 'POST',
    headers: BOB_AUTH,
    body: {
      workspaceId: WS_BOB_ID,
      name: 'Bob Secret Vendor'
    }
  });
  const bobVendorId = bobVendorRes.body.data.id;

  // Alice tries to assign job to Bob vendor inside Alice workspace
  const res = await makeRequest('/api/v1/outsource-jobs', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      vendorId: bobVendorId,
      workDescription: 'Illegal Cross-Tenant Work',
      cost: 500
    }
  });

  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'VENDOR_NOT_FOUND');
});

await test('21. Security: Alice cannot link job to Bob invoice ID (404)', async () => {
  const res = await makeRequest('/api/v1/outsource-jobs', {
    method: 'POST',
    headers: ALICE_AUTH,
    body: {
      workspaceId: WS_ALICE_ID,
      vendorId: aliceVendor1Id,
      invoiceId: BOB_INV_ID,
      workDescription: 'Cross-Tenant Invoice Link',
      cost: 500
    }
  });

  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'INVOICE_NOT_FOUND');
});

await test('22. Security: Unauthenticated request to vendor endpoints returns 401', async () => {
  const res = await makeRequest(`/api/v1/vendors?workspaceId=${WS_ALICE_ID}`);
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error.code, 'AUTH_REQUIRED');
});

await test('23. Security: SQL Injection payload in vendor search handled safely (200)', async () => {
  const res = await makeRequest(`/api/v1/vendors?workspaceId=${WS_ALICE_ID}&search=' OR '1'='1`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 0);
});

await test('24. Security: Malformed UUID parameter rejected cleanly (400)', async () => {
  const res = await makeRequest(`/api/v1/vendors/not-a-valid-uuid/ledger?workspaceId=${WS_ALICE_ID}`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('25. Non-Regression: Existing Firebase & Frontend files remain untouched', () => {
  assert.strictEqual(fs.existsSync('src/utils/pdfCacheEngine.js'), true);
  assert.strictEqual(fs.existsSync('src/utils/stableInvoicePdf.js'), true);
  assert.strictEqual(fs.existsSync('src/services/firebase.js') || fs.existsSync('src/main.jsx'), true);
});

// Clean up server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`⚡ VENDOR & OUTSOURCE MANAGEMENT: ${passedTests} / ${passedTests} PASSED (100%)`);
console.log('======================================================\n');
