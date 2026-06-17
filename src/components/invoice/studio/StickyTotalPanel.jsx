import React from 'react';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { motion } from 'framer-motion';
import { Settings2, Calculator, Check, Loader2 } from 'lucide-react';
import SmartPaymentSection from './SmartPaymentSection';
import { ShimmerButton } from '../../magicui/shimmer-button';

const StickyTotalPanel = ({ onFinalize, isSaving }) => {
  const { state, dispatch } = useInvoice();

  return (
    <div className="w-full bg-theme-surface border border-theme-border-soft rounded-2xl shadow-sm flex flex-col lg:flex-row gap-6 p-4 md:p-6 mb-24">
      
      {/* Math Column */}
      <div className="flex-1 flex flex-col justify-center space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-wider text-theme-primary flex items-center gap-2">
            <Calculator className="w-4 h-4 text-theme-accent" /> Summary
          </h2>
          <button className="p-1.5 text-theme-muted hover:text-theme-accent transition-colors rounded-lg hover:bg-theme-accent/10" title="Advanced Options">
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Totals Column */}
      <div className="flex-1 flex flex-col gap-3 justify-center lg:border-x border-theme-border-soft lg:px-6 py-4 lg:py-0 border-y lg:border-y-0">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-theme-muted">Subtotal</span>
            <span className="font-black text-theme-primary">₹{state.totals.subtotal.toLocaleString()}</span>
          </div>

          {/* Tax Input */}
          <div className="flex items-center justify-between text-sm group">
            <span className="font-bold text-theme-muted flex items-center gap-1.5">
              Tax
              <div className="relative">
                <input 
                  type="number" 
                  value={state.totals.taxPercentage} 
                  onChange={(e) => dispatch({ type: 'UPDATE_TOTALS', payload: { taxPercentage: parseFloat(e.target.value) || 0 } })}
                  className="w-12 bg-theme-app border border-theme-border-soft rounded px-1.5 py-0.5 text-xs text-center font-bold focus:border-theme-accent outline-none transition-colors"
                />
                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-theme-muted pointer-events-none">%</span>
              </div>
            </span>
            <span className="font-black text-theme-primary">₹{state.totals.taxAmount.toLocaleString()}</span>
          </div>

          {/* Discount Input */}
          <div className="flex items-center justify-between text-sm group">
            <span className="font-bold text-theme-muted">Discount (₹)</span>
            <div className="relative flex items-center">
              <span className="text-theme-muted text-xs mr-1 font-bold">-₹</span>
              <input 
                type="number" 
                value={state.totals.discountAmount || ''} 
                onChange={(e) => dispatch({ type: 'UPDATE_TOTALS', payload: { discountAmount: parseFloat(e.target.value) || 0 } })}
                className="w-20 bg-theme-app border border-theme-border-soft rounded px-1.5 py-0.5 text-xs text-right font-bold focus:border-theme-accent outline-none transition-colors text-theme-success"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* Grand Total Big Display */}
        <div className="bg-[image:var(--accent-gradient)] rounded-2xl p-4 shadow-glow mb-6 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/20 rounded-full blur-xl pointer-events-none" />
          <p className="text-xs font-black uppercase tracking-widest text-white/80 mb-1 relative z-10">Grand Total</p>
          <p className="text-3xl font-black text-white tracking-tight relative z-10">₹{state.totals.grandTotal.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment Column */}
      <div className="flex-1 flex flex-col justify-center">
        <SmartPaymentSection />
      </div>

    </div>
  );
};

export default StickyTotalPanel;
