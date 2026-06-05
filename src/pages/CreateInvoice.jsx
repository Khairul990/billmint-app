import React from 'react';
import { InvoiceProvider } from '../contexts/InvoiceContext';
import CreateInvoiceWizard from '../components/invoice/wizard/CreateInvoiceWizard';

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
      <CreateInvoiceWizard 
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
