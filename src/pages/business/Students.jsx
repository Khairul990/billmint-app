import React from 'react';
import { motion } from 'framer-motion';
import { Users, Plus } from 'lucide-react';

const Students = () => {
  return (
    <div className="space-y-6 pb-24">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-theme-primary tracking-tight">Student Directory</h1>
          <p className="text-xs text-theme-muted font-bold">Manage your students and batches</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 py-2 px-4 bg-[image:var(--accent-gradient)] text-white font-bold text-xs rounded-xl hover:opacity-90 transition-all shadow-md">
            <Plus className="w-4 h-4" />
            Add Student
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
          The Student Management module is currently under development. Batch tracking and attendance will be available here.
        </p>
      </motion.div>
    </div>
  );
};

export default Students;
