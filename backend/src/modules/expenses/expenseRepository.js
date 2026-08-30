import { query } from '../../db/pool.js';

export class ExpenseRepository {
  static async create({ workspaceId, amount, category, description, date }) {
    const res = await query(
      `INSERT INTO expenses (
         workspace_id, amount, category, description, date
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, workspace_id, amount, category, description, date, is_deleted, created_at, updated_at`,
      [workspaceId, amount, category, description || null, date]
    );
    return res.rows[0];
  }

  static async list({ workspaceId, category = null, startDate = null, endDate = null, limit = 25, offset = 0 }) {
    const params = [workspaceId];
    let sql = `
      SELECT 
        id, 
        workspace_id, 
        amount, 
        category, 
        description, 
        date, 
        is_deleted, 
        created_at, 
        updated_at,
        COUNT(*) OVER() AS full_count
      FROM expenses
      WHERE workspace_id = $1 AND is_deleted = FALSE
    `;

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
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
      const { full_count, ...expense } = row;
      return {
        ...expense,
        amount: parseFloat(expense.amount)
      };
    });

    return {
      items,
      total
    };
  }

  static async findById(workspaceId, expenseId) {
    const res = await query(
      `SELECT id, workspace_id, amount, category, description, date, is_deleted, created_at, updated_at
       FROM expenses
       WHERE id = $1 AND workspace_id = $2 AND is_deleted = FALSE
       LIMIT 1`,
      [expenseId, workspaceId]
    );
    if (res.rows.length === 0) return null;
    const expense = res.rows[0];
    return {
      ...expense,
      amount: parseFloat(expense.amount)
    };
  }
}
