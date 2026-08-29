import { Router } from 'express';
import { PublicInvoiceService } from './publicInvoiceService.js';
import { createRateLimiter } from '../../middleware/rateLimit.js';

export const publicInvoiceRouter = Router();

// Public Rate Limiter: 100 requests per minute per IP
const publicRateLimiter = createRateLimiter({ windowMs: 60000, maxRequests: 100 });

/**
 * GET /api/v1/public/invoices/:token
 * Unauthenticated public invoice access via crypto-safe token.
 */
publicInvoiceRouter.get('/:token', publicRateLimiter, async (req, res, next) => {
  // Conservative cache-control
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  try {
    const data = await PublicInvoiceService.getPublicInvoice(req.params.token);
    return res.status(200).json({
      data
    });
  } catch (err) {
    next(err);
  }
});
