import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const EditColumnsModal = ({ isOpen, onClose, onSave, initialColumns }) => {
  const [col1, setCol1] = useState(initialColumns?.col1 || 'Item Name');
  const [col2, setCol2] = useState(initialColumns?.col2 || 'Qty');
  const [col3, setCol3] = useState(initialColumns?.col3 || 'Rate (₹)');

  const handleSave = () => {
    onSave({ col1, col2, col3 });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-theme-card border border-theme-border-soft rounded-2xl shadow-premium z-[100] overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-theme-border-soft">
              <h3 className="text-sm font-black text-theme-primary">Edit Columns</h3>
              <button
                onClick={onClose}
                className="p-1 text-theme-muted hover:text-theme-primary hover:bg-theme-surface rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-theme-muted block mb-1.5">
                  Name of Column One
                </label>
                <input
                  type="text"
                  value={col1}
                  onChange={(e) => setCol1(e.target.value)}
                  placeholder="e.g. Design Name"
                  className="w-full bg-theme-surface border border-theme-border-soft rounded-xl px-4 py-2.5 outline-none text-sm font-bold text-theme-primary focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/20 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-theme-muted block mb-1.5">
                  Name of Column Two
                </label>
                <input
                  type="text"
                  value={col2}
                  onChange={(e) => setCol2(e.target.value)}
                  placeholder="e.g. Qty"
                  className="w-full bg-theme-surface border border-theme-border-soft rounded-xl px-4 py-2.5 outline-none text-sm font-bold text-theme-primary focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/20 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-wider text-theme-muted block mb-1.5">
                  Name of Column Three
                </label>
                <input
                  type="text"
                  value={col3}
                  onChange={(e) => setCol3(e.target.value)}
                  placeholder="e.g. Rate (₹)"
                  className="w-full bg-theme-surface border border-theme-border-soft rounded-xl px-4 py-2.5 outline-none text-sm font-bold text-theme-primary focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/20 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-theme-border-soft bg-theme-surface/50">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-theme-primary hover:bg-theme-surface border border-theme-border-soft rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-theme-accent text-white text-xs font-black rounded-xl hover:bg-theme-accent/90 hover:shadow-lg transition-all flex items-center gap-2"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditColumnsModal;
