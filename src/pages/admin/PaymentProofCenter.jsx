import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, ShieldCheck, Image as ImageIcon, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getAdminAllPaymentProofs, updatePlatformPaymentProofStatus } from '../../services/dbEngine';
import { toast } from 'react-hot-toast';

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
      const allProofs = await getAdminAllPaymentProofs();
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
    try {
      const note = getAdminNote(proof.id);
      const success = await updatePlatformPaymentProofStatus(proof.id, status, note, []);
      if (success) {
        toast.success(`Payment proof successfully ${status.toLowerCase()}!`);
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

  // KPI Calculations
  const pendingCount = proofs.filter(p => p.status === 'Pending').length;
  const verifiedCount = proofs.filter(p => p.status === 'Approved' || p.status === 'Verified').length;
  const rejectedCount = proofs.filter(p => p.status === 'Rejected').length;

  const filteredProofs = proofs.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      (p.userEmail?.toLowerCase().includes(term) || '') ||
      (p.transactionId?.toLowerCase().includes(term) || '') ||
      (p.note?.toLowerCase().includes(term) || '');
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'Verified') return (p.status === 'Approved' || p.status === 'Verified') && matchesSearch;
    return p.status === statusFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="w-8 h-8 border-4 border-slate-700 border-t-purple-500 rounded-full animate-spin"></span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <CreditCard className="w-6 h-6 mr-3 text-purple-400" /> Platform Payment Proof Center
          </h2>
          <p className="text-slate-400 text-sm mt-1">Review and verify user platform dues payments.</p>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <Clock className="w-6 h-6 text-amber-500 mb-2" />
          <div className="text-slate-400 text-sm font-medium mb-1 font-bold">Pending Review</div>
          <div className="text-3xl font-black text-white">{pendingCount}</div>
        </div>
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <CheckCircle className="w-6 h-6 text-emerald-500 mb-2" />
          <div className="text-slate-400 text-sm font-medium mb-1 font-bold">Verified Proofs</div>
          <div className="text-3xl font-black text-white">{verifiedCount}</div>
        </div>
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
          <XCircle className="w-6 h-6 text-rose-500 mb-2" />
          <div className="text-slate-400 text-sm font-medium mb-1 font-bold">Rejected Proofs</div>
          <div className="text-3xl font-black text-white">{rejectedCount}</div>
        </div>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 mb-4">
        <div className="flex gap-2">
          {['Pending', 'Verified', 'Rejected', 'all'].map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                statusFilter === filter
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-[#1e293b]/60 text-slate-400 hover:text-white'
              }`}
            >
              {filter === 'all' ? 'All Proofs' : filter}
            </button>
          ))}
        </div>
        
        <div className="relative w-full md:w-auto">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search email or UTR..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-[#1e293b]/60 backdrop-blur-md text-white border border-slate-700/50 rounded-xl pl-10 pr-4 py-2 w-full md:w-64 text-sm focus:outline-none focus:border-purple-500 transition-all placeholder-slate-500 font-semibold"
          />
        </div>
      </div>

      {/* Proofs Queue List */}
      {filteredProofs.length === 0 ? (
        <div className="bg-[#1e293b]/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-12 text-center shadow-xl">
          <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-purple-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Queue is Clear</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto font-semibold">
            No payment proofs match your active filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProofs.map((proof) => (
            <div 
              key={proof.id} 
              className="bg-[#1e293b]/60 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden flex flex-col md:flex-row"
            >
              <div className="md:w-64 h-48 md:h-auto bg-slate-800/80 flex flex-col items-center justify-center border-r border-slate-700/50 p-4 shrink-0">
                {proof.screenshotBase64 ? (
                  <img 
                    src={proof.screenshotBase64} 
                    alt="Payment Proof" 
                    onClick={() => setSelectedProof(proof)}
                    className="w-full h-full object-contain cursor-pointer rounded-lg hover:scale-[1.02] transition-transform" 
                  />
                ) : (
                  <div className="flex flex-col items-center">
                    <ImageIcon className="w-12 h-12 text-slate-600 mb-2" />
                    <span className="text-xs text-slate-500 font-bold tracking-widest uppercase">No Screenshot</span>
                  </div>
                )}
              </div>
              
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
                  <div>
                    <h4 className="text-white font-extrabold text-xl font-mono">₹{proof.amount.toFixed(2)}</h4>
                    <p className="text-slate-300 text-sm font-semibold mt-1">User: {proof.userEmail}</p>
                    <p className="text-slate-400 text-xs font-mono mt-1 select-all bg-[#0f172a]/40 px-2.5 py-1 rounded-lg border border-slate-700/40 inline-block">
                      UTR: {proof.transactionId}
                    </p>
                    {proof.note && (
                      <p className="text-slate-400 text-xs italic mt-3 bg-slate-800/40 p-2.5 rounded-lg border border-slate-700/30">
                        "{proof.note}"
                      </p>
                    )}
                    {proof.adminNote && (
                      <p className="text-rose-400 text-xs font-semibold mt-2">
                        Admin Note: {proof.adminNote}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Status</span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black uppercase tracking-wider border mt-1 ${
                      proof.status === 'Approved' || proof.status === 'Verified'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : proof.status === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {proof.status === 'Approved' ? 'Verified' : proof.status}
                    </span>
                  </div>
                </div>
                
                {proof.status === 'Pending' && (
                  <div className="space-y-4 pt-4 border-t border-slate-700/40 mt-4">
                    <div>
                      <input 
                        type="text" 
                        placeholder="Add admin review comments or note..."
                        value={getAdminNote(proof.id)}
                        onChange={(e) => setAdminNoteFor(proof.id, e.target.value)}
                        className="w-full bg-[#0f172a]/50 text-white border border-slate-600 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-purple-500 transition-all placeholder-slate-600 font-semibold"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button 
                        disabled={processingId === proof.id}
                        onClick={() => handleAction(proof, 'Approved')}
                        className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" /> Verify & Credit User
                      </button>
                      <button 
                        disabled={processingId === proof.id}
                        onClick={() => handleAction(proof, 'Rejected')}
                        className="flex-1 py-3 bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer border border-rose-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" /> Reject Proof
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Screenshot Modal Lightbox */}
      <AnimatePresence>
        {selectedProof && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedProof(null)}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1e293b] rounded-3xl max-w-2xl w-full border border-slate-700/60 overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              <div className="p-4 border-b border-slate-700/50 flex justify-between items-center bg-[#0f172a]/60">
                <div>
                  <h3 className="font-bold text-white text-sm">UTR: {selectedProof.transactionId}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedProof.userEmail} | ₹{selectedProof.amount}</p>
                </div>
                <button 
                  onClick={() => setSelectedProof(null)}
                  className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1 flex items-center justify-center bg-black/15">
                <img 
                  src={selectedProof.screenshotBase64} 
                  alt="Payment Proof Screenshot Large" 
                  className="max-w-full max-h-[60vh] object-contain rounded-xl shadow-lg border border-slate-700/40" 
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PaymentProofCenter;
