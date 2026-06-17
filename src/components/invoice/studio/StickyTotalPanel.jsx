import React, { useState } from 'react';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Calculator, ChevronUp, ChevronDown, FileText, Link, Loader2 } from 'lucide-react';
import SmartPaymentSection from './SmartPaymentSection';
import { ShimmerButton } from '../../magicui/shimmer-button';

const StickyTotalPanel = ({ onFinalize, isSaving }) => {
  const { state, dispatch } = useInvoice();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const SummaryContent = () => (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-wider text-theme-primary flex items-center gap-2">
          <Calculator className="w-4 h-4 text-theme-accent" /> Summary
        </h2>
        <button className="p-1.5 text-theme-muted hover:text-theme-accent transition-colors rounded-lg hover:bg-theme-accent/10" title="Advanced Options">
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-theme-muted">Subtotal</span>
          <span className="font-black text-theme-primary">₹{state.totals.subtotal.toLocaleString()}</span>
        </div>

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

        <div className="bg-gradient-to-br from-theme-accent to-pink-500 rounded-2xl p-4 shadow-glow my-2 relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-16 h-16 bg-white/20 rounded-full blur-xl pointer-events-none" />
          <p className="text-xs font-black uppercase tracking-widest text-white/80 mb-1 relative z-10">Grand Total</p>
          <p className="text-3xl font-black text-white tracking-tight relative z-10">₹{state.totals.grandTotal.toLocaleString()}</p>
        </div>
      </div>

      <div className="border-t border-theme-border-soft pt-4">
        <SmartPaymentSection />
      </div>

      <div className="flex flex-col gap-3 mt-2">
        <ShimmerButton
          onClick={onFinalize}
          disabled={isSaving}
          className="w-full h-12 shadow-glow"
          shimmerColor="#ffffff"
          background="var(--accent-gradient)"
        >
          <div className="flex items-center justify-center gap-2 text-white font-black text-sm w-full">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link className="w-4 h-4" />}
            Generate Live Link
          </div>
        </ShimmerButton>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Vertical Sidebar */}
      <div className="hidden lg:flex w-full bg-theme-surface flex-col p-6">
        <SummaryContent />
      </div>

      {/* Mobile Bottom Drawer Toggle */}
      <div className="lg:hidden">
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <AnimatePresence>
            {isDrawerOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsDrawerOpen(false)}
                  className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                />
                <motion.div 
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute bottom-0 left-0 right-0 bg-theme-surface rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-theme-border-soft p-6 z-50 max-h-[85vh] overflow-y-auto"
                >
                  <div className="w-12 h-1.5 bg-theme-border-soft rounded-full mx-auto mb-6" />
                  <SummaryContent />
                </motion.div>
              </>
            )}
          </AnimatePresence>

          {!isDrawerOpen && (
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              className="bg-theme-surface/95 backdrop-blur-xl border-t border-theme-border-soft p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] flex items-center justify-between safe-bottom"
              onClick={() => setIsDrawerOpen(true)}
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Grand Total</span>
                <span className="text-xl font-black text-theme-primary">₹{state.totals.grandTotal.toLocaleString()}</span>
              </div>
              <button className="flex items-center gap-2 bg-theme-accent text-white px-5 py-2.5 rounded-xl font-black shadow-lg shadow-theme-accent/30">
                Summary <ChevronUp className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default StickyTotalPanel;
