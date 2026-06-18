import { db, firebaseReady } from './firebaseConfig';
import { BillQyroDB } from './localDb';

// Background Sync Worker to push offline changes to Firebase
export const startBackgroundSync = () => {
  window.addEventListener('online', async () => {
    if (!firebaseReady) return;

    const queue = await BillQyroDB.getAll('syncQueue');
    if (queue.length > 0) {

      // Placeholder for full sync logic (will iterate over queue and push to firestore)
      // Then clear queue
      await BillQyroDB.clear('syncQueue');
    }
  });
};
