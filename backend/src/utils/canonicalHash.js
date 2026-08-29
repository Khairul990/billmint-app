import crypto from 'crypto';

/**
 * Recursively canonicalizes any JavaScript value for deterministic serialization.
 * Objects have their keys sorted lexicographically.
 * Arrays maintain exact element sequence.
 * Numbers and strings are normalized consistently.
 */
export const canonicalizeValue = (val) => {
  if (val === null || val === undefined) {
    return null;
  }
  if (typeof val === 'number') {
    return isFinite(val) ? Math.round(val * 100) / 100 : 0;
  }
  if (typeof val === 'boolean') {
    return val;
  }
  if (typeof val === 'string') {
    return val.trim();
  }
  if (Array.isArray(val)) {
    return val.map(canonicalizeValue);
  }
  if (typeof val === 'object') {
    const sortedKeys = Object.keys(val).sort();
    const result = {};
    for (const key of sortedKeys) {
      if (val[key] !== undefined) {
        result[key] = canonicalizeValue(val[key]);
      }
    }
    return result;
  }
  return String(val);
};

/**
 * Calculates a deterministic SHA-256 Content Hash for all PDF-visible invoice data.
 */
export const calculateCanonicalInvoiceContentHash = (payload = {}) => {
  const canonicalSnapshot = {
    invoice: {
      id: payload.invoice?.id || payload.id || '',
      invoiceNumber: payload.invoice?.invoiceNumber || payload.invoice?.invoice_number || payload.invoice_number || payload.invoiceNumber || '',
      billType: payload.invoice?.billType || payload.invoice?.bill_type || payload.bill_type || payload.billType || 'Invoice',
      date: payload.invoice?.date || payload.date || '',
      dueDate: payload.invoice?.dueDate || payload.invoice?.due_date || payload.due_date || payload.dueDate || '',
      status: payload.invoice?.status || payload.status || 'Unpaid',
      notes: payload.invoice?.notes || payload.notes || '',
      terms: payload.invoice?.terms || payload.terms || '',
      selectedTemplate: payload.invoice?.selectedTemplate || payload.invoice?.selected_template || payload.selected_template || payload.selectedTemplate || 'modern',
      shippingCharge: parseFloat(payload.invoice?.shippingCharge || payload.invoice?.shipping_charge || payload.shipping_charge || payload.shippingCharge || 0),
      version: parseInt(payload.invoice?.version || payload.version || 1, 10)
    },
    financials: {
      subtotal: parseFloat(payload.financials?.subtotal || payload.invoice?.subtotal || payload.subtotal || 0),
      taxTotal: parseFloat(payload.financials?.taxTotal || payload.invoice?.tax_total || payload.tax_total || 0),
      discountTotal: parseFloat(payload.financials?.discountTotal || payload.invoice?.discount_total || payload.discount_total || 0),
      grandTotal: parseFloat(payload.financials?.grandTotal || payload.invoice?.grand_total || payload.grand_total || 0),
      amountPaid: parseFloat(payload.financials?.amountPaid || payload.invoice?.amount_paid || payload.amount_paid || 0),
      balanceDue: parseFloat(payload.financials?.balanceDue || payload.invoice?.balance_due || payload.balance_due || 0)
    },
    customer: {
      name: payload.customer?.name || payload.customer_name || '',
      address: payload.customer?.address || payload.customer_address || '',
      phone: payload.customer?.phone || payload.customer_phone || '',
      email: payload.customer?.email || payload.customer_email || '',
      gstin: payload.customer?.gstin || ''
    },
    items: (payload.items || []).map((it, idx) => ({
      sequenceNumber: it.sequenceNumber || it.sequence_number || idx + 1,
      name: it.name || '',
      description: it.description || '',
      quantity: parseFloat(it.quantity || it.qty || 1),
      rate: parseFloat(it.rate || it.price || 0),
      taxPercent: parseFloat(it.taxPercent || it.tax_percent || 0),
      discountAmount: parseFloat(it.discountAmount || it.discount_amount || 0),
      totalAmount: parseFloat(it.totalAmount || it.total_amount || 0)
    })),
    business: {
      name: payload.business?.name || payload.workspace_name || '',
      address: payload.business?.address || '',
      phone: payload.business?.phone || '',
      email: payload.business?.email || '',
      gstin: payload.business?.gstin || '',
      pan: payload.business?.pan || '',
      upiId: payload.business?.upiId || payload.business?.upi_id || '',
      currency: payload.business?.currency || payload.currency || 'INR',
      currencySymbol: payload.business?.currencySymbol || payload.currency_symbol || '₹',
      taxLabel: payload.business?.taxLabel || payload.tax_label || 'GSTIN'
    },
    presentation: {
      selectedTemplate: payload.presentation?.selectedTemplate || payload.selectedTemplate || payload.selected_template || 'modern',
      theme: payload.presentation?.theme || 'default',
      currency: payload.presentation?.currency || payload.currency || 'INR',
      currencySymbol: payload.presentation?.currencySymbol || payload.currency_symbol || '₹',
      numberFormat: payload.presentation?.numberFormat || 'en-IN',
      dateFormat: payload.presentation?.dateFormat || 'YYYY-MM-DD',
      language: payload.presentation?.language || 'en'
    }
  };

  const canonicalObj = canonicalizeValue(canonicalSnapshot);
  const jsonStr = JSON.stringify(canonicalObj);
  return crypto.createHash('sha256').update(jsonStr, 'utf8').digest('hex');
};

/**
 * Calculates SHA-256 hash of raw byte buffer for byte-level integrity verification.
 */
export const calculateBufferByteHash = (buffer) => {
  if (!Buffer.isBuffer(buffer) && !(buffer instanceof Uint8Array)) {
    throw new TypeError('calculateBufferByteHash expects a Buffer or Uint8Array');
  }
  return crypto.createHash('sha256').update(buffer).digest('hex');
};

/**
 * Generates deterministic immutable storage key for S3/R2 object storage.
 */
export const generateDeterministicStorageKey = (workspaceId, invoiceId, contentHash) => {
  if (!workspaceId || !invoiceId || !contentHash) {
    throw new Error('workspaceId, invoiceId, and contentHash are required to generate storage key');
  }
  return `pdfs/${workspaceId}/${invoiceId}/${contentHash}.pdf`;
};
