import React from 'react';
import { CreditCard, Zap, TrendingUp, Package, Crown } from 'lucide-react';

const SubscriptionStudio = ({ settings, onUpdate }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6 border-b border-white/10 pb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 flex items-center justify-center shadow-inner">
          <Crown className="w-6 h-6 text-amber-500 drop-shadow-md" />
        </div>
        <div>
          <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400">Subscription Studio</h2>
          <p className="text-xs text-theme-muted font-medium">Manage your Premium plan, storage limits, and usage analytics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-[50px] group-hover:bg-amber-500/20 transition-colors" />
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-black text-white">Pro Enterprise Plan</h3>
                <p className="text-xs text-amber-400 font-bold mt-1">Active Subscription</p>
              </div>
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-black uppercase rounded-lg border border-amber-500/30">
                Billed Annually
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mb-1">Bills Generated</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white">1,245</span>
                  <span className="text-xs text-theme-muted mb-1">/ Unlimited</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-500 w-[15%] h-full rounded-full" />
                </div>
              </div>
              <div className="p-4 bg-black/20 rounded-xl border border-white/5">
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-wider mb-1">Cloud Storage</p>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-black text-white">4.2 GB</span>
                  <span className="text-xs text-theme-muted mb-1">/ 100 GB</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div className="bg-amber-500 w-[4%] h-full rounded-full" />
                </div>
              </div>
            </div>

            <button className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-sm font-black rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              Manage Billing & Upgrade
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-theme-muted" /> Payment History
            </h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex justify-between items-center p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-white">Pro Plan - Annual</p>
                    <p className="text-[10px] text-theme-muted mt-0.5">Oct 12, 2026</p>
                  </div>
                  <span className="text-xs font-black text-emerald-400">$299.00</span>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 text-[10px] font-bold text-theme-muted hover:text-white uppercase tracking-wider transition-colors">
              View All Invoices
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionStudio;
