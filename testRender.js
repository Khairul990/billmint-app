import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import React from 'react';
import { renderToString } from 'react-dom/server';
import CreateInvoice from 'e:/Billmint/src/pages/CreateInvoice.jsx';

const testRender = () => {
  try {
    const html = renderToString(React.createElement(CreateInvoice, {
      invoices: [],
      customers: [],
      products: [],
      businessSettings: { currency: '$', defaultBillingTemplate: 'retail' }
    }));
    console.log('SUCCESS: Rendered successfully, length:', html.length);
  } catch (err) {
    console.error('ERROR during render:', err);
  }
};

testRender();
