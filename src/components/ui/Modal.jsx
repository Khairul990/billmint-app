import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '', 
  maxWidth = 'max-w-lg',
  closeOnBackdrop = true
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={closeOnBackdrop ? onClose : undefined}
        >
          <motion.div 
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
            initial={{ scale: 0.96, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-theme-card border border-theme-border-soft rounded-2xl w-full ${maxWidth} overflow-hidden shadow-xl flex flex-col max-h-[88vh] my-auto ${className}`}
          >
            {title && (
              <div className="flex justify-between items-center px-5 py-4 border-b border-theme-border-soft/60 bg-theme-surface-elevated/50 shrink-0">
                <h3 id="modal-title" className="text-base font-black text-theme-primary leading-tight">{title}</h3>
                <button 
                  onClick={onClose} 
                  aria-label="Close modal" 
                  className="p-1.5 text-theme-muted hover:text-theme-primary hover:bg-theme-surface-elevated rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="overflow-y-auto p-5 flex-1">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
