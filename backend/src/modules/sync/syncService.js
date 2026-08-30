import { SyncRepository } from './syncRepository.js';
import { query } from '../../db/pool.js';

export class SyncService {
  static async verifyWorkspaceMembership(workspaceId, firebaseUid, email) {
    const res = await query(
      `SELECT wm.role, u.id AS user_id
       FROM workspace_members wm
       JOIN users u ON u.id = wm.user_id
       JOIN workspaces w ON w.id = wm.workspace_id
       WHERE wm.workspace_id = $1 AND (u.firebase_uid = $2 OR u.email = $3) AND w.is_suspended = FALSE
       LIMIT 1`,
      [workspaceId, firebaseUid, email]
    );

    if (res.rows.length === 0) {
      const err = new Error('Access denied. You are not an authorized member of this workspace.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_WORKSPACE_ACCESS';
      throw err;
    }

    return res.rows[0];
  }

  static async processBatch(auth, { workspaceId, operations }) {
    const membership = await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const userId = membership.user_id;

    const results = [];

    for (const op of operations) {
      const { clientTxId, entityType, docId, action, payload } = op;

      // 1. Idempotency Check: Already processed?
      const existing = await SyncRepository.findOperation(workspaceId, clientTxId);
      if (existing) {
        results.push({
          clientTxId: existing.client_tx_id,
          entityType: existing.entity_type,
          docId: existing.doc_id,
          status: existing.status,
          serverVersion: parseInt(existing.server_version || 1, 10),
          isReplay: true,
          error: null
        });
        continue;
      }

      // 2. Process Operation
      try {
        await SyncRepository.applyEntityMutation(workspaceId, userId, op);
        const recorded = await SyncRepository.recordOperation({
          workspaceId,
          userId,
          clientTxId,
          entityType,
          docId,
          action,
          payload,
          status: 'COMPLETED',
          serverVersion: 1
        });

        results.push({
          clientTxId: recorded.client_tx_id,
          entityType: recorded.entity_type,
          docId: recorded.doc_id,
          status: 'COMPLETED',
          serverVersion: parseInt(recorded.server_version || 1, 10),
          isReplay: false,
          error: null
        });
      } catch (err) {
        // Individual failure moves to DEAD_LETTER without corrupting batch
        const recorded = await SyncRepository.recordOperation({
          workspaceId,
          userId,
          clientTxId,
          entityType,
          docId,
          action,
          payload,
          status: 'DEAD_LETTER',
          serverVersion: 1
        }).catch(() => null);

        results.push({
          clientTxId,
          entityType,
          docId,
          status: 'DEAD_LETTER',
          serverVersion: 1,
          isReplay: false,
          error: err.message
        });
      }
    }

    return results;
  }
}
