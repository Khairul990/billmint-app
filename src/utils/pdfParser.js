import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Set up the worker for pdfjs using local file
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export const extractTextFromPdf = async (file) => {
  return new Promise((resolve, reject) => {
    const fileReader = new FileReader();
    fileReader.onload = async function() {
      try {
        const typedarray = new Uint8Array(this.result);
        const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
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
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const fullLowerText = text.toLowerCase();

    // 1. Try to find Invoice Number
    let invoiceNumber = 'INV-' + Date.now().toString().slice(-6);
    const invRegex = /(?:invoice(?:\s+no\.?|\s+#|-)|bill(?:\s+no\.?|\s+#|-))\s*([a-z0-9-]+)/i;
    const invMatch = fullLowerText.match(invRegex);
    if (invMatch && invMatch[1]) {
      invoiceNumber = invMatch[1].toUpperCase();
    }

    // 2. Try to find Date
    let date = new Date().toISOString().split('T')[0];
    const dateRegex = /(?:date|dated)[\s:-]*([\d]{1,2}[-/.\\][\d]{1,2}[-/.\\][\d]{2,4})/i;
    const dateMatch = fullLowerText.match(dateRegex);
    if (dateMatch && dateMatch[1]) {
      const parts = dateMatch[1].replace(/\./g, '-').replace(/\//g, '-').split('-');
      // Try to construct YYYY-MM-DD
      if (parts.length === 3) {
        let y = parts[2].length === 4 ? parts[2] : (parts[0].length === 4 ? parts[0] : null);
        if (y) {
          const m = parts[1].padStart(2, '0');
          const d = (parts[0] === y ? parts[2] : parts[0]).padStart(2, '0');
          const parsed = new Date(`${y}-${m}-${d}`);
          if (!isNaN(parsed.getTime())) date = parsed.toISOString().split('T')[0];
        }
      }
    }

    // 3. Try to find Total Amount
    let total = 0;
    const totalRegex = /(?:grand\s+total|total\s+amount|net\s+total|total)[\s:Rs₹.-]*([\d,]+(?:\.\d{1,2})?)/ig;
    let match;
    let maxTotal = 0;
    while ((match = totalRegex.exec(fullLowerText)) !== null) {
      const val = parseFloat(match[1].replace(/,/g, ''));
      if (val > maxTotal) maxTotal = val;
    }
    total = maxTotal > 0 ? maxTotal : 0;

    // 4. Try to find Customer Name (heuristic: lines before 'Invoice')
    let customerName = 'Imported Customer';
    const toIndex = fullLowerText.indexOf('to:');
    if (toIndex > -1) {
      const nextText = text.substring(toIndex + 3).trim().split('\n');
      if (nextText[0] && nextText[0].length > 2) customerName = nextText[0];
    } else if (lines.length > 2) {
      // Pick second or third line as possible name if no clear marker
      if (!lines[1].toLowerCase().includes('invoice') && lines[1].length > 3) customerName = lines[1];
    }

    // Construct draft invoice
    return {
      id: Date.now().toString(),
      invoiceNumber,
      date,
      dueDate: date,
      customerName,
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
      totals: { subtotal: total, discount: 0, tax: 0, total },
      grandTotal: total,
      amountPaid: 0,
      balanceDue: total,
      paymentStatus: 'Pending',
      paymentHistory: [],
      notes: 'Imported from PDF (Offline Parsing). Please review details.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPdfImport: true
    };
  } catch (err) {
    console.error('PDF Parse Error:', err);
    throw new Error('Failed to parse PDF: ' + (err.message || 'Unknown error'), { cause: err });
  }
};
