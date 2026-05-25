import React from 'react';
import { motion } from 'framer-motion';

/**
 * High-fidelity Vector Logo and Brand Asset Component for BillQyro
 * Matches the newly uploaded brand design exactly:
 * - Teal gradient "Q" ring and angled tail with horizontal base cut
 * - White document with folded top-right corner inside the ring
 * - 3 horizontal lines and Rupee (₹) symbol
 * - Bold, tight typography for "BillQyro"
 * 
 * @param {string} type - 'icon' | 'horizontal' | 'app-icon'
 * @param {string} className - additional sizing / layout classes
 */
const Logo = ({ type = 'horizontal', className = '', forceWhiteText = false }) => {
  // Brand color gradients & assets definitions
  const defs = (
    <defs>
      {/* Vibrant Teal to Deep Ocean gradient for the ring and tail */}
      <linearGradient id="qBrandGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#2dd4bf" />
        <stop offset="50%" stopColor="#0d9488" />
        <stop offset="100%" stopColor="#0f766e" />
      </linearGradient>
      
      {/* White document base shadow */}
      <filter id="docShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15" />
      </filter>

      {/* Folded corner shadow for 3D effect */}
      <filter id="foldShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="-1" dy="2" stdDeviation="2" floodOpacity="0.1" />
      </filter>
      
      {/* Heavy shadow for the tail popping out */}
      <filter id="tailShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="-3" dy="1" stdDeviation="3" floodOpacity="0.3" />
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
        {/* 1. The Teal Q Ring (Back layer) */}
        <circle 
          cx="50" cy="50" r="36" 
          fill="none" 
          stroke="url(#qBrandGradient)" 
          strokeWidth="19" 
        />

        {/* 2. Premium White Invoicing Document Sheet (Middle layer) */}
        {/* Document base path missing the top-right corner where it folds */}
        <path 
          d="M 32 20 H 58 L 74 36 V 76 C 74 78 72 80 70 80 H 32 C 30 80 28 78 28 76 V 24 C 28 22 30 20 32 20 Z" 
          fill={forceWhiteText ? "#f1f5f9" : "#ffffff"} 
          filter="url(#docShadow)" 
        />

        {/* Folded paper corner (curled down) */}
        <path 
          d="M 58 20 L 74 36 C 68 36 62 36 58 36 C 58 30 58 25 58 20 Z" 
          fill={forceWhiteText ? "#e2e8f0" : "#f8fafc"} 
          filter="url(#foldShadow)" 
        />

        {/* Three premium horizontal invoice lines (Teal) */}
        <rect x="40" y="38" width="24" height="4" rx="2" fill="#0d9488" />
        <rect x="40" y="47" width="24" height="4" rx="2" fill="#0d9488" />
        <rect x="40" y="56" width="14" height="4" rx="2" fill="#0d9488" />

        {/* Bold Rupee ₹ Symbol in bottom left aligned with lines */}
        <path 
          transform="translate(40, 63) scale(0.65)" 
          d="M19.5,14 H10 V11 H13.5 C15.5,11 17,10 17,8 C17,6.5 15.5,5.5 13.5,5.5 H10 V3 H20 V0 H6 V3 H10 C12,3 13,4 13,5.5 C13,7 12,8 10,8 H6 V11 H10 V14 H6 V17 H10.5 L19.5,28 H24 L14.5,17 H19.5 V14 Z" 
          fill="#0d9488" 
        />

        {/* 3. The Teal Q Tail (Front layer overlapping document and ring) */}
        {/* Slanted 45 degrees, completely horizontal cut at the bottom */}
        <path 
          d="M 55 63 L 68 50 L 96 78 C 97 79 96 82 94 82 H 72 C 70 82 68 81 67 79 Z" 
          fill="url(#qBrandGradient)" 
          filter="url(#tailShadow)" 
          stroke="url(#qBrandGradient)" 
          strokeWidth="1" 
          strokeLinejoin="round" 
        />
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
