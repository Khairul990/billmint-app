import React from 'react';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { IndianRupee, Scissors, Receipt, Calculator, AlertCircle } from 'lucide-react';

const CompactSummaryStrip = () => {
  const { state, dispatch } = useInvoice();

  return (
    <div className="bg-theme-surface border border-theme-border-soft rounded-2xl shadow-sm flex flex-col sm:flex-row overflow-hidden divide-y sm:divide-y-0 sm:divide-x divide-theme-border-soft">
      
      {/* Subtotal */}
      <div className="flex-1 p-3 flex items-center justify-between sm:flex-col sm:items-start gap-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
          <Calculator className="w-3 h-3" /> Subtotal
        </span>
        <span className="text-sm font-black text-theme-primary">
          ₹{state.totals.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Global Discount Input */}
      <div className="flex-1 p-3 flex items-center justify-between sm:flex-col sm:items-start gap-1 bg-transparent focus-within:bg-theme-surface-hover transition-colors">
        <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
          <Scissors className="w-3 h-3" /> Discount
        </span>
        <div className="flex items-center gap-1 w-full max-w-[120px] sm:max-w-full">
          <span className="text-xs font-black text-theme-muted">₹</span>
          <input
            type="number"
            value={state.totals.discountAmount || ''}
            onChange={(e) => dispatch({ type: 'UPDATE_TOTALS', payload: { discountAmount: e.target.value } })}
            placeholder="0.00"
            className="w-full bg-transparent outline-none text-sm font-black text-theme-danger placeholder-theme-muted/50 text-right sm:text-left"
          />
        </div>
      </div>

      {/* Global Tax Input */}
      <div className="flex-1 p-3 flex items-center justify-between sm:flex-col sm:items-start gap-1 bg-transparent focus-within:bg-theme-surface-hover transition-colors">
        <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted flex items-center gap-1.5">
          <Receipt className="w-3 h-3" /> Tax
        </span>
        <div className="flex items-center gap-1 w-full max-w-[120px] sm:max-w-full">
          <input
            type="number"
            value={state.totals.taxPercentage || ''}
            onChange={(e) => dispatch({ type: 'UPDATE_TOTALS', payload: { taxPercentage: e.target.value } })}
            placeholder="0"
            className="w-full bg-transparent outline-none text-sm font-black text-theme-primary placeholder-theme-muted/50 text-right"
          />
          <span className="text-xs font-black text-theme-muted">%</span>
        </div>
      </div>

      {/* Grand Total */}
      <div className="flex-1 p-3 flex items-center justify-between sm:flex-col sm:items-start gap-1 bg-theme-accent/5">
        <span className="text-[10px] font-black uppercase tracking-wider text-theme-accent flex items-center gap-1.5">
          <IndianRupee className="w-3 h-3" /> Grand Total
        </span>
        <span className="text-lg font-black text-theme-accent">
          ₹{state.totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>

      {/* Due Amount */}
      <div className={`flex-[1.5] p-3 flex items-center justify-between sm:flex-col sm:items-start gap-1 ${state.totals.balanceDue > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
        <span className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${state.totals.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          <AlertCircle className="w-3 h-3" /> Balance Due
        </span>
        <span className={`text-lg font-black ${state.totals.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          ₹{state.totals.balanceDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
      
    </div>
  );
};

export default CompactSummaryStrip;
