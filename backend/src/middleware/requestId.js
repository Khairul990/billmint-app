import crypto from 'crypto';

/**
 * Attaches a unique X-Request-ID to every incoming request.
 * If client provides one, sanitizes and preserves it; otherwise generates a cryptographically secure UUID.
 */
export const requestIdMiddleware = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  const requestId = typeof incomingId === 'string' && incomingId.trim().length > 0 && incomingId.length < 100
    ? incomingId.trim()
    : crypto.randomUUID();

  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
};
