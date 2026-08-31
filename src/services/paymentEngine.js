import { invoiceEngine } from './invoiceEngine.js';
import { 
  getInvoicePaymentStatus, 
  calculateCanonicalInvoiceFinancials, 
  allocatePayment, 
  roundTo2 
} from '../utils/invoiceMath.js';
import { db, firebaseReady } from './firebaseConfig.js';
import { doc, runTransaction } from 'firebase/firestore';
import { 
  submitPlatformPaymentProof as dbSubmitPlatformPaymentProof, 
  getUserPaymentProofs as dbGetUserPaymentProofs, 
  getUserRevenueState as dbGetUserRevenueState,
  logAudit 
} from './dbEngine.js';

class PaymentEngine {
  /**
   * CANONICAL PAYMENT RECORDING ENGINE
   * Single authoritative entry point for all manual collections and approved live link payments.
   */
  async recordCustomerPayment({
    customerId = null,
    invoiceId,
    amount,
    paymentMethod = 'Cash',
    paymentDate = null,
    reference = '',
    note = '',
    source = 'manual_collection',
    proofId = null,
    createdBy = 'Merchant',
    workspaceId = null
  }) {
    const rawAmt = parseFloat(amount);
    if (isNaN(rawAmt) || !isFinite(rawAmt) || rawAmt <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }
    const paymentAmount = roundTo2(rawAmt);

    const invoices = await invoiceEngine.getInvoices(true);
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found for payment collection.');
    }

    // Workspace Isolation Check
    if (workspaceId && invoice.workspaceId && invoice.workspaceId !== workspaceId) {
      throw new Error('Access denied: Invoice does not belong to the active workspace.');
    }

    if (!Array.isArray(invoice.paymentHistory)) invoice.paymentHistory = [];
    if (!Array.isArray(invoice.paymentProofs)) invoice.paymentProofs = [];

    // Canonical Financial Calculations
    const fin = calculateCanonicalInvoiceFinancials(invoice);
    const maxPayable = fin.previousDue > 0 ? fin.customerTotalDue : fin.balanceDue;

    // Overpayment Protection
    if (paymentAmount > maxPayable && maxPayable > 0) {
      throw new Error(`Payment amount (${paymentAmount}) cannot exceed outstanding liability (${maxPayable}).`);
    }

    // Previous Due Priority Allocation
    const allocation = allocatePayment(paymentAmount, fin.previousDue, fin.currentInvoiceTotal);

