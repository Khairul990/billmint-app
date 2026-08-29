import React from 'react';
import { createRoot } from 'react-dom/client';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'react-hot-toast';
import InvoicePreview from '../components/InvoicePreview';

let exporting = false;
const EXPORT_TIMEOUT_MS = 30000;
const A4_CSS_WIDTH = 794;
const A4_CSS_HEIGHT = 1123;
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
    position: 'fixed',
    left: '0px',
    top: '0px',
    width: `${A4_CSS_WIDTH}px`,
    minHeight: `${A4_CSS_HEIGHT}px`,
    background: '#ffffff',
    pointerEvents: 'none',
    zIndex: '-999999',
    opacity: '0.001',
  });
  document.body.appendChild(host);

  const root = createRoot(host);
  root.render(React.createElement(InvoicePreview, { invoice, businessSettings, isPreviewMode: true }));
  await withTimeout((async () => {
    for (let i = 0; i < 120; i += 1) {
      const target = findPreviewRoot(host);
      if (target && target.children.length > 0) return target;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    throw new Error('Invoice preview could not be prepared for export.');
  })(), 8000, 'Invoice preview could not be prepared for export.');
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

const imageToBase64 = async (img) => {
  if (!img.src || img.src.startsWith('data:')) return img.src;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width || 100;
    canvas.height = img.naturalHeight || img.height || 100;
    const ctx = canvas.getContext('2d');
    if (!ctx) return img.src;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return img.src;
  }
};

const sanitizeColorValue = (str) => {
  if (!str || typeof str !== 'string') return str;
  if (!str.includes('color(') && !str.includes('oklch') && !str.includes('color-mix') && !str.includes('lab(')) {
    return str;
  }
  return str
    .replace(/color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)/gi, (_, r, g, b, a) => {
      const red = Math.round(parseFloat(r) * 255);
      const green = Math.round(parseFloat(g) * 255);
      const blue = Math.round(parseFloat(b) * 255);
      return a !== undefined ? `rgba(${red}, ${green}, ${blue}, ${a})` : `rgb(${red}, ${green}, ${blue})`;
    })
    .replace(/color\([^)]+\)/gi, '#111827')
    .replace(/oklch\([^)]+\)/gi, '#111827')
    .replace(/color-mix\([^)]+\)/gi, '#111827')
    .replace(/lab\([^)]+\)/gi, '#111827');
};

const runWithSafeColorEnvironment = async (fn) => {
  const originalGetComputedStyle = window.getComputedStyle;
  const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;

  CSSStyleDeclaration.prototype.getPropertyValue = function(prop) {
    const val = originalGetPropertyValue.call(this, prop);
    return sanitizeColorValue(val);
  };

  window.getComputedStyle = function(el, pseudo) {
    const style = originalGetComputedStyle.call(window, el, pseudo);
    if (!style) return style;
    return new Proxy(style, {
      get(target, prop) {
        try {
          const originalVal = target[prop];
          if (typeof originalVal === 'function') {
            if (prop === 'getPropertyValue') {
              return function(name) {
                const v = target.getPropertyValue(name);
                return sanitizeColorValue(v);
              };
            }
            return originalVal.bind(target);
          }
          if (typeof originalVal === 'string') {
            return sanitizeColorValue(originalVal);
          }
          return originalVal;
        } catch {
          return target[prop];
        }
      }
    });
  };

  try {
    return await fn();
  } finally {
    window.getComputedStyle = originalGetComputedStyle;
    CSSStyleDeclaration.prototype.getPropertyValue = originalGetPropertyValue;
  }
};

