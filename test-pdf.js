import React from 'react';
import { renderToFile } from '@react-pdf/renderer';
import { PdfTemplateLayouts } from './src/components/invoice-templates/pdf-layouts/PdfTemplateLayouts.jsx';
import { Document, Page } from '@react-pdf/renderer';

const testInvoice = {
  invoiceNumber: 'INV-001',
  date: '2023-10-25',
  customerName: 'Test Customer',
  items: [
    { name: 'Test Item', qty: 1, rate: 100, price: 100 }
  ],
  subtotal: 100,
  grandTotal: 100,
  selectedTemplate: 'MinimalClassicPdf'
};

const Layout = PdfTemplateLayouts['MinimalClassicPdf'];
const doc = React.createElement(Document, null, 
  React.createElement(Page, { size: 'A4' }, 
    React.createElement(Layout, { invoice: testInvoice, businessSettings: {} })
  )
);

renderToFile(doc, 'test.pdf').then(() => {
  console.log('PDF rendered successfully!');
}).catch(err => {
  console.error('Error rendering PDF:', err);
});
