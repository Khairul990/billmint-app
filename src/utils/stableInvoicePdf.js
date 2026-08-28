import { toast } from 'react-hot-toast';
import { calculateCanonicalInvoiceFinancials } from './invoiceMath';

let generating = false;

const clean = (value, fallback = '-') => {
  const text = value == null ? fallback : String(value);
  return text
    .replace(/[₹৳]/g, (c) => (c === '₹' ? 'Rs. ' : 'Tk. '))
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '') || fallback;
};

const money = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
};

const pdfEscape = (value) => clean(value, '')
  .replace(/\\/g, '\\\\')
  .replace(/\(/g, '\\(')
  .replace(/\)/g, '\\)');

const wrap = (value, width) => {
  const words = pdfEscape(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    if (!line) line = word.slice(0, width);
    else if ((line.length + word.length + 1) <= width) line += ` ${word}`;
    else { lines.push(line); line = word.slice(0, width); }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
};

const makePdf = (pages) => {
  const objects = [];
  const add = (body) => { objects.push(body); return objects.length; };
  const font = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pagesId = add('');
  const pageIds = [];
  const contentIds = [];

  pages.forEach((lines) => {
    const commands = ['BT', '/F1 9 Tf', '40 800 Td', '13 TL'];
    lines.forEach((line, index) => {
      if (index > 0) commands.push('T*');
      commands.push(`(${pdfEscape(line)}) Tj`);
    });
    commands.push('ET');
    const stream = commands.join('\n');
    const content = add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    contentIds.push(content);
    pageIds.push(add(''));
  });

  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  pageIds.forEach((id, index) => {
    objects[id - 1] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`;
  });

  const catalog = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let output = '%PDF-1.4\n%\xFF\xFF\xFF\xFF\n';
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets[index + 1] = output.length;
    output += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = output.length;
  output += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i += 1) output += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  output += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([output], { type: 'application/pdf' });
};

const buildInvoice = (invoice, businessSettings = {}) => {
  const financials = calculateCanonicalInvoiceFinancials(invoice || {});
  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  const customer = invoice?.customer || invoice?.client || {};
  const currency = clean(businessSettings?.currencySymbol || invoice?.currencySymbol || 'Rs. ');
  const lines = [];
  const business = clean(businessSettings?.businessName || 'BillQyro Business');
  const number = clean(invoice?.invoiceNumber || invoice?.id || '000');
  const customerName = clean(customer?.name || invoice?.customerName || 'Customer');

  lines.push('BILLQYRO — INVOICE');
  lines.push(`Invoice No: ${number}`);
  lines.push(`Business: ${business}`);
  lines.push(`Bill To: ${customerName}`);
  if (customer?.phone || invoice?.customerPhone) lines.push(`Phone: ${clean(customer?.phone || invoice?.customerPhone)}`);
  lines.push(`Date: ${clean(invoice?.date || invoice?.createdAt || '')}    Status: ${clean(financials.status || invoice?.paymentStatus || 'Pending')}`);
  if (invoice?.dueDate) lines.push(`Due Date: ${clean(invoice.dueDate)}`);
  lines.push('');
  lines.push('ITEM / DESCRIPTION                 QTY        RATE        AMOUNT');
  lines.push('--------------------------------------------------------------------------');

  items.forEach((item, index) => {
    const qty = Number(item?.quantity ?? item?.qty ?? 1) || 0;
    const rate = Number(item?.rate ?? item?.price ?? item?.unitPrice ?? 0) || 0;
    const amount = Number(item?.amount ?? item?.total ?? qty * rate) || 0;
    const name = item?.description || item?.name || item?.title || `Item ${index + 1}`;
    const wrapped = wrap(name, 34);
    wrapped.forEach((description, lineIndex) => {
      if (lineIndex === 0) {
        lines.push(`${description.padEnd(34)} ${String(qty).padStart(8)} ${currency}${money(rate).padStart(10)} ${currency}${money(amount).padStart(11)}`);
      } else {
        lines.push(`  ${description}`);
      }
    });
  });

  lines.push('');
  lines.push(`Subtotal: ${currency}${money(financials.subtotal)}`);
  lines.push(`Discount: -${currency}${money(financials.discount)}`);
  lines.push(`Tax: ${currency}${money(financials.tax)}`);
  lines.push(`GRAND TOTAL: ${currency}${money(financials.grandTotal)}`);
  lines.push(`TOTAL PAID: ${currency}${money(financials.totalPaid)}`);
  lines.push(`BALANCE DUE: ${currency}${money(financials.balanceDue)}`);
  if (invoice?.paymentMethod) lines.push(`Payment Method: ${clean(invoice.paymentMethod)}`);
  if (invoice?.paymentNote) lines.push(`Payment Note: ${clean(invoice.paymentNote)}`);
  if (invoice?.notes) lines.push(`Notes: ${clean(invoice.notes)}`);
  lines.push('');
  lines.push('Generated by BillQyro — Smart Billing. Premium Invoicing Platform');

  const pages = [];
  const perPage = 54;
  for (let i = 0; i < lines.length; i += perPage) pages.push(lines.slice(i, i + perPage));
  return makePdf(pages.length ? pages : [['BillQyro Invoice']]);
};

export const downloadStableInvoicePDF = async (invoice, businessSettings = {}) => {
  if (!invoice || generating) return false;
  generating = true;
  const toastId = toast.loading('Generating your PDF...');
  try {
    const blob = buildInvoice(invoice, businessSettings);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${clean(invoice?.invoiceNumber || '000').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast.dismiss(toastId);
    toast.success('PDF downloaded successfully');
    return true;
  } catch (error) {
    toast.dismiss(toastId);
    console.error('Stable invoice PDF failed:', error);
    toast.error('PDF তৈরি করা যায়নি। আবার চেষ্টা করুন।');
    return false;
  } finally {
    generating = false;
  }
};

export default downloadStableInvoicePDF;
