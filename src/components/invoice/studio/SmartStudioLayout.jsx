import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInvoice } from '../../../contexts/InvoiceContext';
import { toast } from 'react-hot-toast';
import { Check, User, ShoppingBag, CreditCard, Cloud, AlertTriangle, Loader2, ArrowRight, ArrowLeft, FileText, Share2, Eye, X } from 'lucide-react';
import { getCustomerLabelByType } from '../../../config/businessPresets';

import StudioHeader from './StudioHeader';
import SmartCustomerSelect from './SmartCustomerSelect';
import SmartBillItemsList from './SmartBillItemsList';
import CompactSummaryStrip from './CompactSummaryStrip';
import CompactPaymentSection from './CompactPaymentSection';
import LiveInvoicePreview from '../LiveInvoicePreview';
import { ensureInvoicePublicToken } from '../../../services/dbEngine';

const SmartStudioLayout = ({ customers, products, onSaveInvoice, onDownloadPDF, onBack }) => {
  const { state, dispatch, businessSettings } = useInvoice();
  const wsType = businessSettings?.businessWorkspaces?.find(ws => ws.id === businessSettings.activeWorkspaceId)?.type || businessSettings?.businessType || 'retail';
  const customerLabel = getCustomerLabelByType(wsType);
  
  const [currentStep, setCurrentStep] = useState(1);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'unsaved', 'saving'
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  
  const onSaveInvoiceRef = React.useRef(onSaveInvoice);
  useEffect(() => {
    onSaveInvoiceRef.current = onSaveInvoice;
  }, [onSaveInvoice]);

  const savedSnapshotRef = React.useRef(JSON.stringify(state));

  // Change Detector (No Auto-Save) — compares against last saved snapshot
  useEffect(() => {
    const currentSnapshot = JSON.stringify(state);
    if (savedSnapshotRef.current !== currentSnapshot) {
      const hasContent = state.customer.name || state.items.some(i => i.description || i.qty > 0);
      if (hasContent) {
        setSaveStatus('unsaved');
      }
    }
  }, [state]);

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

  const executeSave = async (silent = true, overridePaymentStatus = null) => {
    setIsSaving(true);
    try {
      const payload = { ...state };
      if (overridePaymentStatus) {
        payload.paymentStatus = overridePaymentStatus;
      } else {
        payload.paymentStatus = state.settings.paymentStatus;
      }
      const savedInvoice = await onSaveInvoiceRef.current(payload, state.saveCustomer && !state.customer.id, silent);
      setSaveStatus('saved');
      setLastSaved(new Date());
      savedSnapshotRef.current = JSON.stringify(state);
      if (!silent) toast.success('Invoice saved successfully!');
      return savedInvoice;
    } catch (err) {
      console.error(err);
      toast.error('Failed to save invoice.');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    // Saves as draft and navigates away (non-silent)
    await executeSave(false, 'Draft');
  };

  const handleDownloadPDF = async () => {
    if (!validateBeforeSave()) return;
    // Save silently first
    const saved = await executeSave(true);
    if (saved && onDownloadPDF) {
      onDownloadPDF(saved);
    }
  };

  const handleGenerateLiveLink = async () => {
    if (!validateBeforeSave()) return;
    
    // Save silently first
    const saved = await executeSave(true);
    if (!saved) return;
    
    setIsSaving(true);
    try {
      const token = await ensureInvoicePublicToken(saved);
      if (!token) {
        toast.error('Could not create live link. Please try again.');
        return;
      }
      const liveLink = `${window.location.origin}/invoice/${token}`;
      await navigator.clipboard.writeText(liveLink);
      toast.success('Live Invoice Link copied to clipboard!');
      // Navigate away by triggering non-silent save or calling onBack
      if (onBack) onBack();
    } catch (err) {
      toast.error('Could not create live link. Please try again.');
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
    { id: 1, title: customerLabel, icon: <User className="w-5 h-5" /> },
    { id: 2, title: 'Items', icon: <ShoppingBag className="w-5 h-5" /> },
    { id: 3, title: 'Payment', icon: <CreditCard className="w-5 h-5" /> }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-theme-app relative overflow-x-hidden">
      {/* Smart Sticky Header */}
      <StudioHeader 
        showPreviewModal={showPreviewModal} 
        setShowPreviewModal={setShowPreviewModal} 
        lastSaved={lastSaved}
        saveStatus={saveStatus}
        onSaveDraft={handleSaveDraft}
        onGenerateLiveLink={handleGenerateLiveLink}
        isSaving={isSaving}
        onDownloadPDF={handleDownloadPDF}
        onBack={handleBackClick}
      />

      {/* Main Studio Body - Full Width */}
      <div className="flex-1 p-4 lg:p-6 xl:p-8 w-full animate-in fade-in duration-300 pb-24">
        
        {/* Progress Stepper */}
        <div className="bg-theme-surface border border-theme-border-soft rounded-2xl p-6 shadow-sm mb-6 w-full">
          <div className="flex items-center justify-between relative max-w-4xl mx-auto">
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 w-full">
          {currentStep === 1 && (
            <div className="flex flex-col gap-6 w-full">
              <div className="bg-theme-surface border border-theme-border-soft rounded-2xl p-6 shadow-sm w-full">
                <h2 className="text-sm font-black uppercase text-theme-primary mb-4 flex items-center gap-2"><User className="w-4 h-4 text-theme-accent" /> {customerLabel} Details</h2>
                <SmartCustomerSelect customers={customers} />
              </div>
              
              <button 
                onClick={() => setCurrentStep(2)}
                className="flex items-center justify-center gap-2 w-full py-4 bg-theme-accent hover:bg-theme-accent/90 text-white rounded-2xl font-black shadow-premium transition-all active:scale-[0.98]"
              >
                Continue to Items <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-6 w-full">
              <SmartBillItemsList products={products} />
              
              <div className="flex gap-4 mt-4 w-full">
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
            <div className="flex flex-col gap-6 w-full">
              <div className="bg-theme-surface border border-theme-border-soft rounded-2xl p-6 shadow-sm w-full">
                <h2 className="text-sm font-black uppercase text-theme-primary mb-4 flex items-center gap-2"><CreditCard className="w-4 h-4 text-theme-accent" /> Payment Details</h2>
                <CompactPaymentSection />
              </div>
              
              <CompactSummaryStrip />

              {/* 3 Large Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
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
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="w-full py-2.5 bg-theme-app text-theme-primary rounded-xl text-xs font-black uppercase hover:bg-theme-border-soft transition-colors disabled:opacity-50"
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
                    onClick={handleDownloadPDF}
                    disabled={isSaving}
                    className="w-full py-2.5 bg-theme-app text-theme-primary rounded-xl text-xs font-black uppercase hover:bg-theme-border-soft transition-colors disabled:opacity-50"
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
                    onClick={handleGenerateLiveLink}
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

      {/* Mobile Floating Action Button to toggle Preview */}
      <button
        onClick={() => setShowPreviewModal(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-theme-accent text-white rounded-full shadow-premium flex items-center justify-center transition-all z-40 active:scale-95"
      >
        <Eye className="w-6 h-6" />
      </button>

      {/* PDF Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex flex-col p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="flex-1 max-w-4xl w-full mx-auto bg-theme-app rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-theme-surface p-4 border-b border-theme-border-soft flex items-center justify-between">
              <h2 className="font-black text-theme-primary flex items-center gap-2">
                <Eye className="w-5 h-5 text-theme-accent" /> Live PDF Preview
              </h2>
              <button 
                onClick={() => setShowPreviewModal(false)}
                className="p-2 bg-theme-app hover:bg-theme-border-soft border border-theme-border-soft rounded-lg text-theme-muted hover:text-theme-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-theme-border-soft/20 flex justify-center">
              <div className="w-full max-w-[800px] bg-white shadow-lg border border-theme-border-soft origin-top transform sm:scale-100 scale-95 transition-transform">
                <LiveInvoicePreview />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unsaved Changes Prompt */}
      {showExitPrompt && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
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
                  await handleSaveDraft();
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
