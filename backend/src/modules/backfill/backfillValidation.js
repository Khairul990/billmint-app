const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_STAGES = ['customers', 'vendors', 'products', 'invoices', 'outsourceJobs', 'payments', 'expenses', 'bankLedger'];

export const validateCreateJobInput = (body = {}) => {
  const errors = [];

  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push({ path: 'workspaceId', message: 'Valid workspaceId UUID is required.' });
  }

  const batchSize = body.batchSize !== undefined ? parseInt(body.batchSize, 10) : 50;
  if (isNaN(batchSize) || batchSize < 1 || batchSize > 500) {
    errors.push({ path: 'batchSize', message: 'batchSize must be an integer between 1 and 500.' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      workspaceId: body.workspaceId,
      batchSize: isNaN(batchSize) ? 50 : batchSize
    }
  };
};

export const validateBatchInput = (body = {}) => {
  const errors = [];

  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push({ path: 'workspaceId', message: 'Valid workspaceId UUID is required.' });
  }

  if (!body.stage || typeof body.stage !== 'string' || !ALLOWED_STAGES.includes(body.stage)) {
    errors.push({ path: 'stage', message: `stage must be one of: ${ALLOWED_STAGES.join(', ')}.` });
  }

  if (!Array.isArray(body.records)) {
    errors.push({ path: 'records', message: 'records must be an array of entity objects.' });
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: {
      workspaceId: body.workspaceId,
      stage: body.stage,
      records: Array.isArray(body.records) ? body.records : []
    }
  };
};
