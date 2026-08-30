import { BillQyroDB } from '../localDb.js';
import { PostgresClient } from './postgresClient.js';
import { dualWriteConfig } from './dualWriteConfig.js';

// In-memory fallback queue for environments where IndexedDB is unavailable
const memoryQueue = new Map();

/**
 * Local queue for storing failed or deferred PostgreSQL mirror operations.
 * Retries operations via POST /api/v1/sync/batch with stable clientTxId.
 */
export class DualWriteQueue {
  /**
   * Enqueues a mirror operation to local queue.
   */
  static async enqueue({ clientTxId, entityType, docId, action, payload, workspaceId }) {
    const item = {
      id: clientTxId,
      clientTxId,
      entityType,
      docId,
      action: action || 'CREATE',
      payload: payload || {},
      workspaceId,
      retryCount: 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      if (typeof window !== 'undefined' && window.indexedDB) {
        await BillQyroDB.put('syncQueue', item);
      } else {
        memoryQueue.set(clientTxId, item);
      }
      dualWriteConfig.log('info', `Enqueued mirror operation: ${entityType}/${action}`, { clientTxId, entityType, docId });
      return { success: true, queued: true, clientTxId };
    } catch (err) {
      dualWriteConfig.log('error', `Failed to enqueue mirror operation`, { clientTxId, error: err.message });
      memoryQueue.set(clientTxId, item);
      return { success: false, queued: true, clientTxId, error: err.message };
    }
  }

  /**
   * Returns all pending mirror operations.
   */
  static async getPendingOperations(workspaceId) {
    try {
      let items = [];
      if (typeof window !== 'undefined' && window.indexedDB) {
        const all = await BillQyroDB.getAll('syncQueue');
        items = all.filter(op => op.status === 'pending' || !op.status);
      } else {
        items = Array.from(memoryQueue.values()).filter(op => op.status === 'pending');
      }

      if (workspaceId) {
        items = items.filter(op => op.workspaceId === workspaceId);
      }
      return items;
    } catch (err) {
      dualWriteConfig.log('warn', `Failed to read pending mirror operations`, { error: err.message });
      return Array.from(memoryQueue.values());
    }
  }

  /**
   * Flushes and processes pending mirror operations via batch sync endpoint.
   */
  static async flushQueue(workspaceId) {
    if (!dualWriteConfig.isEnabled) {
      return { skipped: true, reason: 'DUAL_WRITE_DISABLED' };
    }

    const pending = await this.getPendingOperations(workspaceId);
    if (pending.length === 0) {
      return { success: true, processedCount: 0 };
    }

    const operations = pending.map(item => ({
      clientTxId: item.clientTxId,
      entityType: item.entityType,
      docId: item.docId,
      action: item.action,
      payload: item.payload
    }));

    const result = await PostgresClient.request('/api/v1/sync/batch', {
      method: 'POST',
      body: {
        workspaceId,
        operations
      }
    });

    if (result.ok) {
      // Remove or mark completed
      for (const item of pending) {
        try {
          if (typeof window !== 'undefined' && window.indexedDB) {
            await BillQyroDB.delete('syncQueue', item.id);
          } else {
            memoryQueue.delete(item.id);
          }
        } catch (e) {
          // ignore cleanup errors
        }
      }
      dualWriteConfig.log('info', `Flushed ${pending.length} mirror operations successfully`, { workspaceId });
      return { success: true, processedCount: pending.length, data: result.data };
    }

    dualWriteConfig.log('warn', `Failed to flush mirror queue`, { workspaceId, error: result.error });
    return { success: false, error: result.error };
  }
}
