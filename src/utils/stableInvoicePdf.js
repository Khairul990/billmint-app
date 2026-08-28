import React from 'react';
import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';
import InvoicePreview from '../components/InvoicePreview';

let exporting = false;
const EXPORT_TIMEOUT_MS = 30000;
const MAX_CAPTURE_WIDTH = 2200;
const MAX_CAPTURE_HEIGHT = 30000;

const safeFilename = (value) => String(value ?? '000').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80) || '000';

const withTimeout = (promise, ms, message) => {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

const nextPaint = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

const findPreviewRoot = (container) => {
  if (container instanceof HTMLElement && container.id === 'invoice-preview-capture') return container;
  return container?.querySelector?.('#invoice-preview-capture') || null;
};

const mountTemporaryInvoicePreview = async (invoice, businessSettings) => {
  const host = document.createElement('div');
  host.setAttribute('data-invoice-export-host', 'true');
  Object.assign(host.style, {
    position: 'fixed', left: '-100000px', top: '0', width: '794px', minHeight: '1123px',
    background: '#ffffff', pointerEvents: 'none', zIndex: '-2147483647',
  });
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(React.createElement(InvoicePreview, { invoice, businessSettings, isPreviewMode: true }));
  await withTimeout((async () => {
    for (let i = 0; i < 100; i += 1) {
      const target = findPreviewRoot(host);
      if (target) return target;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error('Invoice preview could not be prepared for export.');
  })(), 6000, 'Invoice preview could not be prepared for export.');
  await nextPaint();

  const target = findPreviewRoot(host);
  return {
    target,
    cleanup: () => { try { root.unmount(); } catch {} host.remove(); },
  };
};

const getExportTarget = async (invoice, businessSettings, targetElement) => {
  const explicit = targetElement instanceof HTMLElement ? findPreviewRoot(targetElement) : null;
  if (explicit) return { target: explicit, cleanup: () => {} };

  // Mount dedicated invoice preview container to ensure exact template and data matching
  return mountTemporaryInvoicePreview(invoice, businessSettings);
};

const waitForAssets = async (root) => {
  if (document.fonts?.ready) { try { await document.fonts.ready; } catch {} }
  const images = Array.from(root.querySelectorAll('img'));
  await Promise.all(images.map((img) => {
    if (!img.src || img.complete) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => { img.removeEventListener('load', done); img.removeEventListener('error', done); resolve(); };
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    });
  }));
};

const sanitizeClonedColors = (clonedDocument) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const toRgb = (colorStr) => {
    if (!colorStr || typeof colorStr !== 'string') return colorStr;
    if (!colorStr.includes('color(') && !colorStr.includes('oklch') && !colorStr.includes('color-mix') && !colorStr.includes('lab(')) {
      return colorStr;
    }
    try {
      ctx.fillStyle = '#000000';
      ctx.fillStyle = colorStr;
      return ctx.fillStyle;
    } catch {
      return '#000000';
    }
  };

  const sanitizeColorText = (val) => {
    if (!val || typeof val !== 'string') return val;
    return val
      .replace(/color\([^)]+\)/g, (match) => toRgb(match))
      .replace(/oklch\([^)]+\)/g, (match) => toRgb(match))
      .replace(/color-mix\([^)]+\)/g, (match) => toRgb(match))
      .replace(/lab\([^)]+\)/g, (match) => toRgb(match));
  };

  const colorProps = [
    'color', 'backgroundColor', 'borderColor',
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'outlineColor', 'fill', 'stroke'
  ];

  const allElements = clonedDocument.querySelectorAll('*');
  allElements.forEach((node) => {
    if (!(node instanceof HTMLElement || node instanceof SVGElement)) return;
    try {
      const computed = window.getComputedStyle(node);
      colorProps.forEach((prop) => {
        const val = computed[prop];
        if (val && (val.includes('color(') || val.includes('oklch') || val.includes('color-mix') || val.includes('lab('))) {
          node.style[prop] = toRgb(val);
        }
      });
      if (computed.boxShadow && (computed.boxShadow.includes('color(') || computed.boxShadow.includes('oklch'))) {
        node.style.boxShadow = sanitizeColorText(computed.boxShadow);
      }
    } catch {}
  });
};

