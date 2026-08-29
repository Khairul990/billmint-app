import { query } from '../../db/pool.js';

export class CustomerRepository {
  static async create({ workspaceId, name, phone, email, address, gstin, openingDue }) {
    const res = await query(
      `INSERT INTO customers (
         workspace_id, name, phone, email, address, gstin, opening_due, current_due
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $7)
       RETURNING id, workspace_id, name, phone, email, address, gstin, opening_due, current_due, created_at, updated_at`,
      [workspaceId, name, phone || null, email || null, address || null, gstin || null, openingDue]
    );
    return res.rows[0];
  }

  static async list({ workspaceId, limit = 25, offset = 0, search = '' }) {
    const params = [workspaceId];
    let sql = `
      SELECT 
        id, 
        workspace_id, 
        name, 
        phone, 
        email, 
        address, 
        gstin, 
        opening_due, 
        current_due, 
        created_at, 
        updated_at,
        COUNT(*) OVER() AS full_count
      FROM customers
      WHERE workspace_id = $1 AND is_deleted = FALSE
    `;

    if (search && search.length > 0) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    params.push(limit);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const res = await query(sql, params);
    const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;
    const items = res.rows.map(row => {
      const { full_count, ...customer } = row;
      return customer;
    });

    return {
      items,
      total
    };
  }

  static async findById(workspaceId, customerId) {
    const res = await query(
      `SELECT id, workspace_id, name, phone, email, address, gstin, opening_due, current_due, is_deleted, created_at
       FROM customers
       WHERE id = $1 AND workspace_id = $2 AND is_deleted = FALSE
       LIMIT 1`,
      [customerId, workspaceId]
    );
    return res.rows[0] || null;
  }
}
