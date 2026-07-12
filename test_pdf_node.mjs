import fs from 'fs';
import React from 'react';
import ReactPDF from '@react-pdf/renderer';

// Mocking required components and variables
const styles = { compactPage: {}, compactHeader: {}, table: {}, compactTableHeader: {} };
const dynamicFont = 'Helvetica';
const tableHeaderBg = '#ffffff';

const PDFInvoice = ({ invoice, businessSettings }) => {
  const extraCols = invoice?.settings?.extraColumns || businessSettings?.extraColumns || [];
  const extraColWidth = Math.min(8, Math.floor(24 / Math.max(1, extraCols.length)));
  const totalExtraWidth = extraCols.length * extraColWidth;
  const getDescWidth = (base) => `${Math.max(15, parseInt(base) - totalExtraWidth)}%`;
  
  return React.createElement(ReactPDF.Document, null,
    React.createElement(ReactPDF.Page, { size: "A5" },
      React.createElement(ReactPDF.View, null,
        invoice.items.map((item, idx) => 
          React.createElement(ReactPDF.View, { key: idx, style: { flexDirection: 'row' } },
            React.createElement(ReactPDF.Text, { style: { width: getDescWidth(40) } }, item.description || 'Test'),
            extraCols.map(c => 
              React.createElement(ReactPDF.Text, { key: c.id, style: { width: `${extraColWidth}%` } }, String(item[c.id] || '-'))
            )
          )
        )
      )
    )
  );
};

const invoice = {
  invoiceNumber: "100",
  date: "2026-07-12",
  items: [{ description: "Test item", col_1: 15, col_2: "Red" }],
  billType: "grocery",
  settings: {
    extraColumns: [{ id: "col_1", name: "Size" }, { id: "col_2", name: "Color" }]
  }
};

const settings = {
  businessName: "Test",
};

const doc = React.createElement(PDFInvoice, { invoice, businessSettings: settings, isPremium: true });

ReactPDF.render(doc, 'test.pdf')
  .then(() => console.log("SUCCESS"))
  .catch(err => console.error("ERROR:", err));