const renderExactPreview = async (root) => {
  await waitForAssets(root);
  await nextPaint();
  const width = Math.max(root.scrollWidth, root.offsetWidth, root.clientWidth, 794);
  const height = Math.max(root.scrollHeight, root.offsetHeight, root.clientHeight, 1123);
  if (!width || !height) throw new Error('Invoice preview has no printable content.');

  const exportClass = 'billqyro-export-freeze';
  root.classList.add(exportClass);
  const style = document.createElement('style');
  style.textContent = `
    .${exportClass}, .${exportClass} * { animation: none !important; transition: none !important; caret-color: transparent !important; }
    .${exportClass} img { max-width: 100%; object-fit: contain; }
  `;
  root.appendChild(style);

  try {
    return await withTimeout(html2canvas(root, {
      scale: 2, // Crisp 2x retina print resolution
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      imageTimeout: 8000,
      logging: false,
      scrollX: 0,
      scrollY: 0,
      width: Math.min(width, 850),
      windowWidth: 1200, // Forces full desktop layout and grid/flex alignment
      removeContainer: true,
      onclone: (clonedDocument) => {
        sanitizeClonedColors(clonedDocument);
        const clonedRoot = clonedDocument.querySelector('#invoice-preview-capture');
        if (clonedRoot) {
          clonedRoot.style.width = '794px';
          clonedRoot.style.minHeight = '1123px';
          clonedRoot.querySelectorAll('*').forEach((node) => {
            if (node instanceof HTMLElement) {
              node.style.animation = 'none';
              node.style.transition = 'none';
            }
          });
        }
      },
    }), EXPORT_TIMEOUT_MS, 'PDF/image export timed out. Please try again.');
  } finally { style.remove(); root.classList.remove(exportClass); }
};

const canvasToPdfBlob = (canvas) => {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const pagePixelHeight = Math.max(1, Math.floor(canvas.width * (pageHeight / pageWidth)));

  for (let sourceY = 0, page = 0; sourceY < canvas.height; sourceY += pagePixelHeight, page += 1) {
    const sourceHeight = Math.min(pagePixelHeight, canvas.height - sourceY);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width; pageCanvas.height = sourceHeight;
    const ctx = pageCanvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('PDF canvas could not be created.');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);
    if (page > 0) pdf.addPage();
    const image = pageCanvas.toDataURL('image/jpeg', 0.88);
    pdf.addImage(image, 'JPEG', 0, 0, pageWidth, (sourceHeight / canvas.width) * pageWidth, undefined, 'FAST');
    pageCanvas.width = 1; pageCanvas.height = 1;
  }

  const blob = pdf.output('blob');
  if (!(blob instanceof Blob) || blob.size < 1000) throw new Error('PDF generation produced an invalid file.');
  return blob;
};

const validateBlob = async (blob, type) => {
  if (!(blob instanceof Blob) || blob.size < 100) throw new Error('Export produced an empty file.');
  if (type === 'pdf') {
    const header = await blob.slice(0, 5).text();
    if (header !== '%PDF-') throw new Error('Generated PDF is invalid.');
  }
  return blob;
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url; link.download = filename; link.rel = 'noopener'; link.style.display = 'none';
    document.body.appendChild(link); link.click(); link.remove();
  } finally { setTimeout(() => URL.revokeObjectURL(url), 15000); }
};

export const generateInvoicePdfBlob = async (invoice, businessSettings = {}, targetElement = null) => {
  if (!invoice) throw new Error('Invoice data is missing.');
  const session = await getExportTarget(invoice, businessSettings, targetElement);
  try { return await validateBlob(canvasToPdfBlob(await renderExactPreview(session.target)), 'pdf'); }
  finally { session.cleanup(); }
};

export const generateInvoiceImageBlob = async (invoice, businessSettings = {}, targetElement = null, format = 'image/png') => {
  if (!invoice) throw new Error('Invoice data is missing.');
  const session = await getExportTarget(invoice, businessSettings, targetElement);
  try {
    const canvas = await renderExactPreview(session.target);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, format === 'image/jpeg' ? 0.94 : undefined));
    return await validateBlob(blob, 'image');
  } finally { session.cleanup(); }
};

export const downloadStableInvoicePDF = async (invoice, businessSettings = {}, targetElement = null) => {
  if (!invoice || exporting) return false;
  exporting = true;
  const toastId = toast.loading('Preparing your invoice PDF…');
  try {
    const blob = await generateInvoicePdfBlob(invoice, businessSettings, targetElement);
    downloadBlob(blob, `Invoice_${safeFilename(invoice?.invoiceNumber || invoice?.number || '000')}.pdf`);
    toast.dismiss(toastId); toast.success('PDF downloaded'); return true;
  } catch (error) {
    console.error('Invoice PDF export failed:', error); toast.dismiss(toastId);
    toast.error(error?.message || 'PDF তৈরি করা যায়নি।'); return false;
  } finally { exporting = false; }
};

export const downloadInvoiceImage = async (invoice, businessSettings = {}, targetElement = null, format = 'image/png') => {
  if (!invoice || exporting) return false;
  exporting = true;
  const toastId = toast.loading('Preparing invoice image…');
  try {
    const blob = await generateInvoiceImageBlob(invoice, businessSettings, targetElement, format);
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
    downloadBlob(blob, `Invoice_${safeFilename(invoice?.invoiceNumber || invoice?.number || '000')}.${ext}`);
    toast.dismiss(toastId); toast.success('Invoice image downloaded'); return true;
  } catch (error) {
    console.error('Invoice image export failed:', error); toast.dismiss(toastId);
    toast.error(error?.message || 'Image তৈরি করা যায়নি।'); return false;
  } finally { exporting = false; }
};

export default downloadStableInvoicePDF;
