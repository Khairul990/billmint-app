import { BillQyroDB } from '../services/localDb.js';
import { calculateCanonicalInvoiceFinancials } from './invoiceMath.js';

/**
 * In-Flight Concurrent Generation Mutex
 * Maps `${invoiceId}_${contentHash}` -> Promise<Blob>
 */
const inFlightGenerations = new Map();

/**
 * Deterministically sort object keys recursively
 */
export const canonicalizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(canonicalizeObject);
  }
  const sortedKeys = Object.keys(obj).sort();
  const result = {};
  for (const key of sortedKeys) {
    if (obj[key] !== undefined && typeof obj[key] !== 'function') {
      result[key] = canonicalizeObject(obj[key]);
    }
  }
  return result;
};

/**
 * Calculate deterministic SHA-256 content hash of all fields that visibly affect PDF output.
 */
export const calculateInvoicePdfHash = async (invoice, businessSettings = {}) => {
  if (!invoice) return 'empty_invoice_hash';

  const financials = calculateCanonicalInvoiceFinancials(invoice);
  const paySnap = invoice.paymentSettingsSnapshot || {};
  const regionalPrefs = invoice.regionalSettingsSnapshot || {};

  // Extract all fields that visibly impact the rendered PDF template
  const canonicalData = {
    // 1. Invoice Core Identifiers & Metadata
    id: invoice.id || null,
    invoiceNumber: invoice.invoiceNumber || invoice.number || '',
    date: invoice.date || invoice.invoiceDate || '',
    dueDate: invoice.dueDate || '',
    status: invoice.status || 'unpaid',
    poNumber: invoice.poNumber || '',
    
    // 2. Line Items (normalized)
    items: (invoice.items || []).map(item => ({
      name: item.name || item.description || '',
      description: item.description || '',
      quantity: Number(item.quantity || item.qty || 0),
      rate: Number(item.rate || item.price || item.unitPrice || 0),
      tax: Number(item.tax || item.taxPercent || item.gst || 0),
      discount: Number(item.discount || item.discountPercent || 0),
      discountType: item.discountType || 'fixed',
      amount: Number(item.amount || item.total || 0)
    })),

    // 3. Computed Financial Invariants
    financials: {
      subtotal: financials.subtotal,
      taxAmount: financials.taxAmount ?? financials.totalTax ?? 0,
      discountAmount: financials.discountAmount ?? financials.totalDiscount ?? 0,
      shipping: financials.shipping ?? 0,
      grandTotal: financials.currentInvoiceTotal ?? financials.grandTotal ?? 0,
      amountPaid: financials.amountPaid ?? 0,
      balanceDue: financials.balanceDue ?? 0,
      previousDue: financials.previousDue ?? financials.oldDue ?? 0,
      totalReceivable: financials.totalReceivable ?? 0,
      paymentStatus: financials.paymentStatus ?? invoice.paymentStatus ?? 'Unpaid'
    },

    // 4. Customer Info
    customer: {
      id: invoice.customerId || invoice.customer?.id || '',
      name: invoice.customerName || invoice.customer?.name || '',
      phone: invoice.customerPhone || invoice.customer?.phone || '',
      email: invoice.customerEmail || invoice.customer?.email || '',
      address: invoice.customerAddress || invoice.customer?.address || '',
      gstin: invoice.customerGstin || invoice.customer?.gstin || invoice.customerGst || ''
    },

    // 5. Business Profile & Branding
    business: {
      businessName: businessSettings.businessName || invoice.businessName || '',
      email: businessSettings.email || '',
      phone: businessSettings.phone || '',
      address: businessSettings.address || '',
      gstin: businessSettings.gstin || businessSettings.taxNumber || '',
      pan: businessSettings.pan || '',
      upiId: businessSettings.bankDetails?.upiId || businessSettings.upiId || paySnap.upiId || '',
      bankDetails: businessSettings.bankDetails || {},
      logoUrl: businessSettings.logoUrl || invoice.logoUrl || ''
    },

    // 6. Template & Visual Design
    template: invoice.selectedTemplate || businessSettings.selectedPdfTemplate || 'standard',
    themeColor: invoice.themeColor || businessSettings.themeColor || '#4F46E5',

    // 7. Regional & Formatting Settings
    regional: {
      currency: regionalPrefs.currency || businessSettings.currency || 'INR',
      currencyCode: regionalPrefs.currencyCode || businessSettings.currencyCode || 'INR',
      numberFormat: regionalPrefs.numberFormat || businessSettings.numberFormat || 'Indian',
      dateFormat: regionalPrefs.dateFormat || businessSettings.dateFormat || 'DD/MM/YYYY',
      language: regionalPrefs.language || businessSettings.language || 'en'
    },

    // 8. Notes & Terms
    notes: invoice.notes || invoice.customerNotes || '',
    terms: invoice.terms || invoice.termsAndConditions || businessSettings.defaultTerms || '',
    signatureUrl: invoice.signatureUrl || businessSettings.signatureUrl || ''
  };

  const canonicalJson = JSON.stringify(canonicalizeObject(canonicalData));

  // Compute SHA-256
  try {
    const cryptoObj = (typeof globalThis !== 'undefined' && globalThis.crypto)
      ? globalThis.crypto
      : (typeof window !== 'undefined' && window.crypto ? window.crypto : null);

    if (cryptoObj?.subtle?.digest) {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(canonicalJson);
      const hashBuffer = await cryptoObj.subtle.digest('SHA-256', dataBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (err) {
    console.warn('[PDF Hash] SubtleCrypto unavailable, falling back to simple hash digest:', err);
  }

  // Pure JS Fallback Hash
  let hash = 0;
  for (let i = 0; i < canonicalJson.length; i++) {
    const char = canonicalJson.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(16) + '_' + canonicalJson.length;
};

/**
 * Validates that a Blob is authentic, non-empty PDF
 */
export const validatePdfBlob = async (blob) => {
  if (!blob) throw new Error('PDF blob is null or undefined.');
  if (typeof Blob !== 'undefined' && !(blob instanceof Blob)) {
    throw new Error('PDF output is not a valid Blob instance.');
  }
  if (blob.size < 100) {
    throw new Error(`PDF blob is too small (${blob.size} bytes), likely corrupted.`);
  }
  return blob;
};

/**
 * Core "Generate Once & Reuse" Function.
 * Returns the cached PDF Blob if available and unchanged, or generates and caches it atomically.
 */
export const getOrGenerateInvoicePdfBlob = async (invoice, businessSettings = {}, options = {}) => {
  if (!invoice) throw new Error('Cannot generate PDF for null invoice');
  const invoiceId = invoice.id || invoice.invoiceNumber || 'temp_invoice';
  const contentHash = await calculateInvoicePdfHash(invoice, businessSettings);
  const mutexKey = `${invoiceId}_${contentHash}`;

  // 1. Check pdfCache in IndexedDB (unless forceRegenerate is true)
  if (!options.forceRegenerate) {
    try {
      const cached = await BillQyroDB.get('pdfCache', invoiceId);
      if (cached && cached.contentHash === contentHash && cached.status === 'READY' && cached.blob) {
        try {
          await validatePdfBlob(cached.blob);
          return cached.blob; // Cache Hit! Return instantly.
        } catch (validationErr) {
          console.warn('[PDF Cache] Cached blob failed validation, regenerating:', validationErr);
        }
      }
    } catch (dbErr) {
      console.warn('[PDF Cache] Cache lookup error, proceeding with generation:', dbErr);
    }
  }

  // 2. Concurrent Generation Protection (Promise Deduplication)
  if (inFlightGenerations.has(mutexKey)) {
    return inFlightGenerations.get(mutexKey);
  }

  // 3. Cache Miss: Execute Generation Pipeline
  const generationPromise = (async () => {
    let blob = null;
    let engineUsed = 'canvas-primary';

    try {
      // Mark Generating Status in DB
      try {
        await BillQyroDB.put('pdfCache', {
          invoiceId,
          workspaceId: invoice.workspaceId || 'default',
          version: 1,
          contentHash,
          status: 'GENERATING',
          generatedAt: new Date().toISOString(),
          engineUsed: 'pending',
          blob: null,
          size: 0,
          updatedAt: Date.now()
        });
      } catch (statusErr) { /* ignore non-blocking status save */ }

      // Try Primary Canvas PDF Generator
      try {
        const { generateInvoicePdfBlob: generateStablePdfBlob } = await import('./stableInvoicePdf.js');
        blob = await generateStablePdfBlob(invoice, businessSettings);
        await validatePdfBlob(blob);
      } catch (primaryErr) {
        console.warn('[PDF Cache Engine] Primary canvas generator failed, attempting React-PDF fallback:', primaryErr);
        engineUsed = 'react-pdf-fallback';
        const { generateInvoicePdfBlob: generateReactPdfBlob } = await import('../services/communication/attachmentEngine.js');
        blob = await generateReactPdfBlob(invoice, businessSettings);
        await validatePdfBlob(blob);
      }

      // Store in pdfCache
      try {
        const existingRecord = await BillQyroDB.get('pdfCache', invoiceId).catch(() => null);
        const nextVersion = (existingRecord?.version || 0) + 1;

        const cacheRecord = {
          invoiceId,
          workspaceId: invoice.workspaceId || 'default',
          version: nextVersion,
          contentHash,
          status: 'READY',
          generatedAt: new Date().toISOString(),
          engineUsed,
          blob,
          size: blob.size,
          updatedAt: Date.now()
        };

        await BillQyroDB.put('pdfCache', cacheRecord);
      } catch (saveErr) {
        console.warn('[PDF Cache Engine] Could not persist PDF to IndexedDB cache:', saveErr);
      }

      return blob;
    } catch (fatalErr) {
      // Record FAILED state in cache
      try {
        await BillQyroDB.put('pdfCache', {
          invoiceId,
          workspaceId: invoice.workspaceId || 'default',
          version: 0,
          contentHash,
          status: 'FAILED',
          generatedAt: new Date().toISOString(),
          engineUsed: 'failed',
          lastError: fatalErr?.message || String(fatalErr),
          blob: null,
          size: 0,
          updatedAt: Date.now()
        });
      } catch (e) { /* ignore */ }
      throw fatalErr;
    } finally {
      inFlightGenerations.delete(mutexKey);
    }
  })();

  inFlightGenerations.set(mutexKey, generationPromise);
  return generationPromise;
};

/**
 * Invalidate cached PDF for an invoice
 */
export const invalidateInvoicePdfCache = async (invoiceId) => {
  if (!invoiceId) return;
  try {
    await BillQyroDB.delete('pdfCache', invoiceId);
  } catch (err) {
    console.warn('[PDF Cache Engine] Failed to invalidate cache for', invoiceId, err);
  }
};
