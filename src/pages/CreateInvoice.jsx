import React, { useState, useEffect } from 'react';
import { InvoiceProvider } from '../contexts/InvoiceContext';
import SmartStudioLayout from '../components/invoice/studio/SmartStudioLayout';

const CreateInvoice = ({
  invoices = [],
  customers = [],
  products = [],
  businessSettings,
  onSaveInvoice,
  editingInvoice = null,
  onDownloadPDF
}) => {
  return (
    <InvoiceProvider 
      invoices={invoices} 
      businessSettings={businessSettings} 
      editingInvoice={editingInvoice}
    >
      <SmartStudioLayout 
        customers={customers}
        products={products}
        onSaveInvoice={onSaveInvoice}
        onDownloadPDF={onDownloadPDF}
      />
    </InvoiceProvider>
  );
};

export default CreateInvoice;
