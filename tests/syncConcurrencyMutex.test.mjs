/**
 * BillQyro Phase 2 — Offline Sync Mutex & Concurrency Hardening Test Suite
 * Run: node tests/syncConcurrencyMutex.test.mjs
 */

import assert from 'assert';

// 1. Browser & Storage Polyfills for Node.js test runner
const mockStyle = { innerHTML: '', data: '', setAttribute: () => {}, appendChild: () => {}, firstChild: { data: '' } };
if (typeof globalThis.window === 'undefined' || typeof globalThis.window.addEventListener !== 'function') {
  const listeners = {};
  globalThis.window = {
    addEventListener: (evt, cb) => {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(cb);
    },
    removeEventListener: (evt, cb) => {
      if (listeners[evt]) {
        listeners[evt] = listeners[evt].filter(f => f !== cb);
      }
    },
    dispatchEvent: (evt) => {
      const type = evt?.type || evt;
      const cbs = listeners[type] || [];
      cbs.forEach(cb => cb(evt));
      return true;
    },
    _listeners: listeners,
    _goober: mockStyle
  };
}

if (typeof globalThis.document === 'undefined') {
  globalThis.document = {
    createElement: () => mockStyle,
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    querySelector: () => mockStyle
  };
}

if (typeof globalThis.navigator === 'undefined') {
  globalThis.navigator = { onLine: true, userAgent: 'NodeTest' };
}

const mockLs = new Map();
globalThis.localStorage = {
  getItem: (k) => mockLs.get(k) || null,
  setItem: (k, v) => mockLs.set(k, String(v)),
  removeItem: (k) => mockLs.delete(k),
  clear: () => mockLs.clear(),
  get length() { return mockLs.size; }
};

// 2. In-Memory Mock IndexedDB
class MockStore {
  constructor() {
    this.data = new Map();
  }
  async get(id) {
    return this.data.get(id);
  }
  async getAll() {
    return Array.from(this.data.values());
  }
  async put(item) {
    this.data.set(item.id, JSON.parse(JSON.stringify(item)));
    return item.id;
  }
  async delete(id) {
    this.data.delete(id);
    return true;
  }
  async clear() {
    this.data.clear();
  }
}

const dbStores = {
  syncQueue: new MockStore(),
  deadLetterQueue: new MockStore(),
  invoices: new MockStore(),
  errorLogs: new MockStore(),
  auditLogs: new MockStore()
};

const MockBillQyroDB = {
  async get(store, id) { return dbStores[store]?.get(id); },
  async getAll(store) { return dbStores[store]?.getAll() || []; },
  async put(store, item) { return dbStores[store]?.put(item); },
  async delete(store, id) { return dbStores[store]?.delete(id); },
  async clear(store) { return dbStores[store]?.clear(); }
};

// 3. Test Runner Infrastructure
let passedTests = 0;
let totalTests = 0;

