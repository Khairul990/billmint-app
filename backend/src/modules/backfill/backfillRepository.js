import { query } from '../../db/pool.js';

export class BackfillRepository {
  static async createJob({ workspaceId, requestedBy, initialStage = 'customers' }) {
    const res = await query(
      `INSERT INTO backfill_jobs (
         workspace_id, requested_by, status, current_stage, checkpoint_data, stats, error_log
       )
       VALUES ($1, $2, 'PENDING', $3, '{}'::jsonb, '{"processed":0,"succeeded":0,"failed":0,"skipped":0}'::jsonb, '[]'::jsonb)
       RETURNING id, workspace_id, requested_by, status, current_stage, checkpoint_data, stats, error_log, created_at, updated_at`,
      [workspaceId, requestedBy, initialStage]
    );
    return res.rows[0];
  }

  static async findJob(jobId, workspaceId) {
    const res = await query(
      `SELECT id, workspace_id, requested_by, status, current_stage, checkpoint_data, stats, error_log, created_at, updated_at, completed_at
       FROM backfill_jobs
       WHERE id = $1 AND workspace_id = $2
       LIMIT 1`,
      [jobId, workspaceId]
    );
    return res.rows[0] || null;
  }

  static async listJobs(workspaceId, limit = 20) {
    const res = await query(
      `SELECT id, workspace_id, requested_by, status, current_stage, checkpoint_data, stats, error_log, created_at, updated_at, completed_at
       FROM backfill_jobs
       WHERE workspace_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [workspaceId, limit]
    );
    return res.rows;
  }

  static async updateJob(jobId, workspaceId, updates = {}) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(updates.status);
    }
    if (updates.currentStage !== undefined) {
      fields.push(`current_stage = $${idx++}`);
      values.push(updates.currentStage);
    }
    if (updates.checkpointData !== undefined) {
      fields.push(`checkpoint_data = $${idx++}`);
      values.push(JSON.stringify(updates.checkpointData));
    }
    if (updates.stats !== undefined) {
      fields.push(`stats = $${idx++}`);
      values.push(JSON.stringify(updates.stats));
    }
    if (updates.errorLog !== undefined) {
      fields.push(`error_log = $${idx++}`);
      values.push(JSON.stringify(updates.errorLog));
    }
    if (updates.completedAt !== undefined) {
      fields.push(`completed_at = $${idx++}`);
      values.push(updates.completedAt);
    }

    fields.push(`updated_at = NOW()`);
    values.push(jobId, workspaceId);

    const res = await query(
      `UPDATE backfill_jobs
       SET ${fields.join(', ')}
       WHERE id = $${idx++} AND workspace_id = $${idx++}
       RETURNING id, workspace_id, requested_by, status, current_stage, checkpoint_data, stats, error_log, created_at, updated_at, completed_at`,
      values
    );
    return res.rows[0] || null;
  }

  // ==========================================================================
  // IDEMPOTENT ENTITY UPSERTS
  // ==========================================================================

  static async upsertCustomer(workspaceId, record) {
    const res = await query(
      `INSERT INTO customers (
         workspace_id, name, phone, email, billing_address, gstin, opening_due, current_due
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (workspace_id, name, phone) 
       DO UPDATE SET email = COALESCE(EXCLUDED.email, customers.email),
                     billing_address = COALESCE(EXCLUDED.billing_address, customers.billing_address),
                     updated_at = NOW()
       RETURNING id`,
      [
        workspaceId,
        record.name || 'Unnamed Customer',
        record.phone || '0000000000',
        record.email || null,
        record.billingAddress || record.address || null,
        record.gstin || null,
        record.openingDue || record.openingBalance || 0,
        record.currentDue || record.openingDue || record.openingBalance || 0
      ]
    );
    return res.rows[0];
  }

  static async upsertVendor(workspaceId, record) {
    const res = await query(
      `INSERT INTO vendors (
         workspace_id, name, phone, email, service_type, address
       )
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (workspace_id, name)
       DO UPDATE SET phone = COALESCE(EXCLUDED.phone, vendors.phone),
                     service_type = COALESCE(EXCLUDED.service_type, vendors.service_type),
                     updated_at = NOW()
       RETURNING id`,
      [
        workspaceId,
        record.name || 'Unnamed Vendor',
        record.phone || null,
        record.email || null,
        record.serviceType || 'General',
        record.address || null
      ]
    );
    return res.rows[0];
  }

  static async upsertProduct(workspaceId, record) {
    const res = await query(
      `INSERT INTO products (
         workspace_id, name, sku, description, rate, unit, tax_rate, stock_quantity, min_stock_alert
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (workspace_id, name, rate)
       DO UPDATE SET sku = COALESCE(EXCLUDED.sku, products.sku),
                     stock_quantity = EXCLUDED.stock_quantity,
                     updated_at = NOW()
       RETURNING id`,
      [
        workspaceId,
        record.name || 'Unnamed Product',
        record.sku || null,
        record.description || null,
        record.rate || 0,
        record.unit || 'Pcs',
        record.taxRate || 0,
        record.stockQuantity || 0,
        record.minStockAlert || 0
      ]
    );
    return res.rows[0];
  }

  static async upsertInvoice(workspaceId, userId, record) {
    const res = await query(
      `INSERT INTO invoices (
         workspace_id, invoice_number, bill_type, date, due_date, status,
         subtotal, tax_total, discount_total, shipping_charge, grand_total,
         amount_paid, balance_due, public_token, created_by_user_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       ON CONFLICT (workspace_id, invoice_number)
       DO UPDATE SET amount_paid = EXCLUDED.amount_paid,
                     balance_due = EXCLUDED.balance_due,
                     status = EXCLUDED.status,
                     updated_at = NOW()
       RETURNING id`,
      [
        workspaceId,
        record.invoiceNumber,
        record.billType || 'Invoice',
        record.date || new Date().toISOString().slice(0, 10),
        record.dueDate || null,
        record.status || 'Unpaid',
        record.subtotal || 0,
        record.taxTotal || 0,
        record.discountTotal || 0,
        record.shippingCharge || 0,
        record.grandTotal || 0,
        record.amountPaid || 0,
        record.balanceDue || record.grandTotal || 0,
        record.publicToken || `pub_bf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        userId
      ]
    );
    return res.rows[0];
  }

  static async upsertOutsourceJob(workspaceId, userId, record) {
    const res = await query(
      `INSERT INTO outsource_jobs (
         workspace_id, vendor_id, invoice_id, description, cost, status, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        workspaceId,
        record.vendorId || null,
        record.invoiceId || null,
        record.description || 'Outsource Work',
        record.cost || 0,
        record.status || 'Pending',
        userId
      ]
    );
    return res.rows[0];
  }

  static async upsertPayment(workspaceId, userId, record) {
    const res = await query(
      `INSERT INTO payments (
         workspace_id, invoice_id, amount, payment_method, payment_date, transaction_reference, notes, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        workspaceId,
        record.invoiceId,
        record.amount || 0,
        record.paymentMethod || 'Cash',
        record.paymentDate || new Date().toISOString(),
        record.transactionReference || null,
        record.notes || null,
        userId
      ]
    );
    return res.rows[0];
  }

  static async upsertExpense(workspaceId, record) {
    const res = await query(
      `INSERT INTO expenses (
         workspace_id, amount, category, description, date
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        workspaceId,
        record.amount || 0,
        record.category || 'General',
        record.description || null,
        record.date || new Date().toISOString().slice(0, 10)
      ]
    );
    return res.rows[0];
  }

  static async upsertBankLedger(workspaceId, record) {
    const res = await query(
      `INSERT INTO bank_ledger_entries (
         workspace_id, type, amount, description, date
       )
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [
        workspaceId,
        record.type || 'CREDIT',
        record.amount || 0,
        record.description || null,
        record.date || new Date().toISOString().slice(0, 10)
      ]
    );
    return res.rows[0];
  }
}
