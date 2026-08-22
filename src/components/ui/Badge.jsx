import React from 'react';

export const Badge = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  dot = false, 
  className = '', 
  ...props 
}) => {
  const variants = {
    primary: 'bg-theme-accent/10 text-theme-accent border-theme-accent/25',
    success: 'bg-theme-success/10 text-theme-success border-theme-success/25',
    warning: 'bg-theme-warning/10 text-theme-warning border-theme-warning/25',
    danger: 'bg-theme-danger/10 text-theme-danger border-theme-danger/25',
    neutral: 'bg-theme-surface-elevated text-theme-secondary border-theme-border-soft',
    outline: 'bg-transparent text-theme-secondary border-theme-border-strong',
    solid: 'bg-gradient-to-r from-theme-accent to-theme-accent-dark text-white border-transparent shadow-sm',
    paid: 'bg-theme-success/15 text-theme-success border-theme-success/30 font-black',
    partial: 'bg-theme-warning/15 text-theme-warning border-theme-warning/30 font-black',
    unpaid: 'bg-theme-danger/15 text-theme-danger border-theme-danger/30 font-black',
    overdue: 'bg-red-500/20 text-red-500 border-red-500/40 font-black animate-pulse',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[9px] gap-1',
    md: 'px-2.5 py-0.5 text-[10px] gap-1.5',
    lg: 'px-3 py-1 text-xs gap-2',
  };

  const dotColors = {
    primary: 'bg-theme-accent',
    success: 'bg-theme-success',
    warning: 'bg-theme-warning',
    danger: 'bg-theme-danger',
    neutral: 'bg-theme-muted',
    outline: 'bg-theme-secondary',
    solid: 'bg-white',
    paid: 'bg-theme-success',
    partial: 'bg-theme-warning',
    unpaid: 'bg-theme-danger',
    overdue: 'bg-red-500',
  };

  const style = variants[variant] || variants.primary;
  const dotColor = dotColors[variant] || 'bg-current';

  return (
    <span 
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider border select-none ${sizes[size] || sizes.md} ${style} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      {children}
    </span>
  );
};
