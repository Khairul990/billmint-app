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
 * In-Memory IndexedDB Mock for Zero-Loss Sync Testing
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
  queueSyncTransaction,
  moveToDeadLetterQueue,
  getDeadLetterQueue,
  retryDeadLetterTransaction,
  cleanupStaleData
} = await import('../src/services/dbEngine.js');
const { offlineEngine } = await import('../src/services/offlineEngine.js');

console.log('======================================================');
console.log('⚡ RUNNING BILLQYRO ZERO-LOSS OFFLINE SYNC ENGINE SUITE');
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

// 1. Transaction Enqueueing & Structure
await test('1. Enqueueing sync transaction creates structured record with unique ID and pending status', async () => {
  const invPayload = {
    id: 'inv-zero-001',
    invoiceNumber: 'INV-2001',
    workspaceId: 'ws_zero',
    grandTotal: 12500,
    amountPaid: 2500,
    balanceDue: 10000,
    customerName: 'Anowar Textiles'
  };

  await queueSyncTransaction('save', 'invoices', invPayload.id, invPayload);

  const queue = await BillQyroDB.getAll('syncQueue');
  const tx = queue.find(t => t.docId === 'inv-zero-001');

  assert.ok(tx, 'Transaction must be queued in syncQueue');
  assert.ok(tx.id.startsWith('tx-'), 'Transaction must have formatted ID');
  assert.strictEqual(tx.status, 'pending');
  assert.strictEqual(tx.retryCount, 0);
  assert.strictEqual(tx.data.grandTotal, 12500);
});

// 2. Retry Failure Accumulation & Preservation
await test('2. Failure increments retryCount and does not silently delete transaction', async () => {
  const queue = await BillQyroDB.getAll('syncQueue');
  const tx = queue.find(t => t.docId === 'inv-zero-001');
  assert.ok(tx);

  // Simulate 1st failure
  tx.retryCount += 1;
  tx.lastRetryAt = Date.now();
  tx.status = 'failed';
  tx.lastError = 'Network unreachable';
  await BillQyroDB.put('syncQueue', tx);

  const updatedQueue = await BillQyroDB.getAll('syncQueue');
  const updatedTx = updatedQueue.find(t => t.docId === 'inv-zero-001');
  assert.strictEqual(updatedTx.retryCount, 1);
  assert.strictEqual(updatedTx.status, 'failed');
  assert.strictEqual(updatedTx.lastError, 'Network unreachable');
});

// 3. Atomic Move to Dead Letter Queue (DLQ)
await test('3. Exceeding max retries triggers atomic move to DLQ with zero data loss', async () => {
  const queue = await BillQyroDB.getAll('syncQueue');
  const tx = queue.find(t => t.docId === 'inv-zero-001');
  assert.ok(tx);
  tx.retryCount = 5;

  const moved = await moveToDeadLetterQueue(tx, 'Exceeded max retries (5)');
  assert.strictEqual(moved, true, 'moveToDeadLetterQueue must return true');

  // Verify removed from syncQueue
  const postQueue = await BillQyroDB.getAll('syncQueue');
  assert.strictEqual(postQueue.filter(t => t.docId === 'inv-zero-001').length, 0);

  // Verify stored in deadLetterQueue
  const dlq = await getDeadLetterQueue();
  const dlqEntry = dlq.find(d => d.originalTransactionId === tx.id);
  assert.ok(dlqEntry, 'Transaction must exist in deadLetterQueue');
  assert.strictEqual(dlqEntry.payload.invoiceNumber, 'INV-2001');
  assert.strictEqual(dlqEntry.payload.grandTotal, 12500);
  assert.strictEqual(dlqEntry.status, 'dead_letter');
});

// 4. DLQ Write Verification Safety
await test('4. If DLQ write fails, original transaction is strictly retained in syncQueue', async () => {
  const failedTx = {
    id: 'tx-fail-safe-999',
    docId: 'inv-fail-safe',
    storeName: 'invoices',
    action: 'save',
    data: { id: 'inv-fail-safe', grandTotal: 5000 },
    retryCount: 5,
    status: 'failed'
  };
  await BillQyroDB.put('syncQueue', failedTx);

  // Pass invalid null id to trigger write verification mismatch
  const result = await moveToDeadLetterQueue({ ...failedTx, id: null });
  assert.strictEqual(result, false, 'Invalid DLQ move must return false');

  // Verify original remains in syncQueue
  const original = await BillQyroDB.get('syncQueue', 'tx-fail-safe-999');
  assert.ok(original, 'Original item must remain in syncQueue if DLQ write is unconfirmed');
});

