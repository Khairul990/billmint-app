import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp } from '../utils/animations';

const PremiumEmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className = '',
}) => {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className={`card-premium glass p-8 md:p-12 flex flex-col items-center text-center justify-center min-h-[320px] ${className}`}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative mb-6"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent/20 to-accent/10 dark:from-accent/15 dark:to-accent/5 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-accent/30 to-accent/15 dark:from-accent/25 dark:to-accent/10 flex items-center justify-center">
            {Icon && <Icon className="w-8 h-8 text-accent" />}
          </div>
        </div>
      </motion.div>

      <motion.h3
        variants={fadeInUp}
        className="text-lg md:text-xl font-black text-gradient-premium mb-2"
      >
        {title}
      </motion.h3>

      <motion.p
        variants={fadeInUp}
        className="text-sm text-theme-muted max-w-sm leading-relaxed mb-6"
      >
        {description}
      </motion.p>

      <motion.div
        variants={fadeInUp}
        className="flex flex-col sm:flex-row items-center gap-3"
      >
        {actionLabel && onAction && (
          <button onClick={onAction} className="btn-premium w-full sm:w-auto">
            {actionLabel}
          </button>
        )}
        {secondaryLabel && onSecondary && (
          <button onClick={onSecondary} className="btn-premium-outline w-full sm:w-auto">
            {secondaryLabel}
          </button>
        )}
      </motion.div>
    </motion.div>
  );
};

export default PremiumEmptyState;

{/*
Quick Reference:
<PremiumEmptyState
  icon={FileText}
  title="No bills yet"
  description="Create your first invoice to start billing your customers"
  actionLabel="Create Invoice"
  onAction={() => console.log('Create')}
  secondaryLabel="Learn More"
  onSecondary={() => console.log('Learn More')}
/>
*/}
