import React, { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Logo = ({ type = 'horizontal', className = '', forceWhiteText = false, onClick }) => {
  const [isClicked, setIsClicked] = useState(false);
  const rawId = useId();
  const uid = rawId.replace(/:/g, '');

  const handleLogoClick = (e) => {
    if (!isClicked) {
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 2000);
    }
    if (onClick) onClick(e);
  };

  const defs = (
    <defs>
      {/* Paper fold gradient */}
      <linearGradient id={`${uid}fold`} x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#ffffff" />
      </linearGradient>

      {/* Ring Glow Filter */}
      <filter id={`${uid}glow`} x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Leaf gradient */}
      <linearGradient id={`${uid}leaf`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="var(--accent)" />
        <stop offset="100%" stopColor="var(--accent-glow)" />
      </linearGradient>
    </defs>
  );

  const IconSVG = ({ sizeClass = 'w-10 h-10' }) => (
    <motion.div className="relative inline-flex items-center justify-center">
      {/* Premium Click Glow Effect */}
      <AnimatePresence>
        {isClicked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: [0, 0.8, 0], scale: [0.5, 2, 3] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 z-0 pointer-events-none rounded-full"
            style={{ background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)' }}
          />
        )}
      </AnimatePresence>

      <motion.svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${sizeClass} shrink-0 overflow-visible relative z-10`}
        animate={
          isClicked
            ? { opacity: 1, scale: 1, y: 0, rotateY: [0, 360], rotateZ: [0, -5, 5, 0] }
            : { opacity: 1, scale: 1, y: 0, rotateY: 0, rotateZ: 0 }
        }
        transition={{
          duration: isClicked ? 1.5 : 0.5,
          ease: isClicked ? "easeInOut" : "easeOut",
        }}
        whileHover={{ scale: 1.08, transition: { duration: 0.2 } }}
        whileTap={{ scale: 0.94 }}
      >
        <defs>
          <linearGradient id={`${uid}themeGrad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor="var(--accent-dark, var(--accent))" />
          </linearGradient>
          <filter id={`${uid}glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Dynamic Document Outline */}
        <motion.path
          d="M 38,20 L 62,20 L 80,38 L 80,72 A 8 8 0 0 1 72,80 L 38,80 A 8 8 0 0 1 30,72 L 30,28 A 8 8 0 0 1 38,20 Z"
          stroke={`url(#${uid}themeGrad)`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0px 2px 8px var(--accent-glow))` }}
        />
        
        {/* 2. Document Fold */}
        <motion.path
          d="M 62,20 L 62,38 L 80,38"
          stroke={`url(#${uid}themeGrad)`}
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner lines for detail */}
        <motion.line x1="42" y1="40" x2="52" y2="40" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
        <motion.line x1="42" y1="52" x2="68" y2="52" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
        <motion.line x1="42" y1="64" x2="58" y2="64" stroke="var(--accent)" strokeWidth="4" strokeLinecap="round" opacity="0.6" />

        {/* 3. The "Q" Tail (Floating out) */}
        <motion.path
          d="M 66,66 L 86,86"
          stroke={`url(#${uid}themeGrad)`}
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0px 0px 6px var(--accent-glow))` }}
        />

        {/* Burst Particles on Click */}
        <AnimatePresence>
          {isClicked && (
            <>
              {[...Array(8)].map((_, i) => (
                <motion.circle
                  key={`particle-${i}`}
                  cx="50" cy="50" r="2.5"
                  fill="var(--accent)"
                  initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  animate={{
                    opacity: 0,
                    x: Math.cos(i * 45 * (Math.PI / 180)) * 42,
                    y: Math.sin(i * 45 * (Math.PI / 180)) * 42,
                    scale: 0
                  }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: i * 0.04 }}
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
        className={`aspect-square rounded-[2rem] bg-theme-surface flex flex-col items-center justify-center p-6 border border-theme-border-soft shadow-premium hover:shadow-premium-lg transition-all duration-300 cursor-pointer ${className}`}
      >
        <IconSVG sizeClass="w-3/5 h-3/5" />
        <div className="mt-5 flex flex-col items-center select-none text-center">
          <motion.span
            className="text-[28px] tracking-tighter transition-colors duration-300 flex items-baseline justify-center"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            animate={{ scale: isClicked ? [1, 1.05, 1] : 1 }}
            transition={{ duration: 1.5 }}
          >
            <span className="text-theme-primary font-bold">Bill</span>
            <span className="font-extrabold" style={{ 
              backgroundImage: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.1))'
            }}>Qyro</span>
          </motion.span>
          <span className="text-[7px] font-black uppercase text-theme-muted tracking-[0.1em] mt-2 flex flex-col items-center gap-0.5 leading-tight">
            <span>SMART BILLING.</span>
            <span className="opacity-70">PREMIUM INVOICING PLATFORM</span>
          </span>
        </div>
      </div>
    );
  }

  // Default: type === 'horizontal'
  return (
    <motion.div
      className={`flex items-center gap-3 cursor-pointer group ${className}`}
      whileHover="hover"
      onClick={handleLogoClick}
    >
      <IconSVG sizeClass="w-11 h-11" />

      <div className="flex flex-col select-none">
        {/* Brand name row */}
        <div className="flex items-baseline leading-none pt-0.5">
          <motion.span
            className={`text-[26px] font-bold tracking-tighter leading-none ${forceWhiteText ? 'text-white' : 'text-theme-primary'}`}
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
            animate={{
              color: isClicked ? 'var(--accent)' : (forceWhiteText ? '#ffffff' : 'var(--text-primary)'),
              transition: { duration: 1.5 }
            }}
          >
            Bill
          </motion.span>

          <motion.span
            className="text-[26px] font-extrabold tracking-tighter relative pr-4 leading-none"
            style={{ 
              backgroundImage: 'var(--accent-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: "'Inter', system-ui, sans-serif",
              filter: 'drop-shadow(0px 1px 2px rgba(0,0,0,0.05))'
            }}
          >
            Qyro
            {/* Floating leaf superscript */}
            <motion.svg
              viewBox="0 0 10 10"
              className="absolute"
              style={{ top: '0px', right: '0px', width: '11px', height: '11px', fill: `url(#${uid}leaf)` }}
              animate={
                isClicked
                  ? { y: [0, -15, 0], scale: [1, 1.8, 1], rotate: [0, 360, 720] }
                  : { y: 0, rotate: 0 }
              }
              transition={
                isClicked
                  ? { duration: 1.5, ease: "easeInOut" }
                  : { duration: 0.3 }
              }
            >
              <path d="M0,7 C1,3 4,1 6,0 C6,2 5,5 3,6 C2,7 0,7 0,7 Z" fill={`url(#${uid}leaf)`} />
            </motion.svg>
          </motion.span>
        </div>

        {/* Premium tagline */}
        <motion.div className="flex flex-col mt-1 opacity-80">
          <span
            className="text-[7px] font-black uppercase tracking-[0.1em] leading-tight"
            style={{ color: 'var(--text-muted)' }}
          >
            SMART BILLING.
          </span>
          <span
            className="text-[6.5px] font-bold uppercase tracking-[0.05em] leading-none opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            PREMIUM INVOICING PLATFORM
          </span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Logo;
