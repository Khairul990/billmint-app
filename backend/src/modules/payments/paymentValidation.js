const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'bKash', 'Nagad', 'Card', 'Cheque', 'Other'];

export const validatePaymentInput = (body = {}) => {
  const errors = [];

  // 1. Workspace ID
  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push({ path: 'workspaceId', message: 'Valid workspaceId UUID is required.' });
  }

  // 2. Invoice ID
  if (!body.invoiceId || typeof body.invoiceId !== 'string' || !UUID_REGEX.test(body.invoiceId)) {
    errors.push({ path: 'invoiceId', message: 'Valid invoiceId UUID is required.' });
  }

  // 3. Amount
  const amount = parseFloat(body.amount);
  if (isNaN(amount) || !isFinite(amount) || amount <= 0) {
    errors.push({ path: 'amount', message: 'Amount must be a positive number greater than zero.' });
  } else if (amount > 999999999999.99) {
    errors.push({ path: 'amount', message: 'Amount exceeds maximum supported financial limit.' });
  }

  // 4. Payment Method
  const method = (body.paymentMethod || '').trim();
  if (!ALLOWED_PAYMENT_METHODS.includes(method)) {
    errors.push({
      path: 'paymentMethod',
      message: `Invalid paymentMethod. Allowed: ${ALLOWED_PAYMENT_METHODS.join(', ')}.`
    });
  }

  // 5. Payment Date
  let paymentDate = new Date();
  if (body.paymentDate) {
    const parsed = Date.parse(body.paymentDate);
    if (isNaN(parsed)) {
      errors.push({ path: 'paymentDate', message: 'Invalid paymentDate format.' });
    } else {
      paymentDate = new Date(parsed);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      workspaceId: body.workspaceId,
      invoiceId: body.invoiceId,
      amount: isNaN(amount) ? 0 : Math.round(amount * 100) / 100,
      paymentMethod: method,
      transactionReference: (body.transactionReference || '').trim().slice(0, 120),
      paymentDate: paymentDate.toISOString(),
      notes: (body.notes || '').trim().slice(0, 1000),
      clientTxId: body.clientTxId ? String(body.clientTxId).trim().slice(0, 120) : null
    }
  };
};

export const validatePaymentQuery = (query = {}) => {
  const errors = [];

  if (!query.workspaceId || typeof query.workspaceId !== 'string' || !UUID_REGEX.test(query.workspaceId)) {
    errors.push({ path: 'workspaceId', message: 'Valid workspaceId UUID query parameter is required.' });
  }

  if (query.invoiceId && (typeof query.invoiceId !== 'string' || !UUID_REGEX.test(query.invoiceId))) {
    errors.push({ path: 'invoiceId', message: 'invoiceId must be a valid UUID.' });
  }

  const limit = parseInt(query.limit ?? '25', 10);
  if (isNaN(limit) || limit < 1 || limit > 100) {
    errors.push({ path: 'limit', message: 'Limit must be an integer between 1 and 100.' });
  }

  const offset = parseInt(query.offset ?? '0', 10);
  if (isNaN(offset) || offset < 0) {
    errors.push({ path: 'offset', message: 'Offset must be a non-negative integer.' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed: {
      workspaceId: query.workspaceId,
      invoiceId: query.invoiceId || null,
      limit: isNaN(limit) ? 25 : Math.min(100, Math.max(1, limit)),
      offset: isNaN(offset) ? 0 : Math.max(0, offset)
    }
  };
};
