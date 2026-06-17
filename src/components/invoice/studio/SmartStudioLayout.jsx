import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { toast } from 'react-hot-toast';
import { Check, User, ShoppingBag, CreditCard } from 'lucide-react';

import StudioHeader from './StudioHeader';
import SmartCustomerSelect from './SmartCustomerSelect';
import ExcelBillTable from './ExcelBillTable';
import StickyTotalPanel from './StickyTotalPanel';
import LiveInvoicePreview from '../LiveInvoicePreview';
import { AlertTriangle } from 'lucide-react';

const SmartStudioLayout = ({ customers, products, onSaveInvoice, onDownloadPDF, onBack }) => {
  const { state, dispatch } = useInvoice();
  
  const [previewMode, setPreviewMode] = useState('OFF');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState(''); // '', 'unsaved', 'saving', 'saved'
  const [showExitPrompt, setShowExitPrompt] = useState(false);

  const onSaveInvoiceRef = React.useRef(onSaveInvoice);
  useEffect(() => {
    onSaveInvoiceRef.current = onSaveInvoice;
  }, [onSaveInvoice]);

  // Auto-Save Engine (Debounced)
  const autoSaveDraft = useCallback(async () => {
    // Basic validation to prevent saving completely empty drafts repeatedly
    const hasContent = state.customer.name || state.items.some(i => i.description || i.qty > 0);
    if (!hasContent) return;

    try {
      // Push to onSaveInvoice as a Draft and mark silent=true
      if (onSaveInvoiceRef.current) {
        await onSaveInvoiceRef.current({ ...state, paymentStatus: 'Draft' }, false, true);
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  }, [state]);

  // Debounce effect
  useEffect(() => {
    const hasContent = state.customer.name || state.items.some(i => i.description || i.qty > 0);
    if (!hasContent) return;

    setSaveStatus('unsaved');
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      await autoSaveDraft();
      setSaveStatus('saved');
    }, 3000);

    return () => clearTimeout(timer);
  }, [state, autoSaveDraft]);

  // Keyboard Shortcuts Engine
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S = Save Draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        setSaveStatus('saving');
        autoSaveDraft().then(() => setSaveStatus('saved'));
      }
      // Ctrl/Cmd + Enter = Finalize
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleFinalize();
      }
      // Ctrl/Cmd + P = Toggle Preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setPreviewMode(prev => prev === 'OFF' ? 'SIDE' : 'OFF');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [autoSaveDraft]);

  const validateBeforeSave = () => {
    if (!state.customer.name) {
      toast.error('Customer name is required to finalize.');
      return false;
    }
    const hasValidItems = state.items.length > 0 && state.items.some(i => i.description || i.itemService || i.rate > 0);
    if (!hasValidItems) {
      toast.error('Please add at least one bill item.');
      return false;
    }
    const hasZeroRate = state.items.some(i => i.itemService && (!i.rate || parseFloat(i.rate) === 0));
    if (hasZeroRate) {
      toast.error('Rate required for bill items. Please fix before saving.');
      return false;
    }
    if (state.totals.grandTotal === 0 && state.items.length > 0) {
      toast.error('Grand Total is ₹0. Please check item rates and quantities.');
      return false;
    }
    return true;
  };

  const handleFinalize = async () => {
    if (!validateBeforeSave()) return;

    setIsSaving(true);
    try {
      await onSaveInvoice({ ...state, paymentStatus: state.settings.paymentStatus }, state.saveCustomer && !state.customer.id, false);
      toast.success('Invoice finalized successfully!');
    } catch (error) {
      toast.error('Failed to finalize invoice.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackClick = () => {
    if (saveStatus === 'unsaved') {
      setShowExitPrompt(true);
    } else {
      if (onBack) onBack();
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)] bg-theme-app relative">
      {/* Smart Sticky Header */}
      <StudioHeader 
        previewMode={previewMode} 
        setPreviewMode={setPreviewMode} 
        lastSaved={lastSaved}
        saveStatus={saveStatus}
        onSaveDraft={() => {
          setSaveStatus('saving');
          autoSaveDraft().then(() => setSaveStatus('saved'));
        }}
        onFinalize={handleFinalize}
        isSaving={isSaving}
        onDownloadPDF={() => {
          if (validateBeforeSave()) {
            if (onDownloadPDF) onDownloadPDF(state);
          }
        }}
        onBack={handleBackClick}
      />

      {/* Live KPI Strip */}
      <div className="bg-theme-surface/95 backdrop-blur-md border-b border-theme-border-soft px-4 md:px-6 py-2.5 flex items-center justify-between overflow-x-auto scrollbar-hide shadow-sm z-40 relative">
        <div className="flex items-center gap-6 text-sm whitespace-nowrap min-w-max">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">Customer</span>
            <span className="font-black text-theme-primary">{state.customer.name || <span className="text-theme-muted/50">Unselected</span>}</span>
          </div>
          <div className="w-[1px] h-6 bg-theme-border-soft"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">Items</span>
            <span className="font-black text-theme-primary">{state.items.filter(i => i.itemService || i.description).length}</span>
          </div>
          <div className="w-[1px] h-6 bg-theme-border-soft"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">Qty</span>
            <span className="font-black text-theme-primary">{state.items.reduce((sum, item) => sum + (parseFloat(item.qty) || 0), 0)}</span>
          </div>
          <div className="w-[1px] h-6 bg-theme-border-soft"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">Subtotal</span>
            <span className="font-black text-theme-primary">₹{state.totals.subtotal.toLocaleString()}</span>
          </div>
          <div className="w-[1px] h-6 bg-theme-border-soft"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-theme-muted">Due</span>
            <span className="font-black text-theme-danger">₹{state.totals.balanceDue.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className={`flex flex-1 gap-6 p-4 md:p-6 pb-32 transition-all duration-300 ${previewMode === 'FULLSCREEN' ? 'hidden' : ''}`}>
        
        {/* Left Workspace */}
        <div className={`flex flex-col gap-6 transition-all duration-500 ${previewMode === 'SIDE' ? 'w-full lg:w-[60%]' : 'w-full'}`}>
          
          <div className="bg-theme-surface border border-theme-border-soft rounded-2xl p-4 shadow-sm">
            <SmartCustomerSelect customers={customers} />
          </div>

          <div className="bg-theme-surface border border-[rgba(236,72,153,0.1)] rounded-2xl shadow-sm flex flex-col hover:shadow-md transition-shadow overflow-hidden">
            <ExcelBillTable products={products} />
          </div>
          
          {/* Mobile or Side-Preview mode Summary Position */}
          <div className={`block ${previewMode === 'SIDE' ? 'lg:block' : 'lg:hidden'}`}>
            <StickyTotalPanel onFinalize={handleFinalize} isSaving={isSaving} />
          </div>

        </div>

        {/* Right Summary Panel (Desktop Only, Side Preview OFF) */}
        <AnimatePresence>
          {previewMode === 'OFF' && (
            <motion.div 
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: '30%' }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              className="hidden lg:block relative"
            >
              <div className="sticky top-32">
                <div className="bg-theme-surface border border-[rgba(236,72,153,0.1)] rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <StickyTotalPanel onFinalize={handleFinalize} isSaving={isSaving} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Preview Panel (Side Mode) */}
        <AnimatePresence>
          {previewMode === 'SIDE' && (
            <motion.div 
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: '40%' }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              className="hidden lg:block border-l border-theme-border-soft pl-6 relative"
            >
              <div className="sticky top-24 h-[calc(100vh-8rem)]">
                <LiveInvoicePreview />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Fullscreen Preview Mode */}
      <AnimatePresence>
        {previewMode === 'FULLSCREEN' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="flex-1 p-6"
          >
            <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-2xl overflow-hidden">
              <LiveInvoicePreview />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Universal Sticky Bottom Action Bar (Mobile Only) */}
      <div className="fixed bottom-0 left-0 right-0 bg-theme-app/95 backdrop-blur-xl border-t border-theme-border-soft px-4 py-3 flex lg:hidden items-center justify-between z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        
        <div className="hidden sm:flex items-center gap-4 border-r border-theme-border-soft pr-4">
          <div>
            <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Grand Total</p>
            <p className="text-xl font-black text-theme-primary leading-none mt-1">₹{state.totals.grandTotal.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-theme-muted uppercase tracking-wider">Balance Due</p>
            <p className="text-lg font-black text-theme-danger leading-none mt-1">₹{state.totals.balanceDue.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 overflow-x-auto w-full sm:w-auto scrollbar-hide">
          <button 
            onClick={() => {
              setSaveStatus('saving');
              autoSaveDraft().then(() => setSaveStatus('saved'));
            }}
            disabled={isSaving}
            className="flex-shrink-0 bg-theme-surface border border-theme-border-soft hover:bg-theme-border-soft text-theme-primary font-bold text-xs px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            Save Draft
          </button>
          
          <button 
            onClick={() => { if(validateBeforeSave() && onDownloadPDF) onDownloadPDF(state); }}
            className="flex-shrink-0 bg-theme-surface border border-theme-border-soft hover:bg-theme-border-soft text-theme-primary font-bold text-xs px-4 py-2.5 rounded-xl transition-colors whitespace-nowrap"
          >
            Generate PDF
          </button>
          
          <button 
            onClick={handleFinalize}
            disabled={isSaving}
            className="flex-shrink-0 bg-[image:var(--accent-gradient)] text-white font-black text-xs px-6 py-2.5 rounded-xl shadow-glow active:scale-95 transition-transform flex items-center whitespace-nowrap"
          >
            {isSaving ? "Processing..." : "Generate Live Link"}
          </button>
        </div>
      </div>

      {/* Unsaved Changes Prompt */}
      {showExitPrompt && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-theme-surface border border-theme-border-soft rounded-2xl shadow-2xl w-full max-w-sm p-6"
          >
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-black text-theme-primary leading-tight">Unsaved Changes</h3>
            </div>
            
            <p className="text-sm font-bold text-theme-muted mb-6">
              You have unsaved changes. Save as draft before leaving?
            </p>

            <div className="flex flex-col gap-2">
              <button 
                onClick={async () => {
                  setSaveStatus('saving');
                  await autoSaveDraft();
                  setSaveStatus('saved');
                  if (onBack) onBack();
                }}
                className="w-full py-3 bg-theme-accent hover:bg-theme-accent/90 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Save & Exit
              </button>
              <button 
                onClick={() => { if(onBack) onBack(); }}
                className="w-full py-3 bg-theme-danger/10 hover:bg-theme-danger/20 text-theme-danger text-sm font-bold rounded-xl transition-colors"
              >
                Exit without saving
              </button>
              <button 
                onClick={() => setShowExitPrompt(false)}
                className="w-full py-3 bg-transparent hover:bg-theme-border-soft text-theme-muted hover:text-theme-primary text-sm font-bold rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

export default SmartStudioLayout;
