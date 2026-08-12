import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const extractTextFromPdf = async (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument(typedarray).promise;
        let fullText = '';
        
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + '\n';
        }
        
        resolve(fullText);
      } catch (err) {
        reject(err);
      }
    };
    fileReader.onerror = function() {
      reject(new Error('Failed to read the PDF file'));
    };
    fileReader.readAsArrayBuffer(file);
  });
};

export const parseInvoiceFromPdf = async (file) => {
  try {
    const text = await extractTextFromPdf(file);
    
    // Very basic heuristic parser
    const lowerText = text.toLowerCase();
    
    // Attempt to extract total
    // Look for Total followed by some non-digits and then a number
    let total = 0;
    const totalRegex = /total[\s:]*[^\d]*([\d,]+(?:\.\d{2})?)/i;
    const totalMatch = text.match(totalRegex);
    if (totalMatch && totalMatch[1]) {
      total = parseFloat(totalMatch[1].replace(/,/g, ''));
    }

    // Attempt to extract date
    let date = new Date().toISOString().split('T')[0];
    const dateRegex = /date[\s:]*([\d]{2,4}[-/][\d]{1,2}[-/][\d]{1,4})/i;
    const dateMatch = text.match(dateRegex);
    if (dateMatch && dateMatch[1]) {
      // Try to parse the date, fallback to today if invalid
      const parsed = new Date(dateMatch[1]);
      if (!isNaN(parsed.getTime())) {
        date = parsed.toISOString().split('T')[0];
      }
    }

    // Attempt to extract invoice number
    let invoiceNumber = 'INV-' + Date.now().toString().slice(-6);
    const invNumRegex = /(?:invoice\s*no|invoice\s*#|inv-)[^\w\d]*([A-Za-z0-9-]+)/i;
    const invNumMatch = text.match(invNumRegex);
    if (invNumMatch && invNumMatch[1]) {
      invoiceNumber = invNumMatch[1].toUpperCase();
    }

    // Construct a draft invoice
    const draftInvoice = {
      id: Date.now().toString(),
      invoiceNumber: invoiceNumber,
      date: date,
      dueDate: date, // Default to same day
      customerName: 'Imported Customer',
      customerPhone: '',
      billingTarget: 'customer',
      items: [
        {
          id: Date.now().toString(),
          sNo: '1',
          name: 'Imported PDF Items',
          qty: 1,
          price: total || 0,
          amount: total || 0
        }
      ],
      totals: {
        subtotal: total || 0,
        discount: 0,
        tax: 0,
        total: total || 0
      },
      grandTotal: total || 0,
      amountPaid: 0,
      balanceDue: total || 0,
      paymentStatus: 'Pending',
      paymentHistory: [],
      notes: 'This invoice was automatically generated from a PDF. Please verify the details.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPdfImport: true // Flag to identify these later
    };

    return draftInvoice;
  } catch (err) {
    console.error('Error parsing PDF:', err);
    throw new Error('Failed to parse PDF. It might be a scanned image or corrupted.');
  }
};
