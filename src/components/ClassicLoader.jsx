import React from 'react';

export default function ClassicLoader({ size = 'md', text }) {
  const sizes = {
    sm: 'h-6 w-6 border-2',
    md: 'h-10 w-10 border-[3px]',
    lg: 'h-14 w-14 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className={`${sizes[size] || sizes.md} border-theme-border-strong rounded-full border-t-theme-accent animate-spin`} />
      {text && (
        <p className="text-xs font-semibold text-theme-muted animate-pulse-soft">{text}</p>
      )}
    </div>
  );
}