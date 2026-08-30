import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import {
  validateCreateOutsourceJob,
  validateUpdateOutsourceJob,
  validateOutsourceJobQuery,
  validateIdParam
} from './outsourceValidation.js';
import { OutsourceService } from './outsourceService.js';

export const outsourceRouter = Router();

/**
 * POST /api/v1/outsource-jobs
 * Creates a new outsource job assigned to a vendor within the authorized workspace.
 */
outsourceRouter.post('/', requireAuth, async (req, res, next) => {
  const validation = validateCreateOutsourceJob(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid outsource job payload.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await OutsourceService.createOutsourceJob(req.auth, validation.parsed);
    return res.status(201).json({
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/outsource-jobs
 * Paginated query for outsource jobs with vendor/invoice/status filters.
 */
outsourceRouter.get('/', requireAuth, async (req, res, next) => {
  const validation = validateOutsourceJobQuery(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid outsource job query parameters.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await OutsourceService.listOutsourceJobs(req.auth, validation.parsed);
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
 * PATCH /api/v1/outsource-jobs/:id
 * Updates an outsource job (status, cost, workDescription).
 */
outsourceRouter.patch('/:id', requireAuth, async (req, res, next) => {
  const idValidation = validateIdParam(req.params);
  if (!idValidation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid outsource job identifier parameter.',
        details: idValidation.errors,
        requestId: req.requestId
      }
    });
  }

  const validation = validateUpdateOutsourceJob(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid outsource job update payload.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await OutsourceService.updateOutsourceJob(
      req.auth,
      validation.parsed.workspaceId,
      req.params.id,
      validation.parsed
    );
    return res.status(200).json({
      data: result
    });
  } catch (err) {
    next(err);
  }
});