const sanitizeClonedDocument = (clonedDocument, width) => {
  // 1. Sanitize all <style> elements in clonedDocument head to stop html2canvas parser crash
  try {
    const styleTags = clonedDocument.querySelectorAll('style');
    styleTags.forEach((style) => {
      if (style.textContent && (style.textContent.includes('color(') || style.textContent.includes('oklch') || style.textContent.includes('lab('))) {
        style.textContent = sanitizeColorValue(style.textContent);
      }
    });
  } catch {}

  // 2. Set strict document dimensions & font fallbacks
  if (clonedDocument.documentElement) {
    clonedDocument.documentElement.style.margin = '0';
    clonedDocument.documentElement.style.padding = '0';
    clonedDocument.documentElement.style.width = `${width}px`;
    clonedDocument.documentElement.style.background = '#ffffff';
  }
  if (clonedDocument.body) {
    clonedDocument.body.style.margin = '0';
    clonedDocument.body.style.padding = '0';
    clonedDocument.body.style.width = `${width}px`;
    clonedDocument.body.style.minWidth = `${width}px`;
    clonedDocument.body.style.maxWidth = `${width}px`;
    clonedDocument.body.style.background = '#ffffff';
    clonedDocument.body.style.color = '#111827';
    clonedDocument.body.style.fontFamily = "'Inter', 'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif";
  }

  const clonedHost = clonedDocument.querySelector('[data-invoice-export-host="true"]');
  if (clonedHost) {
    clonedHost.style.position = 'static';
    clonedHost.style.left = '0';
    clonedHost.style.top = '0';
    clonedHost.style.width = `${width}px`;
    clonedHost.style.margin = '0';
    clonedHost.style.padding = '0';
    clonedHost.style.opacity = '1';
    clonedHost.style.visibility = 'visible';
    clonedHost.style.zIndex = '1';
  }

  const clonedRoot = clonedDocument.querySelector('#invoice-preview-capture');
  if (clonedRoot) {
    clonedRoot.style.width = `${width}px`;
    clonedRoot.style.minWidth = `${width}px`;
    clonedRoot.style.maxWidth = `${width}px`;
    clonedRoot.style.margin = '0 auto';
    clonedRoot.style.boxSizing = 'border-box';
    clonedRoot.style.fontFamily = "'Inter', 'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif";
    clonedRoot.style.visibility = 'visible';
    clonedRoot.style.opacity = '1';
  }

  // 3. Sanitize inline and computed styles on all cloned nodes
  const colorProps = [
    'color', 'backgroundColor', 'borderColor',
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'outlineColor', 'fill', 'stroke'
  ];

  clonedDocument.querySelectorAll('*').forEach((node) => {
    if (!(node instanceof HTMLElement || node instanceof SVGElement)) return;
    try {
      node.style.animation = 'none';
      node.style.transition = 'none';

      colorProps.forEach((prop) => {
        const inlineVal = node.style[prop];
        if (inlineVal && (inlineVal.includes('color(') || inlineVal.includes('oklch') || inlineVal.includes('color-mix') || inlineVal.includes('lab('))) {
          node.style[prop] = sanitizeColorValue(inlineVal);
        }
      });

      if (node.style.boxShadow && (node.style.boxShadow.includes('color(') || node.style.boxShadow.includes('oklch'))) {
        node.style.boxShadow = sanitizeColorValue(node.style.boxShadow);
      }
    } catch {}
  });
};

const renderExactPreview = async (root) => {
  await waitForAssets(root);
  await nextPaint();
  const width = A4_CSS_WIDTH;
  const height = Math.max(root.scrollHeight, root.offsetHeight, root.clientHeight, A4_CSS_HEIGHT);
  if (!width || !height) throw new Error('Invoice preview has no printable content.');
  if (height > MAX_CAPTURE_HEIGHT) throw new Error('Invoice is too long to export safely.');

  const exportClass = 'billqyro-export-freeze';
  root.classList.add(exportClass);
  const style = document.createElement('style');
  style.textContent = `
    .${exportClass}, .${exportClass} * { 
      animation: none !important; 
      transition: none !important; 
      caret-color: transparent !important;
      font-family: 'Inter', 'Noto Sans Bengali', 'Hind Siliguri', system-ui, -apple-system, sans-serif !important;
      font-variant-ligatures: normal !important;
      font-feature-settings: normal !important;
      text-rendering: geometricPrecision !important;
      -webkit-font-smoothing: antialiased !important;
    }
    .${exportClass} img { max-width: 100%; object-fit: contain; }
  `;
  root.appendChild(style);

  try {
    return await runWithSafeColorEnvironment(async () => {
      return await withTimeout(html2canvas(root, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        imageTimeout: 10000,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: width,
        windowWidth: width,
        removeContainer: true,
        onclone: (clonedDocument) => {
          sanitizeClonedDocument(clonedDocument, width);
        },
      }), EXPORT_TIMEOUT_MS, 'PDF/image export timed out. Please try again.');
    });
  } finally {
    style.remove();
    root.classList.remove(exportClass);
  }
};

