import React from 'react';
import { Search } from 'lucide-react';

const baseStyles = 'w-full bg-theme-surface border border-theme-border-soft text-theme-primary text-sm rounded-xl focus:outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent/30 transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed';

export const Input = React.forwardRef(({ 
  className = '', 
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  isSearch = false,
  ...props 
}, ref) => {
  
  if (isSearch) {
    LeftIcon = Search;
  }

  return (
    <div className="relative group">
      {LeftIcon && (
        <LeftIcon className="w-4 h-4 absolute left-3 top-3 text-theme-secondary group-focus-within:text-theme-accent transition-colors" />
      )}
      <input
        ref={ref}
        className={`${baseStyles} py-2.5 ${LeftIcon ? 'pl-9' : 'pl-4'} ${RightIcon ? 'pr-9' : 'pr-4'} ${className}`}
        {...props}
      />
      {RightIcon && (
        <RightIcon className="w-4 h-4 absolute right-3 top-3 text-theme-secondary" />
      )}
    </div>
  );
});
Input.displayName = 'Input';

export const Select = React.forwardRef(({ className = '', children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={`${baseStyles} py-2.5 px-4 appearance-none ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = 'Select';

export const Textarea = React.forwardRef(({ className = '', ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`${baseStyles} py-3 px-4 min-h-[100px] resize-y ${className}`}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';

// Simple utility wrapper for labels
export const Label = ({ children, className = '', required }) => (
  <label className={`block text-[10px] font-bold text-theme-secondary uppercase tracking-wider mb-2 ${className}`}>
    {children}
    {required && <span className="text-theme-danger ml-1">*</span>}
  </label>
);
