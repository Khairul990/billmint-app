import { BillQyroDB } from './localDb';
import {
  enqueueSync,
  flushSyncQueue,
  syncOfflineTransactions,
  startRealTimeSync as dbStartRealTimeSync,
  stopRealTimeSync as dbStopRealTimeSync,
  cloudWins,
  getDeviceId
} from './dbEngine';
import { startBackgroundSync } from './syncWorker';

export const offlineEngine = {
  async getQueueStatus() {
    try {
      const queue = await BillQyroDB.getAll('syncQueue');
      const pending = queue.filter(tx => tx.status === 'pending' || !tx.status);
      const failed = queue.filter(tx => tx.status === 'failed');
      const completed = queue.filter(tx => tx.status === 'completed');
      return { total: queue.length, pending: pending.length, failed: failed.length, completed: completed.length, items: queue };
    } catch (e) {
      return { total: 0, pending: 0, failed: 0, completed: 0, items: [] };
    }
  },

  async enqueue(operation, collection, docId, data) {
    await enqueueSync(operation, collection, docId, data);
    window.dispatchEvent(new CustomEvent('billqyro_sync'));
  },

  async flushQueue() {
    return flushSyncQueue();
  },

  async syncNow() {
    if (!navigator.onLine) return { status: 'offline', message: 'Device is offline' };
    try {
      await syncOfflineTransactions();
      await startBackgroundSync();
      return { status: 'synced' };
    } catch (e) {
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
    return navigator.onLine;
  },

  getDeviceId() {
    return getDeviceId();
  },

  async getRetryStats() {
    return { lastAttempt: localStorage.getItem('billqyro_last_sync_attempt') || 'never', deviceId: getDeviceId() };
  }
};
