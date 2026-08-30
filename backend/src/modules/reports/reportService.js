import { ReportRepository } from './reportRepository.js';
import { query } from '../../db/pool.js';

export class ReportService {
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

  static async getDashboardSummary(auth, workspaceId) {
    await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    return await ReportRepository.getDashboardSummary(workspaceId);
  }

  static async getSalesReport(auth, queryParams) {
    await this.verifyWorkspaceMembership(queryParams.workspaceId, auth.firebaseUid, auth.email);
    return await ReportRepository.getSalesReport(queryParams.workspaceId, queryParams);
  }

  static async getPaymentsReport(auth, queryParams) {
    await this.verifyWorkspaceMembership(queryParams.workspaceId, auth.firebaseUid, auth.email);
    return await ReportRepository.getPaymentsReport(queryParams.workspaceId, queryParams);
  }

  static async getExpensesReport(auth, queryParams) {
    await this.verifyWorkspaceMembership(queryParams.workspaceId, auth.firebaseUid, auth.email);
    return await ReportRepository.getExpensesReport(queryParams.workspaceId, queryParams);
  }

  static async getBankLedgerReport(auth, queryParams) {
    await this.verifyWorkspaceMembership(queryParams.workspaceId, auth.firebaseUid, auth.email);
    return await ReportRepository.getBankLedgerReport(queryParams.workspaceId, queryParams);
  }
}
