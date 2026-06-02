const fs = require('fs');
const path = require('path');

let code = fs.readFileSync('src/pages/CreateInvoice.jsx', 'utf-8');

function extract(start, end) {
  const s = code.indexOf(start);
  if (s === -1) return null;
  const e = code.indexOf(end, s);
  if (e === -1) return null;
  return { content: code.substring(s, e + end.length), start: s, end: e + end.length };
}

const componentsDir = path.join(__dirname, 'src/components/invoice');
if (!fs.existsSync(componentsDir)) fs.mkdirSync(componentsDir, { recursive: true });

// 1. SmartRateModal
const smartRate = extract('{/* SMART COMPOSITE RATE MODAL */}', '{/* --- MODAL 2: EXPANDED INVOICE ITEMS SHEET --- */}');
if (smartRate) {
  const compCode = `import React from 'react';
import { X, Check } from 'lucide-react';

const SmartRateModal = ({ 
  showSmartRate, setShowSmartRate, activeItemIndex, items, 
  smartCharges, setSmartCharges, applySmartRate 
}) => {
  return (
    <>
      ${smartRate.content.replace('{/* --- MODAL 2: EXPANDED INVOICE ITEMS SHEET --- */}', '')}
    </>
  );
};
export default SmartRateModal;
`;
  fs.writeFileSync(path.join(componentsDir, 'SmartRateModal.jsx'), compCode);
  
  code = code.replace(smartRate.content, `<SmartRateModal 
        showSmartRate={showSmartRate}
        setShowSmartRate={setShowSmartRate}
        activeItemIndex={activeItemIndex}
        items={items}
        smartCharges={smartCharges}
        setSmartCharges={setSmartCharges}
        applySmartRate={applySmartRate}
      />\n\n      {/* --- MODAL 2: EXPANDED INVOICE ITEMS SHEET --- */}`);
}

// 2. ItemsSheetModal
const itemsSheet = extract('{/* --- MODAL 2: EXPANDED INVOICE ITEMS SHEET --- */}', '{/* --- MODAL 3: PDF VISIBLE FIELDS CUSTOMIZER --- */}');
if (itemsSheet) {
  const compCode = `import React from 'react';
import { X, Plus, Trash2, Calculator, Copy, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ItemsSheetModal = ({ 
  isSheetExpanded, setIsSheetExpanded, items, setItems, billType, currencySymbol,
  addQuickFillItem, removeItemRow, handleDuplicateItem, openSmartRateCalculator,
  customerName // some bindings might need this
}) => {
  // Pass through component
  return (
    <>
      ${itemsSheet.content.replace('{/* --- MODAL 3: PDF VISIBLE FIELDS CUSTOMIZER --- */}', '')}
    </>
  );
};
export default ItemsSheetModal;
`;
  fs.writeFileSync(path.join(componentsDir, 'ItemsSheetModal.jsx'), compCode);
  
  code = code.replace(itemsSheet.content, `<ItemsSheetModal 
        isSheetExpanded={isSheetExpanded}
        setIsSheetExpanded={setIsSheetExpanded}
        items={items}
        setItems={setItems}
        billType={billType}
        currencySymbol={currencySymbol}
        addQuickFillItem={addQuickFillItem}
        removeItemRow={removeItemRow}
        handleDuplicateItem={handleDuplicateItem}
        openSmartRateCalculator={openSmartRateCalculator}
        customerName={customerName}
      />\n\n      {/* --- MODAL 3: PDF VISIBLE FIELDS CUSTOMIZER --- */}`);
}

// 3. PdfFieldsModal
const pdfFields = extract('{/* --- MODAL 3: PDF VISIBLE FIELDS CUSTOMIZER --- */}', '{/* DYNAMIC ELEVEN-STAR PREVIEW MODAL OVERLAY */}');
if (pdfFields) {
  const compCode = `import React from 'react';
import { X, Check } from 'lucide-react';

const PdfFieldsModal = ({ 
  showPdfSettings, setShowPdfSettings, pdfVisibleFields, setPdfVisibleFields, billType 
}) => {
  const togglePdfField = (fieldKey) => {
    if (pdfVisibleFields.includes(fieldKey)) {
      setPdfVisibleFields(pdfVisibleFields.filter(f => f !== fieldKey));
    } else {
      setPdfVisibleFields([...pdfFields, fieldKey]);
    }
  };

  return (
    <>
      ${pdfFields.content.replace('{/* DYNAMIC ELEVEN-STAR PREVIEW MODAL OVERLAY */}', '')}
    </>
  );
};
export default PdfFieldsModal;
`;
  // Wait, togglePdfField is defined inside CreateInvoice! If I extract the JSX, it refers to togglePdfField.
  // We must extract togglePdfField or pass it as prop.
  // Actually, CreateInvoice already has togglePdfField, so I will pass it as prop instead of redefining.
  
  const compCode2 = `import React from 'react';
import { X, Check } from 'lucide-react';

const PdfFieldsModal = ({ 
  showPdfSettings, setShowPdfSettings, pdfVisibleFields, togglePdfField, billType 
}) => {
  return (
    <>
      ${pdfFields.content.replace('{/* DYNAMIC ELEVEN-STAR PREVIEW MODAL OVERLAY */}', '')}
    </>
  );
};
export default PdfFieldsModal;
`;
  fs.writeFileSync(path.join(componentsDir, 'PdfFieldsModal.jsx'), compCode2);
  
  code = code.replace(pdfFields.content, `<PdfFieldsModal 
        showPdfSettings={showPdfSettings}
        setShowPdfSettings={setShowPdfSettings}
        pdfVisibleFields={pdfVisibleFields}
        togglePdfField={togglePdfField}
        billType={billType}
      />\n\n      {/* DYNAMIC ELEVEN-STAR PREVIEW MODAL OVERLAY */}`);
}

// Add Imports to CreateInvoice.jsx
const imports = `import SmartRateModal from '../components/invoice/SmartRateModal';
import ItemsSheetModal from '../components/invoice/ItemsSheetModal';
import PdfFieldsModal from '../components/invoice/PdfFieldsModal';
`;
code = code.replace("import InvoicePreview from '../components/InvoicePreview';", "import InvoicePreview from '../components/InvoicePreview';\n" + imports);

fs.writeFileSync('src/pages/CreateInvoice.jsx', code);
console.log('Modals Extracted successfully!');
