const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const validateCreateExpense = (body = {}) => {
  const errors = [];

  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push('workspaceId is required and must be a valid UUID.');
  }

  const amount = parseFloat(body.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push('amount must be a positive number greater than 0.');
  }

  if (!body.category || typeof body.category !== 'string' || body.category.trim().length === 0) {
    errors.push('category is required and must not be empty.');
  } else if (body.category.trim().length > 100) {
    errors.push('category must not exceed 100 characters.');
  }

  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    errors.push('description must be a string if provided.');
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
      amount: Math.round(amount * 100) / 100,
      category: body.category.trim(),
      description: body.description ? body.description.trim() : null,
      date
    } : null
  };
};

export const validateExpenseQuery = (query = {}) => {
  const errors = [];

  if (!query.workspaceId || typeof query.workspaceId !== 'string' || !UUID_REGEX.test(query.workspaceId)) {
    errors.push('workspaceId query parameter is required and must be a valid UUID.');
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

  const category = typeof query.category === 'string' && query.category.trim().length > 0
    ? query.category.trim()
    : null;

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? {
      workspaceId: query.workspaceId,
      category,
      startDate: query.startDate || null,
      endDate: query.endDate || null,
      limit,
      offset
    } : null
  };
};
