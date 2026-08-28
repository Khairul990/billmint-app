import { toast } from 'react-hot-toast';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.js?url';
import { generateInvoicePdfBlob } from './stableInvoicePdf';

let exporting = false;
const BASE_SCALE = 2;
const MAX_WIDTH = 1800;
const MAX_HEIGHT = 30000;

const safeName = (value) => String(value || '000').replace(/[^a-zA-Z0-9_-]/g, '_');

const renderPdfToPng = async (blob) => {
  const arrayBuffer = await blob.arrayBuffer();
  const pdfjs = await import('pdfjs-dist/build/pdf');
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
  const pdfDoc = await loadingTask.promise;

  try {
    const pages = [];
    let maxWidth = 0;
    let totalHeight = 0;

    for (let pageNumber = 1; pageNumber <= pdfDoc.numPages; pageNumber += 1) {
      const page = await pdfDoc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: BASE_SCALE });
      pages.push({ page, width: viewport.width, height: viewport.height });
      maxWidth = Math.max(maxWidth, viewport.width);
      totalHeight += viewport.height;
    }

    if (!pages.length) throw new Error('PDF has no pages to export.');

    const fitScale = Math.min(
      1,
      MAX_WIDTH / maxWidth,
      MAX_HEIGHT / totalHeight
    );
    const canvasWidth = Math.max(1, Math.ceil(maxWidth * fitScale));
    const canvasHeight = Math.max(1, Math.ceil(totalHeight * fitScale));
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas is not available in this browser.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    let y = 0;
    for (const { page, width, height } of pages) {
      const viewport = page.getViewport({ scale: BASE_SCALE * fitScale });
      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = Math.max(1, Math.ceil(viewport.width));
      pageCanvas.height = Math.max(1, Math.ceil(viewport.height));
      const pageCtx = pageCanvas.getContext('2d', { alpha: false });
      await page.render({ canvasContext: pageCtx, viewport }).promise;
      ctx.drawImage(pageCanvas, 0, y, viewport.width, viewport.height);
      y += viewport.height;
      pageCanvas.width = 1;
      pageCanvas.height = 1;
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((png) => {
        canvas.width = 1;
        canvas.height = 1;
        if (png) resolve(png);
        else reject(new Error('PNG encoding failed.'));
      }, 'image/png');
    });
  } finally {
    try {
      await loadingTask.destroy();
    } catch {
      // Worker cleanup is best-effort.
    }
  }
};

export const downloadInvoiceImage = async (invoice, businessSettings = {}) => {
  if (!invoice || exporting) return false;
  exporting = true;
  const toastId = toast.loading('Preparing your template image...');

  try {
    const pdfBlob = await generateInvoicePdfBlob(invoice, businessSettings);
    const pngBlob = await renderPdfToPng(pdfBlob);
    const url = URL.createObjectURL(pngBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice_${safeName(invoice?.invoiceNumber)}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast.dismiss(toastId);
    toast.success('Invoice image downloaded successfully');
    return true;
  } catch (error) {
    toast.dismiss(toastId);
    console.error('Invoice image export failed:', error);
    toast.error(error?.message || 'Invoice image তৈরি করা যায়নি।');
    return false;
  } finally {
    exporting = false;
  }
};

export default downloadInvoiceImage;
