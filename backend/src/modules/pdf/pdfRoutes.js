import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validatePdfRequest } from './pdfValidation.js';
import { PdfService } from './pdfService.js';

export const pdfRouter = Router();

/**
 * GET /api/v1/invoices/:id/pdf
 * Authenticated endpoint for generating or retrieving cached immutable invoice PDF.
 */
pdfRouter.get('/:id/pdf', requireAuth, async (req, res, next) => {
  const validation = validatePdfRequest(req.params);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid invoice identifier parameter.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await PdfService.getOrGenerateInvoicePdf(req.auth, req.params.id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', result.buffer.length);
    res.setHeader('X-PDF-Content-Hash', result.contentHash);
    res.setHeader('X-PDF-Byte-Hash', result.byteHash);
    res.setHeader('X-PDF-Version', result.version);
    res.setHeader('X-PDF-Cache', result.cacheStatus);
    res.setHeader('Content-Disposition', `inline; filename="invoice-${req.params.id}.pdf"`);

    return res.status(200).send(result.buffer);
  } catch (err) {
    next(err);
  }
});
