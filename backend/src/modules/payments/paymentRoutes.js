import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validatePaymentInput, validatePaymentQuery } from './paymentValidation.js';
import { PaymentService } from './paymentService.js';

export const paymentRouter = Router();

/**
 * POST /api/v1/payments
 * Records an immutable payment, atomically updates invoice balance, and logs audit event.
 */
paymentRouter.post('/', requireAuth, async (req, res, next) => {
  const validation = validatePaymentInput(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid payment payload.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await PaymentService.recordPayment(
      req.auth,
      validation.sanitized,
      { ip: req.ip, userAgent: req.headers['user-agent'] }
    );
    return res.status(201).json({
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/payments
 * Paginated query for payments within authorized workspace
 */
paymentRouter.get('/', requireAuth, async (req, res, next) => {
  const validation = validatePaymentQuery(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid payment query parameters.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await PaymentService.listPayments(req.auth, validation.parsed);
    return res.status(200).json({
      data: result.items,
      pagination: {
        limit: validation.parsed.limit,
        offset: validation.parsed.offset,
        total: result.total
      }
    });
  } catch (err) {
    next(err);
  }
});
