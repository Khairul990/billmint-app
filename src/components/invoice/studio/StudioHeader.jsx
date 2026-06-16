import React from 'react';
import { motion } from 'framer-motion';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { Loader2, LayoutPanelLeft, Maximize, PanelRightInactive, Cloud, CloudOff, Save, Check } from 'lucide-react';
import { ShimmerButton } from '../../magicui/shimmer-button';

const StudioHeader = ({ previewMode, setPreviewMode, lastSaved, onSaveDraft, onFinalize, isSaving }) => {
  const { state, dispatch } = useInvoice();

  return (
    <div className="sticky top-0 z-50 bg-theme-app/90 backdrop-blur-xl border-b border-theme-border-soft px-4 md:px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
      
      {/* Left: Branding & Status */}
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div>
          <h1 className="text-xl font-black text-theme-primary tracking-tight">Smart Studio</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="flex items-center text-[10px] font-bold text-theme-muted uppercase tracking-wider">
              {lastSaved ? (
                <span className="flex items-center text-theme-success">
                  <Cloud className="w-3 h-3 mr-1" /> Saved {lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </span>
              ) : (
                <span className="flex items-center text-theme-warning">
                  <CloudOff className="w-3 h-3 mr-1" /> Unsaved
                </span>
              )}
            </span>
            <span className="w-1 h-1 rounded-full bg-theme-border-soft"></span>
            <span className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">
              {state.settings.paymentStatus === 'Draft' ? 'Draft Mode' : 'Live Mode'}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Invoice Number Override */}
      <div className="flex-1 max-w-xs hidden md:flex items-center justify-center">
        <div className="flex items-center bg-theme-surface border border-theme-border-soft rounded-xl px-3 py-1.5 shadow-sm w-full transition-colors focus-within:border-theme-accent">
          <span className="text-[10px] font-black uppercase text-theme-muted tracking-wider mr-2">Inv #</span>
          {state.generatingNumber ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-theme-accent" />
          ) : (
            <input 
              type="text" 
              value={state.invoiceNumber}
              onChange={(e) => dispatch({ type: 'SET_INVOICE_NUMBER', payload: e.target.value.toUpperCase() })}
              className="bg-transparent border-none outline-none text-theme-primary font-bold text-sm w-full focus:ring-0 p-0 text-center uppercase"
              placeholder="INV-001"
            />
          )}
        </div>
      </div>

      {/* Right: View Toggles & Actions */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">
        
        {/* Preview Toggles */}
        <div className="hidden lg:flex p-1 bg-theme-surface border border-theme-border-soft rounded-xl shadow-sm mr-2">
          <button
            onClick={() => setPreviewMode('OFF')}
            title="Focus Mode"
            className={`p-1.5 rounded-lg transition-all ${previewMode === 'OFF' ? 'bg-theme-card text-theme-accent shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}
          >
            <LayoutPanelLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPreviewMode('SIDE')}
            title="Side Preview"
            className={`p-1.5 rounded-lg transition-all ${previewMode === 'SIDE' ? 'bg-theme-card text-theme-accent shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}
          >
            <PanelRightInactive className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPreviewMode('FULLSCREEN')}
            title="Fullscreen Preview"
            className={`p-1.5 rounded-lg transition-all ${previewMode === 'FULLSCREEN' ? 'bg-theme-card text-theme-accent shadow-sm' : 'text-theme-muted hover:text-theme-primary'}`}
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>

        {/* Actions */}
        <button 
          onClick={onSaveDraft}
          className="hidden sm:flex items-center justify-center gap-2 px-4 py-2 bg-theme-surface hover:bg-theme-border-soft text-theme-primary text-xs font-bold rounded-xl transition-all shadow-sm border border-theme-border-soft"
        >
          <Save className="w-3.5 h-3.5 text-theme-muted" /> Draft
        </button>

        <ShimmerButton
          onClick={onFinalize}
          disabled={isSaving}
          className="h-9 px-6 shadow-glow"
          shimmerColor="#ffffff"
          background="var(--accent-gradient)"
        >
          <div className="flex items-center gap-2 text-white font-black text-xs">
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            Generate
          </div>
        </ShimmerButton>

      </div>
    </div>
  );
};

export default StudioHeader;
