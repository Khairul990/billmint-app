import { query } from '../../db/pool.js';

export class PublicInvoiceRepository {
  /**
   * Finds an active, non-deleted invoice by its public token.
   * Joins workspace display metadata and customer display name.
   */
  static async findByPublicToken(publicToken) {
    const res = await query(
      `SELECT 
         i.id,
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
         i.selected_template,
         i.terms,
         i.version,
         w.name AS workspace_name,
         w.currency,
         w.currency_symbol,
         w.tax_label,
         c.name AS customer_name,
         c.address AS customer_address
       FROM invoices i
       JOIN workspaces w ON w.id = i.workspace_id
       LEFT JOIN customers c ON c.id = i.customer_id AND c.workspace_id = i.workspace_id
       WHERE i.public_token = $1 AND i.is_deleted = FALSE AND w.is_suspended = FALSE
       LIMIT 1`,
      [publicToken]
    );

    if (res.rows.length === 0) {
      return null;
    }

    const invoice = res.rows[0];

    // Fetch line items in stable sequence order
    const itemsRes = await query(
      `SELECT 
         sequence_number,
         name,
         description,
         quantity,
         rate,
         tax_percent,
         discount_amount,
         total_amount
       FROM invoice_items
       WHERE invoice_id = $1
       ORDER BY sequence_number ASC`,
      [invoice.id]
    );

    return {
      ...invoice,
      items: itemsRes.rows
    };
  }
}
