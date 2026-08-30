import { query } from '../../db/pool.js';

export class OutsourceRepository {
  static async create({ workspaceId, vendorId, invoiceId, workDescription, cost, status }) {
    const res = await query(
      `INSERT INTO outsource_jobs (
         workspace_id, vendor_id, invoice_id, work_description, cost, status
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, workspace_id, vendor_id, invoice_id, work_description, cost, status, is_deleted, created_at, updated_at`,
      [workspaceId, vendorId, invoiceId || null, workDescription, cost, status]
    );
    return res.rows[0];
  }

  static async list({ workspaceId, vendorId = null, invoiceId = null, status = null, limit = 25, offset = 0 }) {
    const params = [workspaceId];
    let sql = `
      SELECT 
        j.id, 
        j.workspace_id, 
        j.vendor_id, 
        j.invoice_id, 
        j.work_description, 
        j.cost, 
        j.status, 
        j.is_deleted, 
        j.created_at, 
        j.updated_at,
        v.name AS vendor_name,
        v.phone AS vendor_phone,
        v.service AS vendor_service,
        i.invoice_number,
        COUNT(*) OVER() AS full_count
      FROM outsource_jobs j
      JOIN vendors v ON v.id = j.vendor_id AND v.workspace_id = j.workspace_id
      LEFT JOIN invoices i ON i.id = j.invoice_id AND i.workspace_id = j.workspace_id
      WHERE j.workspace_id = $1 AND j.is_deleted = FALSE
    `;

    if (vendorId) {
      params.push(vendorId);
      sql += ` AND j.vendor_id = $${params.length}`;
    }

    if (invoiceId) {
      params.push(invoiceId);
      sql += ` AND j.invoice_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND j.status = $${params.length}`;
    }

    params.push(limit);
    sql += ` ORDER BY j.created_at DESC LIMIT $${params.length}`;

    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const res = await query(sql, params);
    const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;
    const items = res.rows.map(row => {
      const { full_count, ...job } = row;
      return job;
    });

    return {
      items,
      total
    };
  }

  static async findById(workspaceId, jobId) {
    const res = await query(
      `SELECT 
         j.id, 
         j.workspace_id, 
         j.vendor_id, 
         j.invoice_id, 
         j.work_description, 
         j.cost, 
         j.status, 
         j.is_deleted, 
         j.created_at, 
         j.updated_at,
         v.name AS vendor_name,
         v.phone AS vendor_phone,
         v.service AS vendor_service,
         i.invoice_number
       FROM outsource_jobs j
       JOIN vendors v ON v.id = j.vendor_id AND v.workspace_id = j.workspace_id
       LEFT JOIN invoices i ON i.id = j.invoice_id AND i.workspace_id = j.workspace_id
       WHERE j.id = $1 AND j.workspace_id = $2 AND j.is_deleted = FALSE
       LIMIT 1`,
      [jobId, workspaceId]
    );
    return res.rows[0] || null;
  }

  static async update(workspaceId, jobId, updates = {}) {
    const fields = [];
    const params = [jobId, workspaceId];

    if (updates.status !== undefined) {
      params.push(updates.status);
      fields.push(`status = $${params.length}`);
    }

    if (updates.cost !== undefined) {
      params.push(updates.cost);
      fields.push(`cost = $${params.length}`);
    }

    if (updates.workDescription !== undefined) {
      params.push(updates.workDescription);
      fields.push(`work_description = $${params.length}`);
    }

    fields.push('updated_at = NOW()');

    const sql = `
      UPDATE outsource_jobs
      SET ${fields.join(', ')}
      WHERE id = $1 AND workspace_id = $2 AND is_deleted = FALSE
      RETURNING id, workspace_id, vendor_id, invoice_id, work_description, cost, status, is_deleted, created_at, updated_at
    `;

    const res = await query(sql, params);
    return res.rows[0] || null;
  }
}
