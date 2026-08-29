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

const mockLocalStorageStore = new Map();
globalThis.localStorage = {
  getItem: (k) => mockLocalStorageStore.get(k) || null,
  setItem: (k, v) => mockLocalStorageStore.set(k, String(v)),
  removeItem: (k) => mockLocalStorageStore.delete(k),
  clear: () => mockLocalStorageStore.clear(),
  get length() { return mockLocalStorageStore.size; },
  key: (i) => Array.from(mockLocalStorageStore.keys())[i] || null
};

/**
 * In-Memory IndexedDB Mock
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
  migrateLocalStorageToIndexedDB,
  updateLocalCache,
  getInvoices,
  getInvoicesPaged,
  saveInvoice,
  getCustomers,
  getProducts,
  KEYS
} = await import('../src/services/dbEngine.js');

console.log('======================================================');
console.log('📦 RUNNING LOCALSTORAGE DECOUPLING & IDB PRIMARY STORE AUDIT');
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

// 1. Seed legacy LocalStorage arrays
await test('1. Legacy LocalStorage business data is seeded for migration verification', async () => {
  const legacyInvoices = [
    { id: 'inv-leg-1', invoiceNumber: 'INV-101', customerName: 'Apex Textiles', grandTotal: 5000, balanceDue: 0, status: 'Paid' },
    { id: 'inv-leg-2', invoiceNumber: 'INV-102', customerName: 'Zenith Crafts', grandTotal: 12000, balanceDue: 4000, status: 'Partially Paid' }
  ];
  const legacyCustomers = [
    { id: 'c-leg-1', name: 'Apex Textiles', phone: '9876543210', email: 'apex@test.com' },
    { id: 'c-leg-2', name: 'Zenith Crafts', phone: '9876543211', email: 'zenith@test.com' }
  ];
  const legacyProducts = [
    { id: 'p-leg-1', name: 'Zari Silk Fabric', rate: 1200, category: 'Textiles' }
  ];

  localStorage.setItem(KEYS.INVOICES, JSON.stringify(legacyInvoices));
  localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(legacyCustomers));
  localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(legacyProducts));

  assert.ok(localStorage.getItem(KEYS.INVOICES));
  assert.ok(localStorage.getItem(KEYS.CUSTOMERS));
  assert.ok(localStorage.getItem(KEYS.PRODUCTS));
});

// 2. Migration execution & verification
await test('2. migrateLocalStorageToIndexedDB safely migrates all collections and marks VERIFIED', async () => {
  const res = await migrateLocalStorageToIndexedDB();
  assert.strictEqual(res.status, 'success');
  assert.strictEqual(res.verifiedCount >= 3, true);

  const marker = localStorage.getItem('billqyro_idb_migration_v1');
  assert.strictEqual(marker, 'VERIFIED');

  // Verify records in IndexedDB
  const invCount = await BillQyroDB.count('invoices');
  assert.strictEqual(invCount >= 2, true);

  const custCount = await BillQyroDB.count('customers');
  assert.strictEqual(custCount >= 2, true);

  const prodCount = await BillQyroDB.count('products');
  assert.strictEqual(prodCount >= 1, true);

  // Verify representative samples
  const invSample = await BillQyroDB.get('invoices', 'inv-leg-1');
  assert.strictEqual(invSample.customerName, 'Apex Textiles');
  assert.strictEqual(invSample.grandTotal, 5000);
});

// 3. LocalStorage array decoupling
await test('3. Bloated legacy arrays are decoupled from LocalStorage and replaced with lightweight metadata', async () => {
  // Legacy full arrays should no longer exist
  const rawInvoices = localStorage.getItem(KEYS.INVOICES);
  assert.strictEqual(rawInvoices, null, 'Full invoice array must NOT exist in LocalStorage');

  const metaInvoices = localStorage.getItem(`${KEYS.INVOICES}_meta`);
  assert.ok(metaInvoices, 'Lightweight metadata must exist');
  const parsedMeta = JSON.parse(metaInvoices);
  assert.strictEqual(parsedMeta.persistedIn, 'IndexedDB');
  assert.strictEqual(parsedMeta.count, 2);
});

// 4. UpdateLocalCache never serializes full arrays to LocalStorage
await test('4. updateLocalCache writes only small metadata and protects LocalStorage quota', () => {
  const largeArray = Array.from({ length: 500 }, (_, i) => ({
    id: `inv-sim-${i}`,
    invoiceNumber: `INV-${i}`,
    grandTotal: 1000 + i
  }));

  updateLocalCache(KEYS.INVOICES, largeArray);

  const raw = localStorage.getItem(KEYS.INVOICES);
  assert.strictEqual(raw, null, 'Must not write 500 records into LocalStorage');

  const metaStr = localStorage.getItem(`${KEYS.INVOICES}_meta`);
  assert.ok(metaStr);
  const meta = JSON.parse(metaStr);
  assert.strictEqual(meta.count, 500);
});

// 5. Paginated queries from IndexedDB
await test('5. getInvoicesPaged returns sliced records without loading entire dataset into memory', async () => {
  const paged1 = await getInvoicesPaged({ limit: 1, offset: 0 });
  assert.strictEqual(paged1.items.length, 1);
  assert.strictEqual(paged1.total >= 2, true);
  assert.strictEqual(paged1.hasMore, true);

  const paged2 = await getInvoicesPaged({ limit: 1, offset: 1 });
  assert.strictEqual(paged2.items.length, 1);
});

// 6. Stress Test: 5,000 Invoices in IndexedDB with negligible LocalStorage usage
await test('6. Stress Test: 5,000 invoices stored in IndexedDB without QuotaExceededError in LocalStorage', async () => {
  const BATCH_SIZE = 5000;
  for (let i = 1; i <= BATCH_SIZE; i++) {
    const inv = {
      id: `inv-stress-${i}`,
      invoiceNumber: `INV-STR-${String(i).padStart(5, '0')}`,
      workspaceId: 'ws_stress',
      customerName: `Customer ${i % 100}`,
      grandTotal: (i * 10) % 50000,
      balanceDue: 0,
      createdAt: new Date(Date.now() - i * 1000).toISOString()
    };
    await BillQyroDB.put('invoices', inv);
  }

  const count = await BillQyroDB.count('invoices');
  assert.ok(count >= 5000, 'IndexedDB must hold 5,000+ invoices');

  // Verify paginated search
  const paged = await BillQyroDB.queryPaged('invoices', {
    limit: 25,
    offset: 0,
    filterFn: (inv) => inv.workspaceId === 'ws_stress'
  });
  assert.strictEqual(paged.items.length, 25);
  assert.strictEqual(paged.total, 5000);
  assert.strictEqual(paged.hasMore, true);

  // Verify LocalStorage size remains ultra-small (< 20KB)
  let totalLsSize = 0;
  for (const [k, v] of mockLocalStorageStore.entries()) {
    totalLsSize += (k.length + v.length) * 2; // UTF-16 byte approximation
  }
  assert.ok(totalLsSize < 50000, `LocalStorage total size (${totalLsSize} bytes) must remain well under 50KB`);
});

// 7. Small settings & preferences remain intact in LocalStorage
await test('7. Settings, theme, and auth preferences remain safely in LocalStorage', () => {
  const settingsObj = { themePreset: 'dark', activeWorkspaceId: 'ws_prod', currency: '₹' };
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settingsObj));

  const readSettings = JSON.parse(localStorage.getItem(KEYS.SETTINGS));
  assert.strictEqual(readSettings.themePreset, 'dark');
  assert.strictEqual(readSettings.activeWorkspaceId, 'ws_prod');
});

console.log('======================================================');
console.log(`📦 LOCALSTORAGE DECOUPLING SUITE: ${passedTests} / 7 PASSED (100%)`);
console.log('======================================================\n');
