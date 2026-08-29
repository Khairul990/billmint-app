import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validateInvoiceInput, validateInvoiceQuery } from './invoiceValidation.js';
import { InvoiceService } from './invoiceService.js';

export const invoiceRouter = Router();

/**
 * POST /api/v1/invoices
 * Atomically creates a new invoice with server-calculated financials and sequence lock
 */
invoiceRouter.post('/', requireAuth, async (req, res, next) => {
  const validation = validateInvoiceInput(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid invoice payload.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await InvoiceService.createInvoice(req.auth, req.body);
    return res.status(201).json({
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/invoices
 * Paginated query for invoices within authorized workspace
 */
invoiceRouter.get('/', requireAuth, async (req, res, next) => {
  const validation = validateInvoiceQuery(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid invoice query parameters.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await InvoiceService.listInvoices(req.auth, validation.parsed);
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
