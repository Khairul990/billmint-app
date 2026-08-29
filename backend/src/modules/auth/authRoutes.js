import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { query } from '../../db/pool.js';

export const authRouter = Router();

/**
 * GET /api/v1/auth/me
 * Returns verified user profile and provisions PostgreSQL user record idempotently.
 */
authRouter.get('/me', requireAuth, async (req, res, next) => {
  const { firebaseUid, email, name } = req.auth;

  try {
    // 1. Check if user already exists by firebase_uid or email
    const existing = await query(
      'SELECT id, firebase_uid, email, full_name, system_role, is_active, created_at FROM users WHERE firebase_uid = $1 OR email = $2 LIMIT 1',
      [firebaseUid, email]
    );

    let user;
    if (existing.rows.length > 0) {
      user = existing.rows[0];
      // Update firebase_uid if matched by email
      if (!user.firebase_uid) {
        await query('UPDATE users SET firebase_uid = $1 WHERE id = $2', [firebaseUid, user.id]);
        user.firebase_uid = firebaseUid;
      }
    } else {
      // 2. Idempotently provision new user record
      const insertRes = await query(
        `INSERT INTO users (firebase_uid, email, full_name, system_role, is_active)
         VALUES ($1, $2, $3, 'user', TRUE)
         ON CONFLICT (email) DO UPDATE SET firebase_uid = EXCLUDED.firebase_uid
         RETURNING id, firebase_uid, email, full_name, system_role, is_active, created_at`,
        [firebaseUid, email, name || 'User']
      );
      user = insertRes.rows[0];
    }

    return res.status(200).json({
      id: user.id,
      firebaseUid: user.firebase_uid,
      email: user.email,
      name: user.full_name,
      systemRole: user.system_role,
      isActive: user.is_active,
      createdAt: user.created_at
    });
  } catch (err) {
    next(err);
  }
});