// Find safe page boundaries in CSS pixels so a PDF page never cuts through an invoice row/card.
const getSafeBreakPoints = (root, canvasWidth, canvasHeight) => {
  const scale = canvasWidth / A4_CSS_WIDTH;
  const pageCssHeight = A4_CSS_HEIGHT;
  const pagePixelHeight = Math.max(1, Math.floor(pageCssHeight * scale));
  if (canvasHeight <= pagePixelHeight) return [canvasHeight];

  const rootRect = root.getBoundingClientRect();
  const candidates = new Set([0, canvasHeight]);
  const selectors = [
    'tr',
    '[data-pdf-break]',
    'section',
    'article',
  ];

  selectors.forEach((selector) => {
    root.querySelectorAll(selector).forEach((node) => {
      const rect = node.getBoundingClientRect();
      const top = rect.top - rootRect.top;
      const bottom = rect.bottom - rootRect.top;
      if (top > 8 && bottom - top < pageCssHeight * 0.75) {
        candidates.add(Math.round(top * scale));
      }
    });
  });

  // Also consider substantial direct layout blocks. This covers the div-based templates.
  Array.from(root.children).forEach((node) => {
    const rect = node.getBoundingClientRect();
    const top = rect.top - rootRect.top;
    const bottom = rect.bottom - rootRect.top;
    if (top > 8 && bottom - top < pageCssHeight * 0.75) candidates.add(Math.round(top * scale));
  });

  const sorted = [...candidates].sort((a, b) => a - b);
  const breaks = [0];
  let current = 0;

  while (current < canvasHeight) {
    const ideal = Math.min(canvasHeight, current + pagePixelHeight);
    if (ideal >= canvasHeight) {
      breaks.push(canvasHeight);
      break;
    }

    const minAcceptable = current + Math.floor(pagePixelHeight * 0.55);
    const safe = sorted
      .filter((point) => point >= minAcceptable && point <= ideal)
      .sort((a, b) => Math.abs(ideal - a) - Math.abs(ideal - b))[0];

    // If there is no safe DOM boundary, keep the exact page boundary as a last resort.
    const next = safe && safe > current ? safe : ideal;
    breaks.push(next);
    current = next;
  }

  return breaks;
};

const canvasToPdfBlob = (canvas, root) => {
  const pdf = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const breaks = getSafeBreakPoints(root, canvas.width, canvas.height);

  for (let page = 0; page < breaks.length - 1; page += 1) {
    const sourceY = breaks[page];
    const nextY = breaks[page + 1];
    const sourceHeight = Math.max(1, nextY - sourceY);
    const pageCanvas = document.createElement('canvas');
    pageCanvas.width = canvas.width;
    pageCanvas.height = sourceHeight;
    const ctx = pageCanvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('PDF canvas could not be created.');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    ctx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

    if (page > 0) pdf.addPage();
    const renderedHeightOnPdf = (sourceHeight / canvas.width) * pageWidth;
    const image = pageCanvas.toDataURL('image/jpeg', 0.92);
    pdf.addImage(image, 'JPEG', 0, 0, pageWidth, renderedHeightOnPdf, undefined, 'FAST');
    pageCanvas.width = 1;
    pageCanvas.height = 1;
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
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 15000);
  }
};

export const generateInvoicePdfBlob = async (invoice, businessSettings = {}, targetElement = null) => {
  if (!invoice) throw new Error('Invoice data is missing.');
  const session = await getExportTarget(invoice, businessSettings, targetElement);
  try {
    const canvas = await renderExactPreview(session.target);
    return await validateBlob(canvasToPdfBlob(canvas, session.target), 'pdf');
  } finally {
    session.cleanup();
  }
};

export const generateInvoiceImageBlob = async (invoice, businessSettings = {}, targetElement = null, format = 'image/png') => {
  if (!invoice) throw new Error('Invoice data is missing.');
  const session = await getExportTarget(invoice, businessSettings, targetElement);
  try {
    const canvas = await renderExactPreview(session.target);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, format, format === 'image/jpeg' ? 0.94 : undefined));
    return await validateBlob(blob, 'image');
  } finally {
    session.cleanup();
  }
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
  } finally {
    exporting = false;
  }
};

export const downloadInvoiceImage = async (invoice, businessSettings = {}, targetElement = null, format = 'image/png') => {
  if (!invoice || exporting) return false;
  exporting = true;
  const toastId = toast.loading('Preparing invoice image…');
  try {
    const blob = await generateInvoiceImageBlob(invoice, businessSettings, targetElement, format);
    const ext = format === 'image/jpeg' ? 'jpg' : 'png';
    const invNum = safeFilename(invoice?.invoiceNumber || invoice?.number || invoice?.id || '000');
    downloadBlob(blob, `BillQyro-Invoice-${invNum}.${ext}`);
    toast.dismiss(toastId);
    toast.success('Invoice image downloaded');
    return true;
  } catch (error) {
    console.error('Invoice image export failed:', error);
    toast.dismiss(toastId);
    toast.error(error?.message || 'Image তৈরি করা যায়নি।');
    return false;
  } finally {
    exporting = false;
  }
};

export default downloadStableInvoicePDF;
