import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { query } from '../../db/pool.js';
import { withTransaction } from '../../db/transaction.js';

export const workspaceRouter = Router();

// Slug normalization helper
export const generateSlug = (name) => {
  const normalized = (name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return normalized.length > 0 ? normalized : 'workspace';
};

/**
 * Helper to get or provision the PostgreSQL user for the authenticated session
 */
const getOrCreateDbUser = async (auth) => {
  const existing = await query(
    'SELECT id, firebase_uid, email, full_name, system_role FROM users WHERE firebase_uid = $1 OR email = $2 LIMIT 1',
    [auth.firebaseUid, auth.email]
  );
  if (existing.rows.length > 0) return existing.rows[0];

  const insert = await query(
    `INSERT INTO users (firebase_uid, email, full_name, system_role)
     VALUES ($1, $2, $3, 'user')
     ON CONFLICT (email) DO UPDATE SET firebase_uid = EXCLUDED.firebase_uid
     RETURNING id, firebase_uid, email, full_name, system_role`,
    [auth.firebaseUid, auth.email, auth.name || 'User']
  );
  return insert.rows[0];
};

/**
 * GET /api/v1/workspaces
 * Lists all workspaces where authenticated user holds valid membership
 */
workspaceRouter.get('/', requireAuth, async (req, res, next) => {
  try {
    const user = await getOrCreateDbUser(req.auth);
    const workspaces = await query(
      `SELECT 
         w.id, 
         w.name, 
         w.slug, 
         w.currency, 
         w.currency_symbol, 
         w.tax_label, 
         w.invoice_prefix, 
         w.subscription_tier,
         wm.role AS member_role, 
         wm.permissions AS member_permissions,
         w.created_at
       FROM workspaces w
       JOIN workspace_members wm ON w.id = wm.workspace_id
       WHERE wm.user_id = $1 AND w.is_suspended = FALSE
       ORDER BY w.created_at ASC`,
      [user.id]
    );

    return res.status(200).json({
      workspaces: workspaces.rows.map(w => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        currency: w.currency,
        currencySymbol: w.currency_symbol,
        taxLabel: w.tax_label,
        invoicePrefix: w.invoice_prefix,
        subscriptionTier: w.subscription_tier,
        role: w.member_role,
        permissions: w.member_permissions,
        createdAt: w.created_at
      }))
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/workspaces
 * Creates a new workspace and registers creator as owner in an atomic transaction
 */
workspaceRouter.post('/', requireAuth, async (req, res, next) => {
  const { name, currency, currencySymbol, taxLabel, invoicePrefix } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Workspace name is required and must be at least 2 characters long.',
        requestId: req.requestId
      }
    });
  }

  const cleanName = name.trim();
  const baseSlug = generateSlug(cleanName);

  try {
    const user = await getOrCreateDbUser(req.auth);

    const created = await withTransaction(async (client) => {
      // 1. Resolve unique slug with collision avoidance
      let finalSlug = baseSlug;
      let counter = 1;
      while (true) {
        const slugCheck = await client.query('SELECT id FROM workspaces WHERE slug = $1 LIMIT 1', [finalSlug]);
        if (slugCheck.rows.length === 0) break;
        counter++;
        finalSlug = `${baseSlug}-${counter}`;
      }

      // 2. Insert workspace record
      const wsInsert = await client.query(
        `INSERT INTO workspaces (
           owner_id, name, slug, currency, currency_symbol, tax_label, invoice_prefix
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, slug, currency, currency_symbol, tax_label, invoice_prefix, subscription_tier, created_at`,
        [
          user.id,
          cleanName,
          finalSlug,
          currency || 'INR',
          currencySymbol || '₹',
          taxLabel || 'GSTIN',
          invoicePrefix || 'INV-'
        ]
      );
      const ws = wsInsert.rows[0];

      // 3. Insert workspace owner membership
      await client.query(
        `INSERT INTO workspace_members (workspace_id, user_id, role, permissions)
         VALUES ($1, $2, 'owner', '["*"]'::jsonb)`,
        [ws.id, user.id]
      );

      return ws;
    });

    return res.status(201).json({
      workspace: {
        id: created.id,
        name: created.name,
        slug: created.slug,
        currency: created.currency,
        currencySymbol: created.currency_symbol,
        taxLabel: created.tax_label,
        invoicePrefix: created.invoice_prefix,
        subscriptionTier: created.subscription_tier,
        role: 'owner',
        createdAt: created.created_at
      }
    });
  } catch (err) {
    next(err);
  }
});
