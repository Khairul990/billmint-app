const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_TYPES = ['Income', 'Expense'];

export const validateCreateBankLedgerEntry = (body = {}) => {
  const errors = [];

  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push('workspaceId is required and must be a valid UUID.');
  }

  if (!body.type || typeof body.type !== 'string' || !ALLOWED_TYPES.includes(body.type)) {
    errors.push(`type is required and must be one of: ${ALLOWED_TYPES.join(', ')}.`);
  }

  const amount = parseFloat(body.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push('amount must be a positive number greater than 0.');
  }

  if (!body.description || typeof body.description !== 'string' || body.description.trim().length === 0) {
    errors.push('description is required and must not be empty.');
  }

  let date = new Date().toISOString().slice(0, 10);
  if (body.date !== undefined && body.date !== null && body.date !== '') {
    if (typeof body.date !== 'string' || !DATE_REGEX.test(body.date.slice(0, 10))) {
      errors.push('date must be in YYYY-MM-DD format.');
    } else {
      date = body.date.slice(0, 10);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? {
      workspaceId: body.workspaceId,
      type: body.type,
      amount: Math.round(amount * 100) / 100,
      description: body.description.trim(),
      date
    } : null
  };
};

export const validateBankLedgerQuery = (query = {}) => {
  const errors = [];

  if (!query.workspaceId || typeof query.workspaceId !== 'string' || !UUID_REGEX.test(query.workspaceId)) {
    errors.push('workspaceId query parameter is required and must be a valid UUID.');
  }

  if (query.type !== undefined && query.type !== null && query.type !== '') {
    if (!ALLOWED_TYPES.includes(query.type)) {
      errors.push(`type filter must be one of: ${ALLOWED_TYPES.join(', ')}.`);
    }
  }

  let limit = 25;
  if (query.limit !== undefined) {
    const parsedLimit = parseInt(query.limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      errors.push('limit must be an integer between 1 and 100.');
    } else {
      limit = parsedLimit;
    }
  }

  let offset = 0;
  if (query.offset !== undefined) {
    const parsedOffset = parseInt(query.offset, 10);
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      errors.push('offset must be a non-negative integer.');
    } else {
      offset = parsedOffset;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? {
      workspaceId: query.workspaceId,
      type: query.type || null,
      startDate: query.startDate || null,
      endDate: query.endDate || null,
      limit,
      offset
    } : null
  };
};
