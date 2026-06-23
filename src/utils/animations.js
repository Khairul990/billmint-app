import { motion } from 'framer-motion';

// Page transition variants
export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3, 
      ease: [0.25, 0.1, 0.25, 1],
      when: 'beforeChildren',
      staggerChildren: 0.04
    }
  },
  exit: { 
    opacity: 0, 
    y: -6,
    transition: { 
      duration: 0.15,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

export const pageTransition = {
  type: 'tween',
  ease: [0.25, 0.1, 0.25, 1],
  duration: 0.3,
};

// Stagger container for lists
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.04,
    }
  }
};

export const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

export const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
  }
};

export const fadeInDown = {
  hidden: { opacity: 0, y: -10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }
  }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 }
  }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
  }
};

export const slideUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }
  }
};

export const slideInRight = {
  hidden: { opacity: 0, x: 20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }
  }
};

export const slideInLeft = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }
  }
};

// Modal animation
export const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

export const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.96, y: 16 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
  },
  exit: { 
    opacity: 0, 
    scale: 0.96, 
    y: 8,
    transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }
  }
};

// Bottom sheet animation
export const sheetOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } }
};

export const sheetContentVariants = {
  hidden: { y: '100%' },
  visible: { 
    y: 0,
    transition: { 
      type: 'spring', 
      damping: 28, 
      stiffness: 280,
      mass: 0.8
    }
  },
  exit: { 
    y: '100%',
    transition: { 
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

// Success checkmark animation
export const successCheckVariants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { 
    pathLength: 1, 
    opacity: 1,
    transition: { 
      pathLength: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
      opacity: { duration: 0.1 }
    }
  }
};

export const successCircleVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      duration: 0.3, 
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

// Notification animation
export const notificationVariants = {
  hidden: { opacity: 0, x: 80, scale: 0.95 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { 
      type: 'spring', 
      damping: 26, 
      stiffness: 280
    }
  },
  exit: { 
    opacity: 0, 
    x: 80, 
    scale: 0.95,
    transition: { 
      duration: 0.15,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

// Card hover animation
export const cardHover = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.005, 
    y: -1,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
  },
  tap: { scale: 0.985 }
};

// Count up animation helper
export const countUp = (start, end, duration = 600) => {
  const startTime = performance.now();
  return new Promise((resolve) => {
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * eased);
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        resolve(end);
      }
    };
    requestAnimationFrame(animate);
  });
};

// Stagger animation for grid items
export const gridStagger = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.035,
      delayChildren: 0.04,
    }
  }
};

export const gridItem = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.1, 0.25, 1]
    }
  }
};

// Reusable hover scale effect
export const scaleOnHover = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }
  },
  tap: { scale: 0.97 }
};

// Button press animation
export const buttonTap = {
  rest: { scale: 1 },
  hover: {
    scale: 1.02,
    transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }
  },
  tap: {
    scale: 0.96,
    transition: { duration: 0.1, ease: [0.25, 0.1, 0.25, 1] }
  }
};

// Individual list item animation with slide + fade
export const listItem = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.25,
      ease: [0.25, 0.1, 0.25, 1]
    }
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }
  }
};

// Card flip animation
export const cardFlip = {
  front: {
    rotateY: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
  },
  back: {
    rotateY: 180,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }
  }
};