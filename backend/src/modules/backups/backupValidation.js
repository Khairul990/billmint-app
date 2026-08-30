const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const validateCreateBackup = (body = {}) => {
  const errors = [];

  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push('workspaceId is required and must be a valid UUID.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? {
      workspaceId: body.workspaceId
    } : null
  };
};

export const validateBackupQuery = (query = {}) => {
  const errors = [];

  if (!query.workspaceId || typeof query.workspaceId !== 'string' || !UUID_REGEX.test(query.workspaceId)) {
    errors.push('workspaceId query parameter is required and must be a valid UUID.');
  }

  let limit = 20;
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
      limit,
      offset
    } : null
  };
};
