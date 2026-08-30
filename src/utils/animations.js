// Premium easing curves
export const easePremium = [0.25, 1, 0.5, 1];
export const easeSpringy = [0.17, 0.67, 0.3, 1.33];
export const easeFluid = [0.32, 0.72, 0, 1];

// Spring configurations
export const springBouncy = { type: 'spring', stiffness: 400, damping: 15 };
export const springSmooth = { type: 'spring', stiffness: 300, damping: 25, mass: 0.8 };
export const springGentle = { type: 'spring', stiffness: 200, damping: 30 };

// Page transitions: transform + opacity only. Filter/blur animations force
// expensive off-screen rendering in mobile WebViews.
export const pageVariants = {
  initial: { opacity: 0, y: 15, scale: 0.985 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.32,
      ease: easePremium,
      when: 'beforeChildren',
      staggerChildren: 0.035
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.985,
    transition: { duration: 0.2, ease: easePremium }
  }
};

export const pageTransition = {
  type: 'tween',
  ease: easePremium,
  duration: 0.32,
};

export const staggerContainer = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 }
  }
};

export const staggerItem = {
  hidden: { opacity: 1, y: 14, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 350, damping: 25 }
  }
};

export const fadeInUp = {
  hidden: { opacity: 1, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easePremium } }
};

export const fadeInDown = {
  hidden: { opacity: 1, y: -24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easePremium } }
};

export const fadeIn = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: easeFluid } }
};

export const scaleIn = {
  hidden: { opacity: 1, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: easeSpringy } }
};

export const slideUp = {
  hidden: { opacity: 1, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easePremium } }
};

export const slideInRight = {
  hidden: { opacity: 1, x: 32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.32, ease: easePremium } }
};

export const slideInLeft = {
  hidden: { opacity: 1, x: -32 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.32, ease: easePremium } }
};

// Modal animation: avoid animated backdrop-filter; it is costly on Android.
export const modalOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.16 } }
};

export const modalContentVariants = {
  hidden: { opacity: 1, scale: 0.94, y: 16 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { ...springSmooth, delay: 0.03 } },
  exit: { opacity: 1, scale: 0.97, y: 8, transition: { duration: 0.16, ease: easePremium } }
};

export const sheetOverlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.16 } }
};

export const sheetContentVariants = {
  hidden: { y: '100%' },
  visible: { y: 0, transition: springSmooth },
  exit: { y: '100%', transition: { duration: 0.2, ease: easePremium } }
};

export const successCheckVariants = {
  hidden: { pathLength: 0, opacity: 1 },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { duration: 0.45, ease: easePremium, delay: 0.08 },
      opacity: { duration: 0.1 }
    }
  }
};

export const successCircleVariants = {
  hidden: { scale: 0, opacity: 1 },
  visible: { scale: 1, opacity: 1, transition: springBouncy }
};

export const notificationVariants = {
  hidden: { opacity: 1, x: 80, scale: 0.94 },
  visible: { opacity: 1, x: 0, scale: 1, transition: springBouncy },
  exit: { opacity: 1, x: 40, scale: 0.97, transition: { duration: 0.16, ease: easePremium } }
};

export const scaleOnHover = {
  rest: { scale: 1 },
  hover: { scale: 1.03, transition: springBouncy },
  tap: { scale: 0.95, transition: { duration: 0.1 } }
};

export const buttonTap = {
  rest: { scale: 1 },
  hover: { scale: 1.02, y: -1, transition: springBouncy },
  tap: { scale: 0.95, y: 1, transition: { duration: 0.1 } }
};

export const cardHover = {
  rest: { scale: 1, y: 0, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
  hover: {
    scale: 1.01,
    y: -3,
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    transition: springSmooth
  },
  tap: { scale: 0.98 }
};

export const iconSpinHover = {
  rest: { rotate: 0 },
  hover: { rotate: 180, transition: { duration: 0.35, ease: easePremium } },
  tap: { rotate: 360, transition: { duration: 0.2 } }
};

export const listItem = {
  hidden: { opacity: 1, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 300, damping: 25 }
  },
  exit: { opacity: 1, x: 10, transition: { duration: 0.16, ease: easePremium } }
};

export const countUp = (start, end, duration = 800) => {
  const startTime = performance.now();
  return new Promise((resolve) => {
    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = t => 1 - Math.pow(1 - t, 4);
      const eased = ease(progress);
      const current = Math.round(start + (end - start) * eased);
      void current;
      if (progress < 1) requestAnimationFrame(animate);
      else resolve(end);
    };
    requestAnimationFrame(animate);
  });
};

export const gridStagger = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.02 }
  }
};

export const gridItem = {
  hidden: { opacity: 1, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springSmooth }
};

export const cardFlip = {
  front: { rotateY: 0, transition: { duration: 0.45, ease: easePremium } },
  back: { rotateY: 180, transition: { duration: 0.45, ease: easePremium } }
};
