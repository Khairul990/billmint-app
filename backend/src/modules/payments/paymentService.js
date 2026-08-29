import { PaymentRepository } from './paymentRepository.js';
import { query } from '../../db/pool.js';
import { withTransaction } from '../../db/transaction.js';

export class PaymentService {
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
   * Records an immutable payment, updates invoice aggregates atomically, and writes an audit log.
   */
  static async recordPayment(auth, data, reqMeta = {}) {
    const { user_id: userId } = await this.verifyWorkspaceMembership(
      data.workspaceId,
      auth.firebaseUid,
      auth.email
    );

    // 1. Idempotency Check: if clientTxId already processed, return original payment
    if (data.clientTxId) {
      const existingSync = await PaymentRepository.findSyncOperation(data.workspaceId, data.clientTxId);
      if (existingSync && existingSync.doc_id) {
        const existingPayment = await PaymentRepository.findById(data.workspaceId, existingSync.doc_id);
        if (existingPayment) {
          return {
            payment: {
              id: existingPayment.id,
              invoiceId: existingPayment.invoice_id,
              amount: existingPayment.amount,
              paymentMethod: existingPayment.payment_method,
              transactionReference: existingPayment.transaction_reference,
              paymentDate: existingPayment.payment_date,
              status: 'COMPLETED'
            },
            invoice: {
              amountPaid: existingPayment.invoice_amount_paid,
              balanceDue: existingPayment.invoice_balance_due,
              status: existingPayment.invoice_status
            },
            isIdempotentReplay: true
          };
        }
      }
    }

    // 2. Execute Atomic Payment Flow with Row-Level Lock (FOR UPDATE)
    const result = await withTransaction(async (client) => {
      // Step A: Lock invoice row exclusively
      const invoice = await PaymentRepository.lockInvoiceForUpdate(client, data.workspaceId, data.invoiceId);
      if (!invoice) {
        const err = new Error('Specified invoice does not exist in this workspace.');
        err.statusCode = 404;
        err.code = 'INVOICE_NOT_FOUND';
        throw err;
      }

      const beforeState = {
        amountPaid: invoice.amount_paid,
        balanceDue: invoice.balance_due,
        status: invoice.status
      };

      // Step B: Calculate previous committed payments from ledger
      const previousTotalPaid = await PaymentRepository.sumLedgerPayments(client, data.workspaceId, data.invoiceId);

      // Step C: Insert immutable payment record
      const paymentRecord = await PaymentRepository.insertPayment(client, {
        workspaceId: data.workspaceId,
        invoiceId: data.invoiceId,
        customerId: invoice.customer_id,
        amount: data.amount,
        paymentMethod: data.paymentMethod,
        transactionReference: data.transactionReference,
        paymentDate: data.paymentDate,
        notes: data.notes,
        createdByUserId: userId
      });

      // Step D: Calculate new canonical financials
      const newTotalPaid = Math.round((previousTotalPaid + data.amount) * 100) / 100;
      const grandTotal = parseFloat(invoice.grand_total) || 0;
      const newBalanceDue = Math.max(0, Math.round((grandTotal - newTotalPaid) * 100) / 100);

      let newStatus = 'Unpaid';
      if (newTotalPaid >= grandTotal && grandTotal > 0) {
        newStatus = 'Paid';
      } else if (newTotalPaid > 0) {
        newStatus = 'Partially Paid';
      }

      // Step E: Update invoice aggregate record
      const updatedInvoice = await PaymentRepository.updateInvoiceFinancials(client, {
        invoiceId: data.invoiceId,
        workspaceId: data.workspaceId,
        amountPaid: newTotalPaid,
        balanceDue: newBalanceDue,
        status: newStatus
      });

      // Step F: Deterministically sync customer's current_due if attached
      await PaymentRepository.syncCustomerCurrentDue(client, data.workspaceId, invoice.customer_id);

      // Step G: Write Append-Only Audit Log
      await PaymentRepository.createAuditLog(client, {
        workspaceId: data.workspaceId,
        userId,
        userEmail: auth.email,
        action: 'PAYMENT_CREATED',
        entityType: 'payment',
        entityId: paymentRecord.id,
        beforeState,
        afterState: {
          paymentId: paymentRecord.id,
          amount: data.amount,
          amountPaid: newTotalPaid,
          balanceDue: newBalanceDue,
          status: newStatus
        },
        ipAddress: reqMeta.ip || null,
        userAgent: reqMeta.userAgent || null
      });

      // Step H: Record Sync Idempotency if supplied
      if (data.clientTxId) {
        await PaymentRepository.recordSyncOperation(client, {
          workspaceId: data.workspaceId,
          userId,
          clientTxId: data.clientTxId,
          entityType: 'payment',
          docId: paymentRecord.id,
          action: 'save',
          payload: { id: paymentRecord.id, amount: data.amount }
        });
      }

      return {
        payment: {
          id: paymentRecord.id,
          invoiceId: paymentRecord.invoice_id,
          amount: paymentRecord.amount,
          paymentMethod: paymentRecord.payment_method,
          transactionReference: paymentRecord.transaction_reference,
          paymentDate: paymentRecord.payment_date,
          status: 'COMPLETED'
        },
        invoice: {
          amountPaid: updatedInvoice.amount_paid,
          balanceDue: updatedInvoice.balance_due,
          status: updatedInvoice.status
        }
      };
    });

    return result;
  }

  static async listPayments(auth, queryParams) {
    await this.verifyWorkspaceMembership(queryParams.workspaceId, auth.firebaseUid, auth.email);
    const result = await PaymentRepository.list(queryParams);
    return {
      items: result.items.map(p => ({
        id: p.id,
        invoiceId: p.invoice_id,
        invoiceNumber: p.invoice_number,
        amount: p.amount,
        paymentMethod: p.payment_method,
        transactionReference: p.transaction_reference,
        paymentDate: p.payment_date,
        notes: p.notes,
        createdAt: p.created_at
      })),
      total: result.total
    };
  }
}
