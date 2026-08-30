import crypto from 'node:crypto';
import { BackupRepository } from './backupRepository.js';
import { getPdfStorage } from '../pdf/pdfStorage.js';
import { query } from '../../db/pool.js';

export class BackupService {
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

  static async createExport(auth, workspaceId) {
    const member = await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const userId = member.user_id;

    // 1. Create initial job record
    const job = await BackupRepository.createJob({
      workspaceId,
      requestedBy: userId
    });

    try {
      // 2. Compile snapshot
      const exportData = await BackupRepository.compileWorkspaceExport(workspaceId);
      const jsonBuffer = Buffer.from(JSON.stringify(exportData, null, 2), 'utf-8');

      // 3. Compute SHA-256 hash
      const contentHash = crypto.createHash('sha256').update(jsonBuffer).digest('hex');
      const storageKey = `backups/${workspaceId}/${job.id}/${contentHash}.json`;

      // 4. Upload to Object Storage
      const storage = getPdfStorage();
      await storage.putObject({
        key: storageKey,
        body: jsonBuffer,
        contentType: 'application/json',
        metadata: {
          workspaceId,
          jobId: job.id,
          contentHash
        }
      });

      // 5. Update job to READY
      const updatedJob = await BackupRepository.updateJobSuccess(job.id, {
        storageKey,
        fileSizeBytes: jsonBuffer.length,
        contentHash
      });

      return updatedJob;
    } catch (err) {
      await BackupRepository.updateJobFailure(job.id, err.message).catch(() => null);
      throw err;
    }
  }

  static async listBackups(auth, queryParams) {
    await this.verifyWorkspaceMembership(queryParams.workspaceId, auth.firebaseUid, auth.email);
    return await BackupRepository.list(queryParams);
  }

  static async getBackup(auth, workspaceId, jobId) {
    await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const job = await BackupRepository.findById(workspaceId, jobId);
    if (!job) {
      const err = new Error('Backup job not found in this workspace.');
      err.statusCode = 404;
      err.code = 'BACKUP_NOT_FOUND';
      throw err;
    }

    let downloadUrl = null;
    if (job.status === 'READY' && job.storage_key) {
      const storage = getPdfStorage();
      downloadUrl = await storage.getSignedDownloadUrl(job.storage_key, 3600);
    }

    return {
      ...job,
      downloadUrl
    };
  }
}
