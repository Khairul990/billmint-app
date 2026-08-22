import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  type = 'button',
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-wide transition-all duration-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-accent/40 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]';
  
  const variants = {
    primary: 'bg-gradient-to-r from-theme-accent to-theme-accent-dark text-white shadow-premium hover:shadow-theme-glow hover:-translate-y-0.5 active:translate-y-0 border border-white/10',
    secondary: 'bg-theme-surface-elevated text-theme-primary border border-theme-border-soft hover:bg-theme-surface hover:border-theme-accent/30 shadow-sm',
    outline: 'bg-transparent text-theme-primary border border-theme-border-strong hover:border-theme-accent hover:text-theme-accent hover:bg-theme-accent/5',
    ghost: 'bg-transparent text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-elevated',
    danger: 'bg-theme-danger/10 text-theme-danger border border-theme-danger/25 hover:bg-theme-danger hover:text-white shadow-sm',
    success: 'bg-theme-success/10 text-theme-success border border-theme-success/25 hover:bg-theme-success hover:text-white shadow-sm',
  };

  const sizes = {
    sm: 'text-xs h-8 px-3 rounded-lg gap-1.5',
    md: 'text-sm h-10 px-4 rounded-xl gap-2',
    lg: 'text-sm h-12 px-6 rounded-xl gap-2.5 font-black',
    icon: 'h-9 w-9 p-0 rounded-xl',
    'icon-sm': 'h-7 w-7 p-0 rounded-lg',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        LeftIcon && <LeftIcon className={`${size === 'sm' || size === 'icon-sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0`} />
      )}
      
      {children}
      
      {!isLoading && RightIcon && (
        <RightIcon className={`${size === 'sm' || size === 'icon-sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0`} />
      )}
    </button>
  );
});

Button.displayName = 'Button';
