import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validateCreateExpense, validateExpenseQuery } from './expenseValidation.js';
import { ExpenseService } from './expenseService.js';

export const expenseRouter = Router();

/**
 * POST /api/v1/expenses
 * Creates a new expense entry in the authorized workspace.
 */
expenseRouter.post('/', requireAuth, async (req, res, next) => {
  const validation = validateCreateExpense(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid expense payload.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await ExpenseService.createExpense(req.auth, validation.parsed);
    return res.status(201).json({
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/expenses
 * Paginated query for expenses within authorized workspace.
 */
expenseRouter.get('/', requireAuth, async (req, res, next) => {
  const validation = validateExpenseQuery(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid expense query parameters.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await ExpenseService.listExpenses(req.auth, validation.parsed);
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
