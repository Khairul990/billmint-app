const fs = require('fs');
const path = require('path');

let code = fs.readFileSync('src/pages/CreateInvoice.jsx', 'utf-8');

// Helper to extract a section based on start/end comments
function extractSection(startComment, endComment) {
  const startIndex = code.indexOf(startComment);
  if (startIndex === -1) return null;
  const endIndex = code.indexOf(endComment, startIndex);
  if (endIndex === -1) return null;
  
  const section = code.substring(startIndex, endIndex + endComment.length);
  return section;
}

// 1. Extract Smart Composite Rate Modal
const smartRateModal = extractSection('{/* SMART COMPOSITE RATE MODAL */}', '{/* --- MODAL 2: EXPANDED INVOICE ITEMS SHEET --- */}');

// 2. Extract Expanded Invoice Items Sheet Modal
const itemsSheetModal = extractSection('{/* --- MODAL 2: EXPANDED INVOICE ITEMS SHEET --- */}', '{/* --- MODAL 3: PDF VISIBLE FIELDS CUSTOMIZER --- */}');

// 3. Extract PDF Visible Fields Customizer
const pdfFieldsModal = extractSection('{/* --- MODAL 3: PDF VISIBLE FIELDS CUSTOMIZER --- */}', '{/* DYNAMIC ELEVEN-STAR PREVIEW MODAL OVERLAY */}');

// 4. Extract Preview Modal Overlay
const previewModal = extractSection('{/* DYNAMIC ELEVEN-STAR PREVIEW MODAL OVERLAY */}', '{/* --- MOBILE STICKY BOTTOM ACTION BAR (PHASE 3) --- */}');

console.log('Smart Rate:', smartRateModal ? smartRateModal.length : 'Not found');
console.log('Items Sheet:', itemsSheetModal ? itemsSheetModal.length : 'Not found');
console.log('PDF Fields:', pdfFieldsModal ? pdfFieldsModal.length : 'Not found');
console.log('Preview Modal:', previewModal ? previewModal.length : 'Not found');

// Let's create a directory for invoice components
const componentsDir = path.join(__dirname, 'src/components/invoice');
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

