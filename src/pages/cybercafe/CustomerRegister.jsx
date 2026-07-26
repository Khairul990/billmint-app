import React from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search } from 'lucide-react';

export default function CustomerRegister() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:p-8 max-w-7xl mx-auto pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-theme-primary tracking-tight mb-2">Customer Register</h1>
          <p className="text-theme-muted font-medium">Fast data entry for daily walk-in clients.</p>
        </div>
        <button className="bg-theme-accent text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus className="w-5 h-5" />
          <span>New Entry</span>
        </button>
      </div>

      <div className="bg-theme-card border border-theme-border-soft rounded-2xl overflow-hidden shadow-premium">
        <div className="p-4 border-b border-theme-border-soft flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <input type="text" placeholder="Search by name or phone..." className="w-full bg-theme-surface border border-theme-border-soft rounded-xl py-2 pl-9 pr-4 text-sm font-bold focus:border-theme-accent transition-colors" />
          </div>
        </div>
        
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-theme-surface rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-theme-muted" />
          </div>
          <h3 className="text-lg font-bold text-theme-primary mb-1">No Entries Yet</h3>
          <p className="text-sm font-medium text-theme-muted">Start adding daily customers.</p>
        </div>
      </div>
    </motion.div>
  );
}
