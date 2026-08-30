import { BackfillRepository } from './backfillRepository.js';
import { query } from '../../db/pool.js';

export class BackfillService {
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

  static async createJob(auth, { workspaceId, batchSize = 50 }) {
    const membership = await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const job = await BackfillRepository.createJob({
      workspaceId,
      requestedBy: membership.user_id,
      initialStage: 'customers'
    });

    return {
      jobId: job.id,
      workspaceId: job.workspace_id,
      status: job.status,
      currentStage: job.current_stage,
      batchSize,
      stats: job.stats,
      createdAt: job.created_at
    };
  }

  static async processBatch(auth, { jobId, workspaceId, stage, records = [] }) {
    const membership = await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const userId = membership.user_id;

    const job = await BackfillRepository.findJob(jobId, workspaceId);
    if (!job) {
      const err = new Error('Backfill job not found in authorized workspace.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (job.status === 'PAUSED') {
      const err = new Error('Backfill job is paused. Resume before sending more batches.');
      err.statusCode = 409;
      err.code = 'JOB_PAUSED';
      throw err;
    }

    const currentStats = typeof job.stats === 'object' ? { ...job.stats } : { processed: 0, succeeded: 0, failed: 0, skipped: 0 };
    const currentErrors = Array.isArray(job.error_log) ? [...job.error_log] : [];
    const checkpointData = typeof job.checkpoint_data === 'object' ? { ...job.checkpoint_data } : {};

    let batchSucceeded = 0;
    let batchFailed = 0;
    let batchSkipped = 0;

    for (const item of records) {
      currentStats.processed++;
      const docId = item.id || item.docId || item.invoiceNumber || item.name || 'doc_unknown';
      const clientTxId = item.clientTxId || `tx_backfill_${stage}_${docId}`;

      try {
        if (!item || typeof item !== 'object') {
          throw new Error('Malformed entity record.');
        }

        switch (stage) {
          case 'customers':
            await BackfillRepository.upsertCustomer(workspaceId, item);
            break;
          case 'vendors':
            await BackfillRepository.upsertVendor(workspaceId, item);
            break;
          case 'products':
            await BackfillRepository.upsertProduct(workspaceId, item);
            break;
          case 'invoices':
            if (!item.invoiceNumber) throw new Error('Missing invoiceNumber');
            await BackfillRepository.upsertInvoice(workspaceId, userId, item);
            break;
          case 'outsourceJobs':
            await BackfillRepository.upsertOutsourceJob(workspaceId, userId, item);
            break;
          case 'payments':
            if (!item.invoiceId) throw new Error('Missing invoiceId');
            await BackfillRepository.upsertPayment(workspaceId, userId, item);
            break;
          case 'expenses':
            await BackfillRepository.upsertExpense(workspaceId, item);
            break;
          case 'bankLedger':
            await BackfillRepository.upsertBankLedger(workspaceId, item);
            break;
          default:
            batchSkipped++;
            currentStats.skipped++;
            continue;
        }

        batchSucceeded++;
        currentStats.succeeded++;
      } catch (err) {
        batchFailed++;
        currentStats.failed++;
        currentErrors.push({
          stage,
          docId,
          clientTxId,
          error: err.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    checkpointData[stage] = {
      lastProcessedAt: new Date().toISOString(),
      recordCount: (checkpointData[stage]?.recordCount || 0) + records.length,
      lastDocId: records.length > 0 ? (records[records.length - 1].id || records[records.length - 1].docId || null) : null
    };

    const updated = await BackfillRepository.updateJob(jobId, workspaceId, {
      status: 'RUNNING',
      currentStage: stage,
      checkpointData,
      stats: currentStats,
      errorLog: currentErrors.slice(-100) // Keep last 100 errors
    });

    return {
      jobId: updated.id,
      workspaceId: updated.workspace_id,
      status: updated.status,
      currentStage: updated.current_stage,
      batchSummary: {
        processed: records.length,
        succeeded: batchSucceeded,
        failed: batchFailed,
        skipped: batchSkipped
      },
      stats: updated.stats,
      checkpointData: updated.checkpoint_data,
      recentErrors: updated.error_log.slice(-10)
    };
  }

  static async getJobStatus(auth, { jobId, workspaceId }) {
    await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const job = await BackfillRepository.findJob(jobId, workspaceId);
    if (!job) {
      const err = new Error('Backfill job not found in authorized workspace.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    return {
      jobId: job.id,
      workspaceId: job.workspace_id,
      status: job.status,
      currentStage: job.current_stage,
      checkpointData: job.checkpoint_data,
      stats: job.stats,
      errorCount: Array.isArray(job.error_log) ? job.error_log.length : 0,
      createdAt: job.created_at,
      updatedAt: job.updated_at,
      completedAt: job.completed_at
    };
  }

  static async listJobs(auth, { workspaceId }) {
    await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const jobs = await BackfillRepository.listJobs(workspaceId);
    return {
      jobs: jobs.map(j => ({
        jobId: j.id,
        workspaceId: j.workspace_id,
        status: j.status,
        currentStage: j.current_stage,
        stats: j.stats,
        createdAt: j.created_at,
        completedAt: j.completed_at
      }))
    };
  }

  static async pauseJob(auth, { jobId, workspaceId }) {
    await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const job = await BackfillRepository.findJob(jobId, workspaceId);
    if (!job) {
      const err = new Error('Backfill job not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const updated = await BackfillRepository.updateJob(jobId, workspaceId, {
      status: 'PAUSED'
    });

    return {
      jobId: updated.id,
      workspaceId: updated.workspace_id,
      status: updated.status,
      currentStage: updated.current_stage,
      checkpointData: updated.checkpoint_data,
      stats: updated.stats
    };
  }

  static async resumeJob(auth, { jobId, workspaceId }) {
    await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const job = await BackfillRepository.findJob(jobId, workspaceId);
    if (!job) {
      const err = new Error('Backfill job not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    const updated = await BackfillRepository.updateJob(jobId, workspaceId, {
      status: 'RUNNING'
    });

    return {
      jobId: updated.id,
      workspaceId: updated.workspace_id,
      status: updated.status,
      currentStage: updated.current_stage,
      checkpointData: updated.checkpoint_data,
      stats: updated.stats
    };
  }

  static async completeJob(auth, { jobId, workspaceId }) {
    await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const updated = await BackfillRepository.updateJob(jobId, workspaceId, {
      status: 'COMPLETED',
      completedAt: new Date().toISOString()
    });

    return {
      jobId: updated.id,
      workspaceId: updated.workspace_id,
      status: updated.status,
      stats: updated.stats,
      completedAt: updated.completed_at
    };
  }
}
