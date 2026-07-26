
const CreateInvoice = ({
  invoices = [],
  customers = [],
  products = [],
  businessSettings,
  onSaveInvoice,
  editingInvoice = null,
  onDownloadPDF,
  onBack
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
        invoices={invoices}
        onSaveInvoice={onSaveInvoice}
        onDownloadPDF={onDownloadPDF}
        onBack={onBack}
      />
    </InvoiceProvider>
  );
};

export default CreateInvoice;
