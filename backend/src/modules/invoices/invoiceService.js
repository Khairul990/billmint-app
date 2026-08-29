import crypto from 'crypto';
import { InvoiceRepository } from './invoiceRepository.js';
import { CustomerRepository } from '../customers/customerRepository.js';
import { calculateCanonicalInvoiceFinancials } from './invoiceMath.js';
import { query } from '../../db/pool.js';
import { withTransaction } from '../../db/transaction.js';

// Crypto-Safe Token Generator (Zero Modulo Bias)
export const generatePublicToken = (length = 16) => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.randomBytes(length * 2);
  let token = '';
  for (let i = 0; i < bytes.length && token.length < length; i++) {
    const byte = bytes[i];
    if (byte < 248) { // 248 is largest multiple of 62 below 256
      token += charset[byte % charset.length];
    }
  }
  return token.padEnd(length, 'A');
};

export class InvoiceService {
  /**
   * Helper to verify user membership in workspace
   */
  static async verifyWorkspaceMembership(workspaceId, firebaseUid, email) {
    const res = await query(
      `SELECT wm.role, u.id AS user_id
       FROM workspace_members wm
       JOIN users u ON u.id = wm.user_id
       JOIN workspaces w ON w.id = wm.workspace_id
       WHERE wm.workspace_id = $1 AND (u.firebase_uid = $2 OR u.email = $3) AND w.is_suspended = FALSE
       LIMIT 1`,
      [workspaceId, firebaseUid, email]
    );

    if (res.rows.length === 0) {
      const err = new Error('Access denied. You are not an authorized member of this workspace.');
      err.statusCode = 403;
      err.code = 'FORBIDDEN_WORKSPACE_ACCESS';
      throw err;
    }

    return res.rows[0];
  }

  /**
   * Creates a new invoice with atomic numbering and server-calculated financial invariants
   */
  static async createInvoice(auth, data) {
    const { user_id: userId } = await this.verifyWorkspaceMembership(
      data.workspaceId,
      auth.firebaseUid,
      auth.email
    );

    // 1. Idempotency Check: if clientTxId supplied and already processed, return existing invoice
    if (data.clientTxId) {
      const existingSync = await InvoiceRepository.findSyncOperation(data.workspaceId, data.clientTxId);
      if (existingSync && existingSync.doc_id) {
        const existingInvoice = await InvoiceRepository.findById(data.workspaceId, existingSync.doc_id);
        if (existingInvoice) {
          return {
            ...this.formatInvoiceResponse(existingInvoice),
            isIdempotentReplay: true
          };
        }
      }
    }

    // 2. Validate Customer if supplied (Cross-Workspace Isolation Barrier)
    if (data.customerId) {
      const customer = await CustomerRepository.findById(data.workspaceId, data.customerId);
      if (!customer) {
        const err = new Error('Specified customer does not exist in this workspace.');
        err.statusCode = 400;
        err.code = 'INVALID_CUSTOMER';
        throw err;
      }
    }

    // 3. Compute Server-Authoritative Financials (Reject/Ignore Client Totals)
    const { items: processedItems, financials } = calculateCanonicalInvoiceFinancials({
      items: data.items,
      taxPercentage: data.taxPercentage,
      discountAmount: data.discountAmount,
      shippingCharge: data.shippingCharge,
      amountPaid: data.amountPaid
    });

    // 4. Generate High-Entropy Public Token
    const publicToken = generatePublicToken(16);

    // 5. Execute Creation within Atomic Managed Transaction
    const createdInvoice = await withTransaction(async (client) => {
      // Allocate next invoice number atomically using row-level lock
      const numRes = await client.query(
        'SELECT generate_next_invoice_number($1, $2) AS invoice_number',
        [data.workspaceId, data.billType || 'Invoice']
      );
      const allocatedInvoiceNumber = numRes.rows[0].invoice_number;

      return await InvoiceRepository.create({
        client,
        workspaceId: data.workspaceId,
        customerId: data.customerId,
        createdByUserId: userId,
        invoiceNumber: allocatedInvoiceNumber,
        billType: data.billType || 'Invoice',
        date: data.date,
        dueDate: data.dueDate,
        status: financials.status,
        financials,
        selectedTemplate: data.selectedTemplate,
        notes: data.notes,
        terms: data.terms,
        publicToken,
        items: processedItems,
        clientTxId: data.clientTxId
      });
    });

    return this.formatInvoiceResponse(createdInvoice);
  }

  static async listInvoices(auth, queryParams) {
    await this.verifyWorkspaceMembership(queryParams.workspaceId, auth.firebaseUid, auth.email);
    const result = await InvoiceRepository.list(queryParams);
    return {
      items: result.items.map(this.formatInvoiceSummary),
      total: result.total
    };
  }

  static formatInvoiceResponse(inv) {
    return {
      id: inv.id,
      workspaceId: inv.workspace_id,
      customerId: inv.customer_id,
      customerName: inv.customer_name || null,
      invoiceNumber: inv.invoice_number,
      billType: inv.bill_type,
      date: inv.date,
      dueDate: inv.due_date,
      status: inv.status,
      publicToken: inv.public_token,
      selectedTemplate: inv.selected_template,
      financials: {
        subtotal: inv.subtotal,
        taxTotal: inv.tax_total,
        discountTotal: inv.discount_total,
        shippingCharge: inv.shipping_charge,
        grandTotal: inv.grand_total,
        amountPaid: inv.amount_paid,
        balanceDue: inv.balance_due
      },
      items: (inv.items || []).map(item => ({
        id: item.id,
        sequenceNumber: item.sequence_number,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        rate: item.rate,
        taxPercent: item.tax_percent,
        discountAmount: item.discount_amount,
        totalAmount: item.total_amount
      })),
      notes: inv.notes,
      terms: inv.terms,
      version: inv.version,
      createdAt: inv.created_at
    };
  }

  static formatInvoiceSummary(inv) {
    return {
      id: inv.id,
      workspaceId: inv.workspace_id,
      customerId: inv.customer_id,
      customerName: inv.customer_name || null,
      customerPhone: inv.customer_phone || null,
      invoiceNumber: inv.invoice_number,
      billType: inv.bill_type,
      date: inv.date,
      dueDate: inv.due_date,
      status: inv.status,
      grandTotal: inv.grand_total,
      amountPaid: inv.amount_paid,
      balanceDue: inv.balance_due,
      publicToken: inv.public_token,
      version: inv.version,
      createdAt: inv.created_at
    };
  }
}
