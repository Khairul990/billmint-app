import React from 'react';
import { CreditCard, CheckCircle, XCircle, Clock, ShieldCheck, Image as ImageIcon, Search } from 'lucide-react';
import { motion } from 'framer-motion';

const PaymentProofCenter = () => {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center">
            <CreditCard className="w-6 h-6 mr-3 text-purple-400" /> Payment Proof Center
          </h2>
          <p className="text-slate-400 text-sm mt-1">Review and verify user subscription payments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
          <Clock className="w-6 h-6 text-amber-500 mb-2" />
          <div className="text-slate-400 text-sm font-medium mb-1">Pending Review</div>
          <div className="text-3xl font-black text-white">0</div>
        </div>
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
          <CheckCircle className="w-6 h-6 text-emerald-500 mb-2" />
          <div className="text-slate-400 text-sm font-medium mb-1">Approved Today</div>
          <div className="text-3xl font-black text-white">0</div>
        </div>
        <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500"></div>
          <XCircle className="w-6 h-6 text-rose-500 mb-2" />
          <div className="text-slate-400 text-sm font-medium mb-1">Rejected Today</div>
          <div className="text-3xl font-black text-white">0</div>
        </div>
      </div>
      
      {/* Pending Proofs List Header */}
      <div className="flex items-center justify-between mt-8 mb-4">
        <h3 className="text-lg font-bold text-white">Review Queue</h3>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
          <input 
            type="text" 
            placeholder="Search UTR..." 
            className="bg-[#1e293b]/60 backdrop-blur-md text-white border border-slate-700/50 rounded-xl pl-10 pr-4 py-2 w-full md:w-64 text-sm focus:outline-none focus:border-purple-500 transition-all placeholder-slate-500"
          />
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-[#1e293b]/40 backdrop-blur-md rounded-2xl border border-slate-700/50 p-12 text-center shadow-xl">
        <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-10 h-10 text-purple-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Queue is Clear</h3>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          No pending payment proofs at the moment. When users submit screenshots and UTRs, they will appear here with a Proof Check Score for your review.
        </p>
      </div>

      {/* 
        NOTE: Dummy layout block to show how a proof card will look when data arrives 
        Uncomment when mapping actual data.
      */}
      {/*
      <div className="bg-[#1e293b]/60 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden flex flex-col md:flex-row">
        <div className="md:w-64 h-48 md:h-auto bg-slate-800/80 flex flex-col items-center justify-center border-r border-slate-700/50 p-4">
          <ImageIcon className="w-12 h-12 text-slate-600 mb-2" />
          <span className="text-xs text-slate-500 font-bold tracking-widest uppercase">Screenshot</span>
        </div>
        
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h4 className="text-white font-bold text-lg">₹ 999.00</h4>
              <p className="text-slate-400 text-sm">User: John Doe (+91 9876543210)</p>
              <p className="text-slate-500 text-xs font-mono mt-1">UTR: 123456789012</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-slate-400 uppercase mb-1">Proof Check Score</span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-black border border-emerald-500/30">
                98% Match
              </span>
            </div>
          </div>
          
          <div className="flex gap-3 mt-4">
            <button className="flex-1 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-xl transition-colors border border-emerald-500/20">
              Approve
            </button>
            <button className="flex-1 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-bold rounded-xl transition-colors border border-rose-500/20">
              Reject
            </button>
            <button className="flex-1 py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl transition-colors">
              Review Later
            </button>
          </div>
        </div>
      </div>
      */}

    </motion.div>
  );
};

export default PaymentProofCenter;
