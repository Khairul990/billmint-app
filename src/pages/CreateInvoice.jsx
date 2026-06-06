import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, LayoutTemplate } from 'lucide-react';
import { InvoiceProvider } from '../contexts/InvoiceContext';
import CreateInvoiceWizard from '../components/invoice/wizard/CreateInvoiceWizard';
import QuickBillForm from '../components/invoice/quick/QuickBillForm';
import LiveInvoicePreview from '../components/invoice/LiveInvoicePreview';

const CreateInvoiceLayout = ({ 
  customers, 
  products, 
  onSaveInvoice, 
  onDownloadPDF, 
  setCurrentTab, 
  onQuickBillOpen 
}) => {
  // Read mode preference from localStorage or default to advanced
  const [billingMode, setBillingMode] = useState(() => {
    return localStorage.getItem('billqyro_billing_mode') || 'advanced';
  });
  
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  useEffect(() => {
    localStorage.setItem('billqyro_billing_mode', billingMode);
  }, [billingMode]);

  return (
    <div className="max-w-[1600px] mx-auto w-full">
      {/* Mode Toggle Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black text-theme-primary">Create Bill</h1>
          <p className="text-sm font-bold text-theme-muted mt-1">Choose your preferred billing mode</p>
        </div>
        
        <div className="flex p-1 bg-theme-surface rounded-xl border border-theme-border-soft w-full sm:w-auto">
          <button
            onClick={() => setBillingMode('quick')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              billingMode === 'quick' 
                ? 'bg-theme-card text-theme-accent shadow-sm border border-theme-border-soft' 
                : 'text-theme-muted hover:text-theme-primary'
            }`}
          >
            <Zap className="w-4 h-4" /> Quick Mode
          </button>
          <button
            onClick={() => setBillingMode('advanced')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              billingMode === 'advanced' 
                ? 'bg-theme-card text-theme-primary shadow-sm border border-theme-border-soft' 
                : 'text-theme-muted hover:text-theme-primary'
            }`}
          >
            <LayoutTemplate className="w-4 h-4" /> Advanced Mode
          </button>
        </div>
      </div>

      {/* Main Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Side: Form (60% on desktop) */}
        <div className="w-full lg:w-[55%] xl:w-[60%] flex flex-col gap-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={billingMode}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full flex-1"
            >
              {billingMode === 'quick' ? (
                <QuickBillForm 
                  customers={customers}
                  products={products}
                  onSaveInvoice={onSaveInvoice}
                />
              ) : (
                <CreateInvoiceWizard 
                  customers={customers}
                  products={products}
                  onSaveInvoice={onSaveInvoice}
                  onDownloadPDF={onDownloadPDF}
                  setCurrentTab={setCurrentTab}
                  onQuickBillOpen={onQuickBillOpen}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Side: Live Preview (40% on desktop, hidden on mobile unless toggled) */}
        <div className="hidden lg:block lg:w-[45%] xl:w-[40%]">
          <LiveInvoicePreview />
        </div>

        {/* Mobile Preview Toggle Button */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <button
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="w-14 h-14 bg-theme-accent text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform"
          >
            <Zap className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Preview Modal */}
        <AnimatePresence>
          {showMobilePreview && (
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-0 z-[100] bg-theme-app lg:hidden flex flex-col"
            >
              <div className="p-4 border-b border-theme-border-soft flex justify-between items-center bg-theme-card">
                <h3 className="font-bold text-theme-primary">Live Preview</h3>
                <button 
                  onClick={() => setShowMobilePreview(false)}
                  className="p-2 bg-theme-surface rounded-lg text-theme-muted hover:text-theme-primary"
                >
                  Close
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <LiveInvoicePreview />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

const CreateInvoice = ({
  invoices = [],
  customers = [],
  products = [],
  businessSettings,
  onSaveInvoice,
  setCurrentTab,
  editingInvoice = null,
  onDownloadPDF,
  onQuickBillOpen
}) => {
  return (
    <InvoiceProvider 
      invoices={invoices} 
      businessSettings={businessSettings} 
      editingInvoice={editingInvoice}
    >
      <CreateInvoiceLayout 
        customers={customers}
        products={products}
        onSaveInvoice={onSaveInvoice}
        onDownloadPDF={onDownloadPDF}
        setCurrentTab={setCurrentTab}
        onQuickBillOpen={onQuickBillOpen}
      />
    </InvoiceProvider>
  );
};

export default CreateInvoice;
