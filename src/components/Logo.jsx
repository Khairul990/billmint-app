import React from 'react';
import { motion } from 'framer-motion';

/**
 * High-fidelity Logo Component for BillQyro
 * Uses the official uploaded golden Q brand icon.
 * 
 * @param {string} type - 'icon' | 'horizontal' | 'app-icon'
 * @param {string} className - additional sizing / layout classes
 */
const Logo = ({ type = 'horizontal', className = '', forceWhiteText = false }) => {
  // Main brand icon from public folder
  const BRAND_ICON_URL = '/brand/billqyro-icon.png';

  const IconImg = ({ sizeClass = 'w-10 h-10' }) => (
    <motion.div 
      className={`${sizeClass} shrink-0 relative rounded-full overflow-hidden shadow-sm dark:shadow-[0_0_15px_rgba(255,255,255,0.05)] bg-white/5`}
      initial={{ opacity: 0, scale: 0.8, y: 5 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.05 }}
    >
      <img src={BRAND_ICON_URL} alt="BillQyro Brand Icon" className="w-full h-full object-contain" />
    </motion.div>
  );

  if (type === 'icon') {
    return <IconImg sizeClass={className || 'w-10 h-10'} />;
  }

  if (type === 'app-icon') {
    return (
      <div className={`aspect-square rounded-[2rem] bg-theme-card dark:bg-theme-app flex flex-col items-center justify-center p-6 border border-theme-border-soft shadow-premium transition-all duration-300 hover:shadow-premium-hover ${className}`}>
        <IconImg sizeClass="w-3/5 h-3/5" />
        <div className="mt-4 flex flex-col items-center select-none text-center">
          <span className="text-xl font-extrabold text-theme-primary tracking-tight transition-colors duration-300">
            Bill<span className="text-theme-accent font-extrabold">Qyro</span>
          </span>
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
    >
      <IconImg sizeClass="w-10 h-10" />
      <div className="flex flex-col select-none">
        <div className="flex items-baseline leading-none">
          {/* Bill text */}
          <motion.span 
            className={`text-xl font-black ${forceWhiteText ? 'text-white' : 'text-theme-primary'} tracking-tight`}
            variants={{
              hidden: { opacity: 0, x: -5 },
              visible: { opacity: 1, x: 0, transition: { delay: 0.2, duration: 0.4 } }
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
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
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
