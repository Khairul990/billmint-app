const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_STATUSES = ['Pending', 'In Progress', 'Completed'];

export const validateIdParam = (params = {}) => {
  const errors = [];
  if (!params.id || typeof params.id !== 'string' || !UUID_REGEX.test(params.id)) {
    errors.push('id must be a valid UUID.');
  }
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCreateOutsourceJob = (body = {}) => {
  const errors = [];

  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push('workspaceId is required and must be a valid UUID.');
  }

  if (!body.vendorId || typeof body.vendorId !== 'string' || !UUID_REGEX.test(body.vendorId)) {
    errors.push('vendorId is required and must be a valid UUID.');
  }

  if (body.invoiceId !== undefined && body.invoiceId !== null && body.invoiceId !== '') {
    if (typeof body.invoiceId !== 'string' || !UUID_REGEX.test(body.invoiceId)) {
      errors.push('invoiceId must be a valid UUID if provided.');
    }
  }

  if (!body.workDescription || typeof body.workDescription !== 'string' || body.workDescription.trim().length === 0) {
    errors.push('workDescription is required and must not be empty.');
  }

  let cost = 0;
  if (body.cost !== undefined && body.cost !== null) {
    cost = parseFloat(body.cost);
    if (isNaN(cost) || cost < 0) {
      errors.push('cost must be a non-negative number.');
    }
  }

  let status = 'Pending';
  if (body.status !== undefined && body.status !== null) {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      errors.push(`status must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
    } else {
      status = body.status;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? {
      workspaceId: body.workspaceId,
      vendorId: body.vendorId,
      invoiceId: body.invoiceId && body.invoiceId.trim().length > 0 ? body.invoiceId : null,
      workDescription: body.workDescription.trim(),
      cost: Math.round(cost * 100) / 100,
      status
    } : null
  };
};

export const validateUpdateOutsourceJob = (body = {}) => {
  const errors = [];

  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push('workspaceId is required and must be a valid UUID.');
  }

  if (body.status !== undefined && body.status !== null) {
    if (!ALLOWED_STATUSES.includes(body.status)) {
      errors.push(`status must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
    }
  }

  let cost = undefined;
  if (body.cost !== undefined && body.cost !== null) {
    const parsedCost = parseFloat(body.cost);
    if (isNaN(parsedCost) || parsedCost < 0) {
      errors.push('cost must be a non-negative number.');
    } else {
      cost = Math.round(parsedCost * 100) / 100;
    }
  }

  let workDescription = undefined;
  if (body.workDescription !== undefined && body.workDescription !== null) {
    if (typeof body.workDescription !== 'string' || body.workDescription.trim().length === 0) {
      errors.push('workDescription must not be empty.');
    } else {
      workDescription = body.workDescription.trim();
    }
  }

  if (body.status === undefined && cost === undefined && workDescription === undefined) {
    errors.push('At least one field (status, cost, workDescription) must be provided for update.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? {
      workspaceId: body.workspaceId,
      status: body.status,
      cost,
      workDescription
    } : null
  };
};

export const validateOutsourceJobQuery = (query = {}) => {
  const errors = [];

  if (!query.workspaceId || typeof query.workspaceId !== 'string' || !UUID_REGEX.test(query.workspaceId)) {
    errors.push('workspaceId query parameter is required and must be a valid UUID.');
  }

  if (query.vendorId !== undefined && query.vendorId !== null && query.vendorId !== '') {
    if (typeof query.vendorId !== 'string' || !UUID_REGEX.test(query.vendorId)) {
      errors.push('vendorId query parameter must be a valid UUID.');
    }
  }

  if (query.invoiceId !== undefined && query.invoiceId !== null && query.invoiceId !== '') {
    if (typeof query.invoiceId !== 'string' || !UUID_REGEX.test(query.invoiceId)) {
      errors.push('invoiceId query parameter must be a valid UUID.');
    }
  }

  if (query.status !== undefined && query.status !== null && query.status !== '') {
    if (!ALLOWED_STATUSES.includes(query.status)) {
      errors.push(`status must be one of: ${ALLOWED_STATUSES.join(', ')}.`);
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
      vendorId: query.vendorId || null,
      invoiceId: query.invoiceId || null,
      status: query.status || null,
      limit,
      offset
    } : null
  };
};
