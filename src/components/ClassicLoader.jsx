import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles } from 'lucide-react';

export default function ClassicLoader({ size = 'md', text = 'Loading BillQyro Workspace...' }) {
  const isLarge = size === 'lg';
  const isSmall = size === 'sm';

  return (
    <div className="flex flex-col items-center justify-center gap-5 p-4 select-none">
      <div className="relative flex items-center justify-center">
        {/* Ambient Neon Aura */}
        <div className="absolute w-24 h-24 rounded-full bg-emerald-500/20 blur-2xl animate-pulse pointer-events-none" />
        <div className="absolute w-16 h-16 rounded-full bg-teal-400/20 blur-xl animate-pulse pointer-events-none" />

        {/* Outer Orbital Ring with Cyan Glow */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          className={`rounded-full border border-dashed border-emerald-500/40 ${
            isLarge ? 'w-20 h-20' : isSmall ? 'w-10 h-10' : 'w-14 h-14'
          }`}
        />

        {/* Counter-rotating Inner Gradient Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
          className={`absolute rounded-full border-2 border-transparent border-t-emerald-400 border-r-teal-300 shadow-[0_0_15px_rgba(16,185,129,0.5)] ${
            isLarge ? 'w-16 h-16' : isSmall ? 'w-8 h-8' : 'w-11 h-11'
          }`}
        />

        {/* Central Core Logo Emblem */}
        <div className={`relative flex items-center justify-center rounded-2xl bg-gradient-to-tr from-[#09151e] to-[#0d2229] border border-emerald-500/30 shadow-inner ${
          isLarge ? 'w-10 h-10' : isSmall ? 'w-5 h-5' : 'w-7 h-7'
        }`}>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-ping" />
          <div className="absolute w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#fff]" />
        </div>
      </div>

      {/* Futuristic Status Text & Badge */}
      <div className="flex flex-col items-center gap-1.5 text-center">
        <p className="text-xs font-black text-theme-primary tracking-wide">
          {text}
        </p>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
          <ShieldCheck className="w-3 h-3" />
          <span>256-Bit Encrypted Ledger</span>
        </span>
      </div>
    </div>
  );
}