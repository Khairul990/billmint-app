import { BillQyroDB } from './localDb.js';
import {
  enqueueSync,
  flushSyncQueue,
  syncOfflineTransactions,
  startRealTimeSync as dbStartRealTimeSync,
  stopRealTimeSync as dbStopRealTimeSync,
  cloudWins,
  getDeviceId,
  getDeadLetterQueue,
  retryDeadLetterTransaction,
  retryAllDeadLetterTransactions
} from './dbEngine.js';
import { startBackgroundSync } from './syncWorker.js';

export const offlineEngine = {
  async getQueueStatus() {
    try {
      const queue = await BillQyroDB.getAll('syncQueue');
      const dlq = await BillQyroDB.getAll('deadLetterQueue').catch(() => []);
      const pending = queue.filter(tx => tx.status === 'pending' || !tx.status);
      const inFlight = queue.filter(tx => tx.status === 'in_flight');
      const failed = queue.filter(tx => tx.status === 'failed');
      const completed = queue.filter(tx => tx.status === 'completed');
      return {
        total: queue.length,
        pending: pending.length,
        inFlight: inFlight.length,
        failed: failed.length,
        completed: completed.length,
        deadLetterCount: dlq.length,
        items: queue,
        deadLetters: dlq
      };
    } catch (e) {
      console.error('[Offline Engine] getQueueStatus failed:', e);
      return { total: 0, pending: 0, inFlight: 0, failed: 0, completed: 0, deadLetterCount: 0, items: [], deadLetters: [] };
    }
  },

  async getDeadLetterQueue() {
    return getDeadLetterQueue();
  },

  async retryDeadLetter(id) {
    return retryDeadLetterTransaction(id);
  },

  async retryAllDeadLetters() {
    return retryAllDeadLetterTransactions();
  },

  async enqueue(operation, collection, docId, data) {
    await enqueueSync(operation, collection, docId, data);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('billqyro_sync'));
  },

  async flushQueue() {
    return flushSyncQueue();
  },

  async syncNow() {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return { status: 'offline', message: 'Device is offline' };
    try {
      await syncOfflineTransactions();
      await startBackgroundSync();
      return { status: 'synced' };
    } catch (e) {
      console.error('[Offline Engine] syncNow failed:', e);
      return { status: 'error', message: e.message };
    }
  },

  startSync(listeners) {
    return dbStartRealTimeSync(listeners);
  },

  stopSync() {
    dbStopRealTimeSync();
  },

  detectConflict(local, cloud) {
    return cloudWins(local, cloud);
  },

  isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },

  getDeviceId() {
    return getDeviceId();
  },

  async getRetryStats() {
    const last = typeof localStorage !== 'undefined' ? localStorage.getItem('billqyro_last_sync_attempt') : 'never';
    return { lastAttempt: last || 'never', deviceId: getDeviceId() };
  }
};
