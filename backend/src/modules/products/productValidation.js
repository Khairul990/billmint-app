const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const validateCreateProduct = (body = {}) => {
  const errors = [];

  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push('workspaceId is required and must be a valid UUID.');
  }

  if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
    errors.push('name is required and must not be empty.');
  } else if (body.name.trim().length > 200) {
    errors.push('name must not exceed 200 characters.');
  }

  if (body.sku !== undefined && body.sku !== null && typeof body.sku !== 'string') {
    errors.push('sku must be a string if provided.');
  } else if (typeof body.sku === 'string' && body.sku.trim().length > 100) {
    errors.push('sku must not exceed 100 characters.');
  }

  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    errors.push('description must be a string if provided.');
  }

  let rate = 0;
  if (body.rate !== undefined && body.rate !== null) {
    rate = parseFloat(body.rate);
    if (isNaN(rate) || rate < 0) {
      errors.push('rate must be a non-negative number.');
    }
  }

  let stockQuantity = 0;
  if (body.stockQuantity !== undefined && body.stockQuantity !== null) {
    stockQuantity = parseFloat(body.stockQuantity);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      errors.push('stockQuantity must be a non-negative number.');
    }
  }

  let minStockAlert = 0;
  if (body.minStockAlert !== undefined && body.minStockAlert !== null) {
    minStockAlert = parseFloat(body.minStockAlert);
    if (isNaN(minStockAlert) || minStockAlert < 0) {
      errors.push('minStockAlert must be a non-negative number.');
    }
  }

  let taxRate = 0;
  if (body.taxRate !== undefined && body.taxRate !== null) {
    taxRate = parseFloat(body.taxRate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      errors.push('taxRate must be a number between 0 and 100.');
    }
  }

  let unit = 'Pcs';
  if (body.unit !== undefined && body.unit !== null) {
    if (typeof body.unit !== 'string' || body.unit.trim().length === 0) {
      errors.push('unit must be a non-empty string.');
    } else if (body.unit.trim().length > 30) {
      errors.push('unit must not exceed 30 characters.');
    } else {
      unit = body.unit.trim();
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? {
      workspaceId: body.workspaceId,
      name: body.name.trim(),
      sku: body.sku ? body.sku.trim() : null,
      description: body.description ? body.description.trim() : null,
      rate: Math.round(rate * 100) / 100,
      unit,
      taxRate: Math.round(taxRate * 100) / 100,
      stockQuantity: Math.round(stockQuantity * 100) / 100,
      minStockAlert: Math.round(minStockAlert * 100) / 100
    } : null
  };
};

export const validateUpdateProduct = (body = {}) => {
  const errors = [];

  if (!body.workspaceId || typeof body.workspaceId !== 'string' || !UUID_REGEX.test(body.workspaceId)) {
    errors.push('workspaceId is required and must be a valid UUID.');
  }

  const updates = {};

  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      errors.push('name must not be empty.');
    } else if (body.name.trim().length > 200) {
      errors.push('name must not exceed 200 characters.');
    } else {
      updates.name = body.name.trim();
    }
  }

  if (body.sku !== undefined) {
    if (body.sku === null || body.sku === '') {
      updates.sku = null;
    } else if (typeof body.sku === 'string') {
      if (body.sku.trim().length > 100) {
        errors.push('sku must not exceed 100 characters.');
      } else {
        updates.sku = body.sku.trim();
      }
    }
  }

  if (body.description !== undefined) {
    updates.description = typeof body.description === 'string' ? body.description.trim() : null;
  }

  if (body.rate !== undefined) {
    const rate = parseFloat(body.rate);
    if (isNaN(rate) || rate < 0) {
      errors.push('rate must be a non-negative number.');
    } else {
      updates.rate = Math.round(rate * 100) / 100;
    }
  }

  if (body.stockQuantity !== undefined) {
    const stockQuantity = parseFloat(body.stockQuantity);
    if (isNaN(stockQuantity) || stockQuantity < 0) {
      errors.push('stockQuantity must be a non-negative number.');
    } else {
      updates.stockQuantity = Math.round(stockQuantity * 100) / 100;
    }
  }

  if (body.minStockAlert !== undefined) {
    const minStockAlert = parseFloat(body.minStockAlert);
    if (isNaN(minStockAlert) || minStockAlert < 0) {
      errors.push('minStockAlert must be a non-negative number.');
    } else {
      updates.minStockAlert = Math.round(minStockAlert * 100) / 100;
    }
  }

  if (body.taxRate !== undefined) {
    const taxRate = parseFloat(body.taxRate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      errors.push('taxRate must be a number between 0 and 100.');
    } else {
      updates.taxRate = Math.round(taxRate * 100) / 100;
    }
  }

  if (body.unit !== undefined) {
    if (typeof body.unit !== 'string' || body.unit.trim().length === 0) {
      errors.push('unit must not be empty.');
    } else if (body.unit.trim().length > 30) {
      errors.push('unit must not exceed 30 characters.');
    } else {
      updates.unit = body.unit.trim();
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? {
      workspaceId: body.workspaceId,
      updates
    } : null
  };
};

export const validateProductQuery = (query = {}) => {
  const errors = [];

  if (!query.workspaceId || typeof query.workspaceId !== 'string' || !UUID_REGEX.test(query.workspaceId)) {
    errors.push('workspaceId query parameter is required and must be a valid UUID.');
  }

  let limit = 25;
  if (query.limit !== undefined) {
    const parsedLimit = parseInt(query.limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      errors.push('limit must be an integer between 1 and 100.');
    } else {
      limit = parsedLimit;
    }
  }

  let offset = 0;
  if (query.offset !== undefined) {
    const parsedOffset = parseInt(query.offset, 10);
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      errors.push('offset must be a non-negative integer.');
    } else {
      offset = parsedOffset;
    }
  }

  const lowStock = query.lowStock === 'true' || query.lowStock === true || query.lowStock === '1';

  return {
    isValid: errors.length === 0,
    errors,
    parsed: errors.length === 0 ? {
      workspaceId: query.workspaceId,
      search: typeof query.search === 'string' && query.search.trim().length > 0 ? query.search.trim() : null,
      sku: typeof query.sku === 'string' && query.sku.trim().length > 0 ? query.sku.trim() : null,
      lowStock,
      limit,
      offset
    } : null
  };
};
