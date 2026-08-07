import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';

/**
 * HeroBackground component
 * Premium animated background for the landing page hero section.
 * Includes:
 * 1. Morphing blurred gradient mesh (blob)
 * 2. Parallax gold line grid overlay
 * 3. Floating invoice card mockups
 */
const HeroBackground = () => {
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  // Responsive check to disable some heavy animations/elements on mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 1. Mouse Parallax for the Grid
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth out the mouse values
  const smoothMouseX = useSpring(mouseX, { damping: 50, stiffness: 400 });
  const smoothMouseY = useSpring(mouseY, { damping: 50, stiffness: 400 });

  // Transform mouse position into slight translation for the grid
  const gridX = useTransform(smoothMouseX, [-1, 1], [-20, 20]);
  const gridY = useTransform(smoothMouseY, [-1, 1], [-20, 20]);

  useEffect(() => {
    if (shouldReduceMotion || isMobile) return;

    const handleMouseMove = (e) => {
      // Normalize mouse position between -1 and 1
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY, shouldReduceMotion, isMobile]);

  // 2. Scroll Parallax for floating elements
  const { scrollY } = useScroll();
  const floatY1 = useTransform(scrollY, [0, 1000], [0, -100]);
  const floatY2 = useTransform(scrollY, [0, 1000], [0, -150]);
  const floatRotate = useTransform(scrollY, [0, 1000], [0, 15]);

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-theme-app pointer-events-none select-none">
      
      {/* --- 1. Blurred Gradient Mesh Blob (Aurora) --- */}
      <div className="absolute inset-0 flex items-center justify-center opacity-50 mix-blend-multiply dark:mix-blend-screen">
        {!shouldReduceMotion ? (
          <div className="relative w-[120vw] h-[120vh] max-w-4xl max-h-4xl">
            {/* Primary Accent Blob */}
            <div className="absolute top-1/4 left-1/4 w-[60%] h-[60%] rounded-full blur-[100px] opacity-80 mix-blend-multiply dark:mix-blend-screen animate-blob will-change-transform" style={{ backgroundColor: 'var(--accent)' }} />
            {/* Dark Accent Blob */}
            <div className="absolute bottom-1/4 right-1/4 w-[50%] h-[50%] rounded-full blur-[120px] opacity-70 mix-blend-multiply dark:mix-blend-screen animate-blob will-change-transform" style={{ backgroundColor: 'var(--accent-dark, var(--accent))', animationDelay: '2s', animationDirection: 'reverse' }} />
            {/* Light Accent Blob */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full blur-[90px] opacity-60 mix-blend-multiply dark:mix-blend-screen animate-blob will-change-transform" style={{ backgroundColor: 'var(--accent-light, var(--accent))', animationDelay: '4s' }} />
          </div>
        ) : (
          /* Static fallback for reduced motion */
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(to bottom right, var(--accent-light), transparent)' }} />
        )}
      </div>

      {/* --- 2. Parallax Theme Grid Overlay --- */}
      <motion.div
        className="absolute inset-[-10%] w-[120%] h-[120%] opacity-20 dark:opacity-15 will-change-transform"
        style={{
          x: shouldReduceMotion ? 0 : gridX,
          y: shouldReduceMotion ? 0 : gridY,
          backgroundImage: `
            linear-gradient(to right, var(--border-strong) 1px, transparent 1px),
            linear-gradient(to bottom, var(--border-strong) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* --- 3. Floating Invoice Cards --- */}
      {!isMobile && (
        <div className="absolute inset-0 z-10 hidden md:block">
          
          {/* Card 1: Top Right */}
          <motion.div
            className="absolute top-[15%] right-[10%] w-64 p-5 rounded-2xl bg-theme-surface/80 backdrop-blur-md border border-theme-border-strong shadow-theme-glow will-change-transform"
            style={{ y: floatY1, rotate: floatRotate }}
            animate={shouldReduceMotion ? {} : {
              y: [0, -15, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {/* Simple Mockup UI */}
            <div className="flex justify-between items-center mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--accent-light)' }}>
                <div className="w-5 h-5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
              </div>
              <div className="w-16 h-4 rounded-md" style={{ backgroundColor: 'var(--accent-light)' }} />
            </div>
            <div className="space-y-3">
              <div className="w-full h-3 rounded bg-theme-muted/20" />
              <div className="w-4/5 h-3 rounded bg-theme-muted/20" />
              <div className="w-full h-px my-2" style={{ backgroundColor: 'var(--accent-light)' }} />
              <div className="flex justify-between items-center">
                <div className="w-12 h-3 rounded bg-theme-muted/20" />
                <div className="w-16 h-4 rounded" style={{ backgroundColor: 'var(--accent)' }} />
              </div>
            </div>
          </motion.div>

          {/* Card 2: Bottom Left */}
          <motion.div
            className="absolute bottom-[20%] left-[5%] w-56 p-4 rounded-xl bg-theme-surface/70 backdrop-blur-md border border-theme-border-strong shadow-theme-glow-lg will-change-transform"
            style={{ y: floatY2 }}
            animate={shouldReduceMotion ? {} : {
              y: [0, 20, 0],
            }}
            transition={{
              duration: 8,
              delay: 1,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--accent-light)' }}>
                <svg className="w-4 h-4" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <div className="w-20 h-3 rounded bg-theme-muted/20 mb-1" />
                <div className="w-12 h-2 rounded" style={{ backgroundColor: 'var(--accent)' }} />
              </div>
            </div>
            <div className="w-full h-2 rounded bg-theme-muted/10" />
          </motion.div>

        </div>
      )}

      {/* Gradient overlay at bottom to blend smoothly into next section */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-theme-app to-transparent z-20" />
    </div>
  );
};

export default HeroBackground;
