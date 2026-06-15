import React from 'react';

const PaymentProofCenter = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Payment Proof Center</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
          <div className="text-slate-400 text-sm mb-1">Pending Review</div>
          <div className="text-2xl font-black text-amber-500">0</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
          <div className="text-slate-400 text-sm mb-1">Approved Today</div>
          <div className="text-2xl font-black text-emerald-500">0</div>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-center">
          <div className="text-slate-400 text-sm mb-1">Rejected Today</div>
          <div className="text-2xl font-black text-rose-500">0</div>
        </div>
      </div>
      
      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-8 text-center">
        <p className="text-slate-500 text-sm font-semibold">No pending payment proofs at the moment.</p>
      </div>
    </div>
  );
};

export default PaymentProofCenter;
