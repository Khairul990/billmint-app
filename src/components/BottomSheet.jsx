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
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[100]"
          />
          
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.8 }}
            className="fixed bottom-0 left-0 right-0 z-[101] flex justify-center pointer-events-none"
          >
            <div className="w-full max-w-lg bg-theme-card rounded-t-[32px] shadow-2xl flex flex-col max-h-[90vh] pointer-events-auto border-t border-theme-border-soft">
              
              {/* Drag Handle & Header */}
              <div className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 px-6 rounded-t-[32px] bg-theme-card sticky top-0 z-10">
                <div className="w-10 h-1 bg-theme-border-soft rounded-full mb-4 opacity-60"></div>
                <div className="flex items-center justify-between w-full">
                  <h3 className="text-lg font-black text-theme-primary tracking-tight">{title}</h3>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-theme-surface text-theme-muted hover:bg-theme-accent-light hover:text-theme-accent transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto px-6 pb-8 custom-scrollbar scroll-smooth">
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
