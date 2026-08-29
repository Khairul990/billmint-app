import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  
  db: {
    url: process.env.DATABASE_URL || 'postgres://billqyro_dev_user:dev_secure_password_123@localhost:5432/billqyro_dev',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_DB || 'billqyro_dev',
    user: process.env.POSTGRES_USER || 'billqyro_dev_user',
    password: process.env.POSTGRES_PASSWORD || 'dev_secure_password_123',
    maxPoolSize: parseInt(process.env.DB_POOL_MAX || '20', 10),
    idleTimeoutMs: parseInt(process.env.DB_IDLE_TIMEOUT_MS || '30000', 10),
    connectionTimeoutMs: parseInt(process.env.DB_CONN_TIMEOUT_MS || '5000', 10),
    ssl: process.env.POSTGRES_SSL === 'true'
  },

  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
      .split(',')
      .map(o => o.trim())
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET || 'billqyro_dev_jwt_super_secret_key_minimum_32_chars'
  },

  storage: {
    endpoint: process.env.S3_ENDPOINT || process.env.R2_ENDPOINT || 'http://localhost:9000',
    region: process.env.S3_REGION || 'auto',
    bucket: process.env.S3_BUCKET || process.env.R2_BUCKET_NAME || 'billqyro-storage-dev',
    accessKeyId: process.env.S3_ACCESS_KEY || process.env.R2_ACCESS_KEY_ID || 'minio_admin',
    secretAccessKey: process.env.S3_SECRET_KEY || process.env.R2_SECRET_ACCESS_KEY || 'minio_dev_secret_123',
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== 'false'
  }
};
