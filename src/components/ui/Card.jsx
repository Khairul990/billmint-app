import React from 'react';

export const Card = ({ className = '', hover = false, children, ...props }) => (
  <div 
    className={`bg-theme-card border border-theme-border-soft rounded-2xl shadow-premium-sm overflow-hidden transition-all duration-200 ${
      hover ? 'hover:shadow-premium hover:border-theme-accent/30 hover:-translate-y-0.5' : ''
    } ${className}`} 
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ className = '', children, ...props }) => (
  <div className={`p-5 pb-3 border-b border-theme-border-soft/60 flex flex-col gap-1 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, ...props }) => (
  <h3 className={`text-base font-black text-theme-primary tracking-tight leading-snug ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className = '', children, ...props }) => (
  <p className={`text-xs text-theme-muted leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className = '', children, ...props }) => (
  <div className={`p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = '', children, ...props }) => (
  <div className={`p-5 pt-3 border-t border-theme-border-soft/60 flex items-center justify-between gap-3 ${className}`} {...props}>
    {children}
  </div>
);
