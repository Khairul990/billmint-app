import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, CheckCircle2, ShieldAlert } from 'lucide-react';
import { toast } from 'react-hot-toast';

const PremiumControlCenter = () => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Crown className="w-6 h-6 mr-3 text-amber-500" /> Premium Control Center
          </h2>
          <p className="text-slate-400 text-sm mt-1">Manage user subscriptions, feature access, and templates.</p>
        </div>
      </div>

      <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
        <h3 className="text-white font-bold mb-4">Subscription Plan Rules</h3>
        <p className="text-slate-400 text-sm mb-4">Modify the feature limits for each plan tier here.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-xl">
            <h4 className="font-bold text-white mb-2">Free Plan</h4>
            <p className="text-xs text-slate-400">Default feature set for all new users.</p>
          </div>
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
            <h4 className="font-bold text-amber-500 mb-2">Premium Monthly / Yearly</h4>
            <p className="text-xs text-slate-400">Access to all PDF templates, live links, and remove branding.</p>
          </div>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
            <h4 className="font-bold text-emerald-500 mb-2">Pay Per Bill</h4>
            <p className="text-xs text-slate-400">Pay as you go with full feature unlock per transaction.</p>
          </div>
          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
            <h4 className="font-bold text-purple-400 mb-2">Pro Plus / Lifetime</h4>
            <p className="text-xs text-slate-400">Unlimited multi-workspace and priority support.</p>
          </div>
        </div>
      </div>

      <div className="bg-[#1e293b]/60 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50">
        <h3 className="text-white font-bold mb-4">User Override Controls</h3>
        <p className="text-slate-400 text-sm mb-4">Search a user in User Manager to apply these actions.</p>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-slate-800 text-slate-300 text-sm font-bold rounded-xl border border-slate-700">Make Free</button>
          <button className="px-4 py-2 bg-amber-500/20 text-amber-400 text-sm font-bold rounded-xl border border-amber-500/30">Make Premium</button>
          <button className="px-4 py-2 bg-purple-500/20 text-purple-400 text-sm font-bold rounded-xl border border-purple-500/30">Make Lifetime</button>
          <button className="px-4 py-2 bg-emerald-500/20 text-emerald-400 text-sm font-bold rounded-xl border border-emerald-500/30">Give Trial</button>
          <button className="px-4 py-2 bg-blue-500/20 text-blue-400 text-sm font-bold rounded-xl border border-blue-500/30">Exempt User</button>
        </div>
      </div>
    </motion.div>
  );
};

export default PremiumControlCenter;
