import { db, firebaseReady, auth } from './firebaseConfig';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { BillQyroDB } from './localDb';
import { KEYS } from './dbEngine';

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
const SYNC_QUEUE_KEY = 'billqyro_sync_queue';

const getQueue = () => {
  const q = localStorage.getItem(SYNC_QUEUE_KEY);
  return q ? JSON.parse(q) : [];
};

const saveQueue = (q) => {
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(q));
};

export const enqueueSync = (collectionName, userId, docId, data) => {
  const q = getQueue();
  // Remove existing pending update for same doc to avoid duplicates
  const filtered = q.filter(item => !(item.collectionName === collectionName && item.docId === docId));
  filtered.push({ collectionName, userId, docId, data, timestamp: Date.now() });
  saveQueue(filtered);
  window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Pending Sync' }));
};

export const flushSyncQueue = async () => {
  if (!navigator.onLine || !firebaseReady) {
    if (!navigator.onLine) {
       window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Offline' }));
    }
    return;
  }
  
  const q = getQueue();
  if (q.length === 0) return;
  
  console.log(`[SYNC ENGINE] Flushing Queue. Length: ${q.length}`);
  let successCount = 0;
  window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Syncing...' }));
  
  const remaining = [];
  for (const item of q) {
    try {
      let docRef;
      if (item.collectionName === 'settings' || item.collectionName === 'subscription') {
        docRef = doc(db, item.collectionName, item.userId);
      } else {
        docRef = doc(db, item.collectionName, item.userId, 'items', item.docId);
      }
      await setDoc(docRef, item.data, { merge: true });
      successCount++;
    } catch (e) {
      console.error(`[SYNC ENGINE] Failed to process queue item for ${item.collectionName}. Reason:`, e);
      remaining.push(item);
    }
  }
  
  saveQueue(remaining);
  if (remaining.length === 0) {
    window.dispatchEvent(new CustomEvent('billqyro:sync-status', { detail: 'Synced' }));
  } else {
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

  // Debounce actual firestore push by 300ms
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
  }, 300);

  return true;
};

// --- Real-Time Listeners ---
let unsubscribes = [];

export const startRealTimeSync = (userId) => {
  if (!firebaseReady || !userId) return;

  console.log('[SYNC ENGINE] Starting Real-Time Sync Pro for user:', userId);

  // Clear previous listeners
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];

  const deviceId = getDeviceId();

  // 1. Settings Listener
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
        console.log('[SYNC ENGINE] Cloud Settings applied instantly.');
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(cloudSettings));
        window.dispatchEvent(new CustomEvent('billqyro:settings-updated', { detail: cloudSettings }));
      }
    }
  });
  unsubscribes.push(settingsUnsub);

  // 2. Collections Listener Generator
  const syncCollection = (collectionName, storageKey) => {
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

  syncCollection('invoices', KEYS.INVOICES);
  syncCollection('customers', KEYS.CUSTOMERS);
  
  // Process any offline queue on start
  flushSyncQueue();
};

export const stopRealTimeSync = () => {
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];
};
