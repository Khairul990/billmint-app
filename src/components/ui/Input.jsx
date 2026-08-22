import React from 'react';
import { Search, ChevronDown } from 'lucide-react';

const baseStyles = 'w-full bg-theme-surface border border-theme-border-soft text-theme-primary text-sm rounded-xl focus:outline-none focus:border-theme-accent focus:ring-2 focus:ring-theme-accent/25 transition-all duration-200 placeholder:text-theme-muted/60 disabled:opacity-50 disabled:cursor-not-allowed';

export const Input = React.forwardRef(({ 
  className = '', 
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  isSearch = false,
  error = false,
  size = 'md',
  ...props 
}, ref) => {
  if (isSearch) {
    LeftIcon = Search;
  }

  const sizeStyles = size === 'sm' ? 'h-8 text-xs py-1.5' : size === 'lg' ? 'h-12 text-base py-3' : 'h-10 py-2.5';
  const errorStyles = error ? 'border-theme-danger/60 focus:border-theme-danger focus:ring-theme-danger/25' : '';

  return (
    <div className="relative group w-full">
      {LeftIcon && (
        <LeftIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-theme-accent transition-colors pointer-events-none" />
      )}
      <input
        ref={ref}
        className={`${baseStyles} ${sizeStyles} ${errorStyles} ${LeftIcon ? 'pl-9' : 'pl-3.5'} ${RightIcon ? 'pr-9' : 'pr-3.5'} ${className}`}
        {...props}
      />
      {RightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none flex items-center justify-center">
          {typeof RightIcon === 'function' ? <RightIcon className="w-4 h-4" /> : RightIcon}
        </div>
      )}
    </div>
  );
});
Input.displayName = 'Input';

export const Select = React.forwardRef(({ className = '', children, error = false, size = 'md', ...props }, ref) => {
  const sizeStyles = size === 'sm' ? 'h-8 text-xs py-1.5' : size === 'lg' ? 'h-12 text-base py-3' : 'h-10 py-2.5';
  const errorStyles = error ? 'border-theme-danger/60 focus:border-theme-danger focus:ring-theme-danger/25' : '';

  return (
    <div className="relative w-full">
      <select
        ref={ref}
        className={`${baseStyles} ${sizeStyles} ${errorStyles} px-3.5 pr-8 appearance-none cursor-pointer ${className}`}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none" />
    </div>
  );
});
Select.displayName = 'Select';

export const Textarea = React.forwardRef(({ className = '', error = false, ...props }, ref) => {
  const errorStyles = error ? 'border-theme-danger/60 focus:border-theme-danger focus:ring-theme-danger/25' : '';
  return (
    <textarea
      ref={ref}
      className={`${baseStyles} p-3.5 min-h-[96px] resize-y leading-relaxed ${errorStyles} ${className}`}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

export const Label = ({ children, className = '', required, error }) => (
  <label className={`block text-[11px] font-bold text-theme-secondary uppercase tracking-wider mb-1.5 select-none ${error ? 'text-theme-danger' : ''} ${className}`}>
    {children}
    {required && <span className="text-theme-danger ml-0.5">*</span>}
  </label>
);

export const HelperText = ({ children, error, className = '' }) => (
  <p className={`text-xs mt-1 leading-normal ${error ? 'text-theme-danger font-medium' : 'text-theme-muted'} ${className}`}>
    {children}
  </p>
);
