/**
 * BillQyro Thermal POS Receipt Print Utility
 * Supports 80mm and 58mm Bluetooth & USB POS thermal receipt printers.
 */
import { formatCurrency } from './invoiceUtils';
import { calculateCanonicalInvoiceFinancials } from './invoiceMath';

export const printThermalReceipt = (invoice, businessSettings = {}, options = {}) => {
  if (!invoice) return;

  const paperWidth = options.paperWidth || businessSettings?.thermalPaperWidth || '80mm';
  const widthPx = paperWidth === '58mm' ? '210px' : '300px';

  const financials = calculateCanonicalInvoiceFinancials(invoice);
  const currency = invoice.currencySymbol || businessSettings?.currency || '₹';
  const bSettings = invoice.businessSnapshot || businessSettings || {};

  const businessName = bSettings.businessName || 'BillQyro Store';
  const businessAddress = bSettings.address || '';
  const businessPhone = bSettings.phone || '';
  const businessGst = bSettings.gstNumber || bSettings.taxId || '';

  const customerName = invoice.customerName || invoice.customer?.name || 'Cash Customer';
  const customerPhone = invoice.customerPhone || invoice.customer?.phone || '';
  const billNo = invoice.invoiceNumber || `BILL-${invoice.id || Date.now().toString().slice(-6)}`;
  const dateStr = invoice.date || new Date().toLocaleDateString('en-IN');
  const timeStr = invoice.time || new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const items = Array.isArray(invoice.items) ? invoice.items : [];

  // UPI payment string if bank details exist
  const upiId = bSettings.bankDetails?.upiId || bSettings.upiId || '';
  const upiPayUrl = upiId ? `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(businessName)}&am=${financials.grandTotal}&cu=INR` : '';

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8" />
      <title>Receipt - ${billNo}</title>
      <style>
        @page {
          size: ${paperWidth} auto;
          margin: 0;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        body {
          width: ${widthPx};
          margin: 0 auto;
          padding: 8px 6px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Courier New", Courier, monospace, system-ui;
          font-size: 11px;
          line-height: 1.3;
          color: #000;
          background: #fff;
        }
        .center { text-align: center; }
        .right { text-align: right; }
        .bold { font-weight: 800; }
        .b-name { font-size: 14px; font-weight: 900; margin-bottom: 2px; text-transform: uppercase; }
        .meta-line { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; }
        .divider {
          border-top: 1px dashed #000;
          margin: 6px 0;
        }
        .double-divider {
          border-top: 2px solid #000;
          margin: 6px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        th {
          border-top: 1px dashed #000;
          border-bottom: 1px dashed #000;
          padding: 3px 0;
          font-weight: 800;
          text-align: left;
        }
        td {
          padding: 2.5px 0;
          vertical-align: top;
        }
        .item-name { font-weight: 700; font-size: 10.5px; }
        .item-sub { font-size: 9px; color: #333; }
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 1.5px 0;
          font-size: 10.5px;
        }
        .grand-total {
          font-size: 13px;
          font-weight: 900;
          padding: 4px 0;
        }
        .footer-note {
          font-size: 9.5px;
          margin-top: 6px;
          text-align: center;
        }
        .qr-box {
          text-align: center;
          margin: 6px 0;
        }
        .qr-box img {
          width: 80px;
          height: 80px;
        }
      </style>
    </head>
    <body>
      <div class="center">
        <div class="b-name">${businessName}</div>
        ${businessAddress ? `<div style="font-size: 9.5px;">${businessAddress.replace(/\n/g, ', ')}</div>` : ''}
        ${businessPhone ? `<div style="font-size: 9.5px;">Ph: ${businessPhone}</div>` : ''}
        ${businessGst ? `<div style="font-size: 9.5px;">GSTIN: ${businessGst}</div>` : ''}
      </div>

      <div class="divider"></div>

      <div class="meta-line">
        <span>Receipt #: <b>${billNo}</b></span>
        <span>${dateStr} ${timeStr}</span>
      </div>
      <div class="meta-line">
        <span>Customer: <b>${customerName}</b></span>
        ${customerPhone ? `<span>${customerPhone}</span>` : ''}
      </div>

      <div class="divider"></div>

      <table>
        <thead>
          <tr>
            <th style="width: 50%;">ITEM</th>
            <th class="center" style="width: 20%;">QTY</th>
            <th class="right" style="width: 30%;">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => {
            const name = item.description || item.name || 'Item';
            const qty = item.qty || item.quantity || 1;
            const rate = item.rate || item.unitPrice || 0;
            const amt = item.amount || (qty * rate) || 0;
            return `
              <tr>
                <td>
                  <div class="item-name">${name}</div>
                  <div class="item-sub">${qty} @ ${currency}${rate.toFixed(2)}</div>
                </td>
                <td class="center bold" style="vertical-align: middle;">${qty}</td>
                <td class="right bold" style="vertical-align: middle;">${currency}${amt.toFixed(2)}</td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>

      <div class="divider"></div>

      <div class="totals-row">
        <span>Subtotal:</span>
        <span class="bold">${currency}${financials.subtotal.toFixed(2)}</span>
      </div>

      ${financials.discountAmount > 0 ? `
        <div class="totals-row" style="color: #000;">
          <span>Discount:</span>
          <span class="bold">-${currency}${financials.discountAmount.toFixed(2)}</span>
        </div>
      ` : ''}

      ${financials.taxAmount > 0 ? `
        <div class="totals-row">
          <span>${bSettings?.taxLabel || 'Tax / GST'}${invoice.taxPercentage ? ` (${invoice.taxPercentage}%)` : ''}:</span>
          <span class="bold">${currency}${financials.taxAmount.toFixed(2)}</span>
        </div>
      ` : ''}

      ${financials.shipping > 0 ? `
        <div class="totals-row">
          <span>Shipping:</span>
          <span class="bold">${currency}${financials.shipping.toFixed(2)}</span>
        </div>
      ` : ''}

      <div class="double-divider"></div>

      <div class="totals-row grand-total">
        <span>TOTAL PAYABLE:</span>
        <span>${currency}${financials.grandTotal.toFixed(2)}</span>
      </div>

      ${financials.amountPaid > 0 ? `
        <div class="totals-row">
          <span>Amount Paid:</span>
          <span class="bold">${currency}${financials.amountPaid.toFixed(2)}</span>
        </div>
      ` : ''}

      ${financials.balanceDue > 0 ? `
        <div class="totals-row" style="font-weight: 800;">
          <span>Balance Due:</span>
          <span>${currency}${financials.balanceDue.toFixed(2)}</span>
        </div>
      ` : ''}

      ${financials.previousDue > 0 ? `
        <div class="divider"></div>
        <div class="totals-row" style="font-size: 10px;">
          <span>Old Balance / Due:</span>
          <span class="bold">${currency}${financials.previousDue.toFixed(2)}</span>
        </div>
        <div class="totals-row" style="font-size: 11px; font-weight: 900;">
          <span>NET TOTAL BALANCE:</span>
          <span>${currency}${financials.customerTotalDue.toFixed(2)}</span>
        </div>
      ` : ''}

      ${upiId ? `
        <div class="divider"></div>
        <div class="qr-box">
          <div style="font-size: 9px; font-weight: 700; margin-bottom: 2px;">SCAN TO PAY VIA UPI</div>
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiPayUrl)}" alt="UPI QR" />
          <div style="font-size: 8.5px; color: #444; margin-top: 1px;">UPI ID: ${upiId}</div>
        </div>
      ` : ''}

      <div class="divider"></div>

      <div class="footer-note">
        ${bSettings.pdfFooter ? `<div>${bSettings.pdfFooter}</div>` : '<div>Thank you for your business!</div>'}
        <div style="font-size: 8px; color: #555; margin-top: 3px;">Powered by BillQyro POS</div>
      </div>
    </body>
    </html>
  `;

  doc.open();
  doc.write(html);
  doc.close();

  iframe.contentWindow.focus();
  setTimeout(() => {
    iframe.contentWindow.print();
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 2000);
  }, 300);
};

export default printThermalReceipt;
