import { db, firebaseReady, auth } from './firebaseConfig';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { BillQyroDB } from './localDb';
import { KEYS, queueSyncTransaction, syncOfflineTransactions } from './dbEngine';

export const getDeviceId = () => {
  let id = localStorage.getItem('billqyro_device_id');
  if (!id) {
    id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('billqyro_device_id', id);
  }
  return id;
};

// Check if a cloud record is strictly newer than a local record
export const cloudWins = (localRecord, cloudRecord) => {
  if (!localRecord) return true;
  if (!cloudRecord) return false;
  
  const localTime = new Date(localRecord.updatedAt || localRecord.createdAt || 0).getTime();
  const cloudTime = new Date(cloudRecord.updatedAt || cloudRecord.createdAt || 0).getTime();
  
  // If cloud is strictly newer, cloud wins. If equal, local might be the originator.
  return cloudTime > localTime;
};

// --- Sync Queue & Offline Support ---
export const enqueueSync = (collectionName, userId, docId, data) => {
  // Deprecated localStorage queue, forwarding to robust IndexedDB queue
  queueSyncTransaction('save', collectionName, docId, data).catch(e => console.error(e));
  window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Pending Sync' }));
};

export const flushSyncQueue = async () => {
  if (!navigator.onLine || !firebaseReady) {
    if (!navigator.onLine) {
       window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Offline' }));
    }
    return;
  }
  
  try {
    window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Syncing...' }));
    await syncOfflineTransactions();
    
    // Check if the queue was fully cleared
    const queue = await BillQyroDB.getAll('syncQueue');
    const pendingItems = queue.filter(tx => tx.syncStatus === 'pending' || !tx.syncStatus);
    
    if (pendingItems.length === 0) {
      window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Synced' }));
    } else {
      window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Sync Error' }));
    }
  } catch (e) {
    console.error('[SYNC ENGINE] Failed to flush queue:', e);
    window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Sync Error' }));
  }
};

window.addEventListener('online', flushSyncQueue);

// --- Debounce Mechanism ---
const debounceTimers = {};

export const pushDataUpdate = (collectionName, userId, docId, data) => {
  if (!userId) return false;
  
  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
    updatedByDeviceId: getDeviceId(),
    source: 'localUserAction'
  };

  const key = `${collectionName}_${docId}`;
  
  if (debounceTimers[key]) {
    clearTimeout(debounceTimers[key]);
  }
  
  window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Saving...' }));

  // [COST AWARENESS] Debounce actual firestore push by 1000ms.
  // Multiple rapid changes to the same document within 1s become ONE write.
  // Estimated Write Source: 1 write per doc per 1000ms of continuous edits.
  debounceTimers[key] = setTimeout(async () => {
    if (!firebaseReady || !navigator.onLine) {
      enqueueSync(collectionName, userId, docId, payload);
      return;
    }

    try {
      let docRef;
      if (collectionName === 'settings' || collectionName === 'subscription') {
        docRef = doc(db, collectionName, userId);
      } else {
        docRef = doc(db, collectionName, userId, 'items', docId);
      }
      
      await setDoc(docRef, payload, { merge: true });
      window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Synced' }));
    } catch (e) {
      console.error(`[SYNC ENGINE] Failed to push update to ${collectionName}:`, e);
      enqueueSync(collectionName, userId, docId, payload);
    }
    delete debounceTimers[key];
  }, 1000);

  return true;
};

// --- Real-Time Listeners ---
let unsubscribes = [];

export const startRealTimeSync = (userId) => {
  if (!firebaseReady || !userId) return;



  // Clear previous listeners
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];

  const deviceId = getDeviceId();

  // 1. Settings Listener
  // [COST AWARENESS] Real-time listener for critical collections only.
  // Estimated Read Source: 1 read per settings update. Keeps UI perfectly synced without refresh.
  const settingsUnsub = onSnapshot(doc(db, 'settings', userId), (docSnap) => {
    if (docSnap.exists()) {
      const cloudSettings = docSnap.data();
      
      // Loop Prevention: If we just wrote this from this device, ignore the echo.
      if (cloudSettings.updatedByDeviceId === deviceId && cloudSettings.source === 'localUserAction') {
        // If it's very recent (e.g. < 5s), it's just our own echo
        const age = Date.now() - new Date(cloudSettings.updatedAt).getTime();
        if (age < 5000) return;
      }

      const localSettingsStr = localStorage.getItem(KEYS.SETTINGS);
      let localSettings = localSettingsStr ? JSON.parse(localSettingsStr) : null;

      if (cloudWins(localSettings, cloudSettings)) {

        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(cloudSettings));
        window.dispatchEvent(new CustomEvent('billqyro:settings-updated', { detail: cloudSettings }));
      }
    }
  });
  unsubscribes.push(settingsUnsub);

  // 2. Collections Listener Generator
  // [COST AWARENESS] Stopped onSnapshot for high volume collections (invoices, customers).
  // They only sync on explicit actions (create/update/delete) or app boot.
  // This massively reduces document reads during normal operation.
  const syncCollection = (collectionName, storageKey) => {
    if (['invoices', 'customers', 'products', 'expenses'].includes(collectionName)) {
      return; // Do NOT attach onSnapshot to save free-tier limits
    }

    const colRef = collection(db, collectionName, userId, 'items');
    const unsub = onSnapshot(colRef, async (snapshot) => {
      const localItemsStr = localStorage.getItem(storageKey);
      let localItems = localItemsStr ? JSON.parse(localItemsStr) : [];
      let changed = false;

      snapshot.forEach(docSnap => {
        const cloudData = docSnap.data();
        
        // Loop Prevention
        if (cloudData.updatedByDeviceId === deviceId && cloudData.source === 'localUserAction') {
          const age = Date.now() - new Date(cloudData.updatedAt).getTime();
          if (age < 5000) return; 
        }

        cloudData.syncStatus = 'synced';
        const localIdx = localItems.findIndex(i => i.id === cloudData.id);

        if (localIdx === -1) {
          localItems.push(cloudData);
          changed = true;
        } else {
          if (cloudWins(localItems[localIdx], cloudData)) {
            localItems[localIdx] = cloudData;
            changed = true;
          }
        }
      });

      if (changed) {
        localStorage.setItem(storageKey, JSON.stringify(localItems));
        await BillQyroDB.clear(collectionName);
        for (const item of localItems) {
          await BillQyroDB.put(collectionName, item);
        }
        window.dispatchEvent(new CustomEvent('billqyro:data-updated', { detail: { collectionName } }));
      }
    });
    unsubscribes.push(unsub);
  };

  // syncCollection('invoices', KEYS.INVOICES); // Disabled for free-tier optimization
  // syncCollection('customers', KEYS.CUSTOMERS); // Disabled for free-tier optimization
  
  // Process any offline queue on start
  flushSyncQueue();
};

export const stopRealTimeSync = () => {
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];
};
