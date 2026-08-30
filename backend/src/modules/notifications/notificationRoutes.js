import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validateNotificationQuery } from './notificationValidation.js';
import { NotificationService } from './notificationService.js';

export const notificationRouter = Router();

/**
 * GET /api/v1/notifications
 * Lists notifications for the authenticated user and workspace.
 */
notificationRouter.get('/', requireAuth, async (req, res, next) => {
  const validation = validateNotificationQuery(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid notification query parameters.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await NotificationService.listNotifications(req.auth, validation.parsed);
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
 * GET /api/v1/notifications/unread-count
 * Returns unread notification count.
 */
notificationRouter.get('/unread-count', requireAuth, async (req, res, next) => {
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
    const count = await NotificationService.getUnreadCount(req.auth, workspaceId);
    return res.status(200).json({
      data: count
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/notifications/:id/read
 * Marks single notification as read.
 */
notificationRouter.post('/:id/read', requireAuth, async (req, res, next) => {
  const workspaceId = req.body.workspaceId || req.query.workspaceId;
  if (!workspaceId || typeof workspaceId !== 'string') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'workspaceId is required in body or query.',
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await NotificationService.markAsRead(req.auth, workspaceId, req.params.id);
    return res.status(200).json({
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/notifications/read-all
 * Marks all notifications as read in workspace.
 */
notificationRouter.post('/read-all', requireAuth, async (req, res, next) => {
  const workspaceId = req.body.workspaceId || req.query.workspaceId;
  if (!workspaceId || typeof workspaceId !== 'string') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'workspaceId is required in body or query.',
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await NotificationService.markAllAsRead(req.auth, workspaceId);
    return res.status(200).json({
      data: result
    });
  } catch (err) {
    next(err);
  }
});
