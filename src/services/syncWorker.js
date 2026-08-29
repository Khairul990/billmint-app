import { firebaseReady } from './firebaseConfig.js';
import { syncOfflineTransactions } from './dbEngine.js';

// Background Sync Worker to push offline changes to Firebase safely
export const startBackgroundSync = async () => {
  if (!firebaseReady) return;
  await syncOfflineTransactions();
};
