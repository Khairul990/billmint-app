import React from 'react';

const cardVariants = {
  neutral: 'luxury-glass-card',
  elevated: 'luxury-glass-card ring-2 ring-theme-accent/20',
  financial: 'luxury-glass-card bg-[var(--bq-surface-financial)]',
  action: 'luxury-glass-card bg-[var(--bq-surface-action)]',
  insight: 'luxury-glass-card bg-[var(--bq-surface-insight)]',
  activity: 'luxury-glass-card bg-[var(--bq-surface-activity)]',
  warning: 'luxury-glass-card bg-[var(--bq-surface-warning)]',
  success: 'luxury-glass-card bg-[var(--bq-surface-success)]',
  danger: 'luxury-glass-card bg-[var(--bq-surface-danger)]',
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

