import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../services/firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { ArrowLeft, CheckCircle2, XCircle, Clock, Search, ReceiptText, ExternalLink, Image as ImageIcon, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../utils/invoiceUtils';
import { saveInvoice, getInvoices } from '../services/dbEngine';

const getStatusBadge = (status) => {
  switch (status) {
    case 'approved': return { label: 'Approved', class: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25', icon: CheckCircle2 };
    case 'rejected': return { label: 'Rejected', class: 'bg-red-500/15 text-red-600 border-red-500/25', icon: XCircle };
    default: return { label: 'Pending Review', class: 'bg-amber-500/15 text-amber-600 border-amber-500/25 animate-pulse', icon: Clock };
  }
};

const PendingPayments = ({ setCurrentTab, pendingPayments = [], businessSettings }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [selectedProof, setSelectedProof] = useState(null);

  // Filter pending payments based on search term (invoice number or amount)
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
      
      // 1. Update Payment Proof doc
      const proofRef = doc(db, 'payment_proofs', payment.id);
      await updateDoc(proofRef, { 
        status: 'approved',
        updatedAt: new Date().toISOString()
      });

      // 2. Update Public Invoice doc (set status to 'paid')
      if (payment.invoiceId) {
        const publicInvRef = doc(db, 'public_invoices', payment.invoiceId);
        const pInvDoc = await getDoc(publicInvRef);
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
           
           await updateDoc(publicInvRef, { 
             paymentStatus: newStatus,
             status: newStatus,
             amountPaid: newPaid,
             balanceDue: newBalance
           });
        }

        // 3. Update Local / Sync Private Invoice
        // We fetch current local invoices to find the matching one
        const localInvoices = await getInvoices();
        const existingInvoice = localInvoices.find(inv => inv.id === payment.invoiceId);
        
        if (existingInvoice) {
          const paymentAmount = parseFloat(payment.amount) || 0;
          const currentPaid = parseFloat(existingInvoice.amountPaid) || 0;
          const newPaidAmount = currentPaid + paymentAmount;
          const grandTotal = parseFloat(existingInvoice.grandTotal) || 0;
          const newBalance = Math.max(0, grandTotal - newPaidAmount);
          
          let newStatus = existingInvoice.status;
          if (newBalance <= 0) {
            newStatus = 'Paid';
          } else if (newPaidAmount > 0) {
            newStatus = 'Partially Paid';
          }

          const updatedInvoice = {
            ...existingInvoice,
            status: newStatus,
            paymentStatus: newStatus,
            amountPaid: newPaidAmount,
            balanceDue: newBalance,
            paymentMethod: payment.paymentMethod || existingInvoice.paymentMethod || 'UPI'
          };
          
          await saveInvoice(updatedInvoice);
          // Dispatch event to force sync across the app immediately
          window.dispatchEvent(new Event('billqyro_sync'));
        }
      }

      toast.success('Payment approved and invoice updated!', { icon: '✅', duration: 4000 });
      setSelectedProof(null);
      
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error('Failed to approve payment. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (payment) => {
    try {
      setProcessingId(payment.id);
      
      const proofRef = doc(db, 'payment_proofs', payment.id);
      await updateDoc(proofRef, { 
        status: 'rejected',
        updatedAt: new Date().toISOString()
      });

      // Revert public invoice back from 'Pending Verification' to its original status
      if (payment.invoiceId) {
        const publicInvRef = doc(db, 'public_invoices', payment.invoiceId);
        const pInvDoc = await getDoc(publicInvRef);
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

          await updateDoc(publicInvRef, {
            paymentStatus: revertedStatus,
            status: revertedStatus,
            amountPaid: revertedPaid,
            balanceDue: revertedBalance
          });
        }

        // Also revert local invoice
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
      }

      toast.success('Payment proof has been rejected and invoice status reverted.', { icon: '❌', duration: 4000 });
      setSelectedProof(null);
      
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error('Failed to reject payment.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* 1. Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentTab('dashboard')} 
            className="p-2 hover:bg-theme-card rounded-xl transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-theme-primary" />
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-theme-primary tracking-tight">Payment Proofs</h1>
            <p className="text-xs text-theme-muted font-bold">Review customer submitted payments</p>
          </div>
        </div>
        
        <div className="relative max-w-sm w-full md:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-theme-muted" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-theme-border-soft rounded-xl leading-5 bg-theme-surface text-theme-primary placeholder-theme-muted focus:outline-none focus:ring-2 focus:ring-theme-accent focus:border-theme-accent sm:text-sm font-semibold transition-all shadow-sm"
            placeholder="Search invoice or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 2. Content Area */}
      {filteredPayments.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center p-12 bg-theme-card rounded-3xl border border-theme-border-soft border-dashed text-center mt-6"
        >
          <div className="w-20 h-20 bg-theme-accent/10 text-theme-accent rounded-full flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-theme-primary mb-2">All caught up!</h3>
          <p className="text-sm font-semibold text-theme-muted max-w-sm">
            There are no pending payment proofs to review at this moment. You'll be notified when a customer submits a new payment.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence>
            {filteredPayments.map((payment) => (
              <motion.div
                key={payment.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-theme-card rounded-3xl border border-theme-border-soft p-5 shadow-premium hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center">
                      {(() => { const badge = getStatusBadge(payment.status); const Icon = badge.icon; return <Icon className="w-5 h-5" />; })()}
                    </div>
                    <div>
                      {(() => { const badge = getStatusBadge(payment.status); return <p className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${badge.class}`}>{badge.label}</p>; })()}
                      <h4 className="font-black text-theme-primary text-sm mt-1">Invoice #{payment.invoiceNumber}</h4>
                    </div>
                  </div>
                  <span className="font-black text-lg text-theme-primary">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>

                <div className="bg-theme-surface rounded-2xl p-4 mb-4 border border-theme-border-soft/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-theme-muted font-semibold">Customer</span>
                    <span className="text-xs font-bold text-theme-primary">{payment.customerName || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-theme-muted font-semibold">Payer</span>
                    <span className="text-xs font-bold text-theme-primary">{payment.payerName || payment.customerName || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
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
                    className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-theme-accent text-white hover:bg-theme-accent-dark transition-colors shadow-[0_0_15px_rgba(20,184,166,0.3)] disabled:opacity-50"
                  >
                    {processingId === payment.id ? 'Approving...' : 'Approve'}
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Proof Modal */}
      <AnimatePresence>
        {selectedProof && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedProof(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-theme-card rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-theme-border-strong/50 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-theme-border-soft flex justify-between items-center bg-theme-surface">
                <div>
                  <h3 className="font-black text-theme-primary flex items-center gap-2">
                    <ReceiptText className="w-5 h-5 text-theme-accent" />
                    Proof for #{selectedProof.invoiceNumber}
                  </h3>
                </div>
                <button 
                  onClick={() => setSelectedProof(null)}
                  className="p-2 hover:bg-theme-card rounded-full transition-colors"
                >
                  <XCircle className="w-6 h-6 text-theme-muted" />
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
              <div className="p-4 border-t border-theme-border-soft flex gap-3 bg-theme-card">
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
                  className="flex-1 py-3 rounded-xl font-bold text-xs bg-[image:var(--accent-gradient)] text-white hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(20,184,166,0.3)] disabled:opacity-50"
                >
                  {processingId === selectedProof.id ? 'Approving...' : 'Approve & Mark Paid'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default PendingPayments;
