import fs from 'fs';

let c = fs.readFileSync('src/pages/CreateInvoice.jsx', 'utf8');

if (!c.includes('InvoicePreview')) {
  c = c.replace(
    /import InvoiceCustomizationPanel from '\.\.\/components\/invoice-templates\/InvoiceCustomizationPanel';/,
    "import InvoiceCustomizationPanel from '../components/invoice-templates/InvoiceCustomizationPanel';\nimport InvoicePreview from '../components/InvoicePreview';"
  );
  
  const oldCode = `const SelectedLayout = LivePreviewLayouts[selectedTemplate] || LivePreviewLayouts['minimal-classic'];`;
  const newCode = `const SelectedLayout = LivePreviewLayouts[selectedTemplate];`;
  
  c = c.replace(oldCode, newCode);
  
  const layoutLogic = `              if (viewMode === 'livelink') {
                return (
                  <div className="w-full max-w-[375px] mx-auto shrink-0 h-max mt-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border-[8px] border-slate-900 relative h-[700px]">
                      <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 rounded-b-3xl w-40 mx-auto z-50"></div>
                      <div className="h-full overflow-y-auto custom-scrollbar pb-12 w-[140%] origin-top-left scale-[0.714]">
                        {SelectedLayout ? <SelectedLayout data={previewData} /> : <InvoicePreview invoice={{ ...previewData, orderStatus: 'Pending' }} businessSettings={{ ...previewData.businessSettings, selectedPdfTemplate: selectedTemplate }} isLiveLink={true} />}
                      </div>
                    </div>
                  </div>
                );
              }
              
              return (
                <div className="transform origin-top mx-auto overflow-hidden bg-white shrink-0 h-max scale-[0.9]">
                  {SelectedLayout ? <SelectedLayout data={previewData} /> : <InvoicePreview invoice={{ ...previewData, orderStatus: 'Pending' }} businessSettings={{ ...previewData.businessSettings, selectedPdfTemplate: selectedTemplate }} isLiveLink={false} />}
                </div>
              );`;
              
  c = c.replace(/if \(viewMode === 'livelink'\) \{[\s\S]*?<\/div>\s*\);/m, layoutLogic);
  
  fs.writeFileSync('src/pages/CreateInvoice.jsx', c);
  console.log('InvoicePreview fallback added to CreateInvoice');
}
