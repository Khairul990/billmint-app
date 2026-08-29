import { query } from '../../db/pool.js';

export class PdfRepository {
  /**
   * Loads full canonical invoice data, customer details, and business settings.
   */
  static async findInvoiceForPdf(workspaceId, invoiceId) {
    const invRes = await query(
      `SELECT 
         i.id,
         i.workspace_id,
         i.customer_id,
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
         i.notes,
         i.terms,
         i.version,
         w.name AS workspace_name,
         w.currency,
         w.currency_symbol,
         w.tax_label,
         c.name AS customer_name,
         c.address AS customer_address,
         c.phone AS customer_phone,
         c.email AS customer_email,
         c.gstin AS customer_gstin
       FROM invoices i
       JOIN workspaces w ON w.id = i.workspace_id
       LEFT JOIN customers c ON c.id = i.customer_id AND c.workspace_id = i.workspace_id
       WHERE i.id = $1 AND i.workspace_id = $2 AND i.is_deleted = FALSE AND w.is_suspended = FALSE
       LIMIT 1`,
      [invoiceId, workspaceId]
    );

    if (invRes.rows.length === 0) {
      return null;
    }

    const invoice = invRes.rows[0];

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
      [invoiceId]
    );

    return {
      ...invoice,
      items: itemsRes.rows
    };
  }

  /**
   * Checks registry for an existing PDF document by invoice_id and content_hash.
   */
  static async findPdfRegistryRecord(workspaceId, invoiceId, contentHash) {
    const res = await query(
      `SELECT 
         id,
         workspace_id,
         invoice_id,
         version,
         content_hash,
         byte_hash,
         storage_key,
         mime_type,
         file_size_bytes,
         engine_used,
         status,
         generation_started_at,
         generated_at,
         created_at
       FROM pdf_documents
       WHERE workspace_id = $1 AND invoice_id = $2 AND content_hash = $3
       LIMIT 1`,
      [workspaceId, invoiceId, contentHash]
    );
    return res.rows[0] || null;
  }

  /**
   * Acquires or recovers a generation row in pdf_documents with row-level locking.
   */
  static async acquireGenerationLock(client, { workspaceId, invoiceId, contentHash, storageKey }) {
    // 1. Get next version number
    const verRes = await client.query(
      `SELECT COALESCE(MAX(version), 0) + 1 AS next_version 
       FROM pdf_documents 
       WHERE invoice_id = $1`,
      [invoiceId]
    );
    const nextVersion = parseInt(verRes.rows[0]?.next_version || 1, 10);

    // 2. Insert or claim GENERATING state
    const res = await client.query(
      `INSERT INTO pdf_documents (
         workspace_id, invoice_id, version, content_hash, storage_key,
         mime_type, file_size_bytes, engine_used, status, generation_started_at
       )
       VALUES ($1, $2, $3, $4, $5, 'application/pdf', 0, 'backend-pdf-v1', 'GENERATING', NOW())
       ON CONFLICT (invoice_id, content_hash) DO UPDATE
       SET generation_started_at = NOW(),
           status = CASE 
             WHEN pdf_documents.status = 'READY' THEN 'READY' 
             ELSE 'GENERATING' 
           END
       RETURNING id, version, content_hash, byte_hash, storage_key, status, file_size_bytes, generation_started_at`,
      [workspaceId, invoiceId, nextVersion, contentHash, storageKey]
    );
    return res.rows[0];
  }

  /**
   * Marks PDF document status as READY upon verified object upload.
   */
  static async markPdfReady(client, { id, byteHash, fileSizeBytes, engineUsed = 'backend-pdf-v1' }) {
    const res = await client.query(
      `UPDATE pdf_documents
       SET status = 'READY',
           byte_hash = $2,
           file_size_bytes = $3,
           engine_used = $4,
           generated_at = NOW(),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id, version, content_hash, byte_hash, storage_key, file_size_bytes, status, generated_at`,
      [id, byteHash, fileSizeBytes, engineUsed]
    );
    return res.rows[0];
  }

  /**
   * Marks PDF document status as FAILED on generation or storage error.
   */
  static async markPdfFailed(client, { id, errorMessage }) {
    await client.query(
      `UPDATE pdf_documents
       SET status = 'FAILED',
           last_error = $2,
           updated_at = NOW()
       WHERE id = $1`,
      [id, errorMessage || 'Unknown PDF generation failure']
    );
  }
}
