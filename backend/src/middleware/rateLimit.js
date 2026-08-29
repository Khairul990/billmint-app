/**
 * In-Memory Sliding Window Rate Limiter Middleware for Development & Early Staging.
 */
export const createRateLimiter = ({ windowMs = 60000, maxRequests = 200 } = {}) => {
  const requests = new Map();

  // Periodic cleanup of expired rate limit windows every 2 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of requests.entries()) {
      if (now - record.startTime > windowMs) {
        requests.delete(ip);
      }
    }
  }, 120000).unref();

  return (req, res, next) => {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const now = Date.now();

    let record = requests.get(clientIp);
    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      requests.set(clientIp, record);
    } else {
      record.count++;
    }

    if (record.count > maxRequests) {
      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please slow down and try again shortly.',
          requestId: req.requestId
        }
      });
    }

    next();
  };
};
