import { query } from '../../db/pool.js';

export class InvoiceRepository {
  /**
   * Inserts an invoice and its line items atomically using the supplied transactional client.
   */
  static async create({
    client,
    workspaceId,
    customerId,
    createdByUserId,
    invoiceNumber,
    billType,
    date,
    dueDate,
    status,
    financials,
    selectedTemplate,
    notes,
    terms,
    publicToken,
    items,
    clientTxId
  }) {
    // 1. Insert invoice header record
    const invoiceRes = await client.query(
      `INSERT INTO invoices (
         workspace_id, customer_id, created_by_user_id, invoice_number, bill_type,
         date, due_date, status, subtotal, tax_total, discount_total, shipping_charge,
         grand_total, amount_paid, balance_due, public_token, selected_template,
         notes, terms, version
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, 1)
       RETURNING id, workspace_id, customer_id, invoice_number, bill_type, date, due_date,
                 status, subtotal, tax_total, discount_total, shipping_charge, grand_total,
                 amount_paid, balance_due, public_token, selected_template, notes, terms,
                 version, created_at, updated_at`,
      [
        workspaceId,
        customerId || null,
        createdByUserId || null,
        invoiceNumber,
        billType || 'Invoice',
        date,
        dueDate || null,
        status || 'Unpaid',
        financials.subtotal,
        financials.taxTotal,
        financials.discountTotal,
        financials.shippingCharge,
        financials.grandTotal,
        financials.amountPaid,
        financials.balanceDue,
        publicToken,
        selectedTemplate || 'modern',
        notes || null,
        terms || null
      ]
    );
    const invoice = invoiceRes.rows[0];

    // 2. Insert line items
    const insertedItems = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemRes = await client.query(
        `INSERT INTO invoice_items (
           invoice_id, sequence_number, name, description, quantity, rate,
           tax_percent, discount_amount, total_amount
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, sequence_number, name, description, quantity, rate, tax_percent, discount_amount, total_amount, created_at`,
        [
          invoice.id,
          i + 1,
          item.name,
          item.description || null,
          item.quantity,
          item.rate,
          item.taxPercent,
          item.discountAmount,
          item.totalAmount
        ]
      );
      insertedItems.push(itemRes.rows[0]);
    }

    // 3. Record sync operation if clientTxId supplied
    if (clientTxId) {
      await client.query(
        `INSERT INTO sync_operations (
           workspace_id, user_id, client_tx_id, entity_type, doc_id, action, payload, status
         )
         VALUES ($1, $2, $3, 'invoice', $4, 'save', $5::jsonb, 'COMPLETED')
         ON CONFLICT (workspace_id, client_tx_id) DO NOTHING`,
        [
          workspaceId,
          createdByUserId,
          clientTxId,
          invoice.id,
          JSON.stringify({ id: invoice.id, invoiceNumber: invoice.invoice_number })
        ]
      );
    }

    return {
      ...invoice,
      items: insertedItems
    };
  }

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

  static async findById(workspaceId, invoiceId) {
    const invoiceRes = await query(
      `SELECT 
         i.*,
         c.name AS customer_name,
         c.phone AS customer_phone,
         c.email AS customer_email
       FROM invoices i
       LEFT JOIN customers c ON c.id = i.customer_id AND c.workspace_id = i.workspace_id
       WHERE i.id = $1 AND i.workspace_id = $2 AND i.is_deleted = FALSE
       LIMIT 1`,
      [invoiceId, workspaceId]
    );

    if (invoiceRes.rows.length === 0) return null;
    const invoice = invoiceRes.rows[0];

    const itemsRes = await query(
      `SELECT id, sequence_number, name, description, quantity, rate, tax_percent, discount_amount, total_amount
       FROM invoice_items
       WHERE invoice_id = $1
       ORDER BY sequence_number ASC`,
      [invoiceId]
    );

    return {
      ...invoice,
      items: itemsRes.rows
    };
  }

  static async list({
    workspaceId,
    limit = 25,
    offset = 0,
    status = null,
    search = '',
    customerId = null,
    fromDate = null,
    toDate = null
  }) {
    const params = [workspaceId];
    let sql = `
      SELECT 
        i.id,
        i.workspace_id,
        i.customer_id,
        c.name AS customer_name,
        c.phone AS customer_phone,
        i.invoice_number,
        i.bill_type,
        i.date,
        i.due_date,
        i.status,
        i.subtotal,
        i.tax_total,
        i.discount_total,
        i.shipping_charge,
        i.grand_total,
        i.amount_paid,
        i.balance_due,
        i.public_token,
        i.version,
        i.created_at,
        i.updated_at,
        COUNT(*) OVER() AS full_count
      FROM invoices i
      LEFT JOIN customers c ON c.id = i.customer_id AND c.workspace_id = i.workspace_id
      WHERE i.workspace_id = $1 AND i.is_deleted = FALSE
    `;

    if (status) {
      params.push(status);
      sql += ` AND i.status = $${params.length}`;
    }

    if (customerId) {
      params.push(customerId);
      sql += ` AND i.customer_id = $${params.length}`;
    }

    if (fromDate) {
      params.push(fromDate);
      sql += ` AND i.date >= $${params.length}`;
    }

    if (toDate) {
      params.push(toDate);
      sql += ` AND i.date <= $${params.length}`;
    }

    if (search && search.length > 0) {
      params.push(`%${search}%`);
      sql += ` AND (i.invoice_number ILIKE $${params.length} OR c.name ILIKE $${params.length} OR c.phone ILIKE $${params.length})`;
    }

    params.push(limit);
    sql += ` ORDER BY i.date DESC, i.created_at DESC LIMIT $${params.length}`;

    params.push(offset);
    sql += ` OFFSET $${params.length}`;

    const res = await query(sql, params);
    const total = res.rows.length > 0 ? parseInt(res.rows[0].full_count, 10) : 0;
    const items = res.rows.map(row => {
      const { full_count, ...invoice } = row;
      return invoice;
    });

    return {
      items,
      total
    };
  }
}
