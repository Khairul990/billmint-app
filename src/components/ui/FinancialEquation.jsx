import React from 'react';
import { Plus, Equal, Minus } from 'lucide-react';
import { FinancialValue } from './FinancialValue';

/**
 * BillQyro Signature Financial Equation Component
 * Visual relationship:
 * [Old Due] + [Current Bill] = [Total Payable] - [Paid] = [Balance Due]
 * 
 * Works responsively:
 * - Desktop: horizontal flowing equation with math operators
 * - Mobile: structured breakdown cards with clear visual operators
 */
export const FinancialEquation = ({
  oldDue = 0,
  currentBill = 0,
  totalPayable = null,
  paid = 0,
  balanceDue = null,
  currency = '₹',
  size = 'md',
  className = '',
  ...props
}) => {
  // Pure visual fallback calculations if not explicitly passed
  const calcTotalPayable = totalPayable !== null ? totalPayable : (Number(oldDue || 0) + Number(currentBill || 0));
  const calcBalanceDue = balanceDue !== null ? balanceDue : (Number(calcTotalPayable || 0) - Number(paid || 0));

  return (
    <div 
      className={`p-4 md:p-5 rounded-2xl bq-surface-financial border border-theme-tint-border ${className}`}
      {...props}
    >
      {/* Desktop / Tablet Flow */}
      <div className="hidden lg:flex items-center justify-between gap-3 overflow-x-auto py-1">
        {/* Step 1: Old Due */}
        <div className="flex-1 min-w-[110px]">
          <FinancialValue 
            label="Old Due" 
            value={oldDue} 
            currency={currency} 
            intent="oldDue" 
            size={size} 
          />
        </div>

        <Plus className="w-4 h-4 text-theme-muted shrink-0 mx-1" />

        {/* Step 2: Current Bill */}
        <div className="flex-1 min-w-[110px]">
          <FinancialValue 
            label="Current Bill" 
            value={currentBill} 
            currency={currency} 
            intent="currentBill" 
            size={size} 
          />
        </div>

        <Equal className="w-4 h-4 text-theme-muted shrink-0 mx-1" />

        {/* Step 3: Total Payable */}
        <div className="flex-1 min-w-[120px] p-2.5 rounded-xl bg-theme-surface/70 border border-theme-border-soft">
          <FinancialValue 
            label="Total Payable" 
            value={calcTotalPayable} 
            currency={currency} 
            intent="totalPayable" 
            size={size} 
          />
        </div>

        <Minus className="w-4 h-4 text-theme-muted shrink-0 mx-1" />

        {/* Step 4: Paid Amount */}
        <div className="flex-1 min-w-[110px]">
          <FinancialValue 
            label="Paid" 
            value={paid} 
            currency={currency} 
            intent="paid" 
            size={size} 
          />
        </div>

        <Equal className="w-4 h-4 text-theme-muted shrink-0 mx-1" />

        {/* Step 5: Balance Due (Final Target) */}
        <div className="flex-1 min-w-[130px] p-2.5 rounded-xl bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/30">
          <FinancialValue 
            label="Balance Due" 
            value={calcBalanceDue} 
            currency={currency} 
            intent="balanceDue" 
            size={size} 
          />
        </div>
      </div>

      {/* Mobile Stacked Flow */}
      <div className="flex flex-col gap-2.5 lg:hidden">
        <div className="flex items-center justify-between pb-2 border-b border-theme-border-soft/60">
          <FinancialValue label="Old Due" value={oldDue} currency={currency} intent="oldDue" size="sm" />
          <span className="text-xs text-theme-muted font-bold">+</span>
          <FinancialValue label="Current Bill" value={currentBill} currency={currency} intent="currentBill" size="sm" />
        </div>

        <div className="flex items-center justify-between py-1.5 px-3 rounded-xl bg-theme-surface/80 border border-theme-border-soft">
          <span className="text-xs font-bold text-theme-primary uppercase tracking-wider">Total Payable</span>
          <FinancialValue value={calcTotalPayable} currency={currency} intent="totalPayable" size="sm" />
        </div>

        <div className="flex items-center justify-between py-1 px-3">
          <span className="text-xs text-theme-muted font-semibold uppercase tracking-wider">Less: Paid</span>
          <FinancialValue value={paid} currency={currency} intent="paid" size="sm" />
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/30">
          <span className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">Balance Due</span>
          <FinancialValue value={calcBalanceDue} currency={currency} intent="balanceDue" size="md" />
        </div>
      </div>
    </div>
  );
};
