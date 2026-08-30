import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validateSyncBatch } from './syncValidation.js';
import { SyncService } from './syncService.js';

export const syncRouter = Router();

/**
 * POST /api/v1/sync/batch
 * Processes a batch of offline synchronization operations.
 */
syncRouter.post('/batch', requireAuth, async (req, res, next) => {
  const validation = validateSyncBatch(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid sync batch payload.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const results = await SyncService.processBatch(req.auth, validation.parsed);
    return res.status(200).json({
      data: results
    });
  } catch (err) {
    next(err);
  }
});
