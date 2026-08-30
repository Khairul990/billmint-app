import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validateCreateBankLedgerEntry, validateBankLedgerQuery } from './bankLedgerValidation.js';
import { BankLedgerService } from './bankLedgerService.js';

export const bankLedgerRouter = Router();

/**
 * POST /api/v1/bank-ledger
 * Records a new income or expense entry in the bank ledger.
 */
bankLedgerRouter.post('/', requireAuth, async (req, res, next) => {
  const validation = validateCreateBankLedgerEntry(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid bank ledger payload.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await BankLedgerService.createBankLedgerEntry(req.auth, validation.parsed);
    return res.status(201).json({
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/bank-ledger
 * Paginated query for bank ledger entries with optional type filtering.
 */
bankLedgerRouter.get('/', requireAuth, async (req, res, next) => {
  const validation = validateBankLedgerQuery(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid bank ledger query parameters.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await BankLedgerService.listBankLedgerEntries(req.auth, validation.parsed);
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
