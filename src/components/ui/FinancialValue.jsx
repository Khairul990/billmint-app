import React from 'react';

/**
 * Semantic intent styles for financial metrics.
 * Uses BillQyro signature brand emerald and theme-aware colors.
 */
const INTENT_STYLES = {
  neutral: 'text-theme-primary',
  collection: 'text-theme-accent',
  sales: 'text-theme-accent',
  oldDue: 'text-amber-600 dark:text-amber-400',
  currentBill: 'text-theme-primary',
  totalPayable: 'text-theme-primary font-extrabold',
  paid: 'text-theme-accent',
  balanceDue: 'text-rose-600 dark:text-rose-400 font-extrabold',
  expense: 'text-rose-600 dark:text-rose-400',
  money: 'text-theme-accent',
};

const SIZE_STYLES = {
  xs: { number: 'text-sm', currency: 'text-xs', label: 'text-[10px]' },
  sm: { number: 'text-base', currency: 'text-xs', label: 'text-xs' },
  md: { number: 'text-xl md:text-2xl', currency: 'text-sm md:text-base', label: 'text-xs' },
  lg: { number: 'text-2xl md:text-3xl', currency: 'text-base md:text-lg', label: 'text-xs md:text-sm' },
  xl: { number: 'text-3xl md:text-4xl', currency: 'text-lg md:text-xl', label: 'text-sm' },
};

/**
 * Formats numbers into Indian/Standard locale string with proper fallback.
 */
const formatAmount = (val) => {
  const num = Number(val);
  if (isNaN(num)) return val ?? '0.00';
  return num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Signature BillQyro Financial Value Component
 * Renders currency and tabular digits with strong visual hierarchy over secondary labels.
 */
export const FinancialValue = ({
  value,
  currency = '₹',
  label = null,
  intent = 'neutral',
  size = 'md',
  direction = 'vertical', // 'vertical' (label above/below) | 'horizontal'
  labelPosition = 'top', // 'top' | 'bottom'
  subtext = null,
  className = '',
  numberClassName = '',
  ...props
}) => {
  const sizeConfig = SIZE_STYLES[size] || SIZE_STYLES.md;
  const intentColor = INTENT_STYLES[intent] || INTENT_STYLES.neutral;
  const formattedVal = typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)))
    ? formatAmount(value)
    : value;

  const labelEl = label && (
    <span className={`font-semibold uppercase tracking-wider text-theme-muted select-none ${sizeConfig.label}`}>
      {label}
    </span>
  );

  const valueEl = (
    <div className={`inline-flex items-baseline gap-1 bq-financial-number ${intentColor} ${numberClassName}`}>
      {currency && (
        <span className={`font-bold opacity-75 select-none ${sizeConfig.currency}`}>
          {currency}
        </span>
      )}
      <span className={`font-extrabold tracking-tight ${sizeConfig.number}`}>
        {formattedVal}
      </span>
    </div>
  );

  if (direction === 'horizontal') {
    return (
      <div className={`inline-flex items-center justify-between gap-3 ${className}`} {...props}>
        {labelEl}
        <div className="flex flex-col items-end">
          {valueEl}
          {subtext && <span className="text-[10px] text-theme-muted mt-0.5">{subtext}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className={`inline-flex flex-col ${className}`} {...props}>
      {labelPosition === 'top' && labelEl}
      {valueEl}
      {labelPosition === 'bottom' && labelEl}
      {subtext && <span className="text-[11px] text-theme-muted mt-0.5">{subtext}</span>}
    </div>
  );
};
