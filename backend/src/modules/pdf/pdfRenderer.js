/**
 * Server-Side Pure Node.js PDF Document Generator.
 * Produces clean, valid PDF binary byte streams without external binary or Chromium dependencies.
 */

export class PdfRenderer {
  /**
   * Generates a valid PDF buffer from canonical invoice snapshot.
   */
  static async renderInvoicePdf(invoiceData = {}) {
    const inv = invoiceData.invoice || {};
    const fin = invoiceData.financials || {};
    const cust = invoiceData.customer || {};
    const biz = invoiceData.business || {};
    const items = invoiceData.items || [];
    const template = invoiceData.presentation?.selectedTemplate || inv.selectedTemplate || 'modern';

    // Build text lines
    const title = `${biz.name || 'BILLQYRO INVOICE'}`.toUpperCase();
    const invNum = `Invoice #: ${inv.invoiceNumber || 'INV-0000'}`;
    const invDate = `Date: ${inv.date || 'N/A'}`;
    const invDue = inv.dueDate ? `Due Date: ${inv.dueDate}` : '';
    const custName = `Billed To: ${cust.name || 'Valued Customer'}`;
    const custAddr = cust.address ? `Address: ${cust.address}` : '';

    let itemsText = 'ITEM DETAILS:\n';
    items.forEach((item, idx) => {
      const line = `${idx + 1}. ${item.name} | Qty: ${item.quantity} x ${biz.currencySymbol || '₹'}${item.rate} = ${biz.currencySymbol || '₹'}${item.totalAmount}`;
      itemsText += `   ${line}\n`;
    });

    const summaryText = `\nFINANCIAL SUMMARY:\n   Subtotal: ${biz.currencySymbol || '₹'}${fin.subtotal || 0}\n   Tax: ${biz.currencySymbol || '₹'}${fin.taxTotal || 0}\n   Discount: ${biz.currencySymbol || '₹'}${fin.discountTotal || 0}\n   Grand Total: ${biz.currencySymbol || '₹'}${fin.grandTotal || 0}\n   Amount Paid: ${biz.currencySymbol || '₹'}${fin.amountPaid || 0}\n   Balance Due: ${biz.currencySymbol || '₹'}${fin.balanceDue || 0}\n   Status: ${fin.status || inv.status || 'Unpaid'}`;

    const contentText = `${title}\n${invNum}\n${invDate}\n${invDue}\n\n${custName}\n${custAddr}\n\n${itemsText}${summaryText}\n\nTemplate: ${template}\nTerms: ${inv.terms || 'Thank you for your business!'}`;

    // Construct valid PDF 1.4 objects
    const streamContent = `BT\n/F1 12 Tf\n50 750 Td\n14 TL\n(${escapePdfString(contentText.split('\n').join(' ) T* ('))}) Tj\nET`;
    const streamLength = Buffer.byteLength(streamContent, 'utf8');

    const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
    const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
    const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n';
    const obj4 = `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
    const obj5 = '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

    const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    
    // Calculate byte offsets for XRef table
    let currentOffset = Buffer.byteLength(header, 'utf8');
    const offsets = [currentOffset];

    currentOffset += Buffer.byteLength(obj1, 'utf8');
    offsets.push(currentOffset);

    currentOffset += Buffer.byteLength(obj2, 'utf8');
    offsets.push(currentOffset);

    currentOffset += Buffer.byteLength(obj3, 'utf8');
    offsets.push(currentOffset);

    currentOffset += Buffer.byteLength(obj4, 'utf8');
    offsets.push(currentOffset);

    currentOffset += Buffer.byteLength(obj5, 'utf8');

    const xrefOffset = currentOffset;
    let xref = `xref\n0 6\n0000000000 65535 f \n`;
    offsets.forEach(offset => {
      xref += `${String(offset).padStart(10, '0')} 00000 n \n`;
    });

    const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

    const pdfString = header + obj1 + obj2 + obj3 + obj4 + obj5 + xref + trailer;
    const pdfBuffer = Buffer.from(pdfString, 'utf8');

    // Self-Validation Check
    this.validatePdfBuffer(pdfBuffer);

    return pdfBuffer;
  }

  /**
   * Validates that the buffer is a conforming, non-empty PDF document.
   */
  static validatePdfBuffer(buffer) {
    if (!Buffer.isBuffer(buffer)) {
      throw new TypeError('PDF output must be a valid Buffer.');
    }
    if (buffer.length < 100) {
      throw new Error('PDF output buffer is suspiciously small (< 100 bytes).');
    }
    const signature = buffer.subarray(0, 5).toString('ascii');
    if (signature !== '%PDF-') {
      throw new Error(`Invalid PDF signature. Expected '%PDF-', got '${signature}'.`);
    }
    const tail = buffer.subarray(buffer.length - 12).toString('ascii');
    if (!tail.includes('%%EOF')) {
      throw new Error("Invalid PDF format. Missing '%%EOF' trailer marker.");
    }
    return true;
  }
}

function escapePdfString(str) {
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}
