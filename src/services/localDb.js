/**
 * BillQyro Promise-based IndexedDB database wrapper.
 * Provides fast, offline-first asynchronous storage structures for larger data collections.
 */
const DB_NAME = 'billqyro-db';
const DB_VERSION = 3;

export class BillQyroDB {
  static open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        const addStoreIfMissing = (name) => {
          if (!db.objectStoreNames.contains(name)) {
            return db.createObjectStore(name, { keyPath: 'id' });
          }
          return null;
        };
        const addIndexes = (store) => {
          if (!store.indexNames.contains('userId')) {
            store.createIndex('userId', 'userId', { unique: false });
          }
          if (!store.indexNames.contains('workspaceId')) {
            store.createIndex('workspaceId', 'workspaceId', { unique: false });
          }
        };
        
        let store;
        store = addStoreIfMissing('invoices');
        if (store) addIndexes(store);
        if (!store && db.objectStoreNames.contains('invoices')) {
          const txn = event.target.transaction;
          addIndexes(txn.objectStore('invoices'));
        }
        
        store = addStoreIfMissing('customers');
        if (store) addIndexes(store);
        if (!store && db.objectStoreNames.contains('customers')) {
          const txn = event.target.transaction;
          addIndexes(txn.objectStore('customers'));
        }
        
        store = addStoreIfMissing('expenses');
        if (store) addIndexes(store);
        if (!store && db.objectStoreNames.contains('expenses')) {
          const txn = event.target.transaction;
          addIndexes(txn.objectStore('expenses'));
        }
        
        store = addStoreIfMissing('products');
        if (store) addIndexes(store);
        if (!store && db.objectStoreNames.contains('products')) {
          const txn = event.target.transaction;
          addIndexes(txn.objectStore('products'));
        }
        
        if (!db.objectStoreNames.contains('syncQueue')) {
          store = db.createObjectStore('syncQueue', { keyPath: 'id' });
          addIndexes(store);
        }
        if (!db.objectStoreNames.contains('auditLogs')) {
          db.createObjectStore('auditLogs', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('errorLogs')) {
          db.createObjectStore('errorLogs', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        reject(event.target.error);
      };
    });
  }

  static async getAll(storeName) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  static async get(storeName, id) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static async put(storeName, item) {
    if (localStorage.getItem('billqyro_demo_session_active') === 'true') return item;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(item);
      request.onerror = () => reject(request.error);
    });
  }

  static async delete(storeName, id) {
    if (localStorage.getItem('billqyro_demo_session_active') === 'true') return true;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  static async clear(storeName) {
    if (localStorage.getItem('billqyro_demo_session_active') === 'true') return true;
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }
}
