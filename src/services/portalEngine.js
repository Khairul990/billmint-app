import { invoiceEngine } from './invoiceEngine';
import {  
  verifyCustomerPortal as dbVerifyCustomerPortal,
  listenToPublicInvoice as dbListenToPublicInvoice,
  submitPublicPaymentProofTransaction as dbSubmitPublicPaymentProofTransaction,
  uploadPublicPaymentProof as dbUploadPublicPaymentProof
} from './dbEngine';
import { paymentEngine } from './paymentEngine';

class PortalEngine {
  listenToPublicInvoice(token, callback) {
    return dbListenToPublicInvoice(token, callback);
  }

  async submitPublicPaymentProofTransaction(docId, invoice, amount, paymentMethod, downloadURL, notes) {
    return await dbSubmitPublicPaymentProofTransaction(docId, invoice, amount, paymentMethod, downloadURL, notes);
  }

  async uploadPublicPaymentProof(docId, file) {
    return await dbUploadPublicPaymentProof(docId, file);
  }

  // Public invoice access
  async getPublicInvoice(invoiceId) {
    // In production, this would query a dedicated public endpoint or verify tokens.
    // For now, it delegates to invoiceEngine which reads from dbEngine
    return await invoiceEngine.getInvoiceById(invoiceId);
  }

  // Upload payment proof from customer portal
  async submitPaymentProof(invoiceId, uploadData) {
    // uploadData: { amount, method, file/url, notes }
    return await paymentEngine.recordPaymentProof(invoiceId, uploadData);
  }

  // Approve a quotation from customer portal
  async approveQuotation(invoiceId, signatureData) {
    const invoice = await invoiceEngine.getInvoiceById(invoiceId);
    if (!invoice) throw new Error("Invoice/Quotation not found");

    if (invoice.type === 'Quotation' || invoice.type === 'Estimate') {
      invoice.status = 'Approved';
      invoice.signature = signatureData;
      invoice.updatedAt = new Date().toISOString();
      return await invoiceEngine.saveInvoice(invoice);
    }
    throw new Error("Document is not a quotation or estimate");
  }

  // Reject a quotation from customer portal
  async rejectQuotation(invoiceId, reason) {
    const invoice = await invoiceEngine.getInvoiceById(invoiceId);
    if (!invoice) throw new Error("Invoice/Quotation not found");

    if (invoice.type === 'Quotation' || invoice.type === 'Estimate') {
      invoice.status = 'Rejected';
      invoice.rejectionReason = reason;
      invoice.updatedAt = new Date().toISOString();
      return await invoiceEngine.saveInvoice(invoice);
    }
    throw new Error("Document is not a quotation or estimate");
  }

  // Get customer's ledger for the portal (requires authentication/token)
  async getCustomerPortalData(customerId) {
    const invoices = await invoiceEngine.getInvoices();
    const customerInvoices = invoices.filter(inv => inv.customer?.id === customerId || inv.customerId === customerId);
    
    let totalDue = 0;
    customerInvoices.forEach(inv => {
      totalDue += ((inv.total || 0) - (inv.amountPaid || 0));
    });

    return {
      invoices: customerInvoices,
      totalDue
    };
  }

  async verifyCustomerPortal(phone, workspaceId) {
    return await dbVerifyCustomerPortal(phone, workspaceId);
  }
}

export const portalEngine = new PortalEngine();
