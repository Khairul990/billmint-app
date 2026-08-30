import express from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validateCreateJobInput, validateBatchInput } from './backfillValidation.js';
import { BackfillService } from './backfillService.js';

export const backfillRouter = express.Router();

// 1. Create a new backfill job
backfillRouter.post('/jobs', requireAuth, async (req, res, next) => {
  try {
    const { isValid, errors, sanitized } = validateCreateJobInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid backfill job parameters.', details: errors }
      });
    }

    const job = await BackfillService.createJob(req.auth, sanitized);
    res.status(201).json({ data: job });
  } catch (err) {
    next(err);
  }
});

// 2. Process batch of historical entities for a stage
backfillRouter.post('/jobs/:id/batch', requireAuth, async (req, res, next) => {
  try {
    const { isValid, errors, sanitized } = validateBatchInput(req.body);
    if (!isValid) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid backfill batch data.', details: errors }
      });
    }

    const result = await BackfillService.processBatch(req.auth, {
      jobId: req.params.id,
      workspaceId: sanitized.workspaceId,
      stage: sanitized.stage,
      records: sanitized.records
    });
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});

// 3. Get backfill job status and checkpoint
backfillRouter.get('/jobs/:id', requireAuth, async (req, res, next) => {
  try {
    const workspaceId = req.query.workspaceId;
    if (!workspaceId) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'workspaceId query parameter is required.' }
      });
    }

    const status = await BackfillService.getJobStatus(req.auth, {
      jobId: req.params.id,
      workspaceId
    });
    res.status(200).json({ data: status });
  } catch (err) {
    next(err);
  }
});

// 4. List backfill jobs for a workspace
backfillRouter.get('/jobs', requireAuth, async (req, res, next) => {
  try {
    const workspaceId = req.query.workspaceId;
    if (!workspaceId) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'workspaceId query parameter is required.' }
      });
    }

    const result = await BackfillService.listJobs(req.auth, { workspaceId });
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});

// 5. Pause backfill job
backfillRouter.post('/jobs/:id/pause', requireAuth, async (req, res, next) => {
  try {
    const { workspaceId } = req.body;
    if (!workspaceId) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'workspaceId is required in request body.' }
      });
    }

    const result = await BackfillService.pauseJob(req.auth, {
      jobId: req.params.id,
      workspaceId
    });
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});

// 6. Resume backfill job
backfillRouter.post('/jobs/:id/resume', requireAuth, async (req, res, next) => {
  try {
    const { workspaceId } = req.body;
    if (!workspaceId) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'workspaceId is required in request body.' }
      });
    }

    const result = await BackfillService.resumeJob(req.auth, {
      jobId: req.params.id,
      workspaceId
    });
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});

// 7. Complete backfill job
backfillRouter.post('/jobs/:id/complete', requireAuth, async (req, res, next) => {
  try {
    const { workspaceId } = req.body;
    if (!workspaceId) {
      return res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'workspaceId is required in request body.' }
      });
    }

    const result = await BackfillService.completeJob(req.auth, {
      jobId: req.params.id,
      workspaceId
    });
    res.status(200).json({ data: result });
  } catch (err) {
    next(err);
  }
});
