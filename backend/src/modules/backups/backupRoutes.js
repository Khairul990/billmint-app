import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validateCreateBackup, validateBackupQuery } from './backupValidation.js';
import { BackupService } from './backupService.js';

export const backupRouter = Router();

/**
 * POST /api/v1/backups/export
 * Creates and processes a workspace data export snapshot.
 */
backupRouter.post('/export', requireAuth, async (req, res, next) => {
  const validation = validateCreateBackup(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid export request payload.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const job = await BackupService.createExport(req.auth, validation.parsed.workspaceId);
    return res.status(201).json({
      data: job
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/backups
 * Lists previous backup and export jobs for the workspace.
 */
backupRouter.get('/', requireAuth, async (req, res, next) => {
  const validation = validateBackupQuery(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid backup query parameters.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await BackupService.listBackups(req.auth, validation.parsed);
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
 * GET /api/v1/backups/:id
 * Retrieves backup job details and signed download URL.
 */
backupRouter.get('/:id', requireAuth, async (req, res, next) => {
  const workspaceId = req.query.workspaceId || req.headers['x-workspace-id'];
  if (!workspaceId || typeof workspaceId !== 'string') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'workspaceId query parameter is required.',
        requestId: req.requestId
      }
    });
  }

  try {
    const job = await BackupService.getBackup(req.auth, workspaceId, req.params.id);
    return res.status(200).json({
      data: job
    });
  } catch (err) {
    next(err);
  }
});
