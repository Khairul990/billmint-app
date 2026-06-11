import { db, firebaseReady, auth } from './firebaseConfig';
import { doc, setDoc, onSnapshot, collection } from 'firebase/firestore';
import { BillQyroDB } from './localDb';
import { KEYS, updateLocalCache } from './dbEngine'; // We'll export updateLocalCache from dbEngine or just implement here

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
  
  // If cloud is equal or newer, cloud wins. We trust the central server.
  return cloudTime >= localTime;
};

// Push an update explicitly as a user action (bypasses loop)
export const pushDataUpdate = async (collectionName, userId, docId, data) => {
  if (!firebaseReady || !navigator.onLine || !userId) return false;
  
  const payload = {
    ...data,
    updatedAt: new Date().toISOString(),
    updatedByDeviceId: getDeviceId(),
  };

  try {
    let docRef;
    if (collectionName === 'settings' || collectionName === 'subscription') {
      docRef = doc(db, collectionName, userId);
    } else {
      docRef = doc(db, collectionName, userId, 'items', docId);
    }
    
    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (e) {
    console.error(`[SYNC ENGINE] Failed to push update to ${collectionName}:`, e);
    return false;
  }
};

let unsubscribes = [];

export const startRealTimeSync = (userId, onSettingsUpdated) => {
  if (!firebaseReady || !userId) return;

  console.log('[SYNC ENGINE] Starting real-time sync for user:', userId);

  // Clear previous listeners
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];

  const deviceId = getDeviceId();

  // Settings Listener
  const settingsUnsub = onSnapshot(doc(db, 'settings', userId), (docSnap) => {
    if (docSnap.exists()) {
      const cloudSettings = docSnap.data();
      const localSettingsStr = localStorage.getItem(KEYS.SETTINGS);
      let localSettings = localSettingsStr ? JSON.parse(localSettingsStr) : null;

      // Check if this update originated from us just now, we can skip merging if it's identical
      // But actually, Last Update Wins applies.
      if (cloudWins(localSettings, cloudSettings)) {
        console.log('[SYNC ENGINE] Cloud Settings applied.');
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(cloudSettings));
        if (onSettingsUpdated) onSettingsUpdated(cloudSettings);
        window.dispatchEvent(new CustomEvent('billqyro_sync_settings', { detail: cloudSettings }));
      }
    }
  });
  unsubscribes.push(settingsUnsub);

  const syncCollection = (collectionName, storageKey) => {
    const colRef = collection(db, collectionName, userId, 'items');
    const unsub = onSnapshot(colRef, async (snapshot) => {
      const localItemsStr = localStorage.getItem(storageKey);
      let localItems = localItemsStr ? JSON.parse(localItemsStr) : [];
      let changed = false;

      snapshot.forEach(docSnap => {
        const cloudData = docSnap.data();
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
        window.dispatchEvent(new CustomEvent('billqyro_sync'));
      }
    });
    unsubscribes.push(unsub);
  };

  syncCollection('invoices', KEYS.INVOICES);
  syncCollection('customers', KEYS.CUSTOMERS);
  syncCollection('products', KEYS.PRODUCTS);
  syncCollection('expenses', KEYS.EXPENSES);
};

export const stopRealTimeSync = () => {
  unsubscribes.forEach(unsub => unsub());
  unsubscribes = [];
};
