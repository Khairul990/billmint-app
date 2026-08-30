import { query } from '../../db/pool.js';

export class NotificationRepository {
  static async create({ workspaceId, userId = null, type, title, message, entityType = null, entityId = null }) {
    const res = await query(
      `INSERT INTO notifications (
         workspace_id, user_id, type, title, message, entity_type, entity_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, workspace_id, user_id, type, title, message, entity_type, entity_id, is_read, created_at`,
      [workspaceId, userId, type, title, message, entityType, entityId]
    );
    return res.rows[0];
  }

  static async list({ workspaceId, userId = null, unreadOnly = false, limit = 25, offset = 0 }) {
    const params = [workspaceId];
    let sql = `
      SELECT 
        id, 
        workspace_id, 
        user_id, 
        type, 
        title, 
        message, 
        entity_type, 
        entity_id, 
        is_read, 
        created_at,
        COUNT(*) OVER() AS full_count
      FROM notifications
      WHERE workspace_id = $1
    `;

    if (userId) {
      params.push(userId);
      sql += ` AND (user_id = $${params.length} OR user_id IS NULL)`;
    }

    if (unreadOnly) {
      sql += ` AND is_read = FALSE`;
    }

    params.push(limit);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const res = await query(sql, params);
    const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;
    const items = res.rows.map(row => {
      const { full_count, ...notif } = row;
      return notif;
    });

    return {
      items,
      total
    };
  }

  static async getUnreadCount(workspaceId, userId = null) {
    const params = [workspaceId];
    let sql = `
      SELECT COUNT(*) AS unread_count
      FROM notifications
      WHERE workspace_id = $1 AND is_read = FALSE
    `;

    if (userId) {
      params.push(userId);
      sql += ` AND (user_id = $${params.length} OR user_id IS NULL)`;
    }

    const res = await query(sql, params);
    return parseInt(res.rows[0]?.unread_count || 0, 10);
  }

  static async markAsRead(workspaceId, notificationId, userId = null) {
    const params = [notificationId, workspaceId];
    let sql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1 AND workspace_id = $2
    `;

    if (userId) {
      params.push(userId);
      sql += ` AND (user_id = $${params.length} OR user_id IS NULL)`;
    }

    sql += ` RETURNING id, workspace_id, is_read`;

    const res = await query(sql, params);
    return res.rows.length > 0;
  }

  static async markAllAsRead(workspaceId, userId = null) {
    const params = [workspaceId];
    let sql = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE workspace_id = $1 AND is_read = FALSE
    `;

    if (userId) {
      params.push(userId);
      sql += ` AND (user_id = $${params.length} OR user_id IS NULL)`;
    }

    sql += ` RETURNING id`;

    const res = await query(sql, params);
    return res.rows.length;
  }
}
