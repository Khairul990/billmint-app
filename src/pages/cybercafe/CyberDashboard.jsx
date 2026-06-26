import React from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, Users, Target, Activity } from 'lucide-react';

export default function CyberDashboard({ setCurrentTab }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8 max-w-7xl mx-auto pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-theme-primary tracking-tight mb-2">Cyber Cafe Operations</h1>
        <p className="text-theme-muted font-medium">Daily productivity and cash flow summary.</p>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-theme-card border border-theme-border-soft p-5 rounded-2xl shadow-premium">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl"><IndianRupee className="w-5 h-5" /></div>
          </div>
          <h3 className="text-2xl font-black text-theme-primary mb-1">₹ 0</h3>
          <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">Today's Income</p>
        </div>
        <div className="bg-theme-card border border-theme-border-soft p-5 rounded-2xl shadow-premium">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl"><Users className="w-5 h-5" /></div>
          </div>
          <h3 className="text-2xl font-black text-theme-primary mb-1">0</h3>
          <p className="text-xs font-bold text-theme-muted uppercase tracking-wider">Today's Customers</p>
        </div>
      </div>
    </motion.div>
  );
}
