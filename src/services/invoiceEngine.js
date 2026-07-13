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
  getStudentProfile as dbGetStudentProfile
} from './dbEngine';

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

  calculatePaymentStatus(invoice) {
    if (!invoice) return 'unknown';
    const totalDue = invoice.grandTotal || 0;
    const paid = invoice.paidAmount || 0;
    if (paid >= totalDue) return 'paid';
    if (paid > 0) return 'partial';
    return 'unpaid';
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
      if (status === 'paid') stats.paid++;
      else if (status === 'partial') stats.partial++;
      else stats.unpaid++;
    });
    return stats;
  }
};
