import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, CheckCircle2, MessageCircle } from 'lucide-react';

const SupportCenter = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <MessageSquare className="w-6 h-6 mr-3 text-pink-500" /> Support & Feature Requests
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage user feedback, bug reports, and help requests.</p>
        </div>
      </div>

      <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
        <h3 className="text-white font-bold mb-4">Open Requests</h3>
        <div className="space-y-3">
          {[
            { type: 'Feature', text: 'Please add a dark mode toggle to the invoice PDF.', user: 'Suman Das' },
            { type: 'Bug', text: 'My logo is not uploading correctly.', user: 'Rahim Ahmed' },
          ].map((req, i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#0f172a] rounded-xl border border-slate-700">
              <div className="mb-3 md:mb-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${req.type === 'Bug' ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {req.type}
                  </span>
                  <span className="text-slate-300 text-xs font-bold">{req.user}</span>
                </div>
                <p className="text-white text-sm font-medium">{req.text}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors flex items-center">
                  <MessageCircle className="w-3 h-3 mr-1" /> Reply
                </button>
                <button className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg hover:bg-emerald-500/20 transition-colors flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Resolve
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default SupportCenter;
