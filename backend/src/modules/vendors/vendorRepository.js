import { query } from '../../db/pool.js';

export class VendorRepository {
  static async create({ workspaceId, name, phone, email, service, address }) {
    const res = await query(
      `INSERT INTO vendors (
         workspace_id, name, phone, email, service, address
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, workspace_id, name, phone, email, service, address, is_deleted, created_at, updated_at`,
      [workspaceId, name, phone || null, email || null, service || null, address || null]
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
        service, 
        address, 
        is_deleted, 
        created_at, 
        updated_at,
        COUNT(*) OVER() AS full_count
      FROM vendors
      WHERE workspace_id = $1 AND is_deleted = FALSE
    `;

    if (search && search.length > 0) {
      params.push(`%${search}%`);
      sql += ` AND (name ILIKE $${params.length} OR service ILIKE $${params.length} OR phone ILIKE $${params.length} OR email ILIKE $${params.length})`;
    }

    params.push(limit);
    sql += ` ORDER BY created_at DESC LIMIT $${params.length}`;

    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const res = await query(sql, params);
    const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;
    const items = res.rows.map(row => {
      const { full_count, ...vendor } = row;
      return vendor;
    });

    return {
      items,
      total
    };
  }

  static async findById(workspaceId, vendorId) {
    const res = await query(
      `SELECT id, workspace_id, name, phone, email, service, address, is_deleted, created_at, updated_at
       FROM vendors
       WHERE id = $1 AND workspace_id = $2 AND is_deleted = FALSE
       LIMIT 1`,
      [vendorId, workspaceId]
    );
    return res.rows[0] || null;
  }

  static async recordPayment({ workspaceId, vendorId, amount, paymentMethod, referenceNote, idempotencyKey }) {
    // Idempotency check if idempotencyKey provided
    if (idempotencyKey) {
      const existing = await query(
        `SELECT id, workspace_id, vendor_id, amount, payment_method, reference_note, idempotency_key, created_at
         FROM vendor_payments
         WHERE workspace_id = $1 AND idempotency_key = $2
         LIMIT 1`,
        [workspaceId, idempotencyKey]
      );
      if (existing.rows.length > 0) {
        return {
          payment: existing.rows[0],
          isIdempotentReplay: true
        };
      }
    }

    const res = await query(
      `INSERT INTO vendor_payments (
         workspace_id, vendor_id, amount, payment_method, reference_note, idempotency_key
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, workspace_id, vendor_id, amount, payment_method, reference_note, idempotency_key, created_at`,
      [workspaceId, vendorId, amount, paymentMethod, referenceNote || null, idempotencyKey || null]
    );

    return {
      payment: res.rows[0],
      isIdempotentReplay: false
    };
  }

  static async getVendorLedger(workspaceId, vendorId) {
    const vendor = await this.findById(workspaceId, vendorId);
    if (!vendor) {
      return null;
    }

    // Retrieve jobs
    const jobsRes = await query(
      `SELECT id, invoice_id, work_description, cost, status, created_at, updated_at
       FROM outsource_jobs
       WHERE workspace_id = $1 AND vendor_id = $2 AND is_deleted = FALSE
       ORDER BY created_at DESC`,
      [workspaceId, vendorId]
    );

    // Retrieve payments
    const paymentsRes = await query(
      `SELECT id, amount, payment_method, reference_note, idempotency_key, created_at
       FROM vendor_payments
       WHERE workspace_id = $1 AND vendor_id = $2
       ORDER BY created_at DESC`,
      [workspaceId, vendorId]
    );

    // Server-side Financial Calculations
    let totalCost = 0;
    for (const job of jobsRes.rows) {
      totalCost += parseFloat(job.cost || 0);
    }

    let totalPaid = 0;
    for (const payment of paymentsRes.rows) {
      totalPaid += parseFloat(payment.amount || 0);
    }

    totalCost = Math.round(totalCost * 100) / 100;
    totalPaid = Math.round(totalPaid * 100) / 100;
    const balanceDue = Math.round((totalCost - totalPaid) * 100) / 100;

    return {
      vendor,
      summary: {
        totalCost,
        totalPaid,
        balanceDue,
        totalJobs: jobsRes.rows.length,
        totalPayments: paymentsRes.rows.length
      },
      jobs: jobsRes.rows,
      payments: paymentsRes.rows
    };
  }
}
