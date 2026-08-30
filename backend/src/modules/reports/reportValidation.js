const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const validateReportQuery = (query = {}) => {
  const errors = [];

  if (!query.workspaceId || typeof query.workspaceId !== 'string' || !UUID_REGEX.test(query.workspaceId)) {
    errors.push('workspaceId query parameter is required and must be a valid UUID.');
  }

  let from = null;
  if (query.from !== undefined && query.from !== null && query.from !== '') {
    if (typeof query.from !== 'string' || !DATE_REGEX.test(query.from.slice(0, 10))) {
      errors.push('from must be in YYYY-MM-DD format.');
    } else {
      from = query.from.slice(0, 10);
    }
  }

  let to = null;
  if (query.to !== undefined && query.to !== null && query.to !== '') {
    if (typeof query.to !== 'string' || !DATE_REGEX.test(query.to.slice(0, 10))) {
      errors.push('to must be in YYYY-MM-DD format.');
    } else {
      to = query.to.slice(0, 10);
    }
  }

  let limit = 50;
  if (query.limit !== undefined) {
    const parsedLimit = parseInt(query.limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 200) {
      errors.push('limit must be an integer between 1 and 200.');
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
      from,
      to,
      status: query.status ? String(query.status).trim() : null,
      type: query.type ? String(query.type).trim() : null,
      limit,
      offset
    } : null
  };
};
