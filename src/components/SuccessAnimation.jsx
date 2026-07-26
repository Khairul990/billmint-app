import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle } from 'lucide-react';
import { successCheckVariants, successCircleVariants } from '../utils/animations';

const CONFETTI_COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899'];
const CONFETTI_COUNT = 24;

const ConfettiParticle = ({ color, angle, velocity, delay }) => {
  const x = Math.cos(angle) * velocity;
  const y = Math.sin(angle) * velocity;

  return (
    <motion.div
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{
        x,
        y,
        opacity: 0,
        scale: 0.3,
        rotate: Math.random() * 720 - 360,
      }}
      transition={{
        duration: 0.8 + Math.random() * 0.4,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      className="absolute w-2 h-2 rounded-sm"
      style={{ backgroundColor: color }}
    />
  );
};

const SuccessAnimation = ({ 
  show = false, 
  message = 'Done!', 
  submessage,
  duration = 2000,
  onComplete 
}) => {
  const [isVisible, setIsVisible] = useState(show);

  const confettiParticles = useMemo(() => {
    return Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      angle: (Math.PI * 2 * i) / CONFETTI_COUNT + (Math.random() - 0.5) * 0.5,
      velocity: 80 + Math.random() * 60,
      delay: Math.random() * 0.15,
    }));
  }, []);

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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm"
        >
          <motion.div
            variants={successCircleVariants}
            initial="hidden"
            animate="visible"
            className="bg-theme-card rounded-2xl p-8 shadow-premium-xl border border-theme-border-soft flex flex-col items-center text-center max-w-xs mx-4 relative"
          >
            <div className="relative w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
              <div className="absolute inset-0 flex items-center justify-center">
                {confettiParticles.map((p) => (
                  <ConfettiParticle key={p.id} {...p} />
                ))}
              </div>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="relative z-10">
                <motion.path
                  d="M5 13l4 4L19 7"
                  variants={successCheckVariants}
                  initial="hidden"
                  animate="visible"
                />
              </svg>
            </div>
            <motion.h3
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="text-lg font-black text-theme-primary mb-1"
            >
              {message}
            </motion.h3>
            {submessage && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25, duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-xs text-theme-muted font-medium"
              >
                {submessage}
              </motion.p>
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