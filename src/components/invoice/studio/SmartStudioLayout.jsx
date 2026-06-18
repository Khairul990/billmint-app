import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { toast } from 'react-hot-toast';
import { Check, User, ShoppingBag, CreditCard, Cloud, AlertTriangle, Loader2, ArrowRight, ArrowLeft, FileText, Share2, Eye } from 'lucide-react';

import StudioHeader from './StudioHeader';
import SmartCustomerSelect from './SmartCustomerSelect';
import SmartBillItemsList from './SmartBillItemsList';
import CompactSummaryStrip from './CompactSummaryStrip';
import CompactPaymentSection from './CompactPaymentSection';
import LiveInvoicePreview from '../LiveInvoicePreview';

const SmartStudioLayout = ({ customers, products, onSaveInvoice, onDownloadPDF, onBack }) => {
  const { state, dispatch } = useInvoice();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [previewMode, setPreviewMode] = useState('SIDE'); // 'OFF', 'SIDE', 'FULLSCREEN'
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'unsaved', 'saving'
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  
  const onSaveInvoiceRef = React.useRef(onSaveInvoice);
  useEffect(() => {
    onSaveInvoiceRef.current = onSaveInvoice;
  }, [onSaveInvoice]);

  // Auto-Save Engine (Debounced)
  const autoSaveDraft = useCallback(async () => {
    const hasContent = state.customer.name || state.items.some(i => i.description || i.qty > 0);
    if (!hasContent) return;

    try {
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

  const steps = [
    { id: 1, title: 'Customer', icon: <User className="w-5 h-5" /> },
    { id: 2, title: 'Items', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 3, title: 'Payment', icon: <CreditCard className="w-5 h-5" /> }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-theme-app relative overflow-x-hidden">
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

      {/* Main Studio Body - Two Column on Desktop, Stacked on Mobile */}
      <div className="flex flex-col xl:flex-row flex-1 p-4 lg:p-6 xl:p-8 gap-6 lg:gap-8 max-w-[1600px] mx-auto w-full">
        
        {/* Left Column - Builder Wizard */}
        <div className={`flex-1 flex flex-col gap-6 xl:max-w-2xl 2xl:max-w-3xl transition-all duration-300 ${previewMode === 'FULLSCREEN' ? 'hidden' : (showMobilePreview ? 'hidden xl:flex' : 'flex')}`}>
          
          {/* Progress Stepper */}
          <div className="bg-theme-surface border border-theme-border-soft rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between relative">
              {/* Connecting Line */}
              <div className="absolute top-6 left-0 right-0 h-1 bg-theme-border-soft -z-10 rounded-full">
                <div 
                  className="h-full bg-theme-accent transition-all duration-500 rounded-full"
                  style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                ></div>
              </div>

              {steps.map((step) => {
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <button 
                    key={step.id}
                    onClick={() => setCurrentStep(step.id)}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm
                      ${isActive ? 'bg-theme-accent text-white scale-110 shadow-theme-accent/30 shadow-lg' : 
                        isCompleted ? 'bg-theme-accent/20 text-theme-accent' : 
                        'bg-theme-app border-2 border-theme-border-soft text-theme-muted group-hover:border-theme-accent/50 group-hover:text-theme-accent'}
                    `}>
                      {isCompleted ? <Check className="w-6 h-6" /> : step.icon}
                    </div>
                    <span className={`text-[10px] sm:text-xs font-black uppercase tracking-wider transition-colors
                      ${isActive ? 'text-theme-accent' : isCompleted ? 'text-theme-primary' : 'text-theme-muted'}
                    `}>
                      {step.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Step Content */}
          <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
            {currentStep === 1 && (
              <div className="flex flex-col gap-6">
                <div className="bg-theme-surface border border-theme-border-soft rounded-2xl p-6 shadow-sm">
                  <h2 className="text-sm font-black uppercase text-theme-primary mb-4 flex items-center gap-2"><User className="w-4 h-4 text-theme-accent" /> Customer Details</h2>
                  <SmartCustomerSelect customers={customers} />
                </div>
                
                <button 
                  onClick={() => setCurrentStep(2)}
                  className="mt-4 flex items-center justify-center gap-2 w-full py-4 bg-theme-accent hover:bg-theme-accent/90 text-white rounded-2xl font-black shadow-premium transition-all active:scale-[0.98]"
                >
                  Continue to Items <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="flex flex-col gap-6">
                <SmartBillItemsList products={products} />
                
                <div className="flex gap-4 mt-4">
                  <button 
                    onClick={() => setCurrentStep(1)}
                    className="py-4 px-6 bg-theme-surface border border-theme-border-soft hover:bg-theme-app text-theme-primary rounded-2xl font-black shadow-sm transition-all active:scale-[0.98]"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-theme-accent hover:bg-theme-accent/90 text-white rounded-2xl font-black shadow-premium transition-all active:scale-[0.98]"
                  >
                    Continue to Payment <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="flex flex-col gap-6 pb-20 xl:pb-0">
                <div className="bg-theme-surface border border-theme-border-soft rounded-2xl p-6 shadow-sm">
                  <h2 className="text-sm font-black uppercase text-theme-primary mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-theme-accent" /> Payment Details</h2>
                  <CompactPaymentSection />
                </div>
                
                <CompactSummaryStrip />

                {/* 3 Large Action Cards */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Save Draft Card */}
                  <div className="bg-theme-surface border border-theme-border-soft hover:border-theme-accent/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                    <div className="mb-4">
                      <div className="w-10 h-10 bg-theme-app text-theme-primary rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Cloud className="w-5 h-5" />
                      </div>
                      <h3 className="font-black text-theme-primary">Save Draft</h3>
                      <p className="text-[10px] font-bold text-theme-muted mt-1 leading-snug">Keep editing later, nothing is sent yet.</p>
                    </div>
                    <button 
                      onClick={() => {
                        setSaveStatus('saving');
                        autoSaveDraft().then(() => setSaveStatus('saved'));
                        toast.success("Saved as draft");
                      }}
                      className="w-full py-2.5 bg-theme-app text-theme-primary rounded-xl text-xs font-black uppercase hover:bg-theme-border-soft transition-colors"
                    >
                      Save Now
                    </button>
                  </div>

                  {/* Generate PDF Card */}
                  <div className="bg-theme-surface border border-theme-border-soft hover:border-theme-accent/30 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between">
                    <div className="mb-4">
                      <div className="w-10 h-10 bg-theme-app text-theme-primary rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h3 className="font-black text-theme-primary">Generate PDF</h3>
                      <p className="text-[10px] font-bold text-theme-muted mt-1 leading-snug">Download a professional PDF copy.</p>
                    </div>
                    <button 
                      onClick={() => {
                        if (validateBeforeSave()) {
                          if (onDownloadPDF) onDownloadPDF(state);
                        }
                      }}
                      className="w-full py-2.5 bg-theme-app text-theme-primary rounded-xl text-xs font-black uppercase hover:bg-theme-border-soft transition-colors"
                    >
                      Download
                    </button>
                  </div>

                  {/* Generate Live Link Card (Primary) */}
                  <div className="bg-theme-surface border-2 border-theme-accent/50 rounded-2xl p-5 shadow-premium hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-theme-accent to-pink-500"></div>
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-theme-accent/5 rounded-full blur-2xl group-hover:bg-theme-accent/10 transition-colors"></div>
                    <div className="mb-4 relative z-10">
                      <div className="w-10 h-10 bg-theme-accent/10 text-theme-accent rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <h3 className="font-black text-theme-accent">Generate Live Link</h3>
                      <p className="text-[10px] font-bold text-theme-muted mt-1 leading-snug">Customer gets a live link to view bill and upload payment screenshot.</p>
                    </div>
                    <button 
                      onClick={handleFinalize}
                      disabled={isSaving}
                      className="relative z-10 w-full py-3 bg-gradient-to-r from-theme-accent to-pink-500 text-white rounded-xl text-xs font-black uppercase hover:shadow-lg hover:shadow-theme-accent/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                      Create Link
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setCurrentStep(2)}
                  className="mt-2 py-4 w-full bg-theme-surface border border-theme-border-soft hover:bg-theme-app text-theme-primary rounded-2xl font-black shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-5 h-5" /> Back to Items
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right Column - Live Invoice Preview (Sticky on Desktop, Fullscreen on Mobile when toggled) */}
        <div className={`shrink-0 transition-all duration-300 ${
          previewMode === 'OFF' 
            ? 'hidden' 
            : (previewMode === 'FULLSCREEN' || showMobilePreview) 
              ? 'fixed inset-0 z-50 bg-theme-app p-4 overflow-y-auto w-full h-full' 
              : 'hidden xl:block xl:w-[500px] 2xl:w-[600px]'
        }`}>
          <div className="xl:sticky xl:top-[88px] h-full xl:h-[calc(100vh-120px)] flex flex-col">
            
            {/* Mobile Header for Preview */}
            <div className={`${previewMode === 'FULLSCREEN' ? 'flex' : 'xl:hidden flex'} items-center justify-between mb-4 bg-theme-surface p-4 rounded-2xl shadow-sm`}>
              <h2 className="font-black text-theme-primary flex items-center gap-2"><Eye className="w-5 h-5 text-theme-accent" /> Live Preview</h2>
              <button 
                onClick={() => {
                  setShowMobilePreview(false);
                  if (previewMode === 'FULLSCREEN') setPreviewMode('SIDE');
                }}
                className="px-4 py-2 bg-theme-app border border-theme-border-soft rounded-lg text-sm font-bold text-theme-primary"
              >
                Close
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-2xl border border-theme-border-soft overflow-hidden h-full flex flex-col">
              <div className="bg-theme-surface p-3 border-b border-theme-border-soft flex items-center justify-between shrink-0 hidden xl:flex">
                <span className="text-xs font-black uppercase tracking-wider text-theme-muted flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Live Customer View
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-theme-app/30">
                <div className="transform origin-top mx-auto w-full max-w-[800px] bg-white rounded-xl shadow-sm border border-theme-border-soft overflow-hidden">
                  <LiveInvoicePreview />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Mobile Floating Action Button to toggle Preview */}
      <button
        onClick={() => setShowMobilePreview(true)}
        className={`xl:hidden fixed bottom-6 right-6 w-14 h-14 bg-theme-accent text-white rounded-full shadow-premium flex items-center justify-center transition-all z-40 active:scale-95 ${showMobilePreview ? 'hidden' : 'flex'}`}
      >
        <Eye className="w-6 h-6" />
      </button>

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
