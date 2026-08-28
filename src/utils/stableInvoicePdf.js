import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';

let exporting = false;
const EXPORT_TIMEOUT_MS = 30000;
const MAX_CAPTURE_WIDTH = 2200;

const safeFilename = (value) => String(value ?? '000').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || '000';

const withTimeout = (promise, ms, message) => {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const getExportTarget = (targetElement) => {
  if (targetElement instanceof HTMLElement) return targetElement;
  const target = document.getElementById('invoice-preview-capture');
  if (target instanceof HTMLElement) return target;
  throw new Error('Invoice preview is not available for export.');
};

const waitForAssets = async (root) => {
  if (document.fonts?.ready) { try { await document.fonts.ready; } catch {} }
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

const renderExactPreview = async (root) => {
  await waitForAssets(root);
  const width = Math.max(root.scrollWidth, root.offsetWidth, root.clientWidth);
  const height = Math.max(root.scrollHeight, root.offsetHeight, root.clientHeight);
  if (!width || !height) throw new Error('Invoice preview has no printable content.');

  // Export only the already-rendered template. No invoice design is recreated.
  // Bound raster width to prevent mobile/large-invoice memory spikes.
  const scale = Math.min(2, Math.max(1, MAX_CAPTURE_WIDTH / Math.max(width, 1)));
  return withTimeout(html2canvas(root, {
    scale,
    useCORS: true,
    allowTaint: false,
    backgroundColor: '#ffffff',
    imageTimeout: 6000,
    logging: false,
    scrollX: 0,
    scrollY: -window.scrollY,
    width,
    height,
    windowWidth: Math.max(document.documentElement.clientWidth, width),
    windowHeight: Math.max(document.documentElement.clientHeight, height),
    removeContainer: true,
  }), EXPORT_TIMEOUT_MS, 'Export timed out. Please try again.');
};

const canvasToPdfBlob = (canvas) => {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pagePixelHeight = Math.max(1, Math.floor(canvas.width * (pageHeight / pageWidth)));

  for (let sourceY = 0, page = 0; sourceY < canvas.height; sourceY += pagePixelHeight, page += 1) {
    const sourceHeight = Math.min(pagePixelHeight, canvas.height - sourceY);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;
    const ctx = pageCanvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('PDF canvas could not be created.');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
    if (page > 0) pdf.addPage();
    const image = pageCanvas.toDataURL('image/jpeg', 0.88);
    pdf.addImage(image, 'JPEG', 0, 0, pageWidth, (sourceHeight / canvas.width) * pageWidth, undefined, 'FAST');
    pageCanvas.width = 1;
    pageCanvas.height = 1;
  }
  return pdf.output('blob');
};

const downloadBlob = (blob, filename) => {
  if (!(blob instanceof Blob) || blob.size < 100) throw new Error('Export produced an empty file.');
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
};

export const generateInvoicePdfBlob = async (invoice, businessSettings = {}, targetElement = null) => {
  if (!invoice) throw new Error('Invoice data is missing.');
  const canvas = await renderExactPreview(getExportTarget(targetElement));
  return canvasToPdfBlob(canvas);
};

export const generateInvoiceImageBlob = async (invoice, targetElement = null, format = 'image/png') => {
  if (!invoice) throw new Error('Invoice data is missing.');
  const canvas = await renderExactPreview(getExportTarget(targetElement));
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, format === 'image/jpeg' ? 0.94 : undefined));
  if (!blob) throw new Error('Image export failed.');
  return blob;
};

export const downloadStableInvoicePDF = async (invoice, businessSettings = {}, targetElement = null) => {
  if (!invoice || exporting) return false;
  exporting = true;
  const toastId = toast.loading('Preparing your invoice PDF…');
  try {
    const blob = await generateInvoicePdfBlob(invoice, businessSettings, targetElement);
    downloadBlob(blob, `Invoice_${safeFilename(invoice?.invoiceNumber || invoice?.number || '000')}.pdf`);
    toast.dismiss(toastId);
    toast.success('PDF downloaded');
    return true;
  } catch (error) {
    console.error('Invoice PDF export failed:', error);
    toast.dismiss(toastId);
    toast.error(error?.message || 'PDF তৈরি করা যায়নি।');
    return false;
  } finally { exporting = false; }
};

export const downloadInvoiceImage = async (invoice, targetElement = null, format = 'image/png') => {
  if (!invoice || exporting) return false;
  exporting = true;
  const toastId = toast.loading('Preparing invoice image…');
  try {
    const blob = await generateInvoiceImageBlob(invoice, targetElement, format);
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
    downloadBlob(blob, `Invoice_${safeFilename(invoice?.invoiceNumber || invoice?.number || '000')}.${ext}`);
    toast.dismiss(toastId);
    toast.success('Invoice image downloaded');
    return true;
  } catch (error) {
    console.error('Invoice image export failed:', error);
    toast.dismiss(toastId);
    toast.error(error?.message || 'Image তৈরি করা যায়নি।');
    return false;
  } finally { exporting = false; }
};

export default downloadStableInvoicePDF;
