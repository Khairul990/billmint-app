import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { successCheckVariants, successCircleVariants } from '../utils/animations';

const SuccessAnimation = ({ 
  show = false, 
  message = 'Done!', 
  submessage,
  duration = 2000,
  onComplete 
}) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm"
        >
          <motion.div
            variants={successCircleVariants}
            initial="hidden"
            animate="visible"
            className="bg-theme-card rounded-2xl p-8 shadow-premium-xl border border-theme-border-soft flex flex-col items-center text-center max-w-xs mx-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <motion.path
                  d="M5 13l4 4L19 7"
                  variants={successCheckVariants}
                  initial="hidden"
                  animate="visible"
                />
              </svg>
            </div>
            <h3 className="text-lg font-black text-theme-primary mb-1">{message}</h3>
            {submessage && (
              <p className="text-xs text-theme-muted font-medium">{submessage}</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Toast-style success banner
const SuccessBanner = ({ message, show, onDismiss }) => {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]"
        >
          <div className="bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-sm font-bold">
            <CheckCircle className="w-5 h-5" />
            {message}
            <button onClick={onDismiss} className="ml-2 opacity-70 hover:opacity-100">
              ×
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { SuccessAnimation, SuccessBanner };
export default SuccessAnimation;