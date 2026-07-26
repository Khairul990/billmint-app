import { invoiceEngine } from './invoiceEngine';
import * as dbEngine from './dbEngine';
import {  submitPlatformPaymentProof as dbSubmitPlatformPaymentProof, getUserPaymentProofs as dbGetUserPaymentProofs, getUserRevenueState as dbGetUserRevenueState  } from './dbEngine';

class PaymentEngine {
  // Add payment transaction to an invoice
  async addPayment(invoiceId, paymentData) {
    const invoice = await invoiceEngine.getInvoiceById(invoiceId);
    if (!invoice) throw new Error("Invoice not found");

    if (!invoice.payments) invoice.payments = [];
    
    const newPayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      amount: Number(paymentData.amount) || 0,
      method: paymentData.method || 'Cash',
      date: paymentData.date || new Date().toISOString(),
      reference: paymentData.reference || '',
      notes: paymentData.notes || '',
      proofUrl: paymentData.proofUrl || null
    };

    invoice.payments.push(newPayment);
    invoice.amountPaid = this.calculateTotalPaid(invoice.payments);
    
    // Auto-update status
    if (invoice.amountPaid >= invoice.total) {
      invoice.status = 'Paid';
    } else if (invoice.amountPaid > 0) {
      invoice.status = 'Partial';
    }

    invoice.updatedAt = new Date().toISOString();
    
    // Save updated invoice back via invoiceEngine
    await invoiceEngine.saveInvoice(invoice);
    return invoice;
  }

  // Remove a payment transaction
  async removePayment(invoiceId, paymentId) {
    const invoice = await invoiceEngine.getInvoiceById(invoiceId);
    if (!invoice || !invoice.payments) return null;

    invoice.payments = invoice.payments.filter(p => p.id !== paymentId);
    invoice.amountPaid = this.calculateTotalPaid(invoice.payments);

    // Re-evaluate status
    if (invoice.amountPaid >= invoice.total) {
      invoice.status = 'Paid';
    } else if (invoice.amountPaid > 0) {
      invoice.status = 'Partial';
    } else {
      invoice.status = 'Pending';
    }

    invoice.updatedAt = new Date().toISOString();
    await invoiceEngine.saveInvoice(invoice);
    return invoice;
  }

  // Calculate total paid amount from payments array
  calculateTotalPaid(payments = []) {
    return payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  }

  // Record a payment proof (e.g., uploaded screenshot)
  async recordPaymentProof(invoiceId, proofData) {
    // This could also interact with storageEngine to upload the file first
    // For now, we assume proofData contains the uploaded URL
    return await this.addPayment(invoiceId, {
      amount: proofData.amount,
      method: proofData.method || 'Transfer',
      date: new Date().toISOString(),
      proofUrl: proofData.url
    });
  }

  // Fetch all transactions across a set of invoices
  getAllTransactions(invoices = []) {
    let transactions = [];
    invoices.forEach(inv => {
      if (inv.payments && inv.payments.length > 0) {
        inv.payments.forEach(p => {
          transactions.push({
            ...p,
            invoiceId: inv.id,
            invoiceNumber: inv.invoiceNumber,
            customerName: inv.customer?.name || inv.customerName || 'Unknown'
          });
        });
      }
    });
    // Sort by date descending
    return transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  async submitPlatformPaymentProof(proofData) {
    return await dbSubmitPlatformPaymentProof(proofData);
  }

  async getUserPaymentProofs(userId) {
    return await dbGetUserPaymentProofs(userId);
  }

  async getUserRevenueState(userId, invoices, subscription) {
    return await dbGetUserRevenueState(userId, invoices, subscription);
  }
}

export const paymentEngine = new PaymentEngine();
