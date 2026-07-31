import React, { useEffect, useRef } from 'react';
import studioHtml from '../../public/bill-studio.html?raw';

const CreateInvoice = ({ onSaveInvoice, customers = [], products = [], businessSettings }) => {
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
            iframeRef.current.contentWindow.postMessage({ 
              type: 'SET_THEME', 
              payload: {
                brandColor: businessSettings.brandColor || businessSettings.themeColor || '#C9A227',
                isDarkMode: businessSettings.darkMode,
                currencySymbol: businessSettings.currency || '$',
                features: businessSettings.invoiceBuilderSettings || {}
              }
            }, '*');
          }
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onSaveInvoice, customers, products, businessSettings]);

  return (
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
  );
};

export default CreateInvoice;
