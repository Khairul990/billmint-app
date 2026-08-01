import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Save, LayoutTemplate } from 'lucide-react';
import { Button } from '../components/ui/Button';
import studioHtml from '../../public/bill-studio.html?raw';

const CreateInvoice = ({ onSaveInvoice, customers = [], products = [], businessSettings, onBack }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'SAVE_INVOICE') {
        const payload = event.data.payload;
        
        const parseCurrency = (str) => parseFloat(str.replace(/[^0-9.-]+/g,"")) || 0;
        
        const mappedPayload = {
          invoiceNumber: payload.invoiceNumber,
          date: payload.date || new Date().toLocaleDateString(),
          billType: 'Invoice',
          customerName: payload.customer?.name,
          customerPhone: payload.customer?.id,
          notes: payload.notes,
          subtotal: parseCurrency(payload.totals.subtotal),
          taxAmount: parseCurrency(payload.totals.tax),
          discountAmount: parseCurrency(payload.totals.discount),
          grandTotal: parseCurrency(payload.totals.grandTotal),
          amountPaid: 0,
          balanceDue: parseCurrency(payload.totals.grandTotal),
          items: payload.items.map(i => ({
             sNo: i.sNo,
             description: i.name,
             qty: i.qty,
             rate: i.price,
             amount: i.total
          }))
        };

        if (onSaveInvoice) {
           // true = saveCustomerAsNew
           onSaveInvoice(mappedPayload, true, false);
        }
      }
      
      if (event.data && event.data.type === 'STUDIO_READY') {
        if (iframeRef.current) {
          iframeRef.current.contentWindow.postMessage({ 
            type: 'LOAD_CUSTOMERS', 
            payload: customers 
          }, '*');
          
          iframeRef.current.contentWindow.postMessage({ 
            type: 'LOAD_PRODUCTS', 
            payload: products 
          }, '*');
          
          if (businessSettings) {
            const rootStyle = getComputedStyle(document.documentElement);
            iframeRef.current.contentWindow.postMessage({ 
              type: 'SET_THEME', 
              payload: {
                brandColor: businessSettings.brandColor || businessSettings.themeColor || '#C9A227',
                isDarkMode: businessSettings.darkMode,
                currencySymbol: businessSettings.currency || '$',
                features: businessSettings.invoiceBuilderSettings || {},
                themeVars: {
                  surface: rootStyle.getPropertyValue('--theme-surface'),
                  border: rootStyle.getPropertyValue('--theme-border-soft'),
                  textMain: rootStyle.getPropertyValue('--theme-primary'),
                  textMuted: rootStyle.getPropertyValue('--theme-muted'),
                  bgApp: rootStyle.getPropertyValue('--theme-app'),
                }
              }
            }, '*');
          }
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSaveInvoice, customers, products, businessSettings]);

  const triggerSave = () => {
    if (iframeRef.current) {
      iframeRef.current.contentWindow.postMessage({ type: 'TRIGGER_SAVE' }, '*');
    }
  };

  return (
    <>
      {document.getElementById('studio-header-portal') && createPortal(
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => onBack ? onBack() : window.history.back()} 
              className="mr-2 p-2 rounded-full hover:bg-theme-main text-theme-muted hover:text-theme-primary transition-colors shadow-sm bg-theme-surface border border-theme-border-soft"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-theme-accent/10 border border-theme-accent/20 flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5 text-theme-accent" />
            </div>
            <div>
              <div className="text-sm font-black text-theme-primary">Invoice Builder</div>
              <div className="text-[10px] text-theme-secondary font-bold flex items-center gap-2">
                <span className="flex items-center gap-1 text-theme-success"><span className="w-1.5 h-1.5 rounded-full bg-theme-success animate-pulse" /> Live Preview</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mr-4">
            <Button 
              variant="primary"
              size="md"
              onClick={triggerSave}
              leftIcon={Save}
            >
              Generate Invoice
            </Button>
          </div>
        </div>,
        document.getElementById('studio-header-portal')
      )}
      <div style={{ width: '100%', height: 'calc(100vh - 64px)' }}>
        <iframe 
          ref={iframeRef}
        srcDoc={studioHtml} 
        title="Bill Studio"
        style={{ width: '100%', height: '100%', border: 'none', backgroundColor: 'transparent' }}
        sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-downloads"
        allowtransparency="true"
      ></iframe>
      </div>
    </>
  );
};

export default CreateInvoice;
