import { dualWriteConfig } from './dualWriteConfig.js';
import { PostgresClient } from './postgresClient.js';
import { DualWriteQueue } from './dualWriteQueue.js';

const generateClientTxId = (entityType, docId, action = 'CREATE') => {
  const ts = Date.now();
  const rnd = Math.random().toString(36).substring(2, 9);
  return `tx_${entityType}_${docId || 'new'}_${action}_${ts}_${rnd}`;
};

/**
 * Safe Dual-Write Adapter
 * Non-blocking mirror writer for syncing Firebase mutations to PostgreSQL.
 */
export const dualWriteAdapter = {
  // ==========================================================================
  // CUSTOMERS
  // ==========================================================================
  async mirrorCustomerCreate({ workspaceId, customer, clientTxId }) {
    if (!dualWriteConfig.isEnabled) return { enabled: false, status: 'SKIPPED' };
    const txId = clientTxId || generateClientTxId('customers', customer?.id, 'CREATE');

    try {
      const payload = {
        workspaceId,
        name: customer.name,
        phone: customer.phone || null,
        email: customer.email || null,
        billingAddress: customer.billingAddress || customer.address || null,
        gstin: customer.gstin || null,
        openingBalance: customer.openingBalance !== undefined ? parseFloat(customer.openingBalance) : 0,
        notes: customer.notes || null
      };

      const res = await PostgresClient.request('/api/v1/customers', {
        method: 'POST',
        body: payload
      });

      if (res.ok) {
        dualWriteConfig.log('info', 'Customer mirror created successfully', { clientTxId: txId, customerId: customer?.id });
        return { status: 'SYNCED', ok: true, data: res.data, clientTxId: txId };
      }

      // If failed, enqueue for resilient retry
      await DualWriteQueue.enqueue({
        clientTxId: txId,
        entityType: 'customers',
        docId: customer?.id || txId,
        action: 'CREATE',
        payload,
        workspaceId
      });
      return { status: 'QUEUED', ok: true, mirrored: false, clientTxId: txId, error: res.error };
    } catch (err) {
      dualWriteConfig.log('warn', 'Non-blocking error in mirrorCustomerCreate', { clientTxId: txId, error: err.message });
      await DualWriteQueue.enqueue({
        clientTxId: txId,
        entityType: 'customers',
        docId: customer?.id || txId,
        action: 'CREATE',
        payload: customer,
        workspaceId
      }).catch(() => null);
      return { status: 'QUEUED', ok: true, mirrored: false, clientTxId: txId, error: err.message };
    }
  },

  // ==========================================================================
  // PRODUCTS
  // ==========================================================================
  async mirrorProductCreate({ workspaceId, product, clientTxId }) {
    if (!dualWriteConfig.isEnabled) return { enabled: false, status: 'SKIPPED' };
    const txId = clientTxId || generateClientTxId('products', product?.id, 'CREATE');

    try {
      const payload = {
        workspaceId,
        name: product.name,
        sku: product.sku || null,
        description: product.description || null,
        rate: product.rate !== undefined ? parseFloat(product.rate) : 0,
        unit: product.unit || 'Pcs',
        taxRate: product.taxRate !== undefined ? parseFloat(product.taxRate) : 0,
        stockQuantity: product.stockQuantity !== undefined ? parseFloat(product.stockQuantity) : 0,
        minStockAlert: product.minStockAlert !== undefined ? parseFloat(product.minStockAlert) : 0
      };

      const res = await PostgresClient.request('/api/v1/products', {
        method: 'POST',
        body: payload
      });

      if (res.ok) {
        dualWriteConfig.log('info', 'Product mirror created successfully', { clientTxId: txId, productId: product?.id });
        return { status: 'SYNCED', ok: true, data: res.data, clientTxId: txId };
      }

      await DualWriteQueue.enqueue({
        clientTxId: txId,
        entityType: 'products',
        docId: product?.id || txId,
        action: 'CREATE',
        payload,
        workspaceId
      });
      return { status: 'QUEUED', ok: true, mirrored: false, clientTxId: txId, error: res.error };
    } catch (err) {
      dualWriteConfig.log('warn', 'Non-blocking error in mirrorProductCreate', { clientTxId: txId, error: err.message });
      await DualWriteQueue.enqueue({
        clientTxId: txId,
        entityType: 'products',
        docId: product?.id || txId,
        action: 'CREATE',
        payload: product,
        workspaceId
      }).catch(() => null);
      return { status: 'QUEUED', ok: true, mirrored: false, clientTxId: txId, error: err.message };
    }
  },

  // ==========================================================================
  // INVOICES
  // ==========================================================================
  async mirrorInvoiceCreate({ workspaceId, invoice, clientTxId }) {
    if (!dualWriteConfig.isEnabled) return { enabled: false, status: 'SKIPPED' };
    const txId = clientTxId || generateClientTxId('invoices', invoice?.id || invoice?.invoiceNumber, 'CREATE');

    try {
      const payload = {
        workspaceId,
        customerId: invoice.customerId || null,
        customerName: invoice.customerName || invoice.customer?.name,
        customerPhone: invoice.customerPhone || invoice.customer?.phone || null,
        invoiceNumber: invoice.invoiceNumber,
        billType: invoice.billType && ['Invoice', 'Estimate', 'Quotation', 'BillOfSupply'].includes(invoice.billType)
          ? invoice.billType
          : 'Invoice',
        date: invoice.date || new Date().toISOString().split('T')[0],
        dueDate: invoice.dueDate || null,
        items: Array.isArray(invoice.items) ? invoice.items.map(item => ({
          productId: item.productId || null,
          name: item.name || item.description || 'Item',
          description: item.description || null,
          quantity: item.quantity !== undefined ? parseFloat(item.quantity) : 1,
          unit: item.unit || 'Pcs',
          rate: item.rate !== undefined ? parseFloat(item.rate) : 0,
          taxRate: item.taxRate !== undefined ? parseFloat(item.taxRate) : 0,
          discountAmount: item.discountAmount !== undefined ? parseFloat(item.discountAmount) : 0
        })) : [],
        customerNotes: invoice.customerNotes || invoice.notes || null,
        termsAndConditions: invoice.termsAndConditions || null,
        publicToken: invoice.publicToken || null
      };

      const res = await PostgresClient.request('/api/v1/invoices', {
        method: 'POST',
        body: payload
      });

      if (res.ok) {
        dualWriteConfig.log('info', 'Invoice mirror created successfully', { clientTxId: txId, invoiceNumber: invoice?.invoiceNumber });
        return { status: 'SYNCED', ok: true, data: res.data, clientTxId: txId };
      }

      await DualWriteQueue.enqueue({
        clientTxId: txId,
        entityType: 'invoices',
        docId: invoice?.id || invoice?.invoiceNumber || txId,
        action: 'CREATE',
        payload,
        workspaceId
      });
      return { status: 'QUEUED', ok: true, mirrored: false, clientTxId: txId, error: res.error };
    } catch (err) {
      dualWriteConfig.log('warn', 'Non-blocking error in mirrorInvoiceCreate', { clientTxId: txId, error: err.message });
      await DualWriteQueue.enqueue({
        clientTxId: txId,
        entityType: 'invoices',
        docId: invoice?.id || invoice?.invoiceNumber || txId,
        action: 'CREATE',
        payload: invoice,
        workspaceId
      }).catch(() => null);
      return { status: 'QUEUED', ok: true, mirrored: false, clientTxId: txId, error: err.message };
    }
  },

  // ==========================================================================
  // PAYMENTS
  // ==========================================================================
  async mirrorPaymentCreate({ workspaceId, invoiceId, payment, clientTxId }) {
    if (!dualWriteConfig.isEnabled) return { enabled: false, status: 'SKIPPED' };
    const txId = clientTxId || generateClientTxId('payments', payment?.id, 'CREATE');

    try {
      const payload = {
        workspaceId,
        invoiceId: invoiceId || payment.invoiceId,
        amount: payment.amount !== undefined ? parseFloat(payment.amount) : 0,
        paymentMethod: payment.paymentMethod || 'Cash',
        paymentDate: payment.paymentDate || new Date().toISOString(),
        transactionReference: payment.transactionReference || payment.referenceNote || null,
        notes: payment.notes || payment.referenceNote || null,
        clientTxId: txId
      };

      const res = await PostgresClient.request('/api/v1/payments', {
        method: 'POST',
        body: payload
      });

      if (res.ok) {
        dualWriteConfig.log('info', 'Payment mirror created successfully', { clientTxId: txId, invoiceId });
        return { status: 'SYNCED', ok: true, data: res.data, clientTxId: txId };
      }

      await DualWriteQueue.enqueue({
        clientTxId: txId,
        entityType: 'payments',
        docId: payment?.id || txId,
        action: 'CREATE',
        payload,
        workspaceId
      });
      return { status: 'QUEUED', ok: true, mirrored: false, clientTxId: txId, error: res.error };
    } catch (err) {
      dualWriteConfig.log('warn', 'Non-blocking error in mirrorPaymentCreate', { clientTxId: txId, error: err.message });
      await DualWriteQueue.enqueue({
        clientTxId: txId,
        entityType: 'payments',
        docId: payment?.id || txId,
        action: 'CREATE',
        payload: payment,
        workspaceId
      }).catch(() => null);
      return { status: 'QUEUED', ok: true, mirrored: false, clientTxId: txId, error: err.message };
    }
  },

  // ==========================================================================
  // EXPENSES
  // ==========================================================================
  async mirrorExpenseCreate({ workspaceId, expense, clientTxId }) {
    if (!dualWriteConfig.isEnabled) return { enabled: false, status: 'SKIPPED' };
    const txId = clientTxId || generateClientTxId('expenses', expense?.id, 'CREATE');

    try {
      const payload = {
        workspaceId,
        amount: expense.amount !== undefined ? parseFloat(expense.amount) : 0,
        category: expense.category || 'General',
        description: expense.description || null,
        date: expense.date || new Date().toISOString().split('T')[0]
      };

      const res = await PostgresClient.request('/api/v1/expenses', {
        method: 'POST',
        body: payload
      });

      if (res.ok) {
        dualWriteConfig.log('info', 'Expense mirror created successfully', { clientTxId: txId, expenseId: expense?.id });
        return { status: 'SYNCED', ok: true, data: res.data, clientTxId: txId };
      }

      await DualWriteQueue.enqueue({
        clientTxId: txId,
        entityType: 'expenses',
        docId: expense?.id || txId,
        action: 'CREATE',
        payload,
        workspaceId
      });
      return { status: 'QUEUED', ok: true, mirrored: false, clientTxId: txId, error: res.error };
    } catch (err) {
      dualWriteConfig.log('warn', 'Non-blocking error in mirrorExpenseCreate', { clientTxId: txId, error: err.message });
      await DualWriteQueue.enqueue({
        clientTxId: txId,
        entityType: 'expenses',
        docId: expense?.id || txId,
        action: 'CREATE',
        payload: expense,
        workspaceId
      }).catch(() => null);
      return { status: 'QUEUED', ok: true, mirrored: false, clientTxId: txId, error: err.message };
    }
  },

  // ==========================================================================
  // BANK LEDGER
  // ==========================================================================
  async mirrorBankLedgerCreate({ workspaceId, entry, clientTxId }) {
    if (!dualWriteConfig.isEnabled) return { enabled: false, status: 'SKIPPED' };
    const txId = clientTxId || generateClientTxId('bankLedger', entry?.id, 'CREATE');

    try {
      const payload = {
        workspaceId,
        type: entry.type || 'CREDIT',
        amount: entry.amount !== undefined ? parseFloat(entry.amount) : 0,
        description: entry.description || 'Ledger Entry',
        date: entry.date || new Date().toISOString().split('T')[0]
      };

      const res = await PostgresClient.request('/api/v1/bank-ledger', {
        method: 'POST',
        body: payload
      });

      if (res.ok) {
        dualWriteConfig.log('info', 'Bank ledger mirror created successfully', { clientTxId: txId, entryId: entry?.id });
        return { status: 'SYNCED', ok: true, data: res.data, clientTxId: txId };
      }

      await DualWriteQueue.enqueue({
        clientTxId: txId,
        entityType: 'bankLedger',
        docId: entry?.id || txId,
        action: 'CREATE',
        payload,
        workspaceId
      });
      return { status: 'QUEUED', ok: true, mirrored: false, clientTxId: txId, error: res.error };
    } catch (err) {
      dualWriteConfig.log('warn', 'Non-blocking error in mirrorBankLedgerCreate', { clientTxId: txId, error: err.message });
      await DualWriteQueue.enqueue({
        clientTxId: txId,
        entityType: 'bankLedger',
        docId: entry?.id || txId,
        action: 'CREATE',
        payload: entry,
        workspaceId
      }).catch(() => null);
      return { status: 'QUEUED', ok: true, mirrored: false, clientTxId: txId, error: err.message };
    }
  }
};
