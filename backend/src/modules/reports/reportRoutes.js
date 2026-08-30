import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validateReportQuery } from './reportValidation.js';
import { ReportService } from './reportService.js';

export const reportRouter = Router();

/**
 * GET /api/v1/reports/dashboard
 * Aggregated dashboard metrics.
 */
reportRouter.get('/dashboard', requireAuth, async (req, res, next) => {
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
    const summary = await ReportService.getDashboardSummary(req.auth, workspaceId);
    return res.status(200).json({
      data: summary
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/reports/sales
 * Aggregated sales report with optional from/to/status filters.
 */
reportRouter.get('/sales', requireAuth, async (req, res, next) => {
  const validation = validateReportQuery(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid report query parameters.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const report = await ReportService.getSalesReport(req.auth, validation.parsed);
    return res.status(200).json({
      data: report
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/reports/payments
 * Aggregated payments report with paginated history.
 */
reportRouter.get('/payments', requireAuth, async (req, res, next) => {
  const validation = validateReportQuery(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid report query parameters.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const report = await ReportService.getPaymentsReport(req.auth, validation.parsed);
    return res.status(200).json({
      data: report
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/reports/expenses
 * Aggregated expense report with category breakdown.
 */
reportRouter.get('/expenses', requireAuth, async (req, res, next) => {
  const validation = validateReportQuery(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid report query parameters.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const report = await ReportService.getExpensesReport(req.auth, validation.parsed);
    return res.status(200).json({
      data: report
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/reports/bank-ledger
 * Aggregated bank ledger report with income/expense/net balance and entries.
 */
reportRouter.get('/bank-ledger', requireAuth, async (req, res, next) => {
  const validation = validateReportQuery(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid report query parameters.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const report = await ReportService.getBankLedgerReport(req.auth, validation.parsed);
    return res.status(200).json({
      data: report
    });
  } catch (err) {
    next(err);
  }
});
