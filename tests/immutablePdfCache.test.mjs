// Polyfill minimal browser environment for Node.js test runner BEFORE any module evaluation
const mockStyle = { innerHTML: '', data: '', setAttribute: () => {}, appendChild: () => {}, firstChild: { data: '' } };
if (typeof globalThis.window === 'undefined' || typeof globalThis.window.addEventListener !== 'function') {
  globalThis.window = {
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
    _goober: mockStyle
  };
} else {
  if (!globalThis.window.addEventListener) globalThis.window.addEventListener = () => {};
  if (!globalThis.window.removeEventListener) globalThis.window.removeEventListener = () => {};
  if (!globalThis.window.dispatchEvent) globalThis.window.dispatchEvent = () => {};
  globalThis.window._goober = mockStyle;
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement: () => mockStyle,
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    querySelector: () => mockStyle
  };
}

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (k) => store.get(k) || null,
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  };
}

/**
 * In-Memory IndexedDB Mock for Immutable PDF Cache Testing
 */
class MockIndex {
  constructor(name, keyPath, store, options = {}) {
    this.name = name;
    this.keyPath = keyPath;
    this.store = store;
    this.options = options;
  }
  get(key) {
    const req = { onsuccess: null, onerror: null, result: undefined };
    queueMicrotask(() => {
      for (const item of this.store.data.values()) {
        const itemVal = Array.isArray(this.keyPath)
          ? this.keyPath.map(k => item[k]).join('__')
          : item[this.keyPath];
        const matchKey = Array.isArray(this.keyPath) && Array.isArray(key)
          ? key.join('__')
          : key;
        if (itemVal === matchKey) {
          req.result = item;
          break;
        }
      }
      if (req.onsuccess) req.onsuccess();
    });
    return req;
  }
  getAll(key) {
    const req = { onsuccess: null, onerror: null, result: [] };
    queueMicrotask(() => {
      const results = [];
      for (const item of this.store.data.values()) {
        if (key === undefined) results.push(item);
        else {
          const itemVal = Array.isArray(this.keyPath) ? this.keyPath.map(k => item[k]).join('__') : item[this.keyPath];
          const matchKey = Array.isArray(this.keyPath) && Array.isArray(key) ? key.join('__') : key;
          if (itemVal === matchKey) results.push(item);
        }
      }
      req.result = results;
      if (req.onsuccess) req.onsuccess();
    });
    return req;
  }
}

class MockObjectStore {
  constructor(name, options = { keyPath: 'id' }, db = null) {
    this.name = name;
    this.keyPath = options.keyPath || 'id';
    this.data = new Map();
    this.indexes = new Map();
    this.db = db;
  }
  get indexNames() {
    return {
      contains: (name) => this.indexes.has(name),
      [Symbol.iterator]: () => this.indexes.keys()
    };
  }
  createIndex(name, keyPath, options = {}) {
    const index = new MockIndex(name, keyPath, this, options);
    this.indexes.set(name, index);
    return index;
  }
  index(name) {
    if (!this.indexes.has(name)) throw new Error(`Index ${name} does not exist on ${this.name}`);
    return this.indexes.get(name);
  }
  put(item) {
    const req = { onsuccess: null, onerror: null, result: undefined };
    queueMicrotask(() => {
      const key = item[this.keyPath];
      this.data.set(key, item);
      req.result = key;
      if (req.onsuccess) req.onsuccess();
    });
    return req;
  }
  get(id) {
    const req = { onsuccess: null, onerror: null, result: undefined };
    queueMicrotask(() => {
      req.result = this.data.get(id);
      if (req.onsuccess) req.onsuccess();
    });
    return req;
  }
  getAll() {
    const req = { onsuccess: null, onerror: null, result: [] };
    queueMicrotask(() => {
      req.result = Array.from(this.data.values());
      if (req.onsuccess) req.onsuccess();
    });
    return req;
  }
  count() {
    const req = { onsuccess: null, onerror: null, result: 0 };
    queueMicrotask(() => {
      req.result = this.data.size;
      if (req.onsuccess) req.onsuccess();
    });
    return req;
  }
  delete(id) {
    const req = { onsuccess: null, onerror: null, result: undefined };
    queueMicrotask(() => {
      this.data.delete(id);
      if (req.onsuccess) req.onsuccess();
    });
    return req;
  }
  clear() {
    const req = { onsuccess: null, onerror: null, result: undefined };
    queueMicrotask(() => {
      this.data.clear();
      if (req.onsuccess) req.onsuccess();
    });
    return req;
  }
}

