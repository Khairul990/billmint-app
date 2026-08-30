const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_TYPES = ['PAYMENT_RECEIVED', 'INVOICE_OVERDUE', 'LOW_STOCK', 'OUTSOURCE_COMPLETED', 'SYSTEM'];

export const validateCreateNotification = (body = {}) => {
  const errors = [];

  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push('workspaceId is required and must be a valid UUID.');
  }

  if (!body.type || typeof body.type !== 'string' || !ALLOWED_TYPES.includes(body.type)) {
    errors.push(`type is required and must be one of: ${ALLOWED_TYPES.join(', ')}.`);
  }

  if (!body.title || typeof body.title !== 'string' || body.title.trim().length === 0) {
    errors.push('title is required and must not be empty.');
  } else if (body.title.trim().length > 200) {
    errors.push('title must not exceed 200 characters.');
  }

  if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
    errors.push('message is required and must not be empty.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? {
      workspaceId: body.workspaceId,
      userId: body.userId || null,
      type: body.type,
      title: body.title.trim(),
      message: body.message.trim(),
      entityType: body.entityType || null,
      entityId: body.entityId ? String(body.entityId) : null
    } : null
  };
};

export const validateNotificationQuery = (query = {}) => {
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

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? {
      workspaceId: query.workspaceId,
      unreadOnly: query.unreadOnly === 'true' || query.unreadOnly === true,
      limit,
      offset
    } : null
  };
};
