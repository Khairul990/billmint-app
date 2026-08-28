import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';

let generating = false;

const cleanFilename = (value) => {
  const safe = String(value ?? '000').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
  return safe || '000';
};

const waitForAssets = async (root) => {
  if (document.fonts?.ready) {
    try { await document.fonts.ready; } catch {}
  }
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(images.map((img) => {
    if (img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => { img.removeEventListener('load', done); img.removeEventListener('error', done); resolve(); };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }));
};

const findExportTarget = (targetElement) => {
  if (targetElement instanceof HTMLElement) return targetElement;
  const target = document.getElementById('invoice-preview-capture');
  if (target instanceof HTMLElement) return target;
  throw new Error('Invoice preview is not available for PDF export.');
};

const canvasToPdfBlob = async (canvas) => {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pagePixelHeight = Math.floor(canvas.width * (pageHeight / pageWidth));
  const pageCount = Math.max(1, Math.ceil(canvas.height / pagePixelHeight));

  for (let page = 0; page < pageCount; page += 1) {
    const sourceY = page * pagePixelHeight;
    const sourceHeight = Math.min(pagePixelHeight, canvas.height - sourceY);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;
    const ctx = pageCanvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('PDF canvas could not be created.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

    if (page > 0) pdf.addPage();
    const image = pageCanvas.toDataURL('image/jpeg', 0.96);
    const renderedHeight = (sourceHeight / canvas.width) * pageWidth;
    pdf.addImage(image, 'JPEG', 0, 0, pageWidth, renderedHeight, undefined, 'FAST');
    pageCanvas.width = 1;
    pageCanvas.height = 1;
  }

  return pdf.output('blob');
};

/**
 * IMPORTANT: PDF export intentionally does NOT recreate an invoice design.
 * It captures the already-rendered InvoicePreview DOM. Therefore the selected
 * BillQyro template, fields, spacing, branding, QR area and business layout
 * are exactly the same source used by the visible preview.
 */
export const generateInvoicePdfBlob = async (invoice, businessSettings = {}, targetElement = null) => {
  if (!invoice) throw new Error('Invoice data is missing.');
  const root = findExportTarget(targetElement);
  await waitForAssets(root);

  const width = Math.max(root.scrollWidth, root.offsetWidth);
  const height = Math.max(root.scrollHeight, root.offsetHeight);
  if (!width || !height) throw new Error('Invoice preview has no printable content.');

  const scale = Math.min(2, Math.max(1, 6000 / Math.max(width, height)));
  const canvas = await html2canvas(root, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    imageTimeout: 10000,
    logging: false,
    scrollX: 0,
    scrollY: -window.scrollY,
    width,
    height,
    windowWidth: Math.max(document.documentElement.clientWidth, width),
    windowHeight: Math.max(document.documentElement.clientHeight, height),
    removeContainer: true,
  });

  return canvasToPdfBlob(canvas);
};

export const downloadStableInvoicePDF = async (invoice, businessSettings = {}, targetElement = null) => {
  if (!invoice || generating) return false;
  generating = true;
  const toastId = toast.loading('Generating PDF…');
  try {
    const blob = await generateInvoicePdfBlob(invoice, businessSettings, targetElement);
    const url = URL.createObjectURL(blob);
    const number = cleanFilename(invoice?.invoiceNumber || invoice?.number || '000');
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${number}.pdf`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast.dismiss(toastId);
    toast.success('PDF downloaded');
    return true;
  } catch (error) {
    toast.dismiss(toastId);
    console.error('DOM-faithful PDF export failed:', error);
    toast.error(error?.message || 'PDF তৈরি করা যায়নি।');
    return false;
  } finally {
    generating = false;
  }
};

export default downloadStableInvoicePDF;
