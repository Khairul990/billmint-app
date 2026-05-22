import React from 'react';

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
const Logo = ({ type = 'horizontal', className = '', forceWhiteText = false }) => {
  // Brand color gradients & assets definitions
  const defs = (
    <defs>
      {/* Primary Mint to Teal gradient for the outer stylized "B" ribbon */}
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
    </defs>
  );

  // Stylized B path + Overlaid Invoicing Sheet matching the user's design image
  const IconSVG = ({ sizeClass = 'w-10 h-10' }) => (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={`${sizeClass} shrink-0 overflow-visible`}
    >
      {defs}
      
      {/* 1. Stylized Ribbon "B" (Back layer) in Emerald/Teal Gradient */}
      <path 
        fillRule="evenodd" 
        clipRule="evenodd"
        d="M32 15C24 15 24 23 24 30V70C24 77 24 85 32 85H60C72 85 82 77 82 66C82 58 76 51 68 49C76 47 80 40 80 32C80 22 72 15 60 15Z"
        fill="url(#brandGradient)"
        className="transition-all duration-300 drop-shadow-sm"
      />

      {/* 2. Premium Invoicing Document Sheet (Front layer) */}
      {/* Base sheet body with top-right corner cut and rounded bottom-left leaf tail */}
      <path 
        d="M36 22H52L60 30V60C60 64.4 56.4 68 52 68H42C34 68 30 72 27 76C26 71 28 64 32 60V26C32 23.8 33.8 22 36 22Z" 
        className="fill-white dark:fill-slate-900 stroke-slate-200/50 dark:stroke-slate-800 transition-colors duration-300 filter drop-shadow-md"
        strokeWidth="1"
      />

      {/* Folded paper corner */}
      <path 
        d="M52 22V28C52 29.1 52.9 30 54 30H60L52 22Z" 
        fill="url(#foldGradient)"
        className="filter drop-shadow-sm"
      />

      {/* Three premium horizontal invoice lines */}
      <rect x="38" y="32" width="12" height="2" rx="1" className="fill-emerald-600 dark:fill-emerald-400 transition-colors duration-300" />
      <rect x="38" y="38" width="16" height="2" rx="1" className="fill-emerald-600 dark:fill-emerald-400 transition-colors duration-300" />
      <rect x="38" y="44" width="10" height="2" rx="1" className="fill-emerald-600 dark:fill-emerald-400 transition-colors duration-300" />

      {/* Bold Dollar $ Symbol in bottom center */}
      <path 
        d="M41 50.5c0-.4.3-.8.8-.8h1.2v-.7c0-.2.2-.4.4-.4h.8c.2 0 .4.2.4.4v.7h1.2c.4 0 .8.4.8.8s-.4.8-.8.8h-2v1h1.5c1 0 1.8.8 1.8 1.8s-.8 1.8-1.8 1.8V57c0 .2-.2.4-.4.4h-.8c-.2 0-.4-.2-.4-.4v-.7H41c-.4 0-.8-.4-.8-.8s.4-.8.8-.8h2v-1H41.5c-1 0-1.8-.8-1.8-1.8zm3 1c.2 0 .3-.1.3-.3s-.1-.3-.3-.3h-1.2c-.2 0-.3.1-.3.3s.1.3.3.3H44zm.3 4c-.2 0-.3.1-.3.3s.1.3.3.3h1.2c.2 0 .3-.1.3-.3s-.1-.3-.3-.3h-1.2z" 
        className="fill-emerald-600 dark:fill-emerald-400 transition-colors duration-300"
      />
    </svg>
  );

  if (type === 'icon') {
    return <IconSVG sizeClass={className || 'w-10 h-10'} />;
  }

  if (type === 'app-icon') {
    return (
      <div className={`aspect-square rounded-[2rem] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-6 border border-slate-100 dark:border-slate-900 shadow-premium transition-all duration-300 hover:shadow-premium-hover ${className}`}>
        <IconSVG sizeClass="w-3/5 h-3/5" />
        <div className="mt-4 flex flex-col items-center select-none text-center">
          <span className="text-xl font-extrabold text-slate-800 dark:text-white tracking-tight transition-colors duration-300">
            Bill<span className="text-emerald-500 dark:text-emerald-400 font-extrabold">Qyro</span>
          </span>
          <span className="text-[6.5px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mt-1.5 flex items-center gap-1 leading-none">
            <span className="h-[1px] w-1.5 bg-emerald-500/50 dark:bg-emerald-400/30"></span>
            MODERN BILLING &amp; INVOICING
            <span className="h-[1px] w-1.5 bg-emerald-500/50 dark:bg-emerald-400/30"></span>
          </span>
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
          <span className={`text-xl font-black ${forceWhiteText ? 'text-white' : 'text-slate-900 dark:text-white'} tracking-tight transition-colors duration-300`}>
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
        
        {/* Tagline under brand name with elegant green horizontal lines */}
        <span className={`text-[6.5px] font-black uppercase ${forceWhiteText ? 'text-slate-300' : 'text-slate-400 dark:text-slate-500'} tracking-widest mt-1.5 flex items-center gap-1.5 leading-none`}>
          <span className="h-[1px] w-2 bg-emerald-500/50 dark:bg-emerald-400/30"></span>
          MODERN BILLING &amp; INVOICING PLATFORM
          <span className="h-[1px] w-2 bg-emerald-500/50 dark:bg-emerald-400/30"></span>
        </span>
      </div>
    </div>
  );
};

export default Logo;
