import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Save, Eye, Loader2, Check } from 'lucide-react';
import { useInvoice } from '../../../context/InvoiceContext';
import { toast } from 'react-hot-toast';
import { auth } from '../../../services/firebaseConfig';
import { generateInvoiceNumber } from '../../../services/invoiceNumberService';
import { ShimmerButton } from '../../magicui/shimmer-button';

import CustomerSelectionStep from './steps/CustomerSelectionStep';
import ItemsSelectionStep from './steps/ItemsSelectionStep';
import PaymentDiscountStep from './steps/PaymentDiscountStep';
import PreviewDownloadStep from './steps/PreviewDownloadStep';

const STEPS = [
  { id: 1, title: '১. কাস্টমার নির্বাচন' },
  { id: 2, title: '২. ইনভয়েস আইটেম' },
  { id: 3, title: '৩. পেমেন্ট ও ডিসকাউন্ট' },
  { id: 4, title: '৪. প্রিভিউ ও সেভ' }
];

const CreateInvoiceWizard = ({ onSaveInvoice, onDownloadPDF, setCurrentTab, customers, products }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { state, dispatch, businessSettings } = useInvoice();

  // Generate Invoice Number if missing
  useEffect(() => {
    const initNumber = async () => {
      if (!state.invoiceNumber && !state.generatingNumber) {
        dispatch({ type: 'GENERATE_INVOICE_NUMBER_START' });
        try {
          const userId = auth?.currentUser?.uid;
          if (userId) {
            const newNum = await generateInvoiceNumber(userId);
            dispatch({ type: 'SET_INVOICE_NUMBER', payload: newNum });
          } else {
            // Fallback for demo mode
            dispatch({ type: 'SET_INVOICE_NUMBER', payload: `INV-${new Date().getFullYear()}-${Math.floor(Math.random()*1000)}` });
          }
        } catch (err) {
          console.error("Number generation failed:", err);
          dispatch({ type: 'SET_INVOICE_NUMBER', payload: `INV-MANUAL-${Math.floor(Math.random()*1000)}` });
        }
      }
    };
    initNumber();
  }, [state.invoiceNumber, state.generatingNumber, dispatch]);

  const handleSave = (statusOverride, isSilent = false) => {
    // Basic validation before saving
    if (!state.customer.name && statusOverride !== 'Draft') {
      if (!isSilent) toast.error('Please add a customer name before saving the final invoice.');
      return;
    }

    // Clean items
    const cleanedItems = state.items.filter(item => 
      (item.description && item.description.trim() !== '') || 
      (item.designNo && item.designNo.trim() !== '') || 
      (parseFloat(item.rate) > 0)
    ).map(item => {
      const qty = parseFloat(item.qty);
      const rate = parseFloat(item.rate !== undefined ? item.rate : (item.unitPrice !== undefined ? item.unitPrice : item.price));
      return {
        ...item,
        qty: isNaN(qty) ? 1 : qty,
        rate: isNaN(rate) ? 0 : rate,
        amount: (isNaN(qty) ? 1 : qty) * (isNaN(rate) ? 0 : rate)
      };
    });

    if (cleanedItems.length === 0 && statusOverride !== 'Draft') {
      if (!isSilent) toast.error('Please add at least one item before saving.');
      return;
    }

    const payload = {
      id: state.id,
      invoiceNumber: state.invoiceNumber,
      date: state.date,
      dueDate: state.dueDate,
      billType: state.billType,
      customerId: state.customer.id || null,
      customerName: state.customer.name,
      customerPhone: state.customer.phone,
      customerEmail: state.customer.email,
      customerAddress: state.customer.address,
      items: cleanedItems,
      taxPercentage: state.totals.taxPercentage,
      taxAmount: state.totals.taxAmount,
      discountAmount: state.totals.discountAmount,
      amountPaid: state.totals.amountPaid,
      balanceDue: state.totals.balanceDue,
      notes: state.settings.notes,
      terms: state.settings.terms,
      paymentStatus: typeof statusOverride === 'string' ? statusOverride : state.settings.paymentStatus,
      paymentMethod: state.settings.paymentMethod,
      paymentNote: state.settings.paymentNote,
      orderStatus: state.settings.orderStatus,
      subtotal: state.totals.subtotal,
      grandTotal: state.totals.grandTotal,
      paymentProofs: state.paymentProofs,
      // Pass the business snapshot
      businessSnapshot: businessSettings,
      paymentSettingsSnapshot: businessSettings,
      regionalSettingsSnapshot: businessSettings
    };

    onSaveInvoice(payload, state.saveCustomer && !state.customer.id, isSilent);
    if (!isSilent && statusOverride !== 'Draft') {
      toast.success('Invoice saved successfully!');
    }
  };

  const handleNext = () => {
    // Validate Step 1
    if (currentStep === 1) {
      if (!state.customer.name) {
        toast.error('Customer Name is required');
        return;
      }
    }
    // Validate Step 2
    if (currentStep === 2) {
      const hasValidItem = state.items.some(i => i.description || i.designNo || i.rate > 0);
      if (!hasValidItem) {
        toast.error('Please add at least one item');
        return;
      }
    }
    if (currentStep < 4) setCurrentStep(s => s + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(s => s - 1);
  };

  const containerVariants = {
    hidden: { opacity: 0, x: 20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 md:pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-theme-primary">
            {state.id.startsWith('inv-') && !state.isInitialized ? 'Create Invoice' : 'Invoice Details'}
          </h1>
          <p className="text-sm font-bold text-theme-muted mt-1">Step {currentStep} of 4: {STEPS[currentStep-1].title}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Invoice Number Display/Override */}
          <div className="flex items-center bg-theme-surface dark:bg-theme-card border border-theme-border-soft rounded-xl overflow-hidden px-3 py-1.5 min-w-[200px]">
            <span className="text-[10px] font-black uppercase text-theme-muted tracking-wider mr-2">Invoice #</span>
            {state.generatingNumber ? (
              <div className="flex items-center gap-1.5 text-theme-accent">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="text-xs font-bold">Generating...</span>
              </div>
            ) : (
              <input 
                type="text" 
                value={state.invoiceNumber}
                onChange={(e) => dispatch({ type: 'SET_INVOICE_NUMBER', payload: e.target.value.toUpperCase() })}
                className="bg-transparent border-none outline-none text-theme-primary font-bold text-sm w-32 focus:ring-0 p-0"
                placeholder="INV-XXXX-XXX"
              />
            )}
          </div>
          
          <button 
            onClick={() => handleSave('Draft')}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-theme-surface hover:bg-theme-border-soft text-theme-primary font-bold rounded-xl transition-all shadow-sm border border-theme-border-soft"
          >
            <Save className="w-4 h-4 text-theme-muted" />
            <span className="hidden sm:inline">Save Draft</span>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center justify-between mb-16 relative px-2 md:px-8">
        <div className="absolute left-6 right-6 md:left-12 md:right-12 top-1/2 -translate-y-1/2 h-1 bg-theme-border-soft rounded-full z-0" />
        <div 
          className="absolute left-6 md:left-12 top-1/2 -translate-y-1/2 h-1 bg-theme-accent rounded-full z-0 transition-all duration-500 ease-in-out" 
          style={{ width: `calc(${((currentStep - 1) / (STEPS.length - 1)) * 100}% - ${currentStep === 1 ? '0px' : '48px'})` }}
        />
        
        {STEPS.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          
          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
                  isCompleted 
                    ? 'bg-theme-accent text-white scale-100 shadow-lg shadow-theme-glow' 
                    : isCurrent 
                      ? 'bg-theme-card border-2 border-theme-accent text-theme-accent scale-110 shadow-xl' 
                      : 'bg-theme-surface border-2 border-theme-border-soft text-theme-muted scale-95'
                }`}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <span 
                className={`absolute top-12 text-center w-20 md:w-32 text-[10px] md:text-xs font-bold transition-colors duration-300 ${
                  isCurrent ? 'text-theme-accent' : isCompleted ? 'text-theme-primary' : 'text-theme-muted hidden sm:block'
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            className="h-full"
          >
            {currentStep === 1 && <CustomerSelectionStep customers={customers} />}
            {currentStep === 2 && <ItemsSelectionStep products={products} />}
            {currentStep === 3 && <PaymentDiscountStep />}
            {currentStep === 4 && <PreviewDownloadStep onDownloadPDF={onDownloadPDF} handleSave={handleSave} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Fixed Navigation (Mobile friendly) */}
      <div className="fixed bottom-0 left-0 right-0 md:relative md:mt-8 bg-theme-card border-t border-theme-border-soft md:border-none p-4 md:p-0 z-40 md:bg-transparent shadow-[0_-10px_30px_rgba(0,0,0,0.05)] md:shadow-none">
        <div className="max-w-7xl mx-auto flex flex-col-reverse md:flex-row justify-between gap-3 md:gap-4">
          <button
            onClick={handlePrev}
            disabled={currentStep === 1}
            className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all min-h-[48px] ${
              currentStep === 1 
                ? 'opacity-50 cursor-not-allowed bg-theme-surface text-theme-muted' 
                : 'bg-theme-surface hover:bg-theme-border-soft text-theme-primary'
            }`}
          >
            <ArrowLeft className="w-5 h-5" /> Previous
          </button>
          
          {currentStep < 4 ? (
            <ShimmerButton
              onClick={handleNext}
              className="w-full md:w-auto min-h-[48px] shadow-lg shadow-theme-glow"
              shimmerColor="#ffffff"
              background="var(--accent-gradient)"
            >
              <div className="flex items-center gap-2 text-theme-button-text font-black">
                Next <ArrowRight className="w-5 h-5" />
              </div>
            </ShimmerButton>
          ) : (
            <ShimmerButton
              onClick={() => handleSave('Pending')}
              className="w-full md:w-auto min-h-[48px] shadow-lg"
              shimmerColor="#ffffff"
              background="var(--status-success)"
            >
              <div className="flex items-center gap-2 text-white font-black">
                <Save className="w-5 h-5" /> Finalize Invoice
              </div>
            </ShimmerButton>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateInvoiceWizard;
