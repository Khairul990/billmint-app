import { OutsourceRepository } from './outsourceRepository.js';
import { VendorRepository } from '../vendors/vendorRepository.js';
import { query } from '../../db/pool.js';

export class OutsourceService {
  /**
   * Helper to verify authenticated user is an active member of the workspace
   */
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

  static async createOutsourceJob(auth, data) {
    await this.verifyWorkspaceMembership(data.workspaceId, auth.firebaseUid, auth.email);

    // 1. Verify Vendor Exists in the Authorized Workspace
    const vendor = await VendorRepository.findById(data.workspaceId, data.vendorId);
    if (!vendor) {
      const err = new Error('Vendor not found in the authorized workspace.');
      err.statusCode = 404;
      err.code = 'VENDOR_NOT_FOUND';
      throw err;
    }

    // 2. If Invoice ID provided, verify it belongs to the same workspace
    if (data.invoiceId) {
      const invRes = await query(
        `SELECT id FROM invoices WHERE id = $1 AND workspace_id = $2 AND is_deleted = FALSE LIMIT 1`,
        [data.invoiceId, data.workspaceId]
      );
      if (invRes.rows.length === 0) {
        const err = new Error('Invoice not found in the authorized workspace.');
        err.statusCode = 404;
        err.code = 'INVOICE_NOT_FOUND';
        throw err;
      }
    }

    return await OutsourceRepository.create(data);
  }

  static async listOutsourceJobs(auth, queryParams) {
    await this.verifyWorkspaceMembership(queryParams.workspaceId, auth.firebaseUid, auth.email);
    return await OutsourceRepository.list(queryParams);
  }

  static async updateOutsourceJob(auth, workspaceId, jobId, updates) {
    await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);

    // Verify job exists
    const existing = await OutsourceRepository.findById(workspaceId, jobId);
    if (!existing) {
      const err = new Error('Outsource job not found in the authorized workspace.');
      err.statusCode = 404;
      err.code = 'JOB_NOT_FOUND';
      throw err;
    }

    return await OutsourceRepository.update(workspaceId, jobId, updates);
  }
}
