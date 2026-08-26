import { firebaseReady } from './firebaseConfig.js';
import { BillQyroDB } from './localDb.js';
import { syncOfflineTransactions } from './dbEngine.js';

// Background Sync Worker to push offline changes to Firebase
export const startBackgroundSync = async () => {
  if (!firebaseReady) return;

  await syncOfflineTransactions();

  const queue = await BillQyroDB.getAll('syncQueue');
  if (queue.length > 0) {
    const unsynced = queue.filter(tx => tx.status === 'pending' || !tx.status);
    if (unsynced.length === 0) {
      await BillQyroDB.clear('syncQueue');
    }
  }
};
