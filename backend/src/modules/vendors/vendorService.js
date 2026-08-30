import { VendorRepository } from './vendorRepository.js';
import { query } from '../../db/pool.js';

export class VendorService {
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

  static async createVendor(auth, data) {
    await this.verifyWorkspaceMembership(data.workspaceId, auth.firebaseUid, auth.email);
    return await VendorRepository.create(data);
  }

  static async listVendors(auth, queryParams) {
    await this.verifyWorkspaceMembership(queryParams.workspaceId, auth.firebaseUid, auth.email);
    return await VendorRepository.list(queryParams);
  }

  static async recordVendorPayment(auth, paymentData) {
    await this.verifyWorkspaceMembership(paymentData.workspaceId, auth.firebaseUid, auth.email);

    // Verify vendor exists in workspace
    const vendor = await VendorRepository.findById(paymentData.workspaceId, paymentData.vendorId);
    if (!vendor) {
      const err = new Error('Vendor not found in the authorized workspace.');
      err.statusCode = 404;
      err.code = 'VENDOR_NOT_FOUND';
      throw err;
    }

    return await VendorRepository.recordPayment(paymentData);
  }

  static async getVendorLedger(auth, workspaceId, vendorId) {
    await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);

    const ledger = await VendorRepository.getVendorLedger(workspaceId, vendorId);
    if (!ledger) {
      const err = new Error('Vendor not found in the authorized workspace.');
      err.statusCode = 404;
      err.code = 'VENDOR_NOT_FOUND';
      throw err;
    }

    return ledger;
  }
}
