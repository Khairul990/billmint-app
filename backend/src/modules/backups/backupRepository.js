import { query } from '../../db/pool.js';

export class BackupRepository {
  static async createJob({ workspaceId, requestedBy }) {
    const res = await query(
      `INSERT INTO backup_jobs (
         workspace_id, requested_by, status
       )
       VALUES ($1, $2, 'PROCESSING')
       RETURNING id, workspace_id, requested_by, status, created_at`,
      [workspaceId, requestedBy]
    );
    return res.rows[0];
  }

  static async updateJobSuccess(jobId, { storageKey, fileSizeBytes, contentHash }) {
    const res = await query(
      `UPDATE backup_jobs
       SET status = 'READY', 
           storage_key = $2, 
           file_size_bytes = $3, 
           content_hash = $4, 
           completed_at = NOW()
       WHERE id = $1
       RETURNING id, workspace_id, requested_by, status, storage_key, file_size_bytes, content_hash, created_at, completed_at`,
      [jobId, storageKey, fileSizeBytes, contentHash]
    );
    return res.rows[0];
  }

  static async updateJobFailure(jobId, errorMessage) {
    const res = await query(
      `UPDATE backup_jobs
       SET status = 'FAILED', 
           error_message = $2, 
           completed_at = NOW()
       WHERE id = $1
       RETURNING id, workspace_id, status, error_message, created_at, completed_at`,
      [jobId, errorMessage]
    );
    return res.rows[0];
  }

  static async findById(workspaceId, jobId) {
    const res = await query(
      `SELECT id, workspace_id, requested_by, status, storage_key, file_size_bytes, content_hash, error_message, created_at, completed_at
       FROM backup_jobs
       WHERE id = $1 AND workspace_id = $2
       LIMIT 1`,
      [jobId, workspaceId]
    );
    return res.rows[0] || null;
  }

  static async list({ workspaceId, limit = 20, offset = 0 }) {
    const res = await query(
      `SELECT 
         id, workspace_id, requested_by, status, storage_key, file_size_bytes, content_hash, error_message, created_at, completed_at,
         COUNT(*) OVER() AS full_count
       FROM backup_jobs
       WHERE workspace_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [workspaceId, limit, offset]
    );
    const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;
    const items = res.rows.map(r => {
      const { full_count, ...job } = r;
      return job;
    });
    return { items, total };
  }

  /**
   * Compiles complete workspace snapshot safely without secrets
   */
  static async compileWorkspaceExport(workspaceId) {
    // 1. Workspace
    const wsRes = await query(
      `SELECT id, name, currency, currency_symbol, business_type, address, phone, email, tax_id, invoice_prefix, created_at
       FROM workspaces
       WHERE id = $1`,
      [workspaceId]
    );

    // 2. Customers
    const custRes = await query(
      `SELECT id, name, phone, email, billing_address, gstin, opening_balance, notes, created_at
       FROM customers
       WHERE workspace_id = $1 AND is_deleted = FALSE`,
      [workspaceId]
    );

    // 3. Products
    const prodRes = await query(
      `SELECT id, name, sku, description, rate, unit, tax_rate, stock_quantity, min_stock_alert, created_at
       FROM products
       WHERE workspace_id = $1 AND is_deleted = FALSE`,
      [workspaceId]
    );

    // 4. Invoices & Items
    const invRes = await query(
      `SELECT id, invoice_number, bill_type, date, due_date, status, subtotal, tax_total, discount_total, grand_total, amount_paid, balance_due, customer_notes, terms_and_conditions, created_at
       FROM invoices
       WHERE workspace_id = $1 AND is_deleted = FALSE`,
      [workspaceId]
    );

    const itemRes = await query(
      `SELECT id, invoice_id, name, description, quantity, unit, rate, tax_rate, tax_amount, discount_amount, total
       FROM invoice_items
       WHERE workspace_id = $1`,
      [workspaceId]
    );

    // 5. Payments
    const payRes = await query(
      `SELECT id, invoice_id, payment_number, amount, payment_method, payment_date, reference_note, created_at
       FROM payments
       WHERE workspace_id = $1 AND is_deleted = FALSE`,
      [workspaceId]
    );

    // 6. Expenses
    const expRes = await query(
      `SELECT id, amount, category, description, date, created_at
       FROM expenses
       WHERE workspace_id = $1 AND is_deleted = FALSE`,
      [workspaceId]
    );

    // 7. Bank Ledger
    const bankRes = await query(
      `SELECT id, type, amount, description, date, created_at
       FROM bank_ledger_entries
       WHERE workspace_id = $1 AND is_deleted = FALSE`,
      [workspaceId]
    );

    // 8. Vendors
    const venRes = await query(
      `SELECT id, name, phone, email, service, address, created_at
       FROM vendors
       WHERE workspace_id = $1 AND is_deleted = FALSE`,
      [workspaceId]
    );

    // 9. Outsource Jobs
    const jobRes = await query(
      `SELECT id, vendor_id, invoice_id, work_description, cost, status, created_at
       FROM outsource_jobs
       WHERE workspace_id = $1 AND is_deleted = FALSE`,
      [workspaceId]
    );

    return {
      metadata: {
        formatVersion: '1.0',
        exportedAt: new Date().toISOString(),
        workspaceId
      },
      workspace: wsRes.rows[0] || null,
      customers: custRes.rows,
      products: prodRes.rows,
      invoices: invRes.rows,
      invoiceItems: itemRes.rows,
      payments: payRes.rows,
      expenses: expRes.rows,
      bankLedger: bankRes.rows,
      vendors: venRes.rows,
      outsourceJobs: jobRes.rows
    };
  }
}
