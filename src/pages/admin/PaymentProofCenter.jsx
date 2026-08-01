import React, { useState, useEffect, memo } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, ShieldCheck, Image as ImageIcon, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { adminEngine } from '../../services/adminEngine';
import { toast } from 'react-hot-toast';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

const PaymentProofCenter = () => {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [selectedProof, setSelectedProof] = useState(null);
  const [adminNotes, setAdminNotes] = useState({});
  const [processingId, setProcessingId] = useState(null);

  const fetchProofs = async () => {
    try {
      const [dues, premium] = await Promise.all([
        adminEngine.getPaymentProofs(),
        adminEngine.getPremiumRequests()
      ]);
      const mappedDues = dues.map(p => ({ ...p, proofType: 'Dues' }));
      const mappedPremium = premium.map(p => ({ ...p, proofType: 'Premium', amount: p.paidAmount || p.amount || 0 }));
      const allProofs = [...mappedDues, ...mappedPremium].sort((a,b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
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

  const getAdminNote = (proofId) => adminNotes[proofId] || '';
  const setAdminNoteFor = (proofId, value) => setAdminNotes(prev => ({ ...prev, [proofId]: value }));

  const handleAction = async (proof, status) => {
    setProcessingId(proof.id);
    const note = getAdminNote(proof.id);
    try {
      let success = false;
      if (proof.proofType === 'Premium') {
        success = await adminEngine.updatePremiumRequestStatus(proof.id, status, proof.userId, proof.plan, note);
      } else {
        success = await adminEngine.updatePaymentProofStatus(proof.id, status, note, []);
      }
      if (success !== false) { // updatePremiumRequestStatus doesn't return boolean on success, it throws on error, but returns undefined.
        toast.success(`${proof.proofType} proof successfully ${status.toLowerCase()}!`);
        setSelectedProof(null);
        setAdminNotes(prev => { const n = { ...prev }; delete n[proof.id]; return n; });
        fetchProofs();
      } else {
        toast.error('Failed to update payment proof status.');
      }
    } catch (e) {
      console.error(e);
      toast.error(e.message || 'Error processing proof status.');
    } finally {
      setProcessingId(null);
    }
  };

  const pendingCount = proofs.filter(p => p.status === 'Pending').length;
  const verifiedCount = proofs.filter(p => p.status === 'Approved' || p.status === 'Verified').length;
  const rejectedCount = proofs.filter(p => p.status === 'Rejected').length;

  const filteredProofs = proofs.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      ((p.userEmail || '').toLowerCase().includes(term)) ||
      ((p.transactionId || '').toLowerCase().includes(term)) ||
      ((p.note || '').toLowerCase().includes(term));
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'Verified') return (p.status === 'Approved' || p.status === 'Verified') && matchesSearch;
    return p.status === statusFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 text-theme-accent animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-black text-theme-primary tracking-tight flex items-center">
            <CreditCard className="w-8 h-8 mr-3 text-theme-accent" /> Payment Center
          </h2>
          <p className="text-sm text-theme-secondary mt-1">Review and verify user platform dues payments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-theme-warning"></div>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center pt-8">
            <Clock className="w-6 h-6 text-theme-warning mb-2" />
            <div className="text-theme-secondary text-sm font-bold mb-1">Pending Review</div>
            <div className="text-3xl font-black text-theme-primary">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-theme-success"></div>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center pt-8">
            <CheckCircle className="w-6 h-6 text-theme-success mb-2" />
            <div className="text-theme-secondary text-sm font-bold mb-1">Verified Proofs</div>
            <div className="text-3xl font-black text-theme-primary">{verifiedCount}</div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-theme-danger"></div>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center pt-8">
            <XCircle className="w-6 h-6 text-theme-danger mb-2" />
            <div className="text-theme-secondary text-sm font-bold mb-1">Rejected Proofs</div>
            <div className="text-3xl font-black text-theme-primary">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 mb-4">
        <div className="flex gap-2">
          {['Pending', 'Verified', 'Rejected', 'all'].map((filter) => (
            <Button
              key={filter}
              variant={statusFilter === filter ? 'primary' : 'ghost'}
              onClick={() => setStatusFilter(filter)}
              className={statusFilter === filter ? 'shadow-glass' : ''}
              size="sm"
            >
              {filter === 'all' ? 'All Proofs' : filter}
            </Button>
          ))}
        </div>
        
        <div className="w-full md:w-auto">
          <Input 
            icon={Search}
            type="text" 
            placeholder="Search email or UTR..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64"
          />
        </div>
      </div>

      {filteredProofs.length === 0 ? (
        <Card className="p-12 text-center shadow-glass border-transparent">
          <div className="w-20 h-20 bg-theme-accent/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-theme-accent" />
          </div>
          <h3 className="text-xl font-bold text-theme-primary mb-2">Queue is Clear</h3>
          <p className="text-theme-secondary text-sm max-w-md mx-auto font-semibold">
            No payment proofs match your active filters.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredProofs.map((proof) => (
            <Card key={proof.id} className="overflow-hidden flex flex-col md:flex-row border-transparent">
              <div className="md:w-64 h-48 md:h-auto bg-theme-surface-hover flex flex-col items-center justify-center border-r border-theme-border-soft p-4 shrink-0">
                {proof.screenshotBase64 ? (
                  <img 
                    src={proof.screenshotBase64} 
                    alt="Payment Proof" 
                    onClick={() => setSelectedProof(proof)}
                    className="w-full h-full object-contain cursor-pointer rounded-lg hover:scale-[1.02] transition-transform" 
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <ImageIcon className="w-12 h-12 text-theme-muted mb-2" />
                    <span className="text-xs text-theme-secondary font-bold tracking-widest uppercase">No Screenshot</span>
                  </div>
                )}
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-between bg-theme-surface-elevated">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={proof.proofType === 'Premium' ? 'primary' : 'warning'} className="text-[9px] uppercase tracking-wider">
                        {proof.proofType} {proof.proofType === 'Premium' ? `(${proof.plan})` : ''}
                      </Badge>
                    </div>
                    <h4 className="text-theme-primary font-extrabold text-xl font-mono">₹{proof.amount?.toFixed(2) || proof.amount}</h4>
                    <p className="text-theme-primary text-sm font-semibold mt-1">User: {proof.userEmail || proof.userId}</p>
                    <p className="text-theme-secondary text-xs font-mono mt-1 select-all bg-theme-main px-2.5 py-1 rounded-lg border border-theme-border-soft inline-block">
                      UTR: {proof.transactionId}
                    </p>
                    {proof.note && (
                      <p className="text-theme-secondary text-xs italic mt-3 bg-theme-main p-2.5 rounded-lg border border-theme-border-soft">
                        "{proof.note}"
                      </p>
                    )}
                    {proof.adminNote && (
                      <p className="text-theme-danger text-xs font-semibold mt-2">
                        Admin Note: {proof.adminNote}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-theme-muted uppercase mb-1">Status</span>
                    <Badge variant={
                      proof.status === 'Approved' || proof.status === 'Verified' ? 'success' :
                      proof.status === 'Rejected' ? 'danger' : 'warning'
                    }>
                      {proof.status === 'Approved' ? 'Verified' : proof.status}
                    </Badge>
                  </div>
                </div>
                
                {proof.status === 'Pending' && (
                  <div className="space-y-4 pt-4 border-t border-theme-border-soft mt-4">
                    <Input 
                      type="text" 
                      placeholder="Add admin review comments or note..."
                      value={getAdminNote(proof.id)}
                      onChange={(e) => setAdminNoteFor(proof.id, e.target.value)}
                    />
                    <div className="flex gap-3">
                      <Button 
                        disabled={processingId === proof.id}
                        onClick={() => handleAction(proof, 'Approved')}
                        variant="primary"
                        className="flex-1 bg-theme-success border-theme-success"
                        leftIcon={processingId === proof.id ? Loader2 : CheckCircle}
                      >
                        Verify & Credit
                      </Button>
                      <Button 
                        disabled={processingId === proof.id}
                        onClick={() => handleAction(proof, 'Rejected')}
                        variant="outline"
                        className="flex-1 border-theme-danger text-theme-danger hover:bg-theme-danger/10"
                        leftIcon={processingId === proof.id ? Loader2 : XCircle}
                      >
                        Reject Proof
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={!!selectedProof} onClose={() => setSelectedProof(null)} title={`UTR: ${selectedProof?.transactionId}`} className="max-w-2xl bg-theme-main">
        {selectedProof && (
          <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-theme-surface">
            <img 
              src={selectedProof.screenshotBase64} 
              alt="Payment Proof Screenshot Large" 
              className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-glass border border-theme-border-soft" 
            />
          </div>
        )}
      </Modal>
    </motion.div>
  );
};

export default memo(PaymentProofCenter);
