import { query } from '../../db/pool.js';

export class BankLedgerRepository {
  static async create({ workspaceId, type, amount, description, date }) {
    const res = await query(
      `INSERT INTO bank_ledger_entries (
         workspace_id, type, amount, description, date
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, workspace_id, type, amount, description, date, is_deleted, created_at`,
      [workspaceId, type, amount, description, date]
    );
    return res.rows[0];
  }

  static async list({ workspaceId, type = null, startDate = null, endDate = null, limit = 25, offset = 0 }) {
    const params = [workspaceId];
    let sql = `
      SELECT 
        id, 
        workspace_id, 
        type, 
        amount, 
        description, 
        date, 
        is_deleted, 
        created_at,
        COUNT(*) OVER() AS full_count
      FROM bank_ledger_entries
      WHERE workspace_id = $1 AND is_deleted = FALSE
    `;

    if (type) {
      params.push(type);
      sql += ` AND type = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      sql += ` AND date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      sql += ` AND date <= $${params.length}`;
    }

    params.push(limit);
    sql += ` ORDER BY date DESC, created_at DESC LIMIT $${params.length}`;

    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const res = await query(sql, params);
    const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;
    const items = res.rows.map(row => {
      const { full_count, ...entry } = row;
      return {
        ...entry,
        amount: parseFloat(entry.amount)
      };
    });

    return {
      items,
      total
    };
  }

  static async findById(workspaceId, entryId) {
    const res = await query(
      `SELECT id, workspace_id, type, amount, description, date, is_deleted, created_at
       FROM bank_ledger_entries
       WHERE id = $1 AND workspace_id = $2 AND is_deleted = FALSE
       LIMIT 1`,
      [entryId, workspaceId]
    );
    if (res.rows.length === 0) return null;
    const entry = res.rows[0];
    return {
      ...entry,
      amount: parseFloat(entry.amount)
    };
  }
}
