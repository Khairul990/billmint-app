/**
 * BillQyro Promise-based IndexedDB database wrapper.
 * Provides fast, offline-first asynchronous storage structures for larger data collections.
 * Version 11: Adds deadLetterQueue, pdfCache, and composite query indexes.
 */
const DB_NAME = 'billqyro-db';
const DB_VERSION = 11;

let _dbInstance = null;
let _dbOpenPromise = null;

export class BillQyroDB {
  static getSchemaVersion() {
    return DB_VERSION;
  }

  static open() {
    if (_dbInstance) return Promise.resolve(_dbInstance);
    if (_dbOpenPromise) return _dbOpenPromise;
    _dbOpenPromise = new Promise((resolve, reject) => {
      const idb = (typeof globalThis !== 'undefined' && globalThis.indexedDB ? globalThis.indexedDB : null) ||
                  (typeof window !== 'undefined' && window.indexedDB ? window.indexedDB : null);

      if (!idb || typeof idb.open !== 'function') {
        _dbOpenPromise = null;
        reject(new Error('IndexedDB is unavailable in this environment.'));
        return;
      }

      const request = idb.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        const transaction = event.target.transaction;

        const getOrCreateStore = (name, options = { keyPath: 'id' }) => {
          if (!db.objectStoreNames.contains(name)) {
            return db.createObjectStore(name, options);
          }
          return transaction.objectStore(name);
        };

        const ensureIndex = (store, indexName, keyPath, options = { unique: false }) => {
          if (!store.indexNames.contains(indexName)) {
            try {
              store.createIndex(indexName, keyPath, options);
            } catch (err) {
              console.warn(`[IndexedDB Migration] Could not create index ${indexName} on ${store.name}:`, err);
            }
          }
        };

        // 1. Core Data Stores
        const standardStores = [
          'invoices', 'customers', 'expenses', 'products', 'students',
          'bankLedger', 'bankCredit', 'appointments', 'orders', 'activities', 'announcements',
          'vendors', 'outsourceJobs', 'outsourcePayments', 'staff'
        ];

        standardStores.forEach((name) => {
          const store = getOrCreateStore(name, { keyPath: 'id' });
          ensureIndex(store, 'userId', 'userId', { unique: false });
          ensureIndex(store, 'workspaceId', 'workspaceId', { unique: false });
        });

        // 2. Invoices Specialized Indexes
        if (db.objectStoreNames.contains('invoices')) {
          const invStore = transaction.objectStore('invoices');
          ensureIndex(invStore, 'workspace_createdAt', ['workspaceId', 'createdAt'], { unique: false });
          ensureIndex(invStore, 'workspace_dueDate', ['workspaceId', 'dueDate'], { unique: false });
          ensureIndex(invStore, 'workspace_status', ['workspaceId', 'status'], { unique: false });
          ensureIndex(invStore, 'customerPhone', 'customerPhone', { unique: false });
          ensureIndex(invStore, 'publicToken', 'publicToken', { unique: false });
          ensureIndex(invStore, 'syncStatus', 'syncStatus', { unique: false });
        }

        // 3. Customers Specialized Indexes
        if (db.objectStoreNames.contains('customers')) {
          const custStore = transaction.objectStore('customers');
          ensureIndex(custStore, 'phone', 'phone', { unique: false });
          ensureIndex(custStore, 'name', 'name', { unique: false });
        }

        // 4. Sync Queue Store & Indexes
        const syncStore = getOrCreateStore('syncQueue', { keyPath: 'id' });
        ensureIndex(syncStore, 'userId', 'userId', { unique: false });
        ensureIndex(syncStore, 'workspaceId', 'workspaceId', { unique: false });
        ensureIndex(syncStore, 'status', 'status', { unique: false });
        ensureIndex(syncStore, 'createdAt', 'createdAt', { unique: false });
        ensureIndex(syncStore, 'retryCount', 'retryCount', { unique: false });

        // 5. Audit & Error Log Stores
        getOrCreateStore('auditLogs', { keyPath: 'id' });
        getOrCreateStore('errorLogs', { keyPath: 'id' });

        // 6. Dead Letter Queue Store (Zero-Loss Offline Safety)
        const dlqStore = getOrCreateStore('deadLetterQueue', { keyPath: 'id' });
        ensureIndex(dlqStore, 'failedAt', 'failedAt', { unique: false });
        ensureIndex(dlqStore, 'storeName', 'storeName', { unique: false });
        ensureIndex(dlqStore, 'originalTransactionId', 'originalTransactionId', { unique: false });
        ensureIndex(dlqStore, 'status', 'status', { unique: false });

        // 7. PDF Cache Store (Immutable PDF Caching Foundation)
        const pdfStore = getOrCreateStore('pdfCache', { keyPath: 'invoiceId' });
        ensureIndex(pdfStore, 'contentHash', 'contentHash', { unique: false });
        ensureIndex(pdfStore, 'version', 'version', { unique: false });
        ensureIndex(pdfStore, 'status', 'status', { unique: false });
        ensureIndex(pdfStore, 'workspaceId', 'workspaceId', { unique: false });
      };

      request.onsuccess = (event) => {
        _dbInstance = event.target.result;
        _dbInstance.onclose = () => { _dbInstance = null; _dbOpenPromise = null; };
        _dbInstance.onversionchange = () => { _dbInstance.close(); _dbInstance = null; _dbOpenPromise = null; };
        resolve(_dbInstance);
      };

      request.onblocked = () => {
        console.warn('[IndexedDB] Database upgrade blocked by another open tab. Please reload.');
      };

      request.onerror = (event) => {
        _dbOpenPromise = null;
        reject(event.target.error);
      };
    });
    return _dbOpenPromise;
  }

  static async isStoreAvailable(storeName) {
    const db = await this.open();
    return db.objectStoreNames.contains(storeName);
  }

  static async getAll(storeName) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const request = db.transaction(storeName, 'readonly').objectStore(storeName).getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } catch (error) { reject(error); }
    });
  }

  static async get(storeName, id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const request = db.transaction(storeName, 'readonly').objectStore(storeName).get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) { reject(error); }
    });
  }

  static async put(storeName, item) {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('billqyro_demo_session_active') === 'true') return item;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const request = db.transaction(storeName, 'readwrite').objectStore(storeName).put(item);
        request.onsuccess = () => resolve(item);
        request.onerror = () => reject(request.error);
      } catch (error) { reject(error); }
    });
  }

  static async delete(storeName, id) {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('billqyro_demo_session_active') === 'true') return true;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const request = db.transaction(storeName, 'readwrite').objectStore(storeName).delete(id);
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      } catch (error) { reject(error); }
    });
  }

  static async clear(storeName) {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('billqyro_demo_session_active') === 'true') return true;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const request = db.transaction(storeName, 'readwrite').objectStore(storeName).clear();
        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      } catch (error) { reject(error); }
    });
  }

  static async count(storeName) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const request = db.transaction(storeName, 'readonly').objectStore(storeName).count();
        request.onsuccess = () => resolve(request.result || 0);
        request.onerror = () => reject(request.error);
      } catch (error) { reject(error); }
    });
  }

  static async getByIndex(storeName, indexName, key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) { reject(error); }
    });
  }

  static async getAllByIndex(storeName, indexName, key) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      try {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const index = store.index(indexName);
        const request = key !== undefined ? index.getAll(key) : index.getAll();
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } catch (error) { reject(error); }
    });
  }

  static async queryPaged(storeName, { indexName = null, key = undefined, limit = 25, offset = 0, filterFn = null, sortFn = null } = {}) {
    let items = indexName
      ? await this.getAllByIndex(storeName, indexName, key)
      : await this.getAll(storeName);

    if (typeof filterFn === 'function') {
      items = items.filter(filterFn);
    }
    if (typeof sortFn === 'function') {
      items.sort(sortFn);
    }

    const total = items.length;
    const paginated = items.slice(offset, offset + limit);

    return {
      items: paginated,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    };
  }

  static close() {
    if (_dbInstance) {
      try { _dbInstance.close(); } catch (e) { /* ignore */ }
      _dbInstance = null;
    }
    _dbOpenPromise = null;
  }
}
