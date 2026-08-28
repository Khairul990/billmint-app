import { jsPDF } from 'jspdf';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';
import { calculateCanonicalInvoiceFinancials } from './invoiceMath';
import { getTemplateLayoutFamily } from '../services/TemplateEngine';

let generating = false;

const clean = (value, fallback = '') => {
  if (value == null) return fallback;
  const text = String(value).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '').trim();
  return text || fallback;
};

const money = (value, currency = 'INR') => {
  const amount = Number(value) || 0;
  const symbol = currency === 'INR' ? 'Rs.' : currency === 'USD' ? '$' : currency === 'EUR' ? 'EUR' : currency;
  return `${symbol} ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const resolveTemplate = (invoice, settings) => {
  const raw = clean(
    invoice?.selectedTemplate || invoice?.pdfTemplate || settings?.selectedPdfTemplate || settings?.defaultBillingTemplate,
    'classic'
  ).toLowerCase();
  return { raw, family: getTemplateLayoutFamily(raw) || 'classic' };
};

const normalize = (invoice, settings = {}) => {
  const items = Array.isArray(invoice?.items) ? invoice.items : [];
  const normalizedItems = items.map((item, index) => {
    const qty = Number(item?.qty ?? item?.quantity ?? 1) || 0;
    const rate = Number(item?.rate ?? item?.price ?? item?.unitPrice ?? 0) || 0;
    const discount = Number(item?.discount ?? 0) || 0;
    const amount = Number(item?.amount ?? item?.total ?? (qty * rate - discount)) || 0;
    return {
      name: clean(item?.name || item?.description || item?.itemService || item?.title, `Item ${index + 1}`),
      qty, rate, discount, amount,
      designNo: clean(item?.designNo),
      workType: clean(item?.workType),
      size: clean(item?.size),
    };
  });

  return {
    invoice,
    settings,
    items: normalizedItems,
    businessName: clean(settings?.businessName || settings?.name, 'BillQyro Business'),
    customerName: clean(invoice?.customerName || invoice?.customer?.name || invoice?.client?.name, 'Walk-in Customer'),
    customerPhone: clean(invoice?.customerPhone || invoice?.customer?.phone || invoice?.client?.phone),
    customerEmail: clean(invoice?.customerEmail || invoice?.customer?.email || invoice?.client?.email),
    customerAddress: clean(invoice?.customerAddress || invoice?.customer?.address || invoice?.client?.address),
    invoiceNumber: clean(invoice?.invoiceNumber || invoice?.number, '000'),
    date: clean(invoice?.invoiceDate || invoice?.date || invoice?.createdAt, new Date().toLocaleDateString('en-IN')),
    dueDate: clean(invoice?.dueDate),
    currency: settings?.currencyCode || invoice?.currencyCode || 'INR',
  };
};

const themeFor = (family, raw) => {
  if (raw === 'cartoon' || family === 'modern') return { dark: '#10182d', accent: '#00a889', soft: '#eef8f5', text: '#253047', headerText: '#ffffff' };
  if (family === 'gold') return { dark: '#111827', accent: '#d4a84f', soft: '#faf6ea', text: '#252525', headerText: '#f8e8bd' };
  if (family === 'corporate') return { dark: '#0f3d35', accent: '#059669', soft: '#eef8f4', text: '#25332f', headerText: '#ffffff' };
  if (family === 'minimal') return { dark: '#ffffff', accent: '#111111', soft: '#f7f7f7', text: '#111111', headerText: '#111111' };
  if (family === 'retail') return { dark: '#111827', accent: '#eab308', soft: '#fffbea', text: '#26303d', headerText: '#ffffff' };
  if (family === 'repair') return { dark: '#451a03', accent: '#f97316', soft: '#fff7ed', text: '#332015', headerText: '#ffffff' };
  if (raw === 'embroidery') return { dark: '#26132a', accent: '#ec4899', soft: '#fff1f8', text: '#302234', headerText: '#ffffff' };
  if (raw === 'doctor' || raw === 'medical') return { dark: '#064e3b', accent: '#10b981', soft: '#ecfdf5', text: '#18362e', headerText: '#ffffff' };
  if (raw === 'tailor') return { dark: '#1e1b4b', accent: '#6366f1', soft: '#eef2ff', text: '#27254b', headerText: '#ffffff' };
  if (raw === 'teacher') return { dark: '#064e3b', accent: '#10b981', soft: '#ecfdf5', text: '#18362e', headerText: '#ffffff' };
  return { dark: '#ffffff', accent: '#009678', soft: '#f3f8f7', text: '#25303a', headerText: '#25303a' };
};

const drawHeader = (doc, data, pageWidth, margin, theme) => {
  const darkHeader = theme.dark !== '#ffffff';
  const headerHeight = darkHeader ? 112 : 82;

  if (darkHeader) {
    doc.setFillColor(theme.dark);
    doc.roundedRect(margin, 28, pageWidth - margin * 2, headerHeight, 12, 12, 'F');
  }

  const left = margin + (darkHeader ? 16 : 0);
  const right = pageWidth - margin - (darkHeader ? 16 : 0);
  const top = darkHeader ? 48 : 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...(darkHeader ? hexRgb(theme.headerText) : [20, 35, 48]));
  doc.text(data.businessName, left, top);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...(darkHeader ? [190, 205, 215] : [100, 110, 120]));
  const address = clean(data.settings?.address);
  const phone = clean(data.settings?.phone);
  const email = clean(data.settings?.email);
  let metaY = top + 16;
  if (address) { doc.text(address, left, metaY, { maxWidth: 270 }); metaY += 12; }
  if (phone) { doc.text(`Phone: ${phone}`, left, metaY); metaY += 12; }
  if (email) doc.text(email, left, metaY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...hexRgb(theme.accent));
  doc.text('INVOICE', right, top, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(...(darkHeader ? [210, 220, 225] : [80, 90, 100]));
  doc.text(`#${data.invoiceNumber}`, right, top + 16, { align: 'right' });
  doc.text(`Date: ${data.date}`, right, top + 29, { align: 'right' });
  if (data.dueDate) doc.text(`Due: ${data.dueDate}`, right, top + 42, { align: 'right' });

  const y = darkHeader ? 158 : 108;
  return y;
};

