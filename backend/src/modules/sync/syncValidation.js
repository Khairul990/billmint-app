const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_ENTITIES = ['customers', 'products', 'invoices', 'payments', 'expenses', 'bankLedger'];
const ALLOWED_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'save', 'update', 'delete', 'sync'];

export const validateSyncBatch = (body = {}) => {
  const errors = [];

  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push('workspaceId is required and must be a valid UUID.');
  }

  if (!Array.isArray(body.operations)) {
    errors.push('operations must be an array.');
  } else if (body.operations.length === 0) {
    errors.push('operations array must not be empty.');
  } else if (body.operations.length > 100) {
    errors.push('operations batch exceeds maximum limit of 100 items.');
  }

  const parsedOperations = [];

  if (Array.isArray(body.operations)) {
    body.operations.forEach((op, index) => {
      const opErrors = [];

      if (!op.clientTxId || typeof op.clientTxId !== 'string' || op.clientTxId.trim().length === 0) {
        opErrors.push(`operations[${index}].clientTxId is required.`);
      }

      if (!op.entityType || typeof op.entityType !== 'string' || !ALLOWED_ENTITIES.includes(op.entityType)) {
        opErrors.push(`operations[${index}].entityType must be one of: ${ALLOWED_ENTITIES.join(', ')}.`);
      }

      if (!op.docId || (typeof op.docId !== 'string' && typeof op.docId !== 'number')) {
        opErrors.push(`operations[${index}].docId is required.`);
      }

      const normalizedAction = typeof op.action === 'string' ? op.action.toUpperCase() : '';
      if (!ALLOWED_ACTIONS.map(a => a.toUpperCase()).includes(normalizedAction)) {
        opErrors.push(`operations[${index}].action must be one of: CREATE, UPDATE, DELETE.`);
      }

      if (op.payload === undefined || op.payload === null || typeof op.payload !== 'object') {
        opErrors.push(`operations[${index}].payload must be a valid object.`);
      }

      if (opErrors.length > 0) {
        errors.push(...opErrors);
      } else {
        parsedOperations.push({
          clientTxId: String(op.clientTxId).trim(),
          entityType: op.entityType,
          docId: String(op.docId).trim(),
          action: normalizedAction,
          payload: op.payload
        });
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? {
      workspaceId: body.workspaceId,
      operations: parsedOperations
    } : null
  };
};
