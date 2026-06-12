import React from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search } from 'lucide-react';

const Patients = () => {
  return (
    <div className="space-y-6 pb-24">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-theme-primary tracking-tight">Patient Records</h1>
          <p className="text-xs text-theme-muted font-bold">Manage your clinic patients and history</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 py-2 px-4 bg-[image:var(--accent-gradient)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md">
            <Plus className="w-4 h-4" />
            Add Patient
          </button>
        </div>
      </div>

      {/* Empty State placeholder */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center p-12 bg-theme-card rounded-3xl border border-theme-border-soft border-dashed text-center mt-6"
      >
        <div className="w-20 h-20 bg-theme-accent/10 text-theme-accent rounded-full flex items-center justify-center mb-6">
          <Users className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-theme-primary mb-2">Coming Soon</h3>
        <p className="text-sm font-semibold text-theme-muted max-w-sm">
          The full Patient Management module is currently being finalized. You will be able to track history, notes, and appointments here.
        </p>
      </motion.div>
    </div>
  );
};

export default Patients;
