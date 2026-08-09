import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * ScrollReveal wrapper component
 * Fades in and slides up slightly when the section enters viewport.
 * Uses Framer Motion's whileInView.
 * Respects prefers-reduced-motion for accessibility.
 */
const ScrollReveal = ({ children, className = '', delay = 0, yOffset = 20, duration = 0.6 }) => {
  const shouldReduceMotion = useReducedMotion();

  // If user prefers reduced motion, disable the Y translation
  const initial = { opacity: 1, y: shouldReduceMotion ? 0 : yOffset };
  const whileInView = { opacity: 1, y: 0 };

  return (
    <motion.div
      className={className}
      initial={initial}
      animate={whileInView}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ 
        duration, 
        delay, 
        ease: [0.21, 0.47, 0.32, 0.98] // premium ease out curve
      }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
