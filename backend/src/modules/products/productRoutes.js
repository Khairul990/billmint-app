import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { validateCreateProduct, validateUpdateProduct, validateProductQuery } from './productValidation.js';
import { ProductService } from './productService.js';

export const productRouter = Router();

/**
 * POST /api/v1/products
 * Creates a new product in the authorized workspace.
 */
productRouter.post('/', requireAuth, async (req, res, next) => {
  const validation = validateCreateProduct(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid product payload.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await ProductService.createProduct(req.auth, validation.parsed);
    return res.status(201).json({
      data: result
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/products
 * Lists products in the authorized workspace with pagination, search, and lowStock filtering.
 */
productRouter.get('/', requireAuth, async (req, res, next) => {
  const validation = validateProductQuery(req.query);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid product query parameters.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await ProductService.listProducts(req.auth, validation.parsed);
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
 * GET /api/v1/products/:id
 * Retrieves product detail.
 */
productRouter.get('/:id', requireAuth, async (req, res, next) => {
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
    const product = await ProductService.getProduct(req.auth, workspaceId, req.params.id);
    return res.status(200).json({
      data: product
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/products/:id
 * Updates product details and inventory.
 */
productRouter.patch('/:id', requireAuth, async (req, res, next) => {
  const validation = validateUpdateProduct(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid product update payload.',
        details: validation.errors,
        requestId: req.requestId
      }
    });
  }

  try {
    const product = await ProductService.updateProduct(
      req.auth,
      validation.parsed.workspaceId,
      req.params.id,
      validation.parsed.updates
    );
    return res.status(200).json({
      data: product
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/products/:id
 * Soft-deletes a product.
 */
productRouter.delete('/:id', requireAuth, async (req, res, next) => {
  const workspaceId = req.body.workspaceId || req.query.workspaceId;
  if (!workspaceId || typeof workspaceId !== 'string') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'workspaceId is required for deletion.',
        requestId: req.requestId
      }
    });
  }

  try {
    const result = await ProductService.deleteProduct(req.auth, workspaceId, req.params.id);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});
