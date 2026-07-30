import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * High-fidelity Vector Logo and Brand Asset Component for BillQyro
 * Matches the uploaded brand design exactly:
 * - Stylized ribbon "B" (Back layer) in Emerald/Teal Gradient
 * - Premium Invoicing Document Sheet (Front layer) in White (Light mode) / Slate-900 (Dark mode)
 * - Top-Right Paper Fold corner and bottom-left leaf tail curl
 * - "Bill" in Slate-900/White / "Qyro" in Emerald-500/Emerald-400
 * - Spaced horizontal markers and Modern spaced sub-tagline
 * 
 * @param {string} type - 'icon' | 'horizontal' | 'app-icon'
 * @param {string} className - additional sizing / layout classes
 */
const Logo = ({ type = 'horizontal', className = '', forceWhiteText = false, onClick }) => {
  const [isClicked, setIsClicked] = useState(false);

  const handleLogoClick = (e) => {
    if (!isClicked) {
      setIsClicked(true);
      // Reset animation after 2 seconds
      setTimeout(() => setIsClicked(false), 2000);
    }
    if (onClick) onClick(e);
  };

  // Brand color gradients & assets definitions
  const defs = (
    <defs>
      {/* Light highlights for paper fold */}
      <linearGradient id="foldGradient" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#ffffff" />
      </linearGradient>
      
      {/* Dynamic Pro Glow */}
      <radialGradient id="proGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8" />
        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
      </radialGradient>
    </defs>
  );

  // Stylized Q path + Overlaid Invoicing Sheet matching the user's design image
  const IconSVG = ({ sizeClass = 'w-10 h-10' }) => (
    <motion.div className="relative inline-flex items-center justify-center">
      {/* Premium Click Glow Effect (Background) */}
      <AnimatePresence>
        {isClicked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 2] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 z-0 pointer-events-none rounded-full"
            style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)', opacity: 0.2 }}
          />
        )}
      </AnimatePresence>

      <motion.svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClass} shrink-0 overflow-visible relative z-10`}
        initial={{ opacity: 0, scale: 0.8, y: 5 }}
        animate={
          isClicked 
            ? { opacity: 1, scale: 1, y: 0, rotateY: [0, 360], rotateZ: [0, -10, 10, 0] }
            : { opacity: 1, scale: 1, y: 0, rotateY: 0, rotateZ: 0 }
        }
        transition={{ 
          duration: isClicked ? 1.5 : 0.5, 
          ease: isClicked ? "easeInOut" : "easeOut",
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {defs}
        
        {/* 1. The Teal Q Ring (Back layer) */}
        <motion.circle 
          cx="45" cy="45" r="32" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="16" 
          className="text-theme-accent transition-all duration-300 drop-shadow-md"
          animate={{ 
            filter: isClicked 
              ? ['drop-shadow(0px 0px 5px var(--accent))', 'drop-shadow(0px 0px 25px var(--accent))', 'drop-shadow(0px 0px 5px var(--accent))']
              : ['drop-shadow(0px 0px 0px rgba(5, 150, 105, 0))', 'drop-shadow(0px 0px 8px rgba(5, 150, 105, 0.5))', 'drop-shadow(0px 0px 0px rgba(5, 150, 105, 0))'],
            strokeWidth: isClicked ? [16, 20, 16] : 16
          }}
          transition={{ duration: isClicked ? 1.5 : 3, repeat: isClicked ? 0 : Infinity, ease: "easeInOut" }}
        />

        {/* 2. Premium White Invoicing Document Sheet (Middle layer) */}
        <motion.path 
          d="M30 15 H55 L70 30 V70 C70 73 67 76 64 76 H30 C27 76 24 73 24 70 V21 C24 18 27 15 30 15 Z" 
          className="fill-white drop-shadow-xl"
          animate={{
            fill: isClicked ? ["#ffffff", "#f1f5f9", "#ffffff"] : "#ffffff"
          }}
          transition={{ duration: 1.5 }}
        />

        {/* Folded paper corner */}
        <path 
          d="M55 15 V30 H70 Z" 
          fill="url(#foldGradient)"
          className="drop-shadow-sm"
        />

        {/* Three premium horizontal invoice lines */}
        <motion.rect initial={{ width: 0 }} animate={{ width: 22 }} transition={{ delay: 0.3, duration: 0.4 }} x="35" y="32" width="22" height="4" rx="2" className="fill-theme-accent" />
        <motion.rect initial={{ width: 0 }} animate={{ width: 26 }} transition={{ delay: 0.4, duration: 0.4 }} x="35" y="42" width="26" height="4" rx="2" className="fill-theme-accent" />
        <motion.rect initial={{ width: 0 }} animate={{ width: 14 }} transition={{ delay: 0.5, duration: 0.4 }} x="35" y="52" width="14" height="4" rx="2" className="fill-theme-accent" />

        {/* Bold Rupee ₹ Symbol in bottom center */}
        <motion.path 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: 1, 
            scale: isClicked ? [1, 1.3, 1] : 1,
            rotate: isClicked ? [0, 15, -15, 0] : 0
          }}
          transition={{ delay: isClicked ? 0 : 0.6, duration: isClicked ? 1.5 : 0.8, type: "spring", stiffness: 200 }}
          transform="translate(39, 56) scale(0.6)"
          d="M19.5,14 H10 V11 H13.5 C15.5,11 17,10 17,8 C17,6.5 15.5,5.5 13.5,5.5 H10 V3 H20 V0 H6 V3 H10 C12,3 13,4 13,5.5 C13,7 12,8 10,8 H6 V11 H10 V14 H6 V17 H10.5 L19.5,28 H24 L14.5,17 H19.5 V14 Z" 
          className="fill-theme-accent"
        />

        {/* 3. The Teal Q Tail (Front layer) */}
        <motion.path 
          initial={{ opacity: 0, x: -10, y: -10 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
          d="M 50 50 L 78 80 C 80 82 78 85 75 85 L 62 85 C 60 85 58 84 56 82 L 36 60 Z" 
          fill="currentColor"
          className="text-theme-accent drop-shadow-lg"
        />
        
        {/* Burst Particles (Visible only on click) */}
        <AnimatePresence>
          {isClicked && (
            <>
              {[...Array(6)].map((_, i) => (
                <motion.circle
                  key={`particle-${i}`}
                  cx="50" cy="50" r="2"
                  fill="currentColor"
                  className="text-theme-accent"
                  initial={{ opacity: 1, x: 0, y: 0 }}
                  animate={{
                    opacity: 0,
                    x: Math.cos(i * 60 * (Math.PI / 180)) * 40,
                    y: Math.sin(i * 60 * (Math.PI / 180)) * 40,
                  }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              ))}
            </>
          )}
        </AnimatePresence>
      </motion.svg>
    </motion.div>
  );

  if (type === 'icon') {
    return (
      <div onClick={handleLogoClick} className="cursor-pointer">
        <IconSVG sizeClass={className || 'w-10 h-10'} />
      </div>
    );
  }

  if (type === 'app-icon') {
    return (
      <div 
        onClick={handleLogoClick}
        className={`aspect-square rounded-[2rem] bg-theme-card dark:bg-theme-app flex flex-col items-center justify-center p-6 border border-theme-border-soft shadow-premium transition-all duration-300 hover:shadow-premium-hover cursor-pointer ${className}`}
      >
        <IconSVG sizeClass="w-3/5 h-3/5" />
        <div className="mt-4 flex flex-col items-center select-none text-center">
          <motion.span 
            className="text-xl font-extrabold text-theme-primary tracking-tight transition-colors duration-300"
            animate={{ scale: isClicked ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 1.5 }}
          >
            Bill<span className="text-theme-accent font-extrabold">Qyro</span>
          </motion.span>
          <span className="text-[6.5px] font-black uppercase text-theme-muted tracking-widest mt-1.5 flex items-center gap-1 leading-none">
            <span className="h-[1px] w-1.5 bg-theme-accent-light dark:bg-theme-accent/30"></span>
            MODERN BILLING &amp; INVOICING
            <span className="h-[1px] w-1.5 bg-theme-accent-light dark:bg-theme-accent/30"></span>
          </span>
        </div>
      </div>
    );
  }

  // Default: type === 'horizontal' (Icon on the left, typography on the right)
  return (
    <motion.div 
      className={`flex items-center gap-3.5 cursor-pointer ${className}`}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onClick={handleLogoClick}
    >
      <IconSVG sizeClass="w-10 h-10" />
      <div className="flex flex-col select-none">
        <div className="flex items-baseline leading-none">
          {/* Bill text */}
          <motion.span 
            className={`text-xl font-black ${forceWhiteText ? 'text-white' : 'text-theme-primary'} tracking-tight`}
            variants={{
              hidden: { opacity: 0, x: -5 },
              visible: { opacity: 1, x: 0, transition: { delay: 0.2, duration: 0.4 } }
            }}
            animate={{ 
              color: isClicked ? 'var(--accent)' : (forceWhiteText ? '#ffffff' : 'var(--text-primary)'),
              transition: { duration: 1.5 }
            }}
          >
            Bill
          </motion.span>
          {/* Qyro text with custom superscript accent leaf */}
          <motion.span 
            className="text-xl font-black text-theme-accent tracking-tight relative pr-3"
            variants={{
              hidden: { opacity: 0, x: -5 },
              visible: { opacity: 1, x: 0, transition: { delay: 0.3, duration: 0.4 } }
            }}
          >
            Qyro
            {/* Custom vector brand accent leaf */}
            <motion.svg 
              viewBox="0 0 10 10" 
              className="absolute w-2.5 h-2.5 text-theme-accent fill-current"
              style={{ top: '1px', right: '0px' }}
              animate={
                isClicked 
                  ? { y: [0, -10, 0], scale: [1, 1.5, 1], rotate: [0, 180, 360] }
                  : { y: [0, -2, 0] }
              }
              transition={
                isClicked 
                  ? { duration: 1.5, ease: "easeInOut" }
                  : { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }
            >
              <path d="M0,7 C1,3 4,1 6,0 C6,2 5,5 3,6 C2,7 0,7 0,7 Z" />
            </motion.svg>
          </motion.span>
        </div>
        
        {/* Tagline under brand name with elegant green horizontal lines */}
        <motion.span 
          className={`text-[6.5px] font-black uppercase ${forceWhiteText ? 'text-theme-muted' : 'text-theme-muted'} tracking-widest mt-1.5 flex items-center gap-1.5 leading-none`}
          variants={{
            hidden: { opacity: 0, y: 5 },
            visible: { opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.4 } }
          }}
          animate={{
            letterSpacing: isClicked ? ['0.1em', '0.2em', '0.1em'] : '0.1em',
            transition: { duration: 1.5 }
          }}
        >
          <span className="h-[1px] w-2 bg-theme-accent-light dark:bg-theme-accent/30"></span>
          MODERN BILLING &amp; INVOICING PLATFORM
          <span className="h-[1px] w-2 bg-theme-accent-light dark:bg-theme-accent/30"></span>
        </motion.span>
      </div>
    </motion.div>
  );
};

export default Logo;
