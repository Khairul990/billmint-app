import { PostgresClient } from './postgresClient.js';
import { dualWriteConfig } from './dualWriteConfig.js';
import { DualWriteTelemetry } from './dualWriteTelemetry.js';

export const BACKFILL_STAGES = [
  'customers',
  'vendors',
  'products',
  'invoices',
  'outsourceJobs',
  'payments',
  'expenses',
  'bankLedger'
];

/**
 * Client-Side Backfill Engine
 * Facilitates safe, chunked, non-destructive migration of historical records into PostgreSQL.
 * Strictly read-only towards Firebase; never deletes or mutates existing Firebase records.
 */
export class BackfillEngine {
  /**
   * Initializes a new backfill job on the backend.
   */
  static async startJob(workspaceId, batchSize = 50) {
    const res = await PostgresClient.request('/api/v1/backfill/jobs', {
      method: 'POST',
      body: { workspaceId, batchSize }
    });

    if (res.ok && res.data) {
      const data = res.data.data || res.data;
      dualWriteConfig.log('info', 'Backfill job initialized', { jobId: data.jobId });
      return data;
    }

    const errMessage = res.error?.message || (typeof res.error === 'string' ? res.error : 'Failed to initialize backfill job');
    throw new Error(errMessage);
  }

  /**
   * Sends a batch of records for a specific migration stage.
   */
  static async processStageBatch({ jobId, workspaceId, stage, records, onProgress }) {
    if (!BACKFILL_STAGES.includes(stage)) {
      throw new Error(`Invalid stage: ${stage}. Allowed: ${BACKFILL_STAGES.join(', ')}`);
    }

    const startTime = Date.now();
    const res = await PostgresClient.request(`/api/v1/backfill/jobs/${jobId}/batch`, {
      method: 'POST',
      body: { workspaceId, stage, records }
    });

    const durationMs = Date.now() - startTime;

    if (res.ok && res.data) {
      const data = res.data.data || res.data;
      const summary = data.batchSummary || {};
      DualWriteTelemetry.record({
        entity: stage,
        operation: 'BACKFILL_BATCH',
        status: (summary.failed || 0) > 0 ? 'MISMATCH' : 'SYNCED',
        durationMs,
        details: { batchProcessed: summary.processed || 0, failed: summary.failed || 0 }
      });

      if (typeof onProgress === 'function') {
        onProgress(data);
      }

      return data;
    }

    DualWriteTelemetry.record({
      entity: stage,
      operation: 'BACKFILL_BATCH',
      status: 'FAILED',
      durationMs,
      errorCategory: 'NETWORK_OR_SERVER_ERROR'
    });

    const errMessage = res.error?.message || (typeof res.error === 'string' ? res.error : `Failed to process batch for stage ${stage}`);
    throw new Error(errMessage);
  }

  /**
   * Checks current job status and checkpoint.
   */
  static async getJobStatus(jobId, workspaceId) {
    const res = await PostgresClient.request(`/api/v1/backfill/jobs/${jobId}?workspaceId=${encodeURIComponent(workspaceId)}`);
    if (res.ok && res.data) {
      return res.data.data || res.data;
    }
    const errMessage = res.error?.message || (typeof res.error === 'string' ? res.error : 'Failed to fetch backfill job status');
    throw new Error(errMessage);
  }

  /**
   * Pauses an active backfill job.
   */
  static async pauseJob(jobId, workspaceId) {
    const res = await PostgresClient.request(`/api/v1/backfill/jobs/${jobId}/pause`, {
      method: 'POST',
      body: { workspaceId }
    });
    if (res.ok && res.data) {
      return res.data.data || res.data;
    }
    const errMessage = res.error?.message || (typeof res.error === 'string' ? res.error : 'Failed to pause backfill job');
    throw new Error(errMessage);
  }

  /**
   * Resumes a paused backfill job.
   */
  static async resumeJob(jobId, workspaceId) {
    const res = await PostgresClient.request(`/api/v1/backfill/jobs/${jobId}/resume`, {
      method: 'POST',
      body: { workspaceId }
    });
    if (res.ok && res.data) {
      return res.data.data || res.data;
    }
    const errMessage = res.error?.message || (typeof res.error === 'string' ? res.error : 'Failed to resume backfill job');
    throw new Error(errMessage);
  }

  /**
   * Marks backfill job as completed.
   */
  static async completeJob(jobId, workspaceId) {
    const res = await PostgresClient.request(`/api/v1/backfill/jobs/${jobId}/complete`, {
      method: 'POST',
      body: { workspaceId }
    });
    if (res.ok && res.data) {
      return res.data.data || res.data;
    }
    const errMessage = res.error?.message || (typeof res.error === 'string' ? res.error : 'Failed to complete backfill job');
    throw new Error(errMessage);
  }
}
