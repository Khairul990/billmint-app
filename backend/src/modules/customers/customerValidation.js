const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const validateCustomerInput = (body = {}) => {
  const errors = [];

  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push({ path: 'workspaceId', message: 'Valid workspaceId UUID is required.' });
  }

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
    errors.push({ path: 'name', message: 'Customer name is required and must be at least 2 characters.' });
  }

  if (body.email && typeof body.email === 'string' && body.email.length > 0 && !body.email.includes('@')) {
    errors.push({ path: 'email', message: 'Invalid email address format.' });
  }

  const openingDue = parseFloat(body.openingDue ?? 0);
  if (isNaN(openingDue) || openingDue < 0) {
    errors.push({ path: 'openingDue', message: 'openingDue must be a non-negative number.' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      workspaceId: body.workspaceId,
      name: (body.name || '').trim(),
      phone: (body.phone || '').trim(),
      email: (body.email || '').trim().toLowerCase(),
      address: (body.address || '').trim(),
      gstin: (body.gstin || '').trim().toUpperCase(),
      openingDue: isNaN(openingDue) ? 0 : openingDue
    }
  };
};

export const validateCustomerQuery = (query = {}) => {
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
      search: (query.search || '').trim()
    }
  };
};
