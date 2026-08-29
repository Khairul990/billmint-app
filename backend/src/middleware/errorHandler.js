/**
 * Centralized Global API Error Handler Middleware.
 * Standardizes error responses and prevents sensitive stack/SQL leakage to clients.
 */
export const errorHandler = (err, req, res, next) => {
  const requestId = req.requestId || 'req_unknown';

  // 1. Zod / Schema Validation Error
  if (err.name === 'ZodError' || Array.isArray(err.errors)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload or query parameters.',
        details: err.errors ? err.errors.map(e => ({ path: e.path?.join('.'), message: e.message })) : [],
        requestId
      }
    });
  }

  // 2. PostgreSQL Unique Constraint Violation (Error 23505)
  if (err.code === '23505') {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'A resource with the provided unique identifier already exists.',
        requestId
      }
    });
  }

  // 3. PostgreSQL Foreign Key Violation (Error 23503)
  if (err.code === '23503') {
    return res.status(400).json({
      error: {
        code: 'FOREIGN_KEY_VIOLATION',
        message: 'Referenced entity does not exist or belongs to another workspace.',
        requestId
      }
    });
  }

  // 4. Custom App Error with explicit status code
  const statusCode = typeof err.statusCode === 'number' ? err.statusCode : (err.status || 500);
  const errorCode = err.code && typeof err.code === 'string' && isNaN(Number(err.code)) ? err.code : 'INTERNAL_SERVER_ERROR';
  const errorMessage = statusCode < 500 ? (err.message || 'An error occurred.') : 'An unexpected internal server error occurred.';

  if (statusCode >= 500) {
    console.error(`[UNHANDLED ERROR] [${requestId}] ${err.message}`, err.stack);
  }

  return res.status(statusCode).json({
    error: {
      code: errorCode,
      message: errorMessage,
      requestId
    }
  });
};
