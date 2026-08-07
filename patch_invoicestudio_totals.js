import fs from 'fs';
let c = fs.readFileSync('src/pages/studios/InvoiceStudio.jsx', 'utf8');

c = c.replace(/totals: \{ subtotal: DUMMY_INVOICE\.subtotal, tax: DUMMY_INVOICE\.taxAmount, grandTotal: DUMMY_INVOICE\.grandTotal \}/g, `totals: { subtotal: DUMMY_INVOICE.subtotal, tax: DUMMY_INVOICE.taxAmount, discount: DUMMY_INVOICE.discountAmount, grandTotal: DUMMY_INVOICE.grandTotal }`);

fs.writeFileSync('src/pages/studios/InvoiceStudio.jsx', c);
console.log('Fixed DUMMY_INVOICE totals mapping in InvoiceStudio');