const hexRgb = (hex) => {
  const h = String(hex || '').replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  if (!Number.isFinite(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const drawCustomer = (doc, data, margin, y, pageWidth, theme) => {
  const width = pageWidth - margin * 2;
  doc.setFillColor(...hexRgb(theme.soft));
  doc.roundedRect(margin, y, width, 64, 6, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...hexRgb(theme.accent));
  doc.text('BILLED TO', margin + 12, y + 16);
  doc.setFontSize(12);
  doc.setTextColor(...hexRgb(theme.text));
  doc.text(data.customerName, margin + 12, y + 33);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(90, 100, 110);
  const details = [data.customerPhone, data.customerEmail, data.customerAddress].filter(Boolean).join('  |  ');
  if (details) doc.text(details, margin + 12, y + 48, { maxWidth: width - 24 });
  return y + 82;
};

const drawTableHeader = (doc, margin, y, width, theme) => {
  doc.setFillColor(...hexRgb(theme.accent));
  doc.roundedRect(margin, y, width, 26, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('ITEM / DESCRIPTION', margin + 8, y + 17);
  doc.text('QTY', margin + width - 190, y + 17, { align: 'right' });
  doc.text('RATE', margin + width - 120, y + 17, { align: 'right' });
  doc.text('AMOUNT', margin + width - 8, y + 17, { align: 'right' });
};

const drawPaymentQr = async (doc, data, financials, margin, y, pageWidth, theme) => {
  const bank = data.settings?.invoiceBuilderSettings?.bankDetails || {};
  const upiId = bank?.upiId || data.settings?.upiId || invoiceValue(data.invoice, 'upiId');
  const enabled = bank?.showQr ?? data.settings?.paymentQrEnabled ?? data.invoice?.paymentSettingsSnapshot?.paymentQrEnabled ?? false;
  if (!enabled || !upiId || Number(financials.balanceDue) <= 0) return y;

  const amount = Number(financials.balanceDue) || 0;
  const payee = data.settings?.payeeName || data.businessName;
  const currency = data.currency || 'INR';
  const payload = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payee)}&am=${amount}&cu=${currency}&tn=${encodeURIComponent(data.invoiceNumber)}`;

  try {
    const qr = await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 160 });
    const boxX = margin;
    const boxW = pageWidth - margin * 2;
    doc.setFillColor(250, 252, 252);
    doc.setDrawColor(225, 232, 232);
    doc.roundedRect(boxX, y, boxW, 112, 8, 8, 'FD');
    doc.addImage(qr, 'PNG', boxX + 14, y + 14, 82, 82);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...hexRgb(theme.accent));
    doc.text('SCAN TO PAY WITH UPI', boxX + 112, y + 28);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(90, 100, 110);
    doc.text(`UPI ID: ${upiId}`, boxX + 112, y + 47);
    doc.text(`Due Amount: ${money(amount, data.currency)}`, boxX + 112, y + 62);
    doc.text(`Invoice: ${data.invoiceNumber}`, boxX + 112, y + 77);
    return y + 130;
  } catch {
    return y;
  }
};

const invoiceValue = (invoice, key) => invoice?.[key] || invoice?.paymentSettingsSnapshot?.[key] || '';

const drawFooter = (doc, pageWidth, pageHeight, margin) => {
  const page = doc.internal.getNumberOfPages();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(145, 150, 155);
  doc.text('Generated by BillQyro', margin, pageHeight - 24);
  doc.text(`Page ${page}`, pageWidth - margin, pageHeight - 24, { align: 'right' });
};

export const generateInvoicePdfBlob = async (invoice, businessSettings = {}) => {
  if (!invoice) throw new Error('Invoice data is missing.');

  const { raw: templateId, family } = resolveTemplate(invoice, businessSettings);
  const theme = themeFor(family, templateId);
  const data = normalize(invoice, businessSettings);
  const financials = calculateCanonicalInvoiceFinancials(invoice);
  const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  let y = drawHeader(doc, data, pageWidth, margin, theme);
  y = drawCustomer(doc, data, margin, y, pageWidth, theme);
  drawTableHeader(doc, margin, y, contentWidth, theme);
  y += 26;

  data.items.forEach((item, index) => {
    const nameParts = [item.designNo, item.name, item.workType, item.size ? `Size: ${item.size}` : ''].filter(Boolean);
    const displayName = nameParts.join('  •  ');
    const nameLines = doc.splitTextToSize(displayName, contentWidth - 230);
    const rowHeight = Math.max(30, nameLines.length * 12 + 14);
    if (y + rowHeight > pageHeight - 125) {
      drawFooter(doc, pageWidth, pageHeight, margin);
      doc.addPage();
      y = 45;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...hexRgb(theme.text));
      doc.text(`Invoice #${data.invoiceNumber} — continued`, margin, y);
      y += 20;
      drawTableHeader(doc, margin, y, contentWidth, theme);
      y += 26;
    }

    if (index % 2 === 1) {
      doc.setFillColor(...hexRgb(theme.soft));
      doc.rect(margin, y, contentWidth, rowHeight, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...hexRgb(theme.text));
    doc.text(nameLines, margin + 8, y + 18);
    doc.text(String(item.qty), margin + contentWidth - 190, y + 18, { align: 'right' });
    doc.text(money(item.rate, data.currency), margin + contentWidth - 120, y + 18, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(money(item.amount, data.currency), margin + contentWidth - 8, y + 18, { align: 'right' });
    doc.setDrawColor(235, 238, 240);
    doc.line(margin, y + rowHeight, margin + contentWidth, y + rowHeight);
    y += rowHeight;
  });

  const totalsHeight = 132;
  if (y + totalsHeight > pageHeight - 180) {
    drawFooter(doc, pageWidth, pageHeight, margin);
    doc.addPage();
    y = 55;
  } else {
    y += 18;
  }

  const boxX = pageWidth - margin - 245;
  const boxW = 245;
  doc.setFillColor(...hexRgb(theme.soft));
  doc.roundedRect(boxX, y, boxW, totalsHeight, 5, 5, 'F');

  const line = (label, value, yy, bold = false, color = theme.text) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(bold ? 11 : 9);
    doc.setTextColor(...hexRgb(color));
    doc.text(label, boxX + 12, yy);
    doc.text(value, boxX + boxW - 12, yy, { align: 'right' });
  };

  line('Subtotal', money(financials.subtotal, data.currency), y + 23);
  if (financials.discountAmount) line('Discount', `- ${money(financials.discountAmount, data.currency)}`, y + 43, false, '#c0394b');
  if (financials.taxAmount) line('Tax', money(financials.taxAmount, data.currency), y + 63);
  if (financials.shipping) line('Shipping', money(financials.shipping, data.currency), y + 83);
  line('Grand Total', money(financials.currentInvoiceTotal, data.currency), y + 103, true);
  line('Paid', money(financials.amountPaid, data.currency), y + 123, false, theme.accent);

  y += totalsHeight + 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  if (financials.balanceDue > 0) {
    doc.setTextColor(205, 55, 70);
    doc.text(`Balance Due: ${money(financials.balanceDue, data.currency)}`, margin, y);
  } else {
    doc.setTextColor(...hexRgb(theme.accent));
    doc.text('PAID IN FULL', margin, y);
  }

  const payment = invoice?.paymentHistory?.length ? invoice.paymentHistory[invoice.paymentHistory.length - 1] : null;
  if (payment) {
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 105, 110);
    doc.text(`Latest payment: ${money(payment.amount, data.currency)}${payment.method ? ` via ${clean(payment.method)}` : ''}`, margin, y);
  }

  y += 18;
  await drawPaymentQr(doc, data, financials, margin, y, pageWidth, theme);
  drawFooter(doc, pageWidth, pageHeight, margin);
  return doc.output('blob');
};

export const downloadStableInvoicePDF = async (invoice, businessSettings = {}) => {
  if (!invoice || generating) return false;
  generating = true;
  const toastId = toast.loading('Generating PDF…');
  try {
    const blob = await generateInvoicePdfBlob(invoice, businessSettings);
    const url = URL.createObjectURL(blob);
    const number = clean(invoice?.invoiceNumber || '000').replace(/[^a-zA-Z0-9_-]/g, '_');
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${number}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast.dismiss(toastId);
    toast.success('PDF downloaded');
    return true;
  } catch (error) {
    toast.dismiss(toastId);
    console.error('Fast PDF generation failed:', error);
    toast.error(error?.message || 'PDF তৈরি করা যায়নি।');
    return false;
  } finally {
    generating = false;
  }
};

export default downloadStableInvoicePDF;
