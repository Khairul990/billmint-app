import { db, firebaseReady } from './firebaseConfig';
import { BillQyroDB } from './localDb';
import { syncOfflineTransactions } from './dbEngine';

// Background Sync Worker to push offline changes to Firebase
export const startBackgroundSync = async () => {
  if (!firebaseReady) return;

  await syncOfflineTransactions();

  const queue = await BillQyroDB.getAll('syncQueue');
  if (queue.length > 0) {
    const unsynced = queue.filter(tx => tx.syncStatus === 'pending');
    if (unsynced.length === 0) {
      await BillQyroDB.clear('syncQueue');
    }
  }
};
