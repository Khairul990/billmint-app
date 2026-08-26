import React, { useState, useEffect, memo } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, ShieldCheck, Image as ImageIcon, Search, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminEngine } from '../../services/adminEngine.js';
import { toast } from 'react-hot-toast';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';

const PaymentProofCenter = () => {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [selectedProof, setSelectedProof] = useState(null);
  const [rejectModalProof, setRejectModalProof] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState({});
  const [processingId, setProcessingId] = useState(null);

  const fetchProofs = async () => {
    setLoading(true);
    try {
      const [dues, premium] = await Promise.all([
        adminEngine.getPaymentProofs(),
        adminEngine.getPremiumRequests()
      ]);
      const mappedDues = (dues || []).map(p => ({ ...p, proofType: 'Dues' }));
      const mappedPremium = (premium || []).map(p => ({ ...p, proofType: 'Premium', amount: p.paidAmount || p.amount || 0 }));
      const allProofs = [...mappedDues, ...mappedPremium].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setProofs(allProofs);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load payment proofs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProofs();
  }, []);

  const handleApprove = async (proof) => {
    if (proof.status === 'Approved' || proof.status === 'Verified') {
      toast.error('This transaction is already verified and approved.');
      return;
    }

    setProcessingId(proof.id);
    const toastId = toast.loading('Authorizing settlement...');
    try {
      if (proof.proofType === 'Premium') {
        await adminEngine.updatePremiumRequestStatus(proof.id, 'Approved', proof.userId, proof.plan || 'pro', 'Approved by owner');
      } else {
        await adminEngine.updatePaymentProofStatus(proof.id, 'Approved', adminNotes[proof.id] || 'Settlement verified', []);
      }
      toast.success('Payment settlement APPROVED & authoritative balance updated!', { id: toastId });
      setSelectedProof(null);
      fetchProofs();
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Error processing approval', { id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModalProof) return;
    if (!rejectionReason.trim()) {
      toast.error('Please specify a rejection reason for the customer.');
      return;
    }

    setProcessingId(rejectModalProof.id);
    const toastId = toast.loading('Recording rejection...');
    try {
      if (rejectModalProof.proofType === 'Premium') {
        await adminEngine.updatePremiumRequestStatus(rejectModalProof.id, 'Rejected', rejectModalProof.userId, rejectModalProof.plan, rejectionReason);
      } else {
        await adminEngine.updatePaymentProofStatus(rejectModalProof.id, 'Rejected', rejectionReason, []);
      }
      toast.success('Payment proof REJECTED and reason recorded.', { id: toastId });
      setRejectModalProof(null);
      setRejectionReason('');
      setSelectedProof(null);
      fetchProofs();
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Error processing rejection', { id: toastId });
    } finally {
      setProcessingId(null);
    }
  };

  const filteredProofs = proofs.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      ((p.userEmail || '').toLowerCase().includes(term)) ||
      ((p.transactionId || '').toLowerCase().includes(term)) ||
      ((p.note || '').toLowerCase().includes(term)) ||
      ((p.id || '').toLowerCase().includes(term));

    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'Verified') return (p.status === 'Approved' || p.status === 'Verified') && matchesSearch;
    return p.status === statusFilter && matchesSearch;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-theme-accent" />
            Payment Proof Verification & Approvals
          </h2>
          <p className="text-sm text-theme-secondary mt-1">
            Authoritative review portal for tenant payment proofs, platform fee settlements, and subscription upgrades.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchProofs} leftIcon={RefreshCw}>
            Refresh Proofs
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <Card className="p-4 bg-theme-surface/50 border-theme-border-soft">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {['Pending', 'Verified', 'Rejected', 'all'].map(tab => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                  statusFilter === tab
                    ? 'bg-theme-accent text-white shadow-sm'
                    : 'text-theme-muted hover:text-theme-primary hover:bg-theme-surface'
                }`}
              >
                {tab === 'all' ? 'All Proofs' : tab}
              </button>
            ))}
          </div>

          <Input
            icon={Search}
            type="text"
            placeholder="Search email, transaction ID, or note..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-72"
          />
        </div>
      </Card>

      {/* Proofs Table */}
      <Card className="overflow-hidden border-theme-border-soft">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User / Email</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Transaction ID / UPI</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto animate-spin text-theme-accent" />
                </TableCell>
              </TableRow>
            ) : filteredProofs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-theme-muted font-bold">
                  No payment proofs in "{statusFilter}" state.
                </TableCell>
              </TableRow>
            ) : (
              filteredProofs.map((proof) => (
                <TableRow key={proof.id} className="hover:bg-theme-surface-hover/50 transition-colors">
                  <TableCell className="font-bold text-xs text-theme-primary">
                    <div>
                      <span>{proof.userEmail || 'Unknown User'}</span>
                      <span className="text-[10px] text-theme-muted block font-mono">WS: {proof.workspaceId || 'Default'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-theme-accent/10 text-theme-accent border border-theme-accent/20">
                      {proof.proofType}
                    </span>
                  </TableCell>
                  <TableCell className="font-mono font-bold text-emerald-500">
                    ₹{parseFloat(proof.amount || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-theme-secondary">
                    {proof.transactionId || 'N/A'}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      proof.status === 'Approved' || proof.status === 'Verified'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : proof.status === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-500'
                        : 'bg-amber-500/10 text-amber-500'
                    }`}>
                      {proof.status || 'Pending'}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-theme-muted font-semibold">
                    {proof.createdAt ? new Date(proof.createdAt).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProof(proof)}
                        className="text-xs font-bold text-theme-accent hover:underline"
                      >
                        Inspect
                      </Button>
                      {proof.status === 'Pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={processingId === proof.id}
                            onClick={() => handleApprove(proof)}
                            className="text-xs font-bold text-emerald-500 hover:bg-emerald-500/10"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={processingId === proof.id}
                            onClick={() => setRejectModalProof(proof)}
                            className="text-xs font-bold text-rose-500 hover:bg-rose-500/10"
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Proof Inspection Modal */}
      {selectedProof && (
        <Modal
          isOpen={!!selectedProof}
          onClose={() => setSelectedProof(null)}
          title="Payment Proof Inspection"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-xs bg-theme-surface-elevated p-4 rounded-xl border border-theme-border-soft">
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">User Email</span>
                <span className="text-theme-primary font-bold">{selectedProof.userEmail}</span>
              </div>
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Amount</span>
                <span className="text-emerald-500 font-bold font-mono text-sm">₹{selectedProof.amount}</span>
              </div>
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Transaction ID</span>
                <span className="text-theme-primary font-mono">{selectedProof.transactionId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-theme-muted uppercase font-bold block mb-0.5">Payment Method</span>
                <span className="text-theme-primary font-bold">{selectedProof.paymentMethod || 'UPI / Bank'}</span>
              </div>
            </div>

            {selectedProof.proofUrl && (
              <div>
                <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-2">Attached Receipt Image</span>
                <div className="rounded-xl overflow-hidden border border-theme-border-soft max-h-64 flex items-center justify-center bg-black/40">
                  <img
                    src={selectedProof.proofUrl}
                    alt="Payment receipt"
                    className="max-h-64 w-auto object-contain cursor-zoom-in"
                    onClick={() => window.open(selectedProof.proofUrl, '_blank')}
                  />
                </div>
              </div>
            )}

            {selectedProof.note && (
              <div>
                <span className="text-xs font-bold text-theme-muted uppercase tracking-wider block mb-1">Customer Note</span>
                <div className="p-3 rounded-xl bg-theme-surface-elevated border border-theme-border-soft text-xs text-theme-secondary">
                  {selectedProof.note}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button onClick={() => setSelectedProof(null)} variant="ghost" size="sm">
                Close
              </Button>
              {selectedProof.status === 'Pending' && (
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setRejectModalProof(selectedProof)}
                    variant="outline"
                    size="sm"
                    className="border-rose-500 text-rose-500 hover:bg-rose-500/10 font-bold"
                  >
                    Reject
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedProof)}
                    variant="primary"
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 font-bold"
                  >
                    Approve Payment
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Rejection Reason Modal */}
      {rejectModalProof && (
        <Modal
          isOpen={!!rejectModalProof}
          onClose={() => {
            setRejectModalProof(null);
            setRejectionReason('');
          }}
          title="Reject Payment Settlement"
        >
          <div className="space-y-4">
            <p className="text-xs text-theme-secondary">
              Provide a clear reason for rejecting the payment proof from <strong>{rejectModalProof.userEmail}</strong>.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-bold text-theme-muted uppercase tracking-wider block">Rejection Reason</label>
              <Input
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Transaction ID not found in platform bank ledger / Invalid screenshot"
                className="w-full"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRejectModalProof(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={processingId === rejectModalProof.id || !rejectionReason.trim()}
                onClick={handleReject}
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold"
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </motion.div>
  );
};

export default memo(PaymentProofCenter);
