import React from 'react';
import { motion } from 'framer-motion';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { Loader2, LayoutPanelLeft, Maximize, PanelRightInactive, Cloud, CloudOff, Save, Check, FileText, Link, ArrowLeft, Eye } from 'lucide-react';
import { ShimmerButton } from '../../magicui/shimmer-button';

const StudioHeader = ({ showPreviewModal, setShowPreviewModal, lastSaved, saveStatus, onSaveDraft, onGenerateLiveLink, isSaving, onDownloadPDF, onBack }) => {
  const { state, dispatch } = useInvoice();

  return (
    <div className="sticky top-0 z-50 bg-theme-app/90 backdrop-blur-xl border-b border-theme-border-soft px-4 md:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
      
      {/* Left: Branding & Status */}
      <div className="flex items-center gap-2 sm:gap-4 w-full md:w-auto">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-theme-border-soft rounded-full transition-colors group flex items-center justify-center shrink-0"
          title="Back to Invoices"
        >
          <ArrowLeft className="w-5 h-5 text-theme-muted group-hover:text-theme-primary transition-colors" />
        </button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-theme-primary tracking-tight">Smart Studio</h1>
            <div className="flex items-center bg-theme-surface border border-theme-border-soft rounded px-2 py-0.5 ml-2 shadow-sm focus-within:border-theme-accent">
              <span className="text-[10px] font-black uppercase text-theme-muted tracking-wider mr-1">Inv #</span>
              {state.generatingNumber ? (
                <Loader2 className="w-3 h-3 animate-spin text-theme-accent" />
              ) : (
                <input 
                  type="text" 
                  value={state.invoiceNumber}
                  onChange={(e) => dispatch({ type: 'SET_INVOICE_NUMBER', payload: e.target.value.toUpperCase() })}
                  className="bg-transparent border-none outline-none text-theme-primary font-bold text-xs w-20 focus:ring-0 p-0 uppercase"
                  placeholder="INV-001"
                />
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center text-[10px] font-bold uppercase tracking-wider transition-colors duration-300">
              {saveStatus === 'saving' && <span className="text-amber-400 flex items-center"><Loader2 className="w-3 h-3 mr-1 animate-spin" /> Saving...</span>}
              {saveStatus === 'unsaved' && <span className="text-rose-400 flex items-center"><CloudOff className="w-3 h-3 mr-1" /> Unsaved Changes</span>}
              {saveStatus === 'saved' && <span className="text-emerald-400 flex items-center"><Cloud className="w-3 h-3 mr-1" /> Saved just now</span>}
              {saveStatus === '' && <span className="text-theme-muted flex items-center"><Cloud className="w-3 h-3 mr-1" /> All saved</span>}
            </span>
            <span className="w-1 h-1 rounded-full bg-theme-border-soft"></span>
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">
              {state.settings.paymentStatus === 'Draft' ? 'Draft Mode' : 'Live Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Progress Bar */}
      <div className="hidden lg:flex items-center justify-center gap-4 flex-1 opacity-80 hover:opacity-100 transition-opacity">
        <div className={`flex items-center gap-1.5 ${!!state.customer.name ? 'text-theme-success' : 'text-theme-muted'}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${!!state.customer.name ? 'bg-theme-success/20 text-theme-success' : 'bg-theme-surface border border-theme-border-soft'}`}>
            {!!state.customer.name ? <Check className="w-2.5 h-2.5" /> : 1}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Customer</span>
        </div>
        
        <div className="w-8 h-[1px] bg-theme-border-soft"></div>
        
        <div className={`flex items-center gap-1.5 ${state.items.some(i => (i.description || i.itemService) && i.rate > 0) ? 'text-theme-success' : 'text-theme-muted'}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${state.items.some(i => (i.description || i.itemService) && i.rate > 0) ? 'bg-theme-success/20 text-theme-success' : 'bg-theme-surface border border-theme-border-soft'}`}>
            {state.items.some(i => (i.description || i.itemService) && i.rate > 0) ? <Check className="w-2.5 h-2.5" /> : 2}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Items</span>
        </div>

        <div className="w-8 h-[1px] bg-theme-border-soft"></div>

        <div className={`flex items-center gap-1.5 ${state.totals.grandTotal > 0 ? 'text-theme-success' : 'text-theme-muted'}`}>
          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black ${state.totals.grandTotal > 0 ? 'bg-theme-success/20 text-theme-success' : 'bg-theme-surface border border-theme-border-soft'}`}>
            {state.totals.grandTotal > 0 ? <Check className="w-2.5 h-2.5" /> : 3}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider">Payment</span>
        </div>
      </div>

      {/* Right: View Toggles & Actions */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        
        {/* Preview Button */}
        <button 
          onClick={() => setShowPreviewModal(true)}
          className="hidden sm:flex items-center justify-center gap-1.5 px-4 py-1.5 bg-theme-surface hover:bg-theme-border-soft text-theme-primary text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm border border-theme-border-soft mr-2"
        >
          <Eye className="w-4 h-4 text-theme-accent" /> Live Preview
        </button>

        {/* Actions */}
        <button 
          onClick={onSaveDraft}
          className="hidden sm:flex items-center justify-center gap-1.5 px-3 py-1.5 bg-theme-surface hover:bg-theme-border-soft text-theme-primary text-xs font-bold rounded-xl transition-all shadow-sm border border-theme-border-soft"
        >
          <Save className="w-3.5 h-3.5 text-theme-muted" /> Save Draft
        </button>

        <button 
          onClick={onDownloadPDF}
          className="hidden md:flex items-center justify-center gap-1.5 px-3 py-1.5 bg-theme-surface hover:bg-theme-border-soft text-theme-primary text-xs font-bold rounded-xl transition-all shadow-sm border border-theme-border-soft"
        >
          <FileText className="w-3.5 h-3.5 text-rose-500" /> Generate PDF
        </button>

        <ShimmerButton
          onClick={onGenerateLiveLink}
          disabled={isSaving}
          className="h-9 px-4 shadow-glow"
          shimmerColor="#ffffff"
          background="var(--accent-gradient)"
        >
          <div className="flex items-center gap-2 text-white font-black text-xs">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Link className="w-3.5 h-3.5" />}
            Generate Live Link
          </div>
        </ShimmerButton>

      </div>
    </div>
  );
};

export default StudioHeader;
