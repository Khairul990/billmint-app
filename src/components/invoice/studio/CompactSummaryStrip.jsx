import React, { useState } from 'react';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { IndianRupee, Scissors, Receipt, Calculator, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';

const CompactSummaryStrip = () => {
  const { state, dispatch } = useInvoice();
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {/* Main Strip */}
      <div className="bg-theme-surface border border-theme-border-soft rounded-2xl flex flex-col sm:flex-row overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-theme-border-soft transition-colors duration-200">
        
        {/* Subtotal */}
        <div className="flex-1 p-3 flex items-center justify-between sm:flex-col sm:items-start gap-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
            <Calculator className="w-3 h-3" /> Subtotal
          </span>
          <span className="text-sm font-black text-theme-primary tabular-nums">
            ₹{state.totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Grand Total */}
        <div className="flex-1 p-3 flex items-center justify-between sm:flex-col sm:items-start gap-1 bg-theme-accent/5">
          <span className="text-[10px] font-black uppercase tracking-wider text-theme-accent flex items-center gap-1.5">
            <IndianRupee className="w-3 h-3" /> Grand Total
          </span>
          <span className="text-lg font-black text-theme-accent tabular-nums">
            ₹{state.totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Due Amount */}
        <div className={`flex-[1.5] p-3 flex items-center justify-between sm:flex-col sm:items-start gap-1 ${state.totals.balanceDue > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
          <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${state.totals.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            <AlertCircle className="w-3 h-3" /> Balance Due
          </span>
          <span className={`text-lg font-black ${state.totals.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'} tabular-nums`}>
            ₹{state.totals.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex-1 p-3 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-theme-muted hover:text-theme-primary transition-colors cursor-pointer min-h-[44px]"
        >
          {showAdvanced ? (
            <>Hide Options <ChevronUp className="w-3.5 h-3.5" /></>
          ) : (
            <>Tax & Discount <ChevronDown className="w-3.5 h-3.5" /></>
          )}
        </button>
      </div>

      {/* Advanced Expandable Panel */}
      {showAdvanced && (
        <div className="bg-theme-surface border border-theme-border-soft rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-200">
          {/* Global Discount Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
              <Scissors className="w-3 h-3 text-rose-500" /> Discount (₹)
            </label>
            <div className="relative flex items-center border border-theme-border-soft rounded-xl bg-theme-app focus-within:border-theme-accent transition-colors p-2.5">
              <span className="text-xs font-black text-theme-muted mr-1">₹</span>
              <input
                type="number"
                value={state.totals.discountAmount || ''}
                onChange={(e) => dispatch({ type: 'UPDATE_TOTALS', payload: { discountAmount: parseFloat(e.target.value) || 0 } })}
                placeholder="0.00"
                className="w-full bg-transparent outline-none text-sm font-black text-rose-600 dark:text-rose-400 tabular-nums"
              />
            </div>
          </div>

          {/* Global Tax Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
              <Receipt className="w-3 h-3 text-theme-accent" /> Tax Percentage (%)
            </label>
            <div className="relative flex items-center border border-theme-border-soft rounded-xl bg-theme-app focus-within:border-theme-accent transition-colors p-2.5">
              <input
                type="number"
                value={state.totals.taxPercentage ?? ''}
                onChange={(e) => dispatch({ type: 'UPDATE_TOTALS', payload: { taxPercentage: parseFloat(e.target.value) || 0 } })}
                placeholder="0"
                className="w-full bg-transparent outline-none text-sm font-black text-theme-primary tabular-nums"
              />
              <span className="text-xs font-black text-theme-muted ml-1">%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompactSummaryStrip;
