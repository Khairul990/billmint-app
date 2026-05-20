import React from 'react';

/**
 * High-fidelity Vector Logo and Brand Asset Component for BillQyro
 * Matches the brand guidelines:
 * - Deep navy blue B spine & text
 * - Mint / teal gradient invoicing document sheet
 * - Curved top-right fold and curved bottom-right leaf curl
 * - "Bill" in Navy / "Qyro" in brand green with superscript brand leaf accent
 * - Modern spaced sub-tagline
 * 
 * @param {string} type - 'icon' | 'horizontal' | 'app-icon'
 * @param {string} className - additional sizing / layout classes
 */
const Logo = ({ type = 'horizontal', className = '' }) => {
  // Brand color gradients & assets definitions
  const defs = (
    <defs>
      {/* Primary Mint to Teal gradient for invoice sheet */}
      <linearGradient id="brandGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#A7F3D0" /> {/* Soft Mint */}
        <stop offset="50%" stopColor="#10B981" /> {/* Brand Mint */}
        <stop offset="100%" stopColor="#06B6D4" /> {/* Brand Teal */}
      </linearGradient>
      
      {/* Light highlights for paper fold */}
      <linearGradient id="foldGradient" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0%" stopColor="#D1FAE5" />
        <stop offset="100%" stopColor="#FFFFFF" />
      </linearGradient>

      {/* Dark teal gradient for bottom curl */}
      <linearGradient id="curlGradient" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#047857" />
        <stop offset="100%" stopColor="#064E3B" />
      </linearGradient>
    </defs>
  );

  // Stylized B path + Overlaid Mint-to-Teal Invoicing Sheet
  const IconSVG = ({ sizeClass = 'w-10 h-10' }) => (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} shrink-0 overflow-visible`}
    >
      {defs}
      
      {/* 1. Stylized Navy "B" (Back layer) - adapts to dark mode text color */}
      <path 
        fillRule="evenodd" 
        clipRule="evenodd"
        d="M32 16h18c12 0 19 5.5 19 14.5c0 5-3.5 9-9.5 11c6.5 1.5 10.5 5.5 10.5 12.5c0 11-8.5 16-20 16H32c-2.2 0-4-1.8-4-4V20c0-2.2 1.8-4 4-4zm6.5 7.5v12.5h11.5c4 0 7-2 7-6.25s-3-6.25-7-6.25H38.5zm0 18.5V57h13.5c5.5 0 8.5-2.5 8.5-7s-3-7.5-8.5-7.5H38.5z"
        className="fill-slate-900 dark:fill-white transition-colors duration-300"
      />

      {/* 2. Premium Invoicing Document Sheet (Front layer) */}
      {/* Base sheet body with top-right corner cut and rounded bottom-left */}
      <path 
        d="M24 28c0-4.4 3.6-8 8-8h16l8 8v34c0 4.4-3.6 8-8 8H32c-4.4 0-8-3.6-8-8V28z" 
        fill="url(#brandGradient)"
        className="drop-shadow-md"
      />

      {/* Three premium horizontal invoice lines */}
      <rect x="30" y="30" width="12" height="2" rx="1" fill="#064E3B" fillOpacity="0.4" />
      <rect x="30" y="36" width="18" height="2" rx="1" fill="#064E3B" fillOpacity="0.4" />
      <rect x="30" y="42" width="10" height="2" rx="1" fill="#064E3B" fillOpacity="0.4" />

      {/* Bold Dollar $ Symbol in bottom center */}
      <path 
        d="M38 48.5c0-.6.4-1 1-1h1.5v-1c0-.3.2-.5.5-.5h1c.3 0 .5.2.5.5v1H44c.6 0 1 .4 1 1s-.4 1-1 1h-2.5v1.5h1.5c1.4 0 2.5 1.1 2.5 2.5s-1.1 2.5-2.5 2.5V59c0 .3-.2.5-.5.5h-1c-.3 0-.5-.2-.5-.5v-1H39c-.6 0-1-.4-1-1s.4-1 1-1h2.5v-1.5h-1.5c-1.4 0-2.5-1.1-2.5-2.5zm4 1.5c.3 0 .5-.2.5-.5s-.2-.5-.5-.5h-1.5c-.3 0-.5.2-.5.5s.2.5.5.5H42zm.5 5.5c-.3 0-.5.2-.5.5s.2.5.5.5H44c.3 0 .5-.2.5-.5s-.2-.5-.5-.5h-1.5z" 
        fill="#064E3B"
        fillOpacity="0.85"
      />

      {/* Top-Right Paper Fold corner */}
      <path 
        d="M48 20l8 8h-6c-1.1 0-2-.9-2-2v-6z" 
        fill="url(#foldGradient)"
        className="drop-shadow-sm"
      />

      {/* Bottom-Right Curved Roll Curl */}
      <path 
        d="M50 70c6 0 6-6 6-6H48c-1.1 0-2 .9-2 2v2c2 2 4 2 4 2z" 
        fill="url(#curlGradient)"
        className="drop-shadow-sm"
      />
    </svg>
  );

  if (type === 'icon') {
    return <IconSVG sizeClass={className || 'w-10 h-10'} />;
  }

  if (type === 'app-icon') {
    return (
      <div className={`aspect-square rounded-3xl bg-white flex flex-col items-center justify-center p-6 border border-slate-100 shadow-premium transition-all hover:shadow-premium-hover ${className}`}>
        <IconSVG sizeClass="w-3/5 h-3/5" />
        <div className="mt-4 flex flex-col items-center select-none text-center">
          <span className="text-xl font-extrabold text-slate-800 tracking-tight">Bill<span className="text-emerald-500 font-extrabold">Qyro</span></span>
          <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest mt-1">SMART BILLING &bull; PREMIUM INVOICES</span>
        </div>
      </div>
    );
  }

  // Default: type === 'horizontal' (Icon on the left, typography on the right)
  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      <IconSVG sizeClass="w-10 h-10" />
      <div className="flex flex-col select-none">
        <div className="flex items-baseline leading-none">
          {/* Bill text */}
          <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight transition-colors duration-300">
            Bill
          </span>
          {/* Qyro text with custom superscript accent leaf */}
          <span className="text-xl font-black text-emerald-500 dark:text-emerald-400 tracking-tight transition-colors duration-300 relative pr-3">
            Qyro
            {/* Custom vector brand accent leaf */}
            <svg 
              viewBox="0 0 10 10" 
              className="absolute w-2.5 h-2.5 text-emerald-400 dark:text-emerald-300 fill-current"
              style={{ top: '1px', right: '0px' }}
            >
              <path d="M0,7 C1,3 4,1 6,0 C6,2 5,5 3,6 C2,7 0,7 0,7 Z" />
            </svg>
          </span>
        </div>
        
        {/* Tagline under brand name */}
        <span className="text-[6.5px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mt-1">
          Smart Billing &bull; Premium Invoices
        </span>
      </div>
    </div>
  );
};

export default Logo;
