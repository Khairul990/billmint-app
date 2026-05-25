import React from 'react';
import { motion } from 'framer-motion';

/**
 * High-fidelity Vector Logo and Brand Asset Component for BillQyro
 * Matches the new clean white + teal app icon style:
 * - White rounded square app background
 * - White invoice paper shape with folded corner
 * - Green/teal document lines and diagonal Q-style block
 */
const Logo = ({ type = 'horizontal', className = '', forceWhiteText = false }) => {
  // Brand color gradients & assets definitions
  const defs = (
    <defs>
      <linearGradient id="qBrandGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#14b8a6" />
        <stop offset="100%" stopColor="#0f766e" />
      </linearGradient>
      <filter id="bgShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0f172a" floodOpacity="0.08" />
      </filter>
      <filter id="docShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.12" />
      </filter>
      <filter id="foldShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="-2" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.15" />
      </filter>
      <filter id="tailShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="-2" dy="2" stdDeviation="3" floodColor="#0f172a" floodOpacity="0.15" />
      </filter>
    </defs>
  );

  // Stylized Q path + Overlaid Invoicing Sheet matching the new images
  const IconSVG = ({ sizeClass = 'w-10 h-10', withBackground = true }) => (
    <motion.svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} shrink-0 overflow-visible`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.05 }}
    >
      {defs}
      
      {/* 1. White rounded square background */}
      {withBackground && (
        <rect x="6" y="6" width="88" height="88" rx="22" fill="#ffffff" filter="url(#bgShadow)" stroke="#f8fafc" strokeWidth="1" />
      )}

      {/* 2. White Invoice Paper Shape */}
      <path 
        d="M 27 24 C 27 21 29 19 32 19 H 58 L 73 34 V 76 C 73 79 71 81 68 81 H 32 C 29 81 27 79 27 76 Z" 
        fill={!withBackground && forceWhiteText ? "#f8fafc" : "#ffffff"} 
        filter="url(#docShadow)" 
      />

      {/* 3. Green/teal folded corner */}
      <path 
        d="M 58 19 V 31 C 58 33 60 35 62 35 H 73 Z" 
        fill="url(#qBrandGradient)" 
        filter="url(#foldShadow)" 
      />

      {/* 4. Green/teal document lines */}
      <rect x="35" y="38" width="28" height="4" rx="2" fill="url(#qBrandGradient)" />
      <rect x="35" y="48" width="28" height="4" rx="2" fill="url(#qBrandGradient)" />
      <rect x="35" y="58" width="16" height="4" rx="2" fill="url(#qBrandGradient)" />

      {/* 5. Green/teal diagonal Q-style block */}
      <path 
        d="M 50 63 L 64 49 L 88 73 C 90 75 88 78 86 78 H 68 C 65 78 63 77 62 75 Z" 
        fill="url(#qBrandGradient)" 
        filter="url(#tailShadow)" 
      />
    </motion.svg>
  );

  if (type === 'icon') {
    return <IconSVG sizeClass={className || 'w-10 h-10'} withBackground={true} />;
  }

  if (type === 'app-icon') {
    return (
      <div className={`aspect-square flex items-center justify-center p-2 transition-all duration-300 hover:scale-105 ${className}`}>
        <IconSVG sizeClass="w-full h-full" withBackground={true} />
      </div>
    );
  }

  // Default: type === 'horizontal' (Icon on the left, typography on the right)
  return (
    <motion.div 
      className={`flex items-center gap-2 cursor-pointer select-none ${className}`}
      initial="hidden"
      animate="visible"
      whileHover="hover"
    >
      <IconSVG sizeClass="w-10 h-10" withBackground={true} />
      <div className="flex items-baseline leading-none tracking-tight">
        {/* "Bill" text - Dark Navy */}
        <motion.span 
          className={`text-2xl font-black ${forceWhiteText ? 'text-white' : 'text-[#0f172a]'} tracking-tight`}
          variants={{
            hidden: { opacity: 0, x: -5 },
            visible: { opacity: 1, x: 0, transition: { delay: 0.1, duration: 0.4 } }
          }}
        >
          Bill
        </motion.span>
        {/* "Qyro" text - Vibrant Teal Gradient */}
        <motion.span 
          className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-[#14b8a6] to-[#0f766e] tracking-tight"
          variants={{
            hidden: { opacity: 0, x: -5 },
            visible: { opacity: 1, x: 0, transition: { delay: 0.2, duration: 0.4 } }
          }}
        >
          Qyro
        </motion.span>
      </div>
    </motion.div>
  );
};

export default Logo;
