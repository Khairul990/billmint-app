import React from 'react';

export const Switch = ({ checked, onChange, disabled, ...props }) => {
  return (
    <button 
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-11 h-6 shrink-0 rounded-full transition-colors relative focus:outline-none focus:ring-2 focus:ring-theme-accent focus:ring-offset-2 focus:ring-offset-theme-main ${
        checked ? 'bg-theme-accent' : 'bg-theme-surface-hover border border-theme-border-soft'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      {...props}
    >
      <div 
        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} 
      />
    </button>
  );
};
