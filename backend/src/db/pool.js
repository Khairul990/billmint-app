import { config } from '../config/env.js';

let PoolClass = null;
try {
  const pgModule = await import('pg');
  PoolClass = pgModule.default?.Pool || pgModule.Pool;
} catch {
  PoolClass = class FallbackPool {
    constructor() { this.clients = []; }
    async query() { return { rows: [] }; }
    async connect() { return { query: async () => ({ rows: [] }), release: () => {} }; }
    async end() {}
    on() {}
  };
}

let poolInstance = null;

export const getPool = () => {
  if (!poolInstance) {
    poolInstance = new PoolClass({
      connectionString: config.db.url,
      max: config.db.maxPoolSize,
      idleTimeoutMillis: config.db.idleTimeoutMs,
      connectionTimeoutMillis: config.db.connectionTimeoutMs,
      ssl: config.db.ssl ? { rejectUnauthorized: false } : false
    });

    if (typeof poolInstance.on === 'function') {
      poolInstance.on('error', (err) => {
        console.error('[DB POOL ERROR] Unexpected idle client error:', err.message);
      });
    }
  }
  return poolInstance;
};

// Parameterized Query Helper
export const query = async (text, params = []) => {
  const pool = getPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (config.env === 'development' && duration > 200) {
      console.warn(`[SLOW QUERY] (${duration}ms): ${text.slice(0, 100)}`);
    }
    return res;
  } catch (err) {
    console.error(`[DB QUERY ERROR] ${err.message} | Query: ${text.slice(0, 100)}`);
    throw err;
  }
};

// Health Check Query
export const healthCheck = async () => {
  try {
    const res = await query('SELECT 1 AS healthy');
    return res.rows && res.rows[0]?.healthy === 1;
  } catch (err) {
    return false;
  }
};

// Graceful Pool Termination
export const closePool = async () => {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
};
