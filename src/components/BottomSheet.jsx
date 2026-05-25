import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const BottomSheet = ({ isOpen, onClose, title, children }) => {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-[101] flex justify-center pointer-events-none"
          >
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-t-[32px] shadow-2xl flex flex-col max-h-[90vh] pointer-events-auto border-t border-slate-200 dark:border-white/10">
              
              {/* Drag Handle & Header */}
              <div className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 px-6 rounded-t-[32px] bg-white dark:bg-slate-900 sticky top-0 z-10">
                <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-4"></div>
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto px-6 pb-8 custom-scrollbar">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BottomSheet;