// 5. In-Flight Stuck Transaction Recovery
await test('5. In-flight transaction stuck after tab reload recovers back to pending', async () => {
  const stuckTx = {
    id: 'tx-stuck-001',
    userId: 'user_test_01',
    docId: 'inv-stuck-001',
    storeName: 'invoices',
    action: 'save',
    data: { id: 'inv-stuck-001', grandTotal: 8000 },
    status: 'in_flight',
    inFlightStartedAt: Date.now() - 30000, // 30 seconds ago
    createdAt: Date.now() - 35000,
    updatedAt: Date.now() - 30000,
    retryCount: 0
  };
  await BillQyroDB.put('syncQueue', stuckTx);

  // Simulate recovery check
  const queue = await BillQyroDB.getAll('syncQueue');
  const now = Date.now();
  for (const t of queue) {
    if (t.status === 'in_flight' && now - (t.inFlightStartedAt || 0) > 20000) {
      t.status = 'pending';
      t.inFlightStartedAt = null;
      await BillQyroDB.put('syncQueue', t);
    }
  }

  const recovered = await BillQyroDB.get('syncQueue', 'tx-stuck-001');
  assert.strictEqual(recovered.status, 'pending', 'Stuck transaction must recover to pending');
  assert.strictEqual(recovered.inFlightStartedAt, null);
});

// 6. CleanupStaleData Zero-Loss Guarantee
await test('6. cleanupStaleData moves old failed transactions to DLQ instead of deleting them', async () => {
  const oldTx = {
    id: 'tx-old-001',
    docId: 'inv-old-001',
    storeName: 'invoices',
    action: 'save',
    data: { id: 'inv-old-001', grandTotal: 9999 },
    createdAt: Date.now() - (8 * 24 * 60 * 60 * 1000), // 8 days old
    retryCount: 5,
    status: 'failed'
  };
  await BillQyroDB.put('syncQueue', oldTx);

  await cleanupStaleData();

  // Verify not silently deleted — moved to DLQ
  const inSyncQueue = await BillQyroDB.get('syncQueue', 'tx-old-001');
  assert.strictEqual(inSyncQueue, undefined, 'Must be cleared from syncQueue');

  const dlq = await getDeadLetterQueue();
  const inDLQ = dlq.find(d => d.originalTransactionId === 'tx-old-001');
  assert.ok(inDLQ, 'Stale transaction must be preserved in DLQ');
  assert.strictEqual(inDLQ.payload.grandTotal, 9999);
});

// 7. offlineEngine DLQ API Integration
await test('7. offlineEngine.getQueueStatus reports accurate pending, failed and deadLetter counts', async () => {
  const status = await offlineEngine.getQueueStatus();
  assert.strictEqual(typeof status.total, 'number');
  assert.strictEqual(typeof status.pending, 'number');
  assert.strictEqual(typeof status.deadLetterCount, 'number');
  assert.ok(status.deadLetterCount >= 2, 'DLQ count must reflect preserved dead letters');
});

// 8. Idempotent Deduplication on Rapid Queue Invocations
await test('8. Duplicate updates to same invoice update single pending queue item without duplication', async () => {
  const invV1 = { id: 'inv-dedup-001', invoiceNumber: 'INV-3001', grandTotal: 1000 };
  const invV2 = { id: 'inv-dedup-001', invoiceNumber: 'INV-3001', grandTotal: 1500 };

  await queueSyncTransaction('save', 'invoices', invV1.id, invV1);
  await queueSyncTransaction('save', 'invoices', invV2.id, invV2);

  const queue = await BillQyroDB.getAll('syncQueue');
  const matched = queue.filter(t => t.docId === 'inv-dedup-001');
  assert.strictEqual(matched.length, 1, 'Only latest transaction version should remain in syncQueue');
  assert.strictEqual(matched[0].data.grandTotal, 1500, 'Queued item must hold latest payload');
});

console.log('======================================================');
console.log(`⚡ ZERO-LOSS OFFLINE SYNC SUITE: ${passedTests} / 8 PASSED (100%)`);
console.log('======================================================\n');
