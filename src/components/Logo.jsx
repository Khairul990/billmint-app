import React from 'react';
import { motion } from 'framer-motion';

/**
 * High-fidelity Vector Logo and Brand Asset Component for BillQyro
 * Matches the newly uploaded 3D icon style exactly:
 * - Thin black outer ring
 * - White document with heavy 3D shadow and teal solid folded corner
 * - Teal horizontal lines and Rupee symbol
 * - Thick rounded teal tail pill overlapping the document and ring
 * 
 * @param {string} type - 'icon' | 'horizontal' | 'app-icon'
 * @param {string} className - additional sizing / layout classes
 */
const Logo = ({ type = 'horizontal', className = '', forceWhiteText = false }) => {
  // Brand color gradients & assets definitions
  const defs = (
    <defs>
      {/* Vibrant Teal gradient for fold and tail to give 3D shiny effect */}
      <linearGradient id="tealGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#00d2ff" />
        <stop offset="100%" stopColor="#0f766e" />
      </linearGradient>
      
      {/* White document shadow */}
      <filter id="docShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="5" stdDeviation="5" floodOpacity="0.12" />
      </filter>

      {/* Heavy shadow for the tail popping out */}
      <filter id="tailShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="-2" dy="3" stdDeviation="4" floodOpacity="0.25" />
      </filter>
    </defs>
  );

  // Stylized Q path + Overlaid Invoicing Sheet matching the new images
  const IconSVG = ({ sizeClass = 'w-10 h-10' }) => (
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
      
      <g transform="translate(5, 5) scale(0.9)">
        {/* 1. The Thin Black Ring (Back layer) */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="#000000" strokeWidth="2.5" />

        {/* 2. Premium White Invoicing Document Sheet (Middle layer) */}
        <path d="M 28 15 H 55 L 75 35 V 75 C 75 79 72 82 68 82 H 28 C 24 82 21 79 21 75 V 22 C 21 18 24 15 28 15 Z" fill={forceWhiteText ? "#f1f5f9" : "#ffffff"} filter="url(#docShadow)" />

        {/* 3. Teal Folded paper corner (pointing down-left, solid teal) */}
        <path d="M 54 15 L 75 36 H 58 C 56 36 54 34 54 32 V 15 Z" fill="url(#tealGrad)" />

        {/* 4. Three premium thick horizontal invoice lines (Solid Teal) */}
        <rect x="32" y="36" width="32" height="5.5" rx="2.75" fill="#00bfa5" />
        <rect x="32" y="47" width="32" height="5.5" rx="2.75" fill="#00bfa5" />
        <rect x="32" y="58" width="18" height="5.5" rx="2.75" fill="#00bfa5" />

        {/* 5. Bold Rupee ₹ Symbol in bottom left aligned with lines */}
        <path transform="translate(32, 65) scale(0.65)" d="M19.5,14 H10 V11 H13.5 C15.5,11 17,10 17,8 C17,6.5 15.5,5.5 13.5,5.5 H10 V3 H20 V0 H6 V3 H10 C12,3 13,4 13,5.5 C13,7 12,8 10,8 H6 V11 H10 V14 H6 V17 H10.5 L19.5,28 H24 L14.5,17 H19.5 V14 Z" fill="#00bfa5" />

        {/* 6. The 3D Teal Q Tail (Front layer overlapping document and ring) */}
        <rect x="49" y="56" width="44" height="15" rx="7.5" fill="url(#tealGrad)" filter="url(#tailShadow)" transform="rotate(45, 49, 56)" />
      </g>
    </motion.svg>
  );

  if (type === 'icon') {
    return <IconSVG sizeClass={className || 'w-10 h-10'} />;
  }

  if (type === 'app-icon') {
    return (
      <div className={`aspect-square rounded-[22%] bg-white flex items-center justify-center p-3 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.16)] ${className}`}>
        <IconSVG sizeClass="w-full h-full" />
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
      <IconSVG sizeClass="w-10 h-10" />
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
