import { getPool } from './pool.js';

/**
 * Executes a callback within a managed PostgreSQL transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK with clean client release.
 *
 * @param {Function} callback - Async function receiving the dedicated client (client) => Promise<any>
 * @returns {Promise<any>} Result of the callback
 */
export const withTransaction = async (callback) => {
  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('[DB TRANSACTION] Rollback failed:', rollbackErr.message);
    }
    throw err;
  } finally {
    client.release();
  }
};
