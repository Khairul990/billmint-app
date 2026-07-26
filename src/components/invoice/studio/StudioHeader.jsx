import React from 'react';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { Loader2, Cloud, CloudOff, FileText, Eye, ArrowLeft, Save } from 'lucide-react';

const StudioHeader = ({ showPreviewModal, setShowPreviewModal, lastSaved, saveStatus, isSaving, onSaveDraft, onDownloadPDF, onBack }) => {
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

      {/* Right: Actions */}
      <div className="flex items-center gap-2 w-full md:w-auto justify-end">

        {/* Save Draft Button */}
        <button
          onClick={onSaveDraft}
          disabled={isSaving || saveStatus === 'saved'}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-theme-accent hover:bg-theme-accent/90 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm disabled:opacity-50"
        >
          {isSaving ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saving Draft</>
          ) : (
            <><Save className="w-4 h-4" /> Save Draft</>
          )}
        </button>

        {/* Preview Button */}
        <button
          onClick={() => setShowPreviewModal(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-theme-surface hover:bg-theme-border-soft text-theme-primary text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm border border-theme-border-soft"
        >
          <Eye className="w-4 h-4 text-theme-accent" /> Preview
        </button>

        {/* Download PDF Button */}
        <button
          onClick={onDownloadPDF}
          disabled={isSaving}
          className="flex items-center justify-center gap-1.5 px-4 py-2 bg-theme-surface hover:bg-theme-border-soft text-theme-primary text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm border border-theme-border-soft disabled:opacity-50"
        >
          <FileText className="w-4 h-4 text-rose-500" /> Download PDF
        </button>

      </div>
    </div>
  );
};

export default StudioHeader;
