import React from 'react';

export default function ClassicLoader({ size = 'md', text }) {
  const sizes = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`relative ${sizes[size] || sizes.md} flex items-center justify-center`}>
        {/* Outer glowing pulse ring */}
        <div className="absolute inset-0 rounded-full border-2 border-theme-accent/20 animate-ping opacity-75"></div>
        
        {/* Inner spinning gradient ring */}
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-theme-accent border-r-theme-accent/50 animate-spin shadow-[0_0_10px_var(--theme-accent)]"></div>
        
        {/* Center dot */}
        <div className="w-1.5 h-1.5 bg-theme-accent rounded-full animate-pulse"></div>
      </div>
      {text && (
        <p className="text-xs font-bold text-theme-muted uppercase tracking-widest animate-pulse-soft">
          {text}
        </p>
      )}
    </div>
  );
}