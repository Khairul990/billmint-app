import React from 'react';

export const Button = React.forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  isLoading = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-theme-accent to-theme-accent-dark text-white shadow-premium hover:shadow-theme-glow hover:-translate-y-0.5 active:translate-y-0 border border-theme-accent-light/30',
    secondary: 'bg-theme-surface-elevated text-theme-primary border border-theme-border-soft hover:bg-theme-surface-hover hover:border-theme-accent/30',
    outline: 'bg-transparent text-theme-primary border-2 border-theme-border-strong hover:border-theme-accent hover:text-theme-accent hover:bg-theme-accent/5',
    ghost: 'bg-transparent text-theme-secondary hover:text-theme-primary hover:bg-white/5',
    danger: 'bg-theme-danger/10 text-theme-danger border border-theme-danger/20 hover:bg-theme-danger hover:text-white shadow-sm hover:shadow-[0_0_15px_var(--status-danger)]',
  };

  const sizes = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-5 py-2.5 rounded-xl gap-2',
    lg: 'text-base px-6 py-3 rounded-xl gap-2.5',
    icon: 'p-2 rounded-lg',
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        LeftIcon && <LeftIcon className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0`} />
      )}
      
      {children}
      
      {!isLoading && RightIcon && (
        <RightIcon className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} shrink-0`} />
      )}
    </button>
  );
});

Button.displayName = 'Button';
