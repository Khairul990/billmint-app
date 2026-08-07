const fs = require('fs');
let c = fs.readFileSync('src/pages/studios/InvoiceStudio.jsx', 'utf8');

const liveLinkRegex = /<div className=\"h-full overflow-y-auto custom-scrollbar pb-12 w-\[140%\] origin-top-left scale-\[0\.714\]\">\s*<InvoicePreview[\s\S]*?isLiveLink=\{true\}\s*\/>\s*<\/div>/;

const liveLinkNew = `                  {(() => {
                    const tId = previewBusinessSettings.selectedPdfTemplate || 'classic';
                    const Layout = LivePreviewLayouts[tId];
                    if (Layout) {
                      return (
                        <div className="h-full overflow-y-auto custom-scrollbar pb-24 w-[595px] origin-top-left scale-[0.7]">
                          <Layout data={{ invoiceNumber: DUMMY_INVOICE.invoiceNumber, date: DUMMY_INVOICE.date, customerName: DUMMY_INVOICE.customerName, items: DUMMY_INVOICE.items, totals: { subtotal: DUMMY_INVOICE.subtotal, tax: DUMMY_INVOICE.taxAmount, discount: DUMMY_INVOICE.discountAmount, grandTotal: DUMMY_INVOICE.grandTotal }, businessSettings: previewBusinessSettings, invoiceColumns: previewBusinessSettings.invoiceColumns, qrCodeBase64: null }} />
                        </div>
                      );
                    }
                    return (
                      <div className="h-full overflow-y-auto custom-scrollbar pb-24 w-[800px] origin-top-left scale-[0.43]">
                        <InvoicePreview invoice={DUMMY_INVOICE} businessSettings={{ ...previewBusinessSettings, showQrInPreview: true }} isLiveLink={true} />
                      </div>
                    );
                  })()}`;

c = c.replace(liveLinkRegex, liveLinkNew);

const pdfRegex = /<div className=\{\`transform origin-top w-\[210mm\] shadow-lg rounded-sm overflow-hidden bg-white shrink-0 h-max \$\{viewMode === 'print' \? 'scale-\[0\.5\]' : 'scale-\[0\.55\]'\}\`\}>\s*<InvoicePreview[\s\S]*?isLiveLink=\{false\}\s*\/>\s*<\/div>/;

const pdfNew = `              <div className="w-full overflow-hidden flex justify-center bg-transparent">
                {(() => {
                  const tId = previewBusinessSettings.selectedPdfTemplate || 'classic';
                  const Layout = LivePreviewLayouts[tId];
                  if (Layout) {
                    return (
                      <div className="transform origin-top scale-[0.8] lg:scale-[0.85] xl:scale-[0.95] print-only-preview" style={{ marginBottom: '-10%' }}>
                        <Layout data={{ invoiceNumber: DUMMY_INVOICE.invoiceNumber, date: DUMMY_INVOICE.date, customerName: DUMMY_INVOICE.customerName, items: DUMMY_INVOICE.items, totals: { subtotal: DUMMY_INVOICE.subtotal, tax: DUMMY_INVOICE.taxAmount, discount: DUMMY_INVOICE.discountAmount, grandTotal: DUMMY_INVOICE.grandTotal }, businessSettings: previewBusinessSettings, invoiceColumns: previewBusinessSettings.invoiceColumns, qrCodeBase64: null }} />
                      </div>
                    );
                  }
                  return (
                    <div className={\`w-[800px] transform origin-top \${viewMode === 'print' ? 'scale-[0.5]' : 'scale-[0.55]'} bg-white print-only-preview\`}>
                      <InvoicePreview invoice={DUMMY_INVOICE} businessSettings={previewBusinessSettings} isLiveLink={false} />
                    </div>
                  );
                })()}
              </div>`;

c = c.replace(pdfRegex, pdfNew);

fs.writeFileSync('src/pages/studios/InvoiceStudio.jsx', c);
console.log('Fixed InvoiceStudio.jsx correctly');