    const paymentId = proofId ? `pmt_${proofId}` : `pmt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Idempotent duplicate check
    const existingIndex = invoice.paymentHistory.findIndex(p => 
      p.id === paymentId || (proofId && p.proofId === proofId) || (p.transactionId && reference && p.transactionId === reference && p.amount === paymentAmount)
    );

    if (existingIndex >= 0) {
      return {
        success: true,
        alreadyProcessed: true,
        invoice,
        payment: invoice.paymentHistory[existingIndex],
        allocation
      };
    }

    const effectiveDate = paymentDate 
      ? (paymentDate.includes('T') ? paymentDate : `${paymentDate}T12:00:00.000Z`)
      : new Date().toISOString();

    const paymentEntry = {
      id: paymentId,
      proofId: proofId || null,
      amount: paymentAmount,
      method: paymentMethod,
      transactionId: reference || '',
      reference: reference || '',
      date: effectiveDate,
      note: note || (source === 'live_link_approved' ? 'Payment proof approved' : 'Recorded in Collection Center'),
      source,
      allocatedToOldDue: allocation.allocatedToOldDue,
      allocatedToCurrentInvoice: allocation.allocatedToCurrentInvoice,
      customerId: customerId || invoice.customer?.id || invoice.customerId || null,
      customerName: invoice.customer?.name || invoice.customerName || 'Walk-in Customer',
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber || `INV-${invoice.id.slice(0, 4)}`,
      createdBy,
      workspaceId: workspaceId || invoice.workspaceId || null,
      verified: true,
      createdAt: new Date().toISOString()
    };

    invoice.paymentHistory.push(paymentEntry);

    // Save normalized invoice
    const saved = await invoiceEngine.saveInvoice({
      ...invoice,
      paymentMethod: paymentMethod || invoice.paymentMethod || 'Cash'
    });

    // Structured Audit Log
    try {
      logAudit(
        'payment_recorded', 
        'invoice', 
        invoice.id, 
        { oldAmountPaid: fin.amountPaid }, 
        { 
          paymentId: paymentEntry.id,
          amount: paymentAmount, 
          source, 
          allocatedToOldDue: allocation.allocatedToOldDue,
          allocatedToCurrentInvoice: allocation.allocatedToCurrentInvoice,
          workspaceId: invoice.workspaceId 
        }
      );
    } catch (e) {
      console.warn('[AUDIT] Failed to log payment audit:', e);
    }

    // Mirror payment into Internal Bank ledger (idempotent, failure-isolated)
    try {
      const { bankEngine } = await import('./bankEngine.js');
      await bankEngine.autoPostPayment({
        id: paymentEntry.id,
        amount: paymentEntry.amount,
        method: paymentEntry.method,
        date: paymentEntry.date,
        invoiceId: saved.id,
        invoiceNumber: saved.invoiceNumber,
        customerId: paymentEntry.customerId,
        customerName: paymentEntry.customerName,
        note: paymentEntry.note
      });
    } catch (e) {
      console.warn('[BANK] auto-post payment skipped (non-blocking):', e);
    }

    // Dispatch Reactive App-Wide Events
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('billqyro_invoice_updated', { detail: saved }));
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
      window.dispatchEvent(new CustomEvent('billqyro:data-updated', { detail: { collectionName: 'invoices', doc: saved } }));
    }

    return {
      success: true,
      invoice: saved,
      payment: paymentEntry,
      allocation
    };
  }

  async addPayment(invoiceId, paymentData = {}) {
    return (await this.recordCustomerPayment({
      invoiceId,
      amount: paymentData.amount,
      paymentMethod: paymentData.method || paymentData.paymentMethod || 'Cash',
      paymentDate: paymentData.date || null,
      reference: paymentData.transactionId || paymentData.reference || '',
      note: paymentData.notes || paymentData.note || '',
      source: paymentData.source || 'manual_collection'
    })).invoice;
  }

  async removePayment(invoiceId, paymentId) {
    const invoices = await invoiceEngine.getInvoices(true);
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return null;
    invoice.paymentHistory = Array.isArray(invoice.paymentHistory) 
      ? invoice.paymentHistory.filter(p => p.id !== paymentId && p.proofId !== paymentId) 
      : [];
    if (invoice.payments) invoice.payments = invoice.payments.filter(p => p.id !== paymentId);
    const totalPaid = Math.round(invoice.paymentHistory.reduce((s, p) => s + (Number(p.amount) || 0), 0) * 100) / 100;
    invoice.amountPaid = totalPaid;
    invoice.paidAmount = totalPaid;
    invoice.paymentStatus = getInvoicePaymentStatus(invoice);
    invoice.updatedAt = new Date().toISOString();
    const saved = await invoiceEngine.saveInvoice(invoice);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('billqyro_invoice_updated', { detail: saved }));
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
      window.dispatchEvent(new CustomEvent('billqyro:data-updated', { detail: { collectionName: 'invoices', doc: saved } }));
    }
    return saved;
  }

  calculateTotalPaid(payments = []) { 
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0); 
  }

  async recordPaymentProof(invoiceId, proofData) {
    return await this.addPayment(invoiceId, { 
      amount: proofData.amount, 
      method: proofData.method || 'Transfer', 
      date: new Date().toISOString(), 
      proofUrl: proofData.url, 
      transactionId: proofData.transactionId || '' 
    });
  }

  getAllTransactions(invoices = [], workspaceId = null) {
    return this.getPaymentHistory(invoices, workspaceId);
  }

  /**
   * CANONICAL PAYMENT HISTORY EXTRACTOR
   * Extracts and normalizes all confirmed payments across invoices for active workspace.
   */
  getPaymentHistory(invoices = [], workspaceId = null) {
    const transactions = [];
    const scopedInvoices = workspaceId ? invoices.filter(inv => !inv.workspaceId || inv.workspaceId === workspaceId) : invoices;

    scopedInvoices.forEach(inv => {
      if (inv.isDeleted || inv.status === 'Cancelled' || inv.status === 'Void') return;
      const history = Array.isArray(inv.paymentHistory) ? inv.paymentHistory : [];
      history.forEach(p => {
        const amt = roundTo2(parseFloat(p.amount) || 0);
        if (amt > 0) {
          transactions.push({
            id: p.id || `pmt_${inv.id}_${p.date}`,
            proofId: p.proofId || null,
            amount: amt,
            paymentMethod: p.method || p.paymentMethod || 'Cash',
            date: p.date || inv.date || inv.createdAt,
            reference: p.transactionId || p.reference || '',
            note: p.note || p.notes || '',
            source: p.source || 'manual_collection',
            allocatedToOldDue: roundTo2(parseFloat(p.allocatedToOldDue) || 0),
            allocatedToCurrentInvoice: roundTo2(parseFloat(p.allocatedToCurrentInvoice) || amt),
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber || `INV-${inv.id?.slice(0, 4)}`,
            customerId: p.customerId || inv.customer?.id || inv.customerId || null,
            customerName: p.customerName || inv.customer?.name || inv.customerName || 'Walk-in Customer',
            customerPhone: inv.customer?.phone || inv.customerPhone || '',
            status: 'Confirmed',
            workspaceId: inv.workspaceId || null
          });
        }
      });
    });

    return transactions.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  }

  async submitPlatformPaymentProof(proofData) { 
    return await dbSubmitPlatformPaymentProof(proofData); 
  }

  /**
   * APPROVE PAYMENT PROOF
   * Standardized to use the canonical recordCustomerPayment workflow.
   */
  async approvePaymentProof(payment, reviewer = 'Merchant') {
    if (!firebaseReady || !db) {
      // In offline/mock mode, record directly to local database
      if (payment.invoiceId) {
        return await this.recordCustomerPayment({
          invoiceId: payment.invoiceId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod || 'UPI',
          reference: payment.transactionId || '',
          note: payment.notes || payment.note || 'Payment proof approved',
          source: 'live_link_approved',
          proofId: payment.id,
          createdBy: reviewer
        });
      }
      return;
    }

    const proofRef = doc(db, 'payment_proofs', payment.id);
    const paymentAmount = Math.max(0, Math.round((parseFloat(payment.amount) || 0) * 100) / 100);
    if (paymentAmount <= 0) throw new Error('Payment amount must be greater than zero.');

    await runTransaction(db, async (transaction) => {
      const proofDoc = await transaction.get(proofRef);
      if (!proofDoc.exists()) throw new Error('Payment proof not found.');
      const proofData = proofDoc.data();
      if (proofData.status === 'approved') throw new Error('This payment has already been approved.');
      if (proofData.status === 'rejected') throw new Error('This payment has already been rejected.');
      transaction.update(proofRef, { 
        status: 'approved', 
        reviewedBy: reviewer,
        reviewedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString() 
      });

      if (!payment.invoiceId) return;
      const localInvoices = await invoiceEngine.getInvoices(true);
      const existingInvoice = localInvoices.find(inv => inv.id === payment.invoiceId);
      if (!existingInvoice?.publicToken) return;
      const publicInvRef = doc(db, 'publicInvoices', existingInvoice.publicToken);
      const publicDoc = await transaction.get(publicInvRef);
      if (!publicDoc.exists()) return;

      const publicData = publicDoc.data();
      const history = Array.isArray(publicData.paymentHistory) ? [...publicData.paymentHistory] : [];
      const alreadyRecorded = history.some(p => p.proofId === payment.id || p.id === payment.id || p.id === `pmt_${payment.id}`);
      if (!alreadyRecorded) {
        history.push({ 
          id: `pmt_${payment.id}`, 
          proofId: payment.id, 
          amount: paymentAmount, 
          method: payment.paymentMethod || 'Proof Approval', 
          transactionId: payment.transactionId || '', 
          date: new Date().toISOString(), 
          note: payment.notes || payment.note || 'Payment proof approved', 
          source: 'live_link_approved' 
        });
      }

      const canonical = calculateCanonicalInvoiceFinancials({ ...publicData, paymentHistory: history });
      transaction.update(publicInvRef, { 
        paymentHistory: history, 
        amountPaid: canonical.amountPaid, 
        paidAmount: canonical.amountPaid, 
        balanceDue: canonical.balanceDue, 
        paymentStatus: canonical.paymentStatus, 
        status: canonical.paymentStatus, 
        updatedAt: new Date().toISOString() 
      });
    });

    if (payment.invoiceId) {
      await this.recordCustomerPayment({
        invoiceId: payment.invoiceId,
        amount: paymentAmount,
        paymentMethod: payment.paymentMethod || 'UPI',
        reference: payment.transactionId || '',
        note: payment.notes || payment.note || 'Payment proof approved',
        source: 'live_link_approved',
        proofId: payment.id,
        createdBy: reviewer
      });
    }
  }

  /**
   * REJECT PAYMENT PROOF
   */
  async rejectPaymentProof(payment, reason = '') {
    if (!firebaseReady || !db) {
      logAudit('payment_request_rejected', 'payment_proof', payment.id, {}, { reason });
      return;
    }
    const proofRef = doc(db, 'payment_proofs', payment.id);
    await runTransaction(db, async (transaction) => {
      const proofDoc = await transaction.get(proofRef);
      if (!proofDoc.exists()) throw new Error('Payment proof not found.');
      const proofData = proofDoc.data();
      if (proofData.status === 'rejected') throw new Error('This payment has already been rejected.');
      if (proofData.status === 'approved') throw new Error('This payment has already been approved and cannot be rejected.');
      transaction.update(proofRef, { 
        status: 'rejected', 
        rejectionReason: reason || '',
        updatedAt: new Date().toISOString() 
      });
    });
    logAudit('payment_request_rejected', 'payment_proof', payment.id, {}, { reason });
  }

  async getUserPaymentProofs(userId) { return await dbGetUserPaymentProofs(userId); }
  async getUserRevenueState(userId, invoices, subscription) { return await dbGetUserRevenueState(userId, invoices, subscription); }
}

export const paymentEngine = new PaymentEngine();