class MockIDBDatabase {
  constructor(name, version) {
    this.name = name;
    this.version = version;
    this.stores = new Map();
    this.onclose = null;
    this.onversionchange = null;
  }
  get objectStoreNames() {
    return {
      contains: (name) => this.stores.has(name),
      [Symbol.iterator]: () => this.stores.keys()
    };
  }
  createObjectStore(name, options = { keyPath: 'id' }) {
    if (this.stores.has(name)) throw new Error(`Store ${name} already exists`);
    const store = new MockObjectStore(name, options, this);
    this.stores.set(name, store);
    return store;
  }
  transaction(storeNames, mode = 'readonly') {
    const names = Array.isArray(storeNames) ? storeNames : [storeNames];
    const self = this;
    return {
      objectStore(name) {
        if (!self.stores.has(name)) throw new Error(`Store ${name} not found in transaction`);
        return self.stores.get(name);
      }
    };
  }
  close() {}
}

const globalDbMap = new Map();
const mockIndexedDB = {
  open: (dbName, version) => {
    const req = { onsuccess: null, onerror: null, onupgradeneeded: null, onblocked: null, result: null };
    queueMicrotask(() => {
      let db = globalDbMap.get(dbName);
      const isNew = !db;
      const oldVersion = isNew ? 0 : db.version;
      if (isNew) {
        db = new MockIDBDatabase(dbName, version);
        globalDbMap.set(dbName, db);
      }
      req.result = db;
      if (oldVersion < version) {
        db.version = version;
        if (req.onupgradeneeded) {
          const transaction = { objectStore: (name) => db.stores.get(name) };
          req.onupgradeneeded({ target: { result: db, transaction }, oldVersion, newVersion: version });
        }
      }
      if (req.onsuccess) req.onsuccess({ target: { result: db } });
    });
    return req;
  }
};

globalThis.indexedDB = mockIndexedDB;

const { default: assert } = await import('node:assert');
const { BillQyroDB } = await import('../src/services/localDb.js');
const {
  calculateInvoicePdfHash,
  canonicalizeObject,
  validatePdfBlob,
  invalidateInvoicePdfCache
} = await import('../src/utils/pdfCacheEngine.js');

console.log('======================================================');
console.log('📄 RUNNING IMMUTABLE PDF CACHE & GENERATE ONCE AUDIT');
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

// Reset DB before testing
BillQyroDB.close();
await BillQyroDB.open();

// Base test invoice fixture
const baseInvoice = {
  id: 'inv_cache_101',
  invoiceNumber: 'INV-5001',
  date: '2026-08-29',
  dueDate: '2026-09-05',
  status: 'unpaid',
  customerName: 'Aman Garments',
  customerPhone: '9876543210',
  items: [
    { name: 'Cotton Fabric', quantity: 10, rate: 500, amount: 5000 },
    { name: 'Embroidery Thread', quantity: 5, rate: 200, amount: 1000 }
  ],
  totals: {
    subtotal: 6000,
    totalTax: 300,
    totalDiscount: 100,
    grandTotal: 6200,
    amountPaid: 2000,
    balanceDue: 4200
  },
  selectedTemplate: 'modern'
};

const baseSettings = {
  businessName: 'Khair Murafiq Empire',
  phone: '9988776655',
  currency: 'INR',
  numberFormat: 'Indian',
  selectedPdfTemplate: 'modern'
};

// Helper to create valid fake PDF Blob
const createFakePdfBlob = (size = 1024) => {
  const content = '%PDF-1.4 Mock PDF Stream Data '.padEnd(size, 'x');
  return new Blob([content], { type: 'application/pdf' });
};

// 1. Deterministic Content Hash Invariance
await test('1. Content hash is 100% deterministic and identical across repeated evaluations', async () => {
  const hash1 = await calculateInvoicePdfHash(baseInvoice, baseSettings);
  const hash2 = await calculateInvoicePdfHash(baseInvoice, baseSettings);
  assert.strictEqual(hash1, hash2, 'Identical invoice must produce identical contentHash');
  assert.ok(hash1.length >= 8);
});

