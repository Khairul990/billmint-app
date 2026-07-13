import React from 'react';

export const Card = ({ className = '', children, ...props }) => (
  <div className={`bg-theme-surface border border-theme-border-soft rounded-3xl backdrop-blur-md shadow-glass overflow-hidden ${className}`} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className = '', children, ...props }) => (
  <div className={`p-6 pb-4 border-b border-theme-border-soft ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, ...props }) => (
  <h3 className={`text-lg font-black text-theme-primary ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className = '', children, ...props }) => (
  <p className={`text-xs text-theme-secondary mt-1 ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className = '', children, ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = '', children, ...props }) => (
  <div className={`p-6 pt-4 border-t border-theme-border-soft flex items-center ${className}`} {...props}>
    {children}
  </div>
);
