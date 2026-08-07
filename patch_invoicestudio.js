import fs from 'fs';

let c = fs.readFileSync('src/pages/studios/InvoiceStudio.jsx', 'utf8');

if (!c.includes('LivePreviewLayouts')) {
  c = c.replace(
    /import InvoicePreview from '\.\.\/\.\.\/components\/InvoicePreview';/,
    "import InvoicePreview from '../../components/InvoicePreview';\nimport { LivePreviewLayouts } from '../../components/invoice-templates/layouts/LivePreviewLayouts';"
  );
  
  const replacer1 = `{(() => {
      const tId = previewBusinessSettings.selectedPdfTemplate || 'classic';
      const Layout = LivePreviewLayouts[tId];
      if (Layout) {
        return <Layout data={{ invoiceNumber: DUMMY_INVOICE.invoiceNumber, date: DUMMY_INVOICE.date, customerName: DUMMY_INVOICE.customerName, items: DUMMY_INVOICE.items, totals: { subtotal: DUMMY_INVOICE.subtotal, tax: DUMMY_INVOICE.taxAmount, grandTotal: DUMMY_INVOICE.grandTotal }, businessSettings: previewBusinessSettings, invoiceColumns: previewBusinessSettings.invoiceColumns, qrCodeBase64: null }} />;
      }
      return <InvoicePreview invoice={DUMMY_INVOICE} businessSettings={{ ...previewBusinessSettings, showQrInPreview: true }} isLiveLink={true} />;
    })()}`;

  const replacer2 = `{(() => {
      const tId = previewBusinessSettings.selectedPdfTemplate || 'classic';
      const Layout = LivePreviewLayouts[tId];
      if (Layout) {
        return <Layout data={{ invoiceNumber: DUMMY_INVOICE.invoiceNumber, date: DUMMY_INVOICE.date, customerName: DUMMY_INVOICE.customerName, items: DUMMY_INVOICE.items, totals: { subtotal: DUMMY_INVOICE.subtotal, tax: DUMMY_INVOICE.taxAmount, grandTotal: DUMMY_INVOICE.grandTotal }, businessSettings: previewBusinessSettings, invoiceColumns: previewBusinessSettings.invoiceColumns, qrCodeBase64: null }} />;
      }
      return <InvoicePreview invoice={DUMMY_INVOICE} businessSettings={previewBusinessSettings} isLiveLink={false} />;
    })()}`;

  c = c.replace(/<InvoicePreview[\s\S]*?isLiveLink=\{true\}[\s\S]*?\/>/, replacer1);
  c = c.replace(/<InvoicePreview[\s\S]*?isLiveLink=\{false\}[\s\S]*?\/>/, replacer2);
  
  fs.writeFileSync('src/pages/studios/InvoiceStudio.jsx', c);
  console.log('InvoiceStudio updated');
}
