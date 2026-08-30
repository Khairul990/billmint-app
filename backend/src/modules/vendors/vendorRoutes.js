import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  validateCreateVendor,
  validateVendorQuery,
  validateIdParam,
  validateRecordVendorPayment
} from './vendorValidation.js';
import { VendorService } from './vendorService.js';

export const vendorRouter = Router();
export const vendorPaymentRouter = Router();

/**
 * POST /api/v1/vendors
 * Creates a new vendor within the authorized workspace.
 */
vendorRouter.post('/', requireAuth, async (req, res, next) => {
  const validation = validateCreateVendor(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid vendor payload.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await VendorService.createVendor(req.auth, validation.parsed);
    return res.status(201).json({
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/vendors
 * Paginated query for vendors in authorized workspace.
 */
vendorRouter.get('/', requireAuth, async (req, res, next) => {
  const validation = validateVendorQuery(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid vendor query parameters.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await VendorService.listVendors(req.auth, validation.parsed);
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

/**
 * GET /api/v1/vendors/:id/ledger
 * Retrieves vendor statement with jobs, payments, and server-side due balance.
 */
vendorRouter.get('/:id/ledger', requireAuth, async (req, res, next) => {
  const idValidation = validateIdParam(req.params);
  if (!idValidation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid vendor identifier parameter.',
        details: idValidation.errors,
        requestId: req.requestId
      }
    });
  }

  const workspaceId = req.query.workspaceId;
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!workspaceId || typeof workspaceId !== 'string' || !UUID_REGEX.test(workspaceId)) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'workspaceId query parameter is required and must be a valid UUID.',
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await VendorService.getVendorLedger(req.auth, workspaceId, req.params.id);
    return res.status(200).json({
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/vendor-payments
 * Records a payment made to a vendor with idempotency check.
 */
vendorPaymentRouter.post('/', requireAuth, async (req, res, next) => {
  const validation = validateRecordVendorPayment(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid vendor payment payload.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await VendorService.recordVendorPayment(req.auth, validation.parsed);
    const statusCode = result.isIdempotentReplay ? 200 : 201;
    return res.status(statusCode).json({
      data: result.payment,
      isIdempotentReplay: result.isIdempotentReplay
    });
  } catch (err) {
    next(err);
  }
});
