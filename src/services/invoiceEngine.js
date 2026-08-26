import {
  getInvoices as dbGetInvoices,
  saveInvoice as dbSaveInvoice,
  deleteInvoice as dbDeleteInvoice,
  getInvoiceByPublicToken as dbGetInvoiceByPublicToken,
  getCustomerPortalInvoices as dbGetCustomerPortalInvoices,
  getStudentInvoices as dbGetStudentInvoices,
  resetInvoiceLiveLink as dbResetInvoiceLiveLink,
  restoreInvoice as dbRestoreInvoice,
  logAudit,
  getStudentProfile as dbGetStudentProfile,
  ensureInvoicePublicToken as dbEnsureInvoicePublicToken,
  syncFromFirestore as dbSyncFromFirestore,
  retrySyncInvoice as dbRetrySyncInvoice,
  generateSecureToken as dbGenerateSecureToken
} from './dbEngine.js';

import { 
  determinePaymentStatus, 
  getInvoicePaidTotal, 
  getInvoiceBalanceDue, 
  getInvoicePaymentStatus,
  normalizeInvoiceFinancials 
} from '../utils/invoiceMath.js';

import { db, firebaseReady } from './firebaseConfig.js';
import { doc, getDoc } from 'firebase/firestore';

export const invoiceEngine = {
  async getInvoices(includeDeleted = false) {
    return dbGetInvoices(includeDeleted);
  },

  async saveInvoice(invoice) {
    const normalized = normalizeInvoiceFinancials(invoice);
    const saved = await dbSaveInvoice(normalized);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('billqyro_invoice_updated', { detail: saved }));
      window.dispatchEvent(new Event('billqyro_sync'));
      window.dispatchEvent(new CustomEvent('billqyro:data-updated', { detail: { collectionName: 'invoices', doc: saved } }));
    }
    return saved;
  },

  async deleteInvoice(invoiceId, permanent = false) {
    const res = await dbDeleteInvoice(invoiceId, permanent);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('billqyro_sync'));
      window.dispatchEvent(new CustomEvent('billqyro:data-updated', { detail: { collectionName: 'invoices' } }));
    }
    return res;
  },

  async restoreInvoice(invoiceId) {
    const res = await dbRestoreInvoice(invoiceId);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('billqyro_sync'));
      window.dispatchEvent(new CustomEvent('billqyro:data-updated', { detail: { collectionName: 'invoices' } }));
    }
    return res;
  },

  async getCustomerPortalInvoices(customerId) {
    return dbGetCustomerPortalInvoices(customerId);
  },

  async getStudentInvoices(studentId) {
    return dbGetStudentInvoices(studentId);
  },

  async getStudentProfile(studentId) {
    return dbGetStudentProfile(studentId);
  },

  async resetInvoiceLiveLink(invoiceId) {
    return await dbResetInvoiceLiveLink(invoiceId);
  },

  async retrySync(invoiceId) {
    return await dbRetrySyncInvoice(invoiceId);
  },

  async syncAllPending() {
    return await dbSyncFromFirestore();
  },

  async getInvoiceByPublicToken(token) {
    return await dbGetInvoiceByPublicToken(token);
  },

  async ensureInvoicePublicToken(invoiceId) {
    return await dbEnsureInvoicePublicToken(invoiceId);
  },

  calculatePaymentStatus(invoice) {
    if (!invoice) return 'Unknown';
    return getInvoicePaymentStatus(invoice);
  },

  calculateDueLedger(invoices) {
    if (!invoices || !invoices.length) return { totalDue: 0, totalPaid: 0, totalOverdue: 0, dueInvoices: [] };
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    let totalDue = 0;
    let totalPaid = 0;
    let totalOverdue = 0;
    const dueInvoices = [];
    invoices.forEach(inv => {
      if (inv.isDeleted || inv.status === 'Cancelled' || inv.status === 'Void') return;
      const grandTotal = Math.round((parseFloat(inv.grandTotal || inv.total) || 0) * 100) / 100;
      const paid = getInvoicePaidTotal(inv);
      const due = Math.max(0, Math.round((grandTotal - paid) * 100) / 100);
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      const isOverdue = dueDate && !isNaN(dueDate.getTime()) && dueDate < now && due > 0;
      totalDue += due;
      totalPaid += paid;
      if (isOverdue) totalOverdue += due;
      if (due > 0) {
        dueInvoices.push({ ...inv, due, isOverdue });
      }
    });
    return { 
      totalDue: Math.round(totalDue * 100) / 100, 
      totalPaid: Math.round(totalPaid * 100) / 100, 
      totalOverdue: Math.round(totalOverdue * 100) / 100, 
      dueInvoices, 
      invoiceCount: dueInvoices.length 
    };
  },

  async markAsPaid(invoiceId, paymentData = {}) {
    const invoices = await dbGetInvoices(true);
    const idx = invoices.findIndex(inv => inv.id === invoiceId);
    if (idx === -1) throw new Error('Invoice not found');
    const invoice = { ...invoices[idx] };
    if (!invoice.paymentHistory) invoice.paymentHistory = [];
    if (!invoice.paymentProofs) invoice.paymentProofs = [];
    
    const paymentAmount = paymentData.amount !== undefined ? parseFloat(paymentData.amount) : (invoice.grandTotal || 0);
    const paymentEntry = {
      id: paymentData.id || ('pmt_' + Date.now() + Math.random().toString(36).substr(2, 9)),
      amount: paymentAmount,
      method: paymentData.method || invoice.paymentMethod || 'Manual',
      transactionId: paymentData.transactionId || '',
      date: paymentData.date || new Date().toISOString(),
      note: paymentData.note || ''
    };
    invoice.paymentHistory.push(paymentEntry);

    const totalPaid = Math.round(invoice.paymentHistory.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) * 100) / 100;
    invoice.paidAmount = totalPaid;
    invoice.amountPaid = totalPaid;
    invoice.grandTotal = Math.round((parseFloat(invoice.grandTotal || invoice.total) || 0) * 100) / 100;
    invoice.balanceDue = Math.max(0, Math.round((invoice.grandTotal - totalPaid) * 100) / 100);
    invoice.paymentStatus = getInvoicePaymentStatus(invoice);

    const result = await dbSaveInvoice(invoice);
    logAudit('payment_recorded', 'invoice', invoice.id, { oldPaid: invoices[idx].paidAmount ?? invoices[idx].amountPaid }, { newPaid: totalPaid });

    // Additive: mirror payment into Internal Bank ledger (idempotent, failure-isolated).
    try {
      const { bankEngine } = await import('./bankEngine');
      await bankEngine.autoPostPayment({
        id: paymentEntry.id,
        amount: paymentEntry.amount,
        method: paymentEntry.method,
        date: paymentEntry.date,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customer?.id || invoice.customerId || null,
        customerName: invoice.customer?.name || invoice.customerName || '',
        note: paymentEntry.note
      });
    } catch (e) {
      console.warn('[BANK] auto-post payment skipped (non-blocking):', e);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('billqyro_invoice_updated', { detail: result }));
      window.dispatchEvent(new Event('billqyro_bank_updated'));
      window.dispatchEvent(new Event('billqyro_sync'));
      window.dispatchEvent(new CustomEvent('billqyro:data-updated', { detail: { collectionName: 'invoices', doc: result } }));
    }

    return result;
  },

  async getPaymentStats(userId) {
    const invoices = await dbGetInvoices();
    const userInvoices = userId ? invoices.filter(inv => inv.userId === userId) : invoices;
    const stats = { total: 0, paid: 0, unpaid: 0, partial: 0, totalRevenue: 0, totalOutstanding: 0 };
    userInvoices.forEach(inv => {
      if (inv.isDeleted || inv.status === 'Cancelled' || inv.status === 'Void') return;
      const gt = Math.round((parseFloat(inv.grandTotal || inv.total) || 0) * 100) / 100;
      const paid = getInvoicePaidTotal(inv);
      const due = Math.max(0, Math.round((gt - paid) * 100) / 100);
      stats.total++;
      stats.totalRevenue += paid;
      stats.totalOutstanding += due;
      const status = getInvoicePaymentStatus(inv);
      if (status === 'Paid') stats.paid++;
      else if (status === 'Partially Paid') stats.partial++;
      else stats.unpaid++;
    });
    stats.totalRevenue = Math.round(stats.totalRevenue * 100) / 100;
    stats.totalOutstanding = Math.round(stats.totalOutstanding * 100) / 100;
    return stats;
  },

  async syncPublicInvoices(invoices) {
    if (!firebaseReady || !invoices || invoices.length === 0) return { changed: false, updatedInvoices: invoices };
    let changed = false;
    const updatedInvoices = [...invoices];
    
    for (let i = 0; i < updatedInvoices.length; i++) {
      const inv = updatedInvoices[i];
      if (inv.publicToken) {
        try {
          const docRef = doc(db, 'publicInvoices', inv.publicToken);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const pubData = snap.data();
            const localProofsStr = JSON.stringify(inv.paymentProofs || []);
            const pubProofsStr = JSON.stringify(pubData.paymentProofs || []);
            
            let newProof = false;
            if (pubData.paymentProofs && pubData.paymentProofs.length > (inv.paymentProofs || []).length) {
              newProof = true;
            }

            if (localProofsStr !== pubProofsStr || inv.paymentStatus !== pubData.paymentStatus) {
              updatedInvoices[i] = {
                ...inv,
                paymentStatus: pubData.paymentStatus,
                paymentProofs: pubData.paymentProofs || [],
                paymentHistory: pubData.paymentHistory || [],
                amountPaid: pubData.amountPaid || inv.amountPaid,
                balanceDue: pubData.balanceDue !== undefined ? pubData.balanceDue : inv.balanceDue
              };
              changed = true;
              await dbSaveInvoice(updatedInvoices[i]);
            }
          }
        } catch (err) {
          console.warn('Failed to background sweep public invoice:', inv.publicToken, err);
        }
      }
    }
    
    return { changed, updatedInvoices };
  },

  async syncSinglePublicInvoice(invoice) {
    if (!firebaseReady || !invoice || !invoice.publicToken) return invoice;
    try {
      const docRef = doc(db, 'publicInvoices', invoice.publicToken);
      const snap = await getDoc(docRef);
      if (!snap.exists()) return invoice;
      
      const pubData = snap.data();
      const localProofsStr = JSON.stringify(invoice.paymentProofs || []);
      const pubProofsStr = JSON.stringify(pubData.paymentProofs || []);
      
      if (localProofsStr !== pubProofsStr || invoice.paymentStatus !== pubData.paymentStatus) {
        const updated = {
          ...invoice,
          paymentStatus: pubData.paymentStatus,
          paymentProofs: pubData.paymentProofs || [],
          paymentHistory: pubData.paymentHistory || [],
          amountPaid: pubData.amountPaid || invoice.amountPaid,
          balanceDue: pubData.balanceDue !== undefined ? pubData.balanceDue : invoice.balanceDue
        };
        await dbSaveInvoice(updated);
        return updated;
      }
    } catch (err) {
      console.warn('Failed to sync single public invoice:', err);
    }
    return invoice;
  }
};
