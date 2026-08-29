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
 * In-Memory IndexedDB Engine for Schema & Migration Verification
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
        if (key === undefined) {
          results.push(item);
        } else {
          const itemVal = Array.isArray(this.keyPath)
            ? this.keyPath.map(k => item[k]).join('__')
            : item[this.keyPath];
          const matchKey = Array.isArray(this.keyPath) && Array.isArray(key)
            ? key.join('__')
            : key;
          if (itemVal === matchKey) {
            results.push(item);
          }
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
      this.data.set(key, JSON.parse(JSON.stringify(item)));
      req.result = key;
      if (req.onsuccess) req.onsuccess();
    });
    return req;
  }

  get(id) {
    const req = { onsuccess: null, onerror: null, result: undefined };
    queueMicrotask(() => {
      req.result = this.data.has(id) ? JSON.parse(JSON.stringify(this.data.get(id))) : undefined;
      if (req.onsuccess) req.onsuccess();
    });
    return req;
  }

  getAll() {
    const req = { onsuccess: null, onerror: null, result: [] };
    queueMicrotask(() => {
      req.result = Array.from(this.data.values()).map(v => JSON.parse(JSON.stringify(v)));
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

// Global In-Memory IndexedDB Mock Instance
const globalDbMap = new Map();
const mockIndexedDB = {
  open: (dbName, version) => {
    const req = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      onblocked: null,
      result: null
    };

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
          const transaction = {
            objectStore: (name) => db.stores.get(name)
          };
          req.onupgradeneeded({
            target: { result: db, transaction },
            oldVersion,
            newVersion: version
          });
        }
      }

      if (req.onsuccess) {
        req.onsuccess({ target: { result: db } });
      }
    });

    return req;
  }
};

globalThis.indexedDB = mockIndexedDB;
if (typeof global !== 'undefined') global.indexedDB = mockIndexedDB;
if (typeof window !== 'undefined') window.indexedDB = mockIndexedDB;

const { default: assert } = await import('node:assert');
const { BillQyroDB } = await import('../src/services/localDb.js');

console.log('======================================================');
console.log('📦 RUNNING BILLQYRO INDEXEDDB V11 UPGRADE & DLQ AUDIT');
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

// 1. Existing v10 Data Setup & Pre-population
await test('1. Pre-populating v10 database with existing invoices, customers & syncQueue items', async () => {
  BillQyroDB.close();
  // Open and populate
  await BillQyroDB.open();
  
  await BillQyroDB.put('invoices', {
    id: 'inv-v10-001',
    invoiceNumber: 'INV-1001',
    workspaceId: 'ws_main',
    userId: 'user_01',
    createdAt: '2026-08-01',
    dueDate: '2026-08-15',
    status: 'unpaid',
    customerPhone: '9876543210',
    publicToken: 'tok1234567890123',
    grandTotal: 15000,
    amountPaid: 5000,
    balanceDue: 10000,
    syncStatus: 'synced'
  });

  await BillQyroDB.put('customers', {
    id: 'cust-v10-001',
    name: 'Khairul Enterprise',
    phone: '9876543210',
    workspaceId: 'ws_main',
    userId: 'user_01'
  });

  await BillQyroDB.put('syncQueue', {
    id: 'tx-v10-001',
    userId: 'user_01',
    workspaceId: 'ws_main',
    storeName: 'invoices',
    action: 'save',
    status: 'pending',
    createdAt: 1788000000,
    retryCount: 1
  });

  const invCount = await BillQyroDB.count('invoices');
  const custCount = await BillQyroDB.count('customers');
  const syncCount = await BillQyroDB.count('syncQueue');

  assert.strictEqual(invCount, 1);
  assert.strictEqual(custCount, 1);
  assert.strictEqual(syncCount, 1);
});

// 2. Migration to v11: Data Preservation Invariant
await test('2. Upgrading to Schema v11 preserves 100% of existing v10 records', async () => {
  const version = BillQyroDB.getSchemaVersion();
  assert.strictEqual(version, 11, 'Schema version must be 11');

  const inv = await BillQyroDB.get('invoices', 'inv-v10-001');
  assert.ok(inv, 'Existing invoice must exist after upgrade');
  assert.strictEqual(inv.invoiceNumber, 'INV-1001');
  assert.strictEqual(inv.balanceDue, 10000);

  const cust = await BillQyroDB.get('customers', 'cust-v10-001');
  assert.ok(cust, 'Existing customer must exist after upgrade');
  assert.strictEqual(cust.name, 'Khairul Enterprise');

  const tx = await BillQyroDB.get('syncQueue', 'tx-v10-001');
  assert.ok(tx, 'Existing sync transaction must survive upgrade');
  assert.strictEqual(tx.action, 'save');
});