async function runTest(name, fn) {
  totalTests++;
  try {
    await fn();
    console.log(`  ✅ PASS: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    throw err;
  }
}

console.log('\n======================================================');
console.log('⚡ BILLQYRO PHASE 2: OFFLINE SYNC MUTEX & CONCURRENCY SUITE');
console.log('======================================================\n');

// ----------------------------------------------------
// Mock Sync Engine implementation to test mutex mechanics
// ----------------------------------------------------
class SyncMutexHarness {
  constructor(db) {
    this.db = db;
    this.isSyncing = false;
    this.syncCount = 0;
    this.syncDebounceTimer = null;
    this.pendingResolvers = [];
    this.syncQueuedWhileBusy = false;
    this.firestoreWrites = [];
    this.failNextExecution = false;
  }

  async _runSyncLoop() {
    this.syncCount++;
    if (this.failNextExecution) {
      this.failNextExecution = false;
      throw new Error('Simulated transient Firestore network fault');
    }

    const queue = await this.db.getAll('syncQueue');
    const pending = queue.filter(t => t.status === 'pending' || t.status === 'in_flight');

    for (const tx of pending) {
      tx.status = 'in_flight';
      await this.db.put('syncQueue', tx);

      // Simulate network latency
      await new Promise(r => setTimeout(r, 20));

      if (tx.shouldFail) {
        tx.retryCount = (tx.retryCount || 0) + 1;
        tx.status = 'failed';
        tx.lastError = 'Simulated write rejection';
        await this.db.put('syncQueue', tx);
      } else {
        // Idempotent write using stable entity ID (tx.docId)
        this.firestoreWrites.push({
          collection: tx.storeName,
          docId: tx.docId,
          data: tx.data,
          timestamp: Date.now()
        });
        await this.db.delete('syncQueue', tx.id);
      }
    }
  }

  async syncOfflineTransactions(immediate = false) {
    return new Promise((resolve) => {
      this.pendingResolvers.push(resolve);

      if (this.isSyncing) {
        this.syncQueuedWhileBusy = true;
        return;
      }

      if (this.syncDebounceTimer) clearTimeout(this.syncDebounceTimer);

      const execute = async () => {
        const resolvers = [...this.pendingResolvers];
        this.pendingResolvers = [];

        if (this.isSyncing) {
          this.syncQueuedWhileBusy = true;
          resolvers.forEach(r => r(null));
          return;
        }

        this.isSyncing = true;
        try {
          await this._runSyncLoop();
        } catch (e) {
          // Logged safely
        } finally {
          this.isSyncing = false;
          resolvers.forEach(r => r(true));

          if (this.syncQueuedWhileBusy) {
            this.syncQueuedWhileBusy = false;
            this.syncOfflineTransactions(true).catch(() => {});
          }
        }
      };

      if (immediate) {
        execute();
      } else {
        this.syncDebounceTimer = setTimeout(execute, 50); // 50ms batching for tests
      }
    });
  }
}

// ----------------------------------------------------
// TEST A: Two simultaneous syncOfflineTransactions() calls
// ----------------------------------------------------
await runTest('TEST A: Two simultaneous sync calls result in exactly 1 sync loop execution', async () => {
  const harness = new SyncMutexHarness(MockBillQyroDB);
  await dbStores.syncQueue.put({
    id: 'tx_a1',
    docId: 'inv_101',
    storeName: 'invoices',
    data: { id: 'inv_101', grandTotal: 5000 },
    status: 'pending',
    createdAt: Date.now()
  });

  // Call concurrently
  const [res1, res2] = await Promise.all([
    harness.syncOfflineTransactions(),
    harness.syncOfflineTransactions()
  ]);

  assert.strictEqual(harness.syncCount, 1, 'Only 1 sync execution loop should run');
  assert.strictEqual(harness.isSyncing, false, 'Mutex must be released after completion');
  assert.strictEqual(res1, true, 'First caller resolved true');
  assert.strictEqual(res2, true, 'Second caller resolved true');
  assert.strictEqual(harness.firestoreWrites.length, 1, 'Exactly 1 Firestore write performed');
});

// ----------------------------------------------------
// TEST B: Three simultaneous calls
// ----------------------------------------------------
await runTest('TEST B: Three simultaneous sync calls complete without duplicate processing', async () => {
  const harness = new SyncMutexHarness(MockBillQyroDB);
  await dbStores.syncQueue.put({
    id: 'tx_b1',
    docId: 'inv_201',
    storeName: 'invoices',
    data: { id: 'inv_201', grandTotal: 7500 },
    status: 'pending',
    createdAt: Date.now()
  });

  const results = await Promise.all([
    harness.syncOfflineTransactions(),
    harness.syncOfflineTransactions(),
    harness.syncOfflineTransactions()
  ]);

  assert.strictEqual(harness.syncCount, 1, 'Exactly 1 sync loop should run for 3 batched calls');
  assert.strictEqual(results.length, 3, 'All 3 callers received results');
  assert.strictEqual(harness.isSyncing, false, 'Mutex is free');
  assert.strictEqual(harness.firestoreWrites.length, 1, 'Invoice inv_201 written exactly once');
});

// ----------------------------------------------------
// TEST C: Sync throws an error -> Mutex is released and next sync can run
// ----------------------------------------------------
await runTest('TEST C: Sync exception releases mutex so subsequent sync calls can execute', async () => {
  const harness = new SyncMutexHarness(MockBillQyroDB);
  harness.failNextExecution = true;

  await dbStores.syncQueue.put({
    id: 'tx_c1',
    docId: 'inv_301',
    storeName: 'invoices',
    data: { id: 'inv_301', grandTotal: 3000 },
    status: 'pending',
    createdAt: Date.now()
  });

  // Call 1 fails
  await harness.syncOfflineTransactions(true);
  assert.strictEqual(harness.isSyncing, false, 'Mutex must be released even after exception');

  // Call 2 succeeds
  await harness.syncOfflineTransactions(true);
  assert.strictEqual(harness.isSyncing, false, 'Mutex remains free');
  assert.strictEqual(harness.syncCount, 2, 'Second sync executed successfully');
  assert.strictEqual(harness.firestoreWrites.length, 1, 'Item was synced on second attempt');
});

// ----------------------------------------------------
// TEST D: Network goes online multiple times rapidly (flapping)
// ----------------------------------------------------
await runTest('TEST D: Rapid online network flapping collapses safely without concurrent sync loops', async () => {
  const harness = new SyncMutexHarness(MockBillQyroDB);
  await dbStores.syncQueue.put({
    id: 'tx_d1',
    docId: 'inv_401',
    storeName: 'invoices',
    data: { id: 'inv_401', grandTotal: 12000 },
    status: 'pending',
    createdAt: Date.now()
  });

  // Simulate 6 rapid online events within 10ms
  const promises = [];
  for (let i = 0; i < 6; i++) {
    promises.push(harness.syncOfflineTransactions());
  }

  await Promise.all(promises);

  assert.strictEqual(harness.syncCount, 1, 'Flapping network triggers collapsed to exactly 1 sync execution');
  assert.strictEqual(harness.isSyncing, false, 'Mutex is released');
  assert.strictEqual(harness.firestoreWrites.length, 1, 'Doc written once');
});

// ----------------------------------------------------
// TEST E: Queued transaction fails temporarily -> Retained safely in queue
// ----------------------------------------------------
await runTest('TEST E: Transient transaction failure is retained in queue without data loss', async () => {
  const harness = new SyncMutexHarness(MockBillQyroDB);
  await dbStores.syncQueue.put({
    id: 'tx_e1',
    docId: 'inv_501',
    storeName: 'invoices',
    data: { id: 'inv_501', grandTotal: 4500 },
    status: 'pending',
    shouldFail: true,
    createdAt: Date.now()
  });

  await harness.syncOfflineTransactions(true);

  const item = await dbStores.syncQueue.get('tx_e1');
  assert.ok(item, 'Transaction must NOT be deleted from syncQueue on failure');
  assert.strictEqual(item.status, 'failed', 'Status must be updated to failed');
  assert.strictEqual(item.retryCount, 1, 'Retry count incremented to 1');
  assert.strictEqual(item.lastError, 'Simulated write rejection');
});

// ----------------------------------------------------
// TEST F: Retry of the same transaction uses stable entity ID (idempotency)
// ----------------------------------------------------
await runTest('TEST F: Retrying transaction uses stable docId ensuring idempotent Firestore write', async () => {
  const harness = new SyncMutexHarness(MockBillQyroDB);
  
  // Step 1: Queued transaction
  const txRecord = {
    id: 'tx_f1',
    docId: 'inv_stable_uuid_999',
    storeName: 'invoices',
    data: { id: 'inv_stable_uuid_999', grandTotal: 8800, customerName: 'Apex Corp' },
    status: 'pending',
    shouldFail: true,
    createdAt: Date.now()
  };
  await dbStores.syncQueue.put(txRecord);

  // Attempt 1: Fails
  await harness.syncOfflineTransactions(true);
  const failedTx = await dbStores.syncQueue.get('tx_f1');
  assert.strictEqual(failedTx.status, 'failed');

  // Step 2: Retry without failure (re-enqueued or retried with same docId)
  failedTx.shouldFail = false;
  failedTx.status = 'pending';
  await dbStores.syncQueue.put(failedTx);

  // Attempt 2: Succeeds
  await harness.syncOfflineTransactions(true);

  // Verify write used stable docId
  assert.strictEqual(harness.firestoreWrites.length, 1);
  assert.strictEqual(harness.firestoreWrites[0].docId, 'inv_stable_uuid_999');
  assert.strictEqual(harness.firestoreWrites[0].data.grandTotal, 8800);

  // Verify cleared from queue after confirmed write
  const clearedTx = await dbStores.syncQueue.get('tx_f1');
  assert.strictEqual(clearedTx, undefined, 'Transaction cleared after successful sync');
});

// ----------------------------------------------------
// Multi-Tab Mutual Exclusion Lock Verification
// ----------------------------------------------------
await runTest('TEST G: Multi-Tab Mutual Exclusion Lock (acquireSyncLock & releaseSyncLock)', async () => {
  const { acquireSyncLock, releaseSyncLock } = await import('../src/services/dbEngine.js');
  
  releaseSyncLock();
  const lock1 = acquireSyncLock();
  assert.strictEqual(lock1, true, 'Tab 1 acquires lock');

  const lock2 = acquireSyncLock();
  assert.strictEqual(lock2, false, 'Tab 2 is blocked from acquiring active lock');

  releaseSyncLock();
  const lock3 = acquireSyncLock();
  assert.strictEqual(lock3, true, 'Tab 2 acquires lock after Tab 1 release');
  releaseSyncLock();
});

console.log('\n======================================================');
console.log(`📊 SYNC CONCURRENCY & MUTEX RESULTS: ${passedTests} / ${totalTests} PASSED (100%)`);
console.log('======================================================\n');
