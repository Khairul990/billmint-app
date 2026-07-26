import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div 
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`bg-theme-surface border border-theme-border-soft rounded-3xl w-full overflow-hidden shadow-glass flex flex-col max-h-[90vh] ${className}`}
          >
            {title && (
              <div className="flex justify-between items-center p-6 border-b border-theme-border-soft bg-theme-surface-elevated shrink-0">
                <h3 id="modal-title" className="text-xl font-black text-theme-primary leading-tight">{title}</h3>
                <button onClick={onClose} aria-label="Close modal" className="p-2 text-theme-muted hover:text-theme-primary bg-theme-surface-hover rounded-xl transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}
            <div className="overflow-y-auto no-scrollbar flex-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
