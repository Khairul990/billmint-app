const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const validateInvoiceInput = (body = {}) => {
  const errors = [];

  // 1. Workspace ID
  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push({ path: 'workspaceId', message: 'Valid workspaceId UUID is required.' });
  }

  // 2. Customer ID (Optional)
  if (body.customerId && (typeof body.customerId !== 'string' || !UUID_REGEX.test(body.customerId))) {
    errors.push({ path: 'customerId', message: 'customerId must be a valid UUID.' });
  }

  // 3. Bill Type
  const validBillTypes = ['Invoice', 'Estimate', 'Quotation', 'BillOfSupply'];
  const billType = body.billType || 'Invoice';
  if (!validBillTypes.includes(billType)) {
    errors.push({ path: 'billType', message: `billType must be one of: ${validBillTypes.join(', ')}.` });
  }

  // 4. Date Validation
  if (!body.date || typeof body.date !== 'string' || !DATE_REGEX.test(body.date) || isNaN(Date.parse(body.date))) {
    errors.push({ path: 'date', message: 'Valid date in YYYY-MM-DD format is required.' });
  }

  if (body.dueDate && (typeof body.dueDate !== 'string' || !DATE_REGEX.test(body.dueDate) || isNaN(Date.parse(body.dueDate)))) {
    errors.push({ path: 'dueDate', message: 'dueDate must be in YYYY-MM-DD format.' });
  }

  // 5. Items Validation
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push({ path: 'items', message: 'Invoice must contain at least one line item.' });
  } else {
    body.items.forEach((item, idx) => {
      if (!item || typeof item !== 'object') {
        errors.push({ path: `items[${idx}]`, message: 'Item must be an object.' });
        return;
      }
      if (!item.name || typeof item.name !== 'string' || item.name.trim().length === 0) {
        errors.push({ path: `items[${idx}].name`, message: 'Item name is required.' });
      }
      const qty = parseFloat(item.quantity ?? item.qty);
      if (isNaN(qty) || qty < 0) {
        errors.push({ path: `items[${idx}].quantity`, message: 'Item quantity must be a non-negative number.' });
      }
      const rate = parseFloat(item.rate ?? item.price ?? item.unitPrice);
      if (isNaN(rate) || rate < 0) {
        errors.push({ path: `items[${idx}].rate`, message: 'Item rate must be a non-negative number.' });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateInvoiceQuery = (query = {}) => {
  const errors = [];

  if (!query.workspaceId || typeof query.workspaceId !== 'string' || !UUID_REGEX.test(query.workspaceId)) {
    errors.push({ path: 'workspaceId', message: 'Valid workspaceId UUID query parameter is required.' });
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
      limit: isNaN(limit) ? 25 : Math.min(100, Math.max(1, limit)),
      offset: isNaN(offset) ? 0 : Math.max(0, offset),
      status: query.status ? query.status.trim() : null,
      search: query.search ? query.search.trim() : '',
      customerId: query.customerId && UUID_REGEX.test(query.customerId) ? query.customerId : null,
      fromDate: query.fromDate && DATE_REGEX.test(query.fromDate) ? query.fromDate : null,
      toDate: query.toDate && DATE_REGEX.test(query.toDate) ? query.toDate : null
    }
  };
};
