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
} from './dbEngine';

import { determinePaymentStatus } from '../utils/invoiceMath';

import { db, firebaseReady } from './firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

export const invoiceEngine = {
  async getInvoices(includeDeleted = false) {
    return dbGetInvoices(includeDeleted);
  },

  async saveInvoice(invoice) {
    const result = await dbSaveInvoice(invoice);
    const invList = await dbGetInvoices();
    return { ...result, invoice: invList.find(i => i.id === invoice.id) };
  },

  async deleteInvoice(id, permanent = false) {
    return dbDeleteInvoice(id, permanent);
  },

  async restoreInvoice(id) {
    return dbRestoreInvoice(id);
  },

  async getByPublicToken(token) {
    return dbGetInvoiceByPublicToken(token);
  },

  async getCustomerPortalInvoices(customerId, phone) {
    return dbGetCustomerPortalInvoices(customerId, phone);
  },

  async getStudentInvoices(studentId, studentEmail) {
    return dbGetStudentInvoices(studentId, studentEmail);
  },

  async getStudentProfile(studentId, studentEmail) {
    return dbGetStudentProfile(studentId, studentEmail);
  },

  async resetLiveLink(invoiceId) {
    return dbResetInvoiceLiveLink(invoiceId);
  },

  async ensurePublicToken(invoice) {
    return dbEnsureInvoicePublicToken(invoice);
  },

  async syncFromCloud() {
    return dbSyncFromFirestore();
  },

  async retrySync(invoiceId) {
    return dbRetrySyncInvoice(invoiceId);
  },

  async updateInvoice(invoiceId, updates) { const invoice = await this.getInvoiceById(invoiceId); if (invoice) { return await dbSaveInvoice({ ...invoice, ...updates }); } return null; },

  generateSecureToken() {
    return dbGenerateSecureToken();
  },

  async getInvoiceByPublicToken(token) {
    return await dbGetInvoiceByPublicToken(token);
  },

  async ensureInvoicePublicToken(invoiceId) {
    return await dbEnsureInvoicePublicToken(invoiceId);
  },

  calculatePaymentStatus(invoice) {
    if (!invoice) return 'Unknown';
    return determinePaymentStatus(invoice.paidAmount || invoice.amountPaid || 0, invoice.grandTotal || 0, invoice.paymentStatus);
  },

  calculateDueLedger(invoices) {
    if (!invoices || !invoices.length) return { totalDue: 0, totalPaid: 0, totalOverdue: 0, dueInvoices: [] };
    const now = new Date();
    let totalDue = 0;
    let totalPaid = 0;
    let totalOverdue = 0;
    const dueInvoices = [];
    invoices.forEach(inv => {
      const grandTotal = inv.grandTotal || 0;
      const paid = inv.paidAmount || 0;
      const due = Math.max(0, grandTotal - paid);
      const dueDate = inv.dueDate ? new Date(inv.dueDate) : null;
      const isOverdue = dueDate && dueDate < now && due > 0;
      totalDue += due;
      totalPaid += paid;
      if (isOverdue) totalOverdue += due;
      if (due > 0) {
        dueInvoices.push({ ...inv, due, isOverdue });
      }
    });
    return { totalDue, totalPaid, totalOverdue, dueInvoices, invoiceCount: dueInvoices.length };
  },

  async markAsPaid(invoiceId, paymentData = {}) {
    const invoices = await dbGetInvoices();
    const idx = invoices.findIndex(inv => inv.id === invoiceId);
    if (idx === -1) throw new Error('Invoice not found');
    const invoice = { ...invoices[idx] };
    if (!invoice.paymentHistory) invoice.paymentHistory = [];
    if (!invoice.paymentProofs) invoice.paymentProofs = [];
    const paymentEntry = {
      id: 'pmt_' + Date.now() + Math.random().toString(36).substr(2, 9),
      amount: paymentData.amount || invoice.grandTotal || 0,
      method: paymentData.method || 'Manual',
      transactionId: paymentData.transactionId || '',
      date: new Date().toISOString(),
      note: paymentData.note || ''
    };
    invoice.paymentHistory.push(paymentEntry);
    invoice.paidAmount = (invoice.paidAmount || 0) + paymentEntry.amount;
    invoice.paymentStatus = this.calculatePaymentStatus(invoice);
    const result = await dbSaveInvoice(invoice);
    logAudit('payment_recorded', 'invoice', invoice.id, { oldPaid: invoices[idx].paidAmount }, { newPaid: invoice.paidAmount });

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

    return result;
  },

  async getPaymentStats(userId) {
    const invoices = await dbGetInvoices();
    const userInvoices = userId ? invoices.filter(inv => inv.userId === userId) : invoices;
    const stats = { total: 0, paid: 0, unpaid: 0, partial: 0, totalRevenue: 0, totalOutstanding: 0 };
    userInvoices.forEach(inv => {
      const gt = inv.grandTotal || 0;
      const paid = inv.paidAmount || 0;
      stats.total++;
      stats.totalRevenue += paid;
      stats.totalOutstanding += (gt - paid);
      const status = this.calculatePaymentStatus(inv);
      if (status === 'Paid') stats.paid++;
      else if (status === 'Partially Paid') stats.partial++;
      else stats.unpaid++;
    });
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
