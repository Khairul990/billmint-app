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
    position: 'fixed', left: '-100000px', top: '0', width: `${A4_CSS_WIDTH}px`, minHeight: `${A4_CSS_HEIGHT}px`,
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

const sanitizeClonedColors = (clonedDocument) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');

  const toRgb = (colorStr) => {
    if (!colorStr || typeof colorStr !== 'string') return colorStr;
    if (!colorStr.includes('color(') && !colorStr.includes('oklch') && !colorStr.includes('color-mix') && !colorStr.includes('lab(')) return colorStr;
    if (!ctx) return '#000000';
    try {
      ctx.fillStyle = '#000000';
      ctx.fillStyle = colorStr;
      return ctx.fillStyle || '#000000';
    } catch {
      return '#000000';
    }
  };

  // 1. Sanitize all stylesheet text to eliminate html2canvas parser crash on color()
  try {
    const styleTags = clonedDocument.querySelectorAll('style');
    styleTags.forEach((style) => {
      if (style.textContent && (style.textContent.includes('color(') || style.textContent.includes('oklch(') || style.textContent.includes('lab('))) {
        style.textContent = style.textContent
          .replace(/color\([^)]+\)/g, '#111827')
          .replace(/oklch\([^)]+\)/g, '#111827')
          .replace(/color-mix\([^)]+\)/g, '#111827')
          .replace(/lab\([^)]+\)/g, '#111827');
      }
    });
  } catch {}

  const colorProps = [
    'color', 'backgroundColor', 'borderColor',
    'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
    'outlineColor', 'fill', 'stroke'
  ];

  clonedDocument.querySelectorAll('*').forEach((node) => {
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
        node.style.boxShadow = computed.boxShadow
          .replace(/color\([^)]+\)/g, '#111827')
          .replace(/oklch\([^)]+\)/g, '#111827');
      }
    } catch {}
  });
};

/**
 * Native Engine: SVG ForeignObject Renderer
 * Uses browser's native Blink/WebKit GPU rasterizer.
 * Supports all CSS color spaces, Bengali ligatures, gradients, and fonts with zero parser errors.
 */
const renderViaSvgForeignObject = async (root, width, height) => {
  const cloned = root.cloneNode(true);
  
  // Convert all images to inline base64 to avoid tainted canvas
  const images = Array.from(cloned.querySelectorAll('img'));
  await Promise.all(images.map(async (img) => {
    const base64 = await imageToBase64(img);
    img.src = base64;
  }));

  const serialized = new XMLSerializer().serializeToString(cloned);
  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;background:#ffffff;font-family:'Inter','Noto Sans Bengali','Hind Siliguri',system-ui,sans-serif;-webkit-font-smoothing:antialiased;">
          <style>
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            img { max-width: 100%; object-fit: contain; }
          </style>
          ${serialized}
        </div>
      </foreignObject>
    </svg>
  `;

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width * 2;
        canvas.height = height * 2;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('2D context could not be created.');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve(canvas);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err || new Error('SVG rasterization failed'));
    };
    img.src = url;
  });
};

/**
 * Hardened Fallback Engine: Sanitized html2canvas
 */
const renderViaHtml2Canvas = async (root, width, height) => {
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
        sanitizeClonedColors(clonedDocument);

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
        }

        const clonedRoot = clonedDocument.querySelector('#invoice-preview-capture');
        if (clonedRoot) {
          clonedRoot.style.width = `${width}px`;
          clonedRoot.style.minWidth = `${width}px`;
          clonedRoot.style.maxWidth = `${width}px`;
          clonedRoot.style.margin = '0 auto';
          clonedRoot.style.boxSizing = 'border-box';
          clonedRoot.style.fontFamily = "'Inter', 'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif";
          clonedRoot.querySelectorAll('*').forEach((node) => {
            if (node instanceof HTMLElement) {
              node.style.animation = 'none';
              node.style.transition = 'none';
            }
          });
        }
      },
    }), EXPORT_TIMEOUT_MS, 'PDF/image export timed out. Please try again.');
  } finally {
    style.remove();
    root.classList.remove(exportClass);
  }
};

/**
 * Universal Master Preview Renderer
 * Attempts Native High-Fidelity SVG ForeignObject first, with automatic failover to Hardened html2canvas.
 */
const renderExactPreview = async (root) => {
  await waitForAssets(root);
  await nextPaint();
  const width = A4_CSS_WIDTH;
  const height = Math.max(root.scrollHeight, root.offsetHeight, root.clientHeight, A4_CSS_HEIGHT);
  if (!width || !height) throw new Error('Invoice preview has no printable content.');
  if (height > MAX_CAPTURE_HEIGHT) throw new Error('Invoice is too long to export safely.');

  try {
    // Primary: Native Browser GPU Canvas Engine
    return await renderViaSvgForeignObject(root, width, height);
  } catch (svgErr) {
    console.warn('[PDF Engine] SVG ForeignObject rasterizer failed, falling back to Hardened html2canvas:', svgErr);
    // Secondary: Hardened html2canvas with sanitized styles
    return await renderViaHtml2Canvas(root, width, height);
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
    downloadBlob(blob, `Invoice_${safeFilename(invoice?.invoiceNumber || invoice?.number || '000')}.${ext}`);
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
