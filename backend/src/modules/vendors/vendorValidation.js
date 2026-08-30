const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

export const validateCreateVendor = (body = {}) => {
  const errors = [];

  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push('workspaceId is required and must be a valid UUID.');
  }

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('name is required and must not be empty.');
  } else if (body.name.trim().length > 255) {
    errors.push('name must not exceed 255 characters.');
  }

  if (body.phone !== undefined && body.phone !== null && typeof body.phone !== 'string') {
    errors.push('phone must be a string if provided.');
  }

  if (body.email !== undefined && body.email !== null && typeof body.email !== 'string') {
    errors.push('email must be a string if provided.');
  }

  if (body.service !== undefined && body.service !== null && typeof body.service !== 'string') {
    errors.push('service must be a string if provided.');
  }

  if (body.address !== undefined && body.address !== null && typeof body.address !== 'string') {
    errors.push('address must be a string if provided.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? {
      workspaceId: body.workspaceId,
      name: body.name.trim(),
      phone: body.phone ? body.phone.trim() : null,
      email: body.email ? body.email.trim() : null,
      service: body.service ? body.service.trim() : null,
      address: body.address ? body.address.trim() : null
    } : null
  };
};

export const validateVendorQuery = (query = {}) => {
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

  const search = typeof query.search === 'string' ? query.search.trim() : '';

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? {
      workspaceId: query.workspaceId,
      search,
      limit,
      offset
    } : null
  };
};

export const validateRecordVendorPayment = (body = {}) => {
  const errors = [];

  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push('workspaceId is required and must be a valid UUID.');
  }

  if (!body.vendorId || typeof body.vendorId !== 'string' || !UUID_REGEX.test(body.vendorId)) {
    errors.push('vendorId is required and must be a valid UUID.');
  }

  const amount = parseFloat(body.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push('amount must be a positive number greater than 0.');
  }

  const paymentMethod = typeof body.paymentMethod === 'string' && body.paymentMethod.trim().length > 0
    ? body.paymentMethod.trim()
    : 'Cash';

  const referenceNote = typeof body.referenceNote === 'string' ? body.referenceNote.trim() : null;
  const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : null;

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? {
      workspaceId: body.workspaceId,
      vendorId: body.vendorId,
      amount: Math.round(amount * 100) / 100,
      paymentMethod,
      referenceNote,
      idempotencyKey
    } : null
  };
};