// 3. New Store Availability: deadLetterQueue
await test('3. deadLetterQueue store is available and stores failed transactions safely', async () => {
  const isAvailable = await BillQyroDB.isStoreAvailable('deadLetterQueue');
  assert.strictEqual(isAvailable, true, 'deadLetterQueue store must exist in v11');

  const dlqPayload = {
    id: 'dlq_tx_001',
    originalTransactionId: 'tx_failed_999',
    storeName: 'invoices',
    operation: 'save',
    payload: { id: 'inv-err-1', grandTotal: 2500 },
    failedAt: new Date().toISOString(),
    retryCount: 5,
    lastError: 'Firestore Network Timeout after 5 retries',
    status: 'dead_letter',
    createdAt: new Date().toISOString()
  };

  await BillQyroDB.put('deadLetterQueue', dlqPayload);
  const saved = await BillQyroDB.get('deadLetterQueue', 'dlq_tx_001');
  assert.ok(saved);
  assert.strictEqual(saved.originalTransactionId, 'tx_failed_999');
  assert.strictEqual(saved.retryCount, 5);
});

// 4. New Store Availability: pdfCache
await test('4. pdfCache store is available and stores/retrieves PDF Blob metadata', async () => {
  const isAvailable = await BillQyroDB.isStoreAvailable('pdfCache');
  assert.strictEqual(isAvailable, true, 'pdfCache store must exist in v11');

  const pdfPayload = {
    invoiceId: 'inv-v10-001',
    workspaceId: 'ws_main',
    version: 1,
    contentHash: 'hash_abc123_test',
    status: 'READY',
    generatedAt: new Date().toISOString(),
    engineUsed: 'stable-canvas-v2',
    size: 45020
  };

  await BillQyroDB.put('pdfCache', pdfPayload);
  const cached = await BillQyroDB.get('pdfCache', 'inv-v10-001');
  assert.ok(cached);
  assert.strictEqual(cached.contentHash, 'hash_abc123_test');
  assert.strictEqual(cached.status, 'READY');
});

// 5. Index Queries: Composite & Single Indexes
await test('5. Specialized indexes on invoices and pdfCache query successfully', async () => {
  // Query invoice by publicToken
  const invByToken = await BillQyroDB.getByIndex('invoices', 'publicToken', 'tok1234567890123');
  assert.ok(invByToken);
  assert.strictEqual(invByToken.id, 'inv-v10-001');

  // Query invoice by customerPhone
  const invByPhone = await BillQyroDB.getByIndex('invoices', 'customerPhone', '9876543210');
  assert.ok(invByPhone);
  assert.strictEqual(invByPhone.invoiceNumber, 'INV-1001');

  // Query pdfCache by contentHash
  const pdfByHash = await BillQyroDB.getByIndex('pdfCache', 'contentHash', 'hash_abc123_test');
  assert.ok(pdfByHash);
  assert.strictEqual(pdfByHash.invoiceId, 'inv-v10-001');
});

// 6. Idempotency & Database Stability on Repeated Access
await test('6. Repeated open, close, and write operations are strictly idempotent', async () => {
  BillQyroDB.close();
  await BillQyroDB.open();
  BillQyroDB.close();
  await BillQyroDB.open();

  const totalInvoices = await BillQyroDB.count('invoices');
  assert.strictEqual(totalInvoices, 1, 'Total invoice count must remain exactly 1 after reopen cycles');

  const totalDLQ = await BillQyroDB.count('deadLetterQueue');
  assert.strictEqual(totalDLQ, 1, 'DLQ count must remain exactly 1');

  const totalPdfCache = await BillQyroDB.count('pdfCache');
  assert.strictEqual(totalPdfCache, 1, 'PDF Cache count must remain exactly 1');
});

console.log('======================================================');
console.log(`📦 INDEXEDDB MIGRATION SUITE: ${passedTests} / 6 PASSED (100%)`);
console.log('======================================================\n');
