import { NotificationRepository } from './notificationRepository.js';
import { query } from '../../db/pool.js';

export class NotificationService {
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

  static async listNotifications(auth, queryParams) {
    const member = await this.verifyWorkspaceMembership(queryParams.workspaceId, auth.firebaseUid, auth.email);
    return await NotificationRepository.list({
      ...queryParams,
      userId: member.user_id
    });
  }

  static async getUnreadCount(auth, workspaceId) {
    const member = await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const count = await NotificationRepository.getUnreadCount(workspaceId, member.user_id);
    return { unreadCount: count };
  }

  static async markAsRead(auth, workspaceId, notificationId) {
    const member = await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const success = await NotificationRepository.markAsRead(workspaceId, notificationId, member.user_id);
    if (!success) {
      const err = new Error('Notification not found or already read.');
      err.statusCode = 404;
      err.code = 'NOTIFICATION_NOT_FOUND';
      throw err;
    }
    return { success: true, message: 'Notification marked as read.' };
  }

  static async markAllAsRead(auth, workspaceId) {
    const member = await this.verifyWorkspaceMembership(workspaceId, auth.firebaseUid, auth.email);
    const updatedCount = await NotificationRepository.markAllAsRead(workspaceId, member.user_id);
    return { success: true, updatedCount };
  }

  /**
   * Helper callable by other backend services to emit notifications safely
   */
  static async createNotification({ workspaceId, userId = null, type, title, message, entityType = null, entityId = null }) {
    return await NotificationRepository.create({
      workspaceId,
      userId,
      type,
      title,
      message,
      entityType,
      entityId
    });
  }
}
