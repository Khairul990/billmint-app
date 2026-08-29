import { query } from '../../db/pool.js';

export class PaymentRepository {
  /**
   * Locks the invoice row exclusively (FOR UPDATE) within the active transaction.
   */
  static async lockInvoiceForUpdate(client, workspaceId, invoiceId) {
    const res = await client.query(
      `SELECT 
         id, 
         workspace_id, 
         customer_id, 
         invoice_number, 
         grand_total, 
         amount_paid, 
         balance_due, 
         status
       FROM invoices
       WHERE id = $1 AND workspace_id = $2 AND is_deleted = FALSE
       FOR UPDATE`,
      [invoiceId, workspaceId]
    );
    return res.rows[0] || null;
  }

  /**
   * Sums all committed payment records in the ledger for this invoice.
   */
  static async sumLedgerPayments(client, workspaceId, invoiceId) {
    const res = await client.query(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid
       FROM payments
       WHERE workspace_id = $1 AND invoice_id = $2`,
      [workspaceId, invoiceId]
    );
    return parseFloat(res.rows[0]?.total_paid || 0);
  }

  /**
   * Inserts an immutable payment ledger entry.
   */
  static async insertPayment(client, {
    workspaceId,
    invoiceId,
    customerId,
    amount,
    paymentMethod,
    transactionReference,
    paymentDate,
    notes,
    createdByUserId
  }) {
    const res = await client.query(
      `INSERT INTO payments (
         workspace_id, invoice_id, customer_id, amount, payment_method,
         transaction_reference, payment_date, notes, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, workspace_id, invoice_id, customer_id, amount, payment_method,
                 transaction_reference, payment_date, notes, created_by, created_at`,
      [
        workspaceId,
        invoiceId,
        customerId || null,
        amount,
        paymentMethod,
        transactionReference || null,
        paymentDate,
        notes || null,
        createdByUserId || null
      ]
    );
    return res.rows[0];
  }

  /**
   * Updates invoice aggregate financial status inside transaction.
   */
  static async updateInvoiceFinancials(client, {
    invoiceId,
    workspaceId,
    amountPaid,
    balanceDue,
    status
  }) {
    const res = await client.query(
      `UPDATE invoices
       SET amount_paid = $1,
           balance_due = $2,
           status = $3,
           updated_at = NOW()
       WHERE id = $4 AND workspace_id = $5
       RETURNING id, invoice_number, amount_paid, balance_due, status, updated_at`,
      [amountPaid, balanceDue, status, invoiceId, workspaceId]
    );
    return res.rows[0];
  }

  /**
   * Recalculates and updates customer current_due deterministically if customer is attached.
   */
  static async syncCustomerCurrentDue(client, workspaceId, customerId) {
    if (!customerId) return;
    await client.query(
      `UPDATE customers
       SET current_due = GREATEST(0, (
         COALESCE(opening_due, 0) + 
         COALESCE((
           SELECT SUM(balance_due)
           FROM invoices
           WHERE customer_id = $1 AND workspace_id = $2 AND is_deleted = FALSE
         ), 0)
       )),
       updated_at = NOW()
       WHERE id = $1 AND workspace_id = $2`,
      [customerId, workspaceId]
    );
  }

  /**
   * Appends an immutable audit log record.
   */
  static async createAuditLog(client, {
    workspaceId,
    userId,
    userEmail,
    action,
    entityType,
    entityId,
    beforeState,
    afterState,
    ipAddress = null,
    userAgent = null
  }) {
    const res = await client.query(
      `INSERT INTO audit_logs (
         workspace_id, user_id, user_email, action, entity_type,
         entity_id, before_state, after_state, ip_address, user_agent
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10)
       RETURNING id, action, entity_type, entity_id, created_at`,
      [
        workspaceId,
        userId || null,
        userEmail || null,
        action,
        entityType,
        String(entityId),
        JSON.stringify(beforeState || {}),
        JSON.stringify(afterState || {}),
        ipAddress,
        userAgent
      ]
    );
    return res.rows[0];
  }

  /**
   * Finds existing sync operation by clientTxId for idempotency replay.
   */
  static async findSyncOperation(workspaceId, clientTxId) {
    if (!clientTxId) return null;
    const res = await query(
      `SELECT doc_id, payload, status, processed_at
       FROM sync_operations
       WHERE workspace_id = $1 AND client_tx_id = $2
       LIMIT 1`,
      [workspaceId, clientTxId]
    );
    return res.rows[0] || null;
  }

  /**
   * Records sync operation inside transaction.
   */
  static async recordSyncOperation(client, {
    workspaceId,
    userId,
    clientTxId,
    entityType,
    docId,
    action,
    payload
  }) {
    if (!clientTxId) return;
    await client.query(
      `INSERT INTO sync_operations (
         workspace_id, user_id, client_tx_id, entity_type, doc_id, action, payload, status
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, 'COMPLETED')
       ON CONFLICT (workspace_id, client_tx_id) DO NOTHING`,
      [workspaceId, userId, clientTxId, entityType, docId, action, JSON.stringify(payload)]
    );
  }

  /**
   * Finds a payment by ID within a workspace.
   */
  static async findById(workspaceId, paymentId) {
    const res = await query(
      `SELECT 
         p.id,
         p.workspace_id,
         p.invoice_id,
         p.customer_id,
         p.amount,
         p.payment_method,
         p.transaction_reference,
         p.payment_date,
         p.notes,
         p.created_at,
         i.invoice_number,
         i.amount_paid AS invoice_amount_paid,
         i.balance_due AS invoice_balance_due,
         i.status AS invoice_status
       FROM payments p
       JOIN invoices i ON i.id = p.invoice_id AND i.workspace_id = p.workspace_id
       WHERE p.id = $1 AND p.workspace_id = $2
       LIMIT 1`,
      [paymentId, workspaceId]
    );
    return res.rows[0] || null;
  }

  /**
   * Lists payments for a workspace (optionally scoped to an invoice) with database pagination.
   */
  static async list({
    workspaceId,
    invoiceId = null,
    limit = 25,
    offset = 0
  }) {
    const params = [workspaceId];
    let sql = `
      SELECT 
        p.id,
        p.workspace_id,
        p.invoice_id,
        p.customer_id,
        p.amount,
        p.payment_method,
        p.transaction_reference,
        p.payment_date,
        p.notes,
        p.created_at,
        i.invoice_number,
        COUNT(*) OVER() AS full_count
      FROM payments p
      JOIN invoices i ON i.id = p.invoice_id AND i.workspace_id = p.workspace_id
      WHERE p.workspace_id = $1
    `;

    if (invoiceId) {
      params.push(invoiceId);
      sql += ` AND p.invoice_id = $${params.length}`;
    }

    params.push(limit);
    sql += ` ORDER BY p.payment_date DESC, p.created_at DESC LIMIT $${params.length}`;

    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const res = await query(sql, params);
    const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;
    const items = res.rows.map(row => {
      const { full_count, ...payment } = row;
      return payment;
    });

    return {
      items,
      total
    };
  }
}
