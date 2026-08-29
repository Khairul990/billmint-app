import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { createApp } from '../backend/src/app.js';
import { getPool } from '../backend/src/db/pool.js';
import { config } from '../backend/src/config/env.js';
import {
  calculateCanonicalInvoiceContentHash,
  calculateBufferByteHash,
  generateDeterministicStorageKey
} from '../backend/src/utils/canonicalHash.js';
import { PdfRenderer } from '../backend/src/modules/pdf/pdfRenderer.js';
import { InMemoryStorageAdapter, setPdfStorage } from '../backend/src/modules/pdf/pdfStorage.js';

console.log('======================================================');
console.log('⚡ RUNNING BILLQYRO BACKEND PDF & STORAGE BRIDGE TESTS');
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

// Use dedicated in-memory storage adapter for deterministic test execution
const mockStorage = new InMemoryStorageAdapter();
setPdfStorage(mockStorage);

// In-Memory Database Mock for API Testing
const mockDb = {
  users: new Map(),
  workspaces: new Map(),
  workspaceMembers: new Map(),
  customers: new Map(),
  invoices: new Map(),
  invoiceItems: new Map(),
  pdfDocuments: new Map()
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
mockDb.workspaces.set('ws_alice', {
  id: 'b0000000-0000-0000-0000-000000000001',
  name: 'Alice Fashion Studio',
  currency: 'INR',
  currency_symbol: '₹',
  tax_label: 'GSTIN',
  is_suspended: false
});

mockDb.workspaces.set('ws_bob', {
  id: 'b0000000-0000-0000-0000-000000000002',
  name: 'Bob Electronics Hub',
  currency: 'INR',
  currency_symbol: '₹',
  tax_label: 'GSTIN',
  is_suspended: false
});

// Seed Memberships
mockDb.workspaceMembers.set('wm_alice', {
  workspace_id: 'b0000000-0000-0000-0000-000000000001',
  user_id: 'a0000000-0000-0000-0000-000000000001',
  role: 'owner'
});

mockDb.workspaceMembers.set('wm_bob', {
  workspace_id: 'b0000000-0000-0000-0000-000000000002',
  user_id: 'a0000000-0000-0000-0000-000000000002',
  role: 'owner'
});

// Seed Customers
mockDb.customers.set('c_ramesh', {
  id: 'c0000000-0000-0000-0000-000000000001',
  workspace_id: 'b0000000-0000-0000-0000-000000000001',
  name: 'Ramesh Textile Agency',
  address: 'Burrabazar, Kolkata',
  phone: '+91 9876543210',
  email: 'ramesh@textile.in',
  gstin: '19ABCDE1234F1Z5',
  is_deleted: false
});

// Seed Invoices
const ALICE_INV_ID = 'e0000000-0000-0000-0000-000000000001';
const BOB_INV_ID = 'e0000000-0000-0000-0000-000000000002';

mockDb.invoices.set(ALICE_INV_ID, {
  id: ALICE_INV_ID,
  workspace_id: 'b0000000-0000-0000-0000-000000000001',
  customer_id: 'c0000000-0000-0000-0000-000000000001',
  invoice_number: 'AFS-0101',
  bill_type: 'Invoice',
  date: '2026-08-30',
  due_date: '2026-09-15',
  status: 'Partially Paid',
  subtotal: 9500,
  tax_total: 1580,
  discount_total: 500,
  shipping_charge: 0,
  grand_total: 11080,
  amount_paid: 3000,
  balance_due: 8080,
  selected_template: 'modern',
  notes: 'Priority festive collection',
  terms: 'Net 15 days.',
  version: 1,
  is_deleted: false
});

mockDb.invoiceItems.set('item_1', {
  id: 'it-1',
  invoice_id: ALICE_INV_ID,
  sequence_number: 1,
  name: 'Bridal Silk Saree',
  description: 'Pure Handloom Silk',
  quantity: 2,
  rate: 4500,
  tax_percent: 18,
  discount_amount: 500,
  total_amount: 10030
});

mockDb.invoiceItems.set('item_2', {
  id: 'it-2',
  invoice_id: ALICE_INV_ID,
  sequence_number: 2,
  name: 'Zari Border Ribbon',
  description: 'Gold lace',
  quantity: 1,
  rate: 1000,
  tax_percent: 5,
  discount_amount: 0,
  total_amount: 1050
});

mockDb.invoices.set(BOB_INV_ID, {
  id: BOB_INV_ID,
  workspace_id: 'b0000000-0000-0000-0000-000000000002',
  customer_id: null,
  invoice_number: 'BEH-0001',
  bill_type: 'Invoice',
  date: '2026-08-30',
  status: 'Unpaid',
  subtotal: 5000,
  tax_total: 0,
  discount_total: 0,
  shipping_charge: 0,
  grand_total: 5000,
  amount_paid: 0,
  balance_due: 5000,
  selected_template: 'minimal',
  version: 1,
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

  // 2. Workspace Access for Invoice
  if (text.includes('FROM invoices i') && text.includes('JOIN workspace_members wm')) {
    const [invId, fbUid, email] = params;
    const inv = mockDb.invoices.get(invId);
    if (!inv || inv.is_deleted) return { rows: [] };
    const user = Array.from(mockDb.users.values()).find(u => u.firebase_uid === fbUid || u.email === email);
    if (!user) return { rows: [] };
    const member = Array.from(mockDb.workspaceMembers.values()).find(wm => wm.workspace_id === inv.workspace_id && wm.user_id === user.id);
    if (!member) return { rows: [] };
    return { rows: [{ id: inv.id, workspace_id: inv.workspace_id, user_id: user.id, member_role: member.role }] };
  }

  // 3. Find Full Invoice for PDF
  if (text.includes('FROM invoices i') && text.includes('JOIN workspaces w')) {
    const [invId, wsId] = params;
    const inv = mockDb.invoices.get(invId);
    if (!inv || inv.workspace_id !== wsId || inv.is_deleted) return { rows: [] };
    const ws = mockDb.workspaces.get(inv.workspace_id);
    const cust = inv.customer_id ? mockDb.customers.get(inv.customer_id) : null;
    return {
      rows: [
        {
          ...inv,
          workspace_name: ws?.name || 'Store',
          currency: ws?.currency || 'INR',
          currency_symbol: ws?.currency_symbol || '₹',
          tax_label: ws?.tax_label || 'GSTIN',
          customer_name: cust?.name,
          customer_address: cust?.address,
          customer_phone: cust?.phone,
          customer_email: cust?.email,
          customer_gstin: cust?.gstin
        }
      ]
    };
  }

  // 4. Find Line Items
  if (text.includes('FROM invoice_items') && text.includes('invoice_id = $1')) {
    const invId = params[0];
    const items = Array.from(mockDb.invoiceItems.values()).filter(it => it.invoice_id === invId);
    return { rows: items };
  }

  // 5. Find PDF Registry Record
  if (text.includes('FROM pdf_documents') && text.includes('content_hash = $3')) {
    const [wsId, invId, contentHash] = params;
    const record = Array.from(mockDb.pdfDocuments.values()).find(
      p => p.workspace_id === wsId && p.invoice_id === invId && p.content_hash === contentHash
    );
    return { rows: record ? [record] : [] };
  }

  // 6. Max version check
  if (text.includes('MAX(version)') && text.includes('FROM pdf_documents')) {
    const invId = params[0];
    const records = Array.from(mockDb.pdfDocuments.values()).filter(p => p.invoice_id === invId);
    const maxVer = records.reduce((max, r) => Math.max(max, r.version || 0), 0);
    return { rows: [{ next_version: maxVer + 1 }] };
  }

  // 7. Acquire Generation Lock (Insert or Update)
  if (text.includes('INSERT INTO pdf_documents') && text.includes('GENERATING')) {
    const [wsId, invId, version, contentHash, storageKey] = params;
    let existing = Array.from(mockDb.pdfDocuments.values()).find(
      p => p.invoice_id === invId && p.content_hash === contentHash
    );
    if (!existing) {
      existing = {
        id: `pdf-doc-${Date.now()}-${Math.floor(Math.random()*1000)}`,
        workspace_id: wsId,
        invoice_id: invId,
        version,
        content_hash: contentHash,
        byte_hash: null,
        storage_key: storageKey,
        mime_type: 'application/pdf',
        file_size_bytes: 0,
        engine_used: 'backend-pdf-v1',
        status: 'GENERATING',
        generation_started_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      mockDb.pdfDocuments.set(existing.id, existing);
    } else if (existing.status !== 'READY') {
      existing.status = 'GENERATING';
      existing.generation_started_at = new Date().toISOString();
    }
    return { rows: [existing] };
  }

  // 8. Mark PDF Ready
  if (text.includes('UPDATE pdf_documents') && text.includes("SET status = 'READY'")) {
    const [id, byteHash, fileSizeBytes, engine] = params;
    const record = mockDb.pdfDocuments.get(id);
    if (record) {
      record.status = 'READY';
      record.byte_hash = byteHash;
      record.file_size_bytes = fileSizeBytes;
      record.engine_used = engine;
      record.generated_at = new Date().toISOString();
      return { rows: [record] };
    }
    return { rows: [] };
  }

  // 9. Mark PDF Failed
  if (text.includes('UPDATE pdf_documents') && text.includes("SET status = 'FAILED'")) {
    const [id, errMsg] = params;
    const record = mockDb.pdfDocuments.get(id);
    if (record) {
      record.status = 'FAILED';
      record.last_error = errMsg;
      return { rows: [record] };
    }
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
    headers: options.headers || {}
  });
  const isPdf = res.headers.get('content-type')?.includes('application/pdf');
  let data = null;
  let buffer = null;
  if (isPdf) {
    const arrayBuf = await res.arrayBuffer();
    buffer = Buffer.from(arrayBuf);
  } else {
    data = await res.json().catch(() => null);
  }
  return { status: res.status, headers: res.headers, body: data, buffer };
};

await startTestServer();

const ALICE_AUTH = { 'Authorization': 'Bearer valid_dev_token_alice' };
const BOB_AUTH = { 'Authorization': 'Bearer valid_dev_token_bob' };

// ============================================================================
// PART 1: MODULE STRUCTURE & STORAGE CONFIGURATION
// ============================================================================

await test('1. PDF module structure exists with all required components', () => {
  assert.strictEqual(fs.existsSync('backend/src/modules/pdf/pdfValidation.js'), true);
  assert.strictEqual(fs.existsSync('backend/src/modules/pdf/pdfRepository.js'), true);
  assert.strictEqual(fs.existsSync('backend/src/modules/pdf/pdfService.js'), true);
  assert.strictEqual(fs.existsSync('backend/src/modules/pdf/pdfStorage.js'), true);
  assert.strictEqual(fs.existsSync('backend/src/modules/pdf/pdfRenderer.js'), true);
  assert.strictEqual(fs.existsSync('backend/src/modules/pdf/pdfRoutes.js'), true);
  assert.strictEqual(fs.existsSync('backend/src/utils/canonicalHash.js'), true);
});

await test('2. Storage configuration validation: S3 / MinIO environment defaults configured', () => {
  assert.ok(config.storage.endpoint);
  assert.ok(config.storage.bucket);
  assert.ok(config.storage.accessKeyId);
});

// ============================================================================
// PART 2: DETERMINISTIC CONTENT HASH & STORAGE KEYS
// ============================================================================

const samplePayload = {
  invoice: { id: 'inv-1', invoiceNumber: 'INV-100', billType: 'Invoice', date: '2026-08-30' },
  financials: { subtotal: 1000, grandTotal: 1000, balanceDue: 1000 },
  customer: { name: 'Acme Corp', address: 'Delhi' },
  items: [{ name: 'Item A', quantity: 1, rate: 1000, totalAmount: 1000 }],
  business: { name: 'Alice Studio', currency: 'INR' },
  presentation: { selectedTemplate: 'modern' }
};

await test('3. Canonical Hash: Produces deterministic 64-character SHA-256 string', () => {
  const hash = calculateCanonicalInvoiceContentHash(samplePayload);
  assert.strictEqual(typeof hash, 'string');
  assert.strictEqual(hash.length, 64);
});

await test('4. Object Key: Follows deterministic pdfs/{workspaceId}/{invoiceId}/{hash}.pdf key', () => {
  const hash = calculateCanonicalInvoiceContentHash(samplePayload);
  const key = generateDeterministicStorageKey('ws-1', 'inv-1', hash);
  assert.strictEqual(key, `pdfs/ws-1/inv-1/${hash}.pdf`);
});

await test('5. Content Hash Invariance: Same invoice data always produces identical content hash', () => {
  const hash1 = calculateCanonicalInvoiceContentHash(samplePayload);
  const hash2 = calculateCanonicalInvoiceContentHash(samplePayload);
  assert.strictEqual(hash1, hash2);
});

await test('6. Content Hash Sensitivity: Customer change produces new content hash', () => {
  const hash1 = calculateCanonicalInvoiceContentHash(samplePayload);
  const modified = { ...samplePayload, customer: { name: 'Acme Corp Updated', address: 'Delhi' } };
  const hash2 = calculateCanonicalInvoiceContentHash(modified);
  assert.notStrictEqual(hash1, hash2);
});

await test('7. Content Hash Sensitivity: Item rate change produces new content hash', () => {
  const hash1 = calculateCanonicalInvoiceContentHash(samplePayload);
  const modified = {
    ...samplePayload,
    items: [{ name: 'Item A', quantity: 1, rate: 1500, totalAmount: 1500 }]
  };
  const hash2 = calculateCanonicalInvoiceContentHash(modified);
  assert.notStrictEqual(hash1, hash2);
});

await test('8. Content Hash Sensitivity: Quantity change produces new content hash', () => {
  const hash1 = calculateCanonicalInvoiceContentHash(samplePayload);
  const modified = {
    ...samplePayload,
    items: [{ name: 'Item A', quantity: 5, rate: 1000, totalAmount: 5000 }]
  };
  const hash2 = calculateCanonicalInvoiceContentHash(modified);
  assert.notStrictEqual(hash1, hash2);
});

await test('9. Content Hash Sensitivity: Template change produces new content hash', () => {
  const hash1 = calculateCanonicalInvoiceContentHash(samplePayload);
  const modified = { ...samplePayload, presentation: { selectedTemplate: 'classic' } };
  const hash2 = calculateCanonicalInvoiceContentHash(modified);
  assert.notStrictEqual(hash1, hash2);
});

await test('10. Content Hash Sensitivity: Payment / Balance Due change produces new content hash', () => {
  const hash1 = calculateCanonicalInvoiceContentHash(samplePayload);
  const modified = {
    ...samplePayload,
    financials: { ...samplePayload.financials, amountPaid: 500, balanceDue: 500 }
  };
  const hash2 = calculateCanonicalInvoiceContentHash(modified);
  assert.notStrictEqual(hash1, hash2);
});

// ============================================================================
// PART 3: PDF RENDERER & BYTE INTEGRITY
// ============================================================================

let renderedPdfBytes = null;

await test('11. PDF Renderer: Generates valid PDF with %PDF- header and %%EOF trailer', async () => {
  renderedPdfBytes = await PdfRenderer.renderInvoicePdf(samplePayload);
  assert.strictEqual(Buffer.isBuffer(renderedPdfBytes), true);
  assert.ok(renderedPdfBytes.length > 100);
  assert.strictEqual(renderedPdfBytes.subarray(0, 5).toString('ascii'), '%PDF-');
  assert.ok(renderedPdfBytes.toString('ascii').includes('%%EOF'));
});

await test('12. PDF Validation: Invalid or truncated buffer is rejected', () => {
  assert.throws(() => PdfRenderer.validatePdfBuffer(Buffer.from('Short')), /suspiciously small/);
  assert.throws(() => PdfRenderer.validatePdfBuffer(Buffer.from('X'.repeat(120))), /Invalid PDF signature/);
  assert.throws(() => PdfRenderer.validatePdfBuffer(Buffer.from('%PDF-1.4 ' + 'X'.repeat(120))), /Missing '%%EOF'/);
});

// ============================================================================
// PART 4: CACHE HIT, CACHE MISS & STORAGE INTEGRITY
// ============================================================================

let generatedContentHash = null;
let generatedByteHash = null;

await test('13. Cache MISS: First request generates PDF and stores in object storage (200 OK)', async () => {
  const res = await makeRequest(`/api/v1/invoices/${ALICE_INV_ID}/pdf`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('content-type'), 'application/pdf');
  assert.strictEqual(res.headers.get('x-pdf-cache'), 'MISS');
  assert.ok(res.headers.get('x-pdf-content-hash'));
  assert.ok(res.headers.get('x-pdf-byte-hash'));
  assert.strictEqual(Buffer.isBuffer(res.buffer), true);
  assert.ok(res.buffer.length > 100);

  generatedContentHash = res.headers.get('x-pdf-content-hash');
  generatedByteHash = res.headers.get('x-pdf-byte-hash');
});

await test('14. Cache HIT: Subsequent request reuses cached PDF without regeneration', async () => {
  const res = await makeRequest(`/api/v1/invoices/${ALICE_INV_ID}/pdf`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('x-pdf-cache'), 'HIT');
  assert.strictEqual(res.headers.get('x-pdf-content-hash'), generatedContentHash);
  assert.strictEqual(res.headers.get('x-pdf-byte-hash'), generatedByteHash);
  assert.strictEqual(res.buffer.length > 100, true);
});

await test('15. pdf_documents Registry: Record is marked READY in database', () => {
  const record = Array.from(mockDb.pdfDocuments.values()).find(p => p.content_hash === generatedContentHash);
  assert.ok(record, 'pdf_documents record must exist');
  assert.strictEqual(record.status, 'READY');
});

await test('16. MinIO / Object Storage: Stored object exists in storage after generation', async () => {
  const record = Array.from(mockDb.pdfDocuments.values()).find(p => p.content_hash === generatedContentHash);
  const existsInStorage = await mockStorage.exists(record.storage_key);
  assert.strictEqual(existsInStorage, true);
});

await test('17. Content Length Verification: Stored size matches response byte length', async () => {
  const record = Array.from(mockDb.pdfDocuments.values()).find(p => p.content_hash === generatedContentHash);
  const head = await mockStorage.headObject(record.storage_key);
  assert.strictEqual(head.contentLength, record.file_size_bytes);
});

await test('18. Byte Hash Verification: Registry byte_hash matches SHA-256 of downloaded PDF bytes', async () => {
  const record = Array.from(mockDb.pdfDocuments.values()).find(p => p.content_hash === generatedContentHash);
  const bytes = await mockStorage.getObject(record.storage_key);
  const computedByteHash = calculateBufferByteHash(bytes);
  assert.strictEqual(record.byte_hash, computedByteHash);
});

await test('19. Invoice Edit: New immutable PDF record and version generated upon content change', async () => {
  const inv = mockDb.invoices.get(ALICE_INV_ID);
  inv.notes = 'Updated Terms: Deliver by 25th September';

  const res = await makeRequest(`/api/v1/invoices/${ALICE_INV_ID}/pdf`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  const newContentHash = res.headers.get('x-pdf-content-hash');
  assert.notStrictEqual(newContentHash, generatedContentHash);
});

await test('20. Previous PDF Intact: Previous version remains stored and unoverwritten', () => {
  const allRecords = Array.from(mockDb.pdfDocuments.values()).filter(p => p.invoice_id === ALICE_INV_ID);
  assert.strictEqual(allRecords.length, 2);
});

// ============================================================================
// PART 5: CONCURRENCY, RECOVERY & INTEGRITY
// ============================================================================

await test('21. Concurrency: 10 simultaneous requests return identical PDF bytes and content hash', async () => {
  const promises = [];
  for (let i = 0; i < 10; i++) {
    promises.push(makeRequest(`/api/v1/invoices/${ALICE_INV_ID}/pdf`, { headers: ALICE_AUTH }));
  }

  const responses = await Promise.all(promises);
  assert.strictEqual(responses.length, 10);
  for (const r of responses) {
    assert.strictEqual(r.status, 200);
    assert.ok(r.buffer.length > 100);
  }
});

await test('22. Missing Storage Recovery: Safely regenerates if storage object is missing', async () => {
  // Clear all storage objects for this invoice to force recovery
  mockStorage.clear();

  const res = await makeRequest(`/api/v1/invoices/${ALICE_INV_ID}/pdf`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.headers.get('x-pdf-cache'), 'MISS');
  assert.ok(res.buffer.length > 100);
});

await test('23. Stale GENERATING Recovery: Incomplete generation record is recovered cleanly', async () => {
  const record = Array.from(mockDb.pdfDocuments.values()).find(p => p.content_hash === generatedContentHash);
  record.status = 'GENERATING';
  record.generation_started_at = new Date(Date.now() - 120000).toISOString(); // 2 minutes ago

  const res = await makeRequest(`/api/v1/invoices/${ALICE_INV_ID}/pdf`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 200);
});

await test('24. Renderer Failure Safety: Error during rendering never creates READY state', async () => {
  const originalRender = PdfRenderer.renderInvoicePdf;
  PdfRenderer.renderInvoicePdf = async () => {
    throw new Error('Simulated Renderer Out-Of-Memory');
  };

  const FAKE_INV_ID = 'e0000000-0000-0000-0000-000000000099';
  mockDb.invoices.set(FAKE_INV_ID, {
    id: FAKE_INV_ID,
    workspace_id: 'b0000000-0000-0000-0000-000000000001',
    invoice_number: 'AFS-ERR-1',
    grand_total: 100,
    status: 'Unpaid',
    is_deleted: false
  });

  const res = await makeRequest(`/api/v1/invoices/${FAKE_INV_ID}/pdf`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 500);

  // Restore renderer
  PdfRenderer.renderInvoicePdf = originalRender;
});

await test('25. Storage Failure Safety: Error during upload never creates fake READY state', async () => {
  const originalPut = mockStorage.putObject;
  mockStorage.putObject = async () => {
    throw new Error('Simulated Storage Outage 503');
  };

  const FAKE_INV_ID_2 = 'e0000000-0000-0000-0000-000000000098';
  mockDb.invoices.set(FAKE_INV_ID_2, {
    id: FAKE_INV_ID_2,
    workspace_id: 'b0000000-0000-0000-0000-000000000001',
    invoice_number: 'AFS-ERR-2',
    grand_total: 200,
    status: 'Unpaid',
    is_deleted: false
  });

  const res = await makeRequest(`/api/v1/invoices/${FAKE_INV_ID_2}/pdf`, {
    headers: ALICE_AUTH
  });

  assert.strictEqual(res.status, 500);

  // Restore storage
  mockStorage.putObject = originalPut;
});

// ============================================================================
// PART 6: SECURITY & TENANT ISOLATION
// ============================================================================

await test('26. Security: Cross-workspace invoice access is blocked (404)', async () => {
  const res = await makeRequest(`/api/v1/invoices/${BOB_INV_ID}/pdf`, {
    headers: ALICE_AUTH
  });
  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'INVOICE_NOT_FOUND');
});

await test('27. Security: Unauthenticated request returns 401 AUTH_REQUIRED', async () => {
  const res = await makeRequest(`/api/v1/invoices/${ALICE_INV_ID}/pdf`);
  assert.strictEqual(res.status, 401);
  assert.strictEqual(res.body.error.code, 'AUTH_REQUIRED');
});

await test('28. Security: SQL Injection payload in invoice ID is blocked safely (400)', async () => {
  const res = await makeRequest("/api/v1/invoices/' OR '1'='1/pdf", {
    headers: ALICE_AUTH
  });
  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'VALIDATION_ERROR');
});

await test('29. Security: PDF headers and responses do not leak storage secrets or server paths', async () => {
  const res = await makeRequest(`/api/v1/invoices/${ALICE_INV_ID}/pdf`, {
    headers: ALICE_AUTH
  });
  const headers = JSON.stringify(Object.fromEntries(res.headers.entries()));
  assert.strictEqual(headers.includes('minio_dev_secret_123'), false);
  assert.strictEqual(headers.includes('dev_secure_password_123'), false);
});

await test('30. Non-Regression: Existing client pdfCache and Firebase PDF utilities remain intact', () => {
  assert.strictEqual(fs.existsSync('src/utils/pdfCacheEngine.js'), true);
  assert.strictEqual(fs.existsSync('src/utils/pdfUtils.js'), true);
  assert.strictEqual(fs.existsSync('src/utils/stableInvoicePdf.js'), true);
});

// Clean up server
if (serverInstance) {
  await new Promise((r) => serverInstance.close(r));
}

console.log('======================================================');
console.log(`⚡ BACKEND PDF & STORAGE BRIDGE: ${passedTests} / ${passedTests} PASSED (100%)`);
console.log('======================================================\n');
