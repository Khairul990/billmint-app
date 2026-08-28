import { invoiceEngine } from './invoiceEngine.js';
import {
  getInvoicePaymentStatus,
  getInvoicePaidTotal,
  calculateCanonicalInvoiceFinancials
} from '../utils/invoiceMath.js';
import { db, firebaseReady } from './firebaseConfig.js';
import { doc, runTransaction } from 'firebase/firestore';
import {
  submitPlatformPaymentProof as dbSubmitPlatformPaymentProof,
  getUserPaymentProofs as dbGetUserPaymentProofs,
  getUserRevenueState as dbGetUserRevenueState
} from './dbEngine.js';

class PaymentEngine {
  // Every direct/manual payment enters the same canonical invoice payment ledger.
  async addPayment(invoiceId, paymentData = {}) {
    return await invoiceEngine.markAsPaid(invoiceId, paymentData);
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

  getAllTransactions(invoices = []) {
    const transactions = [];
    invoices.forEach(inv => {
      (inv.payments || []).forEach(p => transactions.push({
        ...p,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer?.name || inv.customerName || 'Unknown'
      }));
      // Also expose canonical paymentHistory so every payment source is visible.
      (inv.paymentHistory || []).forEach(p => transactions.push({
        ...p,
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customer?.name || inv.customerName || 'Unknown'
      }));
    });
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async submitPlatformPaymentProof(proofData) {
    return await dbSubmitPlatformPaymentProof(proofData);
  }

  // Payment-proof approval is atomic in Firestore and then persisted through
  // invoiceEngine.saveInvoice(), which is the single canonical normalization path.
  async approvePaymentProof(payment) {
    if (!firebaseReady || !db) throw new Error('Database not initialized');

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
          source: 'payment_proof'
        });
      }

      // Use the same canonical resolver for the public invoice snapshot.
      const canonical = calculateCanonicalInvoiceFinancials({
        ...publicData,
        paymentHistory: history
      });

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

    // Persist the same payment in the owner's canonical invoice ledger.
    if (payment.invoiceId) {
      const localInvoices = await invoiceEngine.getInvoices(true);
      const existingInvoice = localInvoices.find(inv => inv.id === payment.invoiceId);
      if (existingInvoice) {
        const history = Array.isArray(existingInvoice.paymentHistory) ? [...existingInvoice.paymentHistory] : [];
        const alreadyRecorded = history.some(p => p.proofId === payment.id || p.id === payment.id || p.id === `pmt_${payment.id}`);
        if (!alreadyRecorded) {
          history.push({
            id: `pmt_${payment.id}`,
            proofId: payment.id,
            amount: paymentAmount,
            method: payment.paymentMethod || existingInvoice.paymentMethod || 'Proof Approval',
            transactionId: payment.transactionId || '',
            date: new Date().toISOString(),
            note: payment.notes || payment.note || 'Payment proof approved',
            source: 'payment_proof'
          });
        }

        const normalized = await invoiceEngine.saveInvoice({
          ...existingInvoice,
          paymentHistory: history,
          paymentMethod: payment.paymentMethod || existingInvoice.paymentMethod || 'UPI'
        });

        // Idempotent internal-bank record: one ledger entry per approved payment.
        try {
          const { bankEngine } = await import('./bankEngine.js');
          const entry = history.find(p => p.proofId === payment.id || p.id === `pmt_${payment.id}`);
          if (entry) {
            await bankEngine.autoPostPayment({
              id: entry.id,
              amount: entry.amount,
              method: entry.method,
              date: entry.date,
              invoiceId: normalized.id,
              invoiceNumber: normalized.invoiceNumber,
              customerId: normalized.customer?.id || normalized.customerId || null,
              customerName: normalized.customer?.name || normalized.customerName || '',
              note: entry.note
            });
          }
        } catch (e) {
          console.warn('[BANK] auto-post proof payment skipped:', e);
        }

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('billqyro_invoice_updated', { detail: normalized }));
          window.dispatchEvent(new Event('billqyro_bank_updated'));
          window.dispatchEvent(new Event('billqyro_sync'));
          window.dispatchEvent(new CustomEvent('billqyro:data-updated', { detail: { collectionName: 'invoices', doc: normalized } }));
        }
      }
    }
  }

  async rejectPaymentProof(payment) {
    if (!firebaseReady || !db) throw new Error('Database not initialized');
    const proofRef = doc(db, 'payment_proofs', payment.id);
    await runTransaction(db, async (transaction) => {
      const proofDoc = await transaction.get(proofRef);
      if (!proofDoc.exists()) throw new Error('Payment proof not found.');
      const proofData = proofDoc.data();
      if (proofData.status === 'rejected') throw new Error('This payment has already been rejected.');
      if (proofData.status === 'approved') throw new Error('This payment has already been approved and cannot be rejected.');
      transaction.update(proofRef, { status: 'rejected', updatedAt: new Date().toISOString() });
    });
  }

  async getUserPaymentProofs(userId) {
    return await dbGetUserPaymentProofs(userId);
  }

  async getUserRevenueState(userId, invoices, subscription) {
    return await dbGetUserRevenueState(userId, invoices, subscription);
  }
}

export const paymentEngine = new PaymentEngine();