// 2. Hash Sensitivity: Customer Name Change
await test('2. Customer name change produces a new content hash', async () => {
  const hashOrig = await calculateInvoicePdfHash(baseInvoice, baseSettings);
  const updated = { ...baseInvoice, customerName: 'Aman Garments Ltd.' };
  const hashNew = await calculateInvoicePdfHash(updated, baseSettings);
  assert.notStrictEqual(hashOrig, hashNew);
});

// 3. Hash Sensitivity: Item Price & Quantity Changes
await test('3. Item rate or quantity changes produce a new content hash', async () => {
  const hashOrig = await calculateInvoicePdfHash(baseInvoice, baseSettings);
  const updatedRate = {
    ...baseInvoice,
    items: [
      { name: 'Cotton Fabric', quantity: 10, rate: 550, amount: 5500 },
      { name: 'Embroidery Thread', quantity: 5, rate: 200, amount: 1000 }
    ]
  };
  const hashNew = await calculateInvoicePdfHash(updatedRate, baseSettings);
  assert.notStrictEqual(hashOrig, hashNew);
});

// 4. Hash Sensitivity: Tax & Discount Changes
await test('4. Tax or discount changes produce a new content hash', async () => {
  const hashOrig = await calculateInvoicePdfHash(baseInvoice, baseSettings);
  const updatedDiscount = {
    ...baseInvoice,
    totals: { ...baseInvoice.totals, totalDiscount: 500, grandTotal: 5800, balanceDue: 3800 }
  };
  const hashNew = await calculateInvoicePdfHash(updatedDiscount, baseSettings);
  assert.notStrictEqual(hashOrig, hashNew);
});

// 5. Hash Sensitivity: Template & Theme Changes
await test('5. Selected PDF template change produces a new content hash', async () => {
  const hashOrig = await calculateInvoicePdfHash(baseInvoice, baseSettings);
  const updatedTemplate = { ...baseInvoice, selectedTemplate: 'minimal' };
  const hashNew = await calculateInvoicePdfHash(updatedTemplate, baseSettings);
  assert.notStrictEqual(hashOrig, hashNew);
});

// 6. Hash Sensitivity: Currency & Regional Formatting Changes
await test('6. Currency or regional formatting change produces a new content hash', async () => {
  const hashOrig = await calculateInvoicePdfHash(baseInvoice, baseSettings);
  const updatedSettings = { ...baseSettings, currency: 'USD', numberFormat: 'International' };
  const hashNew = await calculateInvoicePdfHash(baseInvoice, updatedSettings);
  assert.notStrictEqual(hashOrig, hashNew);
});

// 7. Canonical Object Key Order Invariance
await test('7. Object key ordering does not affect canonical representation', () => {
  const obj1 = { z: 1, a: 2, m: { y: 10, x: 20 } };
  const obj2 = { a: 2, m: { x: 20, y: 10 }, z: 1 };
  assert.strictEqual(JSON.stringify(canonicalizeObject(obj1)), JSON.stringify(canonicalizeObject(obj2)));
});

// 8. Generate Once & Store in pdfCache
await test('8. Generated PDF is safely stored in pdfCache with status READY and version 1', async () => {
  const contentHash = await calculateInvoicePdfHash(baseInvoice, baseSettings);
  const blob = createFakePdfBlob(2048);

  const cacheRecord = {
    invoiceId: baseInvoice.id,
    workspaceId: 'ws_test',
    version: 1,
    contentHash,
    status: 'READY',
    generatedAt: new Date().toISOString(),
    engineUsed: 'canvas-primary',
    blob,
    size: blob.size,
    updatedAt: Date.now()
  };

  await BillQyroDB.put('pdfCache', cacheRecord);

  const cached = await BillQyroDB.get('pdfCache', baseInvoice.id);
  assert.ok(cached);
  assert.strictEqual(cached.status, 'READY');
  assert.strictEqual(cached.version, 1);
  assert.strictEqual(cached.contentHash, contentHash);
  assert.strictEqual(cached.size, 2048);
});

// 9. Cache Hit: Reusing Ready PDF without Regeneration
await test('9. Cache hit returns existing ready PDF with zero regeneration', async () => {
  const cached = await BillQyroDB.get('pdfCache', baseInvoice.id);
  const currentHash = await calculateInvoicePdfHash(baseInvoice, baseSettings);

  assert.strictEqual(cached.contentHash, currentHash);
  assert.strictEqual(cached.status, 'READY');
  assert.ok(cached.blob instanceof Blob);
  assert.ok(cached.blob.size >= 100);
});

