import React, { useState } from 'react';
import { CheckCircle2, Shield, Zap, Sparkles } from 'lucide-react';

const PremiumPricing = ({ setCurrentTab }) => {
  const [selectedPlan, setSelectedPlan] = useState('pay-per-bill');

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Choose Your Power</h1>
          <p className="text-slate-400 text-lg">No hidden fees. Scale as you grow.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {/* Free Plan */}
          <div className="bg-[#1e293b] rounded-3xl p-8 border border-slate-800 flex flex-col hover:border-slate-600 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2">Free</h3>
            <p className="text-slate-400 text-sm mb-6 h-10">Perfect for getting started.</p>
            <div className="text-4xl font-black text-white mb-6">₹0 <span className="text-lg text-slate-500 font-medium">/ forever</span></div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" /> <span className="text-sm">Up to 15 Invoices per month</span></li>
              <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" /> <span className="text-sm">Basic Templates</span></li>
              <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" /> <span className="text-sm">Local Storage Backup</span></li>
            </ul>
            
            <button className="w-full py-4 rounded-xl bg-slate-800 text-slate-300 font-bold border border-slate-700 hover:bg-slate-700 transition-colors">
              Current Plan
            </button>
          </div>

          {/* Pay Per Bill */}
          <div className="bg-gradient-to-b from-rose-500/10 to-[#1e293b] rounded-3xl p-8 border-2 border-rose-500 relative flex flex-col transform md:-translate-y-4 shadow-2xl shadow-rose-500/10">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-rose-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-wider uppercase">
              Recommended
            </div>
            <h3 className="text-xl font-bold text-white mb-2 flex items-center"><Zap className="w-5 h-5 mr-2 text-rose-500" /> Pay Per Bill</h3>
            <p className="text-slate-400 text-sm mb-6 h-10">Premium না নিলেও ব্যবহার করুন। Pay only for bills you create.</p>
            <div className="text-4xl font-black text-white mb-6">₹5 <span className="text-lg text-slate-500 font-medium">/ bill</span></div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-rose-500 mr-3 shrink-0" /> <span className="text-sm">Unlimited Bills (Billed based on usage)</span></li>
              <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-rose-500 mr-3 shrink-0" /> <span className="text-sm">Access to Most Premium Features</span></li>
              <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-rose-500 mr-3 shrink-0" /> <span className="text-sm">Cloud Sync Enabled</span></li>
              <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-rose-500 mr-3 shrink-0" /> <span className="text-sm">Pay dues weekly or monthly</span></li>
            </ul>
            
            <button className="w-full py-4 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors shadow-lg">
              Start Pay Per Bill
            </button>
          </div>

          {/* Premium */}
          <div className="bg-[#1e293b] rounded-3xl p-8 border border-slate-800 flex flex-col hover:border-slate-600 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center"><Sparkles className="w-5 h-5 mr-2 text-amber-400" /> Premium</h3>
            <p className="text-slate-400 text-sm mb-6 h-10">Unlimited everything for power users.</p>
            <div className="text-4xl font-black text-white mb-6">₹999 <span className="text-lg text-slate-500 font-medium">/ year</span></div>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" /> <span className="text-sm font-semibold text-white">Unlimited Bills Included</span></li>
              <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" /> <span className="text-sm">Live Link Features</span></li>
              <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" /> <span className="text-sm">Advanced Reports & Due Ledger</span></li>
              <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" /> <span className="text-sm">Remove BillQyro Branding</span></li>
              <li className="flex items-start"><CheckCircle2 className="w-5 h-5 text-emerald-500 mr-3 shrink-0" /> <span className="text-sm">Priority Support</span></li>
            </ul>
            
            <button className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold hover:opacity-90 transition-opacity shadow-lg">
              Upgrade to Premium
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PremiumPricing;
