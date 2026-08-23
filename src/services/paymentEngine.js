import { invoiceEngine } from './invoiceEngine';

import { db, firebaseReady } from './firebaseConfig';
import { doc, runTransaction } from 'firebase/firestore';
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

  // Atomically approve a payment proof
  async approvePaymentProof(payment) {
    if (!firebaseReady || !db) throw new Error("Database not initialized");

    const proofRef = doc(db, 'payment_proofs', payment.id);

    await runTransaction(db, async (transaction) => {
      const proofDoc = await transaction.get(proofRef);
      if (!proofDoc.exists()) {
        throw new Error('Payment proof not found.');
      }
      const proofData = proofDoc.data();
      if (proofData.status === 'approved') {
        throw new Error('This payment has already been approved.');
      }

      transaction.update(proofRef, { 
        status: 'approved',
        updatedAt: new Date().toISOString()
      });

      if (payment.invoiceId) {
        const localInvoices = await invoiceEngine.getInvoices();
        const existingInvoice = localInvoices.find(inv => inv.id === payment.invoiceId);
        
        if (existingInvoice && existingInvoice.publicToken) {
          const publicInvRef = doc(db, 'publicInvoices', existingInvoice.publicToken);
          const pInvDoc = await transaction.get(publicInvRef);
          if (pInvDoc.exists()) {
            const pData = pInvDoc.data();
            const grandTotal = pData.grandTotal || 0;
            const currentPaid = parseFloat(pData.amountPaid) || 0;
            const paymentAmount = parseFloat(payment.amount) || 0;
            const newPaid = currentPaid + paymentAmount;
            const newBalance = Math.max(0, grandTotal - newPaid);
            let newStatus;
            if (newBalance <= 0) newStatus = 'Paid';
            else if (newPaid > 0) newStatus = 'Partially Paid';
            else newStatus = pData.paymentStatus;
            
            transaction.update(publicInvRef, { 
              paymentStatus: newStatus,
              status: newStatus,
              amountPaid: newPaid,
              balanceDue: newBalance
            });
          }
        }
      }
    });

    if (payment.invoiceId) {
      const localInvoices = await invoiceEngine.getInvoices();
      const existingInvoice = localInvoices.find(inv => inv.id === payment.invoiceId);
      
      if (existingInvoice) {
        const paymentAmount = parseFloat(payment.amount) || 0;
        const invoice = { ...existingInvoice };
        if (!invoice.paymentHistory) invoice.paymentHistory = [];

        // Deduplication check: prevent applying same proof twice
        const alreadyApplied = invoice.paymentHistory.some(p => p.proofId === payment.id || p.id === payment.id || p.id === ('pmt_' + payment.id));
        if (!alreadyApplied && paymentAmount > 0) {
          const paymentEntry = {
            id: 'pmt_' + payment.id,
            proofId: payment.id,
            amount: paymentAmount,
            method: payment.paymentMethod || invoice.paymentMethod || 'Proof Approval',
            date: new Date().toISOString(),
            note: payment.notes || 'Payment proof approved'
          };
          invoice.paymentHistory.push(paymentEntry);

          // Mirror into Internal Bank ledger (idempotent)
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
            console.warn('[BANK] auto-post proof payment skipped:', e);
          }
        }

        const totalPaid = Math.round(invoice.paymentHistory.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) * 100) / 100;
        const grandTotal = Math.round((parseFloat(invoice.grandTotal || invoice.total) || 0) * 100) / 100;
        const newBalance = Math.max(0, Math.round((grandTotal - totalPaid) * 100) / 100);
        
        let newStatus;
        if (newBalance <= 0 && grandTotal > 0) newStatus = 'Paid';
        else if (totalPaid > 0) newStatus = 'Partially Paid';
        else newStatus = invoice.paymentStatus || 'Unpaid';

        await invoiceEngine.saveInvoice({
          ...invoice,
          status: newStatus,
          paymentStatus: newStatus,
          amountPaid: totalPaid,
          paidAmount: totalPaid,
          balanceDue: newBalance,
          paymentMethod: payment.paymentMethod || invoice.paymentMethod || 'UPI'
        });
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('billqyro_sync'));
      }
    }
  }


  // Atomically reject a payment proof
  async rejectPaymentProof(payment) {
    if (!firebaseReady || !db) throw new Error("Database not initialized");

    const proofRef = doc(db, 'payment_proofs', payment.id);

    await runTransaction(db, async (transaction) => {
      const proofDoc = await transaction.get(proofRef);
      if (!proofDoc.exists()) {
        throw new Error('Payment proof not found.');
      }
      const proofData = proofDoc.data();
      if (proofData.status === 'rejected') {
        throw new Error('This payment has already been rejected.');
      }
      if (proofData.status === 'approved') {
        throw new Error('This payment has already been approved and cannot be rejected.');
      }

      transaction.update(proofRef, { 
        status: 'rejected',
        updatedAt: new Date().toISOString()
      });

      if (payment.invoiceId) {
        const localInvoices = await invoiceEngine.getInvoices();
        const existingInvoice = localInvoices.find(inv => inv.id === payment.invoiceId);
        
        if (existingInvoice && existingInvoice.publicToken) {
          const publicInvRef = doc(db, 'publicInvoices', existingInvoice.publicToken);
          const pInvDoc = await transaction.get(publicInvRef);
          if (pInvDoc.exists()) {
            const pData = pInvDoc.data();
            const grandTotal = pData.grandTotal || 0;
            const currentPaid = parseFloat(pData.amountPaid) || 0;
            const paymentAmount = parseFloat(payment.amount) || 0;
            const revertedPaid = Math.max(0, currentPaid - paymentAmount);
            const revertedBalance = Math.max(0, grandTotal - revertedPaid);
            let revertedStatus;
            if (revertedBalance <= 0 && revertedPaid > 0) revertedStatus = 'Paid';
            else if (revertedPaid <= 0) revertedStatus = 'Unpaid';
            else revertedStatus = 'Partially Paid';

            transaction.update(publicInvRef, {
              paymentStatus: revertedStatus,
              status: revertedStatus,
              amountPaid: revertedPaid,
              balanceDue: revertedBalance
            });
          }
        }
      }
    });

    if (payment.invoiceId) {
      const localInvoices = await invoiceEngine.getInvoices();
      const existingInvoice = localInvoices.find(inv => inv.id === payment.invoiceId);
      if (existingInvoice) {
        const grandTotal = parseFloat(existingInvoice.grandTotal) || 0;
        const currentPaid = parseFloat(existingInvoice.amountPaid) || 0;
        const paymentAmount = parseFloat(payment.amount) || 0;
        const revertedPaid = Math.max(0, currentPaid - paymentAmount);
        const revertedBalance = Math.max(0, grandTotal - revertedPaid);
        let revertedStatus;
        if (revertedBalance <= 0 && revertedPaid > 0) revertedStatus = 'Paid';
        else if (revertedPaid <= 0) revertedStatus = 'Unpaid';
        else revertedStatus = 'Partially Paid';

        await invoiceEngine.saveInvoice({
          ...existingInvoice,
          status: revertedStatus,
          paymentStatus: revertedStatus,
          amountPaid: revertedPaid,
          balanceDue: revertedBalance
        });
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('billqyro_sync'));
      }
    }
  }

  async getUserPaymentProofs(userId) {
    return await dbGetUserPaymentProofs(userId);
  }

  async getUserRevenueState(userId, invoices, subscription) {
    return await dbGetUserRevenueState(userId, invoices, subscription);
  }
}

export const paymentEngine = new PaymentEngine();
