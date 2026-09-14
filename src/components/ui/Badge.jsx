import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  AlertTriangle, 
  FileEdit, 
  Ban 
} from 'lucide-react';

export const Badge = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  dot = false, 
  icon: Icon = null,
  shape = 'pill', // 'pill' | 'rounded' | 'square'
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
    // Signature Financial Statuses
    paid: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-black',
    partial: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 font-black',
    unpaid: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 font-black',
    overdue: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40 font-black animate-pulse',
    pending: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30 font-black',
    draft: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30 font-medium',
    void: 'bg-gray-500/20 text-gray-500 border-gray-500/35 line-through font-semibold',
    cancelled: 'bg-gray-500/20 text-gray-500 border-gray-500/35 font-semibold',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[9px] gap-1',
    md: 'px-2.5 py-0.5 text-[10px] gap-1.5',
    lg: 'px-3 py-1 text-xs gap-2',
  };

  const shapes = {
    pill: 'rounded-full',
    rounded: 'rounded-lg',
    square: 'rounded-sm',
  };

  const dotColors = {
    primary: 'bg-theme-accent',
    success: 'bg-theme-success',
    warning: 'bg-theme-warning',
    danger: 'bg-theme-danger',
    neutral: 'bg-theme-muted',
    outline: 'bg-theme-secondary',
    solid: 'bg-white',
    paid: 'bg-emerald-500',
    partial: 'bg-amber-500',
    unpaid: 'bg-rose-500',
    overdue: 'bg-red-500',
    pending: 'bg-sky-500',
    draft: 'bg-slate-400',
    void: 'bg-gray-400',
    cancelled: 'bg-gray-400',
  };

  const style = variants[variant] || variants.primary;
  const dotColor = dotColors[variant] || 'bg-current';
  const shapeStyle = shapes[shape] || shapes.pill;

  return (
    <span 
      className={`inline-flex items-center ${shapeStyle} font-bold uppercase tracking-wider border select-none transition-colors ${sizes[size] || sizes.md} ${style} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} />}
      {Icon && <Icon className="w-3 h-3 shrink-0" />}
      {children}
    </span>
  );
};

const STATUS_CONFIGS = {
  paid: { label: 'Paid', variant: 'paid', icon: CheckCircle2, shape: 'pill' },
  partial: { label: 'Partial', variant: 'partial', icon: Clock, shape: 'pill' },
  unpaid: { label: 'Unpaid', variant: 'unpaid', icon: AlertCircle, shape: 'pill' },
  overdue: { label: 'Overdue', variant: 'overdue', icon: AlertTriangle, shape: 'rounded' },
  pending: { label: 'Pending', variant: 'pending', icon: Clock, shape: 'pill' },
  draft: { label: 'Draft', variant: 'draft', icon: FileEdit, shape: 'rounded' },
  void: { label: 'Void', variant: 'void', icon: Ban, shape: 'square' },
  cancelled: { label: 'Cancelled', variant: 'cancelled', icon: Ban, shape: 'square' },
};

/**
 * Signature BillQyro Status Badge
 * Uses multi-channel indicators (icon, label, shape, color) for instant clarity and accessibility.
 */
export const StatusBadge = ({ 
  status, 
  size = 'md', 
  showIcon = true,
  customLabel = null,
  className = '',
  ...props 
}) => {
  const normStatus = String(status || '').toLowerCase().trim();
  const config = STATUS_CONFIGS[normStatus] || { 
    label: status || 'Unknown', 
    variant: 'neutral', 
    icon: null, 
    shape: 'pill' 
  };

  return (
    <Badge
      variant={config.variant}
      size={size}
      icon={showIcon ? config.icon : null}
      shape={config.shape}
      className={className}
      {...props}
    >
      {customLabel || config.label}
    </Badge>
  );
};

