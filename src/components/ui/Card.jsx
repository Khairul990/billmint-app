import React from 'react';

const cardVariants = {
  neutral: 'bg-theme-card border-theme-border-soft shadow-premium-sm',
  elevated: 'bg-theme-surface-elevated border-theme-border-soft shadow-premium',
  financial: 'bg-[var(--bq-surface-financial)] border-[color-mix(in_srgb,var(--bq-accent)_24%,var(--border-soft))] shadow-premium',
  action: 'bg-[var(--bq-surface-action)] border-[color-mix(in_srgb,var(--bq-accent)_20%,var(--border-soft))] shadow-premium-sm',
  insight: 'bg-[var(--bq-surface-insight)] border-blue-500/20 shadow-premium-sm',
  activity: 'bg-[var(--bq-surface-activity)] border-theme-border-soft shadow-premium-sm',
  warning: 'bg-[var(--bq-surface-warning)] border-amber-500/25 shadow-premium-sm',
  success: 'bg-[var(--bq-surface-success)] border-theme-tint-border shadow-premium-sm',
  danger: 'bg-[var(--bq-surface-danger)] border-rose-500/25 shadow-premium-sm',
};

export const Card = ({ 
  variant = 'neutral', 
  className = '', 
  hover = false, 
  children, 
  ...props 
}) => {
  const variantStyles = cardVariants[variant] || cardVariants.neutral;

  return (
    <div 
      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${variantStyles} ${
        hover ? 'hover:shadow-premium hover:border-theme-accent/30 hover:-translate-y-0.5' : ''
      } ${className}`} 
      {...props}
    >
      {children}
    </div>
  );
};

export const SignatureSurface = Card;

export const CardHeader = ({ className = '', children, ...props }) => (
  <div className={`p-5 pb-3 border-b border-theme-border-soft/60 flex flex-col gap-1 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, ...props }) => (
  <h3 className={`text-base font-bold font-display text-theme-primary tracking-tight leading-snug ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ className = '', children, ...props }) => (
  <p className={`text-xs text-theme-muted font-sans leading-relaxed ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className = '', children, ...props }) => (
  <div className={`p-5 font-sans ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ className = '', children, ...props }) => (
  <div className={`p-5 pt-3 border-t border-theme-border-soft/60 flex items-center justify-between gap-3 ${className}`} {...props}>
    {children}
  </div>
);