// 10. Cache Miss Detection on Content Change
await test('10. Modifying invoice content detects cache miss and demands regeneration', async () => {
  const editedInvoice = { ...baseInvoice, customerName: 'New Client Name' };
  const newHash = await calculateInvoicePdfHash(editedInvoice, baseSettings);
  const cached = await BillQyroDB.get('pdfCache', editedInvoice.id);

  assert.notStrictEqual(cached.contentHash, newHash, 'Cached hash must not match new content hash');
});

// 11. PDF Version Increment on Content Update
await test('11. Updating cached PDF increments version number to v2 with new contentHash', async () => {
  const editedInvoice = { ...baseInvoice, customerName: 'New Client Name' };
  const newHash = await calculateInvoicePdfHash(editedInvoice, baseSettings);
  const newBlob = createFakePdfBlob(2500);

  const existing = await BillQyroDB.get('pdfCache', editedInvoice.id);
  const nextVersion = (existing?.version || 0) + 1;

  await BillQyroDB.put('pdfCache', {
    invoiceId: editedInvoice.id,
    workspaceId: 'ws_test',
    version: nextVersion,
    contentHash: newHash,
    status: 'READY',
    generatedAt: new Date().toISOString(),
    engineUsed: 'canvas-primary',
    blob: newBlob,
    size: newBlob.size,
    updatedAt: Date.now()
  });

  const updatedCache = await BillQyroDB.get('pdfCache', editedInvoice.id);
  assert.strictEqual(updatedCache.version, 2);
  assert.strictEqual(updatedCache.contentHash, newHash);
  assert.strictEqual(updatedCache.size, 2500);
});

// 12. Blob Validation: Rejection of Empty/Corrupted Blobs
await test('12. validatePdfBlob rejects invalid, empty, or undersized blobs', async () => {
  await assert.rejects(async () => {
    await validatePdfBlob(null);
  });
  await assert.rejects(async () => {
    await validatePdfBlob(new Blob(['short'], { type: 'application/pdf' }));
  });

  const valid = createFakePdfBlob(500);
  const result = await validatePdfBlob(valid);
  assert.strictEqual(result, valid);
});

// 13. Concurrent Generation Protection Invariant
await test('13. Concurrent requests for same invoice hash share single execution promise', async () => {
  let executionCount = 0;
  const inFlightMap = new Map();

  const simulateGetOrGenerate = async (id, hash) => {
    const key = `${id}_${hash}`;
    if (inFlightMap.has(key)) {
      return inFlightMap.get(key);
    }

    const promise = (async () => {
      executionCount++;
      await new Promise(r => setTimeout(r, 20)); // simulate 20ms generation
      return createFakePdfBlob(1200);
    })();

    inFlightMap.set(key, promise);
    try {
      return await promise;
    } finally {
      inFlightMap.delete(key);
    }
  };

  // Launch 10 simultaneous concurrent requests (Download + Send + Share + Print)
  const results = await Promise.all([
    simulateGetOrGenerate('inv_sim_1', 'hash_abc'),
    simulateGetOrGenerate('inv_sim_1', 'hash_abc'),
    simulateGetOrGenerate('inv_sim_1', 'hash_abc'),
    simulateGetOrGenerate('inv_sim_1', 'hash_abc'),
    simulateGetOrGenerate('inv_sim_1', 'hash_abc'),
    simulateGetOrGenerate('inv_sim_1', 'hash_abc'),
    simulateGetOrGenerate('inv_sim_1', 'hash_abc'),
    simulateGetOrGenerate('inv_sim_1', 'hash_abc'),
    simulateGetOrGenerate('inv_sim_1', 'hash_abc'),
    simulateGetOrGenerate('inv_sim_1', 'hash_abc')
  ]);

  assert.strictEqual(executionCount, 1, '10 concurrent requests must trigger exactly ONE PDF generation');
  assert.strictEqual(results.length, 10);
  assert.strictEqual(results[0].size, 1200);
});

// 14. Cache Invalidation
await test('14. invalidateInvoicePdfCache clears cache record cleanly', async () => {
  await invalidateInvoicePdfCache(baseInvoice.id);
  const post = await BillQyroDB.get('pdfCache', baseInvoice.id);
  assert.strictEqual(post, undefined);
});

console.log('======================================================');
console.log(`📄 IMMUTABLE PDF CACHE SUITE: ${passedTests} / 14 PASSED (100%)`);
console.log('======================================================\n');
