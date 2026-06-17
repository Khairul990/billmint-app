import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { toast } from 'react-hot-toast';

import StudioHeader from './StudioHeader';
import SmartCustomerSelect from './SmartCustomerSelect';
import ExcelBillTable from './ExcelBillTable';
import StickyTotalPanel from './StickyTotalPanel';
import LiveInvoicePreview from '../LiveInvoicePreview';

const SmartStudioLayout = ({ customers, products, onSaveInvoice, onDownloadPDF }) => {
  const { state, dispatch } = useInvoice();
  
  const [previewMode, setPreviewMode] = useState('OFF');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [saveStatus, setSaveStatus] = useState(''); // '', 'unsaved', 'saving', 'saved'

  // Auto-Save Engine (Debounced)
  const autoSaveDraft = useCallback(async () => {
    // Basic validation to prevent saving completely empty drafts repeatedly
    const hasContent = state.customer.name || state.items.some(i => i.description || i.qty > 0);
    if (!hasContent) return;

    try {
      // Push to onSaveInvoice as a Draft and mark silent=true
      if (onSaveInvoice) {
        await onSaveInvoice({ ...state, paymentStatus: 'Draft' }, false, true);
        setLastSaved(new Date());
      }
    } catch (err) {
      console.error("Auto-save failed", err);
    }
  }, [state, onSaveInvoice]);

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

  const handleFinalize = async () => {
    if (!state.customer.name) {
      toast.error('Customer name is required to finalize.');
      return;
    }
    const hasValidItems = state.items.some(i => i.description || i.rate > 0);
    if (!hasValidItems) {
      toast.error('Please add at least one item.');
      return;
    }

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

  return (
    <div className="flex flex-col min-h-[calc(100vh-6rem)] bg-theme-app">
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
        onDownloadPDF={onDownloadPDF}
      />

      {/* Main Studio Body */}
      <div className={`flex flex-1 gap-6 p-4 md:p-6 transition-all duration-300 ${previewMode === 'FULLSCREEN' ? 'hidden' : ''}`}>
        
        {/* Left Workspace */}
        <div className={`flex flex-col gap-6 transition-all duration-500 ${previewMode === 'SIDE' ? 'w-full lg:w-[60%]' : 'w-full'}`}>
          
          <div className="bg-theme-surface border border-theme-border-soft rounded-2xl p-4 shadow-sm">
            <SmartCustomerSelect customers={customers} />
          </div>

          <div className="bg-theme-surface border border-theme-border-soft rounded-2xl shadow-sm flex-1 overflow-hidden flex flex-col">
            <ExcelBillTable products={products} />
          </div>
          
        </div>

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

      {/* Sticky Total Panel (Desktop Right) */}
      <StickyTotalPanel onFinalize={handleFinalize} isSaving={isSaving} />

      {/* Universal Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-theme-app/95 backdrop-blur-xl border-t border-theme-border-soft px-4 py-3 flex items-center justify-between z-50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        
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
            onClick={() => { if(onDownloadPDF) onDownloadPDF(state); }}
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

    </div>
  );
};

export default SmartStudioLayout;
