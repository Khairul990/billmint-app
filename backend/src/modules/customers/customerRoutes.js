import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validateCustomerInput, validateCustomerQuery } from './customerValidation.js';
import { CustomerService } from './customerService.js';

export const customerRouter = Router();

/**
 * POST /api/v1/customers
 * Creates a new customer inside authorized workspace
 */
customerRouter.post('/', requireAuth, async (req, res, next) => {
  const validation = validateCustomerInput(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid customer input data.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const customer = await CustomerService.createCustomer(req.auth, validation.sanitized);
    return res.status(201).json({
      data: customer
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/customers
 * Paginated query for customers within authorized workspace
 */
customerRouter.get('/', requireAuth, async (req, res, next) => {
  const validation = validateCustomerQuery(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid customer query parameters.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await CustomerService.listCustomers(req.auth, validation.parsed);
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
