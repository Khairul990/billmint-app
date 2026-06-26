import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../services/firebaseConfig';
import { doc, runTransaction } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Search, ReceiptText, ExternalLink, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { saveInvoice, getInvoices } from '../services/dbEngine';
import { pageVariants, staggerContainer, staggerItem, modalOverlayVariants, modalContentVariants } from '../utils/animations';
import { CardSkeleton } from '../components/PremiumSkeleton';

const getStatusBadge = (status) => {
  switch (status) {
    case 'approved': return { label: 'Approved', class: 'badge-premium badge-success', icon: CheckCircle2 };
    case 'rejected': return { label: 'Rejected', class: 'badge-premium badge-danger', icon: XCircle };
    default: return { label: 'Pending Review', class: 'badge-premium badge-warning animate-pulse', icon: Clock };
  }
};

const PendingPayments = ({ setCurrentTab, pendingPayments = [], businessSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [selectedProof, setSelectedProof] = useState(null);

  const isLoading = !Array.isArray(pendingPayments);

  const filteredPayments = pendingPayments.filter(payment => {
    const searchStr = searchTerm.toLowerCase();
    return (
      payment.invoiceNumber?.toLowerCase().includes(searchStr) ||
      payment.customerName?.toLowerCase().includes(searchStr) ||
      payment.amount?.toString().includes(searchStr)
    );
  });

  const handleApprove = async (payment) => {
    try {
      setProcessingId(payment.id);

      const proofRef = doc(db, 'payment_proofs', payment.id);
      
      // Use transaction to prevent duplicate approvals and race conditions
      await runTransaction(db, async (transaction) => {
        const proofDoc = await transaction.get(proofRef);
        if (!proofDoc.exists()) {
          throw new Error('Payment proof not found.');
        }
        const proofData = proofDoc.data();
        if (proofData.status === 'approved') {
          throw new Error('This payment has already been approved.');
        }
        if (proofData.status === 'rejected') {
          throw new Error('This payment has already been rejected.');
        }

        transaction.update(proofRef, { 
          status: 'approved',
          updatedAt: new Date().toISOString()
        });

        if (payment.invoiceId) {
          const publicInvRef = doc(db, 'public_invoices', payment.invoiceId);
          const pInvDoc = await transaction.get(publicInvRef);
          if (pInvDoc.exists()) {
            const pData = pInvDoc.data();
            const grandTotal = pData.grandTotal || 0;
            const currentPaid = parseFloat(pData.amountPaid) || 0;
            const paymentAmount = parseFloat(payment.amount) || 0;
            const newPaid = currentPaid + paymentAmount;
            const newBalance = Math.max(0, grandTotal - newPaid);
            let newStatus = pData.paymentStatus;
            if (newBalance <= 0) newStatus = 'Paid';
            else if (newPaid > 0) newStatus = 'Partially Paid';
            
            transaction.update(publicInvRef, { 
              paymentStatus: newStatus,
              status: newStatus,
              amountPaid: newPaid,
              balanceDue: newBalance
            });
          }
        }
      });

      // Update local invoice data after successful transaction
      if (payment.invoiceId) {
        const localInvoices = await getInvoices();
        const existingInvoice = localInvoices.find(inv => inv.id === payment.invoiceId);
        
        if (existingInvoice) {
          const paymentAmount = parseFloat(payment.amount) || 0;
          const currentPaid = parseFloat(existingInvoice.amountPaid) || 0;
          const newPaidAmount = currentPaid + paymentAmount;
          const grandTotal = parseFloat(existingInvoice.grandTotal) || 0;
          const newBalance = Math.max(0, grandTotal - newPaidAmount);
          
          let newStatus = existingInvoice.status;
          if (newBalance <= 0) newStatus = 'Paid';
          else if (newPaidAmount > 0) newStatus = 'Partially Paid';

          await saveInvoice({
            ...existingInvoice,
            status: newStatus,
            paymentStatus: newStatus,
            amountPaid: newPaidAmount,
            balanceDue: newBalance,
            paymentMethod: payment.paymentMethod || existingInvoice.paymentMethod || 'UPI'
          });
          window.dispatchEvent(new Event('billqyro_sync'));
        }
      }

      toast.success('Payment approved and invoice updated!', { icon: '✅', duration: 4000 });
      setSelectedProof(null);
      
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error(error.message || 'Failed to approve payment. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (payment) => {
    try {
      setProcessingId(payment.id);

      const proofRef = doc(db, 'payment_proofs', payment.id);

      // Use transaction to prevent duplicate rejections and race conditions
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
          const publicInvRef = doc(db, 'public_invoices', payment.invoiceId);
          const pInvDoc = await transaction.get(publicInvRef);
          if (pInvDoc.exists()) {
            const pData = pInvDoc.data();
            const grandTotal = pData.grandTotal || 0;
            const currentPaid = parseFloat(pData.amountPaid) || 0;
            const paymentAmount = parseFloat(payment.amount) || 0;
            const revertedPaid = Math.max(0, currentPaid - paymentAmount);
            const revertedBalance = Math.max(0, grandTotal - revertedPaid);
            let revertedStatus = pData.paymentStatus;
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
      });

      const localInvoices = await getInvoices();
      const existingInvoice = localInvoices.find(inv => inv.id === payment.invoiceId);
      if (existingInvoice) {
        const grandTotal = parseFloat(existingInvoice.grandTotal) || 0;
        const currentPaid = parseFloat(existingInvoice.amountPaid) || 0;
        const paymentAmount = parseFloat(payment.amount) || 0;
        const revertedPaid = Math.max(0, currentPaid - paymentAmount);
        const revertedBalance = Math.max(0, grandTotal - revertedPaid);
        let revertedStatus = existingInvoice.status;
        if (revertedBalance <= 0 && revertedPaid > 0) revertedStatus = 'Paid';
        else if (revertedPaid <= 0) revertedStatus = 'Unpaid';
        else revertedStatus = 'Partially Paid';

        await saveInvoice({
          ...existingInvoice,
          status: revertedStatus,
          paymentStatus: revertedStatus,
          amountPaid: revertedPaid,
          balanceDue: revertedBalance
        });
        window.dispatchEvent(new Event('billqyro_sync'));
      }

      toast.success('Payment proof has been rejected and invoice status reverted.', { icon: '❌', duration: 4000 });
      setSelectedProof(null);
      
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error(error.message || 'Failed to reject payment.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="page-premium w-full max-w-full space-y-6 pb-24"
    >
      <div className="section-header flex-col md:flex-row gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="btn-premium-ghost w-10 h-10 p-0 flex items-center justify-center shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-theme-primary" />
          </button>
          <div>
            <h1 className="hero-premium-title">Payment Proofs</h1>
            <p className="hero-premium-subtitle">Review customer submitted payments</p>
          </div>
        </div>
        <div className="relative max-w-sm w-full md:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-theme-muted" />
          </div>
          <input
            type="text"
            className="input-premium pl-10"
            placeholder="Search invoice or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} lines={4} />
          ))}
        </div>
      ) : filteredPayments.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
          className="empty-state card-premium mt-6"
        >
          <div className="empty-state-icon">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="empty-state-title">All caught up!</h3>
          <p className="empty-state-text">
            There are no pending payment proofs to review at this moment. You'll be notified when a customer submits a new payment.
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          <AnimatePresence>
            {filteredPayments.map((payment) => {
              const badge = getStatusBadge(payment.status);
              const StatusIcon = badge.icon;
              return (
                <motion.div
                  key={payment.id}
                  layout
                  variants={staggerItem}
                  className="card-premium p-5 hover-lift"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <StatusIcon className="w-5 h-5 text-theme-accent shrink-0" />
                      <div>
                        <span className={badge.class}>{badge.label}</span>
                        <h4 className="font-black text-theme-primary text-sm mt-1">Invoice #{payment.invoiceNumber}</h4>
                      </div>
                    </div>
                    <span className="font-black text-lg text-theme-primary tabular-nums">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>

                  <div className="bg-theme-surface rounded-2xl p-4 mb-4 border border-theme-border-soft/50 space-y-2.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-theme-muted font-semibold">Customer</span>
                      <span className="text-xs font-bold text-theme-primary">{payment.customerName || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-theme-muted font-semibold">Payer</span>
                      <span className="text-xs font-bold text-theme-primary">{payment.payerName || payment.customerName || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-theme-muted font-semibold">Method</span>
                      <span className="text-xs font-bold text-theme-primary">{payment.paymentMethod || 'UPI/Bank'}</span>
                    </div>
                    {payment.transactionId && (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-theme-muted font-semibold">Txn ID</span>
                        <span className="text-[11px] font-mono font-black text-theme-primary bg-theme-card px-2.5 py-1 rounded-lg border border-theme-border-soft tracking-wide">{payment.transactionId}</span>
                      </div>
                    )}
                  </div>

                  {payment.screenshotUrl && (
                    <button
                      onClick={() => setSelectedProof(payment)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 bg-theme-surface hover:bg-theme-app dark:hover:bg-theme-surface/80 rounded-xl text-theme-accent font-bold text-xs transition-colors border border-theme-border-soft"
                    >
                      <ImageIcon className="w-4 h-4" />
                      View Proof Screenshot
                    </button>
                  )}

                  <div className="flex gap-3">
                    <button
                      disabled={processingId === payment.id}
                      onClick={() => handleReject(payment)}
                      className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      disabled={processingId === payment.id}
                      onClick={() => handleApprove(payment)}
                      className="btn-premium flex-1"
                    >
                      {processingId === payment.id ? 'Approving...' : 'Approve'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedProof && (
          <motion.div
            variants={modalOverlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="modal-premium-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedProof(null)}
          >
            <motion.div
              variants={modalContentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="modal-premium max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-theme-border-soft bg-theme-surface">
                <h3 className="font-black text-theme-primary flex items-center gap-2">
                  <ReceiptText className="w-5 h-5 text-theme-accent" />
                  Proof for #{selectedProof.invoiceNumber}
                </h3>
                <button
                  onClick={() => setSelectedProof(null)}
                  className="btn-premium-ghost w-8 h-8 p-0 flex items-center justify-center"
                >
                  <XCircle className="w-5 h-5 text-theme-muted" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 flex flex-col items-center justify-center bg-black/5">
                <img
                  src={selectedProof.screenshotUrl}
                  alt="Payment Proof"
                  className="max-w-full h-auto rounded-xl shadow-lg"
                  style={{ maxHeight: '60vh', objectFit: 'contain' }}
                />
              </div>
              <div className="flex gap-3 p-4 border-t border-theme-border-soft">
                <button
                  disabled={processingId === selectedProof.id}
                  onClick={() => handleReject(selectedProof)}
                  className="flex-1 py-3 rounded-xl font-bold text-xs bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20 disabled:opacity-50"
                >
                  Reject Payment
                </button>
                <button
                  disabled={processingId === selectedProof.id}
                  onClick={() => handleApprove(selectedProof)}
                  className="btn-premium flex-1"
                >
                  {processingId === selectedProof.id ? 'Approving...' : 'Approve & Mark Paid'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PendingPayments;
